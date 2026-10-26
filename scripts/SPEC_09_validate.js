// SPEC 09 — integrity/safety validation (§17 post-audit gates + §18 artifact checks).
// READ-ONLY: live re-read via GET only. Writes SPEC_09_INTEGRITY_REPORT.json.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const OUT = path.join('report', 'SPEC_09');
const MIRROR = path.join('reports', 'SPEC_09');
const FINAL = process.argv.includes('--final');
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (t, it) => (t === 'problem' ? it.title : it.name);
const snap = JSON.parse(fs.readFileSync(path.join(OUT, 'SPEC_09_BASELINE_SNAPSHOT.json'), 'utf8'));

function q(query) {
  const url = BASE + '?query=' + encodeURIComponent(query);
  return new Promise((res, rej) => {
    https.get(url, { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      r.on('end', () => { const d = Buffer.concat(chunks).toString('utf8'); try { res(JSON.parse(d).result); } catch (e) { rej(new Error('bad response: ' + d.slice(0, 200))); } });
    }).on('error', rej);
  });
}
function parseCsv(text) {
  const rows = []; let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; } else field += c; }
    else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const readCsv = (name) => { const r = parseCsv(fs.readFileSync(path.join(OUT, name), 'utf8')); const h = r[0]; return r.slice(1).map((x) => Object.fromEntries(h.map((k, i) => [k, x[i]]))); };

