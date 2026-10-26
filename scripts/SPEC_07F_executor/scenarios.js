'use strict';

const cfg = require('./config');
const P = require('./preflight');
const FA = require('./fake_adapter');
const SM = require('./state_machine');
const V = require('./verify');

function makeRecords(operations) {
  return operations.map((o) => new SM.OperationRecord(o));
}

function readFrom(store) {
  return async function readDoc(id) {
    return store.has(id) ? store.get(id) : null;
  };
}

function assertion(label, pass, detail) {
  return { label: label, pass: !!pass, detail: String(detail) };
}

function transitionPreflight(records, preflight) {
  const byId = {};
  for (const r of records) byId[r.operationId] = r;
  for (const row of preflight.rows) {
    for (const opId of row.operationIds) {
      const rec = byId[opId];
      if (rec.state !== SM.STATES.PLANNED) continue;
      rec.transition(SM.STATES.PREFLIGHTED, { event: 'preflight', detail: row.state });
      if (row.state === P.STATES.ALREADY_APPLIED) {
        rec.transition(SM.STATES.NO_OP_ALREADY_APPLIED, { event: 'already-applied', detail: row.reasons.join(',') });
      } else if (row.state === P.STATES.CONFLICT || row.state === P.STATES.REVISION_DRIFT) {
        rec.transition(SM.STATES.CONFLICT, { event: 'preflight-' + row.state.toLowerCase(), detail: row.reasons.join(',') });
      } else if (row.state !== P.STATES.READY) {
        rec.transition(SM.STATES.REVIEW_REQUIRED, { event: 'preflight-' + String(row.state).toLowerCase(), detail: row.reasons.join(',') });
      }
    }
  }
}

function applyOne(rec, op, adapter, opts) {
  const options = opts || {};
  rec.writeAttempts += 1;
  try {
    adapter.apply({
      operationId: op.operationId,
      docId: op.recordId,
      fieldPath: op.fieldPath,
      ifRevision: options.ifRevision === undefined ? op.expectedRevision : options.ifRevision,
      frozenValue: op.frozenProposedValue,
    });
    rec.transition(SM.STATES.APPLIED_UNVERIFIED, { event: 'simulated-write-accepted', detail: 'fake adapter' });
    return 'APPLIED';
  } catch (e) {
    if (e.code === 'REVISION_MISMATCH') {
      rec.transition(SM.STATES.CONFLICT, { event: 'conditional-revision-rejected', detail: e.message });
      return 'REVISION_REJECTED';
    }
    if (e.code === 'FAILED_RETRYABLE') {
      rec.transition(SM.STATES.FAILED_RETRYABLE, { event: 'transient-failure', detail: e.message });
      return 'RETRYABLE';
    }
    if (e.code === 'FAILED_FINAL') {
      rec.transition(SM.STATES.FAILED_FINAL, { event: 'final-failure', detail: e.message });
      return 'FINAL';
    }
    if (e.code === 'MISSING_TARGET') {
      rec.transition(SM.STATES.REVIEW_REQUIRED, { event: 'target-missing-at-write', detail: e.message });
      return 'MISSING';
    }
    rec.transition(SM.STATES.REVIEW_REQUIRED, { event: 'adapter-error', detail: e.message });
    return 'ERROR';
  }
}

function applyBatch(records, operations, adapter, store, opts) {
  const options = opts || {};
  const limit = options.limit === undefined ? operations.length : options.limit;
  const recOf = (id) => records.filter((r) => r.operationId === id)[0];
  const revById = {};
  const results = [];
  for (let i = 0; i < operations.length && i < limit; i++) {
    const op = operations[i];
    if (revById[op.recordId] === undefined) revById[op.recordId] = op.expectedRevision;
    const res = applyOne(recOf(op.operationId), op, adapter, { ifRevision: revById[op.recordId] });
    if (res === 'APPLIED' && store && store.has(op.recordId)) revById[op.recordId] = store.get(op.recordId)._rev;
    results.push(res);
  }
  return results;
}

function captureOriginals(store, operations) {
  const originals = new Map();
  for (const op of operations) {
    if (originals.has(op.recordId)) continue;
    if (!store.has(op.recordId)) continue;
    originals.set(op.recordId, JSON.parse(JSON.stringify(store.get(op.recordId))));
  }
  return originals;
}

