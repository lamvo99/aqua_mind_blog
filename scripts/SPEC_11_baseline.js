const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// SPEC 11 Stage A - baseline freeze (READ-ONLY: GET query only, no writes).

const TEMP_DIR = 'C:/Users/lam72/AppData/Local/Temp/opencode';
const OUT = path.join('report', 'SPEC_11');
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_TOTAL = 473;
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
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

const checks = [];
const check = (id, name, ok, detail) => {
  checks.push({ id, name, pass: !!ok, detail: String(detail ?? '') });
  console.log((ok ? 'CHECK OK ' : 'CHECK FAIL ') + id + ' ' + name + ' - ' + (detail ?? ''));
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  const fetchWiki = async () => { const out = {}; for (const t of WIKI_TYPES) out[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`); return out; };
  const read1 = await fetchWiki();
  const read2 = await fetchWiki();
  let mismatches = 0;
  for (const t of WIKI_TYPES) if (JSON.stringify(read1[t]) !== JSON.stringify(read2[t])) mismatches++;
  check('S-01', 'deterministic double-read identical (6 domains)', mismatches === 0, 'mismatchedTypes=' + mismatches);
  const records = read1;

  const draftDocs = await q('*[_id in path("drafts.**")]._id');
  const counts = {};
  for (const t of WIKI_TYPES) counts[t] = records[t].length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  check('S-02', '473 records / domain counts frozen', total === EXPECTED_TOTAL && WIKI_TYPES.every((t) => counts[t] === EXPECTED[t]),
    'total=' + total + '/' + EXPECTED_TOTAL + ' ' + JSON.stringify(counts));

  let wikiDrafts = 0;
  for (const t of WIKI_TYPES) for (const r of records[t]) if (String(r._id).startsWith('drafts.')) wikiDrafts++;
  check('S-03', 'drafts = 0', wikiDrafts === 0 && draftDocs.length === 0, 'wikiDrafts=' + wikiDrafts + ' datasetDrafts=' + draftDocs.length);

  const slugSeen = {}; let dupSlugs = 0, noSlug = 0;
  for (const t of WIKI_TYPES) for (const r of records[t]) {
    const s = slugValue(r.slug);
    if (!s) { noSlug++; continue; }
    if (slugSeen[s]) dupSlugs++;
    slugSeen[s] = r._id;
  }
  check('S-04', 'duplicate slugs = 0', dupSlugs === 0 && noSlug === 0, 'duplicates=' + dupSlugs + ' noSlug=' + noSlug);

  const canonical = {};
  for (const t of WIKI_TYPES) for (const r of records[t]) canonical[r._id] = { type: t, rec: r };
  const hashParts = Object.keys(canonical).sort().map((id) => {
    const c = canonical[id];
    return sha256(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) }));
  });
  const identityHash = sha256(hashParts.join('\n'));
  check('S-05', 'canonical identity hash matches SPEC 10M baseline', identityHash === EXPECTED_HASH,
    identityHash === EXPECTED_HASH ? 'MATCH' : identityHash);

  const relFields = ['compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedProblems', 'relatedPosts', 'relatedTools', 'parentSpecies', 'compatibleSpecies', 'incompatibleSpecies', 'predatorPrey'];
  const relCounts = {};
  for (const t of WIKI_TYPES) for (const f of relFields) {
    const n = records[t].reduce((a, r) => a + (Array.isArray(r[f]) ? r[f].length : 0), 0);
    if (n) relCounts[t + '.' + f] = n;
  }

  const relSeal = sha256(WIKI_TYPES.map((t) => records[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id)))
    .map((r) => JSON.stringify(relFields.map((f) => (Array.isArray(r[f]) ? r[f].map((v) => (v && v._ref) || v) : r[f] ?? null)))).join('\n')).join('\n'));
  const seoSeal = sha256(WIKI_TYPES.map((t) => records[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id)))
    .map((r) => JSON.stringify(r.seo || null)).join('\n')).join('\n'));
  const titleSlugSeal = sha256(hashParts.join('\n'));

  const revisions = {};
  let updatedMin = null, updatedMax = null;
  for (const t of WIKI_TYPES) for (const r of records[t]) {
    revisions[r._id] = { rev: r._rev, updatedAt: r._updatedAt };
    if (!updatedMin || r._updatedAt < updatedMin) updatedMin = r._updatedAt;
    if (!updatedMax || r._updatedAt > updatedMax) updatedMax = r._updatedAt;
  }

  const failed = checks.filter((c) => !c.pass);
  if (failed.length) { console.log('STOP - baseline failed: ' + failed.map((c) => c.id).join(',')); process.exit(2); }

  const baseline = {
    specId: 'SPEC_11', artifact: 'BASELINE', generatedAt: new Date().toISOString(),
    mode: 'READ-ONLY freeze before any Stage A planning (no writes)',
    checks,
    inventory: { counts, total, drafts: wikiDrafts, datasetDrafts: draftDocs.length, duplicateSlugs: dupSlugs, noSlug },
    identity: { hash: identityHash, expected: EXPECTED_HASH, match: true },
    seals: { titleSlugSeal, seoSeal, relSeal },
    revisions: { count: Object.keys(revisions).length, minUpdatedAt: updatedMin, maxUpdatedAt: updatedMax },
    relationshipCounts: relCounts,
    fullSnapshotFile: TEMP_DIR + '/spec11_baseline_records.json',
    environment: {
      gitHead: require('child_process').execSync('git rev-parse --short HEAD').toString().trim(),
      gitBranch: require('child_process').execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
      node: process.version,
    },
    note: 'Freeze point for SPEC 11 Stage A. During read-only planning no _updatedAt may change; Stage B compares against this file.',
  };
  fs.writeFileSync(path.join(OUT, 'BASELINE.json'), JSON.stringify(baseline, null, 2));

  const snapshot = {
    specId: 'SPEC_11', generatedAt: new Date().toISOString(),
    counts, total, identityHash, seoSeal, relSeal, titleSlugSeal,
    revisions,
    records: Object.fromEntries(WIKI_TYPES.map((t) => [
      t, records[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id))),
    ])),
  };
  fs.writeFileSync(path.join(TEMP_DIR, 'spec11_baseline_records.json'), JSON.stringify(snapshot));
  console.log('WROTE ' + path.join(OUT, 'BASELINE.json') + ' + temp full snapshot');
  console.log('BASELINE FREEZE PASS - 473 records / hash MATCH / seo+rel seals captured');
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
