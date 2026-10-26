'use strict';

const cfg = require('./config');
const IO = require('../SPEC_07F_executor/io');

const LEDGER_COLUMNS = Object.freeze([
  'operationId', 'proposalId', 'recordId', 'title', 'fieldPath', 'frozenProposedValue',
  'expectedRevision', 'preflightTargetState', 'preflightOpState', 'preflightLiveRev',
  'executionState', 'patchKind', 'attempts', 'httpStatus', 'outcome', 'valueVerified',
  'postRev', 'reason', 'recordedAt',
]);

function buildLedgerRows(args) {
  const operations = args.operations;
  const preflightRows = args.preflightRows;
  const records = args.records;
  const verification = args.verification;

  const preByTarget = {};
  for (const r of preflightRows) preByTarget[r.targetId] = r;
  const verifyByTarget = {};
  for (const d of (verification && verification.documents) || []) verifyByTarget[d.targetId] = d;

  const rows = [];
  for (const op of operations) {
    const pre = preByTarget[op.recordId];
    const preOp = pre ? pre.operations.filter((p) => p.operationId === op.operationId)[0] : null;
    const record = records[op.recordId];
    const oc = record ? record.opOutcomes.filter((o) => o.operationId === op.operationId)[0] : null;
    const vDoc = verifyByTarget[op.recordId];
    const vOp = vDoc ? vDoc.opResults.filter((o) => o.operationId === op.operationId)[0] : null;
    rows.push({
      operationId: op.operationId,
      proposalId: op.proposalId,
      recordId: op.recordId,
      title: op.title,
      fieldPath: op.fieldPath,
      frozenProposedValue: op.frozenProposedValue,
      expectedRevision: op.expectedRevision,
      preflightTargetState: pre ? pre.state : 'NOT_READ',
      preflightOpState: preOp ? preOp.opState : 'NOT_READ',
      preflightLiveRev: pre ? (pre.liveRev || '') : '',
      executionState: record ? record.state : 'NOT_ATTEMPTED',
      patchKind: record ? record.patchKind : 'NOOP',
      attempts: record ? record.attempts : 0,
      httpStatus: record && record.httpStatus !== null && record.httpStatus !== undefined ? record.httpStatus : '',
      outcome: oc ? oc.outcome : 'NOT_ATTEMPTED',
      valueVerified: vOp ? String(vOp.valueVerified) : '',
      postRev: record && record.postRev ? record.postRev : '',
      reason: oc ? oc.reason : 'no-execution-record',
      recordedAt: record ? record.recordedAt : '',
    });
  }
  return rows;
}

function summarize(rows) {
  const counts = {};
  for (const r of rows) counts[r.outcome] = (counts[r.outcome] || 0) + 1;
  for (const s of cfg.OP_STATUSES) if (counts[s] === undefined) counts[s] = 0;
  return counts;
}

function toCsv(rows) {
  return IO.toCsv(LEDGER_COLUMNS, rows);
}

module.exports = { LEDGER_COLUMNS, buildLedgerRows, summarize, toCsv };
