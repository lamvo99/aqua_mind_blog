const fs = require('fs');

// 1. Read SANITY_API_TOKEN from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const tokenMatch = envContent.match(/SANITY_API_TOKEN="([^"]+)"/);
const TOKEN = tokenMatch ? tokenMatch[1] : null;

const PROJECT_ID = 'zeohjejw';
const DATASET = 'production';
const API_VERSION = '2026-05-25';
const API_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;

const TYPES = ['species', 'plant', 'coral', 'invertebrate', 'equipment', 'problem', 'inspiration'];

// Fields to fetch per domain
const BASE_FIELDS = '_id, name, scientificName, slug, waterType, group, region, aquariumStyle, difficulty, light, co2, coralType, category, isPredator, reefCompatibility, photosynthetic, growthForm, redPlant, localNames, aliases, parentSpecies, mainImage';

async function fetchAll(type) {
  const fields = BASE_FIELDS;
  const query = `*[_type == "${type}"]{${fields}}`;
  const q = encodeURIComponent(query);
  const url = `${API_BASE}?query=${q}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.result || [];
}

function findDuplicates(items, keyFn) {
  const map = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    if (!map[key]) map[key] = [];
    map[key].push({ id: item._id, name: item.name });
  }
  return Object.entries(map).filter(([k, v]) => v.length > 1);
}

async function main() {
  const fs = require('fs');
  if (!fs.existsSync('report')) fs.mkdirSync('report', { recursive: true });

  const all = {};
  const summary = {};

  for (const t of TYPES) {
    const items = await fetchAll(t);
    all[t] = items;

    const published = items.filter(i => !i._id.startsWith('drafts.'));
    const drafts = items.filter(i => i._id.startsWith('drafts.'));

    const slugDupes = findDuplicates(items, i => i.slug?.current);
    const sciDupes = findDuplicates(items, i => i.scientificName);

    summary[t] = {
      total: items.length,
      published: published.length,
      drafts: drafts.length,
      duplicateSlugs: slugDupes.length,
      duplicateScientificNames: sciDupes.length,
    };

    console.log(`${t}: ${published.length} published, ${drafts.length} drafts (${items.length} total)`);
    if (slugDupes.length) {
      console.log(`  DUPE SLUGS: ${slugDupes.map(([k]) => k).join(', ')}`);
    }
    if (sciDupes.length) {
      console.log(`  DUPE SCI: ${sciDupes.map(([k]) => k).join(', ')}`);
    }
  }

  fs.writeFileSync('report/phase13-full-inventory.json', JSON.stringify(all, null, 2));
  fs.writeFileSync('report/phase13-baseline.json', JSON.stringify(summary, null, 2));

  console.log('\nWrote report/phase13-full-inventory.json');
  console.log('Wrote report/phase13-baseline.json');
}

main().catch(console.error);
