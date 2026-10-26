'use strict';

const fs = require('fs');
const path = require('path');
const cfg = require('./config');
const IO = require('./io');
const SS = require('./static_scan');

const P = (name) => path.join(cfg.OUT_DIR, name);
const NL = String.fromCharCode(10);
const must = (cond, msg) => { if (!cond) throw new Error('report: ' + msg); };
const cell = (s) => String(s === undefined || s === null ? '' : s).split('|').join('/').split(NL).join(' ');

const table = (headers, rows) => {
  const out = [];
  out.push('| ' + headers.map(cell).join(' | ') + ' |');
  out.push('| ' + headers.map(() => '---').join(' | ') + ' |');
  for (const r of rows) out.push('| ' + r.map(cell).join(' | ') + ' |');
  return out.join(NL);
};

const bullets = (items) => items.map((i) => '- ' + i).join(NL);
const lines = (items) => items.join(NL);

function loadArtifacts() {
  const integrity = IO.readJson(P('FROZEN_INPUT_INTEGRITY.json'));
  const dry = IO.readJson(P('DRY_RUN_RESULTS.json'));
  const wb = IO.readJson(P('WRITE_BARRIER_TEST_RESULTS.json'));
  const sm = IO.readJson(P('STATE_MACHINE_TEST_RESULTS.json'));
  const reg = IO.readJson(P('REGRESSION_RESULTS.json'));
  const planText = IO.readText(P('DRY_RUN_OPERATION_PLAN.csv'));
  const planRows = IO.L.parseCsv(planText);

  must(integrity.verdict === 'PASS' && integrity.passed === 21 && integrity.failed === 0, 'integrity not 21/21 PASS');
  must(planRows.length === 234, 'plan rows=' + planRows.length);
  must(dry.plan.summary.operations === 234 && dry.plan.summary.targets === 117, 'plan summary mismatch');
  must(dry.plan.determinism.doubleBuildByteIdentical === true, 'plan not deterministic');
  must(dry.plan.allowlist.passed === true, 'allowlist not passed');
  must(dry.preflight.source === 'LIVE_READ_ONLY' && dry.preflight.speciesCount === 218, 'preflight source/species mismatch');
  must(dry.pipeline.writeAttempts === 0 && dry.pipeline.productionMutationCalls === 0 && dry.pipeline.adapterConstructed === false, 'pipeline write evidence');
  must(dry.pipeline.blocked === 234 && dry.pipeline.status === 'DRY_RUN_COMPLETE', 'pipeline blocked/status');
  must(dry.staticScan.hits.length === 0 && dry.staticScan.legacyWriterFiles.length === 0 && dry.staticScan.unresolvedRequires.length === 0, 'static scan not clean');
  must(dry.staticScan.reachableCount === 18 && dry.staticScan.patternCount === 9, 'static scan counts');
  must(dry.staticScan.allCodeFilesScanned === 19 && dry.staticScan.allCodeHits.length === 0 && dry.staticScan.allCodeApprovalHits === 0 && dry.staticScan.allCodeLegacyWriters === 0, 'whole-code scan not clean');
  must(dry.safety.secretHitsInArtifacts === 0 && dry.safety.approvalTokenHits === 0, 'secret or approval token hit');
  must(dry.simulations.passed === 12 && dry.simulations.assertionsPassed === 63, 'simulations not 12/12 + 63/63');
  must(dry.simulations.operationStatesExercised.visited.length === 10, 'operation states visited != 10');
  must(wb.passed === 16 && wb.failed === 0, 'write barrier tests not 16/16');
  must(sm.passed === 16 && sm.failed === 0, 'state machine tests not 16/16');
  must(reg.summary.verdict === 'PASS' && reg.summary.failed === 0, 'regressions not PASS');
  must(reg.git.trackedModifiedCount === 0, 'tracked files modified');
  must(reg.frozenPlanImmutability.allUnchanged === true, 'frozen plan changed');
  must(reg.npmTest.ok === true, 'npm test not classified');
  const channel = [dry.safety.productionMutationCalls, wb.productionChannel.productionMutationCalls, sm.productionChannel.productionMutationCalls];
  must(channel.every((c) => c === 0), 'production mutation channel not zero');
  const adapter = [dry.safety.writeCapableClientConstructed, wb.productionChannel.writeCapableClientConstructed, sm.productionChannel.writeCapableClientConstructed];
  must(adapter.every((c) => c === 0), 'write capable client constructed');
  return { integrity, dry, wb, sm, reg, planText, planRows, channel, adapter };
}

function codeFiles() {
  return fs.readdirSync(cfg.CODE_DIR).filter((f) => f.endsWith('.js')).sort().map((f) => path.join(cfg.CODE_DIR, f));
}

