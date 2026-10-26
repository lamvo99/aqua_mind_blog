'use strict';

const cfg = require('./config');
const V = require('../SPEC_07F_executor/verify');

const VOLATILE = Object.freeze(['_rev', '_updatedAt']);

function topLevelDiff(a, b, allowedPaths) {
  const allowedTop = {};
  for (const p of allowedPaths) allowedTop[String(p).split('.')[0]] = true;
  const keys = new Set(Object.keys(a || {}).concat(Object.keys(b || {})));
  const changed = [];
  for (const k of keys) {
    if (VOLATILE.indexOf(k) >= 0) continue;
    if (allowedTop[k]) continue;
    if (V.stableStringify(a[k]) !== V.stableStringify(b[k])) changed.push(k);
  }
  return changed.sort();
}

function seoSiblingDiff(a, b, allowedFields) {
  const seoA = a && a.seo && typeof a.seo === 'object' ? a.seo : {};
  const seoB = b && b.seo && typeof b.seo === 'object' ? b.seo : {};
  const keys = new Set(Object.keys(seoA).concat(Object.keys(seoB)));
  const changed = [];
  for (const k of keys) {
    const path = cfg.SEO_ROOT + '.' + k;
    if (allowedFields.indexOf(path) >= 0) continue;
    if (V.stableStringify(seoA[k]) !== V.stableStringify(seoB[k])) changed.push(path);
  }
  return changed.sort();
}

function verifyDocument(args) {
  const targetId = args.targetId;
  const preDoc = args.preDoc;
  const postDoc = args.postDoc;
  const operations = args.operations;
  const record = args.record;
  const opResults = args.opResults;
  const checks = [];
  const observations = [];
  const add = (id, label, pass, detail) => checks.push({ id: id, label: label, pass: !!pass, detail: String(detail) });

  const changedByUs = record.state === 'APPLIED';
  const attempted = record.attempts > 0;

  if (!postDoc) {
    add('P-01', 'target re-read resolves to a document after execution', false, 'document missing');
    return { targetId: targetId, written: changedByUs, attempted: attempted, status: 'REVIEW_REQUIRED', checks: checks, observations: observations, opResults: opResults, revBefore: preDoc ? preDoc._rev : null, revAfter: null, recordState: record.state, recordReason: record.reason };
  }
  add('P-01', 'target re-read resolves to a document after execution', true, 'read ok');

  add('P-02', 'identity preserved: _id, _type, slug and name are byte-identical to the pre-write document',
    preDoc && postDoc._id === preDoc._id && postDoc._type === preDoc._type &&
    V.stableStringify(postDoc.slug) === V.stableStringify(preDoc.slug) &&
    V.stableStringify(postDoc.name) === V.stableStringify(preDoc.name),
    '_id=' + postDoc._id + ' _type=' + postDoc._type);

  const unrelated = preDoc ? topLevelDiff(preDoc, postDoc, cfg.ALLOWED_FIELDS) : ['no-pre-doc'];
  add('P-03', 'no unrelated top-level field was added, removed or modified', unrelated.length === 0, 'changed=' + unrelated.join(','));

  const seoSiblings = preDoc ? seoSiblingDiff(preDoc, postDoc, cfg.ALLOWED_FIELDS) : ['no-pre-doc'];
  add('P-04', 'sibling fields inside the seo object were preserved', seoSiblings.length === 0, 'changed=' + seoSiblings.join(','));

  const present = opResults.filter((r) => r.expectPresent && r.actual === r.expected);
  const missing = opResults.filter((r) => r.expectPresent && r.actual !== r.expected);
  add('P-05', 'every operation whose outcome is APPLIED or ALREADY_MATCHED reads back byte-identical to the frozen value',
    missing.length === 0, 'verified=' + present.length + ' missing=' + missing.map((m) => m.fieldPath).join(','));

  const notExpected = opResults.filter((r) => !r.expectPresent);
  add('P-06', 'operations recorded CONFLICT, FAILED, BLOCKED or NOT_ATTEMPTED are reported as not applied and are never silently replayed',
    notExpected.every((r) => ['CONFLICT', 'FAILED', 'BLOCKED', 'NOT_ATTEMPTED'].indexOf(r.outcome) >= 0),
    'notApplied=' + notExpected.length + ' outcomes=' + notExpected.map((r) => r.outcome + '@' + r.fieldPath).join(','));

  if (changedByUs) {
    const detailed = V.verifyAfterWrite({ originalDoc: preDoc, currentDoc: postDoc, operations: operations, targetId: targetId });
    add('P-07', 'written target passes the frozen SPEC 07F V-01..V-07 after-write verification contract',
      detailed.status === 'VERIFIED', detailed.status + ' failing=' + detailed.checks.filter((c) => !c.pass).map((c) => c.id).join(','));
    add('P-08', 'written target revision changed from the pre-write revision', postDoc._rev !== preDoc._rev, 'before=' + preDoc._rev + ' after=' + postDoc._rev);
  } else {
    add('P-07', 'target not written by this execution still satisfies the values required by its recorded outcome',
      missing.length === 0, 'expectedPresent=' + opResults.filter((r) => r.expectPresent).length);
    if (attempted) {
      add('P-08', 'write attempt that did not apply left no approved value partially applied',
        opResults.filter((r) => r.outcome === 'APPLIED').length === 0 || missing.length === 0,
        'attempts=' + record.attempts + ' rev before=' + preDoc._rev + ' after=' + postDoc._rev);
    } else if (postDoc._rev !== preDoc._rev) {
      observations.push('external-revision-change-on-untouched-document: ' + targetId + ' ' + preDoc._rev + '->' + postDoc._rev + ' (no write was attempted by this execution)');
      add('P-08', 'untouched target recorded no write attempt by this execution', true, 'revision changed by an external actor, recorded as observation');
    } else {
      add('P-08', 'untouched target revision is unchanged', true, 'before=' + preDoc._rev);
    }
  }

  const allChecksPass = checks.every((c) => c.pass);
  const valuesComplete = missing.length === 0;
  let status;
  if (!allChecksPass || missing.length > 0) status = 'REVIEW_REQUIRED';
  else if (changedByUs) status = 'VERIFIED_APPLIED';
  else if (record.state === 'ALREADY_MATCHED') status = 'VERIFIED_ALREADY_MATCHED';
  else status = 'NOT_APPLIED_CONFIRMED';

  return {
    targetId: targetId,
    written: changedByUs,
    attempted: attempted,
    status: status,
    checks: checks,
    observations: observations,
    opResults: opResults,
    revBefore: preDoc ? preDoc._rev : null,
    revAfter: postDoc._rev,
    recordState: record.state,
    recordReason: record.reason,
    valuesComplete: valuesComplete,
  };
}

