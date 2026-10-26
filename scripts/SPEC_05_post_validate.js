const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { execSync } = require('child_process');

const OUT_DIR = path.join('report', 'SPEC_05');
const SPEC04_DIR = path.join('report', 'SPEC_04');
const SPEC001_DIR = path.join('report', 'SPEC_00_1');
const SPEC01_DIR = path.join('report', 'SPEC_01');

const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const REF_FIELDS = ['parentSpecies', 'relatedPosts', 'relatedTools', 'compatibleSpecies', 'compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment'];

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : (s && s.current) || null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);
const norm = (v) => (v === undefined || v === null || v === '' ? '' : v);
const stripMeta = (d) => { const c = Object.assign({}, d); delete c._rev; delete c._updatedAt; return c; };

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

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').replace(/^\?/, '').split(/\r?\n/).filter((l) => l.length);
  const parseLine = (l) => {
    const o = []; let cur = ''; let inQ = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (inQ) {
        if (ch === String.fromCharCode(34) && l[i + 1] === String.fromCharCode(34)) { cur += String.fromCharCode(34); i++; }
        else if (ch === String.fromCharCode(34)) inQ = false;
        else cur += ch;
      } else if (ch === String.fromCharCode(34)) inQ = true;
      else if (ch === ',') { o.push(cur); cur = ''; }
      else cur += ch;
    }
    o.push(cur);
    return o;
  };
  const hdr = parseLine(lines[0]);
  return lines.slice(1).map((l) => {
    const vals = parseLine(l);
    const row = {};
    hdr.forEach((h, i) => { row[h] = vals[i] !== undefined ? vals[i] : ''; });
    return row;
  });
}

function extractEnum(schemaFile, fieldName) {
  const src = fs.readFileSync(schemaFile, 'utf8');
  const idx = src.indexOf("name: '" + fieldName + "'");
  const rest = src.slice(idx);
  const listIdx = rest.indexOf('list:');
  const end = rest.indexOf(']', listIdx);
  return (rest.slice(listIdx, end).match(/'([^']*)'/g) || []).map((s) => s.slice(1, -1));
}
const ENUMS = {
  group: { species: extractEnum(path.join('sanity', 'schemaTypes', 'species.ts'), 'group'), plant: extractEnum(path.join('sanity', 'schemaTypes', 'plant.ts'), 'group') },
  waterType: { problem: extractEnum(path.join('sanity', 'schemaTypes', 'problem.ts'), 'waterType') },
};

const checks = [];
const ac = (id, name, ok, detail) => {
  checks.push({ id: id, name: name, pass: !!ok, detail: String(detail === undefined ? '' : detail) });
  console.log((ok ? 'AC OK  ' : 'AC FAIL') + ' ' + id + ' ' + name + ' - ' + (detail === undefined ? '' : detail));
};

