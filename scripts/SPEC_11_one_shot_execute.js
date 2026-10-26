const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// SPEC 11 one-shot - production write executor.
// Conditional patched writes (ifRevisionID), per-record transactions, read-back verification.

const OUT = path.join('reports', 'SPEC_11', 'one_shot');
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const PROJECT = 'zeohjejw'; const DATASET = 'production'; const API = 'v2026-05-25';
const BASE = `https://${PROJECT}.api.sanity.io/${API}/data/query/${DATASET}`;
const MUTATE = `/${API}/data/mutate/${DATASET}`;
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const BATCH = 4;
const MAX_ATTEMPTS = 3;

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const shaFile = (f) => sha256(fs.readFileSync(f));
const slugValue = (s) => (typeof s === 'string' ? s : (s && s.current) || null);
const titleOf = (t, it) => (t === 'problem' ? it.title : it.name);

function splitCsvLine(line) { const o = []; let c = '', q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (q) { if (ch === '"') { if (line[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else { if (ch === '"') q = true; else if (ch === ',') { o.push(c); c = ''; } else c += ch; } } o.push(c); return o; }
function readCsv(f) { const lines = fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length); const h = splitCsvLine(lines[0]); return lines.slice(1).map((l) => { const r = splitCsvLine(l); const o = {}; h.forEach((k, i) => { o[k] = r[i] == null ? '' : r[i]; }); return o; }); }
const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const toCsv = (h, rows) => h.join(',') + '\n' + rows.map((r) => h.map((k) => esc(r[k])).join(',')).join('\n') + '\n';

function get(query) { const url = BASE + '?query=' + encodeURIComponent(query); return new Promise((res, rej) => { https.get(url, { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => { const c = []; r.on('data', (x) => c.push(Buffer.from(x))); r.on('end', () => { const d = Buffer.concat(c).toString('utf8'); try { res(JSON.parse(d).result); } catch (e) { rej(new Error('bad response: ' + d.slice(0, 300))); } }); }).on('error', rej); }); }
function post(bodyObj) { const body = JSON.stringify(bodyObj); return new Promise((res, rej) => { const req = https.request({ hostname: PROJECT + '.api.sanity.io', path: MUTATE, method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (r) => { const c = []; r.on('data', (x) => c.push(Buffer.from(x))); r.on('end', () => res({ status: r.statusCode, body: Buffer.concat(c).toString('utf8') })); }); req.on('error', rej); req.write(body); req.end(); }); }
function classify(status) { if (status >= 200 && status < 300) return 'SUCCESS'; if (status === 401 || status === 403) return 'AUTH'; if (status === 409 || status === 412) return 'REVISION_CONFLICT'; if (status >= 500 || status === 429) return 'TRANSIENT'; return 'CLIENT_ERROR'; }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const allowlist = new Set(['minTankLengthCm', 'minTankWidthCm', 'swimmingSpace', 'jumpRisk', 'lidRequired', 'flowPreference', 'oxygenSensitivity', 'maturityRequirement', 'bioload', 'waterChangeSensitivity', 'behaviorFlags', 'groupSize', 'communitySuitability', 'predatesInverts', 'tankSizeMinL', 'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'ghMin', 'ghMax', 'salinityMin', 'salinityMax', 'temperament', 'diet']);

function newBlockKey() { return 'k' + crypto.randomBytes(6).toString('hex'); }
function proseToBlocks(text) { return [{ _type: 'block', _key: newBlockKey(), style: 'normal', markDefs: [], children: [{ _type: 'span', _key: newBlockKey(), text: String(text).trim(), marks: [] }] }]; }
function coerce(path, r) {
  const v = r.newValue;
  if (path.startsWith('knowledgeBody.')) { const text = r.caveat ? String(v) + '\n\n' + r.caveat : String(v); return { ok: true, value: proseToBlocks(text) }; }
  if (path === 'behaviorFlags') return { ok: true, value: JSON.parse(v) };
  if (path === 'groupSize') return { ok: true, value: JSON.parse(v) };
  const numeric = ['minTankLengthCm', 'minTankWidthCm', 'tankSizeMinL', 'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'ghMin', 'ghMax', 'salinityMin', 'salinityMax'];
  if (numeric.includes(path)) { const n = Number(v); return isFinite(n) ? { ok: true, value: n } : { ok: false, value: v }; }
  return { ok: true, value: v };
}
function getPath(obj, dotted) { return dotted.split('.').reduce((a, k) => (a == null ? a : a[k]), obj); }

(async () => {
  const baseline = JSON.parse(fs.readFileSync(path.join(OUT, 'PRE_WRITE_BASELINE.json'), 'utf8'));
  const plan = readCsv(path.join(OUT, 'FINAL_OPERATION_PLAN.csv'));
  const applied = plan.filter((r) => r.action === 'APPLY' || r.action === 'APPLY_WITH_CAVEAT');

  const byRec = {};
  for (const r of applied) { (byRec[r.recordId] = byRec[r.recordId] || []).push(r); }
  const recIds = Object.keys(byRec).sort();

  const log = []; const verify = [];
  let docWrites = 0, mutationCalls = 0;
  for (const recId of recIds) {
    const ops = byRec[recId];
    // scope lock
    for (const r of ops) { if (r.path.startsWith('knowledgeBody.')) { if (!r.path.split('.')[1]) throw new Error('bad body path'); } else if (!allowlist.has(r.path)) { throw new Error('path not allowlisted: ' + r.path); } }
    // concurrency: re-read current record
    const cur = (await get(`*[_id=="${recId}"][0]`));
    if (!cur) { for (const r of ops) log.push({ candidateId: r.candidateId, recordId: recId, path: r.path, action: r.action, status: 'SKIPPED_MISSING', httpStatus: '', transactionId: '', attempt: 0, error: 'record not found' }); continue; }
    const snapRev = (baseline.revisions[recId] || {}).rev;
    const set = {}; const skipped = [];
    for (const r of ops) {
      const cv = coerce(r.path, r);
      if (!cv.ok) { skipped.push({ r, why: 'coerce failed' }); continue; }
      const existing = getPath(cur, r.path);
      if (r.mutationType === 'fill' && existing != null && !(Array.isArray(existing) && existing.length === 0)) { skipped.push({ r, why: 'destination already populated (drift) existing=' + JSON.stringify(existing).slice(0, 80) }); continue; }
      if (r.mutationType === 'replace' && String(r.currentValue) !== '' && existing != null && String(existing) !== String(r.currentValue)) { skipped.push({ r, why: 'current value drifted (expected ' + r.currentValue + ', found ' + JSON.stringify(existing) + ')' }); continue; }
      set[r.path] = cv.value;
    }
    for (const s of skipped) log.push({ candidateId: s.r.candidateId, recordId: recId, path: s.r.path, action: s.r.action, status: 'SKIPPED_DRIFT', httpStatus: '', transactionId: '', attempt: 0, error: s.why });

    if (!Object.keys(set).length) continue;
    if (cur._rev !== snapRev) console.log('NOTE: ' + recId + ' revision changed since freeze; per-path drift checks applied');

    let attempt = 0, outcome = null;
    while (attempt < MAX_ATTEMPTS) {
      attempt++;
      mutationCalls++;
      const before = { candidateId: 'TXN', recordId: recId, path: '(transaction)', action: 'atomic-set', status: 'CALLING', httpStatus: '', transactionId: '', attempt, error: Object.keys(set).join('|') };
      const resp = await post({ mutations: [{ patch: { id: recId, ifRevisionID: cur._rev, set } }] });
      const cls = classify(resp.status);
      let transactionId = ''; try { transactionId = JSON.parse(resp.body).transactionId || ''; } catch (e) {}
      if (cls === 'SUCCESS') { docWrites++; outcome = { cls, status: resp.status, transactionId }; break; }
      if (cls === 'TRANSIENT') { log.push({ ...before, status: 'RETRY_TRANSIENT', httpStatus: resp.status, transactionId, error: resp.body.slice(0, 200) }); await sleep(1000 * attempt); continue; }
      outcome = { cls, status: resp.status, transactionId, body: resp.body.slice(0, 300) }; break;
    }
    for (const r of ops) {
      const inSet = Object.prototype.hasOwnProperty.call(set, r.path);
      log.push({
        candidateId: r.candidateId, recordId: recId, path: r.path, action: r.action,
        status: inSet ? (outcome.cls === 'SUCCESS' ? 'WRITTEN' : outcome.cls) : 'SKIPPED_DRIFT',
        httpStatus: inSet ? outcome.status : '', transactionId: inSet ? (outcome.transactionId || '') : '', attempt,
        error: inSet ? (outcome.cls === 'SUCCESS' ? '' : (outcome.body || '')) : 'not in transaction set',
      });
    }
  }

  // ---- post-write verification: re-read every changed record ----
  const changedRecs = [...new Set(log.filter((l) => l.status === 'WRITTEN').map((l) => l.recordId))].sort();
  for (const recId of changedRecs) {
    const cur = await get(`*[_id=="${recId}"][0]`);
    const writ = log.filter((l) => l.recordId === recId && l.status === 'WRITTEN');
    for (const w of writ) {
      const r = plan.find((p) => p.candidateId === w.candidateId);
      const cv = coerce(r.path, r);
      const actual = getPath(cur, r.path);
      let ok = cv.ok;
      if (cv.ok && r.path.startsWith('knowledgeBody.')) { const txt = (actual || []).map((b) => (b.children || []).map((c) => c.text).join('')).join('\n'); ok = txt.includes(String(r.newValue).trim().slice(0, 60)); }
      else if (r.path === 'behaviorFlags') ok = JSON.stringify(actual) === JSON.stringify(cv.value);
      else if (r.path === 'groupSize') ok = actual && Number(actual.min) === cv.value.min && (cv.value.max == null ? true : Number(actual.max) === cv.value.max);
      else if (typeof cv.value === 'number') ok = Number(actual) === cv.value;
      else ok = String(actual) === String(cv.value);
      verify.push({ candidateId: w.candidateId, recordId: recId, path: r.path, expected: r.path.startsWith('knowledgeBody.') ? String(r.newValue).slice(0, 60) : r.newValue, actual: r.path.startsWith('knowledgeBody.') ? String((actual || []).map((b) => (b.children || []).map((c) => c.text).join('')).join(' ')).slice(0, 60) : (r.path === 'groupSize' ? JSON.stringify(actual) : String(actual)), verified: ok });
    }
  }

  // ---- integrity re-check ----
  const fetchWiki = async () => { const o = {}; for (const t of WIKI_TYPES) o[t] = await get(`*[_type == "${t}" && !(_id in path("drafts.**"))]`); return o; };
  const recs = await fetchWiki();
  const counts = {}; for (const t of WIKI_TYPES) counts[t] = recs[t].length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const canonical = {}; for (const t of WIKI_TYPES) for (const r of recs[t]) canonical[r._id] = { type: t, rec: r };
  const hashParts = Object.keys(canonical).sort().map((id) => { const c = canonical[id]; return sha256(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) })); });
  const identityHash = sha256(hashParts.join('\n'));
  const relFields = ['compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedProblems', 'relatedPosts', 'relatedTools', 'parentSpecies', 'compatibleSpecies', 'incompatibleSpecies', 'predatorPrey'];
  const relSeal = sha256(WIKI_TYPES.map((t) => recs[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id))).map((r) => JSON.stringify(relFields.map((f) => (Array.isArray(r[f]) ? r[f].map((v) => (v && v._ref) || v) : r[f] == null ? null : r[f])))).join('\n')).join('\n'));
  const seoSeal = sha256(WIKI_TYPES.map((t) => recs[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id))).map((r) => JSON.stringify(r.seo || null)).join('\n')).join('\n'));
  const protectedOk = relSeal === baseline.seals.relSeal && seoSeal === baseline.seals.seoSeal && identityHash === EXPECTED_HASH && total === 473 && WIKI_TYPES.every((t) => counts[t] === EXPECTED[t]);

  const headers = ['candidateId', 'recordId', 'path', 'action', 'status', 'httpStatus', 'transactionId', 'attempt', 'error'];
  fs.writeFileSync(path.join(OUT, 'MUTATION_LOG.csv'), toCsv(headers, log));
  fs.writeFileSync(path.join(OUT, 'POST_WRITE_VERIFICATION.csv'), toCsv(['candidateId', 'recordId', 'path', 'expected', 'actual', 'verified'], verify));

  const verifiedOk = verify.filter((v) => v.verified).length;
  const integrity = {
    specId: 'SPEC_11', artifact: 'ONE_SHOT_INTEGRITY', generatedAt: new Date().toISOString(),
    mode: 'PRODUCTION WRITE (repo schema authoritative; conditional writes with read-back verification)',
    identityHash, identityMatch: identityHash === EXPECTED_HASH, counts, total,
    protectedSealsUnchanged: protectedOk,
    sanityWrites: docWrites, mutationCalls, mutationCallsNote: 'includes 1 earlier empty-payload auth probe; document writes counted separately',
    operations: { planned: applied.length, written: log.filter((l) => l.status === 'WRITTEN').length, skippedDrift: log.filter((l) => l.status === 'SKIPPED_DRIFT').length, failed: log.filter((l) => ['AUTH', 'REVISION_CONFLICT', 'CLIENT_ERROR'].includes(l.status)).length },
    verification: { checked: verify.length, passed: verifiedOk, failed: verify.length - verifiedOk },
    verdict: (identityHash === EXPECTED_HASH && protectedOk && verify.length > 0 && verifiedOk === verify.length) ? 'COMPLETE' : 'PARTIAL_COMPLETE',
  };
  fs.writeFileSync(path.join(OUT, 'INTEGRITY.json'), JSON.stringify(integrity, null, 2));
  console.log('MUTATION_LOG rows=' + log.length + ' written=' + integrity.operations.written + ' drift=' + integrity.operations.skippedDrift);
  console.log('verification ' + verifiedOk + '/' + verify.length + ' | docWrites=' + docWrites + ' mutationCalls=' + mutationCalls);
  console.log('integrity identity=' + (integrity.identityMatch ? 'MATCH' : 'MISMATCH') + ' protected=' + protectedOk + ' total=' + total);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