function verifyPlanCsv(A) {
  const FP = require('./frozen_plan');
  const rebuilt = FP.runIntegrity();
  must(rebuilt.report.verdict === 'PASS', 'frozen plan rebuild failed at report time');
  const ops = rebuilt.operations;
  const byId = {};
  for (const r of A.planRows) byId[r.operationId] = r;
  must(Object.keys(byId).length === A.planRows.length, 'duplicate operationId in CSV');
  must(ops.length === A.planRows.length, 'operation count drift ops=' + ops.length + ' rows=' + A.planRows.length);
  const frozenFields = ['proposalId', 'recordId', 'recordType', 'title', 'fieldPath', 'frozenProposedValue', 'expectedRevision', 'sourceArtifact', 'sourceSha256', 'planRowSha256'];
  const mismatches = [];
  for (const op of ops) {
    const row = byId[op.operationId];
    if (!row) { mismatches.push(op.operationId + ':missing-row'); continue; }
    for (const f of frozenFields) {
      const want = String(op[f] === undefined || op[f] === null ? '' : op[f]);
      if (row[f] !== want) {
        mismatches.push(op.operationId + '.' + f);
        if (mismatches.length > 5) break;
      }
    }
    if (mismatches.length > 5) break;
  }
  must(mismatches.length === 0, 'csv frozen-field mismatches: ' + mismatches.join(','));
  const statusCounts = {};
  const preflightByTarget = {};
  for (const r of A.planRows) {
    statusCounts[r.dryRunStatus] = (statusCounts[r.dryRunStatus] || 0) + 1;
    preflightByTarget[r.recordId] = r.preflightState;
  }
  const preflightCounts = {};
  for (const k of Object.keys(preflightByTarget)) preflightCounts[preflightByTarget[k]] = (preflightCounts[preflightByTarget[k]] || 0) + 1;
  const pipelineCounts = A.dry.pipeline.stateCounts || {};
  const sortObj = (o) => JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));
  must(sortObj(statusCounts) === sortObj(pipelineCounts), 'csv dryRunStatus counts disagree with pipeline stateCounts: ' + JSON.stringify(statusCounts) + ' vs ' + JSON.stringify(pipelineCounts));
  const preflightCountsRecorded = A.dry.pipeline.preflightStateCounts || {};
  must(sortObj(preflightCounts) === sortObj(preflightCountsRecorded), 'csv preflightState counts disagree with preflight: ' + JSON.stringify(preflightCounts) + ' vs ' + JSON.stringify(preflightCountsRecorded));
  must(A.planRows.every((r) => r.writeBarrier === 'CLOSED' && r.mutationAuthorized === 'false' && r.idempotencyState === 'NOT_APPLIED'), 'csv safety columns not uniformly CLOSED/false/NOT_APPLIED');
  return {
    ok: true,
    operations: ops.length,
    rows: A.planRows.length,
    frozenFieldsCompared: frozenFields.length,
    frozenFieldComparisons: ops.length * frozenFields.length,
    mismatches: mismatches.length,
    dryRunStatusCounts: statusCounts,
    preflightStateCountsByTarget: preflightCounts,
    agreesWithDryRunResults: true,
    safetyColumnsUniform: true,
  };
}

function gitTrackedModified() {
  try {
    const { spawnSync } = require('child_process');
    const run = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8', timeout: 60000 });
    return String(run.stdout || '').split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('??')).length;
  } catch (e) {
    return -1;
  }
}

function artifactRows(excluded) {
  const skip = {};
  for (const e of excluded) skip[e] = true;
  return cfg.ARTIFACTS.filter((a) => !skip[a]).map((a) => {
    const f = IO.fingerprintOf(P(a));
    return [a, f.exists ? f.bytes : 'pending', f.exists ? f.sha256 : 'pending'];
  });
}

function statusBlock(extra) {
  const b = [
    'No canonical mutations were performed.',
    'No SEO mutations were performed.',
    'Production mutation calls: 0.',
    'mutationAuthorized: false',
    'GATE C is NOT authorized by SPEC 07F.',
  ];
  return b.concat(extra || [], ['Final state: ' + cfg.STATE]);
}

