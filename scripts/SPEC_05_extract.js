const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const OUT_DIR = path.join('report', 'SPEC_05');
const SPEC04_DIR = path.join('report', 'SPEC_04');
fs.mkdirSync(OUT_DIR, { recursive: true });

const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : (s && s.current) || null);
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

const gates = [];
const gate = (id, name, ok, detail) => {
  gates.push({ id: id, name: name, pass: !!ok, detail: String(detail === undefined ? '' : detail) });
  console.log((ok ? 'GATE OK  ' : 'GATE FAIL') + ' ' + id + ' ' + name + ' - ' + (detail === undefined ? '' : detail));
  if (!ok) process.exitCode = 2;
};

(async () => {
  // ---- approved target set derived from SPEC 04 audit artifacts (SPEC 05 2) ----
  const csvA = parseCsv(fs.readFileSync(path.join(SPEC04_DIR, 'SPEC_04_REVIEW_REQUIRED_AUDIT.csv'), 'utf8'));
  const csvB = parseCsv(fs.readFileSync(path.join(SPEC04_DIR, 'SPEC_04_REPLACE_FIELD_AUDIT.csv'), 'utf8'));
  const aHigh = csvA.filter((r) => r.confidence === 'HIGH' && r.futureSpec === 'SPEC_05_FIELD_REPAIR' && r.action === 'REVIEW_REQUIRED');
  const bHigh = csvB.filter((r) => r.confidence === 'HIGH');
  const targets = [];
  for (const r of aHigh) {
    const dot = r.field.indexOf('.');
    targets.push({ recordId: r.recordId, type: r.field.slice(0, dot), field: r.field.slice(dot + 1), currentValue: r.currentValue, proposedValue: r.proposedValue, action: 'SET_FIELD', source: 'REVIEW_REQUIRED_HIGH' });
  }
  for (const r of csvB) {
    const dot = r.field.indexOf('.');
    if (r.confidence !== 'HIGH') continue;
    targets.push({ recordId: r.recordId, type: r.field.slice(0, dot), field: r.field.slice(dot + 1), currentValue: r.beforeValue, proposedValue: r.proposedValue, action: 'REPLACE_FIELD', source: 'REPLACE_FIELD_HIGH' });
  }
  const targetIds = new Set(targets.map((t) => t.recordId));
  console.log('targets: rows=' + targets.length + ' A-high=' + aHigh.length + ' B-high=' + bHigh.length + ' uniqueRecords=' + targetIds.size);

  // ---- fresh canonical fetch, fetched twice for determinism (read-only) ----
  async function fetchWiki() {
    const out = {};
    for (const t of WIKI_TYPES) out[t] = await q('*[_type == "' + t + '" && !(_id in path("drafts.**"))]');
    return out;
  }
  const records = await fetchWiki();
  const records2 = await fetchWiki();
  const posts = await q('*[_type == "post" && !(_id in path("drafts.**"))]');
  const tools = await q('*[_type == "tool" && !(_id in path("drafts.**"))]');
  const categories = await q('*[_type == "category" && !(_id in path("drafts.**"))]');
  const draftDocs = await q('*[_id in path("drafts.**")]._id');
  for (const t of WIKI_TYPES) console.log('[' + t + '] fetched ' + records[t].length);

  // ---- GATE A checks (SPEC 05 04) ----
  const counts = {};
  for (const t of WIKI_TYPES) counts[t] = records[t].filter((r) => !r._id.startsWith('drafts.')).length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  gate('GA-01', 'canonical record count = 473 with per-type composition',
    total === 473 && WIKI_TYPES.every((t) => counts[t] === EXPECTED[t]),
    'total=' + total + ' ' + JSON.stringify(counts));

  const wikiDrafts = WIKI_TYPES.reduce((s, t) => s + records[t].filter((r) => r._id.startsWith('drafts.')).length, 0);
  gate('GA-02', 'drafts = 0 (wiki) and dataset-wide drafts = 0',
    wikiDrafts === 0 && draftDocs.length === 0,
    'wikiDrafts=' + wikiDrafts + ' datasetDrafts=' + draftDocs.length);

  const slugSeen = {}; let dupSlugs = 0; let noSlug = 0;
  for (const t of WIKI_TYPES) for (const r of records[t]) {
    const s = slugValue(r.slug);
    if (!s) { noSlug++; continue; }
    if (slugSeen[s]) dupSlugs++;
    slugSeen[s] = r._id;
  }
  gate('GA-03', 'duplicate slugs = 0', dupSlugs === 0, 'duplicates=' + dupSlugs);
  gate('GA-04', 'undefined routes = 0 (all wiki slugs present)', noSlug === 0, 'recordsWithoutSlug=' + noSlug);

  // identity vs SPEC 04 baseline
  const baseline = JSON.parse(fs.readFileSync(path.join(SPEC04_DIR, 'SPEC_04_PRE_AUDIT_SNAPSHOT.json'), 'utf8'));
  const canonical = {};
  for (const t of WIKI_TYPES) for (const r of records[t]) canonical[r._id] = { type: t, rec: r };
  const baseIds = {};
  for (const t of WIKI_TYPES) for (const r of baseline.records[t]) baseIds[r._id] = { type: t, rec: r };
  let idDiff = 0, slugDiff = 0, titleDiff = 0;
  for (const id of Object.keys(baseIds)) if (!canonical[id]) idDiff++;
  for (const id of Object.keys(canonical)) if (!baseIds[id]) idDiff++;
  for (const id of Object.keys(baseIds)) {
    const live = canonical[id]; const old = baseIds[id];
    if (!live) continue;
    if (slugValue(live.rec.slug) !== slugValue(old.rec.slug)) slugDiff++;
    if ((titleOf(live.type, live.rec) || null) !== (titleOf(old.type, old.rec) || null)) titleDiff++;
  }
  gate('GA-05', 'ID/slug/title identity vs SPEC 04 baseline (diff = 0)',
    idDiff === 0 && slugDiff === 0 && titleDiff === 0,
    'idDiff=' + idDiff + ' slugDiff=' + slugDiff + ' titleDiff=' + titleDiff);

  const hashParts = Object.keys(canonical).sort().map((id) => {
    const c = canonical[id];
    return sha256(JSON.stringify({ id: id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) }));
  });
  const hash = sha256(hashParts.join('\n'));
  gate('GA-06', 'fresh canonical hash matches baseline', hash === EXPECTED_HASH, 'hash=' + hash);

  // _rev verification for all 61 target records
  const revProblems = [];
  const expectedRev = {};
  for (const t of targets) {
    const live = canonical[t.recordId];
    const old = baseIds[t.recordId];
    if (!live) { revProblems.push(t.recordId + ':missing-live'); continue; }
    if (!old) { revProblems.push(t.recordId + ':missing-baseline'); continue; }
    if (live.rec._rev !== old.rec._rev) revProblems.push(t.recordId + ':rev-drift live=' + live.rec._rev + ' base=' + old.rec._rev);
    expectedRev[t.recordId] = live.rec._rev;
  }
  gate('GA-07', 'expected _rev values verified for all 61 target records',
    targets.length === 61 && targetIds.size === 61 && revProblems.length === 0,
    'targets=' + targets.length + ' unique=' + targetIds.size + ' revProblems=' + (revProblems.join(',') || 'none'));

  const doubleIdentical = JSON.stringify(records) === JSON.stringify(records2);
  gate('GA-08', 'read deterministic (double-fetch byte-identical)', doubleIdentical, 'identical=' + doubleIdentical);

  // ---- artifacts ----
  const generatedAt = new Date().toISOString();
  const snapshot = {
    spec: 'SPEC 05', phase: 'PRE_REPAIR_SNAPSHOT', generatedAt: generatedAt,
    mode: 'READ-ONLY - no mutation performed in GATE A',
    canonicalHash: hash, wikiTypeCounts: counts, totalWikiRecords: total,
    identityVsSpec04: { idDiff: idDiff, slugDiff: slugDiff, titleDiff: titleDiff },
    targetCount: targets.length, expectedRev: expectedRev,
    records: records, posts: posts, tools: tools, categories: categories,
    gates: gates,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_05_PRE_REPAIR_SNAPSHOT.json'), JSON.stringify(snapshot, null, 2));

  const manifest = {
    spec: 'SPEC 05', phase: 'RAW_SOURCE_MANIFEST', generatedAt: generatedAt,
    projectId: 'zeohjejw', dataset: 'production', apiVersion: '2026-05-25',
    extractionMethod: 'Sanity HTTP API - data/query (read-only). Full-document projection incl. _rev. Zero mutations.',
    canonicalHash: hash, expectedCanonicalHash: EXPECTED_HASH,
    wikiTypeCounts: counts, totalWikiRecords: total, drafts: wikiDrafts,
    identityVsSpec04: { idDiff: idDiff, slugDiff: slugDiff, titleDiff: titleDiff },
    targetRows: targets.length, targetRecords: targetIds.size,
    targets: targets.map((t) => ({ recordId: t.recordId, type: t.type, field: t.field, action: t.action, expectedRev: expectedRev[t.recordId] })),
    gates: gates,
    gateAStatus: gates.every((g) => g.pass) ? 'PASS' : 'FAIL',
    sources: ['SPEC_04_REVIEW_REQUIRED_AUDIT.csv (HIGH rows)', 'SPEC_04_REPLACE_FIELD_AUDIT.csv (HIGH row)', 'SPEC_04_PRE_AUDIT_SNAPSHOT.json (baseline)', 'sanity/schemaTypes/*.ts (enums)'],
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_05_RAW_SOURCE_MANIFEST.json'), JSON.stringify(manifest, null, 2));

  const failed = gates.filter((g) => !g.pass);
  console.log('\nGATE A: ' + (gates.length - failed.length) + '/' + gates.length + ' gates OK - snapshot + manifest written to report/SPEC_05/');
  if (failed.length) {
    console.log('STOP - baseline mismatch. Do not mutate. Discrepancies: ' + failed.map((g) => g.id).join(', '));
    process.exit(2);
  }
})().catch((e) => { console.error('EXTRACT ERROR:', e.stack || e.message); process.exit(1); });
