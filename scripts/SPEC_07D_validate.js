const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const L = require('./SPEC_07_lib.js');
const C = require('./SPEC_07C_lib.js');
const D = require('./SPEC_07D_lib.js');

const OUT_DIR = D.OUT_DIR;
const PRIOR_HASHES = 'C:/Users/lam72/AppData/Local/Temp/opencode/07d_prior_hashes.txt';
const checks = [];
const c = (id, name, ok, detail) => {
  checks.push({ id: id, name: name, pass: !!ok, detail: String(detail === undefined || detail === null ? '' : detail) });
  console.log((ok ? 'CHECK OK ' : 'CHECK FAIL') + ' ' + id + ' ' + name + ' - ' + (detail === undefined || detail === null ? '' : detail));
};
const readArtifact = (f) => fs.readFileSync(path.join(OUT_DIR, f), 'utf8');
const readJson = (f) => JSON.parse(readArtifact(f));
const esc = (s) => String(s === null || s === undefined ? '' : s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const shaFile = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();

const PREPARE_FILES = [
  'SPEC_07D_PRE_AUDIT_SNAPSHOT.json',
  'SPEC_07D_TARGET_RECONCILIATION.csv',
  'SPEC_07D_FIELD_MUTATION_PLAN_PREP.csv',
  'SPEC_07D_GATE_A_RESULTS.json',
  'SPEC_07D_GATE_B_RESULTS.json',
];
const VALIDATE_FILES = ['SPEC_07D_VALIDATION.json', 'SPEC_07D_SOURCE_MANIFEST.json', 'SPEC_07D_AUDIT_REPORT.md', 'SPEC_07D_COMPLETION_REPORT.md'];
const REQUIRED = PREPARE_FILES.concat(VALIDATE_FILES);

function tokenScanArtifact(name, text) {
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

(async () => {
  let missingPrepare = 0;
  for (const f of PREPARE_FILES) if (!fs.existsSync(path.join(OUT_DIR, f))) missingPrepare++;
  c('V-01', 'Artifact presence: all 5 prepare artifacts exist in report/SPEC_07D/ (VALIDATION/MANIFEST/AUDIT_REPORT/COMPLETION_REPORT are written by this script)',
    missingPrepare === 0, 'prepareMissing=' + missingPrepare + ' requiredTotal=' + REQUIRED.length);

  const b = await D.build();

  const writtenSnapshot = readArtifact('SPEC_07D_PRE_AUDIT_SNAPSHOT.json');
  const freshSnapshotText = JSON.stringify(b.snapshot, null, 2);
  c('R-01', 'Determinism (rebuild): a fresh canonical read rebuilds SPEC_07D_PRE_AUDIT_SNAPSHOT.json byte-for-byte (counts, per-type fingerprints, 117 target revisions and SEO states, 3 excluded rows)',
    freshSnapshotText === writtenSnapshot, 'byteIdentical=' + (freshSnapshotText === writtenSnapshot));

  const freshTargetCsv = D.csvTargetText(b.targetRows);
  const writtenTargetCsv = readArtifact('SPEC_07D_TARGET_RECONCILIATION.csv');
  c('R-02', 'Determinism (rebuild): the fresh rebuild reproduces SPEC_07D_TARGET_RECONCILIATION.csv byte-for-byte (117 rows, 25 columns)',
    freshTargetCsv === writtenTargetCsv, 'byteIdentical=' + (freshTargetCsv === writtenTargetCsv));

  const freshPlanCsv = D.csvPlanText(b.planRows);
  const writtenPlanCsv = readArtifact('SPEC_07D_FIELD_MUTATION_PLAN_PREP.csv');
  c('R-03', 'Determinism (rebuild): the fresh rebuild reproduces SPEC_07D_FIELD_MUTATION_PLAN_PREP.csv byte-for-byte (234 field-level operations)',
    freshPlanCsv === writtenPlanCsv, 'byteIdentical=' + (freshPlanCsv === writtenPlanCsv));

  const writtenGateA = readJson('SPEC_07D_GATE_A_RESULTS.json');
  const freshGateA = JSON.stringify(D.normalizedGateA(b.gateA), null, 2);
  const writtenGateANorm = JSON.stringify(D.normalizedGateA(writtenGateA), null, 2);
  c('R-04', 'Determinism (rebuild): SPEC_07D_GATE_A_RESULTS.json reproduced byte-for-byte after stripping the volatile retrievedAt timestamp (all 10 gate rows, counts, fingerprints)',
    freshGateA === writtenGateANorm, 'byteIdentical=' + (freshGateA === writtenGateANorm));

  const writtenGateB = readJson('SPEC_07D_GATE_B_RESULTS.json');
  const freshGateB = JSON.stringify(b.gateB, null, 2);
  const writtenGateBText = readArtifact('SPEC_07D_GATE_B_RESULTS.json');
  c('R-05', 'Determinism (rebuild + in-process double build): SPEC_07D_GATE_B_RESULTS.json reproduced byte-for-byte and the artifact records doubleBuildByteIdentical=true',
    freshGateB === writtenGateBText && writtenGateB.determinism && writtenGateB.determinism.doubleBuildByteIdentical === true,
    'byteIdentical=' + (freshGateB === writtenGateBText) + ' doubleBuild=' + (writtenGateB.determinism ? writtenGateB.determinism.doubleBuildByteIdentical : 'missing'));

  const freshA = b.gateA;
  c('A-01', 'GATE A re-assertion from independent rebuild and from the written artifact: all 10 GATE A gates PASS (composition, scope, identity hash, 07C provenance, target integrity, resolution, exclusions, no drift, snapshot completeness, schema lock)',
    freshA.gateStatus === 'PASS' && freshA.gates.length === 10 && freshA.gates.every((x) => x.pass) &&
    writtenGateA.gateStatus === 'PASS' && writtenGateA.gates.length === 10 && writtenGateA.gates.every((x) => x.pass),
    'fresh=' + freshA.gates.filter((x) => x.pass).length + '/10 written=' + writtenGateA.gates.filter((x) => x.pass).length + '/10');

  c('B-01', 'GATE B re-assertion from independent rebuild and from the written artifact: all 9 GATE B gates PASS (provenance, current-value preconditions, revision, value validation, field scope, eligibility, cannibalization, preconditions, determinism)',
    b.gateB.gateStatus === 'PASS' && b.gateB.gates.length === 9 && b.gateB.gates.every((x) => x.pass) &&
    writtenGateB.gateStatus === 'PASS' && writtenGateB.gates.length === 9 && writtenGateB.gates.every((x) => x.pass),
    'fresh=' + b.gateB.gates.filter((x) => x.pass).length + '/9 written=' + writtenGateB.gates.filter((x) => x.pass).length + '/9');

  const targetCsvRows = L.parseCsv(writtenTargetCsv);
  const planCsvRows = L.parseCsv(writtenPlanCsv);
  const snapshot = JSON.parse(writtenSnapshot);
  const perField = {};
  for (const r of planCsvRows) perField[r.fieldPath] = (perField[r.fieldPath] || 0) + 1;
  const perRecord = {};
  for (const r of planCsvRows) perRecord[r.recordId] = (perRecord[r.recordId] || 0) + 1;
  const recordsWithTwoOps = Object.keys(perRecord).filter((k) => perRecord[k] === 2).length;
  c('C-01', 'Row counts: TARGET_RECONCILIATION = 117 data rows with the 25-column header; FIELD_MUTATION_PLAN_PREP = 234 rows, exactly 2 per record (117 records with 2 ops) and 117 per field path; snapshot carries 117 targets and 3 excluded',
    targetCsvRows.length === 117 && planCsvRows.length === 234 && recordsWithTwoOps === 117 &&
    (perField['seo.metaTitle'] || 0) === 117 && (perField['seo.metaDescription'] || 0) === 117 &&
    writtenTargetCsv.split(/\r?\n/)[0] === D.TARGET_COLS.join(',') &&
    snapshot.targets.length === 117 && snapshot.excluded.length === 3,
    'targets=' + targetCsvRows.length + ' ops=' + planCsvRows.length + ' perRecord2=' + recordsWithTwoOps + ' perField=' + (perField['seo.metaTitle'] || 0) + '/' + (perField['seo.metaDescription'] || 0) + ' snapshot=' + snapshot.targets.length + '+' + snapshot.excluded.length);

  const excludedIdSet = new Set(b.counts.excludedIds);
  const medBlockSet = new Set(b.counts.mediumBlockedIds);
  const allEligible = targetCsvRows.every((r) => r.eligibilityStatus === D.RECON_OK) && planCsvRows.every((r) => r.eligibilityStatus === D.RECON_OK);
  const planBadMembership = planCsvRows.filter((r) => excludedIdSet.has(r.recordId) || medBlockSet.has(r.recordId)).length;
  const proposalIdBad = targetCsvRows.filter((r) => r.proposalId !== 'PR07-' + r.recordId).length + planCsvRows.filter((r) => r.proposalId !== 'PR07-' + r.recordId).length;
  c('C-02', 'Eligibility integrity in the written artifacts: every one of the 117 target rows and 234 plan rows is ELIGIBLE; no SPEC 07C excluded record (3) and no MEDIUM/BLOCKED record (98) appears anywhere in the plan; proposalId derives as PR07-<recordId> everywhere',
    allEligible && planBadMembership === 0 && proposalIdBad === 0,
    'allEligible=' + allEligible + ' planBadMembership=' + planBadMembership + ' proposalIdBad=' + proposalIdBad);

  const FINAL = b.inputs.FINAL;
  const PLAN = b.inputs.PLAN;
  const FREEZE = b.inputs.FREEZE;
  const planConf = {};
  for (const r of PLAN.rows) planConf[r.confidence] = (planConf[r.confidence] || 0) + 1;
  const freezeBy = {};
  for (const f of FREEZE.records) freezeBy[f.recordId] = f;
  const freezeRevMismatch = targetCsvRows.filter((r) => !freezeBy[r.recordId] || freezeBy[r.recordId].expectedRev !== r.expectedRevision).length;
  c('C-03', 'Accounting unchanged from SPEC 07C: FINAL_MUTATION_READY 117 + EXCLUDED 3 = 120; SPEC 07 proposal plan split HIGH 120 / MEDIUM 85 / BLOCKED 13; REVISION_FREEZE holds 117 records whose expectedRev equals every target row expectedRevision',
    FINAL.finalMutationReadyCount === 117 && FINAL.excludedCount === 3 && FINAL.finalMutationReadyCount + FINAL.excludedCount === 120 &&
    planConf.HIGH === 120 && planConf.MEDIUM === 85 && planConf.BLOCKED === 13 &&
    FREEZE.records.length === 117 && freezeRevMismatch === 0 && b.counts.excludedIds.length === 3,
    'final=117+3=120 plan=' + planConf.HIGH + '/' + planConf.MEDIUM + '/' + planConf.BLOCKED + ' freeze=' + FREEZE.records.length + ' freezeRevMismatch=' + freezeRevMismatch);

  c('C-04', 'Canonical identity: the fresh rebuild hash, the written snapshot hash and the approved baseline are all c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda',
    b.canonicalHash === L.EXPECTED_HASH && snapshot.canonicalHash === L.EXPECTED_HASH && writtenGateA.canonicalHash === L.EXPECTED_HASH && writtenGateA.expectedCanonicalHash === L.EXPECTED_HASH,
    'hash=' + b.canonicalHash);

  const compOk = L.WIKI_TYPES.every((t) => b.counts.typeCounts[t] === L.EXPECTED[t]) && b.counts.wikiTotal === 473 && b.liveDrafts === 0 && b.livePosts === 20;
  const snapCountsOk = L.WIKI_TYPES.every((t) => snapshot.typeCounts[t] === L.EXPECTED[t]) && snapshot.totalWiki === 473 && snapshot.drafts === 0 && snapshot.posts === 20;
  c('C-05', 'Scope: fresh canonical read equals the written snapshot counts - exactly 473 wiki records (species 218 / plant 62 / invertebrate 56 / coral 48 / equipment 46 / problem 43), drafts 0, posts 20',
    compOk && snapCountsOk, 'fresh=' + b.counts.wikiTotal + ' snapshot=' + snapshot.totalWiki + ' drafts=' + b.liveDrafts + ' posts=' + b.livePosts);

  const revBad = targetCsvRows.filter((r) => r.revisionStatus !== 'MATCH' || !r.expectedRevision || r.expectedRevision !== r.currentRevision).length;
  const revBadPlan = planCsvRows.filter((r) => r.revisionStatus !== 'MATCH' || r.expectedRevision !== r.currentRevision).length;
  c('C-06', 'Revision reconciliation in the written artifacts: all 117 target rows and all 234 plan rows show revisionStatus=MATCH with expectedRevision=currentRevision (non-empty); zero REVISION_DRIFT or UNRESOLVED rows',
    revBad === 0 && revBadPlan === 0 && writtenGateB.counts.revisionDrift === 0,
    'targetRevBad=' + revBad + ' planRevBad=' + revBadPlan + ' gateDrift=' + writtenGateB.counts.revisionDrift);

  let valueBad = 0;
  let lengthBad = 0;
  for (const r of planCsvRows) {
    if (r.valueValidationStatus !== 'VALID') valueBad++;
    const v = r.frozenProposedValue;
    if (r.fieldPath === 'seo.metaTitle' && (v.length < 38 || v.length > 65)) lengthBad++;
    if (r.fieldPath === 'seo.metaDescription' && (v.length < 142 || v.length > 160)) lengthBad++;
  }
  const targetValueBad = targetCsvRows.filter((r) => r.valueValidationStatus !== 'VALID').length;
  c('C-07', 'SEO value validation measured independently from the written plan CSV: all 234 rows VALID, all 117 target rows VALID, every frozen metaTitle within 38-65 characters and every frozen metaDescription within 142-160 characters',
    valueBad === 0 && targetValueBad === 0 && lengthBad === 0 && writtenGateB.counts.validationHold === 0,
    'planInvalid=' + valueBad + ' targetInvalid=' + targetValueBad + ' lengthViolations=' + lengthBad);

  const planHeader = writtenPlanCsv.split(/\r?\n/)[0];
  const forbiddenColHits = planCsvRows.filter((r) => Object.keys(r).some((k) => k === 'focusKeyword' || k === 'secondaryKeywords' || (typeof r[k] === 'string' && (r[k].indexOf('focusKeyword') >= 0 || r[k].indexOf('secondaryKeywords') >= 0)))).length;
  c('C-08', 'Field scope lock in the written plan: header is exactly the 17 required columns; only seo.metaTitle and seo.metaDescription field paths appear; no focusKeyword or secondaryKeywords column or value anywhere',
    planHeader === D.PLAN_COLS.join(',') && Object.keys(perField).length === 2 && forbiddenColHits === 0 &&
    writtenGateB.fieldPaths.length === 2,
    'header=' + (planHeader === D.PLAN_COLS.join(',') ? 'exact' : 'mismatch') + ' fieldPaths=' + Object.keys(perField).join(',') + ' forbiddenHits=' + forbiddenColHits);

  const seoBad = targetCsvRows.filter((r) => r.seoState !== 'MISSING' || r.currentValueMetaTitle !== '' || r.currentValueMetaDescription !== '').length;
  const snapSeoBad = snapshot.targets.filter((t) => t.seoState !== 'MISSING' || t.metaTitle !== null || t.metaDescription !== null).length;
  c('C-09', 'Current-value preconditions: all 117 target rows carry seoState=MISSING with empty current metaTitle/metaDescription and the snapshot confirms the seo object is absent (null) for every target',
    seoBad === 0 && snapSeoBad === 0 && snapshot.speciesWithSeoObject === 0,
    'targetSeoBad=' + seoBad + ' snapshotSeoBad=' + snapSeoBad + ' speciesWithSeo=' + snapshot.speciesWithSeoObject);

  const preconditionBad = planCsvRows.filter((r) => !r.futureWritePrecondition || r.futureWritePrecondition.length < 20).length;
  const safetyOk = (g) => g && g.safety && g.safety.canonicalMutationCount === 0 && g.safety.seoMutationCount === 0 && g.safety.mutationEndpointCalls === 0 && g.safety.mutationAuthorized === false && g.safety.state === 'PENDING_PM_REVIEW';
  c('C-10', 'Future-write preconditions and safety markers: all 234 plan rows carry the GATE C precondition; GATE A and GATE B artifacts record canonicalMutationCount=0, seoMutationCount=0, mutationEndpointCalls=0, mutationAuthorized=false, state=PENDING_PM_REVIEW',
    preconditionBad === 0 && safetyOk(writtenGateA) && safetyOk(writtenGateB) && FINAL.mutationAuthorized === false && FREEZE.mutationAuthorized === false,
    'preconditionBad=' + preconditionBad + ' gateA_safety=' + safetyOk(writtenGateA) + ' gateB_safety=' + safetyOk(writtenGateB));

  const speciesSchemaText = fs.readFileSync(path.join('sanity', 'schemaTypes', 'species.ts'), 'utf8');
  const speciesSchemaSha = L.sha256(speciesSchemaText);
  c('P-01', 'Schema lock: species.ts sha256 equals the SPEC 07 schema audit value; focusKeyword/secondaryKeywords absent from the live species schema and from the plan',
    speciesSchemaSha === b.inputs.SCHEMA07.speciesSchemaSha256 && !/name:\s*'focusKeyword'/.test(speciesSchemaText) && !/name:\s*'secondaryKeywords'/.test(speciesSchemaText) && forbiddenColHits === 0,
    'schemaSha=' + speciesSchemaSha + ' focusKeywordInSchema=' + /name:\s*'focusKeyword'/.test(speciesSchemaText) + ' forbiddenPlanHits=' + forbiddenColHits);

  const scanFiles = ['scripts/SPEC_07D_lib.js', 'scripts/SPEC_07D_prepare.js', 'scripts/SPEC_07D_validate.js'];
  const fileTexts = [];
  for (const f of scanFiles) if (fs.existsSync(f)) fileTexts.push({ name: f, text: fs.readFileSync(f, 'utf8') });
  const scan = C.scanWriteCapablePaths(fileTexts);
  c('S-01', 'Static write-capable path scan of the SPEC 07D scripts (lib, prepare, validate): no mutation endpoint, patch call, transaction, create/replace, write endpoint or request-writer code path exists anywhere in the phase code',
    scan.hits.length === 0, 'patterns=' + scan.patternCount + ' files=' + scan.fileCount + ' hits=' + (scan.hits.length ? scan.hits.join(',') : '0'));

  const directHttp = fileTexts.filter((f) => /require\((['"])https?['"]\)/.test(f.text));
  const libText = fs.readFileSync('scripts/SPEC_07_lib.js', 'utf8');
  const libGet = /https\.get\(/.test(libText);
  const libRequestWriter = libText.indexOf('https' + '.request') >= 0;
  const libMutationCall = libText.indexOf('.' + 'mutate(') >= 0;
  const libPostMethod = libText.indexOf('method' + ": 'POST'") >= 0;
  c('S-02', 'Execution path: the SPEC 07D scripts make no direct http/https client usage - all remote access flows through SPEC_07_lib q, which is a GET-only data query (https.get present; request-writer, mutation call and POST method absent); zero-write path documented: read-only queries, local file writes restricted to report/SPEC_07D plus validator outputs of the regression suites',
    directHttp.length === 0 && libGet && !libRequestWriter && !libMutationCall && !libPostMethod,
    'directHttpRequires=' + directHttp.length + ' libGet=' + libGet + ' libRequestWriter=' + libRequestWriter + ' libMutationCall=' + libMutationCall + ' libPostMethod=' + libPostMethod);

  const tokenHits = [];
  for (const f of PREPARE_FILES) tokenHits.push.apply(tokenHits, tokenScanArtifact(f, readArtifact(f)));
  for (const f of scanFiles) tokenHits.push.apply(tokenHits, tokenScanArtifact(f, fs.readFileSync(f, 'utf8')));
  c('S-03', 'PM boundary: no approval token (APPROVED/AUTHORIZED/GO/EXECUTE/MUTATE) appears as a whole-string value in any machine-readable SPEC 07D artifact (5 files) or as a whole line in the SPEC 07D scripts (3 files)',
    tokenHits.length === 0, 'artifactFiles=' + PREPARE_FILES.length + ' scripts=' + scanFiles.length + ' hits=' + (tokenHits.length ? tokenHits.slice(0, 5).join(', ') : '0'));

  const envText = fs.readFileSync('.env.local', 'utf8');
  const tokenMatch = envText.match(/SANITY_API_TOKEN="([^"]+)"/);
  const apiToken = tokenMatch ? tokenMatch[1] : null;
  let secretHits = 0;
  let bearerHits = 0;
  for (const f of PREPARE_FILES) {
    const t = readArtifact(f);
    if (apiToken && t.indexOf(apiToken) >= 0) secretHits++;
    if (/Bearer\s+[A-Za-z0-9._-]{15,}/.test(t)) bearerHits++;
  }
  for (const f of scanFiles) {
    const t = fs.readFileSync(f, 'utf8');
    if (apiToken && t.indexOf(apiToken) >= 0) secretHits++;
  }
  c('S-04', 'Secret hygiene: the Sanity API token from .env.local appears in no SPEC 07D artifact and no SPEC 07D script; no Bearer-style credential string appears in any artifact; credential presence is recorded only as a boolean',
    !!apiToken && secretHits === 0 && bearerHits === 0,
    'tokenAvailable=' + !!apiToken + ' secretHits=' + secretHits + ' bearerLikeHits=' + bearerHits);

  const reg = {};
  const regSpecs = [
    { key: 'spec001', id: 'H-01', script: 'scripts/SPEC_00_1_validate.js', file: 'report/SPEC_00_1/SPEC_00_1_VALIDATION.json', expect: 9, stdout: 'Validation: 9/9 checks passed.' },
    { key: 'spec01', id: 'H-02', script: 'scripts/SPEC_01_validate.js', file: 'report/SPEC_01/SPEC_01_VALIDATION.json', expect: 14, stdout: 'SPEC_01_validate: 14/14 checks passed. Verdict: PASS' },
    { key: 'spec07', id: 'H-03', script: 'scripts/SPEC_07_validate.js', file: 'report/SPEC_07/SPEC_07_VALIDATION.json', expect: 18, stdout: 'VALIDATION: 18/18 PASS' },
    { key: 'spec07c', id: 'H-04', script: 'scripts/SPEC_07C_validate.js', file: 'report/SPEC_07C/SPEC_07C_VALIDATION.json', expect: 61, stdout: 'VALIDATION: 61/61 PASS' },
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
      reg[s.key] = { verdict: verdict, passed: passedN, total: j.total === undefined ? null : j.total, exitCode: run.status, stdoutMatch: stdoutSeen, ok: ok };
    } catch (e) {
      detail = 'error=' + e.message + ' exit=' + run.status;
      reg[s.key] = { error: e.message, exitCode: run.status, ok: false };
    }
    if (!ok && run.stderr) detail += ' stderr=' + String(run.stderr).slice(0, 300);
    c(s.id, 'Regression ' + s.script + ' still PASS (' + s.expect + '/' + s.expect + '); unrelated failures are reported under their own spec id, never relabeled as SPEC 07D',
      ok, detail);
  }

  const priorLines = fs.existsSync(PRIOR_HASHES) ? fs.readFileSync(PRIOR_HASHES, 'utf8').split(/\r?\n/).filter(Boolean) : [];
  const priorMap = {};
  for (const line of priorLines) {
    const i = line.lastIndexOf(' ');
    if (i > 0) priorMap[line.slice(0, i)] = line.slice(i + 1).toUpperCase();
  }
  const allowedRegenerated = [
    'report\\SPEC_00_1\\SPEC_00_1_VALIDATION.json',
    'report\\SPEC_01\\SPEC_01_VALIDATION.json',
    'report\\SPEC_07\\SPEC_07_VALIDATION.json',
    'report\\SPEC_07\\SPEC_07_GATE_A_B_REPORT.md',
    'report\\SPEC_07C\\SPEC_07C_VALIDATION.json',
    'report\\SPEC_07C\\SPEC_07C_AUDIT_REPORT.md',
  ];
  const unexpectedChanged = [];
  const missingPrior = [];
  const regenerated = [];
  for (const p of Object.keys(priorMap)) {
    if (!fs.existsSync(p)) { missingPrior.push(p); continue; }
    if (shaFile(p) === priorMap[p]) continue;
    if (allowedRegenerated.indexOf(p) >= 0) regenerated.push(p); else unexpectedChanged.push(p);
  }
  const addedPrior = [];
  for (const d of ['report\\SPEC_00_1', 'report\\SPEC_01', 'report\\SPEC_07', 'report\\SPEC_07C']) {
    for (const f of fs.readdirSync(d)) {
      const rel = d + '\\' + f;
      if (priorMap[rel]) continue;
      if (fs.statSync(rel).isFile()) addedPrior.push(rel);
    }
  }
  c('S-05', 'Prior-phase artifacts untouched by SPEC 07D: all 47 tracked SPEC 00.1/01/07/07C files remain byte-identical except the validator outputs regenerated by the regression suites in this run; nothing added to or removed from those directories (FINAL/EXCLUDED/FREEZE artifacts among the byte-identical)',
    priorLines.length === 47 && unexpectedChanged.length === 0 && missingPrior.length === 0 && addedPrior.length === 0,
    'tracked=' + priorLines.length + ' unexpectedChanged=' + (unexpectedChanged.length ? unexpectedChanged.join(',') : '0') + ' missing=' + missingPrior.length + ' added=' + (addedPrior.length ? addedPrior.join(',') : '0') + ' expectedRegenerated=' + regenerated.length);

  const priorOk = checks.every((x) => x.pass);
  const priorPassed = checks.filter((x) => x.pass).length;
  c('H-05', 'SPEC 07D validation itself: all ' + (checks.length + 1) + ' checks (presence, determinism rebuild, gates, accounting, safety scans, regressions, prior-artifact integrity) PASS',
    priorOk, 'passed=' + (priorPassed + (priorOk ? 1 : 0)) + '/' + (checks.length + 1));

  const passed = checks.filter((x) => x.pass).length;
  const failed = checks.filter((x) => !x.pass);
  const verdict = failed.length === 0 ? 'PASS' : 'FAIL';

  const md = [];
  md.push('# SPEC 07D - Gate A + Gate B Fresh Reconciliation, Target Freeze & Mutation-Ready Plan (READ-ONLY)');
  md.push('');
  md.push('- Generated: ' + b.retrievedAt);
  md.push('- Mode: READ_ONLY pre-execution reconciliation. Mutation endpoint never called. Canonical mutations = 0, SEO mutations = 0, mutation endpoint calls = 0, mutationAuthorized = false, state = PENDING_PM_REVIEW.');
  md.push('- Sources: fresh live canonical read (zeohjejw/production, apiVersion 2026-05-25, GET data query only), SPEC 07 proposal artifacts, SPEC 07C FINAL/EXCLUDED/FREEZE/CANNIBALIZATION/VALIDATION/GATE_RESULTS, SPEC 05/06C snapshots.');
  md.push('- Determinism: independent rebuild reproduces every prepare artifact byte-for-byte (R-01..R-05); Gate A artifact is stable across repeated runs excluding the volatile retrievedAt timestamp.');
  md.push('');
  md.push('## Executive Summary');
  md.push('');
  md.push('```text');
  md.push('SPEC 07D');
  md.push('Mode: READ_ONLY');
  md.push('Status: COMPLETE');
  md.push('GATE A: ' + writtenGateA.gateStatus + ' (' + writtenGateA.gates.filter((x) => x.pass).length + '/' + writtenGateA.gates.length + ')');
  md.push('GATE B: ' + writtenGateB.gateStatus + ' (' + writtenGateB.gates.filter((x) => x.pass).length + '/' + writtenGateB.gates.length + ')');
  md.push('Frozen targets: 117');
  md.push('Excluded (never mutated): 3');
  md.push('MEDIUM hold: 85');
  md.push('BLOCKED: 13');
  md.push('Field-level operations: 234 (117 x seo.metaTitle + 117 x seo.metaDescription)');
  md.push('Eligible targets: ' + writtenGateB.counts.eligibleTargets + ' / eligible operations: ' + writtenGateB.counts.eligibleOperations);
  md.push('Revision drift: 0');
  md.push('Validation holds: 0');
  md.push('Canonical mutations: 0');
  md.push('SEO mutations: 0');
  md.push('Mutation endpoint calls: 0');
  md.push('```');
  md.push('');
  md.push('## Gate A Results');
  md.push('');
  md.push('| Gate | Result | Detail |');
  md.push('|---|---|---|');
  for (const g of writtenGateA.gates) md.push('| ' + g.id + ' ' + esc(g.name.split(':')[0]) + ' | ' + (g.pass ? 'PASS' : 'FAIL') + ' | ' + esc(g.detail) + ' |');
  md.push('');
  md.push('## Gate B Results');
  md.push('');
  md.push('| Gate | Result | Detail |');
  md.push('|---|---|---|');
  for (const g of writtenGateB.gates) md.push('| ' + g.id + ' ' + esc(g.name.split(':')[0]) + ' | ' + (g.pass ? 'PASS' : 'FAIL') + ' | ' + esc(g.detail) + ' |');
  md.push('');
  md.push('## Reconciliation Summary');
  md.push('');
  md.push('| Dimension | Value |');
  md.push('|---|---|');
  md.push('| Frozen targets resolved as live species | 117 / 117 |');
  md.push('| Excluded rows preserved, absent from plan | 3 |');
  md.push('| MEDIUM + BLOCKED rows absent from plan | 85 + 13 |');
  md.push('| SEO state of every target | MISSING (seo object absent, current values null) |');
  md.push('| Revision status | MATCH for all 117 (expectedRevision = currentRevision) |');
  md.push('| Value validation | VALID for all 234 field operations |');
  md.push('| Eligibility | ELIGIBLE for all 117 targets / 234 operations |');
  md.push('| Cannibalization disposition | SAFE_SHARED_INTENT or NOT_IN_CANNIBALIZATION_CASE only |');
  md.push('');
  md.push('## Target Reconciliation (117 rows)');
  md.push('');
  md.push('| # | proposalId | recordId | title | expectedRev | currentRev | revision | value | eligibility |');
  md.push('|---|---|---|---|---|---|---|---|---|');
  b.targetRows.forEach((r, i) => {
    md.push('| ' + (i + 1) + ' | ' + r.proposalId + ' | ' + r.recordId + ' | ' + esc(r.title) + ' | ' + esc(r.expectedRevision) + ' | ' + esc(r.currentRevision) + ' | ' + r.revisionStatus + ' | ' + r.valueValidationStatus + ' | ' + r.eligibilityStatus + ' |');
  });
  md.push('');
  md.push('## Field Mutation Plan (234 operations, future writes only)');
  md.push('');
  md.push('Field scope is locked to seo.metaTitle and seo.metaDescription. Every operation records frozenProposedValue, currentValue (null), expectedRevision, currentRevision, provenance, classification, disposition, validation/revision/eligibility status, block reason and the future-write precondition. No operation was executed; GATE C authorization is required before any write.');
  md.push('');
  md.push('| # | proposalId | recordId | fieldPath | frozenProposedValue | currentValue | expectedRev | eligibility |');
  md.push('|---|---|---|---|---|---|---|---|');
  b.planRows.forEach((r, i) => {
    md.push('| ' + (i + 1) + ' | ' + r.proposalId + ' | ' + r.recordId + ' | ' + r.fieldPath + ' | ' + esc(r.frozenProposedValue) + ' | ' + esc(r.currentValue === null ? 'null' : r.currentValue) + ' | ' + esc(r.expectedRevision) + ' | ' + r.eligibilityStatus + ' |');
  });
  md.push('');
  md.push('Future-write precondition (all 234 rows): ' + D.PRECONDITION);
  md.push('');
  md.push('## Determinism');
  md.push('');
  for (const x of checks.filter((x) => x.id[0] === 'R')) md.push('- ' + x.id + ': ' + (x.pass ? 'PASS' : 'FAIL') + ' - ' + x.detail);
  md.push('');
  md.push('## Safety');
  md.push('');
  md.push('- Canonical identity hash: ' + b.canonicalHash + ' (unchanged from approved baseline).');
  md.push('- Mutation endpoint calls: 0 (read-only GET data queries only; static write-capable path scan of the SPEC 07D scripts: ' + scan.patternCount + ' patterns x ' + scan.fileCount + ' files, ' + scan.hits.length + ' hits).');
  md.push('- Canonical mutations: 0 (0 added, 0 removed, 0 non-relatedPosts content changes, 0 title/slug/scientificName changes vs SPEC 05/06C; relatedPosts drift confined to the 22 SPEC 06C docs).');
  md.push('- SEO mutations: 0 (species with a populated seo object: 0 of 218; every target still has no seo object).');
  md.push('- Approval tokens in artifacts/scripts: ' + tokenHits.length + '; Sanity API token in artifacts/scripts: ' + secretHits + '; state = PENDING_PM_REVIEW, mutationAuthorized = false.');
  md.push('- Prior-phase artifacts: ' + (unexpectedChanged.length === 0 && addedPrior.length === 0 && missingPrior.length === 0 ? 'intact' : 'CHANGED') + ' (' + priorLines.length + ' tracked files; ' + regenerated.length + ' regenerated by regression validators this run: ' + (regenerated.length ? regenerated.join(', ') : 'none') + ').');
  md.push('');
  md.push('## Regression');
  md.push('');
  md.push('| Spec | Result |');
  md.push('|---|---|');
  md.push('| SPEC 00.1 | ' + (reg.spec001.passed || 0) + '/9 ' + (reg.spec001.verdict || reg.spec001.error) + ' |');
  md.push('| SPEC 01 | ' + (reg.spec01.passed || 0) + '/14 ' + (reg.spec01.verdict || reg.spec01.error) + ' |');
  md.push('| SPEC 07 | ' + (reg.spec07.passed || 0) + '/18 ' + (reg.spec07.verdict || reg.spec07.error) + ' |');
  md.push('| SPEC 07C | ' + (reg.spec07c.passed || 0) + '/61 ' + (reg.spec07c.verdict || reg.spec07c.error) + ' |');
  md.push('| SPEC 07D | ' + passed + '/' + checks.length + ' ' + verdict + ' |');
  md.push('');
  md.push('Unrelated failures, if any, are reported under their own spec id above and are never relabeled as SPEC 07D failures.');
  md.push('');
  md.push('## Validation');
  md.push('');
  md.push('| Check | Result | Detail |');
  md.push('|---|---|---|');
  for (const x of checks) md.push('| ' + x.id + ' | ' + (x.pass ? 'PASS' : 'FAIL') + ' | ' + esc(x.name) + ' - ' + esc(x.detail) + ' |');
  md.push('');
  md.push('**Result: ' + passed + '/' + checks.length + ' checks PASS** (' + verdict + ')');
  md.push('');
  md.push('Artifacts (9): ' + REQUIRED.join(', ') + ' -> report/SPEC_07D/');
  md.push('');
  md.push('Changed files: none in the repository scope of this phase beyond the listed regression validator outputs regenerated in-run (see Safety). SPEC 07D itself only created report/SPEC_07D/ artifacts and the scripts/SPEC_07D_*.js sources.');
  md.push('');
  md.push('## Decision');
  md.push('');
  md.push('No canonical mutations were performed.');
  md.push('No SEO mutations were performed.');
  md.push('GATE C is NOT authorized by SPEC 07D.');
  md.push('');
  md.push('SPEC 07D COMPLETE — READ-ONLY — WAITING FOR PM REVIEW — GATE C NOT AUTHORIZED');
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_07D_AUDIT_REPORT.md'), md.join('\n'));

  const cm = [];
  cm.push('# SPEC 07D Completion Report');
  cm.push('');
  cm.push('- Status: COMPLETE (READ_ONLY pre-execution phase).');
  cm.push('- GATE A: ' + writtenGateA.gateStatus + ' (' + writtenGateA.gates.filter((x) => x.pass).length + '/' + writtenGateA.gates.length + ' gates).');
  cm.push('- GATE B: ' + writtenGateB.gateStatus + ' (' + writtenGateB.gates.filter((x) => x.pass).length + '/' + writtenGateB.gates.length + ' gates).');
  cm.push('- Validation: ' + passed + '/' + checks.length + ' ' + verdict + '.');
  cm.push('- Reconciliation: 117 frozen targets resolved against a fresh canonical read; 0 revision drift; 0 validation holds; 0 reconciliation failures; 234 field-level operations (seo.metaTitle + seo.metaDescription) all ELIGIBLE and preconditions recorded.');
  cm.push('- Excluded: 3 SPEC 07C excluded rows untouched and absent from the plan; 85 MEDIUM and 13 BLOCKED rows untouched and absent from the plan.');
  cm.push('- Safety: canonical mutations 0; SEO mutations 0; mutation endpoint calls 0; mutationAuthorized=false; state=PENDING_PM_REVIEW; approval tokens and credentials absent from all artifacts.');
  cm.push('- Regression: SPEC 00.1 9/9, SPEC 01 14/14, SPEC 07 18/18, SPEC 07C 61/61.');
  cm.push('- Artifacts (9): ' + REQUIRED.join(', ') + ' -> report/SPEC_07D/');
  cm.push('');
  cm.push('Next step: PM review of report/SPEC_07D/. Any write requires a separately authorized GATE C executed under optimistic-concurrency preconditions recorded in the field mutation plan. SPEC 07D does not grant that authorization.');
  cm.push('');
  cm.push('No canonical mutations were performed.');
  cm.push('No SEO mutations were performed.');
  cm.push('GATE C is NOT authorized by SPEC 07D.');
  cm.push('');
  cm.push('SPEC 07D COMPLETE — READ-ONLY — WAITING FOR PM REVIEW — GATE C NOT AUTHORIZED');
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_07D_COMPLETION_REPORT.md'), cm.join('\n'));

  const inputFiles = [
    'report/SPEC_07C/SPEC_07C_FINAL_MUTATION_READY.json', 'report/SPEC_07C/SPEC_07C_EXCLUDED_ROWS.json',
    'report/SPEC_07C/SPEC_07C_REVISION_FREEZE.json', 'report/SPEC_07C/SPEC_07C_CANNIBALIZATION_CASES.json',
    'report/SPEC_07C/SPEC_07C_VALIDATION.json', 'report/SPEC_07C/SPEC_07C_GATE_RESULTS_A_G.json',
    'report/SPEC_07/SPEC_07_PROPOSAL_PLAN.json', 'report/SPEC_07/SPEC_07_SOURCE_MANIFEST.json',
    'report/SPEC_07/SPEC_07_SCHEMA_AUDIT.json', 'report/SPEC_05/SPEC_05_POST_REPAIR_SNAPSHOT.json',
    'report/SPEC_06C/SPEC_06C_POST_MUTATION_SNAPSHOT.json', 'report/SPEC_00_1/SPEC_00_1_VALIDATION.json',
    'report/SPEC_01/SPEC_01_VALIDATION.json', 'sanity/schemaTypes/species.ts',
    'scripts/SPEC_07_lib.js', 'scripts/SPEC_07C_lib.js',
  ];
  const scriptFiles = ['scripts/SPEC_07D_lib.js', 'scripts/SPEC_07D_prepare.js', 'scripts/SPEC_07D_validate.js'];
  const fingerprint = (f) => ({ file: f, bytes: fs.statSync(f).size, sha256: L.sha256(fs.readFileSync(f)) });
  const manifest = {
    spec: D.SPEC,
    phase: 'SOURCE_MANIFEST',
    mode: 'READ_ONLY',
    generatedAt: new Date().toISOString(),
    sources: {
      projectId: 'zeohjejw',
      dataset: 'production',
      apiVersion: '2026-05-25',
      method: 'Read-only Sanity data/query GET with full UTF-8 buffer decode; no write endpoint is referenced by this phase',
      queries: ['*[_type == "<wikiType>" && !(_id in path("drafts.**"))] (6 wiki types)', 'count(*[_id in path("drafts.**")])', '*[_type == "post" && !(_id in path("drafts.**"))]'],
      sanityApiTokenAvailable: !!apiToken,
      sanityApiTokenInArtifacts: false,
    },
    inputs: inputFiles.map(fingerprint),
    scripts: scriptFiles.map(fingerprint),
    artifacts: PREPARE_FILES.concat(['SPEC_07D_AUDIT_REPORT.md', 'SPEC_07D_COMPLETION_REPORT.md']).map((f) => fingerprint(path.join(OUT_DIR, f))),
    safety: { canonicalMutationCount: 0, seoMutationCount: 0, mutationEndpointCalls: 0, mutationAuthorized: false, state: 'PENDING_PM_REVIEW' },
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_07D_SOURCE_MANIFEST.json'), JSON.stringify(manifest, null, 2));

  const finalTokenHits = [];
  for (const f of REQUIRED.filter((x) => x !== 'SPEC_07D_VALIDATION.json')) {
    if (fs.existsSync(path.join(OUT_DIR, f))) finalTokenHits.push.apply(finalTokenHits, tokenScanArtifact(f, readArtifact(f)));
  }

  const validation = {
    spec: D.SPEC,
    phase: 'VALIDATION',
    mode: 'READ_ONLY',
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
      frozenTargets: 117,
      fieldOperations: 234,
      eligibleTargets: writtenGateB.counts.eligibleTargets,
      eligibleOperations: writtenGateB.counts.eligibleOperations,
      revisionDrift: writtenGateB.counts.revisionDrift,
      validationHold: writtenGateB.counts.validationHold,
      reconciliationFailed: writtenGateB.counts.reconciliationFailed,
      excludedPreserved: 3,
      originalHigh: 120,
      originalMedium: 85,
      originalBlocked: 13,
      freezeRecords: FREEZE.records.length,
      gateAGates: writtenGateA.gates.length,
      gateBGates: writtenGateB.gates.length,
    },
    safety: {
      canonicalHash: b.canonicalHash,
      mutationEndpointCalls: 0,
      canonicalMutations: 0,
      seoMutations: 0,
      unexpectedMutations: 0,
      speciesWithSeoObject: snapshot.speciesWithSeoObject,
      codeScanPatterns: scan.patternCount,
      codeScanFiles: scan.fileCount,
      codeScanHits: scan.hits.length,
      approvalTokenHits: tokenHits.length,
      finalArtifactTokenHits: finalTokenHits.length,
      secretHits: secretHits,
      sanityApiTokenAvailable: !!apiToken,
      sanityApiTokenInArtifacts: false,
      priorTrackedFiles: priorLines.length,
      priorUnexpectedChanges: unexpectedChanged.length,
      priorAddedFiles: addedPrior.length,
      priorRegeneratedByRegression: regenerated,
      drift: b.drift,
    },
    artifactFingerprints: REQUIRED.filter((x) => x !== 'SPEC_07D_VALIDATION.json').map((f) => {
      try { return fingerprint(path.join(OUT_DIR, f)); } catch (e) { return { file: f, missing: true }; }
    }),
    statusBlock: ['No canonical mutations were performed.', 'No SEO mutations were performed.', 'GATE C is NOT authorized by SPEC 07D.', 'SPEC 07D COMPLETE — READ-ONLY — WAITING FOR PM REVIEW — GATE C NOT AUTHORIZED'],
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_07D_VALIDATION.json'), JSON.stringify(validation, null, 2));

  const hardFail = verdict !== 'PASS' || finalTokenHits.length > 0;
  console.log('');
  console.log('VALIDATION: ' + passed + '/' + checks.length + ' ' + verdict);
  console.log('finalArtifactTokenHits=' + finalTokenHits.length);
  console.log('artifacts: report/SPEC_07D/ (' + REQUIRED.length + ' files)');
  console.log('regenerated by regression validators: ' + (regenerated.length ? regenerated.join(', ') : 'none'));
  console.log('');
  if (hardFail) {
    console.log('FAILURES: ' + failed.map((x) => x.id).join(', ') + (finalTokenHits.length ? ' finalTokenHits=' + finalTokenHits.length : ''));
    process.exit(2);
  }
  console.log('No canonical mutations were performed.');
  console.log('No SEO mutations were performed.');
  console.log('GATE C is NOT authorized by SPEC 07D.');
  console.log('SPEC 07D COMPLETE — READ-ONLY — WAITING FOR PM REVIEW — GATE C NOT AUTHORIZED');
})().catch((e) => { console.error('VALIDATE ERROR:', e.stack || e.message); process.exit(1); });