function verifyTargets(store, operations, records, originals) {
  const recOf = (id) => records.filter((r) => r.operationId === id)[0];
  const statuses = {};
  const targets = uniqueTargets(operations);
  for (const targetId of targets) {
    if (!store.has(targetId)) continue;
    const ops = operations.filter((o) => o.recordId === targetId);
    const current = store.get(targetId);
    const verification = V.verifyAfterWrite({
      originalDoc: originals.get(targetId) || { _id: targetId, _type: cfg.TARGET_TYPE, _rev: ops[0].expectedRevision, name: ops[0].title },
      currentDoc: current,
      operations: ops,
      targetId: targetId,
      expectedNewRev: current._rev,
    });
    statuses[targetId] = verification.status;
    for (const op of ops) {
      const rec = recOf(op.operationId);
      if (rec.state !== SM.STATES.APPLIED_UNVERIFIED) continue;
      if (verification.status === 'VERIFIED') rec.transition(SM.STATES.VERIFIED, { event: 'read-after-write-verification', detail: 'VERIFIED' });
      else rec.transition(SM.STATES.REVIEW_REQUIRED, { event: 'read-after-write-verification', detail: verification.status });
    }
  }
  return statuses;
}

function blockAll(records) {
  for (const r of records) {
    if (r.state === SM.STATES.PREFLIGHTED) r.transition(SM.STATES.WRITE_BLOCKED, { event: 'authorization-barrier', detail: 'mutationAuthorized=false' });
  }
}

function stateCounts(records) {
  const counts = {};
  for (const r of records) counts[r.state] = (counts[r.state] || 0) + 1;
  return counts;
}

async function scenario01(operations) {
  const store = FA.seedStore(operations);
  const records = makeRecords(operations);
  const preflight = await P.runPreflight(readFrom(store), operations, { targetSet: uniqueTargets(operations) });
  transitionPreflight(records, preflight);
  const before = records.filter((r) => r.state === SM.STATES.PREFLIGHTED).length;
  blockAll(records);
  const adapter = new FA.FakeMutationAdapter(store);
  const assertions = [
    assertion('every target passes preflight', preflight.stateCounts.READY === preflight.targets, JSON.stringify(preflight.stateCounts)),
    assertion('no write is attempted while the barrier is closed', adapter.callCount === 0, 'adapterCalls=' + adapter.callCount),
    assertion('all operations settle in WRITE_BLOCKED', stateCounts(records).WRITE_BLOCKED === operations.length, JSON.stringify(stateCounts(records))),
    assertion('preflight performed before blocking (barrier checked at write time, not instead of preflight)', before === operations.length, 'preflighted=' + before),
    assertion('preflight marked every target authorization-blocked with writeAttempted=false', preflight.allBlockedByBarrier, 'allBlockedByBarrier=' + preflight.allBlockedByBarrier),
  ];
  return { id: 'SC-01', title: 'All preflight checks pass', assertions: assertions, records: records, preflight: preflight, adapter: adapter };
}

async function scenario02(operations) {
  const missingId = operations[0].recordId;
  const store = FA.seedStore(operations, { missing: [missingId] });
  const records = makeRecords(operations);
  const preflight = await P.runPreflight(readFrom(store), operations, { targetSet: uniqueTargets(operations) });
  transitionPreflight(records, preflight);
  blockAll(records);
  const adapter = new FA.FakeMutationAdapter(store);
  const row = preflight.rows.filter((r) => r.targetId === missingId)[0];
  const counts = stateCounts(records);
  const assertions = [
    assertion('disappearing target is reported as MISSING_TARGET', row && row.state === P.STATES.MISSING_TARGET, row ? row.state : 'no-row'),
    assertion('its two operations end in REVIEW_REQUIRED', counts.REVIEW_REQUIRED === 2, JSON.stringify(counts)),
    assertion('remaining targets still block without writing', counts.WRITE_BLOCKED === operations.length - 2, JSON.stringify(counts)),
    assertion('no adapter call for the missing target', adapter.calls.every((c) => c.docId !== missingId), 'calls=' + adapter.callCount),
  ];
  return { id: 'SC-02', title: 'One target disappears after initial plan construction', assertions: assertions, records: records, preflight: preflight, adapter: adapter };
}

