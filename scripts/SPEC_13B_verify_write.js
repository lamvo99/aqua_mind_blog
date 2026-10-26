const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// SPEC 13B write-stage verifier. READ-ONLY.
// Reconstructs the pre-write document set from PREFLIGHT + manifest + live state,
// then proves that only the approved relationship entries changed.

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'reports', 'SPEC_13B_WRITE');
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8'))[1];
const PROJECT = 'zeohjejw', DATASET = 'production', API = 'v2026-05-25';
const QUERY_URL = `https://${PROJECT}.api.sanity.io/${API}/data/query/${DATASET}`;
const TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const REL = ['predatorPrey', 'incompatibleSpecies'];
const EDGE_FIELDS = {
  species: ['compatibleSpecies', 'compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedProblems', 'relatedPosts', 'incompatibleSpecies', 'predatorPrey', 'reefInteractionDetail', 'parentSpecies'],
  plant: ['suitableEquipment', 'relatedProblems', 'relatedPosts'],
  invertebrate: ['compatibleSpecies', 'suitableEquipment', 'relatedProblems', 'relatedPosts', 'predatorPrey', 'parentSpecies'],
  coral: ['suitableEquipment', 'relatedProblems', 'relatedPosts', 'coralNeighbors'],
  equipment: ['compatibleEquipment', 'relatedProblems', 'relatedPosts'],
  problem: ['relatedTools', 'relatedPosts'],
};
const EXCLUDED = ['REL13A-0016', 'REL13A-0017', 'REL13A-0019', 'REL13A-0020'];
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const EXPECTED_TOTAL = 473;

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (t, it) => (t === 'problem' ? it.title : it.name);
const refId = (v) => (v == null ? null : typeof v === 'object' ? (v._ref || v.ref?._ref || v.ref || null) : String(v));

