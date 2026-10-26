const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const OUT_DIR = path.join('report', 'SPEC_06A');
fs.mkdirSync(OUT_DIR, { recursive: true });

const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const REF_FIELDS = ['parentSpecies', 'relatedPosts', 'relatedTools', 'compatibleSpecies', 'compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedProblems'];
const REL_FIELDS = ['parentSpecies', 'compatibleSpecies', 'compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedPosts', 'relatedTools', 'relatedProblems'];

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : (s && s.current) || null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);
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

const gates = [];
const gate = (id, name, ok, detail) => {
  gates.push({ id: id, name: name, pass: !!ok, detail: String(detail === undefined ? '' : detail) });
  console.log((ok ? 'GATE OK  ' : 'GATE FAIL') + ' ' + id + ' ' + name + ' - ' + (detail === undefined ? '' : detail));
  if (!ok) process.exitCode = 2;
};

(async () => {
  async function fetchAll() {
    const out = {};
    for (const t of WIKI_TYPES) out[t] = await q('*[_type == "' + t + '" && !(_id in path("drafts.**"))]');
    out.posts = await q('*[_type == "post" && !(_id in path("drafts.**"))]');
    out.tools = await q('*[_type == "tool" && !(_id in path("drafts.**"))]');
    out.categories = await q('*[_type == "category" && !(_id in path("drafts.**"))]');
    return out;
  }
  const live = await fetchAll();
  const live2 = await fetchAll();
  const draftDocs = await q('*[_id in path("drafts.**")]._id');
  for (const t of WIKI_TYPES) console.log('[' + t + '] fetched ' + live[t].length);

  const counts = {};
  for (const t of WIKI_TYPES) counts[t] = live[t].filter((r) => !r._id.startsWith('drafts.')).length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  gate('GA-01', 'canonical record count = 473 with exact per-type composition',
    total === 473 && WIKI_TYPES.every((t) => counts[t] === EXPECTED[t]),
    'total=' + total + ' ' + JSON.stringify(counts));

  const wikiDrafts = WIKI_TYPES.reduce((s, t) => s + live[t].filter((r) => r._id.startsWith('drafts.')).length, 0);
  gate('GA-02', 'drafts = 0 (wiki) and dataset-wide drafts = 0',
    wikiDrafts === 0 && draftDocs.length === 0,
    'wikiDrafts=' + wikiDrafts + ' datasetDrafts=' + draftDocs.length);

  const slugSeen = {}; let dupSlugs = 0; let noSlug = 0;
  for (const t of WIKI_TYPES) for (const r of live[t]) {
    const s = slugValue(r.slug);
    if (!s) { noSlug++; continue; }
    if (slugSeen[s]) dupSlugs++;
    slugSeen[s] = r._id;
  }
  gate('GA-03', 'duplicate slugs = 0', dupSlugs === 0, 'duplicates=' + dupSlugs);
  gate('GA-04', 'undefined routes = 0 (all wiki slugs present)', noSlug === 0, 'recordsWithoutSlug=' + noSlug);

  const canonical = {};
  for (const t of WIKI_TYPES) for (const r of live[t]) canonical[r._id] = { type: t, rec: r };
  const hashParts = Object.keys(canonical).sort().map((id) => {
    const c = canonical[id];
    return sha256(JSON.stringify({ id: id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) }));
  });
  const hash = sha256(hashParts.join('\n'));
  gate('GA-05', 'fresh canonical identity hash matches expected baseline', hash === EXPECTED_HASH, 'hash=' + hash);

  const POST = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_05', 'SPEC_05_POST_REPAIR_SNAPSHOT.json'), 'utf8'));
  const postBy = {};
  for (const t of WIKI_TYPES) for (const r of POST.records[t]) postBy[r._id] = { type: t, rec: r };
  let added = 0, removed = 0, changed = 0;
  const changedSamples = [];
  for (const id of Object.keys(canonical)) if (!postBy[id]) added++;
  for (const id of Object.keys(postBy)) if (!canonical[id]) removed++;
  for (const id of Object.keys(canonical)) {
    const a = postBy[id];
    if (!a) continue;
    if (JSON.stringify(stripMeta(canonical[id].rec)) !== JSON.stringify(stripMeta(a.rec))) {
      changed++;
      if (changedSamples.length < 5) changedSamples.push(id);
    }
  }
  function strictDiff(fresh, old) {
    const bad = [];
    const oldBy = {};
    for (const d of old) oldBy[d._id] = d;
    for (const d of fresh) if (!oldBy[d._id] || JSON.stringify(d) !== JSON.stringify(oldBy[d._id])) bad.push(d._id);
    for (const id of Object.keys(oldBy)) if (!fresh.some((d) => d._id === id)) bad.push(id + ':deleted');
    return bad;
  }
  const otherDiff = [
    ...strictDiff(live.posts, POST.posts).map((x) => 'post:' + x),
    ...strictDiff(live.tools, POST.tools).map((x) => 'tool:' + x),
    ...strictDiff(live.categories, POST.categories).map((x) => 'category:' + x),
  ];
  gate('GA-06', 'zero mutations since SPEC 05 (full-document diff vs SPEC_05_POST_REPAIR_SNAPSHOT = 0 for wiki; posts/tools/categories byte-identical)',
    added === 0 && removed === 0 && changed === 0 && otherDiff.length === 0,
    'wikiAdded=' + added + ' wikiRemoved=' + removed + ' wikiChangedDocs=' + changed + ' otherTypeDiffs=' + otherDiff.length + (changedSamples.length ? ' samples=' + changedSamples.join(',') : ''));

  let relDiff = 0; let seoDiff = 0;
  for (const id of Object.keys(canonical)) {
    const a = canonical[id].rec; const b = postBy[id] && postBy[id].rec;
    if (!b) continue;
    for (const f of REF_FIELDS) if (JSON.stringify(a[f]) !== JSON.stringify(b[f])) relDiff++;
    if (JSON.stringify(a.seo) !== JSON.stringify(b.seo)) seoDiff++;
  }
  gate('GA-07', 'relationship fields diff = 0 and SEO diff = 0 vs SPEC 05 post-repair baseline (Section 19 safety)',
    relDiff === 0 && seoDiff === 0, 'relFieldDiffs=' + relDiff + ' seoDiffs=' + seoDiff);

  gate('GA-08', 'read deterministic (double-fetch byte-identical)',
    JSON.stringify(live) === JSON.stringify(live2), 'identical=' + (JSON.stringify(live) === JSON.stringify(live2)));

  const prior = {};
  const priorFiles = [
    { key: 'spec001', file: path.join('report', 'SPEC_00_1', 'SPEC_00_1_VALIDATION.json') },
    { key: 'spec01', file: path.join('report', 'SPEC_01', 'SPEC_01_VALIDATION.json') },
    { key: 'spec04', file: path.join('report', 'SPEC_04', 'SPEC_04_VALIDATION.json') },
    { key: 'spec05Post', file: path.join('report', 'SPEC_05', 'SPEC_05_POST_VALIDATION.json') },
  ];
  let priorOk = true;
  for (const p of priorFiles) {
    try {
      const j = JSON.parse(fs.readFileSync(p.file, 'utf8'));
      const verdict = j.verdict || j.result;
      const passed = j.summary ? j.summary.passed : j.passed;
      const summaryTotal = j.summary ? j.summary.total : (j.passed !== undefined ? j.passed + j.failed : undefined);
      prior[p.key] = { file: p.file, verdict: verdict, passed: passed, total: summaryTotal };
      if (verdict !== 'PASS') priorOk = false;
    } catch (e) {
      prior[p.key] = { file: p.file, verdict: 'UNREADABLE: ' + e.message };
      priorOk = false;
    }
  }
  gate('GA-09', 'prior phase validations all PASS (SPEC 00.1 9/9, SPEC 01 14/14, SPEC 04 15/15, SPEC 05 GATE D 16/16)',
    priorOk && prior.spec001.passed === 9 && prior.spec01.passed === 14 && prior.spec04.passed === 15 && prior.spec05Post.passed === 16,
    JSON.stringify(Object.keys(prior).map((k) => k + '=' + prior[k].verdict + ' ' + prior[k].passed + '/' + prior[k].total)));

  const sourceFiles = [
    'report/SPEC_03/SPEC_03_RELATIONSHIP_OPPORTUNITIES.csv',
    'report/SPEC_04/SPEC_04_RELATIONSHIP_AUDIT.csv',
    'report/SPEC_04/SPEC_04_PROPOSED_NEXT_SCOPE.md',
    'report/SPEC_04/SPEC_04_CROSS_WORKSTREAM_CHECK.json',
    'report/SPEC_04/SPEC_04_VALIDATION.json',
    'report/SPEC_05/SPEC_05_POST_REPAIR_SNAPSHOT.json',
    'report/SPEC_05/SPEC_05_POST_VALIDATION.json',
    'sanity/schemaTypes/species.ts',
    'sanity/schemaTypes/plant.ts',
    'sanity/schemaTypes/invertebrate.ts',
    'sanity/schemaTypes/coral.ts',
    'sanity/schemaTypes/equipment.ts',
    'sanity/schemaTypes/problem.ts',
  ];
  const sources = [];
  let missingSources = 0;
  for (const f of sourceFiles) {
    try {
      const buf = fs.readFileSync(f);
      sources.push({ path: f, bytes: buf.length, sha256: sha256(buf) });
    } catch (e) {
      sources.push({ path: f, missing: true });
      missingSources++;
    }
  }
  gate('GA-10', 'all 13 reconciliation source files present (with sha256 fingerprints)',
    missingSources === 0, 'missing=' + missingSources);

  const oppText = fs.readFileSync('report/SPEC_03/SPEC_03_RELATIONSHIP_OPPORTUNITIES.csv', 'utf8');
  const oppLines = oppText.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.includes(':') && !l.startsWith('type.'));
  gate('GA-11', 'SPEC 03 opportunity source = exactly 1,244 unique lines',
    oppLines.length === 1244 && new Set(oppLines).size === 1244,
    'lines=' + oppLines.length + ' unique=' + new Set(oppLines).size);

  const schemaMap = {};
  const fieldMeta = {};
  for (const t of WIKI_TYPES) {
    const src = fs.readFileSync(path.join('sanity', 'schemaTypes', t + '.ts'), 'utf8');
    schemaMap[t] = {};
    for (const f of REL_FIELDS) {
      const idx = src.indexOf("name: '" + f + "'");
      if (idx < 0) continue;
      const nextDef = src.indexOf('defineField(', idx + 1);
      const block = src.slice(idx, nextDef < 0 ? src.length : nextDef);
      const m = /to:\s*\[\s*\{\s*type:\s*'([^']+)'/.exec(block);
      if (m) schemaMap[t][f] = m[1];
    }
  }
  const oppPairs = {};
  let invalidOppPairs = 0;
  for (const l of oppLines) {
    const dot = l.indexOf('.');
    const colon = l.indexOf(':');
    const type = l.slice(0, dot);
    const field = l.slice(dot + 1, colon);
    oppPairs[type + '.' + field] = (oppPairs[type + '.' + field] || 0) + 1;
    if (!schemaMap[type] || !schemaMap[type][field]) invalidOppPairs++;
  }
  gate('GA-12', 'every opportunity (sourceType, relationshipField) pair is valid per live schema',
    invalidOppPairs === 0, 'invalidPairs=' + invalidOppPairs + ' pairTypes=' + Object.keys(oppPairs).length);

  for (const f of REL_FIELDS) {
    const defs = WIKI_TYPES.filter((t) => schemaMap[t][f]).map((t) => t + '->' + schemaMap[t][f]);
    fieldMeta[f] = { definedOn: WIKI_TYPES.filter((t) => schemaMap[t][f]), targetType: defs.map((d) => d.split('->')[1])[0] || null };
  }

  const generatedAt = new Date().toISOString();
  const manifest = {
    spec: 'SPEC 06A', phase: 'RAW_SOURCE_MANIFEST', generatedAt: generatedAt,
    mode: 'READ-ONLY - canonical mutations performed = 0 (no mutate endpoint called)',
    projectId: 'zeohjejw', dataset: 'production', apiVersion: '2026-05-25',
    extractionMethod: 'Sanity HTTP API - data/query (read-only), double-fetch determinism; local file fingerprints for SPEC 03/04/05 artifacts and schemaTypes.',
    canonicalHash: hash, expectedCanonicalHash: EXPECTED_HASH,
    wikiTypeCounts: counts, totalWikiRecords: total, drafts: wikiDrafts + draftDocs,
    safetyVsSpec05PostRepair: { wikiAdded: added, wikiRemoved: removed, wikiChangedDocs: changed, otherTypeDiffs: otherDiff.length, relFieldDiffs: relDiff, seoDiffs: seoDiff },
    opportunitySourceLines: oppLines.length, opportunitySourceUnique: new Set(oppLines).size,
    opportunityPairs: oppPairs,
    relationshipSchema: schemaMap, relationshipFieldMeta: fieldMeta,
    priorValidations: prior,
    sources: sources,
    gates: gates,
    gateStatus: gates.every((g) => g.pass) ? 'PASS' : 'FAIL',
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_06A_RAW_SOURCE_MANIFEST.json'), JSON.stringify(manifest, null, 2));

  const failed = gates.filter((g) => !g.pass);
  console.log('\nGATE A: ' + (gates.length - failed.length) + '/' + gates.length + ' gates OK - manifest written to report/SPEC_06A/');
  if (failed.length) {
    console.log('STOP - baseline or safety mismatch. Discrepancies: ' + failed.map((g) => g.id).join(', '));
    process.exit(2);
  }
})().catch((e) => { console.error('EXTRACT ERROR:', e.stack || e.message); process.exit(1); });