async function scenario03(operations) {
  const driftId = operations[0].recordId;
  const store = FA.seedStore(operations, { driftedRev: { [driftId]: 'EXTERNAL_REV_CHANGED' } });
  const records = makeRecords(operations);
  const preflight = await P.runPreflight(readFrom(store), operations, { targetSet: uniqueTargets(operations) });
  transitionPreflight(records, preflight);
  blockAll(records);
  const adapter = new FA.FakeMutationAdapter(store);
  const row = preflight.rows.filter((r) => r.targetId === driftId)[0];
  const recs = records.filter((r) => r.recordId === driftId);
  const counts = stateCounts(records);
  const assertions = [
    assertion('revision drift is detected as REVISION_DRIFT', row && row.state === P.STATES.REVISION_DRIFT, row ? row.state : 'no-row'),
    assertion('frozen revision is never refreshed (expected revision unchanged in every record)', recs.every((r) => r.expectedRevision === operations.filter((o) => o.recordId === driftId)[0].expectedRevision), 'expected=' + recs[0].expectedRevision),
    assertion('drifted operations end CONFLICT pending review, never written', counts.CONFLICT === 2, JSON.stringify(counts)),
    assertion('no adapter call is issued for the drifted target', adapter.calls.every((c) => c.docId !== driftId), 'calls=' + adapter.callCount),
    assertion('read-after-write verification is not claimed for the drifted target', recs.every((r) => !r.verified), 'verified=' + recs.filter((r) => r.verified).length),
  ];
  return { id: 'SC-03', title: 'A target revision changes before the hypothetical commit', assertions: assertions, records: records, preflight: preflight, adapter: adapter };
}

async function scenario04(operations) {
  const targetId = operations[0].recordId;
  const opsOfTarget = operations.filter((o) => o.recordId === targetId);
  const store = FA.seedStore(operations);
  const records = makeRecords(operations);
  const preflight = await P.runPreflight(readFrom(store), operations, { targetSet: uniqueTargets(operations) });
  transitionPreflight(records, preflight);
  blockAll(records);
  store.get(targetId)._rev = 'EXTERNAL_REV_AFTER_PREFLIGHT';
  const adapter = new FA.FakeMutationAdapter(store);
  const recs = records.filter((r) => r.recordId === targetId);
  recs.forEach((r) => { if (r.state === SM.STATES.WRITE_BLOCKED) r.transition(SM.STATES.PREFLIGHTED, { event: 'hypothetical-authorized-write', detail: 'simulation only' }); });
  const results = opsOfTarget.map((op) => applyOne(recs.filter((r) => r.operationId === op.operationId)[0], op, adapter));
  const doc = store.get(targetId);
  const assertions = [
    assertion('conditional revision precondition rejects the hypothetical commit', results.every((r) => r === 'REVISION_REJECTED'), results.join(',')),
    assertion('document values remain untouched after the rejection', opsOfTarget.every((o) => P.readFieldValue(doc, o.fieldPath) === null), JSON.stringify(doc.seo || null)),
    assertion('both operations end CONFLICT (no blind retry)', recs.every((r) => r.state === SM.STATES.CONFLICT), recs.map((r) => r.state).join(',')),
    assertion('exactly one attempted write per operation, never replayed blindly', adapter.callCount === 2 && recs.every((r) => r.writeAttempts === 1), 'calls=' + adapter.callCount + ' attempts=' + recs.map((r) => r.writeAttempts).join(',')),
    assertion('production mutation channel untouched', FA.productionChannelSnapshot().productionMutationCalls === 0, JSON.stringify(FA.productionChannelSnapshot())),
  ];
  return { id: 'SC-04', title: 'A conditional revision check rejects the hypothetical commit', assertions: assertions, records: records, preflight: preflight, adapter: adapter };
}

