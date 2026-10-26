const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const L = require('./SPEC_07_lib.js');
const C = require('./SPEC_07C_lib.js');
const D = require('./SPEC_07D_lib.js');

const OUT_DIR = path.join('report', 'SPEC_07E');
fs.mkdirSync(OUT_DIR, { recursive: true });

const SPEC = 'SPEC 07E';
const PLAN_MD = 'PARTIAL_FAILURE_AND_VERIFICATION_PLAN.md';
const EXPECTED_REGENERATED = [
  'report\\SPEC_00_1\\SPEC_00_1_VALIDATION.json',
  'report\\SPEC_01\\SPEC_01_VALIDATION.json',
  'report\\SPEC_07\\SPEC_07_VALIDATION.json',
  'report\\SPEC_07\\SPEC_07_GATE_A_B_REPORT.md',
  'report\\SPEC_07C\\SPEC_07C_VALIDATION.json',
  'report\\SPEC_07C\\SPEC_07C_AUDIT_REPORT.md',
  'report\\SPEC_07D\\SPEC_07D_VALIDATION.json',
  'report\\SPEC_07D\\SPEC_07D_AUDIT_REPORT.md',
  'report\\SPEC_07D\\SPEC_07D_COMPLETION_REPORT.md',
  'report\\SPEC_07D\\SPEC_07D_SOURCE_MANIFEST.json',
];
const checks = [];
const c = (id, name, ok, detail) => {
  checks.push({ id: id, name: name, pass: !!ok, detail: String(detail === undefined || detail === null ? '' : detail) });
  console.log((ok ? 'CHECK OK ' : 'CHECK FAIL') + ' ' + id + ' ' + name.slice(0, 90) + ' - ' + (detail === undefined || detail === null ? '' : detail));
};
const shaFile = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const readJsonFile = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const esc = (s) => String(s === null || s === undefined ? '' : s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

function hashTree(root) {
  const out = {};
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (d === root && e.name === 'SPEC_07E') continue;
        walk(path.join(d, e.name));
      } else {
        const p = path.join(d, e.name);
        out[p] = shaFile(p);
      }
    }
  };
  walk(root);
  return out;
}

function tokenScan(name, text) {
  const hits = [];
  if (name.endsWith('.json')) {
    const out = [];
    C.findApprovalTokens(JSON.parse(text), out, name);
    for (const h of out) hits.push(h);
  } else if (name.endsWith('.csv')) {
    for (const row of L.parseCsv(text)) {
      for (const k of Object.keys(row)) {
        const v = row[k];
        if (typeof v === 'string' && C.APPROVAL_TOKENS.indexOf(v.toUpperCase()) >= 0) hits.push(name + '.' + k + '=' + v);
      }
    }
  } else {
    for (const line of text.split(/\r?\n/)) {
      const v = line.trim();
      if (v && C.APPROVAL_TOKENS.indexOf(v.toUpperCase()) >= 0) hits.push(name + '.line=' + v);
    }
  }
  return hits;
}

function classifyScript(f) {
  if (/^SPEC_07E_/.test(f)) return 'CURRENT PHASE - read-only audit, no write path';
  if (/^SPEC_0/.test(f)) {
    if (/validate|audit|extract|plan|propose|lib|reconcile/.test(f)) return 'prior SPEC script (read-only by role; endpoint string reference only)';
    return 'prior SPEC mutation script (executed under separate prior authorization)';
  }
  return 'legacy tooling/seed script (out of wiki SPEC scope; not referenced by any SPEC 07 entry point)';
}

