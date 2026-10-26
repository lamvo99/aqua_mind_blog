'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const cfg = require('./config');
const IO = require('../SPEC_07F_executor/io');
const SG = require('./scope_gate');
const PL = require('./plan_loader');
const CLF = require('./classify');
const PB = require('./patch_builder');
const MUT = require('./mutate');
const VP = require('./verify_post');
const LDG = require('./ledger');
const RPT = require('./report');
const G07F = require('../SPEC_07F_executor/guard');
const FP = require('../SPEC_07F_executor/frozen_plan');

const TMP_ROOT = path.join(os.tmpdir(), 'spec07g_tests');

const results = { passed: 0, failed: 0, total: 0, failures: [] };

function assert(condition, message) {
  if (!condition) throw new Error(message || 'assertion failed');
}

function eq(actual, expected, message) {
  if (actual !== expected) throw new Error((message || 'value') + ': expected ' + JSON.stringify(expected) + ' got ' + JSON.stringify(actual));
}

async function check(id, name, fn) {
  results.total += 1;
  try {
    await fn();
    results.passed += 1;
    console.log('TEST OK   ' + id + ' ' + name);
  } catch (e) {
    results.failed += 1;
    results.failures.push(id + ' ' + name + ' :: ' + (e && e.message ? e.message : e));
    console.log('FAIL ' + id + ' ' + name + ' :: ' + (e && e.message ? e.message : e));
  }
}

function sampleOps(recordId) {
  const source = { sourceArtifact: cfg.FROZEN_PLAN_CSV, sourceSha256: cfg.FROZEN_PLAN_SHA256 };
  return [
    Object.assign({ operationId: 'PR07-' + recordId + '#seo.metaTitle', proposalId: 'PR07-' + recordId, recordId: recordId, recordType: 'species', title: 'Example', fieldPath: 'seo.metaTitle', frozenProposedValue: 'Example species profile meta title for testing', expectedRevision: 'REV1' }, source),
    Object.assign({ operationId: 'PR07-' + recordId + '#seo.metaDescription', proposalId: 'PR07-' + recordId, recordId: recordId, recordType: 'species', title: 'Example', fieldPath: 'seo.metaDescription', frozenProposedValue: 'Example species profile meta description that is long enough to be a realistic description value.', expectedRevision: 'REV1' }, source),
  ];
}

function rowFor(doc, ops) {
  const c = CLF.classifyTarget({ doc: doc, ops: ops });
  return {
    targetId: ops[0].recordId,
    recordType: 'species',
    title: ops[0].title,
    expectedRevision: ops[0].expectedRevision,
    liveRev: c.liveRev,
    seoState: c.seoState,
    state: c.state,
    reasons: c.reasons,
    operationIds: ops.map((o) => o.operationId),
    operations: c.ops,
    writeAttempted: false,
    readError: null,
  };
}

function transportWith(script) {
  const calls = [];
  return {
    calls: calls,
    post: async function post(body) {
      calls.push(body);
      return script[Math.min(calls.length - 1, script.length - 1)];
    },
  };
}

function countsOf(partial) {
  const counts = {};
  for (const s of cfg.OP_STATUSES) counts[s] = 0;
  for (const k of Object.keys(partial)) counts[k] = partial[k];
  return counts;
}

function ledgerLock(rows, planRows) {
  const problems = [];
  const ids = {};
  const fields = {};
  for (const r of rows) {
    ids[r.recordId] = (ids[r.recordId] || 0) + 1;
    fields[r.fieldPath] = (fields[r.fieldPath] || 0) + 1;
    if (cfg.ALLOWED_FIELDS.indexOf(r.fieldPath) < 0) problems.push('field:' + r.fieldPath);
  }
  if (Object.keys(ids).length !== 117) problems.push('targets:' + Object.keys(ids).length);
  for (const id of cfg.AUTHORIZATION.excludedRecordIds) if (ids[id]) problems.push('excluded:' + id);
  for (const f of cfg.ALLOWED_FIELDS) if (fields[f] !== 117) problems.push('fieldCount:' + f);
  const frozen = {};
  for (const r of planRows) frozen[r.recordId + '|' + r.fieldPath] = r.frozenProposedValue;
  for (const r of rows) if (frozen[r.recordId + '|' + r.fieldPath] !== r.frozenProposedValue) problems.push('value:' + r.operationId);
  return { ok: problems.length === 0, problems: problems };
}

