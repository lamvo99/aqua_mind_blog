'use strict';

const cfg = require('./config');

class BarrierViolation extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'BarrierViolation';
    this.code = code || 'BARRIER_CLOSED';
  }
}

class IntegrityViolation extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'IntegrityViolation';
    this.details = details || [];
  }
}

const WRITE_REQUEST_FLAGS = Object.freeze([
  '--execute', '--exec', '--write', '--apply', '--commit', '--prod',
  '--production', '--force', '--mutation', '--mutate', '--go', '--dry-run=false',
]);

const WRITE_ENV_NAMES = Object.freeze([
  'SPEC_07F_MUTATION_AUTHORIZED', 'SPEC_07F_AUTHORIZE_WRITE', 'MUTATION_AUTHORIZED',
  'SANITY_WRITE_ENABLED', 'SANITY_MUTATION_ENABLED', 'GATE_C_AUTHORIZED',
  'SPEC_07F_MODE', 'EXECUTION_MODE',
]);

function scanArgs(argv) {
  const hits = [];
  for (const a of argv || []) {
    const lower = String(a).toLowerCase();
    if (WRITE_REQUEST_FLAGS.indexOf(lower) >= 0) hits.push(a);
    else if (/^--(execute|write|apply|commit|force|prod|mutation|mutate)(=|$)/.test(lower)) hits.push(a);
  }
  return hits;
}

function scanEnv(env) {
  const hits = [];
  for (const name of WRITE_ENV_NAMES) {
    const raw = env && env[name];
    if (raw === undefined || raw === null || raw === '') continue;
    if (/^(1|true|yes|on|execute|write|authorized|approved|go)$/i.test(String(raw).trim())) hits.push(name + '=' + raw);
  }
  return hits;
}

function resolveMode(argv, env) {
  const flagHits = scanArgs(argv);
  const envHits = scanEnv(env);
  if (flagHits.length || envHits.length) {
    throw new BarrierViolation(
      'SPEC 07F is default-deny: write/execute intent detected (' +
      [].concat(flagHits, envHits).join(', ') +
      '). No argument or environment variable can authorize production mutation in this build.',
      'WRITE_REQUEST_REJECTED'
    );
  }
  return cfg.DEFAULT_MODE;
}

function isWriteAuthorized(context) {
  return false;
}

function evaluateAuthorizationContract(contract) {
  const buildImplementsProductionWrites = false;
  const buildFlag = cfg.mutationAuthorized === true;
  const contractLooksValid = !!(contract && contract.approved === true && contract.pm && contract.artifact);
  return {
    authorized: false,
    buildImplementsProductionWrites,
    buildFlag,
    contractProvided: !!contract,
    contractLooksValid,
    reason: buildImplementsProductionWrites && buildFlag
      ? 'unreachable-in-spec-07f-build'
      : 'SPEC_07F build contains no production write implementation and mutationAuthorized is hardcoded false',
  };
}

function openMutationChannel(context) {
  const evaluation = evaluateAuthorizationContract(context && context.authorizationContract);
  if (!evaluation.authorized) {
    throw new BarrierViolation(
      'Mutation channel refused before any write-capable client was constructed: ' + evaluation.reason,
      'AUTHORIZATION_CONTRACT_UNSATISFIABLE'
    );
  }
  throw new BarrierViolation('Unreachable: SPEC 07F build has no production mutation implementation.', 'NO_IMPLEMENTATION');
}

function assertOperationAllowed() {
  throw new BarrierViolation(
    'Every operation is blocked in SPEC 07F: mutationAuthorized is false and no production write path exists in this build.',
    'OPERATION_BLOCKED'
  );
}

module.exports = {
  BarrierViolation, IntegrityViolation,
  WRITE_REQUEST_FLAGS, WRITE_ENV_NAMES,
  scanArgs, scanEnv, resolveMode,
  isWriteAuthorized, evaluateAuthorizationContract,
  openMutationChannel, assertOperationAllowed,
};
