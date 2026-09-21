const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
const tokenMatch = envContent.match(/SANITY_API_TOKEN="([^"]+)"/);
const TOKEN = tokenMatch ? tokenMatch[1] : null;
const API_BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';

async function fetchQ(query) {
  const q = encodeURIComponent(query);
  const res = await fetch(`${API_BASE}?query=${q}`);
  return (await res.json()).result || [];
}

async function main() {
  // 1. Entity counts
  const types = ['species','plant','coral','invertebrate','equipment','problem','inspiration'];
  console.log('=== ENTITY COUNTS ===');
  for (const t of types) {
    const items = await fetchQ(`*[_type == "${t}"]{_id}`);
    const pub = items.filter(i => !i._id.startsWith('drafts.'));
    const draft = items.filter(i => i._id.startsWith('drafts.'));
    console.log(`${t}: ${pub.length} published, ${draft.length} drafts`);
  }

  // 2. Arowana records — full detail
  console.log('\n=== AROWANA RECORDS ===');
  const arowanas = await fetchQ(`*[_type == "species" && (name match "Arowana" || name match "arowana" || group == "Arowana")] {
    _id, name, scientificName, localNames, aliases, group, parentSpecies, slug
  }`);
  for (const a of arowanas) {
    console.log(`\n--- ${a.name} (${a._id}) ---`);
    console.log(`  scientificName: ${a.scientificName || 'NONE'}`);
    console.log(`  localNames: ${JSON.stringify(a.localNames || [])}`);
    console.log(`  aliases: ${JSON.stringify(a.aliases || [])}`);
    console.log(`  group: ${a.group || 'NONE'}`);
    console.log(`  parentSpecies: ${JSON.stringify(a.parentSpecies || null)}`);
    console.log(`  slug: ${a.slug?.current || 'NONE'}`);
  }

  // 3. Arapaima
  console.log('\n=== ARAPAIMA ===');
  const arapaima = await fetchQ(`*[_type == "species" && name == "Arapaima"] {
    _id, name, scientificName, localNames, aliases, group, parentSpecies
  }`);
  for (const a of arapaima) {
    console.log(`${a.name}: sci=${a.scientificName}, localNames=${JSON.stringify(a.localNames)}, aliases=${JSON.stringify(a.aliases)}, group=${a.group}`);
  }

  // 4. Search results for Vietnamese terms
  console.log('\n=== SEARCH: Vietnamese Terms ===');
  const vnTerms = ['Huyết Long', 'Kim Long', 'Ngân Long', 'Thanh Long', 'Hải Tượng Long'];
  for (const term of vnTerms) {
    const results = await fetchQ(`*[_type == "species" && (name match "${term}" || "${term}" in localNames || "${term}" in aliases)] {
      _id, name, scientificName, localNames, aliases
    }`);
    console.log(`\n"${term}" → ${results.length} result(s):`);
    for (const r of results) {
      console.log(`  ${r.name} (${r.scientificName}) — localNames: ${JSON.stringify(r.localNames)}, aliases: ${JSON.stringify(r.aliases)}`);
    }
  }

  // 5. Check for "Kim Long" across ALL species (collision check)
  console.log('\n=== COLLISION CHECK: Kim Long ===');
  const kimLongAll = await fetchQ(`*[_type == "species" && "Kim Long" in localNames] {
    _id, name, scientificName, localNames
  }`);
  console.log(`"Kim Long" in localNames across all species: ${kimLongAll.length} entities`);
  for (const r of kimLongAll) {
    console.log(`  ${r.name} (${r.scientificName})`);
  }

  // 6. Check "Huyết Long" across all
  console.log('\n=== COLLISION CHECK: Huyết Long ===');
  const hueLongAll = await fetchQ(`*[_type == "species" && "Huyết Long" in localNames] {
    _id, name, scientificName, localNames
  }`);
  console.log(`"Huyết Long" in localNames across all species: ${hueLongAll.length} entities`);
  for (const r of hueLongAll) {
    console.log(`  ${r.name} (${r.scientificName})`);
  }

  // 7. Check "Thanh Long" across all
  console.log('\n=== COLLISION CHECK: Thanh Long ===');
  const thanhLongAll = await fetchQ(`*[_type == "species" && "Thanh Long" in localNames] {
    _id, name, scientificName, localNames
  }`);
  console.log(`"Thanh Long" in localNames across all species: ${thanhLongAll.length} entities`);
  for (const r of thanhLongAll) {
    console.log(`  ${r.name} (${r.scientificName})`);
  }
}

main().catch(console.error);
