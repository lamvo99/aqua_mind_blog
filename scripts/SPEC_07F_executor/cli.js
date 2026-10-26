'use strict';

const path = require('path');
const fs = require('fs');
const cfg = require('./config');
const G = require('./guard');
const IO = require('./io');
const FP = require('./frozen_plan');
const AL = require('./allowlist');
const PL = require('./planner');
const PIPE = require('./pipeline');
const LR = require('./live_read');
const SC = require('./scenarios');
const FA = require('./fake_adapter');
const AUD = require('./audit_events');
const SCAN = require('./static_scan');

const HELP = [
  'SPEC 07F executor - implementation and dry-run only',
  '',
  'usage: node scripts/SPEC_07F_executor/cli.js <command> [options]',
  '',
  'commands:',
  '  validate   verify frozen input integrity',
  '  plan       verify integrity and build the dry-run operation plan',
  '  simulate   verify, plan and run preflight plus fake-adapter simulations',
  '  dry-run    all of the above (default)',
  '',
  'options:',
  '  --out <dir>          output directory (default ' + cfg.OUT_DIR + ')',
  '  --offline            skip the read-only live preflight and use a simulated store',
  '  --live-preflight     read-only live preflight (default)',
  '  --help               show this message',
  '',
  'This build cannot perform production mutation. mutationAuthorized is hardcoded false.',
  'Write requesting flags or environment variables are refused with exit code ' + cfg.EXIT.barrier + '.',
].join('\n');

function parseArgs(argv) {
  const opts = { command: 'dry-run', out: cfg.OUT_DIR, offline: false, help: false, unknown: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help') { opts.help = true; continue; }
    if (a === '--offline') { opts.offline = true; continue; }
    if (a === '--live-preflight') { opts.offline = false; continue; }
    if (a === '--out') {
      const value = argv[i + 1];
      if (!value || value.charAt(0) === '-') { opts.unknown.push('--out'); continue; }
      opts.out = value;
      i += 1;
      continue;
    }
    if (a.charAt(0) === '-') { opts.unknown.push(a); continue; }
    if (i === 0) opts.command = a;
    else opts.unknown.push(a);
  }
  return opts;
}

function frozenByKey(planRows) {
  const map = {};
  for (const r of planRows) {
    map[r.recordId + '|' + r.fieldPath] = {
      frozenProposedValue: r.frozenProposedValue,
      expectedRevision: r.expectedRevision,
    };
  }
  return map;
}

function containsSecret(text) {
  try {
    const token = IO.L.TOKEN;
    return !!(token && text.indexOf(token) >= 0);
  } catch (e) {
    return false;
  }
}

function statusLines(lines) {
  for (const l of lines) console.log(l);
}

