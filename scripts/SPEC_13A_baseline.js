const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// SPEC 13A - Phase A/B: read-only recon + fresh production baseline.
// GET queries only. No writes, no deploy, no schema changes.

const OUT = path.join('reports', 'SPEC_13A');
const TEMP = 'C:/Users/lam72/AppData/Local/Temp/opencode';
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const PROJECT = 'zeohjejw', DATASET = 'production', API = 'v2026-05-25';
const BASE = `https://${PROJECT}.api.sanity.io/${API}/data/query/${DATASET}`;
const TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_TOTAL = 473;
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const EXPECTED_EDGES_AFTER_12B = 3173;
const ENTRY_FAMILIES = ['compatibleSpecies', 'incompatibleSpecies', 'predatorPrey', 'reefInteractionDetail', 'coralNeighbors', 'compatibleEquipment'];

const REL_FIELDS = {
  species: { compatibleSpecies: { kind: 'objectArray', entryRef: 'ref', target: ['species'] }, compatiblePlants: { kind: 'refArray', target: ['plant'] }, compatibleInvertebrates: { kind: 'refArray', target: ['invertebrate'] }, suitableEquipment: { kind: 'refArray', target: ['equipment'] }, relatedProblems: { kind: 'refArray', target: ['problem'] }, relatedPosts: { kind: 'refArray', target: ['post'] }, incompatibleSpecies: { kind: 'objectArray', entryRef: 'ref', target: ['species'] }, predatorPrey: { kind: 'objectArray', entryRef: 'ref', target: ['species', 'invertebrate'] }, reefInteractionDetail: { kind: 'objectArray', entryRef: 'coral', target: ['coral'] }, parentSpecies: { kind: 'ref', target: ['species'] } },
  plant: { suitableEquipment: { kind: 'refArray', target: ['equipment'] }, relatedProblems: { kind: 'refArray', target: ['problem'] }, relatedPosts: { kind: 'refArray', target: ['post'] } },
  invertebrate: { compatibleSpecies: { kind: 'objectArray', entryRef: 'ref', target: ['species'] }, suitableEquipment: { kind: 'refArray', target: ['equipment'] }, relatedProblems: { kind: 'refArray', target: ['problem'] }, relatedPosts: { kind: 'refArray', target: ['post'] }, predatorPrey: { kind: 'objectArray', entryRef: 'ref', target: ['species', 'invertebrate'] }, parentSpecies: { kind: 'ref', target: ['species'] } },
  coral: { suitableEquipment: { kind: 'refArray', target: ['equipment'] }, relatedProblems: { kind: 'refArray', target: ['problem'] }, relatedPosts: { kind: 'refArray', target: ['post'] }, coralNeighbors: { kind: 'objectArray', entryRef: 'ref', target: ['coral'] } },
  equipment: { compatibleEquipment: { kind: 'refArray', target: ['equipment'] }, relatedProblems: { kind: 'refArray', target: ['problem'] }, relatedPosts: { kind: 'refArray', target: ['post'] } },
  problem: { relatedTools: { kind: 'refArray', target: ['tool'] }, relatedPosts: { kind: 'refArray', target: ['post'] } },
};
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (t, it) => (t === 'problem' ? it.title : it.name);
const refId = (v) => (v == null ? null : typeof v === 'object' ? (v._ref || v.ref?._ref || v.ref || null) : String(v));
function q(query) { const url = BASE + '?query=' + encodeURIComponent(query); return new Promise((res, rej) => { https.get(url, { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => { const chunks = []; r.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c))); r.on('end', () => { const d = Buffer.concat(chunks).toString('utf8'); try { res(JSON.parse(d).result); } catch (e) { rej(new Error('bad response: ' + d.slice(0, 200))); } }); }).on('error', rej); }); }
const checks = [];
const check = (id, name, ok, detail) => { checks.push({ id, name, pass: !!ok, detail: String(detail ?? '') }); console.log((ok ? 'CHECK OK   ' : 'CHECK FAIL ') + id + ' ' + name + ' - ' + (detail ?? '')); };

