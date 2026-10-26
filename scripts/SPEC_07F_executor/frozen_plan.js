'use strict';

const cfg = require('./config');
const G = require('./guard');
const IO = require('./io');

const INPUT_KEYS = Object.keys(cfg.INPUTS);

function collectInputs() {
  const out = {};
  for (const k of INPUT_KEYS) out[k] = IO.fingerprintOf(cfg.INPUTS[k]);
  return out;
}

function fingerprintListMatches(entries) {
  let ok = 0;
  const bad = [];
  for (const e of entries) {
    const file = IO.normalizePath(e.file);
    const fp = IO.fingerprintOf(file);
    if (fp.exists && fp.sha256 === e.sha256 && fp.bytes === e.bytes) ok += 1;
    else bad.push(file + ' expected=' + e.sha256 + ' actual=' + (fp.sha256 || 'missing'));
  }
  return { ok: ok, total: entries.length, bad: bad };
}

function check(id, label, pass, detail) {
  return { id: id, label: label, pass: !!pass, detail: String(detail) };
}

function loadAll() {
  const data = {};
  const missing = [];
  for (const k of INPUT_KEYS) {
    const file = cfg.INPUTS[k];
    if (!IO.fileExists(file)) { missing.push(file); continue; }
    try {
      if (file.endsWith('.csv')) data[k] = IO.readCsv(file);
      else if (file.endsWith('.json')) data[k] = IO.readJson(file);
      else data[k] = IO.readText(file);
    } catch (e) {
      missing.push(file + ' (parse error: ' + e.message + ')');
    }
  }
  return { data: data, missing: missing };
}

function buildOperations(planRows) {
  const sourceHashCache = {};
  const sourceSha = (file) => {
    if (sourceHashCache[file] === undefined) {
      sourceHashCache[file] = IO.fileExists(file) ? IO.shaFile(file) : null;
    }
    return sourceHashCache[file];
  };
  return planRows.map((r, i) => ({
    sequence: i + 1,
    operationId: r.proposalId + '#' + r.fieldPath,
    proposalId: r.proposalId,
    recordId: r.recordId,
    recordType: r.recordType,
    title: r.title,
    fieldPath: r.fieldPath,
    frozenProposedValue: r.frozenProposedValue,
    expectedRevision: r.expectedRevision,
    sourceArtifact: r.sourceArtifact,
    sourceSha256: sourceSha(r.sourceArtifact),
    dryRunStatus: 'PLANNED_DRY_RUN',
    mutationAuthorized: false,
    planRowSha256: IO.sha256Text(cfg.PLAN_HEADER.map((c) => (r[c] === undefined ? '' : r[c])).join(String.fromCharCode(1))),
  }));
}

