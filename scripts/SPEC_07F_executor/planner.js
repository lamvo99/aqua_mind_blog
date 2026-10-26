'use strict';

const cfg = require('./config');
const IO = require('./io');

const PROVENANCE_NOTE = 'frozen value byte-identical to SPEC 07 proposal, SPEC 07C FINAL_MUTATION_READY and SPEC 07C REVISION_FREEZE; revision frozen by SPEC 07C; authorized for write only by a future separately approved GATE C';

function buildPlanRows(operations, overrides) {
  const map = overrides || {};
  return operations.map((op) => {
    const x = map[op.operationId] || {};
    return {
      operationId: op.operationId,
      proposalId: op.proposalId,
      recordId: op.recordId,
      recordType: op.recordType,
      title: op.title,
      fieldPath: op.fieldPath,
      frozenProposedValue: op.frozenProposedValue,
      expectedRevision: op.expectedRevision,
      sourceArtifact: op.sourceArtifact,
      sourceSha256: op.sourceSha256 || '',
      planArtifact: 'report/SPEC_07D/SPEC_07D_FIELD_MUTATION_PLAN_PREP.csv',
      planRowSha256: op.planRowSha256,
      allowlistStatus: 'ALLOWLISTED',
      dryRunStatus: x.dryRunStatus || 'PLANNED_DRY_RUN',
      preflightState: x.preflightState || 'NOT_RUN',
      idempotencyState: 'NOT_APPLIED',
      writeBarrier: 'CLOSED',
      mutationAuthorized: 'false',
      verificationContract: 'REQUIRED_AFTER_ANY_FUTURE_AUTHORIZED_WRITE',
      provenanceNote: PROVENANCE_NOTE,
    };
  });
}

function planCsvText(operations, overrides) {
  return IO.toCsv(cfg.OUTPUT_HEADER, buildPlanRows(operations, overrides));
}

function doubleBuild(operations, overrides) {
  const a = planCsvText(operations, overrides);
  const b = planCsvText(operations, overrides);
  return { identical: a === b, bytes: Buffer.byteLength(a, 'utf8'), sha256: IO.sha256Text(a) };
}

function planSummary(operations) {
  const perField = {};
  const perTarget = {};
  for (const op of operations) {
    perField[op.fieldPath] = (perField[op.fieldPath] || 0) + 1;
    perTarget[op.recordId] = (perTarget[op.recordId] || 0) + 1;
  }
  const targetCounts = Object.keys(perTarget).map((k) => perTarget[k]);
  return {
    operations: operations.length,
    targets: Object.keys(perTarget).length,
    perField: perField,
    operationsPerTargetMin: Math.min.apply(null, targetCounts),
    operationsPerTargetMax: Math.max.apply(null, targetCounts),
    allowedFields: cfg.ALLOWED_FIELDS.slice(),
    mutationAuthorized: cfg.mutationAuthorized,
  };
}

module.exports = { buildPlanRows, planCsvText, doubleBuild, planSummary, PROVENANCE_NOTE };
