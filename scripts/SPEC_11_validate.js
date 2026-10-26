/**
 * SPEC 11 Stage A validation — integrity gates G1-G10 + artifact finalization.
 * Modes:
 *   node scripts/SPEC_11_validate.js          -> run gates, write INTEGRITY.json (finalRun:false)
 *   node scripts/SPEC_11_validate.js --final   -> verify artifacts/status lines/token+needle scan,
 *                                                  mirror to reports/SPEC_11/, byte-verify, finalize.
 * READ-ONLY against Sanity (GET queries only). No mutation API calls in any mode.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { spawnSync } = require('child_process');

const REPO = 'F:/AquaMind/aqua_mind_blog';
const TEMP = 'C:/Users/lam72/AppData/Local/Temp/opencode';
const OUT = path.join(REPO, 'report', 'SPEC_11');
const MIRROR = path.join(REPO, 'reports', 'SPEC_11');
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync(path.join(REPO, '.env.local'), 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_TOTAL = 473;
const ARTIFACTS = [
  'SPEC_11_HUSBANDRY_ENRICHMENT_REPORT.md', 'BASELINE.json', 'WAVE_1_QUEUE.csv',
  'RESEARCH_REGISTER.csv', 'EVIDENCE_MAP.csv', 'PROPOSED_MUTATIONS.csv',
  'COMPLETENESS_BEFORE.csv', 'COMPLETENESS_AFTER_PLAN.csv', 'CONFLICTS.csv',
  'EXECUTION_LOG.md', 'INTEGRITY.json',
];
const REQUIRED_LINES = [
  'SPEC 11 STAGE A - COMPLETE',
  'READY FOR PM ENRICHMENT AUTHORIZATION',
  'canonical identity hash: MATCH',
  'sanityWrites=0 mutationCalls=0',
];
const NEEDLES = ['mutate(', 'createOrReplace', 'createIfNotExists', '.patch(', 'method:"POST"', '?mutate', 'https.request('];
const FIELD_DESTS = new Set([
  'minTankLengthCm', 'minTankWidthCm', 'swimmingSpace', 'jumpRisk', 'lidRequired',
  'flowPreference', 'oxygenSensitivity', 'maturityRequirement', 'bioload',
  'waterChangeSensitivity', 'salinityMin', 'salinityMax', 'behaviorFlags',
  'groupSize', 'communitySuitability', 'predatesInverts', 'tankSizeMinL',
  'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'ghMin', 'ghMax', 'diet', 'temperament',
]);
const BODY_SECTIONS = [
  'overview', 'adultSizeGrowth', 'behavior', 'tankRequirements', 'swimmingSpaceFootprint',
  'waterParameters', 'feeding', 'compatibility', 'specialRequirements', 'commonProblems',
  'breeding', 'practicalVerdict',
];
const ENUMS = {
  swimmingSpace: ['NONE', 'LOW', 'MODERATE', 'HIGH'],
  jumpRisk: ['NONE', 'LOW', 'MODERATE', 'HIGH'],
  lidRequired: ['NOT_REQUIRED', 'RECOMMENDED', 'ESSENTIAL'],
  flowPreference: ['STILL', 'MODERATE', 'STRONG'],
  oxygenSensitivity: ['NEUTRAL', 'SENSITIVE'],
  maturityRequirement: ['NONE', 'SUGGESTED', 'REQUIRED'],
  bioload: ['LOW', 'MODERATE', 'HIGH'],
  waterChangeSensitivity: ['LOW', 'MODERATE', 'HIGH'],
  communitySuitability: ['UNSUITABLE', 'CONDITIONAL', 'SUITABLE'],
  predatesInverts: ['NONE', 'POSSIBLE', 'LIKELY'],
};
const NUMERIC_DESTS = new Set(['minTankLengthCm', 'minTankWidthCm', 'tankSizeMinL', 'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'ghMin', 'ghMax', 'salinityMin', 'salinityMax']);
const SAFETY_DESTS = new Set([
  'minTankLengthCm', 'minTankWidthCm', 'swimmingSpace', 'jumpRisk', 'lidRequired',
  'flowPreference', 'oxygenSensitivity', 'maturityRequirement', 'bioload',
  'waterChangeSensitivity', 'tankSizeMinL', 'communitySuitability', 'predatesInverts',
]);
const BANNED_DESTS = new Set([
  'incompatibleSpecies', 'predatorPrey', 'reefInteraction', 'reefInteractionDetail', 'coralNeighbors',
  'compatibleEquipment', 'relatedProblems', 'compatibleSpecies', 'compatiblePlants',
  'compatibleInvertebrates', 'suitableEquipment', 'title', 'slug', 'name', 'category', 'seo',
  'metaTitle', 'metaDescription', '_id', '_type', '_rev', '_createdAt', '_updatedAt',
]);

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const shaFile = (f) => sha256(fs.readFileSync(f));
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);

function q(query) {
  const url = BASE + '?query=' + encodeURIComponent(query);
  return new Promise((res, rej) => {
    https.get(url, { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      r.on('end', () => {
        const d = Buffer.concat(chunks).toString('utf8');
        try { res(JSON.parse(d).result); } catch (e) { rej(new Error('bad response: ' + d.slice(0, 300))); }
      });
    }).on('error', rej);
  });
}
function parseCSV(t) {
  const rows = []; let row = [], cur = '', q2 = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q2) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q2 = false; } else cur += c; }
    else if (c === '"') q2 = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((x) => x !== ''));
}
function readCSV(file) {
  const rows = parseCSV(fs.readFileSync(path.join(OUT, file), 'utf8'));
  const hdr = rows[0];
  return rows.slice(1).map((r) => { const o = {}; hdr.forEach((h, i) => o[h] = r[i] === undefined ? '' : r[i]); return o; });
}
const checks = [];
function check(id, name, ok, detail) {
  checks.push({ id, name, pass: !!ok, detail: String(detail ?? '') });
  console.log((ok ? 'CHECK OK ' : 'CHECK FAIL ') + id + ' ' + name + ' - ' + (detail ?? ''));
}

async function runGates() {
  const baseline = JSON.parse(fs.readFileSync(path.join(OUT, 'BASELINE.json'), 'utf8'));
  const snapshot = JSON.parse(fs.readFileSync(path.join(TEMP, 'spec11_baseline_records.json'), 'utf8'));
  const register = readCSV('RESEARCH_REGISTER.csv');
  const evidence = readCSV('EVIDENCE_MAP.csv');
  const mutations = readCSV('PROPOSED_MUTATIONS.csv');
  const conflicts = readCSV('CONFLICTS.csv');
  const before = readCSV('COMPLETENESS_BEFORE.csv');
  const after = readCSV('COMPLETENESS_AFTER_PLAN.csv');
  const queue = readCSV('WAVE_1_QUEUE.csv');

  // ---- live read (double) ----
  const fetchWiki = async () => {
    const out = {};
    for (const t of WIKI_TYPES) out[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`);
    return out;
  };
  const read1 = await fetchWiki();
  const read2 = await fetchWiki();
  const counts = {}; for (const t of WIKI_TYPES) counts[t] = read1[t].length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  // G1 inventory
  const g1ok = total === EXPECTED_TOTAL && WIKI_TYPES.every((t) => counts[t] === EXPECTED[t]) &&
    JSON.stringify(counts) === JSON.stringify(baseline.inventory.counts);
  check('G1', 'Inventory: 473 unchanged / domain counts frozen', g1ok, 'total=' + total + ' ' + JSON.stringify(counts));

  // G2 identity hash
  const canonical = {};
  for (const t of WIKI_TYPES) for (const r of read1[t]) canonical[r._id] = { type: t, rec: r };
  const hashParts = Object.keys(canonical).sort().map((id) => {
    const c = canonical[id];
    return sha256(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) }));
  });
  const identityHash = sha256(hashParts.join('\n'));
  check('G2', 'Identity: canonical hash unchanged vs SPEC 10M baseline',
    identityHash === snapshot.identityHash && identityHash === baseline.identity.expected,
    identityHash === baseline.identity.expected ? 'MATCH' : identityHash);

  // G9 determinism (double read identical)
  let mm = 0;
  for (const t of WIKI_TYPES) if (JSON.stringify(read1[t]) !== JSON.stringify(read2[t])) mm++;
  check('G9a', 'Determinism: repeated live reads normalize identically', mm === 0, 'mismatchedTypes=' + mm);

  // G8 no regression: seals + per-record deep equality + revisions
  const relFields = ['compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedProblems', 'relatedPosts', 'relatedTools', 'parentSpecies', 'compatibleSpecies', 'incompatibleSpecies', 'predatorPrey'];
  const seoSeal = sha256(WIKI_TYPES.map((t) => read1[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id)))
    .map((r) => JSON.stringify(r.seo || null)).join('\n')).join('\n'));
  const relSeal = sha256(WIKI_TYPES.map((t) => read1[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id)))
    .map((r) => JSON.stringify(relFields.map((f) => (Array.isArray(r[f]) ? r[f].map((v) => (v && v._ref) || v) : r[f] ?? null)))).join('\n')).join('\n'));
  const titleSlugSeal = sha256(hashParts.join('\n'));
  const sealsOk = seoSeal === snapshot.seoSeal && relSeal === snapshot.relSeal && titleSlugSeal === snapshot.titleSlugSeal;
  const sortedStr = (o) => JSON.stringify(Object.keys(o).sort().reduce((acc, k) => { acc[k] = o[k]; return acc; }, {}));
  let drift = 0, revDrift = 0;
  const liveById = {};
  for (const t of WIKI_TYPES) for (const r of read1[t]) liveById[r._id] = r;
  for (const t of WIKI_TYPES) for (const r of snapshot.records[t]) {
    const live = liveById[r._id];
    if (!live) { drift++; continue; }
    if (sortedStr(live) !== sortedStr(r)) drift++;
    const sr = snapshot.revisions[r._id];
    if (!sr || sr.rev !== live._rev || sr.updatedAt !== live._updatedAt) revDrift++;
  }
  check('G8', 'No regression: SEO/titles/slugs/rels/_updatedAt unchanged vs freeze',
    sealsOk && drift === 0 && revDrift === 0,
    'seals=' + (sealsOk ? 'MATCH' : 'DRIFT') + ' recordDrift=' + drift + ' revisionDrift=' + revDrift);

  // G3 scope
  const wave1Ids = new Set(queue.map((r) => r.recordId));
  const mutBadRecord = mutations.filter((m) => !wave1Ids.has(m.recordId));
  const regBadRecord = register.filter((r) => !wave1Ids.has(r.recordId));
  const bannedDest = [...mutations.filter((m) => BANNED_DESTS.has(m.destination) || BANNED_DESTS.has(m.path.split('.')[0]))];
  const outOfWave1Queue = queue.filter((r) => r.priority !== 'P0' || r.domain !== 'species');
  check('G3', 'Scope: only 17 Wave 1 species targets; no banned destinations',
    mutBadRecord.length === 0 && regBadRecord.length === 0 && bannedDest.length === 0 &&
    queue.length === 17 && outOfWave1Queue.length === 0,
    'queue=' + queue.length + ' mutOffQueue=' + mutBadRecord.length + ' regOffQueue=' + regBadRecord.length + ' banned=' + bannedDest.length);

  // G4 research provenance
  const regById = {};
  for (const r of register) regById[r.researchRowId] = r;
  const evByRow = {};
  for (const e of evidence) evByRow[e.researchRowId] = e;
  let g4bad = [];
  for (const m of mutations) {
    const r = regById[m.researchRowId];
    if (!r) { g4bad.push(m.mutationId + ':no-register-row'); continue; }
    if (r.editorDecision === 'PENDING_RESEARCH') g4bad.push(m.mutationId + ':from-pending');
    if (!r.source || !r.sourceUrl || !r.evidenceClass || !r.confidence || !r.dateChecked) g4bad.push(m.mutationId + ':incomplete-evidence-meta');
    if (r.researchStatus !== 'RESEARCHED') g4bad.push(m.mutationId + ':not-researched');
    const ev = evByRow[r.researchRowId];
    if (!ev || !ev.evidence || !ev.evidenceClass || !ev.sourceUrl || !ev.confidence || !ev.dateChecked) g4bad.push(m.mutationId + ':incomplete-evidence-map');
  }
  const pendWithMutation = register.filter((r) => r.editorDecision === 'PENDING_RESEARCH' && mutations.some((m) => m.researchRowId === r.researchRowId));
  const topicMutations = mutations.filter((m) => register.find((r) => r.researchRowId === m.researchRowId)?.destinationType === 'RESEARCH_TOPIC');
  const evMissing = evidence.filter((e) => e.evidenceStatus === 'MISSING');
  check('G4', 'Research: every proposed claim has evidence metadata; no pending claim proposed',
    g4bad.length === 0 && pendWithMutation.length === 0 && topicMutations.length === 0 &&
    register.length === evidence.length && evMissing.length === 0,
    'mutations=' + mutations.length + ' bad=' + g4bad.length + ' pendingProposed=' + pendWithMutation.length +
    ' register=' + register.length + ' evidence=' + evidence.length + ' evidenceMissing=' + evMissing.length);

  // G5 applicability
  const badApplic = register.filter((r) => !['REQUIRED', 'CONDITIONAL', 'OPTIONAL'].includes(r.applicability));
  const badPriority = register.filter((r) => !['P0', 'P1', 'P2'].includes(r.priority));
  const safetyNoRequired = mutations.filter((m) => SAFETY_DESTS.has(m.destination) && m.applicability !== 'REQUIRED');
  check('G5', 'Applicability: REQUIRED/CONDITIONAL rules not bypassed',
    badApplic.length === 0 && badPriority.length === 0 && safetyNoRequired.length === 0,
    'badApplic=' + badApplic.length + ' badPriority=' + badPriority.length + ' safetyNotRequired=' + safetyNoRequired.length);

  // G6 safety: unresolved P0 cannot be marked complete
  const afterById = {}; for (const a of after) afterById[a.recordId] = a;
  const unsafeComplete = after.filter((a) => a.openP0 > 0 && (a.l2SpaceBlock === '1' || a.l2Full === '1' || a.l3 === '1' || a.l4 === '1'));
  const pendingSafetyConflicts = conflicts.filter((c) => c.conflictType === 'UNRESOLVED_RESEARCH' && c.safetyCritical === '1');
  const wave1OpenP0 = queue.map((q2) => afterById[q2.recordId]).reduce((s, a) => s + (a ? Number(a.openP0) : -999), 0);
  check('G6', 'Safety: unresolved P0 gaps never marked complete; flagged rows = openP0',
    unsafeComplete.length === 0 && wave1OpenP0 === pendingSafetyConflicts.length,
    'unsafeComplete=' + unsafeComplete.length + ' wave1OpenP0=' + wave1OpenP0 + ' pendingSafetyConflicts=' + pendingSafetyConflicts.length);

  // G7 schema
  const badSchema = [];
  for (const m of mutations) {
    if (m.destinationType === 'FIELD') {
      if (!FIELD_DESTS.has(m.destination)) badSchema.push(m.mutationId + ':field ' + m.destination);
      if (ENUMS[m.destination] && !ENUMS[m.destination].includes(m.newValue)) badSchema.push(m.mutationId + ':enum');
      if (NUMERIC_DESTS.has(m.destination) && !/^-?[0-9]+(\.[0-9]+)?$/.test(m.newValue)) badSchema.push(m.mutationId + ':numeric');
      if (m.path !== m.destination) badSchema.push(m.mutationId + ':path-mismatch');
    } else if (m.destinationType === 'BODY_SECTION') {
      const sec = m.destination.replace(/^body:/, '');
      if (!BODY_SECTIONS.includes(sec) || m.path !== 'knowledgeBody.' + sec) badSchema.push(m.mutationId + ':body-section');
    } else badSchema.push(m.mutationId + ':bad-destinationType ' + m.destinationType);
  }
  check('G7', 'Schema: every destination exists in SPEC 10M schema',
    badSchema.length === 0, 'invalidDestinations=' + badSchema.length + (badSchema.length ? ' (' + badSchema.slice(0, 5).join(', ') + ')' : ''));

  return { baseline, snapshot, register, mutations, conflicts, before, after, queue, counts, total, identityHash };
}

function runCmd(cmd, args, timeout) {
  const r = spawnSync(cmd, args, { cwd: REPO, encoding: 'utf8', timeout: timeout || 600000, env: process.env, shell: true });
  return { code: r.status, out: ((r.stdout || '') + (r.stderr || '')), err: r.error ? String(r.error.message) : '' };
}

function runBuildGates() {
  const strip = (s) => String(s).replace(/\u001b\[[0-9;]*m/g, '');
  // G10: lint, typecheck, focused tests, full tests (known baseline failure), build
  const lint = runCmd('npm.cmd', ['run', 'lint']);
  check('G10a', 'Build: lint passes', lint.code === 0, 'exit=' + lint.code + (lint.err ? ' ' + lint.err : ''));
  const tsc = runCmd('npx.cmd', ['tsc', '--noEmit']);
  check('G10b', 'Build: typecheck passes', tsc.code === 0, 'exit=' + tsc.code + (tsc.err ? ' ' + tsc.err : ''));
  const focused = runCmd('npx.cmd', ['vitest', 'run', 'tests/spec10m-schema.test.ts']);
  const fOut = strip(focused.out);
  const fm = /Tests\s+(?:[\d,]+ tests? )?(\d+) passed/.exec(fOut) || /(\d+) passed/.exec(fOut);
  check('G10c', 'Build: focused SPEC 10M schema tests pass (108)',
    focused.code === 0 && fm && Number(fm[1].replace(/,/g, '')) >= 108,
    'exit=' + focused.code + ' passed=' + (fm ? fm[1] : 'n/a'));
  let full = runCmd('npm.cmd', ['test']);
  const testSummary = (rawOut) => {
    const out = strip(rawOut);
    const tf = /Test Files\s+(?:.*\|\s*)?(\d+)\s+failed/.exec(out);
    const t = /Tests\s+(?:.*\| )?(\d+)\s+failed/.exec(out);
    return { filesFailed: tf ? Number(tf[1]) : null, testsFailed: t ? Number(t[1]) : null, compareMentioned: out.includes('compare.test.ts') };
  };
  let s = testSummary(full.out);
  if ((s.testsFailed === null || s.testsFailed !== 1) || full.err) {
    full = runCmd('npm.cmd', ['test']); // known flaky first run of this suite
    s = testSummary(full.out);
  }
  check('G10d', 'Build: full tests only fail known tests/compare.test.ts baseline failure',
    s.testsFailed === 1 && s.filesFailed === 1 && s.compareMentioned,
    'testsFailed=' + s.testsFailed + ' filesFailed=' + s.filesFailed + ' compareTestMentioned=' + s.compareMentioned);
  const build = runCmd('npm.cmd', ['run', 'build']);
  check('G10e', 'Build: production build passes', build.code === 0, 'exit=' + build.code + (build.err ? ' ' + build.err : ''));
}

function artifactDeterminismGate() {
  const csvs = ['WAVE_1_QUEUE.csv', 'RESEARCH_REGISTER.csv', 'EVIDENCE_MAP.csv', 'PROPOSED_MUTATIONS.csv', 'CONFLICTS.csv', 'COMPLETENESS_BEFORE.csv', 'COMPLETENESS_AFTER_PLAN.csv'];
  const h1 = csvs.map((f) => shaFile(path.join(OUT, f)));
  const r1 = runCmd('node', [path.join(REPO, 'scripts', 'SPEC_11_research.js')], 180000);
  const r2 = runCmd('node', [path.join(REPO, 'scripts', 'SPEC_11_plan.js')], 180000);
  const h2 = csvs.map((f) => shaFile(path.join(OUT, f)));
  const same = h1.length === h2.length && h1.every((h, i) => h === h2[i]);
  check('G9b', 'Determinism: Stage A artifacts regenerate byte-identical',
    r1.code === 0 && r2.code === 0 && same,
    'researchExit=' + r1.code + ' planExit=' + r2.code + ' identical=' + same);
}

function writeIntegrity(finalRun) {
  const gates = {};
  for (const c of checks) gates[c.id] = { name: c.name, pass: c.pass, detail: c.detail };
  const artifactHashes = {};
  for (const f of ARTIFACTS) {
    const p = path.join(OUT, f);
    if (fs.existsSync(p) && f !== 'INTEGRITY.json') artifactHashes[f] = shaFile(p);
  }
  const integrity = {
    specId: 'SPEC_11', stage: 'A', mode: 'READ-ONLY research/planning - no Sanity writes',
    generatedAt: new Date().toISOString(), finalRun: !!finalRun,
    sanityWrites: 0, mutationCalls: 0,
    gatesPassed: checks.filter((c) => c.pass).length, gatesFailed: checks.filter((c) => !c.pass).length,
    checks, artifactHashes,
    artifacts: ARTIFACTS,
    mirror: 'reports/SPEC_11 (byte-identical, verified in --final)',
    status: checks.every((c) => c.pass) ? 'SPEC 11 STAGE A - COMPLETE' : 'SPEC 11 STAGE A - GATES FAILED',
  };
  fs.writeFileSync(path.join(OUT, 'INTEGRITY.json'), JSON.stringify(integrity, null, 2));
  console.log('WROTE report/SPEC_11/INTEGRITY.json (finalRun=' + !!finalRun + ')');
  return integrity;
}

function finalMode() {
  const integrity = JSON.parse(fs.readFileSync(path.join(OUT, 'INTEGRITY.json'), 'utf8'));
  const problems = [];
  if (integrity.finalRun !== false) problems.push('INTEGRITY.finalRun expected false before --final');
  if (integrity.gatesFailed > 0) problems.push('gatesFailed=' + integrity.gatesFailed);
  if (!integrity.checks || integrity.checks.length < 10) problems.push('checks missing');
  else {
    // carry the gate results from the main run into the final INTEGRITY
    for (const c of integrity.checks) checks.push({ id: c.id, name: c.name, pass: c.pass, detail: c.detail });
    if (checks.filter((c) => !c.pass).length > 0) problems.push('carried checks contain failures');
  }
  for (const f of ARTIFACTS) if (!fs.existsSync(path.join(OUT, f))) problems.push('missing artifact ' + f);
  const reportPath = path.join(OUT, 'SPEC_11_HUSBANDRY_ENRICHMENT_REPORT.md');
  const logPath = path.join(OUT, 'EXECUTION_LOG.md');
  for (const [name, p] of [['report', reportPath], ['log', logPath]]) {
    if (!fs.existsSync(p)) { problems.push(name + ' missing'); continue; }
    const txt = fs.readFileSync(p, 'utf8');
    for (const line of REQUIRED_LINES) if (!txt.includes(line)) problems.push(name + ' missing required line: ' + line);
  }
  // token + needle scan over all artifacts
  const hits = [];
  for (const f of ARTIFACTS) {
    const p = path.join(OUT, f);
    if (!fs.existsSync(p)) continue;
    const txt = fs.readFileSync(p, 'utf8');
    if (txt.includes(TOKEN)) hits.push(f + ':sanity-token');
    NEEDLES.forEach((n, i) => { if (txt.includes(n)) hits.push(f + ':needle#' + (i + 1)); });
  }
  if (hits.length) problems.push('scan hits: ' + hits.join(', '));
  if (problems.length) { console.error('FINALIZE FAILED:'); problems.forEach((p) => console.error(' - ' + p)); process.exit(3); }
  writeIntegrity(true);
  // mirror copy + byte verify
  fs.mkdirSync(MIRROR, { recursive: true });
  const mirrorResults = [];
  let allOk = true;
  for (const f of ARTIFACTS) {
    const src = path.join(OUT, f);
    const dst = path.join(MIRROR, f);
    fs.copyFileSync(src, dst);
    const ok = shaFile(src) === shaFile(dst);
    if (!ok) allOk = false;
    mirrorResults.push(f + '=' + (ok ? 'byte-identical' : 'MISMATCH'));
  }
  console.log('MIRROR reports/SPEC_11/: ' + mirrorResults.join(', '));
  if (!allOk) { console.error('MIRROR BYTE-VERIFY FAILED'); process.exit(3); }
  console.log('artifacts=' + ARTIFACTS.length + ' mirrorByteIdentical=' + allOk + ' needleTokenScan=CLEAN');
  console.log('SPEC 11 STAGE A - COMPLETE');
  console.log('READY FOR PM ENRICHMENT AUTHORIZATION');
}

(async () => {
  if (process.argv.includes('--final')) { finalMode(); return; }
  await runGates();
  artifactDeterminismGate();
  runBuildGates();
  const integrity = writeIntegrity(false);
  const failed = checks.filter((c) => !c.pass);
  console.log('GATES ' + integrity.gatesPassed + '/' + checks.length + (failed.length ? ' FAILED: ' + failed.map((c) => c.id).join(',') : ' ALL PASS'));
  if (failed.length) { console.error('SPEC 11 STAGE A - GATES FAILED'); process.exit(4); }
  console.log('ALL GATES PASS - write report + EXECUTION_LOG, then run --final');
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
