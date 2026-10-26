'use strict';

const path = require('path');
const cfg = require('./config');
const IO = require('../SPEC_07F_executor/io');
const AUD = require('../SPEC_07F_executor/audit_events');
const SG = require('./scope_gate');
const PL = require('./plan_loader');
const LIVE = require('./live');
const CLF = require('./classify');
const MUT = require('./mutate');
const VP = require('./verify_post');
const LDG = require('./ledger');
const REG = require('./regressions');
const MAN = require('./manifest');
const RPT = require('./report');

function frozenSnapshotFiles() {
  return cfg.FROZEN_PLAN_FILES.concat([cfg.FROZEN_PLAN_CSV]);
}

function captureFrozen() {
  return frozenSnapshotFiles().map((f) => ({ file: f, sha256: IO.fileExists(f) ? IO.shaFile(f) : null }));
}

function captureSpec07FTree() {
  const dir = 'report/SPEC_07F';
  if (!IO.fileExists(dir)) return {};
  const out = {};
  for (const f of require('fs').readdirSync(dir)) out[IO.normalizePath(path.join(dir, f))] = IO.shaFile(path.join(dir, f));
  return out;
}

function loadJournal(outDir) {
  const file = path.join(outDir, 'EXECUTION_RESULTS.json');
  if (!IO.fileExists(file)) return { entries: {}, interrupted: false };
  try {
    const data = IO.readJson(file);
    const entries = {};
    for (const e of data.journal || []) entries[e.targetId] = e;
    return { entries: entries, interrupted: !!data.executionInProgress, previousStartedAt: data.startedAt || null };
  } catch (e) {
    return { entries: {}, interrupted: false, error: e.message };
  }
}

function preWriteArtifact(args) {
  return {
    spec: cfg.SPEC,
    phase: 'PRE_WRITE_STATE',
    mode: cfg.MODE,
    state: cfg.STATE,
    generatedAt: IO.nowIso(),
    authorization: { granted: true, basis: cfg.AUTHORIZATION.basis, scope: args.scopeGate },
    integrity: {
      verdict: args.integrity.verdict,
      passed: args.integrity.passed,
      total: args.integrity.total,
      planCsvSha256: args.planSha256,
      planCsvMatchesFrozen: args.planSha256 === cfg.FROZEN_PLAN_SHA256,
      allowlist: { passed: args.allowlist.passed, total: args.allowlist.total, targets: args.allowlist.targets, allowedFields: args.allowlist.allowedFields },
      violations: args.integrity.violations,
    },
    live: {
      readAt: args.snapshot.readAt,
      transport: args.snapshot.transport,
      speciesCount: args.snapshot.speciesCount,
      wikiTotal: args.snapshot.wikiTotal,
      counts: args.snapshot.counts,
      responseBodyBytes: args.snapshot.bytes,
    },
    classification: {
      targets: args.preflight.targets,
      stateCounts: args.preflight.stateCounts,
      opStateCounts: args.preflight.opStateCounts,
      readErrors: args.preflight.readErrors,
    },
    writePlan: {
      targetsToWrite: args.preflight.toWriteTargets,
      targetsAlreadyMatched: args.preflight.alreadyMatchedTargets,
      targetsConflicted: args.preflight.conflictTargets,
      targetsBlocked: args.preflight.blockedTargets,
      operationsToWrite: args.preflight.opStateCounts.TO_WRITE || 0,
      operationsAlreadyMatched: args.preflight.opStateCounts.ALREADY_MATCHED || 0,
      operationsConflicted: args.preflight.opStateCounts.CONFLICT || 0,
      operationsBlocked: args.preflight.opStateCounts.BLOCKED || 0,
      policy: 'Only READY targets with a live revision equal to the frozen expected revision are written; CONFLICT and BLOCKED targets are never overwritten.',
    },
    rows: args.preflight.rows,
    statusBlock: [
      'Read-only preflight of 117 frozen targets completed before the first write.',
      'Targets classified: ' + JSON.stringify(args.preflight.stateCounts) + '.',
      'Excluded records, MEDIUM candidates and BLOCKED candidates are not part of this preflight scope.',
      'Final status: pending execution.',
    ],
  };
}

