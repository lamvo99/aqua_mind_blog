const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SPEC01 = path.join('report', 'SPEC_01');
const SPEC001 = path.join('report', 'SPEC_00_1');

const RAW = JSON.parse(fs.readFileSync(path.join(SPEC01, 'raw', 'SPEC_01_RAW_DUMP.json'), 'utf8'));
const records = RAW.records;
const manifest = JSON.parse(fs.readFileSync(path.join(SPEC01, 'SPEC_01_SOURCE_MANIFEST.json'), 'utf8'));
const priorInv = JSON.parse(fs.readFileSync(path.join(SPEC001, 'SPEC_00_1_CANONICAL_INVENTORY.json'), 'utf8')).records;
const scores = JSON.parse(fs.readFileSync(path.join(SPEC01, 'SPEC_01_RECORD_SCORES.json'), 'utf8'));
const auditOut = JSON.parse(fs.readFileSync(path.join(SPEC01, 'SPEC_01_AUDIT_OUTPUT.json'), 'utf8'));

const WIKI = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const TIER_W = auditOut.tierWeights;
const CLASS_RULES = [{ min: 80, label: 'STRUCTURALLY_COMPLETE' }, { min: 60, label: 'MINOR_GAPS' }, { min: 40, label: 'MODERATE_GAPS' }, { min: 20, label: 'MAJOR_GAPS' }, { min: 0, label: 'CRITICAL_STRUCTURAL_GAPS' }];
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (t, it) => (t === 'problem' ? it.title : it.name);
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const results = [];
function check(name, ok, detail) { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); }

function readCsv(file) {
  const [, ...lines] = fs.readFileSync(path.join(SPEC01, file), 'utf8').trim().split('\n');
  const out = [];
  for (const ln of lines) {
    if (ln.trim() === '') continue;
    const c = [];
    let b = '', q = false;
    for (let i = 0; i < ln.length; i++) {
      const ch = ln[i];
      if (q) { if (ch === '"') { if (ln[i + 1] === '"') { b += '"'; i++; } else q = false; } else b += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',') { c.push(b); b = ''; } else b += ch;
    }
    c.push(b); out.push(c);
  }
  return out;
}
const issues = readCsv('SPEC_01_ISSUES.csv');
const recordDepth = readCsv('SPEC_01_RECORD_DEPTH.csv');
const bodyRows = readCsv('SPEC_01_BODY_DEPTH.csv');
const relRows = readCsv('SPEC_01_RELATIONSHIP_AUDIT.csv');
const schemaMatrix = readCsv('SPEC_01_SCHEMA_FIELD_MATRIX.csv');

const idType = {};
const wikiSet = new Set();
const counts = {};
for (const t of WIKI) {
  const list = (records[t] || []).filter((x) => !x._id.startsWith('drafts.'));
  counts[t] = list.length;
  for (const it of list) { idType[it._id] = t; wikiSet.add(it._id); }
}
for (const t of Object.keys(records)) for (const it of records[t]) if (!idType[it._id]) idType[it._id] = t;

// 1. 473 canonical records
check('1. 473 canonical records', Object.keys(counts).every((t) => counts[t] === EXPECTED[t]) && Object.values(counts).reduce((a, b) => a + b, 0) === 473,
  `total=${Object.values(counts).reduce((a, b) => a + b, 0)} ${JSON.stringify(counts)}`);

// 2. category counts exact
check('2. Category counts exact', WIKI.every((t) => counts[t] === EXPECTED[t]), JSON.stringify(counts));

// 3. unique IDs
const dupIds = [...wikiSet].filter((id) => { let n = 0; for (const t of WIKI) for (const it of records[t]) if (it._id === id) n++; return n > 1; });
check('3. Unique canonical IDs', dupIds.length === 0, dupIds.join(','));

// 4. no ID mutation vs SPEC 00.1 post-repair inventory
const priorIds = new Set(priorInv.map((r) => r.canonical_id));
const idDiff = [...wikiSet].filter((id) => !priorIds.has(id)).concat([...priorIds].filter((id) => !wikiSet.has(id)));
check('4. No ID mutation (vs SPEC 00.1 inventory)', idDiff.length === 0, `diff=${idDiff.length}`);

