const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const tokenMatch = envContent.match(/SANITY_API_TOKEN="([^"]+)"/);
const TOKEN = tokenMatch ? tokenMatch[1] : null;
if (!TOKEN) { console.error('No SANITY_API_TOKEN found'); process.exit(1); }

const PROJECT_ID = 'zeohjejw';
const DATASET = 'production';
const API_VERSION = '2026-05-25';
const MUTATE_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/mutate/${DATASET}`;
const QUERY_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`,
};

async function fetchByQuery(query) {
  const q = encodeURIComponent(query);
  const res = await fetch(`${QUERY_BASE}?query=${q}`);
  const data = await res.json();
  return data.result;
}

async function createDoc(id, doc) {
  const body = {
    mutations: [{
      createIfNotExists: {
        _id: id,
        _type: doc._type,
        ...doc,
      }
    }]
  };
  const res = await fetch(MUTATE_BASE, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (data.error) {
    return { success: false, id, error: data.error.message };
  }
  const created = data.results && data.results[0];
  return { success: true, id, operation: created?.operation || 'unknown', documentId: created?.id || id };
}

// ─── Corals ────────────────────────────────────────────────────────────────

const CORALS = [
  {
    _type: 'coral',
    _id: 'coral-lobophytum-leather',
    name: 'Lobophytum Leather',
    scientificName: 'Lobophytum sp.',
    slug: { _type: 'slug', current: 'coral-lobophytum-leather' },
    coralType: 'soft',
    group: 'Soft',
    light: 'Low',
    flow: 'Moderate',
    difficulty: 'Beginner',
    placement: 'Sand bed',
    aggression: 'Peaceful',
    reefCompatibility: true,
    photosynthetic: true,
    aquariumStyle: ['Reef'],
    tempMinC: 24,
    tempMaxC: 28,
    excerpt: 'A hardy soft coral with a thick leather-like body and short polyps.',
  },
  {
    _type: 'coral',
    _id: 'coral-turbinaria',
    name: 'Turbinaria',
    scientificName: 'Turbinaria reniformis',
    slug: { _type: 'slug', current: 'coral-turbinaria' },
    coralType: 'lps',
    group: 'LPS',
    light: 'Low',
    flow: 'High',
    difficulty: 'Intermediate',
    placement: 'Sand bed',
    aggression: 'Peaceful',
    reefCompatibility: true,
    photosynthetic: true,
    aquariumStyle: ['Reef'],
    tempMinC: 24,
    tempMaxC: 28,
    excerpt: 'A plate-shaped LPS coral that thrives in lower light conditions.',
  },
  {
    _type: 'coral',
    _id: 'coral-table-acropora',
    name: 'Table Acropora',
    scientificName: 'Acropora hyacinthus',
    slug: { _type: 'slug', current: 'coral-table-acropora' },
    coralType: 'sps',
    group: 'SPS',
    light: 'High',
    flow: 'High',
    difficulty: 'Advanced',
    placement: 'High rock',
    aggression: 'Semi-aggressive',
    reefCompatibility: true,
    photosynthetic: true,
    aquariumStyle: ['Reef'],
    tempMinC: 24,
    tempMaxC: 28,
    excerpt: 'A classic table-shaped SPS coral forming wide flat colonies.',
  },
  {
    _type: 'coral',
    _id: 'coral-porites',
    name: 'Porites',
    scientificName: 'Porites lobata',
    slug: { _type: 'slug', current: 'coral-porites' },
    coralType: 'sps',
    group: 'SPS',
    light: 'Moderate',
    flow: 'Moderate',
    difficulty: 'Intermediate',
    placement: 'Mid rock',
    aggression: 'Peaceful',
    reefCompatibility: true,
    photosynthetic: true,
    aquariumStyle: ['Reef'],
    tempMinC: 24,
    tempMaxC: 28,
    excerpt: 'A massive boulder coral with a calm growth form.',
  },
  {
    _type: 'coral',
    _id: 'coral-gorgonian',
    name: 'Gorgonian',
    scientificName: 'Eunicella cavolini',
    slug: { _type: 'slug', current: 'coral-gorgonian' },
    coralType: 'nps',
    group: 'NPS',
    light: 'Low',
    flow: 'High',
    difficulty: 'Advanced',
    placement: 'High rock',
    aggression: 'Peaceful',
    reefCompatibility: false,
    photosynthetic: false,
    aquariumStyle: ['Reef'],
    tempMinC: 24,
    tempMaxC: 28,
    excerpt: 'A non-photosynthetic sea fan requiring frequent target feeding.',
  },
];

// ─── Plants ────────────────────────────────────────────────────────────────

const PLANTS = [
  {
    _type: 'plant',
    _id: 'plant-bolbitis-heudelotii',
    name: 'Bolbitis Heudelotii',
    scientificName: 'Bolbitis heudelotii',
    slug: { _type: 'slug', current: 'plant-bolbitis-heudelotii' },
    light: 'Low-Medium',
    co2: 'None',
    growth: 'Slow',
    difficulty: 'Beginner',
    placement: 'Epiphyte',
    tempMinC: 20,
    tempMaxC: 28,
    phMin: 5.5,
    phMax: 7.5,
    aquariumStyle: ['Planted', 'Low-Tech'],
    region: 'Africa',
    growthForm: 'Fern',
    redPlant: false,
    group: 'Epiphyte',
    excerpt: 'A dark green African fern ideal for low-tech planted tanks.',
  },
  {
    _type: 'plant',
    _id: 'plant-java-fern-windelov',
    name: 'Java Fern Windelov',
    scientificName: "Microsorum pteropus 'Windelov'",
    slug: { _type: 'slug', current: 'plant-java-fern-windelov' },
    light: 'Low',
    co2: 'None',
    growth: 'Slow',
    difficulty: 'Beginner',
    placement: 'Epiphyte',
    tempMinC: 20,
    tempMaxC: 28,
    phMin: 6.0,
    phMax: 7.5,
    aquariumStyle: ['Planted', 'Low-Tech'],
    region: 'Southeast Asia',
    growthForm: 'Fern',
    redPlant: false,
    group: 'Epiphyte',
    parentSpecies: { _type: 'reference', _ref: 'plant-java-fern' },
    excerpt: 'A Java Fern cultivar with finely branched leaf tips.',
  },
  {
    _type: 'plant',
    _id: 'plant-java-fern-narrow-leaf',
    name: 'Java Fern Narrow Leaf',
    scientificName: "Microsorum pteropus 'Narrow'",
    slug: { _type: 'slug', current: 'plant-java-fern-narrow-leaf' },
    light: 'Low',
    co2: 'None',
    growth: 'Slow',
    difficulty: 'Beginner',
    placement: 'Epiphyte',
    tempMinC: 20,
    tempMaxC: 28,
    phMin: 6.0,
    phMax: 7.5,
    aquariumStyle: ['Planted', 'Low-Tech'],
    region: 'Southeast Asia',
    growthForm: 'Fern',
    redPlant: false,
    group: 'Epiphyte',
    parentSpecies: { _type: 'reference', _ref: 'plant-java-fern' },
    excerpt: 'A Java Fern cultivar with slender elongated leaves.',
  },
  {
    _type: 'plant',
    _id: 'plant-cryptocoryne-parva',
    name: 'Cryptocoryne Parva',
    scientificName: 'Cryptocoryne parva',
    slug: { _type: 'slug', current: 'plant-cryptocoryne-parva' },
    light: 'Low-Medium',
    co2: 'None',
    growth: 'Slow',
    difficulty: 'Beginner',
    placement: 'Foreground',
    tempMinC: 22,
    tempMaxC: 28,
    phMin: 6.0,
    phMax: 7.5,
    aquariumStyle: ['Planted', 'Low-Tech'],
    region: 'Southeast Asia',
    growthForm: 'Rosette',
    redPlant: false,
    group: 'Rosette',
    excerpt: 'The smallest Cryptocoryne species, ideal for foreground carpeting.',
  },
  {
    _type: 'plant',
    _id: 'plant-rotala-wallichii',
    name: 'Rotala Wallichii',
    scientificName: 'Rotala wallichii',
    slug: { _type: 'slug', current: 'plant-rotala-wallichii' },
    light: 'High',
    co2: 'Medium',
    growth: 'Fast',
    difficulty: 'Advanced',
    placement: 'Background',
    tempMinC: 22,
    tempMaxC: 28,
    phMin: 5.5,
    phMax: 7.0,
    aquariumStyle: ['Planted'],
    region: 'Southeast Asia',
    growthForm: 'Stem',
    redPlant: true,
    group: 'Stem',
    excerpt: 'A striking red stem plant requiring high light and CO2.',
  },
  {
    _type: 'plant',
    _id: 'plant-pogostemon-helferi',
    name: 'Pogostemon Helferi',
    scientificName: 'Pogostemon helferi',
    slug: { _type: 'slug', current: 'plant-pogostemon-helferi' },
    light: 'High',
    co2: 'Medium',
    growth: 'Medium',
    difficulty: 'Intermediate',
    placement: 'Foreground',
    tempMinC: 20,
    tempMaxC: 28,
    phMin: 6.0,
    phMax: 7.5,
    aquariumStyle: ['Planted'],
    region: 'Southeast Asia',
    growthForm: 'Stem',
    redPlant: false,
    group: 'Stem',
    excerpt: 'A unique star-shaped foreground plant also known as Downoi.',
  },
  {
    _type: 'plant',
    _id: 'plant-dwarf-baby-tears',
    name: 'Dwarf Baby Tears',
    scientificName: 'Hemianthus callitrichoides',
    slug: { _type: 'slug', current: 'plant-dwarf-baby-tears' },
    light: 'High',
    co2: 'High',
    growth: 'Fast',
    difficulty: 'Advanced',
    placement: 'Foreground',
    tempMinC: 20,
    tempMaxC: 28,
    phMin: 5.0,
    phMax: 7.0,
    aquariumStyle: ['Planted'],
    region: 'Cuba',
    growthForm: 'Carpet',
    redPlant: false,
    group: 'Carpet',
    excerpt: 'One of the smallest aquarium plants, forming a lush green carpet.',
  },
  {
    _type: 'plant',
    _id: 'plant-thai-onion-plant',
    name: 'Thai Onion Plant',
    scientificName: 'Crinum thaianum',
    slug: { _type: 'slug', current: 'plant-thai-onion-plant' },
    light: 'Medium',
    co2: 'Low',
    growth: 'Slow',
    difficulty: 'Intermediate',
    placement: 'Background',
    tempMinC: 22,
    tempMaxC: 28,
    phMin: 6.0,
    phMax: 7.5,
    aquariumStyle: ['Planted'],
    region: 'Southeast Asia',
    growthForm: 'Other',
    redPlant: false,
    group: 'Other',
    excerpt: 'An aquatic onion plant with long ribbon-like leaves.',
  },
];

// ─── Equipment ─────────────────────────────────────────────────────────────

const EQUIPMENT = [
  {
    _type: 'equipment',
    _id: 'equip-co2-diffuser',
    name: 'CO2 Diffuser',
    slug: { _type: 'slug', current: 'equip-co2-diffuser' },
    category: 'CO2 System',
    excerpt: 'Essential component for dissolving CO2 into aquarium water',
    tankSizeMinL: 20,
    tankSizeMaxL: 500,
    aquariumStyle: ['Planted'],
  },
  {
    _type: 'equipment',
    _id: 'equip-co2-drop-checker',
    name: 'CO2 Drop Checker',
    slug: { _type: 'slug', current: 'equip-co2-drop-checker' },
    category: 'CO2 System',
    excerpt: 'Visual indicator of CO2 levels in aquarium water',
    tankSizeMinL: 0,
    tankSizeMaxL: 9999,
    aquariumStyle: ['Planted'],
  },
  {
    _type: 'equipment',
    _id: 'equip-t5-fluorescent-light',
    name: 'T5 Fluorescent Light',
    slug: { _type: 'slug', current: 'equip-t5-fluorescent-light' },
    category: 'Light',
    excerpt: 'Traditional fluorescent lighting popular for reef and planted tanks',
    tankSizeMinL: 50,
    tankSizeMaxL: 1000,
    aquariumStyle: ['Reef', 'Planted'],
  },
];

// ─── Problems ──────────────────────────────────────────────────────────────

const PROBLEMS = [
  {
    _type: 'problem',
    _id: 'problem-brown-jelly-disease',
    title: 'Brown Jelly Disease',
    slug: { _type: 'slug', current: 'problem-brown-jelly-disease' },
    category: 'algae',
    waterType: 'both',
    excerpt: 'Common LPS coral disease causing tissue loss',
  },
  {
    _type: 'problem',
    _id: 'problem-rapid-tissue-necrosis-rtn',
    title: 'Rapid Tissue Necrosis (RTN)',
    slug: { _type: 'slug', current: 'problem-rapid-tissue-necrosis-rtn' },
    category: 'algae',
    waterType: 'both',
    excerpt: 'Fast-progressing coral tissue death, typically SPS',
  },
  {
    _type: 'problem',
    _id: 'problem-slow-tissue-necrosis-stn',
    title: 'Slow Tissue Necrosis (STN)',
    slug: { _type: 'slug', current: 'problem-slow-tissue-necrosis-stn' },
    category: 'algae',
    waterType: 'both',
    excerpt: 'Gradual coral tissue recession',
  },
  {
    _type: 'problem',
    _id: 'problem-coral-bleaching',
    title: 'Coral Bleaching',
    slug: { _type: 'slug', current: 'problem-coral-bleaching' },
    category: 'algae',
    waterType: 'both',
    excerpt: 'Stress response causing coral to expel zooxanthellae',
  },
  {
    _type: 'problem',
    _id: 'problem-aiptasia-infestation',
    title: 'Aiptasia Infestation',
    slug: { _type: 'slug', current: 'problem-aiptasia-infestation' },
    category: 'algae',
    waterType: 'saltwater',
    excerpt: 'Pest anemone infestation in reef tanks',
  },
  {
    _type: 'problem',
    _id: 'problem-high-nitrite',
    title: 'High Nitrite',
    slug: { _type: 'slug', current: 'problem-high-nitrite' },
    category: 'water',
    waterType: 'freshwater',
    excerpt: 'Toxic nitrogen cycle intermediate harmful to fish',
  },
  {
    _type: 'problem',
    _id: 'problem-high-nitrate',
    title: 'High Nitrate',
    slug: { _type: 'slug', current: 'problem-high-nitrate' },
    category: 'water',
    waterType: 'freshwater',
    excerpt: 'Algae driver and long-term fish health concern',
  },
  {
    _type: 'problem',
    _id: 'problem-ph-crash',
    title: 'pH Crash',
    slug: { _type: 'slug', current: 'problem-ph-crash' },
    category: 'water',
    waterType: 'freshwater',
    excerpt: 'Rapid dangerous drop in aquarium pH',
  },
  {
    _type: 'problem',
    _id: 'problem-heater-stuck-on',
    title: 'Heater Stuck On',
    slug: { _type: 'slug', current: 'problem-heater-stuck-on' },
    category: 'equipment',
    waterType: 'freshwater',
    excerpt: 'Heater malfunction causing overheating',
  },
  {
    _type: 'problem',
    _id: 'problem-heater-stuck-off',
    title: 'Heater Stuck Off',
    slug: { _type: 'slug', current: 'problem-heater-stuck-off' },
    category: 'equipment',
    waterType: 'freshwater',
    excerpt: 'Heater failure causing temperature drop',
  },
  {
    _type: 'problem',
    _id: 'problem-ph-drift',
    title: 'pH Drift',
    slug: { _type: 'slug', current: 'problem-ph-drift' },
    category: 'water',
    waterType: 'freshwater',
    excerpt: 'Gradual pH change over time',
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Phase 14 Batch 4: Coral, Plant, Equipment, Problem Creation ===\n');

  const summary = { corals: [], plants: [], equipment: [], problems: [], errors: [] };

  // ── Corals ──
  console.log('--- Creating Corals ---');
  for (const coral of CORALS) {
    const id = coral._id;
    const { _id, ...doc } = coral;
    const result = await createDoc(id, doc);
    summary.corals.push({ name: coral.name, id, ...result });
    if (!result.success) summary.errors.push({ type: 'coral', name: coral.name, error: result.error });
    console.log(`  ${result.success ? 'OK' : 'FAIL'}: ${coral.name} -> ${id} (${result.operation || result.error})`);
  }

  // ── Plants ──
  console.log('\n--- Creating Plants ---');
  for (const plant of PLANTS) {
    const id = plant._id;
    const { _id, ...doc } = plant;
    const result = await createDoc(id, doc);
    summary.plants.push({ name: plant.name, id, ...result });
    if (!result.success) summary.errors.push({ type: 'plant', name: plant.name, error: result.error });
    console.log(`  ${result.success ? 'OK' : 'FAIL'}: ${plant.name} -> ${id} (${result.operation || result.error})`);
  }

  // ── Equipment ──
  console.log('\n--- Creating Equipment ---');
  for (const equip of EQUIPMENT) {
    const id = equip._id;
    const { _id, ...doc } = equip;
    const result = await createDoc(id, doc);
    summary.equipment.push({ name: equip.name, id, ...result });
    if (!result.success) summary.errors.push({ type: 'equipment', name: equip.name, error: result.error });
    console.log(`  ${result.success ? 'OK' : 'FAIL'}: ${equip.name} -> ${id} (${result.operation || result.error})`);
  }

  // ── Problems ──
  console.log('\n--- Creating Problems ---');
  for (const prob of PROBLEMS) {
    const id = prob._id;
    const { _id, ...doc } = prob;
    const result = await createDoc(id, doc);
    summary.problems.push({ title: prob.title, id, ...result });
    if (!result.success) summary.errors.push({ type: 'problem', title: prob.title, error: result.error });
    console.log(`  ${result.success ? 'OK' : 'FAIL'}: ${prob.title} -> ${id} (${result.operation || result.error})`);
  }

  // ── Summary ──
  const totals = {
    corals: summary.corals.length,
    plants: summary.plants.length,
    equipment: summary.equipment.length,
    problems: summary.problems.length,
    errors: summary.errors.length,
  };

  console.log('\n=== Summary ===');
  console.log(`  Corals:    ${totals.corals}`);
  console.log(`  Plants:    ${totals.plants}`);
  console.log(`  Equipment: ${totals.equipment}`);
  console.log(`  Problems:  ${totals.problems}`);
  console.log(`  Errors:    ${totals.errors}`);

  if (totals.errors > 0) {
    console.log('\n=== Errors ===');
    for (const err of summary.errors) {
      console.log(`  ${err.type} "${err.name || err.title}": ${err.error}`);
    }
  }

  if (!fs.existsSync('report')) fs.mkdirSync('report', { recursive: true });
  fs.writeFileSync('report/phase14-batch4-mixed.json', JSON.stringify(summary, null, 2));
  console.log('\nWrote report/phase14-batch4-mixed.json');
}

main().catch(console.error);
