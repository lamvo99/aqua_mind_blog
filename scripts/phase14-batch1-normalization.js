const fs = require('fs');

// 1. Read SANITY_API_TOKEN from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const tokenMatch = envContent.match(/SANITY_API_TOKEN="([^"]+)"/);
const TOKEN = tokenMatch ? tokenMatch[1] : null;
if (!TOKEN) { console.error('No SANITY_API_TOKEN found'); process.exit(1); }

const PROJECT_ID = 'zeohjejw';
const DATASET = 'production';
const API_VERSION = '2026-05-25';
const QUERY_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;
const MUTATE_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/mutate/${DATASET}`;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`,
};

async function fetchDoc(id) {
  const q = encodeURIComponent(`*[_id == "${id}"][0]`);
  const res = await fetch(`${QUERY_BASE}?query=${q}`);
  const data = await res.json();
  return data.result;
}

async function fetchByQuery(query) {
  const q = encodeURIComponent(query);
  const res = await fetch(`${QUERY_BASE}?query=${q}`);
  const data = await res.json();
  return data.result;
}

async function patchDoc(id, patch) {
  const body = { mutations: [{ patch: { id, set: patch } }] };
  const res = await fetch(MUTATE_BASE, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (data.error) {
    console.error(`  ERROR ${id}: ${data.error.message}`);
    return false;
  }
  console.log(`  OK: ${id}`);
  return true;
}

// Part A: Find Java Fern ID
async function findJavaFernId() {
  console.log('=== Part A: Find Java Fern ID ===');
  const result = await fetchByQuery('*[_type == "plant" && name == "Java Fern"][0]{_id, name, scientificName}');
  if (result) {
    console.log(`  Java Fern: _id=${result._id}, name=${result.name}, scientificName=${result.scientificName || 'N/A'}`);
  } else {
    console.log('  Java Fern NOT FOUND');
  }
  return result;
}

// Part B: Alias additions
const ALIAS_UPDATES = [
  { id: 'sebdKYryWZgYP2rm3noHja', name: 'Banggai Cardinalfish', newAlias: 'Banggai Clownfish' },
  { id: 'species-melanotaenia-boesemani', name: 'Boesemani Rainbowfish', newAlias: "Boeseman's Rainbowfish" },
  { id: 'species-pygocentrus-nattereri', name: 'Red-bellied Piranha', newAlias: 'San Francisco Piranha' },
];

async function addAlias(update) {
  console.log(`  Processing alias for ${update.name}...`);
  const doc = await fetchDoc(update.id);
  if (!doc) {
    console.error(`  ERROR: Document ${update.id} not found`);
    return { success: false, error: 'Document not found' };
  }
  const existing = Array.isArray(doc.aliases) ? doc.aliases : [];
  if (existing.includes(update.newAlias)) {
    console.log(`    Alias "${update.newAlias}" already present, skipping`);
    return { success: true, skipped: true };
  }
  const newAliases = [...existing, update.newAlias];
  const ok = await patchDoc(update.id, { aliases: newAliases });
  return { success: ok, newAliases };
}

// Part C: Style tag additions
const STYLE_UPDATES = [
  { name: 'Frontosa Cichlid', matchType: 'species', matchFn: (i) => i.name === 'Frontosa Cichlid', style: 'African Cichlid' },
  { name: 'Electric Yellow Cichlid', matchType: 'species', matchFn: (i) => i.name === 'Electric Yellow Cichlid', style: 'African Cichlid' },
  { name: 'Zebra Mbuna Cichlid', matchType: 'species', matchFn: (i) => i.name === 'Zebra Mbuna Cichlid', style: 'African Cichlid' },
  { name: "Dubois\u2019 Tropheus", matchType: 'species', matchFn: (i) => i.name === "Dubois\u2019 Tropheus", style: 'African Cichlid' },
  { name: 'Bumblebee Goby', matchType: 'species', matchFn: (i) => i.name === 'Bumblebee Goby', style: 'Brackish' },
  { name: 'Ocellaris Clownfish', matchType: 'species', matchFn: (i) => i.name === 'Ocellaris Clownfish', style: 'Anemone/Clownfish' },
  { name: 'Percula Clownfish', matchType: 'species', matchFn: (i) => i.name === 'Percula Clownfish', style: 'Anemone/Clownfish' },
  { name: 'Bubble-Tip Anemone', matchType: 'invertebrate', matchFn: (i) => i.name === 'Bubble-Tip Anemone', style: 'Anemone/Clownfish' },
  { name: 'Chocolate Gourami', matchType: 'species', matchFn: (i) => i.name === 'Chocolate Gourami', style: 'Blackwater' },
  { name: 'Cardinal Tetra', matchType: 'species', matchFn: (i) => i.name === 'Cardinal Tetra', style: 'Blackwater' },
];

async function addStyleTag(update) {
  console.log(`  Processing style tag for ${update.name}...`);
  const q = encodeURIComponent(`*[_type == "${update.matchType}" && name == "${update.name}"][0]`);
  const res = await fetch(`${QUERY_BASE}?query=${q}`);
  const data = await res.json();
  const doc = data.result;
  if (!doc) {
    console.error(`  ERROR: ${update.name} not found in type ${update.matchType}`);
    return { success: false, error: 'Document not found' };
  }
  const existing = Array.isArray(doc.aquariumStyle) ? doc.aquariumStyle : [];
  if (existing.includes(update.style)) {
    console.log(`    Style "${update.style}" already present, skipping`);
    return { success: true, skipped: true };
  }
  const newStyles = [...existing, update.style];
  const ok = await patchDoc(doc._id, { aquariumStyle: newStyles });
  return { success: ok, newStyles };
}

async function main() {
  const summary = { aliasAdditions: 0, styleTagUpdates: 0, errors: [] };

  // Part A
  const javaFern = await findJavaFernId();

  // Part B
  console.log('\n=== Part B: Alias Additions ===');
  for (const update of ALIAS_UPDATES) {
    const result = await addAlias(update);
    if (result.success && !result.skipped) summary.aliasAdditions++;
    if (!result.success) summary.errors.push({ type: 'alias', name: update.name, error: result.error });
  }

  // Part C
  console.log('\n=== Part C: Style Tag Updates ===');
  for (const update of STYLE_UPDATES) {
    const result = await addStyleTag(update);
    if (result.success && !result.skipped) summary.styleTagUpdates++;
    if (!result.success) summary.errors.push({ type: 'style', name: update.name, error: result.error });
  }

  // Part D
  console.log('\n=== Part D: Summary ===');
  console.log(JSON.stringify(summary, null, 2));

  if (!fs.existsSync('report')) fs.mkdirSync('report', { recursive: true });
  fs.writeFileSync('report/phase14-batch1-summary.json', JSON.stringify(summary, null, 2));
  console.log('\nWrote report/phase14-batch1-summary.json');
}

main().catch(console.error);