(async () => {
  const PRE = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_05_PRE_REPAIR_SNAPSHOT.json'), 'utf8'));
  const PLAN = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_05_APPROVED_MUTATION_PLAN.json'), 'utf8'));
  const LOG = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_05_MUTATION_LOG.json'), 'utf8'));
  const GATEAVAL = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_05_VALIDATION.json'), 'utf8'));

  // fresh live read
  const live = {};
  for (const t of WIKI_TYPES) live[t] = await q('*[_type == "' + t + '" && !(_id in path("drafts.**"))]');
  const livePosts = await q('*[_type == "post" && !(_id in path("drafts.**"))]');
  const liveTools = await q('*[_type == "tool" && !(_id in path("drafts.**"))]');
  const liveCats = await q('*[_type == "category" && !(_id in path("drafts.**"))]');

  const liveBy = {}; const preBy = {};
  for (const t of WIKI_TYPES) {
    for (const r of live[t]) liveBy[r._id] = { type: t, rec: r };
    for (const r of PRE.records[t]) preBy[r._id] = { type: t, rec: r };
  }
  const planByKey = {};
  for (const r of PLAN.rows) planByKey[r.recordId] = r;

  // ---- D-01..D-04 identity ----
  const counts = {};
  for (const t of WIKI_TYPES) counts[t] = live[t].filter((r) => !r._id.startsWith('drafts.')).length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  ac('D-01', 'record count = 473 with exact per-type composition',
    total === 473 && WIKI_TYPES.every((t) => counts[t] === EXPECTED[t]),
    'total=' + total + ' ' + JSON.stringify(counts));

  let idDiff = 0, slugDiff = 0, titleDiff = 0;
  for (const id of Object.keys(preBy)) if (!liveBy[id]) idDiff++;
  for (const id of Object.keys(liveBy)) if (!preBy[id]) idDiff++;
  for (const id of Object.keys(preBy)) {
    const a = liveBy[id]; const b = preBy[id];
    if (!a) continue;
    if (slugValue(a.rec.slug) !== slugValue(b.rec.slug)) slugDiff++;
    if (titleOf(a.type, a.rec) !== titleOf(b.type, b.rec)) titleDiff++;
  }
  ac('D-02', 'ID diff = 0 vs pre-repair snapshot', idDiff === 0, 'idDiff=' + idDiff);
  ac('D-03', 'slug diff = 0 vs pre-repair snapshot', slugDiff === 0, 'slugDiff=' + slugDiff);
  ac('D-04', 'title diff = 0 vs pre-repair snapshot', titleDiff === 0, 'titleDiff=' + titleDiff);

  // ---- D-05/D-06 scope: changed docs/fields exactly = plan ----
  const changedDocs = [];
  const unexpected = [];
  let changedFieldCount = 0;
  for (const t of WIKI_TYPES) {
    for (const rec of live[t]) {
      const pre = preBy[rec._id];
      if (!pre) { unexpected.push(rec._id + ':added'); continue; }
      const a = stripMeta(rec); const b = stripMeta(pre.rec);
      if (JSON.stringify(a) === JSON.stringify(b)) continue;
      changedDocs.push(rec._id);
      const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
      const changed = [...keys].filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
      changedFieldCount += changed.length;
      const planRow = planByKey[rec._id];
      if (!planRow) { unexpected.push(rec._id + ':changed but not a plan target [' + changed.join(',') + ']'); continue; }
      if (changed.length !== 1 || changed[0] !== planRow.field) {
        unexpected.push(rec._id + ':changed fields [' + changed.join(',') + '] expected [' + planRow.field + ']');
        continue;
      }
      if (norm(pre.rec[planRow.field]) !== norm(planRow.currentValue)) unexpected.push(rec._id + ':before value differs from approved currentValue');
      if (rec[planRow.field] !== planRow.proposedValue) unexpected.push(rec._id + ':after value differs from approved proposedValue');
    }
  }
  const changedSet = new Set(changedDocs);
  const missedTargets = Object.keys(planByKey).filter((id) => !changedSet.has(id));
  ac('D-05', 'changed docs = exactly 61, changed fields = exactly 61, each = approved plan row (before/after verified)',
    changedDocs.length === 61 && changedFieldCount === 61 && missedTargets.length === 0 && unexpected.length === 0,
    'changedDocs=' + changedDocs.length + ' changedFields=' + changedFieldCount + ' missedTargets=' + missedTargets.length + ' unexpected=' + (unexpected.slice(0, 3).join('; ') || 0));

  function strictDiff(fresh, old, label) {
    const bad = [];
    const oldBy = {};
    for (const d of old) oldBy[d._id] = d;
    for (const d of fresh) if (!oldBy[d._id] || JSON.stringify(d) !== JSON.stringify(oldBy[d._id])) bad.push(label + ':' + d._id);
    for (const id of Object.keys(oldBy)) if (!fresh.some((d) => d._id === id)) bad.push(label + ':' + id + ':deleted');
    return bad;
  }
  const otherChanges = [
    ...strictDiff(livePosts, PRE.posts, 'post'),
    ...strictDiff(liveTools, PRE.tools, 'tool'),
    ...strictDiff(liveCats, PRE.categories, 'category'),
  ];
  ac('D-06', 'unexpected mutations = 0 (posts/tools/categories byte-identical; no non-plan wiki change)',
    otherChanges.length === 0 && unexpected.length === 0,
    'otherTypeChanges=' + otherChanges.length + ' wikiUnexpected=' + (unexpected.length ? unexpected.slice(0, 3).join('; ') : 0));

  // ---- exclusions ----
  const csvA = parseCsv(fs.readFileSync(path.join(SPEC04_DIR, 'SPEC_04_REVIEW_REQUIRED_AUDIT.csv'), 'utf8'));
  const csvB = parseCsv(fs.readFileSync(path.join(SPEC04_DIR, 'SPEC_04_REPLACE_FIELD_AUDIT.csv'), 'utf8'));
  const csvC = parseCsv(fs.readFileSync(path.join(SPEC04_DIR, 'SPEC_04_BLOCKED_CLASSIFICATION.csv'), 'utf8'));

  let medTouched = 0;
  const aMed = csvA.filter((r) => r.confidence === 'MEDIUM');
  for (const r of aMed) {
    const field = r.field.slice(r.field.indexOf('.') + 1);
    const rec = liveBy[r.recordId] && liveBy[r.recordId].rec;
    if (!rec || norm(rec[field]) !== norm(r.currentValue)) medTouched++;
  }
  ac('D-07', '48 MEDIUM REVIEW_REQUIRED rows untouched (values still as audited)',
    aMed.length === 48 && medTouched === 0, 'rows=' + aMed.length + ' touched=' + medTouched);

  let medRTouched = 0;
  const bMed = csvB.filter((r) => r.confidence === 'MEDIUM');
  for (const r of bMed) {
    const field = r.field.slice(r.field.indexOf('.') + 1);
    const rec = liveBy[r.recordId] && liveBy[r.recordId].rec;
    if (!rec || norm(rec[field]) !== norm(r.beforeValue)) medRTouched++;
  }
  ac('D-08', '2 MEDIUM REPLACE_FIELD rows untouched (still original value)',
    bMed.length === 2 && medRTouched === 0, 'rows=' + bMed.length + ' touched=' + medRTouched);

  let blockedTouched = 0;
  for (const r of csvC) {
    const field = r.field.slice(r.field.indexOf('.') + 1);
    const rec = liveBy[r.recordId] && liveBy[r.recordId].rec;
    if (!rec || norm(rec[field]) !== norm(r.currentValue)) blockedTouched++;
  }
  ac('D-09', '1,146 BLOCKED rows untouched',
    csvC.length === 1146 && blockedTouched === 0, 'rows=' + csvC.length + ' touched=' + blockedTouched);

  let refChanges = 0;
  for (const id of Object.keys(liveBy)) {
    const a = liveBy[id].rec; const b = preBy[id] && preBy[id].rec;
    if (!b) continue;
    for (const f of REF_FIELDS) if (JSON.stringify(a[f]) !== JSON.stringify(b[f])) refChanges++;
  }
  ac('D-10', 'relationships untouched (all reference fields identical across 473 records)',
    refChanges === 0 && Object.keys(planByKey).every((id) => !REF_FIELDS.includes(planByKey[id].field)),
    'refFieldChanges=' + refChanges);

  let seoChanges = 0; let seoRows = 0;
  for (const t of WIKI_TYPES) for (const rec of live[t]) {
    const pre = preBy[rec._id] && preBy[rec._id].rec;
    if (!pre) continue;
    if (JSON.stringify(rec.seo) !== JSON.stringify(pre.seo)) seoChanges++;
    if (rec.seo !== undefined || pre.seo !== undefined) seoRows++;
  }
  const changedHasSeo = [...changedSet].some((id) => Object.keys(stripMeta(liveBy[id].rec)).some((k) => k === 'seo') && JSON.stringify(stripMeta(liveBy[id].rec).seo) !== JSON.stringify(stripMeta(preBy[id].rec).seo));
  ac('D-11', 'SEO untouched (no seo value changed, no plan row targets seo)',
    seoChanges === 0 && !changedHasSeo, 'seoChanges=' + seoChanges);

  // ---- schema: resulting enum values valid ----
  let enumBad = 0;
  for (const a of LOG.applied) {
    const rec = liveBy[a.recordId] && liveBy[a.recordId].rec;
    const allowed = (ENUMS[a.field] && ENUMS[a.field][a._type]) || [];
    if (!rec || rec[a.field] !== a.after || !allowed.includes(a.after)) enumBad++;
  }
  ac('D-12', 'every resulting enum value valid against live schema (61 applied values)',
    LOG.applied.length === 61 && enumBad === 0, 'applied=' + LOG.applied.length + ' invalid=' + enumBad);

  // ---- mutation log vs plan reconciliation ("SPEC 05 validation" re-run) ----
  const logKeys = new Set(LOG.applied.map((a) => a.recordId + '|' + a.field));
  const planKeys = new Set(PLAN.rows.map((r) => r.recordId + '|' + r.field));
  let logMissing = 0, logExtra = 0;
  for (const k of planKeys) if (!logKeys.has(k)) logMissing++;
  for (const k of logKeys) if (!planKeys.has(k)) logExtra++;
  const gateAPass = GATEAVAL.result === 'PASS' && GATEAVAL.summary.total === 13 && PLAN.reconciliation.approvedActual === 61;
  ac('D-13', 'SPEC 05 validation PASS (GATE A+B validation + plan/log exact reconciliation 61/61)',
    LOG.appliedCount === 61 && LOG.abortedCount === 0 && logMissing === 0 && logExtra === 0 && gateAPass,
    'applied=' + LOG.appliedCount + ' aborted=' + LOG.abortedCount + ' missing=' + logMissing + ' extra=' + logExtra + ' gateA+BValidation=' + GATEAVAL.result);

  // ---- regressions ----
  let r001 = { verdict: 'NOT_RUN', passed: 0, total: 0 };
  let r01 = { verdict: 'NOT_RUN', passed: 0, total: 0 };
  try {
    execSync('node scripts/SPEC_00_1_validate.js', { stdio: 'pipe', timeout: 300000 });
  } catch (e) { console.log('SPEC_00_1_validate exit error: ' + e.message.slice(0, 200)); }
  try {
    const j = JSON.parse(fs.readFileSync(path.join(SPEC001_DIR, 'SPEC_00_1_VALIDATION.json'), 'utf8'));
    r001 = { verdict: j.verdict, passed: j.passed, total: j.passed + j.failed, generatedAt: j.generatedAt };
  } catch (e) { r001 = { verdict: 'UNREADABLE: ' + e.message, passed: 0, total: 0 }; }
  try {
    execSync('node scripts/SPEC_01_validate.js', { stdio: 'pipe', timeout: 300000 });
  } catch (e) { console.log('SPEC_01_validate exit error: ' + e.message.slice(0, 200)); }
  try {
    const j = JSON.parse(fs.readFileSync(path.join(SPEC01_DIR, 'SPEC_01_VALIDATION.json'), 'utf8'));
    r01 = { verdict: j.verdict, passed: j.passed, total: j.passed + j.failed, generatedAt: j.generatedAt };
  } catch (e) { r01 = { verdict: 'UNREADABLE: ' + e.message, passed: 0, total: 0 }; }
  ac('D-14', 'SPEC 00.1 regression PASS', r001.verdict === 'PASS', r001.passed + '/' + r001.total + ' verdict=' + r001.verdict);
  ac('D-15', 'SPEC 01 regression PASS', r01.verdict === 'PASS', r01.passed + '/' + r01.total + ' verdict=' + r01.verdict);

  // ---- identity hash unchanged ----
  const hashParts = Object.keys(liveBy).sort().map((id) => sha256(JSON.stringify({ id: id, title: titleOf(liveBy[id].type, liveBy[id].rec), slug: slugValue(liveBy[id].rec.slug) })));
  const hash = sha256(hashParts.join('\n'));
  ac('D-16', 'canonical identity hash unchanged after repair', hash === EXPECTED_HASH, 'hashMatch=' + (hash === EXPECTED_HASH));

  // ---- artifacts ----
  const generatedAt = new Date().toISOString();
  const postSnap = {
    spec: 'SPEC 05', phase: 'POST_REPAIR_SNAPSHOT', generatedAt: generatedAt,
    canonicalHash: hash, wikiTypeCounts: counts, totalWikiRecords: total,
    identityVsPreRepair: { idDiff: idDiff, slugDiff: slugDiff, titleDiff: titleDiff },
    changedDocs: changedDocs.length, changedFields: changedFieldCount,
    records: live, posts: livePosts, tools: liveTools, categories: liveCats,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_05_POST_REPAIR_SNAPSHOT.json'), JSON.stringify(postSnap, null, 2));

  const result = checks.every((c) => c.pass) ? 'PASS' : 'FAIL';
  const postVal = {
    spec: 'SPEC 05', phase: 'POST_VALIDATION_GATE_D', generatedAt: generatedAt,
    method: 'fresh live re-fetch + full-document diff vs pre-repair snapshot + explicit exclusion scans + live-schema enum check + regressions',
    checks: checks,
    summary: { passed: checks.filter((c) => c.pass).length, total: checks.length, result: result },
    result: result,
    appliedCount: LOG.appliedCount, abortedCount: LOG.abortedCount,
    changedDocs: changedDocs.length, changedFields: changedFieldCount,
    regressions: { spec001: r001, spec01: r01 },
    identityHash: hash,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_05_POST_VALIDATION.json'), JSON.stringify(postVal, null, 2));

  console.log('\nGATE D VALIDATION ' + result + ': ' + postVal.summary.passed + '/' + checks.length + ' checks passed');
  if (result !== 'PASS') process.exit(2);
})().catch((e) => { console.error('POST VALIDATE ERROR:', e.stack || e.message); process.exit(1); });
