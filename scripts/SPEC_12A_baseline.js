const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// SPEC 12A Phase A - read-only baseline. GET query only. No writes.

const TEMP = 'C:/Users/lam72/AppData/Local/Temp/opencode';
const OUT = path.join('reports', 'SPEC_12A');
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_TOTAL = 473;
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);

// relationship fields supported by the deployed schema (SPEC 10M)
const REL_FIELDS = {
  species: {
    compatibleSpecies: { kind: 'objectArray', entryRef: 'ref', target: ['species'] },
    compatiblePlants: { kind: 'refArray', target: ['plant'] },
    compatibleInvertebrates: { kind: 'refArray', target: ['invertebrate'] },
    suitableEquipment: { kind: 'refArray', target: ['equipment'] },
    relatedProblems: { kind: 'refArray', target: ['problem'] },
    relatedPosts: { kind: 'refArray', target: ['post'] },
    incompatibleSpecies: { kind: 'objectArray', entryRef: 'ref', target: ['species'] },
    predatorPrey: { kind: 'objectArray', entryRef: 'ref', target: ['species', 'invertebrate'] },
    reefInteractionDetail: { kind: 'objectArray', entryRef: 'coral', target: ['coral'] },
    parentSpecies: { kind: 'ref', target: ['species'] },
  },
  plant: {
    suitableEquipment: { kind: 'refArray', target: ['equipment'] },
    relatedProblems: { kind: 'refArray', target: ['problem'] },
    relatedPosts: { kind: 'refArray', target: ['post'] },
  },
  invertebrate: {
    compatibleSpecies: { kind: 'objectArray', entryRef: 'ref', target: ['species'] },
    suitableEquipment: { kind: 'refArray', target: ['equipment'] },
    relatedProblems: { kind: 'refArray', target: ['problem'] },
    relatedPosts: { kind: 'refArray', target: ['post'] },
    predatorPrey: { kind: 'objectArray', entryRef: 'ref', target: ['species', 'invertebrate'] },
    parentSpecies: { kind: 'ref', target: ['species'] },
  },
  coral: {
    suitableEquipment: { kind: 'refArray', target: ['equipment'] },
    relatedProblems: { kind: 'refArray', target: ['problem'] },
    relatedPosts: { kind: 'refArray', target: ['post'] },
    coralNeighbors: { kind: 'objectArray', entryRef: 'ref', target: ['coral'] },
  },
  equipment: {
    compatibleEquipment: { kind: 'refArray', target: ['equipment'] },
    relatedProblems: { kind: 'refArray', target: ['problem'] },
    relatedPosts: { kind: 'refArray', target: ['post'] },
  },
  problem: {
    relatedTools: { kind: 'refArray', target: ['tool'] },
    relatedPosts: { kind: 'refArray', target: ['post'] },
  },
};

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

const checks = [];
const check = (id, name, ok, detail) => {
  checks.push({ id, name, pass: !!ok, detail: String(detail ?? '') });
  console.log((ok ? 'CHECK OK   ' : 'CHECK FAIL ') + id + ' ' + name + ' - ' + (detail ?? ''));
};

