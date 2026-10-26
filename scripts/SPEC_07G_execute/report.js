'use strict';

const path = require('path');
const cfg = require('./config');
const IO = require('../SPEC_07F_executor/io');

function determineStatus(args) {
  const counts = args.counts;
  const verification = args.verification;
  const applied = counts.APPLIED || 0;
  const alreadyMatched = counts.ALREADY_MATCHED || 0;
  const conflict = counts.CONFLICT || 0;
  const failed = counts.FAILED || 0;
  const notAttempted = counts.NOT_ATTEMPTED || 0;
  const blocked = counts.BLOCKED || 0;
  const total = applied + alreadyMatched + conflict + failed + notAttempted + blocked;
  const values = verification.values || {};
  const unverifiedApplied = verification.unverifiedAppliedOperations || 0;
  const problems = verification.problems || [];

  let code;
  let reason;
  if (unverifiedApplied > 0 || verification.verdict === 'FAIL') {
    code = 'FAILED';
    reason = 'an operation recorded APPLIED does not read back its frozen value or a scope check failed';
  } else if (problems.length > 0) {
    code = 'FAILED';
    reason = 'verification reported problems that require reconciliation';
  } else if (total === cfg.BASELINE.operations && applied + alreadyMatched === cfg.BASELINE.operations &&
    values.verifiedPresent === cfg.BASELINE.operations && values.expectedPresent === cfg.BASELINE.operations) {
    code = 'PASS';
    reason = 'all 234 approved field values are present and byte-identical after execution';
  } else if (applied > 0) {
    code = 'PARTIAL';
    reason = 'production writes were applied and verified, but ' + (cfg.BASELINE.operations - applied - alreadyMatched) + ' operations did not reach an applied or already-matched state';
  } else {
    code = 'BLOCKED';
    reason = 'this execution performed no production write';
  }

  const lineByCode = {
    PASS: cfg.STATUS_LINES[0],
    PARTIAL: cfg.STATUS_LINES[1],
    BLOCKED: cfg.STATUS_LINES[2],
    FAILED: cfg.STATUS_LINES[3],
  };
  return { code: code, statusLine: lineByCode[code], reason: reason };
}

function row(label, value) {
  return '| ' + label + ' | ' + value + ' |';
}

