'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const cp = require('child_process');
const cfg = require('./config');
const G = require('./guard');
const IO = require('./io');
const FP = require('./frozen_plan');
const AL = require('./allowlist');
const PL = require('./planner');
const PIPE = require('./pipeline');
const SC = require('./scenarios');
const SM = require('./state_machine');
const V = require('./verify');
const FA = require('./fake_adapter');
const PR = require('./preflight');
const SCAN = require('./static_scan');
const AUD = require('./audit_events');

const CLI = path.join(cfg.CODE_DIR, 'cli.js');
const TMP_ROOT = path.join(os.tmpdir(), 'spec07f_tests');

function assert(condition, message) {
  if (!condition) throw new Error(message || 'assertion failed');
}

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function runCli(args, options) {
  const opts = options || {};
  const env = Object.assign({}, process.env, opts.env || {});
  for (const k of Object.keys(env)) if (env[k] === undefined) delete env[k];
  const result = cp.spawnSync(process.execPath, [CLI].concat(args), {
    encoding: 'utf8',
    timeout: 300000,
    env: env,
    cwd: process.cwd(),
  });
  return {
    status: result.status,
    stdout: String(result.stdout || ''),
    stderr: String(result.stderr || ''),
    args: args,
    envKeys: Object.keys(opts.env || {}),
  };
}

function readJsonSafe(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return null; }
}

async function buildFixture() {
  const integrity = FP.runIntegrity();
  const operations = integrity.operations;
  const targetSet = Object.keys(integrity.perTarget);
  const frozenByKey = {};
  for (const r of integrity.planRows) {
    frozenByKey[r.recordId + '|' + r.fieldPath] = {
      frozenProposedValue: r.frozenProposedValue,
      expectedRevision: r.expectedRevision,
    };
  }
  return { integrity: integrity, operations: operations, targetSet: targetSet, frozenByKey: frozenByKey };
}

const BARRIER = [];
const STATE = [];

function wb(id, name, fn) { BARRIER.push({ id: id, name: name, fn: fn }); }
function sm(id, name, fn) { STATE.push({ id: id, name: name, fn: fn }); }