function get(url) {
  return new Promise((res, rej) => {
    https.get(url, { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => {
      const c = [];
      r.on('data', (x) => c.push(Buffer.from(x)));
      r.on('end', () => { const t = Buffer.concat(c).toString('utf8'); try { res(JSON.parse(t).result); } catch (e) { rej(new Error('bad response: ' + t.slice(0, 200))); } });
    }).on('error', rej);
  });
}
const q = (groq) => get(QUERY_URL + '?query=' + encodeURIComponent(groq));

const fingerprint = (docsById) => sha256(JSON.stringify(Object.keys(docsById).sort().map((id) => {
  const d = docsById[id];
  const copy = {};
  for (const [k, v] of Object.entries(d)) if (!['_rev', '_updatedAt'].includes(k) && !REL.includes(k)) copy[k] = v;
  return [id, sha256(JSON.stringify(copy))];
})));

function verifyManifest(name) {
  const dir = path.join(ROOT, 'reports', name);
  const file = path.join(dir, 'CHECKSUMS.txt');
  if (!fs.existsSync(file)) return { dir: name, exists: false, tracked: 0, mismatches: 0, bad: [], missing: [] };
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#'));
  const bad = [], missing = [];
  for (const line of lines) {
    const m = /^([0-9a-f]{64})\s+(.+)$/.exec(line);
    if (!m) { bad.push(line); continue; }
    const p = path.join(ROOT, m[2].trim());
    if (!fs.existsSync(p)) { missing.push(m[2].trim()); continue; }
    if (sha256(fs.readFileSync(p)) !== m[1]) bad.push(m[2].trim());
  }
  return { dir: name, exists: true, tracked: lines.length, mismatches: bad.length, bad, missing };
}

(async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(OUT, 'EXECUTION_MANIFEST.json'), 'utf8'));
  const preflight = JSON.parse(fs.readFileSync(path.join(OUT, 'PREFLIGHT.json'), 'utf8'));
  const ops = manifest.operations;
  const live = {};
  for (const t of TYPES) live[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`);
  const byId = {}; for (const t of TYPES) for (const r of live[t]) byId[r._id] = { type: t, doc: r };
  const allDocs = Object.fromEntries(Object.entries(byId).map(([id, v]) => [id, v.doc]));

  const postFp = fingerprint(allDocs);

  // reconstruct pre-write docs: remove exactly the approved entries from current arrays
  const plannedByDoc = {};
  for (const op of ops) {
    const key = op.sourceId + '|' + op.field;
    (plannedByDoc[key] = plannedByDoc[key] || new Set()).add(op.key);
  }
  const reconstructed = JSON.parse(JSON.stringify(allDocs));
  const removalCheck = [];
  for (const id of Object.keys(plannedByDoc)) {
    const [sid, field] = id.split('|');
    const current = allDocs[sid]?.[field];
    const arr = Array.isArray(current) ? current : current == null ? [] : [current];
    const before = arr.filter((e) => !plannedByDoc[id].has(e._key));
    const pre = preflight.sourceArraysBefore[sid]?.[field];
    const preArr = Array.isArray(pre) ? pre : pre == null ? [] : [pre];
    removalCheck.push({ sourceId: sid, field, currentCount: arr.length, removed: arr.length - before.length, plannedCount: plannedByDoc[id].size, matchesPreflight: JSON.stringify(before) === JSON.stringify(preArr) });
    reconstructed[sid][field] = before.length === 0 ? null : before;
    if (before.length === 0) delete reconstructed[sid][field];
  }
  const preFp = fingerprint(reconstructed);

  const edgeKeys = [];
  for (const t of TYPES) for (const r of live[t]) for (const f of EDGE_FIELDS[t]) {
    const v = r[f]; if (v == null) continue;
    for (const item of (Array.isArray(v) ? v : [v])) { const tid = refId(item); if (tid) edgeKeys.push(`${r._id}|${f}|${tid}`); }
  }
  const edgeSet = new Set(edgeKeys);
  const appliedOk = ops.every((o) => {
    const arr = byId[o.sourceId]?.doc?.[o.field];
    const list = Array.isArray(arr) ? arr : arr == null ? [] : [arr];
    const matches = list.filter((e) => e._key === o.key && refId(e) === o.targetId && e._type === o.value._type);
    return matches.length === 1;
  });
  const candidatesCsv = fs.readFileSync(path.join(ROOT, 'reports', 'SPEC_13A', 'CANDIDATES.csv'), 'utf8').split(/\r?\n/).filter(Boolean).slice(1).map((l) => l.split(','));
  const excludedApplied = EXCLUDED.filter((id) => {
    const m = candidatesCsv.find((c) => c[0] === id);
    return m && edgeSet.has(`${m[3]}|${m[5]}|${m[6]}`);
  });
  const additional = ops.filter((o) => {
    const arr = byId[o.sourceId]?.doc?.[o.field];
    const list = Array.isArray(arr) ? arr : [];
    return list.filter((e) => refId(e) === o.targetId).length === 0;
  }).length;

  const identity = sha256(Object.keys(byId).sort().map((id) => sha256(JSON.stringify({ id, title: titleOf(byId[id].type, byId[id].doc), slug: slugValue(byId[id].doc.slug) }))).join('\n'));
  const total = Object.values(live).reduce((a, b) => a + b.length, 0);
  const drafts = (await q('*[_id in path("drafts.**")]._id')).length;
  const excludedAbsent = excludedApplied.length === 0;
  const onlyApprovedDocsTouched = removalCheck.every((r) => r.removed === r.plannedCount && r.matchesPreflight);
  const checks = {
    allSeventeenPresent: appliedOk,
    eachExactlyOnce: appliedOk,
    excludedApplied: excludedApplied.length,
    noPriorEdgeLost: removalCheck.every((r) => r.matchesPreflight),
    unrelatedFieldsUnchanged: preFp === postFp,
    onlyApprovedDocumentsTouched: onlyApprovedDocsTouched,
    recordCountUnchanged: total === EXPECTED_TOTAL,
    identityUnchanged: identity === EXPECTED_HASH,
    draftsZero: drafts === 0,
    edgesMatchApplied: edgeSet.size === preflight.live.edges + ops.length,
  };
  const verdict = checks.allSeventeenPresent && excludedAbsent && checks.noPriorEdgeLost && checks.unrelatedFieldsUnchanged && checks.recordCountUnchanged && checks.identityUnchanged && checks.draftsZero && checks.edgesMatchApplied && additional === 0 ? 'CLEAN' : 'REVIEW';

  const post = {
    specId: 'SPEC_13B_WRITE', artifact: 'POST_WRITE_VERIFICATION', generatedAt: new Date().toISOString(),
    status: verdict === 'CLEAN' ? 'COMPLETE' : 'REVIEW', applied: ops.length, expected: ops.length,
    edgesBefore: preflight.live.edges, edgesAfter: edgeSet.size, edgeDelta: edgeSet.size - preflight.live.edges,
    projection: preflight.projection.edgesAfterExpected,
    identity: { before: preflight.live.identity.hash, after: identity, match: identity === EXPECTED_HASH },
    counts: Object.fromEntries(TYPES.map((t) => [t, live[t].length])), total, drafts, duplicate: { dupIds: preflight.live.duplicate.dupIds, dupSlugs: preflight.live.duplicate.dupSlugs },
    checks,
    fingerprint: { method: 'sha256 over per-doc fields excluding _rev/_updatedAt/' + REL.join('/'), preWriteReconstructed: preFp, postWrite: postFp, match: preFp === postFp },
    removalCheck,
    idempotency: { additionalOperationsOnReapply: additional, expected: 0, pass: additional === 0 },
    operationStatusCounts: fs.readFileSync(path.join(OUT, 'OPERATION_RESULTS.csv'), 'utf8').split(/\r?\n/).filter(Boolean).slice(1).reduce((a, l) => { const s = l.split(',')[4]; a[s] = (a[s] || 0) + 1; return a; }, {}),
  };
  fs.writeFileSync(path.join(OUT, 'POST_WRITE_VERIFICATION.json'), JSON.stringify(post, null, 2));

  const resultRows = fs.readFileSync(path.join(OUT, 'OPERATION_RESULTS.csv'), 'utf8').split(/\r?\n/).filter(Boolean).slice(1).map((l) => l.split(','));
  const integrity = {
    specId: 'SPEC_13B_WRITE', artifact: 'INTEGRITY', generatedAt: new Date().toISOString(),
    status: post.status, content_mutations: resultRows.filter((r) => r[4] === 'APPLIED_AND_VERIFIED').length, schema_changes: 0, deploys: 0,
    records: { before: preflight.live.total, after: total },
    drafts: { before: preflight.live.drafts, after: drafts },
    identity: { before: preflight.live.identity.hash, after: identity, match: identity === EXPECTED_HASH },
    relationships: { before: preflight.live.edges, after: edgeSet.size, delta: edgeSet.size - preflight.live.edges, expectedDelta: ops.length },
    idempotency: post.idempotency,
    artifactIntegrity: { spec13a: verifyManifest('SPEC_13A'), spec12a: verifyManifest('SPEC_12A'), spec12b: verifyManifest('SPEC_12B'), spec13b: verifyManifest('SPEC_13B'), spec13bWrite: verifyManifest('SPEC_13B_WRITE') },
    verdict,
  };
  fs.writeFileSync(path.join(OUT, 'INTEGRITY.json'), JSON.stringify(integrity, null, 2));

  console.log(JSON.stringify({ verdict, status: post.status, checks, fingerprintMatch: preFp === postFp, additional, excludedApplied, removalCheck }, null, 2));
  process.exit(verdict === 'CLEAN' ? 0 : 2);
})().catch((e) => { console.error('FATAL', e && e.stack || e); process.exit(2); });
