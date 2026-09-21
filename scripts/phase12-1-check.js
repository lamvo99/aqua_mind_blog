const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
const tokenMatch = envContent.match(/SANITY_API_TOKEN="([^"]+)"/);
const TOKEN = tokenMatch ? tokenMatch[1] : null;
const API_BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const MUTATE_BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/mutate/production';
const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` };

async function fetchQ(query) {
  const q = encodeURIComponent(query);
  const res = await fetch(`${API_BASE}?query=${q}`);
  return (await res.json()).result || [];
}

async function patchDoc(id, patch, name) {
  const body = { mutations: [{ patch: { id, set: patch } }] };
  const res = await fetch(MUTATE_BASE, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (data.error) { console.error(`  ERROR ${name}: ${data.error.message}`); return false; }
  console.log(`  OK: ${name}`);
  return true;
}

async function main() {
  // Check duplicate Cherry Shrimp entries
  console.log('=== CHERRY SHRIMP DUPLICATES ===');
  const cherry = await fetchQ(`*[_type == "invertebrate" && name match "Cherry"] {_id, name, scientificName, slug}`);
  for (const c of cherry) {
    console.log(`  ${c.name} (${c._id}) - sci: ${c.scientificName} - slug: ${c.slug?.current}`);
  }

  // Check Mushroom Coral
  console.log('\n=== MUSHROOM CORAL ===');
  const mushroom = await fetchQ(`*[_type == "coral" && name match "Mushroom"] {_id, name, slug}`);
  console.log(`Mushroom coral search: ${mushroom.length} results`);
  for (const m of mushroom) console.log(`  ${m.name} (${m._id})`);

  // Check Sinularia
  console.log('\n=== SINULARIA ===');
  const sin = await fetchQ(`*[_type == "coral" && (name match "Sinularia" || name match "Leather")] {_id, name, slug}`);
  for (const s of sin) console.log(`  ${s.name} (${s._id})`);

  // Check what "Neocaridina" resolves to
  console.log('\n=== NEOCARIDINA ENTITIES ===');
  const neo = await fetchQ(`*[_type == "invertebrate" && name match "Neocaridina" || scientificName match "Neocaridina"] {_id, name, scientificName}`);
  for (const n of neo) console.log(`  ${n.name} (${n._id}) - sci: ${n.scientificName}`);

  // Check all entities with "Angelfish" in name
  console.log('\n=== ANGELFISH ENTITIES ===');
  const ang = await fetchQ(`*[_type == "species" && name match "Angelfish"] {_id, name, scientificName}`);
  for (const a of ang) console.log(`  ${a.name} (${a._id}) - sci: ${a.scientificName}`);
}

main().catch(console.error);
