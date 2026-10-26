'use strict';

const cfg = require('./config');
const SG = require('./scope_gate');
const PIPE = require('./pipeline');

const HELP = [
  'SPEC 07G executor - approved production SEO metadata apply',
  '',
  'usage: node scripts/SPEC_07G_execute/cli.js <command> [options]',
  '',
  'commands:',
  '  validate   verify frozen plan integrity and scope lock (read-only, no live calls)',
  '  preflight  validate, then run the fresh read-only live preflight and write PRE_WRITE_STATE.json',
  '  execute    validate, preflight, perform the approved conditional writes, verify and report',
  '  help       show this message',
  '',
  'options:',
  '  --out <dir>     primary output directory (default ' + cfg.OUT_DIR + ')',
  '  --mirror <dir>  mirror output directory (default ' + cfg.MIRROR_OUT_DIR + ')',
  '  --help          show this message',
  '',
  'approved scope: project ' + cfg.PROJECT_ID + ', dataset ' + cfg.DATASET + ', apiVersion ' + cfg.API_VERSION +
    ', type ' + cfg.TARGET_TYPE + ', ' + cfg.BASELINE.targets + ' frozen targets, ' + cfg.BASELINE.operations +
    ' operations, fields ' + cfg.ALLOWED_FIELDS.join(' and ') + '.',
  'frozen plan: ' + cfg.FROZEN_PLAN_CSV + ' sha256 ' + cfg.FROZEN_PLAN_SHA256 + '.',
  'anything outside that scope is refused: missing or unknown commands, unknown arguments,',
  'scope-narrowing or force arguments, environment variables and any plan whose bytes or counts differ.',
].join('\n');

function print(lines) {
  for (const l of [].concat(lines)) console.log(l);
}

function summaryFor(result) {
  if (result.command === 'validate') {
    return [
      'SPEC 07G validate',
      'INTEGRITY: ' + result.integrity.passed + '/' + result.integrity.total + ' ' + result.integrity.verdict,
      'PLAN: ' + cfg.BASELINE.targets + ' targets, ' + cfg.BASELINE.operations + ' operations, sha256=' + result.planSha256,
      'ALLOWLIST: ' + result.allowlist.allowedFields.join(', '),
      'PRODUCTION MUTATION CALLS: 0',
      'COMMAND: validate (read-only, no live calls)',
    ];
  }
  if (result.command === 'preflight') {
    return [
      'SPEC 07G preflight',
      'INTEGRITY: ' + result.integrity.passed + '/' + result.integrity.total + ' ' + result.integrity.verdict,
      'PLAN: sha256=' + result.planSha256,
      'LIVE READ: species=' + result.snapshot.speciesCount + ' wiki=' + result.snapshot.wikiTotal + ' drafts=' + result.snapshot.counts.drafts,
      'CLASSIFICATION: ' + JSON.stringify(result.preflight.stateCounts),
      'OPERATIONS: ' + JSON.stringify(result.preflight.opStateCounts),
      'WRITE PLAN: ' + result.preflight.toWriteTargets + ' targets ready, ' + result.preflight.alreadyMatchedTargets +
        ' already matched, ' + result.preflight.conflictTargets + ' conflicted, ' + result.preflight.blockedTargets + ' blocked',
      'PRODUCTION MUTATION CALLS: 0',
      'ARTIFACT: ' + cfg.OUT_DIR + '/PRE_WRITE_STATE.json',
    ];
  }
  const counts = result.counts;
  return [
    'SPEC 07G execute',
    'INTEGRITY: ' + result.integrity.passed + '/' + result.integrity.total + ' ' + result.integrity.verdict,
    'PLAN: sha256=' + result.planSha256,
    'PREFLIGHT: ' + JSON.stringify(result.preflight.stateCounts),
    'MUTATION API CALLS: ' + result.mutationCalls,
    'DOCUMENTS WRITTEN: ' + result.summary.documentsWritten + ' / FIELD UPDATES WRITTEN: ' + result.summary.fieldsWritten,
    'OUTCOMES: ' + cfg.OP_STATUSES.map((s) => s + '=' + (counts[s] || 0)).join(' '),
    'VERIFICATION: ' + result.verification.verdict + ' (' + result.verification.values.verifiedPresent + '/' +
      result.verification.values.expectedPresent + ' values verified, non-target changes=' +
      result.verification.scope.nonTargetDocumentsChangedCount + ')',
    'REGRESSIONS: ' + result.regressions.summary.verdict + ' (' + result.regressions.summary.passed + '/' + result.regressions.summary.attempted + ')',
    'GIT TRACKED MODIFIED: ' + result.regressions.git.trackedModifiedCount,
    'ARTIFACTS: ' + cfg.OUT_DIR + '/ (' + cfg.ARTIFACTS.length + ' deliverables), mirror ' + result.mirrorDir + '/',
    'STATUS: ' + result.status.statusLine,
  ];
}

async function main(argv, env) {
  const opts = SG.parseArgs(argv);
  if (opts.help || opts.command === 'help') {
    console.log(HELP);
    return cfg.EXIT.ok;
  }

  let result;
  try {
    result = await PIPE.run({ opts: opts, env: env || process.env, outDir: opts.out, mirrorDir: opts.mirror });
  } catch (e) {
    if (e instanceof SG.ScopeViolation) {
      print(['SCOPE: SPEC 07G scope gate refused the request', 'REASONS: ' + e.reasons.join('; ')]);
      return cfg.EXIT.scope;
    }
    console.error('EXECUTION ERROR: ' + (e && e.stack ? e.stack : e));
    return cfg.EXIT.error;
  }

  if (result.scopeFailure) {
    print(['SCOPE: SPEC 07G scope gate refused the request', 'REASONS: ' + result.scopeFailure.reasons.join('; ')]);
    if (result.scopeFailure.ignoredEnvAuth && result.scopeFailure.ignoredEnvAuth.length) {
      print(['IGNORED ENVIRONMENT AUTHORIZATION ATTEMPTS: ' + result.scopeFailure.ignoredEnvAuth.join(', ') + ' (never grants scope)']);
    }
    print(['Run with --help for the approved command surface.']);
    return cfg.EXIT.scope;
  }
  if (result.planFailure) {
    print(['INTEGRITY: frozen plan verification failed - no production write attempted']);
    for (const r of result.planFailure.reasons) print(['  ' + r]);
    return cfg.EXIT.integrity;
  }

  print(summaryFor(result));
  if (result.command !== 'validate') print(['Final state: ' + cfg.STATE]);
  return result.exitCode;
}

module.exports = { main, HELP, summaryFor };

if (require.main === module) {
  main(process.argv.slice(2), process.env)
    .then((code) => { process.exitCode = code; })
    .catch((e) => {
      console.error('EXECUTION ERROR: ' + (e && e.stack ? e.stack : e));
      process.exitCode = cfg.EXIT.error;
    });
}