// 5. no slug mutation
const priorSlug = {};
for (const r of priorInv) priorSlug[r.canonical_id] = r.slug ?? null;
let slugDiff = 0;
for (const t of WIKI) for (const it of records[t]) if (wikiSet.has(it._id) && slugValue(it.slug) !== priorSlug[it._id]) slugDiff++;
check('5. No slug mutation (vs SPEC 00.1 inventory)', slugDiff === 0, `slugDiff=${slugDiff}`);

// 6. no unexpected title mutation
const priorTitle = {};
for (const r of priorInv) priorTitle[r.canonical_id] = r.title ?? null;
let titleDiff = 0, titleMutations = [];
for (const t of WIKI) for (const it of records[t]) if (wikiSet.has(it._id)) {
  const now = titleOf(t, it) ?? null;
  if (now !== priorTitle[it._id]) { titleDiff++; titleMutations.push(`${it._id}:${priorTitle[it._id]}=>${now}`); }
}
check('6. No unexpected title mutation (vs SPEC 00.1 inventory)', titleDiff === 0, `titleDiff=${titleDiff} ${titleMutations.slice(0, 3).join('|')}`);

// 7. schema matrix covers six types
const matrixTypes = new Set(schemaMatrix.map((r) => r[0]));
check('7. Schema field matrix covers six types', WIKI.every((t) => matrixTypes.has(t)) && matrixTypes.size === 6, `types=[${[...matrixTypes].sort().join(',')}]`);

// 8. 473 record-depth rows
const depthIds = new Set(recordDepth.map((r) => r[1]));
const depthIdsValid = [...depthIds].every((id) => wikiSet.has(id));
check('8. 473 record-depth rows, valid unique IDs', recordDepth.length === 473 && depthIds.size === 473 && depthIdsValid, `rows=${recordDepth.length} uniq=${depthIds.size}`);

// 9. every issue references valid record/field
const fieldByType = {};
for (const r of schemaMatrix) { if (!fieldByType[r[0]]) fieldByType[r[0]] = new Set(); fieldByType[r[0]].add(r[1]); }
let badIssue = [];
for (const r of issues) {
  const rid = r[3], ftype = idType[rid];
  if (!wikiSet.has(rid)) badIssue.push(`record:${rid}`);
  else if (!fieldByType[ftype]?.has(r[5])) badIssue.push(`field:${rid}.${r[5]}(${ftype})`);
}
check('9. Every issue references a valid record/field', badIssue.length === 0, `bad=${badIssue.length} ${badIssue.slice(0, 3).join('|')}`);

// 10. body audit references valid records
const bodyIds = new Set(bodyRows.map((r) => r[0]));
const bodyIdsValid = [...bodyIds].every((id) => wikiSet.has(id) && idType[id] === 'problem');
check('10. Body audit references valid problem records', bodyRows.length === 43 && bodyIds.size === 43 && bodyIdsValid, `rows=${bodyRows.length}`);

// 11. relationship references valid
let badRel = [];
for (const r of relRows) {
  if (!wikiSet.has(r[1])) badRel.push(`src:${r[1]}`);
  if (r[3] === 'INVALID') { if (r[4] !== 'INVALID') badRel.push(`mismatch-${r[1]}`); continue; }
  if (r[5] === 'FALSE' && idType[r[4]]) badRel.push(`exists-mismatch:${r[1]}->${r[4]}`);
  if (r[5] === 'TRUE' && !idType[r[4]]) badRel.push(`missing-target:${r[4]}`);
}
check('11. Relationship references valid & consistent', badRel.length === 0, `bad=${badRel.length} ${badRel.slice(0, 3).join('|')}`);