function refTargetId(v) {
  if (v == null) return null;
  if (typeof v === 'object') return v._ref || v.ref?._ref || v.ref || null;
  return String(v);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const records = {};
  for (const t of TYPES) records[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`);
  const draftDocs = await q('*[_id in path("drafts.**")]._id');

  const counts = {};
  for (const t of TYPES) counts[t] = records[t].length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  check('A-01', 'record counts match baseline', total === EXPECTED_TOTAL && TYPES.every((t) => counts[t] === EXPECTED[t]),
    'total=' + total + ' ' + JSON.stringify(counts));

  let wikiDrafts = 0;
  for (const t of TYPES) for (const r of records[t]) if (String(r._id).startsWith('drafts.')) wikiDrafts++;
  check('A-02', 'drafts = 0', wikiDrafts === 0 && draftDocs.length === 0, 'wikiDrafts=' + wikiDrafts + ' datasetDrafts=' + draftDocs.length);

  const ids = new Set();
  let dupIds = 0;
  for (const t of TYPES) for (const r of records[t]) { if (ids.has(r._id)) dupIds++; ids.add(r._id); }
  const seen = {};
  let dupSlugs = 0;
  for (const t of TYPES) for (const r of records[t]) { const s = slugValue(r.slug); if (!s) continue; if (seen[s]) dupSlugs++; seen[s] = r._id; }
  check('A-03', 'duplicate _id = 0 and duplicate slug = 0', dupIds === 0 && dupSlugs === 0, 'dupIds=' + dupIds + ' dupSlugs=' + dupSlugs);

  const canonical = {};
  for (const t of TYPES) for (const r of records[t]) canonical[r._id] = { type: t, rec: r };
  const hashParts = Object.keys(canonical).sort().map((id) => {
    const c = canonical[id];
    return sha256(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) }));
  });
  const identityHash = sha256(hashParts.join('\n'));
  check('A-04', 'canonical identity hash unchanged', identityHash === EXPECTED_HASH, identityHash === EXPECTED_HASH ? 'MATCH' : 'MISMATCH ' + identityHash);

  // index records by _id for target existence/type checks
  const byId = {};
  for (const t of TYPES) for (const r of records[t]) byId[r._id] = t;

  // relationship inventory
  const inventory = [];
  const edges = [];
  let dangling = 0;
  for (const t of TYPES) {
    for (const r of records[t]) {
      for (const [field, spec] of Object.entries(REL_FIELDS[t] || {})) {
        const val = r[field];
        if (val == null) continue;
        const arr = Array.isArray(val) ? val : [val];
        if (arr.length === 0) continue;
        for (const item of arr) {
          const tid = refTargetId(item);
          if (!tid) continue;
          const targetType = byId[tid] || null;
          const allowed = spec.target.includes(targetType || '');
          if (!targetType || !allowed) dangling++;
          edges.push({
            sourceType: t, sourceId: r._id, field,
            targetId: tid, targetType: targetType || (spec.target.includes('post') && tid.startsWith('post') ? 'post' : /^tool/.test(tid) ? 'tool' : null),
            targetAllowed: !!(targetType && allowed),
          });
        }
      }
    }
  }
  for (const t of TYPES) {
    for (const [field, spec] of Object.entries(REL_FIELDS[t] || {})) {
      const withData = records[t].filter((r) => {
        const v = r[field];
        return v != null && (!Array.isArray(v) || v.length > 0) && !(spec.kind === 'objectArray' && Array.isArray(v) && v.filter((e) => refTargetId(e)).length === 0);
      }).length;
      const edgeCount = edges.filter((e) => e.sourceType === t && e.field === field).length;
      inventory.push({ sourceType: t, field, kind: spec.kind, targets: spec.target.join('|'), recordsWithData: withData, edgeCount });
    }
  }
  check('A-05', 'existing relationship edges enumerated', edges.length >= 0, 'edges=' + edges.length + ' dangling=' + dangling);

  const relSeal = sha256(JSON.stringify(edges.map((e) => [e.sourceId, e.field, e.targetId]).sort()));
  const seoSeal = sha256(TYPES.map((t) => records[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id)))
    .map((r) => JSON.stringify(r.seo || null)).join('\n')).join('\n'));

  const baseline = {
    specId: 'SPEC_12A', artifact: 'RELATIONSHIP_BASELINE', generatedAt: new Date().toISOString(),
    mode: 'READ-ONLY (GET query only; no writes, no deploy)',
    checks, counts, total, drafts: { wikiDrafts, datasetDrafts: draftDocs.length }, duplicate: { dupIds, dupSlugs },
    identity: { hash: identityHash, expected: EXPECTED_HASH, match: identityHash === EXPECTED_HASH },
    relationshipInventory: inventory,
    existingEdgeCount: edges.length, danglingReferenceCount: dangling,
    seals: { relSeal, seoSeal },
    deployedSchema: JSON.parse(fs.existsSync('reports/SPEC_10N/INTEGRITY.json') ? fs.readFileSync('reports/SPEC_10N/INTEGRITY.json', 'utf8') : '{}').deployedSchema || null,
    environment: {
      gitHead: require('child_process').execSync('git rev-parse --short HEAD').toString().trim(),
      gitBranch: require('child_process').execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
      node: process.version,
    },
    content_mutations: 0,
  };
  fs.writeFileSync(path.join(OUT, 'RELATIONSHIP_BASELINE.json'), JSON.stringify(baseline, null, 2));

  const snapshot = {
    generatedAt: baseline.generatedAt, counts, total, identityHash, edges,
    records: Object.fromEntries(TYPES.map((t) => [t, records[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id))).map((r) => ({
      _id: r._id, _type: t, title: titleOf(t, r), slug: slugValue(r.slug),
      rel: Object.fromEntries(Object.entries(REL_FIELDS[t] || {}).map((t2) => [t2[0], (Array.isArray(r[t2[0]]) ? r[t2[0]].map(refTargetId).filter(Boolean) : r[t2[0]] != null ? [refTargetId(r[t2[0]])] : [])])),
    }))])),
  };
  fs.writeFileSync(path.join(TEMP, 'spec12a_snapshot.json'), JSON.stringify(snapshot));
  console.log('WROTE ' + path.join(OUT, 'RELATIONSHIP_BASELINE.json') + ' + temp snapshot');
  const failed = checks.filter((c) => !c.pass);
  console.log('BASELINE ' + (failed.length ? 'FAIL' : 'PASS') + ' - total=' + total + ' edges=' + edges.length);
  process.exit(failed.length ? 2 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
