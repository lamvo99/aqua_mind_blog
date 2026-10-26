'use strict';

const cfg = require('./config');

function stableStringify(value) {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}

function readPath(doc, fieldPath) {
  const parts = String(fieldPath).split('.');
  let cur = doc;
  for (const p of parts) {
    if (cur === undefined || cur === null) return null;
    cur = cur[p];
  }
  return cur === undefined ? null : cur;
}

function writePath(doc, fieldPath, value) {
  const parts = String(fieldPath).split('.');
  const next = Object.assign({}, doc);
  let cur = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    const child = cur[k] && typeof cur[k] === 'object' ? Object.assign({}, cur[k]) : {};
    cur[k] = child;
    cur = child;
  }
  cur[parts[parts.length - 1]] = value;
  return next;
}

const VOLATILE_DOC_KEYS = Object.freeze(['_rev', '_updatedAt']);

function verifyAfterWrite(args) {
  const originalDoc = args.originalDoc;
  const currentDoc = args.currentDoc;
  const operations = args.operations;
  const targetId = args.targetId;
  const checks = [];

  if (!currentDoc) {
    return {
      status: 'REVIEW_REQUIRED',
      checks: [{ id: 'V-01', label: 'target re-read succeeds', pass: false, detail: 'document missing after simulated write' }],
      operationIds: operations.map((o) => o.operationId),
      sourceArtifacts: operations.map((o) => o.sourceArtifact),
    };
  }

  const add = (id, label, pass, detail) => checks.push({ id: id, label: label, pass: !!pass, detail: String(detail) });

  add('V-01', 'target re-read succeeds and resolves to a document', true, 'read ok');

  add('V-02', 'exact target identity: _id equals the planned document id and _type equals species',
    currentDoc._id === targetId && currentDoc._type === cfg.TARGET_TYPE,
    '_id=' + currentDoc._id + ' _type=' + currentDoc._type);

  const valueResults = operations.map((op) => ({
    operationId: op.operationId,
    fieldPath: op.fieldPath,
    expected: op.frozenProposedValue,
    actual: readPath(currentDoc, op.fieldPath),
  }));
  add('V-03', 'both approved field values are present and byte-identical to the frozen proposal',
    valueResults.length === 2 && valueResults.every((v) => v.actual === v.expected),
    valueResults.map((v) => v.fieldPath + '=' + (v.actual === v.expected ? 'match' : 'differs')).join(','));

  const identityKeys = ['_id', '_type', 'slug', 'name'];
  const identityUnchanged = identityKeys.every((k) => stableStringify(originalDoc[k]) === stableStringify(currentDoc[k]));
  const originalTop = Object.keys(originalDoc).filter((k) => VOLATILE_DOC_KEYS.indexOf(k) < 0 && k !== 'seo').sort();
  const currentTop = Object.keys(currentDoc).filter((k) => VOLATILE_DOC_KEYS.indexOf(k) < 0 && k !== 'seo').sort();
  const topKeysUnchanged = originalTop.join(',') === currentTop.join(',');
  const unrelatedUnchanged = topKeysUnchanged && originalTop.every((k) => stableStringify(originalDoc[k]) === stableStringify(currentDoc[k]));
  add('V-04', 'no changes to _id, _type, slug, title (name) or any relationship or unrelated top-level field',
    identityUnchanged && unrelatedUnchanged,
    'identityUnchanged=' + identityUnchanged + ' unrelatedUnchanged=' + unrelatedUnchanged);

  const allowedSeoKeys = operations.map((o) => o.fieldPath.split('.')[1]).sort();
  const originalSeo = originalDoc.seo && typeof originalDoc.seo === 'object' ? originalDoc.seo : {};
  const currentSeo = currentDoc.seo && typeof currentDoc.seo === 'object' ? currentDoc.seo : {};
  const siblingKeys = Object.keys(originalSeo).filter((k) => allowedSeoKeys.indexOf(k) < 0).sort();
  const currentSiblingKeys = Object.keys(currentSeo).filter((k) => allowedSeoKeys.indexOf(k) < 0).sort();
  const siblingsPreserved = siblingKeys.join(',') === currentSiblingKeys.join(',') &&
    siblingKeys.every((k) => stableStringify(originalSeo[k]) === stableStringify(currentSeo[k]));
  const noExtraSeoKeys = Object.keys(currentSeo).every((k) => allowedSeoKeys.indexOf(k) >= 0 || siblingKeys.indexOf(k) >= 0);
  add('V-05', 'existing sibling fields inside the seo object are preserved and no unrelated seo key is added or removed',
    siblingsPreserved && noExtraSeoKeys,
    'originalSiblings=' + siblingKeys.join(',') + ' currentSiblings=' + currentSiblingKeys.join(','));

  const revChanged = !args.originalDoc._rev || currentDoc._rev !== args.originalDoc._rev;
  const revMatchesResult = args.expectedNewRev ? currentDoc._rev === args.expectedNewRev : revChanged;
  add('V-06', 'current document revision reflects the resulting state and differs from the pre-write revision',
    revChanged && revMatchesResult,
    'before=' + originalDoc._rev + ' after=' + currentDoc._rev);

  const traceable = operations.every((op) => op.operationId && op.sourceArtifact && op.sourceSha256);
  add('V-07', 'result traces to operation IDs, source artifacts and source hashes',
    traceable, 'operations=' + operations.length + ' traceable=' + traceable);

  const allPass = checks.every((c) => c.pass);
  return {
    status: allPass ? 'VERIFIED' : 'APPLIED_UNVERIFIED',
    checks: checks,
    operationIds: operations.map((o) => o.operationId),
    sourceArtifacts: operations.map((o) => o.sourceArtifact),
    sourceHashes: operations.map((o) => o.sourceSha256),
  };
}

function simulateVerifiedDocument(originalDoc, operations) {
  let doc = originalDoc;
  for (const op of operations) doc = writePath(doc, op.fieldPath, op.frozenProposedValue);
  doc._rev = 'SIMULATED_REV_APPLIED';
  return doc;
}

module.exports = { verifyAfterWrite, simulateVerifiedDocument, readPath, writePath, stableStringify };
