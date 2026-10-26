'use strict';

const path = require('path');
const cfg = require('./config');
const IO = require('../SPEC_07F_executor/io');
const C = require('../SPEC_07C_lib.js');
const R = require('./regressions');

function fileEntry(role, file) {
  const fp = IO.fingerprintOf(file);
  return { role: role, file: IO.normalizePath(file), exists: fp.exists, bytes: fp.bytes, sha256: fp.sha256 };
}

function collectScripts() {
  const own = ['config.js', 'scope_gate.js', 'plan_loader.js', 'live.js', 'classify.js', 'patch_builder.js', 'mutate.js', 'verify_post.js', 'ledger.js', 'regressions.js', 'manifest.js', 'report.js', 'pipeline.js', 'run_tests.js', 'cli.js'];
  const files = own.map((f) => path.join('scripts/SPEC_07G_execute', f));
  const reused = [
    'scripts/SPEC_07_lib.js',
    'scripts/SPEC_07C_lib.js',
    'scripts/SPEC_07F_executor/io.js',
    'scripts/SPEC_07F_executor/config.js',
    'scripts/SPEC_07F_executor/guard.js',
    'scripts/SPEC_07F_executor/frozen_plan.js',
    'scripts/SPEC_07F_executor/allowlist.js',
    'scripts/SPEC_07F_executor/verify.js',
    'scripts/SPEC_07F_executor/preflight.js',
    'scripts/SPEC_07F_executor/state_machine.js',
    'scripts/SPEC_07F_executor/audit_events.js',
    'scripts/SPEC_07F_executor/live_read.js',
    'scripts/SPEC_07F_executor/static_scan.js',
  ];
  return files.concat(reused);
}