function buildAudit(A) {
  const { integrity, dry, wb, sm, reg, planRows, consistency } = A;
  const statusCounts = {};
  const preflightCounts = {};
  for (const r of planRows) {
    statusCounts[r.dryRunStatus] = (statusCounts[r.dryRunStatus] || 0) + 1;
    preflightCounts[r.preflightState] = (preflightCounts[r.preflightState] || 0) + 1;
  }
  const md = [];
  md.push('# SPEC 07F - Executor Implementation and Dry-Run Validation: Audit Report');
  md.push('');
  md.push('- Spec: SPEC 07F');
  md.push('- Phase: ' + cfg.PHASE);
  md.push('- Mode: ' + cfg.MODE);
  md.push('- Generated: ' + IO.nowIso());
  md.push('- Entry point: `node scripts/SPEC_07F_executor/cli.js dry-run`');
  md.push('- State: ' + cfg.STATE);
  md.push('- mutationAuthorized: false');
  md.push('');
  md.push('## 1. Scope and authorization posture');
  md.push('');
  md.push('SPEC 07F implements an isolated, testable executor for the frozen SPEC 07D plan (117 species targets, 234 operations covering only `seo.metaTitle` and `seo.metaDescription`) and validates it in dry-run mode. No live mutation was performed. No canonical document and no SEO field was written in this phase, and no mutation path is reachable from this entry point.');
  md.push('');
  md.push(bullets([
    'Default invocation is dry-run; the write barrier is default-deny and fails closed on any write-intent signal (CLI flag, environment variable, tampered frozen input, tampered authorization contract, or a code path that cannot satisfy the contract).',
    'Exit codes: 0 ok, 1 error, 2 integrity violation, 3 write-barrier violation, 4 unexpected operation count.',
    'The production mutation adapter is never constructed: `createProductionMutationAdapter()` throws before any client is built, and every write attempt raises `BarrierViolation`.',
    'This phase does not create, extend, or imply a GATE C authorization. GATE C remains owned by PM.',
  ]));
  md.push('');
  md.push('## 2. Frozen input integrity (read-only production and artifact checks)');
  md.push('');
  md.push('Integrity verdict: **' + integrity.verdict + ' ' + integrity.passed + '/' + integrity.total + '** (`FROZEN_INPUT_INTEGRITY.json`).');
  md.push('');
  md.push(table(['Check', 'Result', 'Detail'], integrity.checks.map((c) => [c.id, c.pass ? 'PASS' : 'FAIL', c.detail])));
  md.push('');
  md.push('Baseline reconciliation (unchanged from SPEC 07E): ' + Object.keys(integrity.baseline).map((k) => k + '=' + integrity.baseline[k]).join(', ') + '.');
  md.push('');
  md.push('## 3. Read-only production checks');
  md.push('');
  md.push(bullets([
    'Transport: `' + dry.preflight.transport + '` against project `' + cfg.PROJECT_ID + '` dataset `' + cfg.DATASET + '` apiVersion `' + cfg.API_VERSION + '`; no mutation endpoint is referenced anywhere in the reachable module graph.',
    'Preflight source: ' + dry.preflight.source + ' at ' + dry.preflight.readAt + '.',
    'Live species documents read: ' + dry.preflight.speciesCount + ' (baseline 218).',
    'Preflight target states: ' + JSON.stringify(dry.pipeline.preflightStateCounts) + ' over ' + dry.preflight.targets + ' targets; operation outcomes: ' + JSON.stringify(dry.pipeline.preflightOutcomeCounts) + '.',
    'Every target is authorization-blocked: ' + dry.pipeline.allTargetsAuthorizationBlocked + ' (barrier ' + dry.pipeline.barrier + ', blocked operations ' + dry.pipeline.blocked + ').',
    'Live read is used only to classify current state; it never writes and never re-baselines the canonical hash.',
  ]));
  md.push('');
  md.push('## 4. Deterministic dry-run planning');
  md.push('');
  md.push(bullets([
    'Plan artifact: `' + dry.plan.csvPath + '` (' + planRows.length + ' operation rows, ' + IO.fingerprintOf(P('DRY_RUN_OPERATION_PLAN.csv')).bytes + ' bytes, sha256 `' + dry.plan.sha256 + '`).',
    'Structure: ' + dry.plan.summary.targets + ' targets, ' + dry.plan.summary.operations + ' operations; per-field ' + JSON.stringify(dry.plan.summary.perField) + '; operations per target min/max ' + dry.plan.summary.operationsPerTargetMin + '/' + dry.plan.summary.operationsPerTargetMax + '.',
    'Allowlist: passed=' + dry.plan.allowlist.passed + ', allowedFields=' + JSON.stringify(dry.plan.allowlist.allowedFields) + ', duplicateOperationIds=' + JSON.stringify(dry.plan.allowlist.duplicateOperationIds) + '.',
    'Determinism: double build byte-identical = ' + dry.plan.determinism.doubleBuildByteIdentical + ' (independent rebuild reproduces the same CSV sha256).',
    'Per-operation dry-run outcome recorded in the CSV itself: dryRunStatus = ' + JSON.stringify(statusCounts) + '; preflightState = ' + JSON.stringify(preflightCounts) + '; writeBarrier = CLOSED on every row; mutationAuthorized = false on every row; idempotencyState = NOT_APPLIED on every row (this run applied nothing).',
    'Independent CSV-to-frozen-input reconciliation at report time: ' + consistency.frozenFieldComparisons + ' frozen field comparisons across ' + consistency.operations + ' operations, mismatches = ' + consistency.mismatches + '; CSV dryRunStatus counts agree with the recorded pipeline stateCounts and per-target preflightState counts agree with the recorded preflight counts = ' + consistency.agreesWithDryRunResults + '.',
    'Every row carries provenance and safety metadata: sourceArtifact, sourceSha256, planRowSha256, allowlistStatus, dryRunStatus, preflightState, writeBarrier, mutationAuthorized, verificationContract, provenanceNote.',
    'The plan is planning output only. It is not a mutation request and carries no execution instruction.',
  ]));
  md.push('');
  md.push('## 5. Write barrier (static inspection plus fail-closed code plus tests)');
  md.push('');
  md.push('Static source inspection from entry point `' + dry.staticScan.entry + '`:');
  md.push('');
  md.push(bullets([
    'Reachable files: ' + dry.staticScan.reachableCount + ' (local require edges: ' + dry.staticScan.localRequires.length + ', unresolved requires: ' + dry.staticScan.unresolvedRequires.length + ').',
    'Write-capable patterns scanned: ' + dry.staticScan.patternCount + ' (mutation endpoint paths, HTTP mutation methods, patch/transaction calls, document create-or-replace entry points, raw HTTPS request).',
    'Hits in the reachable graph: ' + dry.staticScan.hits.length + '. Write-capable reachable: ' + dry.staticScan.writeCapableReachable + '.',
    'Legacy writer files (pre-07F execute scripts) reachable: ' + dry.staticScan.legacyWriterFiles.length + ' (' + dry.staticScan.legacyWriterReachable + ').',
    'Whole SPEC 07F code directory scan (all ' + dry.staticScan.allCodeFilesScanned + ' files, including the regression runner and this report generator): write-capable hits = ' + dry.staticScan.allCodeHits.length + ', legacy writers = ' + dry.staticScan.allCodeLegacyWriters + ', approval-token lines = ' + dry.staticScan.allCodeApprovalHits + '.',
    'Secret and approval-token scan at CLI time (code plus artifacts present then): secretHits=' + dry.safety.secretHitsInArtifacts + ', approvalTokenHits=' + dry.safety.approvalTokenHits + '; a final report-time scan over every SPEC 07F code file and artifact is recorded in `SOURCE_MANIFEST.json` as `artifactScan`.',
  ]));
  md.push('');
  md.push('Write-barrier test results (`WRITE_BARRIER_TEST_RESULTS.json`): **' + wb.passed + '/' + wb.total + ' ' + wb.verdict + '**.');
  md.push('');
  md.push(table(['Id', 'Test', 'Result', 'Detail'], wb.tests.map((t) => [t.id, t.name, t.pass ? 'PASS' : 'FAIL', t.detail])));
  md.push('');
  md.push('CLI exit codes observed by the barrier suite: ' + JSON.stringify(wb.cliExitCodesObserved) + '.');
  md.push('');
  md.push('## 6. Fake-adapter simulations (no production endpoint involved)');
  md.push('');
  md.push(bullets([
    'Scenarios: ' + dry.simulations.passed + '/' + dry.simulations.total + ' passed, assertions ' + dry.simulations.assertionsPassed + '/' + dry.simulations.assertions + '.',
    'Simulated adapter calls (in-memory fake store only): ' + dry.simulations.simulatedAdapterCalls + '; production mutation calls: ' + dry.simulations.productionChannel.productionMutationCalls + '.',
    'Operation states exercised: ' + dry.simulations.operationStatesExercised.visited.length + ' visited (' + dry.simulations.operationStatesExercised.visited.join(', ') + ').',
    'Final states observed: ' + dry.simulations.operationStatesExercised.finalStates.join(', ') + '.',
    'Scenario coverage: happy path, per-operation partial failure, conditional revision mismatch with bounded re-read retry, already-applied idempotency, conflict withholding, missing document, read failure, verification success, verification drift, sibling-key preservation, write-barrier interlock, and reconciliation accounting.',
  ]));
  md.push('');
  md.push('## 7. State machine, idempotency, verification and plan tests');
  md.push('');
  md.push('Test results (`STATE_MACHINE_TEST_RESULTS.json`): **' + sm.passed + '/' + sm.total + ' ' + sm.verdict + '**.');
  md.push('');
  md.push(table(['Id', 'Test', 'Result', 'Detail'], sm.tests.map((t) => [t.id, t.name, t.pass ? 'PASS' : 'FAIL', t.detail])));
  md.push('');
  md.push('Combined test total: ' + (wb.passed + sm.passed) + '/' + (wb.total + sm.total) + '.');
  md.push('');
  md.push('SM-11 rebuilds the plan rows without dry-run overrides, which is the `plan` command form of the CSV; that sha256 therefore differs from the dry-run CSV sha256 recorded in section 4, and each form is independently deterministic.');
  md.push('');
  md.push('## 8. Regression results');
  md.push('');
  md.push(table(['Id', 'Command', 'Result', 'Detail'], reg.regressions.map((r) => [r.id, r.command, r.ok ? 'PASS' : 'FAIL', r.detail])));
  md.push('');
  md.push(bullets([
    '`' + reg.npmTest.command + '`: exit ' + reg.npmTest.exitCode + ', "' + reg.npmTest.filesLine + '", failing: ' + (reg.npmTest.failingTests.length ? reg.npmTest.failingTests.join('; ') : 'none') + ' -> classified ' + reg.npmTest.classification + '.',
    'Git: ' + reg.git.note + ' (tracked modified count ' + reg.git.trackedModifiedCount + ').',
    'Report drift: ' + reg.artifactDrift.changed.length + ' changed file(s), all within the expected validator-regeneration set; unexpected=' + reg.artifactDrift.unexpectedChanged.length + ', added=' + reg.artifactDrift.added.length + ', removed=' + reg.artifactDrift.removed.length + '.',
    'Frozen plan immutability: ' + reg.frozenPlanImmutability.files.length + ' files hash-identical before and after = ' + reg.frozenPlanImmutability.allUnchanged + '.',
    'Regression summary: ' + reg.summary.passed + '/' + reg.summary.attempted + ' ' + reg.summary.verdict + '.',
  ]));
  md.push('');
  md.push('## 9. Verified facts, assumptions, and unproven properties');
  md.push('');
  md.push('Verified in this phase:');
  md.push('');
  md.push(bullets([
    'All 21 frozen-input integrity checks pass against the current bytes of the frozen inputs.',
    'The dry-run plan reproduces byte-identically on independent rebuild (' + dry.plan.sha256 + ').',
    'The reachable module graph from the CLI entry point contains zero write-capable patterns and zero legacy writers.',
    'Every tested write-intent signal terminates with a barrier failure and exit code 3 before any adapter is constructed.',
    'Production mutation call count across CLI, tests and simulations: ' + A.channel[0] + '/' + A.channel[1] + '/' + A.channel[2] + '.',
    'All six prior-phase validators plus the project test suite were executed and their outcomes recorded without alteration.',
  ]));
  md.push('');
  md.push('Assumptions carried forward (from SPEC 07E, not re-proven here):');
  md.push('');
  md.push(bullets([
    'Conditional revision enforcement at execution time relies on `ifRevisionID` support in the installed Sanity client, as established by SPEC 07E from dependency code and prior authorized usage.',
    'The frozen expected revisions match live revisions as of ' + dry.preflight.readAt + '; they may drift afterwards.',
    'Baseline counts (473 wiki / 218 species / 117 targets / 234 operations / 3 excluded / 85 medium / 13 blocked) remain authoritative.',
  ]));
  md.push('');
  md.push('Unproven properties (explicitly not demonstrated by SPEC 07F):');
  md.push('');
  md.push(bullets([
    'No production write and no production read-after-write cycle has been executed; end-to-end mutation behaviour against the live API is unproven.',
    'Network transport, authentication, rate limiting and partial multi-document HTTP failure are not exercised by the in-memory fake adapter.',
    'A static text scan plus fail-closed code cannot mathematically prove runtime write-safety; the observed exit codes are empirical evidence over the tested flag and environment surface.',
    'Revisions may change between this dry run and any future authorized execution, which would move operations into REVISION_DRIFT and require re-read, not silent overwrite.',
    'Time to complete a real 234-operation execution, and its interleaving with concurrent editorial edits, is unmeasured.',
  ]));
  md.push('');
  md.push('## 10. Limitations and residual risks');
  md.push('');
  md.push(bullets(wb.limitations.concat([
    'Re-running the SPEC 07E validator regenerates its own deliverables (including volatile metadata); SPEC 07F re-ran its frozen-input integrity check after the regression suite so recorded hashes match the post-regression bytes.',
    'SPEC 07E enumerates future entry points from top-level `scripts/*.js` only, so its point-in-time "no SPEC 07F entry point exists" wording does not see the `scripts/SPEC_07F_executor/` subdirectory; SPEC 07F performs its own exhaustive scan of its full module set (' + dry.staticScan.allCodeFilesScanned + ' files, ' + dry.staticScan.allCodeHits.length + ' hits).',
    'Partial failure between the two operations of a single target leaves one field applied and one withheld; recovery follows SPEC 07E per-operation outcomes, never automatic rollback or bulk retry.',
  ])));
  md.push('');
  md.push('## 11. Commands executed');
  md.push('');
  md.push('```');
  md.push(lines([
    'node scripts/SPEC_07F_executor/cli.js validate --out <scratch>',
    'node scripts/SPEC_07F_executor/cli.js plan --out <scratch>',
    'node scripts/SPEC_07F_executor/cli.js simulate --out <scratch>',
    'node scripts/SPEC_07F_executor/cli.js dry-run --offline --out <scratch>',
    'node scripts/SPEC_07F_executor/cli.js dry-run --out <scratch>          (cross-run determinism, CSV sha256 identical to the canonical artifact)',
    'node scripts/SPEC_07F_executor/cli.js dry-run                          (canonical artifacts in report/SPEC_07F)',
    'node scripts/SPEC_07F_executor/cli.js dry-run --execute                (expected: exit 3, write barrier)',
    'node scripts/SPEC_07F_executor/cli.js dry-run --write                  (expected: exit 3, write barrier)',
    'node scripts/SPEC_07F_executor/cli.js dry-run --bogus                  (expected: exit 3, unrecognized option refused)',
    'node scripts/SPEC_07F_executor/cli.js --help                           (expected: exit 0)',
    'SPEC_07F_MUTATION_AUTHORIZED=true node scripts/SPEC_07F_executor/cli.js dry-run   (expected: exit 3, environment bypass refused)',
    'node scripts/SPEC_07F_executor/run_tests.js',
    'node scripts/SPEC_07F_executor/run_regressions.js',
    'node scripts/SPEC_07F_executor/report.js',
    'npm test                    (spawned by run_regressions.js)',
    'git status --porcelain      (before, during and after)',
  ]));
  md.push('```');
  md.push('');
  md.push('## 12. Artifacts');
  md.push('');
  md.push('All nine artifacts of this phase are written to `report/SPEC_07F/`. The table lists the artifacts whose bytes are final at the moment this report is generated; `COMPLETION_REPORT.md` and `SOURCE_MANIFEST.json` are written after this file, so their hashes are not listed here (the completion report lists them for every artifact that precedes it, and the manifest hashes everything except itself).');
  md.push('');
  md.push(table(['Artifact', 'Bytes', 'sha256'], artifactRows(['AUDIT_REPORT.md', 'COMPLETION_REPORT.md', 'SOURCE_MANIFEST.json'])));
  md.push('');
  md.push('## 13. Status');
  md.push('');
  md.push(bullets(statusBlock([
    'SPEC 07F complete: executor implemented, dry-run validated, ' + (wb.passed + sm.passed) + '/' + (wb.total + sm.total) + ' tests PASS, ' + reg.summary.passed + '/' + reg.summary.attempted + ' regression checks PASS.',
    'RECOMMEND_GO_TO_PM_REVIEW',
  ])));
  md.push('');
  md.push('Final state: ' + cfg.STATE);
  md.push('');
  md.push('mutationAuthorized: false');
  md.push('');
  return md.join(NL);
}

