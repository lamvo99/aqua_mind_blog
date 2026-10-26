'use strict';

const IO = require('./io');

const SPECIES_QUERY = '*[_type == "species"]{_id, _type, _rev, name, slug, seo}';

async function fetchAllSpecies() {
  const rows = await IO.L.q(SPECIES_QUERY);
  if (!Array.isArray(rows)) throw new Error('canonical read returned a non-array result');
  return rows;
}

function makeReadFn(docs) {
  const byId = new Map();
  for (const d of docs) byId.set(d._id, d);
  return async function readDoc(id) {
    return byId.has(id) ? byId.get(id) : null;
  };
}

async function loadLiveRead() {
  const docs = await fetchAllSpecies();
  return {
    readDoc: makeReadFn(docs),
    speciesCount: docs.length,
    readAt: IO.nowIso(),
    transport: 'GET data/query (read-only)',
    writeCalls: 0,
  };
}

module.exports = { SPECIES_QUERY, fetchAllSpecies, makeReadFn, loadLiveRead };
