const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const OUT_DIR = path.join('report', 'SPEC_06B');
const SPEC06A_DIR = path.join('report', 'SPEC_06A');
fs.mkdirSync(OUT_DIR, { recursive: true });

const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const REF_FIELDS = ['parentSpecies', 'relatedPosts', 'relatedTools', 'compatibleSpecies', 'compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedProblems'];
const COMPAT_FIELDS = ['compatibleSpecies', 'compatiblePlants', 'compatibleInvertebrates'];

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
  gate('EB-01', 'canonical record count = 473 with exact per-type composition',
    total === 473 && WIKI_TYPES.every((t) => counts[t] === EXPECTED[t]),
    'total=' + total + ' ' + JSON.stringify(counts));

  const wikiDrafts = WIKI_TYPES.reduce((s, t) => s + live[t].filter((r) => r._id.startsWith('drafts.')).length, 0);
  gate('EB-02', 'drafts = 0 (wiki and dataset-wide)',
    wikiDrafts === 0 && draftDocs.length === 0,
    'wikiDrafts=' + wikiDrafts + ' datasetDrafts=' + draftDocs.length);

  const canonical = {};
  for (const t of WIKI_TYPES) for (const r of live[t]) canonical[r._id] = { type: t, rec: r };
  const hashParts = Object.keys(canonical).sort().map((id) => sha256(JSON.stringify({ id: id, title: titleOf(canonical[id].type, canonical[id].rec), slug: slugValue(canonical[id].rec.slug) })));
  const hash = sha256(hashParts.join('\n'));
  gate('EB-03', 'canonical identity hash matches SPEC 00-06A baseline', hash === EXPECTED_HASH, 'hash=' + hash);

  const POST = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_05', 'SPEC_05_POST_REPAIR_SNAPSHOT.json'), 'utf8'));
  const postBy = {};
  for (const t of WIKI_TYPES) for (const r of POST.records[t]) postBy[r._id] = { type: t, rec: r };
  let added = 0, removed = 0, changed = 0, relDiff = 0, seoDiff = 0, idDiff = 0, slugDiff = 0, titleDiff = 0;
  for (const id of Object.keys(canonical)) if (!postBy[id]) added++;
  for (const id of Object.keys(postBy)) if (!canonical[id]) removed++;
  for (const id of Object.keys(postBy)) if (!canonical[id]) idDiff++;
  for (const id of Object.keys(canonical)) if (!postBy[id]) idDiff++;
  for (const id of Object.keys(canonical)) {
    const a = canonical[id].rec; const b = postBy[id] && postBy[id].rec;
    if (!b) continue;
    if (slugValue(a.slug) !== slugValue(b.slug)) slugDiff++;
    if (titleOf(canonical[id].type, a) !== titleOf(postBy[id].type, b)) titleDiff++;
    if (JSON.stringify(stripMeta(a)) !== JSON.stringify(stripMeta(b))) changed++;
    for (const f of REF_FIELDS) if (JSON.stringify(a[f]) !== JSON.stringify(b[f])) relDiff++;
    if (JSON.stringify(a.seo) !== JSON.stringify(b.seo)) seoDiff++;
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
  gate('EB-04', 'zero canonical mutations (full-doc diff vs SPEC_05 post-repair snapshot = 0; ID/slug/title/relationship/SEO diffs = 0; posts/tools/categories byte-identical)',
    added === 0 && removed === 0 && changed === 0 && idDiff === 0 && slugDiff === 0 && titleDiff === 0 && relDiff === 0 && seoDiff === 0 && otherDiff.length === 0,
    'wikiChanged=' + changed + ' idDiff=' + idDiff + ' slugDiff=' + slugDiff + ' titleDiff=' + titleDiff + ' relDiff=' + relDiff + ' seoDiff=' + seoDiff + ' otherDiff=' + otherDiff.length);

  gate('EB-05', 'read deterministic (double-fetch byte-identical)',
    JSON.stringify(live) === JSON.stringify(live2), 'identical=' + (JSON.stringify(live) === JSON.stringify(live2)));

  const a06 = JSON.parse(fs.readFileSync(path.join(SPEC06A_DIR, 'SPEC_06A_VALIDATION.json'), 'utf8'));
  const map36 = JSON.parse(fs.readFileSync(path.join(SPEC06A_DIR, 'SPEC_06A_CANDIDATE_36_MAPPING.json'), 'utf8'));
  const map46 = JSON.parse(fs.readFileSync(path.join(SPEC06A_DIR, 'SPEC_06A_MEDIUM_46_MAPPING.json'), 'utf8'));
  const matrix = JSON.parse(fs.readFileSync(path.join(SPEC06A_DIR, 'SPEC_06A_RECONCILIATION_MATRIX.json'), 'utf8'));
  const edges = map36.data.concat(map46.data);
  const edgeIds = new Set(edges.map((e) => e.candidateEdgeId));
  const oppIds = new Set(matrix.data.map((r) => r.inventoryOpportunityId));
  let unmappedOpp = 0;
  for (const e of edges) if (!oppIds.has(e.inventoryOpportunityId)) unmappedOpp++;
  gate('EB-06', 'SPEC 06A authoritative inputs: validation PASS (18/18), 82 edge rows (36 HIGH + 46 MEDIUM), unique edgeIds, every edge maps to a matrix opportunity',
    a06.result === 'PASS' && a06.summary.passed === 18 && edges.length === 82 && edgeIds.size === 82 && unmappedOpp === 0 && map36.data.length === 36 && map46.data.length === 46,
    'spec06A=' + a06.result + ' ' + a06.summary.passed + '/' + a06.summary.total + ' edges=' + edges.length + ' unique=' + edgeIds.size + ' unmappedOpps=' + unmappedOpp);

  const postById = {}; for (const p of live.posts) postById[p._id] = p;
  const toolById = {}; for (const t of live.tools) toolById[t._id] = t;
  const targetInfo = (id) => {
    if (canonical[id]) return { found: true, type: canonical[id].type, title: titleOf(canonical[id].type, canonical[id].rec) };
    if (postById[id]) return { found: true, type: 'post', title: postById[id].title };
    if (toolById[id]) return { found: true, type: 'tool', title: toolById[id].name };
    return { found: false, type: null, title: null };
  };
  const schemaMap = JSON.parse(fs.readFileSync(path.join(SPEC06A_DIR, 'SPEC_06A_RAW_SOURCE_MANIFEST.json'), 'utf8')).relationshipSchema;
  const edgeStates = {};
  const recordRev = {};
  const recordFieldValues = {};
  let missingSource = 0, missingTarget = 0, wrongTargetType = 0, revDup = 0;
  for (const e of edges) {
    const src = canonical[e.sourceRecordId];
    if (!src) { missingSource++; continue; }
    if (recordRev[e.sourceRecordId] !== undefined && recordRev[e.sourceRecordId] !== src.rec._rev) revDup++;
    recordRev[e.sourceRecordId] = src.rec._rev;
    const cur = src.rec[e.relationshipField] === undefined ? null : src.rec[e.relationshipField];
    if (recordFieldValues[e.sourceRecordId] === undefined) recordFieldValues[e.sourceRecordId] = {};
    recordFieldValues[e.sourceRecordId][e.relationshipField] = cur;
    const ti = targetInfo(e.targetRecordId);
    if (!ti.found) missingTarget++;
    const st = schemaMap[src.type] ? schemaMap[src.type][e.relationshipField] : undefined;
    if (ti.found && st !== undefined && ti.type !== st) wrongTargetType++;
    edgeStates[e.candidateEdgeId] = {
      edgeId: e.candidateEdgeId, recordId: e.sourceRecordId, relationshipField: e.relationshipField,
      targetId: e.targetRecordId, _rev: src.rec._rev,
      currentValue: cur, currentSerialized: JSON.stringify(cur === undefined ? null : cur),
      sourceTypeLive: src.type, sourceTitleLive: titleOf(src.type, src.rec),
      targetExists: ti.found, targetTypeLive: ti.type, targetTitleLive: ti.title,
      schemaTargetType: st === undefined ? null : st,
      targetTypeEligible: ti.found && ti.type === st,
    };
  }
  gate('EB-07', 'live state captured for all 82 candidate edges (source _rev + current relationship value + target existence/type); 0 missing sources, 0 unresolved targets, 0 wrong-type targets',
    edges.length === 82 && Object.keys(edgeStates).length === 82 && missingSource === 0 && missingTarget === 0 && wrongTargetType === 0 && revDup === 0,
    'states=' + Object.keys(edgeStates).length + ' missingSource=' + missingSource + ' missingTarget=' + missingTarget + ' wrongTargetType=' + wrongTargetType);

  const compatConvention = {};
  for (const f of COMPAT_FIELDS) {
    const pairs = new Set();
    let recordsWithRefs = 0, totalRefs = 0;
    for (const t of WIKI_TYPES) for (const r of live[t]) {
      const v = r[f];
      if (!v || !Array.isArray(v)) continue;
      const refs = v.filter((x) => x && x._ref).map((x) => x._ref);
      if (!refs.length) continue;
      recordsWithRefs++;
      totalRefs += refs.length;
      for (const b of refs) pairs.add(r._id + '|' + b);
    }
    let symmetric = 0;
    for (const p of pairs) {
      const [a, b] = p.split('|');
      if (pairs.has(b + '|' + a)) symmetric++;
    }
    compatConvention[f] = { recordsWithRefs: recordsWithRefs, totalRefs: totalRefs, orderedPairs: pairs.size, symmetricOrderedPairs: symmetric, reciprocityRate: pairs.size ? (symmetric / pairs.size) : 0 };
  }

  const sourceFiles = [
    'report/SPEC_06A/SPEC_06A_RECONCILIATION_MATRIX.json',
    'report/SPEC_06A/SPEC_06A_CANDIDATE_36_MAPPING.json',
    'report/SPEC_06A/SPEC_06A_MEDIUM_46_MAPPING.json',
    'report/SPEC_06A/SPEC_06A_FIELD_BREAKDOWN.json',
    'report/SPEC_06A/SPEC_06A_EVIDENCE_AUDIT.json',
    'report/SPEC_06A/SPEC_06A_VALIDATION.json',
    'report/SPEC_06A/SPEC_06A_AUDIT_REPORT.md',
    'report/SPEC_04/SPEC_04_RELATIONSHIP_AUDIT.csv',
    'report/SPEC_05/SPEC_05_POST_REPAIR_SNAPSHOT.json',
  ];
  const sources = [];
  let missingSources = 0;
  for (const f of sourceFiles) {
    try {
      const buf = fs.readFileSync(f);
      sources.push({ path: f, bytes: buf.length, sha256: sha256(buf) });
    } catch (e) { sources.push({ path: f, missing: true }); missingSources++; }
  }
  gate('EB-08', 'all 9 SPEC 06B source files present (with sha256 fingerprints)',
    missingSources === 0, 'missing=' + missingSources);

  const generatedAt = new Date().toISOString();
  const manifest = {
    spec: 'SPEC 06B', phase: 'RAW_SOURCE_MANIFEST', generatedAt: generatedAt,
    mode: 'READ-ONLY - no mutation endpoint called; canonical mutations = 0; relationship mutations = 0',
    projectId: 'zeohjejw', dataset: 'production', apiVersion: '2026-05-25',
    extractionMethod: 'Sanity HTTP API - data/query (read-only), double-fetch determinism; per-edge live capture of source _rev + current relationship value + target existence/type; compatibility-field convention statistics.',
    canonicalHash: hash, expectedCanonicalHash: EXPECTED_HASH,
    wikiTypeCounts: counts, totalWikiRecords: total, drafts: wikiDrafts + draftDocs,
    safetyVsSpec05PostRepair: { wikiChangedDocs: changed, idDiff: idDiff, slugDiff: slugDiff, titleDiff: titleDiff, relFieldDiffs: relDiff, seoDiffs: seoDiff, otherTypeDiffs: otherDiff.length },
    spec06A: { validation: a06.result, passed: a06.summary.passed, total: a06.summary.total, highEdges: map36.data.length, mediumEdges: map46.data.length, opportunities: matrix.data.length },
    edgeCount: edges.length, edgesTracked: Object.keys(edgeStates).length,
    recordRevBaseline: recordRev,
    edgeStates: edgeStates,
    compatConvention: compatConvention,
    sources: sources,
    gates: gates,
    gateStatus: gates.every((g) => g.pass) ? 'PASS' : 'FAIL',
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_06B_RAW_SOURCE_MANIFEST.json'), JSON.stringify(manifest, null, 2));

  const failed = gates.filter((g) => !g.pass);
  console.log('\nGATE A: ' + (gates.length - failed.length) + '/' + gates.length + ' gates OK - manifest written to report/SPEC_06B/');
  console.log('compat convention: ' + JSON.stringify(compatConvention));
  if (failed.length) {
    console.log('STOP - baseline or safety mismatch. Discrepancies: ' + failed.map((g) => g.id).join(', '));
    process.exit(2);
  }
})().catch((e) => { console.error('EXTRACT ERROR:', e.stack || e.message); process.exit(1); });