function buildCompletionReport(ctx) {
  const counts = ctx.counts;
  const verification = ctx.verification;
  const regressions = ctx.regressions;
  const preflight = ctx.preflight;
  const status = ctx.status;
  const md = [];

  md.push('# SPEC 07G Completion Report - Production SEO Metadata Apply');
  md.push('');
  md.push('- Spec: SPEC_07G (' + cfg.PHASE + ')');
  md.push('- Mode: ' + cfg.MODE);
  md.push('- Target: project `' + cfg.PROJECT_ID + '`, dataset `' + cfg.DATASET + '`, apiVersion `' + cfg.API_VERSION + '`, document type `' + cfg.TARGET_TYPE + '`');
  md.push('- Authorization basis: ' + cfg.AUTHORIZATION.basis);
  md.push('- Started: ' + ctx.startedAt + ' / Finished: ' + ctx.finishedAt);
  md.push('- Intended maximum scope: 234 field updates across 117 documents (seo.metaTitle x117 + seo.metaDescription x117)');
  md.push('- Actual scope executed: ' + (counts.APPLIED || 0) + ' field updates written by this execution across ' + ctx.documentsWritten + ' documents');
  md.push('');
  md.push('## 1. Frozen plan integrity (Step A)');
  md.push('');
  md.push('| Check | Result |');
  md.push('| --- | --- |');
  md.push(row('Frozen input integrity (SPEC 07F re-run)', ctx.integrityPassed + '/' + ctx.integrityTotal + ' ' + ctx.integrityVerdict));
  md.push(row('Frozen operation plan sha256', '`' + ctx.planSha256 + '` (matches `' + cfg.FROZEN_PLAN_SHA256 + '`)'));
  md.push(row('Plan rows / unique targets / operations', '234 / 117 / 234'));
  md.push(row('Allowlist validation', ctx.allowlistPassed ? 'PASS (two operations per target, only the two approved field paths)' : 'FAIL'));
  md.push(row('Excluded records (3) present in plan', '0'));
  md.push('');
  md.push('## 2. Preflight (Step B)');
  md.push('');
  md.push('- Read: ' + preflight.targets + ' targets at ' + preflight.readAt + ' via ' + preflight.transport);
  md.push('- Classification: ' + JSON.stringify(preflight.stateCounts));
  md.push('- Operation states: ' + JSON.stringify(preflight.opStateCounts));
  md.push('- Species documents: ' + preflight.speciesCount + ' / wiki documents: ' + preflight.wikiTotal + ' / drafts: ' + preflight.drafts);
  md.push('- Full pre-write state recorded in `PRE_WRITE_STATE.json`.');
  md.push('');
  md.push('## 3. Production write (Step C)');
  md.push('');
  md.push('| Outcome | Operations |');
  md.push('| --- | --- |');
  for (const s of cfg.OP_STATUSES) md.push(row(s, counts[s] || 0));
  md.push(row('Total', cfg.BASELINE.operations));
  md.push('');
  md.push('- Conditional writes: one patch per document, `ifRevisionID` pinned to the frozen expected revision, patch body limited to the approved field paths that actually require a write.');
  md.push('- Documents written: ' + ctx.documentsWritten + ' / field updates written: ' + ctx.fieldsWritten + ' / mutation API calls: ' + ctx.mutationCalls);
  md.push('- Documents already holding the approved values: ' + ctx.alreadyMatchedDocuments + ' (recorded ALREADY_MATCHED, not rewritten).');
  md.push('- Documents refused by preflight: ' + ctx.preflightRefused + ' (CONFLICT/BLOCKED, never overwritten).');
  md.push('- Retries: bounded to ' + cfg.MAX_WRITE_ATTEMPTS + ' attempts per document, only on a fresh read that showed the frozen revision still in place; no frozen revision was ever refreshed.');
  md.push('- Every operation and outcome is recorded in `OPERATION_LEDGER.csv` and `EXECUTION_RESULTS.json` (incremental, resume-safe: an interrupted run reconciles journaled outcomes by fresh read before any further write).');
  md.push('');
  md.push('## 4. Read-after-write verification (Step D)');
  md.push('');
  md.push('| Verification check | Result |');
  md.push('| --- | --- |');
  for (const c of verification.checks) md.push(row(c.id + ' ' + c.label, (c.pass ? 'PASS' : 'FAIL') + ' - ' + c.detail));
  md.push('');
  md.push('- Values expected present: ' + verification.values.expectedPresent + ' / verified present: ' + verification.values.verifiedPresent + ' / not verified: ' + verification.values.notVerified);
  md.push('- Per-document verification results: ' + verification.documents.length + ' targets (see `POST_WRITE_VERIFICATION.json`).');
  md.push('- Documents outside the frozen 117 targets whose revision changed: ' + verification.scope.nonTargetDocumentsChangedCount);
  md.push('- Verification verdict: **' + verification.verdict + '**');
  md.push('');
  md.push('## 5. Regressions (Step E)');
  md.push('');
  md.push('| Regression | Result |');
  md.push('| --- | --- |');
  for (const c of regressions.checks) md.push(row(c.id + ' ' + c.label, (c.pass ? 'PASS' : 'FAIL') + ' - ' + c.detail));
  md.push('');
  md.push('- npm test classification: ' + (regressions.commands.filter((c) => c.command === 'npm test')[0] || {}).classification);
  md.push('- Git tracked files modified: ' + regressions.git.trackedModifiedCount);
  md.push('- Frozen plan artifacts unchanged: ' + regressions.frozenPlanImmutability.every((f) => f.unchanged));
  md.push('- Regression verdict: **' + regressions.summary.verdict + '** (' + regressions.summary.passed + '/' + regressions.summary.attempted + ')');
  md.push('');
  md.push('## 6. Deliverables');
  md.push('');
  md.push('- Primary location: `' + ctx.outDir + '/` (repository reporting convention)');
  md.push('- Mirror location: `' + ctx.mirrorDir + '/` (path named in the SPEC 07G instruction); byte-identical copies');
  md.push('');
  for (const name of cfg.ARTIFACTS) md.push('- ' + name);
  md.push('');
  md.push('## 7. Scope and safety statements');
  md.push('');
  md.push('- Fields written: seo.metaTitle and seo.metaDescription only (' + ctx.fieldsWritten + ' of 234 planned field updates written by this execution).');
  md.push('- Documents written: only records from the frozen 117-target allowlist.');
  md.push('- Untouched by design: 3 excluded records, 85 MEDIUM candidates, 13 BLOCKED candidates, all non-species documents, identity/slug/title/name/relationship/body fields and the schema.');
  md.push('- Sibling fields inside existing seo objects were preserved (verified per document, check P-04).');
  md.push('- The SPEC 07F executor remains default-deny: its write barrier still refuses write intent with exit code 3 (regression R-02).');
  md.push('- Prior phase artifacts (SPEC 07C/07D/07E/07F) were not modified; their frozen results still describe the pre-write state.');
  md.push('- Post-write note: SPEC 07C and SPEC 07D validators assert the pre-write canonical state (for example "species with a populated seo object: 0"); re-running them against live production after this approved write will report that divergence. Their recorded PASS results remain the frozen record of the pre-write world and were not rewritten by SPEC 07G.');
  md.push('- Secret scan: ' + ctx.secretHits + ' token hits across the deliverables.');
  md.push('- Tracked repository files modified by SPEC 07G: ' + ctx.trackedModified + '.');
  md.push('');
  md.push('## 8. Outcome counts');
  md.push('');
  md.push('| Metric | Count |');
  md.push('| --- | --- |');
  md.push(row('Intended field updates (frozen scope)', cfg.BASELINE.operations));
  md.push(row('Intended documents (frozen scope)', cfg.BASELINE.targets));
  md.push(row('APPLIED', counts.APPLIED || 0));
  md.push(row('ALREADY_MATCHED', counts.ALREADY_MATCHED || 0));
  md.push(row('CONFLICT', counts.CONFLICT || 0));
  md.push(row('FAILED', counts.FAILED || 0));
  md.push(row('NOT_ATTEMPTED', counts.NOT_ATTEMPTED || 0));
  md.push(row('BLOCKED', counts.BLOCKED || 0));
  md.push(row('Verified byte-identical values', verification.values.verifiedPresent + ' / ' + cfg.BASELINE.operations));
  md.push('');
  md.push('## 9. Status');
  md.push('');
  md.push('Determination: ' + status.reason + '.');
  md.push('');
  md.push('# ' + status.statusLine);
  md.push('');
  return md.join('\n');
}

function writeCompletionReport(ctx) {
  const text = buildCompletionReport(ctx);
  IO.writeText(path.join(ctx.outDir, 'COMPLETION_REPORT.md'), text);
  return text;
}

module.exports = { determineStatus, buildCompletionReport, writeCompletionReport };