async function main(argv, env) {
  const opts = parseArgs(argv);
  if (opts.help) {
    console.log(HELP);
    return cfg.EXIT.ok;
  }
  let mode;
  try {
    mode = G.resolveMode(argv, env);
  } catch (e) {
    console.error('BARRIER: ' + e.message);
    return cfg.EXIT.barrier;
  }
  if (opts.unknown.length) {
    console.error('BARRIER: unrecognized option(s) refused: ' + opts.unknown.join(', ') + '. SPEC 07F is default-deny.');
    return cfg.EXIT.barrier;
  }

  const log = AUD.createLog();
  log.emit('mode.resolved', { mode: mode, command: opts.command, offline: opts.offline });

  const integrityRun = FP.runIntegrity();
  IO.writeJson(path.join(opts.out, 'FROZEN_INPUT_INTEGRITY.json'), integrityRun.report);
  log.emit('integrity.checked', { verdict: integrityRun.report.verdict, passed: integrityRun.report.passed, total: integrityRun.report.total });
  if (integrityRun.report.verdict !== 'PASS') {
    console.error('INTEGRITY: FAIL (' + integrityRun.report.failed + '/' + integrityRun.report.total + ')');
    for (const v of integrityRun.report.violations) console.error('  ' + v);
    return cfg.EXIT.integrity;
  }
  if (opts.command === 'validate') {
    statusLines([
      'SPEC 07F validate',
      'INTEGRITY: ' + integrityRun.report.passed + '/' + integrityRun.report.total + ' PASS',
      'mutationAuthorized: false',
      'PRODUCTION MUTATION CALLS: 0',
      'Final state: ' + cfg.STATE,
    ]);
    return cfg.EXIT.ok;
  }

  const operations = integrityRun.operations;
  const targetSet = Object.keys(integrityRun.perTarget);
  const allowlist = AL.validateOperationSet(operations, { targetSet: targetSet, frozenByKey: frozenByKey(integrityRun.planRows) });
  log.emit('allowlist.validated', { passed: allowlist.passed, operations: allowlist.total, targets: allowlist.targets });
  if (!allowlist.passed) {
    console.error('ALLOWLIST: FAIL ' + JSON.stringify(allowlist.failures));
    return cfg.EXIT.integrity;
  }
  if (operations.length !== cfg.BASELINE.operations) {
    console.error('COUNT: FAIL expected ' + cfg.BASELINE.operations + ' operations, found ' + operations.length);
    return cfg.EXIT.count;
  }

  const csvPath = path.join(opts.out, 'DRY_RUN_OPERATION_PLAN.csv');
  const planSummary = PL.planSummary(operations);
  let determinism = PL.doubleBuild(operations);
  if (opts.command === 'plan') {
    IO.writeText(csvPath, PL.planCsvText(operations));
    determinism = PL.doubleBuild(operations);
    log.emit('plan.written', { path: csvPath, sha256: determinism.sha256, operations: planSummary.operations });
    statusLines([
      'SPEC 07F plan',
      'INTEGRITY: ' + integrityRun.report.passed + '/' + integrityRun.report.total + ' PASS',
      'PLAN: ' + planSummary.targets + ' targets, ' + planSummary.operations + ' operations',
      'DETERMINISM: double build identical=' + determinism.identical + ' sha256=' + determinism.sha256,
      'ALLOWLIST: ' + allowlist.allowedFields.join(', '),
      'mutationAuthorized: false',
      'PRODUCTION MUTATION CALLS: 0',
      'Final state: ' + cfg.STATE,
    ]);
    return cfg.EXIT.ok;
  }

  let readDoc;
  let preflightInfo;
  if (opts.offline) {
    const store = FA.seedStore(operations);
    readDoc = SC.readFrom(store);
    preflightInfo = { source: 'SIMULATED_FROM_FROZEN_PLAN', readAt: IO.nowIso(), transport: 'in-process fake store (offline)', targets: targetSet.length };
    log.emit('preflight.simulated', preflightInfo);
  } else {
    const live = await LR.loadLiveRead();
    readDoc = live.readDoc;
    preflightInfo = { source: 'LIVE_READ_ONLY', readAt: live.readAt, transport: live.transport, speciesCount: live.speciesCount, targets: targetSet.length };
    log.emit('preflight.liveRead', preflightInfo);
  }

  const run = await PIPE.runDryRun({ operations: operations, readDoc: readDoc, targetSet: targetSet });
  log.emit('dryRun.completed', { status: run.status, blocked: run.blocked, writeAttempts: run.writeAttempts });
  const simulations = await SC.runScenarios(operations);
  log.emit('simulations.completed', { scenarios: simulations.summary.total, passed: simulations.summary.passed });
  const scan = SCAN.scanExecutionPath();
  const allCodeFiles = fs.readdirSync(cfg.CODE_DIR).filter((f) => f.endsWith('.js')).sort().map((f) => path.join(cfg.CODE_DIR, f));
  const allCodeScan = SCAN.scanTexts(allCodeFiles);
  scan.allCodeFiles = allCodeFiles.map(SCAN.rel);
  scan.allCodeFilesScanned = allCodeScan.fileCount;
  scan.allCodeHits = allCodeScan.hits;
  scan.allCodeApprovalHits = allCodeFiles.reduce((n, f) => n + SCAN.scanApprovalText(fs.readFileSync(f, 'utf8')).length, 0);
  scan.allCodeLegacyWriters = allCodeFiles.filter((f) => SCAN.LEGACY_WRITER.test(path.basename(f))).length;
  log.emit('staticScan.completed', { hits: scan.hits.length, reachable: scan.reachableCount, allCodeFiles: scan.allCodeFilesScanned, allCodeHits: scan.allCodeHits.length });

  const preflightStateByOp = {};
  if (run.preflight) {
    for (const row of run.preflight.rows) {
      for (const opId of row.operationIds) preflightStateByOp[opId] = row.state;
    }
  }
  const runOverrides = {};
  for (const rec of run.records || []) {
    runOverrides[rec.operationId] = {
      preflightState: preflightStateByOp[rec.operationId] || 'READ_ERROR',
      dryRunStatus: rec.state,
    };
  }
  IO.writeText(csvPath, PL.planCsvText(operations, runOverrides));
  determinism = PL.doubleBuild(operations, runOverrides);
  const dryRunStatusCounts = {};
  for (const k of Object.keys(runOverrides)) {
    const s = runOverrides[k].dryRunStatus;
    dryRunStatusCounts[s] = (dryRunStatusCounts[s] || 0) + 1;
  }
  log.emit('plan.finalized', { path: csvPath, sha256: determinism.sha256, barrier: run.barrier, dryRunStatusCounts: dryRunStatusCounts });

  const planText = IO.readText(csvPath);
  const integrityText = IO.readText(path.join(opts.out, 'FROZEN_INPUT_INTEGRITY.json'));
  const approvalHits = SCAN.scanApprovalText(planText).concat(SCAN.scanApprovalText(integrityText));

  const results = {
    spec: cfg.SPEC,
    phase: 'DRY_RUN_RESULTS',
    mode: cfg.MODE,
    state: cfg.STATE,
    mutationAuthorized: cfg.mutationAuthorized,
    generatedAt: IO.nowIso(),
    command: opts.command,
    executionMode: mode,
    integrity: {
      verdict: integrityRun.report.verdict,
      passed: integrityRun.report.passed,
      failed: integrityRun.report.failed,
      total: integrityRun.report.total,
      checks: integrityRun.report.checks.map((c) => ({ id: c.id, pass: c.pass, detail: c.detail })),
    },
    plan: {
      csvPath: csvPath,
      sha256: determinism.sha256,
      bytes: determinism.bytes,
      summary: planSummary,
      determinism: { doubleBuildByteIdentical: determinism.identical },
      allowlist: {
        passed: allowlist.passed,
        allowedFields: allowlist.allowedFields,
        twoOperationsPerTarget: allowlist.twoOperationsPerTarget,
        duplicateOperationIds: allowlist.duplicateOperationIds,
      },
    },
    preflight: preflightInfo,
    pipeline: {
      status: run.status,
      barrier: run.barrier,
      blocked: run.blocked,
      writeAttempts: run.writeAttempts,
      adapterConstructed: run.adapterConstructed,
      stateCounts: run.stateCounts || null,
      readError: run.readError,
      productionMutationCalls: run.productionMutationCalls,
      preflightStateCounts: run.preflight ? run.preflight.stateCounts : null,
      preflightOutcomeCounts: run.preflight ? run.preflight.outcomeCounts : null,
      allTargetsAuthorizationBlocked: run.preflight ? run.preflight.allBlockedByBarrier : false,
    },
    simulations: simulations.summary,
    staticScan: scan,
    safety: {
      productionMutationCalls: FA.productionChannelSnapshot().productionMutationCalls,
      writeCapableClientConstructed: FA.productionChannelSnapshot().writeCapableClientConstructed,
      mutationEndpointCalls: 0,
      canonicalMutations: 0,
      seoMutations: 0,
      liveWrites: 0,
      approvalTokenHits: approvalHits.length,
      secretHitsInArtifacts: containsSecret(planText) ? 1 : 0,
      legacyWriterReachable: scan.legacyWriterReachable,
      writeCapablePatternsReachable: scan.writeCapableReachable,
    },
    auditEvents: { count: log.count(), byType: log.byType(), events: log.all() },
    statusBlock: [
      'No canonical mutations were performed.',
      'No SEO mutations were performed.',
      'Production mutation calls: 0.',
      'mutationAuthorized: false',
      'GATE C is NOT authorized by SPEC 07F.',
      'Final state: ' + cfg.STATE,
    ],
  };
  IO.writeJson(path.join(opts.out, 'DRY_RUN_RESULTS.json'), results);

  if (opts.command === 'simulate' || opts.command === 'dry-run') {
    statusLines([
      'SPEC 07F ' + opts.command,
      'INTEGRITY: ' + integrityRun.report.passed + '/' + integrityRun.report.total + ' PASS',
      'PLAN: ' + planSummary.targets + ' targets, ' + planSummary.operations + ' operations, csv sha256=' + determinism.sha256,
      'ALLOWLIST: ' + allowlist.allowedFields.join(', '),
      'PREFLIGHT: ' + (preflightInfo.source === 'LIVE_READ_ONLY' ? 'live read-only, ' : 'simulated, ') +
        JSON.stringify(run.preflight ? run.preflight.stateCounts : {}),
      'BARRIER: CLOSED - ' + run.blocked + ' operations WRITE_BLOCKED, write attempts=' + run.writeAttempts,
      'SIMULATIONS: ' + simulations.summary.passed + '/' + simulations.summary.total + ' scenarios, ' +
        simulations.summary.assertionsPassed + '/' + simulations.summary.assertions + ' assertions (fake adapter only)',
      'STATIC SCAN: ' + scan.reachableCount + ' reachable files, hits=' + scan.hits.length + ', legacyWriters=' + scan.legacyWriterFiles.length,
      'PRODUCTION MUTATION CALLS: 0',
      'mutationAuthorized: false',
      'Final state: ' + cfg.STATE,
    ]);
  }
  return cfg.EXIT.ok;
}

module.exports = { main, parseArgs, HELP, frozenByKey, containsSecret };

if (require.main === module) {
  main(process.argv.slice(2), process.env)
    .then((code) => { process.exitCode = code; })
    .catch((e) => {
      console.error('AUDIT ERROR: ' + (e && e.stack ? e.stack : e));
      process.exitCode = cfg.EXIT.error;
    });
}