function buildCompletion(A) {
  const { integrity, dry, wb, sm, reg, planRows, consistency } = A;
  const md = [];
  md.push('# SPEC 07F - Executor Implementation and Dry-Run Validation: Completion Report');
  md.push('');
  md.push('## 14. Report');
  md.push('');
  md.push('**Overall status: ' + cfg.SPEC + ' ' + cfg.MODE + ' complete - ' + (wb.passed + sm.passed) + '/' + (wb.total + sm.total) + ' tests PASS, ' + reg.summary.passed + '/' + reg.summary.attempted + ' regression checks PASS, ' + integrity.passed + '/' + integrity.total + ' integrity checks PASS, verdict PASS.**');
  md.push('');
  md.push('1. **No live mutation was performed.** No canonical document and no SEO field was written. Production mutation calls: 0. Mutation endpoint calls: 0. Write-capable clients constructed: 0. The production mutation adapter was never constructed; its constructor throws before any client exists.');
  md.push('2. **Frozen input integrity:** ' + integrity.passed + '/' + integrity.total + ' checks PASS over ' + integrity.inputs.length + ' frozen inputs (SPEC 07 proposal, SPEC 07C FINAL/EXCLUDED/FREEZE/VALIDATION, SPEC 07D plan/recon/validation/manifest/snapshot, SPEC 07E review/concurrency/allowlist/regression). Baseline: ' + Object.keys(integrity.baseline).map((k) => k + '=' + integrity.baseline[k]).join(', ') + '.');
  md.push('3. **Plan reconstruction:** ' + planRows.length + ' operations over ' + dry.plan.summary.targets + ' targets, exactly 2 operations per target, only ' + JSON.stringify(dry.plan.summary.allowedFields) + ', 3 excluded rows and the 85 medium / 13 blocked rows absent. Plan sha256 `' + dry.plan.sha256 + '`, double build byte-identical = ' + dry.plan.determinism.doubleBuildByteIdentical + '. Report-time reconciliation of the CSV against a fresh rebuild of the frozen plan: ' + consistency.frozenFieldComparisons + ' field comparisons, ' + consistency.mismatches + ' mismatches, CSV outcome counts agree with the recorded results = ' + consistency.agreesWithDryRunResults + '.');
  md.push('4. **Write-barrier evidence:** default-deny barrier closed with ' + dry.pipeline.blocked + ' operations blocked and 0 write attempts; exit codes observed ' + JSON.stringify(wb.cliExitCodesObserved) + '; static scan of ' + dry.staticScan.reachableFiles.length + ' reachable files found ' + dry.staticScan.hits.length + ' write-capable hits and ' + dry.staticScan.legacyWriterFiles.length + ' legacy writers; adapter construction attempts ' + A.adapter[0] + '/' + A.adapter[1] + '/' + A.adapter[2] + '.');
  md.push('5. **Tests:** write-barrier suite ' + wb.passed + '/' + wb.total + ' PASS; state machine, idempotency, verification and plan suite ' + sm.passed + '/' + sm.total + ' PASS; combined ' + (wb.passed + sm.passed) + '/' + (wb.total + sm.total) + '. Fake-adapter scenarios ' + dry.simulations.passed + '/' + dry.simulations.total + ' with ' + dry.simulations.assertionsPassed + '/' + dry.simulations.assertions + ' assertions across ' + dry.simulations.operationStatesExercised.visited.length + ' operation states and ' + dry.simulations.simulatedAdapterCalls + ' simulated adapter calls.');
  md.push('6. **Regressions:** ' + reg.regressions.map((r) => r.id + ' ' + (r.ok ? 'PASS' : 'FAIL')).join(', ') + '; `npm test` exit ' + reg.npmTest.exitCode + ' with "' + reg.npmTest.filesLine + '" and failing "' + reg.npmTest.failingTests[0] + '" classified ' + reg.npmTest.classification + '; `git status --porcelain` tracked modified files before/after = ' + reg.git.trackedBefore.length + '/' + reg.git.trackedAfter.length + '.');
  md.push('7. **Determinism:** plan double-build identical (' + dry.plan.sha256 + '); SPEC 07D determinism ' + (reg.regressions.find((r) => r.id === 'R-07D') || {}).determinismChecks + '/5; SPEC 07E determinism marker ' + (reg.regressions.find((r) => r.id === 'R-07E') || {}).determinismDetail + '; report drift unexpected=' + reg.artifactDrift.unexpectedChanged.length + ', added=' + reg.artifactDrift.added.length + ', removed=' + reg.artifactDrift.removed.length + '.');
  md.push('8. **Files changed:** zero tracked repository files modified (SPEC 07F adds only `scripts/SPEC_07F_executor/*.js` and `report/SPEC_07F/*`, both untracked). Frozen plan artifacts unchanged: ' + reg.frozenPlanImmutability.allUnchanged + '.');
  md.push('9. **Artifacts (report/SPEC_07F/):** hashes below are current at the time this report is written; `COMPLETION_REPORT.md` cannot list its own hash and `SOURCE_MANIFEST.json` is written last and hashes every artifact except itself.');
  md.push('');
  md.push(table(['Artifact', 'Bytes', 'sha256'], artifactRows(['COMPLETION_REPORT.md', 'SOURCE_MANIFEST.json'])));
  md.push('');
  md.push('10. **Residual risks and unproven properties:** no production write or read-after-write cycle executed; fake adapter does not exercise network/auth/rate-limit failure; revisions captured at ' + dry.preflight.readAt + ' may drift before any authorized execution; static scanning cannot mathematically prove runtime write-safety; partial failure between the two operations of one target requires SPEC 07E per-operation recovery, never automatic rollback or bulk retry. See `AUDIT_REPORT.md` sections 9-10.');
  md.push('11. **Commands:**');
  md.push('');
  md.push('```');
  md.push(lines([
    'node scripts/SPEC_07F_executor/cli.js dry-run',
    'node scripts/SPEC_07F_executor/cli.js dry-run --out <scratch>   (independent cross-run determinism check)',
    'node scripts/SPEC_07F_executor/run_tests.js',
    'node scripts/SPEC_07F_executor/run_regressions.js',
    'node scripts/SPEC_07F_executor/report.js',
    'npm test',
    'git status --porcelain',
  ]));
  md.push('```');
  md.push('');
  md.push('12. **Recommendation to PM:** the executor and its dry-run evidence are complete and internally consistent; review the artifacts and decide separately whether to authorize GATE C execution. SPEC 07F does not authorize it.');
  md.push('');
  md.push('RECOMMEND_GO_TO_PM_REVIEW');
  md.push('');
  md.push('Final state: ' + cfg.STATE);
  md.push('');
  md.push('mutationAuthorized: false');
  md.push('');
  return md.join(NL);
}