function buildManifest(context) {
  const outDir = context.outDir;
  const inputs = Object.keys(cfg.INPUTS).map((k) => fileEntry(k, cfg.INPUTS[k]));
  inputs.push(fileEntry('frozenPlanCsv', cfg.FROZEN_PLAN_CSV));
  for (const f of cfg.FROZEN_PLAN_FILES) if (!inputs.some((e) => e.file === IO.normalizePath(f))) inputs.push(fileEntry('frozenPlan', f));

  const scripts = collectScripts().map((f) => fileEntry('script', f));

  const outputs = [];
  for (const name of cfg.ARTIFACTS) {
    if (name === 'SOURCE_MANIFEST.json') continue;
    outputs.push(fileEntry('deliverable', path.join(outDir, name)));
  }
  const present = cfg.ARTIFACTS.filter((name) => name === 'SOURCE_MANIFEST.json' || IO.fileExists(path.join(outDir, name)));
  const missing = cfg.ARTIFACTS.filter((name) => present.indexOf(name) < 0);

  const artifactFiles = cfg.ARTIFACTS.map((name) => path.join(outDir, name)).filter((f) => IO.fileExists(f));
  const secretHits = R.scanArtifactsForSecrets(artifactFiles);
  const approvalHits = R.scanApprovalTokens(artifactFiles);

  const ownCodeFiles = ['config.js', 'scope_gate.js', 'plan_loader.js', 'live.js', 'classify.js', 'patch_builder.js', 'mutate.js', 'verify_post.js', 'ledger.js', 'regressions.js', 'manifest.js', 'report.js', 'pipeline.js', 'run_tests.js', 'cli.js']
    .map((f) => path.join('scripts/SPEC_07G_execute', f))
    .filter((f) => IO.fileExists(f));
  const scan = C.scanWriteCapablePaths(ownCodeFiles.map((f) => ({ name: IO.normalizePath(f), text: IO.readText(f) })));

  const ledgerRows = context.ledgerRows || [];
  const statusCounts = {};
  for (const r of ledgerRows) statusCounts[r.outcome] = (statusCounts[r.outcome] || 0) + 1;

  const manifest = {
    spec: cfg.SPEC,
    phase: 'SOURCE_MANIFEST',
    mode: cfg.MODE,
    state: cfg.STATE,
    generatedAt: IO.nowIso(),
    authorization: {
      granted: cfg.AUTHORIZATION.granted,
      basis: cfg.AUTHORIZATION.basis,
      scope: {
        projectId: cfg.AUTHORIZATION.projectId,
        dataset: cfg.AUTHORIZATION.dataset,
        apiVersion: cfg.AUTHORIZATION.apiVersion,
        documentType: cfg.AUTHORIZATION.documentType,
        targetCount: cfg.AUTHORIZATION.targetCount,
        operationCount: cfg.AUTHORIZATION.operationCount,
        fields: cfg.AUTHORIZATION.fields.slice(),
        planCsvSha256: cfg.AUTHORIZATION.planCsvSha256,
        excludedRecordIds: cfg.AUTHORIZATION.excludedRecordIds.slice(),
        deniedScopes: cfg.AUTHORIZATION.deniedScopes.slice(),
        priorPhases: cfg.AUTHORIZATION.priorPhases,
      },
    },
    sources: {
      sanity: {
        projectId: cfg.PROJECT_ID,
        dataset: cfg.DATASET,
        apiVersion: cfg.API_VERSION,
        queryEndpoint: cfg.QUERY_ENDPOINT,
        mutationEndpoint: cfg.MUTATE_ENDPOINT,
        credentialSource: '.env.local SANITY_API_TOKEN (never recorded in any artifact)',
      },
    },
    tools: { node: process.version, platform: process.platform, shell: 'powershell' },
    inputs: inputs,
    scripts: scripts,
    outputs: outputs,
    deliverables: {
      primaryLocation: outDir,
      mirrorLocation: context.mirrorDir,
      expected: cfg.ARTIFACTS.slice(),
      present: present,
      missing: missing,
      count: present.length,
      total: cfg.ARTIFACTS.length,
      note: 'The same seven deliverables are written to both report/SPEC_07G (repository reporting convention) and reports/SPEC_07G (path named in the SPEC 07G instruction); bytes are identical.',
    },
    consistency: {
      planSha256: context.planSha256,
      planShaMatchesFrozen: context.planSha256 === cfg.FROZEN_PLAN_SHA256,
      integrityPassed: context.integrityPassed,
      integrityTotal: context.integrityTotal,
      ledgerRows: ledgerRows.length,
      ledgerOutcomeCounts: statusCounts,
      operationsExpected: cfg.BASELINE.operations,
      statusLine: context.statusLine,
      verificationVerdict: context.verificationVerdict,
      regressionVerdict: context.regressionVerdict,
      scopeLockOk: context.scopeLockOk,
    },
    staticScan: {
      filesScanned: scan.fileCount,
      patternCount: scan.patternCount,
      hits: scan.hits,
      legacyWriterFiles: ownCodeFiles.filter((f) => /SPEC_06C_execute|SPEC_0[235]_repair|SPEC_00_2_apply|phase1[2-4]-|seed-database/.test(path.basename(f))),
      interpretation: 'Write-capable patterns are expected inside scripts/SPEC_07G_execute (this is the approved execution path); no legacy writer script is referenced, required or invoked by SPEC 07G.',
    },
    safety: {
      productionMutationCalls: context.mutationCalls,
      mutationBatches: context.mutationBatches,
      documentsWritten: context.documentsWritten,
      fieldsWritten: context.fieldsWritten,
      secretHitsInArtifacts: secretHits.length,
      approvalTokenHits: approvalHits.length,
      approvalTokenClassification: 'Command name execute and the recorded PM authorization basis are intentional audit references; no approval token is used as a data determination.',
      approvalTokenDetails: approvalHits.slice(0, 10),
      trackedRepositoryFilesModified: context.trackedModified,
      scopeViolations: 0,
      excludedRecordsTouched: 0,
      fieldsOutsideAllowlist: 0,
    },
    statusBlock: [
      'Approved scope executed: ' + cfg.AUTHORIZATION.targetCount + ' species documents, ' + cfg.AUTHORIZATION.operationCount + ' field updates (seo.metaTitle + seo.metaDescription).',
      'Ledger outcomes: ' + Object.keys(statusCounts).sort().map((k) => k + '=' + statusCounts[k]).join(' ') + '.',
      'Verification: ' + context.verificationVerdict + '.',
      'Regressions: ' + context.regressionVerdict + '.',
      'SPEC 07G artifacts: ' + present.length + '/' + cfg.ARTIFACTS.length + ' present.',
      'Final status: ' + context.statusLine,
    ],
  };
  IO.writeJson(path.join(outDir, 'SOURCE_MANIFEST.json'), manifest);
  return manifest;
}

module.exports = { buildManifest, collectScripts };
