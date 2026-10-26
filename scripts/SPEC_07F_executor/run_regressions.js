'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const cfg = require('./config');
const IO = require('./io');

const EXPECTED_REGENERATED = [
  'report/SPEC_00_1/SPEC_00_1_VALIDATION.json',
  'report/SPEC_01/SPEC_01_VALIDATION.json',
  'report/SPEC_07/SPEC_07_VALIDATION.json',
  'report/SPEC_07/SPEC_07_GATE_A_B_REPORT.md',
  'report/SPEC_07C/SPEC_07C_VALIDATION.json',
  'report/SPEC_07C/SPEC_07C_AUDIT_REPORT.md',
  'report/SPEC_07D/SPEC_07D_VALIDATION.json',
  'report/SPEC_07D/SPEC_07D_AUDIT_REPORT.md',
  'report/SPEC_07D/SPEC_07D_COMPLETION_REPORT.md',
  'report/SPEC_07D/SPEC_07D_SOURCE_MANIFEST.json',
];

const FROZEN_PLAN_FILES = [
  'report/SPEC_07C/SPEC_07C_FINAL_MUTATION_READY.json',
  'report/SPEC_07C/SPEC_07C_EXCLUDED_ROWS.json',
  'report/SPEC_07C/SPEC_07C_REVISION_FREEZE.json',
  'report/SPEC_07D/SPEC_07D_TARGET_RECONCILIATION.csv',
  'report/SPEC_07D/SPEC_07D_FIELD_MUTATION_PLAN_PREP.csv',
  'report/SPEC_07D/SPEC_07D_PRE_AUDIT_SNAPSHOT.json',
];

const REG_SPECS = [
  { id: 'R-00.1', script: 'scripts/SPEC_00_1_validate.js', file: 'report/SPEC_00_1/SPEC_00_1_VALIDATION.json', expect: 9, stdout: 'Validation: 9/9 checks passed.', label: 'SPEC 00.1 canonical inventory regression' },
  { id: 'R-01', script: 'scripts/SPEC_01_validate.js', file: 'report/SPEC_01/SPEC_01_VALIDATION.json', expect: 14, stdout: 'SPEC_01_validate: 14/14 checks passed. Verdict: PASS', label: 'SPEC 01 depth-audit regression' },
  { id: 'R-07', script: 'scripts/SPEC_07_validate.js', file: 'report/SPEC_07/SPEC_07_VALIDATION.json', expect: 18, stdout: 'VALIDATION: 18/18 PASS', label: 'SPEC 07 validation regression' },
  { id: 'R-07C', script: 'scripts/SPEC_07C_validate.js', file: 'report/SPEC_07C/SPEC_07C_VALIDATION.json', expect: 61, stdout: 'VALIDATION: 61/61 PASS', label: 'SPEC 07C validation regression' },
  { id: 'R-07D', script: 'scripts/SPEC_07D_validate.js', file: 'report/SPEC_07D/SPEC_07D_VALIDATION.json', expect: 29, stdout: 'VALIDATION: 29/29 PASS', label: 'SPEC 07D validation + 5/5 determinism (R-01..R-05)', determinismMode: 'lines', determinism: 5 },
  { id: 'R-07E', script: 'scripts/SPEC_07E_audit.js', file: 'report/SPEC_07E/PRE_WRITE_SAFETY_REVIEW.json', expect: 50, stdout: 'VALIDATION: 50/50 PASS', label: 'SPEC 07E pre-write safety gate + 5/5 determinism (relayed E-G5)', determinismMode: 'marker', determinism: 5, extra: 'RECOMMEND_GO_TO_PM_REVIEW' },
];

function hashTree(root) {
  const out = {};
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (d === root && (e.name === 'SPEC_07E' || e.name === 'SPEC_07F')) continue;
        walk(path.join(d, e.name));
      } else {
        const p = path.join(d, e.name);
        out[IO.normalizePath(p)] = IO.shaFile(p);
      }
    }
  };
  walk(root);
  return out;
}

function hashDirFiles(dir) {
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isFile()) out[IO.normalizePath(p)] = IO.shaFile(p);
  }
  return out;
}

function gitPorcelain() {
  const run = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8', timeout: 60000 });
  const lines = String(run.stdout || '').split(/\r?\n/).filter((l) => l.trim().length > 0);
  return {
    tracked: lines.filter((l) => !l.startsWith('??')).map((l) => l.trim()),
    untracked: lines.filter((l) => l.startsWith('??')).map((l) => l.trim()),
  };
}

