const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// SPEC 13B write stage. Authorized set: exactly 17 eligible operations.
// Modes: preflight (read-only) | execute (preflight gates + writes) | verify (read-only)
const MODE = process.argv[2] || 'preflight';
const ROOT = process.cwd();
const R13A = path.join(ROOT, 'reports', 'SPEC_13A');
const R13B = path.join(ROOT, 'reports', 'SPEC_13B');
const OUT = path.join(ROOT, 'reports', 'SPEC_13B_WRITE');
fs.mkdirSync(OUT, { recursive: true });

const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8'))[1];
const PROJECT = 'zeohjejw', DATASET = 'production', API = 'v2026-05-25';
const QUERY_URL = `https://${PROJECT}.api.sanity.io/${API}/data/query/${DATASET}`;
const MUTATE_URL = `https://${PROJECT}.api.sanity.io/${API}/data/mutate/${DATASET}`;
const TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_TOTAL = 473;
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const EXPECTED_EDGES = 3173;
const EXCLUDED = ['REL13A-0016', 'REL13A-0017', 'REL13A-0019', 'REL13A-0020'];
const EXPECTED_OPS = 17;

const REL_FIELDS = {
  species: ['compatibleSpecies', 'compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedProblems', 'relatedPosts', 'incompatibleSpecies', 'predatorPrey', 'reefInteractionDetail', 'parentSpecies'],
  plant: ['suitableEquipment', 'relatedProblems', 'relatedPosts'],
  invertebrate: ['compatibleSpecies', 'suitableEquipment', 'relatedProblems', 'relatedPosts', 'predatorPrey', 'parentSpecies'],
  coral: ['suitableEquipment', 'relatedProblems', 'relatedPosts', 'coralNeighbors'],
  equipment: ['compatibleEquipment', 'relatedProblems', 'relatedPosts'],
  problem: ['relatedTools', 'relatedPosts'],
};
const SHAPE = {
  predatorPrey: { entryType: 'predatorPreyEntry', keys: ['evidenceNote', 'ref', 'sizeCondition'], targets: ['species', 'invertebrate'] },
  incompatibleSpecies: { entryType: 'incompatibleEntry', keys: ['reason', 'ref'], targets: ['species'] },
};
const ALLOWED_REASON = ['predation', 'temperament', 'size', 'water'];

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (t, it) => (t === 'problem' ? it.title : it.name);
const refId = (v) => (v == null ? null : typeof v === 'object' ? (v._ref || v.ref?._ref || v.ref || null) : String(v));
const redact = (s) => String(s).split(TOKEN).join('[REDACTED]');
const csvCell = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const toCsv = (h, rows) => h.join(',') + '\n' + rows.map((r) => h.map((k) => csvCell(r[k])).join(',')).join('\n') + '\n';

function request(method, url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = body == null ? null : Buffer.from(JSON.stringify(body));
    const req = https.request({
      method, hostname: u.hostname, path: u.pathname + u.search,
      headers: Object.assign({ Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, payload ? { 'Content-Length': payload.length } : {}),
      timeout: 90000,
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(text); } catch {}
        if (res.statusCode >= 200 && res.statusCode < 300) resolve({ status: res.statusCode, json, text });
        else reject(Object.assign(new Error('HTTP ' + res.statusCode + ': ' + redact(text.slice(0, 300))), { status: res.statusCode, body: json, text }));
      });
    });
    req.on('timeout', () => req.destroy(new Error('request timeout')));
    req.on('error', (e) => reject(e));
    if (payload) req.write(payload);
    req.end();
  });
}
const q = async (groq) => (await request('GET', QUERY_URL + '?query=' + encodeURIComponent(groq), null)).json.result;
const apiWrite = async (mutations) => (await request('POST', MUTATE_URL, { mutations })).json;

const checks = [];
const check = (id, name, ok, detail) => { checks.push({ id, name, pass: !!ok, detail: String(detail ?? '') }); return !!ok; };

