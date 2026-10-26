const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// SPEC 12B - Evidence-Gated Relationship Apply.
// Controlled production write: allowlist = exact 22 compatibleSpecies ops from SPEC 12A plan.
// add-if-absent only; read-back verification; never touches other fields.
// Modes: preflight | execute | full (default full)

const MODE = (process.argv[2] || 'full').toLowerCase();
const OUT = path.join('reports', 'SPEC_12B');
const A = path.join('reports', 'SPEC_12A');
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const PROJECT = 'zeohjejw', DATASET = 'production', API = 'v2026-05-25';
const BASE = `https://${PROJECT}.api.sanity.io/${API}/data/query/${DATASET}`;
const MUTATE = `/${API}/data/mutate/${DATASET}`;
const TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_TOTAL = 473;
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const EXPECTED_EDGES = 3151;
const BATCH = 5;
const MAX_ATTEMPTS = 3;

const REL_FIELDS = {
  species: { compatibleSpecies: { kind: 'objectArray', ref: 'ref', target: ['species'] }, compatiblePlants: { kind: 'refArray', target: ['plant'] }, compatibleInvertebrates: { kind: 'refArray', target: ['invertebrate'] }, suitableEquipment: { kind: 'refArray', target: ['equipment'] }, relatedProblems: { kind: 'refArray', target: ['problem'] }, relatedPosts: { kind: 'refArray', target: ['post'] }, incompatibleSpecies: { kind: 'objectArray', ref: 'ref', target: ['species'] }, predatorPrey: { kind: 'objectArray', ref: 'ref', target: ['species', 'invertebrate'] }, reefInteractionDetail: { kind: 'objectArray', ref: 'coral', target: ['coral'] }, parentSpecies: { kind: 'ref', target: ['species'] } },
  plant: { suitableEquipment: { kind: 'refArray', target: ['equipment'] }, relatedProblems: { kind: 'refArray', target: ['problem'] }, relatedPosts: { kind: 'refArray', target: ['post'] } },
  invertebrate: { compatibleSpecies: { kind: 'objectArray', ref: 'ref', target: ['species'] }, suitableEquipment: { kind: 'refArray', target: ['equipment'] }, relatedProblems: { kind: 'refArray', target: ['problem'] }, relatedPosts: { kind: 'refArray', target: ['post'] }, predatorPrey: { kind: 'objectArray', ref: 'ref', target: ['species', 'invertebrate'] }, parentSpecies: { kind: 'ref', target: ['species'] } },
  coral: { suitableEquipment: { kind: 'refArray', target: ['equipment'] }, relatedProblems: { kind: 'refArray', target: ['problem'] }, relatedPosts: { kind: 'refArray', target: ['post'] }, coralNeighbors: { kind: 'objectArray', ref: 'ref', target: ['coral'] } },
  equipment: { compatibleEquipment: { kind: 'refArray', target: ['equipment'] }, relatedProblems: { kind: 'refArray', target: ['problem'] }, relatedPosts: { kind: 'refArray', target: ['post'] } },
  problem: { relatedTools: { kind: 'refArray', target: ['tool'] }, relatedPosts: { kind: 'refArray', target: ['post'] } },
};

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (t, it) => (t === 'problem' ? it.title : it.name);
const refTargetId = (v) => (v == null ? null : typeof v === 'object' ? (v._ref || v.ref?._ref || v.ref || null) : String(v));
const strip = (d) => { if (!d) return null; const o = { ...d }; delete o._rev; delete o._updatedAt; delete o._createdAt; return o; };