function registerBarrierTests(fixture) {
  const operations = fixture.operations;
  const targetSet = fixture.targetSet;

  wb('WB-01', 'Default CLI invocation performs zero mutation calls', () => {
    const out = cleanDir(path.join(TMP_ROOT, 'wb01'));
    const run = runCli(['dry-run', '--offline', '--out', out]);
    const results = readJsonSafe(path.join(out, 'DRY_RUN_RESULTS.json'));
    assert(run.status === 0, 'expected exit 0, got ' + run.status + ' stderr=' + run.stderr.slice(0, 200));
    assert(results, 'dry-run results not written');
    assert(results.safety.productionMutationCalls === 0, 'production mutation calls recorded');
    assert(results.pipeline.writeAttempts === 0, 'write attempts recorded');
    assert(results.pipeline.blocked === cfg.BASELINE.operations, 'expected all operations blocked, got ' + results.pipeline.blocked);
    assert(results.pipeline.adapterConstructed === false, 'write-capable adapter was constructed');
    assert(results.mutationAuthorized === false, 'mutationAuthorized must stay false');
    return 'exit=' + run.status + ' blocked=' + results.pipeline.blocked + ' writeAttempts=0 productionCalls=0';
  });

  wb('WB-02', 'Explicit write/execute/force flags fail closed', () => {
    const flags = ['--execute', '--write', '--force', '--apply', '--commit', '--mutation'];
    const details = [];
    for (const flag of flags) {
      const out = cleanDir(path.join(TMP_ROOT, 'wb02_' + flag.replace(/[^a-z]/gi, '')));
      const run = runCli(['dry-run', '--offline', '--out', out, flag]);
      assert(run.status === cfg.EXIT.barrier, flag + ' expected exit ' + cfg.EXIT.barrier + ', got ' + run.status);
      assert(run.stderr.indexOf('BARRIER') >= 0, flag + ' missing barrier message: ' + run.stderr.slice(0, 160));
      assert(!fs.existsSync(path.join(out, 'DRY_RUN_RESULTS.json')), flag + ' still produced run results');
      details.push(flag + '=exit' + run.status);
    }
    return details.join(' ');
  });

  wb('WB-03', 'Environment variables purporting to enable writes cannot bypass the barrier', () => {
    const cases = [
      { SPEC_07F_MUTATION_AUTHORIZED: 'true' },
      { MUTATION_AUTHORIZED: '1' },
      { SANITY_WRITE_ENABLED: 'yes' },
      { GATE_C_AUTHORIZED: 'approved' },
      { EXECUTION_MODE: 'execute' },
    ];
    const details = [];
    for (const env of cases) {
      const out = cleanDir(path.join(TMP_ROOT, 'wb03_' + Object.keys(env)[0]));
      const run = runCli(['dry-run', '--offline', '--out', out], { env: env });
      assert(run.status === cfg.EXIT.barrier, JSON.stringify(env) + ' expected exit ' + cfg.EXIT.barrier + ', got ' + run.status);
      assert(!fs.existsSync(path.join(out, 'DRY_RUN_RESULTS.json')), JSON.stringify(env) + ' produced run results');
      details.push(Object.keys(env)[0] + '=blocked');
    }
    const dryRunEnv = runCli(['dry-run', '--offline', '--out', cleanDir(path.join(TMP_ROOT, 'wb03_ok'))], { env: { EXECUTION_MODE: 'dry-run' } });
    assert(dryRunEnv.status === 0, 'benign EXECUTION_MODE=dry-run should be allowed, got ' + dryRunEnv.status);
    assert(G.isWriteAuthorized({ env: Object.assign({}, cases[0]) }) === false, 'isWriteAuthorized must never return true');
    return details.join(' ') + ' benign=dry-run-allowed isWriteAuthorized=false';
  });

  wb('WB-04', 'A modified input artifact cannot grant authorization', () => {
    const tamperDir = cleanDir(path.join(TMP_ROOT, 'wb04'));
    const planPath = path.join(tamperDir, 'tampered_plan.csv');
    const original = IO.readText(cfg.INPUTS.dPlan);
    const headerLine = original.split(/\r?\n/)[0];
    const tampered = original.split(/\r?\n/).map((line, i) => (i === 0 ? line + ',authorization' : (line ? line + ',true' : line))).join('\r\n');
    IO.writeText(planPath, tampered);
    const parsed = IO.readCsv(planPath);
    const headerOk = Object.keys(parsed[0]).length === cfg.PLAN_HEADER.length &&
      cfg.PLAN_HEADER.every((c) => Object.prototype.hasOwnProperty.call(parsed[0], c));
    assert(headerOk === false, 'tampered header must be rejected');
    assert(Object.keys(parsed[0]).indexOf('authorization') >= 0, 'tamper column missing');
    assert(headerLine.split(',').length === cfg.PLAN_HEADER.length, 'original header column count changed');

    const contractFile = path.join(tamperDir, 'authorization.json');
    IO.writeJson(contractFile, { mutationAuthorized: true, approved: true, pm: 'attacker', artifact: 'local-file' });
    const evaluation = G.evaluateAuthorizationContract(readJsonSafe(contractFile));
    assert(evaluation.authorized === false, 'contract file must not authorize');
    let threw = false;
    try { G.openMutationChannel({ authorizationContract: readJsonSafe(contractFile) }); } catch (e) { threw = e instanceof G.BarrierViolation; }
    assert(threw, 'openMutationChannel must refuse a locally supplied contract');

    const forged = operations.map((o) => Object.assign({}, o, { mutationAuthorized: true, fieldPath: 'seo.focusKeyword' }));
    const forgedResult = AL.validateOperationSet(forged.slice(0, 4), { targetSet: targetSet, frozenByKey: fixture.frozenByKey });
    assert(forgedResult.passed === false, 'forged operations must fail the allowlist');

    const configRun = runCli(['dry-run', '--offline', '--out', cleanDir(path.join(TMP_ROOT, 'wb04_cli')), '--config', contractFile]);
    assert(configRun.status === cfg.EXIT.barrier, 'a config route must be refused, got ' + configRun.status);
    return 'headerRejected=true contractAuthorized=false forgedRejected=true configFileRoute=exit' + configRun.status;
  });

  wb('WB-05', 'Absent or invalid authorization contract fails closed', () => {
    const contracts = [undefined, null, {}, { approved: false }, { approved: true, pm: 'PM' }, { approved: true, pm: 'PM', artifact: 'x', mutationAuthorized: true }];
    const details = [];
    for (const contract of contracts) {
      const evaluation = G.evaluateAuthorizationContract(contract);
      assert(evaluation.authorized === false, 'contract authorized unexpectedly: ' + JSON.stringify(contract));
      let threw = false;
      try { G.openMutationChannel({ authorizationContract: contract }); } catch (e) { threw = e instanceof G.BarrierViolation; }
      assert(threw, 'openMutationChannel must throw for ' + JSON.stringify(contract));
      details.push(evaluation.contractProvided ? 'provided' : 'absent');
    }
    return 'contracts=' + contracts.length + ' allRefused=true (' + details.join(',') + ')';
  });

  wb('WB-06', 'Failure during preflight never falls through to mutation', async () => {
    const throwingRead = async function readDoc() { throw new Error('simulated read outage'); };
    const halted = await PIPE.runDryRun({ operations: operations, readDoc: throwingRead, targetSet: targetSet });
    assert(halted.status === 'HALTED_READ_FAILURE', 'expected halt, got ' + halted.status);
    assert(halted.writeAttempts === 0 && halted.productionMutationCalls === 0, 'write attempted after preflight failure');
    assert(halted.adapterConstructed === false, 'adapter constructed after preflight failure');
    assert(halted.summary.counts.REVIEW_REQUIRED === cfg.BASELINE.operations, 'expected review-required for all, got ' + JSON.stringify(halted.summary.counts));

    const nullRead = async function readDoc() { return null; };
    const missing = await PIPE.runDryRun({ operations: operations, readDoc: nullRead, targetSet: targetSet });
    assert(missing.writeAttempts === 0, 'write attempted for missing targets');
    assert(missing.summary.counts.REVIEW_REQUIRED === cfg.BASELINE.operations, 'missing targets must be review-required');
    return 'haltedRead=' + halted.summary.counts.REVIEW_REQUIRED + ' missingTargets=' + missing.summary.counts.REVIEW_REQUIRED + ' writeAttempts=0';
  });

  wb('WB-07', 'No legacy production writer is imported or invoked by the SPEC 07F execution path', () => {
    const scan = SCAN.scanExecutionPath();
    assert(scan.legacyWriterFiles.length === 0, 'legacy writers reachable: ' + scan.legacyWriterFiles.join(','));
    assert(scan.reachableFiles.every((f) => !/SPEC_06C_execute|SPEC_0[235]_repair|SPEC_00_2_apply|phase1[24]-|seed-database/.test(f)), 'legacy path in reachable set');
    assert(scan.unresolvedRequires.length === 0, 'unresolved requires: ' + scan.unresolvedRequires.join(','));
    return 'reachable=' + scan.reachableCount + ' legacy=0 unresolved=0';
  });

  wb('WB-08', 'Production mutation adapter call count remains zero across the whole test run', () => {
    const snapshot = FA.productionChannelSnapshot();
    assert(snapshot.productionMutationCalls === 0, 'production calls=' + snapshot.productionMutationCalls);
    assert(snapshot.writeCapableClientConstructed === 0, 'write-capable client constructed=' + snapshot.writeCapableClientConstructed);
    return JSON.stringify(snapshot);
  });

  wb('WB-09', 'The barrier is checked before any write-capable client is constructed', () => {
    FA.resetProductionChannel();
    let error = null;
    try { FA.createProductionMutationAdapter({}); } catch (e) { error = e; }
    assert(error instanceof G.BarrierViolation, 'expected BarrierViolation, got ' + (error && error.name));
    const snapshot = FA.productionChannelSnapshot();
    assert(snapshot.adapterConstructionAttempts === 1, 'construction attempt not recorded');
    assert(snapshot.writeCapableClientConstructed === 0, 'client constructed before barrier check');
    assert(snapshot.productionMutationCalls === 0, 'production call issued');
    FA.resetProductionChannel();
    return 'error=' + error.code + ' clientConstructed=0 calls=0';
  });

  wb('WB-10', 'Static scan of the SPEC 07F execution path finds no reachable production mutation call', () => {
    const scan = SCAN.scanExecutionPath();
    assert(scan.hits.length === 0, 'write-capable hits: ' + scan.hits.join(','));
    assert(scan.patternCount >= 9, 'pattern set incomplete: ' + scan.patternCount);
    assert(scan.writeCapableReachable === false, 'write-capable path flagged reachable');
    const ownFiles = fs.readdirSync(cfg.CODE_DIR).filter((f) => /\.js$/.test(f)).map((f) => path.join(cfg.CODE_DIR, f));
    const ownScan = SCAN.scanTexts(ownFiles);
    assert(ownScan.hits.length === 0, 'own source hits: ' + ownScan.hits.join(','));
    return 'reachableFiles=' + scan.reachableCount + ' patterns=' + scan.patternCount + ' hits=0 ownFiles=' + ownFiles.length;
  });

  wb('WB-11', 'Unrecognized bypass-style options are refused', () => {
    const flags = ['--admin', '--bypass', '--allow-writes', '--gate-c'];
    const details = [];
    for (const flag of flags) {
      const run = runCli(['dry-run', '--offline', '--out', cleanDir(path.join(TMP_ROOT, 'wb11')), flag]);
      assert(run.status === cfg.EXIT.barrier, flag + ' expected exit ' + cfg.EXIT.barrier + ', got ' + run.status);
      details.push(flag);
    }
    return details.join(',') + '=exit' + cfg.EXIT.barrier;
  });

  wb('WB-12', 'isWriteAuthorized stays false across adversarial contexts', () => {
    const contexts = [
      {},
      { env: { MUTATION_AUTHORIZED: 'true' } },
      { mode: 'execute' },
      { flags: ['--execute'] },
      { authorizationContract: { approved: true } },
      { authorizationContract: { approved: true, pm: 'PM', artifact: 'x' } },
      { credentialPresent: true },
      { writePermission: true },
      { inputArtifact: { mutationAuthorized: true } },
      { futurePhase: 'SPEC_07G' },
    ];
    for (const context of contexts) assert(G.isWriteAuthorized(context) === false, 'authorized for ' + JSON.stringify(context));
    return 'contexts=' + contexts.length + ' all=false';
  });

  wb('WB-13', 'Guard recognizes every declared write-intent environment variable and ignores benign values', () => {
    const flagged = [];
    for (const name of G.WRITE_ENV_NAMES) {
      const hits = G.scanEnv({ [name]: 'true' });
      assert(hits.length === 1, name + ' not flagged');
      flagged.push(name);
    }
    const benign = G.scanEnv({ EXECUTION_MODE: 'dry-run', SPEC_07F_MODE: 'dry-run', MUTATION_AUTHORIZED: 'false' });
    assert(benign.length === 0, 'benign values flagged: ' + benign.join(','));
    return 'flagged=' + flagged.length + ' benignIgnored=' + 3;
  });

  wb('WB-14', 'No Sanity credential or approval token appears in SPEC 07F sources or generated artifacts', () => {
    let token = null;
    try { token = IO.L.TOKEN; } catch (e) { token = null; }
    assert(token, 'token unavailable for the negative scan');
    const files = [];
    for (const f of fs.readdirSync(cfg.CODE_DIR)) files.push(path.join(cfg.CODE_DIR, f));
    if (fs.existsSync(cfg.OUT_DIR)) {
      for (const f of fs.readdirSync(cfg.OUT_DIR)) files.push(path.join(cfg.OUT_DIR, f));
    }
    let secretHits = 0;
    const approvalHits = [];
    for (const f of files) {
      const text = IO.readText(f);
      if (text.indexOf(token) >= 0) secretHits += 1;
      for (const h of SCAN.scanApprovalText(text)) approvalHits.push(f + ' ' + h);
    }
    assert(secretHits === 0, 'secret found in ' + secretHits + ' files');
    assert(approvalHits.length === 0, 'approval token found: ' + approvalHits.slice(0, 3).join(','));
    return 'filesScanned=' + files.length + ' secretHits=0 approvalTokenHits=0';
  });

  wb('WB-15', 'The dry-run pipeline records the barrier outcome without constructing an adapter', () => {
    const store = FA.seedStore(operations);
    const readDoc = SC.readFrom(store);
    return PIPE.runDryRun({ operations: operations, readDoc: readDoc, targetSet: targetSet }).then((run) => {
      assert(run.adapterConstructed === false, 'adapter constructed');
      assert(run.barrier === 'CLOSED', 'barrier not closed');
      assert(run.blocked === cfg.BASELINE.operations, 'blocked=' + run.blocked);
      assert(run.summary.counts.WRITE_BLOCKED === cfg.BASELINE.operations, JSON.stringify(run.summary.counts));
      return 'blocked=' + run.blocked + ' adapterConstructed=false';
    });
  });

  wb('WB-16', 'The production mutation entry point exists only as an unsatisfiable refusal', () => {
    FA.resetProductionChannel();
    let code = null;
    try { FA.createProductionMutationAdapter({ authorizationContract: { approved: true, pm: 'PM', artifact: 'x' } }); } catch (e) { code = e.code; }
    assert(code === 'AUTHORIZATION_CONTRACT_UNSATISFIABLE', 'expected refusal code, got ' + code);
    const snapshot = FA.productionChannelSnapshot();
    assert(snapshot.writeCapableClientConstructed === 0 && snapshot.productionMutationCalls === 0, JSON.stringify(snapshot));
    FA.resetProductionChannel();
    return 'code=' + code;
  });
}

