const fs = require('fs');
const path = require('path');

// ---- Config (mirrors existing phase scripts) ----
const envContent = fs.readFileSync('.env.local', 'utf8');
const tokenMatch = envContent.match(/SANITY_API_TOKEN="([^"]+)"/);
const TOKEN = tokenMatch ? tokenMatch[1] : null;
if (!TOKEN) {
  console.error('SANITY_API_TOKEN not found in .env.local');
  process.exit(1);
}

const PROJECT_ID = 'zeohjejw';
const DATASET = 'production';
const API_VERSION = '2026-05-25';
const API_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;

const OUT_DIR = path.join('report', 'SPEC_00_1', 'raw');
fs.mkdirSync(OUT_DIR, { recursive: true });

const REF_FIELDS = '_id, name, title, slug, scientificName';

const QUERIES = {
  species: `*[_type == "species"] {
    _id, name, scientificName, slug, excerpt, waterType, group, region, difficulty,
    isPredator, reefCompatibility, localNames, aliases,
    parentSpecies{_ref},
    compatibleSpecies[]{_ref}, compatiblePlants[]{_ref}, compatibleInvertebrates[]{_ref},
    suitableEquipment[]{_ref}, relatedProblems[]{_ref}, relatedPosts[]{_ref},
    mainImage
  }`,
  plant: `*[_type == "plant"] {
    _id, name, scientificName, slug, excerpt, group, growthForm, redPlant, localNames, aliases,
    suitableEquipment[]{_ref}, relatedProblems[]{_ref}, relatedPosts[]{_ref},
    mainImage
  }`,
  invertebrate: `*[_type == "invertebrate"] {
    _id, name, scientificName, slug, excerpt, waterType, group, localNames, aliases,
    parentSpecies{_ref},
    compatibleSpecies[]{_ref},
    suitableEquipment[]{_ref}, relatedProblems[]{_ref}, relatedPosts[]{_ref},
    mainImage
  }`,
  coral: `*[_type == "coral"] {
    _id, name, scientificName, slug, excerpt, coralType, group, localNames, aliases,
    suitableEquipment[]{_ref}, relatedProblems[]{_ref}, relatedPosts[]{_ref},
    mainImage
  }`,
  equipment: `*[_type == "equipment"] {
    _id, name, brand, model, slug, excerpt, category, pros, cons,
    relatedPosts[]{_ref},
    mainImage
  }`,
  problem: `*[_type == "problem"] {
    _id, title, slug, excerpt, category, waterType,
    symptoms, causes, whatToCheck, whatNotToDo,
    relatedPosts[]{_ref}, relatedTools[]{_ref}
  }`,
  // Supporting document types: used only for reference resolution
  post: `*[_type == "post"] { _id }`,
  tool: `*[_type == "tool"] { _id }`,
  category: `*[_type == "category"] { _id }`,
  author: `*[_type == "author"] { _id }`,
  inspiration: `*[_type == "inspiration"] { _id }`,
  subscriber: `*[_type == "subscriber"] { _id }`,
};

async function query(name, groq) {
  const url = `${API_BASE}?query=${encodeURIComponent(groq)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) {
    throw new Error(`Query ${name} failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.result || [];
}

async function main() {
  const startedAt = new Date().toISOString();
  const dump = {};
  const idIndex = {};

  for (const [type, groq] of Object.entries(QUERIES)) {
    const items = await query(type, groq);
    dump[type] = items;
    console.log(`[${type}] fetched ${items.length} records`);
  }

  // Build global ID index for reference resolution (published + drafts)
  for (const type of Object.keys(dump)) {
    for (const item of dump[type]) {
      idIndex[item._id] = type;
    }
  }

  const manifest = {
    generatedAt: startedAt,
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: API_VERSION,
    extractionMethod: 'Sanity HTTP API — data/query (read-only)',
    sourceFiles: [
      `sanity/schemaTypes/{species,plant,invertebrate,coral,equipment,problem}.ts`,
      'app/{species,plants,invertebrates,corals,equipment,problems}/[slug]/page.tsx',
      'scripts/SPEC_00_1_extract.js',
    ],
    recordCountsBeforeNormalization: Object.fromEntries(
      Object.entries(dump).map(([t, v]) => [t, v.length])
    ),
    notes: 'Raw API snapshot. No normalization applied. Published vs drafts split in audit.',
  };

  fs.writeFileSync(path.join(OUT_DIR, 'spec00_1_raw_dump.json'), JSON.stringify({
    manifest,
    records: dump,
  }, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'spec00_1_raw_dump.lock.json'), JSON.stringify(manifest, null, 2));

  const total = Object.values(dump).reduce((s, arr) => s + arr.length, 0);
  console.log(`\nTOTAL raw records fetched (all types): ${total}`);
  console.log('Wrote report/SPEC_00_1/raw/spec00_1_raw_dump.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});