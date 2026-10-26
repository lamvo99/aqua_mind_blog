'use strict';

const SPEC = 'SPEC_07G';
const PHASE = 'PRODUCTION_SEO_METADATA_APPLY';
const MODE = 'APPROVED PRODUCTION WRITE';
const STATE = 'COMPLETE';

const PROJECT_ID = 'zeohjejw';
const DATASET = 'production';
const API_VERSION = '2026-05-25';
const QUERY_ENDPOINT = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const MUTATE_ENDPOINT = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/mutate/production';
const IDENTITY_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';

const TARGET_TYPE = 'species';
const ALLOWED_FIELDS = Object.freeze(['seo.metaDescription', 'seo.metaTitle']);
const FIELD_TITLE = 'seo.metaTitle';
const FIELD_DESCRIPTION = 'seo.metaDescription';
const SEO_ROOT = 'seo';

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
});

const FROZEN_PLAN_CSV = 'report/SPEC_07F/DRY_RUN_OPERATION_PLAN.csv';
const FROZEN_PLAN_SHA256 = 'd3cc331ec8687517a56792dd49f2465b8a1c5ba91d6b563efc8de8e49378bd9b';
const FROZEN_PLAN_BYTES = 191223;

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
  fIntegrity: 'report/SPEC_07F/FROZEN_INPUT_INTEGRITY.json',
  fPlan: 'report/SPEC_07F/DRY_RUN_OPERATION_PLAN.csv',
  fResults: 'report/SPEC_07F/DRY_RUN_RESULTS.json',
  fManifest: 'report/SPEC_07F/SOURCE_MANIFEST.json',
});

const FROZEN_PLAN_FILES = Object.freeze([
  'report/SPEC_07C/SPEC_07C_FINAL_MUTATION_READY.json',
  'report/SPEC_07C/SPEC_07C_EXCLUDED_ROWS.json',
  'report/SPEC_07C/SPEC_07C_REVISION_FREEZE.json',
  'report/SPEC_07D/SPEC_07D_TARGET_RECONCILIATION.csv',
  'report/SPEC_07D/SPEC_07D_FIELD_MUTATION_PLAN_PREP.csv',
  'report/SPEC_07D/SPEC_07D_PRE_AUDIT_SNAPSHOT.json',
]);

const AUTHORIZATION = Object.freeze({
  basis: 'PM-approved SPEC 07G instruction authorizing production writes of the frozen SEO metadata scope only',
  granted: true,
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  documentType: TARGET_TYPE,
  targetCount: BASELINE.targets,
  operationCount: BASELINE.operations,
  fields: [FIELD_TITLE, FIELD_DESCRIPTION],
  values: 'byte-identical frozen values from report/SPEC_07F/DRY_RUN_OPERATION_PLAN.csv',
  planCsvSha256: FROZEN_PLAN_SHA256,
  excludedRecordIds: Object.freeze([
    'IlX7xILobrukz7d5JnvaIg',
    'ofTl1CTOUWuLwM28PxTEeF',
    'species-amphiprion-ocellaris',
  ]),
  deniedScopes: Object.freeze([
    'any document outside the frozen 117 targets',
    'any field outside seo.metaTitle and seo.metaDescription',
    'any value not byte-identical to the frozen plan',
    'any dataset or project other than zeohjejw/production',
    'the 3 excluded records, the 85 MEDIUM candidates and the 13 BLOCKED candidates',
    'identity, slug, title, name, relationship, body or schema changes',
  ]),
  priorPhases: 'SPEC 07C, 07D, 07E and 07F remain mutationAuthorized false; this execution path is separate and scope-locked',
});

const OUT_DIR = 'report/SPEC_07G';
const MIRROR_OUT_DIR = 'reports/SPEC_07G';

const ARTIFACTS = Object.freeze([
  'COMPLETION_REPORT.md',
  'EXECUTION_RESULTS.json',
  'PRE_WRITE_STATE.json',
  'POST_WRITE_VERIFICATION.json',
  'OPERATION_LEDGER.csv',
  'REGRESSION_RESULTS.json',
  'SOURCE_MANIFEST.json',
]);

const STATUS_LINES = Object.freeze([
  'PASS — ALL APPROVED SEO UPDATES VERIFIED',
  'PASS WITH PARTIAL COMPLETION — REVIEW REQUIRED',
  'BLOCKED — NO PRODUCTION WRITES',
  'FAILED — PARTIAL MUTATION REQUIRES RECONCILIATION',
]);

const OP_STATUSES = Object.freeze(['APPLIED', 'ALREADY_MATCHED', 'CONFLICT', 'FAILED', 'NOT_ATTEMPTED', 'BLOCKED']);

const COMMANDS = Object.freeze(['validate', 'preflight', 'execute', 'help']);

const REJECTED_ARG_PATTERNS = Object.freeze([
  /^--(force|ids|id|field|fields|value|values|limit|only|exclude|skip|target|targets|dataset|project|api-version|retry|no-verify|unsafe|bypass)(=|$)/,
]);

const IGNORED_ENV_AUTH_NAMES = Object.freeze([
  'SPEC_07F_MUTATION_AUTHORIZED', 'SPEC_07F_AUTHORIZE_WRITE', 'MUTATION_AUTHORIZED',
  'SANITY_WRITE_ENABLED', 'SANITY_MUTATION_ENABLED', 'GATE_C_AUTHORIZED',
  'SPEC_07G_MUTATION_AUTHORIZED', 'EXECUTION_MODE', 'SPEC_07F_MODE',
]);

const MAX_WRITE_ATTEMPTS = 3;
const HTTP_TIMEOUT_MS = 60000;

const EXIT = Object.freeze({ ok: 0, error: 1, integrity: 2, scope: 3, preflightBlocked: 4, verification: 5 });

module.exports = {
  SPEC, PHASE, MODE, STATE,
  PROJECT_ID, DATASET, API_VERSION, QUERY_ENDPOINT, MUTATE_ENDPOINT, IDENTITY_HASH,
  TARGET_TYPE, ALLOWED_FIELDS, FIELD_TITLE, FIELD_DESCRIPTION, SEO_ROOT,
  BASELINE, FROZEN_PLAN_CSV, FROZEN_PLAN_SHA256, FROZEN_PLAN_BYTES,
  INPUTS, FROZEN_PLAN_FILES, AUTHORIZATION,
  OUT_DIR, MIRROR_OUT_DIR, ARTIFACTS, STATUS_LINES, OP_STATUSES, COMMANDS,
  REJECTED_ARG_PATTERNS, IGNORED_ENV_AUTH_NAMES, MAX_WRITE_ATTEMPTS, HTTP_TIMEOUT_MS,
  EXIT,
};
