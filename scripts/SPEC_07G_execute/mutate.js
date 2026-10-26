'use strict';

const cfg = require('./config');
const IO = require('../SPEC_07F_executor/io');
const PB = require('./patch_builder');
const V = require('../SPEC_07F_executor/verify');

function buildBody(targetId, ifRevisionID, set) {
  return { mutations: [{ patch: { id: targetId, ifRevisionID: ifRevisionID, set: set } }] };
}

function classifyHttp(result) {
  if (!result) return 'TRANSIENT';
  if (result.error) return 'TRANSIENT';
  const s = result.status;
  if (s >= 200 && s < 300) return 'SUCCESS';
  if (s === 401 || s === 403) return 'AUTH';
  if (s === 409 || s === 412) return 'REVISION_CONFLICT';
  if (s >= 500) return 'TRANSIENT';
  return 'REJECTED';
}

function valueReport(doc, ops) {
  const per = ops.map((op) => {
    const actual = doc ? V.readPath(doc, op.fieldPath) : null;
    return { operationId: op.operationId, fieldPath: op.fieldPath, expected: op.frozenProposedValue, actual: actual, ok: actual === op.frozenProposedValue };
  });
  return { all: per.length > 0 && per.every((p) => p.ok), per: per };
}

function noAttemptResult(args, states, state, reason) {
  const opOutcomes = args.ops.map((op) => {
    const pre = states[op.operationId];
    let outcome;
    let why;
    if (pre === 'ALREADY_MATCHED') { outcome = 'ALREADY_MATCHED'; why = 'live-value-byte-identical-to-frozen-plan'; }
    else if (pre === 'CONFLICT') { outcome = 'CONFLICT'; why = 'live-value-differs-from-frozen-plan'; }
    else if (pre === 'BLOCKED') { outcome = 'BLOCKED'; why = reason; }
    else { outcome = state === 'ALREADY_MATCHED' ? 'ALREADY_MATCHED' : (state === 'FAILED' ? 'FAILED' : 'BLOCKED'); why = reason; }
    return { operationId: op.operationId, outcome: outcome, reason: why, valueVerified: null, attempts: 0, httpStatus: null, patchKind: 'NOOP' };
  });
  return {
    targetState: state,
    attempts: 0,
    httpStatus: null,
    patchKind: 'NOOP',
    patch: null,
    postRev: args.preflightRow.liveRev,
    opOutcomes: opOutcomes,
    fatal: false,
    reason: reason,
  };
}