function buildVerification(args) {
  const operations = args.operations;
  const order = args.order;
  const groups = args.groups;
  const preDocs = args.preDocs;
  const postDocs = args.postDocs;
  const records = args.records;
  const preCounts = args.preCounts;
  const postCounts = args.postCounts;
  const preRevs = args.preRevs;
  const postRevs = args.postRevs;

  const documents = [];
  const problems = [];
  const observations = [];

  for (const targetId of order) {
    const ops = groups[targetId];
    const record = records[targetId] || { state: 'NOT_ATTEMPTED', attempts: 0, reason: 'no-execution-record', opOutcomes: [] };
    const preDoc = preDocs[targetId] || null;
    const postDoc = postDocs[targetId] || null;
    const opResults = ops.map((op) => {
      const rec = record.opOutcomes.filter((r) => r.operationId === op.operationId)[0];
      const actual = postDoc ? V.readPath(postDoc, op.fieldPath) : null;
      const outcome = rec ? rec.outcome : 'NOT_ATTEMPTED';
      const expectPresent = outcome === 'APPLIED' || outcome === 'ALREADY_MATCHED';
      return {
        operationId: op.operationId,
        fieldPath: op.fieldPath,
        expected: op.frozenProposedValue,
        actual: actual,
        outcome: outcome,
        expectPresent: expectPresent,
        valueVerified: expectPresent && actual === op.frozenProposedValue,
        reason: rec ? rec.reason : 'no-execution-record',
      };
    });
    const result = verifyDocument({
      targetId: targetId,
      preDoc: preDoc,
      postDoc: postDoc,
      operations: ops,
      record: record,
      opResults: opResults,
    });
    documents.push(result);
    for (const o of result.observations) observations.push(o);
    if (result.status === 'REVIEW_REQUIRED') problems.push(targetId + ': verification review required');
    for (const c of result.checks) {
      if (!c.pass) problems.push(targetId + ': ' + c.id + ' ' + c.label + ' [' + c.detail + ']');
    }
  }

  const preRevById = {};
  for (const r of preRevs) preRevById[r._id] = r._rev;
  const postRevById = {};
  for (const r of postRevs) postRevById[r._id] = r._rev;
  const targetSet = {};
  for (const id of order) targetSet[id] = true;

  const nonTargetChanges = [];
  for (const id of Object.keys(preRevById)) {
    if (targetSet[id]) continue;
    if (preRevById[id] !== postRevById[id]) nonTargetChanges.push({ id: id, before: preRevById[id], after: postRevById[id] || null });
  }
  const missingPost = order.filter((id) => !postRevById[id]);
  const targetWrittenRevUnchanged = documents.filter((d) => d.written && d.revBefore === d.revAfter).map((d) => d.targetId);

  if (nonTargetChanges.length) problems.push('non-target documents changed revision: ' + nonTargetChanges.map((c) => c.id).join(','));
  if (missingPost.length) problems.push('target documents missing after execution: ' + missingPost.join(','));
  if (targetWrittenRevUnchanged.length) problems.push('written documents without a revision change: ' + targetWrittenRevUnchanged.join(','));

  const countsChanged = Object.keys(preCounts).filter((k) => preCounts[k] !== postCounts[k]);
  if (countsChanged.length) problems.push('document counts changed outside the approved write scope: ' + countsChanged.map((k) => k + ' ' + preCounts[k] + '->' + postCounts[k]).join(','));

  const opOutcomes = {};
  let valuesVerified = 0;
  let valuesExpected = 0;
  for (const d of documents) {
    for (const r of d.opResults) {
      opOutcomes[r.outcome] = (opOutcomes[r.outcome] || 0) + 1;
      if (r.expectPresent) {
        valuesExpected += 1;
        if (r.valueVerified) valuesVerified += 1;
      }
    }
  }

  const totalOps = operations.length;
  const accounted = Object.keys(opOutcomes).reduce((n, k) => n + opOutcomes[k], 0);
  const unverifiedApplied = documents.reduce((n, d) => n + d.opResults.filter((r) => r.outcome === 'APPLIED' && !r.valueVerified).length, 0);

  const verdict = unverifiedApplied > 0 || problems.length > 0
    ? 'FAIL'
    : (accounted === totalOps && valuesVerified === valuesExpected ? 'PASS' : 'REVIEW');

  const statusCounts = {};
  for (const d of documents) statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;

  return {
    spec: cfg.SPEC,
    phase: 'POST_WRITE_VERIFICATION',
    mode: cfg.MODE,
    state: cfg.STATE,
    generatedAt: new Date().toISOString(),
    readAt: args.postReadAt || null,
    transport: args.transport || 'GET data/query api.sanity.io (read-only)',
    scope: {
      targetsExpected: order.length,
      targetsRead: order.length - missingPost.length,
      operationsTotal: totalOps,
      operationsAccounted: accounted,
      nonTargetDocumentsChanged: nonTargetChanges,
      nonTargetDocumentsChangedCount: nonTargetChanges.length,
      countsBefore: preCounts,
      countsAfter: postCounts,
      countsChanged: countsChanged,
      documentsWrittenByExecution: documents.filter((d) => d.written).length,
      documentsNotWrittenByExecution: documents.filter((d) => !d.written).length,
    },
    values: {
      expectedPresent: valuesExpected,
      verifiedPresent: valuesVerified,
      notVerified: valuesExpected - valuesVerified,
      perOutcome: opOutcomes,
    },
    documentStatusCounts: statusCounts,
    documents: documents,
    problems: problems,
    observations: observations,
    unverifiedAppliedOperations: unverifiedApplied,
    verdict: verdict,
    checks: [
      { id: 'S-01', label: 'every approved value that was written or already matched reads back byte-identical', pass: valuesVerified === valuesExpected, detail: valuesVerified + '/' + valuesExpected },
      { id: 'S-02', label: 'no document outside the frozen 117 targets changed revision', pass: nonTargetChanges.length === 0, detail: 'changed=' + nonTargetChanges.length },
      { id: 'S-03', label: 'wiki document counts unchanged', pass: countsChanged.length === 0, detail: countsChanged.join(',') || 'unchanged' },
      { id: 'S-04', label: 'every operation outcome is accounted for exactly once', pass: accounted === totalOps, detail: accounted + '/' + totalOps },
      { id: 'S-05', label: 'no operation with outcome APPLIED is missing its verified value', pass: unverifiedApplied === 0, detail: 'unverified=' + unverifiedApplied },
      { id: 'S-06', label: 'every document written by this execution shows a revision change', pass: targetWrittenRevUnchanged.length === 0, detail: targetWrittenRevUnchanged.join(',') || 'all changed' },
    ],
  };
}

module.exports = { topLevelDiff, seoSiblingDiff, verifyDocument, buildVerification };
