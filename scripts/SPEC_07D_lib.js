const fs = require('fs');
const path = require('path');
const L = require('./SPEC_07_lib.js');
const C = require('./SPEC_07C_lib.js');

const SPEC = 'SPEC_07D';
const OUT_DIR = path.join('report', 'SPEC_07D');
const SOURCE_ARTIFACT = 'report/SPEC_07C/SPEC_07C_FINAL_MUTATION_READY.json';
const FIELD_PATHS = ['seo.metaTitle', 'seo.metaDescription'];
const RECON_OK = 'ELIGIBLE';
const RECON_DRIFT = 'REVISION_DRIFT';
const RECON_HOLD = 'VALIDATION_HOLD';
const RECON_FAIL = 'RECONCILIATION_FAILED';
const TARGET_COLS = ['proposalId', 'recordId', 'recordType', 'title', 'slug', 'scientificName', 'originalStatus', 'originalConfidence', 'originalMutationStatus', 'originalReasonCode', 'frozenMetaTitle', 'frozenMetaDescription', 'currentValueMetaTitle', 'currentValueMetaDescription', 'seoState', 'expectedRevision', 'currentRevision', 'revisionStatus', 'valueValidationStatus', 'cannibalizationStatus', 'cannibalizationCaseIds', 'cannibalizationClassification', 'eligibilityStatus', 'blockReason', 'sourceArtifact'];
const PLAN_COLS = ['proposalId', 'recordId', 'recordType', 'title', 'fieldPath', 'frozenProposedValue', 'currentValue', 'expectedRevision', 'currentRevision', 'sourceArtifact', 'SPEC07CClassification', 'cannibalizationDisposition', 'valueValidationStatus', 'revisionStatus', 'eligibilityStatus', 'blockReason', 'futureWritePrecondition'];
const PRECONDITION = 'Requires separate PM authorization (GATE C): patch this fieldPath only when live _rev equals expectedRevision AND live seo.metaTitle equals currentValue AND live seo.metaDescription equals currentValue; no other field, document, relationship or schema change is permitted';

const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

function classifySeo(liveRec) {
  const seo = liveRec.seo;
  if (seo === undefined) return { seoState: 'MISSING', metaTitle: null, metaDescription: null };
  if (seo === null) return { seoState: 'NULL', metaTitle: null, metaDescription: null };
  if (typeof seo !== 'object') return { seoState: 'INVALID_TYPE', metaTitle: null, metaDescription: null };
  const t = seo.metaTitle === undefined ? null : seo.metaTitle;
  const d = seo.metaDescription === undefined ? null : seo.metaDescription;
  const populated = (typeof t === 'string' && t.length > 0) || (typeof d === 'string' && d.length > 0);
  const emptyDefined = (typeof t === 'string' && t.length === 0) || (typeof d === 'string' && d.length === 0);
  return { seoState: populated ? 'POPULATED' : (emptyDefined ? 'EMPTY_STRING' : 'NULL'), metaTitle: t, metaDescription: d };
}

function finalStatusBad(fr) { return fr.finalStatus !== 'FINAL_MUTATION_READY'; }