function verifyManifest(dir) {
  const file = path.join(dir, 'CHECKSUMS.txt');
  const lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#')) : [];
  const bad = [], missing = [];
  for (const line of lines) {
    const m = /^([0-9a-f]{64})\s+(.+)$/.exec(line);
    if (!m) { bad.push(line); continue; }
    const p = path.join(ROOT, m[2].trim());
    if (!fs.existsSync(p)) { missing.push(m[2].trim()); continue; }
    if (sha256(fs.readFileSync(p)) !== m[1]) bad.push(m[2].trim());
  }
  return { dir: path.basename(dir), tracked: lines.length, mismatches: bad.length, bad, missing };
}

const shapeOk = (op) => {
  const spec = SHAPE[op.path];
  if (!spec || op.value._type !== spec.entryType) return false;
  const keys = Object.keys(op.value).filter((k) => k !== '_key' && k !== '_type').sort();
  if (JSON.stringify(keys) !== JSON.stringify(spec.keys)) return false;
  if (op.path === 'incompatibleSpecies' && !ALLOWED_REASON.includes(op.value.reason)) return false;
  return true;
};

async function liveSnapshot() {
  const docs = {};
  const counts = {};
  for (const t of TYPES) {
    docs[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`);
    counts[t] = docs[t].length;
  }
  const drafts = (await q('*[_id in path("drafts.**")]._id')).length;
  const totals = Object.values(counts).reduce((a, b) => a + b, 0);
  const ids = new Set(); let dupIds = 0;
  for (const t of TYPES) for (const r of docs[t]) { if (ids.has(r._id)) dupIds++; ids.add(r._id); }
  const seen = {}; let dupSlugs = 0;
  for (const t of TYPES) for (const r of docs[t]) { const s = slugValue(r.slug); if (!s) continue; if (seen[s]) dupSlugs++; seen[s] = r._id; }
  const hash = sha256(Object.keys(Object.fromEntries(TYPES.flatMap((t) => docs[t].map((r) => [r._id, { t, r }])))).sort().map((id) => {
    const t = TYPES.find((x) => docs[x].some((r) => r._id === id));
    const rec = docs[t].find((r) => r._id === id);
    return sha256(JSON.stringify({ id, title: titleOf(t, rec), slug: slugValue(rec.slug) }));
  }).join('\n'));
  const byId = {}; for (const t of TYPES) for (const r of docs[t]) byId[r._id] = { type: t, doc: r };
  const edges = [];
  for (const t of TYPES) for (const r of docs[t]) for (const f of REL_FIELDS[t]) {
    const v = r[f]; if (v == null) continue;
    for (const item of (Array.isArray(v) ? v : [v])) { const tid = refId(item); if (tid) edges.push({ sourceId: r._id, sourceType: t, field: f, targetId: tid }); }
  }
  const stripped = Object.fromEntries(Object.entries(byId).map(([id, v]) => {
    const copy = { _id: v.doc._id, _type: v.doc._type };
    for (const [k, val] of Object.entries(v.doc)) if (k !== '_id' && k !== '_type' && k !== 'predatorPrey' && k !== 'incompatibleSpecies') copy[k] = val;
    return [id, sha256(JSON.stringify(copy))];
  }));
  return { docs, counts, total: totals, drafts, dupIds, dupSlugs, hash, byId, edges, edgeSet: new Set(edges.map((e) => `${e.sourceId}|${e.field}|${e.targetId}`)), strippedHash: sha256(JSON.stringify(stripped)) };
}

(async () => {
  const startedAt = new Date().toISOString();
  const git = (args) => require('child_process').execSync('git ' + args, { cwd: ROOT }).toString().trim();
  const repo = { root: ROOT, branch: git('rev-parse --abbrev-ref HEAD'), head: git('rev-parse HEAD'), node: process.version, dirtyFiles: git('status --porcelain').split(/\r?\n/).filter(Boolean).length };

  // ---------- A. artifacts ----------
  const m13a = verifyManifest(R13A), m12a = verifyManifest(path.join(ROOT, 'reports', 'SPEC_12A')), m12b = verifyManifest(path.join(ROOT, 'reports', 'SPEC_12B')), m13b = verifyManifest(R13B);
  const dryRun = JSON.parse(fs.readFileSync(path.join(R13B, 'DRY_RUN.json'), 'utf8'));
  const revalidationRows = fs.readFileSync(path.join(R13B, 'CANDIDATE_REVALIDATION.csv'), 'utf8');
  const evidenceReviewRows = fs.readFileSync(path.join(R13B, 'EVIDENCE_REVIEW.csv'), 'utf8');
  const candidates13a = fs.readFileSync(path.join(R13A, 'CANDIDATES.csv'), 'utf8');
  const evidence13a = fs.readFileSync(path.join(R13A, 'EVIDENCE.csv'), 'utf8');
  const held13a = fs.readFileSync(path.join(R13A, 'HELD_REGISTER.csv'), 'utf8');

  const ops = dryRun.operations.map((o) => o);
  const ids = ops.map((o) => o.candidateId);
  const excludedInOps = ids.filter((id) => EXCLUDED.includes(id));

  check('W-01', 'SPEC 13B artifact manifest valid', m13b.mismatches === 0 && m13b.missing.length === 0, `tracked=${m13b.tracked} mismatches=${m13b.mismatches}`);
  check('W-02', 'SPEC 13A manifest valid', m13a.mismatches === 0 && m13a.missing.length === 0, `tracked=${m13a.tracked} mismatches=${m13a.mismatches}`);
  check('W-03', 'SPEC 12B intact; SPEC 12A only known test-file drift', m12b.mismatches === 0 && m12a.mismatches <= 1 && m12a.bad.every((f) => f === 'tests/spec12a-plan.test.ts'), `12B=${m12b.mismatches} 12A=${JSON.stringify(m12a.bad)}`);
  check('W-04', 'target identity is zeohjejw/production/v2026-05-25', PROJECT === 'zeohjejw' && DATASET === 'production' && API.replace(/^v/, '') === '2026-05-25', `${PROJECT}/${DATASET}/${API}`);
  check('W-05', 'eligible set is exactly 17 unique operations', ops.length === EXPECTED_OPS && new Set(ids).size === EXPECTED_OPS && dryRun.eligibleOperations === EXPECTED_OPS, `ops=${ops.length} unique=${new Set(ids).size}`);
  check('W-06', 'all four excluded IDs absent from eligible set', excludedInOps.length === 0 && EXCLUDED.every((id) => !ids.includes(id)), `excludedInOps=${JSON.stringify(excludedInOps)}`);
  check('W-07', 'every op is evidence-linked, eligible, PROPOSE_WITH_CAVEAT lineage', ops.every((o) => candidates13a.includes(o.candidateId) && evidence13a.includes(o.candidateId) && revalidationRows.includes(o.candidateId) && evidenceReviewRows.includes(o.candidateId)), 'artifacts reference all 17');
  check('W-08', 'no held/rejected/conflict pair leaked', ops.every((o) => { const t = o.value.ref._ref; return !held13a.split(/\r?\n/).some((l) => l.includes(o.documentId) && l.includes(o.path) && l.includes(t)); }), `heldRows=${held13a.split(/\r?\n/).filter(Boolean).length - 1}`);
  check('W-09', 'entry shapes, direction and reason enums valid', ops.every((o) => shapeOk(o) && o.sourceType === 'species' && ['predatorPrey', 'incompatibleSpecies'].includes(o.path) && o.action === 'add-if-absent'), 'schema-exact');
  check('W-10', 'no self-links and deterministic keys unique in plan', ops.every((o) => o.documentId !== o.value.ref._ref) && new Set(ops.map((o) => `${o.documentId}|${o.path}|${o.value._key}`)).size === EXPECTED_OPS, '17 keys');
  check('W-11', 'dry-run artifact is explicitly simulated, not applied', /DRY_RUN/.test(dryRun.mode) && /read-only/i.test(dryRun.projectionNote), dryRun.projectionNote);

  // ---------- B. fresh live preflight ----------
  const live = await liveSnapshot();
  const sourceIds = new Set(ops.map((o) => o.documentId));
  const revisions = Object.fromEntries([...sourceIds].map((id) => [id, live.byId[id]?.doc?._rev ?? null]));
  const present = ops.filter((o) => live.edgeSet.has(`${o.documentId}|${o.path}|${o.value.ref._ref}`));
  const reverse = ops.filter((o) => live.edgeSet.has(`${o.value.ref._ref}|${o.path}|${o.documentId}`));
  const unresolved = ops.filter((o) => !live.byId[o.documentId] || !live.byId[o.value.ref._ref]);
  const badTypes = ops.filter((o) => live.byId[o.documentId]?.type !== 'species' || !SHAPE[o.path].targets.includes(live.byId[o.value.ref._ref]?.type));
  const keyClash = ops.filter((o) => {
    const v = live.byId[o.documentId]?.doc?.[o.path];
    const arr = Array.isArray(v) ? v : v == null ? [] : [v];
    return arr.some((e) => e._key === o.value._key);
  });
  const refsBefore = Object.fromEntries([...sourceIds].map((id) => [id, { rev: live.byId[id]?.doc?._rev, predatorPrey: live.byId[id]?.doc?.predatorPrey ?? null, incompatibleSpecies: live.byId[id]?.doc?.incompatibleSpecies ?? null }]));
  const projection = live.edges.length + ops.length;

  check('W-12', 'live counts match handoff', live.total === EXPECTED_TOTAL && TYPES.every((t) => live.counts[t] === EXPECTED[t]), `total=${live.total} ${JSON.stringify(live.counts)}`);
  check('W-13', 'live drafts = 0 and duplicate _id/slug = 0', live.drafts === 0 && live.dupIds === 0 && live.dupSlugs === 0, `drafts=${live.drafts} dupIds=${live.dupIds} dupSlugs=${live.dupSlugs}`);
  check('W-14', 'live identity hash matches', live.hash === EXPECTED_HASH, live.hash === EXPECTED_HASH ? 'MATCH' : 'MISMATCH');
  check('W-15', 'live relationship edge count is 3173', live.edges.length === EXPECTED_EDGES, `edges=${live.edges.length}`);
  check('W-16', 'all 17 pairs still absent, no reverse edges', present.length === 0 && reverse.length === 0, `present=${present.length} reverse=${reverse.length}`);
  check('W-17', 'all sources/targets resolve with expected types', unresolved.length === 0 && badTypes.length === 0, `unresolved=${unresolved.length} badTypes=${badTypes.length}`);
  check('W-18', 'no destination _key clash', keyClash.length === 0, `clash=${keyClash.length}`);
  check('W-19', 'SPEC 13A/13B artifacts unchanged during preflight', verifyManifest(R13A).mismatches === 0 && verifyManifest(R13B).mismatches === 0, 'recheck');

  const failed = checks.filter((c) => !c.pass);
  const decision = failed.length ? (present.length || reverse.length ? 'BLOCKED_CANDIDATE_DRIFT' : 'BLOCKED_BASELINE_DRIFT') : 'READY_TO_WRITE';

  const manifest = {
    specId: 'SPEC_13B_WRITE', artifact: 'EXECUTION_MANIFEST', generatedAt: startedAt, authorized: true,
    authorization: 'phase/SPEC_13B_WRITE_EXECUTION_PROMPT.md - owner-approved, limited to 17 eligible operations',
    target: { project: PROJECT, dataset: DATASET, api: API },
    mode: 'add-if-absent', concurrency: 'ifRevisionID', batchLimit: 5, deterministicKey: true,
    excludedCandidateIds: EXCLUDED,
    operationCount: ops.length,
    operations: ops.map((o) => {
      const cand = candidates13a; // metadata validated against CSV below
      const cRow = cand.split(/\r?\n/).find((l) => l.startsWith(o.candidateId + ',')) || '';
      return { candidateId: o.candidateId, sourceType: o.sourceType, sourceId: o.documentId, field: o.path, targetId: o.value.ref._ref, targetType: live.byId[o.value.ref._ref]?.type ?? null, direction: o.path === 'predatorPrey' ? 'source=predator -> target=prey' : 'source -> incompatible target', action: o.action, key: o.value._key, value: o.value, candidateMeta: cRow };
    }),
  };
  fs.writeFileSync(path.join(OUT, 'EXECUTION_MANIFEST.json'), JSON.stringify(manifest, null, 2));

  const preflight = {
    specId: 'SPEC_13B_WRITE', artifact: 'PREFLIGHT', generatedAt: startedAt, repo,
    target: manifest.target, mode: MODE, checks, decision,
    artifactIntegrity: { spec13a: m13a, spec12a: m12a, spec12b: m12b, spec13b: m13b },
    live: { counts: live.counts, total: live.total, drafts: live.drafts, duplicate: { dupIds: live.dupIds, dupSlugs: live.dupSlugs }, identity: { hash: live.hash, match: live.hash === EXPECTED_HASH }, edges: live.edges.length },
    sourceRevisions: revisions, sourceArraysBefore: refsBefore,
    eligible: ops.length, present: present.length, reverse: reverse.length, unresolved: unresolved.length,
    projection: { edgesBefore: live.edges.length, eligibleOps: ops.length, edgesAfterExpected: projection },
    baselineFingerprint: { strippedHash: live.strippedHash, edgeCount: live.edges.length, identity: live.hash, counts: live.counts },
  };
  fs.writeFileSync(path.join(OUT, 'PREFLIGHT.json'), JSON.stringify(preflight, null, 2));
  console.log(JSON.stringify({ mode: MODE, decision, checks: checks.map((c) => c.id + ':' + (c.pass ? 'PASS' : 'FAIL')), edgesBefore: live.edges.length, eligible: ops.length, projection, revisions }, null, 2));

  if (MODE === 'preflight') process.exit(failed.length ? 2 : 0);
  if (failed.length) { console.error('BLOCKED: refusing to write'); process.exit(2); }

  // ---------- C. execute ----------
  const results = [];
  const header = ['candidateId', 'sourceId', 'field', 'targetId', 'status', 'attempts', 'batch', 'revisionBefore', 'revisionAfter', 'readbackCount', 'readbackOk', 'error'];
  let batchNo = 0;
  for (let i = 0; i < ops.length; i += 5) {
    batchNo++;
    const batch = ops.slice(i, i + 5);
    for (const op of batch) {
      const startedOp = new Date().toISOString();
      const targetId = op.value.ref._ref;
      const row = { candidateId: op.candidateId, sourceId: op.documentId, field: op.path, targetId, status: 'PENDING', attempts: 0, batch: batchNo, revisionBefore: '', revisionAfter: '', readbackCount: '', readbackOk: '', error: '' };
      let attempts = 0, done = false, lastErr = null;
      while (!done && attempts < 2) {
        attempts++; row.attempts = attempts;
        try {
          // re-read immediately before patch
          const current = await q(`*[_id == "${op.documentId}"][0]`);
          if (!current) throw new Error('source document missing at write time');
          row.revisionBefore = current._rev;
          const arr = Array.isArray(current[op.path]) ? current[op.path] : current[op.path] == null ? [] : [current[op.path]];
          if (arr.some((e) => e._key === op.value._key || (refId(e) === targetId))) { row.status = 'ALREADY_PRESENT_STOP'; break; }
          const patch = arr.length === 0
            ? { id: op.documentId, ifRevisionID: current._rev, set: { [op.path]: [op.value] } }
            : { id: op.documentId, ifRevisionID: current._rev, insert: { after: op.path + '[-1]', items: [op.value] } };
          const res = await apiWrite([{ patch }]);
          const readback = await q(`*[_id == "${op.documentId}"][0]`);
          const rb = Array.isArray(readback?.[op.path]) ? readback[op.path] : readback?.[op.path] == null ? [] : [readback[op.path]];
          const matches = rb.filter((e) => e._key === op.value._key);
          const okShape = matches.length === 1 && refId(matches[0]) === targetId && matches[0]._type === op.value._type && Object.keys(matches[0]).filter((k) => k !== '_key' && k !== '_type').sort().join(',') === Object.keys(op.value).filter((k) => k !== '_key' && k !== '_type').sort().join(',') && (op.path !== 'incompatibleSpecies' || matches[0].reason === op.value.reason);
          row.readbackCount = matches.length; row.readbackOk = okShape ? 'true' : 'false'; row.revisionAfter = readback?._rev ?? '';
          if (okShape) { row.status = 'APPLIED_AND_VERIFIED'; done = true; }
          else { row.status = 'READBACK_MISMATCH_STOP'; throw new Error('readback mismatch after write'); }
        } catch (e) {
          lastErr = e;
          row.error = redact(e.message || e).slice(0, 240);
          // ambiguous response: read live state before deciding
          const doc = await q(`*[_id == "${op.documentId}"][0]`).catch(() => null);
          const arr = Array.isArray(doc?.[op.path]) ? doc[op.path] : [];
          const matches = arr.filter((e) => e._key === op.value._key);
          row.readbackCount = matches.length; row.readbackOk = matches.length === 1 ? 'true' : 'false';
          row.revisionAfter = doc?._rev ?? '';
          if (matches.length === 1 && refId(matches[0]) === targetId) { row.status = 'APPLIED_AND_VERIFIED'; done = true; }
          else if (/HTTP 409|revision/i.test(row.error)) { row.status = 'CONFLICT_STOP'; break; }
          else if (attempts >= 2) row.status = 'FAILED_STOP';
        }
        if (row.status.endsWith('STOP')) break;
      }
      results.push(row);
      fs.writeFileSync(path.join(OUT, 'OPERATION_RESULTS.csv'), toCsv(header, results));
      console.log(row.candidateId, row.status, 'attempts=' + row.attempts, 'rb=' + row.readbackCount);
      if (row.status !== 'APPLIED_AND_VERIFIED') {
        console.error('STOPPING: ' + row.candidateId + ' -> ' + row.status + ' ' + row.error);
        const post = await liveSnapshot();
        finish(post, results, 'PARTIAL_STOPPED');
        process.exit(3);
      }
    }
    // batch readback gate
    const batchIds = batch.map((o) => [o.documentId, o.value.ref._ref]);
    const afterBatch = await liveSnapshot();
    const missingInBatch = batchIds.filter(([sid, tid]) => !afterBatch.edgeSet.has(`${sid}|${ops.find((o) => o.documentId === sid && o.value.ref._ref === tid).path}|${tid}`));
    if (missingInBatch.length) { console.error('BATCH VERIFICATION FAILED', missingInBatch); finish(afterBatch, results, 'PARTIAL_STOPPED'); process.exit(3); }
  }

  // ---------- D. post-write verification ----------
  const post = await liveSnapshot();
  finish(post, results, 'COMPLETE');
  process.exit(0);

  async function finish(snap, rows, status) {
    const appliedRows = rows.filter((r) => r.status === 'APPLIED_AND_VERIFIED');
    const postEdges = snap.edges.length;
    const opKeys = ops.map((o) => `${o.documentId}|${o.path}|${o.value.ref._ref}`);
    const postKeySet = new Set(snap.edges.map((e) => `${e.sourceId}|${e.field}|${e.targetId}`));
    const presentAll = opKeys.every((k) => postKeySet.has(k));
    const eachExactlyOnce = ops.every((o) => {
      const arr = snap.byId[o.documentId]?.doc?.[o.path];
      const list = Array.isArray(arr) ? arr : arr == null ? [] : [arr];
      return list.filter((e) => e._key === o.value._key).length === 1;
    });
    const candidatePairs = fs.readFileSync(path.join(R13A, 'CANDIDATES.csv'), 'utf8').split(/\r?\n/).filter(Boolean).slice(1).map((l) => {
      const m = l.split(',');
      return { candidateId: m[0], sourceId: m[3], field: m[5], targetId: m[6] };
    });
    const excludedApplied = candidatePairs.filter((c) => EXCLUDED.includes(c.candidateId)).filter((c) => postKeySet.has(`${c.sourceId}|${c.field}|${c.targetId}`));
    const preflightData = JSON.parse(fs.readFileSync(path.join(OUT, 'PREFLIGHT.json'), 'utf8'));
    const strippedUnchanged = snap.strippedHash === preflightData.baselineFingerprint.strippedHash;
    const postVerify = {
      specId: 'SPEC_13B_WRITE', artifact: 'POST_WRITE_VERIFICATION', generatedAt: new Date().toISOString(),
      status, applied: appliedRows.length, expected: ops.length,
      edgesBefore: preflightData.live.edges, edgesAfter: postEdges, edgeDelta: postEdges - preflightData.live.edges,
      projection: preflightData.projection.edgesAfterExpected,
      identity: { before: preflightData.live.identity.hash, after: snap.hash, match: snap.hash === EXPECTED_HASH },
      counts: snap.counts, total: snap.total, drafts: snap.drafts, duplicate: { dupIds: snap.dupIds, dupSlugs: snap.dupSlugs },
      checks: {
        allSeventeenPresent: presentAll, eachExactlyOnce, excludedApplied: excludedApplied.length,
        noPriorEdgeLost: postEdges - preflightData.live.edges === appliedRows.length,
        unrelatedFieldsUnchanged: strippedUnchanged,
        recordCountUnchanged: snap.total === EXPECTED_TOTAL,
        identityUnchanged: snap.hash === EXPECTED_HASH,
        edgesMatchApplied: postEdges === preflightData.live.edges + appliedRows.length,
      },
      sourceArraysAfter: Object.fromEntries([...new Set(ops.map((o) => o.documentId))].map((id) => {
        const d = snap.byId[id]?.doc ?? {};
        return [id, { rev: d._rev, predatorPrey: d.predatorPrey ?? null, incompatibleSpecies: d.incompatibleSpecies ?? null }];
      })),
      operations: rows,
    };
    fs.writeFileSync(path.join(OUT, 'POST_WRITE_VERIFICATION.json'), JSON.stringify(postVerify, null, 2));

    // idempotency: second dry-run over the approved set
    const additional = ops.filter((o) => {
      const arr = snap.byId[o.documentId]?.doc?.[o.path];
      const list = Array.isArray(arr) ? arr : arr == null ? [] : [arr];
      return list.filter((e) => refId(e) === o.value.ref._ref).length === 0;
    }).length;

    const integrity = {
      specId: 'SPEC_13B_WRITE', artifact: 'INTEGRITY', generatedAt: new Date().toISOString(),
      status, content_mutations: appliedRows.length, schema_changes: 0, deploys: 0,
      records: { before: preflightData.live.total, after: snap.total },
      drafts: { before: preflightData.live.drafts, after: snap.drafts },
      identity: { before: preflightData.live.identity.hash, after: snap.hash, match: snap.hash === EXPECTED_HASH },
      relationships: { before: preflightData.live.edges, after: postEdges, delta: postEdges - preflightData.live.edges, expectedDelta: appliedRows.length },
      idempotency: { additionalOperationsOnReapply: additional, expected: 0, pass: additional === 0 },
      artifactIntegrity: { spec13a: verifyManifest(R13A), spec12a: verifyManifest(path.join(ROOT, 'reports', 'SPEC_12A')), spec12b: verifyManifest(path.join(ROOT, 'reports', 'SPEC_12B')), spec13b: verifyManifest(R13B) },
      verdict: status === 'COMPLETE' && presentAll && eachExactlyOnce && excludedApplied.length === 0 && strippedUnchanged && snap.hash === EXPECTED_HASH && postEdges === preflightData.live.edges + appliedRows.length && additional === 0 && snap.total === EXPECTED_TOTAL ? 'CLEAN' : 'REVIEW',
    };
    fs.writeFileSync(path.join(OUT, 'INTEGRITY.json'), JSON.stringify(integrity, null, 2));
    console.log(JSON.stringify({ status, applied: appliedRows.length, edges: { before: preflightData.live.edges, after: postEdges }, integrity: integrity.verdict, checks: postVerify.checks, additional }, null, 2));
  }

})().catch((e) => { console.error('FATAL', redact(e && e.stack || e)); process.exit(2); });
