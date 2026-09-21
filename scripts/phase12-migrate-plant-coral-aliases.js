const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
const tokenMatch = envContent.match(/SANITY_API_TOKEN="([^"]+)"/);
const TOKEN = tokenMatch ? tokenMatch[1] : null;
const API_BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const MUTATE_BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/mutate/production';
const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` };

async function fetchAll(type) {
  const q = encodeURIComponent(`*[_type == "${type}"]{_id, name, scientificName, slug}`);
  const res = await fetch(`${API_BASE}?query=${q}`);
  return (await res.json()).result || [];
}

const PLANT_UPDATES = [
  // Well-known plant aliases
  { match: (i) => i.name === 'Amazon Sword', aliases: ['Echinodorus', 'Amazon Green'], group: 'Rosette' },
  { match: (i) => i.name === 'Java Fern', aliases: ['Microsorum pteropus', 'Windeløv Fern'], group: 'Fern' },
  { match: (i) => i.name === 'Anubias', aliases: ['Anubias barteri'], group: 'Rhizome' },
  { match: (i) => i.name === 'Java Moss', aliases: ['Taxiphyllum barbieri', 'Christmas Moss'], group: 'Moss' },
  { match: (i) => i.name === 'Dwarf Sagittaria', aliases: ['Dwarf Sag'], group: 'Stolon' },
  { match: (i) => i.name === 'Ludwigia Repens', aliases: ['Red Star', 'Ludwigia Red'], group: 'Stem' },
  { match: (i) => i.name === 'Rotala Rotundifolia', aliases: ['Rotala Green', 'Round-leaf Rotala'], group: 'Stem' },
  { match: (i) => i.name === 'Alternanthera Reineckii', aliases: ['AR', 'Red Alternanthera'], group: 'Stem' },
  { match: (i) => i.name === 'Vallisneria', aliases: ['Val', 'Jungle Val', 'Eelgrass'], group: 'Stolon' },
  { match: (i) => i.name === 'Bucephalandra', aliases: ['Buce', 'Buceph'], group: 'Rhizome' },
  { match: (i) => i.name === 'Cryptocoryne Wendtii', aliases: ['Crypt Wendtii', 'Brown Crypt'], group: 'Rosette' },
  { match: (i) => i.name === 'Hornwort', aliases: ['Coontail', 'Ceratophyllum'], group: 'Floating' },
  { match: (i) => i.name === 'Water Sprite', aliases: ['Ceratopteris', 'Pteroid'], group: 'Floating' },
  { match: (i) => i.name === 'Elodea', aliases: ['Anacharis', 'Brazilian Elodea'], group: 'Stem' },
  { match: (i) => i.name === 'Guppy Grass', aliases: ['Najas guadalupensis'], group: 'Floating' },
];

const CORAL_UPDATES = [
  { match: (i) => i.name === 'Zoanthids', aliases: ['Zoas', 'Zoa', 'Button Polyps'], group: 'Polyp' },
  { match: (i) => i.name === 'Palythoa', aliases: ['Paly', 'Palythoa Polyps'], group: 'Polyp' },
  { match: (i) => i.name === 'Mushroom Coral', aliases: ['Disc Mushroom', 'Ricordea'], group: 'Mushroom' },
  { match: (i) => i.name === 'Hammer Coral', aliases: ['Euphyllia ancora', 'Anchor Coral'], group: 'LPS' },
  { match: (i) => i.name === 'Torch Coral', aliases: ['Euphyllia glabrescens'], group: 'LPS' },
  { match: (i) => i.name === 'Frogspawn Coral', aliases: ['Euphyllia divisa'], group: 'LPS' },
  { match: (i) => i.name === 'Bubble Coral', aliases: ['Plerogyra sinuosa'], group: 'LPS' },
  { match: (i) => i.name === 'Open Brain Coral', aliases: ['Trachyphyllia', 'Trachy'], group: 'LPS' },
  { match: (i) => i.name === 'Acropora', aliases: ['Acro', 'SPS Acro'], group: 'SPS' },
  { match: (i) => i.name === 'Montipora', aliases: ['Monti'], group: 'SPS' },
  { match: (i) => i.name === 'Bird\'s Nest Coral', aliases: ['Seriatopora'], group: 'SPS' },
  { match: (i) => i.name === 'Duncan Coral', aliases: ['Duncanopsammia', 'Duncanops'], group: 'LPS' },
  { match: (i) => i.name === 'Fungia Coral', aliases: ['Plate Coral', 'Disc Coral'], group: 'Single Polyp' },
  { match: (i) => i.name === 'Sinularia Leather', aliases: ['Finger Leather', 'Sinularia'], group: 'Soft' },
  { match: (i) => i.name === 'Toadstool Leather', aliases: ['Sarcophyton', 'Toadstool'], group: 'Soft' },
  { match: (i) => i.name === 'Xenia', aliases: ['Xenia Coral', 'Pulse Coral'], group: 'Soft' },
  { match: (i) => i.name === 'Goniopora', aliases: ['Flower Pot Coral'], group: 'LPS' },
  { match: (i) => i.name === 'Alveopora Coral', aliases: ['Alveopora'], group: 'LPS' },
];

async function patchDoc(id, patch) {
  const body = { mutations: [{ patch: { id, set: patch } }] };
  const res = await fetch(MUTATE_BASE, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (data.error) { console.error(`  ERROR ${id}: ${data.error.message}`); return false; }
  return true;
}

async function main() {
  const plants = await fetchAll('plant');
  const corals = await fetchAll('coral');
  
  let ok = 0, err = 0;
  
  for (const update of PLANT_UPDATES) {
    const item = plants.find(update.match);
    if (!item) continue;
    const patch = {};
    if (update.aliases) patch.aliases = update.aliases;
    if (update.group) patch.group = update.group;
    if (await patchDoc(item._id, patch)) { ok++; console.log(`  plant: ${item.name}`); } else err++;
  }
  
  for (const update of CORAL_UPDATES) {
    const item = corals.find(update.match);
    if (!item) continue;
    const patch = {};
    if (update.aliases) patch.aliases = update.aliases;
    if (update.group) patch.group = update.group;
    if (await patchDoc(item._id, patch)) { ok++; console.log(`  coral: ${item.name}`); } else err++;
  }
  
  console.log(`\nDone: ${ok} OK, ${err} errors`);
}

main().catch(console.error);
