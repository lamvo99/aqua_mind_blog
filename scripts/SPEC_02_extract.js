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

const OUT_DIR = path.join('report', 'SPEC_02');
fs.mkdirSync(OUT_DIR, { recursive: true });

const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED_COUNTS = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_TOTAL = 473;

// Live schema category enums (source: sanity/schemaTypes/{problem,equipment}.ts)
const CATEGORY_ENUMS = {
  problem: ['water', 'algae', 'plants', 'fish', 'equipment'],
  equipment: ['Filter', 'Light', 'Pump', 'Heater', 'CO\u2082 System', 'Substrate', 'Test Kit', 'Other'],
  species: null, plant: null, invertebrate: null, coral: null,
};

const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

async function query(name, groq) {
  const url = `${API_BASE}?query=${encodeURIComponent(groq)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`Query ${name} failed: ${res.status} ${await res.text()}`);
  return (await res.json()).result || [];
}

// Full-document projections (include _rev / _updatedAt via full-doc fetch)
const Q = {};
for (const t of WIKI_TYPES) Q[t] = `*[_type == "${t}"][]`;

async function main() {
  const startedAt = new Date().toISOString();
  const dump = {};
  for (const t of WIKI_TYPES) {
    dump[t] = await query(t, Q[t]);
    console.log(`[${t}] fetched ${dump[t].length} records`);
  }

  const gates = [];
  const fail = (m) => { gates.push('GATE FAIL: ' + m); console.error('GATE FAIL: ' + m); };
  const pass = (m) => { gates.push(m); console.log('GATE OK: ' + m); };

  const counts = {};
  let total = 0;
  for (const t of WIKI_TYPES) {
    const published = dump[t].filter((x) => x._id.startsWith('drafts.') ? false : true);
    counts[t] = published.length;
    total += published.length;
    if (counts[t] !== EXPECTED_COUNTS[t]) fail(`count ${t}: ${counts[t]} != expected ${EXPECTED_COUNTS[t]}`);
  }
  if (total !== EXPECTED_TOTAL) fail(`total ${total} != ${EXPECTED_TOTAL}`); else pass(`473 records, counts ${JSON.stringify(counts)}`);

  const drafts = WIKI_TYPES.reduce((s, t) => s + dump[t].filter((x) => x._id.startsWith('drafts.')).length, 0);
  const rawDraft = Number(await query('drafts', `count(*[_id match "drafts.**"])`)) || 0;
  if (drafts !== 0 || rawDraft !== 0) fail(`drafts wiki=${drafts} global=${rawDraft}`); else pass('0 drafts (wiki + dataset-wide)');

  const dupSlugs = {}; let identityMissing = 0, undefinedRoutes = 0;
  for (const t of WIKI_TYPES) {
    for (const it of dump[t]) {
      if (it._id.startsWith('drafts.')) continue;
      const slug = slugValue(it.slug);
      if (titleOf(t, it) == null || String(titleOf(t, it)).trim() === '') identityMissing++;
      if (slug) { if (!dupSlugs[slug]) dupSlugs[slug] = []; dupSlugs[slug].push(`${t}:${it._id}`); }
      if (slug == null || String(slug).includes('undefined')) undefinedRoutes++;
    }
  }
  const dupGroups = Object.entries(dupSlugs).filter(([, v]) => v.length > 1);
  if (dupGroups.length) fail(`duplicate slugs: ${dupGroups.map(([s, v]) => `${s}(${v.join('|')})`).join(' ')}`); else pass('0 duplicate slugs');
  if (identityMissing) fail(`identity missing on ${identityMissing}`); else pass('identity populated on all 473');
  if (undefinedRoutes) fail(`${undefinedRoutes} /undefined routes`); else pass('0 /undefined routes');

  // Identity consistency vs SPEC 01 manifest (id/title/slug must be identical pre-repair)
  const spec01 = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_01', 'SPEC_01_SOURCE_MANIFEST.json'), 'utf8'));
  let idDiff = 0, slugDiff = 0, titleDiff = 0;
  const liveIdSet = new Set(), spec01Ids = new Set(Object.keys(spec01.perRecord));
  for (const t of WIKI_TYPES) for (const it of dump[t]) if (!it._id.startsWith('drafts.')) liveIdSet.add(it._id);
  for (const id of liveIdSet) if (!spec01Ids.has(id)) idDiff++;
  for (const id of spec01Ids) if (!liveIdSet.has(id)) idDiff++;
  for (const id of liveIdSet) {
    const m = spec01.perRecord[id]; if (!m) continue;
    const rec = WIKI_TYPES.flatMap((t) => dump[t]).find((r) => r._id === id);
    if (!rec) continue;
    if (slugValue(rec.slug) !== m.slug) slugDiff++;
    if ((titleOf(m.type, rec) ?? null) !== m.title) titleDiff++;
  }
  if (idDiff) fail(`ID set changed vs SPEC 01: ${idDiff}`); else pass('ID set identical to SPEC 01 manifest');
  if (slugDiff) fail(`slug drifted vs SPEC 01: ${slugDiff}`); else pass('slugs identical to SPEC 01 manifest');
  if (titleDiff) fail(`title drifted vs SPEC 01: ${titleDiff}`); else pass('titles identical to SPEC 01 manifest');

  // Canonical hashes (identity-only, matches SPEC_01 formula)
  const canonical = {};
  for (const t of WIKI_TYPES) {
    for (const it of dump[t]) {
      if (it._id.startsWith('drafts.')) continue;
      canonical[it._id] = {
        type: t,
        title: titleOf(t, it),
        slug: slugValue(it.slug),
        rev: it._rev ?? null,
        h: sha256(JSON.stringify({ id: it._id, title: titleOf(t, it), slug: slugValue(it.slug) })),
      };
    }
  }
  const canonicalHash = sha256(Object.keys(canonical).sort().map((id) => canonical[id].h).join('\n'));
  const rawDumpStr = JSON.stringify({ records: dump }, null, 2);
  const rawDumpHash = sha256(rawDumpStr);

  // Category matrix (all 473) + 21-target identification
  const matrix = [];
  let problemsMissing = 0, equipmentInvalid = 0, scopeTargets = 0;
  for (const t of WIKI_TYPES) {
    const enums = CATEGORY_ENUMS[t];
    for (const it of dump[t]) {
      if (it._id.startsWith('drafts.')) continue;
      const cat = it.category ?? null;
      const present = Object.prototype.hasOwnProperty.call(it, 'category');
      let valid = true, scopeTarget = false;
      if (enums) {
        valid = present && cat !== null && enums.includes(cat);
        if (!present || cat === null) { if (t === 'problem') problemsMissing++; scopeTarget = t === 'problem'; }
        else if (!enums.includes(cat)) { if (t === 'equipment') equipmentInvalid++; scopeTarget = t === 'equipment'; }
        if (scopeTarget) scopeTargets++;
      }
      matrix.push({
        type: t, recordId: it._id, title: titleOf(t, it), currentCategory: cat,
        allowedValues: enums ? enums.join('|') : '',
        categoryValid: valid, scopeTarget,
      });
    }
  }
  if (problemsMissing !== 13) fail(`problems with missing category: ${problemsMissing} != 13`);
  else pass('13 problems with missing category identified');
  if (equipmentInvalid !== 8) fail(`equipment with invalid category: ${equipmentInvalid} != 8`);
  else pass('8 equipment with invalid category identified');
  if (scopeTargets !== 21) fail(`scope targets: ${scopeTargets} != 21`);
  else pass('21 critical scope targets identified');

  const blocked = gates.filter((g) => g.startsWith('GATE FAIL')).length > 0;
  if (blocked) {
    console.error('\nSPEC_02 BLOCKED: baseline gate failed. No pre-repair artifacts written.');
    process.exit(3);
  }

  const manifest = {
    spec: 'SPEC 02', phase: 'PRE_REPAIR', generatedAt: startedAt,
    projectId: PROJECT_ID, dataset: DATASET, apiVersion: API_VERSION,
    extractionMethod: 'Sanity HTTP API — data/query (read-only). Full-document projection for wiki types incl. _rev.',
    wikiTypeCounts: counts, totalWikiRecords: total, drafts: rawDraft,
    identityVsSpec01: { idDiff, slugDiff, titleDiff },
    canonicalRecordCount: Object.keys(canonical).length,
    canonicalHash,
    rawDumpHash,
    categoryContract: CATEGORY_ENUMS,
    targets: {
      problemsWithMissingCategory: problemsMissing,
      equipmentWithInvalidCategory: equipmentInvalid,
      total: scopeTargets,
    },
    notes: 'Immutable pre-repair snapshot. Identity hash covers id/title/slug only; category repair must not change canonicalHash.',
  };

  // CSV writer
  function writeCsv(file, header, rows) {
    const enc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    fs.writeFileSync(path.join(OUT_DIR, file), [header, ...rows.map((r) => r.map(enc).join(','))].join('\n'));
  }
  writeCsv('SPEC_02_PRE_REPAIR_CATEGORY_MATRIX.csv',
    ['document_type', 'canonical_id', 'title', 'current_category', 'allowed_values', 'category_valid', 'scope_target'],
    matrix.map((m) => [m.type, m.recordId, m.title, m.currentCategory, m.allowedValues, m.categoryValid, m.scopeTarget]));

  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_02_PRE_REPAIR_SNAPSHOT.json'), JSON.stringify({ manifest, perRecord: canonical, records: dump }, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_02_RAW_SOURCE_MANIFEST.json'), JSON.stringify(manifest, null, 2));

  console.log('\nWrote report/SPEC_02/SPEC_02_PRE_REPAIR_SNAPSHOT.json, SPEC_02_PRE_REPAIR_CATEGORY_MATRIX.csv, SPEC_02_RAW_SOURCE_MANIFEST.json');
  console.log(`canonicalHash=${canonicalHash}  targets=${scopeTargets} (problems=${problemsMissing}, equipment=${equipmentInvalid})`);
}
main().catch((err) => { console.error(err); process.exit(1); });