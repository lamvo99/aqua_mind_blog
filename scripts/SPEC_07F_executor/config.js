'use strict';

const SPEC = 'SPEC_07F';
const PHASE = 'EXECUTOR_IMPLEMENTATION_AND_DRY_RUN';
const MODE = 'IMPLEMENTATION + DRY-RUN ONLY';
const STATE = 'PENDING_PM_REVIEW';

const PROJECT_ID = 'zeohjejw';
const DATASET = 'production';
const API_VERSION = '2026-05-25';
const IDENTITY_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';

const BASELINE = Object.freeze({
  wiki: 473,
  species: 218,
  plant: 62,
  invertebrate: 56,
  coral: 48,
  equipment: 46,
  problem: 43,
  targets: 117,
  operations: 234,
  excluded: 3,
  medium: 85,
  blocked: 13,
  drafts: 0,
  posts: 20,
  livePosts: 20,
});

const TARGET_TYPE = 'species';
const ALLOWED_FIELDS = Object.freeze(['seo.metaDescription', 'seo.metaTitle']);
const FIELD_TITLE = 'seo.metaTitle';
const FIELD_DESCRIPTION = 'seo.metaDescription';
const TITLE_LENGTH = Object.freeze({ min: 38, max: 65 });
const DESCRIPTION_LENGTH = Object.freeze({ min: 142, max: 160 });

const mutationAuthorized = false;
const EXECUTION_MODES = Object.freeze(['dry-run']);
const DEFAULT_MODE = 'dry-run';

const CODE_DIR = 'scripts/SPEC_07F_executor';
const OUT_DIR = 'report/SPEC_07F';

const INPUTS = Object.freeze({
  plan07: 'report/SPEC_07/SPEC_07_PROPOSAL_PLAN.json',
  cFinal: 'report/SPEC_07C/SPEC_07C_FINAL_MUTATION_READY.json',
  cExcluded: 'report/SPEC_07C/SPEC_07C_EXCLUDED_ROWS.json',
  cFreeze: 'report/SPEC_07C/SPEC_07C_REVISION_FREEZE.json',
  cValidation: 'report/SPEC_07C/SPEC_07C_VALIDATION.json',
  dRecon: 'report/SPEC_07D/SPEC_07D_TARGET_RECONCILIATION.csv',
  dPlan: 'report/SPEC_07D/SPEC_07D_FIELD_MUTATION_PLAN_PREP.csv',
  dValidation: 'report/SPEC_07D/SPEC_07D_VALIDATION.json',
  dManifest: 'report/SPEC_07D/SPEC_07D_SOURCE_MANIFEST.json',
  dSnapshot: 'report/SPEC_07D/SPEC_07D_PRE_AUDIT_SNAPSHOT.json',
  eReview: 'report/SPEC_07E/PRE_WRITE_SAFETY_REVIEW.json',
  eConcurrency: 'report/SPEC_07E/CONCURRENCY_AND_IDEMPOTENCY_REVIEW.csv',
  eAllowlist: 'report/SPEC_07E/MUTATION_ALLOWLIST_AUDIT.md',
  eValidation: 'report/SPEC_07E/REGRESSION_RESULTS.json',
});

const PLAN_HEADER = Object.freeze([
  'proposalId', 'recordId', 'recordType', 'title', 'fieldPath', 'frozenProposedValue',
  'currentValue', 'expectedRevision', 'currentRevision', 'sourceArtifact',
  'SPEC07CClassification', 'cannibalizationDisposition', 'valueValidationStatus',
  'revisionStatus', 'eligibilityStatus', 'blockReason', 'futureWritePrecondition',
]);

const OUTPUT_HEADER = Object.freeze([
  'operationId', 'proposalId', 'recordId', 'recordType', 'title', 'fieldPath',
  'frozenProposedValue', 'expectedRevision', 'sourceArtifact', 'sourceSha256',
  'planArtifact', 'planRowSha256', 'allowlistStatus', 'dryRunStatus',
  'preflightState', 'idempotencyState', 'writeBarrier', 'mutationAuthorized',
  'verificationContract', 'provenanceNote',
]);

const ARTIFACTS = Object.freeze([
  'FROZEN_INPUT_INTEGRITY.json',
  'DRY_RUN_OPERATION_PLAN.csv',
  'DRY_RUN_RESULTS.json',
  'WRITE_BARRIER_TEST_RESULTS.json',
  'STATE_MACHINE_TEST_RESULTS.json',
  'REGRESSION_RESULTS.json',
  'SOURCE_MANIFEST.json',
  'AUDIT_REPORT.md',
  'COMPLETION_REPORT.md',
]);

const VOLATILE_METADATA = Object.freeze([
  'generatedAt', 'readAt', 'startedAt', 'finishedAt', 'livePreflight.readAt',
  'regressions.startedAt', 'regressions.finishedAt', 'durationMs',
]);

const EXIT = Object.freeze({ ok: 0, error: 1, integrity: 2, barrier: 3, count: 4 });

module.exports = {
  SPEC, PHASE, MODE, STATE,
  PROJECT_ID, DATASET, API_VERSION, IDENTITY_HASH,
  BASELINE, TARGET_TYPE, ALLOWED_FIELDS, FIELD_TITLE, FIELD_DESCRIPTION,
  TITLE_LENGTH, DESCRIPTION_LENGTH,
  mutationAuthorized, EXECUTION_MODES, DEFAULT_MODE,
  CODE_DIR, OUT_DIR, INPUTS, PLAN_HEADER, OUTPUT_HEADER, ARTIFACTS,
  VOLATILE_METADATA, EXIT,
};
