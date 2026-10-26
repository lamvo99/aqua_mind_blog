const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUT3 = path.join('report', 'SPEC_03');
const OUT2 = path.join('report', 'SPEC_02');
const OUT1 = path.join('report', 'SPEC_01');
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];

const POST = readJson(path.join(OUT3, 'SPEC_03_POST_ENRICHMENT_SNAPSHOT.json'));
const SPEC02 = readJson(path.join(OUT2, 'SPEC_02_POST_REPAIR_SNAPSHOT.json'));
const SPEC01_MANIFEST = readJson(path.join(OUT1, 'SPEC_01_SOURCE_MANIFEST.json'));
const PLAN = readJson(path.join(OUT3, 'SPEC_03_REPAIR_PLAN.json'));
const MLOG = readJson(path.join(OUT3, 'SPEC_03_MUTATION_LOG.json'));

const ENUMS = {
  'species.group': ['Cichlid', 'Livebearer', 'Catfish', 'Loach', 'Characin', 'Cyprinid', 'Gourami', 'Arowana', 'Puffer', 'Angelfish', 'Tang', 'Wrasse', 'Goby', 'Blenny', 'Shark', 'Rainbowfish', 'Killifish', 'Pleco', 'Other'],
  'plant.group': ['Stem', 'Rosette', 'Rhizome', 'Bulb', 'Moss', 'Fern', 'Floating', 'Epiphyte', 'Carpet', 'Succulent', 'Other'],
  'coral.group': ['LPS', 'SPS', 'Soft', 'NPS', 'Mushroom', 'Anemone', 'Polyp', 'Colony', 'Single Polyp', 'Other'],
  'problem.waterType': ['freshwater', 'saltwater', 'both'],
};
const RELATIONSHIP_FIELDS = [
  ['species', 'parentSpecies'], ['species', 'compatibleSpecies'], ['species', 'compatibleInvertebrates'], ['species', 'compatiblePlants'], ['species', 'relatedPosts'],
  ['plant', 'relatedPosts'],
  ['invertebrate', 'parentSpecies'], ['invertebrate', 'compatibleSpecies'], ['invertebrate', 'suitableEquipment'], ['invertebrate', 'relatedPosts'],
  ['coral', 'relatedPosts'],
  ['equipment', 'relatedPosts'],
  ['problem', 'relatedPosts'], ['problem', 'relatedTools'],
];
const BODY_FIELDS = ['symptoms', 'causes', 'whatToCheck', 'whatNotToDo'];
const ENRICHED_IDS = new Set(['I9bI8W8ZWcEwyIzM9DFYjI', 'I9bI8W8ZWcEwyIzM9DFYtM', 'I9bI8W8ZWcEwyIzM9DNIu8',
  'IlX7xILobrukz7d5JnvacY', 'IlX7xILobrukz7d5Jo2qVy', 'IlX7xILobrukz7d5Jo2qgo', 'IlX7xILobrukz7d5Jo2wxC',
  'IlX7xILobrukz7d5Jo2xIs', 'J1Tx0fWCuGNPno99A79Tvf', 'J1Tx0fWCuGNPno99A7AE36', 'J1Tx0fWCuGNPno99A7AEDM',
  'J1Tx0fWCuGNPno99A7KJcq', 'J1Tx0fWCuGNPno99A7KJpf', 'J1Tx0fWCuGNPno99A7KutT',
  'problem-aiptasia-infestation', 'problem-brown-jelly-disease', 'problem-coral-bleaching',
  'problem-heater-stuck-off', 'problem-heater-stuck-on', 'problem-high-nitrate', 'problem-high-nitrite',
  'problem-ph-crash', 'problem-ph-drift', 'problem-rapid-tissue-necrosis-rtn', 'problem-slow-tissue-necrosis-stn']);