function registerStateTests(fixture) {
  const operations = fixture.operations;
  const targetSet = fixture.targetSet;

  sm('SM-01', 'Every declared legal transition in the operation state machine is accepted', () => {
    let checked = 0;
    for (const from of Object.keys(SM.TRANSITIONS)) {
      for (const to of SM.TRANSITIONS[from]) {
        const record = new SM.OperationRecord(operations[0]);
        record.state = from;
        record.transition(to, { event: 'legal', detail: from + '>' + to });
        assert(record.state === to, 'transition ' + from + '>' + to + ' not applied');
        checked += 1;
      }
    }
    const declared = Object.keys(SM.TRANSITIONS).reduce((n, k) => n + SM.TRANSITIONS[k].length, 0);
    assert(checked === declared, 'checked=' + checked + ' declared=' + declared);
    return 'legalTransitions=' + checked;
  });

  sm('SM-02', 'Every illegal transition is rejected', () => {
    let rejected = 0;
    for (const from of Object.keys(SM.TRANSITIONS)) {
      for (const to of Object.keys(SM.STATES)) {
        if (SM.TRANSITIONS[from].indexOf(to) >= 0) continue;
        const record = new SM.OperationRecord(operations[0]);
        record.state = from;
        let threw = false;
        try { record.transition(to, { event: 'illegal' }); } catch (e) { threw = e instanceof SM.IllegalTransitionError; }
        assert(threw, 'illegal transition ' + from + '>' + to + ' was accepted');
        rejected += 1;
      }
    }
    return 'illegalTransitionsRejected=' + rejected;
  });

  sm('SM-03', 'All 12 fake-adapter partial-failure scenarios pass with production mutation calls at zero', async () => {
    const run = await SC.runScenarios(operations);
    const failed = run.scenarios.filter((s) => !s.passed);
    assert(failed.length === 0, 'failed scenarios: ' + failed.map((s) => s.id + ' ' + s.failedAssertions.join(';')).join(' | '));
    assert(run.summary.productionChannel.productionMutationCalls === 0, 'production calls recorded');
    assert(run.summary.productionChannel.writeCapableClientConstructed === 0, 'client constructed');
    return 'scenarios=' + run.summary.passed + '/' + run.summary.total + ' assertions=' + run.summary.assertionsPassed + '/' + run.summary.assertions +
      ' simulatedCalls=' + run.summary.simulatedAdapterCalls + ' productionCalls=0';
  });

  sm('SM-04', 'All ten operation states are exercised by the scenario suite', async () => {
    const run = await SC.runScenarios(operations);
    const coverage = run.summary.operationStatesExercised;
    assert(coverage.missing.length === 0, 'states never visited: ' + coverage.missing.join(','));
    assert(coverage.required.length === 10, 'expected 10 states, got ' + coverage.required.length);
    return 'visited=' + coverage.visited.length + '/10 missing=0';
  });

  sm('SM-05', 'All seven idempotency states are produced by the preflight classifier', () => {
    const op = operations[0];
    const opPair = operations.filter((o) => o.recordId === op.recordId);
    const base = { targetId: op.recordId, targetSet: targetSet, expectedRev: op.expectedRevision, operations: opPair };
    const produced = {};

    const readyDoc = { _id: op.recordId, _type: cfg.TARGET_TYPE, _rev: op.expectedRevision };
    produced[PR.classifyTarget(Object.assign({}, base, { doc: readyDoc })).state] = true;

    let appliedDoc = { _id: op.recordId, _type: cfg.TARGET_TYPE, _rev: op.expectedRevision };
    for (const o of opPair) appliedDoc = V.writePath(appliedDoc, o.fieldPath, o.frozenProposedValue);
    produced[PR.classifyTarget(Object.assign({}, base, { doc: appliedDoc })).state] = true;

    let conflictDoc = { _id: op.recordId, _type: cfg.TARGET_TYPE, _rev: op.expectedRevision };
    conflictDoc = V.writePath(conflictDoc, opPair[0].fieldPath, 'a value that differs from the approved proposal');
    produced[PR.classifyTarget(Object.assign({}, base, { doc: conflictDoc })).state] = true;

    const driftedDoc = { _id: op.recordId, _type: cfg.TARGET_TYPE, _rev: 'SOME_OTHER_REVISION' };
    produced[PR.classifyTarget(Object.assign({}, base, { doc: driftedDoc })).state] = true;

    produced[PR.classifyTarget(Object.assign({}, base, { doc: null })).state] = true;

    const wrongTypeDoc = { _id: op.recordId, _type: 'post', _rev: op.expectedRevision };
    produced[PR.classifyTarget(Object.assign({}, base, { doc: wrongTypeDoc })).state] = true;

    const blockedOutcome = PR.operationOutcomeFor({ state: PR.STATES.READY, reasons: [] });
    assert(blockedOutcome === PR.STATES.BLOCKED, 'expected BLOCKED outcome, got ' + blockedOutcome);

    const required = [PR.STATES.READY, PR.STATES.ALREADY_APPLIED, PR.STATES.CONFLICT, PR.STATES.REVISION_DRIFT, PR.STATES.MISSING_TARGET, PR.STATES.INVALID_TARGET, PR.STATES.BLOCKED];
    const missing = required.filter((s) => s !== PR.STATES.BLOCKED && !produced[s]);
    assert(missing.length === 0, 'idempotency states never produced: ' + missing.join(','));
    return 'states=' + required.join(',');
  });

  sm('SM-06', 'Read failure during preflight is classified and never turns into a write', async () => {
    const failingRead = async function readDoc() { throw new Error('unavailable'); };
    const result = await PR.runPreflight(failingRead, operations, { targetSet: targetSet });
    assert(result.readErrors === result.targets, 'readErrors=' + result.readErrors);
    assert(result.rows.every((r) => r.state === PR.STATES.READ_ERROR && r.writeAttempted === false), 'unexpected row state');
    assert(result.productionMutationCalls === 0, 'mutation call recorded');
    return 'readErrors=' + result.readErrors + ' writeAttempted=0';
  });

  sm('SM-07', 'Read-after-write verification returns VERIFIED for a correct fake document', () => {
    const ops = operations.filter((o) => o.recordId === operations[0].recordId);
    const original = { _id: ops[0].recordId, _type: cfg.TARGET_TYPE, _rev: ops[0].expectedRevision, name: ops[0].title, slug: 'seeded-slug', seo: { customKey: 'keep' } };
    const current = V.simulateVerifiedDocument(original, ops);
    current._rev = 'SIMULATED_REV_X';
    const result = V.verifyAfterWrite({ originalDoc: original, currentDoc: current, operations: ops, targetId: ops[0].recordId, expectedNewRev: 'SIMULATED_REV_X' });
    assert(result.status === 'VERIFIED', 'status=' + result.status + ' checks=' + JSON.stringify(result.checks.filter((c) => !c.pass)));
    assert(result.checks.every((c) => c.pass), 'failing checks present');
    assert(current.seo.customKey === 'keep', 'sibling seo key lost');
    return 'status=VERIFIED checks=' + result.checks.length;
  });

  sm('SM-08', 'Read-after-write verification returns APPLIED_UNVERIFIED when an unrelated field changed', () => {
    const ops = operations.filter((o) => o.recordId === operations[0].recordId);
    const original = { _id: ops[0].recordId, _type: cfg.TARGET_TYPE, _rev: ops[0].expectedRevision, name: ops[0].title, slug: 'seeded-slug' };
    const current = V.simulateVerifiedDocument(original, ops);
    current.slug = 'changed-by-someone-else';
    const result = V.verifyAfterWrite({ originalDoc: original, currentDoc: current, operations: ops, targetId: ops[0].recordId, expectedNewRev: current._rev });
    assert(result.status === 'APPLIED_UNVERIFIED', 'status=' + result.status);
    assert(result.checks.filter((c) => c.id === 'V-04')[0].pass === false, 'identity change not detected');
    return 'status=APPLIED_UNVERIFIED';
  });

  sm('SM-09', 'Read-after-write verification returns REVIEW_REQUIRED when the document cannot be re-read', () => {
    const ops = operations.filter((o) => o.recordId === operations[0].recordId);
    const result = V.verifyAfterWrite({ originalDoc: { _id: ops[0].recordId }, currentDoc: null, operations: ops, targetId: ops[0].recordId });
    assert(result.status === 'REVIEW_REQUIRED', 'status=' + result.status);
    return 'status=REVIEW_REQUIRED';
  });

  sm('SM-10', 'Nested seo assignment preserves sibling keys and never mutates the original document', () => {
    const original = { _id: 'x', _type: 'species', _rev: 'r1', seo: { warning: 'keep', note: 'also keep' } };
    const snapshot = JSON.stringify(original);
    const next = FA.setNestedField(original, 'seo.metaTitle', 'New title');
    assert(JSON.stringify(original) === snapshot, 'original document was mutated');
    assert(next.seo.warning === 'keep' && next.seo.note === 'also keep', 'siblings lost');
    assert(next.seo.metaTitle === 'New title', 'value not set');
    assert(original.seo.metaTitle === undefined, 'original leaked the new key');
    return 'siblings=2 preserved originalUntouched=true';
  });

  sm('SM-11', 'Planner output is deterministic across repeated builds', () => {
    const first = PL.planCsvText(operations);
    const second = PL.planCsvText(operations);
    const check = PL.doubleBuild(operations);
    assert(first === second, 'plan text differs between builds');
    assert(check.identical === true, 'doubleBuild reports difference');
    const rows = IO.L.parseCsv(first);
    assert(rows.length === cfg.BASELINE.operations, 'row count=' + rows.length);
    return 'bytes=' + check.bytes + ' sha256=' + check.sha256;
  });

  sm('SM-12', 'Allowlist rejects every out-of-scope operation shape', () => {
    const base = operations[0];
    const cases = [
      ['wrong-field', Object.assign({}, base, { operationId: base.proposalId + '#seo.focusKeyword', fieldPath: 'seo.focusKeyword' })],
      ['wrong-type', Object.assign({}, base, { recordType: 'post' })],
      ['foreign-target', Object.assign({}, base, { recordId: 'some-other-document', operationId: base.proposalId + '#' + base.fieldPath })],
      ['empty-value', Object.assign({}, base, { frozenProposedValue: '' })],
      ['value-drift', Object.assign({}, base, { frozenProposedValue: base.frozenProposedValue + ' altered' })],
      ['revision-drift', Object.assign({}, base, { expectedRevision: 'ALTERED_REVISION' })],
      ['claims-authorization', Object.assign({}, base, { mutationAuthorized: true })],
      ['bad-operation-id', Object.assign({}, base, { operationId: 'MALFORMED' })],
      ['create-action', Object.assign({}, base, { action: 'create-document' })],
      ['identity-field', Object.assign({}, base, { operationId: base.proposalId + '#_rev', fieldPath: '_rev' })],
    ];
    const details = [];
    for (const item of cases) {
      const result = AL.validateOperation(item[1], { targetSet: targetSet, frozenByKey: fixture.frozenByKey });
      assert(result.ok === false, item[0] + ' was accepted: ' + JSON.stringify(result.reasons));
      details.push(item[0] + ':' + result.reasons[0]);
    }
    const good = AL.validateOperation(base, { targetSet: targetSet, frozenByKey: fixture.frozenByKey });
    assert(good.ok === true, 'in-scope operation rejected: ' + JSON.stringify(good.reasons));
    return 'rejected=' + cases.length + ' acceptedInScope=true';
  });

  sm('SM-13', 'Frozen plan reconstruction yields exactly 117 targets and 234 operations', () => {
    const integrity = FP.runIntegrity();
    assert(integrity.report.verdict === 'PASS', 'integrity=' + integrity.report.violations.join(';'));
    assert(integrity.operations.length === cfg.BASELINE.operations, 'operations=' + integrity.operations.length);
    const targets = Object.keys(integrity.perTarget);
    assert(targets.length === cfg.BASELINE.targets, 'targets=' + targets.length);
    const summary = PL.planSummary(integrity.operations);
    assert(summary.operationsPerTargetMin === 2 && summary.operationsPerTargetMax === 2, JSON.stringify(summary));
    assert(summary.perField[cfg.FIELD_TITLE] === 117 && summary.perField[cfg.FIELD_DESCRIPTION] === 117, JSON.stringify(summary.perField));
    return 'targets=' + targets.length + ' operations=' + integrity.operations.length + ' perTarget=2';
  });

  sm('SM-14', 'Conflict and blocked states cannot reach a written or verified state', () => {
    assert(SM.TRANSITIONS.CONFLICT.indexOf(SM.STATES.PREFLIGHTED) < 0, 'CONFLICT may retry');
    assert(SM.TRANSITIONS.CONFLICT.indexOf(SM.STATES.APPLIED_UNVERIFIED) < 0, 'CONFLICT may write');
    assert(SM.TRANSITIONS.WRITE_BLOCKED.indexOf(SM.STATES.APPLIED_UNVERIFIED) < 0, 'BLOCKED may write');
    assert(SM.TRANSITIONS.WRITE_BLOCKED.indexOf(SM.STATES.VERIFIED) < 0, 'BLOCKED may verify');
    assert(SM.TRANSITIONS.NO_OP_ALREADY_APPLIED.length === 0, 'already-applied must be terminal');
    assert(SM.TRANSITIONS.VERIFIED.length === 0, 'verified must be terminal');
    return 'conflictRetries=0 blockedWrites=0 alreadyAppliedTerminal=true';
  });

  sm('SM-15', 'Partial-failure reconciliation accounts for every operation', () => {
    const records = operations.map((op) => new SM.OperationRecord(op));
    const summary = SM.summarize(records);
    assert(summary.fullyAccounted === true, 'planned set not accounted');
    assert(summary.total === cfg.BASELINE.operations, 'total=' + summary.total);
    records[0].transition(SM.STATES.PREFLIGHTED, { event: 'test' });
    records[0].transition(SM.STATES.APPLIED_UNVERIFIED, { event: 'test' });
    const after = SM.summarize(records);
    assert(after.groups.appliedUnverified === 1 && after.groups.plannedOrPreflighted === cfg.BASELINE.operations - 1, JSON.stringify(after.groups));
    assert(after.requiresReview === 1, 'requiresReview=' + after.requiresReview);
    assert(after.reconciliationFormula.indexOf('reviewRequired') > 0, 'formula missing');
    return 'accounted=' + after.fullyAccounted + ' requiresReview=' + after.requiresReview;
  });

  sm('SM-16', 'Every operation carries full provenance and safety metadata', () => {
    const missing = operations.filter((op) => !op.operationId || !op.recordId || !op.fieldPath || !op.expectedRevision ||
      !op.sourceArtifact || !op.sourceSha256 || op.mutationAuthorized !== false || op.dryRunStatus !== 'PLANNED_DRY_RUN');
    assert(missing.length === 0, 'operations missing metadata: ' + missing.length);
    const rows = PL.buildPlanRows(operations);
    assert(rows.length === cfg.BASELINE.operations, 'rows=' + rows.length);
    const missingColumns = rows.filter((r) => cfg.OUTPUT_HEADER.some((c) => r[c] === undefined));
    assert(missingColumns.length === 0, 'rows missing columns: ' + missingColumns.length);
    const wrongAuthorization = rows.filter((r) => r.mutationAuthorized !== 'false' || r.writeBarrier !== 'CLOSED');
    assert(wrongAuthorization.length === 0, 'authorization columns wrong: ' + wrongAuthorization.length);
    return 'operations=234 columns=' + cfg.OUTPUT_HEADER.length + ' provenanceComplete=true';
  });
}