function executionArtifact(args) {
  const records = args.records;
  const journal = Object.keys(records).sort().map((k) => records[k]);
  const counts = {};
  for (const r of journal) {
    for (const oc of r.opOutcomes) counts[oc.outcome] = (counts[oc.outcome] || 0) + 1;
  }
  for (const s of cfg.OP_STATUSES) if (counts[s] === undefined) counts[s] = 0;
  const targetsWithWriteAttempt = journal.filter((r) => r.attempts > 0);
  return {
    spec: cfg.SPEC,
    phase: 'EXECUTION_RESULTS',
    mode: cfg.MODE,
    state: cfg.STATE,
    generatedAt: IO.nowIso(),
    startedAt: args.startedAt,
    finishedAt: args.finishedAt,
    executionInProgress: !!args.inProgress,
    authorization: { granted: true, basis: cfg.AUTHORIZATION.basis, scope: args.scopeGate },
    plan: { csv: cfg.FROZEN_PLAN_CSV, sha256: args.planSha256, operations: cfg.BASELINE.operations, targets: cfg.BASELINE.targets },
    integrity: { verdict: args.integrity.verdict, passed: args.integrity.passed, total: args.integrity.total },
    preflight: {
      readAt: args.preflightReadAt,
      stateCounts: args.preflightStateCounts,
      opStateCounts: args.preflightOpStateCounts,
    },
    execution: {
      targetsProcessed: journal.length,
      targetsWithWriteAttempt: targetsWithWriteAttempt.length,
      mutationApiCalls: args.mutationCalls,
      fieldsWritten: args.fieldsWritten,
      documentsWritten: args.documentsWritten,
      fatalStop: !!args.fatalStop,
      fatalReason: args.fatalReason || null,
      retriesAllowed: cfg.MAX_WRITE_ATTEMPTS,
      conditionalWrite: 'patch.ifRevisionID pinned to the frozen expected revision; the frozen revision is never refreshed',
    },
    statusCounts: counts,
    journal: journal,
    operations: args.ledgerRows || [],
    statusLine: args.statusLine || null,
    statusBlock: [
      'Mutation API calls: ' + args.mutationCalls + '.',
      'Documents written: ' + args.documentsWritten + ' / field updates written: ' + args.fieldsWritten + '.',
      'Ledger outcomes: ' + Object.keys(counts).sort().map((k) => k + '=' + counts[k]).join(' ') + '.',
      args.statusLine ? 'Final status: ' + args.statusLine : 'Final status: pending.',
    ],
  };
}

async function runPreflightStep(args) {
  const snapshot = await LIVE.snapshot();
  const preflight = CLF.buildPreflight({
    order: args.plan.order,
    groups: args.plan.groups,
    readDoc: snapshot.readDoc,
  });
  return { snapshot: snapshot, preflight: preflight };
}

async function runExecuteStep(args) {
  const transport = args.transport || MUT.makeHttpTransport();
  const read = async function read(id) { return LIVE.readDocFull(id); };
  const records = {};
  const order = args.plan.order;
  const groups = args.plan.groups;
  const preByTarget = {};
  for (const r of args.preflight.rows) preByTarget[r.targetId] = r;
  const journal = args.journal;
  let mutationCalls = 0;
  let fatalStop = false;
  let fatalReason = null;

  for (const targetId of order) {
    const existing = journal.entries[targetId];
    if (existing) {
      records[targetId] = existing;
      if (existing.fatal) { fatalStop = true; fatalReason = existing.reason; }
      continue;
    }
    if (fatalStop) {
      records[targetId] = {
        targetId: targetId,
        state: 'NOT_ATTEMPTED',
        attempts: 0,
        httpStatus: null,
        patchKind: 'NOOP',
        patch: null,
        postRev: preByTarget[targetId] ? preByTarget[targetId].liveRev : null,
        opOutcomes: groups[targetId].map((op) => ({
          operationId: op.operationId,
          outcome: 'NOT_ATTEMPTED',
          reason: 'execution-stopped-after-authorization-rejection',
          valueVerified: null,
          attempts: 0,
          httpStatus: null,
          patchKind: 'NOOP',
        })),
        fatal: false,
        reason: 'execution-stopped-after-authorization-rejection',
        recordedAt: IO.nowIso(),
        resolved: true,
      };
      continue;
    }

    const pre = preByTarget[targetId];
    const result = await MUT.executeTarget({
      targetId: targetId,
      ops: groups[targetId],
      preflightRow: pre,
      doc: args.snapshot.readDoc(targetId),
      read: read,
      post: transport.post,
    });
    mutationCalls += result.attempts;
    const record = {
      targetId: targetId,
      state: result.targetState,
      attempts: result.attempts,
      httpStatus: result.httpStatus,
      patchKind: result.patchKind,
      patch: result.patch ? { fields: result.patch.fields, ifRevisionID: result.patch.ifRevisionID } : null,
      postRev: result.postRev,
      opOutcomes: result.opOutcomes,
      fatal: result.fatal,
      reason: result.reason,
      recordedAt: IO.nowIso(),
      resolved: true,
    };
    records[targetId] = record;
    if (result.fatal) { fatalStop = true; fatalReason = result.reason; }

    args.onProgress({
      targetId: targetId,
      state: record.state,
      attempts: record.attempts,
      records: records,
      mutationCalls: mutationCalls,
      fatalStop: fatalStop,
      fatalReason: fatalReason,
    });
  }

  return { records: records, mutationCalls: mutationCalls, fatalStop: fatalStop, fatalReason: fatalReason };
}

