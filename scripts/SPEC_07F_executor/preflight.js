'use strict';

const cfg = require('./config');

const STATES = Object.freeze({
  READY: 'READY',
  ALREADY_APPLIED: 'ALREADY_APPLIED',
  CONFLICT: 'CONFLICT',
  REVISION_DRIFT: 'REVISION_DRIFT',
  MISSING_TARGET: 'MISSING_TARGET',
  INVALID_TARGET: 'INVALID_TARGET',
  BLOCKED: 'BLOCKED',
  READ_ERROR: 'READ_ERROR',
});

function readFieldValue(doc, fieldPath) {
  const parts = String(fieldPath).split('.');
  let cur = doc;
  for (const p of parts) {
    if (cur === undefined || cur === null) return null;
    cur = cur[p];
  }
  return cur === undefined ? null : cur;
}

function classifyTarget(args) {
  const doc = args.doc;
  const reasons = [];
  if (doc === null || doc === undefined) {
    return { state: STATES.MISSING_TARGET, reasons: ['target-does-not-resolve'], liveRev: null };
  }
  if (args.targetSet.indexOf(args.targetId) < 0) {
    return { state: STATES.INVALID_TARGET, reasons: ['target-not-in-frozen-allowlist'], liveRev: doc._rev || null };
  }
  if (doc._type !== cfg.TARGET_TYPE) {
    return { state: STATES.INVALID_TARGET, reasons: ['unexpected-document-type:' + String(doc._type)], liveRev: doc._rev || null };
  }
  if (!doc._rev) {
    return { state: STATES.INVALID_TARGET, reasons: ['missing-live-revision'], liveRev: null };
  }

  const values = {};
  let anySet = 0;
  let anyMatch = 0;
  let anyMismatch = 0;
  for (const op of args.operations) {
    const live = readFieldValue(doc, op.fieldPath);
    values[op.fieldPath] = live;
    if (live !== null && live !== undefined && live !== '') anySet += 1;
    if (live === op.frozenProposedValue) anyMatch += 1;
    else if (live !== null && live !== undefined && live !== '') anyMismatch += 1;
  }

  if (anyMismatch > 0) {
    const reasons = ['live-value-differs-from-frozen-proposal'];
    if (anyMatch > 0) reasons.push('partial-prior-application');
    if (doc._rev !== args.expectedRev) reasons.push('live-revision-differs-from-frozen-expected-revision');
    return { state: STATES.CONFLICT, reasons: reasons, liveRev: doc._rev, values: values };
  }
  if (anyMatch === args.operations.length) {
    const reasons = ['both-approved-values-present-and-equal'];
    if (doc._rev !== args.expectedRev) {
      reasons.push('live-revision-differs-from-frozen-expected-revision');
      reasons.push('provenance-not-established-value-equality-does-not-prove-who-or-when');
    }
    return { state: STATES.ALREADY_APPLIED, reasons: reasons, liveRev: doc._rev, values: values };
  }
  if (anySet > 0) {
    const reasons = ['partial-prior-application'];
    if (doc._rev !== args.expectedRev) reasons.push('live-revision-differs-from-frozen-expected-revision');
    return { state: STATES.CONFLICT, reasons: reasons, liveRev: doc._rev, values: values };
  }
  if (doc._rev !== args.expectedRev) {
    return {
      state: STATES.REVISION_DRIFT,
      reasons: ['live-revision-differs-from-frozen-expected-revision', 'frozen-revision-never-refreshed'],
      liveRev: doc._rev,
      expectedRev: args.expectedRev,
      values: values,
    };
  }
  return { state: STATES.READY, reasons: ['seo-object-absent-or-target-fields-unset'], liveRev: doc._rev, values: values };
}

function operationOutcomeFor(classification) {
  if (classification.state === STATES.READY) return STATES.BLOCKED;
  if (classification.state === STATES.ALREADY_APPLIED) return 'NO_OP_ALREADY_APPLIED';
  return classification.state;
}

function groupByTarget(operations) {
  const groups = {};
  const order = [];
  for (const op of operations) {
    if (!groups[op.recordId]) { groups[op.recordId] = []; order.push(op.recordId); }
    groups[op.recordId].push(op);
  }
  return { groups: groups, order: order };
}

async function runPreflight(readDoc, operations, ctx) {
  const grouped = groupByTarget(operations);
  const rows = [];
  let readErrors = 0;
  for (const targetId of grouped.order) {
    const ops = grouped.groups[targetId];
    let doc = null;
    let readError = null;
    try {
      doc = await readDoc(targetId);
    } catch (e) {
      readError = e && e.message ? e.message : String(e);
      readErrors += 1;
    }
    let classification;
    if (readError) classification = { state: STATES.READ_ERROR, reasons: ['read-failed:' + readError], liveRev: null };
    else {
      classification = classifyTarget({
        doc: doc,
        targetId: targetId,
        targetSet: ctx.targetSet,
        expectedRev: ops[0].expectedRevision,
        operations: ops,
      });
    }
    const outcome = readError ? STATES.READ_ERROR : operationOutcomeFor(classification);
    rows.push({
      targetId: targetId,
      recordType: cfg.TARGET_TYPE,
      expectedRev: ops[0].expectedRevision,
      liveRev: classification.liveRev || null,
      state: classification.state,
      operationOutcome: outcome,
      reasons: classification.reasons,
      values: classification.values || null,
      operationIds: ops.map((o) => o.operationId),
      authorizationState: 'BLOCKED',
      writeAttempted: false,
      readError: readError,
    });
  }
  const counts = {};
  for (const r of rows) counts[r.state] = (counts[r.state] || 0) + 1;
  const outcomeCounts = {};
  for (const r of rows) outcomeCounts[r.operationOutcome] = (outcomeCounts[r.operationOutcome] || 0) + 1;
  return {
    targets: rows.length,
    rows: rows,
    stateCounts: counts,
    outcomeCounts: outcomeCounts,
    readErrors: readErrors,
    allBlockedByBarrier: rows.every((r) => r.authorizationState === 'BLOCKED' && r.writeAttempted === false),
    productionMutationCalls: 0,
  };
}

module.exports = { STATES, readFieldValue, classifyTarget, operationOutcomeFor, groupByTarget, runPreflight };