function buildManifest(A, code, scan) {
  const inputs = Object.keys(cfg.INPUTS).map((k) => {
    const f = IO.fingerprintOf(cfg.INPUTS[k]);
    must(f.exists, 'missing input ' + cfg.INPUTS[k]);
    return { role: k, file: f.file, bytes: f.bytes, sha256: f.sha256 };
  });
  const scripts = code.map((f) => {
    const fp = IO.fingerprintOf(f);
    must(fp.exists, 'missing code ' + f);
    return { file: fp.file, bytes: fp.bytes, sha256: fp.sha256 };
  });
  const others = cfg.ARTIFACTS.filter((a) => a !== 'SOURCE_MANIFEST.json');
  const outputs = others.map((a) => {
    const fp = IO.fingerprintOf(P(a));
    must(fp.exists, 'missing artifact ' + a);
    return { file: fp.file, bytes: fp.bytes, sha256: fp.sha256 };
  });
  const presence = cfg.ARTIFACTS.map((a) => ({ artifact: a, present: IO.fileExists(P(a)) }));
  return {
    spec: cfg.SPEC,
    phase: 'SOURCE_MANIFEST',
    mode: cfg.MODE,
    state: cfg.STATE,
    mutationAuthorized: cfg.mutationAuthorized,
    generatedAt: IO.nowIso(),
    sources: {
      projectId: cfg.PROJECT_ID,
      dataset: cfg.DATASET,
      apiVersion: cfg.API_VERSION,
      method: 'Read-only Sanity data/query GET for preflight classification; no write endpoint referenced, constructed or called by SPEC 07F',
      canonicalHash: cfg.IDENTITY_HASH,
    },
    tools: (() => {
      const { spawnSync } = require('child_process');
      const npmV = spawnSync('npm', ['--version'], { encoding: 'utf8', timeout: 60000, shell: true });
      let clientV = 'unavailable';
      try { clientV = require('../../../node_modules/@sanity/client/package.json').version; } catch (e) { clientV = 'not-resolved'; }
      return { node: process.version, npm: String(npmV.stdout || '').trim(), sanityClient: clientV, testRunner: 'vitest (npm test) plus node harness scripts/SPEC_07F_executor/run_tests.js' };
    })(),
    inputs: inputs,
    scripts: scripts,
    outputs: outputs,
    consistency: A.consistency,
    artifactPresence: {
      required: cfg.ARTIFACTS.length,
      present: presence.filter((p) => p.present).length,
      detail: presence,
      selfNote: 'SOURCE_MANIFEST.json is this file; it is written first, then rewritten so its own presence is recorded. Its own hash is intentionally not recorded inside itself.',
    },
    volatileMetadata: cfg.VOLATILE_METADATA,
    artifactScan: {
      filesScanned: scan.filesScanned,
      secretHits: scan.secretHits,
      approvalTokenHits: scan.approvalHits.length,
      approvalTokenVocabulary: 'the five fixed approval tokens defined in scripts/SPEC_07C_lib.js (APPROVAL_TOKENS); the values themselves are deliberately not stored in this artifact',
      scope: 'all SPEC 07F code files plus every SPEC 07F artifact written before this manifest',
      hits: scan.approvalHits,
    },
    safety: {
      productionMutationCalls: 0,
      writeCapableClientConstructed: 0,
      mutationEndpointCalls: 0,
      canonicalMutations: 0,
      seoMutations: 0,
      liveWrites: 0,
      secretHitsInArtifacts: scan.secretHits,
      approvalTokenHits: scan.approvalHits.length,
      mutationAuthorized: false,
      state: cfg.STATE,
    },
    statusBlock: statusBlock(['SPEC 07F artifacts: ' + presence.filter((p) => p.present).length + '/' + cfg.ARTIFACTS.length + ' present.']),
  };
}

