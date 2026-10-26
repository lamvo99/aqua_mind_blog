'use strict';

const STATES = Object.freeze({
  PLANNED: 'PLANNED',
  PREFLIGHTED: 'PREFLIGHTED',
  WRITE_BLOCKED: 'WRITE_BLOCKED',
  APPLIED_UNVERIFIED: 'APPLIED_UNVERIFIED',
  VERIFIED: 'VERIFIED',
  CONFLICT: 'CONFLICT',
  FAILED_RETRYABLE: 'FAILED_RETRYABLE',
  FAILED_FINAL: 'FAILED_FINAL',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
  NO_OP_ALREADY_APPLIED: 'NO_OP_ALREADY_APPLIED',
});

const TERMINAL_STATES = Object.freeze([
  STATES.VERIFIED, STATES.FAILED_FINAL, STATES.REVIEW_REQUIRED, STATES.NO_OP_ALREADY_APPLIED,
]);

const RECOVERY_PROCEDURE = Object.freeze({
  PLANNED: 'Not started. No side effects. Re-run preflight before any future authorized write.',
  PREFLIGHTED: 'Preflight passed, no write attempted. Safe to re-run preflight; never write without separate authorization.',
  WRITE_BLOCKED: 'Authorization barrier refused the write. Recovery: nothing to undo. Resume only after a future authorized phase re-preflights the target.',
  APPLIED_UNVERIFIED: 'Simulated or real write acknowledged but verification incomplete. Recovery: re-read the target, verify values, identity and siblings; if verification cannot be established mark REVIEW_REQUIRED. Never roll the write back automatically.',
  VERIFIED: 'Terminal success state. No further action. An already-verified operation is never rewritten.',
  CONFLICT: 'Live values differ from the frozen proposal. Recovery: hold for human reconciliation; never overwrite a value changed by a person or another process. No automatic retry.',
  FAILED_RETRYABLE: 'Transient failure with a demonstrably safe retry condition (same revision, value not applied). Recovery: bounded retry with identical conditional revision precondition; on a new revision move to REVIEW_REQUIRED.',
  FAILED_FINAL: 'Terminal failure. Recovery: no automatic retry; requires a new reviewed plan entry.',
  REVIEW_REQUIRED: 'Terminal ambiguous or partial outcome. Recovery: human review of audit events and live state; the operation is never silently replayed.',
  NO_OP_ALREADY_APPLIED: 'Target already holds both approved values. Terminal no-op candidate for review; never treated as permission to write.',
});

const TRANSITIONS = Object.freeze({
  PLANNED: [STATES.PREFLIGHTED, STATES.WRITE_BLOCKED, STATES.REVIEW_REQUIRED],
  PREFLIGHTED: [STATES.WRITE_BLOCKED, STATES.APPLIED_UNVERIFIED, STATES.CONFLICT, STATES.FAILED_RETRYABLE, STATES.NO_OP_ALREADY_APPLIED, STATES.REVIEW_REQUIRED],
  WRITE_BLOCKED: [STATES.PREFLIGHTED, STATES.NO_OP_ALREADY_APPLIED, STATES.REVIEW_REQUIRED],
  APPLIED_UNVERIFIED: [STATES.VERIFIED, STATES.REVIEW_REQUIRED, STATES.CONFLICT],
  FAILED_RETRYABLE: [STATES.PREFLIGHTED, STATES.FAILED_FINAL, STATES.REVIEW_REQUIRED],
  CONFLICT: [STATES.REVIEW_REQUIRED],
  VERIFIED: [],
  FAILED_FINAL: [],
  REVIEW_REQUIRED: [],
  NO_OP_ALREADY_APPLIED: [],
});

class IllegalTransitionError extends Error {
  constructor(from, to) {
    super('Illegal operation transition ' + from + ' -> ' + to);
    this.name = 'IllegalTransitionError';
    this.from = from;
    this.to = to;
  }
}

class OperationRecord {
  constructor(op) {
    this.operationId = op.operationId;
    this.recordId = op.recordId;
    this.fieldPath = op.fieldPath;
    this.expectedRevision = op.expectedRevision;
    this.state = STATES.PLANNED;
    this.history = [{ event: 'PLANNED', from: null, to: STATES.PLANNED }];
    this.writeAttempts = 0;
    this.simulatedWriteApplied = false;
    this.verified = false;
    this.recovery = RECOVERY_PROCEDURE[STATES.PLANNED];
  }

  canTransition(to) {
    return TRANSITIONS[this.state].indexOf(to) >= 0;
  }

  transition(to, meta) {
    if (!Object.prototype.hasOwnProperty.call(TRANSITIONS, to)) {
      throw new IllegalTransitionError(this.state, to);
    }
    if (!this.canTransition(to)) throw new IllegalTransitionError(this.state, to);
    const from = this.state;
    this.state = to;
    this.history.push({ event: (meta && meta.event) || to, from: from, to: to, detail: (meta && meta.detail) || null });
    this.recovery = RECOVERY_PROCEDURE[to];
    if (to === STATES.APPLIED_UNVERIFIED) this.simulatedWriteApplied = true;
    if (to === STATES.VERIFIED) this.verified = true;
    return this;
  }
}

function summarize(records) {
  const counts = {};
  for (const r of records) counts[r.state] = (counts[r.state] || 0) + 1;
  const get = (s) => counts[s] || 0;
  const groups = {
    verified: get(STATES.VERIFIED),
    alreadyApplied: get(STATES.NO_OP_ALREADY_APPLIED),
    writeBlocked: get(STATES.WRITE_BLOCKED),
    plannedOrPreflighted: get(STATES.PLANNED) + get(STATES.PREFLIGHTED),
    appliedUnverified: get(STATES.APPLIED_UNVERIFIED),
    failedRetryable: get(STATES.FAILED_RETRYABLE),
    failedFinal: get(STATES.FAILED_FINAL),
    conflict: get(STATES.CONFLICT),
    reviewRequired: get(STATES.REVIEW_REQUIRED),
  };
  const sum = Object.keys(groups).reduce((n, k) => n + groups[k], 0);
  return {
    total: records.length,
    counts: counts,
    groups: groups,
    requiresReview: groups.appliedUnverified + groups.failedRetryable + groups.conflict + groups.reviewRequired,
    reconciliationFormula: 'total = verified + alreadyApplied + writeBlocked + plannedOrPreflighted + appliedUnverified + failedRetryable + failedFinal + conflict + reviewRequired',
    fullyAccounted: sum === records.length && records.length > 0,
    productionMutationCalls: 0,
  };
}

module.exports = { STATES, TERMINAL_STATES, RECOVERY_PROCEDURE, TRANSITIONS, IllegalTransitionError, OperationRecord, summarize };
