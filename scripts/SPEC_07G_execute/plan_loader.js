'use strict';

const cfg = require('./config');
const IO = require('../SPEC_07F_executor/io');
const FP = require('../SPEC_07F_executor/frozen_plan');
const AL = require('../SPEC_07F_executor/allowlist');

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

function groupByTarget(operations) {
  const groups = {};
  const order = [];
  for (const op of operations) {
    if (!groups[op.recordId]) { groups[op.recordId] = []; order.push(op.recordId); }
    groups[op.recordId].push(op);
  }
  return { groups: groups, order: order };
}

function loadPlan() {
  const integrityRun = FP.runIntegrity();
  const planFingerprint = IO.fingerprintOf(cfg.FROZEN_PLAN_CSV);
  const targetSet = Object.keys(integrityRun.perTarget);
  const allowlist = AL.validateOperationSet(integrityRun.operations, {
    targetSet: targetSet,
    frozenByKey: frozenByKey(integrityRun.planRows),
  });
  const grouped = groupByTarget(integrityRun.operations);
  return {
    integrityRun: integrityRun,
    integrity: integrityRun.report,
    planFingerprint: planFingerprint,
    allowlist: allowlist,
    operations: integrityRun.operations,
    planRows: integrityRun.planRows,
    targetSet: targetSet,
    groups: grouped.groups,
    order: grouped.order,
  };
}

module.exports = { loadPlan, frozenByKey, groupByTarget };
