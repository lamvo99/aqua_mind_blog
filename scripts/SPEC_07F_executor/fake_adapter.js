'use strict';

const cfg = require('./config');
const G = require('./guard');

const PRODUCTION_CHANNEL = { constructed: 0, clientConstructed: 0, calls: 0 };

function setNestedField(doc, fieldPath, value) {
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

function revisionMismatch(message) {
  const e = new Error(message);
  e.name = 'RevisionMismatch';
  e.code = 'REVISION_MISMATCH';
  return e;
}

function seedStore(operations, options) {
  const opts = options || {};
  const docs = new Map();
  const seen = new Set();
  for (const op of operations) {
    if (seen.has(op.recordId)) continue;
    seen.add(op.recordId);
    if (opts.missing && opts.missing.indexOf(op.recordId) >= 0) continue;
    const doc = {
      _id: op.recordId,
      _type: cfg.TARGET_TYPE,
      _rev: (opts.driftedRev && opts.driftedRev[op.recordId]) || op.expectedRevision,
      name: op.title,
      slug: String(op.title).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    };
    if (opts.siblingSeo && opts.siblingSeo[op.recordId]) doc.seo = Object.assign({}, opts.siblingSeo[op.recordId]);
    if (opts.conflict && opts.conflict[op.recordId]) {
      doc.seo = Object.assign({}, doc.seo || {}, opts.conflict[op.recordId]);
    }
    if (opts.partial && opts.partial[op.recordId]) {
      const partialOps = operations.filter((o) => o.recordId === op.recordId && o.fieldPath === opts.partial[op.recordId]);
      doc.seo = Object.assign({}, doc.seo || {});
      for (const p of partialOps) doc.seo[p.fieldPath.split('.')[1]] = p.frozenProposedValue;
    }
    docs.set(op.recordId, doc);
  }
  return docs;
}

class FakeMutationAdapter {
  constructor(store, options) {
    this.store = store;
    this.options = options || {};
    this.calls = [];
    this.simulated = true;
    this.production = false;
    this.revCounter = 0;
  }

  get callCount() {
    return this.calls.length;
  }

  apply(request) {
    this.calls.push({
      operationId: request.operationId,
      docId: request.docId,
      fieldPath: request.fieldPath,
      ifRevision: request.ifRevision === undefined ? null : request.ifRevision,
    });
    const failMode = (this.options.failOperations || {})[request.operationId];
    if (failMode === 'transient') {
      const e = new Error('simulated transient transport failure');
      e.name = 'TransientFailure';
      e.code = 'FAILED_RETRYABLE';
      throw e;
    }
    if (failMode === 'final') {
      const e = new Error('simulated permanent adapter failure');
      e.name = 'FinalFailure';
      e.code = 'FAILED_FINAL';
      throw e;
    }
    const failFields = this.options.failFieldPaths || [];
    if (failFields.indexOf(request.fieldPath) >= 0) {
      const e = new Error('simulated field-level failure for ' + request.fieldPath);
      e.name = 'FieldFailure';
      e.code = 'FAILED_RETRYABLE';
      throw e;
    }
    if (!this.store.has(request.docId)) {
      const e = new Error('target missing at write time');
      e.name = 'MissingTarget';
      e.code = 'MISSING_TARGET';
      throw e;
    }
    const doc = this.store.get(request.docId);
    if (request.ifRevision !== undefined && request.ifRevision !== null && doc._rev !== request.ifRevision) {
      throw revisionMismatch('conditional revision precondition rejected the simulated commit for ' + request.docId);
    }
    this.revCounter += 1;
    const next = setNestedField(doc, request.fieldPath, request.frozenValue !== undefined ? request.frozenValue : request.value);
    next._rev = 'SIMULATED_REV_' + this.revCounter;
    this.store.set(request.docId, next);
    return { applied: true, previousRev: doc._rev, newRev: next._rev, simulated: true };
  }
}

function createProductionMutationAdapter(context) {
  PRODUCTION_CHANNEL.constructed += 1;
  G.openMutationChannel({ authorizationContract: context && context.authorizationContract });
  PRODUCTION_CHANNEL.clientConstructed += 1;
  throw new G.BarrierViolation('SPEC 07F build contains no production mutation implementation.', 'NO_IMPLEMENTATION');
}

function productionChannelSnapshot() {
  return {
    adapterConstructionAttempts: PRODUCTION_CHANNEL.constructed,
    writeCapableClientConstructed: PRODUCTION_CHANNEL.clientConstructed,
    productionMutationCalls: PRODUCTION_CHANNEL.calls,
  };
}

function resetProductionChannel() {
  PRODUCTION_CHANNEL.constructed = 0;
  PRODUCTION_CHANNEL.clientConstructed = 0;
  PRODUCTION_CHANNEL.calls = 0;
}

module.exports = {
  FakeMutationAdapter, seedStore, setNestedField, revisionMismatch,
  createProductionMutationAdapter, productionChannelSnapshot, resetProductionChannel,
  PRODUCTION_CHANNEL,
};
