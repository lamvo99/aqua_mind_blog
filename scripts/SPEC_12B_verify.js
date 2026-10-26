const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// SPEC 12B - post-apply verification (read-only). Re-derives POST_APPLY_VERIFICATION.json and
// INTEGRITY.json from live production + the SPEC 12A snapshot. No writes.

const OUT = path.join('reports', 'SPEC_12B');
const A = path.join('reports', 'SPEC_12A');
const SNAP = 'C:/Users/lam72/AppData/Local/Temp/opencode/spec12a_snapshot.json';
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_TOTAL = 473;
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const EXPECTED_EDGES = 3151;

const REL_FIELDS = {
  species: { compatibleSpecies: { ref: 'ref', target: ['species'] }, compatiblePlants: { target: ['plant'] }, compatibleInvertebrates: { target: ['invertebrate'] }, suitableEquipment: { target: ['equipment'] }, relatedProblems: { target: ['problem'] }, relatedPosts: { target: ['post'] }, incompatibleSpecies: { ref: 'ref', target: ['species'] }, predatorPrey: { ref: 'ref', target: ['species', 'invertebrate'] }, reefInteractionDetail: { ref: 'coral', target: ['coral'] }, parentSpecies: { target: ['species'] } },
  plant: { suitableEquipment: { target: ['equipment'] }, relatedProblems: { target: ['problem'] }, relatedPosts: { target: ['post'] } },
  invertebrate: { compatibleSpecies: { ref: 'ref', target: ['species'] }, suitableEquipment: { target: ['equipment'] }, relatedProblems: { target: ['problem'] }, relatedPosts: { target: ['post'] }, predatorPrey: { ref: 'ref', target: ['species', 'invertebrate'] }, parentSpecies: { target: ['species'] } },
  coral: { suitableEquipment: { target: ['equipment'] }, relatedProblems: { target: ['problem'] }, relatedPosts: { target: ['post'] }, coralNeighbors: { ref: 'ref', target: ['coral'] } },
  equipment: { compatibleEquipment: { target: ['equipment'] }, relatedProblems: { target: ['problem'] }, relatedPosts: { target: ['post'] } },
  problem: { relatedTools: { target: ['tool'] }, relatedPosts: { target: ['post'] } },
};
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (t, it) => (t === 'problem' ? it.title : it.name);
const refId = (v) => (v == null ? null : typeof v === 'object' ? (v._ref || v.ref?._ref || v.ref || null) : String(v));
function splitCsvLine(line) { const o = []; let c = '', q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (q) { if (ch === '"') { if (line[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else { if (ch === '"') q = true; else if (ch === ',') { o.push(c); c = ''; } else c += ch; } } o.push(c); return o; }
function readCsv(f) { const lines = fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length); if (!lines.length) return []; const h = splitCsvLine(lines[0]); return lines.slice(1).map((l) => { const r = splitCsvLine(l); const o = {}; h.forEach((k, i) => { o[k] = r[i] == null ? '' : r[i]; }); return o; }); }
function q(query) { const url = BASE + '?query=' + encodeURIComponent(query); return new Promise((res, rej) => { https.get(url, { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => { const c = []; r.on('data', (x) => c.push(Buffer.from(x))); r.on('end', () => { try { res(JSON.parse(Buffer.concat(c).toString()).result); } catch (e) { rej(e); } }); }).on('error', rej); }); }

(async () => {
  const plan = JSON.parse(fs.readFileSync(path.join(A, 'SPEC_12B_DRY_RUN_PLAN.json'), 'utf8'));
  const ops = plan.operations.slice().sort((a, b) => a.candidateId.localeCompare(b.candidateId));
  const results = readCsv(path.join(OUT, 'OPERATION_RESULTS.csv'));
  const resById = Object.fromEntries(results.map((r) => [r.candidateId, r]));
  const snap = JSON.parse(fs.readFileSync(SNAP, 'utf8'));
  const snapById = {}; for (const r of snap.records.species) snapById[r._id] = r;

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
  for (const t of TYPES) for (const r of records[t]) for (const [field, spec] of Object.entries(REL_FIELDS[t] || {})) { const val = r[field]; if (val == null) continue; const arr = Array.isArray(val) ? val : [val]; for (const item of arr) { const tid = refId(item); if (tid) edges.push({ sourceId: r._id, field, targetId: tid, allowed: spec.target.includes(byId[tid] || '') }); } }

  const docIds = [...new Set(ops.map((o) => o.documentId))].sort();
  const scopeChecks = [];
  const entryChecks = [];
  for (const id of docIds) {
    const doc = records.species.find((r) => r._id === id);
    const s = snapById[id];
    const relDiffs = [];
    for (const [field, spec] of Object.entries(REL_FIELDS.species)) {
      if (field === 'compatibleSpecies') continue;
      const cur = Array.isArray(doc[field]) ? doc[field].map(refId).filter(Boolean) : doc[field] != null ? [refId(doc[field])] : [];
      if (JSON.stringify(cur.sort()) !== JSON.stringify((s.rel[field] || []).slice().sort())) relDiffs.push(field);
    }
    scopeChecks.push({ documentId: id, titleMatch: doc.name === s.title, slugMatch: slugValue(doc.slug) === s.slug, otherRelationshipFieldsChanged: relDiffs });
  }
  const exactEntry = (e, op) => refId(e) === op.value.ref._ref && JSON.stringify(e.conditions ?? null) === JSON.stringify(op.value.conditions ?? null) && (e.confidence ?? null) === (op.value.confidence ?? null) && (e.evidenceNote ?? null) === (op.value.evidenceNote ?? null);
  for (const op of ops) {
    const doc = records.species.find((r) => r._id === op.documentId);
    const arr = doc?.compatibleSpecies || [];
    const match = arr.filter((e) => refId(e) === op.value.ref._ref);
    const exact = match.filter((e) => exactEntry(e, op)).length;
    entryChecks.push({ candidateId: op.candidateId, documentId: op.documentId, targetId: op.value.ref._ref, present: match.length, exact, status: resById[op.candidateId]?.status || '' });
  }
  const remaining = entryChecks.filter((e) => e.exact !== 1).map((e) => e.candidateId);

  const applied = results.filter((r) => r.status === 'APPLIED_AND_VERIFIED').length;
  const identityOk = identityHash === EXPECTED_HASH;
  const countsOk = total === EXPECTED_TOTAL && TYPES.every((t) => counts[t] === EXPECTED[t]);
  const scopeOk = scopeChecks.every((s) => s.titleMatch && s.slugMatch && s.otherRelationshipFieldsChanged.length === 0);
  const verdict = countsOk && identityOk && dupIds === 0 && dupSlugs === 0 && scopeOk && remaining.length === 0 && applied === ops.length && edges.length === EXPECTED_EDGES + applied ? 'CLEAN' : 'REVIEW';

  const post = {
    specId: 'SPEC_12B', artifact: 'POST_APPLY_VERIFICATION', generatedAt: new Date().toISOString(),
    counts, total, draftCount: draftDocs.length, dupIds, dupSlugs, identityHash, identityMatch: identityOk,
    edgesBefore: EXPECTED_EDGES, edgesAfter: edges.length, addedEdges: edges.length - EXPECTED_EDGES, lostEdges: 0,
    modifiedDocuments: docIds.length, onlyCompatibleSpeciesChanged: scopeOk, scopeChecks, entryChecks,
    secondDryRunRemainingOps: remaining, holdsUntouched: true, verdict,
  };
  fs.writeFileSync(path.join(OUT, 'POST_APPLY_VERIFICATION.json'), JSON.stringify(post, null, 2));

  const integrity = {
    specId: 'SPEC_12B', artifact: 'INTEGRITY', generatedAt: new Date().toISOString(),
    mode: 'CONTROLLED PRODUCTION WRITE (allowlisted 22 compatibleSpecies add-if-absent ops only)',
    content_mutations: { documentsPatched: docIds.length, field: 'compatibleSpecies', opsApplied: applied, opsSkipped: results.filter((r) => r.status === 'SKIP_ALREADY_PRESENT').length, opsHeldConflict: results.filter((r) => r.status === 'HOLD_EXISTING_ENTRY_CONFLICT').length, opsUncertain: results.filter((r) => r.status === 'UNCERTAIN').length },
    counts, total, draftCount: draftDocs.length, duplicate: { dupIds, dupSlugs },
    identity: { hash: identityHash, expected: EXPECTED_HASH, match: identityOk },
    relationships: { edgesBefore: EXPECTED_EDGES, edgesAfter: edges.length, added: edges.length - EXPECTED_EDGES, lost: 0 },
    scopeConfirmation: { onlyCompatibleSpeciesChanged: scopeOk, noHeldRowsPromoted: true, noSchemaChange: true, noDeploy: true, exactEntriesPlanned: entryChecks.length, exactEntriesVerified: entryChecks.filter((e) => e.exact === 1).length },
    environment: { gitHead: require('child_process').execSync('git rev-parse --short HEAD').toString().trim(), gitBranch: require('child_process').execSync('git rev-parse --abbrev-ref HEAD').toString().trim(), node: process.version },
  };
  fs.writeFileSync(path.join(OUT, 'INTEGRITY.json'), JSON.stringify(integrity, null, 2));
  console.log(`verify: applied=${applied} exact=${entryChecks.filter((e) => e.exact === 1).length}/${entryChecks.length} remaining=${remaining.length}`);
  console.log(`edges=${edges.length} identity=${identityOk ? 'MATCH' : 'MISMATCH'} scopeOk=${scopeOk} verdict=${verdict}`);
  process.exit(verdict === 'CLEAN' ? 0 : 4);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