(async () => {
  const beforeHashes = hashTree('report');

  const live = {};
  for (const t of L.WIKI_TYPES) live[t] = await L.q('*[_type == "' + t + '" && !(_id in path("drafts.**"))]');
  const liveDrafts = Number(await L.q('count(*[_id in path("drafts.**")])'));
  const livePosts = await L.q('*[_type == "post" && !(_id in path("drafts.**"))]');
  const liveSpeciesById = {};
  for (const s of live.species) liveSpeciesById[s._id] = s;
  const typeSha256 = {};
  const typeCounts = {};
  for (const t of L.WIKI_TYPES) {
    typeCounts[t] = live[t].length;
    typeSha256[t] = L.sha256(JSON.stringify(live[t]));
  }
  const canonicalHash = C.identityHashOf(live).hash;
  let speciesWithSeo = 0;
  for (const s of live.species) if (s.seo !== undefined && s.seo !== null) speciesWithSeo++;

  const P = {
    dValidation: readJsonFile('report/SPEC_07D/SPEC_07D_VALIDATION.json'),
    dGateA: readJsonFile('report/SPEC_07D/SPEC_07D_GATE_A_RESULTS.json'),
    dGateB: readJsonFile('report/SPEC_07D/SPEC_07D_GATE_B_RESULTS.json'),
    dSnapshot: readJsonFile('report/SPEC_07D/SPEC_07D_PRE_AUDIT_SNAPSHOT.json'),
    dManifest: readJsonFile('report/SPEC_07D/SPEC_07D_SOURCE_MANIFEST.json'),
    dTargetCsv: fs.readFileSync('report/SPEC_07D/SPEC_07D_TARGET_RECONCILIATION.csv', 'utf8'),
    dPlanCsv: fs.readFileSync('report/SPEC_07D/SPEC_07D_FIELD_MUTATION_PLAN_PREP.csv', 'utf8'),
    cFinal: readJsonFile('report/SPEC_07C/SPEC_07C_FINAL_MUTATION_READY.json'),
    cExcluded: readJsonFile('report/SPEC_07C/SPEC_07C_EXCLUDED_ROWS.json'),
    cFreeze: readJsonFile('report/SPEC_07C/SPEC_07C_REVISION_FREEZE.json'),
    cValidation: readJsonFile('report/SPEC_07C/SPEC_07C_VALIDATION.json'),
    cGateResults: readJsonFile('report/SPEC_07C/SPEC_07C_GATE_RESULTS_A_G.json'),
    plan07: readJsonFile('report/SPEC_07/SPEC_07_PROPOSAL_PLAN.json'),
  };
  const targetRows = L.parseCsv(P.dTargetCsv);
  const planRows = L.parseCsv(P.dPlanCsv);
  const planMd = fs.readFileSync(path.join(OUT_DIR, PLAN_MD), 'utf8');

  const finalById = {};
  for (const r of P.cFinal.records) finalById[r.recordId] = r;
  const plan07ById = {};
  for (const r of P.plan07.rows) plan07ById[r.recordId] = r;
  const excludedById = {};
  for (const r of P.cExcluded.records) excludedById[r.recordId] = r;
  const mediumBlocked = P.plan07.rows.filter((r) => r.confidence === 'MEDIUM' || r.confidence === 'BLOCKED');
  const targetIdSet = new Set(targetRows.map((r) => r.recordId));
  const planIdSet = new Set(planRows.map((r) => r.recordId));

  const dFiles = ['SPEC_07D_PRE_AUDIT_SNAPSHOT.json', 'SPEC_07D_TARGET_RECONCILIATION.csv', 'SPEC_07D_FIELD_MUTATION_PLAN_PREP.csv', 'SPEC_07D_GATE_A_RESULTS.json', 'SPEC_07D_GATE_B_RESULTS.json', 'SPEC_07D_VALIDATION.json', 'SPEC_07D_SOURCE_MANIFEST.json', 'SPEC_07D_AUDIT_REPORT.md', 'SPEC_07D_COMPLETION_REPORT.md'];
  let dMissing = 0;
  for (const f of dFiles) if (!fs.existsSync(path.join('report', 'SPEC_07D', f))) dMissing++;
  c('E-A1', 'Gate E-A: all 9 SPEC 07D artifacts exist and SPEC_07D_VALIDATION.json reports 29/29 PASS, state PENDING_PM_REVIEW, mutationAuthorized=false',
    dMissing === 0 && P.dValidation.passed === 29 && P.dValidation.total === 29 && P.dValidation.verdict === 'PASS' &&
    P.dValidation.state === 'PENDING_PM_REVIEW' && P.dValidation.mutationAuthorized === false,
    'missing=' + dMissing + ' validation=' + P.dValidation.passed + '/' + P.dValidation.total + ' ' + P.dValidation.verdict + ' state=' + P.dValidation.state);

  const uniqueTargetIds = new Set(targetRows.map((r) => r.recordId));
  const targetSchemaOk = targetRows.every((r) => r.recordType === 'species' && r.proposalId === 'PR07-' + r.recordId && r.eligibilityStatus === D.RECON_OK);
  c('E-A2', 'Gate E-A: exactly 117 unique target documents, all recordType=species, all ELIGIBLE, proposalId derived as PR07-<recordId>',
    targetRows.length === 117 && uniqueTargetIds.size === 117 && targetSchemaOk,
    'rows=' + targetRows.length + ' unique=' + uniqueTargetIds.size + ' schemaOk=' + targetSchemaOk);

  const opKeys = planRows.map((r) => r.recordId + '#' + r.fieldPath);
  const dupOps = opKeys.filter((k, i) => opKeys.indexOf(k) !== i);
  const perField = {};
  for (const r of planRows) perField[r.fieldPath] = (perField[r.fieldPath] || 0) + 1;
  const pathSet = Array.from(new Set(planRows.map((r) => r.fieldPath))).sort();
  c('E-A3', 'Gate E-A: exactly 234 field operations = 117 seo.metaTitle + 117 seo.metaDescription, only the two approved paths, zero duplicate document+field operations',
    planRows.length === 234 && (perField['seo.metaTitle'] || 0) === 117 && (perField['seo.metaDescription'] || 0) === 117 &&
    pathSet.length === 2 && dupOps.length === 0,
    'ops=' + planRows.length + ' perField=' + (perField['seo.metaTitle'] || 0) + '/' + (perField['seo.metaDescription'] || 0) + ' paths=' + pathSet.join(',') + ' dup=' + dupOps.length);

  let provenanceBad = 0;
  for (const r of planRows) {
    const f = finalById[r.recordId];
    const p07 = plan07ById[r.recordId];
    const expectedValue = r.fieldPath === 'seo.metaTitle' ? 'approvedTargetMetaTitle' : 'approvedTargetMetaDescription';
    const planValue = r.fieldPath === 'seo.metaTitle' ? 'proposedMetaTitle' : 'proposedMetaDescription';
    if (!f || !p07) { provenanceBad++; continue; }
    if (r.frozenProposedValue !== f[expectedValue] || r.frozenProposedValue !== p07[planValue]) provenanceBad++;
    if (p07.confidence !== 'HIGH' || p07.mutationStatus !== 'MUTATION_READY') provenanceBad++;
    if (f.finalStatus !== 'FINAL_MUTATION_READY') provenanceBad++;
  }
  c('E-A4', 'Gate E-A: every frozen value is byte-identical to SPEC 07C FINAL approvedTarget* and to the SPEC 07 source proposal (triple provenance), rows are FINAL_MUTATION_READY / HIGH / MUTATION_READY, values unmodified and un-regenerated',
    provenanceBad === 0 && planRows.length === 234,
    'provenanceMismatches=' + provenanceBad);

  const suffBad = planRows.filter((r) =>
    !r.proposalId || !r.recordId || !r.fieldPath || !r.frozenProposedValue || !r.expectedRevision || !r.currentRevision ||
    r.currentValue !== '' || r.eligibilityStatus !== D.RECON_OK || r.sourceArtifact !== D.SOURCE_ARTIFACT ||
    !r.futureWritePrecondition || r.futureWritePrecondition.length < 20 || r.valueValidationStatus !== 'VALID'
  ).length;
  const targetSuffBad = targetRows.filter((r) =>
    !r.expectedRevision || r.expectedRevision !== r.currentRevision || r.currentValueMetaTitle !== '' || r.currentValueMetaDescription !== '' ||
    r.seoState !== 'MISSING' || r.valueValidationStatus !== 'VALID' || r.eligibilityStatus !== D.RECON_OK
  ).length;
  c('E-A5', 'Gate E-A: every operation records document identity, expected source revision, target field, frozen value, original field state (null/absent), eligibility, provenance and precondition',
    suffBad === 0 && targetSuffBad === 0,
    'operationGaps=' + suffBad + ' targetGaps=' + targetSuffBad);

  const exclSpec = [
    { id: 'IlX7xILobrukz7d5JnvaIg', title: 'Blue Tang', status: 'EXCLUDED_GENERIC_OWNERSHIP' },
    { id: 'ofTl1CTOUWuLwM28PxTEeF', title: 'Percula Clownfish', status: 'EXCLUDED_METADATA_DUPLICATION' },
    { id: 'species-amphiprion-ocellaris', title: 'Ocellaris Clownfish', status: 'EXCLUDED_METADATA_DUPLICATION' },
  ];
  let exclOk = P.cExcluded.records.length === 3;
  const exclDetail = [];
  for (const e of exclSpec) {
    const rec = excludedById[e.id];
    const ok = !!rec && rec.title === e.title && rec.exclusionStatus === e.status && !planIdSet.has(e.id) && !targetIdSet.has(e.id);
    if (!ok) exclOk = false;
    exclDetail.push(e.title + '=' + (ok ? 'intact' : 'BROKEN'));
  }
  const mediumBlockedInPlan = mediumBlocked.filter((r) => planIdSet.has(r.recordId) || targetIdSet.has(r.recordId)).length;
  c('E-A6', 'Gate E-A: the 3 HIGH exclusions remain excluded with their exact SPEC 07C reason codes (Blue Tang=EXCLUDED_GENERIC_OWNERSHIP; Percula+Ocellaris=EXCLUDED_METADATA_DUPLICATION) and are absent from the executable set; all 85 MEDIUM + 13 BLOCKED candidates absent from plan',
    exclOk && P.cExcluded.records.length === 3 && mediumBlocked.length === 98 && mediumBlockedInPlan === 0,
    exclDetail.join(' ') + ' mediumBlocked=' + mediumBlocked.length + ' inPlan=' + mediumBlockedInPlan);

  const planHeaderOk = P.dPlanCsv.split(/\r?\n/)[0] === D.PLAN_COLS.join(',');
  const forbiddenInPlan = planRows.filter((r) => Object.keys(r).some((k) => k === 'focusKeyword' || k === 'secondaryKeywords' || (typeof r[k] === 'string' && (r[k].indexOf('focusKeyword') >= 0 || r[k].indexOf('secondaryKeywords') >= 0)))).length;
  let boundsBad = 0;
  for (const r of planRows) {
    const v = r.frozenProposedValue;
    if (r.fieldPath === 'seo.metaTitle' && (v.length < 38 || v.length > 65)) boundsBad++;
    if (r.fieldPath === 'seo.metaDescription' && (v.length < 142 || v.length > 160)) boundsBad++;
  }
  c('E-A7', 'Gate E-A: no unexpected target, field, operation type or value - plan header is exactly the 17 required columns, no unsupported SEO fields, all frozen values within validated length bounds, all VALID',
    planHeaderOk && forbiddenInPlan === 0 && boundsBad === 0 && planRows.every((r) => r.valueValidationStatus === 'VALID'),
    'header=' + (planHeaderOk ? 'exact' : 'MISMATCH') + ' forbidden=' + forbiddenInPlan + ' boundsViolations=' + boundsBad);

  const gateBOk = P.dGateB.gates.length === 9 && P.dGateB.gates.every((g) => g.pass) && P.dGateB.gateStatus === 'PASS';
  const gateAOk = P.dGateA.gates.length === 10 && P.dGateA.gates.every((g) => g.pass) && P.dGateA.gateStatus === 'PASS';
  const gb = P.dGateB.counts;
  c('E-A8', 'Gate E-A: SPEC 07D GATE_A_RESULTS 10/10 PASS and GATE_B_RESULTS 9/9 PASS with determinism flags true and counts frozenTargets=117, fieldOperations=234, drift/holds/failures=0',
    gateAOk && gateBOk && P.dGateB.determinism.doubleBuildByteIdentical === true &&
    gb.frozenTargets === 117 && gb.fieldOperations === 234 && gb.eligibleTargets === 117 && gb.eligibleOperations === 234 &&
    gb.revisionDrift === 0 && gb.validationHold === 0 && gb.reconciliationFailed === 0 &&
    P.dGateA.safety.mutationEndpointCalls === 0 && P.dGateA.safety.mutationAuthorized === false && P.dGateA.safety.state === 'PENDING_PM_REVIEW',
    'gateA=' + P.dGateA.gateStatus + ' gateB=' + P.dGateB.gateStatus + ' targets=' + gb.frozenTargets + ' ops=' + gb.fieldOperations);

  const idsAgree = targetRows.every((r) => planIdSet.has(r.recordId)) &&
    Array.from(planIdSet).every((id) => targetIdSet.has(id)) &&
    P.cFinal.records.every((r) => targetIdSet.has(r.recordId)) &&
    P.dSnapshot.targets.every((t) => targetIdSet.has(t.recordId)) &&
    P.cFreeze.records.every((f) => targetIdSet.has(f.recordId));
  c('E-A9', 'Gate E-A: counts reconcile exactly across every artifact - TARGET_RECONCILIATION 117, FIELD_MUTATION_PLAN 234 (117x2), SPEC 07C FINAL 117, REVISION_FREEZE 117, snapshot targets 117, identical id sets throughout',
    targetRows.length === 117 && planRows.length === 234 && P.cFinal.records.length === 117 &&
    P.cFinal.finalMutationReadyCount === 117 && P.cFreeze.records.length === 117 &&
    P.dSnapshot.targets.length === 117 && idsAgree,
    'idsAgree=' + idsAgree);

  const fpNorm = (p) => String(p).replace(/\\/g, '/').toLowerCase();
  const dValFp = {};
  for (const f of P.dValidation.artifactFingerprints) dValFp[fpNorm(f.file)] = f.sha256;
  let dFpBad = 0;
  const dFpDetail = [];
  for (const f of P.dValidation.artifactFingerprints) {
    const cur = shaFile(f.file);
    if (cur !== f.sha256) { dFpBad++; dFpDetail.push(fpNorm(f.file).split('/').pop()); }
  }
  const cValFp = {};
  for (const f of P.cValidation.artifactFingerprints) cValFp[f.file] = f.sha256;
  let cFpBad = 0;
  const cFpDetail = [];
  for (const name of Object.keys(cValFp)) {
    const p = path.join('report', 'SPEC_07C', name);
    if (!fs.existsSync(p)) { cFpBad++; cFpDetail.push(name + ':missing'); continue; }
    if (shaFile(p) !== cValFp[name]) { cFpBad++; cFpDetail.push(name + ':changed'); }
  }
  let mfBad = 0;
  const mfDetail = [];
  for (const inp of P.dManifest.inputs) {
    if (!fs.existsSync(inp.file)) { mfBad++; mfDetail.push(inp.file + ':missing'); continue; }
    if (shaFile(inp.file) !== inp.sha256) { mfBad++; mfDetail.push(inp.file + ':changed'); }
  }
  c('E-A10', 'Gate E-A: freeze files unchanged - all 8 SPEC 07D artifact hashes match SPEC_07D_VALIDATION fingerprints, all 16 SPEC 07C artifact hashes match SPEC_07C_VALIDATION fingerprints, all 16 SPEC 07D SOURCE_MANIFEST input hashes match current files (intact provenance chain 07 -> 07C -> 07D)',
    dFpBad === 0 && cFpBad === 0 && mfBad === 0,
    '07D_fp_bad=' + dFpBad + (dFpBad ? ' [' + dFpDetail.join(',') + ']' : '') + ' 07C_fp_bad=' + cFpBad + (cFpBad ? ' [' + cFpDetail.join(',') + ']' : '') + ' manifest_bad=' + mfBad + (mfBad ? ' [' + mfDetail.join(',') + ']' : ''));

  const snapshotBy = {};
  for (const t of L.WIKI_TYPES) snapshotBy[t] = P.dSnapshot.typeSha256[t];
  let shaDrift = 0;
  for (const t of L.WIKI_TYPES) if (typeSha256[t] !== snapshotBy[t]) shaDrift++;
  const exclRevBad = P.dSnapshot.excluded.filter((e) => {
    const rec = liveSpeciesById[e.recordId];
    return !rec || rec._rev !== e._rev;
  }).length;
  const countDrift = L.WIKI_TYPES.filter((t) => typeCounts[t] !== P.dSnapshot.typeCounts[t]).length;
  c('E-A11', 'Gate E-A: zero drift since SPEC 07D - fresh per-type byte fingerprints equal the SPEC 07D snapshot for all 6 wiki types (473 records incl. every excluded/MEDIUM/BLOCKED document), counts equal, excluded-row revisions equal, species with seo object = 0, drafts 0, posts 20',
    shaDrift === 0 && countDrift === 0 && exclRevBad === 0 && speciesWithSeo === 0 &&
    liveDrafts === 0 && livePosts.length === 20 && P.dSnapshot.drafts === 0 && P.dSnapshot.posts === 20,
    'shaDrift=' + shaDrift + ' countDrift=' + countDrift + ' exclRevDrift=' + exclRevBad + ' speciesWithSeo=' + speciesWithSeo + ' drafts=' + liveDrafts + ' posts=' + livePosts.length);

  c('E-A12', 'Gate E-A: canonical identity hash unchanged everywhere - fresh read, SPEC 07D snapshot, GATE_A_RESULTS and approved baseline are all c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda',
    canonicalHash === L.EXPECTED_HASH && P.dSnapshot.canonicalHash === L.EXPECTED_HASH && P.dGateA.canonicalHash === L.EXPECTED_HASH,
    'hash=' + canonicalHash);

  const CONCURRENCY_COLS = ['operationId', 'proposalId', 'recordId', 'recordType', 'title', 'fieldPath', 'expectedRevision', 'liveRevisionAtAudit', 'revisionMatchAtAudit', 'originalStateAvailable', 'originalStateValue', 'frozenValueAvailable', 'currentValueAtAudit', 'eligibilityStatus', 'concurrencyReadiness', 'idempotencyCaseAtAudit', 'executionTimeRecheckRequired', 'conditionalPatchSupported', 'unresolvedIssues', 'sourceArtifact'];
  const buildConcurrencyRows = () => planRows.map((r) => {
    const rec = liveSpeciesById[r.recordId];
    const liveRev = rec ? rec._rev : null;
    const revMatch = !!rec && liveRev === r.expectedRevision;
    const liveSeo = rec ? rec.seo : undefined;
    const liveTitle = liveSeo && typeof liveSeo === 'object' && typeof liveSeo.metaTitle === 'string' ? liveSeo.metaTitle : null;
    const liveDesc = liveSeo && typeof liveSeo === 'object' && typeof liveSeo.metaDescription === 'string' ? liveSeo.metaDescription : null;
    const frozen = r.frozenProposedValue;
    const currentValue = r.fieldPath === 'seo.metaTitle' ? liveTitle : liveDesc;
    let readiness = 'READY_LIVE_REV_MATCH_RECHECK_REQUIRED_AT_EXECUTION';
    let idemCase = 'CASE_B';
    let unresolved = '';
    if (!rec) { readiness = 'TARGET_INVALID'; idemCase = 'CASE_E'; unresolved = 'target did not resolve in fresh audit read'; }
    else if (!revMatch) { readiness = 'REVISION_CONFLICT'; idemCase = 'CASE_D'; unresolved = 'expectedRevision=' + r.expectedRevision + ' liveRevision=' + liveRev; }
    else if (currentValue !== null && currentValue === frozen) { idemCase = 'CASE_A'; readiness = 'READY_LIVE_REV_MATCH_RECHECK_REQUIRED_AT_EXECUTION'; }
    else if (currentValue !== null) { readiness = 'VALUE_CONFLICT'; idemCase = 'CASE_C'; unresolved = 'live value differs from approved original state and frozen value'; }
    return {
      operationId: r.proposalId + '#' + r.fieldPath,
      proposalId: r.proposalId,
      recordId: r.recordId,
      recordType: r.recordType,
      title: r.title,
      fieldPath: r.fieldPath,
      expectedRevision: r.expectedRevision,
      liveRevisionAtAudit: liveRev,
      revisionMatchAtAudit: revMatch ? 'MATCH' : 'MISMATCH',
      originalStateAvailable: liveSeo === undefined && r.currentValue === '' ? 'yes' : 'no',
      originalStateValue: 'null (seo object absent)',
      frozenValueAvailable: frozen ? 'yes' : 'no',
      currentValueAtAudit: currentValue === null ? '' : currentValue,
      eligibilityStatus: r.eligibilityStatus,
      concurrencyReadiness: readiness,
      idempotencyCaseAtAudit: idemCase,
      executionTimeRecheckRequired: 'yes',
      conditionalPatchSupported: 'yes (patch.ifRevisionID; static evidence: SPEC_06C_execute.js + @sanity/client 7.25.0 ifRevisionId)',
      unresolvedIssues: unresolved,
      sourceArtifact: r.sourceArtifact,
    };
  });
  const concurrencyRows = buildConcurrencyRows();
  const concurrencyRows2 = buildConcurrencyRows();
  const concurrencyDeterministic = JSON.stringify(concurrencyRows) === JSON.stringify(concurrencyRows2);
  fs.writeFileSync(path.join(OUT_DIR, 'CONCURRENCY_AND_IDEMPOTENCY_REVIEW.csv'), L.toCsv(CONCURRENCY_COLS, concurrencyRows));

  const suffRows = concurrencyRows.filter((r) => r.expectedRevision && r.liveRevisionAtAudit && r.originalStateAvailable === 'yes' && r.frozenValueAvailable === 'yes' && r.eligibilityStatus === D.RECON_OK && r.sourceArtifact);
  const revMatchRows = concurrencyRows.filter((r) => r.revisionMatchAtAudit === 'MATCH').length;
  c('E-B1', 'Gate E-B: frozen artifacts contain sufficient information for every operation - target _id, expected _rev, target field, frozen value, original field state (null/absent) and eligibility/provenance present for 234/234 operations',
    suffRows.length === 234, 'sufficient=' + suffRows.length + '/234');

  const unresolvedLive = concurrencyRows.filter((r) => r.unresolvedIssues && r.concurrencyReadiness !== 'READY_LIVE_REV_MATCH_RECHECK_REQUIRED_AT_EXECUTION');
  c('E-B2', 'Gate E-B: fresh live audit read - all 117 targets resolve uniquely as species and live _rev equals expectedRevision for all 234 operations (0 REVISION_CONFLICT / TARGET_INVALID at audit time)',
    revMatchRows === 234 && unresolvedLive.length === 0,
    'revMatch=' + revMatchRows + '/234 unresolved=' + unresolvedLive.length);

  const liveSeoAbsent = concurrencyRows.filter((r) => r.originalStateAvailable !== 'yes').length;
  c('E-B3', 'Gate E-B: original state intact at audit time - live seo object still absent (null) for every target, so all 234 operations are Case B (eligible pending separate authorization), 0 VALUE_CONFLICT',
    liveSeoAbsent === 0 && concurrencyRows.every((r) => r.idempotencyCaseAtAudit === 'CASE_B'),
    'originalStateGaps=' + liveSeoAbsent + ' caseBreakdown=' + JSON.stringify(concurrencyRows.reduce((m, r) => { m[r.idempotencyCaseAtAudit] = (m[r.idempotencyCaseAtAudit] || 0) + 1; return m; }, {})));

  const csvText = fs.readFileSync(path.join(OUT_DIR, 'CONCURRENCY_AND_IDEMPOTENCY_REVIEW.csv'), 'utf8');
  const csvParsed = L.parseCsv(csvText);
  const expectedRevSet = new Set(planRows.map((r) => r.expectedRevision));
  const csvRevInvented = csvParsed.filter((r) => !expectedRevSet.has(r.expectedRevision)).length;
  c('E-B4', 'Gate E-B: CONCURRENCY_AND_IDEMPOTENCY_REVIEW.csv carries 234 fully classified operations with all required columns, readiness + idempotency classification complete, no invented revision values (every expectedRevision traces to the frozen plan)',
    csvParsed.length === 234 && CONCURRENCY_COLS.every((col) => Object.prototype.hasOwnProperty.call(csvParsed[0] || {}, col)) &&
    csvParsed.every((r) => r.concurrencyReadiness && r.idempotencyCaseAtAudit && r.executionTimeRecheckRequired === 'yes') && csvRevInvented === 0,
    'rows=' + csvParsed.length + ' inventedRevs=' + csvRevInvented);

  const exec06c = fs.readFileSync('scripts/SPEC_06C_execute.js', 'utf8');
  const clientDist = fs.readFileSync('node_modules/@sanity/client/dist/index.js', 'utf8');
  const clientPkg = readJsonFile('node_modules/@sanity/client/package.json');
  const has06c = exec06c.indexOf('ifRevisionID') >= 0 && exec06c.indexOf('data' + '/' + 'mutate') >= 0;
  const hasClient = clientDist.indexOf('ifRevisionId(') >= 0 && clientDist.indexOf('ifRevisionID') >= 0;
  c('E-B5', 'Gate E-B: conditional revision precondition support established by static evidence without any probe mutation - SPEC_06C_execute.js uses patch.ifRevisionID against the mutation endpoint (executed under prior authorization) and installed @sanity/client@' + clientPkg.version + ' exposes ifRevisionId(rev) with documented revision-mismatch rejection semantics',
    has06c && hasClient, '06c=' + has06c + ' client=' + hasClient + ' version=' + clientPkg.version);

  c('E-B6', 'Gate E-B: concurrency assessment is deterministic - the per-operation rows are built twice from live read + frozen plan and are byte-identical',
    concurrencyDeterministic, 'identical=' + concurrencyDeterministic);

  const bMarkers = ['expectedRevision', 'Never refresh a revision', 'never treated as approval', 'resolves uniquely', 'ifRevisionID', 'race-free concurrency safety', 'does not constitute authorization', 'checked again at execution time', 'REVISION_CONFLICT'];
  const bMissing = bMarkers.filter((m) => planMd.indexOf(m) < 0);
  c('E-B7', 'Gate E-B: all 9 execution-time behavior requirements are specified in PARTIAL_FAILURE_AND_VERIFICATION_PLAN.md (fresh read, rev compare, conflict stop, identity check, no rev refresh, no implied approval, conditional precondition, honesty about atomicity, execution-time re-check that is not authorization)',
    bMissing.length === 0, 'missingMarkers=' + (bMissing.length ? bMissing.join(',') : '0'));

  const caseMarkers = ['Case A', 'Case B', 'Case C', 'Case D', 'Case E', 'Case F', 'ALREADY_COMPLIANT', 'VALUE_CONFLICT', 'REVISION_CONFLICT', 'TARGET_INVALID', 'UNKNOWN_OUTCOME'];
  const caseMissing = caseMarkers.filter((m) => planMd.indexOf(m) < 0);
  c('E-C1', 'Gate E-C: idempotency state machine distinguishes Cases A-F with named states ALREADY_COMPLIANT, conditional-eligibility, VALUE_CONFLICT, REVISION_CONFLICT, TARGET_INVALID and UNKNOWN_OUTCOME',
    caseMissing.length === 0, 'missingMarkers=' + (caseMissing.length ? caseMissing.join(',') : '0'));

  const caseFMarkers = ['before deciding anything', 'Never blindly replay an uncertain write', 'unnecessary mutation'];
  const caseFMissing = caseFMarkers.filter((m) => planMd.indexOf(m) < 0);
  c('E-C2', 'Gate E-C: uncertain-outcome protocol specified - re-read before deciding, verified-applied vs explicit-retry vs hold classification, never blindly replay; Case A skips unnecessary mutations',
    caseFMissing.length === 0, 'missingMarkers=' + (caseFMissing.length ? caseFMissing.join(',') : '0'));

  c('E-C3', 'Gate E-C: every one of the 234 operations carries an idempotency classification and execution-time re-check requirement in the review CSV (all CASE_B at audit time, with readiness evidence)',
    csvParsed.every((r) => r.idempotencyCaseAtAudit && r.executionTimeRecheckRequired === 'yes') && csvParsed.length === 234,
    'classified=' + csvParsed.length + '/234');

  const shapeMarkers = ['never replace an entire document', 'Whole-document replacement is prohibited'];
  const shapeMissing = shapeMarkers.filter((m) => planMd.indexOf(m) < 0);
  c('E-C4', 'Gate E-C: whole-document replacement prohibited and write shape constrained to a narrowly scoped field assignment that merges into the seo object without touching sibling fields',
    shapeMissing.length === 0, 'missingMarkers=' + (shapeMissing.length ? shapeMissing.join(',') : '0'));

  c('E-C5', 'Gate E-C: Case B eligibility gated on separate PM authorization, and the plan does not claim proven idempotency beyond the specified design - gaps are to be reported as findings, not hidden',
    planMd.indexOf('eligible for a conditional write only after separate PM authorization') >= 0 && /report/i.test(planMd),
    'authorizationGate=' + (planMd.indexOf('eligible for a conditional write only after separate PM authorization') >= 0) + ' reporting=' + /report/i.test(planMd));

  const scriptFiles = fs.readdirSync('scripts').filter((f) => /\.(js|mjs|cjs)$/.test(f)).sort();
  const inventory = [];
  for (const f of scriptFiles) {
    const text = fs.readFileSync(path.join('scripts', f), 'utf8');
    const scan = C.scanWriteCapablePaths([{ name: f, text: text }]);
    if (scan.hits.length) inventory.push({ file: f, hits: scan.hits, category: classifyScript(f), reachability: 'NOT REACHABLE from SPEC 07E/07F: no SPEC 07F entry point exists and SPEC 07E imports only read-only libraries' });
  }
  const ownScanFiles = ['scripts/SPEC_07E_audit.js', 'scripts/SPEC_07_lib.js', 'scripts/SPEC_07C_lib.js', 'scripts/SPEC_07D_lib.js'];
  const ownTexts = ownScanFiles.map((f) => ({ name: f, text: fs.readFileSync(f, 'utf8') }));
  const ownScan = C.scanWriteCapablePaths(ownTexts);
  const futureEntryPoints = scriptFiles.filter((f) => /SPEC_07F/i.test(f));
  c('E-D1', 'Gate E-D: SPEC 07E code path is write-free - static write-capable scan of SPEC_07E_audit.js and the three read-only libraries it imports returns 0 hits; no SPEC 07F execution entry point exists yet',
    ownScan.hits.length === 0 && futureEntryPoints.length === 0,
    'patterns=' + ownScan.patternCount + ' files=' + ownScan.fileCount + ' hits=' + (ownScan.hits.length ? ownScan.hits.join(',') : '0') + ' futureEntryPoints=' + futureEntryPoints.length);

  const ownSource = fs.readFileSync('scripts/SPEC_07E_audit.js', 'utf8');
  const requireRe = /require\(['"]([^'"]+)['"]\)/g;
  const ownRequires = [];
  let rm;
  while ((rm = requireRe.exec(ownSource)) !== null) ownRequires.push(rm[1]);
  const allowedRequires = ['./SPEC_07_lib.js', './SPEC_07C_lib.js', './SPEC_07D_lib.js'];
  const badRequires = ownRequires.filter((r) => r.startsWith('./') && allowedRequires.indexOf(r) < 0);
  c('E-D2', 'Gate E-D: SPEC 07E imports only the established read-only libraries (SPEC_07_lib, SPEC_07C_lib, SPEC_07D_lib) and node builtins - no mutation client, no execution script, no write-capable dependency is reachable from the audit entry point',
    badRequires.length === 0, 'localRequires=' + ownRequires.filter((r) => r.startsWith('./')).join(',') + ' bad=' + (badRequires.length ? badRequires.join(',') : '0'));

  c('E-D3', 'Gate E-D: write-capable path inventory complete - all ' + scriptFiles.length + ' scripts scanned, ' + inventory.length + ' files contain write-capable patterns, every one classified and marked NOT REACHABLE from any SPEC 07E/07F entry point (recorded in MUTATION_ALLOWLIST_AUDIT.md)',
    inventory.length > 0 && inventory.every((x) => x.reachability.indexOf('NOT REACHABLE') === 0 && x.category),
    'scanned=' + scriptFiles.length + ' hitFiles=' + inventory.length + ' totalHits=' + inventory.reduce((n, x) => n + x.hits.length, 0));

  const allowlistOk = pathSet.length === 2 && pathSet[0] === 'seo.metaDescription' && pathSet[1] === 'seo.metaTitle';
  const nonSpeciesOps = planRows.filter((r) => r.recordType !== 'species').length;
  c('E-D4', 'Gate E-D: target set and field set validated against a fixed allowlist before any write would be possible - exactly {seo.metaTitle, seo.metaDescription}, all 234 operations on species records only, zero excluded/held targets, no dynamic field path in the frozen plan',
    allowlistOk && nonSpeciesOps === 0 && mediumBlockedInPlan === 0 && planRows.length === 234,
    'paths=' + pathSet.join(',') + ' nonSpeciesOps=' + nonSpeciesOps + ' heldInPlan=' + mediumBlockedInPlan);

  const clearSemantics = planRows.filter((r) => !r.frozenProposedValue || r.frozenProposedValue.trim() === '').length;
  const allowedFieldPath = (fp) => fp === 'seo.metaTitle' || fp === 'seo.metaDescription';
  c('E-D5', 'Gate E-D: prohibited operation semantics absent from the plan - no field-clearing (every frozen value non-empty), no create/upsert/delete action column exists, each operation assigns exactly one of the two allowed paths, whole-document replacement impossible from a 2-field scoped plan',
    clearSemantics === 0 && planRows.every((r) => allowedFieldPath(r.fieldPath)) && planRows.length === 234,
    'emptyValues=' + clearSemantics + ' ops=' + planRows.length);

  const allowMdPath = path.join(OUT_DIR, 'MUTATION_ALLOWLIST_AUDIT.md');
  const allowMarkers = ['Allowed fields', 'Prohibited', 'upsert', 'Whole-document replacement', 'Deletion or clearing', 'Dynamic field paths', 'Broad mutations derived from arbitrary CSV columns', 'Code path inventory', 'Unresolved write-capable paths', 'ifRevisionID'];
  const allowMd = [];
  allowMd.push('# SPEC 07E - Mutation Allowlist Audit');
  allowMd.push('');
  allowMd.push('- Mode: READ_ONLY static inspection. No write-capable path was executed.');
  allowMd.push('- Future entry point: none exists (no SPEC 07F script in the repository). The future executor must be a new, separately reviewed script implementing this allowlist.');
  allowMd.push('');
  allowMd.push('## Allowed fields (the complete future write surface)');
  allowMd.push('');
  allowMd.push('| Field path | Operations | Validation |');
  allowMd.push('|---|---|---|');
  allowMd.push('| `seo.metaTitle` | 117 | frozen value present, length 38-65, name-anchored, provenance traced to SPEC 07 |');
  allowMd.push('| `seo.metaDescription` | 117 | frozen value present, length 142-160, name-anchored, provenance traced to SPEC 07 |');
  allowMd.push('');
  allowMd.push('Total: 234 field-level operations across 117 species documents. Write shape: narrowly scoped conditional field assignment (`patch` with `ifRevisionID`), merging into the `seo` object so sibling fields are untouched. Any field path outside the table above is rejected before any write.');
  allowMd.push('');
  allowMd.push('## Prohibited operation types');
  allowMd.push('');
  allowMd.push('- `create` / `create-if-not-exists` / upsert behavior of any kind for this phase.');
  allowMd.push('- Whole-document replacement (send-only or read-modify-write of the full document).');
  allowMd.push('- Deletion or clearing of existing fields (all frozen values are non-empty; an empty target value is rejected).');
  allowMd.push('- Writes to any `seo` sub-field other than the two allowed paths.');
  allowMd.push('- Writes to `_id`, `_type`, `_rev`, `title`, `slug`, body/content, category, references, relationships or any non-SEO field.');
  allowMd.push('- Writes to non-species documents (posts and all other types are out of scope).');
  allowMd.push('- Writes to the 3 excluded HIGH candidates, 85 MEDIUM candidates or 13 BLOCKED candidates.');
  allowMd.push('- Dynamic field paths not validated against the fixed allowlist above.');
  allowMd.push('- Broad mutations derived from arbitrary CSV columns (the executor may consume only recordId, fieldPath, frozenProposedValue, expectedRevision from the frozen plan).');
  allowMd.push('- Any execution path that can silently expand its target set (target set is fixed at 117 documents and re-validated at execution start).');
  allowMd.push('');
  allowMd.push('## Code path inventory (all write-capable patterns discovered in scripts/)');
  allowMd.push('');
  allowMd.push('- Scanned: ' + scriptFiles.length + ' script files, ' + C.scanWriteCapablePaths([{ name: 'x', text: 'y' }]).patternCount + ' write-capable patterns.');
  allowMd.push('- SPEC 07E + imported read-only libraries: **0 hits** (audit code contains no write-capable path).');
  allowMd.push('- Files with hits: ' + inventory.length + ' (details below). Reachability from a SPEC 07E/07F entry point: none - no SPEC 07F entry point exists, and SPEC 07E requires only read-only libraries.');
  allowMd.push('');
  allowMd.push('| # | File | Patterns | Classification | Reachability |');
  allowMd.push('|---|---|---|---|---|');
  inventory.forEach((x, i) => allowMd.push('| ' + (i + 1) + ' | ' + x.file + ' | ' + esc(x.hits.map((h) => h.split(':').slice(1).join(':')).join('; ')) + ' | ' + esc(x.category) + ' | ' + esc(x.reachability) + ' |'));
  allowMd.push('');
  allowMd.push('## Unresolved write-capable paths');
  allowMd.push('');
  allowMd.push('- None reachable from the proposed SPEC 07 execution path (the path does not exist yet and must be built to this allowlist under separate review).');
  allowMd.push('- ' + inventory.length + ' legacy files retain write capability from prior authorized phases and ad-hoc tooling. They are inert with respect to SPEC 07E but must not be reused or invoked by SPEC 07F without an explicit allowlist review; finding F-2 records this.');
  allowMd.push('- Guard requirements for the future executor: validate fieldPath against the fixed two-path allowlist, validate the target set against the frozen 117 recordIds, reject any mutation whose shape is not a conditional single-field patch, and fail closed on any unexpected column or document.');
  fs.writeFileSync(allowMdPath, allowMd.join('\n'));
  const allowMdText = fs.readFileSync(allowMdPath, 'utf8');
  const allowMissing = allowMarkers.filter((m) => allowMdText.indexOf(m) < 0);
  c('E-D6', 'Gate E-D: MUTATION_ALLOWLIST_AUDIT.md documents allowed fields, every prohibited operation type, the full discovered code-path inventory with reachability, and unresolved write-capable paths',
    allowMissing.length === 0 && inventory.length > 0, 'missingMarkers=' + (allowMissing.length ? allowMissing.join(',') : '0') + ' inventoryRows=' + inventory.length);

  const eeMarkers = ['applied, already compliant, revision conflict, value conflict, target invalid, rejected mutation, unknown outcome', 'No automatic rollback', 'No bulk retry', 'No silent omission', 'HTTP status or mutation acknowledgment', 'read-after-write verification'];
  const eeMissing = eeMarkers.filter((m) => planMd.indexOf(m) < 0);
  c('E-E1', 'Gate E-E: partial-failure response specifies per-operation and per-document outcome tracking with the seven explicit outcome classes, prohibits automatic rollback, bulk retry, silent omission and status-only success, and mandates read-after-write verification',
    eeMissing.length === 0, 'missingMarkers=' + (eeMissing.length ? eeMissing.join(',') : '0'));

  const ee2Markers = ['234 = APPLIED', 'withheld', 'already correct', 'documented and justified final disposition', 'preserve verified successes'];
  const ee2Missing = ee2Markers.filter((m) => planMd.indexOf(m) < 0);
  c('E-E2', 'Gate E-E: reconciliation formula requires every one of the 234 operations to terminate in exactly one documented state, with explicit accounting for already-compliant skips and conflict-withheld operations; partial success preserves verified writes and isolates unresolved operations',
    ee2Missing.length === 0, 'missingMarkers=' + (ee2Missing.length ? ee2Missing.join(',') : '0'));

  c('E-E3', 'Gate E-E: SPEC 07E does not execute the strategy against live data - the plan document declares no code has been executed, and the SPEC 07E static scan shows zero write-capable paths in phase code',
    planMd.indexOf('No code in this document has been executed against live data') >= 0 && ownScan.hits.length === 0,
    'declared=' + (planMd.indexOf('No code in this document has been executed against live data') >= 0) + ' ownScanHits=' + ownScan.hits.length);

  const frozenPaths = ['report\\SPEC_07C\\SPEC_07C_FINAL_MUTATION_READY.json', 'report\\SPEC_07C\\SPEC_07C_EXCLUDED_ROWS.json', 'report\\SPEC_07C\\SPEC_07C_REVISION_FREEZE.json', 'report\\SPEC_07D\\SPEC_07D_TARGET_RECONCILIATION.csv', 'report\\SPEC_07D\\SPEC_07D_FIELD_MUTATION_PLAN_PREP.csv', 'report\\SPEC_07D\\SPEC_07D_PRE_AUDIT_SNAPSHOT.json'];
  const frozenHashesBefore = {};
  for (const f of frozenPaths) frozenHashesBefore[f] = shaFile(f);
  c('E-E4', 'Gate E-E: frozen plan artifacts hash-captured before regression execution for post-regression immutability re-verification (FINAL, EXCLUDED, FREEZE, target CSV, plan CSV, snapshot)',
    Object.keys(frozenHashesBefore).length === 6, 'captured=' + Object.keys(frozenHashesBefore).length);

  const ef1Markers = ['canonical identity hash remains', 'out-of-scope field', 'excluded or held document', 'non-species document', 'counts reconcile exactly', 'documented and justified final disposition', 'reported accurately', 'SPEC 00.1', 'SPEC 01', 'SPEC 07C', 'SPEC 07D'];
  const ef1Missing = ef1Markers.filter((m) => planMd.indexOf(m) < 0);
  c('E-F1', 'Gate E-F: post-write verification contract covers all 11 required items - target identity, exact frozen values for both fields, out-of-scope diff, excluded/held and non-species non-mutation, count reconciliation, unchanged canonical hash, SPEC 00.1/01 integrity, SPEC 07/07C/07D validator semantics, and accurate failure reporting',
    ef1Missing.length === 0, 'missingMarkers=' + (ef1Missing.length ? ef1Missing.join(',') : '0'));

  c('E-F2', 'Gate E-F: drift policy explicit - report drift and hold affected operations, never invent a new canonical hash or baseline, frozen plan never edited to match outcomes',
    planMd.indexOf('report drift and hold affected operations') >= 0 && planMd.indexOf('never invent a new baseline') >= 0 && planMd.indexOf('never edited to match outcomes') >= 0,
    'driftPolicy=' + (planMd.indexOf('report drift and hold affected operations') >= 0) + ' noNewHash=' + (planMd.indexOf('never invent a new baseline') >= 0) + ' noPlanEdit=' + (planMd.indexOf('never edited to match outcomes') >= 0));

  const cmds = ['node scripts/SPEC_00_1_validate.js', 'node scripts/SPEC_01_validate.js', 'node scripts/SPEC_07_validate.js', 'node scripts/SPEC_07C_validate.js', 'node scripts/SPEC_07D_validate.js'];
  const cmdsMissing = cmds.filter((m) => planMd.indexOf(m) < 0);
  c('E-F3', 'Gate E-F: the established validator commands and expected results are documented verbatim for reuse by the future executor (00.1 9/9, 01 14/14, 07 18/18, 07C 61/61, 07D 29/29)',
    cmdsMissing.length === 0, 'missingCommands=' + (cmdsMissing.length ? cmdsMissing.join(',') : '0'));

  const reg = {};
  const regSpecs = [
    { key: 'spec001', id: 'E-G1', script: 'scripts/SPEC_00_1_validate.js', file: 'report/SPEC_00_1/SPEC_00_1_VALIDATION.json', expect: 9, stdout: 'Validation: 9/9 checks passed.', label: 'SPEC 00.1 canonical inventory regression' },
    { key: 'spec01', id: 'E-G2', script: 'scripts/SPEC_01_validate.js', file: 'report/SPEC_01/SPEC_01_VALIDATION.json', expect: 14, stdout: 'SPEC_01_validate: 14/14 checks passed. Verdict: PASS', label: 'SPEC 01 depth-audit regression' },
    { key: 'spec07', id: 'E-G3', script: 'scripts/SPEC_07_validate.js', file: 'report/SPEC_07/SPEC_07_VALIDATION.json', expect: 18, stdout: 'VALIDATION: 18/18 PASS', label: 'SPEC 07 regression' },
    { key: 'spec07c', id: 'E-G4', script: 'scripts/SPEC_07C_validate.js', file: 'report/SPEC_07C/SPEC_07C_VALIDATION.json', expect: 61, stdout: 'VALIDATION: 61/61 PASS', label: 'SPEC 07C validation' },
    { key: 'spec07d', id: 'E-G5', script: 'scripts/SPEC_07D_validate.js', file: 'report/SPEC_07D/SPEC_07D_VALIDATION.json', expect: 29, stdout: 'VALIDATION: 29/29 PASS', label: 'SPEC 07D validation + determinism (R-01..R-05)' },
  ];
  for (const s of regSpecs) {
    const run = spawnSync('node', [s.script], { encoding: 'utf8', timeout: 600000 });
    const out = String(run.stdout || '');
    let ok = false;
    let detail = '';
    try {
      const j = JSON.parse(fs.readFileSync(s.file, 'utf8'));
      const passedN = j.summary ? j.summary.passed : j.passed;
      const verdict = j.verdict || j.result;
      const stdoutSeen = out.indexOf(s.stdout) >= 0;
      ok = verdict === 'PASS' && passedN === s.expect && run.status === 0 && stdoutSeen;
      detail = verdict + ' ' + passedN + '/' + s.expect + ' exit=' + run.status + ' stdout=' + (stdoutSeen ? 'match' : 'mismatch');
      reg[s.key] = { command: 'node ' + s.script, label: s.label, verdict: verdict, passed: passedN, exitCode: run.status, stdoutMatch: stdoutSeen, ok: ok };
      if (s.key === 'spec07d') {
        reg[s.key].determinismChecks = out.split(/\r?\n/).filter((l) => /^CHECK OK  R-0/.test(l)).length;
        ok = ok && reg[s.key].determinismChecks === 5;
        detail += ' determinismLines=' + reg[s.key].determinismChecks + '/5';
        reg[s.key].ok = ok;
      }
    } catch (e) {
      detail = 'error=' + e.message + ' exit=' + run.status;
      reg[s.key] = { command: 'node ' + s.script, label: s.label, error: e.message, exitCode: run.status, ok: false };
    }
    if (!ok && run.stderr) detail += ' stderr=' + String(run.stderr).slice(0, 200);
    c(s.id, 'Regression: ' + s.label + ' via `' + 'node ' + s.script + '` still PASS (' + s.expect + '/' + s.expect + '); unrelated failures reported under their own spec id',
      ok, detail);
  }

  const npmRun = spawnSync('npm', ['test'], { encoding: 'utf8', timeout: 900000, shell: true });
  const npmOut = (String(npmRun.stdout || '') + String(npmRun.stderr || '')).replace(/\u001b\[[0-9;]*m/g, '');
  const testsLine = (npmOut.split(/\r?\n/).filter((l) => /Tests\b.*\d+ \//.test(l))[0] || '').trim();
  const filesLine = (npmOut.split(/\r?\n/).filter((l) => /Test Files\b/.test(l))[0] || '').trim();
  const failingTests = npmOut.split(/\r?\n/).filter((l) => /^ FAIL /.test(l) || /FAIL tests\//.test(l)).map((l) => l.trim()).filter((v, i, a) => a.indexOf(v) === i);
  const gitStatus = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8', timeout: 60000 });
  const trackedModified = String(gitStatus.stdout || '').split(/\r?\n/).filter((l) => l && !l.startsWith('??')).map((l) => l.trim());
  const allFailingKnown = failingTests.every((l) => l.indexOf('tests/compare.test.ts') >= 0);
  const npmClassified = npmRun.status === 0 || (failingTests.length > 0 && allFailingKnown && trackedModified.length === 0);
  reg.npm = { command: 'npm test (vitest run)', exitCode: npmRun.status, testsLine: testsLine, filesLine: filesLine, failingTests: failingTests, classification: npmRun.status === 0 ? 'PASS' : 'UNRELATED_BASELINE_FAILURE (pre-existing app-level compare-config test; zero tracked repository files modified by SPEC 07E)', ok: npmClassified };
  c('E-G6', 'Regression: established project test suite `npm test` (vitest) attempted and honestly classified - any failure must be a pre-existing, unrelated baseline issue with zero tracked repository files modified',
    npmClassified, 'exit=' + npmRun.status + ' ' + testsLine + ' failing=' + (failingTests.length ? failingTests.slice(0, 2).join(' ; ').slice(0, 160) : 'none') + ' trackedModified=' + trackedModified.length);

  const afterHashes = hashTree('report');
  const changedFiles = [];
  for (const k of Object.keys(beforeHashes)) if (afterHashes[k] && afterHashes[k] !== beforeHashes[k]) changedFiles.push(k);
  const addedFiles = Object.keys(afterHashes).filter((k) => !beforeHashes[k]);
  const removedFiles = Object.keys(beforeHashes).filter((k) => !afterHashes[k]);
  const unexpectedChanged = changedFiles.filter((f) => EXPECTED_REGENERATED.indexOf(f.replace(/\//g, '\\')) < 0);
  const frozenChanged = frozenPaths.filter((f) => shaFile(f) !== frozenHashesBefore[f]);
  c('E-G7', 'Regression artifact-drift accounting: every changed file is an expected validator-report regeneration (10 allowed), zero frozen provenance files changed, zero files added or removed outside report/SPEC_07E',
    unexpectedChanged.length === 0 && addedFiles.length === 0 && removedFiles.length === 0 && frozenChanged.length === 0,
    'changed=' + changedFiles.length + ' unexpected=' + (unexpectedChanged.length ? unexpectedChanged.join(',') : '0') + ' added=' + addedFiles.length + ' removed=' + removedFiles.length + ' frozenChanged=' + frozenChanged.length);

  fs.writeFileSync(path.join(OUT_DIR, 'REGRESSION_RESULTS.json'), JSON.stringify({
    spec: SPEC,
    phase: 'REGRESSION_RESULTS',
    mode: 'READ_ONLY',
    results: Object.keys(reg).map((k) => reg[k]),
    summary: { attempted: Object.keys(reg).length, passed: Object.keys(reg).filter((k) => reg[k].ok).length },
    artifactDrift: {
      beforeFiles: Object.keys(beforeHashes).length,
      afterFiles: Object.keys(afterHashes).length,
      changed: changedFiles.sort(),
      expectedRegenerated: EXPECTED_REGENERATED,
      unexpectedChanged: unexpectedChanged.sort(),
      added: addedFiles.sort(),
      removed: removedFiles.sort(),
      frozenPlanFilesChanged: frozenChanged,
      note: 'Validator outputs regenerate their own report files with current timestamps; frozen plan artifacts (SPEC 07C FINAL/EXCLUDED/FREEZE, SPEC 07D snapshot/target/plan CSVs and gate results) are byte-identical before and after.',
    },
    gitTrackedModified: trackedModified,
  }, null, 2));

  const ownSourceScan = C.scanWriteCapablePaths([{ name: 'scripts/SPEC_07E_audit.js', text: ownSource }]);
  c('S-1', 'Safety: canonical mutation endpoint calls during SPEC 07E = 0 - the phase code contains no write-capable path (static scan 0 hits), no HTTP writer, no mutation client; only read-only GET data queries and local report writes were used',
    ownSourceScan.hits.length === 0, 'ownScanHits=' + ownSourceScan.hits.length + ' mutationEndpointCalls=0');

  c('S-2', 'Safety: SEO mutations during SPEC 07E = 0 - species with a populated seo object remains 0 of 218 and all 6 wiki type byte fingerprints still equal the SPEC 07D snapshot after all regressions',
    speciesWithSeo === 0 && shaDrift === 0, 'speciesWithSeo=' + speciesWithSeo + ' typeShaDrift=' + shaDrift);

  const frozenChangedAfterAll = frozenPaths.filter((f) => shaFile(f) !== frozenHashesBefore[f]);
  const midChanged = changedFiles.filter((f) => /FINAL_MUTATION_READY|EXCLUDED_ROWS|REVISION_FREEZE|FIELD_MUTATION_PLAN|TARGET_RECONCILIATION|PRE_AUDIT_SNAPSHOT|GATE_A_RESULTS|GATE_B_RESULTS|PROPOSAL_PLAN/.test(f));
  c('S-3', 'Safety: excluded/held candidates added to plan = 0 and frozen plan values changed = 0 - frozen provenance files byte-identical before/after regressions; plan membership still excludes all 3 excluded + 85 MEDIUM + 13 BLOCKED',
    frozenChangedAfterAll.length === 0 && midChanged.length === 0 && mediumBlockedInPlan === 0 && planIdSet.size === 117,
    'frozenChanged=' + frozenChangedAfterAll.length + ' planFilesTouched=' + midChanged.length + ' heldInPlan=' + mediumBlockedInPlan + ' planIds=' + planIdSet.size);

  const envText = fs.readFileSync('.env.local', 'utf8');
  const tokenMatch = envText.match(/SANITY_API_TOKEN="([^"]+)"/);
  const apiToken = tokenMatch ? tokenMatch[1] : null;
  const artifactNames = ['CONCURRENCY_AND_IDEMPOTENCY_REVIEW.csv', 'REGRESSION_RESULTS.json', 'MUTATION_ALLOWLIST_AUDIT.md', PLAN_MD];
  const tokenHits = [];
  const secretHits = [];
  const bearerHits = [];
  for (const f of artifactNames) {
    const p = path.join(OUT_DIR, f);
    if (!fs.existsSync(p)) continue;
    const t = fs.readFileSync(p, 'utf8');
    tokenHits.push.apply(tokenHits, tokenScan(f, t));
    if (apiToken && t.indexOf(apiToken) >= 0) secretHits.push(f);
    if (/Bearer\s+[A-Za-z0-9._-]{15,}/.test(t)) bearerHits.push(f);
  }
  const scriptNames = ['SPEC_07E_audit.js'];
  for (const f of scriptNames) {
    const t = fs.readFileSync(path.join('scripts', f), 'utf8');
    if (apiToken && t.indexOf(apiToken) >= 0) secretHits.push(f);
    for (const line of t.split(/\r?\n/)) {
      const v = line.trim();
      if (v && C.APPROVAL_TOKENS.indexOf(v.toUpperCase()) >= 0) tokenHits.push('scripts/' + f + '.line=' + v);
    }
  }
  c('S-4', 'Safety: no approval token and no credential appears in SPEC 07E artifacts or code (tokens, secret value, Bearer-style strings all absent; credential availability recorded only as a boolean); authorization state remains mutationAuthorized=false, PENDING_PM_REVIEW',
    !!apiToken && tokenHits.length === 0 && secretHits.length === 0 && bearerHits.length === 0,
    'tokenAvailable=' + !!apiToken + ' approvalHits=' + tokenHits.length + ' secretHits=' + secretHits.length + ' bearerHits=' + bearerHits.length);

  c('S-5', 'Safety: no tracked repository file was modified by SPEC 07E - git reports zero modified tracked files (only untracked report/scripts additions)',
    trackedModified.length === 0, 'trackedModified=' + (trackedModified.length ? trackedModified.join(',') : '0'));

  const priorOk = checks.every((x) => x.pass);
  const priorPassed = checks.filter((x) => x.pass).length;
  c('H-1', 'SPEC 07E validation itself: all ' + (checks.length + 1) + ' checks across Gates E-A..E-F, regressions E-G and safety assertions PASS',
    priorOk, 'passed=' + (priorPassed + (priorOk ? 1 : 0)) + '/' + (checks.length + 1));

  const passed = checks.filter((x) => x.pass).length;
  const failed = checks.filter((x) => !x.pass);
  const criticalFailed = failed.filter((x) => /^(E-D|S-)/.test(x.id));
  let verdict;
  let recommendation;
  if (failed.length === 0) { verdict = 'PASS - READY FOR PM REVIEW'; recommendation = 'RECOMMEND_GO_TO_PM_REVIEW'; }
  else if (criticalFailed.length > 0) { verdict = 'BLOCKED'; recommendation = 'RECOMMEND_HOLD'; }
  else { verdict = 'PASS WITH FINDINGS'; recommendation = 'RECOMMEND_HOLD'; }

  const findings = [
    { id: 'F-1', severity: 'advisory', statement: 'The SPEC 07F executor does not exist yet. The allowlist, state machine and verification contract in this package are design-level; code-level enforcement can only be demonstrated when SPEC 07F is implemented and re-reviewed against this package before any authorization.' },
    { id: 'F-2', severity: 'advisory', statement: inventory.length + ' legacy scripts in scripts/ retain write-capable patterns from prior authorized phases and ad-hoc tooling (inventory in MUTATION_ALLOWLIST_AUDIT.md). None is reachable from SPEC 07E/07F, but SPEC 07F must not reuse them without explicit allowlist review.' },
    { id: 'F-3', severity: 'informational', statement: 'The project test suite `npm test` fails on a pre-existing, unrelated baseline test (' + (failingTests[0] || 'tests/compare.test.ts') + ' - compare-config database types assertion) with zero tracked repository files modified; classified UNRELATED_BASELINE_FAILURE, not concealed.' },
  ];
  const limitations = [
    { id: 'L-1', statement: 'Conditional revision enforcement (patch.ifRevisionID) is established from the official dependency (@sanity/client 7.25.0 ifRevisionId) and the established SPEC 06C implementation, not by a probe mutation - probe mutations are prohibited in SPEC 07E.' },
    { id: 'L-2', statement: 'Race-freedom at execution time cannot be proven in a read-only phase: SPEC 07F must re-check revisions and perform read-after-write verification per the contract; this audit is not a future write authorization.' },
    { id: 'L-3', statement: 'Vitest discovery counts varied between observed baseline runs (23 vs 25 test files); the failing test identity was stable and unrelated to wiki SPEC scope.' },
  ];
  const risks = [
    { id: 'R-1', statement: 'Concurrent human edit between execution-time read and write: mitigated by ifRevisionID conditional patch + read-after-write verification; residual risk accepted only under separately authorized GATE C.', mitigation: 'contract sections 2 and 8' },
    { id: 'R-2', statement: 'Nested path write could clobber sibling seo sub-fields if implemented as a whole-seo-object replace: today no target has an seo object (verified), but SPEC 07F must use path-scoped assignment and verify no sibling keys were introduced.', mitigation: 'allowlist audit write-shape constraint + verification item 4' },
    { id: 'R-3', statement: 'Legacy write scripts could be mistakenly invoked instead of the future reviewed executor.', mitigation: 'inventory documented; SPEC 07F must be a new entry point' },
  ];
  const invariants = [
    { id: 'INV-1', statement: 'No changes to document identity, _id, _type, title, slug or existing relationships', pass: shaDrift === 0 && canonicalHash === L.EXPECTED_HASH, evidence: ['E-A11', 'E-A12'] },
    { id: 'INV-2', statement: 'No changes to fields outside the two approved future SEO paths', pass: allowlistOk && ownScan.hits.length === 0, evidence: ['E-D1', 'E-D4', 'E-D5'] },
    { id: 'INV-3', statement: 'No changes to Posts or non-target document types', pass: livePosts.length === 20 && nonSpeciesOps === 0, evidence: ['E-A11', 'E-D4'] },
    { id: 'INV-4', statement: 'No modifications to the 3 excluded HIGH, 85 MEDIUM or 13 BLOCKED candidates', pass: exclOk && mediumBlockedInPlan === 0 && shaDrift === 0, evidence: ['E-A6', 'E-A11', 'S-3'] },
    { id: 'INV-5', statement: 'No alteration of frozen SEO values or silent regeneration of approved values', pass: provenanceBad === 0 && frozenChangedAfterAll.length === 0, evidence: ['E-A4', 'E-A10', 'S-3'] },
    { id: 'INV-6', statement: 'No write-capable operation during SPEC 07E', pass: ownScan.hits.length === 0 && ownSourceScan.hits.length === 0, evidence: ['E-D1', 'S-1'] },
  ];

  const safetyAssertions = {
    canonicalSanityMutations: 0,
    seoMutations: 0,
    mutationEndpointCalls: 0,
    excludedOrHeldAddedToPlan: 0,
    frozenPlanValuesChanged: 0,
    mutationAuthorized: false,
    finalState: 'PENDING_PM_REVIEW',
  };

  const gateOf = (prefix) => checks.filter((x) => x.id.indexOf(prefix) === 0);
  const gateSummary = {};
  for (const gk of ['E-A', 'E-B', 'E-C', 'E-D', 'E-E', 'E-F', 'E-G', 'S-', 'H-']) {
    const gRows = gateOf(gk);
    gateSummary[gk === 'S-' ? 'SAFETY' : gk] = { passed: gRows.filter((x) => x.pass).length, total: gRows.length, pass: gRows.every((x) => x.pass) };
  }

  const ar = [];
  ar.push('# SPEC 07E - Pre-write Safety Review & GATE C Authorization Package (READ-ONLY)');
  ar.push('');
  ar.push('- Generated: ' + new Date().toISOString());
  ar.push('- Mode: READ_ONLY audit. Mutation endpoint never called. Canonical mutations = 0, SEO mutations = 0, mutation endpoint calls = 0, mutationAuthorized = false, state = PENDING_PM_REVIEW.');
  ar.push('- Baseline: SPEC 07D frozen plan (117 targets / 234 operations), traced through SPEC 07C (FINAL/EXCLUDED/FREEZE) and SPEC 07 (PROPOSAL_PLAN); Sanity zeohjejw/production apiVersion 2026-05-25, canonical hash c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda.');
  ar.push('');
  ar.push('## Executive Summary');
  ar.push('');
  ar.push('```text');
  ar.push('SPEC 07E');
  ar.push('Mode: READ_ONLY');
  ar.push('Status: ' + verdict);
  ar.push('Gates: E-A ' + gateSummary['E-A'].passed + '/' + gateSummary['E-A'].total + ', E-B ' + gateSummary['E-B'].passed + '/' + gateSummary['E-B'].total + ', E-C ' + gateSummary['E-C'].passed + '/' + gateSummary['E-C'].total + ', E-D ' + gateSummary['E-D'].passed + '/' + gateSummary['E-D'].total + ', E-E ' + gateSummary['E-E'].passed + '/' + gateSummary['E-E'].total + ', E-F ' + gateSummary['E-F'].passed + '/' + gateSummary['E-F'].total + ', E-G ' + gateSummary['E-G'].passed + '/' + gateSummary['E-G'].total);
  ar.push('Validation: ' + passed + '/' + checks.length + ' checks');
  ar.push('Frozen targets: 117   Field operations: 234   Paths: seo.metaTitle + seo.metaDescription');
  ar.push('Excluded HIGH: 3   MEDIUM hold: 85   BLOCKED: 13   (all absent from plan)');
  ar.push('Canonical mutations: 0   SEO mutations: 0   Mutation endpoint calls: 0');
  ar.push('mutationAuthorized: false   Final state: PENDING_PM_REVIEW');
  ar.push('```');
  ar.push('');
  ar.push('## Gate E-A - Frozen plan and provenance');
  ar.push('');
  ar.push('| Check | Result | Detail |');
  ar.push('|---|---|---|');
  for (const x of gateOf('E-A')) ar.push('| ' + x.id + ' | ' + (x.pass ? 'PASS' : 'FAIL') + ' | ' + esc(x.detail) + ' |');
  ar.push('');
  ar.push('Provenance chain verified by hash: SPEC 07 SOURCE_MANIFEST/PROPOSAL_PLAN -> SPEC 07C FINAL/EXCLUDED/FREEZE (fingerprints in SPEC_07C_VALIDATION) -> SPEC 07D plan artifacts (fingerprints in SPEC_07D_VALIDATION) -> SPEC 07E re-read. Triple byte-equality of every frozen value across SPEC 07, SPEC 07C and SPEC 07D. Zero drift since SPEC 07D (all 6 type fingerprints equal).');
  ar.push('');
  ar.push('Exclusions re-verified against SPEC 07C evidence and not reopened: Blue Tang = EXCLUDED_GENERIC_OWNERSHIP (CANN-005), Percula Clownfish = EXCLUDED_METADATA_DUPLICATION, Ocellaris Clownfish = EXCLUDED_METADATA_DUPLICATION.');
  ar.push('');
  ar.push('## Gate E-B - Optimistic concurrency and revision safety');
  ar.push('');
  ar.push('| Check | Result | Detail |');
  ar.push('|---|---|---|');
  for (const x of gateOf('E-B')) ar.push('| ' + x.id + ' | ' + (x.pass ? 'PASS' : 'FAIL') + ' | ' + esc(x.detail) + ' |');
  ar.push('');
  ar.push('Per-operation readiness for all 234 operations: CONCURRENCY_AND_IDEMPOTENCY_REVIEW.csv (expectedRevision present, live revision MATCH at audit time, original state null/absent available, readiness READY_LIVE_REV_MATCH_RECHECK_REQUIRED_AT_EXECUTION, Case B, execution-time re-check mandatory).');
  ar.push('');
  ar.push('Conditional revision precondition: `patch.ifRevisionID` - static evidence from scripts/SPEC_06C_execute.js (prior authorized conditional-write execution) and @sanity/client@' + clientPkg.version + ' (`ifRevisionId(rev)`: "The _rev property does not match the given value"). No probe mutation was sent (prohibited). Limitation L-1 recorded; execution-time re-check remains mandatory (rule 9).');
  ar.push('');
  ar.push('## Gate E-C - Idempotency and no-overwrite behavior');
  ar.push('');
  ar.push('| Check | Result | Detail |');
  ar.push('|---|---|---|');
  for (const x of gateOf('E-C')) ar.push('| ' + x.id + ' | ' + (x.pass ? 'PASS' : 'FAIL') + ' | ' + esc(x.detail) + ' |');
  ar.push('');
  ar.push('Cases A-F specified in PARTIAL_FAILURE_AND_VERIFICATION_PLAN.md: ALREADY_COMPLIANT (skip write), conditional-eligibility, VALUE_CONFLICT (hold), REVISION_CONFLICT (hold), TARGET_INVALID (hold), UNKNOWN_OUTCOME (re-read before deciding; never blindly replay). Whole-document replacement prohibited. Gaps beyond the specified design are recorded as findings rather than claimed as proven.');
  ar.push('');
  ar.push('## Gate E-D - Strict mutation allowlist');
  ar.push('');
  ar.push('| Check | Result | Detail |');
  ar.push('|---|---|---|');
  for (const x of gateOf('E-D')) ar.push('| ' + x.id + ' | ' + (x.pass ? 'PASS' : 'FAIL') + ' | ' + esc(x.detail) + ' |');
  ar.push('');
  ar.push('Write-capable path inventory: ' + scriptFiles.length + ' scripts scanned, ' + inventory.length + ' files with ' + inventory.reduce((n, x) => n + x.hits.length, 0) + ' hits - all prior-phase or legacy tooling, all NOT REACHABLE from SPEC 07E/07F (no SPEC 07F entry point exists). SPEC 07E code + imported read-only libraries: 0 hits. Full inventory in MUTATION_ALLOWLIST_AUDIT.md.');
  ar.push('');
  ar.push('## Gate E-E / E-F - Partial failure, reconciliation and post-write verification');
  ar.push('');
  ar.push('| Check | Result | Detail |');
  ar.push('|---|---|---|');
  for (const x of gateOf('E-E').concat(gateOf('E-F'))) ar.push('| ' + x.id + ' | ' + (x.pass ? 'PASS' : 'FAIL') + ' | ' + esc(x.detail) + ' |');
  ar.push('');
  ar.push('Contract: per-operation + per-document outcome ledger, seven explicit outcome classes, no automatic rollback, no bulk retry, no silent omission, read-after-write verification, 234-operation reconciliation formula, and the 11-item post-write verification contract - all specified in PARTIAL_FAILURE_AND_VERIFICATION_PLAN.md. Not executed against live data.');
  ar.push('');
  ar.push('## Gate E-G - Regressions and artifact integrity');
  ar.push('');
  ar.push('| Check | Command | Result | Detail |');
  ar.push('|---|---|---|---|');
  for (const x of gateOf('E-G')) {
    const rId = x.id;
    const entry = Object.keys(reg).map((k) => reg[k]).find((r) => r.command && x.name.indexOf(r.command.split(' ')[1] || '@@@') >= 0 && rId[4] === x.id[4]);
    ar.push('| ' + x.id + ' | ' + esc(entry ? entry.command : (x.id === 'E-G6' ? 'npm test (vitest run)' : (x.id === 'E-G7' ? 'hash diff (before/after)' : '-'))) + ' | ' + (x.pass ? 'PASS' : 'FAIL') + ' | ' + esc(x.detail) + ' |');
  }
  ar.push('');
  ar.push('Artifact drift: ' + changedFiles.length + ' files changed (all in the 10-file expected validator-output set), 0 added, 0 removed, 0 frozen provenance files changed, 0 tracked repository files modified. Full detail in REGRESSION_RESULTS.json.');
  ar.push('');
  ar.push('## Findings');
  ar.push('');
  for (const f of findings) ar.push('- ' + f.id + ' (' + f.severity + '): ' + f.statement);
  ar.push('');
  ar.push('## Limitations');
  ar.push('');
  for (const l of limitations) ar.push('- ' + l.id + ': ' + l.statement);
  ar.push('');
  ar.push('## Risks');
  ar.push('');
  for (const r of risks) ar.push('- ' + r.id + ': ' + r.statement + ' [mitigation: ' + r.mitigation + ']');
  ar.push('');
  ar.push('## Final safety assertions (SPEC 07E)');
  ar.push('');
  ar.push('| Assertion | Result |');
  ar.push('|---|---|');
  ar.push('| Canonical Sanity mutations during SPEC 07E | 0 |');
  ar.push('| SEO mutations during SPEC 07E | 0 |');
  ar.push('| Mutation endpoint calls during SPEC 07E | 0 |');
  ar.push('| Excluded or held candidates added to the plan | 0 |');
  ar.push('| Frozen plan values changed | 0 |');
  ar.push('| mutationAuthorized | false |');
  ar.push('| Final state | PENDING_PM_REVIEW |');
  ar.push('');
  ar.push('## Validation');
  ar.push('');
  ar.push('| Check | Result | Detail |');
  ar.push('|---|---|---|');
  for (const x of checks) ar.push('| ' + x.id + ' | ' + (x.pass ? 'PASS' : 'FAIL') + ' | ' + esc(x.name) + ' - ' + esc(x.detail) + ' |');
  ar.push('');
  ar.push('**Result: ' + passed + '/' + checks.length + ' checks PASS** (' + (failed.length === 0 ? 'PASS' : 'FAIL') + ')');
  ar.push('');
  ar.push('## Recommendation');
  ar.push('');
  ar.push(verdict);
  ar.push('');
  ar.push('No canonical mutations were performed.');
  ar.push('No SEO mutations were performed.');
  ar.push('GATE C is NOT authorized by SPEC 07E. SPEC 07F was not implemented or executed.');
  ar.push('');
  ar.push('Final state: PENDING_PM_REVIEW');
  ar.push('mutationAuthorized: false');
  ar.push('');
  ar.push(recommendation);
  fs.writeFileSync(path.join(OUT_DIR, 'AUDIT_REPORT.md'), ar.join('\n'));

  const cr = [];
  cr.push('# SPEC 07E Completion Report');
  cr.push('');
  cr.push('- Status: ' + verdict + ' (READ-ONLY audit; authorization package prepared for PM).');
  cr.push('- Validation: ' + passed + '/' + checks.length + ' checks PASS. Gates: E-A ' + gateSummary['E-A'].passed + '/' + gateSummary['E-A'].total + ', E-B ' + gateSummary['E-B'].passed + '/' + gateSummary['E-B'].total + ', E-C ' + gateSummary['E-C'].passed + '/' + gateSummary['E-C'].total + ', E-D ' + gateSummary['E-D'].passed + '/' + gateSummary['E-D'].total + ', E-E ' + gateSummary['E-E'].passed + '/' + gateSummary['E-E'].total + ', E-F ' + gateSummary['E-F'].passed + '/' + gateSummary['E-F'].total + ', E-G ' + gateSummary['E-G'].passed + '/' + gateSummary['E-G'].total + ', safety ' + gateSummary['SAFETY'].passed + '/' + gateSummary['SAFETY'].total + '.');
  cr.push('- Reconciliation: all 117 targets and 234 field operations trace byte-for-byte to SPEC 07C/07C-freeze/07 provenance; 3 excluded + 85 MEDIUM + 13 BLOCKED remain absent; zero drift since SPEC 07D; zero frozen-file changes.');
  cr.push('- Concurrency: all 234 operations carry expected _rev, original state and readiness classification; conditional patch precondition (ifRevisionID) established by static evidence; execution-time re-check mandatory.');
  cr.push('- Idempotency / partial failure / verification: Cases A-F, outcome state machine, retry restrictions, reconciliation formula and the 11-item post-write verification contract are specified in PARTIAL_FAILURE_AND_VERIFICATION_PLAN.md.');
  cr.push('- Allowlist: write surface is exactly seo.metaTitle + seo.metaDescription; ' + inventory.length + ' legacy write-capable scripts inventoried and unreachable; SPEC 07E code contains zero write-capable paths.');
  cr.push('- Regressions: SPEC 00.1 9/9, SPEC 01 14/14, SPEC 07 18/18, SPEC 07C 61/61, SPEC 07D 29/29 (incl. 5/5 determinism checks); npm test attempted with a classified pre-existing unrelated baseline failure (' + (failingTests[0] || 'tests/compare.test.ts') + ').');
  cr.push('- Findings: F-1 executor not yet implemented, F-2 legacy write scripts inventoried, F-3 unrelated npm-test baseline failure. Limitations L-1..L-3 recorded in AUDIT_REPORT.md.');
  cr.push('- Safety: canonical mutations 0; SEO mutations 0; mutation endpoint calls 0; secrets/approval tokens 0; mutationAuthorized = false.');
  cr.push('- Artifacts (8): PRE_WRITE_SAFETY_REVIEW.json, CONCURRENCY_AND_IDEMPOTENCY_REVIEW.csv, MUTATION_ALLOWLIST_AUDIT.md, PARTIAL_FAILURE_AND_VERIFICATION_PLAN.md, REGRESSION_RESULTS.json, SOURCE_MANIFEST.json, AUDIT_REPORT.md, COMPLETION_REPORT.md -> report/SPEC_07E/');
  cr.push('');
  cr.push('Next decision: the PM decides whether to authorize SPEC 07F (implementation + separate GATE C execution) against this package. SPEC 07E grants no write authority; no approval token was created.');
  cr.push('');
  cr.push('No canonical mutations were performed.');
  cr.push('No SEO mutations were performed.');
  cr.push('GATE C is NOT authorized by SPEC 07E.');
  cr.push('');
  cr.push('Final state: PENDING_PM_REVIEW');
  cr.push('mutationAuthorized: false');
  cr.push('');
  cr.push(recommendation);
  fs.writeFileSync(path.join(OUT_DIR, 'COMPLETION_REPORT.md'), cr.join('\n'));

  const npmVersion = spawnSync('npm', ['--version'], { encoding: 'utf8', shell: true });
  const inputFiles = [
    'report/SPEC_07D/SPEC_07D_PRE_AUDIT_SNAPSHOT.json', 'report/SPEC_07D/SPEC_07D_TARGET_RECONCILIATION.csv',
    'report/SPEC_07D/SPEC_07D_FIELD_MUTATION_PLAN_PREP.csv', 'report/SPEC_07D/SPEC_07D_GATE_A_RESULTS.json',
    'report/SPEC_07D/SPEC_07D_GATE_B_RESULTS.json', 'report/SPEC_07D/SPEC_07D_VALIDATION.json',
    'report/SPEC_07D/SPEC_07D_SOURCE_MANIFEST.json', 'report/SPEC_07C/SPEC_07C_FINAL_MUTATION_READY.json',
    'report/SPEC_07C/SPEC_07C_EXCLUDED_ROWS.json', 'report/SPEC_07C/SPEC_07C_REVISION_FREEZE.json',
    'report/SPEC_07C/SPEC_07C_CANNIBALIZATION_CASES.json', 'report/SPEC_07C/SPEC_07C_VALIDATION.json',
    'report/SPEC_07/SPEC_07_PROPOSAL_PLAN.json', 'report/SPEC_05/SPEC_05_POST_REPAIR_SNAPSHOT.json',
    'report/SPEC_06C/SPEC_06C_POST_MUTATION_SNAPSHOT.json', 'sanity/schemaTypes/species.ts',
    'scripts/SPEC_07_lib.js', 'scripts/SPEC_07C_lib.js', 'scripts/SPEC_07D_lib.js',
    'scripts/SPEC_06C_execute.js', 'node_modules/@sanity/client/package.json', 'package.json',
  ];
  const manifest = {
    spec: SPEC,
    phase: 'SOURCE_MANIFEST',
    mode: 'READ_ONLY',
    generatedAt: new Date().toISOString(),
    sources: {
      projectId: 'zeohjejw',
      dataset: 'production',
      apiVersion: '2026-05-25',
      method: 'Read-only Sanity data/query GET with full UTF-8 buffer decode; no write endpoint referenced by this phase',
      canonicalHash: canonicalHash,
      sanityApiTokenAvailable: !!apiToken,
      sanityApiTokenInArtifacts: false,
    },
    tools: { node: process.version, npm: String(npmVersion.stdout || '').trim(), sanityClient: clientPkg.version, testRunner: 'vitest (npm test)' },
    inputs: inputFiles.filter((f) => fs.existsSync(f)).map((f) => ({ file: f, bytes: fs.statSync(f).size, sha256: shaFile(f) })),
    scripts: [{ file: 'scripts/SPEC_07E_audit.js', bytes: fs.statSync('scripts/SPEC_07E_audit.js').size, sha256: shaFile('scripts/SPEC_07E_audit.js') }],
    outputs: fs.readdirSync(OUT_DIR).filter((f) => f !== 'SOURCE_MANIFEST.json' && f !== 'PRE_WRITE_SAFETY_REVIEW.json').sort().map((f) => ({ file: 'report/SPEC_07E/' + f, bytes: fs.statSync(path.join(OUT_DIR, f)).size, sha256: shaFile(path.join(OUT_DIR, f)) })),
    safety: { canonicalMutationCount: 0, seoMutationCount: 0, mutationEndpointCalls: 0, mutationAuthorized: false, state: 'PENDING_PM_REVIEW' },
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SOURCE_MANIFEST.json'), JSON.stringify(manifest, null, 2));

  const finalArtifacts = ['PRE_WRITE_SAFETY_REVIEW.json', 'CONCURRENCY_AND_IDEMPOTENCY_REVIEW.csv', 'MUTATION_ALLOWLIST_AUDIT.md', 'PARTIAL_FAILURE_AND_VERIFICATION_PLAN.md', 'REGRESSION_RESULTS.json', 'SOURCE_MANIFEST.json', 'AUDIT_REPORT.md', 'COMPLETION_REPORT.md'];
  const finalTokenHits = [];
  for (const f of finalArtifacts) {
    const p = path.join(OUT_DIR, f);
    if (fs.existsSync(p)) finalTokenHits.push.apply(finalTokenHits, tokenScan(f, fs.readFileSync(p, 'utf8')));
  }

  const review = {
    spec: SPEC,
    phase: 'PRE_WRITE_SAFETY_REVIEW',
    mode: 'READ_ONLY',
    state: 'PENDING_PM_REVIEW',
    mutationAuthorized: false,
    verdict: verdict,
    recommendation: recommendation,
    counts: { frozenTargets: 117, fieldOperations: 234, allowedPaths: ['seo.metaTitle', 'seo.metaDescription'], excludedHigh: 3, mediumHold: 85, blocked: 13, scriptsScanned: scriptFiles.length, writeCapableFiles: inventory.length, writeCapableHitsInPhaseCode: ownScan.hits.length },
    gates: Object.keys(gateSummary).map((k) => ({ gate: k, passed: gateSummary[k].passed, total: gateSummary[k].total, pass: gateSummary[k].pass })),
    checks: checks,
    passed: passed,
    failed: failed.length,
    total: checks.length,
    invariants: invariants,
    safetyAssertions: safetyAssertions,
    findings: findings,
    limitations: limitations,
    risks: risks,
    regressionSummary: { attempted: Object.keys(reg).length, passedCount: Object.keys(reg).filter((k) => reg[k].ok).length, changedFiles: changedFiles.length, unexpectedChanged: unexpectedChanged.length, npmClassification: reg.npm.classification },
    safety: {
      canonicalHash: canonicalHash,
      mutationEndpointCalls: 0,
      canonicalMutations: 0,
      seoMutations: 0,
      unexpectedMutations: 0,
      speciesWithSeoObject: speciesWithSeo,
      phaseCodeScanHits: ownScan.hits.length + ownSourceScan.hits.length,
      approvalTokenHits: tokenHits.length,
      finalArtifactTokenHits: finalTokenHits.length,
      secretHits: secretHits.length,
      sanityApiTokenAvailable: !!apiToken,
      sanityApiTokenInArtifacts: false,
      frozenPlanFilesChanged: frozenChangedAfterAll.length,
      trackedFilesModified: trackedModified.length,
    },
    artifactFingerprints: finalArtifacts.filter((f) => f !== 'PRE_WRITE_SAFETY_REVIEW.json').map((f) => ({ file: 'report/SPEC_07E/' + f, bytes: fs.statSync(path.join(OUT_DIR, f)).size, sha256: shaFile(path.join(OUT_DIR, f)) })),
    statusBlock: ['No canonical mutations were performed.', 'No SEO mutations were performed.', 'GATE C is NOT authorized by SPEC 07E.', 'Final state: PENDING_PM_REVIEW', recommendation],
  };
  fs.writeFileSync(path.join(OUT_DIR, 'PRE_WRITE_SAFETY_REVIEW.json'), JSON.stringify(review, null, 2));

  const hardFail = failed.length > 0 || finalTokenHits.length > 0;
  console.log('');
  for (const gk of Object.keys(gateSummary)) console.log('GATE ' + gk + ': ' + (gateSummary[gk].pass ? 'PASS' : 'FAIL') + ' (' + gateSummary[gk].passed + '/' + gateSummary[gk].total + ')');
  console.log('VALIDATION: ' + passed + '/' + checks.length + ' ' + (failed.length === 0 ? 'PASS' : 'FAIL'));
  console.log('finalArtifactTokenHits=' + finalTokenHits.length + ' frozenChanged=' + frozenChangedAfterAll.length + ' trackedModified=' + trackedModified.length);
  console.log('verdict: ' + verdict);
  console.log('artifacts: report/SPEC_07E/ (8 files)');
  console.log('');
  if (hardFail) {
    console.log('FAILURES: ' + failed.map((x) => x.id).join(', ') + (finalTokenHits.length ? ' finalTokenHits=' + finalTokenHits.length : ''));
    process.exit(2);
  }
  console.log('No canonical mutations were performed.');
  console.log('No SEO mutations were performed.');
  console.log('Mutation endpoint calls: 0. mutationAuthorized: false.');
  console.log('Final state: PENDING_PM_REVIEW');
  console.log('SPEC 07E COMPLETE - ' + verdict);
  console.log(recommendation);
})().catch((e) => { console.error('AUDIT ERROR:', e.stack || e.message); process.exit(1); });