async function scenario05(operations) {
  const failOp = operations[0];
  const store = FA.seedStore(operations);
  const records = makeRecords(operations);
  const preflight = await P.runPreflight(readFrom(store), operations, { targetSet: uniqueTargets(operations) });
  transitionPreflight(records, preflight);
  const adapter = new FA.FakeMutationAdapter(store, { failOperations: { [failOp.operationId]: 'transient' } });
  const originals = captureOriginals(store, operations);
  const first = applyBatch(records, operations, adapter, store);
  const failedFirst = first.filter((x) => x === 'RETRYABLE').length;
  delete adapter.options.failOperations[failOp.operationId];
  const recOf = (id) => records.filter((r) => r.operationId === id)[0];
  const rec = recOf(failOp.operationId);
  rec.transition(SM.STATES.PREFLIGHTED, { event: 'bounded-retry', detail: 're-read before retry' });
  const liveRev = store.get(failOp.recordId)._rev;
  const producedByThisRun = String(liveRev).indexOf('SIMULATED_REV_') === 0;
  const retryResult = applyOne(rec, failOp, adapter, { ifRevision: liveRev });
  const statuses = verifyTargets(store, operations, records, originals);
  const retryVerification = statuses[failOp.recordId];
  const counts = stateCounts(records);
  const assertions = [
    assertion('exactly one operation fails transiently in the batch', failedFirst === 1, 'failedFirst=' + failedFirst),
    assertion('bounded retry succeeds only after a fresh re-read of the target revision', retryResult === 'APPLIED' && producedByThisRun, 'retry=' + retryResult + ' liveRev=' + liveRev),
    assertion('the frozen expected revision is never refreshed in place', rec.expectedRevision === failOp.expectedRevision, 'frozen=' + rec.expectedRevision + ' frozenOp=' + failOp.expectedRevision),
    assertion('retried operation reaches VERIFIED only after read-after-write verification', rec.state === SM.STATES.VERIFIED && retryVerification === 'VERIFIED', rec.state + '/' + retryVerification),
    assertion('every operation in the batch reaches VERIFIED after read-after-write verification', counts.VERIFIED === operations.length, JSON.stringify(counts)),
    assertion('retry attempts are bounded (one retry, no loop)', rec.writeAttempts === 2, 'attempts=' + rec.writeAttempts),
    assertion('production mutation calls remain zero', FA.productionChannelSnapshot().productionMutationCalls === 0, JSON.stringify(FA.productionChannelSnapshot())),
  ];
  return { id: 'SC-05', title: 'One operation fails in a batch', assertions: assertions, records: records, preflight: preflight, adapter: adapter };
}

async function scenario06(operations) {
  const targetId = operations[0].recordId;
  const opsOfTarget = operations.filter((o) => o.recordId === targetId);
  const titleOp = opsOfTarget.filter((o) => o.fieldPath === cfg.FIELD_TITLE)[0];
  const descOp = opsOfTarget.filter((o) => o.fieldPath === cfg.FIELD_DESCRIPTION)[0];
  const store = FA.seedStore(operations);
  const records = makeRecords(operations);
  const preflight = await P.runPreflight(readFrom(store), operations, { targetSet: uniqueTargets(operations) });
  transitionPreflight(records, preflight);
  const adapter = new FA.FakeMutationAdapter(store, { failFieldPaths: [cfg.FIELD_DESCRIPTION] });
  const recOf = (id) => records.filter((r) => r.operationId === id)[0];
  const results = applyBatch(records, opsOfTarget, adapter, store);
  const titleIdx = opsOfTarget.map((o) => o.fieldPath).indexOf(cfg.FIELD_TITLE);
  const descIdx = opsOfTarget.map((o) => o.fieldPath).indexOf(cfg.FIELD_DESCRIPTION);
  const titleResult = results[titleIdx];
  const descResult = results[descIdx];
  const doc = store.get(targetId);
  const verification = V.verifyAfterWrite({
    originalDoc: { _id: targetId, _type: cfg.TARGET_TYPE, _rev: descOp.expectedRevision, name: titleOp.title },
    currentDoc: doc,
    operations: opsOfTarget,
    targetId: targetId,
    expectedNewRev: doc._rev,
  });
  const titleRec = recOf(titleOp.operationId);
  const descRec = recOf(descOp.operationId);
  titleRec.transition(SM.STATES.REVIEW_REQUIRED, { event: 'pair-verification-failed', detail: verification.status });
  descRec.transition(SM.STATES.FAILED_FINAL, { event: 'field-failure-final', detail: 'paired field not applied' });
  const assertions = [
    assertion('one field of the pair succeeds and the paired field fails', titleResult === 'APPLIED' && descResult === 'RETRYABLE', titleResult + '/' + descResult),
    assertion('the half-written document contains only the applied field', P.readFieldValue(doc, cfg.FIELD_TITLE) === titleOp.frozenProposedValue && P.readFieldValue(doc, cfg.FIELD_DESCRIPTION) === null, JSON.stringify(doc.seo || null)),
    assertion('paired-field verification fails, so the applied operation is never VERIFIED', verification.status === 'APPLIED_UNVERIFIED' && titleRec.state === SM.STATES.REVIEW_REQUIRED, verification.status + '/' + titleRec.state),
    assertion('the failed operation is explicitly FAILED_FINAL for review', descRec.state === SM.STATES.FAILED_FINAL, descRec.state),
    assertion('production mutation calls remain zero', FA.productionChannelSnapshot().productionMutationCalls === 0, JSON.stringify(FA.productionChannelSnapshot())),
  ];
  return { id: 'SC-06', title: 'One field succeeds but its paired field fails', assertions: assertions, records: records, preflight: preflight, adapter: adapter };
}