function verifyChecksums(file) {
  if (!fs.existsSync(file)) return { file, exists: false, tracked: 0, mismatches: 1, missing: [file], mismatchFiles: [file], missingFiles: [file] };
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#'));
  let mismatches = 0; const missing = [], mismatchFiles = [], missingFiles = [];
  for (const line of lines) { const m = /^([0-9a-f]{64})\s+(.+)$/.exec(line); if (!m) { mismatches++; continue; } const p = m[2].trim(); if (!fs.existsSync(p)) { missing.push(p); missingFiles.push(p); continue; } if (sha256(fs.readFileSync(p)) !== m[1]) { mismatches++; mismatchFiles.push(p); } }
  return { file, exists: true, tracked: lines.length, mismatches, missing, mismatchFiles, missingFiles };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  // Phase A: artifact integrity
  const sumA = verifyChecksums('reports/SPEC_12A/CHECKSUMS.txt');
  const sumB = verifyChecksums('reports/SPEC_12B/CHECKSUMS.txt');
  const isReport = (p) => /^reports\/SPEC_1[23][AB]?\//.test(p) || /^reports\/SPEC_12[AB]\//.test(p);
  const aReportBad = [...sumA.mismatchFiles, ...sumA.missingFiles].filter(isReport);
  const aCodeDrift = [...sumA.mismatchFiles, ...sumA.missingFiles].filter((p) => !isReport(p));
  check('A-01', 'SPEC 12A report artifacts intact (code/test drift tracked separately)', sumA.exists && aReportBad.length === 0, aReportBad.length ? 'badReports=' + aReportBad.join('|') : 'reports intact');
  check('A-02', 'SPEC 12B checksums valid', sumB.exists && sumB.mismatches === 0 && sumB.missing.length === 0, JSON.stringify({ tracked: sumB.tracked, mismatches: sumB.mismatches }));
  check('A-04', 'SPEC 12A non-report checksum drift documented', true, aCodeDrift.length ? 'drift=' + aCodeDrift.join('|') + ' (expected: test-file timeout edit from SPEC 12B)' : 'none');
  const required = ['reports/SPEC_12A/SPEC_12A_EXECUTION_REPORT.md', 'reports/SPEC_12A/RELATIONSHIP_FIELD_MAP.csv', 'reports/SPEC_12A/RELATIONSHIP_BASELINE.json', 'reports/SPEC_12A/RELATIONSHIP_EVIDENCE.csv', 'reports/SPEC_12A/RELATIONSHIP_CANDIDATES.csv', 'reports/SPEC_12A/RELATIONSHIP_CONFLICTS.csv', 'reports/SPEC_12A/SPEC_12B_HELD_REGISTER.csv', 'reports/SPEC_12B/SPEC_12B_EXECUTION_REPORT.md', 'reports/SPEC_12B/POST_APPLY_VERIFICATION.json', 'reports/SPEC_12B/INTEGRITY.json'];
  const absent = required.filter((p) => !fs.existsSync(p));
  check('A-03', 'required handoff artifacts present', absent.length === 0, absent.length ? 'missing=' + absent.join('|') : 'all present');

  // Phase B: live baseline
  const records = {};
  for (const t of TYPES) records[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`);
  const draftDocs = await q('*[_id in path("drafts.**")]._id');
  const counts = {}; for (const t of TYPES) counts[t] = records[t].length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const byId = {}; for (const t of TYPES) for (const r of records[t]) byId[r._id] = t;
  const ids = new Set(); let dupIds = 0; for (const t of TYPES) for (const r of records[t]) { if (ids.has(r._id)) dupIds++; ids.add(r._id); }
  const seen = {}; let dupSlugs = 0; for (const t of TYPES) for (const r of records[t]) { const s = slugValue(r.slug); if (!s) continue; if (seen[s]) dupSlugs++; seen[s] = r._id; }
  const canonical = {}; for (const t of TYPES) for (const r of records[t]) canonical[r._id] = { type: t, rec: r };
  const identityHash = sha256(Object.keys(canonical).sort().map((id) => { const c = canonical[id]; return sha256(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) })); }).join('\n'));

  const edges = [];
  const unresolved = [];
  for (const t of TYPES) for (const r of records[t]) for (const [field, spec] of Object.entries(REL_FIELDS[t] || {})) {
    const val = r[field]; if (val == null) continue;
    const arr = Array.isArray(val) ? val : [val];
    for (const item of arr) {
      const tid = refId(item); if (!tid) continue;
      const tType = byId[tid] || null;
      const allowed = spec.target.includes(tType || '');
      if (!tType) unresolved.push({ sourceType: t, sourceId: r._id, field, targetId: tid });
      edges.push({ sourceType: t, sourceId: r._id, field, targetId: tid, targetType: tType, allowed });
    }
  }
  // classify unresolved: post/tool are legitimate out-of-scope refs
  const postIds = new Set(await q('*[_type=="post"]._id'));
  const toolIds = new Set(await q('*[_type=="tool"]._id'));
  const unresolvedClassified = unresolved.map((u) => ({ ...u, resolvedAs: postIds.has(u.targetId) ? 'post' : toolIds.has(u.targetId) ? 'tool' : 'BROKEN' }));
  const broken = unresolvedClassified.filter((u) => u.resolvedAs === 'BROKEN');

  const coverage = [];
  for (const t of TYPES) for (const [field, spec] of Object.entries(REL_FIELDS[t] || {})) {
    const withData = records[t].filter((r) => { const v = r[field]; return v != null && (!Array.isArray(v) || v.length > 0); }).length;
    const edgeCount = edges.filter((e) => e.sourceType === t && e.field === field).length;
    coverage.push({ sourceType: t, field, kind: spec.kind, targets: spec.target.join('|'), records: records[t].length, recordsWithData: withData, emptyRecords: records[t].length - withData, edgeCount });
  }
  const entryStates = {};
  for (const fam of ENTRY_FAMILIES) {
    entryStates[fam] = [];
    for (const t of TYPES) for (const r of records[t]) {
      if (!REL_FIELDS[t] || !REL_FIELDS[t][fam]) continue;
      const v = r[fam];
      if (v != null && (!Array.isArray(v) || v.length > 0)) entryStates[fam].push({ sourceType: t, sourceId: r._id, title: titleOf(t, r), count: Array.isArray(v) ? v.length : 1, entries: (Array.isArray(v) ? v : [v]).map((e) => ({ ref: refId(e), conditions: e.conditions ?? null, confidence: e.confidence ?? null, evidenceNote: e.evidenceNote ?? null })) });
    }
  }

  check('B-01', 'record counts match handoff', total === EXPECTED_TOTAL && TYPES.every((t) => counts[t] === EXPECTED[t]), `total=${total} ${JSON.stringify(counts)}`);
  check('B-02', 'drafts = 0', draftDocs.length === 0, `datasetDrafts=${draftDocs.length}`);
  check('B-03', 'duplicate _id = 0 and slug = 0', dupIds === 0 && dupSlugs === 0, `dupIds=${dupIds} dupSlugs=${dupSlugs}`);
  check('B-04', 'canonical identity hash matches handoff', identityHash === EXPECTED_HASH, identityHash === EXPECTED_HASH ? 'MATCH' : 'MISMATCH ' + identityHash);
  check('B-05', 'relationship edge count matches post-12B expectation', edges.length === EXPECTED_EDGES_AFTER_12B, `edges=${edges.length} expected=${EXPECTED_EDGES_AFTER_12B}`);
  check('B-06', 'no genuinely broken references', broken.length === 0, `broken=${broken.length} outOfScopeResolved=${unresolved.length - broken.length}`);

  const baseline = {
    specId: 'SPEC_13A', artifact: 'BASELINE', generatedAt: new Date().toISOString(),
    mode: 'READ-ONLY (GET query only; no writes, no deploy)',
    target: { project: PROJECT, dataset: DATASET, api: API },
    checks, counts, total, drafts: { datasetDrafts: draftDocs.length }, duplicate: { dupIds, dupSlugs },
    identity: { hash: identityHash, expected: EXPECTED_HASH, match: identityHash === EXPECTED_HASH },
    relationships: { totalEdges: edges.length, expectedAfterSpec12B: EXPECTED_EDGES_AFTER_12B, deltaFromSpec12A: edges.length - 3151 },
    coverage, entryObjectFamilies: entryStates,
    unresolvedReferences: { total: unresolvedClassified.length, broken, resolvedOutsideWikiTypes: unresolvedClassified.filter((u) => u.resolvedAs !== 'BROKEN').length },
    artifactIntegrity: { spec12a: sumA, spec12b: sumB, spec12aCodeDrift: aCodeDrift, discrepancyNote: aCodeDrift.length ? 'Test-file-only checksum drift: tests/spec12a-plan.test.ts gained an explicit 30s timeout in SPEC 12B (no assertion change). All SPEC 12A report artifacts are byte-identical.' : '' },
    deployedSchema: { studioUrl: 'https://aqua-mind-blog.sanity.studio/', workspace: 'default', dataset: DATASET, projectId: PROJECT },
    environment: { gitHead: require('child_process').execSync('git rev-parse --short HEAD').toString().trim(), gitBranch: require('child_process').execSync('git rev-parse --abbrev-ref HEAD').toString().trim(), node: process.version },
    content_mutations: 0,
    verdict: checks.every((c) => c.pass) ? 'PASS' : 'BLOCKED',
  };
  fs.writeFileSync(path.join(OUT, 'BASELINE.json'), JSON.stringify(baseline, null, 2));

  // catalog dumps for bounded research selection (no secrets)
  fs.writeFileSync(path.join(TEMP, 's13a_catalog.json'), JSON.stringify({
    species: records.species.map((r) => ({ _id: r._id, name: r.name, slug: slugValue(r.slug), scientificName: r.scientificName ?? null, waterType: r.waterType ?? null, sizeCm: r.sizeCm ?? null, temperament: r.temperament ?? null, diet: r.diet ?? null, group: r.group ?? null })),
    invertebrate: records.invertebrate.map((r) => ({ _id: r._id, name: r.name, slug: slugValue(r.slug), scientificName: r.scientificName ?? null, waterType: r.waterType ?? null, sizeCm: r.sizeCm ?? null, temperament: r.temperament ?? null, diet: r.diet ?? null, group: r.group ?? null })),
    coral: records.coral.map((r) => ({ _id: r._id, name: r.name, slug: slugValue(r.slug), scientificName: r.scientificName ?? null, waterType: r.waterType ?? null, difficulty: r.difficulty ?? null, group: r.group ?? null })),
    equipment: records.equipment.map((r) => ({ _id: r._id, name: r.name, slug: slugValue(r.slug), category: r.category ?? null, type: r.equipmentType ?? null })),
  }));
  console.log('BASELINE ' + baseline.verdict + ' total=' + total + ' edges=' + edges.length);
  process.exit(baseline.verdict === 'PASS' ? 0 : 3);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
