'use strict';

const cfg = require('./config');
const IO = require('../SPEC_07F_executor/io');

const SPECIES_QUERY = '*[_type == "species"]';
const WIKI_TYPES_QUERY = '*[_type in ["species","plant","invertebrate","coral","equipment","problem"]]{_id,_type,_rev}';
const COUNTS_QUERY = '{ "species": count(*[_type == "species"]), "plant": count(*[_type == "plant"]), "invertebrate": count(*[_type == "invertebrate"]), "coral": count(*[_type == "coral"]), "equipment": count(*[_type == "equipment"]), "problem": count(*[_type == "problem"]), "drafts": count(*[_id in path("drafts.**")]) }';

async function q(query) {
  return IO.L.q(query);
}

async function readSpeciesFull() {
  const docs = await q(SPECIES_QUERY);
  if (!Array.isArray(docs)) throw new Error('species read returned a non-array result');
  return docs;
}

async function readWikiRevs() {
  const rows = await q(WIKI_TYPES_QUERY);
  if (!Array.isArray(rows)) throw new Error('wiki revision read returned a non-array result');
  return rows;
}

async function readCounts() {
  const counts = await q(COUNTS_QUERY);
  if (!counts || typeof counts !== 'object') throw new Error('count read returned an unexpected result');
  return counts;
}

async function readDocFull(id) {
  const doc = await q('*[_type == "species" && _id == ' + JSON.stringify(id) + '][0]');
  return doc === undefined ? null : doc;
}

function makeReadFn(docs) {
  const byId = new Map();
  for (const d of docs) byId.set(d._id, d);
  return function readDoc(id) {
    return byId.has(id) ? byId.get(id) : null;
  };
}

function wikiTotal(counts) {
  return cfg.BASELINE && counts
    ? ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'].reduce((n, t) => n + (Number(counts[t]) || 0), 0)
    : 0;
}

async function snapshot() {
  const startedAt = IO.nowIso();
  const [docs, revs, counts] = await Promise.all([readSpeciesFull(), readWikiRevs(), readCounts()]);
  return {
    docs: docs,
    readDoc: makeReadFn(docs),
    revs: revs,
    counts: counts,
    wikiTotal: wikiTotal(counts),
    speciesCount: docs.length,
    readAt: IO.nowIso(),
    startedAt: startedAt,
    transport: 'GET data/query api.sanity.io (read-only, apiVersion ' + cfg.API_VERSION + ')',
    bytes: JSON.stringify(docs).length,
  };
}

module.exports = {
  SPECIES_QUERY, WIKI_TYPES_QUERY, COUNTS_QUERY,
  q, readSpeciesFull, readWikiRevs, readCounts, readDocFull, makeReadFn, wikiTotal, snapshot,
};
