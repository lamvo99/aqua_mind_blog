const fs = require('fs');
const path = require('path');
const L = require('./SPEC_07_lib.js');
const C = require('./SPEC_07C_lib.js');

const OUT_DIR = path.join('report', 'SPEC_07C');
fs.mkdirSync(OUT_DIR, { recursive: true });

const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const writeJson = (name, obj) => fs.writeFileSync(path.join(OUT_DIR, name), JSON.stringify(obj, null, 2));
const writeText = (name, text) => fs.writeFileSync(path.join(OUT_DIR, name), text);

const extraGates = [];
const g = (id, name, ok, detail) => {
  extraGates.push({ id: id, name: name, pass: !!ok, detail: String(detail === undefined || detail === null ? '' : detail) });
};

(async () => {
  const live = {};
  for (const t of L.WIKI_TYPES) live[t] = await L.q('*[_type == "' + t + '" && !(_id in path("drafts.**"))]');
  const liveDrafts = await L.q('count(*[_id in path("drafts.**")])');

  const typeCounts = {};
  const typeSha256 = {};
  for (const t of L.WIKI_TYPES) {
    typeCounts[t] = live[t].length;
    typeSha256[t] = L.sha256(JSON.stringify(live[t]));
  }

  const idParts = C.identityHashOf(live);
  const speciesRevs = {};
  let speciesWithSeo = 0;
  for (const s of live.species) {
    speciesRevs[s._id] = s._rev;
    if (s.seo && (s.seo.metaTitle !== undefined || s.seo.metaDescription !== undefined)) speciesWithSeo++;
  }

  const snapshot = {
    spec: C.SPEC,
    phase: 'LIVE_SNAPSHOT',
    mode: C.MODE,
    sourceSpec: C.SOURCE_SPEC,
    projectId: 'zeohjejw',
    dataset: 'production',
    apiVersion: '2026-05-25',
    method: 'Read-only Sanity data/query GET. The snapshot stores byte fingerprints (sha256 of the JSON-serialized result) per wiki type plus every species _rev, so a future fresh fetch can be compared byte-for-byte against this frozen point.',
    queries: ['*[_type == "<wikiType>" && !(_id in path("drafts.**"))] (6 wiki types)', 'count(*[_id in path("drafts.**")])'],
    typeCounts: typeCounts,
    typeSha256: typeSha256,
    drafts: Number(liveDrafts),
    canonicalHash: idParts.hash,
    speciesWithSeoObject: speciesWithSeo,
    speciesRevs: speciesRevs,
  };
  writeJson('SPEC_07C_LIVE_SNAPSHOT.json', snapshot);

  const plan = readJson(path.join('report', 'SPEC_07', 'SPEC_07_PROPOSAL_PLAN.json'));
  const cann = readJson(path.join('report', 'SPEC_07', 'SPEC_07_CANNIBALIZATION_AUDIT.json'));
  const S05 = readJson(path.join('report', 'SPEC_05', 'SPEC_05_POST_REPAIR_SNAPSHOT.json'));
  const S06c = readJson(path.join('report', 'SPEC_06C', 'SPEC_06C_POST_MUTATION_SNAPSHOT.json'));
  const manifest = readJson(path.join('report', 'SPEC_07', 'SPEC_07_SOURCE_MANIFEST.json'));
  const schemaAudit = readJson(path.join('report', 'SPEC_07', 'SPEC_07_SCHEMA_AUDIT.json'));
  const speciesSchemaSha = L.sha256(fs.readFileSync(path.join('sanity', 'schemaTypes', 'species.ts')));

  const inputs = { live: live, liveDrafts: liveDrafts, plan: plan, cann: cann, S05: S05, S06c: S06c, manifest: manifest, schemaAudit: schemaAudit, speciesSchemaSha: speciesSchemaSha };

  const a1 = C.buildAnalysis(inputs);
  const a2 = C.buildAnalysis(inputs);
  const identical = JSON.stringify(a1) === JSON.stringify(a2);
  g('DT-01', 'DETERMINISM: reconciliation executed twice against the same live snapshot produces byte-identical analysis (same counts, record ids, classifications, final statuses, freeze records)',
    identical,
    'identical=' + identical + ' final=' + a1.summary.finalMutationReady + ' excluded=' + a1.summary.excluded + ' cases=' + a1.cases.length);

  const scanFiles = ['scripts/SPEC_07C_lib.js', 'scripts/SPEC_07C_reconcile.js', 'scripts/SPEC_07C_validate.js'];
  const fileTexts = [];
  for (const f of scanFiles) if (fs.existsSync(f)) fileTexts.push({ name: f, text: fs.readFileSync(f, 'utf8') });
  const scan = C.scanWriteCapablePaths(fileTexts);
  g('G-03', 'GATE G code scan: no write-capable code path (mutation endpoint, patch, transaction, create/replace, write endpoint, request writer) exists anywhere in the SPEC 07C scripts',
    scan.hits.length === 0,
    'patterns=' + scan.patternCount + ' files=' + scan.fileCount + ' hits=' + (scan.hits.length ? scan.hits.join(',') : '0'));

  const allGates = [];
  for (const gt of a1.gates) {
    if (gt.id === 'G-04') {
      for (const e of extraGates) if (e.id === 'G-03') allGates.push(e);
    }
    allGates.push(gt);
  }
  for (const e of extraGates) if (e.id !== 'G-03') allGates.push(e);

  for (const gt of allGates) console.log((gt.pass ? 'GATE OK  ' : 'GATE FAIL') + ' ' + gt.id + ' ' + gt.name + ' - ' + gt.detail);

  const gateResults = {
    spec: C.SPEC,
    phase: 'GATE_RESULTS_A_G',
    mode: C.MODE,
    sourceSpec: C.SOURCE_SPEC,
    state: 'PENDING_PM_REVIEW',
    mutationAuthorized: false,
    method: 'Deterministic reconciliation over a fresh read-only canonical fetch plus the frozen SPEC 07 artifacts. GATE A-G computed by buildAnalysis; G-03 is a static code scan of the SPEC 07C scripts; DT-01 is an in-process double execution.',
    determinism: {
      doubleRunByteIdentical: identical,
      finalMutationReady: a1.summary.finalMutationReady,
      excludedHigh: a1.summary.excluded,
      potentialCases: a1.cases.length,
    },
    codeScan: { patterns: scan.patternCount, files: scan.fileCount, hits: scan.hits },
    gates: allGates,
    gateStatus: allGates.every((x) => x.pass) ? 'PASS' : 'FAIL',
    summary: a1.summary,
  };
  writeJson('SPEC_07C_GATE_RESULTS_A_G.json', gateResults);

  writeJson('SPEC_07C_CANNIBALIZATION_CASES.json', C.payloadCases(a1));
  writeText('SPEC_07C_CANNIBALIZATION_CASES.csv', C.csvCases(a1));
  writeJson('SPEC_07C_NEAR_DUP_BOTH.json', C.payloadNearDup(a1));
  writeText('SPEC_07C_NEAR_DUP_BOTH.csv', C.csvNearDup(a1));
  writeJson('SPEC_07C_SHARED_SCIENTIFIC_NAME.json', C.payloadSharedSci(a1));
  writeText('SPEC_07C_SHARED_SCIENTIFIC_NAME.csv', C.csvSharedSci(a1));
  writeJson('SPEC_07C_GENERIC_SPECIFIC.json', C.payloadGeneric(a1));
  writeText('SPEC_07C_GENERIC_SPECIFIC.csv', C.csvGeneric(a1));
  writeJson('SPEC_07C_FINAL_MUTATION_READY.json', C.payloadFinal(a1));
  writeText('SPEC_07C_FINAL_MUTATION_READY.csv', C.csvFinal(a1));
  writeJson('SPEC_07C_EXCLUDED_ROWS.json', C.payloadExcluded(a1));
  writeText('SPEC_07C_EXCLUDED_ROWS.csv', C.csvExcluded(a1));
  writeJson('SPEC_07C_REVISION_FREEZE.json', C.payloadFreeze(a1));

  const failed = allGates.filter((x) => !x.pass);
  const s = a1.summary;
  console.log('');
  console.log('RECONCILIATION: ' + (allGates.length - failed.length) + '/' + allGates.length + ' ' + gateResults.gateStatus);
  console.log('original HIGH=' + s.originalHigh + ' MEDIUM=' + s.originalMedium + ' BLOCKED=' + s.originalBlocked);
  console.log('FINAL_MUTATION_READY=' + s.finalMutationReady + ' EXCLUDED_HIGH=' + s.excluded + ' sum=' + (s.finalMutationReady + s.excluded));
  console.log('excludedByStatus=' + JSON.stringify(s.highAccounting.byExclusionStatus));
  console.log('cases=' + s.potentialCases + ' nearDupBoth=' + s.nearDupBothCount + ' sharedSci=' + s.sharedSciRecordsCount + '/' + s.sharedSciFamiliesCount + ' genericPairs=' + s.genericPairsCount);
  console.log('classificationBreakdown=' + JSON.stringify(s.classificationBreakdown));
  console.log('extendedScanFindings=' + a1.extendedScan.length);
  console.log('artifacts -> report/SPEC_07C/');
  if (failed.length) {
    console.log('STOP - gate failures: ' + failed.map((x) => x.id).join(', '));
    process.exit(2);
  }
})().catch((e) => { console.error('RECONCILE ERROR:', e.stack || e.message); process.exit(1); });
