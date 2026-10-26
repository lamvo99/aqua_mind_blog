'use strict';

const cfg = require('./config');
const P = require('./preflight');
const SM = require('./state_machine');

function transitionPreflight(records, preflight) {
  const byId = {};
  for (const r of records) byId[r.operationId] = r;
  for (const row of preflight.rows) {
    for (const opId of row.operationIds) {
      const rec = byId[opId];
      if (!rec || rec.state !== SM.STATES.PLANNED) continue;
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

function blockAtBarrier(records) {
  let blocked = 0;
  for (const r of records) {
    if (r.state === SM.STATES.PREFLIGHTED) {
      r.transition(SM.STATES.WRITE_BLOCKED, { event: 'authorization-barrier', detail: 'mutationAuthorized=false; no production write implementation in this build' });
      blocked += 1;
    }
  }
  return blocked;
}

async function runDryRun(args) {
  const operations = args.operations;
  const readDoc = args.readDoc;
  const targetSet = args.targetSet;
  const records = operations.map((op) => new SM.OperationRecord(op));
  let preflight = null;
  let readError = null;
  try {
    preflight = await P.runPreflight(readDoc, operations, { targetSet: targetSet });
  } catch (e) {
    readError = e && e.message ? e.message : String(e);
    for (const r of records) {
      if (r.state !== SM.STATES.PLANNED) continue;
      r.transition(SM.STATES.PREFLIGHTED, { event: 'preflight-read-failure', detail: readError });
      r.transition(SM.STATES.REVIEW_REQUIRED, { event: 'preflight-read-failure', detail: readError });
    }
    return {
      status: 'HALTED_READ_FAILURE',
      readError: readError,
      preflight: null,
      summary: SM.summarize(records),
      records: records,
      blocked: 0,
      writeAttempts: 0,
      productionMutationCalls: 0,
      adapterConstructed: false,
      barrier: 'CLOSED',
    };
  }

  transitionPreflight(records, preflight);
  const blocked = blockAtBarrier(records);
  const summary = SM.summarize(records);
  const allReadsFailed = preflight.readErrors > 0 && preflight.readErrors === preflight.targets;
  return {
    status: allReadsFailed ? 'HALTED_READ_FAILURE' : 'DRY_RUN_COMPLETE',
    readError: allReadsFailed ? 'every target read failed' : null,
    preflight: preflight,
    summary: SM.summarize(records),
    records: records,
    blocked: blocked,
    writeAttempts: 0,
    productionMutationCalls: 0,
    adapterConstructed: false,
    barrier: 'CLOSED',
    mutationAuthorized: cfg.mutationAuthorized,
    stateCounts: summary.counts,
  };
}

module.exports = { runDryRun, transitionPreflight, blockAtBarrier };
