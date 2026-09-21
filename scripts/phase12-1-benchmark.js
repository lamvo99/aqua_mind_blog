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

async function search(term) {
  // Simulate the Phase 12 search: match name, scientificName, aliases, localNames
  const results = await fetchQ(`*[_type in ["species","plant","coral","invertebrate","equipment","tool","post"] && (
    name match "${term}" + "*" ||
    scientificName match "${term}" + "*" ||
    "${term}" in aliases ||
    "${term}" in localNames ||
    title match "${term}" + "*"
  )] | order(name asc) [0...5] {
    _id, _type, name, title, scientificName, slug, aliases, localNames
  }`);
  return results;
}

function rankItem(item, q) {
  const name = (item.name || item.title || '').toLowerCase();
  const sci = (item.scientificName || '').toLowerCase();
  const aliases = (item.aliases || []).map(a => a.toLowerCase());
  const localNames = (item.localNames || []).map(n => n.toLowerCase());
  if (name === q) return 0;
  if (sci === q) return 1;
  if (aliases.includes(q)) return 2;
  if (localNames.includes(q)) return 3;
  if (name.startsWith(q)) return 4;
  if (name.includes(q)) return 6;
  return 8;
}

const BENCHMARK = [
  // SPEC-09: Arowana-specific queries
  { q: 'Arowana', expected: 'Asian Arowana' },
  { q: 'Scleropages formosus', expected: 'Asian Arowana' },
  { q: 'Huyết Long', expected: 'Asian Arowana' },
  { q: 'Kim Long', expected: 'Asian Arowana' },
  { q: 'Ngân Long', expected: 'Silver Arowana' },
  { q: 'Thanh Long', expected: 'Asian Arowana' },
  { q: 'Hải Tượng Long', expected: 'Arapaima' },
  { q: 'Jardini Arowana', expected: 'Jardini Arowana' },
  { q: 'Scleropages jardinii', expected: 'Jardini Arowana' },
  { q: 'Silver Arowana', expected: 'Silver Arowana' },
  { q: 'Osteoglossum bicirrhosum', expected: 'Silver Arowana' },
  { q: 'Cá rồng trân châu', expected: 'Jardini Arowana' },
  { q: 'Kim Long Úc', expected: 'Jardini Arowana' },
  // Phase 12 benchmark (queries 1-50)
  { q: 'Sailfin Tang', expected: 'Sailfin Tang' },
  { q: 'Naso Tang', expected: 'Naso Tang' },
  { q: 'Dragon Fish', expected: 'Asian Arowana' },
  { q: 'Bristlenose', expected: 'Bristlenose Pleco' },
  { q: 'Nẻ Nhật', expected: 'Bristlenose Pleco' },
  { q: 'Nẻ Điện', expected: 'Zebra Pleco' },
  { q: 'Nẻ Bút', expected: 'Clown Pleco' },
  { q: 'Nẻ Sọc', expected: 'Common Pleco' },
  { q: 'Piranha', expected: 'Red-bellied Piranha' },
  { q: 'Red-bellied Piranha', expected: 'Red-bellied Piranha' },
  { q: 'Arapaima', expected: 'Arapaima' },
  { q: 'Pirarucu', expected: 'Arapaima' },
  { q: 'Bichir', expected: 'Ornate Bichir' },
  { q: 'Polypterus', expected: 'Ornate Bichir' },
  { q: 'Snakehead', expected: 'Emperor Snakehead' },
  { q: 'Channa', expected: 'Emperor Snakehead' },
  { q: 'Emperor Angelfish', expected: 'Emperor Angelfish' },
  { q: 'Porcupine Puffer', expected: 'Porcupine Puffer' },
  { q: 'Pea Puffer', expected: 'Pea Puffer' },
  { q: 'Dwarf Puffer', expected: 'Pea Puffer' },
  { q: 'Blue Tang', expected: 'Blue Tang' },
  { q: 'Dory', expected: 'Blue Tang' },
  { q: 'Zoanthids', expected: 'Zoanthids' },
  { q: 'Zoas', expected: 'Zoanthids' },
  { q: 'Hammer Coral', expected: 'Hammer Coral' },
  { q: 'Torch Coral', expected: 'Torch Coral' },
  { q: 'Java Fern', expected: 'Java Fern' },
  { q: 'Bucephalandra', expected: 'Bucephalandra' },
  { q: 'Buce', expected: 'Bucephalandra' },
  { q: 'Amazon Sword', expected: 'Amazon Sword' },
  { q: 'Echinodorus', expected: 'Amazon Sword' },
  { q: 'Cherry Shrimp', expected: 'Cherry Shrimp' },
  { q: 'Neocaridina', expected: 'Cherry Shrimp' },
  { q: 'Tôm Cherry', expected: 'Cherry Shrimp' },
  { q: 'Corydoras', expected: 'Sterbai Corydoras' },
  { q: 'Panda Cory', expected: 'Panda Corydoras' },
  { q: 'Angelfish', expected: 'Marble Angelfish' },
  { q: 'Pterophyllum', expected: 'Marble Angelfish' },
  { q: 'Sinularia', expected: 'Sinularia Leather' },
  { q: 'Toadstool', expected: 'Toadstool Leather' },
  { q: 'Mushroom Coral', expected: 'Mushroom Coral' },
];

async function main() {
  console.log('=== SPEC-09-10: SEARCH BENCHMARK ===\n');
  let correct = 0, wrong = 0, notFound = 0;
  const wrongList = [];

  for (const { q, expected } of BENCHMARK) {
    const results = await search(q);
    const topResult = results[0];
    const topName = topResult?.name || topResult?.title || 'NO RESULT';
    const isCorrect = topName === expected;

    if (isCorrect) {
      correct++;
    } else if (topResult) {
      wrong++;
      wrongList.push({ q, expected, actual: topName });
    } else {
      notFound++;
      wrongList.push({ q, expected, actual: 'NO RESULT' });
    }
  }

  console.log(`Total: ${BENCHMARK.length}`);
  console.log(`Correct: ${correct}`);
  console.log(`Wrong: ${wrong}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Coverage: ${((correct / BENCHMARK.length) * 100).toFixed(1)}%`);

  if (wrongList.length) {
    console.log('\n=== WRONG/MISSING ===');
    for (const w of wrongList) {
      console.log(`  "${w.q}" → expected: ${w.expected}, got: ${w.actual}`);
    }
  }
}

main().catch(console.error);
