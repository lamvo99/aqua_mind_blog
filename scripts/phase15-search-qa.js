#!/usr/bin/env node
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const tokenMatch = envContent.match(/SANITY_API_TOKEN="([^"]+)"/);
const TOKEN = tokenMatch ? tokenMatch[1] : null;
if (!TOKEN) { console.error('ERROR: SANITY_API_TOKEN not found in .env.local'); process.exit(1); }

const PROJECT_ID = 'zeohjejw';
const DATASET = 'production';
const API_VERSION = '2026-05-25';
const QUERY_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;

const DB_SCHEMA_TYPES = ['species', 'invertebrate', 'plant', 'coral', 'equipment', 'tool'];

function buildGROQ(query) {
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
    if (!seen.has(item._id)) { seen.add(item._id); deduped.push(item); }
  }
  deduped.sort((a, b) => rankResult(a, query) - rankResult(b, query));
  return deduped;
}

async function search(query) {
  const groq = buildGROQ(query);
  const qEncoded = encodeURIComponent(groq);
  const res = await fetch(`${QUERY_BASE}?query=${qEncoded}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  const data = await res.json();
  if (data.error) { console.error(`  GROQ error for "${query}": ${data.error.description || data.error}`); return []; }
  const items = Array.isArray(data.result) ? data.result : (data.result?.result || data.result || []);
  return dedupeAndRank(items, query);
}

const QUERIES = [
  { q: 'Neon Tetra', expected: 'Neon Tetra', type: 'exact' },
  { q: 'Betta', expected: 'Betta', type: 'exact' },
  { q: 'Clownfish', expected: 'Ocellaris Clownfish', type: 'exact' },
  { q: 'Acropora', expected: 'Staghorn Acropora', type: 'exact' },
  { q: 'Anubias', expected: 'Anubias Barteri', type: 'exact' },
  { q: 'Discus', expected: 'Discus', type: 'exact' },
  { q: 'Carassius auratus', expected: 'Common Goldfish', type: 'scientific' },
  { q: 'Amphiprion ocellaris', expected: 'Ocellaris Clownfish', type: 'scientific' },
  { q: 'Scleropages formosus', expected: 'Asian Arowana', type: 'scientific' },
  { q: 'Banggai Clownfish', expected: 'Banggai Cardinalfish', type: 'alias' },
  { q: "Boeseman's Rainbowfish", expected: 'Boesemani Rainbowfish', type: 'alias' },
  { q: 'San Francisco Piranha', expected: 'Red-bellied Piranha', type: 'alias' },
  { q: 'Huyet Long', expected: 'Asian Arowana', type: 'localName' },
  { q: 'Kim Long', expected: 'Jardini Arowana', type: 'localName' },
  { q: 'Ngan Long', expected: 'Silver Arowana', type: 'localName' },
  { q: 'Tom Cherry', expected: 'Cherry Shrimp', type: 'localName' },
  { q: 'Red-Tail Shark', expected: 'Red-Tail Shark', type: 'exact' },
  { q: 'Jaguar Cichlid', expected: 'Jaguar Cichlid', type: 'exact' },
  { q: 'Maroon Clownfish', expected: 'Maroon Clownfish', type: 'exact' },
  { q: 'Purple Tang', expected: 'Purple Tang', type: 'exact' },
  { q: 'Bolbitis', expected: 'Bolbitis Heudelotii', type: 'partial' },
  { q: 'Table Acropora', expected: 'Table Acropora', type: 'exact' },
  { q: 'Gorgonian', expected: 'Gorgonian', type: 'exact' },
  { q: 'CO2 Diffuser', expected: 'CO2 Diffuser', type: 'exact' },
  { q: 'Drop Checker', expected: 'CO2 Drop Checker', type: 'exact' },
  { q: 'T5 Light', expected: 'T5 Fluorescent Light', type: 'partial' },
  { q: 'Brown Jelly', expected: 'Brown Jelly Disease', type: 'partial' },
  { q: 'RTN', expected: 'Rapid Tissue Necrosis (RTN)', type: 'partial' },
  { q: 'Coral Bleaching', expected: 'Coral Bleaching', type: 'exact' },
  { q: 'Aiptasia', expected: 'Aiptasia Infestation', type: 'partial' },
  { q: 'Arowana', expected: 'Asian Arowana', type: 'group' },
  { q: 'Snakehead', expected: 'Emperor Snakehead', type: 'group' },
  { q: 'Bichir', expected: 'Ornate Bichir', type: 'group' },
  { q: 'Piranha', expected: 'Red-bellied Piranha', type: 'group' },
  { q: 'Tang', expected: 'Blue Tang', type: 'group' },
  { q: 'Wrasse', expected: 'Six-line Wrasse', type: 'group' },
  { q: 'Goby', expected: 'Yellow Watchman Goby', type: 'group' },
  { q: 'Puffer', expected: 'Pea Puffer', type: 'group' },
  { q: 'Pleco', expected: 'Bristlenose Pleco', type: 'group' },
  { q: 'Corydoras', expected: 'Sterbai Corydoras', type: 'group' },
  { q: 'Goldfish', expected: 'Common Goldfish', type: 'group' },
  { q: 'Shrimp', expected: 'Cherry Shrimp', type: 'group' },
  { q: 'Coral', expected: 'Zoanthids', type: 'group' },
  { q: 'Seahorse', expected: null, type: 'negative' },
  { q: 'Platypus', expected: null, type: 'negative' },
];

function classifyFailure(item) {
  if (item.type === 'negative') return 'EXPECTED_NEGATIVE';
  if (item.matchType === 'miss') return 'DATA MISSING';
  if (item.matchType === 'in-results') return 'SEARCH RANKING';
  if (item.matchType === 'false-positive') return 'INTENT AMBIGUITY';
  return 'BUG';
}

async function main() {
  console.log('=== Phase 15 Search Final QA (SPEC-11) ===');
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

    if (type === 'negative') {
      passed = items.length === 0 || (topName && !topName.toLowerCase().includes(q.toLowerCase()));
      matchType = passed ? 'correct-negative' : 'false-positive';
    } else if (expected) {
      const found = items.some(item => {
        const name = (item.name || item.title || '').toLowerCase();
        return name === expected.toLowerCase() || name.includes(expected.toLowerCase());
      });
      passed = found;
      matchType = topName && topName.toLowerCase().includes(expected.toLowerCase()) ? 'top-match' : (found ? 'in-results' : 'miss');
    }

    if (passed) passCount++; else failCount++;
    const status = passed ? 'PASS' : 'FAIL';
    console.log(`  [${String(i + 1).padStart(2, '0')}] ${status} | "${q}" -> ${topName || 'no results'} (${matchType})`);

    results.push({ index: i + 1, query: q, expected, type, topResult: topName, matchType, resultCount: items.length, passed });
    await new Promise(r => setTimeout(r, 100));
  }

  const summary = { total: QUERIES.length, passed: passCount, failed: failCount, passRate: ((passCount / QUERIES.length) * 100).toFixed(1) + '%', byType: {}, failures: results.filter(r => !r.passed) };
  for (const r of results) {
    if (!summary.byType[r.type]) summary.byType[r.type] = { total: 0, passed: 0, failed: 0 };
    summary.byType[r.type].total++;
    if (r.passed) summary.byType[r.type].passed++; else summary.byType[r.type].failed++;
  }

  console.log('\n=== SUMMARY ===');
  console.log(`  Total: ${summary.total} | Passed: ${summary.passed} | Failed: ${summary.failed} | Rate: ${summary.passRate}`);

  if (summary.failures.length > 0) {
    console.log('\n=== FAILURES ===');
    for (const f of summary.failures) {
      console.log(`  Q${f.index}: "${f.query}" expected "${f.expected}" -> got "${f.topResult || 'no results'}" [${classifyFailure(f)}]`);
    }
  }

  if (!fs.existsSync('report')) fs.mkdirSync('report', { recursive: true });

  const report = { generatedAt: new Date().toISOString(), phase: '15', spec: 'SPEC-11', ...summary, results };
  fs.writeFileSync('report/phase15-search-benchmark.json', JSON.stringify(report, null, 2));

  let md = `# DATABASE PHASE 15 - Search Final QA (SPEC-11)\n\n`;
  md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Phase:** 15 - V1 Final QA & Freeze\n`;
  md += `**Queries Tested:** ${QUERIES.length}\n\n`;
  md += `## Methodology\n\nSearch queries tested against Sanity HTTP API with client-side dedup+ranking. Each query verified for valid results, correct entity resolution, and reasonable ranking.\n\n`;
  md += `## Results\n\n`;
  md += `| # | Query | Expected | Top Result | Type | Match | Pass |\n`;
  md += `|---|-------|----------|------------|------|-------|------|\n`;
  for (const r of results) {
    md += `| ${r.index} | ${r.query} | ${r.expected || 'N/A'} | ${r.topResult || 'none'} | ${r.type} | ${r.matchType} | ${r.passed ? '&#10003;' : '&#10007;'} |\n`;
  }
  md += `\n## Summary\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n| Total | ${QUERIES.length} |\n| Passed | ${passCount} |\n| Failed | ${failCount} |\n| Pass Rate | ${summary.passRate} |\n\n`;
  md += `### By Match Type\n\n| Type | Total | Passed | Failed |\n|------|-------|--------|--------|\n`;
  for (const [type, stats] of Object.entries(summary.byType)) {
    md += `| ${type} | ${stats.total} | ${stats.passed} | ${stats.failed} |\n`;
  }
  if (summary.failures.length > 0) {
    md += `\n### Failures\n\n`;
    for (const f of summary.failures) {
      const cls = classifyFailure(f);
      md += `- **Q${f.index}:** "${f.query}" -> "${f.topResult || 'no results'}" (${cls})\n`;
    }
  }
  md += `\n## Classification Legend\n\n`;
  md += `- **DATA MISSING:** Entity not in database or not indexed in searchable fields\n`;
  md += `- **ALIAS MISSING:** Entity exists but alias/localName not populated\n`;
  md += `- **SEARCH RANKING:** Entity found but not ranked #1\n`;
  md += `- **INTENT AMBIGUITY:** Query matches multiple entities, user intent unclear\n`;
  md += `- **EXPECTED NEGATIVE:** Query correctly returns no results\n`;
  md += `- **BUG:** Unexpected search failure\n`;
  md += `\n## Baseline Comparison\n\n| Phase | Pass Rate | Queries | Notes |\n|-------|-----------|---------|-------|\n`;
  md += `| Phase 12 | 100% | 50 | Exact+alias+scientific+localName |\n`;
  md += `| Phase 14 | 81.0% | 58 | Expanded coverage |\n`;
  md += `| Phase 15 | ${summary.passRate} | ${QUERIES.length} | Final QA |\n`;

  fs.writeFileSync('report/DATABASE_PHASE_15_SEARCH_BENCHMARK.md', md);
  console.log('\nWrote report/phase15-search-benchmark.json');
  console.log('Wrote report/DATABASE_PHASE_15_SEARCH_BENCHMARK.md');
}

main().catch(console.error);