const checks = [];
const ac = (id, name, pass, detail) => { checks.push({ id, name, pass: !!pass, detail: String(detail ?? '') }); console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${name} — ${detail ?? ''}`); };

(async () => {
  // ---------- §17 post-audit live gates (double-read, GET only) ----------
  async function fetchAll() { const o = {}; for (const t of TYPES) o[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`); return o; }
  const live1 = await fetchAll();
  const live2 = await fetchAll();
  let dr = 0; for (const t of TYPES) if (JSON.stringify(live1[t]) !== JSON.stringify(live2[t])) dr++;
  ac('B-01', 'post-audit deterministic double-read identical', dr === 0, `mismatchedTypes=${dr}`);

  const counts = {}; let total = 0;
  for (const t of TYPES) { counts[t] = live1[t].length; total += counts[t]; }
  ac('B-02', 'canonical count unchanged (473, exact type counts)',
    total === 473 && TYPES.every((t) => counts[t] === EXPECTED[t]), `total=${total} ${JSON.stringify(counts)}`);

  const canonical = {};
  for (const t of TYPES) for (const r of live1[t]) canonical[r._id] = { type: t, rec: r };
  const hashParts = Object.keys(canonical).sort().map((id) => { const c = canonical[id]; return sha256(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) })); });
  const hash = sha256(hashParts.join('\n'));
  ac('B-03', 'canonical identity hash unchanged', hash === EXPECTED_HASH, hash === EXPECTED_HASH ? 'MATCH' : hash);

  // full-doc compare vs baseline snapshot (titles/slugs/categories/relationships/SEO/_updatedAt all covered)
  let changed = 0, titleDiff = 0, slugDiff = 0, catDiff = 0, relDiff = 0, seoDiff = 0, updatedDiff = 0;
  const changedIds = [];
  const snapMap = {};
  for (const t of TYPES) for (const r of snap.records[t]) snapMap[r._id] = { type: t, rec: r };
  const relKeys = ['compatibleSpecies', 'compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedProblems', 'relatedPosts', 'relatedTools', 'aquariumStyle'];
  for (const id of Object.keys(snapMap)) {
    const old = snapMap[id], now = canonical[id];
    if (!now) { changed++; changedIds.push(id + ':deleted'); continue; }
    if (titleOf(old.type, old.rec) !== titleOf(now.type, now.rec)) titleDiff++;
    if (slugValue(old.rec.slug) !== slugValue(now.rec.slug)) slugDiff++;
    if (JSON.stringify(old.rec.category) !== JSON.stringify(now.rec.category)) catDiff++;
    if (JSON.stringify(relKeys.map((k) => old.rec[k] || null)) !== JSON.stringify(relKeys.map((k) => now.rec[k] || null))) relDiff++;
    if (JSON.stringify(old.rec.seo || null) !== JSON.stringify(now.rec.seo || null)) seoDiff++;
    if (String(old.rec._updatedAt) !== String(now.rec._updatedAt)) updatedDiff++;
    if (JSON.stringify(old.rec) !== JSON.stringify(now.rec)) { changed++; if (changedIds.length < 10) changedIds.push(id); }
  }
  const extra = Object.keys(canonical).filter((id) => !snapMap[id]).length;
  ac('B-04', 'full-document diff vs baseline = 0 (titles/slugs/categories/relationships/SEO)',
    changed === 0 && extra === 0 && titleDiff === 0 && slugDiff === 0 && catDiff === 0 && relDiff === 0 && seoDiff === 0,
    `changed=${changed} extra=${extra} title=${titleDiff} slug=${slugDiff} cat=${catDiff} rel=${relDiff} seo=${seoDiff}`);
  ac('B-05', '_updatedAt changes = 0', updatedDiff === 0, `updatedDiff=${updatedDiff}`);

  // zero mutations: static check that SPEC 09 scripts contain no mutation path
  // (needles are assembled from fragments so this scanner does not match itself)
  const specFiles = ['SPEC_09_extract.js', 'SPEC_09_audit.js', 'SPEC_09_validate.js'].map((f) => path.join('scripts', f));
  const needles = [['mut', 'ate'], ['createOr', 'Replace'], ['.patch', '('], ['metho', 'd:'], ['"POST', '"'], ["'POST", "'"]];
  let mutHints = 0;
  for (const f of specFiles) {
    const src = fs.readFileSync(f, 'utf8');
    if (needles.some((n) => src.includes(n.join('')))) mutHints++;
  }
  ac('B-06', 'Sanity writes = 0 / no mutation path in SPEC 09 scripts', mutHints === 0, `scriptsWithMutationHints=${mutHints} (GET query only)`);

  // ---------- §18 artifact checks ----------
  const ART = ['SPEC_09_KNOWLEDGE_COVERAGE_AUDIT_REPORT.md', 'SPEC_09_RECORD_GAP_MATRIX.csv', 'SPEC_09_DOMAIN_SUMMARY.csv', 'SPEC_09_PRIORITY_QUEUE.csv', 'SPEC_09_SCHEMA_GAP_REGISTER.csv', 'SPEC_09_RELATIONSHIP_GAP_REGISTER.csv', 'SPEC_09_RESEARCH_REQUIRED.csv', 'SPEC_09_EXECUTION_LOG.md', 'SPEC_09_BASELINE_SNAPSHOT.json', 'SPEC_09_INTEGRITY_REPORT.json'];
  const present = ART.filter((a) => fs.existsSync(path.join(OUT, a)));
  const missing = ART.filter((a) => !present.includes(a)).filter((a) => a !== 'SPEC_09_INTEGRITY_REPORT.json');
  ac('C-01', 'required artifacts present (integrity report written by this run)', missing.length === 0, `present=${present.length}/10 missing=${missing.join(',') || 'none-yet(own file)'}`);

  const matrix = readCsv('SPEC_09_RECORD_GAP_MATRIX.csv');
  const ids = matrix.map((m) => m.recordId);
  const snapIds = Object.keys(snapMap);
  const dupIds = ids.length - new Set(ids).size;
  const missingIds = snapIds.filter((i) => !ids.includes(i)).length;
  const extraIds = ids.filter((i) => !snapIds.includes(i)).length;
  ac('C-02', 'record matrix = 473 rows, unique ids, exact canonical id-set', matrix.length === 473 && dupIds === 0 && missingIds === 0 && extraIds === 0,
    `rows=${matrix.length} dup=${dupIds} missing=${missingIds} extra=${extraIds}`);

  const perType = {};
  for (const m of matrix) perType[m.type] = (perType[m.type] || 0) + 1;
  ac('C-03', 'per-domain record reconciliation', TYPES.every((t) => perType[t] === EXPECTED[t]), JSON.stringify(perType));

  const dom = readCsv('SPEC_09_DOMAIN_SUMMARY.csv');
  const statusRows = dom.filter((d) => d.rowType === 'DOMAIN_STATUS');
  const reqRows = dom.filter((d) => d.rowType === 'REQUIREMENT');
  const statusSum = statusRows.reduce((s, d) => s + +d.records, 0);
  const badRowMath = reqRows.filter((r) => (+r.covered) + (+r.partial) + (+r.missing) + (+r.na) + (+r.uncertain) !== +statusRows.find((s) => s.domain === r.domain).records);
  ac('C-04', 'domain summary: 6 status rows sum=473; every requirement row math reconciles',
    statusRows.length === 6 && statusSum === 473 && badRowMath.length === 0,
    `statusRows=${statusRows.length} sum=${statusSum} badReqRows=${badRowMath.length}`);

  // independent recompute from matrix evidence
  const sevTot = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  const gapTot = { CONTENT_GAP: 0, SCHEMA_GAP: 0, RELATIONSHIP_GAP: 0, BODY_GAP: 0, RESEARCH_GAP: 0 };
  let researchGaps = 0, totalGaps = 0;
  const schemaRe = {}, researchRe = {};
  for (const m of matrix) {
    const ev = JSON.parse(m.requirementEvidence);
    for (const g of ev) {
      if (g.coverage === 'COVERED' || g.coverage === 'NOT_APPLICABLE') continue;
      totalGaps++; sevTot[g.severity]++;
      if (g.gapType) gapTot[g.gapType]++;
      if (g.researchRequired) researchGaps++;
      if (g.gapType === 'SCHEMA_GAP') { const k = `${m.type}:${g.requirement}`; schemaRe[k] = (schemaRe[k] || 0) + 1; }
      if (g.researchRequired) { const k = `${m.type}:${g.requirement}`; researchRe[k] = (researchRe[k] || 0) + 1; }
    }
  }
  const sevRowTot = reqRows.reduce((a, r) => (a.CRITICAL += +r.gapsCritical, a.HIGH += +r.gapsHigh, a.MEDIUM += +r.gapsMedium, a.LOW += +r.gapsLow, a), { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 });
  ac('C-05', 'severity distribution reconciles (matrix vs domain summary requirement rows)',
    JSON.stringify(sevTot) === JSON.stringify(sevRowTot), `matrix=${JSON.stringify(sevTot)} summary=${JSON.stringify(sevRowTot)}`);

  const schemaReg = readCsv('SPEC_09_SCHEMA_GAP_REGISTER.csv');
  const schemaOk = schemaReg.every((s) => schemaRe[`${s.domain}:${s.requirement}`] === +s.affectedRecords) && Object.keys(schemaRe).length === schemaReg.length;
  ac('C-06', 'schema gap register reconciles with matrix SCHEMA_GAP instances',
    schemaOk, `registerRows=${schemaReg.length} matrixKeys=${Object.keys(schemaRe).length}`);

  const researchReg = readCsv('SPEC_09_RESEARCH_REQUIRED.csv');
  const researchOk = researchReg.every((r) => researchRe[`${r.domain}:${r.requirement}`] === +r.affectedRecords) && Object.keys(researchRe).length === researchReg.length;
  ac('C-07', 'research register reconciles with matrix researchRequired flags',
    researchOk, `registerRows=${researchReg.length} matrixKeys=${Object.keys(researchRe).length} researchGaps=${researchGaps}`);

  const prio = readCsv('SPEC_09_PRIORITY_QUEUE.csv');
  const pRec = prio.filter((p) => p.itemType === 'RECORD');
  const pSch = prio.filter((p) => p.itemType === 'SCHEMA');
  const pRel = prio.filter((p) => p.itemType === 'RELATIONSHIP');
  const recIdsOk = pRec.length === 473 && new Set(pRec.map((p) => p.recordId)).size === 473;
  const prioritiesOk = prio.every((p) => ['P0', 'P1', 'P2', 'P3', 'NONE'].includes(p.priority));
  ac('C-08', 'priority queue reconciliation (473 RECORD unique + SCHEMA=register + REL=register, valid priorities)',
    recIdsOk && pSch.length === schemaReg.length && pRel.length === 17 && prioritiesOk,
    `RECORD=${pRec.length} SCHEMA=${pSch.length} REL=${pRel.length}`);

  const relReg = readCsv('SPEC_09_RELATIONSHIP_GAP_REGISTER.csv');
  ac('C-09', 'relationship gap register = 17 rows, all gapType RELATIONSHIP_GAP',
    relReg.length === 17 && relReg.every((r) => r.gapType === 'RELATIONSHIP_GAP'), `rows=${relReg.length}`);

  ac('C-10', 'CSV row-count reconciliation',
    matrix.length === 473 && dom.length === 236 && prio.length === 589 && schemaReg.length === 99 && relReg.length === 17 && researchReg.length === 201,
    `matrix=${matrix.length} domain=${dom.length} prio=${prio.length} schema=${schemaReg.length} rel=${relReg.length} research=${researchReg.length}`);

  // mirror byte-identity
  let mirrorBad = [];
  if (fs.existsSync(MIRROR)) {
    for (const a of ART) {
      const p1 = path.join(OUT, a), p2 = path.join(MIRROR, a);
      if (!fs.existsSync(p2)) { mirrorBad.push(a + ':missing'); continue; }
      if (sha256(fs.readFileSync(p1)) !== sha256(fs.readFileSync(p2))) mirrorBad.push(a + ':differs');
    }
  } else mirrorBad.push('mirrorDir:missing');
  if (!FINAL) {
    ac('C-11', 'mirror byte-identical (reports/SPEC_09)', mirrorBad.length === 0 || mirrorBad.every((x) => x.includes('SPEC_09_INTEGRITY_REPORT')), `status=${mirrorBad.length ? 'pending/not-yet-final: ' + mirrorBad.join(',') : 'ok'} (final check on --final run)`);
  } else {
    ac('C-11', 'mirror byte-identical (reports/SPEC_09, all 10 artifacts)', mirrorBad.length === 0, `bad=${mirrorBad.join(',') || 'none'}`);
  }

  const failed = checks.filter((c) => !c.pass);
  const report = {
    specId: 'SPEC_09', generatedAt: new Date().toISOString(), finalRun: FINAL,
    mode: 'READ-ONLY', sanityWrites: 0, mutationCalls: 0,
    gates: { preAudit: snap.gates, postAudit: checks.filter((c) => c.id.startsWith('B-')), artifacts: checks.filter((c) => c.id.startsWith('C-')) },
    recomputed: { totalGaps, severityDistribution: sevTot, gapTypeDistribution: gapTot, researchRequiredGaps: researchGaps, schemaGapKeys: Object.keys(schemaRe).length, researchKeys: Object.keys(researchRe).length },
    status: failed.length === 0 ? 'SPEC 09 — COMPLETE / READ-ONLY' : 'SPEC 09 — BLOCKED',
    failedChecks: failed,
  };
  fs.writeFileSync(path.join(OUT, 'SPEC_09_INTEGRITY_REPORT.json'), JSON.stringify(report, null, 1));
  console.log(`INTEGRITY written. failed=${failed.length} status=${report.status}`);
  if (failed.length) process.exitCode = 2;
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