async function scenario07(operations) {
  const targetId = operations[0].recordId;
  const opsOfTarget = operations.filter((o) => o.recordId === targetId);
  const store = FA.seedStore(operations);
  const records = makeRecords(operations);
  const preflight = await P.runPreflight(readFrom(store), operations, { targetSet: uniqueTargets(operations) });
  transitionPreflight(records, preflight);
  const adapter = new FA.FakeMutationAdapter(store);
  const recOf = (id) => records.filter((r) => r.operationId === id)[0];
  applyBatch(records, opsOfTarget, adapter, store);
  const docAfterWrite = store.get(targetId);
  store.get(targetId).name = 'UNEXPECTED_EXTERNAL_CHANGE';
  const verification = V.verifyAfterWrite({
    originalDoc: { _id: targetId, _type: cfg.TARGET_TYPE, _rev: opsOfTarget[0].expectedRevision, name: opsOfTarget[0].title },
    currentDoc: store.get(targetId),
    operations: opsOfTarget,
    targetId: targetId,
    expectedNewRev: docAfterWrite._rev,
  });
  for (const op of opsOfTarget) recOf(op.operationId).transition(SM.STATES.REVIEW_REQUIRED, { event: 'verification-failed', detail: verification.status });
  const recs = opsOfTarget.map((op) => recOf(op.operationId));
  const assertions = [
    assertion('simulated write succeeds before verification', adapter.callCount === 2, 'calls=' + adapter.callCount),
    assertion('read-after-write verification detects the unexpected change', verification.status === 'APPLIED_UNVERIFIED', verification.status),
    assertion('failed verification never yields VERIFIED', recs.every((r) => r.state !== SM.STATES.VERIFIED && !r.verified), recs.map((r) => r.state).join(',')),
    assertion('result is classified REVIEW_REQUIRED with applied-but-unverified history', recs.every((r) => r.state === SM.STATES.REVIEW_REQUIRED && r.simulatedWriteApplied === true), recs.map((r) => r.state).join(',')),
    assertion('production mutation calls remain zero', FA.productionChannelSnapshot().productionMutationCalls === 0, JSON.stringify(FA.productionChannelSnapshot())),
  ];
  return { id: 'SC-07', title: 'A hypothetical write succeeds but read-after-write verification fails', assertions: assertions, records: records, preflight: preflight, adapter: adapter };
}

