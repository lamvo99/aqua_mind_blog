'use strict';

const cfg = require('./config');

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function lastSegment(fieldPath) {
  const parts = String(fieldPath).split('.');
  return parts[parts.length - 1];
}

function buildPatch(args) {
  const doc = args.doc;
  const writes = args.writes || [];
  const matched = args.matched || [];

  if (!writes.length) {
    return { kind: 'NOOP', set: null, fields: [], matchedFields: matched.map((op) => op.fieldPath), operationIds: matched.map((op) => op.operationId) };
  }

  const seo = doc ? doc.seo : undefined;
  const seoPresent = seo !== undefined && seo !== null;
  if (seoPresent && !isPlainObject(seo)) {
    return { kind: 'REFUSED', error: 'seo-field-present-but-not-an-object', set: null, fields: [], operationIds: writes.map((op) => op.operationId) };
  }

  let set;
  let kind;
  if (isPlainObject(seo)) {
    set = {};
    for (const op of writes) set[op.fieldPath] = op.frozenProposedValue;
    kind = 'NESTED_FIELD_SET';
  } else {
    const seoObject = {};
    for (const op of writes) seoObject[lastSegment(op.fieldPath)] = op.frozenProposedValue;
    set = { seo: seoObject };
    kind = 'SEO_OBJECT_CREATE';
  }

  const problems = validateSet(set, writes);
  if (problems.length) return { kind: 'REFUSED', error: problems.join(','), set: null, fields: [], operationIds: writes.map((op) => op.operationId) };

  return {
    kind: kind,
    set: set,
    fields: writes.map((op) => op.fieldPath),
    matchedFields: matched.map((op) => op.fieldPath),
    operationIds: writes.map((op) => op.operationId),
    seoWasPresent: isPlainObject(seo),
  };
}

function validateSet(set, writes) {
  const problems = [];
  const keys = Object.keys(set);
  if (keys.length === 0) problems.push('empty-patch-set');
  if (keys.length > cfg.ALLOWED_FIELDS.length) problems.push('too-many-fields-in-patch');
  const frozenByPath = {};
  for (const op of writes) frozenByPath[op.fieldPath] = op.frozenProposedValue;

  if (keys.length === 1 && keys[0] === cfg.SEO_ROOT && isPlainObject(set[cfg.SEO_ROOT])) {
    const inner = set[cfg.SEO_ROOT];
    for (const k of Object.keys(inner)) {
      const path = cfg.SEO_ROOT + '.' + k;
      if (cfg.ALLOWED_FIELDS.indexOf(path) < 0) problems.push('field-not-allowlisted:' + path);
      if (inner[k] !== frozenByPath[path]) problems.push('value-not-frozen-for:' + path);
      if (typeof inner[k] !== 'string' || inner[k].trim() === '') problems.push('empty-value-for:' + path);
    }
    if (Object.keys(inner).length !== writes.length) problems.push('patch-field-count-differs-from-write-count');
  } else {
    for (const k of keys) {
      if (cfg.ALLOWED_FIELDS.indexOf(k) < 0) problems.push('field-not-allowlisted:' + k);
      if (set[k] !== frozenByPath[k]) problems.push('value-not-frozen-for:' + k);
      if (typeof set[k] !== 'string' || set[k].trim() === '') problems.push('empty-value-for:' + k);
    }
    if (keys.length !== writes.length) problems.push('patch-field-count-differs-from-write-count');
  }
  return problems;
}

function describePatch(patch) {
  if (!patch || patch.kind === 'NOOP') return 'NOOP';
  if (patch.kind === 'REFUSED') return 'REFUSED:' + patch.error;
  return patch.kind + ':' + patch.fields.slice().sort().join('+');
}

module.exports = { buildPatch, validateSet, describePatch, isPlainObject, lastSegment };
