const fs = require('fs');
const path = require('path');

const OUT = path.join('report', 'SPEC_00_1');

function readLines(file) {
  const rows = [];
  const [, ...lines] = fs.readFileSync(path.join(OUT, file), 'utf8').trim().split('\n');
  for (const ln of lines) {
    if (ln.trim() === '') continue;
    // minimal CSV parse (handles quoted cells)
    const cells = [];
    let buf = '', inQ = false;
    for (let i = 0; i < ln.length; i++) {
      const c = ln[i];
      if (inQ) {
        if (c === '"') { if (ln[i + 1] === '"') { buf += '"'; i++; } else inQ = false; }
        else buf += c;
      } else if (c === '"') inQ = true;
      else if (c === ',') { cells.push(buf); buf = ''; }
      else buf += c;
    }
    cells.push(buf);
    rows.push(cells);
  }
  return rows;
}

const invJson = JSON.parse(fs.readFileSync(path.join(OUT, 'SPEC_00_1_CANONICAL_INVENTORY.json'), 'utf8'));
const issuesCsv = readLines('SPEC_00_1_INTEGRITY_ISSUES.csv');
const summaryJson = JSON.parse(fs.readFileSync(path.join(OUT, 'SPEC_00_1_CATEGORY_SUMMARY.json'), 'utf8'));
const invCsv = readLines('SPEC_00_1_CANONICAL_INVENTORY.csv');

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

// 1. CSV rows == JSON records count (data payload rows, ignoring header)
check('CSV row count equals JSON record count', invCsv.length === invJson.records.length, `csv=${invCsv.length} json=${invJson.records.length}`);

// 2. Every canonical record appears exactly once
const idCounts = {};
for (const r of invJson.records) idCounts[r.canonical_id] = (idCounts[r.canonical_id] || 0) + 1;
const dupIds = Object.entries(idCounts).filter(([, c]) => c > 1);
check('No duplicate canonical_id in inventory', dupIds.length === 0, dupIds.map(([i]) => i).join(','));

// 3. Issues reference real inventory records (where a canonical id is present)
const invIds = new Set(invJson.records.map((r) => r.canonical_id));
const missingRefs = issuesCsv
  .filter((row) => row[3] && row[3] !== '')
  .filter((row) => !invIds.has(row[3]))
  .map((row) => row[3]);
check('All issue canonical_ids exist in inventory', missingRefs.length === 0, missingRefs.join(','));

// 4. Category totals sum equals total
const sumCounts = summaryJson.summary.reduce((s, r) => s + r.canonical_count, 0);
check('Category totals sum to inventory total', sumCounts === invJson.records.length, `sum=${sumCounts} total=${invJson.records.length}`);

const catRows = summaryJson.summary.flatMap((s) => invJson.records.filter((r) => r.category === s.category));
check('Per-category record counts match inventory', summaryJson.summary.every((s) => s.canonical_count === invJson.records.filter((r) => r.category === s.category).length));

// 5. Duplicate detection is deterministic: recompute slug/title groups from inventory, expect 0 duplicates, matching prior run
const slugCounts = {};
const titleCounts = {};
for (const r of invJson.records) {
  const s = (r.slug || '').trim().toLowerCase();
  const t = (r.title || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (s) slugCounts[s] = (slugCounts[s] || 0) + 1;
  if (t) titleCounts[t] = (titleCounts[t] || 0) + 1;
}
const dupSlugs = Object.entries(slugCounts).filter(([, c]) => c > 1);
const dupTitles = Object.entries(titleCounts).filter(([, c]) => c > 1);
check('Duplicate detection deterministic — 0 duplicate slugs', dupSlugs.length === 0, dupSlugs.map(([k]) => k).join(','));
check('Duplicate detection deterministic — 0 duplicate titles', dupTitles.length === 0, dupTitles.map(([k]) => k).join(','));

// 6. Route audit integrity: "/undefined" routes appear ONLY on records flagged as broken (missing/invalid slug)
const undefinedRouteRecords = invJson.records.filter((r) => /undefined/.test(r.route || ''));
const flaggedBroken = invJson.records.filter((r) => (r.notes || '').includes('NULL_SLUG') || (r.notes || '').includes('BROKEN_ROUTE') || r.route_result !== 'OK');
const undefIds = new Set(undefinedRouteRecords.map((r) => r.canonical_id));
const flaggedIds = new Set(flaggedBroken.map((r) => r.canonical_id));
const mismatch = [];
for (const id of undefIds) if (!flaggedIds.has(id)) mismatch.push(`unflagged:${id}`);
for (const id of flaggedIds) if (/undefined/.test(invJson.records.find((r) => r.canonical_id === id)?.route || '') === false) mismatch.push(`not-undefined:${id}`);
check('Every /undefined route is a flagged broken record (and vice versa)', mismatch.length === 0, mismatch.slice(0, 5).join(','));

// 7. All reference targets exist in the global dataset id set (all 13 types incl. post/tool)
const raw = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_00_1', 'raw', 'spec00_1_raw_dump.json'), 'utf8'));
const globalIds = new Set();
for (const items of Object.values(raw.records)) for (const it of items) globalIds.add(it._id);
const unresolvable = [];
for (const r of invJson.records) {
  const refs = (r.referenced_records || '').split('|').filter(Boolean);
  for (const ref of refs) if (!globalIds.has(ref)) unresolvable.push(`${r.canonical_id}->${ref}`);
}
check('Every referenced record exists in the global dataset (incl. post/tool)', unresolvable.length === 0, unresolvable.slice(0, 5).join(','));

const failed = results.filter((r) => !r.ok);
fs.writeFileSync(path.join(OUT, 'SPEC_00_1_VALIDATION.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  results,
  passed: results.filter((r) => r.ok).length,
  failed: failed.length,
  verdict: failed.length === 0 ? 'PASS' : 'FAIL',
}, null, 2));
console.log(`\nValidation: ${results.length - failed.length}/${results.length} checks passed.`);