function runIntegrity() {
  const inputs = collectInputs();
  const { data, missing } = loadAll();
  const checks = [];

  checks.push(check('I-01',
    'All frozen SPEC 07C/07D/07E/SPEC 07 input artifacts exist and parse',
    missing.length === 0 && INPUT_KEYS.every((k) => data[k]),
    'inputs=' + INPUT_KEYS.length + ' missing=' + (missing.length ? missing.join(';') : '0')));

  const dManifest = data.dManifest || {};
  const mEntries = Array.isArray(dManifest.inputs) ? dManifest.inputs : [];
  const mRes = fingerprintListMatches(mEntries);
  checks.push(check('I-02',
    'SPEC 07D SOURCE_MANIFEST input hashes match current bytes (no frozen input drift)',
    mRes.total === 16 && mRes.bad.length === 0,
    'checked=' + mRes.total + ' mismatched=' + (mRes.bad.length ? mRes.bad.slice(0, 3).join(';') : '0')));

  const dVal = data.dValidation || {};
  const dFp = Array.isArray(dVal.artifactFingerprints) ? dVal.artifactFingerprints : [];
  const dFpRes = fingerprintListMatches(dFp);
  checks.push(check('I-03',
    'SPEC 07D VALIDATION artifact fingerprints match current bytes (8 prepare artifacts)',
    dFp.length === 8 && dFpRes.bad.length === 0,
    'checked=' + dFp.length + ' mismatched=' + (dFpRes.bad.length ? dFpRes.bad.slice(0, 3).join(';') : '0')));

  const cVal = data.cValidation || {};
  const cFp = (Array.isArray(cVal.artifactFingerprints) ? cVal.artifactFingerprints : [])
    .map((e) => ({ file: 'report/SPEC_07C/' + e.file, sha256: e.sha256, bytes: e.bytes }));
  const cFpRes = fingerprintListMatches(cFp);
  checks.push(check('I-04',
    'SPEC 07C VALIDATION artifact fingerprints match current bytes (16 reconciliation artifacts)',
    cFp.length === 16 && cFpRes.bad.length === 0,
    'checked=' + cFp.length + ' mismatched=' + (cFpRes.bad.length ? cFpRes.bad.slice(0, 3).join(';') : '0')));

  const eReview = data.eReview || {};
  const eFp = Array.isArray(eReview.artifactFingerprints) ? eReview.artifactFingerprints : [];
  const eFpRes = fingerprintListMatches(eFp);
  checks.push(check('I-05',
    'SPEC 07E PRE_WRITE_SAFETY_REVIEW artifact fingerprints match current bytes (7 authorization-package artifacts)',
    eFp.length === 7 && eFpRes.bad.length === 0,
    'checked=' + eFp.length + ' mismatched=' + (eFpRes.bad.length ? eFpRes.bad.slice(0, 3).join(';') : '0')));

  const planRows = data.dPlan || [];
  const headerOk = planRows.length > 0 && Object.keys(planRows[0]).length === cfg.PLAN_HEADER.length &&
    cfg.PLAN_HEADER.every((c) => Object.prototype.hasOwnProperty.call(planRows[0], c));
  checks.push(check('I-06',
    'Frozen SPEC 07D field mutation plan structure: exactly 17 declared columns and exactly 234 operation rows',
    headerOk && planRows.length === cfg.BASELINE.operations,
    'rows=' + planRows.length + ' headerOk=' + headerOk));

  const ids = planRows.map((r) => r.recordId);
  const uniqueIds = Array.from(new Set(ids));
  const typeOk = planRows.every((r) => r.recordType === cfg.TARGET_TYPE);
  const eligibleOk = planRows.every((r) => r.eligibilityStatus === 'ELIGIBLE' && !r.blockReason);
  checks.push(check('I-07',
    'Exactly 117 unique frozen target documents, all recordType=species, all ELIGIBLE with no block reason',
    uniqueIds.length === cfg.BASELINE.targets && ids.length === planRows.length && typeOk && eligibleOk,
    'unique=' + uniqueIds.length + ' rows=' + planRows.length + ' typeOk=' + typeOk + ' eligibleOk=' + eligibleOk));

  const perTarget = {};
  for (const r of planRows) {
    if (!perTarget[r.recordId]) perTarget[r.recordId] = [];
    perTarget[r.recordId].push(r.fieldPath);
  }
  const allowlistOk = planRows.every((r) => cfg.ALLOWED_FIELDS.indexOf(r.fieldPath) >= 0);
  const perTargetOk = Object.keys(perTarget).length === cfg.BASELINE.targets &&
    Object.keys(perTarget).every((k) => perTarget[k].length === 2 &&
      cfg.ALLOWED_FIELDS.every((f) => perTarget[k].indexOf(f) >= 0));
  const perField = { title: 0, description: 0 };
  for (const r of planRows) {
    if (r.fieldPath === cfg.FIELD_TITLE) perField.title += 1;
    else if (r.fieldPath === cfg.FIELD_DESCRIPTION) perField.description += 1;
  }
  checks.push(check('I-08',
    'Exactly two allowed operations per target and only the two allowlisted nested seo field paths',
    allowlistOk && perTargetOk && perField.title === 117 && perField.description === 117,
    'allowlistOk=' + allowlistOk + ' perTargetOk=' + perTargetOk + ' title=' + perField.title + ' description=' + perField.description));

  const operations = buildOperations(planRows);
  const opIds = operations.map((o) => o.operationId);
  const dupOpIds = opIds.length - new Set(opIds).size;
  const pairs = planRows.map((r) => r.recordId + '|' + r.fieldPath);
  const dupPairs = pairs.length - new Set(pairs).size;
  checks.push(check('I-09',
    'No duplicate operation IDs and no duplicate target-field pairs',
    dupOpIds === 0 && dupPairs === 0 && opIds.length === cfg.BASELINE.operations,
    'ops=' + opIds.length + ' dupOpIds=' + dupOpIds + ' dupPairs=' + dupPairs));

  const finalById = {};
  for (const r of ((data.cFinal || {}).records || [])) finalById[r.recordId] = r;
  let finalMatch = 0;
  const finalBad = [];
  for (const r of planRows) {
    const f = finalById[r.recordId];
    const want = r.fieldPath === cfg.FIELD_TITLE ? (f && f.proposedMetaTitle) : (f && f.proposedMetaDescription);
    if (f && want === r.frozenProposedValue && f.finalStatus === 'FINAL_MUTATION_READY') finalMatch += 1;
    else finalBad.push(r.recordId + '|' + r.fieldPath);
  }
  checks.push(check('I-10',
    'Every frozen value is byte-identical to the SPEC 07C FINAL approved target value and the record is FINAL_MUTATION_READY',
    finalMatch === cfg.BASELINE.operations && finalBad.length === 0,
    'match=' + finalMatch + '/' + cfg.BASELINE.operations + ' bad=' + (finalBad.length ? finalBad.slice(0, 3).join(';') : '0')));

  const freezeById = {};
  for (const r of ((data.cFreeze || {}).records || [])) freezeById[r.recordId] = r;
  let freezeMatch = 0;
  const freezeBad = [];
  for (const r of planRows) {
    const z = freezeById[r.recordId];
    const want = r.fieldPath === cfg.FIELD_TITLE ? (z && z.approvedTargetMetaTitle) : (z && z.approvedTargetMetaDescription);
    const clean = z && z.revisionDrift === false && z.contentDrift === false && z.recomputeMatch === true && z.seoObjectAbsent === true;
    if (z && want === r.frozenProposedValue && clean) freezeMatch += 1;
    else freezeBad.push(r.recordId + '|' + r.fieldPath);
  }
  checks.push(check('I-11',
    'Every frozen value is byte-identical to the SPEC 07C revision-freeze approved target value with clean freeze flags',
    freezeMatch === cfg.BASELINE.operations && freezeBad.length === 0,
    'match=' + freezeMatch + '/' + cfg.BASELINE.operations + ' bad=' + (freezeBad.length ? freezeBad.slice(0, 3).join(';') : '0')));

  const p07 = {};
  for (const r of ((data.plan07 || {}).rows || [])) p07[r.recordId] = r;
  let p07Match = 0;
  const p07Bad = [];
  for (const r of planRows) {
    const p = p07[r.recordId];
    const want = r.fieldPath === cfg.FIELD_TITLE ? (p && p.proposedMetaTitle) : (p && p.proposedMetaDescription);
    if (p && want === r.frozenProposedValue) p07Match += 1;
    else p07Bad.push(r.recordId + '|' + r.fieldPath);
  }
  checks.push(check('I-12',
    'Every frozen value is byte-identical to the SPEC 07 proposal plan value (triple provenance equality 07 = 07C = 07D)',
    p07Match === cfg.BASELINE.operations && p07Bad.length === 0,
    'match=' + p07Match + '/' + cfg.BASELINE.operations + ' bad=' + (p07Bad.length ? p07Bad.slice(0, 3).join(';') : '0')));

  let revMatch = 0;
  const revBad = [];
  for (const id of uniqueIds) {
    const z = freezeById[id];
    const planRow = planRows.filter((x) => x.recordId === id)[0];
    if (z && planRow && z.expectedRev === planRow.expectedRevision && planRow.expectedRevision) revMatch += 1;
    else revBad.push(id);
  }
  const freezeCounts = (data.cFreeze || {}).counts || {};
  checks.push(check('I-13',
    'Every operation carries the frozen expectedRevision from SPEC 07C REVISION_FREEZE with zero recorded drift',
    revMatch === cfg.BASELINE.targets && freezeCounts.revisionDrift === 0 && freezeCounts.contentDrift === 0 &&
    freezeCounts.recomputeMismatch === 0 && freezeCounts.frozen === cfg.BASELINE.targets,
    'revMatch=' + revMatch + '/' + cfg.BASELINE.targets + ' freezeCounts=' + JSON.stringify(freezeCounts)));

  const recon = data.dRecon || [];
  const reconIds = recon.map((r) => r.recordId);
  const reconSetOk = recon.length === cfg.BASELINE.targets &&
    reconIds.slice().sort().join(',') === uniqueIds.slice().sort().join(',');
  let reconRevOk = 0;
  for (const r of recon) {
    const planRow = planRows.filter((x) => x.recordId === r.recordId)[0];
    if (planRow && planRow.expectedRevision === r.expectedRevision && r.eligibilityStatus === 'ELIGIBLE') reconRevOk += 1;
  }
  checks.push(check('I-14',
    'SPEC 07D target reconciliation agrees with the executable plan: same 117 targets, same expected revisions, all ELIGIBLE',
    reconSetOk && reconRevOk === cfg.BASELINE.targets,
    'reconRows=' + recon.length + ' idsAgree=' + reconSetOk + ' revAgree=' + reconRevOk));

  const eRows = data.eConcurrency || [];
  const eKeys = eRows.map((r) => [r.operationId, r.recordId, r.fieldPath, r.expectedRevision].join('|'));
  const opKeys = operations.map((o) => [o.operationId, o.recordId, o.fieldPath, o.expectedRevision].join('|'));
  const eAgree = eKeys.length === opKeys.length && eKeys.every((k, i) => k === opKeys[i]);
  const allowText = IO.fileExists(cfg.INPUTS.eAllowlist) ? IO.readText(cfg.INPUTS.eAllowlist) : '';
  const allowOk = allowText.indexOf('| `seo.metaTitle` | 117 |') >= 0 &&
    allowText.indexOf('| `seo.metaDescription` | 117 |') >= 0 &&
    allowText.indexOf('Total: 234 field-level operations across 117 species documents') >= 0;
  checks.push(check('I-15',
    'SPEC 07E concurrency review and mutation allowlist agree with the frozen plan byte-for-byte on operation IDs, targets, field paths and revisions',
    eAgree && allowOk && eRows.length === cfg.BASELINE.operations,
    'eRows=' + eRows.length + ' orderedAgree=' + eAgree + ' allowlistDeclaredCounts=' + allowOk));

  const excluded = ((data.cExcluded || {}).records || []);
  const excludedIds = excluded.map((r) => r.recordId);
  const excludedAbsent = excludedIds.every((id) => ids.indexOf(id) < 0);
  const reasonOk = excluded.length === cfg.BASELINE.excluded &&
    excluded.every((r) => String(r.finalStatus || '').indexOf('EXCLUDED_') === 0 && r.exclusionStatus);
  checks.push(check('I-16',
    'The 3 excluded HIGH candidates are absent from the executable plan and retain their exact SPEC 07C exclusion reason codes',
    excludedAbsent && reasonOk,
    'excluded=' + excluded.length + ' absent=' + excludedAbsent + ' reasons=' +
    excluded.map((r) => r.recordId + ':' + r.finalStatus).join(',')));

  const rows07 = (data.plan07 || {}).rows || [];
  const mediumIds = rows07.filter((r) => r.confidence === 'MEDIUM').map((r) => r.recordId);
  const blockedIds = rows07.filter((r) => r.confidence === 'BLOCKED').map((r) => r.recordId);
  const heldAbsent = mediumIds.concat(blockedIds).every((id) => ids.indexOf(id) < 0);
  checks.push(check('I-17',
    'All 85 MEDIUM and 13 BLOCKED candidates are absent from the executable plan',
    mediumIds.length === cfg.BASELINE.medium && blockedIds.length === cfg.BASELINE.blocked && heldAbsent,
    'medium=' + mediumIds.length + ' blocked=' + blockedIds.length + ' absentFromPlan=' + heldAbsent));

  const cCounts = {
    originalHigh: (data.cFinal || {}).originalHighCount,
    ready: (data.cFinal || {}).finalMutationReadyCount,
    excluded: (data.cFinal || {}).excludedCount,
  };
  const countsOk = cCounts.originalHigh === 120 && cCounts.ready === 117 && cCounts.excluded === 3 &&
    planRows.length === 234 && uniqueIds.length === 117;
  checks.push(check('I-18',
    'Canonical baseline counts reconcile: 120 original HIGH = 117 frozen targets + 3 excluded; 234 operations = 117 x 2',
    countsOk,
    'originalHigh=' + cCounts.originalHigh + ' ready=' + cCounts.ready + ' excluded=' + cCounts.excluded +
    ' planRows=' + planRows.length + ' targets=' + uniqueIds.length));

  const snapshotHash = ((data.dSnapshot || {}).canonicalHash);
  const dValHash = ((dVal.safety || {}).canonicalHash);
  const eHash = ((eReview.safety || {}).canonicalHash);
  const freezeHash = (((data.cFreeze || {}).baseline || {}).canonicalHash);
  const hashOk = snapshotHash === cfg.IDENTITY_HASH && dValHash === cfg.IDENTITY_HASH &&
    eHash === cfg.IDENTITY_HASH && freezeHash === cfg.IDENTITY_HASH;
  checks.push(check('I-19',
    'Canonical identity hash c6e358d5...67aeda is unchanged in the SPEC 07D snapshot, the SPEC 07D and SPEC 07E validations and the SPEC 07C freeze baseline',
    hashOk,
    'snapshot=' + String(snapshotHash).slice(0, 12) + ' dVal=' + String(dValHash).slice(0, 12) +
    ' eReview=' + String(eHash).slice(0, 12) + ' freeze=' + String(freezeHash).slice(0, 12)));

  const boundsOk = planRows.every((r) => {
    if (r.valueValidationStatus !== 'VALID' || r.revisionStatus !== 'MATCH') return false;
    const v = r.frozenProposedValue || '';
    if (!v.trim()) return false;
    const b = r.fieldPath === cfg.FIELD_TITLE ? cfg.TITLE_LENGTH : cfg.DESCRIPTION_LENGTH;
    return v.length >= b.min && v.length <= b.max;
  });
  const preconditionOk = planRows.every((r) => r.futureWritePrecondition && r.futureWritePrecondition.indexOf('GATE C') >= 0);
  checks.push(check('I-20',
    'Every operation value is VALID, revision status MATCH, inside its declared length bounds and gated by the SPEC 07D GATE C precondition',
    boundsOk && preconditionOk,
    'boundsOk=' + boundsOk + ' preconditionOk=' + preconditionOk));

  const priorVerdictsOk = dVal.verdict === 'PASS' && dVal.passed === 29 && dVal.total === 29 &&
    dVal.state === cfg.STATE && dVal.mutationAuthorized === false &&
    cVal.verdict === 'PASS' && cVal.passed === 61 && cVal.total === 61 && cVal.mutationAuthorized === false &&
    eReview.verdict === 'PASS - READY FOR PM REVIEW' && eReview.passed === 50 && eReview.total === 50 &&
    eReview.state === cfg.STATE && eReview.mutationAuthorized === false;
  checks.push(check('I-21',
    'Prior phase verdicts intact: SPEC 07C 61/61 PASS, SPEC 07D 29/29 PASS, SPEC 07E 50/50 PASS, all state PENDING_PM_REVIEW with mutationAuthorized false',
    priorVerdictsOk,
    '07C=' + cVal.passed + '/' + cVal.total + ' 07D=' + dVal.passed + '/' + dVal.total + ' 07E=' + eReview.passed + '/' + eReview.total));

  const passed = checks.filter((c) => c.pass).length;
  const failed = checks.length - passed;
  const report = {
    spec: cfg.SPEC,
    phase: 'FROZEN_INPUT_INTEGRITY',
    mode: cfg.MODE,
    state: cfg.STATE,
    mutationAuthorized: cfg.mutationAuthorized,
    generatedAt: IO.nowIso(),
    baseline: cfg.BASELINE,
    inputs: INPUT_KEYS.map((k) => inputs[k]),
    checks: checks,
    passed: passed,
    failed: failed,
    total: checks.length,
    verdict: failed === 0 ? 'PASS' : 'FAIL',
    violations: checks.filter((c) => !c.pass).map((c) => c.id + ': ' + c.label + ' [' + c.detail + ']'),
    planSummary: {
      rows: planRows.length,
      targets: uniqueIds.length,
      operations: operations.length,
      perField: perField,
    },
  };
  return { report: report, planRows: planRows, operations: operations, data: data, perTarget: perTarget };
}

function loadFrozenPlan() {
  const result = runIntegrity();
  if (result.report.verdict !== 'PASS') {
    throw new G.IntegrityViolation('Frozen input integrity failed: ' + result.report.violations.join(' | '), result.report.violations);
  }
  return result;
}

module.exports = { collectInputs, runIntegrity, loadFrozenPlan, buildOperations, fingerprintListMatches };
