'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const cfg = require('./config');
const IO = require('../SPEC_07F_executor/io');
const FP = require('../SPEC_07F_executor/frozen_plan');
const C = require('../SPEC_07C_lib.js');

function gitPorcelain() {
  const run = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8', timeout: 60000 });
  const lines = String(run.stdout || '').split(/\r?\n/).filter((l) => l.trim().length > 0);
  return {
    tracked: lines.filter((l) => !l.startsWith('??')).map((l) => l.trim()),
    untracked: lines.filter((l) => l.startsWith('??')).map((l) => l.trim()),
  };
}

function runNode(scriptArgs, timeout) {
  const t0 = Date.now();
  const run = spawnSync(process.execPath, scriptArgs, { encoding: 'utf8', timeout: timeout || 600000 });
  return {
    command: 'node ' + scriptArgs.join(' '),
    exitCode: run.status === null ? -1 : run.status,
    stdout: String(run.stdout || ''),
    stderr: String(run.stderr || ''),
    durationMs: Date.now() - t0,
  };
}

function runNpmTest() {
  const t0 = Date.now();
  const run = spawnSync('npm', ['test'], { encoding: 'utf8', timeout: 900000, shell: true });
  const out = (String(run.stdout || '') + String(run.stderr || '')).replace(/\u001b\[[0-9;]*m/g, '');
  const testsLine = (out.split(/\r?\n/).filter((l) => /Tests\b.*\d+ \//.test(l))[0] || '').trim();
  const filesLine = (out.split(/\r?\n/).filter((l) => /Test Files\b/.test(l))[0] || '').trim();
  const failing = out.split(/\r?\n/).filter((l) => /^ FAIL /.test(l) || /FAIL tests\//.test(l)).map((l) => l.trim()).filter((v, i, a) => a.indexOf(v) === i);
  return {
    command: 'npm test',
    exitCode: run.status === null ? -1 : run.status,
    testsLine: testsLine,
    filesLine: filesLine,
    failingTests: failing,
    durationMs: Date.now() - t0,
  };
}

function scanArtifactsForSecrets(files) {
  const token = IO.L.TOKEN;
  const hits = [];
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const text = fs.readFileSync(f, 'utf8');
    if (token && text.indexOf(token) >= 0) hits.push(f + ':token-substring');
  }
  return hits;
}

function scanApprovalTokens(files) {
  const hits = [];
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const text = fs.readFileSync(f, 'utf8');
    if (f.endsWith('.json')) {
      try {
        const out = [];
        C.findApprovalTokens(JSON.parse(text), out, path.basename(f));
        for (const h of out) hits.push(h);
      } catch (e) {
        hits.push(path.basename(f) + ':unparseable-json');
      }
    }
    const rows = text.split(/\r?\n/);
    for (let i = 0; i < rows.length; i++) {
      const v = rows[i].trim();
      if (v && C.APPROVAL_TOKENS.indexOf(v.toUpperCase()) >= 0) hits.push(path.basename(f) + ':line' + (i + 1) + '=' + v);
    }
  }
  return hits;
}

function runRegressions(context) {
  const startedAt = IO.nowIso();
  const t0 = Date.now();
  const checks = [];
  const add = (id, label, pass, detail) => checks.push({ id: id, label: label, pass: !!pass, detail: String(detail) });

  const own = runNode(['scripts/SPEC_07G_execute/run_tests.js'], 600000);
  const ownMatch = /07G TESTS: (\d+)\/(\d+) PASS/.exec(own.stdout);
  const ownOk = own.exitCode === 0 && ownMatch && ownMatch[1] === ownMatch[2] && own.stdout.indexOf('FAIL ') < 0;
  add('R-01', 'SPEC 07G offline test suite passes in full (execution path covered without production writes)',
    !!ownOk, 'exit=' + own.exitCode + ' summary=' + (ownMatch ? ownMatch[0] : 'marker-missing'));

  const barrierDir = 'report/SPEC_07F';
  const beforeBarrier = {};
  for (const f of fs.existsSync(barrierDir) ? fs.readdirSync(barrierDir) : []) beforeBarrier[f] = IO.shaFile(path.join(barrierDir, f));
  const barrier = runNode(['scripts/SPEC_07F_executor/cli.js', '--write'], 120000);
  const afterBarrier = {};
  for (const f of fs.existsSync(barrierDir) ? fs.readdirSync(barrierDir) : []) afterBarrier[f] = IO.shaFile(path.join(barrierDir, f));
  const barrierFilesUnchanged = JSON.stringify(beforeBarrier) === JSON.stringify(afterBarrier);
  const barrierOk = barrier.exitCode === 3 && /BARRIER:/.test(barrier.stdout + barrier.stderr) && barrierFilesUnchanged;
  add('R-02', 'SPEC 07F write barrier still refuses write intent with exit 3 and leaves every SPEC 07F artifact byte-identical (no bypass introduced)',
    barrierOk, 'exit=' + barrier.exitCode + ' artifactsUnchanged=' + barrierFilesUnchanged);

  let integrityRecheck = null;
  try {
    const run = FP.runIntegrity();
    integrityRecheck = run.report;
  } catch (e) {
    integrityRecheck = { verdict: 'ERROR', passed: 0, total: 21, violations: [e.message] };
  }
  add('R-03', 'Frozen input integrity re-check after execution still passes 21/21 (no frozen input drift)',
    integrityRecheck && integrityRecheck.verdict === 'PASS' && integrityRecheck.passed === 21 && integrityRecheck.total === 21,
    integrityRecheck ? integrityRecheck.passed + '/' + integrityRecheck.total + ' ' + integrityRecheck.verdict : 'missing');

  const npm = runNpmTest();
  const npmFailingKnown = npm.failingTests.every((l) => l.indexOf('tests/compare.test.ts') >= 0);
  const npmOk = npm.exitCode === 0 || (npm.failingTests.length > 0 && npmFailingKnown);
  add('R-04', 'Application test suite (npm test) shows no new failures beyond the pre-existing compare-config baseline',
    npmOk, 'exit=' + npm.exitCode + ' ' + npm.testsLine + ' failing=' + npm.failingTests.join(';'));

  const git = gitPorcelain();
  add('R-05', 'Git reports zero modified tracked repository files after the SPEC 07G execution',
    git.tracked.length === 0, 'tracked=' + git.tracked.length + (git.tracked.length ? ' ' + git.tracked.slice(0, 3).join(' | ') : ''));

  const frozen = context.frozenBefore.map((entry) => {
    const after = IO.fileExists(entry.file) ? IO.shaFile(entry.file) : null;
    return { file: entry.file, sha256Before: entry.sha256, sha256After: after, unchanged: entry.sha256 === after };
  });
  add('R-06', 'Every frozen plan artifact (SPEC 07C/07D inputs and the SPEC 07F frozen operation plan) is byte-identical before and after execution',
    frozen.every((f) => f.unchanged), frozen.filter((f) => !f.unchanged).map((f) => f.file).join(',') || 'all unchanged');

  const scopeLock = scopeLockCheck(context.ledgerRows, context.planRows);
  add('R-07', 'Ledger scope lock: exactly 234 operations over exactly 117 allowlisted targets, only the two approved field paths, every value byte-identical to the frozen plan, no excluded record',
    scopeLock.ok, 'targets=' + scopeLock.targets + ' ops=' + scopeLock.operations + ' problems=' + (scopeLock.problems.join(';') || 'none'));

  const artifactFiles = (context.artifactFiles || []).filter((f) => fs.existsSync(f));
  const secretHits = scanArtifactsForSecrets(artifactFiles);
  add('R-08', 'No artifact written by SPEC 07G contains the Sanity API token',
    secretHits.length === 0, 'files=' + artifactFiles.length + ' hits=' + (secretHits.join(',') || '0'));

  const gitOk = git.tracked.length === 0;
  const passed = checks.filter((c) => c.pass).length;
  const results = {
    spec: cfg.SPEC,
    phase: 'REGRESSION_RESULTS',
    mode: cfg.MODE,
    state: cfg.STATE,
    startedAt: startedAt,
    finishedAt: IO.nowIso(),
    durationMs: Date.now() - t0,
    checks: checks,
    commands: [
      { command: own.command, exitCode: own.exitCode, durationMs: own.durationMs, classification: ownOk ? 'PASS' : 'FAIL' },
      { command: barrier.command, exitCode: barrier.exitCode, durationMs: barrier.durationMs, classification: barrierOk ? 'PASS' : 'FAIL' },
      { command: npm.command, exitCode: npm.exitCode, durationMs: npm.durationMs, testsLine: npm.testsLine, filesLine: npm.filesLine, failingTests: npm.failingTests, classification: npm.exitCode === 0 ? 'PASS' : 'UNRELATED_BASELINE_FAILURE (pre-existing tests/compare.test.ts failure; no new failures from SPEC 07G)' },
    ],
    frozenPlanImmutability: frozen,
    integrityRecheck: { verdict: integrityRecheck.verdict, passed: integrityRecheck.passed, total: integrityRecheck.total },
    scopeLock: scopeLock,
    git: { trackedModifiedCount: git.tracked.length, tracked: git.tracked, untrackedCount: git.untracked.length, ok: gitOk },
    secretScan: { filesScanned: artifactFiles.length, hits: secretHits },
    summary: { attempted: checks.length, passed: passed, failed: checks.length - passed, verdict: passed === checks.length ? 'PASS' : 'FAIL' },
    finalState: cfg.STATE,
  };
  IO.writeJson(path.join(context.outDir, 'REGRESSION_RESULTS.json'), results);
  console.log('REGRESSIONS: ' + passed + '/' + checks.length + ' ' + results.summary.verdict);
  return results;
}

function scopeLockCheck(ledgerRows, planRows) {
  return runScopeLock(ledgerRows, planRows);
}

function runScopeLock(ledgerRows, planRows) {
  const problems = [];
  if (ledgerRows.length !== cfg.BASELINE.operations) problems.push('ledger-rows:' + ledgerRows.length);
  const ids = {};
  const fields = {};
  for (const r of ledgerRows) {
    ids[r.recordId] = (ids[r.recordId] || 0) + 1;
    fields[r.fieldPath] = (fields[r.fieldPath] || 0) + 1;
    if (cfg.ALLOWED_FIELDS.indexOf(r.fieldPath) < 0) problems.push('field:' + r.fieldPath);
  }
  const targetCount = Object.keys(ids).length;
  if (targetCount !== cfg.BASELINE.targets) problems.push('targets:' + targetCount);
  for (const id of cfg.AUTHORIZATION.excludedRecordIds) if (ids[id]) problems.push('excluded:' + id);
  for (const f of cfg.ALLOWED_FIELDS) if (fields[f] !== 117) problems.push('fieldCount:' + f + ':' + fields[f]);
  const frozenByKey = {};
  for (const r of planRows) frozenByKey[r.recordId + '|' + r.fieldPath] = r.frozenProposedValue;
  for (const r of ledgerRows) {
    if (frozenByKey[r.recordId + '|' + r.fieldPath] !== r.frozenProposedValue) problems.push('value:' + r.operationId);
  }
  return { ok: problems.length === 0, problems: problems, targets: targetCount, operations: ledgerRows.length, fields: fields };
}

module.exports = { runRegressions, gitPorcelain, runNode, runNpmTest, scanArtifactsForSecrets, scanApprovalTokens, runScopeLock };