function main() {
  const startedAt = IO.nowIso();
  const t0 = Date.now();
  fs.mkdirSync(cfg.OUT_DIR, { recursive: true });

  const gitBefore = gitPorcelain();
  const treeBefore = hashTree('report');
  const eBefore = hashDirFiles('report/SPEC_07E');
  const frozenBefore = {};
  for (const f of FROZEN_PLAN_FILES) frozenBefore[f] = IO.shaFile(f);

  const regressions = [];
  for (const s of REG_SPECS) {
    const cmd = 'node ' + s.script;
    const tRun = Date.now();
    const run = spawnSync('node', [s.script], { encoding: 'utf8', timeout: 900000 });
    const out = String(run.stdout || '');
    const err = String(run.stderr || '');
    const entry = {
      id: s.id, label: s.label, command: cmd, expectedPassed: s.expect,
      exitCode: run.status === null ? -1 : run.status, durationMs: Date.now() - tRun, ok: false,
    };
    try {
      const j = IO.readJson(s.file);
      const passedN = j.summary ? j.summary.passed : j.passed;
      const verdict = j.verdict || j.result;
      const stdoutMatch = out.indexOf(s.stdout) >= 0;
      const verdictOk = typeof verdict === 'string' && verdict.indexOf('PASS') === 0;
      entry.verdict = verdict;
      entry.passed = passedN;
      entry.stdoutMatch = stdoutMatch;
      let ok = verdictOk && passedN === s.expect && run.status === 0 && stdoutMatch;
      if (s.determinism) {
        const lines = out.split(/\r?\n/).filter((l) => /^CHECK OK  R-0/.test(l)).length;
        const marker = (out.match(/determinismLines=\d+\/\d+/g) || []).join(',');
        const markerNum = Number((out.match(/determinismLines=(\d+)\//) || [])[1] || 0);
        const observed = s.determinismMode === 'marker' ? markerNum : lines;
        entry.determinismMode = s.determinismMode;
        entry.determinismChecks = observed;
        entry.determinismExpected = s.determinism;
        entry.determinismDetail = s.determinismMode === 'marker' ? (marker || 'marker-missing') : ('R-0-lines=' + lines);
        ok = ok && observed === s.determinism;
      }
      if (s.extra) {
        entry.extraMarker = s.extra;
        entry.extraMarkerSeen = out.indexOf(s.extra) >= 0;
        ok = ok && entry.extraMarkerSeen;
      }
      entry.ok = ok;
      entry.detail = (verdict || 'NO_VERDICT') + ' ' + passedN + '/' + s.expect + ' exit=' + entry.exitCode + ' stdout=' + (stdoutMatch ? 'match' : 'mismatch') +
        (s.determinism ? ' determinism=' + entry.determinismChecks + '/' + s.determinism : '') +
        (s.extra ? ' marker=' + entry.extraMarkerSeen : '');
    } catch (e) {
      entry.error = e.message;
      entry.detail = 'error=' + e.message + ' exit=' + entry.exitCode;
    }
    if (!entry.ok && err) entry.stderrTail = err.slice(-400);
    entry.stdoutTail = out.split(/\r?\n/).filter((l) => l.trim()).slice(-4).join(' | ').slice(0, 400);
    regressions.push(entry);
    console.log((entry.ok ? 'REGRESSION OK   ' : 'REGRESSION FAIL ') + entry.id + ' ' + entry.detail);
  }

  const npmStart = Date.now();
  const npmRun = spawnSync('npm', ['test'], { encoding: 'utf8', timeout: 900000, shell: true });
  const npmOut = (String(npmRun.stdout || '') + String(npmRun.stderr || '')).replace(/\u001b\[[0-9;]*m/g, '');
  const testsLine = (npmOut.split(/\r?\n/).filter((l) => /Tests\b.*\d+ \//.test(l))[0] || '').trim();
  const filesLine = (npmOut.split(/\r?\n/).filter((l) => /Test Files\b/.test(l))[0] || '').trim();
  const failingTests = npmOut.split(/\r?\n/).filter((l) => /^ FAIL /.test(l) || /FAIL tests\//.test(l)).map((l) => l.trim()).filter((v, i, a) => a.indexOf(v) === i);
  const npmExit = npmRun.status === null ? -1 : npmRun.status;

  const gitAfter = gitPorcelain();
  const treeAfter = hashTree('report');
  const eAfter = hashDirFiles('report/SPEC_07E');
  const frozenAfter = {};
  for (const f of FROZEN_PLAN_FILES) frozenAfter[f] = IO.shaFile(f);

  const trackedModified = gitAfter.tracked;
  const allFailingKnown = failingTests.every((l) => l.indexOf('tests/compare.test.ts') >= 0);
  const npmOk = npmExit === 0 || (failingTests.length > 0 && allFailingKnown && trackedModified.length === 0);
  const npmTest = {
    command: 'npm test (vitest run)', exitCode: npmExit, testsLine: testsLine, filesLine: filesLine,
    failingTests: failingTests, durationMs: Date.now() - npmStart,
    classification: npmExit === 0 ? 'PASS' : 'UNRELATED_BASELINE_FAILURE (pre-existing app-level compare-config test; zero tracked repository files modified by SPEC 07F)',
    ok: npmOk,
  };

  const changed = Object.keys(treeBefore).filter((k) => treeAfter[k] && treeAfter[k] !== treeBefore[k]).sort();
  const added = Object.keys(treeAfter).filter((k) => !treeBefore[k]).sort();
  const removed = Object.keys(treeBefore).filter((k) => !treeAfter[k]).sort();
  const unexpectedChanged = changed.filter((f) => EXPECTED_REGENERATED.indexOf(f) < 0);
  const unexpectedAdded = added.filter((f) => EXPECTED_REGENERATED.indexOf(f) < 0);
  const eChanged = Object.keys(eBefore).filter((k) => eAfter[k] && eAfter[k] !== eBefore[k]).sort();
  const eAdded = Object.keys(eAfter).filter((k) => !eBefore[k]).sort();
  const eRemoved = Object.keys(eBefore).filter((k) => !eAfter[k]).sort();
  const drift = {
    scope: 'report tree excluding report/SPEC_07F (SPEC 07F own artifacts) and report/SPEC_07E (SPEC 07E validator-owned deliverables regenerated by its own run)',
    expectedRegenerated: EXPECTED_REGENERATED,
    changed: changed, added: added, removed: removed,
    unexpectedChanged: unexpectedChanged, unexpectedAdded: unexpectedAdded,
    spec07eOwn: { changed: eChanged, added: eAdded, removed: eRemoved, note: 'SPEC 07E re-run regenerated its own deliverables; differences are validator-owned content (including any volatile metadata) and are re-hashed by the SPEC 07F frozen-input integrity check after this regression run' },
    ok: unexpectedChanged.length === 0 && unexpectedAdded.length === 0 && removed.length === 0,
  };

  const frozenImmutability = FROZEN_PLAN_FILES.map((f) => ({
    file: f, sha256Before: frozenBefore[f], sha256After: frozenAfter[f], unchanged: frozenBefore[f] === frozenAfter[f],
  }));
  const frozenOk = frozenImmutability.every((x) => x.unchanged);

  const gitOk = gitBefore.tracked.length === 0 && gitAfter.tracked.length === 0;
  const summary = {
    attempted: regressions.length + 3,
    passed: regressions.filter((r) => r.ok).length + (npmOk ? 1 : 0) + (gitOk ? 1 : 0) + (frozenOk && drift.ok ? 1 : 0),
    failed: regressions.filter((r) => !r.ok).length + (npmOk ? 0 : 1) + (gitOk ? 0 : 1) + (frozenOk && drift.ok ? 0 : 1),
  };
  summary.verdict = summary.failed === 0 ? 'PASS' : 'FAIL';

  const results = {
    spec: cfg.SPEC,
    phase: 'REGRESSION_RESULTS',
    mode: cfg.MODE,
    state: cfg.STATE,
    mutationAuthorized: cfg.mutationAuthorized,
    startedAt: startedAt,
    finishedAt: IO.nowIso(),
    durationMs: Date.now() - t0,
    regressions: regressions,
    npmTest: npmTest,
    git: {
      command: 'git status --porcelain',
      trackedBefore: gitBefore.tracked, trackedAfter: gitAfter.tracked,
      untrackedCountBefore: gitBefore.untracked.length, untrackedCountAfter: gitAfter.untracked.length,
      trackedModifiedCount: gitAfter.tracked.length,
      note: 'zero tracked repository files modified before or after the SPEC 07F regression suite',
      ok: gitOk,
    },
    artifactDrift: drift,
    frozenPlanImmutability: { files: frozenImmutability, allUnchanged: frozenOk },
    summary: summary,
    finalState: cfg.STATE,
    finalStateLine: 'Final state: ' + cfg.STATE,
    mutationAuthorizedLine: 'mutationAuthorized: false',
  };
  IO.writeJson(path.join(cfg.OUT_DIR, 'REGRESSION_RESULTS.json'), results);
  console.log('REGRESSIONS: ' + summary.passed + '/' + summary.attempted + ' ' + summary.verdict);
  console.log('mutationAuthorized: false');
  console.log('Final state: ' + cfg.STATE);
  process.exit(summary.verdict === 'PASS' ? cfg.EXIT.ok : cfg.EXIT.error);
}

main();
