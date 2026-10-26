'use strict';

const cfg = require('./config');
const IO = require('../SPEC_07F_executor/io');

class ScopeViolation extends Error {
  constructor(message, reasons) {
    super(message);
    this.name = 'ScopeViolation';
    this.reasons = reasons || [];
  }
}

function parseArgs(argv) {
  const opts = { command: null, out: cfg.OUT_DIR, mirror: cfg.MIRROR_OUT_DIR, help: false, unknown: [], rejected: [] };
  const list = argv || [];
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (a === '--help') { opts.help = true; continue; }
    if (a === '--out') {
      const v = list[i + 1];
      if (!v || v.charAt(0) === '-') { opts.unknown.push('--out'); continue; }
      opts.out = v;
      i += 1;
      continue;
    }
    if (a === '--mirror') {
      const v = list[i + 1];
      if (!v || v.charAt(0) === '-') { opts.unknown.push('--mirror'); continue; }
      opts.mirror = v;
      i += 1;
      continue;
    }
    if (a.charAt(0) === '-') {
      if (cfg.REJECTED_ARG_PATTERNS.some((re) => re.test(a))) opts.rejected.push(a);
      else opts.unknown.push(a);
      continue;
    }
    if (opts.command === null) opts.command = a;
    else opts.unknown.push(a);
  }
  if (opts.command === null && !opts.help) opts.command = null;
  return opts;
}

function scanIgnoredEnv(env) {
  const hits = [];
  for (const name of cfg.IGNORED_ENV_AUTH_NAMES) {
    const raw = env && env[name];
    if (raw === undefined || raw === null || raw === '') continue;
    hits.push(name + '=' + raw);
  }
  return hits;
}

function evaluateStaticScope(opts, env) {
  const reasons = [];
  if (opts.help) return { granted: false, help: true, reasons: [] };
  if (opts.command === null) reasons.push('missing-command');
  else if (cfg.COMMANDS.indexOf(opts.command) < 0) reasons.push('unknown-command:' + String(opts.command));
  if (opts.unknown.length) reasons.push('unrecognized-argument:' + opts.unknown.join(','));
  if (opts.rejected.length) reasons.push('scope-narrowing-or-force-argument-refused:' + opts.rejected.join(','));
  if (!cfg.AUTHORIZATION.granted) reasons.push('authorization-descriptor-not-granted');
  return {
    granted: reasons.length === 0,
    command: opts.command,
    reasons: reasons,
    ignoredEnvAuth: scanIgnoredEnv(env),
    scope: {
      projectId: cfg.AUTHORIZATION.projectId,
      dataset: cfg.AUTHORIZATION.dataset,
      apiVersion: cfg.AUTHORIZATION.apiVersion,
      documentType: cfg.AUTHORIZATION.documentType,
      targets: cfg.AUTHORIZATION.targetCount,
      operations: cfg.AUTHORIZATION.operationCount,
      fields: cfg.AUTHORIZATION.fields.slice(),
      planCsvSha256: cfg.AUTHORIZATION.planCsvSha256,
      basis: cfg.AUTHORIZATION.basis,
    },
  };
}

function evaluatePlanScope(args) {
  const reasons = [];
  const integrity = args.integrity;
  const planFingerprint = args.planFingerprint;
  const allowlist = args.allowlist;

  if (!integrity || integrity.verdict !== 'PASS') reasons.push('frozen-input-integrity-not-pass');
  else if (integrity.passed !== 21 || integrity.total !== 21) reasons.push('integrity-check-count-unexpected:' + integrity.passed + '/' + integrity.total);

  if (!planFingerprint || !planFingerprint.exists) reasons.push('frozen-plan-csv-missing');
  else {
    if (planFingerprint.sha256 !== cfg.FROZEN_PLAN_SHA256) {
      reasons.push('frozen-plan-sha256-mismatch:expected-' + cfg.FROZEN_PLAN_SHA256 + '-actual-' + planFingerprint.sha256);
    }
    if (planFingerprint.bytes !== cfg.FROZEN_PLAN_BYTES) reasons.push('frozen-plan-bytes-mismatch:' + planFingerprint.bytes);
  }

  const summary = (integrity && integrity.planSummary) || {};
  if (summary.rows !== cfg.BASELINE.operations) reasons.push('plan-row-count-unexpected:' + summary.rows);
  if (summary.targets !== cfg.BASELINE.targets) reasons.push('plan-target-count-unexpected:' + summary.targets);
  if (summary.operations !== cfg.BASELINE.operations) reasons.push('plan-operation-count-unexpected:' + summary.operations);
  if (!summary.perField || summary.perField.title !== 117 || summary.perField.description !== 117) reasons.push('plan-per-field-count-unexpected');

  if (!allowlist || allowlist.passed !== true) reasons.push('allowlist-validation-failed');
  else {
    if (allowlist.total !== cfg.BASELINE.operations) reasons.push('allowlist-operation-count-unexpected:' + allowlist.total);
    if (allowlist.targets !== cfg.BASELINE.targets) reasons.push('allowlist-target-count-unexpected:' + allowlist.targets);
    if (allowlist.duplicateOperationIds && allowlist.duplicateOperationIds.length) reasons.push('duplicate-operation-ids');
    if (!allowlist.twoOperationsPerTarget) reasons.push('not-two-operations-per-target');
    const allowed = (allowlist.allowedFields || []).slice().sort().join(',');
    if (allowed !== cfg.ALLOWED_FIELDS.slice().sort().join(',')) reasons.push('allowlist-fields-unexpected:' + allowed);
  }

  return {
    granted: reasons.length === 0,
    reasons: reasons,
    planCsvSha256: planFingerprint ? planFingerprint.sha256 : null,
    planCsvBytes: planFingerprint ? planFingerprint.bytes : null,
    integrityPassed: integrity ? integrity.passed : null,
    integrityTotal: integrity ? integrity.total : null,
    allowlistPassed: allowlist ? !!allowlist.passed : false,
  };
}

function assertGranted(evaluation) {
  if (!evaluation.granted) {
    throw new ScopeViolation('SPEC 07G scope gate refused the request', evaluation.reasons);
  }
  return evaluation;
}

module.exports = { ScopeViolation, parseArgs, scanIgnoredEnv, evaluateStaticScope, evaluatePlanScope, assertGranted };
