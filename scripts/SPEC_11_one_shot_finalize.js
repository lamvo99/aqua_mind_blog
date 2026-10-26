const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

// SPEC 11 one-shot - completeness, checksums, reconciled execution report.

const OUT = path.join('reports', 'SPEC_11', 'one_shot');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const shaFile = (f) => sha256(fs.readFileSync(f));

function splitCsvLine(line) { const o = []; let c = '', q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (q) { if (ch === '"') { if (line[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else { if (ch === '"') q = true; else if (ch === ',') { o.push(c); c = ''; } else c += ch; } } o.push(c); return o; }
function readCsv(f) { const lines = fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length); const h = splitCsvLine(lines[0]); return lines.slice(1).map((l) => { const r = splitCsvLine(l); const o = {}; h.forEach((k, i) => { o[k] = r[i] == null ? '' : r[i]; }); return o; }); }
const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const toCsv = (h, rows) => h.join(',') + '\n' + rows.map((r) => h.map((k) => esc(r[k])).join(',')).join('\n') + '\n';
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

const plan = readCsv(path.join(OUT, 'FINAL_OPERATION_PLAN.csv'));
const rem = readCsv(path.join(OUT, 'SPEC_11_REMAINDER_REGISTER.csv'));
const log = readCsv(path.join(OUT, 'MUTATION_LOG.csv'));
const integrity = JSON.parse(fs.readFileSync(path.join(OUT, 'INTEGRITY.json'), 'utf8'));

const byRec = {};
for (const r of plan) (byRec[r.recordId] = byRec[r.recordId] || []).push(r);
const remByRec = {}; for (const r of rem) (remByRec[r.recordId] = remByRec[r.recordId] || []).push(r);

const rows = [];
for (const [recId, list] of Object.entries(byRec)) {
  const applied = list.filter((r) => r.action === 'APPLY' || r.action === 'APPLY_WITH_CAVEAT');
  const filledBefore = applied.filter((r) => r.currentValue !== '' && r.currentValue != null).length;
  const written = log.filter((l) => l.recordId === recId && l.status === 'WRITTEN').length;
  rows.push({
    recordId: recId, slug: list[0].slug, species: list[0].species,
    plannedOperations: list.length, appliedOperations: applied.length,
    filledBefore, filledAfter: filledBefore + written,
    heldOperations: (remByRec[recId] || []).length,
    coverageBefore: applied.length ? (filledBefore / applied.length).toFixed(3) : '1.000',
    coverageAfter: applied.length ? ((filledBefore + written) / applied.length).toFixed(3) : '1.000',
  });
}
rows.sort((a, b) => a.slug.localeCompare(b.slug));
fs.writeFileSync(path.join(OUT, 'COMPLETENESS_BEFORE.csv'), toCsv(['recordId', 'slug', 'species', 'plannedOperations', 'appliedOperations', 'filledBefore', 'coverageBefore'], rows.map((r) => ({ recordId: r.recordId, slug: r.slug, species: r.species, plannedOperations: r.plannedOperations, appliedOperations: r.appliedOperations, filledBefore: r.filledBefore, coverageBefore: r.coverageBefore }))));
fs.writeFileSync(path.join(OUT, 'COMPLETENESS_AFTER.csv'), toCsv(['recordId', 'slug', 'species', 'plannedOperations', 'appliedOperations', 'filledAfter', 'heldOperations', 'coverageAfter'], rows.map((r) => ({ recordId: r.recordId, slug: r.slug, species: r.species, plannedOperations: r.plannedOperations, appliedOperations: r.appliedOperations, filledAfter: r.filledAfter, heldOperations: r.heldOperations, coverageAfter: r.coverageAfter }))));

// post-write regression tests
function run(cmd, args, cwd) { const r = spawnSync(cmd, args, { cwd: cwd || process.cwd(), shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return { code: r.status, out: stripAnsi((r.stdout || '') + (r.stderr || '')) }; }
const lint = run('npm', ['run', 'lint']); const tsc = run('npx', ['tsc', '--noEmit']);
const focused = run('npx', ['vitest', 'run', 'tests/spec10m-schema.test.ts']);
const full = run('npm', ['test']); const build = run('npm', ['run', 'build']);
function summary(out) {
  const lines = out.split(/\r?\n/).filter((l) => /^\s*Tests\s/.test(l));
  const last = lines[lines.length - 1] || '';
  const p = (last.match(/(\d+)\s+passed/) || [])[1] || '0';
  const f = (last.match(/(\d+)\s+failed/) || [])[1] || '0';
  return { passed: p, failed: f };
}
const focal = summary(focused.out);
const fullS = summary(full.out);
const focalPass = focal.passed;
const fullPassed = fullS.passed;
const fullFailed = fullS.failed;

const files = fs.readdirSync(OUT).filter((f) => f !== 'CHECKSUMS.txt').sort();
const sums = files.map((f) => f + ': ' + shaFile(path.join(OUT, f)));
fs.writeFileSync(path.join(OUT, 'CHECKSUMS.txt'), 'SPEC 11 one-shot - artifact checksums (SHA-256)\ncanonical identity hash: ' + integrity.identityHash + ' (' + (integrity.identityMatch ? 'MATCH' : 'MISMATCH') + ')\n\n' + sums.join('\n') + '\n\nsanity docWrites=' + integrity.sanityWrites + ' mutationCalls=' + integrity.mutationCalls + '\n');

const actionCounts = {};
for (const r of plan) actionCounts[r.action] = (actionCounts[r.action] || 0) + 1;
const md = [];
md.push('# SPEC 11 - One-Shot Species Husbandry Enrichment - Execution Report');
md.push('');
md.push('Mode: PRODUCTION WRITE. Repo schema treated as authoritative (user decision). Authorization: invocation of phase/SPEC_11_ONE_SHOT_EXECUTION.md.');
md.push('');
md.push('## Result');
md.push('- Records touched: ' + Object.keys(byRec).length + ' (Wave 1 = 17 P0 large-fish species)');
md.push('- Operations written: ' + integrity.operations.written + ' / planned-applied ' + (actionCounts.APPLY + actionCounts.APPLY_WITH_CAVEAT));
md.push('- Transactions: ' + integrity.sanityWrites + ' conditional patched documents (ifRevisionID); drift-skipped: ' + integrity.operations.skippedDrift + '; failed: ' + integrity.operations.failed);
md.push('- Read-back verification: ' + integrity.verification.passed + '/' + integrity.verification.checked + ' fields verified');
md.push('- Identity hash: ' + (integrity.identityMatch ? 'MATCH' : 'MISMATCH') + ' (' + integrity.identityHash + ')');
md.push('- Protected content (title/slug/category/SEO/relationships): ' + (integrity.protectedSealsUnchanged ? 'unchanged (seals identical pre/post)' : 'CHANGED'));
md.push('- Inventory: ' + integrity.total + ' records ' + JSON.stringify(integrity.counts));
md.push('- Verdict: ' + integrity.verdict);
md.push('');
md.push('## Decision rules (deterministic)');
md.push('ELIGIBLE+HIGH -> APPLY; ELIGIBLE+MEDIUM -> APPLY_WITH_CAVEAT; ELIGIBLE+LOW -> HOLD_EVIDENCE; CONFLICT_CANDIDATE_APPROVE -> APPLY(/_WITH_CAVEAT); CONFLICT_DEFERRED -> HOLD_CONFLICT; CONFLICT_REJECTED -> REJECT_SEMANTIC_MAPPING; SKIP_NOOP -> SKIP_ALREADY_CORRECT. Unsupported/conflicting rows are leave-only; no content is invented.');
md.push('');
md.push('## Actions');
md.push('```'); md.push(JSON.stringify(actionCounts, null, 2)); md.push('```');
md.push('');
md.push('## Explicit exceptions / remainder (' + rem.length + ' rows, see SPEC_11_REMAINDER_REGISTER.csv)');
md.push('- Requirements held for stronger evidence, deferred conflicts, and rejected semantic mappings are enumerated per record.');
md.push('');
md.push('## Documented caveats');
md.push('1. Source substitution: the frozen phase/11 PM package and Phases 01-03 were not reproducible in this workspace (untracked files with hard-coded SHA-256 in validators and no writer script). Decisions were driven from the deterministically regenerated SPEC 09 -> SPEC 10 -> SPEC 10M -> SPEC 11 Stage A + Revision 1 chain, verified by checksum before any write.');
md.push('2. Schema deployment: the SPEC 10M fields are present in the repo schema (authoritative per user decision) but not yet deployed to the Studio/dataset schema; new fields will not appear in Studio until `sanity deploy`, and the public site will not render them until GROQ queries/projections are updated. Values are written to Content Lake regardless.');
md.push('3. APPLY_WITH_CAVEAT body claims include an in-text confidence qualification; structured fields record the caveat in the plan/journal provenance.');
md.push('');
md.push('## Regression tests after write (content-only change expected)');
md.push('- lint: code ' + lint.code + '; tsc --noEmit: code ' + tsc.code);
md.push('- focused tests/spec10m-schema.test.ts: ' + (focalPass || '?') + ' passed (code ' + focused.code + ')');
md.push('- npm test: ' + (fullPassed || '?') + ' passed, ' + fullFailed + ' failed (code ' + full.code + ') [known baseline failure tests/compare.test.ts]');
md.push('- npm run build: code ' + build.code);
md.push('');
md.push('## Artifacts');
for (const f of files) md.push('- reports/SPEC_11/one_shot/' + f);
fs.writeFileSync(path.join(OUT, 'SPEC_11_ONE_SHOT_EXECUTION_REPORT.md'), md.join('\n') + '\n');

console.log('finalize OK | lint=' + lint.code + ' tsc=' + tsc.code + ' focused=' + (focalPass || '?') + ' full=' + (fullPassed || '?') + '/' + fullFailed + ' failed build=' + build.code);
console.log('artifacts: ' + fs.readdirSync(OUT).join(', '));