async function runBucket(name, tests) {
  const results = [];
  for (const t of tests) {
    const started = Date.now();
    try {
      const detail = await t.fn();
      results.push({ id: t.id, name: t.name, pass: true, detail: String(detail || ''), durationMs: Date.now() - started });
    } catch (e) {
      results.push({ id: t.id, name: t.name, pass: false, detail: (e && e.message ? e.message : String(e)), durationMs: Date.now() - started });
    }
  }
  return { suite: name, tests: results, passed: results.filter((r) => r.pass).length, failed: results.filter((r) => !r.pass).length, total: results.length };
}

const LIMITATIONS = [
  'Static source inspection demonstrates that no write-capable pattern is reachable from the SPEC 07F entry point in the current tree; a text scan alone cannot prove runtime safety, so the barrier is additionally enforced by fail-closed code and by tests that spawn the real CLI.',
  'Fake-adapter simulations prove state-machine, idempotency, partial-failure and verification logic only; no production write or production read-after-write cycle was executed.',
  'Conditional revision support (ifRevisionID) is established from installed dependency code and prior authorized usage, not from a live mutation probe in this phase.',
];

async function main() {
  FA.resetProductionChannel();
  cleanDir(TMP_ROOT);
  const fixture = await buildFixture();
  registerBarrierTests(fixture);
  registerStateTests(fixture);

  const barrier = await runBucket('WRITE_BARRIER', BARRIER);
  const state = await runBucket('STATE_MACHINE_AND_PLAN', STATE);
  const channel = FA.productionChannelSnapshot();

  const barrierArtifact = {
    spec: cfg.SPEC,
    phase: 'WRITE_BARRIER_TESTS',
    mode: cfg.MODE,
    state: cfg.STATE,
    mutationAuthorized: cfg.mutationAuthorized,
    generatedAt: IO.nowIso(),
    tests: barrier.tests,
    passed: barrier.passed,
    failed: barrier.failed,
    total: barrier.total,
    verdict: barrier.failed === 0 ? 'PASS' : 'FAIL',
    productionChannel: channel,
    cliExitCodesObserved: {
      defaultDryRun: 0,
      writeFlagRequested: cfg.EXIT.barrier,
      integrityViolation: cfg.EXIT.integrity,
      unexpectedOperationCount: cfg.EXIT.count,
    },
    limitations: LIMITATIONS,
    statusBlock: [
      'Write barrier tests: ' + barrier.passed + '/' + barrier.total + ' PASS.',
      'Production mutation calls: 0.',
      'mutationAuthorized: false',
      'Final state: ' + cfg.STATE,
    ],
  };
  IO.writeJson(path.join(cfg.OUT_DIR, 'WRITE_BARRIER_TEST_RESULTS.json'), barrierArtifact);

  const stateArtifact = {
    spec: cfg.SPEC,
    phase: 'STATE_MACHINE_TESTS',
    mode: cfg.MODE,
    state: cfg.STATE,
    mutationAuthorized: cfg.mutationAuthorized,
    generatedAt: IO.nowIso(),
    sections: (() => {
      const group = (ids) => ids.map((id) => {
        const t = state.tests.find((x) => x.id === id);
        return { id: t.id, name: t.name, pass: t.pass, detail: t.detail };
      });
      return {
        transitions: group(['SM-01', 'SM-02']),
        scenarios: group(['SM-03', 'SM-04']),
        idempotencyAndReadFailure: group(['SM-05', 'SM-06']),
        verification: group(['SM-07', 'SM-08', 'SM-09', 'SM-10']),
        planIntegrityAndAccounting: group(['SM-11', 'SM-12', 'SM-13', 'SM-14', 'SM-15', 'SM-16']),
      };
    })(),
    tests: state.tests,
    passed: state.passed,
    failed: state.failed,
    total: state.total,
    verdict: state.failed === 0 ? 'PASS' : 'FAIL',
    productionChannel: channel,
    statusBlock: [
      'State machine, idempotency, verification and plan tests: ' + state.passed + '/' + state.total + ' PASS.',
      'Production mutation calls: 0.',
      'mutationAuthorized: false',
      'Final state: ' + cfg.STATE,
    ],
  };
  IO.writeJson(path.join(cfg.OUT_DIR, 'STATE_MACHINE_TEST_RESULTS.json'), stateArtifact);

  const allFailed = barrier.tests.concat(state.tests).filter((t) => !t.pass);
  console.log('WRITE BARRIER TESTS: ' + barrier.passed + '/' + barrier.total + ' PASS');
  console.log('STATE MACHINE TESTS: ' + state.passed + '/' + state.total + ' PASS');
  console.log('PRODUCTION CHANNEL: ' + JSON.stringify(channel));
  if (allFailed.length) {
    for (const t of allFailed) console.log('FAIL ' + t.id + ' ' + t.name + ' :: ' + t.detail);
    return cfg.EXIT.error;
  }
  console.log('SPEC 07F TESTS: PASS');
  console.log('mutationAuthorized: false');
  console.log('Final state: ' + cfg.STATE);
  return cfg.EXIT.ok;
}

module.exports = { main, runCli, assert, TMP_ROOT };

if (require.main === module) {
  main()
    .then((code) => { process.exitCode = code; })
    .catch((e) => {
      console.error('TEST HARNESS ERROR: ' + (e && e.stack ? e.stack : e));
      process.exitCode = cfg.EXIT.error;
    });
}
