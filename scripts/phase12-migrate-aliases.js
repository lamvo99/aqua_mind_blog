const API_BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const MUTATE_BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/mutate/production';
const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
const tokenMatch = envContent.match(/SANITY_API_TOKEN="([^"]+)"/);
const TOKEN = tokenMatch ? tokenMatch[1] : null;
if (!TOKEN) { console.error('No SANITY_API_TOKEN found'); process.exit(1); }
console.log('Token length:', TOKEN.length);

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`,
};

// Verified aliases and local names
const SPECIES_UPDATES = [
  // Arowana — Vietnamese trade names (verified)
  { id: 'species-scleropages-formosus', localNames: ['Huyết Long', 'Thanh Long'], aliases: ['Dragon Fish', 'Asian Dragon Fish', 'Golden Dragon Fish'], group: 'Arowana' },
  { id: 'species-osteoglossum-bicirrhosum', localNames: ['Ngân Long'], aliases: ['Silver Dragon'], group: 'Arowana' },
  { id: 'species-scleropages-jardinii', localNames: ['Kim Long'], aliases: ['Jardinii', 'Australian Arowana', 'Northern Spearfish'], group: 'Arowana' },
  
  // Arapaima — Vietnamese trade name (verified)
  { id: 'species-arapaima-gigas', localNames: ['Hải Tượng Long'], aliases: ['Pirarucu', 'Paiche'], group: 'Characin' },
  
  // Piranha
  { id: 'species-pygocentrus-nattereri', aliases: ['Red-bellied Piranha', 'Red Piranha'], group: 'Characin' },
  { id: 'species-serrasalmus-rhombeus', aliases: ['Black Piranha', 'Black Diamond Piranha'], group: 'Characin' },
  
  // Bichir — aliases
  { id: 'Gk33CfLE6ahVd3Ve602cco', aliases: ['Dragon Polypterus', 'Ornate Polypterus'], group: 'Other' },
  { id: 'Gk33CfLE6ahVd3Ve602cqq', aliases: ['Dino Bichir', 'Armored Bichir'], group: 'Other' },
  { id: 'Gk33CfLE6ahVd3Ve602d2X', aliases: ['Dinosaur Eel', 'Saddled Bichir'], group: 'Other' },
  { id: 'sebdKYryWZgYP2rm3noGuQ', aliases: ['Dinosaur Bichir', 'Senegal Polypterus'], group: 'Other' },
  
  // Snakehead — aliases
  { id: 'G6zzfp6s5dlbun6AVzKgoN', aliases: ['Marulioides Snakehead', 'Emperor Channa'], group: 'Other' },
  { id: 'G6zzfp6s5dlbun6AVzKgu5', aliases: ['Rainbow Channa'], group: 'Other' },
  { id: 'PZ8Kai1VvEL468NS2LLZxZ', aliases: ['Barca Snakehead', 'Dwarf Channa'], group: 'Other' },
  { id: 'sebdKYryWZgYP2rm3noGMy', aliases: ['Murrel', 'Striped Snakehead', 'Common Snakehead'], group: 'Other' },
  
  // Pleco — Vietnamese trade names (nẻ variants — verified as common Vietnamese pleco terms)
  { id: 'species-ancistrus-cf-cirrhosus', localNames: ['Nẻ Nhật'], aliases: ['Bristlenose Catfish', 'BN Pleco', 'Bristlenose Pleco'], group: 'Pleco' },
  { id: 'J1Tx0fWCuGNPno99A6hsP7', localNames: ['Nẻ Điện'], aliases: ['Zebra Pleco', 'L046'], group: 'Pleco' },
  { id: 'ofTl1CTOUWuLwM28PxTEVj', localNames: ['Nẻ Bút'], aliases: ['Clown Pleco', 'Plecostomus Clown'], group: 'Pleco' },
  { id: 'species-hypostomus-plecostomus', localNames: ['Nẻ Sọc'], aliases: ['Common Pleco', 'Suckermouth Catfish'], group: 'Pleco' },
  { id: 'I9bI8W8ZWcEwyIzM9CuEcq', aliases: ['Royal Panaque', 'Royal Pleco', 'L018'], group: 'Pleco' },
  { id: 'I9bI8W8ZWcEwyIzM9CuG2u', aliases: ['L014', 'Leopard Frog Pleco'], group: 'Pleco' },
  
  // Corydoras
  { id: 'I9bI8W8ZWcEwyIzM9Ci1Vw', aliases: ['Cory Sterbai'], group: 'Catfish' },
  { id: 'ofTl1CTOUWuLwM28PxTCJT', aliases: ['Pygmy Catfish', 'Dwarf Corydoras'], group: 'Catfish' },
  { id: 'species-corydoras-aeneus', aliases: ['Bronze Catfish', 'Green Corydoras'], group: 'Catfish' },
  { id: 'species-corydoras-paleatus', aliases: ['Peppered Catfish'], group: 'Catfish' },
  { id: 'species-corydoras-panda', aliases: ['Panda Catfish'], group: 'Catfish' },
  { id: 'species-corydoras-trilineatus', aliases: ['Julii Cory', 'Three Stripe Corydoras'], group: 'Catfish' },
  
  // Goby
  { id: 'I9bI8W8ZWcEwyIzM9CjDNI', aliases: ['Brackish Goby'], group: 'Goby' },
  { id: 'I9bI8W8ZWcEwyIzM9DXMwe', aliases: ['Cleaner Goby', 'Neon Goby'], group: 'Goby' },
  { id: 'IlX7xILobrukz7d5Jo2V6E', aliases: ['Prawn Goby', 'Mandarin Prawn Goby'], group: 'Goby' },
  { id: 'IlX7xILobrukz7d5Jo2VIs', aliases: ['Fire Goby', 'Fire Dartfish'], group: 'Goby' },
  
  // Puffer
  { id: 'Gk33CfLE6ahVd3Ve602tRs', aliases: ['Balloonfish', 'Porcupinefish'], group: 'Puffer' },
  { id: 'J1Tx0fWCuGNPno99A79QPg', aliases: ['Dwarf Puffer', 'Pea Puffer', 'Malabar Puffer'], group: 'Puffer' },
  
  // Tang
  { id: 'G6zzfp6s5dlbun6AVzKmc5', aliases: ['Sailfin Surgeonfish', 'Pacific Sailfin Tang'], group: 'Tang' },
  { id: 'IlX7xILobrukz7d5JnvaIg', aliases: ['Palette Surgeonfish', 'Regal Tang', 'Dory'], group: 'Tang' },
  { id: 'J1Tx0fWCuGNPno99A7KH8y', aliases: ['Yellow Eye Kole Tang', 'Bristletooth Tang'], group: 'Tang' },
  { id: 'bXkDxvOEdfzf4NR9Z3S1rN', aliases: ['Orangestripe Tang', 'Naso Tang'], group: 'Tang' },
  { id: 'species-zebrasoma-flavescens', aliases: ['Yellow Surgeonfish'], group: 'Tang' },
  
  // Angelfish
  { id: '5oQB2MZ7gmZXjdwFqSs3qH', aliases: ['Pterophyllum', 'Freshwater Angelfish'], group: 'Cichlid' },
  { id: 'Gk33CfLE6ahVd3Ve602fPs', aliases: ['Imperial Angelfish'], group: 'Angelfish' },
  { id: 'IlX7xILobrukz7d5Jo2X54', aliases: ['Bispinosa Angelfish', 'Rock Beauty'], group: 'Angelfish' },
  { id: 'ofTl1CTOUWuLwM28PxTEbP', aliases: ['Herald\'s Angelfish'], group: 'Angelfish' },
  { id: 'species-pterophyllum-scalare', aliases: ['Marble Angelfish', 'Pterophyllum', 'Freshwater Angelfish'], group: 'Cichlid' },
];

// Vietnamese names for invertebrates (Cherry Shrimp variants)
const INVERT_UPDATES = [
  { id: 'invertebrate-neocaridina-davidi', localNames: ['Tôm Cherry'], aliases: ['Red Cherry Shrimp', 'RCS', 'Cherry Red Shrimp'], group: 'shrimp' },
  { id: '5oQB2MZ7gmZXjdwFqSs4kl', aliases: ['Red Cherry Shrimp', 'RCS'], group: 'shrimp' },
];

async function patchDoc(id, patch) {
  const body = {
    mutations: [{ patch: { id, set: patch } }],
  };
  const res = await fetch(MUTATE_BASE, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (data.error) {
    console.error(`  ERROR for ${id}:`, data.error.message);
    return false;
  }
  console.log(`  OK: ${id}`);
  return true;
}

async function main() {
  console.log('=== SPECIES UPDATES ===');
  let okCount = 0;
  let errCount = 0;
  
  for (const u of SPECIES_UPDATES) {
    const patch = {};
    if (u.localNames?.length) patch.localNames = u.localNames;
    if (u.aliases?.length) patch.aliases = u.aliases;
    if (u.group) patch.group = u.group;
    
    const ok = await patchDoc(u.id, patch);
    if (ok) okCount++; else errCount++;
  }
  
  console.log('\n=== INVERTEBRATE UPDATES ===');
  for (const u of INVERT_UPDATES) {
    const patch = {};
    if (u.localNames?.length) patch.localNames = u.localNames;
    if (u.aliases?.length) patch.aliases = u.aliases;
    if (u.group) patch.group = u.group;
    
    const ok = await patchDoc(u.id, patch);
    if (ok) okCount++; else errCount++;
  }
  
  console.log(`\nDone: ${okCount} OK, ${errCount} errors`);
}

main().catch(console.error);