function main() {
  const A = loadArtifacts();
  A.consistency = verifyPlanCsv(A);
  const code = codeFiles();
  must(code.length >= 16, 'too few code files: ' + code.length);

  const audit = buildAudit(A);
  IO.writeText(P('AUDIT_REPORT.md'), audit);
  const completion = buildCompletion(A);
  IO.writeText(P('COMPLETION_REPORT.md'), completion);

  const scanTargets = code.concat(cfg.ARTIFACTS.map(P).filter((f) => IO.fileExists(f)));
  let token = null;
  try { token = IO.L.TOKEN; } catch (e) { token = null; }
  must(token, 'token unavailable for the negative credential scan');
  let secretHits = 0;
  const approvalHits = [];
  for (const f of scanTargets) {
    const text = IO.readText(f);
    if (text.indexOf(token) >= 0) secretHits += 1;
    for (const h of SS.scanApprovalText(text)) approvalHits.push(f + ' ' + h);
  }
  must(secretHits === 0, 'credential found in ' + secretHits + ' files');
  must(approvalHits.length === 0, 'approval token found: ' + approvalHits.slice(0, 5).join(' ; '));

  const scan = { filesScanned: scanTargets.length, secretHits: secretHits, approvalHits: approvalHits };
  const manifest = buildManifest(A, code, scan);
  IO.writeJson(P('SOURCE_MANIFEST.json'), manifest);
  const presence2 = cfg.ARTIFACTS.map((a) => ({ artifact: a, present: IO.fileExists(P(a)) }));
  manifest.artifactPresence = {
    required: cfg.ARTIFACTS.length,
    present: presence2.filter((p) => p.present).length,
    detail: presence2,
    selfNote: manifest.artifactPresence.selfNote,
  };
  manifest.statusBlock = statusBlock(['SPEC 07F artifacts: ' + presence2.filter((p) => p.present).length + '/' + cfg.ARTIFACTS.length + ' present.']);
  IO.writeJson(P('SOURCE_MANIFEST.json'), manifest);

  const missing = cfg.ARTIFACTS.filter((a) => !IO.fileExists(P(a)));
  must(missing.length === 0, 'missing artifacts: ' + missing.join(','));

  const tracked = gitTrackedModified();
  console.log('ARTIFACTS: ' + cfg.ARTIFACTS.length + '/' + cfg.ARTIFACTS.length + ' present in ' + cfg.OUT_DIR);
  console.log('SOURCE FILES: ' + code.length + ' hashed; INPUTS: ' + manifest.inputs.length + '; OUTPUTS: ' + manifest.outputs.length);
  console.log('CREDENTIAL SCAN: files=' + scan.filesScanned + ' secretHits=' + scan.secretHits + ' approvalTokenHits=' + scan.approvalHits.length);
  console.log('TRACKED MODIFIED: ' + tracked);
  console.log('mutationAuthorized: false');
  console.log('Final state: ' + cfg.STATE);
}

main();
