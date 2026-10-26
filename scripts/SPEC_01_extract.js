const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---- Config ----
const envContent = fs.readFileSync('.env.local', 'utf8');
const tokenMatch = envContent.match(/SANITY_API_TOKEN="([^"]+)"/);
const TOKEN = tokenMatch ? tokenMatch[1] : null;
if (!TOKEN) { console.error('SANITY_API_TOKEN not found in .env.local'); process.exit(1); }

const PROJECT_ID = 'zeohjejw';
const DATASET = 'production';
const API_VERSION = '2026-05-25';
const API_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;

const OUT_DIR = path.join('report', 'SPEC_01', 'raw');
fs.mkdirSync(OUT_DIR, { recursive: true });

const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED_COUNTS = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_TOTAL = 473;

const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

async function query(name, groq) {
  const url = `${API_BASE}?query=${encodeURIComponent(groq)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`Query ${name} failed: ${res.status} ${await res.text()}`);
  return (await res.json()).result || [];
}

// Full-document projection for wiki types (read-only deep capture)
const Q = {}; 
for (const t of WIKI_TYPES) Q[t] = `*[_type == "${t}"][]`;
Q.post = `*[_type == "post"]{ _id, slug, name, title }`;
Q.tool = `*[_type == "tool"]{ _id, slug, name, title }`;
Q.category = `*[_type == "category"]{ _id, slug, name, title }`;
Q.author = `*[_type == "author"]{ _id, slug, name }`;
Q.inspiration = `*[_type == "inspiration"]{ _id }`;
Q.subscriber = `*[_type == "subscriber"]{ _id }`;
Q.sanityImageAsset = `*[_type == "sanity.imageAsset"]{ _id }`;

async function main() {
  const startedAt = new Date().toISOString();
  const dump = {};
  for (const [type, groq] of Object.entries(Q)) {
    dump[type] = await query(type, groq);
    console.log(`[${type}] fetched ${dump[type].length} records`);
  }

  // ---- Baseline gate -----------------------------------------------------
  const gates = [];
  const fail = (m) => { gates.push('GATE FAIL: ' + m); console.error('GATE FAIL: ' + m); };
  const pass = (m) => { gates.push(m); console.log('GATE OK: ' + m); };

  const counts = {};
  let total = 0;
  for (const t of WIKI_TYPES) {
    const published = dump[t].filter((x) => !x._id.startsWith('drafts.'));
    counts[t] = published.length;
    total += published.length;
    if (counts[t] !== EXPECTED_COUNTS[t]) fail(`count ${t}: ${counts[t]} != expected ${EXPECTED_COUNTS[t]}`);
  }
  if (total !== EXPECTED_TOTAL) fail(`total ${total} != ${EXPECTED_TOTAL}`); else pass(`473 records, counts ${JSON.stringify(counts)}`);

  const draftsCount = dump['species'].filter((x) => x._id.startsWith('drafts.')).length
    + dump['plant'].filter((x) => x._id.startsWith('drafts.')).length
    + dump['invertebrate'].filter((x) => x._id.startsWith('drafts.')).length
    + dump['coral'].filter((x) => x._id.startsWith('drafts.')).length
    + dump['equipment'].filter((x) => x._id.startsWith('drafts.')).length
    + dump['problem'].filter((x) => x._id.startsWith('drafts.')).length;
  if (draftsCount !== 0) fail(`drafts=${draftsCount} (expected 0)`); else pass('0 drafts in wiki types');

  const rawDraft = Number(await query('drafts', `count(*[_id match "drafts.**"])`)) || 0;
  if (rawDraft !== 0) fail(`global drafts=${rawDraft} (expected 0)`); else pass('0 drafts dataset-wide');

  // SPEC 00.2 integrity re-check: slug objects valid, no dup slugs, identity populated
  const dupSlugs = {};
  let identityMissing = 0, stringSlugs = 0, undefinedRoutes = 0;
  const ROUTES = { species: 'species', plant: 'plants', invertebrate: 'invertebrates', coral: 'corals', equipment: 'equipment', problem: 'problems' };
  for (const t of WIKI_TYPES) {
    for (const it of dump[t]) {
      if (it._id.startsWith('drafts.')) continue;
      const ttl = titleOf(t, it);
      const slug = slugValue(it.slug);
      if (ttl == null || String(ttl).trim() === '') identityMissing++;
      if (it.slug && typeof it.slug === 'string') stringSlugs++;
      if (slug) { if (!dupSlugs[slug]) dupSlugs[slug] = []; dupSlugs[slug].push(`${t}:${it._id}`); }
      if (slug == null) undefinedRoutes++;
      else if (String(slug).includes('undefined')) undefinedRoutes++;
    }
  }
  const dupGroups = Object.entries(dupSlugs).filter(([, v]) => v.length > 1);
  if (dupGroups.length) fail(`duplicate slugs: ${dupGroups.map(([s, v]) => `${s}(${v.join('|')})`).join(' ')}`); else pass('0 duplicate slugs');
  if (identityMissing) fail(`identity missing on ${identityMissing} records`); else pass('identity populated on all 473');
  if (stringSlugs) fail(`${stringSlugs} string-typed slugs remain`); else pass('all slugs are proper slug objects (SPEC 00.2 preserved)');
  if (undefinedRoutes) fail(`${undefinedRoutes} /undefined routes`); else pass('0 /undefined routes');

  // Historical integrity vs SPEC 00.1/00.2 post-repair inventory (no ID/title/slug regression)
  const prior = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_00_1', 'SPEC_00_1_CANONICAL_INVENTORY.json'), 'utf8')).records;
  const priorById = {};
  for (const r of prior) priorById[r.canonical_id] = r;
  let idRegression = 0, slugRegression = 0, titleRegression = 0;
  const myIds = new Set(), priorIds = new Set();
  for (const t of WIKI_TYPES) for (const it of dump[t]) if (!it._id.startsWith('drafts.')) myIds.add(it._id);
  for (const r of prior) priorIds.add(r.canonical_id);
  for (const id of myIds) if (!priorIds.has(id)) idRegression++;
  for (const id of priorIds) if (!myIds.has(id)) idRegression++;
  for (const [t, items] of Object.entries(dump)) {
    if (!WIKI_TYPES.includes(t)) continue;
    for (const it of items) {
      if (it._id.startsWith('drafts.')) continue;
      const p = priorById[it._id];
      if (!p) continue;
      if (slugValue(it.slug) !== (p.slug || null)) slugRegression++;
      const nowTitle = titleOf(t, it);
      if ((nowTitle ?? null) !== (p.title ?? null)) titleRegression++;
    }
  }
  if (idRegression) fail(`ID regression: ${idRegression}`); else pass('ID set unchanged vs SPEC 00.1 inventory');
  if (slugRegression) fail(`slug regression: ${slugRegression}`); else pass('slugs unchanged vs SPEC 00.1 inventory');
  if (titleRegression) fail(`title regression: ${titleRegression}`); else pass('titles unchanged vs SPEC 00.1 inventory');

  const blocked = gates.filter((g) => g.startsWith('GATE FAIL')).length > 0;
  if (blocked) {
    console.error('\nSPEC_01 BLOCKED: baseline gate failed. No artifacts written.');
    process.exit(3);
  }

  // ---- Canonial hashes (mutation guard) ----
  const canonical = {};
  for (const t of WIKI_TYPES) {
    for (const it of dump[t]) {
      if (it._id.startsWith('drafts.')) continue;
      canonical[it._id] = {
        type: t, title: titleOf(t, it), slug: slugValue(it.slug),
        h: sha256(JSON.stringify({ id: it._id, title: titleOf(t, it), slug: slugValue(it.slug) })),
      };
    }
  }
  const canonicalHash = sha256(Object.keys(canonical).sort().map((id) => canonical[id].h).join('\n'));
  const rawDumpStr = JSON.stringify({ manifest: null, records: dump }, null, 2);
  const rawDumpHash = sha256(rawDumpStr);

  const manifest = {
    spec: 'SPEC 01', 
    generatedAt: startedAt,
    fetchedAt: startedAt,
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: API_VERSION,
    extractionMethod: 'Sanity HTTP API — data/query (read-only). Full-document projection for wiki types.',
    wikiTypeCounts: counts,
    totalWikiRecords: total,
    drafts: rawDraft,
    expectedCategoryCounts: EXPECTED_COUNTS,
    integrityAfterSpec002: { duplicateSlugs: dupGroups.length, stringTypedSlugs: 0, undefinedRoutes: 0, identityMissing: 0 },
    regressionVsSpec001: { idMutated: idRegression, slugMutated: slugRegression, titleMutated: titleRegression },
    canonicalRecordCount: Object.keys(canonical).length,
    canonicalHash,
    rawDumpHash,
    notes: 'Read-only audit. No normalization applied. Full-document capture.',
  };

  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_01_RAW_DUMP.json'), JSON.stringify({ manifest, records: dump }, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_01_RAW_DUMP_HASH.txt'), rawDumpHash);
  fs.writeFileSync(path.join('report', 'SPEC_01', 'SPEC_01_SOURCE_MANIFEST.json'), JSON.stringify({
    manifest,
    perRecord: canonical,
  }, null, 2));

  console.log(`\nWrote report/SPEC_01/raw/SPEC_01_RAW_DUMP.json (+ hash, manifest).`);
  console.log(`canonicalHash=${canonicalHash}  canonicalRecords=${Object.keys(canonical).length}`);
}
main().catch((err) => { console.error(err); process.exit(1); });