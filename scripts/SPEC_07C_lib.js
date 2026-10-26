const L = require('./SPEC_07_lib.js');

const SPEC = 'SPEC_07C';
const SOURCE_SPEC = 'SPEC_07';
const MODE = 'READ_ONLY';

const ST_READY = 'FINAL_MUTATION_READY';
const ST_CANNIBALIZATION = 'EXCLUDED_CANNIBALIZATION';
const ST_METADATA_DUP = 'EXCLUDED_METADATA_DUPLICATION';
const ST_GENERIC = 'EXCLUDED_GENERIC_OWNERSHIP';
const ST_IDENTITY = 'EXCLUDED_IDENTITY_CONFLICT';
const ST_OTHER = 'EXCLUDED_OTHER';
const FINAL_STATUSES = [ST_READY, ST_CANNIBALIZATION, ST_METADATA_DUP, ST_GENERIC, ST_IDENTITY, ST_OTHER];

const CL_SAFE = 'SAFE_SHARED_INTENT';
const CL_DIFF = 'DIFFERENTIATE_METADATA';
const CL_GENERIC = 'BLOCK_GENERIC_OWNERSHIP';
const CL_IDENTITY = 'TRUE_IDENTITY_CONFLICT';
const CLASSIFICATIONS = [CL_SAFE, CL_DIFF, CL_GENERIC, CL_IDENTITY];

const DET_LEGIT = 'LEGITIMATE_SIBLINGS_SHARED_TEMPLATE';
const DET_DIFFERENTIATE = 'REQUIRES_METADATA_DIFFERENTIATION';
const DET_COLLISION = 'SEARCH_INTENT_COLLISION';
const DET_BLOCK = 'UNRESOLVED_OWNERSHIP_BLOCK';
const DETERMINATIONS = [DET_LEGIT, DET_DIFFERENTIATE, DET_COLLISION, DET_BLOCK];

const EXPECTED_INTENT_DIST = {
  CARE: 60, TANK_REQUIREMENTS: 52, BEHAVIOR: 31, COMPATIBILITY: 28, FEEDING: 20,
  IDENTIFY: 15, LEARN: 10, BREEDING: 1, TROUBLESHOOT: 1,
};

const APPROVAL_TOKENS = ['APPROVED', 'AUTHORIZED', 'GO', 'EXECUTE', 'MUTATE'];

const proposalIdOf = (recordId) => 'PR07-' + recordId;

function strictTokenSubset(a, b) {
  const na = L.normalize(a);
  const nb = L.normalize(b);
  if (!na || !nb || na === nb) return false;
  const A = L.tokens(a);
  const B = new Set(L.tokens(b));
  return A.length > 0 && A.every((t) => B.has(t));
}

function anchorRemainder(text, name, sci) {
  if (typeof text !== 'string' || typeof name !== 'string' || !name) return null;
  if (!text.startsWith(name)) return null;
  let rest = text.slice(name.length);
  if (sci && rest.startsWith(' (' + sci + ')')) rest = rest.slice((' (' + sci + ')').length);
  return rest;
}

function descriptionsInterchangeable(aName, aSci, aDesc, bName, bSci, bDesc) {
  const ra = anchorRemainder(aDesc, aName, aSci);
  const rb = anchorRemainder(bDesc, bName, bSci);
  return ra !== null && rb !== null && ra.length > 0 && ra === rb;
}

function extractFacts(desc) {
  const f = {};
  let m;
  if ((m = /is an? ([A-Za-z]+)-level/.exec(desc))) f.difficultyLevel = m[1];
  if ((m = /is an? (freshwater|saltwater|brackish)/.exec(desc))) f.waterType = m[1];
  if ((m = /Grows to (\d+(?:\.\d+)?) cm/.exec(desc))) f.sizeCm = m[1];
  if ((m = /needs (?:at least )?(\d+) L/.exec(desc))) f.tankSizeMinL = m[1];
  if ((m = /at (\d+(?:\.\d+)?-\d+(?:\.\d+)?\u00B0C)/.exec(desc))) f.tempC = m[1];
  if ((m = /pH (\d+(?:\.\d+)?-\d+(?:\.\d+)?)/.exec(desc))) f.ph = m[1];
  if ((m = /GH (\d+(?:\.\d+)?-\d+(?:\.\d+)?)/.exec(desc))) f.gh = m[1];
  if ((m = /It is an? ([a-z]+)\./.exec(desc))) f.diet = m[1];
  if ((m = /Covers (.+)\./.exec(desc))) f.covers = m[1];
  return f;
}

function factComparison(descA, descB) {
  const A = extractFacts(descA);
  const B = extractFacts(descB);
  const shared = [];
  const differing = [];
  for (const k of Object.keys(A)) {
    if (Object.prototype.hasOwnProperty.call(B, k)) {
      if (A[k] === B[k]) shared.push(k + '=' + A[k]);
      else differing.push(k + '=' + A[k] + ' vs ' + B[k]);
    } else {
      differing.push(k + '=' + A[k] + ' vs (absent)');
    }
  }
  for (const k of Object.keys(B)) {
    if (!Object.prototype.hasOwnProperty.call(A, k)) differing.push(k + '=(absent) vs ' + B[k]);
  }
  return { shared: shared.sort(), differing: differing.sort() };
}

function repeatedTokens(text, limit) {
  const freq = {};
  for (const t of L.tokens(text)) {
    if (!/[a-z]/.test(t)) continue;
    freq[t] = (freq[t] || 0) + 1;
  }
  return Object.keys(freq).filter((t) => freq[t] > limit).sort();
}
const titleStuffing = (text) => repeatedTokens(text, 2);
const descStuffing = (text) => repeatedTokens(text, 3);

function classifyPair(A, B, opts) {
  const sharedSci = !!opts.sharedScientificName;
  const isGeneric = !!opts.genericPair;
  const subset = strictTokenSubset(A.title, B.title) || strictTokenSubset(B.title, A.title);
  if (A.slug === B.slug || L.normalize(A.title) === L.normalize(B.title)) {
    return {
      classification: CL_IDENTITY,
      reason: 'Records share identical slug or identical normalized canonical name (' + A.slug + ' vs ' + B.slug + '); identity conflict must be repaired editorially before any SEO mutation.',
    };
  }
  if (isGeneric || subset) {
    return {
      classification: CL_GENERIC,
      reason: 'One record name is a strict token subset of the other (generic vs specific naming) with scientificName ' + (opts.scientificName || '') + '; canonical evidence does not designate which page owns the generic query.',
    };
  }
  if (descriptionsInterchangeable(A.title, opts.sciA, A.proposedMetaDescription, B.title, opts.sciB, B.proposedMetaDescription)) {
    return {
      classification: CL_DIFF,
      reason: 'After stripping the leading entity name, both proposed metaDescriptions are byte-identical; the entity name is the only differentiating content, which is insufficient for a mutation-ready freeze (metadata must be differentiated by editorial; no silent rewrite performed).',
    };
  }
  const facts = factComparison(A.proposedMetaDescription, B.proposedMetaDescription);
  return {
    classification: CL_SAFE,
    reason: 'Distinct canonical records (slugs and names differ, no generic-name subset relation); proposed descriptions are not interchangeable modulo entity name (differing factual claims: ' + (facts.differing.length ? facts.differing.join('; ') : 'n/a') + '); shared template wording is acceptable for distinct records.',
  };
}

function relationshipOf(A, B, sharedSci, genericPair) {
  if (genericPair) return 'GENERIC_VS_SPECIFIC';
  if (sharedSci) return 'SHARED_SCIENTIFIC_NAME_FAMILY';
  if ((A.parentSpecies && A.parentSpecies === B.recordId) || (B.parentSpecies && B.parentSpecies === A.recordId)) return 'PARENT_SPECIES_VARIANT';
  return 'DISTINCT_RECORDS_SIMILAR_TEMPLATE';
}

function caseReason(pair) {
  const bits = [];
  if (pair.overlap === 'NEAR_DUP_BOTH') bits.push('both proposed metaTitle (>=0.75) and metaDescription (>=0.80) exceed SPEC 07 near-duplicate thresholds');
  else if (pair.overlap === 'NEAR_DUP_TITLE') bits.push('proposed metaTitle (>=0.75) exceeds SPEC 07 near-duplicate title threshold');
  else bits.push('proposed metaDescription (>=0.80) exceeds SPEC 07 near-duplicate description threshold');
  if (pair.sharedScientificName) bits.push('records share scientificName');
  return bits.join('; ') + '.';
}

function identityHashOf(live) {
  const liveBy = {};
  for (const t of L.WIKI_TYPES) for (const r of live[t]) liveBy[r._id] = { type: t, rec: r };
  const parts = Object.keys(liveBy).sort().map((id) => L.sha256(JSON.stringify({ id: id, title: L.titleOf(liveBy[id].type, liveBy[id].rec), slug: L.slugValue(liveBy[id].rec.slug) })));
  return { hash: L.sha256(parts.join('\n')), liveBy: liveBy };
}