async function executeTarget(args) {
  const ops = args.ops;
  const preflightRow = args.preflightRow;
  const read = args.read;
  const post = args.post;
  const preflightOpStates = {};
  for (const r of preflightRow.operations) preflightOpStates[r.operationId] = r.opState;

  const blockedOps = ops.filter((op) => preflightOpStates[op.operationId] === 'BLOCKED');
  const conflictOps = ops.filter((op) => preflightOpStates[op.operationId] === 'CONFLICT');
  const matchedOps = ops.filter((op) => preflightOpStates[op.operationId] === 'ALREADY_MATCHED');
  const writeOps = ops.filter((op) => preflightOpStates[op.operationId] === 'TO_WRITE');

  if (blockedOps.length) return noAttemptResult(args, preflightOpStates, 'BLOCKED', 'preflight-blocked');
  if (conflictOps.length) return noAttemptResult(args, preflightOpStates, 'CONFLICT', 'preflight-conflict');

  const patch = PB.buildPatch({ doc: args.doc, writes: writeOps, matched: matchedOps });
  if (patch.kind === 'REFUSED') {
    return noAttemptResult(args, preflightOpStates, 'FAILED', 'patch-refused:' + patch.error);
  }
  if (patch.kind === 'NOOP') {
    const result = noAttemptResult(args, preflightOpStates, 'ALREADY_MATCHED', 'no-field-requires-a-write');
    const readback = await read(args.targetId);
    const report = valueReport(readback, ops);
    for (const oc of result.opOutcomes) {
      const found = report.per.filter((p) => p.operationId === oc.operationId)[0];
      if (found) { oc.valueVerified = found.ok; if (!found.ok) { oc.outcome = 'FAILED'; oc.reason = 'readback-value-mismatch'; } }
    }
    result.postRev = readback ? readback._rev : null;
    result.targetState = result.opOutcomes.every((oc) => oc.outcome === 'ALREADY_MATCHED') ? 'ALREADY_MATCHED' : 'FAILED';
    return result;
  }

  const frozenRev = preflightRow.expectedRevision;
  const body = buildBody(args.targetId, frozenRev, patch.set);
  let attempts = 0;
  let lastStatus = null;
  let fatal = false;
  let finalState = null;
  let finalReason = null;
  let readback = null;
  let outcomeKind = null;

  while (attempts < cfg.MAX_WRITE_ATTEMPTS) {
    attempts += 1;
    const result = await post(body);
    lastStatus = result && result.status !== undefined ? result.status : null;
    const kind = classifyHttp(result);

    if (kind === 'AUTH') {
      fatal = true;
      outcomeKind = 'FAILED';
      finalReason = 'mutation-authorization-rejected-http-' + lastStatus;
      break;
    }
    if (kind === 'SUCCESS') {
      readback = await read(args.targetId);
      if (!readback) {
        outcomeKind = 'FAILED';
        finalReason = 'target-missing-after-acknowledged-write';
        break;
      }
      const report = valueReport(readback, writeOps);
      if (report.all) {
        outcomeKind = 'APPLIED';
        finalState = 'APPLIED';
        finalReason = 'conditional-write-applied-and-read-back';
        break;
      }
      outcomeKind = 'FAILED';
      finalReason = 'acknowledged-write-not-present-on-read-back';
      break;
    }
    if (kind === 'REVISION_CONFLICT') {
      readback = await read(args.targetId);
      const report = valueReport(readback, writeOps);
      if (report.all) {
        outcomeKind = 'ALREADY_MATCHED';
        finalState = 'ALREADY_MATCHED';
        finalReason = 'conditional-write-rejected-revision-changed-values-already-present';
      } else {
        outcomeKind = 'CONFLICT';
        finalState = 'CONFLICT';
        finalReason = 'conditional-write-rejected-revision-changed-http-' + lastStatus;
      }
      break;
    }
    if (kind === 'REJECTED') {
      outcomeKind = 'FAILED';
      finalState = 'FAILED';
      finalReason = 'mutation-rejected-http-' + lastStatus;
      break;
    }

    readback = await read(args.targetId);
    if (!readback) {
      outcomeKind = 'FAILED';
      finalState = 'FAILED';
      finalReason = 'target-unreadable-after-transient-failure';
      break;
    }
    const report = valueReport(readback, writeOps);
    if (report.all) {
      outcomeKind = 'APPLIED';
      finalState = 'APPLIED';
      finalReason = 'transient-failure-then-read-back-confirmed-values-present';
      break;
    }
    if (readback._rev === frozenRev) {
      finalReason = 'transient-failure-same-revision-retrying';
      continue;
    }
    outcomeKind = 'CONFLICT';
    finalState = 'CONFLICT';
    finalReason = 'revision-changed-during-retry-http-' + lastStatus;
    break;
  }

  if (!outcomeKind) {
    readback = await read(args.targetId);
    const report = valueReport(readback, writeOps);
    if (report.all) {
      outcomeKind = 'APPLIED';
      finalState = 'APPLIED';
      finalReason = 'retries-exhausted-then-read-back-confirmed-values-present';
    } else if (readback && readback._rev === frozenRev) {
      outcomeKind = 'FAILED';
      finalState = 'FAILED';
      finalReason = 'retries-exhausted-value-not-applied';
    } else {
      outcomeKind = 'CONFLICT';
      finalState = 'CONFLICT';
      finalReason = 'retries-exhausted-revision-changed';
    }
  }

  if (!finalState) finalState = outcomeKind;
  if (!finalReason) finalReason = 'outcome-resolved';

  const postRev = readback ? readback._rev : null;
  const opOutcomes = [];
  for (const op of ops) {
    const pre = preflightOpStates[op.operationId];
    if (pre === 'ALREADY_MATCHED') {
      const live = readback ? V.readPath(readback, op.fieldPath) : null;
      opOutcomes.push({
        operationId: op.operationId,
        outcome: live === op.frozenProposedValue ? 'ALREADY_MATCHED' : 'FAILED',
        reason: live === op.frozenProposedValue ? 'live-value-byte-identical-to-frozen-plan' : 'previously-matched-value-changed-during-write',
        valueVerified: live === op.frozenProposedValue,
        attempts: 0,
        httpStatus: lastStatus,
        patchKind: patch.kind,
      });
      continue;
    }
    const wasWritten = patch.fields.indexOf(op.fieldPath) >= 0;
    const live = readback ? V.readPath(readback, op.fieldPath) : null;
    const verified = live === op.frozenProposedValue;
    let outcome;
    if (!wasWritten) outcome = 'BLOCKED';
    else if (outcomeKind === 'APPLIED' && verified) outcome = 'APPLIED';
    else if (outcomeKind === 'ALREADY_MATCHED' && verified) outcome = 'ALREADY_MATCHED';
    else if (outcomeKind === 'CONFLICT') outcome = 'CONFLICT';
    else outcome = 'FAILED';
    opOutcomes.push({
      operationId: op.operationId,
      outcome: outcome,
      reason: finalReason,
      valueVerified: verified,
      attempts: attempts,
      httpStatus: lastStatus,
      patchKind: patch.kind,
    });
  }

  return {
    targetState: finalState,
    attempts: attempts,
    httpStatus: lastStatus,
    patchKind: patch.kind,
    patch: { set: patch.set, fields: patch.fields, ifRevisionID: frozenRev },
    postRev: postRev,
    opOutcomes: opOutcomes,
    fatal: fatal,
    reason: finalReason,
  };
}

function makeHttpTransport() {
  const token = IO.L.TOKEN;
  return {
    post: async function post(body) {
      try {
        const resp = await fetch(cfg.MUTATE_ENDPOINT, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(cfg.HTTP_TIMEOUT_MS),
        });
        const text = await resp.text();
        let json = null;
        try { json = JSON.parse(text); } catch (e) { json = null; }
        return { ok: resp.ok, status: resp.status, text: text, json: json, error: null };
      } catch (e) {
        return { ok: false, status: 0, text: '', json: null, error: e && e.message ? e.message : String(e) };
      }
    },
  };
}

module.exports = { buildBody, classifyHttp, valueReport, executeTarget, makeHttpTransport };
