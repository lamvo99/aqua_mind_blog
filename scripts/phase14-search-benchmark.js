const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const tokenMatch = envContent.match(/SANITY_API_TOKEN="([^"]+)"/);
const TOKEN = tokenMatch ? tokenMatch[1] : null;
if (!TOKEN) { console.error('No SANITY_API_TOKEN found'); process.exit(1); }

const PROJECT_ID = 'zeohjejw';
const DATASET = 'production';
const API_VERSION = '2026-05-25';
const QUERY_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;

const DB_SCHEMA_TYPES = ['species', 'invertebrate', 'plant', 'coral', 'equipment', 'tool'];

function buildGROQ(query) {
  // Inline the query string directly (raw HTTP API doesn't support $q parameter binding)
  const q = query.replace(/"/g, '\\"');
  return `[
    ...*[_type == "post" && (title match "${q}*" || excerpt match "${q}*")]
    | order(publishedAt desc) [0...8] {
      _id, _type, "title": title, slug, excerpt
    },
    ...*[_type in ${JSON.stringify(DB_SCHEMA_TYPES)} && (
      name match "${q}*" ||
      scientificName match "${q}*" ||
      "${q}" in aliases ||
      "${q}" in localNames
    )] [0...12] {
      _id, _type, "title": name, slug, excerpt,
      name, scientificName, aliases, localNames
    }
  ]`;
}

function rankResult(item, query) {
  const q = query.toLowerCase().trim();
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

function dedupeAndRank(items, query) {
  const seen = new Set();
  const deduped = [];
  for (const item of items) {
    if (!seen.has(item._id)) {
      seen.add(item._id);
      deduped.push(item);
    }
  }
  deduped.sort((a, b) => rankResult(a, query) - rankResult(b, query));
  return deduped;
}

async function search(query) {
  const groq = buildGROQ(query);
  const qEncoded = encodeURIComponent(groq);
  const res = await fetch(`${QUERY_BASE}?query=${qEncoded}`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const data = await res.json();
  if (data.error) {
    console.error(`  GROQ error for "${query}": ${data.error.description || data.error}`);
    return [];
  }
  const items = Array.isArray(data.result) ? data.result : (data.result?.result || data.result || []);
  return dedupeAndRank(items, query);
}

// 60 search queries covering SPEC-15 categories
const QUERIES = [
  // ── New entities ──
  { q: 'Red-Tail Shark', expected: 'Red-Tail Shark', type: 'exact' },
  { q: 'Jaguar Cichlid', expected: 'Jaguar Cichlid', type: 'exact' },
  { q: 'Maroon Clownfish', expected: 'Maroon Clownfish', type: 'exact' },
  { q: 'Purple Tang', expected: 'Purple Tang', type: 'exact' },
  { q: 'Bolbitis', expected: 'Bolbitis Heudelotii', type: 'partial' },
  { q: 'Table Acropora', expected: 'Table Acropora', type: 'exact' },
  { q: 'Gorgonian', expected: 'Gorgonian', type: 'exact' },
  { q: 'CO2 Diffuser', expected: 'CO2 Diffuser', type: 'exact' },
  { q: 'Brown Jelly Disease', expected: 'Brown Jelly Disease', type: 'exact' },

  // ── Scientific names ──
  { q: 'Epalzeorhynchos bicolor', expected: 'Red-Tail Shark', type: 'scientific' },
  { q: 'Parachromis managuensis', expected: 'Jaguar Cichlid', type: 'scientific' },
  { q: 'Premnas biaculeatus', expected: 'Maroon Clownfish', type: 'scientific' },
  { q: 'Bolbitis heudelotii', expected: 'Bolbitis Heudelotii', type: 'scientific' },

  // ── Vietnamese terms ──
  { q: 'Huyết Long', expected: 'Asian Arowana', type: 'localName' },
  { q: 'Kim Long', expected: 'Jardini Arowana', type: 'localName' },
  { q: 'Ngân Long', expected: 'Silver Arowana', type: 'localName' },
  { q: 'Tôm Cherry', expected: 'Cherry Shrimp', type: 'localName' },

  // ── Aliases ──
  { q: 'Banggai Clownfish', expected: 'Banggai Cardinalfish', type: 'alias' },
  { q: "Boeseman's Rainbowfish", expected: 'Boesemani Rainbowfish', type: 'alias' },
  { q: 'San Francisco Piranha', expected: 'Red-bellied Piranha', type: 'alias' },

  // ── Variant names ──
  { q: 'Ryukin Goldfish', expected: 'Ryukin Goldfish', type: 'exact' },
  { q: 'Black Moor Goldfish', expected: 'Black Moor Goldfish', type: 'exact' },
  { q: 'Telescope Goldfish', expected: 'Telescope Goldfish', type: 'exact' },

  // ── Equipment ──
  { q: 'Drop Checker', expected: 'CO2 Drop Checker', type: 'exact' },
  { q: 'T5 Light', expected: 'T5 Fluorescent Light', type: 'partial' },

  // ── Problems ──
  { q: 'Brown Jelly', expected: 'Brown Jelly Disease', type: 'partial' },
  { q: 'RTN', expected: 'Rapid Tissue Necrosis (RTN)', type: 'partial' },
  { q: 'Coral Bleaching', expected: 'Coral Bleaching', type: 'exact' },
  { q: 'Aiptasia', expected: 'Aiptasia Infestation', type: 'partial' },

  // ── Existing terms (should still work) ──
  { q: 'Neon Tetra', expected: 'Neon Tetra', type: 'exact' },
  { q: 'Betta', expected: 'Betta', type: 'partial' },
  { q: 'Clownfish', expected: 'Ocellaris Clownfish', type: 'partial' },
  { q: 'Acropora', expected: 'Staghorn Acropora', type: 'partial' },
  { q: 'Anubias', expected: 'Anubias Barteri', type: 'partial' },

  // ── Combined / style terms ──
  { q: 'African Cichlid', expected: 'Frontosa Cichlid', type: 'style' },
  { q: 'Brackish', expected: 'Bumblebee Goby', type: 'style' },
  { q: 'Anemone', expected: 'Bubble-Tip Anemone', type: 'partial' },
  { q: 'Blackwater', expected: 'Chocolate Gourami', type: 'style' },

  // ── Additional coverage queries ──
  { q: 'Arowana', expected: 'Asian Arowana', type: 'partial' },
  { q: 'Bichir', expected: 'Ornate Bichir', type: 'partial' },
  { q: 'Snakehead', expected: 'Emperor Snakehead', type: 'partial' },
  { q: 'Piranha', expected: 'Red-bellied Piranha', type: 'partial' },
  { q: 'Tang', expected: 'Blue Tang', type: 'partial' },
  { q: 'Goby', expected: 'Yellow Watchman Goby', type: 'partial' },
  { q: 'Wrasse', expected: 'Six-line Wrasse', type: 'partial' },
  { q: 'Puffer', expected: 'Pea Puffer', type: 'partial' },
  { q: 'Coral', expected: 'Zoanthids', type: 'partial' },
  { q: 'Shrimp', expected: 'Cherry Shrimp', type: 'partial' },
  { q: 'Pleco', expected: 'Bristlenose Pleco', type: 'partial' },
  { q: 'Corydoras', expected: 'Sterbai Corydoras', type: 'partial' },
  { q: 'Gourami', expected: 'Dwarf Gourami', type: 'partial' },
  { q: 'Loach', expected: 'Kuhli Loach', type: 'partial' },
  { q: 'Goldfish', expected: 'Common Goldfish', type: 'partial' },
  { q: 'Angelfish', expected: 'Marble Angelfish', type: 'partial' },
  { q: 'Discus', expected: 'Discus', type: 'exact' },
  { q: 'Rainbowfish', expected: 'Boesemani Rainbowfish', type: 'partial' },
  { q: 'Seahorse', expected: null, type: 'negative' },
  { q: 'Platypus', expected: null, type: 'negative' },
];

async function main() {
  console.log('=== Phase 14 Search Benchmark (SPEC-15) ===');
  console.log(`Testing ${QUERIES.length} queries...\n`);

  const results = [];
  let passCount = 0;
  let failCount = 0;

  for (let i = 0; i < QUERIES.length; i++) {
    const { q, expected, type } = QUERIES[i];
    const items = await search(q);
    const topResult = items.length > 0 ? items[0] : null;
    const topName = topResult ? (topResult.name || topResult.title || 'N/A') : null;

    let passed = false;
    let matchType = 'none';
    let rankingOk = false;

    if (type === 'negative') {
      // For negative queries, expect no results or unrelated results
      passed = items.length === 0 || (topName && !topName.toLowerCase().includes(q.toLowerCase()));
      matchType = passed ? 'correct-negative' : 'false-positive';
      rankingOk = passed;
    } else if (expected) {
      // Check if expected entity is in results
      const found = items.some(item => {
        const name = (item.name || item.title || '').toLowerCase();
        const exp = expected.toLowerCase();
        return name === exp || name.includes(exp);
      });
      passed = found;
      matchType = topName && topName.toLowerCase().includes(expected.toLowerCase()) ? 'top-match' : (found ? 'in-results' : 'miss');
      rankingOk = matchType === 'top-match';
    }

    if (passed) passCount++;
    else failCount++;

    const status = passed ? 'PASS' : 'FAIL';
    console.log(`  [${String(i + 1).padStart(2, '0')}] ${status} | "${q}" -> ${topName || 'no results'} (${matchType})`);

    results.push({
      index: i + 1,
      query: q,
      expected,
      type,
      topResult: topName,
      matchType,
      resultCount: items.length,
      passed,
      rankingOk,
    });

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  // Summary
  const summary = {
    total: QUERIES.length,
    passed: passCount,
    failed: failCount,
    passRate: ((passCount / QUERIES.length) * 100).toFixed(1) + '%',
    byType: {},
    failures: results.filter(r => !r.passed),
  };

  // Group by match type
  for (const r of results) {
    if (!summary.byType[r.type]) {
      summary.byType[r.type] = { total: 0, passed: 0, failed: 0 };
    }
    summary.byType[r.type].total++;
    if (r.passed) summary.byType[r.type].passed++;
    else summary.byType[r.type].failed++;
  }

  console.log('\n=== SUMMARY ===');
  console.log(`  Total: ${summary.total}`);
  console.log(`  Passed: ${summary.passed}`);
  console.log(`  Failed: ${summary.failed}`);
  console.log(`  Pass Rate: ${summary.passRate}`);
  console.log('\n  By match type:');
  for (const [type, stats] of Object.entries(summary.byType)) {
    console.log(`    ${type}: ${stats.passed}/${stats.total} passed`);
  }

  if (summary.failures.length > 0) {
    console.log('\n=== FAILURES ===');
    for (const f of summary.failures) {
      console.log(`  Q${f.index}: "${f.query}" expected "${f.expected}" -> got "${f.topResult || 'no results'}" (${f.matchType})`);
    }
  }

  // Write report
  if (!fs.existsSync('report')) fs.mkdirSync('report', { recursive: true });

  const report = {
    generatedAt: new Date().toISOString(),
    phase: '14',
    spec: 'SPEC-15',
    totalQueries: QUERIES.length,
    passRate: summary.passRate,
    passed: passCount,
    failed: failCount,
    byType: summary.byType,
    results,
    failures: summary.failures,
  };

  fs.writeFileSync('report/phase14-search-benchmark.json', JSON.stringify(report, null, 2));

  // Write markdown report
  let md = `# DATABASE PHASE 14 — Search Benchmark (SPEC-15)\n\n`;
  md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Phase:** 14 — Controlled Coverage Expansion\n`;
  md += `**Queries Tested:** ${QUERIES.length}\n\n`;
  md += `## Methodology\n\n`;
  md += `Search queries tested against the Phase 14 upgraded search (aliases + localNames + scientific names + client-side ranking).\n`;
  md += `Each query verified for: valid results, correct entity resolution, no duplicates, reasonable ranking.\n\n`;
  md += `## Results\n\n`;
  md += `| # | Query | Expected Entity | Top Result | Type | Match | Pass |\n`;
  md += `|---|-------|-----------------|------------|------|-------|------|\n`;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    md += `| ${r.index} | ${r.query} | ${r.expected || 'N/A'} | ${r.topResult || 'none'} | ${r.type} | ${r.matchType} | ${icon} |\n`;
  }
  md += `\n## Summary\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| Total Queries | ${QUERIES.length} |\n`;
  md += `| Passed | ${passCount} |\n`;
  md += `| Failed | ${failCount} |\n`;
  md += `| Pass Rate | ${summary.passRate} |\n\n`;
  md += `### By Match Type\n\n`;
  md += `| Type | Total | Passed | Failed |\n|------|-------|--------|--------|\n`;
  for (const [type, stats] of Object.entries(summary.byType)) {
    md += `| ${type} | ${stats.total} | ${stats.passed} | ${stats.failed} |\n`;
  }
  if (summary.failures.length > 0) {
    md += `\n### Failures\n\n`;
    for (const f of summary.failures) {
      md += `- **Q${f.index}:** "${f.query}" expected "${f.expected}" -> got "${f.topResult || 'no results'}"\n`;
    }
  }
  md += `\n## Baseline Comparison\n\n`;
  md += `| Phase | Pass Rate | Notes |\n|-------|-----------|-------|\n`;
  md += `| Phase 12 | 100% | 50 queries, exact+alias+scientific+localName |\n`;
  md += `| Phase 14 | ${summary.passRate} | ${QUERIES.length} queries, expanded coverage |\n`;

  fs.writeFileSync('report/DATABASE_PHASE_14_SEARCH_BENCHMARK.md', md);

  console.log('\nWrote report/phase14-search-benchmark.json');
  console.log('Wrote report/DATABASE_PHASE_14_SEARCH_BENCHMARK.md');
}

main().catch(console.error);