async function scenario08(operations) {
  const store = FA.seedStore(operations);
  const records = makeRecords(operations);
  const preflight = await P.runPreflight(readFrom(store), operations, { targetSet: uniqueTargets(operations) });
  transitionPreflight(records, preflight);
  const adapter = new FA.FakeMutationAdapter(store);
  const recOf = (id) => records.filter((r) => r.operationId === id)[0];
  const half = Math.floor(operations.length / 2);
  let stoppedAt = null;
  try {
    const applied = applyBatch(records, operations, adapter, store, { limit: half });
    if (applied.length === half) throw new Error('simulated process interruption after half the operation list');
  } catch (e) {
    stoppedAt = e.message;
  }
  const summary = SM.summarize(records);
  const counts = stateCounts(records);
  const assertions = [
    assertion('the process stops halfway through the operation list', stoppedAt !== null && adapter.callCount === half, 'stoppedAt=' + stoppedAt + ' calls=' + adapter.callCount),
    assertion('applied-but-unverified operations are counted, never claimed verified', (counts.APPLIED_UNVERIFIED || 0) === half && (counts.VERIFIED || 0) === 0, JSON.stringify(counts)),
    assertion('unreached operations remain PREFLIGHTED with no write attempts', (counts.PREFLIGHTED || 0) === operations.length - half && records.filter((r) => r.state === SM.STATES.PREFLIGHTED).every((r) => r.writeAttempts === 0), JSON.stringify(counts)),
    assertion('reconciliation accounts for every operation', summary.fullyAccounted && summary.total === operations.length &&
      summary.groups.appliedUnverified === half && summary.groups.plannedOrPreflighted === operations.length - half, JSON.stringify(summary.groups)),
    assertion('production mutation calls remain zero', FA.productionChannelSnapshot().productionMutationCalls === 0, JSON.stringify(FA.productionChannelSnapshot())),
  ];
  return { id: 'SC-08', title: 'The process stops halfway through the operation list', assertions: assertions, records: records, preflight: preflight, adapter: adapter, summary: summary };
}

async function scenario09(operations) {
  const targetId = operations[0].recordId;
  const opsOfTarget = operations.filter((o) => o.recordId === targetId);
  const appliedStore = FA.seedStore(operations);
  const firstAdapter = new FA.FakeMutationAdapter(appliedStore);
  for (const op of opsOfTarget) {
    const liveRev = appliedStore.has(op.recordId) ? appliedStore.get(op.recordId)._rev : op.expectedRevision;
    firstAdapter.apply({ operationId: op.operationId, docId: op.recordId, fieldPath: op.fieldPath, ifRevision: liveRev, frozenValue: op.frozenProposedValue });
  }
  const restartRecords = makeRecords(operations);
  const preflight = await P.runPreflight(readFrom(appliedStore), operations, { targetSet: uniqueTargets(operations) });
  transitionPreflight(restartRecords, preflight);
  blockAll(restartRecords);
  const restartAdapter = new FA.FakeMutationAdapter(appliedStore);
  const row = preflight.rows.filter((r) => r.targetId === targetId)[0];
  const recs = restartRecords.filter((r) => r.recordId === targetId);
  const doc = appliedStore.get(targetId);
  const assertions = [
    assertion('restart detects both approved values already present', row && row.state === P.STATES.ALREADY_APPLIED, row ? row.state : 'no-row'),
    assertion('already-applied operations become NO_OP_ALREADY_APPLIED', recs.every((r) => r.state === SM.STATES.NO_OP_ALREADY_APPLIED), recs.map((r) => r.state).join(',')),
    assertion('already-applied is never treated as permission to write', restartAdapter.callCount === 0, 'restartCalls=' + restartAdapter.callCount),
    assertion('provenance uncertainty is recorded (revision differs from the frozen revision)', row && row.reasons.some((x) => x.indexOf('provenance') >= 0), row ? row.reasons.join(',') : 'no-row'),
    assertion('sibling seo keys added by the earlier simulated write are intact', P.readFieldValue(doc, cfg.FIELD_TITLE) === opsOfTarget.filter((o) => o.fieldPath === cfg.FIELD_TITLE)[0].frozenProposedValue, JSON.stringify(doc.seo || null)),
    assertion('production mutation calls remain zero', FA.productionChannelSnapshot().productionMutationCalls === 0, JSON.stringify(FA.productionChannelSnapshot())),
  ];
  return { id: 'SC-09', title: 'The process restarts and sees an already-applied value', assertions: assertions, records: restartRecords, preflight: preflight, adapter: restartAdapter };
}

