const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
const tokenMatch = envContent.match(/SANITY_API_TOKEN="([^"]+)"/);
const TOKEN = tokenMatch ? tokenMatch[1] : null;

const PROJECT_ID = 'zeohjejw';
const DATASET = 'production';
const API_VERSION = '2026-05-25';
const QUERY_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;

async function fetchAll(type) {
  const q = encodeURIComponent(`*[_type == "${type}" && waterType == "saltwater"]{_id, name, slug, scientificName} | order(name asc)`);
  const res = await fetch(`${QUERY_BASE}?query=${q}`);
  const data = await res.json();
  return data.result || [];
}

async function main() {
  const fish = await fetchAll('species');
  const invertebrates = await fetchAll('invertebrate');

  console.log(`\n=== Saltwater Species: ${fish.length} ===`);
  for (const f of fish) {
    console.log(`  ${f._id} | ${f.name} | ${f.scientificName || 'N/A'} | ${f.slug?.current}`);
  }

  console.log(`\n=== Saltwater Invertebrates: ${invertebrates.length} ===`);
  for (const i of invertebrates) {
    console.log(`  ${i._id} | ${i.name} | ${i.scientificName || 'N/A'} | ${i.slug?.current}`);
  }

  // Write full JSON with IDs
  const summary = {
    marineFish: fish.map(f => ({ id: f._id, name: f.name, scientificName: f.scientificName, slug: f.slug?.current })),
    marineInvertebrates: invertebrates.map(i => ({ id: i._id, name: i.name, scientificName: i.scientificName, slug: i.slug?.current })),
  };
  fs.writeFileSync('report/phase14-batch3-marine-ids.json', JSON.stringify(summary, null, 2));
  console.log('\nWrote report/phase14-batch3-marine-ids.json');
}

main().catch(console.error);