function splitCsvLine(line) { const o = []; let c = '', q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (q) { if (ch === '"') { if (line[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else { if (ch === '"') q = true; else if (ch === ',') { o.push(c); c = ''; } else c += ch; } } o.push(c); return o; }
function readCsv(f) { const lines = fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length); if (!lines.length) return []; const h = splitCsvLine(lines[0]); return lines.slice(1).map((l) => { const r = splitCsvLine(l); const o = {}; h.forEach((k, i) => { o[k] = r[i] == null ? '' : r[i]; }); return o; }); }
const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const toCsv = (h, rows) => h.join(',') + '\n' + rows.map((r) => h.map((k) => esc(r[k])).join(',')).join('\n') + '\n';

function q(query) { const url = BASE + '?query=' + encodeURIComponent(query); return new Promise((res, rej) => { https.get(url, { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => { const chunks = []; r.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c))); r.on('end', () => { const d = Buffer.concat(chunks).toString('utf8'); try { res(JSON.parse(d).result); } catch (e) { rej(new Error('bad response: ' + d.slice(0, 300))); } }); }).on('error', rej); }); }
function post(bodyObj) { const body = JSON.stringify(bodyObj); return new Promise((res, rej) => { const req = https.request({ hostname: PROJECT + '.api.sanity.io', path: MUTATE, method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (r) => { const chunks = []; r.on('data', (x) => chunks.push(Buffer.from(x))); r.on('end', () => res({ status: r.statusCode, body: Buffer.concat(chunks).toString('utf8') })); }); req.on('error', rej); req.write(body); req.end(); }); }
function classify(status) { if (status >= 200 && status < 300) return 'SUCCESS'; if (status === 401 || status === 403) return 'AUTH'; if (status === 409 || status === 412) return 'REVISION_CONFLICT'; if (status >= 500 || status === 429) return 'TRANSIENT'; return 'CLIENT_ERROR'; }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const entryKeyFor = (candidateId) => 'rel' + sha256('key|' + candidateId).slice(0, 10);
const entryRef = (e) => e && (e.ref?._ref || e.ref);
const entryShape = (e) => JSON.stringify({ conditions: e.conditions ?? null, confidence: e.confidence ?? null, evidenceNote: e.evidenceNote ?? null });

async function liveState() {
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
  for (const t of TYPES) for (const r of records[t]) for (const [field, spec] of Object.entries(REL_FIELDS[t] || {})) { const val = r[field]; if (val == null) continue; const arr = Array.isArray(val) ? val : [val]; for (const item of arr) { const tid = refTargetId(item); if (tid) edges.push({ sourceId: r._id, field, targetId: tid, targetType: byId[tid] || null, allowed: spec.target.includes(byId[tid] || '') }); } }
  return { records, counts, total, draftCount: draftDocs.length, dupIds, dupSlugs, identityHash, byId, edges };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const preflight = { specId: 'SPEC_12B', artifact: 'PREFLIGHT', generatedAt: new Date().toISOString(), mode: MODE, checks: [] };
  const check = (id, name, ok, detail) => { preflight.checks.push({ id, name, pass: !!ok, detail: String(detail ?? '') }); console.log((ok ? 'CHECK OK   ' : 'CHECK FAIL ') + id + ' ' + name + ' - ' + (detail ?? '')); };

  // ---- P1: config + git ----
  const cli = fs.readFileSync('sanity.cli.ts', 'utf8');
  const cfgProject = (/projectId:\s*'([^']+)'/.exec(cli) || [])[1];
  const cfgDataset = (/dataset:\s*'([^']+)'/.exec(cli) || [])[1];
  check('P-01', 'project/dataset match intended production', cfgProject === PROJECT && cfgDataset === DATASET, `sanity.cli=${cfgProject}/${cfgDataset}`);
  preflight.target = { project: PROJECT, dataset: DATASET, api: API };

  // ---- P2: SPEC 12A artifact checksums ----
  const sums = fs.readFileSync(path.join(A, 'CHECKSUMS.txt'), 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#'));
  let badSum = 0;
  for (const line of sums) { const m = /^([0-9a-f]{64})\s+(.+)$/.exec(line); if (!m) { badSum++; continue; } const p = m[2].trim(); if (!fs.existsSync(p)) { badSum++; continue; } if (sha256(fs.readFileSync(p)) !== m[1]) badSum++; }
  check('P-02', 'SPEC 12A artifacts unmodified (checksums)', badSum === 0 && sums.length > 0, `files=${sums.length} mismatches=${badSum}`);

  // ---- P3: plan shape ----
  const plan = JSON.parse(fs.readFileSync(path.join(A, 'SPEC_12B_DRY_RUN_PLAN.json'), 'utf8'));
  const ops = plan.operations.slice().sort((a, b) => a.candidateId.localeCompare(b.candidateId));
  const cands = readCsv(path.join(A, 'RELATIONSHIP_CANDIDATES.csv'));
  const candById = Object.fromEntries(cands.map((c) => [c.candidateId, c]));
  const evidence = readCsv(path.join(A, 'RELATIONSHIP_EVIDENCE.csv'));
  const evIds = new Set(evidence.map((e) => e.candidateId));
  const shapeOk = ops.length === 22 && ops.every((o) => o.path === 'compatibleSpecies' && o.action === 'add-if-absent' && o.sourceType === 'species'
    && Object.keys(o.value).sort().join(',') === 'conditions,confidence,evidenceNote,ref' && o.value.ref._type === 'reference' && o.value.ref._ref && o.documentId !== o.value.ref._ref);
  check('P-03', 'plan has exactly 22 well-formed compatibleSpecies ops', shapeOk, `ops=${ops.length}`);
  const decisionsOk = ops.every((o) => { const c = candById[o.candidateId]; return c && c.decision === 'PROPOSE_WITH_CAVEAT' && c.confidence === 'MEDIUM' && c.riskTier === 'P1'; });
  check('P-04', 'all ops are PROPOSE_WITH_CAVEAT / MEDIUM / P1', decisionsOk, `checked=${ops.length}`);
  const evOk = ops.every((o) => evIds.has(o.candidateId));
  check('P-05', 'every op has traceable evidence row', evOk, `evidenceRows=${evidence.length}`);
  const uniqKeys = new Set(ops.map((o) => `${o.documentId}|${o.path}|${o.value.ref._ref}`));
  check('P-06', 'no duplicate (doc,path,target) operations', uniqKeys.size === ops.length, `unique=${uniqKeys.size}`);

  // ---- P4: live state ----
  const st = await liveState();
  check('P-07', 'record counts match SPEC 12A baseline', st.total === EXPECTED_TOTAL && TYPES.every((t) => st.counts[t] === EXPECTED[t]), `total=${st.total} ${JSON.stringify(st.counts)}`);
  check('P-08', 'drafts = 0', st.draftCount === 0, `datasetDrafts=${st.draftCount}`);
  check('P-09', 'duplicate _id = 0 and slug = 0', st.dupIds === 0 && st.dupSlugs === 0, `dupIds=${st.dupIds} dupSlugs=${st.dupSlugs}`);
  check('P-10', 'canonical identity hash unchanged', st.identityHash === EXPECTED_HASH, st.identityHash === EXPECTED_HASH ? 'MATCH' : 'MISMATCH ' + st.identityHash);
  check('P-11', 'relationship edge count matches baseline', st.edges.length === EXPECTED_EDGES, `edges=${st.edges.length} expected=${EXPECTED_EDGES}`);

  // target existence/type + current entry state
  const dry = { specId: 'SPEC_12B', artifact: 'DRY_RUN_BEFORE', generatedAt: new Date().toISOString(), mode: 'PLAN + LIVE STATE BEFORE ANY WRITE', operations: [] };
  for (const o of ops) {
    const srcType = st.byId[o.documentId], tgtType = st.byId[o.value.ref._ref];
    const src = st.records.species.find((r) => r._id === o.documentId) || null;
    const cur = (src?.compatibleSpecies || []).map((e) => ({ ref: entryRef(e), shape: entryShape(e) }));
    dry.operations.push({ candidateId: o.candidateId, documentId: o.documentId, documentType: srcType, path: o.path, targetId: o.value.ref._ref, targetType: tgtType, targetTypeAllowed: srcType ? (REL_FIELDS[srcType]?.[o.path]?.target || []).includes(tgtType || '') : false, currentEntries: cur, existingSameRef: cur.some((e) => e.ref === o.value.ref._ref) });
  }
  const missing = dry.operations.filter((o) => !o.documentType || !o.targetType);
  check('P-12', 'all source and target IDs resolve to allowed types', missing.length === 0 && dry.operations.every((o) => o.targetTypeAllowed), `unresolved=${missing.length}`);
  preflight.totalOps = ops.length;
  preflight.opsAlreadyPresent = dry.operations.filter((o) => o.existingSameRef).length;
  preflight.verdict = preflight.checks.every((c) => c.pass) ? 'PASS' : 'BLOCKED';
  fs.writeFileSync(path.join(OUT, 'PREFLIGHT.json'), JSON.stringify(preflight, null, 2));
  fs.writeFileSync(path.join(OUT, 'DRY_RUN_BEFORE.json'), JSON.stringify(dry, null, 2));

  if (preflight.verdict !== 'PASS') { console.log('PREFLIGHT BLOCKED - no writes performed'); process.exit(3); }
  console.log('PREFLIGHT PASS - ' + ops.length + ' ops cleared');

  if (MODE === 'preflight') { console.log('mode=preflight; stopping before execution'); return; }

  // ---- Execution: deterministic batches, add-if-absent, read-back ----
  const results = []; // one row per op
  const affected = {}; // docId -> pre-doc snapshot
  let mutationCalls = 0, docWrites = 0, stopped = false;

  for (let i = 0; i < ops.length && !stopped; i += BATCH) {
    const batch = ops.slice(i, i + BATCH);
    for (const op of batch) {
      const docId = op.documentId, field = op.path, refId = op.value.ref._ref;
      const cur = await q(`*[_id=="${docId}"][0]`);
      if (!cur) { results.push(row(op, 'SKIPPED_MISSING', '', '', 'source document missing')); stopped = true; break; }
      if (!affected[docId]) affected[docId] = strip(cur);
      const arr = Array.isArray(cur[field]) ? cur[field] : [];
      const sameRef = arr.filter((e) => entryRef(e) === refId);
      if (sameRef.some((e) => entryShape(e) === entryShape(op.value))) { results.push(row(op, 'SKIP_ALREADY_PRESENT', '', '', 'exact entry already present')); continue; }
      if (sameRef.length) { results.push(row(op, 'HOLD_EXISTING_ENTRY_CONFLICT', '', '', 'same ref present with different conditions/confidence/evidenceNote')); continue; }
      const tgtType = st.byId[refId];
      if (!tgtType || !(REL_FIELDS.species[field]?.target || []).includes(tgtType)) { results.push(row(op, 'STOPPED_INVALID_TARGET', '', '', `target ${refId} type=${tgtType}`)); stopped = true; break; }

      const entry = { _key: entryKeyFor(op.candidateId), _type: 'compatibleEntry', ref: { _type: 'reference', _ref: refId }, conditions: op.value.conditions, confidence: op.value.confidence, evidenceNote: op.value.evidenceNote };
      const patch = arr.length ? { id: docId, ifRevisionID: cur._rev, insert: { after: `${field}[${arr.length - 1}]`, items: [entry] } } : { id: docId, ifRevisionID: cur._rev, set: { [field]: [entry] } };

      let attempt = 0, outcome = null;
      while (attempt < MAX_ATTEMPTS) {
        attempt++; mutationCalls++;
        const resp = await post({ mutations: [{ patch }] });
        const cls = classify(resp.status);
        let txn = ''; try { txn = JSON.parse(resp.body).transactionId || ''; } catch (e) {}
        if (cls === 'SUCCESS') { docWrites++; outcome = { cls, status: resp.status, txn }; break; }
        if (cls === 'TRANSIENT') { await sleep(1000 * attempt); continue; }
        outcome = { cls, status: resp.status, txn, body: resp.body.slice(0, 200) }; break;
      }
      if (outcome.cls !== 'SUCCESS') { results.push(row(op, 'WRITE_' + outcome.cls, outcome.status, outcome.txn, outcome.body || '')); stopped = true; break; }

      // immediate read-back
      const after = await q(`*[_id=="${docId}"][0]`);
      const arr2 = Array.isArray(after?.[field]) ? after[field] : [];
      const matches = arr2.filter((e) => entryRef(e) === refId);
      const exact = matches.filter((e) => entryShape(e) === entryShape(op.value)).length;
      const prevRefs = (affected[docId][field] || []).map((e) => entryRef(e));
      const allPrevKept = prevRefs.every((r) => arr2.some((e) => entryRef(e) === r));
      const ok = exact === 1 && allPrevKept;
      results.push(row(op, ok ? 'APPLIED_AND_VERIFIED' : 'UNCERTAIN', outcome.status, outcome.txn, `exact=${exact} prevKept=${allPrevKept}`));
      if (!ok) { stopped = true; break; }
    }
  }
  fs.writeFileSync(path.join(OUT, 'OPERATION_RESULTS.csv'), toCsv(['candidateId', 'documentId', 'path', 'targetId', 'status', 'httpStatus', 'transactionId', 'error'], results));

  // ---- Post-apply verification ----
  const post2 = await liveState();
  const changedDocIds = Object.keys(affected);
  const unrelatedClean = [];
  for (const id of changedDocIds) {
    const fresh = post2.records.species.find((r) => r._id === id);
    unrelatedClean.push({ documentId: id, compatibleSpeciesOnlyChanged: JSON.stringify(strip(fresh)) === JSON.stringify({ ...affected[id], [ 'compatibleSpecies' ]: fresh.compatibleSpecies }) });
  }
  const countOk = post2.total === EXPECTED_TOTAL && TYPES.every((t) => post2.counts[t] === EXPECTED[t]);
  const identityOk = post2.identityHash === EXPECTED_HASH;
  const evBefore = new Set(st.edges.map((e) => `${e.sourceId}|${e.field}|${e.targetId}`));
  const evAfter = new Set(post2.edges.map((e) => `${e.sourceId}|${e.field}|${e.targetId}`));
  const lostEdges = [...evBefore].filter((k) => !evAfter.has(k));
  const addedEdges = [...evAfter].filter((k) => !evBefore.has(k));
  const appliedIds = new Set(results.filter((r) => r.status === 'APPLIED_AND_VERIFIED').map((r) => r.candidateId));
  const addedMatchesApplied = addedEdges.every((k) => { const tgt = k.split('|')[2]; return ops.some((o) => o.value.ref._ref === tgt && appliedIds.has(o.candidateId)); });

  // second dry-run: any op not already satisfied?
  const secondRunRemaining = [];
  for (const o of ops) {
    const doc = post2.records.species.find((r) => r._id === o.documentId);
    const arr = doc?.compatibleSpecies || [];
    if (!arr.some((e) => entryRef(e) === o.value.ref._ref)) secondRunRemaining.push(o.candidateId);
  }

  const verdictClean = countOk && identityOk && lostEdges.length === 0 && changedDocIds.every((id) => { const fresh = post2.records.species.find((r) => r._id === id); return JSON.stringify(strip(fresh)) === JSON.stringify({ ...affected[id], compatibleSpecies: fresh.compatibleSpecies }); });
  const postApply = {
    specId: 'SPEC_12B', artifact: 'POST_APPLY_VERIFICATION', generatedAt: new Date().toISOString(),
    counts: post2.counts, total: post2.total, draftCount: post2.draftCount, dupIds: post2.dupIds, dupSlugs: post2.dupSlugs,
    identityHash: post2.identityHash, identityMatch: identityOk,
    edgesBefore: st.edges.length, edgesAfter: post2.edges.length, addedEdges: addedEdges.length, lostEdges: lostEdges.length,
    addedEdgesAllFromAllowlist: addedMatchesApplied,
    modifiedDocuments: changedDocIds.length,
    onlyCompatibleSpeciesChanged: unrelatedClean.every((u) => u.compatibleSpeciesOnlyChanged),
    unrelatedFieldChecks: unrelatedClean,
    secondDryRunRemainingOps: secondRunRemaining,
    holdsUntouched: true,
    verdict: verdictClean && secondRunRemaining.length === 0 ? 'CLEAN' : 'REVIEW',
  };
  fs.writeFileSync(path.join(OUT, 'POST_APPLY_VERIFICATION.json'), JSON.stringify(postApply, null, 2));

  const applied = results.filter((r) => r.status === 'APPLIED_AND_VERIFIED').length;
  const skipped = results.filter((r) => r.status === 'SKIP_ALREADY_PRESENT').length;
  const heldConf = results.filter((r) => r.status === 'HOLD_EXISTING_ENTRY_CONFLICT').length;
  const uncertain = results.filter((r) => r.status === 'UNCERTAIN').length;
  const integrity = {
    specId: 'SPEC_12B', artifact: 'INTEGRITY', generatedAt: new Date().toISOString(),
    mode: 'CONTROLLED PRODUCTION WRITE (allowlisted 22 compatibleSpecies add-if-absent ops only)',
    content_mutations: { documentsPatched: docWrites, mutationCalls, field: 'compatibleSpecies', opsApplied: applied, opsSkipped: skipped, opsHeldConflict: heldConf, opsUncertain: uncertain },
    counts: post2.counts, total: post2.total, draftCount: post2.draftCount,
    duplicate: { dupIds: post2.dupIds, dupSlugs: post2.dupSlugs },
    identity: { hash: post2.identityHash, expected: EXPECTED_HASH, match: identityOk },
    relationships: { edgesBefore: st.edges.length, edgesAfter: post2.edges.length, added: addedEdges.length, lost: lostEdges.length },
    scopeConfirmation: { onlyCompatibleSpeciesChanged: postApply.onlyCompatibleSpeciesChanged, noHeldRowsPromoted: true, noSchemaChange: true, noDeploy: true },
    environment: { gitHead: require('child_process').execSync('git rev-parse --short HEAD').toString().trim(), gitBranch: require('child_process').execSync('git rev-parse --abbrev-ref HEAD').toString().trim(), node: process.version },
  };
  fs.writeFileSync(path.join(OUT, 'INTEGRITY.json'), JSON.stringify(integrity, null, 2));

  console.log(`EXECUTE done: applied=${applied} skipped=${skipped} heldConflict=${heldConf} uncertain=${uncertain}`);
  console.log(`edges ${st.edges.length} -> ${post2.edges.length} | identity=${identityOk ? 'MATCH' : 'MISMATCH'} | verdict=${post.verdict}`);
  process.exit(postApply.verdict === 'CLEAN' && uncertain === 0 ? 0 : 4);

  function row(op, status, httpStatus, txn, err) { return { candidateId: op.candidateId, documentId: op.documentId, path: op.path, targetId: op.value.ref._ref, status, httpStatus, transactionId: txn, error: err }; }
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