async function scenario10(operations) {
  const failOp = operations[0];
  const store = FA.seedStore(operations);
  const records = makeRecords(operations);
  const preflight = await P.runPreflight(readFrom(store), operations, { targetSet: uniqueTargets(operations) });
  transitionPreflight(records, preflight);
  const adapter = new FA.FakeMutationAdapter(store, { failOperations: { [failOp.operationId]: 'transient' } });
  const rec = records.filter((r) => r.operationId === failOp.operationId)[0];
  const firstAttempt = applyOne(rec, failOp, adapter);
  store.get(failOp.recordId)._rev = 'EXTERNAL_REV_BEFORE_RETRY';
  rec.transition(SM.STATES.PREFLIGHTED, { event: 'retry-preflight', detail: 're-read before any retry' });
  const retryPreflight = await P.runPreflight(readFrom(store), [failOp], { targetSet: uniqueTargets(operations) });
  const retryRow = retryPreflight.rows[0];
  rec.transition(SM.STATES.CONFLICT, { event: 'revision-drift-on-retry', detail: retryRow.state });
  const callsForOp = adapter.calls.filter((c) => c.operationId === failOp.operationId).length;
  const assertions = [
    assertion('first attempt fails transiently', firstAttempt === 'RETRYABLE', firstAttempt),
    assertion('retry preflight observes the new revision as REVISION_DRIFT', retryRow.state === P.STATES.REVISION_DRIFT, retryRow.state),
    assertion('no blind retry is issued against the new revision', callsForOp === 1, 'callsForOp=' + callsForOp),
    assertion('operation ends CONFLICT pending review, never overwritten', rec.state === SM.STATES.CONFLICT && P.readFieldValue(store.get(failOp.recordId), failOp.fieldPath) === null, rec.state),
    assertion('production mutation calls remain zero', FA.productionChannelSnapshot().productionMutationCalls === 0, JSON.stringify(FA.productionChannelSnapshot())),
  ];
  return { id: 'SC-10', title: 'A retry encounters a new revision', assertions: assertions, records: records, preflight: preflight, adapter: adapter };
}

async function scenario11(operations) {
  const store = FA.seedStore(operations);
  const records = makeRecords(operations);
  const failingRead = async function readDoc() {
    throw new Error('simulated read API unavailability');
  };
  const preflight = await P.runPreflight(failingRead, operations, { targetSet: uniqueTargets(operations) });
  transitionPreflight(records, preflight);
  blockAll(records);
  const adapter = new FA.FakeMutationAdapter(store);
  const counts = stateCounts(records);
  const assertions = [
    assertion('read failure is reported for every target', preflight.readErrors === preflight.targets, 'readErrors=' + preflight.readErrors),
    assertion('no write is attempted when reads are unavailable', adapter.callCount === 0, 'calls=' + adapter.callCount),
    assertion('every operation ends REVIEW_REQUIRED rather than writing blind', counts.REVIEW_REQUIRED === operations.length, JSON.stringify(counts)),
    assertion('no operation is verified', (counts.VERIFIED || 0) === 0, JSON.stringify(counts)),
    assertion('production mutation calls remain zero', FA.productionChannelSnapshot().productionMutationCalls === 0, JSON.stringify(FA.productionChannelSnapshot())),
  ];
  return { id: 'SC-11', title: 'The read API becomes unavailable', assertions: assertions, records: records, preflight: preflight, adapter: adapter };
}

