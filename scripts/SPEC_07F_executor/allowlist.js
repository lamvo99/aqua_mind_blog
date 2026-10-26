'use strict';

const cfg = require('./config');

const FORBIDDEN_TARGETS = Object.freeze([
  '_id', '_type', '_rev', '_updatedAt', 'slug', 'title', 'name', 'relatedPosts',
  'relationships', 'category', 'content', 'body', 'excerpt',
]);

function validateOperation(op, ctx) {
  const reasons = [];
  const targetSet = ctx.targetSet;
  const frozenByKey = ctx.frozenByKey;

  if (!op || typeof op !== 'object') reasons.push('operation-not-object');
  if (!op || typeof op.operationId !== 'string' || op.operationId !== op.proposalId + '#' + op.fieldPath) {
    reasons.push('operation-id-format');
  }
  if (!op || targetSet.indexOf(op.recordId) < 0) reasons.push('record-not-in-frozen-117');
  if (!op || op.recordType !== cfg.TARGET_TYPE) reasons.push('record-type-not-species');
  if (!op || cfg.ALLOWED_FIELDS.indexOf(op.fieldPath) < 0) reasons.push('field-path-not-allowlisted');
  if (!op || FORBIDDEN_TARGETS.indexOf(String(op.fieldPath).split('.')[0]) >= 0 && cfg.ALLOWED_FIELDS.indexOf(op.fieldPath) < 0) {
    reasons.push('forbidden-field-path');
  }
  if (!op || typeof op.frozenProposedValue !== 'string' || op.frozenProposedValue.trim() === '') {
    reasons.push('empty-or-missing-frozen-value');
  }
  if (!op || op.expectedRevision === undefined || op.expectedRevision === null || op.expectedRevision === '') {
    reasons.push('missing-frozen-expected-revision');
  }
  if (op && op.action !== undefined && op.action !== 'set-nested-field') reasons.push('non-field-assignment-action');
  if (op && op.mutationAuthorized !== false) reasons.push('operation-claims-write-authorization');

  const frozen = frozenByKey[op ? op.recordId + '|' + op.fieldPath : ''];
  if (!frozen) reasons.push('not-traced-to-frozen-plan');
  else {
    if (frozen.frozenProposedValue !== op.frozenProposedValue) reasons.push('frozen-value-mismatch');
    if (frozen.expectedRevision !== op.expectedRevision) reasons.push('frozen-revision-mismatch');
  }

  return { ok: reasons.length === 0, operationId: op ? op.operationId : null, reasons: reasons };
}

function validateOperationSet(operations, ctx) {
  const results = operations.map((op) => validateOperation(op, ctx));
  const seen = new Set();
  const duplicateOperationIds = [];
  for (const r of results) {
    if (seen.has(r.operationId)) duplicateOperationIds.push(r.operationId);
    seen.add(r.operationId);
  }
  const failed = results.filter((r) => !r.ok);
  const perTarget = {};
  for (const op of operations) {
    if (!perTarget[op.recordId]) perTarget[op.recordId] = [];
    perTarget[op.recordId].push(op.fieldPath);
  }
  const targets = Object.keys(perTarget);
  const twoPerTarget = targets.length === ctx.targetSet.length &&
    targets.every((k) => perTarget[k].length === 2 && cfg.ALLOWED_FIELDS.every((f) => perTarget[k].indexOf(f) >= 0));

  return {
    passed: failed.length === 0 && duplicateOperationIds.length === 0 &&
      operations.length === cfg.BASELINE.operations && twoPerTarget,
    total: operations.length,
    expected: cfg.BASELINE.operations,
    failedCount: failed.length,
    failures: failed.slice(0, 10),
    duplicateOperationIds: duplicateOperationIds,
    targets: targets.length,
    twoOperationsPerTarget: twoPerTarget,
    allowedFields: cfg.ALLOWED_FIELDS.slice(),
  };
}

module.exports = { validateOperation, validateOperationSet, FORBIDDEN_TARGETS };