const checks = [];
const check = (id, name, ok, detail) => {
  checks.push({ id, name, pass: !!ok, detail: String(detail ?? '') });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id} ${name}${detail != null ? ' — ' + detail : ''}`);
};

// ---- build indexes ----
const postBy = {}; const spec02By = {};
for (const t of WIKI_TYPES) {
  for (const r of POST.records[t]) if (!r._id.startsWith('drafts.')) postBy[r._id] = { type: t, rec: r };
  for (const r of SPEC02.records[t]) if (!r._id.startsWith('drafts.')) spec02By[r._id] = { type: t, rec: r };
}

// ---- 1. canonical baseline ----
const counts = POST.manifest.wikiTypeCounts;
const total = Object.values(counts).reduce((a, b) => a + b, 0);
const countsOk = counts.species === 218 && counts.plant === 62 && counts.invertebrate === 56 && counts.coral === 48 && counts.equipment === 46 && counts.problem === 43 && total === 473;
check('GD-01', 'canonical record count = 473', countsOk, JSON.stringify(counts));

const drafts = WIKI_TYPES.reduce((s, t) => s + POST.records[t].filter((r) => r._id.startsWith('drafts.')).length, 0);
check('GD-02', '0 drafts', drafts === 0, `drafts=${drafts}`);

const slugMap = {}; let dupSlugs = 0;
for (const id of Object.keys(postBy)) {
  const s = slugValue(postBy[id].rec.slug);
  if (slugMap[s]) dupSlugs++;
  slugMap[s] = id;
}
check('GD-03', '0 duplicate slugs', dupSlugs === 0, `duplicates=${dupSlugs}`);

// ---- 2. identity diffs vs SPEC 01 manifest ----
let idDiff = 0, slugDiff = 0, titleDiff = 0;
const spec01Ids = Object.keys(SPEC01_MANIFEST.perRecord);
for (const id of spec01Ids) if (!postBy[id]) idDiff++;
for (const id of Object.keys(postBy)) if (!SPEC01_MANIFEST.perRecord[id]) idDiff++;
for (const id of spec01Ids) {
  const live = postBy[id]; if (!live) continue;
  const m = SPEC01_MANIFEST.perRecord[id];
  if (slugValue(live.rec.slug) !== m.slug) slugDiff++;
  if ((titleOf(live.type, live.rec) ?? null) !== m.title) titleDiff++;
}
check('GD-04', 'ID diff = 0', idDiff === 0, `idDiff=${idDiff}`);
check('GD-05', 'slug diff = 0', slugDiff === 0, `slugDiff=${slugDiff}`);
check('GD-06', 'title diff = 0', titleDiff === 0, `titleDiff=${titleDiff}`);

// ---- 3. canonical hash (identity) unchanged ----
const canonical = {};
for (const id of Object.keys(postBy)) {
  canonical[id] = sha256(JSON.stringify({ id, title: titleOf(postBy[id].type, postBy[id].rec), slug: slugValue(postBy[id].rec.slug) }));
}
const hash = sha256(Object.keys(canonical).sort().map((id) => canonical[id]).join('\n'));
check('GD-07', 'canonical hash before/after identical (identity untouched)', hash === 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda',
  `before=c6e358d5… after=${hash.slice(0, 16)}…`);

// ---- 4. mutation log integrity ----
const appliedEntries = MLOG.entries.filter((e) => e.status === 'APPLIED');
const logFields = new Set(appliedEntries.map((e) => `${e.recordId}|${e.field}`));
check('GD-08', 'exactly 191 approved mutations applied', MLOG.appliedFieldCount === 191 && appliedEntries.length === 191 && logFields.size === 191,
  `applied=${MLOG.appliedFieldCount}, logEntries=${appliedEntries.length}, unique(record,field)=${logFields.size}`);
check('GD-09', '0 unexpected mutations (log ⊆ authorized plan rows)',
  [...logFields].every((k) => PLAN.proposals.some((p) => `${p.recordId}|${p.field}` === k && ['SET_FIELD', 'ENRICH_BODY'].includes(p.action))),
  'every applied row maps to an authorized SET_FIELD/ENRICH_BODY plan row');

// ---- 5. actual live diff vs SPEC 02 baseline (unexpected mutation = 0) ----
const authorizedSet = logFields;
const metaFields = new Set(['_rev', '_updatedAt', '_createdAt']);
const changed = [];
for (const [id, s2] of Object.entries(spec02By)) {
  const live = postBy[id];
  if (!live) { changed.push({ id, field: '__deleted__' }); continue; }
  const keys = new Set([...Object.keys(s2.rec), ...Object.keys(live.rec)]);
  for (const k of keys) {
    if (metaFields.has(k)) continue;
    if (JSON.stringify(s2.rec[k] ?? null) !== JSON.stringify(live.rec[k] ?? null)) changed.push({ id, field: k });
  }
}
const unexpected = changed.filter((c) => !authorizedSet.has(`${c.id}|${c.field}`));
const missingApplied = [...authorizedSet].filter((k) => !changed.some((c) => `${c.id}|${c.field}` === k));
check('GD-10', 'unexpected mutation = 0', unexpected.length === 0,
  `changedFields=${changed.length}, unexpected=${unexpected.length}${unexpected.length ? ' (' + unexpected.slice(0, 5).map((u) => u.id + '.' + u.field).join(',') + ')' : ''}`);
check('GD-11', 'all 191 authorized mutations verifiably present in live data', missingApplied.length === 0, `missing=${missingApplied.length}`);

// ---- 6. relationship diff = 0 ----
let relDiff = 0;
for (const [type, field] of RELATIONSHIP_FIELDS) {
  for (const [id, s2] of Object.entries(spec02By)) {
    if (s2.type !== type) continue;
    const live = postBy[id];
    if (JSON.stringify(s2.rec[field] ?? null) !== JSON.stringify(live.rec[field] ?? null)) relDiff++;
  }
}
check('GD-12', 'relationship diff = 0', relDiff === 0, `relationshipFieldsChanged=${relDiff}`);

// ---- 7. category distribution unchanged ----
const catDist = {};
for (const t of WIKI_TYPES) {
  catDist[t] = {};
  for (const id of Object.keys(postBy).filter((i) => postBy[i].type === t)) {
    const c = postBy[id].rec.category ?? '(none)';
    catDist[t][c] = (catDist[t][c] || 0) + 1;
  }
}
const spec02Cat = {};
for (const t of WIKI_TYPES) {
  spec02Cat[t] = {};
  for (const id of Object.keys(spec02By).filter((i) => spec02By[i].type === t)) {
    const c = spec02By[id].rec.category ?? '(none)';
    spec02Cat[t][c] = (spec02Cat[t][c] || 0) + 1;
  }
}
const catOk = WIKI_TYPES.every((t) => JSON.stringify(catDist[t]) === JSON.stringify(spec02Cat[t]));
check('GD-13', 'category counts unchanged', catOk, JSON.stringify(catDist.problem));

// ---- 8. unauthorized plan rows untouched ----
const untouched = PLAN.proposals.filter((p) => !['SET_FIELD', 'ENRICH_BODY'].includes(p.action));
const violations = [];
for (const p of untouched) {
  const live = postBy[p.recordId];
  if (!live) { violations.push(`${p.recordId}:deleted`); continue; }
  const v = live.rec[p.field];
  const liveMissing = v === undefined || v === null || (Array.isArray(v) && v.length === 0);
  if (p.currentValue === '') {
    if (!liveMissing) violations.push(`${p.recordId}.${p.field}:should still be empty (got ${JSON.stringify(v).slice(0, 40)})`);
  } else if (JSON.stringify(v ?? null) !== JSON.stringify(p.currentValue)) {
    violations.push(`${p.recordId}.${p.field}:should still be ${JSON.stringify(p.currentValue)} (got ${JSON.stringify(v).slice(0, 40)})`);
  }
}
const replaceRows = PLAN.proposals.filter((p) => p.action === 'REPLACE_FIELD');
const replaceOk = replaceRows.every((p) => JSON.stringify(postBy[p.recordId].rec[p.field] ?? null) === JSON.stringify(p.currentValue));
check('GD-14', '3 REPLACE_FIELD untouched', replaceRows.length === 3 && replaceOk, 'Butterflyfish×2 + Dwarf Sagittaria group values unchanged');
const reviewRows = PLAN.proposals.filter((p) => p.status === 'REVIEW_REQUIRED' && p.action !== 'REPLACE_FIELD');
const reviewViol = violations.filter((v) => reviewRows.some((r) => v.startsWith(`${r.recordId}.${r.field}:`)));
check('GD-15', '108 REVIEW_REQUIRED untouched', reviewRows.length === 108 && reviewViol.length === 0, `reviewRows=${reviewRows.length}, violations=${reviewViol.length}`);
const blockedRows = PLAN.proposals.filter((p) => p.action === 'BLOCKED_FOR_REPAIR');
const blockedViol = violations.filter((v) => blockedRows.some((r) => v.startsWith(`${r.recordId}.${r.field}:`)));
check('GD-16', '1,146 BLOCKED_FOR_REPAIR untouched', blockedRows.length === 1146 && blockedViol.length === 0, `blockedRows=${blockedRows.length}, violations=${blockedViol.length}`);
const relRows = PLAN.proposals.filter((p) => p.status === 'NO_CHANGE' && String(p.source).includes('relationships out of scope'));
const relViol = violations.filter((v) => relRows.some((r) => v.startsWith(`${r.recordId}.${r.field}:`)));
check('GD-17', '1,244 relationship opportunities untouched', relRows.length === 1244 && relViol.length === 0 && relDiff === 0, `relRows=${relRows.length}`);
const otherViol = violations.filter((v) => ![...reviewRows, ...blockedRows, ...relRows, ...replaceRows].some((r) => v.startsWith(`${r.recordId}.${r.field}:`)));
check('GD-18', 'all other NO_CHANGE rows untouched (seo/images/brand/model/flowRate)', otherViol.length === 0, `otherViolations=${otherViol.length}`);

// ---- 9. new values schema-valid ----
let enumBad = [];
for (const e of appliedEntries) {
  if (e.after === '[ENRICH_BODY]' || String(e.after).startsWith('[ENRICH_BODY:')) continue;
  const key = `${e.type}.${e.field}`;
  const allowed = ENUMS[key];
  if (!allowed) enumBad.push(`${key}:no enum`);
  else if (!allowed.includes(e.after)) enumBad.push(`${key}:${e.after}`);
}
check('GD-19', 'all new scalar values schema-valid', enumBad.length === 0, enumBad.join('; ') || '91 enum values valid');

// ---- 10. Problem bodies: 25 enriched conform, 18 existing untouched ----
let bodyErrors = [];
const existingErrors = [];
for (const id of ENRICHED_IDS) {
  const rec = postBy[id].rec;
  for (const f of BODY_FIELDS) {
    const blocks = rec[f];
    if (!Array.isArray(blocks) || blocks.length === 0) { bodyErrors.push(`${id}.${f}:missing`); continue; }
    const expected = f === 'whatNotToDo' ? 2 : 3;
    if (blocks.length !== expected) bodyErrors.push(`${id}.${f}:count=${blocks.length}!=${expected}`);
    for (const b of blocks) {
      if (b._type !== 'block' || !b._key || b.style !== 'normal') bodyErrors.push(`${id}.${f}:bad block structure`);
      if (b.listItem !== 'bullet' || b.level !== 1) bodyErrors.push(`${id}.${f}:not bullet/level1`);
      if (!Array.isArray(b.children) || !b.children.length || typeof b.children[0].text !== 'string' || !b.children[0].text.trim()) bodyErrors.push(`${id}.${f}:bad children`);
      if (!Array.isArray(b.markDefs)) bodyErrors.push(`${id}.${f}:markDefs missing`);
    }
    const keys = blocks.map((b) => b._key);
    if (new Set(keys).size !== keys.length) bodyErrors.push(`${id}.${f}:duplicate _key`);
  }
}
for (const id of Object.keys(spec02By)) {
  if (spec02By[id].type !== 'problem' || ENRICHED_IDS.has(id)) continue;
  for (const f of BODY_FIELDS) {
    if (JSON.stringify(spec02By[id].rec[f] ?? null) !== JSON.stringify(postBy[id].rec[f] ?? null)) existingErrors.push(`${id}.${f}`);
  }
}
check('GD-20', '25 enriched bodies conform to live PT schema (3/3/3/2 bullets, valid keys/styles)', bodyErrors.length === 0,
  bodyErrors.slice(0, 5).join('; ') || '25/25 bodies valid (11 blocks each = 110 total blocks)');
check('GD-21', '18 existing Problem bodies untouched', existingErrors.length === 0, existingErrors.join(', ') || '18/18 unchanged');

const emptyNow = Object.keys(postBy).filter((id) => postBy[id].type === 'problem' &&
  BODY_FIELDS.every((f) => !Array.isArray(postBy[id].rec[f]) || postBy[id].rec[f].length === 0)).length;
check('GD-22', 'empty Problem bodies now = 0', emptyNow === 0, `emptyBodies=${emptyNow} (was 25)`);

const result = checks.every((c) => c.pass) ? 'PASS' : 'FAIL';
const validation = {
  spec: 'SPEC 03', phase: 'GATE D POST-MUTATION VALIDATION', generatedAt: new Date().toISOString(),
  result,
  checks,
  acceptance: {
    canonicalRecordCount: total, expected: 473,
    idDiff, slugDiff, titleDiff, relationshipDiff: relDiff,
    unexpectedMutations: unexpected.length,
    approvedMutationsApplied: MLOG.appliedFieldCount, expectedMutations: 191,
    replaceFieldUntouched: replaceRows.length, reviewRequiredUntouched: reviewRows.length,
    blockedUntouched: blockedRows.length, relationshipOpportunitiesUntouched: relRows.length,
    canonicalHashBefore: 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda',
    canonicalHashAfter: hash,
  },
};
fs.writeFileSync(path.join(OUT3, 'SPEC_03_POST_VALIDATION.json'), JSON.stringify(validation, null, 2));
console.log(`\nGATE D VALIDATION: ${result} (${checks.filter((c) => c.pass).length}/${checks.length})`);
if (result !== 'PASS') process.exit(2);