// 12. deterministic completeness (independent recomputation from recorded states)
const csvByRow = new Map(); 
const headerOrder = ['document_type','canonical_id','title','slug','category_value','applicable_fields','populated_fields','missing_fields','empty_fields','invalid_fields','completeness_percent','classification','image_class','tier_A','tier_B','tier_C','tier_D','tier_E','states'];
for (const r of recordDepth) {
  const o = {}; headerOrder.forEach((h, i) => (o[h] = r[i]));
  csvByRow.set(o.canonical_id, o);
}
// tier count per type from schema matrix
const tierCount = {};
for (const r of schemaMatrix) { if (!tierCount[r[0]]) tierCount[r[0]] = { A: 0, B: 0, C: 0, D: 0, E: 0 }; tierCount[r[0]][r[7]]++; }
const wByField = {};
for (const r of schemaMatrix) { if (!wByField[r[0]]) wByField[r[0]] = {}; wByField[r[0]][r[1]] = TIER_W[r[7]] / tierCount[r[0]][r[7]]; }
let completenessOk = 0, completenessBad = [];
for (const [id, o] of csvByRow) {
  const type = idType[id];
  const fields = Object.keys(wByField[type]);
  const states = Object.fromEntries(o.states.split('|').map((p) => p.split(':')));
  let wPop = 0, wTot = 0;
  for (const f of fields) { wTot += wByField[type][f]; if (states[f] === 'PRESENT_VALID') wPop += wByField[type][f]; }
  const pct = Math.round((wPop / wTot) * 1000) / 10;
  if (Math.abs(pct - Number(o.completeness_percent)) < 0.15) completenessOk++; else completenessBad.push(`${id}:${o.completeness_percent}vs${pct}`);
}
check('12. Deterministic completeness recalculated identically', completenessBad.length === 0, `mismatch=${completenessBad.length} ${completenessBad.slice(0, 3).join('|')}`);

// 13. deterministic classification thresholds
let clsOk = 0, clsBad = [];
for (const [id, o] of csvByRow) {
  const pct = Number(o.completeness_percent);
  const label = (CLASS_RULES.find((r) => pct >= r.min) || CLASS_RULES[CLASS_RULES.length - 1]).label;
  if (label === o.classification) clsOk++; else clsBad.push(`${id}:${o.classification}vs${label}`);
}
check('13. Classification thresholds deterministic', clsBad.length === 0, `mismatch=${clsBad.length} ${clsBad.slice(0, 3).join('|')}`);

// 14. zero canonical mutations (API re-fetch vs manifest hashes)
(async () => {
  const env = fs.readFileSync('.env.local', 'utf8');
  const TOKEN = (env.match(/SANITY_API_TOKEN="([^"]+)"/) || [])[1];
  const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
  const live = {};
  for (const t of WIKI) {
    const res = await fetch(`${BASE}?query=${encodeURIComponent(`*[_type == "${t}"][]{_id, title, name, slug}`)}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!res.ok) throw new Error(`fetch ${t} failed ${res.status}`);
    const arr = (await res.json()).result || [];
    for (const it of arr) if (!it._id.startsWith('drafts.')) live[it._id] = { type: t, title: titleOf(t, it), slug: slugValue(it.slug) };
  }
  let mut = [], recs = 0;
  for (const [id, m] of Object.entries(manifest.perRecord)) {
    const l = live[id];
    if (!l) { mut.push(`missing:${id}`); continue; }
    const h = sha256(JSON.stringify({ id, title: l.title, slug: l.slug }));
    if (h !== m.h) mut.push(`${id}`); else recs++;
  }
  for (const id of Object.keys(live)) if (!manifest.perRecord[id]) mut.push(`new:${id}`);
  const canon = sha256(Object.keys(manifest.perRecord).sort().map((id) => manifest.perRecord[id].h).join('\n'));
  check('14. Zero canonical mutations (live re-fetch vs manifest)', mut.length === 0 && canon === manifest.manifest.canonicalHash, `mut=${mut.length} hashMatch=${canon === manifest.manifest.canonicalHash}`);

  const failed = results.filter((r) => !r.ok);
  fs.writeFileSync(path.join(SPEC01, 'SPEC_01_VALIDATION.json'), JSON.stringify({ generatedAt: new Date().toISOString(), results, passed: results.length - failed.length, failed: failed.length, verdict: failed.length === 0 ? 'PASS' : 'FAIL', severityCounts: auditOut.severityCounts }, null, 2));
  console.log(`\nSPEC_01_validate: ${results.length - failed.length}/${results.length} checks passed. Verdict: ${failed.length ? 'FAIL' : 'PASS'}`);
})().catch((e) => { console.error('FETCH ERROR:', e.message); results.push({ name: '14. zero canonical mutations', ok: false, detail: 'API fetch failed: ' + e.message }); process.exit(1); });