const slugNorm = (sci) => String(sci || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function caseRecordView(row, liveRec) {
  return {
    recordId: row.recordId,
    title: row.title,
    slug: row.slug,
    scientificName: liveRec ? liveRec.scientificName : null,
    confidence: row.confidence,
    mutationStatus: row.mutationStatus,
    reasonCode: row.reasonCode,
    searchIntent: row.searchIntent,
    inHigh120: row.confidence === 'HIGH',
    proposalId: proposalIdOf(row.recordId),
    proposedMetaTitle: row.proposedMetaTitle,
    proposedMetaDescription: row.proposedMetaDescription,
  };
}

function genericRecordView(row, liveRec, aliases, parent) {
  return {
    recordId: row.recordId,
    title: row.title,
    slug: row.slug,
    scientificName: liveRec ? liveRec.scientificName : null,
    confidence: row.confidence,
    mutationStatus: row.mutationStatus,
    reasonCode: row.reasonCode,
    inHigh120: row.confidence === 'HIGH',
    proposedMetaTitle: row.proposedMetaTitle,
    proposedMetaDescription: row.proposedMetaDescription,
    excerpt: liveRec && L.has(liveRec.excerpt) ? String(liveRec.excerpt).trim() : '',
    contentSignals: liveRec ? L.contentSignals(liveRec) : row.contentSignals,
    parentSpecies: parent,
    aliases: aliases,
    taxonomy: liveRec ? { group: liveRec.group || null, family: liveRec.family || null, origin: liveRec.origin || null, waterType: liveRec.waterType || null } : null,
  };
}

function buildAnalysis(inputs) {
  const live = inputs.live;
  const liveDrafts = inputs.liveDrafts;
  const plan = inputs.plan;
  const cann = inputs.cann;
  const S05 = inputs.S05;
  const S06c = inputs.S06c;
  const manifest = inputs.manifest;
  const schemaAudit = inputs.schemaAudit;
  const speciesSchemaSha = inputs.speciesSchemaSha;

  const gates = [];
  const g = (id, name, ok, detail) => gates.push({ id: id, name: name, pass: !!ok, detail: String(detail === undefined || detail === null ? '' : detail) });

  const counts = {};
  for (const t of L.WIKI_TYPES) counts[t] = live[t].filter((r) => !String(r._id).startsWith('drafts.')).length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  let wikiDrafts = 0;
  for (const t of L.WIKI_TYPES) wikiDrafts += live[t].filter((r) => String(r._id).startsWith('drafts.')).length;

  const slugSeen = {};
  let dupSlugs = 0;
  let undefinedRoutes = 0;
  for (const t of L.WIKI_TYPES) {
    for (const r of live[t]) {
      const s = L.slugValue(r.slug);
      if (!s || !L.titleOf(t, r)) { undefinedRoutes++; continue; }
      const k = t + '/' + s;
      if (slugSeen[k]) dupSlugs++;
      slugSeen[k] = true;
    }
  }

  const idParts = identityHashOf(live);
  const hash = idParts.hash;
  const liveBy = idParts.liveBy;

  g('A-01', 'GATE A canonical baseline: 473 total wiki records with exact composition (species 218 / plant 62 / invertebrate 56 / coral 48 / equipment 46 / problem 43)',
    total === 473 && L.WIKI_TYPES.every((t) => counts[t] === L.EXPECTED[t]),
    'total=' + total + ' ' + JSON.stringify(counts));
  g('A-02', 'GATE A drafts = 0 (wiki types and dataset-wide)',
    wikiDrafts === 0 && Number(liveDrafts) === 0,
    'wikiDrafts=' + wikiDrafts + ' datasetDrafts=' + liveDrafts);
  g('A-03', 'GATE A duplicate slugs = 0 and undefined routes = 0',
    dupSlugs === 0 && undefinedRoutes === 0,
    'dupSlugs=' + dupSlugs + ' undefinedRoutes=' + undefinedRoutes);
  g('A-04', 'GATE A canonical identity hash unchanged = c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda',
    hash === L.EXPECTED_HASH,
    'hash=' + hash);

  const rows = plan.rows;
  const rowBy = {};
  for (const r of rows) rowBy[r.recordId] = r;
  const highRows = rows.filter((r) => r.confidence === 'HIGH');
  const mediumRows = rows.filter((r) => r.confidence === 'MEDIUM');
  const blockedRows = rows.filter((r) => r.confidence === 'BLOCKED');
  const planCounts = plan.counts;

  const species = live.species;
  const speciesById = {};
  for (const s of species) speciesById[s._id] = s;
  const planIds = new Set(rows.map((r) => r.recordId));
  const speciesIds = new Set(species.map((s) => s._id));
  let missingRows = 0;
  let extraRows = 0;
  for (const id of planIds) if (!speciesIds.has(id)) missingRows++;
  for (const id of speciesIds) if (!planIds.has(id)) extraRows++;

  const intentDist = {};
  for (const r of rows) intentDist[r.searchIntent] = (intentDist[r.searchIntent] || 0) + 1;
  const intentMatchesExpected = Object.keys(EXPECTED_INTENT_DIST).every((k) => intentDist[k] === EXPECTED_INTENT_DIST[k]) &&
    Object.keys(intentDist).every((k) => EXPECTED_INTENT_DIST[k] !== undefined);

  const statusIntegrity = highRows.every((r) => r.mutationStatus === 'MUTATION_READY') &&
    mediumRows.every((r) => r.mutationStatus === 'REVIEW_REQUIRED') &&
    blockedRows.every((r) => r.mutationStatus === 'BLOCKED');

  g('B-01', 'GATE B SPEC 07 population reconciliation: original HIGH = 120, MEDIUM = 85, BLOCKED = 13, TOTAL = 218',
    highRows.length === 120 && mediumRows.length === 85 && blockedRows.length === 13 && rows.length === 218 &&
    planCounts.byConfidence.HIGH === 120 && planCounts.byConfidence.MEDIUM === 85 && planCounts.byConfidence.BLOCKED === 13,
    'high=' + highRows.length + ' medium=' + mediumRows.length + ' blocked=' + blockedRows.length + ' total=' + rows.length);
  g('B-02', 'GATE B no missing proposal rows and no extra proposal rows (plan 218 ids exactly match live 218 species ids)',
    missingRows === 0 && extraRows === 0 && rows.length === species.length,
    'missing=' + missingRows + ' extra=' + extraRows);
  g('B-03', 'GATE B confidence-to-status mapping intact (HIGH=MUTATION_READY, MEDIUM=REVIEW_REQUIRED, BLOCKED=BLOCKED) - no relabeling in source plan',
    statusIntegrity,
    'integrity=' + statusIntegrity);
  g('B-04', 'GATE B search-intent distribution preserved (CARE 60 / TANK_REQUIREMENTS 52 / BEHAVIOR 31 / COMPATIBILITY 28 / FEEDING 20 / IDENTIFY 15 / LEARN 10 / BREEDING 1 / TROUBLESHOOT 1)',
    intentMatchesExpected,
    JSON.stringify(intentDist));
  g('B-05', 'GATE B HIGH-only rule precondition: source population contains exactly 120 original HIGH / MUTATION_READY rows for reconciliation',
    highRows.length === 120 && highRows.every((r) => r.mutationStatus === 'MUTATION_READY'),
    'high=120 mutationReady=' + highRows.filter((r) => r.mutationStatus === 'MUTATION_READY').length);

  const recompute = L.buildAllProposals(species);
  const recomputeBy = {};
  for (const r of recompute.rows) recomputeBy[r.recordId] = r;
  const driftIds = [];
  for (const r of rows) {
    const rc = recomputeBy[r.recordId];
    if (!rc) { driftIds.push(r.recordId); continue; }
    if (rc.proposedMetaTitle !== r.proposedMetaTitle ||
        rc.proposedMetaDescription !== r.proposedMetaDescription ||
        rc.searchIntent !== r.searchIntent ||
        rc.confidence !== r.confidence ||
        rc.reasonCode !== r.reasonCode ||
        rc.mutationStatus !== r.mutationStatus) driftIds.push(r.recordId);
  }

  const snapBy = {};
  for (const t of L.WIKI_TYPES) for (const r of S05.records[t]) snapBy[r._id] = r;
  const s06By = {};
  for (const d of S06c.documents) s06By[d._id] = d;

  let added = 0;
  let removed = 0;
  let nonRelChanged = 0;
  let relChangedDocs = 0;
  let seoDiff = 0;
  for (const id of Object.keys(liveBy)) if (!snapBy[id]) added++;
  for (const id of Object.keys(snapBy)) if (!liveBy[id]) removed++;
  for (const id of Object.keys(liveBy)) {
    const a = liveBy[id].rec;
    const b = snapBy[id];
    if (!b) continue;
    const aRel = L.canon(a.relatedPosts === undefined ? null : a.relatedPosts);
    const bRel = L.canon(b.relatedPosts === undefined ? null : b.relatedPosts);
    if (aRel !== bRel) relChangedDocs++;
    const aCopy = Object.assign({}, a); delete aCopy.relatedPosts;
    const bCopy = Object.assign({}, b); delete bCopy.relatedPosts;
    if (L.contentDiffers(aCopy, bCopy)) nonRelChanged++;
    if (L.canon(a.seo) !== L.canon(b.seo)) seoDiff++;
  }
  let post06cDrift = 0;
  for (const d of S06c.documents) {
    const cur = liveBy[d._id] && liveBy[d._id].rec;
    if (!cur || L.contentDiffers(cur, d)) post06cDrift++;
  }

  const fingerprints = {};
  let fingerprintMatches = true;
  for (const t of L.WIKI_TYPES) {
    const sha = L.sha256(JSON.stringify(live[t]));
    const match = manifest.resultFingerprints[t] && sha === manifest.resultFingerprints[t].sha256;
    fingerprints[t] = { sha256: sha, matchesSpec07Manifest: !!match };
    if (!match) fingerprintMatches = false;
  }

  let revBaselineDiff = 0;
  for (const s of species) {
    const base = s06By[s._id] || snapBy[s._id];
    if (base && s._rev !== base._rev) revBaselineDiff++;
  }

  let speciesWithSeo = 0;
  for (const s of species) if (s.seo && (s.seo.metaTitle !== undefined || s.seo.metaDescription !== undefined)) speciesWithSeo++;

  const titleDiffs = [];
  const slugDiffs = [];
  const sciDiffs = [];
  const bodyDiffs = [];
  const taxonomyDiffs = [];
  const relFieldDiffs = [];
  const taxonomyFields = ['group', 'family', 'origin', 'waterType', 'aquariumStyle', 'temperament'];
  const relFields = ['parentSpecies', 'compatibleSpecies', 'relatedProblems'];
  for (const id of Object.keys(liveBy)) {
    const a = liveBy[id].rec;
    const b = snapBy[id];
    if (!b) continue;
    if (L.titleOf(liveBy[id].type, a) !== L.titleOf(liveBy[id].type, b)) titleDiffs.push(id);
    if (L.slugValue(a.slug) !== L.slugValue(b.slug)) slugDiffs.push(id);
    if (L.canon(a.scientificName === undefined ? null : a.scientificName) !== L.canon(b.scientificName === undefined ? null : b.scientificName)) sciDiffs.push(id);
    if (L.canon(a.excerpt === undefined ? null : a.excerpt) !== L.canon(b.excerpt === undefined ? null : b.excerpt) ||
        L.canon(a.schooling === undefined ? null : a.schooling) !== L.canon(b.schooling === undefined ? null : b.schooling)) bodyDiffs.push(id);
    let tax = false;
    for (const f of taxonomyFields) {
      if (L.canon(a[f] === undefined ? null : a[f]) !== L.canon(b[f] === undefined ? null : b[f])) tax = true;
    }
    if (tax) taxonomyDiffs.push(id);
    let relf = false;
    for (const f of relFields) {
      if (L.canon(a[f] === undefined ? null : a[f]) !== L.canon(b[f] === undefined ? null : b[f])) relf = true;
    }
    if (relf) relFieldDiffs.push(id);
  }

  const cannMeta = cann.metadataLevel;
  const nearPairs = cannMeta.nearDuplicatePairs.pairs.map((p) => {
    const aObj = p.a && typeof p.a === 'object';
    const bObj = p.b && typeof p.b === 'object';
    return Object.assign({}, p, {
      a: aObj ? p.a.recordId : p.a,
      b: bObj ? p.b.recordId : p.b,
      aName: aObj ? p.a.name : null,
      bName: bObj ? p.b.name : null,
    });
  });
  const bothPairs = nearPairs.filter((p) => p.overlap === 'NEAR_DUP_BOTH');
  const casePairs = nearPairs.filter((p) => p.sharedScientificName || p.overlap === 'NEAR_DUP_BOTH');
  const genericPairsDef = cann.identityLevel.genericVsSpecificNamePairs.pairs;
  const genericKeySet = new Set(genericPairsDef.map((p) => [p.genericRecord.recordId, p.specificRecord.recordId].sort().join('|')));
  const caseKeySet = new Set(casePairs.map((p) => [p.a, p.b].sort().join('|')));

  function makeCase(pair, index, prefix) {
    const A = rowBy[pair.a];
    const B = rowBy[pair.b];
    const liveA = speciesById[pair.a];
    const liveB = speciesById[pair.b];
    const key = [pair.a, pair.b].sort().join('|');
    const isGeneric = genericKeySet.has(key);
    const cls = classifyPair(A, B, {
      sharedScientificName: pair.sharedScientificName,
      genericPair: isGeneric,
      scientificName: (liveA && liveA.scientificName) || '',
      sciA: liveA ? liveA.scientificName : '',
      sciB: liveB ? liveB.scientificName : '',
    });
    const highInvolved = [A, B].filter((r) => r.confidence === 'HIGH').map((r) => r.recordId);
    let disposition;
    if (highInvolved.length === 0) disposition = 'NO_HIGH_ROWS_INVOLVED';
    else if (cls.classification === CL_DIFF) disposition = 'HIGH_ROWS_EXCLUDED_METADATA_DUPLICATION';
    else if (cls.classification === CL_GENERIC) disposition = 'HIGH_ROWS_EXCLUDED_GENERIC_OWNERSHIP';
    else if (cls.classification === CL_IDENTITY) disposition = 'HIGH_ROWS_EXCLUDED_IDENTITY_CONFLICT';
    else disposition = 'HIGH_ROWS_REMAIN_ELIGIBLE';
    return {
      cannibalizationCaseId: prefix + '-' + String(index).padStart(3, '0'),
      recordA: caseRecordView(A, liveA),
      recordB: caseRecordView(B, liveB),
      originalSpec07Status: { recordA: A.mutationStatus, recordB: B.mutationStatus },
      originalSpec07Confidence: { recordA: A.confidence, recordB: B.confidence },
      proposalA: { proposalId: proposalIdOf(A.recordId), metaTitle: A.proposedMetaTitle, metaDescription: A.proposedMetaDescription },
      proposalB: { proposalId: proposalIdOf(B.recordId), metaTitle: B.proposedMetaTitle, metaDescription: B.proposedMetaDescription },
      relationship: relationshipOf(A, B, pair.sharedScientificName, isGeneric),
      reason: caseReason(pair),
      overlap: pair.overlap,
      titleSimilarity: pair.titleSimilarity,
      descriptionSimilarity: pair.descriptionSimilarity,
      sharedScientificName: !!pair.sharedScientificName,
      classification: cls.classification,
      classificationReason: cls.reason,
      finalDisposition: disposition,
      highRowsImplicated: highInvolved,
      note: highInvolved.length === 0 ? 'No row of this case belongs to the original HIGH 120; involved rows remain HOLD/BLOCK under their original SPEC 07 status.' : undefined,
    };
  }

  const cases = casePairs.map((p, i) => makeCase(p, i + 1, 'CANN'));

  const nearDupBoth = bothPairs.map((p, i) => {
    const c = makeCase(p, i + 1, 'NDUP');
    const A = rowBy[p.a];
    const B = rowBy[p.b];
    const facts = factComparison(A.proposedMetaDescription, B.proposedMetaDescription);
    return {
      pairId: c.cannibalizationCaseId,
      recordA: { recordId: A.recordId, title: A.title },
      recordB: { recordId: B.recordId, title: B.title },
      proposedMetaTitleA: A.proposedMetaTitle,
      proposedMetaTitleB: B.proposedMetaTitle,
      proposedMetaDescriptionA: A.proposedMetaDescription,
      proposedMetaDescriptionB: B.proposedMetaDescription,
      titleSimilarity: p.titleSimilarity,
      descriptionSimilarity: p.descriptionSimilarity,
      sharedFactualSignals: facts.shared,
      sharedScientificName: !!p.sharedScientificName,
      relationship: c.relationship,
      originalConfidenceA: A.confidence,
      originalConfidenceB: B.confidence,
      originalReasonCodeA: A.reasonCode,
      originalReasonCodeB: B.reasonCode,
      originalStatusA: A.confidence,
      originalStatusB: B.confidence,
      classification: c.classification,
      classificationReason: c.classificationReason,
      finalDisposition: c.finalDisposition,
      highRowsImplicated: c.highRowsImplicated,
    };
  });

  const extendedScan = [];
  let extIndex = 0;
  for (const p of nearPairs) {
    const key = [p.a, p.b].sort().join('|');
    if (caseKeySet.has(key)) continue;
    const A = rowBy[p.a];
    const B = rowBy[p.b];
    if (descriptionsInterchangeable(A.title, speciesById[p.a] ? speciesById[p.a].scientificName : '', A.proposedMetaDescription,
        B.title, speciesById[p.b] ? speciesById[p.b].scientificName : '', B.proposedMetaDescription)) {
      extIndex++;
      extendedScan.push({
        extendedCaseId: 'EXT-' + String(extIndex).padStart(3, '0'),
        recordAId: A.recordId,
        recordA: A.title,
        recordBId: B.recordId,
        recordB: B.title,
        overlap: p.overlap,
        titleSimilarity: p.titleSimilarity,
        descriptionSimilarity: p.descriptionSimilarity,
        classification: CL_DIFF,
        highRowsImplicated: [A, B].filter((r) => r.confidence === 'HIGH').map((r) => r.recordId),
      });
    }
  }

  const caseIdsByRecord = {};
  for (const c of cases) {
    caseIdsByRecord[c.recordA.recordId] = (caseIdsByRecord[c.recordA.recordId] || []).concat([c.cannibalizationCaseId]);
    caseIdsByRecord[c.recordB.recordId] = (caseIdsByRecord[c.recordB.recordId] || []).concat([c.cannibalizationCaseId]);
  }
  const caseClassById = {};
  for (const c of cases) caseClassById[c.cannibalizationCaseId] = c.classification;
  const extendedIdsByRecord = {};
  for (const e of extendedScan) {
    extendedIdsByRecord[e.recordAId] = (extendedIdsByRecord[e.recordAId] || []).concat([e.extendedCaseId]);
    extendedIdsByRecord[e.recordBId] = (extendedIdsByRecord[e.recordBId] || []).concat([e.extendedCaseId]);
  }

  const famDef = cann.identityLevel.exactDuplicateScientificNames;
  const sharedSciRecords = [];
  const sharedSciFamilies = [];
  for (const fam of famDef.families) {
    const memberCaseIds = new Set();
    let genericPresent = false;
    let differentiatePresent = false;
    const members = [];
    for (const m of fam.members) {
      const row = rowBy[m.recordId];
      const liveRec = speciesById[m.recordId];
      const cIds = (caseIdsByRecord[m.recordId] || []).slice();
      const inGeneric = genericPairsDef.some((gp) => gp.genericRecord.recordId === m.recordId || gp.specificRecord.recordId === m.recordId);
      const inDiff = cIds.some((id) => caseClassById[id] === CL_DIFF);
      let determination;
      if (inGeneric) determination = DET_BLOCK;
      else if (inDiff) determination = DET_DIFFERENTIATE;
      else determination = DET_LEGIT;
      if (inGeneric) genericPresent = true;
      if (determination === DET_DIFFERENTIATE) differentiatePresent = true;
      cIds.forEach((x) => memberCaseIds.add(x));
      const relatedGenericVariants = genericPairsDef
        .filter((gp) => gp.genericRecord.recordId === m.recordId || gp.specificRecord.recordId === m.recordId)
        .map((gp) => (gp.genericRecord.recordId === m.recordId ? gp.specificRecord.name : gp.genericRecord.name));
      sharedSciRecords.push({
        scientificName: fam.scientificName,
        familySize: fam.size,
        recordId: m.recordId,
        title: row.title,
        slug: row.slug,
        contentSignals: liveRec ? L.contentSignals(liveRec) : row.contentSignals,
        excerptLength: liveRec && L.has(liveRec.excerpt) ? String(liveRec.excerpt).trim().length : 0,
        excerpt: liveRec && L.has(liveRec.excerpt) ? String(liveRec.excerpt).trim() : '',
        proposedMetaTitle: row.proposedMetaTitle,
        proposedMetaDescription: row.proposedMetaDescription,
        originalConfidence: row.confidence,
        originalStatus: row.mutationStatus,
        originalReasonCode: row.reasonCode,
        inHigh120: row.confidence === 'HIGH',
        relatedGenericVariants: relatedGenericVariants,
        parentSpecies: row.parentSpecies || null,
        determination: determination,
        determinationReason: determination === DET_BLOCK
          ? 'Record participates in an unresolved generic-vs-specific naming pair; generic query ownership cannot be established from canonical evidence.'
          : (determination === DET_DIFFERENTIATE
            ? 'Record participates in a case whose proposed descriptions are interchangeable modulo entity name; metadata must be differentiated before mutation eligibility (row remains HOLD under its original SPEC 07 status).'
            : 'Legitimate canonical sibling with distinct name, slug and non-interchangeable factual claims; shared care-intent template is acceptable.'),
        caseIds: cIds,
      });
      members.push({ recordId: m.recordId, name: m.name, slug: row.slug, confidence: row.confidence, reasonCode: row.reasonCode, determination: determination });
    }
    let familyDetermination;
    if (genericPresent) familyDetermination = DET_BLOCK;
    else if (differentiatePresent) familyDetermination = DET_DIFFERENTIATE;
    else familyDetermination = DET_LEGIT;
    sharedSciFamilies.push({
      scientificName: fam.scientificName,
      size: fam.size,
      familyDetermination: familyDetermination,
      determinationReason: familyDetermination === DET_BLOCK
        ? 'Family contains an unresolved generic-vs-specific pair; ownership requires editorial/external evidence not available in SPEC 07C.'
        : (familyDetermination === DET_DIFFERENTIATE
          ? 'Family members are legitimate siblings, but at least one member pair has interchangeable proposed descriptions and requires metadata differentiation.'
          : 'All members are legitimate canonical siblings sharing a care-intent template with sufficiently differentiated metadata.'),
      nearDupCaseIds: Array.from(memberCaseIds).sort(),
      inHigh120: fam.members.filter((m) => m.confidence === 'HIGH').length,
      genericPairPresent: genericPresent,
      members: members,
    });
  }
  sharedSciRecords.sort((a, b) => a.recordId.localeCompare(b.recordId));
  sharedSciFamilies.sort((a, b) => a.scientificName.localeCompare(b.scientificName));

  const genericPairs = genericPairsDef.map((gp, i) => {
    const gRec = speciesById[gp.genericRecord.recordId];
    const sRec = speciesById[gp.specificRecord.recordId];
    const gRow = rowBy[gp.genericRecord.recordId];
    const sRow = rowBy[gp.specificRecord.recordId];
    const sciSlug = slugNorm(gp.scientificName);
    const gAliases = gRec && Array.isArray(gRec.aliases) ? gRec.aliases : [];
    const sAliases = sRec && Array.isArray(sRec.aliases) ? sRec.aliases : [];
    const gParent = gRec && gRec.parentSpecies ? (gRec.parentSpecies._ref || gRec.parentSpecies) : null;
    const sParent = sRec && sRec.parentSpecies ? (sRec.parentSpecies._ref || sRec.parentSpecies) : null;
    return {
      pairId: 'GS-' + String(i + 1).padStart(3, '0'),
      scientificName: gp.scientificName,
      genericRecord: genericRecordView(gRow, gRec, gAliases, gParent),
      specificRecord: genericRecordView(sRow, sRec, sAliases, sParent),
      ownershipEvidence: {
        sharedScientificName: true,
        parentLinkGenericToSpecific: gParent === sRow.recordId,
        parentLinkSpecificToGeneric: sParent === gRow.recordId,
        aliasesOfGenericMentionSpecific: gAliases.some((a) => L.normalize(a) === L.normalize(sRow.title)),
        aliasesOfSpecificMentionGeneric: sAliases.some((a) => L.normalize(a) === L.normalize(gRow.title)),
        genericSlugEqualsScientificNameSlug: L.slugValue(gRow.slug) === sciSlug,
        specificSlugEqualsScientificNameSlug: L.slugValue(sRow.slug) === sciSlug,
        canonicalOwnerDesignationFieldExists: false,
        externalKeywordDataUsed: false,
      },
      verdict: gp.verdict,
      classification: CL_GENERIC,
      finalDisposition: 'GENERIC_ROW_REMAINS_BLOCKED / SPECIFIC_ROW_REMAINS_HOLD - no row of this pair belongs to the original HIGH 120',
      highRowsInvolved: [gRow, sRow].filter((r) => r.confidence === 'HIGH').map((r) => r.recordId),
      note: 'Generic query ownership cannot be established from canonical evidence (no ownership field in schema, no alias/parent designation, no SPEC 07 keyword data). Per SPEC 07C rule 18 the generic page is not assigned ownership by title breadth. No promotion performed.',
    };
  });

  const normalizedTitleCount = {};
  const normalizedDescCount = {};
  for (const r of rows) {
    const nt = L.normalize(r.proposedMetaTitle);
    const nd = L.normalize(r.proposedMetaDescription);
    normalizedTitleCount[nt] = (normalizedTitleCount[nt] || 0) + 1;
    normalizedDescCount[nd] = (normalizedDescCount[nd] || 0) + 1;
  }

  function qualityIssues(row) {
    const issues = [];
    const t = row.proposedMetaTitle;
    const d = row.proposedMetaDescription;
    if (t.length < 38 || t.length > 65) issues.push('metaTitle length ' + t.length + ' outside 38-65');
    if (d.length < 142 || d.length > 160) issues.push('metaDescription length ' + d.length + ' outside 142-160');
    if (L.scanBanned(t).length) issues.push('banned pattern in metaTitle');
    if (L.scanBanned(d).length) issues.push('banned pattern in metaDescription');
    const ts = titleStuffing(t);
    const ds = descStuffing(d);
    if (ts.length) issues.push('keyword stuffing in metaTitle: ' + ts.join('|'));
    if (ds.length) issues.push('keyword stuffing in metaDescription: ' + ds.join('|'));
    const liveRec = speciesById[row.recordId];
    if (liveRec) {
      if (!t.startsWith(liveRec.name)) issues.push('metaTitle not anchored to live record name');
      if (!d.startsWith(liveRec.name)) issues.push('metaDescription not anchored to live record name');
    }
    if (normalizedTitleCount[L.normalize(t)] > 1) issues.push('exact duplicate proposed metaTitle across proposals');
    if (normalizedDescCount[L.normalize(d)] > 1) issues.push('exact duplicate proposed metaDescription across proposals');
    if (row.focusKeyword !== null || row.secondaryKeywords !== null) issues.push('unsupported SEO field proposed');
    return issues;
  }

  const finalRows = [];
  const excludedRows = [];
  const freezeRecords = [];
  const highAccounting = { finalMutationReady: 0, excluded: 0, byExclusionStatus: {} };
  for (const status of [ST_CANNIBALIZATION, ST_METADATA_DUP, ST_GENERIC, ST_IDENTITY, ST_OTHER]) highAccounting.byExclusionStatus[status] = 0;

  for (const row of highRows) {
    const cIds = (caseIdsByRecord[row.recordId] || []).slice().sort();
    const classes = cIds.map((id) => caseClassById[id]);
    const extIds = (extendedIdsByRecord[row.recordId] || []).slice().sort();
    const liveRec = speciesById[row.recordId];
    let finalStatus = ST_READY;
    let finalReason = '';
    let exclusionStatus = null;
    let exclusionReason = null;

    const driftIssue = driftIds.indexOf(row.recordId) >= 0 ? 'RECOMPUTE_MISMATCH (proposal no longer reproduces from current canonical data)' : null;
    const seoDrift = liveRec && liveRec.seo && (liveRec.seo.metaTitle !== undefined || liveRec.seo.metaDescription !== undefined) ? 'SEO_DRIFT (seo object now populated)' : null;

    if (driftIssue || seoDrift) {
      finalStatus = ST_OTHER;
      exclusionStatus = ST_OTHER;
      finalReason = 'Re-evaluation required: ' + (driftIssue || seoDrift) + '; row excluded from FINAL_MUTATION_READY until re-evaluated against current canonical data (SPEC 07C rule 13/14).';
      exclusionReason = finalReason;
    } else if (classes.indexOf(CL_IDENTITY) >= 0) {
      finalStatus = ST_IDENTITY;
      exclusionStatus = ST_IDENTITY;
      finalReason = 'Case ' + cIds.filter((id) => caseClassById[id] === CL_IDENTITY).join(', ') + ' classified TRUE_IDENTITY_CONFLICT; identity conflict must not be repaired in SPEC 07C, so the SEO mutation is excluded.';
      exclusionReason = finalReason;
    } else if (classes.indexOf(CL_GENERIC) >= 0) {
      finalStatus = ST_GENERIC;
      exclusionStatus = ST_GENERIC;
      finalReason = 'Case ' + cIds.filter((id) => caseClassById[id] === CL_GENERIC).join(', ') + ' classified BLOCK_GENERIC_OWNERSHIP; generic query ownership unresolved from canonical evidence, row excluded.';
      exclusionReason = finalReason;
    } else if (classes.indexOf(CL_DIFF) >= 0 || extIds.length > 0) {
      finalStatus = ST_METADATA_DUP;
      exclusionStatus = ST_METADATA_DUP;
      const involved = cIds.filter((id) => caseClassById[id] === CL_DIFF);
      const counterpart = involved.length
        ? cases.filter((c) => involved.indexOf(c.cannibalizationCaseId) >= 0).map((c) => (c.recordA.recordId === row.recordId ? c.recordB.title : c.recordA.title))
        : [];
      finalReason = (involved.length
        ? 'Proposed metaDescription is interchangeable with "' + counterpart.join('", "') + '" modulo the entity name (' + involved.join(', ') + ').'
        : 'Extended near-duplicate scan (' + extIds.join(', ') + '): proposed metaDescription interchangeable with counterpart modulo entity name.') +
        ' Metadata must be differentiated by editorial before mutation eligibility; SPEC 07C does not rewrite proposals (rule 15).';
      exclusionReason = finalReason;
    } else {
      const issues = qualityIssues(row);
      if (issues.length) {
        finalStatus = ST_METADATA_DUP;
        exclusionStatus = ST_METADATA_DUP;
        finalReason = 'SEO quality gate failed; proposal requires rewriting before mutation eligibility: ' + issues.join('; ');
        exclusionReason = finalReason;
      }
    }

    if (finalStatus === ST_READY) {
      finalReason = cIds.length
        ? 'Reconciled ' + cIds.length + ' potential cannibalization case(s) (' + cIds.join(', ') + ') as SAFE_SHARED_INTENT: distinct canonical records, entity-anchored metadata, non-interchangeable factual claims. Live recompute matches SPEC 07 proposal (no drift); SEO quality gate passed.'
        : 'No potential-cannibalization case involvement (SPEC 07 distinctness flag: ' + (row.distinctnessFlag || 'none') + ', template overlap assessed as expected for distinct records). Live recompute matches SPEC 07 proposal (no drift); SEO quality gate passed.';
    }

    const cannStatus = cIds.length
      ? (classes.indexOf(CL_DIFF) >= 0 ? CL_DIFF : CL_SAFE)
      : 'NO_CANNIBALIZATION_SIGNAL';

    const base = {
      proposalId: proposalIdOf(row.recordId),
      recordId: row.recordId,
      title: row.title,
      slug: row.slug,
      scientificName: liveRec ? liveRec.scientificName : null,
      searchIntent: row.searchIntent,
      originalStatus: row.confidence,
      originalConfidence: row.confidence,
      originalMutationStatus: row.mutationStatus,
      originalReasonCode: row.reasonCode,
      proposedMetaTitle: row.proposedMetaTitle,
      proposedMetaDescription: row.proposedMetaDescription,
      cannibalizationStatus: cannStatus,
      cannibalizationCaseIds: cIds,
      finalStatus: finalStatus,
      finalReason: finalReason,
      currentRevision: liveRec ? liveRec._rev : null,
      currentMetaTitle: liveRec && liveRec.seo ? (liveRec.seo.metaTitle !== undefined ? liveRec.seo.metaTitle : null) : null,
      currentMetaDescription: liveRec && liveRec.seo ? (liveRec.seo.metaDescription !== undefined ? liveRec.seo.metaDescription : null) : null,
    };

    if (finalStatus === ST_READY) {
      finalRows.push(Object.assign({}, base, {
        expectedRev: base.currentRevision,
        expectedCurrentMetaTitle: base.currentMetaTitle,
        expectedCurrentMetaDescription: base.currentMetaDescription,
        approvedTargetMetaTitle: row.proposedMetaTitle,
        approvedTargetMetaDescription: row.proposedMetaDescription,
      }));
      freezeRecords.push({
        proposalId: base.proposalId,
        recordId: base.recordId,
        expectedRev: base.currentRevision,
        currentMetaTitle: base.currentMetaTitle,
        currentMetaDescription: base.currentMetaDescription,
        approvedTargetMetaTitle: row.proposedMetaTitle,
        approvedTargetMetaDescription: row.proposedMetaDescription,
        revisionDrift: false,
        contentDrift: false,
        recomputeMatch: true,
        seoObjectAbsent: base.currentMetaTitle === null && base.currentMetaDescription === null,
      });
      highAccounting.finalMutationReady++;
    } else {
      excludedRows.push(Object.assign({}, base, {
        exclusionStatus: exclusionStatus,
        exclusionReason: exclusionReason,
        relatedCannibalizationCaseIds: cIds,
        extendedScanCaseIds: extIds,
      }));
      highAccounting.excluded++;
      highAccounting.byExclusionStatus[exclusionStatus]++;
    }
  }

  finalRows.sort((a, b) => a.recordId.localeCompare(b.recordId));
  excludedRows.sort((a, b) => a.recordId.localeCompare(b.recordId));
  freezeRecords.sort((a, b) => a.recordId.localeCompare(b.recordId));
  cases.sort((a, b) => a.cannibalizationCaseId.localeCompare(b.cannibalizationCaseId));
  nearDupBoth.sort((a, b) => a.pairId.localeCompare(b.pairId));

  const highIdSet = new Set(highRows.map((r) => r.recordId));
  const finalIdSet = new Set(finalRows.map((r) => r.recordId));
  const excludedIdSet = new Set(excludedRows.map((r) => r.recordId));
  let overlapIds = 0;
  for (const id of finalIdSet) if (excludedIdSet.has(id)) overlapIds++;
  let unionSize = 0;
  for (const id of highIdSet) if (finalIdSet.has(id) || excludedIdSet.has(id)) unionSize++;

  const unclassifiedCases = cases.filter((c) => CLASSIFICATIONS.indexOf(c.classification) < 0 || !c.finalDisposition).length;
  const unclassifiedNear = nearDupBoth.filter((p) => CLASSIFICATIONS.indexOf(p.classification) < 0).length;
  const badDeterminationRecords = sharedSciRecords.filter((r) => DETERMINATIONS.indexOf(r.determination) < 0).length;
  const badDeterminationFamilies = sharedSciFamilies.filter((f) => DETERMINATIONS.indexOf(f.familyDetermination) < 0).length;

  g('C-01', 'GATE C potential cannibalization = 16 reconciled: every case has exactly one classification and one explicit final disposition (unclassified = 0)',
    cases.length === 16 && unclassifiedCases === 0,
    'cases=' + cases.length + ' unclassified=' + unclassifiedCases);
  g('C-02', 'GATE C NEAR_DUP_BOTH = 15 inspected and classified',
    bothPairs.length === 15 && nearDupBoth.length === 15 && unclassifiedNear === 0,
    'pairs=' + nearDupBoth.length + ' unclassified=' + unclassifiedNear);
  g('C-03', 'GATE C shared scientificName records = 14 inspected (record-level determination recorded for each)',
    sharedSciRecords.length === 14 && badDeterminationRecords === 0,
    'records=' + sharedSciRecords.length + ' badDeterminations=' + badDeterminationRecords);
  g('C-04', 'GATE C shared scientificName families = 4 inspected (family-level determination recorded for each)',
    sharedSciFamilies.length === 4 && badDeterminationFamilies === 0,
    'families=' + sharedSciFamilies.length + ' badDeterminations=' + badDeterminationFamilies);
  g('C-05', 'GATE C generic-vs-specific pairs = 3 inspected with ownership verdicts (no HIGH row involved)',
    genericPairs.length === 3 && genericPairs.every((p) => p.highRowsInvolved.length === 0),
    'pairs=' + genericPairs.length + ' highRowsInvolved=' + genericPairs.reduce((n, p) => n + p.highRowsInvolved.length, 0));
  g('C-06', 'GATE C classification values are from the allowed enum only (SAFE_SHARED_INTENT / DIFFERENTIATE_METADATA / BLOCK_GENERIC_OWNERSHIP / TRUE_IDENTITY_CONFLICT)',
    cases.every((c) => CLASSIFICATIONS.indexOf(c.classification) >= 0) && nearDupBoth.every((p) => CLASSIFICATIONS.indexOf(p.classification) >= 0),
    'enumValid=true');
  g('C-07', 'GATE C extended near-dup scan: every near-duplicate pair outside the 16 primary cases checked for descriptions interchangeable modulo entity name (findings applied under rule 15, never promoted)',
    extendedScan.every((e) => CLASSIFICATIONS.indexOf(e.classification) >= 0),
    'extendedFindings=' + extendedScan.length + (extendedScan.length ? ' ids=' + extendedScan.map((e) => e.extendedCaseId).join(',') : ''));
  g('C-08', 'GATE C case derivation matches SPEC 07 formula (near pairs where sharedScientificName OR overlap=NEAR_DUP_BOTH)',
    casePairs.length === 16 && cases.length === 16,
    'derived=' + casePairs.length);

  g('D-01', 'GATE D HIGH accounting: 120 original HIGH = FINAL_MUTATION_READY (' + finalRows.length + ') + excluded HIGH (' + excludedRows.length + ')',
    highRows.length === 120 && finalRows.length + excludedRows.length === 120,
    'final=' + finalRows.length + ' excluded=' + excludedRows.length + ' sum=' + (finalRows.length + excludedRows.length));
  g('D-02', 'GATE D every excluded HIGH row carries an allowed exclusion status and a concrete reason',
    excludedRows.every((r) => FINAL_STATUSES.indexOf(r.exclusionStatus) >= 0 && r.exclusionStatus !== ST_READY && r.exclusionReason && r.exclusionReason.length > 0),
    'excluded=' + excludedRows.length);
  g('D-03', 'GATE D no unexplained rows: final and excluded sets are disjoint and their union equals the original HIGH id set',
    overlapIds === 0 && unionSize === 120,
    'overlap=' + overlapIds + ' union=' + unionSize);
  g('D-04', 'GATE D no promotion from MEDIUM/BLOCKED: every final row has originalConfidence=HIGH, originalStatus=HIGH, originalMutationStatus=MUTATION_READY; zero MEDIUM or BLOCKED record ids appear',
    finalRows.every((r) => r.originalConfidence === 'HIGH' && r.originalStatus === 'HIGH' && r.originalMutationStatus === 'MUTATION_READY') &&
    finalRows.every((r) => highIdSet.has(r.recordId)) &&
    excludedRows.every((r) => highIdSet.has(r.recordId)),
    'final=' + finalRows.length + ' excluded=' + excludedRows.length);

  let freezeMissing = 0;
  for (const f of freezeRecords) {
    if (!f.expectedRev || !f.recordId || !f.proposalId || f.approvedTargetMetaTitle === undefined || f.approvedTargetMetaDescription === undefined) freezeMissing++;
  }
  g('E-01', 'GATE E revision freeze: every FINAL_MUTATION_READY record exists live, is type species, has current _rev captured, current values captured and proposal values captured',
    finalRows.every((r) => speciesById[r.recordId] && speciesById[r.recordId]._type === 'species' && r.currentRevision && r.currentMetaTitle === null && r.currentMetaDescription === null && r.approvedTargetMetaTitle && r.approvedTargetMetaDescription),
    'rows=' + finalRows.length);
  g('E-02', 'GATE E no revision drift: live _rev equals SPEC 05/06C baseline for all 218 species, SPEC 07 manifest fingerprints match for all 6 wiki types, and independent proposal recompute mismatches = 0',
    revBaselineDiff === 0 && fingerprintMatches && driftIds.length === 0,
    'revBaselineDiff=' + revBaselineDiff + ' fingerprintMatches=' + fingerprintMatches + ' recomputeMismatch=' + driftIds.length);
  g('E-03', 'GATE E freeze integrity: freeze record count equals FINAL_MUTATION_READY count and every freeze row is complete',
    freezeRecords.length === finalRows.length && freezeMissing === 0,
    'freeze=' + freezeRecords.length + ' missing=' + freezeMissing);
  g('E-04', 'GATE E drift detection: zero title/slug/scientificName/content/SEO/taxonomy/relationship drift since SPEC 05/06C baselines (content-based, machine fields excluded); relatedPosts confined to the 22 SPEC 06C docs',
    added === 0 && removed === 0 && nonRelChanged === 0 && seoDiff === 0 && post06cDrift === 0 && titleDiffs.length === 0 && slugDiffs.length === 0 && sciDiffs.length === 0 && bodyDiffs.length === 0 && taxonomyDiffs.length === 0 && relFieldDiffs.length === 0,
    'added=' + added + ' removed=' + removed + ' nonRelChanged=' + nonRelChanged + ' seoDiff=' + seoDiff + ' post06cDrift=' + post06cDrift +
    ' title=' + titleDiffs.length + ' slug=' + slugDiffs.length + ' sci=' + sciDiffs.length + ' body=' + bodyDiffs.length + ' taxonomy=' + taxonomyDiffs.length + ' relFields=' + relFieldDiffs.length);
  g('E-05', 'GATE E SEO still absent: 0 of 218 species carry a populated seo object (freeze current values are genuinely null)',
    speciesWithSeo === 0 && finalRows.every((r) => r.currentMetaTitle === null && r.currentMetaDescription === null),
    'speciesWithSeo=' + speciesWithSeo);

  const finalTitleLens = finalRows.map((r) => r.approvedTargetMetaTitle.length);
  const finalDescLens = finalRows.map((r) => r.approvedTargetMetaDescription.length);
  const bannedFinal = finalRows.filter((r) => L.scanBanned(r.approvedTargetMetaTitle).length || L.scanBanned(r.approvedTargetMetaDescription).length);
  const stuffingFinal = finalRows.filter((r) => titleStuffing(r.approvedTargetMetaTitle).length || descStuffing(r.approvedTargetMetaDescription).length);
  const anchorViolations = finalRows.filter((r) => {
    const liveRec = speciesById[r.recordId];
    return !liveRec || !r.approvedTargetMetaTitle.startsWith(liveRec.name) || !r.approvedTargetMetaDescription.startsWith(liveRec.name);
  });
  const recomputeViolations = finalRows.filter((r) => driftIds.indexOf(r.recordId) >= 0);
  const exactTitleDups = finalRows.filter((r) => normalizedTitleCount[L.normalize(r.approvedTargetMetaTitle)] > 1);
  const exactDescDups = finalRows.filter((r) => normalizedDescCount[L.normalize(r.approvedTargetMetaDescription)] > 1);
  const allPlanTitleDupGroups = Object.keys(normalizedTitleCount).filter((k) => normalizedTitleCount[k] > 1).length;
  const allPlanDescDupGroups = Object.keys(normalizedDescCount).filter((k) => normalizedDescCount[k] > 1).length;
  const unsupportedFields = rows.filter((r) => r.focusKeyword !== null || r.secondaryKeywords !== null);
  const finalIntentDist = {};
  for (const r of finalRows) finalIntentDist[r.searchIntent] = (finalIntentDist[r.searchIntent] || 0) + 1;
  const nearDupReconciled = cases.length === 16 && nearDupBoth.length === 15 && unclassifiedCases === 0 && unclassifiedNear === 0;

  g('F-01', 'GATE F SEO quality: every FINAL_MUTATION_READY metaTitle length 38-65 (min=' + (finalTitleLens.length ? Math.min.apply(null, finalTitleLens) : 0) + ' max=' + (finalTitleLens.length ? Math.max.apply(null, finalTitleLens) : 0) + ')',
    finalTitleLens.every((n) => n >= 38 && n <= 65),
    'rows=' + finalRows.length);
  g('F-02', 'GATE F SEO quality: every FINAL_MUTATION_READY metaDescription length 142-160 (min=' + (finalDescLens.length ? Math.min.apply(null, finalDescLens) : 0) + ' max=' + (finalDescLens.length ? Math.max.apply(null, finalDescLens) : 0) + ')',
    finalDescLens.every((n) => n >= 142 && n <= 160),
    'rows=' + finalRows.length);
  g('F-03', 'GATE F banned patterns (Best/Ultimate/Complete guide/Everything you need/Top N/#1/year) = 0 across FINAL_MUTATION_READY titles and descriptions',
    bannedFinal.length === 0,
    'violations=' + bannedFinal.length);
  g('F-04', 'GATE F keyword stuffing = 0 (no token repeated >2x in titles, >3x in descriptions)',
    stuffingFinal.length === 0,
    'violations=' + stuffingFinal.length);
  g('F-05', 'GATE F fact consistency and species identity: independent recompute from live canonical data reproduces every FINAL_MUTATION_READY proposal exactly (0 unsupported claims / 0 fabricated facts), and every title/description is anchored to the live record name',
    recomputeViolations.length === 0 && anchorViolations.length === 0,
    'recomputeViolations=' + recomputeViolations.length + ' anchorViolations=' + anchorViolations.length);
  g('F-06', 'GATE F exact duplicate proposed titles = 0 (within FINAL_MUTATION_READY and across all 218 proposals)',
    exactTitleDups.length === 0 && allPlanTitleDupGroups === 0,
    'finalDups=' + exactTitleDups.length + ' planDupGroups=' + allPlanTitleDupGroups);
  g('F-07', 'GATE F exact duplicate proposed descriptions = 0 (within FINAL_MUTATION_READY and across all 218 proposals)',
    exactDescDups.length === 0 && allPlanDescDupGroups === 0,
    'finalDups=' + exactDescDups.length + ' planDupGroups=' + allPlanDescDupGroups);
  g('F-08', 'GATE F near-duplicate cases have explicit reconciliation (16/16 cases classified, 15/15 NEAR_DUP_BOTH classified)',
    nearDupReconciled,
    'cases=' + cases.length + ' both=' + nearDupBoth.length);
  g('F-09', 'GATE F no unsupported SEO fields proposed (focusKeyword/secondaryKeywords absent from schema remain null in all 218 rows)',
    unsupportedFields.length === 0,
    'violations=' + unsupportedFields.length);
  g('F-10', 'GATE F search intent preserved: FINAL_MUTATION_READY rows carry their original SPEC 07 intent and the overall 218-row distribution is unchanged',
    intentMatchesExpected && finalRows.every((r) => rowBy[r.recordId] && rowBy[r.recordId].searchIntent === r.searchIntent),
    JSON.stringify(finalIntentDist));

  g('G-01', 'GATE G canonical mutations = 0 (identity hash unchanged, 0 added/removed, 0 non-relatedPosts content changes vs SPEC 05, relatedPosts drift confined to the 22 SPEC 06C docs, 0 drift vs SPEC 06C snapshot)',
    hash === L.EXPECTED_HASH && added === 0 && removed === 0 && nonRelChanged === 0 && seoDiff === 0 && relChangedDocs === 22 && post06cDrift === 0,
    'hash=' + hash + ' added=' + added + ' removed=' + removed + ' nonRelChanged=' + nonRelChanged + ' seoDiff=' + seoDiff + ' relChangedDocs=' + relChangedDocs + ' post06cDrift=' + post06cDrift);
  g('G-02', 'GATE G SEO mutations = 0 (0 of 218 species have a populated seo object; seo field byte-identical to SPEC 05 baseline)',
    speciesWithSeo === 0 && seoDiff === 0,
    'speciesWithSeo=' + speciesWithSeo + ' seoDiff=' + seoDiff);
  g('G-04', 'GATE G identity/title/slug/body/taxonomy changes = 0 vs SPEC 05 baseline',
    titleDiffs.length === 0 && slugDiffs.length === 0 && sciDiffs.length === 0 && bodyDiffs.length === 0 && taxonomyDiffs.length === 0,
    'title=' + titleDiffs.length + ' slug=' + slugDiffs.length + ' sci=' + sciDiffs.length + ' body=' + bodyDiffs.length + ' taxonomy=' + taxonomyDiffs.length);
  g('G-05', 'GATE G relationship changes = 0 outside the 22 authorized SPEC 06C relatedPosts documents (relatedPosts changed exactly 22 docs; parentSpecies/compatibleSpecies/relatedProblems untouched)',
    relChangedDocs === 22 && relFieldDiffs.length === 0,
    'relatedPostsChangedDocs=' + relChangedDocs + ' otherRelationshipFieldDiffs=' + relFieldDiffs.length);
  g('G-06', 'GATE G schema changes = 0 (sanity/schemaTypes/species.ts sha256 matches SPEC 07 schema audit fingerprint)',
    speciesSchemaSha === schemaAudit.speciesSchemaSha256,
    'sha256=' + speciesSchemaSha);
  g('G-07', 'GATE G SPEC 07 manifest fingerprints still match for all 6 wiki types (byte-level read verification)',
    fingerprintMatches,
    'matches=' + Object.keys(fingerprints).filter((t) => fingerprints[t].matchesSpec07Manifest).length + '/6');

  const classificationBreakdown = {};
  for (const c of cases) classificationBreakdown[c.classification] = (classificationBreakdown[c.classification] || 0) + 1;
  const dispositionBreakdown = {};
  for (const c of cases) dispositionBreakdown[c.finalDisposition] = (dispositionBreakdown[c.finalDisposition] || 0) + 1;
  const nearBreakdown = {};
  for (const p of nearDupBoth) nearBreakdown[p.classification] = (nearBreakdown[p.classification] || 0) + 1;

  return {
    gates: gates,
    cases: cases,
    nearDupBoth: nearDupBoth,
    sharedSci: { families: sharedSciFamilies, records: sharedSciRecords },
    generic: genericPairs,
    finalRows: finalRows,
    excludedRows: excludedRows,
    freeze: freezeRecords,
    extendedScan: extendedScan,
    summary: {
      typeCounts: counts,
      canonicalCount: total,
      canonicalHash: hash,
      originalHigh: highRows.length,
      originalMedium: mediumRows.length,
      originalBlocked: blockedRows.length,
      finalMutationReady: finalRows.length,
      excluded: excludedRows.length,
      highAccounting: highAccounting,
      potentialCases: cases.length,
      nearDupBothCount: nearDupBoth.length,
      sharedSciFamiliesCount: sharedSciFamilies.length,
      sharedSciRecordsCount: sharedSciRecords.length,
      genericPairsCount: genericPairs.length,
      classificationBreakdown: classificationBreakdown,
      dispositionBreakdown: dispositionBreakdown,
      nearDupBreakdown: nearBreakdown,
      intentDistribution: intentDist,
      finalIntentDistribution: finalIntentDist,
      drift: {
        added: added, removed: removed, nonRelatedPostsChanged: nonRelChanged, seoDiff: seoDiff,
        relatedPostsChangedDocs: relChangedDocs, post06cDrift: post06cDrift, revBaselineDiff: revBaselineDiff,
        recomputeMismatch: driftIds.length, speciesWithSeo: speciesWithSeo,
        titleDiffs: titleDiffs.length, slugDiffs: slugDiffs.length, sciDiffs: sciDiffs.length,
        bodyDiffs: bodyDiffs.length, taxonomyDiffs: taxonomyDiffs.length, relationshipFieldDiffs: relFieldDiffs.length,
        fingerprintMatches: fingerprintMatches,
      },
      quality: {
        finalTitleMin: finalTitleLens.length ? Math.min.apply(null, finalTitleLens) : 0,
        finalTitleMax: finalTitleLens.length ? Math.max.apply(null, finalTitleLens) : 0,
        finalDescMin: finalDescLens.length ? Math.min.apply(null, finalDescLens) : 0,
        finalDescMax: finalDescLens.length ? Math.max.apply(null, finalDescLens) : 0,
        bannedViolations: bannedFinal.length,
        stuffingViolations: stuffingFinal.length,
        anchorViolations: anchorViolations.length,
        recomputeViolations: recomputeViolations.length,
        exactDupTitlesFinal: exactTitleDups.length,
        exactDupDescriptionsFinal: exactDescDups.length,
        unsupportedFieldRows: unsupportedFields.length,
      },
      fingerprints: fingerprints,
    },
  };
}

function payloadCases(a) {
  return {
    spec: SPEC,
    phase: 'CANNIBALIZATION_RECONCILIATION',
    mode: MODE,
    sourceSpec: SOURCE_SPEC,
    method: 'Reconciliation of the SPEC 07 potential-cannibalization population (near pairs where sharedScientificName OR overlap=NEAR_DUP_BOTH) against the live canonical read. Classification is deterministic: identical identity -> TRUE_IDENTITY_CONFLICT; generic-name subset relation -> BLOCK_GENERIC_OWNERSHIP; proposed descriptions interchangeable modulo entity name -> DIFFERENTIATE_METADATA; otherwise SAFE_SHARED_INTENT. No external keyword data used.',
    sourcePopulation: { potentialCannibalization: 16, nearDupBoth: 15, sharedScientificNameFamilies: 4, sharedScientificNameRecords: 14, genericSpecificPairs: 3 },
    classificationRules: CLASSIFICATIONS,
    counts: {
      potentialCases: a.cases.length,
      reconciled: a.cases.filter((c) => c.classification && c.finalDisposition).length,
      unclassified: a.cases.filter((c) => !c.classification || !c.finalDisposition).length,
      byClassification: a.summary.classificationBreakdown,
      byDisposition: a.summary.dispositionBreakdown,
      highRowsImplicated: Array.from(new Set(a.cases.reduce((ids, c) => ids.concat(c.highRowsImplicated), []))).length,
      highRowsExcludedByCases: a.excludedRows.filter((r) => r.cannibalizationCaseIds.length > 0).length,
    },
    cases: a.cases,
  };
}

function payloadNearDup(a) {
  return {
    spec: SPEC,
    phase: 'NEAR_DUP_BOTH_RECONCILIATION',
    mode: MODE,
    sourceSpec: SOURCE_SPEC,
    method: 'All 15 SPEC 07 NEAR_DUP_BOTH pairs (title>=0.75 AND description>=0.80) inspected. Shared template wording across distinct records is acceptable (SAFE_SHARED_INTENT); descriptions interchangeable modulo entity name are flagged DIFFERENTIATE_METADATA and the involved HIGH rows are excluded from FINAL_MUTATION_READY without silent rewriting.',
    counts: { pairs: a.nearDupBoth.length, byClassification: a.summary.nearDupBreakdown },
    pairs: a.nearDupBoth,
  };
}

function payloadSharedSci(a) {
  return {
    spec: SPEC,
    phase: 'SHARED_SCIENTIFIC_NAME_RECONCILIATION',
    mode: MODE,
    sourceSpec: SOURCE_SPEC,
    method: 'All 4 shared-scientificName families and 14 records inspected. A shared scientific name never implies duplicate SEO intent by itself; each record and family receives a deterministic determination from the allowed enum.',
    determinations: DETERMINATIONS,
    counts: {
      families: a.sharedSci.families.length,
      records: a.sharedSci.records.length,
      inHigh120: a.sharedSci.records.filter((r) => r.inHigh120).length,
      byConfidence: a.sharedSci.records.reduce((m, r) => { m[r.originalConfidence] = (m[r.originalConfidence] || 0) + 1; return m; }, {}),
      byDetermination: a.sharedSci.records.reduce((m, r) => { m[r.determination] = (m[r.determination] || 0) + 1; return m; }, {}),
    },
    families: a.sharedSci.families,
    records: a.sharedSci.records,
  };
}

function payloadGeneric(a) {
  return {
    spec: SPEC,
    phase: 'GENERIC_SPECIFIC_RECONCILIATION',
    mode: MODE,
    sourceSpec: SOURCE_SPEC,
    method: 'The 3 generic-vs-specific pairs reconciled. Generic query ownership may not be assigned from title breadth or intuition; ownership must be supported by canonical project evidence, otherwise the pair remains BLOCKED_GENERIC_OWNERSHIP.',
    counts: { pairs: a.generic.length, highRowsInvolved: a.generic.reduce((n, p) => n + p.highRowsInvolved.length, 0) },
    pairs: a.generic,
  };
}

function payloadFinal(a) {
  return {
    spec: SPEC,
    sourceSpec: SOURCE_SPEC,
    mode: MODE,
    mutationAuthorized: false,
    originalHighCount: a.summary.originalHigh,
    finalMutationReadyCount: a.summary.finalMutationReady,
    excludedCount: a.summary.excluded,
    state: 'PENDING_PM_REVIEW',
    populationRule: 'Derived ONLY from the original SPEC 07 HIGH / MUTATION_READY population (120). No MEDIUM (85) or BLOCKED (13) row was promoted. FINAL_MUTATION_READY means eligible for PM authorization in a future GATE C; it is not authorization.',
    records: a.finalRows,
  };
}

function payloadExcluded(a) {
  return {
    spec: SPEC,
    phase: 'EXCLUDED_HIGH_ROWS',
    mode: MODE,
    sourceSpec: SOURCE_SPEC,
    counts: {
      excluded: a.summary.excluded,
      byExclusionStatus: a.summary.highAccounting.byExclusionStatus,
      accountingCheck: 'FINAL_MUTATION_READY (' + a.summary.finalMutationReady + ') + EXCLUDED_HIGH (' + a.summary.excluded + ') = 120',
    },
    records: a.excludedRows,
  };
}

function payloadFreeze(a) {
  return {
    spec: SPEC,
    phase: 'REVISION_FREEZE',
    mode: MODE,
    state: 'PENDING_PM_REVIEW',
    mutationAuthorized: false,
    method: "expectedRev captured from a fresh canonical read for every FINAL_MUTATION_READY record. A future GATE C must use optimistic concurrency: patch only when the document's current _rev equals expectedRev. SPEC 07C performed no writes; this freeze is a record, not authorization.",
    baseline: {
      canonicalHash: a.summary.canonicalHash,
      spec07ManifestFingerprintsMatch: a.summary.drift.fingerprintMatches,
      revBaselineDiffSinceSpec0506C: a.summary.drift.revBaselineDiff,
      recomputeMismatch: a.summary.drift.recomputeMismatch,
      speciesWithSeoObject: a.summary.drift.speciesWithSeo,
    },
    counts: {
      frozen: a.freeze.length,
      revisionDrift: a.freeze.filter((r) => r.revisionDrift).length,
      contentDrift: a.freeze.filter((r) => r.contentDrift).length,
      recomputeMismatch: a.freeze.filter((r) => !r.recomputeMatch).length,
    },
    records: a.freeze,
  };
}

const CASE_COLS = [
  'cannibalizationCaseId', 'recordAId', 'recordATitle', 'recordASlug', 'recordAScientificName', 'recordAConfidence', 'recordAStatus', 'recordAReasonCode', 'recordAInHigh120', 'recordAProposalId', 'recordAMetaTitle', 'recordAMetaDescription',
  'recordBId', 'recordBTitle', 'recordBSlug', 'recordBScientificName', 'recordBConfidence', 'recordBStatus', 'recordBReasonCode', 'recordBInHigh120', 'recordBProposalId', 'recordBMetaTitle', 'recordBMetaDescription',
  'relationship', 'reason', 'overlap', 'titleSimilarity', 'descriptionSimilarity', 'sharedScientificName', 'classification', 'classificationReason', 'finalDisposition', 'highRowsImplicated', 'note',
];
const caseCsvRow = (c) => ({
  cannibalizationCaseId: c.cannibalizationCaseId,
  recordAId: c.recordA.recordId, recordATitle: c.recordA.title, recordASlug: c.recordA.slug, recordAScientificName: c.recordA.scientificName,
  recordAConfidence: c.recordA.confidence, recordAStatus: c.recordA.mutationStatus, recordAReasonCode: c.recordA.reasonCode,
  recordAInHigh120: c.recordA.inHigh120, recordAProposalId: c.recordA.proposalId, recordAMetaTitle: c.recordA.proposedMetaTitle, recordAMetaDescription: c.recordA.proposedMetaDescription,
  recordBId: c.recordB.recordId, recordBTitle: c.recordB.title, recordBSlug: c.recordB.slug, recordBScientificName: c.recordB.scientificName,
  recordBConfidence: c.recordB.confidence, recordBStatus: c.recordB.mutationStatus, recordBReasonCode: c.recordB.reasonCode,
  recordBInHigh120: c.recordB.inHigh120, recordBProposalId: c.recordB.proposalId, recordBMetaTitle: c.recordB.proposedMetaTitle, recordBMetaDescription: c.recordB.proposedMetaDescription,
  relationship: c.relationship, reason: c.reason, overlap: c.overlap, titleSimilarity: c.titleSimilarity, descriptionSimilarity: c.descriptionSimilarity,
  sharedScientificName: c.sharedScientificName, classification: c.classification, classificationReason: c.classificationReason,
  finalDisposition: c.finalDisposition, highRowsImplicated: c.highRowsImplicated, note: c.note,
});

const NEARDUP_COLS = [
  'pairId', 'recordAId', 'recordATitle', 'recordBId', 'recordBTitle',
  'proposedMetaTitleA', 'proposedMetaTitleB', 'proposedMetaDescriptionA', 'proposedMetaDescriptionB',
  'titleSimilarity', 'descriptionSimilarity', 'sharedFactualSignals', 'sharedScientificName', 'relationship',
  'originalConfidenceA', 'originalConfidenceB', 'originalReasonCodeA', 'originalReasonCodeB', 'originalStatusA', 'originalStatusB',
  'classification', 'classificationReason', 'finalDisposition', 'highRowsImplicated',
];
const nearCsvRow = (p) => ({
  pairId: p.pairId, recordAId: p.recordA.recordId, recordATitle: p.recordA.title, recordBId: p.recordB.recordId, recordBTitle: p.recordB.title,
  proposedMetaTitleA: p.proposedMetaTitleA, proposedMetaTitleB: p.proposedMetaTitleB,
  proposedMetaDescriptionA: p.proposedMetaDescriptionA, proposedMetaDescriptionB: p.proposedMetaDescriptionB,
  titleSimilarity: p.titleSimilarity, descriptionSimilarity: p.descriptionSimilarity, sharedFactualSignals: p.sharedFactualSignals,
  sharedScientificName: p.sharedScientificName, relationship: p.relationship,
  originalConfidenceA: p.originalConfidenceA, originalConfidenceB: p.originalConfidenceB,
  originalReasonCodeA: p.originalReasonCodeA, originalReasonCodeB: p.originalReasonCodeB,
  originalStatusA: p.originalStatusA, originalStatusB: p.originalStatusB,
  classification: p.classification, classificationReason: p.classificationReason,
  finalDisposition: p.finalDisposition, highRowsImplicated: p.highRowsImplicated,
});

const SCINAME_COLS = [
  'scientificName', 'familySize', 'familyDetermination', 'recordId', 'title', 'slug', 'contentSignals', 'excerptLength', 'excerpt',
  'proposedMetaTitle', 'proposedMetaDescription', 'originalConfidence', 'originalStatus', 'originalReasonCode', 'inHigh120',
  'relatedGenericVariants', 'parentSpecies', 'determination', 'determinationReason', 'caseIds',
];
function scinameCsvRows(a) {
  const famBySci = {};
  for (const f of a.sharedSci.families) famBySci[f.scientificName] = f;
  return a.sharedSci.records.map((r) => ({
    scientificName: r.scientificName, familySize: r.familySize,
    familyDetermination: famBySci[r.scientificName] ? famBySci[r.scientificName].familyDetermination : '',
    recordId: r.recordId, title: r.title, slug: r.slug, contentSignals: r.contentSignals,
    excerptLength: r.excerptLength, excerpt: r.excerpt,
    proposedMetaTitle: r.proposedMetaTitle, proposedMetaDescription: r.proposedMetaDescription,
    originalConfidence: r.originalConfidence, originalStatus: r.originalStatus, originalReasonCode: r.originalReasonCode,
    inHigh120: r.inHigh120, relatedGenericVariants: r.relatedGenericVariants, parentSpecies: r.parentSpecies,
    determination: r.determination, determinationReason: r.determinationReason, caseIds: r.caseIds,
  }));
}

const GENERIC_COLS = [
  'pairId', 'scientificName',
  'genericRecordId', 'genericTitle', 'genericSlug', 'genericConfidence', 'genericStatus', 'genericReasonCode', 'genericInHigh120', 'genericMetaTitle', 'genericMetaDescription', 'genericExcerpt', 'genericContentSignals', 'genericParentSpecies', 'genericAliases',
  'specificRecordId', 'specificTitle', 'specificSlug', 'specificConfidence', 'specificStatus', 'specificReasonCode', 'specificInHigh120', 'specificMetaTitle', 'specificMetaDescription', 'specificExcerpt', 'specificContentSignals', 'specificParentSpecies', 'specificAliases',
  'sharedScientificName', 'parentLinkGenericToSpecific', 'parentLinkSpecificToGeneric', 'aliasesOfGenericMentionSpecific', 'aliasesOfSpecificMentionGeneric',
  'genericSlugEqualsScientificNameSlug', 'specificSlugEqualsScientificNameSlug', 'canonicalOwnerDesignationFieldExists', 'externalKeywordDataUsed',
  'verdict', 'classification', 'finalDisposition', 'highRowsInvolved', 'note',
];
function genericCsvRow(p) {
  const gRec = p.genericRecord;
  const sRec = p.specificRecord;
  const e = p.ownershipEvidence;
  return {
    pairId: p.pairId, scientificName: p.scientificName,
    genericRecordId: gRec.recordId, genericTitle: gRec.title, genericSlug: gRec.slug, genericConfidence: gRec.confidence, genericStatus: gRec.mutationStatus,
    genericReasonCode: gRec.reasonCode, genericInHigh120: gRec.inHigh120, genericMetaTitle: gRec.proposedMetaTitle, genericMetaDescription: gRec.proposedMetaDescription,
    genericExcerpt: gRec.excerpt, genericContentSignals: gRec.contentSignals, genericParentSpecies: gRec.parentSpecies, genericAliases: gRec.aliases,
    specificRecordId: sRec.recordId, specificTitle: sRec.title, specificSlug: sRec.slug, specificConfidence: sRec.confidence, specificStatus: sRec.mutationStatus,
    specificReasonCode: sRec.reasonCode, specificInHigh120: sRec.inHigh120, specificMetaTitle: sRec.proposedMetaTitle, specificMetaDescription: sRec.proposedMetaDescription,
    specificExcerpt: sRec.excerpt, specificContentSignals: sRec.contentSignals, specificParentSpecies: sRec.parentSpecies, specificAliases: sRec.aliases,
    sharedScientificName: e.sharedScientificName, parentLinkGenericToSpecific: e.parentLinkGenericToSpecific, parentLinkSpecificToGeneric: e.parentLinkSpecificToGeneric,
    aliasesOfGenericMentionSpecific: e.aliasesOfGenericMentionSpecific, aliasesOfSpecificMentionGeneric: e.aliasesOfSpecificMentionGeneric,
    genericSlugEqualsScientificNameSlug: e.genericSlugEqualsScientificNameSlug, specificSlugEqualsScientificNameSlug: e.specificSlugEqualsScientificNameSlug,
    canonicalOwnerDesignationFieldExists: e.canonicalOwnerDesignationFieldExists, externalKeywordDataUsed: e.externalKeywordDataUsed,
    verdict: p.verdict, classification: p.classification, finalDisposition: p.finalDisposition, highRowsInvolved: p.highRowsInvolved, note: p.note,
  };
}

const FINAL_COLS = [
  'proposalId', 'recordId', 'title', 'slug', 'scientificName', 'searchIntent',
  'originalStatus', 'originalConfidence', 'originalMutationStatus', 'originalReasonCode',
  'proposedMetaTitle', 'proposedMetaDescription',
  'cannibalizationStatus', 'cannibalizationCaseIds', 'finalStatus', 'finalReason',
  'currentRevision', 'currentMetaTitle', 'currentMetaDescription',
  'expectedRev', 'expectedCurrentMetaTitle', 'expectedCurrentMetaDescription',
  'approvedTargetMetaTitle', 'approvedTargetMetaDescription',
];

const EXCLUDED_COLS = [
  'proposalId', 'recordId', 'title', 'slug', 'scientificName', 'searchIntent',
  'originalStatus', 'originalConfidence', 'originalMutationStatus', 'originalReasonCode',
  'proposedMetaTitle', 'proposedMetaDescription',
  'cannibalizationStatus', 'cannibalizationCaseIds',
  'finalStatus', 'finalReason', 'exclusionStatus', 'exclusionReason', 'relatedCannibalizationCaseIds', 'extendedScanCaseIds',
  'currentRevision', 'currentMetaTitle', 'currentMetaDescription',
];

const renderCell = (v) => (Array.isArray(v) ? v.join('; ') : (v === null || v === undefined ? '' : String(v)));

function csvFor(cols, rows) {
  return L.toCsv(cols, rows.map((r) => {
    const o = {};
    for (const c of cols) o[c] = renderCell(r[c]);
    return o;
  }));
}

function csvCases(a) { return csvFor(CASE_COLS, a.cases.map(caseCsvRow)); }
function csvNearDup(a) { return csvFor(NEARDUP_COLS, a.nearDupBoth.map(nearCsvRow)); }
function csvSharedSci(a) { return csvFor(SCINAME_COLS, scinameCsvRows(a)); }
function csvGeneric(a) { return csvFor(GENERIC_COLS, a.generic.map(genericCsvRow)); }
function csvFinal(a) { return csvFor(FINAL_COLS, a.finalRows); }
function csvExcluded(a) { return csvFor(EXCLUDED_COLS, a.excludedRows); }

function scanWriteCapablePaths(fileTexts) {
  const patterns = [
    { name: 'mutate endpoint url', re: /data\/mutate/ },
    { name: 'mutate call', re: /\.mutate\s*\(/ },
    { name: 'POST method', re: /method:\s*'POST'/ },
    { name: 'write documents endpoint', re: /write\/documents/ },
    { name: 'patch call', re: /\.patch\s*\(/ },
    { name: 'transaction call', re: /transaction\s*\(/ },
    { name: 'create' + 'OrReplace call', re: RegExp('create' + 'OrReplace') },
    { name: 'create' + 'IfNotExists call', re: RegExp('create' + 'IfNotExists') },
    { name: 'https request write path', re: /https\.request/ },
  ];
  const hits = [];
  for (const f of fileTexts) {
    for (const p of patterns) {
      if (p.re.test(f.text)) hits.push(f.name + ':' + p.name);
    }
  }
  return { patternCount: patterns.length, fileCount: fileTexts.length, hits: hits };
}

function findApprovalTokens(value, out, pathStr) {
  if (typeof value === 'string') {
    if (APPROVAL_TOKENS.indexOf(value.toUpperCase()) >= 0) out.push(pathStr + '=' + value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => findApprovalTokens(v, out, pathStr + '[' + i + ']'));
    return;
  }
  if (value && typeof value === 'object') {
    for (const k of Object.keys(value)) findApprovalTokens(value[k], out, pathStr + '.' + k);
  }
}

module.exports = {
  SPEC, SOURCE_SPEC, MODE,
  ST_READY, ST_CANNIBALIZATION, ST_METADATA_DUP, ST_GENERIC, ST_IDENTITY, ST_OTHER, FINAL_STATUSES,
  CL_SAFE, CL_DIFF, CL_GENERIC, CL_IDENTITY, CLASSIFICATIONS,
  DETERMINATIONS, EXPECTED_INTENT_DIST, APPROVAL_TOKENS,
  proposalIdOf, strictTokenSubset, descriptionsInterchangeable, factComparison,
  titleStuffing, descStuffing, classifyPair, identityHashOf,
  buildAnalysis,
  payloadCases, payloadNearDup, payloadSharedSci, payloadGeneric, payloadFinal, payloadExcluded, payloadFreeze,
  CASE_COLS, NEARDUP_COLS, SCINAME_COLS, GENERIC_COLS, FINAL_COLS, EXCLUDED_COLS,
  caseCsvRow, nearCsvRow, scinameCsvRows, genericCsvRow,
  csvCases, csvNearDup, csvSharedSci, csvGeneric, csvFinal, csvExcluded,
  renderCell, scanWriteCapablePaths, findApprovalTokens,
};