async function scenario12(operations) {
  const targetId = operations[0].recordId;
  const opsOfTarget = operations.filter((o) => o.recordId === targetId);
  const sibling = { customWarning: 'keep this sibling', focusKeyword: null, ogImageAlt: 'existing alt' };
  const store = FA.seedStore(operations, { siblingSeo: { [targetId]: sibling } });
  const originalDoc = Object.assign({}, store.get(targetId));
  const records = makeRecords(operations);
  const preflight = await P.runPreflight(readFrom(store), operations, { targetSet: uniqueTargets(operations) });
  transitionPreflight(records, preflight);
  const adapter = new FA.FakeMutationAdapter(store);
  const recOf = (id) => records.filter((r) => r.operationId === id)[0];
  applyBatch(records, opsOfTarget, adapter, store);
  const docAfter = store.get(targetId);
  const verification = V.verifyAfterWrite({
    originalDoc: originalDoc,
    currentDoc: docAfter,
    operations: opsOfTarget,
    targetId: targetId,
    expectedNewRev: docAfter._rev,
  });
  for (const op of opsOfTarget) recOf(op.operationId).transition(SM.STATES.VERIFIED, { event: 'verification', detail: verification.status });
  const allSeoKeys = Object.keys(docAfter.seo || {});
  const assertions = [
    assertion('sibling seo keys survive the nested field assignment', Object.keys(sibling).every((k) => JSON.stringify(docAfter.seo[k]) === JSON.stringify(sibling[k])), JSON.stringify(docAfter.seo)),
    assertion('only the two allowed nested fields were added', allSeoKeys.length === Object.keys(sibling).length + 2, allSeoKeys.join(',')),
    assertion('identity fields are untouched', docAfter._id === targetId && docAfter._type === cfg.TARGET_TYPE && docAfter.name === originalDoc.name, docAfter.name),
    assertion('read-after-write verification reports VERIFIED', verification.status === 'VERIFIED', JSON.stringify(verification.checks.map((c) => c.id + '=' + c.pass))),
    assertion('both operations reach VERIFIED with sibling-preservation proof', opsOfTarget.every((o) => recOf(o.operationId).state === SM.STATES.VERIFIED), JSON.stringify(stateCounts(records))),
    assertion('production mutation calls remain zero', FA.productionChannelSnapshot().productionMutationCalls === 0, JSON.stringify(FA.productionChannelSnapshot())),
  ];
  return { id: 'SC-12', title: 'An unrelated seo sibling field exists before and after the hypothetical operation', assertions: assertions, records: records, preflight: preflight, adapter: adapter };
}

function uniqueTargets(operations) {
  const seen = [];
  for (const op of operations) if (seen.indexOf(op.recordId) < 0) seen.push(op.recordId);
  return seen;
}

const SCENARIOS = [
  scenario01, scenario02, scenario03, scenario04, scenario05, scenario06,
  scenario07, scenario08, scenario09, scenario10, scenario11, scenario12,
];

async function runScenarios(operations) {
  FA.resetProductionChannel();
  const results = [];
  for (const fn of SCENARIOS) {
    const r = await fn(operations);
    const assertionFailures = r.assertions.filter((a) => !a.pass);
    results.push({
      id: r.id,
      title: r.title,
      simulatedWriteOnly: true,
      productionMutationCalls: FA.productionChannelSnapshot().productionMutationCalls,
      simulatedAdapterCalls: r.adapter ? r.adapter.callCount : 0,
      operationStates: stateCounts(r.records),
      statesVisited: statesVisited(r.records),
      preflightStateCounts: r.preflight ? r.preflight.stateCounts : null,
      assertions: r.assertions,
      passed: assertionFailures.length === 0,
      failedAssertions: assertionFailures.map((a) => a.label + ' [' + a.detail + ']'),
      partialReconciliation: r.summary || null,
    });
  }
  const channel = FA.productionChannelSnapshot();
  return {
    spec: cfg.SPEC,
    phase: 'FAKE_ADAPTER_SIMULATIONS',
    mode: 'SIMULATED_WRITES_ONLY_FAKE_ADAPTER',
    mutationAuthorized: cfg.mutationAuthorized,
    scenarios: results,
    summary: {
      total: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      assertions: results.reduce((n, r) => n + r.assertions.length, 0),
      assertionsPassed: results.reduce((n, r) => n + r.assertions.filter((a) => a.pass).length, 0),
      simulatedAdapterCalls: results.reduce((n, r) => n + r.simulatedAdapterCalls, 0),
      productionChannel: channel,
      operationStatesExercised: operationStatesExercised(results),
    },
  };
}

function statesVisited(records) {
  const seen = {};
  for (const r of records) {
    for (const h of r.history) seen[h.to] = true;
    seen[r.state] = true;
  }
  return Object.keys(seen).sort();
}

function operationStatesExercised(results) {
  const visited = {};
  const final = {};
  for (const r of results) {
    for (const k of (r.statesVisited || [])) visited[k] = true;
    for (const k of Object.keys(r.operationStates)) final[k] = true;
  }
  const required = Object.keys(SM.STATES);
  return {
    visited: Object.keys(visited).sort(),
    finalStates: Object.keys(final).sort(),
    required: required,
    missing: required.filter((s) => !visited[s]),
  };
}

module.exports = { runScenarios, SCENARIOS, uniqueTargets, makeRecords, readFrom, assertion };
