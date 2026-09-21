const fs = require('fs');

// 1. Read SANITY_API_TOKEN from .env.local
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

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Check if doc already exists by slug
async function docExists(type, slug) {
  const q = encodeURIComponent(`count(*[_type == "${type}" && slug.current == "${slug}"]) > 0`);
  const res = await fetch(`${QUERY_BASE}?query=${q}`);
  const data = await res.json();
  return data.result === true;
}

async function createDoc(type, doc) {
  const body = {
    mutations: [{ create: { _type: type, ...doc } }],
  };
  const res = await fetch(MUTATE_BASE, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  return data;
}

// ── Marine Fish (21 species) ──
const MARINE_FISH = [
  {
    name: 'Maroon Clownfish',
    scientificName: 'Premnas biaculeatus',
    difficulty: 'Beginner',
    sizeCm: 15,
    tankSizeMinL: 100,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Omnivore',
    temperament: 'Aggressive',
    waterZone: 'Middle',
    aquariumStyle: ['Mixed Reef', 'Anemone / Clownfish'],
    group: 'Other',
    isPredator: true,
    reefCompatibility: true,
    excerpt: 'A bold and territorial clownfish known for its deep maroon color and white stripes. Often hosts in bubble-tip anemones and can be aggressive toward tankmates.',
  },
  {
    name: 'Tomato Clownfish',
    scientificName: 'Amphiprion frenatus',
    difficulty: 'Beginner',
    sizeCm: 10,
    tankSizeMinL: 100,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Omnivore',
    temperament: 'Semi-aggressive',
    waterZone: 'Middle',
    aquariumStyle: ['Mixed Reef', 'Anemone / Clownfish'],
    group: 'Other',
    isPredator: true,
    reefCompatibility: true,
    excerpt: 'A hardy clownfish species with a vibrant red-orange body and a single white head bar. One of the easier saltwater clownfish to keep in home aquariums.',
  },
  {
    name: 'Clarkii Clownfish',
    scientificName: 'Amphiprion clarkii',
    difficulty: 'Beginner',
    sizeCm: 15,
    tankSizeMinL: 100,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Omnivore',
    temperament: 'Semi-aggressive',
    waterZone: 'Middle',
    aquariumStyle: ['Mixed Reef', 'Anemone / Clownfish'],
    group: 'Other',
    isPredator: true,
    reefCompatibility: true,
    excerpt: 'One of the most widespread clownfish species, adaptable to a wide range of conditions. Features yellow fins and dark bands, and readily hosts in many anemone species.',
  },
  {
    name: 'Purple Tang',
    scientificName: 'Zebrasoma xanthurum',
    difficulty: 'Intermediate',
    sizeCm: 20,
    tankSizeMinL: 300,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Herbivore',
    temperament: 'Semi-aggressive',
    waterZone: 'Middle',
    aquariumStyle: ['Mixed Reef'],
    group: 'Tang',
    isPredator: true,
    reefCompatibility: true,
    excerpt: 'A stunning tang with a deep purple body and yellow tail, prized for algae control. Requires ample swimming space and a varied herbivorous diet.',
  },
  {
    name: 'Powder Blue Tang',
    scientificName: 'Acanthurus leucosternon',
    difficulty: 'Intermediate',
    sizeCm: 25,
    tankSizeMinL: 400,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Herbivore',
    temperament: 'Semi-aggressive',
    waterZone: 'Middle',
    aquariumStyle: ['Mixed Reef'],
    group: 'Tang',
    isPredator: true,
    reefCompatibility: true,
    excerpt: 'An iconic saltwater fish with a powder-blue body, white face, and bright yellow tail. Beautiful but prone to Ich; needs pristine water quality and a large tank.',
  },
  {
    name: 'Queen Angelfish',
    scientificName: 'Holacanthus ciliaris',
    difficulty: 'Intermediate',
    sizeCm: 35,
    tankSizeMinL: 400,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Omnivore',
    temperament: 'Semi-aggressive',
    waterZone: 'Middle',
    aquariumStyle: ['Mixed Reef'],
    group: 'Angelfish',
    isPredator: false,
    reefCompatibility: false,
    excerpt: 'A Caribbean icon with vivid blue and yellow coloration and a distinctive blue-ringed eye spot. Grows large and may nip at corals in reef setups.',
  },
  {
    name: 'Cleaner Wrasse',
    scientificName: 'Labroides dimidiatus',
    difficulty: 'Advanced',
    sizeCm: 10,
    tankSizeMinL: 200,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Carnivore',
    temperament: 'Peaceful',
    waterZone: 'Middle',
    aquariumStyle: ['Mixed Reef'],
    group: 'Wrasse',
    isPredator: true,
    reefCompatibility: true,
    excerpt: 'A specialized parasite-eating wrasse that sets up cleaning stations for other fish. Difficult to keep as it relies on parasites from tankmates for nutrition.',
  },
  {
    name: 'Melanurus Wrasse',
    scientificName: 'Halichoeres melanurus',
    difficulty: 'Intermediate',
    sizeCm: 15,
    tankSizeMinL: 200,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Carnivore',
    temperament: 'Peaceful',
    waterZone: 'Middle',
    aquariumStyle: ['Mixed Reef'],
    group: 'Wrasse',
    isPredator: true,
    reefCompatibility: true,
    excerpt: 'A colorful wrasse with vibrant blue-green stripes and a distinctive tail pattern. Active and reef-safe, it helps control pyramid snails and small pests.',
  },
  {
    name: 'Flasher Wrasse',
    scientificName: 'Paracheilinus filamentosus',
    difficulty: 'Intermediate',
    sizeCm: 10,
    tankSizeMinL: 200,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Carnivore',
    temperament: 'Peaceful',
    waterZone: 'Middle',
    aquariumStyle: ['Mixed Reef'],
    group: 'Wrasse',
    isPredator: true,
    reefCompatibility: true,
    excerpt: 'A dazzling wrasse known for its rapid fin-flashing display during courtship. Males display brilliant orange and blue colors, making them a reef tank showpiece.',
  },
  {
    name: 'Raccoon Butterflyfish',
    scientificName: 'Chaetodon lunula',
    difficulty: 'Intermediate',
    sizeCm: 20,
    tankSizeMinL: 300,
    tempMinC: 24,
    tempMaxC: 28,
    diet: 'Omnivore',
    temperament: 'Semi-aggressive',
    waterZone: 'Middle',
    aquariumStyle: ['Mixed Reef'],
    group: 'Butterflyfish',
    isPredator: false,
    reefCompatibility: false,
    excerpt: 'A recognizable butterflyfish with a dark raccoon-like mask across its eyes. Hardy for a butterflyfish but may nip at coral polyps in reef tanks.',
  },
  {
    name: 'Longnose Butterflyfish',
    scientificName: 'Forcipiger flavissimus',
    difficulty: 'Intermediate',
    sizeCm: 20,
    tankSizeMinL: 300,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Carnivore',
    temperament: 'Peaceful',
    waterZone: 'Middle',
    aquariumStyle: ['Mixed Reef'],
    group: 'Butterflyfish',
    isPredator: false,
    reefCompatibility: false,
    excerpt: 'A striking butterflyfish with an extremely elongated snout for picking small invertebrates from crevices. Can be finicky about feeding in captivity.',
  },
  {
    name: 'Snowflake Eel',
    scientificName: 'Echidna nebulosa',
    difficulty: 'Beginner',
    sizeCm: 50,
    tankSizeMinL: 200,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Carnivore',
    temperament: 'Semi-aggressive',
    waterZone: 'Bottom',
    aquariumStyle: ['Mixed Reef'],
    group: 'Other',
    isPredator: true,
    reefCompatibility: false,
    excerpt: 'A hardy moray eel with a white body covered in dark snowflake-like spots. Generally reef-safe but may eat small fish and invertebrates it can fit in its mouth.',
  },
  {
    name: 'Longnose Hawkfish',
    scientificName: 'Oxycirrhites typus',
    difficulty: 'Intermediate',
    sizeCm: 13,
    tankSizeMinL: 200,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Carnivore',
    temperament: 'Semi-aggressive',
    waterZone: 'Middle',
    aquariumStyle: ['Mixed Reef'],
    group: 'Other',
    isPredator: false,
    reefCompatibility: false,
    excerpt: 'A distinctive hawkfish with a long pointed snout and red-and-white checkered pattern. Perches on gorgonians and may prey on small shrimp.',
  },
  {
    name: 'Arc-eye Hawkfish',
    scientificName: 'Paracirrhites arcatus',
    difficulty: 'Intermediate',
    sizeCm: 13,
    tankSizeMinL: 200,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Carnivore',
    temperament: 'Semi-aggressive',
    waterZone: 'Middle',
    aquariumStyle: ['Mixed Reef'],
    group: 'Other',
    isPredator: false,
    reefCompatibility: false,
    excerpt: 'A colorful hawkfish with a distinctive arc-shaped marking around its eye and red-brown body stripes. Perches on coral heads and may eat small ornamental shrimp.',
  },
  {
    name: 'Diamond Watchman Goby',
    scientificName: 'Valenciennea puellaris',
    difficulty: 'Beginner',
    sizeCm: 10,
    tankSizeMinL: 100,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Carnivore',
    temperament: 'Peaceful',
    waterZone: 'Bottom',
    aquariumStyle: ['Mixed Reef'],
    group: 'Goby',
    isPredator: true,
    reefCompatibility: true,
    excerpt: 'A beneficial sand-sifting goby that constantly filters sand through its mouth, keeping the substrate clean. Peaceful and excellent for reef aquariums.',
  },
  {
    name: 'Bicolor Blenny',
    scientificName: 'Ecsenius bicolor',
    difficulty: 'Beginner',
    sizeCm: 10,
    tankSizeMinL: 100,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Herbivore',
    temperament: 'Peaceful',
    waterZone: 'Bottom',
    aquariumStyle: ['Mixed Reef'],
    group: 'Blenny',
    isPredator: true,
    reefCompatibility: true,
    excerpt: 'A small, entertaining blenny with a dark front half and orange-yellow rear. Feeds on algae and is an excellent addition to reef tanks for algae control.',
  },
  {
    name: 'Queen Triggerfish',
    scientificName: 'Balistoides vetula',
    difficulty: 'Intermediate',
    sizeCm: 50,
    tankSizeMinL: 500,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Carnivore',
    temperament: 'Aggressive',
    waterZone: 'Middle',
    aquariumStyle: ['Marine Predator'],
    group: 'Other',
    isPredator: true,
    reefCompatibility: false,
    excerpt: 'A large, powerful triggerfish with iridescent blue facial markings and a sturdy dorsal spine. Can be aggressive and may rearrange rockwork or eat invertebrates.',
  },
  {
    name: 'Black Cap Basslet',
    scientificName: 'Gramma melacara',
    difficulty: 'Intermediate',
    sizeCm: 10,
    tankSizeMinL: 100,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Carnivore',
    temperament: 'Peaceful',
    waterZone: 'Bottom',
    aquariumStyle: ['Mixed Reef'],
    group: 'Other',
    isPredator: true,
    reefCompatibility: true,
    excerpt: 'A gorgeous basslet with a deep purple body and black cap extending from head to dorsal fin. Shy but beautiful, prefers caves and overhangs in reef tanks.',
  },
  {
    name: "Bartlett's Anthias",
    scientificName: 'Pseudanthias bartlettorum',
    difficulty: 'Intermediate',
    sizeCm: 8,
    tankSizeMinL: 100,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Carnivore',
    temperament: 'Peaceful',
    waterZone: 'Middle',
    aquariumStyle: ['Mixed Reef'],
    group: 'Other',
    isPredator: true,
    reefCompatibility: true,
    excerpt: 'A stunning schooling anthias with vibrant orange-pink coloration. Males display a distinctive purple dorsal stripe; best kept in groups in reef aquariums.',
  },
  {
    name: 'Pajama Cardinalfish',
    scientificName: 'Sphaeramia nematoptera',
    difficulty: 'Beginner',
    sizeCm: 8,
    tankSizeMinL: 100,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Carnivore',
    temperament: 'Peaceful',
    waterZone: 'Middle',
    aquariumStyle: ['Mixed Reef'],
    group: 'Other',
    isPredator: true,
    reefCompatibility: true,
    excerpt: 'A peaceful, slow-moving cardinalfish with red spots on its rear half and a dark vertical band. A mouthbrooder that is easy to care for in reef systems.',
  },
  {
    name: 'Stars and Stripes Puffer',
    scientificName: 'Arothron hispidus',
    difficulty: 'Intermediate',
    sizeCm: 50,
    tankSizeMinL: 500,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    diet: 'Carnivore',
    temperament: 'Semi-aggressive',
    waterZone: 'Middle',
    aquariumStyle: ['Marine Predator'],
    group: 'Puffer',
    isPredator: true,
    reefCompatibility: false,
    excerpt: 'A large pufferfish with white spots and radiating stripes resembling the American flag. Known to eat invertebrates and may nip at corals.',
  },
];

// ── Marine Invertebrates (8 species) ──
const MARINE_INVERTEBRATES = [
  {
    name: 'Sebae Anemone',
    scientificName: 'Heteractis crispa',
    group: 'anemone',
    sizeCm: 30,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    difficulty: 'Intermediate',
    diet: 'Filter feeder',
    temperament: 'Peaceful',
    aquariumStyle: ['Mixed Reef', 'Anemone / Clownfish'],
    reefCompatibility: true,
    excerpt: 'A hardy host anemone with long tentacles tipped in white or purple. Commonly paired with clownfish and thrives under moderate to high lighting.',
  },
  {
    name: 'Magnificent Anemone',
    scientificName: 'Heteractis magnifica',
    group: 'anemone',
    sizeCm: 30,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    difficulty: 'Advanced',
    diet: 'Filter feeder',
    temperament: 'Peaceful',
    aquariumStyle: ['Mixed Reef', 'Anemone / Clownfish'],
    reefCompatibility: true,
    excerpt: 'One of the most beautiful but demanding anemones, with vibrant green or purple tentacles and a brightly colored oral disc. Requires intense lighting and stable water parameters.',
  },
  {
    name: 'Chocolate Chip Starfish',
    scientificName: 'Protoreaster nodosus',
    group: 'starfish',
    sizeCm: 25,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    difficulty: 'Beginner',
    diet: 'Scavenger',
    temperament: 'Peaceful',
    aquariumStyle: ['Mixed Reef'],
    reefCompatibility: false,
    excerpt: 'A distinctive starfish with dark brown tubercles resembling chocolate chips on a lighter body. Hardy but may consume corals and small invertebrates.',
  },
  {
    name: 'Fromia Starfish',
    scientificName: 'Fromia nodosa',
    group: 'starfish',
    sizeCm: 15,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    difficulty: 'Beginner',
    diet: 'Scavenger',
    temperament: 'Peaceful',
    aquariumStyle: ['Mixed Reef'],
    reefCompatibility: false,
    excerpt: 'An attractive starfish with a geometric pattern of orange and cream plates. Generally reef-safe but may starve without adequate microfilm and detritus in the tank.',
  },
  {
    name: 'Trochus Snail',
    scientificName: 'Trochus maculatus',
    group: 'snail',
    sizeCm: 2,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    difficulty: 'Beginner',
    diet: 'Herbivore',
    temperament: 'Peaceful',
    aquariumStyle: ['Mixed Reef'],
    reefCompatibility: false,
    excerpt: 'A conical-shaped algae-eating snail that is one of the most effective and hardy cleanup crew members for reef aquariums. Can right itself if overturned.',
  },
  {
    name: 'Astraea Snail',
    scientificName: 'Astrea tecta',
    group: 'snail',
    sizeCm: 2,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    difficulty: 'Beginner',
    diet: 'Herbivore',
    temperament: 'Peaceful',
    aquariumStyle: ['Mixed Reef'],
    reefCompatibility: false,
    excerpt: 'A small, cone-shaped snail that excels at consuming film algae from glass and rocks. Essential for reef tank maintenance but cannot right itself if flipped over.',
  },
  {
    name: 'Pom-Pom Crab',
    scientificName: 'Lybia tessellata',
    group: 'crab',
    sizeCm: 3,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    difficulty: 'Beginner',
    diet: 'Omnivore',
    temperament: 'Peaceful',
    aquariumStyle: ['Mixed Reef'],
    reefCompatibility: false,
    excerpt: 'A tiny, fascinating crab that carries small anemones in its claws like pom-poms for defense and food capture. Harmless and entertaining in reef aquariums.',
  },
  {
    name: 'Pencil Urchin',
    scientificName: 'Heterocentrotus mamillatus',
    group: 'urchin',
    sizeCm: 15,
    tempMinC: 24,
    tempMaxC: 28,
    phMin: 8.0,
    phMax: 8.4,
    difficulty: 'Beginner',
    diet: 'Herbivore',
    temperament: 'Peaceful',
    aquariumStyle: ['Mixed Reef'],
    reefCompatibility: false,
    excerpt: 'A large urchin with thick, blunt spines resembling pencils. An excellent algae grazer that may inadvertently knock over small corals or unsecured rockwork.',
  },
];

function mapWaterZone(zone) {
  const map = {
    'top': 'Top',
    'middle': 'Middle',
    'bottom': 'Bottom',
    'all levels': 'All levels',
    'high rock': 'Middle',
  };
  return map[zone.toLowerCase()] || 'Middle';
}

async function main() {
  const results = [];
  const errors = [];
  let created = 0;
  let skipped = 0;

  // Create marine fish (type: species)
  console.log('\n=== Creating Marine Fish Species ===');
  for (const fish of MARINE_FISH) {
    const slug = slugify(fish.name);
    const exists = await docExists('species', slug);
    if (exists) {
      console.log(`  SKIP (exists): ${fish.name}`);
      skipped++;
      results.push({ name: fish.name, type: 'species', slug, status: 'skipped', id: null });
      continue;
    }

    const doc = {
      name: fish.name,
      scientificName: fish.scientificName,
      slug: { _type: 'slug', current: slug },
      waterType: 'saltwater',
      group: fish.group,
      difficulty: fish.difficulty,
      sizeCm: fish.sizeCm,
      tankSizeMinL: fish.tankSizeMinL,
      tempMinC: fish.tempMinC,
      tempMaxC: fish.tempMaxC,
      phMin: fish.phMin,
      phMax: fish.phMax,
      diet: fish.diet,
      temperament: fish.temperament,
      waterZone: mapWaterZone(fish.waterZone),
      aquariumStyle: fish.aquariumStyle,
      isPredator: fish.isPredator,
      reefCompatibility: fish.reefCompatibility,
      excerpt: fish.excerpt,
    };

    const res = await createDoc('species', doc);
    if (res.error) {
      console.error(`  ERROR: ${fish.name} — ${res.error.message}`);
      errors.push({ name: fish.name, error: res.error.message });
      results.push({ name: fish.name, type: 'species', slug, status: 'error', id: null, error: res.error.message });
    } else {
      const id = res.results?.[0]?.id || 'unknown';
      console.log(`  OK: ${fish.name} → ${id}`);
      created++;
      results.push({ name: fish.name, type: 'species', slug, status: 'created', id });
    }
  }

  // Create marine invertebrates (type: invertebrate)
  console.log('\n=== Creating Marine Invertebrates ===');
  for (const inv of MARINE_INVERTEBRATES) {
    const slug = slugify(inv.name);
    const exists = await docExists('invertebrate', slug);
    if (exists) {
      console.log(`  SKIP (exists): ${inv.name}`);
      skipped++;
      results.push({ name: inv.name, type: 'invertebrate', slug, status: 'skipped', id: null });
      continue;
    }

    const doc = {
      name: inv.name,
      scientificName: inv.scientificName,
      slug: { _type: 'slug', current: slug },
      waterType: 'saltwater',
      group: inv.group,
      sizeCm: inv.sizeCm,
      tempMinC: inv.tempMinC,
      tempMaxC: inv.tempMaxC,
      phMin: inv.phMin,
      phMax: inv.phMax,
      difficulty: inv.difficulty,
      diet: inv.diet,
      temperament: inv.temperament,
      aquariumStyle: inv.aquariumStyle,
      reefCompatibility: inv.reefCompatibility,
      excerpt: inv.excerpt,
    };

    const res = await createDoc('invertebrate', doc);
    if (res.error) {
      console.error(`  ERROR: ${inv.name} — ${res.error.message}`);
      errors.push({ name: inv.name, error: res.error.message });
      results.push({ name: inv.name, type: 'invertebrate', slug, status: 'error', id: null, error: res.error.message });
    } else {
      const id = res.results?.[0]?.id || 'unknown';
      console.log(`  OK: ${inv.name} → ${id}`);
      created++;
      results.push({ name: inv.name, type: 'invertebrate', slug, status: 'created', id });
    }
  }

  // Summary
  const summary = {
    generatedAt: new Date().toISOString(),
    totalEntities: MARINE_FISH.length + MARINE_INVERTEBRATES.length,
    created,
    skipped,
    errors: errors.length,
    results,
    errorDetails: errors,
  };

  console.log('\n=== SUMMARY ===');
  console.log(`  Total: ${summary.totalEntities} | Created: ${created} | Skipped: ${skipped} | Errors: ${errors.length}`);
  console.log(JSON.stringify(summary, null, 2));

  if (!fs.existsSync('report')) fs.mkdirSync('report', { recursive: true });
  fs.writeFileSync('report/phase14-batch3-marine.json', JSON.stringify(summary, null, 2));
  console.log('\nWrote report/phase14-batch3-marine.json');
}

main().catch(console.error);