function journalFrom(data) {
  const entries = {};
  for (const e of data.journal || []) entries[e.targetId] = e;
  return { entries: entries, interrupted: !!data.executionInProgress };
}

async function run() {
  fs.mkdirSync(TMP_ROOT, { recursive: true });

  await check('T-01', 'configuration locks the approved scope (117 targets, 234 operations, two fields, four status lines)', () => {
    eq(cfg.BASELINE.targets, 117);
    eq(cfg.BASELINE.operations, 234);
    eq(cfg.ALLOWED_FIELDS.length, 2);
    assert(cfg.ALLOWED_FIELDS.indexOf('seo.metaTitle') >= 0, 'metaTitle allowlisted');
    assert(cfg.ALLOWED_FIELDS.indexOf('seo.metaDescription') >= 0, 'metaDescription allowlisted');
    eq(cfg.FROZEN_PLAN_SHA256, 'd3cc331ec8687517a56792dd49f2465b8a1c5ba91d6b563efc8de8e49378bd9b');
    eq(cfg.STATUS_LINES.length, 4);
    eq(new Set(cfg.STATUS_LINES).size, 4);
    eq(cfg.AUTHORIZATION.excludedRecordIds.length, 3);
    eq(cfg.ARTIFACTS.length, 7);
    eq(cfg.OP_STATUSES.length, 6);
  });

  await check('T-02', 'scope gate refuses missing commands, unknown arguments and scope-narrowing or force arguments', () => {
    const missing = SG.evaluateStaticScope(SG.parseArgs([]), {});
    assert(!missing.granted, 'missing command refused');
    assert(missing.reasons.indexOf('missing-command') >= 0, 'missing-command reason');
    const unknown = SG.evaluateStaticScope(SG.parseArgs(['execute', '--zzz']), {});
    assert(!unknown.granted, 'unknown argument refused');
    const force = SG.evaluateStaticScope(SG.parseArgs(['execute', '--force']), {});
    assert(!force.granted, 'force argument refused');
    const ids = SG.evaluateStaticScope(SG.parseArgs(['execute', '--ids=A,B']), {});
    assert(!ids.granted, 'target narrowing refused');
    const ok = SG.evaluateStaticScope(SG.parseArgs(['execute']), {});
    assert(ok.granted, 'explicit execute granted by scope descriptor');
    eq(ok.scope.targets, 117);
    eq(ok.scope.operations, 234);
    const withEnv = SG.evaluateStaticScope(SG.parseArgs(['execute']), { MUTATION_AUTHORIZED: 'true' });
    assert(withEnv.granted, 'environment variable neither grants nor blocks');
    eq(withEnv.ignoredEnvAuth.length, 1);
  });

  await check('T-03', 'plan scope evaluation accepts only the byte-identical frozen plan with the exact approved counts', () => {
    const base = {
      integrity: { verdict: 'PASS', passed: 21, total: 21, planSummary: { rows: 234, targets: 117, operations: 234, perField: { title: 117, description: 117 } } },
      planFingerprint: { exists: true, sha256: cfg.FROZEN_PLAN_SHA256, bytes: cfg.FROZEN_PLAN_BYTES },
      allowlist: { passed: true, total: 234, targets: 117, duplicateOperationIds: [], twoOperationsPerTarget: true, allowedFields: cfg.ALLOWED_FIELDS.slice() },
    };
    assert(SG.evaluatePlanScope(base).granted, 'good plan accepted');
    const a = JSON.parse(JSON.stringify(base)); a.planFingerprint.sha256 = 'deadbeef';
    assert(!SG.evaluatePlanScope(a).granted, 'tampered plan hash refused');
    const b = JSON.parse(JSON.stringify(base)); b.integrity.planSummary.operations = 233;
    assert(!SG.evaluatePlanScope(b).granted, 'wrong operation count refused');
    const c = JSON.parse(JSON.stringify(base)); c.allowlist.passed = false;
    assert(!SG.evaluatePlanScope(c).granted, 'failed allowlist refused');
    const d = JSON.parse(JSON.stringify(base)); d.allowlist.allowedFields = ['seo.title'];
    assert(!SG.evaluatePlanScope(d).granted, 'unexpected field set refused');
    const e = JSON.parse(JSON.stringify(base)); e.integrity.verdict = 'FAIL';
    assert(!SG.evaluatePlanScope(e).granted, 'failed integrity refused');
  });

  await check('T-04', 'frozen plan loads read-only with 21/21 integrity, 117 targets, 234 operations and the frozen plan sha256', () => {
    const plan = PL.loadPlan();
    eq(plan.integrity.verdict, 'PASS');
    eq(plan.integrity.passed, 21);
    eq(plan.integrity.total, 21);
    eq(plan.operations.length, 234);
    eq(plan.targetSet.length, 117);
    eq(plan.planFingerprint.sha256, cfg.FROZEN_PLAN_SHA256);
    assert(plan.allowlist.passed, 'allowlist passed');
    eq(FP.runIntegrity().report.verdict, 'PASS');
  });

  await check('T-05', 'preflight classification covers READY, ALREADY_MATCHED, CONFLICT and BLOCKED', () => {
    const ops = sampleOps('rec1');
    eq(CLF.classifyTarget({ doc: { _id: 'rec1', _type: 'species', _rev: 'REV1' }, ops: ops }).state, 'READY');
    eq(CLF.classifyTarget({ doc: { _id: 'rec1', _type: 'species', _rev: 'REVX', seo: { metaTitle: ops[0].frozenProposedValue, metaDescription: ops[1].frozenProposedValue } }, ops: ops }).state, 'ALREADY_MATCHED');
    eq(CLF.classifyTarget({ doc: { _id: 'rec1', _type: 'species', _rev: 'REV2' }, ops: ops }).state, 'CONFLICT');
    eq(CLF.classifyTarget({ doc: { _id: 'rec1', _type: 'species', _rev: 'REV1', seo: { metaTitle: 'edited by a person' } }, ops: ops }).state, 'CONFLICT');
    eq(CLF.classifyTarget({ doc: null, ops: ops }).state, 'BLOCKED');
    eq(CLF.classifyTarget({ doc: { _id: 'rec1', _type: 'post', _rev: 'R' }, ops: ops }).state, 'BLOCKED');
    eq(CLF.classifyTarget({ doc: { _id: 'rec1', _type: 'species', _rev: 'REV1', seo: 'string' }, ops: ops }).state, 'BLOCKED');
    const partial = CLF.classifyTarget({ doc: { _id: 'rec1', _type: 'species', _rev: 'REV1', seo: { metaTitle: ops[0].frozenProposedValue } }, ops: ops });
    eq(partial.state, 'READY');
    eq(partial.ops.filter((o) => o.opState === 'ALREADY_MATCHED').length, 1);
    eq(partial.ops.filter((o) => o.opState === 'TO_WRITE').length, 1);
  });

  await check('T-06', 'patch builder writes only approved paths: object creation when seo is absent, nested sets when it exists, refusal otherwise', () => {
    const ops = sampleOps('rec1');
    const created = PB.buildPatch({ doc: { _id: 'rec1', _type: 'species', _rev: 'REV1' }, writes: ops, matched: [] });
    eq(created.kind, 'SEO_OBJECT_CREATE');
    eq(Object.keys(created.set).length, 1);
    eq(created.set.seo.metaTitle, ops[0].frozenProposedValue);
    eq(created.set.seo.metaDescription, ops[1].frozenProposedValue);
    const nested = PB.buildPatch({ doc: { _id: 'rec1', _type: 'species', _rev: 'REV1', seo: { focusKeyword: 'x' } }, writes: ops, matched: [] });
    eq(nested.kind, 'NESTED_FIELD_SET');
    eq(nested.set['seo.metaTitle'], ops[0].frozenProposedValue);
    assert(nested.set.focusKeyword === undefined, 'sibling field is not rewritten');
    eq(PB.buildPatch({ doc: { _id: 'rec1' }, writes: [], matched: ops }).kind, 'NOOP');
    eq(PB.buildPatch({ doc: { _id: 'rec1' }, writes: [{ operationId: 'x', fieldPath: 'seo.metaTitle', frozenProposedValue: 12345 }], matched: [] }).kind, 'REFUSED');
    eq(PB.buildPatch({ doc: { _id: 'rec1' }, writes: [{ operationId: 'x', fieldPath: 'body', frozenProposedValue: 'x' }], matched: [] }).kind, 'REFUSED');
    eq(PB.buildPatch({ doc: { _id: 'rec1', seo: [] }, writes: ops, matched: [] }).kind, 'REFUSED');
  });

  await check('T-07', 'mutation response classification maps status codes to success, auth, revision conflict, transient and rejected', () => {
    eq(MUT.classifyHttp({ status: 200 }), 'SUCCESS');
    eq(MUT.classifyHttp({ status: 201 }), 'SUCCESS');
    eq(MUT.classifyHttp({ status: 401 }), 'AUTH');
    eq(MUT.classifyHttp({ status: 403 }), 'AUTH');
    eq(MUT.classifyHttp({ status: 409 }), 'REVISION_CONFLICT');
    eq(MUT.classifyHttp({ status: 412 }), 'REVISION_CONFLICT');
    eq(MUT.classifyHttp({ status: 500 }), 'TRANSIENT');
    eq(MUT.classifyHttp({ status: 0, error: 'timeout' }), 'TRANSIENT');
    eq(MUT.classifyHttp({ status: 400 }), 'REJECTED');
  });

  await check('T-08', 'mutation body is a conditional patch pinned to the frozen revision with only approved field paths', () => {
    const ops = sampleOps('rec1');
    const patch = PB.buildPatch({ doc: { _id: 'rec1' }, writes: ops, matched: [] });
    const body = MUT.buildBody('rec1', 'REV1', patch.set);
    eq(body.mutations.length, 1);
    eq(body.mutations[0].patch.id, 'rec1');
    eq(body.mutations[0].patch.ifRevisionID, 'REV1');
    const set = body.mutations[0].patch.set;
    eq(Object.keys(set).length, 1);
    eq(Object.keys(set.seo).sort().join(','), 'metaDescription,metaTitle');
    assert(set.unset === undefined, 'no unset operation');
    assert(body.mutations[0].patch.create === undefined, 'no create operation');
  });

  await check('T-09', 'executeTarget applies a conditional patch on success, skips unchanged values and never posts for refused targets', async () => {
    const ops = sampleOps('rec1');
    const readyRow = rowFor({ _id: 'rec1', _type: 'species', _rev: 'REV1' }, ops);
    const appliedDoc = { _id: 'rec1', _type: 'species', _rev: 'REV2', seo: { metaTitle: ops[0].frozenProposedValue, metaDescription: ops[1].frozenProposedValue } };
    let reads = 0;
    const readApplied = async () => { reads += 1; return appliedDoc; };
    const ok = await MUT.executeTarget({
      targetId: 'rec1', ops: ops, preflightRow: readyRow, doc: { _id: 'rec1', _type: 'species', _rev: 'REV1' },
      read: readApplied, post: transportWith([{ ok: true, status: 200, text: '{}', json: {} }]).post,
    });
    eq(ok.targetState, 'APPLIED');
    eq(ok.attempts, 1);
    eq(ok.opOutcomes.every((o) => o.outcome === 'APPLIED' && o.valueVerified === true), true);
    assert(reads >= 1, 'read back after write');

    const matchedRow = rowFor({ _id: 'rec1', _type: 'species', _rev: 'REV9', seo: { metaTitle: ops[0].frozenProposedValue, metaDescription: ops[1].frozenProposedValue } }, ops);
    const matchedTransport = transportWith([]);
    const noop = await MUT.executeTarget({
      targetId: 'rec1', ops: ops, preflightRow: matchedRow, doc: matchedRow,
      read: async () => appliedDoc, post: matchedTransport.post,
    });
    eq(noop.targetState, 'ALREADY_MATCHED');
    eq(matchedTransport.calls.length, 0);
    eq(noop.opOutcomes.every((o) => o.outcome === 'ALREADY_MATCHED'), true);

    const conflictRow = rowFor({ _id: 'rec1', _type: 'species', _rev: 'REV1', seo: { metaTitle: 'human edit' } }, ops);
    const conflictTransport = transportWith([]);
    const conflict = await MUT.executeTarget({
      targetId: 'rec1', ops: ops, preflightRow: conflictRow, doc: conflictRow,
      read: async () => conflictRow, post: conflictTransport.post,
    });
    eq(conflict.targetState, 'CONFLICT');
    eq(conflictTransport.calls.length, 0);

    const blockedRow = rowFor(null, ops);
    const blockedTransport = transportWith([]);
    const blocked = await MUT.executeTarget({
      targetId: 'rec1', ops: ops, preflightRow: blockedRow, doc: null,
      read: async () => null, post: blockedTransport.post,
    });
    eq(blocked.targetState, 'BLOCKED');
    eq(blockedTransport.calls.length, 0);
  });

  await check('T-10', 'executeTarget resolves revision conflicts, transient failures and authorization rejection without blind replay', async () => {
    const ops = sampleOps('rec1');
    const readyRow = rowFor({ _id: 'rec1', _type: 'species', _rev: 'REV1' }, ops);
    const appliedDoc = { _id: 'rec1', _type: 'species', _rev: 'REV2', seo: { metaTitle: ops[0].frozenProposedValue, metaDescription: ops[1].frozenProposedValue } };
    const emptyDoc = { _id: 'rec1', _type: 'species', _rev: 'REV9' };

    const conflictTransport = transportWith([{ ok: false, status: 409, text: 'conflict', json: {} }]);
    const conflict = await MUT.executeTarget({
      targetId: 'rec1', ops: ops, preflightRow: readyRow, doc: { _id: 'rec1', _type: 'species', _rev: 'REV1' },
      read: async () => emptyDoc, post: conflictTransport.post,
    });
    eq(conflict.targetState, 'CONFLICT');
    eq(conflict.attempts, 1);
    eq(conflict.opOutcomes.every((o) => o.outcome === 'CONFLICT'), true);

    const conflictValue = await MUT.executeTarget({
      targetId: 'rec1', ops: ops, preflightRow: readyRow, doc: { _id: 'rec1', _type: 'species', _rev: 'REV1' },
      read: async () => appliedDoc, post: transportWith([{ ok: false, status: 409, text: 'conflict', json: {} }]).post,
    });
    eq(conflictValue.targetState, 'ALREADY_MATCHED');

    const transient = await MUT.executeTarget({
      targetId: 'rec1', ops: ops, preflightRow: readyRow, doc: { _id: 'rec1', _type: 'species', _rev: 'REV1' },
      read: async () => appliedDoc, post: transportWith([{ ok: false, status: 500, text: 'boom', json: null }]).post,
    });
    eq(transient.targetState, 'APPLIED');
    assert(transient.reason.indexOf('transient') >= 0, 'transient reason recorded');

    let posts = 0;
    const exhausted = await MUT.executeTarget({
      targetId: 'rec1', ops: ops, preflightRow: readyRow, doc: { _id: 'rec1', _type: 'species', _rev: 'REV1' },
      read: async () => ({ _id: 'rec1', _type: 'species', _rev: 'REV1' }),
      post: async (body) => { posts += 1; return { ok: false, status: 500, text: 'boom', json: null }; },
    });
    eq(exhausted.targetState, 'FAILED');
    eq(posts, cfg.MAX_WRITE_ATTEMPTS);
    assert(exhausted.reason.indexOf('retries-exhausted') >= 0, 'retry exhaustion recorded');
    eq(exhausted.opOutcomes.every((o) => o.outcome === 'FAILED'), true);

    let authPosts = 0;
    const auth = await MUT.executeTarget({
      targetId: 'rec1', ops: ops, preflightRow: readyRow, doc: { _id: 'rec1', _type: 'species', _rev: 'REV1' },
      read: async () => emptyDoc,
      post: async (body) => { authPosts += 1; return { ok: false, status: 401, text: 'unauthorized', json: {} }; },
    });
    eq(auth.targetState, 'FAILED');
    eq(auth.fatal, true);
    eq(authPosts, 1);
    eq(auth.opOutcomes.every((o) => o.outcome === 'FAILED'), true);
  });

  await check('T-11', 'post-write verification passes a fully verified scope and fails on unapproved document changes or missing values', () => {
    const ops = sampleOps('rec1');
    const preDoc = { _id: 'rec1', _type: 'species', _rev: 'REV1', name: 'Example', slug: { current: 'example' }, category: 'fish' };
    const postDoc = { _id: 'rec1', _type: 'species', _rev: 'REV2', name: 'Example', slug: { current: 'example' }, category: 'fish', seo: { metaTitle: ops[0].frozenProposedValue, metaDescription: ops[1].frozenProposedValue } };
    const records = {
      rec1: {
        targetId: 'rec1', state: 'APPLIED', attempts: 1, httpStatus: 200, patchKind: 'SEO_OBJECT_CREATE', postRev: 'REV2',
        reason: 'conditional-write-applied-and-read-back',
        opOutcomes: ops.map((op) => ({ operationId: op.operationId, outcome: 'APPLIED', reason: 'conditional-write-applied-and-read-back', valueVerified: true, attempts: 1, httpStatus: 200, patchKind: 'SEO_OBJECT_CREATE' })),
      },
    };
    const base = {
      operations: ops,
      order: ['rec1'],
      groups: { rec1: ops },
      preDocs: { rec1: preDoc },
      postDocs: { rec1: postDoc },
      records: records,
      preCounts: { species: 1 },
      postCounts: { species: 1 },
      preRevs: [{ _id: 'rec1', _rev: 'REV1' }, { _id: 'other', _rev: 'OR1' }],
      postRevs: [{ _id: 'rec1', _rev: 'REV2' }, { _id: 'other', _rev: 'OR1' }],
    };
    const good = VP.buildVerification(base);
    eq(good.verdict, 'PASS');
    eq(good.values.verifiedPresent, 2);
    eq(good.scope.nonTargetDocumentsChangedCount, 0);
    eq(good.documents[0].status, 'VERIFIED_APPLIED');

    const tampered = VP.buildVerification(Object.assign({}, base, { postRevs: [{ _id: 'rec1', _rev: 'REV2' }, { _id: 'other', _rev: 'OR2' }] }));
    eq(tampered.verdict, 'FAIL');
    eq(tampered.scope.nonTargetDocumentsChangedCount, 1);

    const brokenDoc = Object.assign({}, postDoc, { seo: { metaTitle: ops[0].frozenProposedValue } });
    const missing = VP.buildVerification(Object.assign({}, base, { postDocs: { rec1: brokenDoc } }));
    eq(missing.verdict, 'FAIL');
    assert(missing.unverifiedAppliedOperations === 2 || missing.problems.length > 0, 'missing value detected');
  });

  await check('T-12', 'SPEC 07F write barrier is untouched: write intent still throws and mutationAuthorized stays false', () => {
    let threw = false;
    try { G07F.resolveMode(['--write'], {}); } catch (e) { threw = e instanceof G07F.BarrierViolation; }
    assert(threw, '07F resolveMode still refuses write intent');
    let channelThrew = false;
    try { G07F.openMutationChannel({}); } catch (e) { channelThrew = e instanceof G07F.BarrierViolation; }
    assert(channelThrew, '07F openMutationChannel still refuses');
    eq(G07F.isWriteAuthorized({}), false);
    eq(G07F.resolveMode([], { EXECUTION_MODE: 'dry-run' }), 'dry-run');
    let envThrew = false;
    try { G07F.resolveMode([], { MUTATION_AUTHORIZED: 'true' }); } catch (e) { envThrew = true; }
    assert(envThrew, '07F still refuses env authorization');
    eq(FP.runIntegrity().report.mutationAuthorized, false);
  });

  await check('T-13', 'ledger builder accounts for exactly 234 operations with scope-locked identifiers and frozen values', () => {
    const plan = PL.loadPlan();
    const preflightRows = plan.order.map((id) => rowFor({ _id: id, _type: 'species', _rev: plan.groups[id][0].expectedRevision }, plan.groups[id]));
    const records = {};
    for (const row of preflightRows) {
      records[row.targetId] = {
        targetId: row.targetId, state: 'APPLIED', attempts: 1, httpStatus: 200, patchKind: 'SEO_OBJECT_CREATE',
        patch: { fields: ['seo.metaTitle', 'seo.metaDescription'], ifRevisionID: row.expectedRevision },
        postRev: 'NEWREV', fatal: false, reason: 'conditional-write-applied-and-read-back', recordedAt: '2026-01-01T00:00:00.000Z', resolved: true,
        opOutcomes: row.operations.map((op) => ({ operationId: op.operationId, outcome: 'APPLIED', reason: 'conditional-write-applied-and-read-back', valueVerified: true, attempts: 1, httpStatus: 200, patchKind: 'SEO_OBJECT_CREATE' })),
      };
    }
    const rows = LDG.buildLedgerRows({ operations: plan.operations, preflightRows: preflightRows, records: records, verification: null });
    eq(rows.length, 234);
    eq(LDG.summarize(rows).APPLIED, 234);
    const csv = LDG.toCsv(rows);
    assert(csv.split(/\r?\n/).length >= 235, 'csv has a header and 234 rows');
    const lock = ledgerLock(rows, plan.planRows);
    assert(lock.ok, 'scope lock: ' + lock.problems.join(','));
  });

  await check('T-14', 'status determination maps complete, partial, blocked and failed outcomes to exactly the four allowed status lines', () => {
    const complete = { values: { expectedPresent: 234, verifiedPresent: 234, notVerified: 0 }, unverifiedAppliedOperations: 0, problems: [], verdict: 'PASS' };
    eq(RPT.determineStatus({ counts: countsOf({ APPLIED: 234 }), verification: complete }).statusLine, cfg.STATUS_LINES[0]);
    eq(RPT.determineStatus({ counts: countsOf({ ALREADY_MATCHED: 234 }), verification: complete }).statusLine, cfg.STATUS_LINES[0]);
    eq(RPT.determineStatus({
      counts: countsOf({ APPLIED: 200, CONFLICT: 34 }),
      verification: { values: { expectedPresent: 200, verifiedPresent: 200, notVerified: 0 }, unverifiedAppliedOperations: 0, problems: [], verdict: 'PASS' },
    }).statusLine, cfg.STATUS_LINES[1]);
    eq(RPT.determineStatus({
      counts: countsOf({ CONFLICT: 234 }),
      verification: { values: { expectedPresent: 0, verifiedPresent: 0, notVerified: 0 }, unverifiedAppliedOperations: 0, problems: [], verdict: 'PASS' },
    }).statusLine, cfg.STATUS_LINES[2]);
    eq(RPT.determineStatus({
      counts: countsOf({ APPLIED: 100, FAILED: 134 }),
      verification: { values: { expectedPresent: 100, verifiedPresent: 99, notVerified: 1 }, unverifiedAppliedOperations: 1, problems: [], verdict: 'FAIL' },
    }).statusLine, cfg.STATUS_LINES[3]);
  });

  await check('T-15', 'resume journal loading returns no entries on a clean run and preserves recorded outcomes when present', () => {
    const file = path.join(TMP_ROOT, 'EXECUTION_RESULTS.json');
    IO.writeJson(file, { executionInProgress: true, startedAt: 'x', journal: [{ targetId: 'a', state: 'APPLIED', opOutcomes: [] }] });
    const journal = journalFrom(IO.readJson(file));
    eq(Object.keys(journal.entries).length, 1);
    eq(journal.interrupted, true);
    eq(journal.entries.a.state, 'APPLIED');
    const absent = journalFrom({ executionInProgress: false, journal: [] });
    eq(Object.keys(absent.entries).length, 0);
    eq(absent.interrupted, false);
  });

  await check('T-16', 'no SPEC 07G source file contains the Sanity API token', () => {
    const token = IO.L.TOKEN;
    const files = fs.readdirSync('scripts/SPEC_07G_execute').filter((f) => f.endsWith('.js'));
    assert(files.length >= 14, 'module inventory');
    for (const f of files) assert(IO.readText(path.join('scripts/SPEC_07G_execute', f)).indexOf(token) < 0, 'token in ' + f);
  });

  console.log('07G TESTS: ' + results.passed + '/' + results.total + ' PASS');
  if (results.failed) {
    for (const f of results.failures) console.log('FAIL ' + f);
    return cfg.EXIT.error;
  }
  return cfg.EXIT.ok;
}

module.exports = { run, results };

if (require.main === module) {
  run()
    .then((code) => { process.exitCode = code; })
    .catch((e) => {
      console.error('TEST HARNESS ERROR: ' + (e && e.stack ? e.stack : e));
      process.exitCode = cfg.EXIT.error;
    });
}
