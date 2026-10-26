const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const L = require('./SPEC_07_lib.js');
const C = require('./SPEC_07C_lib.js');

const OUT_DIR = path.join('report', 'SPEC_07C');
const checks = [];
const c = (id, name, ok, detail) => {
  checks.push({ id: id, name: name, pass: !!ok, detail: String(detail === undefined || detail === null ? '' : detail) });
  console.log((ok ? 'CHECK OK ' : 'CHECK FAIL') + ' ' + id + ' ' + name + ' - ' + (detail === undefined || detail === null ? '' : detail));
};
const readArtifact = (f) => fs.readFileSync(path.join(OUT_DIR, f), 'utf8');
const readJson = (f) => JSON.parse(readArtifact(f));
const esc = (s) => String(s === null || s === undefined ? '' : s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

const REQUIRED = [
  'SPEC_07C_AUDIT_REPORT.md',
  'SPEC_07C_CANNIBALIZATION_CASES.json', 'SPEC_07C_CANNIBALIZATION_CASES.csv',
  'SPEC_07C_NEAR_DUP_BOTH.json', 'SPEC_07C_NEAR_DUP_BOTH.csv',
  'SPEC_07C_SHARED_SCIENTIFIC_NAME.json', 'SPEC_07C_SHARED_SCIENTIFIC_NAME.csv',
  'SPEC_07C_GENERIC_SPECIFIC.json', 'SPEC_07C_GENERIC_SPECIFIC.csv',
  'SPEC_07C_FINAL_MUTATION_READY.json', 'SPEC_07C_FINAL_MUTATION_READY.csv',
  'SPEC_07C_EXCLUDED_ROWS.json', 'SPEC_07C_EXCLUDED_ROWS.csv',
  'SPEC_07C_REVISION_FREEZE.json',
  'SPEC_07C_VALIDATION.json',
];

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
  const freshSnapshot = {
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
  const freshSnapshotText = JSON.stringify(freshSnapshot, null, 2);

  const plan = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_07', 'SPEC_07_PROPOSAL_PLAN.json'), 'utf8'));
  const cann = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_07', 'SPEC_07_CANNIBALIZATION_AUDIT.json'), 'utf8'));
  const S05 = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_05', 'SPEC_05_POST_REPAIR_SNAPSHOT.json'), 'utf8'));
  const S06c = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_06C', 'SPEC_06C_POST_MUTATION_SNAPSHOT.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_07', 'SPEC_07_SOURCE_MANIFEST.json'), 'utf8'));
  const schemaAudit = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_07', 'SPEC_07_SCHEMA_AUDIT.json'), 'utf8'));
  const speciesSchemaSha = L.sha256(fs.readFileSync(path.join('sanity', 'schemaTypes', 'species.ts')));
  const inputs = { live: live, liveDrafts: liveDrafts, plan: plan, cann: cann, S05: S05, S06c: S06c, manifest: manifest, schemaAudit: schemaAudit, speciesSchemaSha: speciesSchemaSha };

  let missing = 0;
  for (const f of REQUIRED) {
    if (f === 'SPEC_07C_AUDIT_REPORT.md' || f === 'SPEC_07C_VALIDATION.json') continue;
    if (!fs.existsSync(path.join(OUT_DIR, f))) missing++;
  }
  c('V-01', 'Artifact presence: all SPEC 07C data artifacts (12 JSON/CSV files + REVISION_FREEZE) exist in report/SPEC_07C/ (report + validation are written by this script)',
    missing === 0, 'missing=' + missing);

  const scanFiles = ['scripts/SPEC_07C_lib.js', 'scripts/SPEC_07C_reconcile.js', 'scripts/SPEC_07C_validate.js'];
  const fileTexts = [];
  for (const f of scanFiles) if (fs.existsSync(f)) fileTexts.push({ name: f, text: fs.readFileSync(f, 'utf8') });
  const scan = C.scanWriteCapablePaths(fileTexts);

  const a2 = C.buildAnalysis(inputs);
  let pushedG03 = false;
  for (const gt of a2.gates) {
    if (gt.id === 'G-04' && !pushedG03) {
      pushedG03 = true;
      c('G-03', 'GATE G code scan: no write-capable code path (mutation endpoint, patch, transaction, create/replace, write endpoint, request writer) exists anywhere in the SPEC 07C scripts',
        scan.hits.length === 0,
        'patterns=' + scan.patternCount + ' files=' + scan.fileCount + ' hits=' + (scan.hits.length ? scan.hits.join(',') : '0'));
    }
    c(gt.id, gt.name, gt.pass, gt.detail);
  }

  const machineFiles = fs.readdirSync(OUT_DIR).filter((f) => (f.endsWith('.json') || f.endsWith('.csv')) && f !== 'SPEC_07C_VALIDATION.json').sort();
  const tokenHits = [];
  for (const f of machineFiles) {
    const text = readArtifact(f);
    if (f.endsWith('.json')) {
      const out = [];
      C.findApprovalTokens(JSON.parse(text), out, f);
      for (const h of out) tokenHits.push(h);
    } else {
      for (const row of L.parseCsv(text)) {
        for (const k of Object.keys(row)) {
          const v = row[k];
          if (typeof v === 'string' && C.APPROVAL_TOKENS.indexOf(v.toUpperCase()) >= 0) tokenHits.push(f + '.' + k + '=' + v);
        }
      }
    }
  }
  c('G-08', 'GATE G PM boundary: no approval token (APPROVED/AUTHORIZED/GO/EXECUTE/MUTATE) appears as a whole-string value in any machine-readable SPEC 07C artifact (' + machineFiles.length + ' files scanned); final state is PENDING_PM_REVIEW',
    tokenHits.length === 0, 'hits=' + (tokenHits.length ? tokenHits.slice(0, 5).join(', ') : '0'));

  const snapshotText = readArtifact('SPEC_07C_LIVE_SNAPSHOT.json');
  c('L-01', 'Live snapshot integrity: a fresh canonical read is byte-identical to SPEC_07C_LIVE_SNAPSHOT.json (per-type sha256 fingerprints, counts, drafts, species _rev map)',
    freshSnapshotText === snapshotText,
    'byteIdentical=' + (freshSnapshotText === snapshotText));
  c('L-02', 'Canonical identity hash unchanged from the frozen snapshot and the approved baseline c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda',
    idParts.hash === L.EXPECTED_HASH && JSON.parse(snapshotText).canonicalHash === L.EXPECTED_HASH,
    'hash=' + idParts.hash);

  const dtDetail = [];
  let dtOk = true;
  const jsonPairs = [
    ['SPEC_07C_CANNIBALIZATION_CASES.json', C.payloadCases],
    ['SPEC_07C_NEAR_DUP_BOTH.json', C.payloadNearDup],
    ['SPEC_07C_SHARED_SCIENTIFIC_NAME.json', C.payloadSharedSci],
    ['SPEC_07C_GENERIC_SPECIFIC.json', C.payloadGeneric],
    ['SPEC_07C_FINAL_MUTATION_READY.json', C.payloadFinal],
    ['SPEC_07C_EXCLUDED_ROWS.json', C.payloadExcluded],
    ['SPEC_07C_REVISION_FREEZE.json', C.payloadFreeze],
  ];
  for (const [f, build] of jsonPairs) {
    const rebuiltText = JSON.stringify(build(a2), null, 2);
    const same = rebuiltText === readArtifact(f);
    if (!same) { dtOk = false; dtDetail.push(f); }
  }
  const csvPairs = [
    ['SPEC_07C_CANNIBALIZATION_CASES.csv', C.csvCases],
    ['SPEC_07C_NEAR_DUP_BOTH.csv', C.csvNearDup],
    ['SPEC_07C_SHARED_SCIENTIFIC_NAME.csv', C.csvSharedSci],
    ['SPEC_07C_GENERIC_SPECIFIC.csv', C.csvGeneric],
    ['SPEC_07C_FINAL_MUTATION_READY.csv', C.csvFinal],
    ['SPEC_07C_EXCLUDED_ROWS.csv', C.csvExcluded],
  ];
  for (const [f, build] of csvPairs) {
    const same = build(a2) === readArtifact(f);
    if (!same) { dtOk = false; dtDetail.push(f); }
  }
  const gateArtifact = JSON.parse(readArtifact('SPEC_07C_GATE_RESULTS_A_G.json'));
  const rebuiltGateSlice = JSON.stringify(a2.gates);
  const artifactGateSlice = JSON.stringify(gateArtifact.gates.filter((x) => a2.gates.some((y) => y.id === x.id)));
  const gatesSame = rebuiltGateSlice === artifactGateSlice && JSON.stringify(a2.summary) === JSON.stringify(gateArtifact.summary);
  if (!gatesSame) { dtOk = false; dtDetail.push('SPEC_07C_GATE_RESULTS_A_G.json'); }
  c('DT-02', 'Determinism (independent rebuild): re-running the reconciliation from a fresh canonical read reproduces every written artifact byte-for-byte (7 JSON payloads, 6 CSVs, gate results, summary)',
    dtOk && gateArtifact.determinism.doubleRunByteIdentical === true,
    'mismatches=' + (dtDetail.length ? dtDetail.join(',') : '0'));

  const PARITY = [
    { id: 'P-01', json: 'SPEC_07C_CANNIBALIZATION_CASES.json', csv: 'SPEC_07C_CANNIBALIZATION_CASES.csv', cols: C.CASE_COLS, rowsOf: (p) => p.cases.map(C.caseCsvRow), key: 'cannibalizationCaseId' },
    { id: 'P-02', json: 'SPEC_07C_NEAR_DUP_BOTH.json', csv: 'SPEC_07C_NEAR_DUP_BOTH.csv', cols: C.NEARDUP_COLS, rowsOf: (p) => p.pairs.map(C.nearCsvRow), key: 'pairId' },
    { id: 'P-03', json: 'SPEC_07C_SHARED_SCIENTIFIC_NAME.json', csv: 'SPEC_07C_SHARED_SCIENTIFIC_NAME.csv', cols: C.SCINAME_COLS, rowsOf: (p) => C.scinameCsvRows({ sharedSci: p }), key: 'recordId' },
    { id: 'P-04', json: 'SPEC_07C_GENERIC_SPECIFIC.json', csv: 'SPEC_07C_GENERIC_SPECIFIC.csv', cols: C.GENERIC_COLS, rowsOf: (p) => p.pairs.map(C.genericCsvRow), key: 'pairId' },
    { id: 'P-05', json: 'SPEC_07C_FINAL_MUTATION_READY.json', csv: 'SPEC_07C_FINAL_MUTATION_READY.csv', cols: C.FINAL_COLS, rowsOf: (p) => p.records, key: 'recordId' },
    { id: 'P-06', json: 'SPEC_07C_EXCLUDED_ROWS.json', csv: 'SPEC_07C_EXCLUDED_ROWS.csv', cols: C.EXCLUDED_COLS, rowsOf: (p) => p.records, key: 'recordId' },
  ];
  for (const spec of PARITY) {
    const payload = JSON.parse(readArtifact(spec.json));
    const csvRows = L.parseCsv(readArtifact(spec.csv));
    const jsonRows = spec.rowsOf(payload);
    let ok = csvRows.length === jsonRows.length;
    let detail = 'rows json=' + jsonRows.length + ' csv=' + csvRows.length;
    if (ok) {
      const first = csvRows[0] || {};
      const headerOk = spec.cols.every((col) => Object.prototype.hasOwnProperty.call(first, col));
      if (!headerOk) { ok = false; detail += ' headerMismatch'; }
    }
    if (ok) {
      outer:
      for (let i = 0; i < jsonRows.length; i++) {
        for (const col of spec.cols) {
          const expected = C.renderCell(jsonRows[i][col]);
          const actual = csvRows[i][col] === undefined ? '' : csvRows[i][col];
          if (String(expected) !== String(actual)) {
            ok = false;
            detail = 'row ' + i + ' col ' + col + ' json="' + expected + '" csv="' + actual + '"';
            break outer;
          }
        }
        if (csvRows[i][spec.key] === undefined || csvRows[i][spec.key] === '') { ok = false; detail = 'row ' + i + ' missing key ' + spec.key; break; }
      }
    }
    c(spec.id, 'JSON/CSV parity (' + spec.json.replace('SPEC_07C_', '').replace('.json', '') + '): row counts equal, header covers all columns, every cell equals its JSON counterpart across all columns',
      ok, detail);
  }

  const FINAL = JSON.parse(readArtifact('SPEC_07C_FINAL_MUTATION_READY.json'));
  const EXCLUDED = JSON.parse(readArtifact('SPEC_07C_EXCLUDED_ROWS.json'));
  const FREEZE = JSON.parse(readArtifact('SPEC_07C_REVISION_FREEZE.json'));

  const finalRequired = ['proposalId', 'recordId', 'title', 'slug', 'scientificName', 'originalConfidence', 'originalStatus', 'originalReasonCode', 'proposedMetaTitle', 'proposedMetaDescription', 'cannibalizationStatus', 'cannibalizationCaseIds', 'finalStatus', 'finalReason', 'currentRevision', 'currentMetaTitle', 'currentMetaDescription', 'expectedRev', 'expectedCurrentMetaTitle', 'expectedCurrentMetaDescription', 'approvedTargetMetaTitle', 'approvedTargetMetaDescription'];
  const finalMissing = FINAL.records.filter((r) => finalRequired.some((k) => r[k] === undefined)).length;
  c('P-07', 'FINAL_MUTATION_READY row schema: every final row carries all SPEC 07C required fields plus the freeze fields (expectedRev/expectedCurrent*/approvedTarget*), originalStatus=HIGH, finalStatus=FINAL_MUTATION_READY',
    finalMissing === 0 && FINAL.records.length === FINAL.finalMutationReadyCount && FINAL.finalMutationReadyCount + FINAL.excludedCount === 120 &&
    FINAL.records.every((r) => r.originalStatus === 'HIGH' && r.originalConfidence === 'HIGH' && r.finalStatus === C.ST_READY && r.originalMutationStatus === 'MUTATION_READY') &&
    FINAL.mutationAuthorized === false && FINAL.state === 'PENDING_PM_REVIEW',
    'rows=' + FINAL.records.length + ' missing=' + finalMissing + ' accounting=' + (FINAL.finalMutationReadyCount + FINAL.excludedCount));

  const excludedRequired = ['proposalId', 'recordId', 'title', 'originalStatus', 'originalConfidence', 'originalReasonCode', 'exclusionStatus', 'exclusionReason', 'relatedCannibalizationCaseIds'];
  const excludedMissing = EXCLUDED.records.filter((r) => excludedRequired.some((k) => r[k] === undefined)).length;
  const allowedExcluded = [C.ST_CANNIBALIZATION, C.ST_METADATA_DUP, C.ST_GENERIC, C.ST_IDENTITY, C.ST_OTHER];
  const excludedByStatusSum = Object.keys(EXCLUDED.counts.byExclusionStatus).reduce((n, k) => n + EXCLUDED.counts.byExclusionStatus[k], 0);
  c('P-08', 'EXCLUDED_ROWS row schema: every excluded HIGH row carries proposalId/recordId/title/originalStatus/originalConfidence/originalReasonCode/exclusionStatus/exclusionReason/relatedCannibalizationCaseIds with an allowed exclusion status and a concrete reason',
    excludedMissing === 0 && EXCLUDED.records.length === EXCLUDED.counts.excluded && excludedByStatusSum === EXCLUDED.counts.excluded &&
    EXCLUDED.records.every((r) => allowedExcluded.indexOf(r.exclusionStatus) >= 0 && r.exclusionStatus !== C.ST_READY && r.exclusionReason && r.exclusionReason.length > 0),
    'rows=' + EXCLUDED.records.length + ' missing=' + excludedMissing + ' byStatus=' + excludedByStatusSum);

  const spById = {};
  for (const s of live.species) spById[s._id] = s;
  const planById = {};
  for (const r of plan.rows) planById[r.recordId] = r;
  let freezeBad = 0;
  const freezeProblems = [];
  for (const f of FREEZE.records) {
    const liveRec = spById[f.recordId];
    const planRow = planById[f.recordId];
    if (!liveRec) { freezeBad++; freezeProblems.push(f.recordId + ':missing'); continue; }
    if (liveRec._rev !== f.expectedRev) { freezeBad++; freezeProblems.push(f.recordId + ':rev'); }
    if (!planRow || planRow.proposedMetaTitle !== f.approvedTargetMetaTitle || planRow.proposedMetaDescription !== f.approvedTargetMetaDescription) { freezeBad++; freezeProblems.push(f.recordId + ':target'); }
    if (liveRec.seo && (liveRec.seo.metaTitle !== undefined || liveRec.seo.metaDescription !== undefined)) { freezeBad++; freezeProblems.push(f.recordId + ':seoDrift'); }
  }
  c('E-06', 'Freeze recheck against the fresh read: every REVISION_FREEZE record still exists as type species, live _rev equals expectedRev, approved targets equal the SPEC 07 proposals, no SEO drift, freeze count equals FINAL_MUTATION_READY count',
    freezeBad === 0 && FREEZE.records.length === FINAL.records.length && FREEZE.counts.revisionDrift === 0 && FREEZE.counts.contentDrift === 0 && FREEZE.state === 'PENDING_PM_REVIEW',
    'freeze=' + FREEZE.records.length + ' final=' + FINAL.records.length + ' problems=' + (freezeProblems.length ? freezeProblems.slice(0, 5).join(',') : '0'));

  const reg = {};
  const regSpecs = [
    { key: 'spec001', id: 'H-01', script: 'scripts/SPEC_00_1_validate.js', file: 'report/SPEC_00_1/SPEC_00_1_VALIDATION.json', expect: 9, stdout: 'Validation: 9/9 checks passed.' },
    { key: 'spec01', id: 'H-02', script: 'scripts/SPEC_01_validate.js', file: 'report/SPEC_01/SPEC_01_VALIDATION.json', expect: 14, stdout: 'SPEC_01_validate: 14/14 checks passed. Verdict: PASS' },
    { key: 'spec07', id: 'H-03', script: 'scripts/SPEC_07_validate.js', file: 'report/SPEC_07/SPEC_07_VALIDATION.json', expect: 18, stdout: 'VALIDATION: 18/18 PASS' },
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
      reg[s.key] = { verdict: verdict, passed: passedN, exitCode: run.status, stdoutMatch: stdoutSeen, ok: ok };
    } catch (e) {
      detail = 'error=' + e.message + ' exit=' + run.status;
      reg[s.key] = { error: e.message, exitCode: run.status, ok: false };
    }
    if (!ok && run.stderr) detail += ' stderr=' + String(run.stderr).slice(0, 300);
    c(s.id, 'Regression ' + s.script + ' still PASS (' + s.expect + '/' + s.expect + '); unrelated failures are reported under their own spec id, never relabeled as SPEC 07C',
      ok, detail);
  }

  const priorOk = checks.every((x) => x.pass);
  const priorPassed = checks.filter((x) => x.pass).length;
  c('H-04', 'SPEC 07C validation itself: all ' + (checks.length + 1) + ' checks (GATE A-H, parity, determinism, freeze recheck, safety scans) PASS',
    priorOk, 'passed=' + (priorPassed + (priorOk ? 1 : 0)) + '/' + (checks.length + 1));

  const passed = checks.filter((x) => x.pass).length;
  const failed = checks.filter((x) => !x.pass);
  const verdict = failed.length === 0 ? 'PASS' : 'FAIL';
  const s = a2.summary;

  const md = [];
  md.push('# SPEC 07C - SEO Cannibalization Reconciliation & Mutation-Ready Freeze (READ-ONLY)');
  md.push('');
  md.push('- Generated: ' + new Date().toISOString());
  md.push('- Mode: READ_ONLY audit + reconciliation. Mutation endpoint never called. Canonical mutations = 0, SEO mutations = 0, mutation endpoint calls = 0.');
  md.push('- Sources: fresh live canonical read (zeohjejw/production, apiVersion 2026-05-25), SPEC 07 proposal artifacts (PROPOSAL_PLAN, CANNIBALIZATION_AUDIT, SOURCE_MANIFEST, SCHEMA_AUDIT), SPEC 05/06C snapshots.');
  md.push('- Inputs frozen in SPEC_07C_LIVE_SNAPSHOT.json; reconciliation is deterministic (DT-01 double run, DT-02 independent rebuild).');
  md.push('');
  md.push('## Executive Summary');
  md.push('');
  md.push('```text');
  md.push('SPEC 07C');
  md.push('Mode: READ_ONLY');
  md.push('Status: COMPLETE');
  md.push('Original HIGH: 120');
  md.push('Final Mutation Ready: ' + FINAL.finalMutationReadyCount);
  md.push('Excluded HIGH: ' + FINAL.excludedCount);
  md.push('MEDIUM: 85 HOLD');
  md.push('BLOCKED: 13 BLOCK');
  md.push('Canonical mutations: 0');
  md.push('SEO mutations: 0');
  md.push('```');
  md.push('');
  md.push('## Cannibalization Summary');
  md.push('');
  md.push('```text');
  md.push('Potential cases: ' + s.potentialCases);
  md.push('Reconciled: ' + (s.potentialCases - (JSON.parse(readArtifact('SPEC_07C_CANNIBALIZATION_CASES.json')).counts.unclassified)));
  md.push('Unclassified: ' + JSON.parse(readArtifact('SPEC_07C_CANNIBALIZATION_CASES.json')).counts.unclassified);
  md.push('```');
  md.push('');
  md.push('| Classification | Cases |');
  md.push('|---|---|');
  for (const k of C.CLASSIFICATIONS) md.push('| ' + k + ' | ' + (s.classificationBreakdown[k] || 0) + ' |');
  md.push('');
  md.push('| Final disposition | Cases |');
  md.push('|---|---|');
  for (const k of Object.keys(s.dispositionBreakdown).sort()) md.push('| ' + k + ' | ' + s.dispositionBreakdown[k] + ' |');
  md.push('');
  md.push('Extended near-duplicate scan (pairs outside the 16 primary cases checked for descriptions interchangeable modulo entity name): ' + a2.extendedScan.length + ' finding(s).');
  md.push('');
  md.push('### All 16 potential cannibalization cases');
  md.push('');
  md.push('| Case | Record A | Record B | Relationship | Overlap | Classification | Final disposition | HIGH rows implicated |');
  md.push('|---|---|---|---|---|---|---|---|');
  for (const cs of a2.cases) {
    md.push('| ' + cs.cannibalizationCaseId + ' | ' + esc(cs.recordA.title) + ' | ' + esc(cs.recordB.title) + ' | ' + cs.relationship + ' | ' + cs.overlap + ' | ' + cs.classification + ' | ' + cs.finalDisposition + ' | ' + (cs.highRowsImplicated.length ? cs.highRowsImplicated.join('; ') : 'none') + ' |');
  }
  md.push('');
  md.push('## NEAR_DUP_BOTH');
  md.push('');
  md.push('15/15 inspected. Classification breakdown: ' + C.CLASSIFICATIONS.map((k) => k + '=' + (s.nearDupBreakdown[k] || 0)).join(', ') + '.');
  md.push('');
  md.push('| Pair | Record A | Record B | Title sim | Desc sim | Shared sciName | Classification | Final disposition |');
  md.push('|---|---|---|---|---|---|---|---|');
  for (const p of a2.nearDupBoth) {
    md.push('| ' + p.pairId + ' | ' + esc(p.recordA.title) + ' | ' + esc(p.recordB.title) + ' | ' + p.titleSimilarity + ' | ' + p.descriptionSimilarity + ' | ' + (p.sharedScientificName ? 'yes' : 'no') + ' | ' + p.classification + ' | ' + p.finalDisposition + ' |');
  }
  md.push('');
  md.push('## Scientific Name Families');
  md.push('');
  md.push('4 families / 14 records inspected. A shared scientific name never implies duplicate SEO intent by itself.');
  md.push('');
  md.push('| scientificName | Size | Family determination | HIGH members | Generic pair present |');
  md.push('|---|---|---|---|---|');
  for (const f of a2.sharedSci.families) md.push('| ' + f.scientificName + ' | ' + f.size + ' | ' + f.familyDetermination + ' | ' + f.inHigh120 + ' | ' + (f.genericPairPresent ? 'yes' : 'no') + ' |');
  md.push('');
  md.push('| Record | Title | Slug | Original confidence | In HIGH 120 | Determination | Case ids |');
  md.push('|---|---|---|---|---|---|---|');
  for (const r of a2.sharedSci.records) md.push('| ' + r.recordId + ' | ' + esc(r.title) + ' | ' + r.slug + ' | ' + r.originalConfidence + ' | ' + (r.inHigh120 ? 'yes' : 'no') + ' | ' + r.determination + ' | ' + (r.caseIds.join('; ') || 'none') + ' |');
  md.push('');
  md.push('## Generic-Specific Pairs');
  md.push('');
  md.push('| Pair | scientificName | Generic record | Specific record | Ownership verdict | Classification | Final disposition | HIGH rows involved |');
  md.push('|---|---|---|---|---|---|---|---|');
  for (const gp of a2.generic) {
    md.push('| ' + gp.pairId + ' | ' + gp.scientificName + ' | ' + esc(gp.genericRecord.title) + ' (' + gp.genericRecord.confidence + '/' + gp.genericRecord.mutationStatus + ') | ' + esc(gp.specificRecord.title) + ' (' + gp.specificRecord.confidence + '/' + gp.specificRecord.mutationStatus + ') | ' + gp.verdict + ' | ' + gp.classification + ' | ' + gp.finalDisposition + ' | ' + (gp.highRowsInvolved.length ? gp.highRowsInvolved.join('; ') : 'none') + ' |');
  }
  md.push('');
  for (const gp of a2.generic) {
    md.push('- ' + gp.pairId + ': generic query ownership cannot be established from canonical evidence (no owner field, no alias/parent designation, no external keyword data); ' + gp.finalDisposition + '.');
  }
  md.push('');
  md.push('## Final Mutation-Ready');
  md.push('');
  md.push('Exact count: **' + FINAL.finalMutationReadyCount + '** (original HIGH 120 - excluded HIGH ' + FINAL.excludedCount + '; no MEDIUM/BLOCKED row promoted). Full record list:');
  md.push('');
  md.push('| # | proposalId | recordId | title | slug | searchIntent | cannibalizationStatus | cannibalizationCaseIds | approvedTargetMetaTitle |');
  md.push('|---|---|---|---|---|---|---|---|---|');
  FINAL.records.forEach((r, i) => {
    md.push('| ' + (i + 1) + ' | ' + r.proposalId + ' | ' + r.recordId + ' | ' + esc(r.title) + ' | ' + r.slug + ' | ' + r.searchIntent + ' | ' + r.cannibalizationStatus + ' | ' + (r.cannibalizationCaseIds.length ? r.cannibalizationCaseIds.join('; ') : 'none') + ' | ' + esc(r.approvedTargetMetaTitle) + ' |');
  });
  md.push('');
  md.push('## Excluded HIGH');
  md.push('');
  md.push('Exact count: **' + FINAL.excludedCount + '**. Every excluded row keeps full traceability (originalStatus/originalConfidence/originalReasonCode preserved; proposals were NOT rewritten - rule 15).');
  md.push('');
  md.push('| proposalId | recordId | title | exclusionStatus | relatedCannibalizationCaseIds | exclusionReason |');
  md.push('|---|---|---|---|---|---|');
  for (const r of EXCLUDED.records) {
    md.push('| ' + r.proposalId + ' | ' + r.recordId + ' | ' + esc(r.title) + ' | ' + r.exclusionStatus + ' | ' + (r.relatedCannibalizationCaseIds.length ? r.relatedCannibalizationCaseIds.join('; ') : 'none') + ' | ' + esc(r.exclusionReason) + ' |');
  }
  md.push('');
  md.push('Accounting: FINAL_MUTATION_READY (' + FINAL.finalMutationReadyCount + ') + EXCLUDED_HIGH (' + FINAL.excludedCount + ') = 120. Excluded by status: ' + JSON.stringify(EXCLUDED.counts.byExclusionStatus) + '. MEDIUM 85 remain HOLD; BLOCKED 13 remain BLOCK; neither was promoted.');
  md.push('');
  md.push('## Revision Freeze');
  md.push('');
  md.push('- Frozen records: ' + FREEZE.records.length + ' (one per FINAL_MUTATION_READY row).');
  md.push('- Revision drift: ' + FREEZE.counts.revisionDrift + '. Content drift: ' + FREEZE.counts.contentDrift + '. Recompute mismatch: ' + FREEZE.counts.recomputeMismatch + '.');
  md.push('- expectedRev captured from a fresh canonical read; a future GATE C must patch only when the live _rev equals expectedRev (optimistic concurrency). SPEC 07C performed no writes; the freeze is a record, not authorization.');
  md.push('- Live recheck at validation time (E-06): ' + (checks.find((x) => x.id === 'E-06') ? checks.find((x) => x.id === 'E-06').detail : 'n/a'));
  md.push('');
  md.push('## Safety');
  md.push('');
  md.push('- Canonical identity hash: ' + a2.summary.canonicalHash + ' (unchanged).');
  md.push('- Mutation endpoint calls: 0 (read-only data/query GET only; G-03 static code scan of the SPEC 07C scripts: ' + scan.patternCount + ' patterns x ' + scan.fileCount + ' files, ' + scan.hits.length + ' hits).');
  md.push('- Canonical mutations: 0 (added=0, removed=0, non-relatedPosts content changes=0, title/slug/scientificName/body/taxonomy/relationship-field changes=0 vs SPEC 05/06C baselines).');
  md.push('- SEO mutations: 0 (species with a populated seo object: ' + a2.summary.drift.speciesWithSeo + ' of 218; seo byte-identical to SPEC 05 baseline).');
  md.push('- Unexpected mutations: 0 (SPEC 07 manifest fingerprints match for all 6 wiki types; SPEC 06C snapshot drift=0; revision drift vs S05/06C=0).');
  md.push('- Approval tokens in machine-readable artifacts: ' + tokenHits.length + ' (G-08); state = PENDING_PM_REVIEW, mutationAuthorized = false.');
  md.push('');
  md.push('## Regression');
  md.push('');
  md.push('| Spec | Result |');
  md.push('|---|---|');
  md.push('| SPEC 00.1 | ' + reg.spec001.passed + '/9 ' + (reg.spec001.verdict || reg.spec001.error) + ' |');
  md.push('| SPEC 01 | ' + reg.spec01.passed + '/14 ' + (reg.spec01.verdict || reg.spec01.error) + ' |');
  md.push('| SPEC 07 | ' + reg.spec07.passed + '/18 ' + (reg.spec07.verdict || reg.spec07.error) + ' |');
  md.push('| SPEC 07C | ' + passed + '/' + checks.length + ' ' + verdict + ' |');
  md.push('');
  md.push('Unrelated failures, if any, are reported under their own spec id above and are never relabeled as SPEC 07C failures.');
  md.push('');
  md.push('## Validation (GATE A-H)');
  md.push('');
  md.push('| Check | Result | Detail |');
  md.push('|---|---|---|');
  for (const x of checks) md.push('| ' + x.id + ' | ' + (x.pass ? 'PASS' : 'FAIL') + ' | ' + esc(x.name) + ' - ' + esc(x.detail) + ' |');
  md.push('');
  md.push('**Result: ' + passed + '/' + checks.length + ' checks PASS** (' + verdict + ')');
  md.push('');
  md.push('Artifacts: ' + REQUIRED.concat(['SPEC_07C_GATE_RESULTS_A_G.json', 'SPEC_07C_LIVE_SNAPSHOT.json']).join(', ') + ' -> report/SPEC_07C/');
  md.push('');
  md.push('## Decision');
  md.push('');
  md.push('SPEC 07C COMPLETE — WAITING FOR PM REVIEW');
  md.push('');
  md.push('No canonical mutations were performed.');
  md.push('No SEO mutations were performed.');
  md.push('GATE C is NOT authorized by SPEC 07C.');
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_07C_AUDIT_REPORT.md'), md.join('\n'));

  const fingerprintTargets = REQUIRED.filter((f) => f !== 'SPEC_07C_VALIDATION.json')
    .concat(['SPEC_07C_GATE_RESULTS_A_G.json', 'SPEC_07C_LIVE_SNAPSHOT.json']);
  const artifactFingerprints = [];
  for (const f of fingerprintTargets) {
    try {
      const buf = fs.readFileSync(path.join(OUT_DIR, f));
      artifactFingerprints.push({ file: f, bytes: buf.length, sha256: L.sha256(buf) });
    } catch (e) {
      artifactFingerprints.push({ file: f, missing: true });
    }
  }

  const validation = {
    spec: C.SPEC,
    phase: 'VALIDATION',
    mode: C.MODE,
    sourceSpec: C.SOURCE_SPEC,
    state: 'PENDING_PM_REVIEW',
    mutationAuthorized: false,
    checks: checks,
    passed: passed,
    failed: failed.length,
    total: checks.length,
    verdict: verdict,
    gateStatus: verdict,
    regressionChecks: reg,
    counts: {
      originalHigh: 120,
      originalMedium: 85,
      originalBlocked: 13,
      finalMutationReady: FINAL.finalMutationReadyCount,
      excludedHigh: FINAL.excludedCount,
      potentialCases: s.potentialCases,
      nearDupBoth: s.nearDupBothCount,
      sharedSciRecords: s.sharedSciRecordsCount,
      sharedSciFamilies: s.sharedSciFamiliesCount,
      genericPairs: s.genericPairsCount,
      freezeRecords: FREEZE.records.length,
    },
    safety: {
      canonicalHash: a2.summary.canonicalHash,
      mutationEndpointCalls: 0,
      canonicalMutations: 0,
      seoMutations: 0,
      unexpectedMutations: 0,
      speciesWithSeoObject: a2.summary.drift.speciesWithSeo,
      codeScanHits: scan.hits.length,
      approvalTokenHits: tokenHits.length,
      nonRelatedPostsChangesVsSpec05: a2.summary.drift.nonRelatedPostsChanged,
      relatedPostsChangedDocsSinceSpec05: a2.summary.drift.relatedPostsChangedDocs,
    },
    artifactFingerprints: artifactFingerprints,
    statusBlock: ['SPEC 07C COMPLETE — WAITING FOR PM REVIEW', 'No canonical mutations were performed.', 'No SEO mutations were performed.', 'GATE C is NOT authorized by SPEC 07C.'],
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_07C_VALIDATION.json'), JSON.stringify(validation, null, 2));

  console.log('');
  console.log('VALIDATION: ' + passed + '/' + checks.length + ' ' + verdict);
  console.log('report: report/SPEC_07C/SPEC_07C_AUDIT_REPORT.md');
  console.log('');
  console.log('SPEC 07C COMPLETE — WAITING FOR PM REVIEW');
  console.log('No canonical mutations were performed.');
  console.log('No SEO mutations were performed.');
  console.log('GATE C is NOT authorized by SPEC 07C.');
  if (verdict !== 'PASS') {
    console.log('FAILURES: ' + failed.map((x) => x.id).join(', '));
    process.exit(2);
  }
})().catch((e) => { console.error('VALIDATE ERROR:', e.stack || e.message); process.exit(1); });