function summarizeExecution(records) {
  const documentsWritten = Object.keys(records).filter((k) => records[k].state === 'APPLIED').length;
  const attemptedDocuments = Object.keys(records).filter((k) => records[k].attempts > 0).length;
  let fieldsWritten = 0;
  for (const k of Object.keys(records)) {
    fieldsWritten += records[k].opOutcomes.filter((o) => o.outcome === 'APPLIED').length;
  }
  const counts = {};
  for (const k of Object.keys(records)) {
    for (const oc of records[k].opOutcomes) counts[oc.outcome] = (counts[oc.outcome] || 0) + 1;
  }
  for (const s of cfg.OP_STATUSES) if (counts[s] === undefined) counts[s] = 0;
  return {
    counts: counts,
    documentsWritten: documentsWritten,
    attemptedDocuments: attemptedDocuments,
    fieldsWritten: fieldsWritten,
    alreadyMatchedDocuments: Object.keys(records).filter((k) => records[k].state === 'ALREADY_MATCHED').length,
    preflightRefused: 0,
  };
}

async function run(args) {
  const outDir = args.outDir;
  const mirrorDir = args.mirrorDir;
  const startedAt = IO.nowIso();
  const log = AUD.createLog();

  const staticScope = SG.evaluateStaticScope(args.opts, args.env);
  log.emit('scope.static', { granted: staticScope.granted, command: staticScope.command, reasons: staticScope.reasons, ignoredEnvAuth: staticScope.ignoredEnvAuth });
  if (!staticScope.granted) {
    return { exitCode: cfg.EXIT.scope, scopeFailure: staticScope, log: log, outDir: outDir, mirrorDir: mirrorDir };
  }

  const plan = PL.loadPlan();
  const planScope = SG.evaluatePlanScope({ integrity: plan.integrity, planFingerprint: plan.planFingerprint, allowlist: plan.allowlist });
  log.emit('scope.plan', { granted: planScope.granted, reasons: planScope.reasons, planCsvSha256: planScope.planCsvSha256 });
  if (!planScope.granted) {
    return { exitCode: cfg.EXIT.integrity, planFailure: planScope, integrity: plan.integrity, log: log, outDir: outDir, mirrorDir: mirrorDir };
  }

  const frozenBefore = captureFrozen();
  const spec07fBefore = captureSpec07FTree();
  const scopeGate = Object.assign({}, staticScope, { plan: planScope });

  if (args.opts.command === 'validate') {
    log.emit('command.validate', { integrity: plan.integrity.verdict, planSha256: planScope.planCsvSha256 });
    return {
      exitCode: cfg.EXIT.ok,
      command: 'validate',
      integrity: plan.integrity,
      allowlist: plan.allowlist,
      planSha256: planScope.planCsvSha256,
      log: log,
      outDir: outDir,
      mirrorDir: mirrorDir,
      frozenBefore: frozenBefore,
      scopeGate: scopeGate,
    };
  }

  const pre = await runPreflightStep({ plan: plan });
  const preArtifact = preWriteArtifact({
    integrity: plan.integrity,
    planSha256: planScope.planCsvSha256,
    allowlist: plan.allowlist,
    scopeGate: scopeGate,
    snapshot: pre.snapshot,
    preflight: pre.preflight,
  });
  IO.writeJson(path.join(outDir, 'PRE_WRITE_STATE.json'), preArtifact);
  log.emit('preflight.completed', { stateCounts: pre.preflight.stateCounts, opStateCounts: pre.preflight.opStateCounts, readAt: pre.snapshot.readAt });

  if (args.opts.command === 'preflight') {
    return {
      exitCode: cfg.EXIT.ok,
      command: 'preflight',
      integrity: plan.integrity,
      allowlist: plan.allowlist,
      planSha256: planScope.planCsvSha256,
      preflight: pre.preflight,
      snapshot: pre.snapshot,
      scopeGate: scopeGate,
      frozenBefore: frozenBefore,
      spec07fBefore: spec07fBefore,
      log: log,
      outDir: outDir,
      mirrorDir: mirrorDir,
    };
  }

  const journal = loadJournal(outDir);
  if (journal.interrupted) log.emit('journal.resumed', { previousStartedAt: journal.previousStartedAt, entries: Object.keys(journal.entries).length });

  const execState = await runExecuteStep({
    plan: plan,
    preflight: pre.preflight,
    snapshot: pre.snapshot,
    journal: journal,
    onProgress: function onProgress(progress) {
      IO.writeJson(path.join(outDir, 'EXECUTION_RESULTS.json'), executionArtifact({
        startedAt: startedAt,
        finishedAt: null,
        inProgress: true,
        scopeGate: scopeGate,
        planSha256: planScope.planCsvSha256,
        integrity: plan.integrity,
        preflightReadAt: pre.snapshot.readAt,
        preflightStateCounts: pre.preflight.stateCounts,
        preflightOpStateCounts: pre.preflight.opStateCounts,
        records: progress.records,
        mutationCalls: progress.mutationCalls,
        fatalStop: progress.fatalStop,
        fatalReason: progress.fatalReason,
        documentsWritten: 0,
        fieldsWritten: 0,
        ledgerRows: null,
        statusLine: null,
      }));
    },
  });
  log.emit('execution.completed', { mutationCalls: execState.mutationCalls, fatalStop: execState.fatalStop, records: Object.keys(execState.records).length });

  const post = await LIVE.snapshot();
  const verification = VP.buildVerification({
    operations: plan.operations,
    order: plan.order,
    groups: plan.groups,
    preDocs: pre.snapshot.docs.reduce((m, d) => { m[d._id] = d; return m; }, {}),
    postDocs: post.docs.reduce((m, d) => { m[d._id] = d; return m; }, {}),
    records: execState.records,
    preCounts: pre.snapshot.counts,
    postCounts: post.counts,
    preRevs: pre.snapshot.revs,
    postRevs: post.revs,
    postReadAt: post.readAt,
    transport: post.transport,
  });

  const ledgerRows = LDG.buildLedgerRows({
    operations: plan.operations,
    preflightRows: pre.preflight.rows,
    records: execState.records,
    verification: verification,
  });
  const ledgerText = LDG.toCsv(ledgerRows);
  IO.writeText(path.join(outDir, 'OPERATION_LEDGER.csv'), ledgerText);
  const counts = LDG.summarize(ledgerRows);

  const summary = summarizeExecution(execState.records);
  summary.counts = counts;
  summary.preflightRefused = pre.preflight.conflictTargets + pre.preflight.blockedTargets;

  IO.writeJson(path.join(outDir, 'POST_WRITE_VERIFICATION.json'), verification);
  log.emit('verification.completed', { verdict: verification.verdict, verified: verification.values.verifiedPresent, expected: verification.values.expectedPresent });

  const regressions = REG.runRegressions({
    outDir: outDir,
    ledgerRows: ledgerRows,
    planRows: plan.planRows,
    frozenBefore: frozenBefore,
    artifactFiles: ['PRE_WRITE_STATE.json', 'EXECUTION_RESULTS.json', 'POST_WRITE_VERIFICATION.json', 'OPERATION_LEDGER.csv'].map((f) => path.join(outDir, f)),
  });
  log.emit('regressions.completed', { verdict: regressions.summary.verdict, passed: regressions.summary.passed, attempted: regressions.summary.attempted });

  const status = RPT.determineStatus({ counts: counts, verification: verification });

  IO.writeJson(path.join(outDir, 'EXECUTION_RESULTS.json'), executionArtifact({
    startedAt: startedAt,
    finishedAt: IO.nowIso(),
    inProgress: false,
    scopeGate: scopeGate,
    planSha256: planScope.planCsvSha256,
    integrity: plan.integrity,
    preflightReadAt: pre.snapshot.readAt,
    preflightStateCounts: pre.preflight.stateCounts,
    preflightOpStateCounts: pre.preflight.opStateCounts,
    records: execState.records,
    mutationCalls: execState.mutationCalls,
    fatalStop: execState.fatalStop,
    fatalReason: execState.fatalReason,
    documentsWritten: summary.documentsWritten,
    fieldsWritten: summary.fieldsWritten,
    ledgerRows: ledgerRows,
    statusLine: status.statusLine,
  }));

  const spec07fAfter = captureSpec07FTree();
  const spec07fUnchanged = JSON.stringify(spec07fBefore) === JSON.stringify(spec07fAfter);

  RPT.writeCompletionReport({
    outDir: outDir,
    mirrorDir: mirrorDir,
    startedAt: startedAt,
    finishedAt: IO.nowIso(),
    counts: counts,
    verification: verification,
    regressions: regressions,
    preflight: {
      targets: pre.preflight.targets,
      readAt: pre.snapshot.readAt,
      transport: pre.snapshot.transport,
      stateCounts: pre.preflight.stateCounts,
      opStateCounts: pre.preflight.opStateCounts,
      speciesCount: pre.snapshot.speciesCount,
      wikiTotal: pre.snapshot.wikiTotal,
      drafts: pre.snapshot.counts.drafts,
    },
    status: status,
    integrityPassed: plan.integrity.passed,
    integrityTotal: plan.integrity.total,
    integrityVerdict: plan.integrity.verdict,
    planSha256: planScope.planCsvSha256,
    allowlistPassed: plan.allowlist.passed,
    documentsWritten: summary.documentsWritten,
    fieldsWritten: summary.fieldsWritten,
    mutationCalls: execState.mutationCalls,
    alreadyMatchedDocuments: summary.alreadyMatchedDocuments,
    preflightRefused: summary.preflightRefused,
    secretHits: 0,
    trackedModified: REG.gitPorcelain().tracked.length,
  });

  const manifest = MAN.buildManifest({
    outDir: outDir,
    mirrorDir: mirrorDir,
    planSha256: planScope.planCsvSha256,
    integrityPassed: plan.integrity.passed,
    integrityTotal: plan.integrity.total,
    ledgerRows: ledgerRows,
    statusLine: status.statusLine,
    verificationVerdict: verification.verdict,
    regressionVerdict: regressions.summary.verdict,
    scopeLockOk: regressions.scopeLock.ok,
    mutationCalls: execState.mutationCalls,
    mutationBatches: summary.attemptedDocuments,
    documentsWritten: summary.documentsWritten,
    fieldsWritten: summary.fieldsWritten,
    trackedModified: regressions.git.trackedModifiedCount,
  });

  const mirrorFiles = [];
  if (mirrorDir && mirrorDir !== outDir) {
    for (const name of cfg.ARTIFACTS) {
      const src = path.join(outDir, name);
      if (!IO.fileExists(src)) continue;
      IO.writeText(path.join(mirrorDir, name), IO.readText(src));
      mirrorFiles.push(path.join(mirrorDir, name));
    }
  }

  const exitByCode = { PASS: cfg.EXIT.ok, PARTIAL: cfg.EXIT.ok, BLOCKED: cfg.EXIT.preflightBlocked, FAILED: cfg.EXIT.verification };
  return {
    exitCode: exitByCode[status.code],
    command: 'execute',
    integrity: plan.integrity,
    allowlist: plan.allowlist,
    planSha256: planScope.planCsvSha256,
    preflight: pre.preflight,
    snapshot: pre.snapshot,
    postSnapshot: post,
    verification: verification,
    regressions: regressions,
    counts: counts,
    summary: summary,
    status: status,
    manifest: manifest,
    ledgerRows: ledgerRows,
    spec07fUnchanged: spec07fUnchanged,
    scopeGate: scopeGate,
    frozenBefore: frozenBefore,
    log: log,
    outDir: outDir,
    mirrorDir: mirrorDir,
    mirrorFiles: mirrorFiles,
    mutationCalls: execState.mutationCalls,
    startedAt: startedAt,
  };
}

module.exports = { run, runPreflightStep, runExecuteStep, summarizeExecution, loadJournal, captureFrozen, executionArtifact, preWriteArtifact };