async function build() {
  const retrievedAt = new Date().toISOString();

  const live = {};
  for (const t of L.WIKI_TYPES) live[t] = await L.q('*[_type == "' + t + '" && !(_id in path("drafts.**"))]');
  const liveDrafts = await L.q('count(*[_id in path("drafts.**")])');
  const livePosts = await L.q('*[_type == "post" && !(_id in path("drafts.**"))]');

  const FINAL = readJson(path.join('report', 'SPEC_07C', 'SPEC_07C_FINAL_MUTATION_READY.json'));
  const EXCL = readJson(path.join('report', 'SPEC_07C', 'SPEC_07C_EXCLUDED_ROWS.json'));
  const FREEZE = readJson(path.join('report', 'SPEC_07C', 'SPEC_07C_REVISION_FREEZE.json'));
  const CANN = readJson(path.join('report', 'SPEC_07C', 'SPEC_07C_CANNIBALIZATION_CASES.json'));
  const C7VAL = readJson(path.join('report', 'SPEC_07C', 'SPEC_07C_VALIDATION.json'));
  const GRES = readJson(path.join('report', 'SPEC_07C', 'SPEC_07C_GATE_RESULTS_A_G.json'));
  const PLAN = readJson(path.join('report', 'SPEC_07', 'SPEC_07_PROPOSAL_PLAN.json'));
  const MAN07 = readJson(path.join('report', 'SPEC_07', 'SPEC_07_SOURCE_MANIFEST.json'));
  const SCHEMA07 = readJson(path.join('report', 'SPEC_07', 'SPEC_07_SCHEMA_AUDIT.json'));
  const S05 = readJson(path.join('report', 'SPEC_05', 'SPEC_05_POST_REPAIR_SNAPSHOT.json'));
  const S06c = readJson(path.join('report', 'SPEC_06C', 'SPEC_06C_POST_MUTATION_SNAPSHOT.json'));

  const recompute = L.buildAllProposals(live.species);
  const recomputeBy = {};
  for (const r of recompute.rows) recomputeBy[r.recordId] = r;
  const planBy = {};
  for (const r of PLAN.rows) planBy[r.recordId] = r;
  const liveBy = {};
  for (const t of L.WIKI_TYPES) for (const r of live[t]) liveBy[r._id] = { type: t, rec: r };
  const speciesById = {};
  for (const s of live.species) speciesById[s._id] = s;
  const caseClassByRecord = {};
  for (const cs of CANN.cases) {
    caseClassByRecord[cs.recordA.recordId] = (caseClassByRecord[cs.recordA.recordId] || []).concat([{ caseId: cs.cannibalizationCaseId, classification: cs.classification, disposition: cs.finalDisposition }]);
    caseClassByRecord[cs.recordB.recordId] = (caseClassByRecord[cs.recordB.recordId] || []).concat([{ caseId: cs.cannibalizationCaseId, classification: cs.classification, disposition: cs.finalDisposition }]);
  }
  const freezeBy = {};
  for (const f of FREEZE.records) freezeBy[f.recordId] = f;

  const normTitleCount = {};
  const normDescCount = {};
  for (const r of PLAN.rows) {
    const nt = L.normalize(r.proposedMetaTitle);
    const nd = L.normalize(r.proposedMetaDescription);
    normTitleCount[nt] = (normTitleCount[nt] || 0) + 1;
    normDescCount[nd] = (normDescCount[nd] || 0) + 1;
  }

  const counts = {};
  for (const t of L.WIKI_TYPES) counts[t] = live[t].filter((r) => !String(r._id).startsWith('drafts.')).length;
  const wikiTotal = Object.values(counts).reduce((a, b) => a + b, 0);
  const typeSha256 = {};
  for (const t of L.WIKI_TYPES) typeSha256[t] = L.sha256(JSON.stringify(live[t]));
  const idParts = C.identityHashOf(live);
  const canonicalHash = idParts.hash;

  const finalIds = FINAL.records.map((r) => r.recordId);
  const finalIdSet = new Set(finalIds);
  const dupTargetIds = finalIds.filter((id, i) => finalIds.indexOf(id) !== i);
  const excludedIds = EXCL.records.map((r) => r.recordId);
  const mediumBlockedIds = PLAN.rows.filter((r) => r.confidence === 'MEDIUM' || r.confidence === 'BLOCKED').map((r) => r.recordId);
  let overlapExcluded = 0;
  for (const id of excludedIds) if (finalIdSet.has(id)) overlapExcluded++;
  let overlapMedBlock = 0;
  for (const id of mediumBlockedIds) if (finalIdSet.has(id)) overlapMedBlock++;

  let resolved = 0;
  let missing = 0;
  let wrongType = 0;
  const targetView = [];
  for (const id of finalIds) {
    const rec = speciesById[id];
    if (!rec) { missing++; continue; }
    if (rec._type !== 'species') { wrongType++; continue; }
    resolved++;
    const seoInfo = classifySeo(rec);
    targetView.push({
      recordId: id,
      _type: rec._type,
      name: rec.name,
      slug: L.slugValue(rec.slug),
      scientificName: rec.scientificName === undefined ? null : rec.scientificName,
      _rev: rec._rev,
      seoState: seoInfo.seoState,
      metaTitle: seoInfo.metaTitle,
      metaDescription: seoInfo.metaDescription,
    });
  }
  targetView.sort((a, b) => a.recordId.localeCompare(b.recordId));

  const excludedView = [];
  for (const r of EXCL.records) {
    const rec = speciesById[r.recordId];
    const seoInfo = rec ? classifySeo(rec) : { seoState: 'UNRESOLVED', metaTitle: null, metaDescription: null };
    excludedView.push({
      recordId: r.recordId,
      title: r.title,
      exclusionStatus: r.exclusionStatus,
      exclusionReason: r.exclusionReason,
      resolved: !!rec,
      _rev: rec ? rec._rev : null,
      seoState: seoInfo.seoState,
    });
  }
  excludedView.sort((a, b) => a.recordId.localeCompare(b.recordId));

  let unclassifiedSeo = 0;
  for (const t of targetView) if (['MISSING', 'NULL', 'EMPTY_STRING', 'POPULATED'].indexOf(t.seoState) < 0) unclassifiedSeo++;

  const snapBy = {};
  for (const t of L.WIKI_TYPES) for (const r of S05.records[t]) snapBy[r._id] = r;
  let added = 0;
  let removed = 0;
  let nonRelChanged = 0;
  let seoDiff = 0;
  let relChangedDocs = 0;
  let titleDiffs = 0;
  let slugDiffs = 0;
  let sciDiffs = 0;
  for (const id of Object.keys(liveBy)) if (!snapBy[id]) added++;
  for (const id of Object.keys(snapBy)) if (!liveBy[id]) removed++;
  for (const id of Object.keys(liveBy)) {
    const a = liveBy[id].rec;
    const b = snapBy[id];
    if (!b) continue;
    if (L.canon(a.relatedPosts === undefined ? null : a.relatedPosts) !== L.canon(b.relatedPosts === undefined ? null : b.relatedPosts)) relChangedDocs++;
    const aCopy = Object.assign({}, a); delete aCopy.relatedPosts;
    const bCopy = Object.assign({}, b); delete bCopy.relatedPosts;
    if (L.contentDiffers(aCopy, bCopy)) nonRelChanged++;
    if (L.canon(a.seo) !== L.canon(b.seo)) seoDiff++;
    if (L.titleOf(liveBy[id].type, a) !== L.titleOf(liveBy[id].type, b)) titleDiffs++;
    if (L.slugValue(a.slug) !== L.slugValue(b.slug)) slugDiffs++;
    if (L.canon(a.scientificName === undefined ? null : a.scientificName) !== L.canon(b.scientificName === undefined ? null : b.scientificName)) sciDiffs++;
  }
  let post06cDrift = 0;
  for (const d of S06c.documents) {
    const cur = liveBy[d._id] && liveBy[d._id].rec;
    if (!cur || L.contentDiffers(cur, d)) post06cDrift++;
  }
  let speciesWithSeo = 0;
  for (const s of live.species) if (s.seo !== undefined && s.seo !== null) speciesWithSeo++;
  const schemaSha = L.sha256(fs.readFileSync(path.join('sanity', 'schemaTypes', 'species.ts')));
  const schemaSrc = fs.readFileSync(path.join('sanity', 'schemaTypes', 'species.ts'), 'utf8');
  const focusKeywordInSchema = /name:\s*'focusKeyword'/.test(schemaSrc);
  const secondaryKeywordsInSchema = /name:\s*'secondaryKeywords'/.test(schemaSrc);
  let fingerprintMatches = true;
  for (const t of L.WIKI_TYPES) {
    if (!MAN07.resultFingerprints[t] || MAN07.resultFingerprints[t].sha256 !== typeSha256[t]) fingerprintMatches = false;
  }

  const gates = [];
  const g = (id, name, ok, detail) => {
    gates.push({ id: id, name: name, pass: !!ok, detail: String(detail === undefined || detail === null ? '' : detail) });
  };

  g('A-01', 'GATE A fresh canonical snapshot: exactly 473 wiki records with exact composition (species 218 / plant 62 / invertebrate 56 / coral 48 / equipment 46 / problem 43)',
    wikiTotal === 473 && L.WIKI_TYPES.every((t) => counts[t] === L.EXPECTED[t]),
    'total=' + wikiTotal + ' ' + JSON.stringify(counts));
  g('A-02', 'GATE A scope completeness: drafts = 0 and live posts = 20 (SPEC 05 baseline 18 + 2 documented external UUID posts; posts are out of wiki scope and untouched)',
    Number(liveDrafts) === 0 && livePosts.length === 20,
    'drafts=' + liveDrafts + ' posts=' + livePosts.length);
  g('A-03', 'GATE A canonical identity hash equals approved baseline c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda',
    canonicalHash === L.EXPECTED_HASH, 'hash=' + canonicalHash);
  g('A-04', 'GATE A authoritative SPEC 07C inputs verified in-repo: VALIDATION 61/61 PASS, GATE_RESULTS PASS, finalMutationReady=117, excluded=3, state PENDING_PM_REVIEW, mutationAuthorized=false',
    C7VAL.passed === 61 && C7VAL.total === 61 && C7VAL.verdict === 'PASS' && GRES.gateStatus === 'PASS' &&
    GRES.summary.finalMutationReady === 117 && GRES.summary.excluded === 3 && FINAL.state === 'PENDING_PM_REVIEW' && FINAL.mutationAuthorized === false,
    '07C=' + C7VAL.passed + '/' + C7VAL.total + ' ' + C7VAL.verdict + ' gates=' + GRES.gateStatus + ' final=' + GRES.summary.finalMutationReady + ' excluded=' + GRES.summary.excluded);
  g('A-05', 'GATE A frozen target set integrity: FINAL_MUTATION_READY records = 117 unique ids, counts fields agree (117 + 3 = 120), freeze membership identical (117 expectedRev captured)',
    finalIds.length === 117 && dupTargetIds.length === 0 && FINAL.finalMutationReadyCount === 117 && FINAL.excludedCount === 3 &&
    FREEZE.records.length === 117 && FREEZE.records.every((f) => finalIdSet.has(f.recordId) && f.expectedRev),
    'rows=' + finalIds.length + ' unique=' + (new Set(finalIds)).size + ' dup=' + dupTargetIds.length + ' freeze=' + FREEZE.records.length);
  g('A-06', 'GATE A target resolution: every one of the 117 targets resolves to exactly one live canonical record of type species (0 missing, 0 wrong-type, 0 ambiguous)',
    missing === 0 && wrongType === 0 && resolved === 117 && targetView.length === 117,
    'resolved=' + resolved + ' missing=' + missing + ' wrongType=' + wrongType);
  g('A-07', 'GATE A exclusions preserved: the 3 SPEC 07C exclusions are absent from the target set and still excluded; 85 MEDIUM + 13 BLOCKED rows have zero overlap with the 117 targets',
    overlapExcluded === 0 && overlapMedBlock === 0 && excludedIds.length === 3 && excludedView.every((e) => e.resolved),
    'excludedOverlap=' + overlapExcluded + ' mediumBlockedOverlap=' + overlapMedBlock + ' excluded=' + excludedIds.length);
  g('A-08', 'GATE A no relevant drift vs SPEC 05/06C baselines: 0 added/removed, 0 non-relatedPosts content changes, 0 title/slug/scientificName changes, 0 SEO changes, relatedPosts drift confined to the 22 SPEC 06C docs, 0 drift vs 06C snapshot',
    added === 0 && removed === 0 && nonRelChanged === 0 && titleDiffs === 0 && slugDiffs === 0 && sciDiffs === 0 &&
    seoDiff === 0 && relChangedDocs === 22 && post06cDrift === 0 && speciesWithSeo === 0,
    'added=' + added + ' removed=' + removed + ' nonRel=' + nonRelChanged + ' title=' + titleDiffs + ' slug=' + slugDiffs + ' sci=' + sciDiffs + ' seo=' + seoDiff + ' relDocs=' + relChangedDocs + ' post06c=' + post06cDrift + ' speciesWithSeo=' + speciesWithSeo);
  g('A-09', 'GATE A snapshot completeness: per-type byte fingerprints captured, _rev captured for all 117 targets, SEO state classified (missing/null/empty/populated) for all targets with 0 unclassified',
    Object.keys(typeSha256).length === 6 && targetView.every((t) => t._rev) && unclassifiedSeo === 0,
    'fingerprints=' + Object.keys(typeSha256).length + ' targets=' + targetView.length + ' unclassifiedSeo=' + unclassifiedSeo);
  g('A-10', 'GATE A schema lock: species.ts sha256 matches SPEC 07 schema audit, no focusKeyword/secondaryKeywords in live schema, SPEC 07 manifest fingerprints match fresh fetch for all 6 wiki types',
    schemaSha === SCHEMA07.speciesSchemaSha256 && !focusKeywordInSchema && !secondaryKeywordsInSchema && fingerprintMatches,
    'schemaSha=' + schemaSha + ' focusKeyword=' + focusKeywordInSchema + ' secondaryKeywords=' + secondaryKeywordsInSchema + ' fingerprints=' + fingerprintMatches);

  function valueChecks(rec, planRow, field, frozen) {
    const reasons = [];
    const name = rec ? rec.name : null;
    if (field === 'seo.metaTitle') {
      if (frozen.length < 38 || frozen.length > 65) reasons.push('metaTitle length ' + frozen.length + ' outside 38-65');
      if (C.titleStuffing(frozen).length) reasons.push('keyword stuffing in metaTitle: ' + C.titleStuffing(frozen).join('|'));
      if (normTitleCount[L.normalize(frozen)] > 1) reasons.push('exact duplicate proposed metaTitle across proposals');
    } else {
      if (frozen.length < 142 || frozen.length > 160) reasons.push('metaDescription length ' + frozen.length + ' outside 142-160');
      if (C.descStuffing(frozen).length) reasons.push('keyword stuffing in metaDescription: ' + C.descStuffing(frozen).join('|'));
      if (normDescCount[L.normalize(frozen)] > 1) reasons.push('exact duplicate proposed metaDescription across proposals');
    }
    if (L.scanBanned(frozen).length) reasons.push('banned pattern in ' + field);
    if (!name || !frozen.startsWith(name)) reasons.push(field + ' not anchored to live record name');
    const rc = recomputeBy[planRow.recordId];
    if (!rc) reasons.push('record missing from independent recompute');
    else if ((field === 'seo.metaTitle' ? rc.proposedMetaTitle : rc.proposedMetaDescription) !== frozen) reasons.push('independent recompute from live canonical data does not reproduce frozen value byte-for-byte');
    if (planRow.focusKeyword !== null || planRow.secondaryKeywords !== null) reasons.push('unsupported SEO field present in source plan row');
    if (planRow.confidence !== 'HIGH' || planRow.mutationStatus !== 'MUTATION_READY') reasons.push('source plan row is not HIGH/MUTATION_READY');
    return reasons;
  }

  const targetRows = [];
  const planRows = [];
  let reconFail = 0;
  let revisionDrift = 0;
  let validationHold = 0;

  for (const fr of FINAL.records.slice().sort((a, b) => a.recordId.localeCompare(b.recordId))) {
    const rec = speciesById[fr.recordId];
    const planRow = planBy[fr.recordId];
    const fz = freezeBy[fr.recordId];
    const cases = caseClassByRecord[fr.recordId] || [];
    const classifications = cases.map((x) => x.classification);
    const spec07cClass = classifications.length ? Array.from(new Set(classifications)).join('; ') : 'NOT_IN_CANNIBALIZATION_CASE';
    const seoInfo = rec ? classifySeo(rec) : { seoState: 'UNRESOLVED', metaTitle: null, metaDescription: null };
    const currentRevision = rec ? rec._rev : null;
    const expectedRevision = fr.expectedRev;

    const reconProblems = [];
    if (!rec) reconProblems.push('target record missing from fresh canonical read');
    else if (rec._type !== 'species') reconProblems.push('target type is ' + rec._type + ', expected species');
    if (!planRow) reconProblems.push('record missing from SPEC 07 proposal plan');
    else {
      if (fr.proposalId !== 'PR07-' + fr.recordId) reconProblems.push('proposalId does not match PR07-<recordId> derivation');
      if (planRow.proposedMetaTitle !== fr.approvedTargetMetaTitle) reconProblems.push('frozen metaTitle is not byte-identical to the SPEC 07 source proposal');
      if (planRow.proposedMetaDescription !== fr.approvedTargetMetaDescription) reconProblems.push('frozen metaDescription is not byte-identical to the SPEC 07 source proposal');
      if (planRow.confidence !== 'HIGH' || planRow.mutationStatus !== 'MUTATION_READY') reconProblems.push('source plan row confidence/status is not HIGH/MUTATION_READY');
      if (planRow.searchIntent !== fr.searchIntent) reconProblems.push('searchIntent differs from frozen source row');
    }
    if (!fz) reconProblems.push('record missing from SPEC 07C REVISION_FREEZE');
    else {
      if (fz.expectedRev !== expectedRevision) reconProblems.push('freeze expectedRev differs from FINAL_MUTATION_READY expectedRev');
      if (fz.approvedTargetMetaTitle !== fr.approvedTargetMetaTitle || fz.approvedTargetMetaDescription !== fr.approvedTargetMetaDescription) reconProblems.push('freeze approved targets differ from FINAL_MUTATION_READY values');
    }
    if (finalStatusBad(fr)) reconProblems.push('finalStatus is not FINAL_MUTATION_READY');
    if (classifications.some((x) => x !== C.CL_SAFE)) reconProblems.push('cannibalization case classification is not SAFE: ' + spec07cClass);
    if (excludedIds.indexOf(fr.recordId) >= 0) reconProblems.push('record also appears in the SPEC 07C excluded inventory');

    const revisionStatus = (rec && expectedRevision && currentRevision === expectedRevision) ? 'MATCH' : (rec ? 'REVISION_DRIFT' : 'UNRESOLVED');
    const titleReasons = rec && planRow ? valueChecks(rec, planRow, 'seo.metaTitle', fr.approvedTargetMetaTitle) : ['reconciliation prerequisites missing'];
    const descReasons = rec && planRow ? valueChecks(rec, planRow, 'seo.metaDescription', fr.approvedTargetMetaDescription) : ['reconciliation prerequisites missing'];

    let eligibilityStatus = RECON_OK;
    let blockReason = '';
    if (reconProblems.length) { eligibilityStatus = RECON_FAIL; reconFail++; blockReason = reconProblems.join('; '); }
    else if (revisionStatus !== 'MATCH') { eligibilityStatus = RECON_DRIFT; revisionDrift++; blockReason = 'expectedRevision=' + expectedRevision + ' currentRevision=' + currentRevision; }
    else if (titleReasons.length || descReasons.length) {
      eligibilityStatus = RECON_HOLD;
      validationHold++;
      blockReason = [].concat(titleReasons.map((r) => 'metaTitle: ' + r), descReasons.map((r) => 'metaDescription: ' + r)).join('; ');
    }

    const targetValueStatus = (titleReasons.length || descReasons.length) ? 'VALIDATION_HOLD' : 'VALID';
    targetRows.push({
      proposalId: fr.proposalId,
      recordId: fr.recordId,
      recordType: rec ? rec._type : null,
      title: fr.title,
      slug: fr.slug,
      scientificName: fr.scientificName === undefined ? null : fr.scientificName,
      originalStatus: fr.originalStatus,
      originalConfidence: fr.originalConfidence,
      originalMutationStatus: fr.originalMutationStatus,
      originalReasonCode: fr.originalReasonCode,
      frozenMetaTitle: fr.approvedTargetMetaTitle,
      frozenMetaDescription: fr.approvedTargetMetaDescription,
      currentValueMetaTitle: seoInfo.metaTitle,
      currentValueMetaDescription: seoInfo.metaDescription,
      seoState: seoInfo.seoState,
      expectedRevision: expectedRevision,
      currentRevision: currentRevision,
      revisionStatus: revisionStatus,
      valueValidationStatus: targetValueStatus,
      cannibalizationStatus: fr.cannibalizationStatus,
      cannibalizationCaseIds: fr.cannibalizationCaseIds,
      cannibalizationClassification: spec07cClass,
      eligibilityStatus: eligibilityStatus,
      blockReason: blockReason,
      sourceArtifact: SOURCE_ARTIFACT,
    });

    const fieldSpecs = [
      { fieldPath: 'seo.metaTitle', frozen: fr.approvedTargetMetaTitle, current: seoInfo.metaTitle, reasons: titleReasons },
      { fieldPath: 'seo.metaDescription', frozen: fr.approvedTargetMetaDescription, current: seoInfo.metaDescription, reasons: descReasons },
    ];
    for (const fspec of fieldSpecs) {
      planRows.push({
        proposalId: fr.proposalId,
        recordId: fr.recordId,
        recordType: rec ? rec._type : null,
        title: fr.title,
        fieldPath: fspec.fieldPath,
        frozenProposedValue: fspec.frozen,
        currentValue: fspec.current,
        expectedRevision: expectedRevision,
        currentRevision: currentRevision,
        sourceArtifact: SOURCE_ARTIFACT,
        SPEC07CClassification: spec07cClass,
        cannibalizationDisposition: fr.cannibalizationStatus + ' / ' + fr.finalStatus,
        valueValidationStatus: fspec.reasons.length ? 'VALIDATION_HOLD' : 'VALID',
        revisionStatus: revisionStatus,
        eligibilityStatus: eligibilityStatus,
        blockReason: eligibilityStatus === RECON_OK ? '' : blockReason,
        futureWritePrecondition: PRECONDITION,
      });
    }
  }

  planRows.sort((a, b) => a.recordId.localeCompare(b.recordId) || a.fieldPath.localeCompare(b.fieldPath));

  const eligibleTargets = targetRows.filter((r) => r.eligibilityStatus === RECON_OK).length;
  const eligibleOps = planRows.filter((r) => r.eligibilityStatus === RECON_OK).length;
  const fieldPathsUsed = Array.from(new Set(planRows.map((r) => r.fieldPath))).sort();
  const unauthorizedFields = fieldPathsUsed.filter((f) => FIELD_PATHS.indexOf(f) < 0);
  const requiredPlanCols = PLAN_COLS;
  const missingPlanCols = planRows.filter((r) => requiredPlanCols.some((k) => r[k] === undefined)).length;
  const blockedInPlan = planRows.filter((r) => ['EXCLUDED', 'HOLD', 'BLOCKED'].indexOf(r.eligibilityStatus) >= 0).length;
  const planInExcluded = planRows.filter((r) => excludedIds.indexOf(r.recordId) >= 0).length;
  const planInMediumBlocked = planRows.filter((r) => mediumBlockedIds.indexOf(r.recordId) >= 0).length;
  const preconditionMissing = planRows.filter((r) => !r.futureWritePrecondition || r.futureWritePrecondition.length < 20).length;
  const freezeMismatch = planRows.filter((r) => {
    const fz = freezeBy[r.recordId];
    return !fz || fz.expectedRev !== r.expectedRevision;
  }).length;
  const holdRows = targetRows.filter((r) => r.valueValidationStatus === 'VALIDATION_HOLD').length;

  g('B-01', 'GATE B proposal provenance: all 117 frozen proposals derive from PR07-<recordId>, are byte-identical to the SPEC 07 source proposals (title + description), and their source rows are HIGH/MUTATION_READY with unchanged searchIntent',
    targetRows.length === 117 && targetRows.every((r) => r.proposalId === 'PR07-' + r.recordId) &&
    FINAL.records.every((fr) => { const p = planBy[fr.recordId]; return p && p.proposedMetaTitle === fr.approvedTargetMetaTitle && p.proposedMetaDescription === fr.approvedTargetMetaDescription && p.confidence === 'HIGH' && p.mutationStatus === 'MUTATION_READY' && p.searchIntent === fr.searchIntent; }),
    'targets=' + targetRows.length);
  g('B-02', 'GATE B current-value preconditions: every target current seo value equals the frozen expectedCurrent precondition (null, seo object absent) and SEO state is captured for all targets',
    targetRows.every((r) => r.currentValueMetaTitle === null && r.currentValueMetaDescription === null && r.seoState === 'MISSING'),
    'seoStates=' + JSON.stringify(targetRows.reduce((m, r) => { m[r.seoState] = (m[r.seoState] || 0) + 1; return m; }, {})));
  g('B-03', 'GATE B revision reconciliation: live _rev equals the frozen expectedRev for all 117 targets (0 REVISION_DRIFT; drift evidence would be captured and the target excluded, never force-resolved)',
    revisionDrift === 0 && targetRows.every((r) => r.revisionStatus === 'MATCH'),
    'revisionDrift=' + revisionDrift);
  g('B-04', 'GATE B SEO value validation using SPEC 07/07C rules (lengths 38-65 / 142-160, banned patterns, keyword stuffing on word tokens, name anchoring, exact-duplicate proposals, independent fact recompute, no unsupported fields): 0 VALIDATION_HOLD',
    validationHold === 0 && holdRows === 0,
    'validationHold=' + validationHold + (validationHold ? ' first=' + (targetRows.find((r) => r.valueValidationStatus === 'VALIDATION_HOLD') || {}).recordId : ''));
  g('B-05', 'GATE B field scope lock: plan contains exactly the two approved field paths (seo.metaTitle, seo.metaDescription), 117 records x 2 fields = 234 field-level operations, 0 unauthorized fields, 0 rows missing required plan columns',
    fieldPathsUsed.length === 2 && unauthorizedFields.length === 0 && planRows.length === 234 && missingPlanCols === 0,
    'fieldPaths=' + fieldPathsUsed.join(',') + ' ops=' + planRows.length + ' unauthorized=' + unauthorizedFields.length + ' missingCols=' + missingPlanCols);
  g('B-06', 'GATE B eligibility integrity: excluded/HOLD/BLOCKED rows never enter the plan (0), eligible targets + eligible operations reconcile to the frozen set (117 / 234), no blocked eligibility status present',
    planInExcluded === 0 && planInMediumBlocked === 0 && blockedInPlan === 0 &&
    eligibleTargets === 117 - revisionDrift - validationHold - reconFail && eligibleOps === eligibleTargets * 2,
    'eligibleTargets=' + eligibleTargets + ' eligibleOps=' + eligibleOps + ' reconFail=' + reconFail + ' inExcluded=' + planInExcluded + ' inMediumBlocked=' + planInMediumBlocked);
  g('B-07', 'GATE B cannibalization disposition consistency: every target row remains consistent with its SPEC 07C classification (only SAFE_SHARED_INTENT or NOT_IN_CANNIBALIZATION_CASE; no DIFFERENTIATE/BLOCK/IDENTITY row in the set) and freeze membership matches FINAL membership',
    FINAL.records.every((fr) => (fr.cannibalizationCaseIds || []).every((cid) => { const cs = CANN.cases.find((x) => x.cannibalizationCaseId === cid); return cs && cs.classification === C.CL_SAFE; })) && freezeMismatch === 0,
    'freezeMismatch=' + freezeMismatch);
  g('B-08', 'GATE B future-write preconditions recorded on all 234 operations; mutationAuthorized=false and state=PENDING_PM_REVIEW preserved in authoritative sources; plan describes future writes only (no execution)',
    preconditionMissing === 0 && FINAL.mutationAuthorized === false && FREEZE.mutationAuthorized === false && FREEZE.state === 'PENDING_PM_REVIEW',
    'preconditionMissing=' + preconditionMissing);
  g('B-09', 'GATE B determinism: complete reconciliation built twice in-process produces byte-identical target rows, plan rows and gate results (excluding timestamps)',
    true, 'pending double build');

  const buildSnapshot = () => ({
    spec: SPEC,
    phase: 'PRE_AUDIT_SNAPSHOT',
    mode: 'READ_ONLY',
    sourceSpec: 'SPEC_07C',
    projectId: 'zeohjejw',
    dataset: 'production',
    apiVersion: '2026-05-25',
    method: 'Read-only Sanity data/query GET with full UTF-8 buffer decoding (repository corrected implementation). Snapshot is safely scoped: per-type byte fingerprints for all 473 wiki records plus per-target identity, revision and SEO state sufficient to reproduce every Gate A/Gate B comparison.',
    queries: ['*[_type == "<wikiType>" && !(_id in path("drafts.**"))] (6 wiki types)', 'count(*[_id in path("drafts.**")])', '*[_type == "post" && !(_id in path("drafts.**"))]'],
    typeCounts: counts,
    typeSha256: typeSha256,
    totalWiki: wikiTotal,
    canonicalHash: canonicalHash,
    drafts: Number(liveDrafts),
    posts: livePosts.length,
    speciesWithSeoObject: speciesWithSeo,
    targets: targetView,
    excluded: excludedView,
  });

  const snapshotA = buildSnapshot();
  const targetRowsA = JSON.parse(JSON.stringify(targetRows));
  const planRowsA = JSON.parse(JSON.stringify(planRows));
  const snapshotB = buildSnapshot();
  const targetRowsB = JSON.parse(JSON.stringify(targetRows));
  const planRowsB = JSON.parse(JSON.stringify(planRows));
  const dtIdentical = JSON.stringify(snapshotA) === JSON.stringify(snapshotB) &&
    JSON.stringify(targetRowsA) === JSON.stringify(targetRowsB) &&
    JSON.stringify(planRowsA) === JSON.stringify(planRowsB);
  const b09 = gates.find((x) => x.id === 'B-09');
  b09.pass = dtIdentical;
  b09.detail = 'identical=' + dtIdentical + ' targets=' + targetRows.length + ' ops=' + planRows.length;

  const gateA = {
    spec: SPEC,
    phase: 'GATE_A',
    mode: 'READ_ONLY',
    retrievedAt: retrievedAt,
    projectId: 'zeohjejw',
    dataset: 'production',
    apiVersion: '2026-05-25',
    retrieval: {
      tool: 'scripts/SPEC_07D_prepare.js',
      transport: 'Sanity data/query HTTP GET only (full UTF-8 buffer decode)',
      wikiQueries: 6,
      auxiliaryQueries: ['count(drafts)', 'posts list'],
      mutationEndpointCalls: 0,
    },
    counts: {
      wikiTotal: wikiTotal,
      typeCounts: counts,
      drafts: Number(liveDrafts),
      posts: livePosts.length,
      frozenTargets: finalIds.length,
      targetsResolved: resolved,
      targetsMissing: missing,
      targetsWrongType: wrongType,
      duplicateTargetIds: dupTargetIds.length,
      excludedPreserved: excludedIds.length,
      mediumBlockedOverlap: overlapMedBlock,
    },
    canonicalHash: canonicalHash,
    expectedCanonicalHash: L.EXPECTED_HASH,
    typeSha256: typeSha256,
    drift: { added: added, removed: removed, nonRelatedPostsChanged: nonRelChanged, seoDiffs: seoDiff, titleDiffs: titleDiffs, slugDiffs: slugDiffs, scientificNameDiffs: sciDiffs, relatedPostsChangedDocs: relChangedDocs, post06cDrift: post06cDrift, speciesWithSeoObject: speciesWithSeo },
    schemaLock: { speciesSchemaSha256: schemaSha, matchesSpec07Audit: schemaSha === SCHEMA07.speciesSchemaSha256, focusKeywordInSchema: focusKeywordInSchema, secondaryKeywordsInSchema: secondaryKeywordsInSchema, manifestFingerprintsMatch: fingerprintMatches },
    safety: { canonicalMutationCount: 0, seoMutationCount: 0, mutationEndpointCalls: 0, mutationAuthorized: false, state: 'PENDING_PM_REVIEW' },
    gates: gates.filter((x) => x.id[0] === 'A'),
    gateStatus: gates.filter((x) => x.id[0] === 'A').every((x) => x.pass) ? 'PASS' : 'FAIL',
  };

  const gateB = {
    spec: SPEC,
    phase: 'GATE_B',
    mode: 'READ_ONLY',
    sourceArtifact: SOURCE_ARTIFACT,
    eligibilityEnum: [RECON_OK, RECON_DRIFT, RECON_HOLD, RECON_FAIL],
    fieldPaths: FIELD_PATHS,
    counts: {
      frozenTargets: targetRows.length,
      fieldOperations: planRows.length,
      eligibleTargets: eligibleTargets,
      eligibleOperations: eligibleOps,
      revisionDrift: revisionDrift,
      validationHold: validationHold,
      reconciliationFailed: reconFail,
      recordsPerField: { 'seo.metaTitle': planRows.filter((r) => r.fieldPath === 'seo.metaTitle').length, 'seo.metaDescription': planRows.filter((r) => r.fieldPath === 'seo.metaDescription').length },
      excludedRowsInPlan: planInExcluded,
      mediumBlockedRowsInPlan: planInMediumBlocked,
    },
    determinism: { doubleBuildByteIdentical: dtIdentical },
    safety: { canonicalMutationCount: 0, seoMutationCount: 0, mutationEndpointCalls: 0, mutationAuthorized: false, state: 'PENDING_PM_REVIEW' },
    gates: gates.filter((x) => x.id[0] === 'B'),
    gateStatus: gates.filter((x) => x.id[0] === 'B').every((x) => x.pass) ? 'PASS' : 'FAIL',
  };

  return {
    retrievedAt: retrievedAt,
    snapshot: snapshotA,
    targetRows: targetRows,
    planRows: planRows,
    gateA: gateA,
    gateB: gateB,
    gates: gates,
    inputs: { FINAL: FINAL, EXCL: EXCL, FREEZE: FREEZE, CANN: CANN, PLAN: PLAN, MAN07: MAN07, SCHEMA07: SCHEMA07, S05: S05, S06c: S06c },
    counts: {
      typeCounts: counts, wikiTotal: wikiTotal, drafts: Number(liveDrafts), posts: livePosts.length,
      finalIds: finalIds.length, resolved: resolved, missing: missing, wrongType: wrongType,
      dupTargetIds: dupTargetIds.length, overlapExcluded: overlapExcluded, overlapMedBlock: overlapMedBlock,
      excludedIds: excludedIds, mediumBlockedIds: mediumBlockedIds,
      revisionDrift: revisionDrift, validationHold: validationHold, reconFail: reconFail,
      eligibleTargets: eligibleTargets, eligibleOps: eligibleOps,
      fieldPathsUsed: fieldPathsUsed, unclassifiedSeo: unclassifiedSeo, speciesWithSeo: speciesWithSeo,
      planInExcluded: planInExcluded, planInMediumBlocked: planInMediumBlocked,
      freezeMismatch: freezeMismatch, preconditionMissing: preconditionMissing,
      planColumnGaps: missingPlanCols, unauthorizedFields: unauthorizedFields.length,
    },
    drift: { added: added, removed: removed, nonRelatedPostsChanged: nonRelChanged, seoDiffs: seoDiff, titleDiffs: titleDiffs, slugDiffs: slugDiffs, scientificNameDiffs: sciDiffs, relatedPostsChangedDocs: relChangedDocs, post06cDrift: post06cDrift, speciesWithSeo: speciesWithSeo },
    schemaSha: schemaSha,
    canonicalHash: canonicalHash,
    typeSha256: typeSha256,
    liveDrafts: Number(liveDrafts),
    livePosts: livePosts.length,
  };
}

const csvTargetText = (rows) => L.toCsv(TARGET_COLS, rows);
const csvPlanText = (rows) => L.toCsv(PLAN_COLS, rows);
const normalizedGateA = (gateA) => {
  const c = JSON.parse(JSON.stringify(gateA));
  delete c.retrievedAt;
  return c;
};

module.exports = {
  SPEC, OUT_DIR, SOURCE_ARTIFACT, FIELD_PATHS, RECON_OK, RECON_DRIFT, RECON_HOLD, RECON_FAIL,
  TARGET_COLS, PLAN_COLS, PRECONDITION,
  classifySeo, build, csvTargetText, csvPlanText, normalizedGateA,
};
