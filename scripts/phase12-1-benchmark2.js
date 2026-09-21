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
  return await fetchQ(`*[_type in ["species","plant","coral","invertebrate","equipment","tool","post"] && (
    name match "${term}" + "*" ||
    scientificName match "${term}" + "*" ||
    "${term}" in aliases ||
    "${term}" in localNames ||
    title match "${term}" + "*"
  )] | order(name asc) [0...5] {
    _id, _type, name, title, scientificName, slug
  }`);
}

// Updated benchmark: ambiguous queries have multiple valid answers
const BENCHMARK = [
  // Arowana-specific (SPEC-09)
  { q: 'Arowana', expected: ['Asian Arowana', 'Silver Arowana', 'Jardini Arowana'] },
  { q: 'Scleropages formosus', expected: ['Asian Arowana'] },
  { q: 'Huyết Long', expected: ['Asian Arowana'] },
  { q: 'Kim Long', expected: ['Asian Arowana'] },
  { q: 'Ngân Long', expected: ['Silver Arowana'] },
  { q: 'Thanh Long', expected: ['Asian Arowana'] },
  { q: 'Hải Tượng Long', expected: ['Arapaima'] },
  { q: 'Jardini Arowana', expected: ['Jardini Arowana'] },
  { q: 'Scleropages jardinii', expected: ['Jardini Arowana'] },
  { q: 'Silver Arowana', expected: ['Silver Arowana'] },
  { q: 'Osteoglossum bicirrhosum', expected: ['Silver Arowana'] },
  { q: 'Cá rồng trân châu', expected: ['Jardini Arowana'] },
  { q: 'Kim Long Úc', expected: ['Jardini Arowana'] },
  // Phase 12 benchmark
  { q: 'Sailfin Tang', expected: ['Sailfin Tang'] },
  { q: 'Naso Tang', expected: ['Naso Tang'] },
  { q: 'Dragon Fish', expected: ['Asian Arowana'] },
  { q: 'Bristlenose', expected: ['Bristlenose Pleco'] },
  { q: 'Nẻ Nhật', expected: ['Bristlenose Pleco'] },
  { q: 'Nẻ Điện', expected: ['Zebra Pleco'] },
  { q: 'Nẻ Bút', expected: ['Clown Pleco'] },
  { q: 'Nẻ Sọc', expected: ['Common Pleco'] },
  { q: 'Piranha', expected: ['Red-bellied Piranha', 'Black Piranha'] }, // ambiguous
  { q: 'Red-bellied Piranha', expected: ['Red-bellied Piranha'] },
  { q: 'Arapaima', expected: ['Arapaima'] },
  { q: 'Pirarucu', expected: ['Arapaima'] },
  { q: 'Bichir', expected: ['Ornate Bichir', 'Delhezi Bichir', 'Endlicheri Bichir', 'Senegal Bichir'] }, // ambiguous
  { q: 'Polypterus', expected: ['Ornate Bichir', 'Delhezi Bichir', 'Endlicheri Bichir', 'Senegal Bichir'] }, // ambiguous
  { q: 'Snakehead', expected: ['Emperor Snakehead', 'Asian Snakehead', 'Rainbow Snakehead', 'Dwarf Snakehead'] }, // ambiguous
  { q: 'Channa', expected: ['Emperor Snakehead', 'Asian Snakehead', 'Rainbow Snakehead', 'Dwarf Snakehead'] }, // ambiguous
  { q: 'Emperor Angelfish', expected: ['Emperor Angelfish'] },
  { q: 'Porcupine Puffer', expected: ['Porcupine Puffer'] },
  { q: 'Pea Puffer', expected: ['Pea Puffer'] },
  { q: 'Dwarf Puffer', expected: ['Pea Puffer'] },
  { q: 'Blue Tang', expected: ['Blue Tang'] },
  { q: 'Dory', expected: ['Blue Tang'] },
  { q: 'Zoanthids', expected: ['Zoanthids'] },
  { q: 'Zoas', expected: ['Zoanthids'] },
  { q: 'Hammer Coral', expected: ['Hammer Coral'] },
  { q: 'Torch Coral', expected: ['Torch Coral'] },
  { q: 'Java Fern', expected: ['Java Fern'] },
  { q: 'Bucephalandra', expected: ['Bucephalandra'] },
  { q: 'Buce', expected: ['Bucephalandra'] },
  { q: 'Amazon Sword', expected: ['Amazon Sword'] },
  { q: 'Echinodorus', expected: ['Amazon Sword'] },
  { q: 'Cherry Shrimp', expected: ['Cherry Shrimp', 'Red Cherry Shrimp'] }, // duplicates
  { q: 'Neocaridina', expected: ['Cherry Shrimp', 'Red Cherry Shrimp', 'Blue Diamond Shrimp', 'Golden Back Yellow Shrimp'] }, // genus
  { q: 'Tôm Cherry', expected: ['Cherry Shrimp', 'Red Cherry Shrimp'] },
  { q: 'Corydoras', expected: ['Sterbai Corydoras', 'Pygmy Corydoras', 'Bronze Corydoras', 'Peppered Corydoras', 'Panda Corydoras', 'Three-Lined Corydoras'] }, // ambiguous
  { q: 'Panda Cory', expected: ['Panda Corydoras'] },
  { q: 'Angelfish', expected: ['Angelfish', 'Marble Angelfish', 'Emperor Angelfish', 'Coral Beauty Angelfish', 'Flame Angelfish'] }, // ambiguous
  { q: 'Pterophyllum', expected: ['Angelfish', 'Marble Angelfish'] },
  { q: 'Sinularia Leather', expected: ['Sinularia Leather'] },
  { q: 'Toadstool', expected: ['Toadstool Leather'] },
];

async function main() {
  console.log('=== SPEC-10: FULL BENCHMARK (CORRECTED) ===\n');
  let correct = 0, wrong = 0, notFound = 0;
  const wrongList = [];

  for (const { q, expected } of BENCHMARK) {
    const results = await search(q);
    const topResult = results[0];
    const topName = topResult?.name || topResult?.title || 'NO RESULT';
    const isCorrect = expected.includes(topName);

    if (isCorrect) {
      correct++;
    } else if (topResult) {
      wrong++;
      wrongList.push({ q, expected: expected.join(' | '), actual: topName });
    } else {
      notFound++;
      wrongList.push({ q, expected: expected.join(' | '), actual: 'NO RESULT' });
    }
  }

  console.log(`Total: ${BENCHMARK.length}`);
  console.log(`Correct: ${correct}`);
  console.log(`Wrong: ${wrong}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Semantic accuracy: ${((correct / BENCHMARK.length) * 100).toFixed(1)}%`);

  if (wrongList.length) {
    console.log('\n=== WRONG/MISSING ===');
    for (const w of wrongList) {
      console.log(`  "${w.q}" → expected: ${w.expected}, got: ${w.actual}`);
    }
  }

  // Separate report: ambiguous vs exact
  const ambiguous = BENCHMARK.filter(b => b.expected.length > 1);
  const exact = BENCHMARK.filter(b => b.expected.length === 1);
  console.log(`\nExact queries: ${exact.length}`);
  console.log(`Ambiguous queries: ${ambiguous.length}`);
}

main().catch(console.error);
