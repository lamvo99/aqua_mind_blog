'use strict';

const cfg = require('./config');
const IO = require('../SPEC_07F_executor/io');
const V = require('../SPEC_07F_executor/verify');

const TARGET_STATES = Object.freeze(['READY', 'ALREADY_MATCHED', 'CONFLICT', 'BLOCKED']);
const OP_STATES = Object.freeze(['TO_WRITE', 'ALREADY_MATCHED', 'CONFLICT', 'BLOCKED']);

function seoStateOf(doc) {
  const seo = doc ? doc.seo : undefined;
  if (seo === undefined) return 'MISSING';
  if (seo === null) return 'NULL';
  if (typeof seo !== 'object' || Array.isArray(seo)) return 'NON_OBJECT';
  return 'PRESENT';
}

function classifyTarget(args) {
  const doc = args.doc;
  const ops = args.ops;
  const reasons = [];

  if (!doc) {
    return {
      state: 'BLOCKED',
      reasons: ['target-does-not-resolve'],
      liveRev: null,
      seoState: 'UNRESOLVED',
      ops: ops.map((op) => ({ operationId: op.operationId, fieldPath: op.fieldPath, liveValue: null, opState: 'BLOCKED', reason: 'target-does-not-resolve' })),
    };
  }
  if (doc._type !== cfg.TARGET_TYPE) {
    return {
      state: 'BLOCKED',
      reasons: ['unexpected-document-type:' + String(doc._type)],
      liveRev: doc._rev || null,
      seoState: seoStateOf(doc),
      ops: ops.map((op) => ({ operationId: op.operationId, fieldPath: op.fieldPath, liveValue: null, opState: 'BLOCKED', reason: 'unexpected-document-type' })),
    };
  }
  if (!doc._rev) {
    return {
      state: 'BLOCKED',
      reasons: ['missing-live-revision'],
      liveRev: null,
      seoState: seoStateOf(doc),
      ops: ops.map((op) => ({ operationId: op.operationId, fieldPath: op.fieldPath, liveValue: null, opState: 'BLOCKED', reason: 'missing-live-revision' })),
    };
  }
  const seoState = seoStateOf(doc);
  if (seoState === 'NON_OBJECT') {
    return {
      state: 'BLOCKED',
      reasons: ['seo-field-present-but-not-an-object'],
      liveRev: doc._rev,
      seoState: seoState,
      ops: ops.map((op) => ({ operationId: op.operationId, fieldPath: op.fieldPath, liveValue: null, opState: 'BLOCKED', reason: 'seo-field-present-but-not-an-object' })),
    };
  }

  const opRows = ops.map((op) => {
    const live = V.readPath(doc, op.fieldPath);
    let opState;
    let reason;
    if (live === op.frozenProposedValue) { opState = 'ALREADY_MATCHED'; reason = 'live-value-byte-identical-to-frozen-plan'; }
    else if (live === null || live === undefined || live === '') { opState = 'TO_WRITE'; reason = 'live-value-unset'; }
    else { opState = 'CONFLICT'; reason = 'live-value-differs-from-frozen-plan'; }
    return { operationId: op.operationId, fieldPath: op.fieldPath, liveValue: live, opState: opState, reason: reason };
  });

  const conflicts = opRows.filter((r) => r.opState === 'CONFLICT');
  const toWrite = opRows.filter((r) => r.opState === 'TO_WRITE');
  const matched = opRows.filter((r) => r.opState === 'ALREADY_MATCHED');

  if (conflicts.length) {
    reasons.push('live-value-differs-from-frozen-plan:' + conflicts.map((r) => r.fieldPath).join(','));
    if (matched.length || toWrite.length) reasons.push('partial-prior-application');
    if (doc._rev !== ops[0].expectedRevision) reasons.push('live-revision-differs-from-frozen-expected-revision');
    return { state: 'CONFLICT', reasons: reasons, liveRev: doc._rev, seoState: seoState, ops: opRows };
  }
  if (toWrite.length === 0) {
    reasons.push('both-approved-values-present-byte-identical');
    if (doc._rev !== ops[0].expectedRevision) reasons.push('live-revision-differs-from-frozen-expected-revision-value-equality-only');
    return { state: 'ALREADY_MATCHED', reasons: reasons, liveRev: doc._rev, seoState: seoState, ops: opRows };
  }
  if (doc._rev !== ops[0].expectedRevision) {
    reasons.push('live-revision-differs-from-frozen-expected-revision');
    reasons.push('frozen-revision-never-refreshed');
    return { state: 'CONFLICT', reasons: reasons, liveRev: doc._rev, seoState: seoState, ops: opRows };
  }
  reasons.push('live-revision-equals-frozen-expected-revision');
  reasons.push(seoState === 'MISSING' ? 'seo-object-absent' : 'seo-object-present-approved-fields-unset');
  if (matched.length) reasons.push('partial-prior-application-with-matching-revision');
  return { state: 'READY', reasons: reasons, liveRev: doc._rev, seoState: seoState, ops: opRows };
}

function buildPreflight(args) {
  const order = args.order;
  const groups = args.groups;
  const readDoc = args.readDoc;
  const rows = [];
  let readErrors = 0;

  for (const targetId of order) {
    const ops = groups[targetId];
    let doc = null;
    let readError = null;
    try {
      doc = readDoc(targetId);
    } catch (e) {
      readError = e && e.message ? e.message : String(e);
      readErrors += 1;
    }
    let classification;
    if (readError) {
      classification = {
        state: 'BLOCKED',
        reasons: ['read-failed:' + readError],
        liveRev: null,
        seoState: 'UNRESOLVED',
        ops: ops.map((op) => ({ operationId: op.operationId, fieldPath: op.fieldPath, liveValue: null, opState: 'BLOCKED', reason: 'read-failed' })),
      };
    } else {
      classification = classifyTarget({ doc: doc, ops: ops });
    }
    rows.push({
      targetId: targetId,
      recordType: cfg.TARGET_TYPE,
      title: ops[0].title,
      expectedRevision: ops[0].expectedRevision,
      liveRev: classification.liveRev,
      seoState: classification.seoState,
      state: classification.state,
      reasons: classification.reasons,
      operationIds: ops.map((op) => op.operationId),
      operations: classification.ops,
      writeAttempted: false,
      readError: readError,
    });
  }

  const stateCounts = {};
  for (const r of rows) stateCounts[r.state] = (stateCounts[r.state] || 0) + 1;
  const opStateCounts = {};
  for (const r of rows) {
    for (const op of r.operations) opStateCounts[op.opState] = (opStateCounts[op.opState] || 0) + 1;
  }
  return {
    rows: rows,
    stateCounts: stateCounts,
    opStateCounts: opStateCounts,
    targets: rows.length,
    readErrors: readErrors,
    toWriteTargets: rows.filter((r) => r.state === 'READY').length,
    alreadyMatchedTargets: rows.filter((r) => r.state === 'ALREADY_MATCHED').length,
    conflictTargets: rows.filter((r) => r.state === 'CONFLICT').length,
    blockedTargets: rows.filter((r) => r.state === 'BLOCKED').length,
  };
}

function writePlanFor(row) {
  return row.operations.filter((op) => op.opState === 'TO_WRITE').map((op) => op.operationId);
}

module.exports = { TARGET_STATES, OP_STATES, seoStateOf, classifyTarget, buildPreflight, writePlanFor };
