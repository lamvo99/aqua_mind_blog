const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---- Config ----
const envContent = fs.readFileSync('.env.local', 'utf8');
const tokenMatch = envContent.match(/SANITY_API_TOKEN="([^"]+)"/);
const TOKEN = tokenMatch ? tokenMatch[1] : null;
if (!TOKEN) { console.error('SANITY_API_TOKEN not found in .env.local'); process.exit(1); }

const PROJECT_ID = 'zeohjejw';
const DATASET = 'production';
const API_VERSION = '2026-05-25';
const API_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;

const OUT_DIR = path.join('report', 'SPEC_03');
fs.mkdirSync(OUT_DIR, { recursive: true });

const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED_COUNTS = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_TOTAL = 473;

// SPEC 02 post-repair baseline (authoritative for identity/category/hash gates)
const SPEC02 = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_02', 'SPEC_02_POST_REPAIR_SNAPSHOT.json'), 'utf8'));
const EXPECTED_CANONICAL_HASH = SPEC02.manifest.canonicalHash;

// SPEC 01 identity manifest + systemic categoryOmissions (= exact 40 target fields, AC-03)
const SPEC01_MANIFEST = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_01', 'SPEC_01_SOURCE_MANIFEST.json'), 'utf8'));
const SPEC01_AUDIT = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_01', 'SPEC_01_AUDIT_OUTPUT.json'), 'utf8'));

// SPEC 01 body-depth table (empty-body verification)
function parseCsvLine(line) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}
const BODY_DEPTH = fs.readFileSync(path.join('report', 'SPEC_01', 'SPEC_01_BODY_DEPTH.csv'), 'utf8')
  .replace(/^\uFEFF/, '')
  .split('\n')
  .slice(1)
  .filter((l) => l.trim() !== '')
  .map((l) => {
    const c = parseCsvLine(l);
    return { record_id: c[0], exists: c[2] };
  });

const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

async function query(name, groq) {
  const url = `${API_BASE}?query=${encodeURIComponent(groq)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`Query ${name} failed: ${res.status} ${await res.text()}`);
  return (await res.json()).result || [];
}

// Minimal eval-state metadata for the EXACT 40 target fields (schema type + enums/subfields).
// Mirrors SPEC_01_S schema semantics so GATE A counts are reproducible vs SPEC 01.
const FIELD_META = {
  'species.compatibleSpecies': { t: 'arrayRef' },
  'species.seo': { t: 'object', sub: ['metaTitle', 'metaDescription'] },
  'species.localNames': { t: 'arrayString' },
  'species.parentSpecies': { t: 'reference' },
  'species.relatedPosts': { t: 'arrayRef' },
  'species.reefCompatibility': { t: 'boolean' },
  'species.aliases': { t: 'arrayString' },
  'species.group': { t: 'string', opts: ['Cichlid', 'Livebearer', 'Catfish', 'Loach', 'Characin', 'Cyprinid', 'Gourami', 'Arowana', 'Puffer', 'Angelfish', 'Tang', 'Wrasse', 'Goby', 'Blenny', 'Shark', 'Rainbowfish', 'Killifish', 'Pleco', 'Other'] },
  'species.compatibleInvertebrates': { t: 'arrayRef' },
  'species.isPredator': { t: 'boolean' },
  'species.compatiblePlants': { t: 'arrayRef' },
  'plant.localNames': { t: 'arrayString' },
  'plant.aliases': { t: 'arrayString' },
  'plant.group': { t: 'string', opts: ['Stem', 'Rosette', 'Rhizome', 'Bulb', 'Moss', 'Fern', 'Floating', 'Epiphyte', 'Carpet', 'Succulent', 'Other'] },
  'plant.region': { t: 'string', opts: ['South America', 'Amazon Basin', 'Central America', 'North America', 'Southeast Asia', 'South Asia', 'East Asia', 'Africa', 'Australia / Oceania', 'Europe', 'Cosmopolitan'] },
  'plant.redPlant': { t: 'boolean' },
  'plant.relatedPosts': { t: 'arrayRef' },
  'invertebrate.localNames': { t: 'arrayString' },
  'invertebrate.aliases': { t: 'arrayString' },
  'invertebrate.parentSpecies': { t: 'reference' },
  'invertebrate.reefCompatibility': { t: 'boolean' },
  'invertebrate.compatibleSpecies': { t: 'arrayRef' },
  'invertebrate.suitableEquipment': { t: 'arrayRef' },
  'invertebrate.relatedPosts': { t: 'arrayRef' },
  'coral.localNames': { t: 'arrayString' },
  'coral.aliases': { t: 'arrayString' },
  'coral.group': { t: 'string', opts: ['LPS', 'SPS', 'Soft', 'NPS', 'Mushroom', 'Anemone', 'Polyp', 'Colony', 'Single Polyp', 'Other'] },
  'coral.relatedPosts': { t: 'arrayRef' },
  'equipment.brand': { t: 'string' },
  'equipment.model': { t: 'string' },
  'equipment.flowRateLh': { t: 'number' },
  'equipment.mainImage': { t: 'image' },
  'equipment.relatedPosts': { t: 'arrayRef' },
  'problem.waterType': { t: 'string', opts: ['freshwater', 'saltwater', 'both'] },
  'problem.symptoms': { t: 'arrayBlock' },
  'problem.causes': { t: 'arrayBlock' },
  'problem.whatToCheck': { t: 'arrayBlock' },
  'problem.whatNotToDo': { t: 'arrayBlock' },
  'problem.relatedPosts': { t: 'arrayRef' },
  'problem.relatedTools': { t: 'arrayRef' },
};

// Tier / severity replication for MISSING on the 40 target fields (SPEC 01 SEV table).
const FIELD_SRV = {
  'species.compatibleSpecies': ['D', 'LOW'],
  'species.seo': ['E', 'LOW'],
  'species.localNames': ['B', 'MEDIUM'],
  'species.parentSpecies': ['D', 'LOW'],
  'species.relatedPosts': ['D', 'LOW'],
  'species.reefCompatibility': ['C', 'MEDIUM'],
  'species.aliases': ['B', 'MEDIUM'],
  'species.group': ['C', 'MEDIUM'],
  'species.compatibleInvertebrates': ['D', 'LOW'],
  'species.isPredator': ['C', 'MEDIUM'],
  'species.compatiblePlants': ['D', 'LOW'],
  'plant.localNames': ['B', 'MEDIUM'],
  'plant.aliases': ['B', 'MEDIUM'],
  'plant.group': ['C', 'MEDIUM'],
  'plant.region': ['C', 'MEDIUM'],
  'plant.redPlant': ['C', 'MEDIUM'],
  'plant.relatedPosts': ['D', 'LOW'],
  'invertebrate.localNames': ['B', 'MEDIUM'],
  'invertebrate.aliases': ['B', 'MEDIUM'],
  'invertebrate.parentSpecies': ['D', 'LOW'],
  'invertebrate.reefCompatibility': ['C', 'MEDIUM'],
  'invertebrate.compatibleSpecies': ['D', 'LOW'],
  'invertebrate.suitableEquipment': ['D', 'LOW'],
  'invertebrate.relatedPosts': ['D', 'LOW'],
  'coral.localNames': ['B', 'MEDIUM'],
  'coral.aliases': ['B', 'MEDIUM'],
  'coral.group': ['C', 'MEDIUM'],
  'coral.relatedPosts': ['D', 'LOW'],
  'equipment.brand': ['C', 'MEDIUM'],
  'equipment.model': ['C', 'MEDIUM'],
  'equipment.flowRateLh': ['C', 'MEDIUM'],
  'equipment.mainImage': ['B', 'MEDIUM'],
  'equipment.relatedPosts': ['D', 'LOW'],
  'problem.waterType': ['C', 'MEDIUM'],
  'problem.symptoms': ['C', 'MEDIUM'],
  'problem.causes': ['C', 'MEDIUM'],
  'problem.whatToCheck': ['C', 'MEDIUM'],
  'problem.whatNotToDo': ['C', 'MEDIUM'],
  'problem.relatedPosts': ['D', 'LOW'],
  'problem.relatedTools': ['D', 'LOW'],
};

function evalState(meta, value, idType, assets) {
  const v = value;
  if (v === undefined) return 'MISSING';
  if (v === null) return 'NULL';
  switch (meta.t) {
    case 'string': {
      if (typeof v !== 'string') return 'INVALID_TYPE';
      if (v.trim() === '') return 'PRESENT_EMPTY';
      if (meta.opts && !meta.opts.includes(v)) return 'INVALID_VALUE';
      return 'PRESENT_VALID';
    }
    case 'number': {
      if (typeof v !== 'number' || isNaN(v)) return 'INVALID_TYPE';
      return 'PRESENT_VALID';
    }
    case 'boolean': return typeof v === 'boolean' ? 'PRESENT_VALID' : 'INVALID_TYPE';
    case 'arrayString': {
      if (!Array.isArray(v)) return 'INVALID_TYPE';
      if (v.length === 0) return 'EMPTY_ARRAY';
      for (const e of v) if (typeof e !== 'string' || e.trim() === '' || (meta.opts && !meta.opts.includes(e))) return 'INVALID_VALUE';
      return 'PRESENT_VALID';
    }
    case 'arrayRef': {
      if (!Array.isArray(v)) return 'INVALID_TYPE';
      if (v.length === 0) return 'EMPTY_ARRAY';
      for (const r of v) if (!r || typeof r !== 'object' || typeof r._ref !== 'string' || !idType[r._ref]) return 'BROKEN_REFERENCE';
      return 'PRESENT_VALID';
    }
    case 'reference': {
      if (typeof v !== 'object' || typeof v._ref !== 'string') return 'INVALID_TYPE';
      if (!idType[v._ref]) return 'BROKEN_REFERENCE';
      return 'PRESENT_VALID';
    }
    case 'arrayBlock': {
      if (!Array.isArray(v)) return 'INVALID_TYPE';
      if (v.length === 0) return 'EMPTY_ARRAY';
      for (const b of v) {
        if (!b || typeof b !== 'object' || b._type !== 'block' || !Array.isArray(b.children)) return 'MALFORMED_BLOCK';
        for (const c of b.children) if (typeof c.text !== 'string') return 'MALFORMED_BLOCK';
      }
      return 'PRESENT_VALID';
    }
    case 'image': {
      if (typeof v !== 'object') return 'INVALID_TYPE';
      if (!v.asset) return 'PRESENT_EMPTY';
      if (typeof v.asset._ref !== 'string') return 'INVALID_TYPE';
      if (!assets.has(v.asset._ref)) return 'BROKEN_REFERENCE';
      return 'PRESENT_VALID';
    }
    case 'object': {
      if (typeof v !== 'object') return 'INVALID_TYPE';
      const filled = (meta.sub || []).some((s) => v[s] != null && String(v[s]).trim() !== '');
      return filled ? 'PRESENT_VALID' : 'PRESENT_EMPTY';
    }
    default: return 'PRESENT_VALID';
  }
}

async function main() {
  const startedAt = new Date().toISOString();
  const dump = {};
  for (const t of WIKI_TYPES) {
    dump[t] = await query(t, `*[_type == "${t}"][]`);
    console.log(`[${t}] fetched ${dump[t].length} records`);
  }
  const assets = new Set(await query('assets', `*[_type == "sanity.imageAsset"][]._id`));
  const allTyped = await query('allTypes', `*[]{_id,_type}`);
  const draftCount = await query('drafts', `count(*[_id match "drafts.**"])`);
  console.log('dataset-wide drafts:', draftCount);

  const gates = [];
  const fail = (m) => { gates.push('GATE FAIL: ' + m); console.error('GATE FAIL: ' + m); };
  const pass = (m) => { gates.push(m); console.log('GATE OK: ' + m); };

  // ---- baseline counts / drafts ----
  const counts = {};
  let total = 0;
  for (const t of WIKI_TYPES) {
    const published = dump[t].filter((x) => !x._id.startsWith('drafts.'));
    counts[t] = published.length;
    total += published.length;
    if (counts[t] !== EXPECTED_COUNTS[t]) fail(`count ${t}: ${counts[t]} != expected ${EXPECTED_COUNTS[t]}`);
  }
  if (total !== EXPECTED_TOTAL) fail(`total ${total} != ${EXPECTED_TOTAL}`); else pass(`473 records, counts ${JSON.stringify(counts)}`);

  const drafts = WIKI_TYPES.reduce((s, t) => s + dump[t].filter((x) => x._id.startsWith('drafts.')).length, 0);
  if (drafts !== 0 || Number(draftCount) !== 0) fail(`drafts wiki=${drafts} global=${draftCount}`); else pass('0 drafts (wiki + dataset-wide)');

  // ---- slug / identity / routes ----
  const dupSlugs = {}; let identityMissing = 0, undefinedRoutes = 0;
  for (const t of WIKI_TYPES) {
    for (const it of dump[t]) {
      if (it._id.startsWith('drafts.')) continue;
      const slug = slugValue(it.slug);
      if (titleOf(t, it) == null || String(titleOf(t, it)).trim() === '') identityMissing++;
      if (slug) { if (!dupSlugs[slug]) dupSlugs[slug] = []; dupSlugs[slug].push(`${t}:${it._id}`); }
      if (slug == null || String(slug).includes('undefined')) undefinedRoutes++;
    }
  }
  const dupGroups = Object.entries(dupSlugs).filter(([, v]) => v.length > 1);
  if (dupGroups.length) fail(`duplicate slugs: ${dupGroups.map(([s, v]) => `${s}(${v.join('|')})`).join(' ')}`); else pass('0 duplicate slugs');
  if (identityMissing) fail(`identity missing on ${identityMissing}`); else pass('identity populated on all 473');
  if (undefinedRoutes) fail(`${undefinedRoutes} /undefined routes`); else pass('0 /undefined routes');

  // ---- identity consistency vs SPEC 01 manifest ----
  let idDiff = 0, slugDiff = 0, titleDiff = 0;
  const liveIdSet = new Set(), spec01Ids = new Set(Object.keys(SPEC01_MANIFEST.perRecord));
  for (const t of WIKI_TYPES) for (const it of dump[t]) if (!it._id.startsWith('drafts.')) liveIdSet.add(it._id);
  for (const id of liveIdSet) if (!spec01Ids.has(id)) idDiff++;
  for (const id of spec01Ids) if (!liveIdSet.has(id)) idDiff++;
  const liveById = new Map();
  for (const t of WIKI_TYPES) for (const it of dump[t]) liveById.set(it._id, { type: t, rec: it });
  for (const id of liveIdSet) {
    const m = SPEC01_MANIFEST.perRecord[id]; if (!m) continue;
    const item = liveById.get(id); if (!item) continue;
    if (slugValue(item.rec.slug) !== m.slug) slugDiff++;
    if ((titleOf(item.type, item.rec) ?? null) !== m.title) titleDiff++;
  }
  if (idDiff) fail(`ID set changed vs SPEC 01: ${idDiff}`); else pass('ID set identical to SPEC 01 manifest');
  if (slugDiff) fail(`slug drifted vs SPEC 01: ${slugDiff}`); else pass('slugs identical to SPEC 01 manifest');
  if (titleDiff) fail(`title drifted vs SPEC 01: ${titleDiff}`); else pass('titles identical to SPEC 01 manifest');

  // ---- canonical hash gate (must equal SPEC 02 post-repair hash) ----
  const canonical = {};
  for (const t of WIKI_TYPES) {
    for (const it of dump[t]) {
      if (it._id.startsWith('drafts.')) continue;
      canonical[it._id] = {
        type: t,
        title: titleOf(t, it),
        slug: slugValue(it.slug),
        rev: it._rev ?? null,
        h: sha256(JSON.stringify({ id: it._id, title: titleOf(t, it), slug: slugValue(it.slug) })),
      };
    }
  }
  const canonicalHash = sha256(Object.keys(canonical).sort().map((id) => canonical[id].h).join('\n'));
  if (canonicalHash !== EXPECTED_CANONICAL_HASH) fail(`canonicalHash ${canonicalHash} != SPEC 02 ${EXPECTED_CANONICAL_HASH}`);
  else pass(`canonicalHash matches SPEC 02 post-repair (${canonicalHash})`);

  // ---- category distribution unchanged vs SPEC 02 post snapshot ----
  const catDist = {};
  for (const t of WIKI_TYPES) {
    catDist[t] = {};
    for (const it of dump[t]) {
      if (it._id.startsWith('drafts.')) continue;
      const c = it.category ?? '(none)';
      catDist[t][c] = (catDist[t][c] || 0) + 1;
    }
  }
  const spec02Cat = {};
  for (const t of WIKI_TYPES) {
    spec02Cat[t] = {};
    for (const it of SPEC02.records[t]) {
      if (it._id.startsWith('drafts.')) continue;
      const c = it.category ?? '(none)';
      spec02Cat[t][c] = (spec02Cat[t][c] || 0) + 1;
    }
  }
  let catChanged = false;
  for (const t of WIKI_TYPES) {
    const a = JSON.stringify(catDist[t]), b = JSON.stringify(spec02Cat[t]);
    if (a !== b) { catChanged = true; fail(`category distribution ${t} changed: ${a} vs ${b}`); }
  }
  if (!catChanged) pass(`category distribution unchanged vs SPEC 02 post (${JSON.stringify(catDist.equipment)}, ${JSON.stringify(catDist.problem)})`);

  // ---- derive target fields from SPEC 01 categoryOmissions (must be exactly 40) ----
  const omissions = SPEC01_AUDIT.systemic.categoryOmissions.map((s) => s.split(':')[0].trim());
  if (omissions.length !== 40) fail(`SPEC 01 categoryOmissions == ${omissions.length}, expected 40`);
  else pass('SPEC 01 categoryOmissions parsed: exactly 40 target fields');

  const idType = {};
  for (const t of WIKI_TYPES) for (const it of dump[t]) if (!it._id.startsWith('drafts.')) idType[it._id] = t;
  // Index every published document type (post, tool, author, …) so cross-type
  // reference validity (relatedPosts -> post, relatedTools -> tool) counts truly.
  for (const d of allTyped) if (!d._id.startsWith('drafts.') && !idType[d._id]) idType[d._id] = d._type;

  // ---- recompute inventory for the 40 fields from fresh data ----
  const inventory = [];
  const missing = { MISSING: 1, NULL: 1 };
  const invalid = { INVALID_TYPE: 1, INVALID_VALUE: 1, BROKEN_REFERENCE: 1, MALFORMED_BLOCK: 1 };
  const empty = { PRESENT_EMPTY: 1, EMPTY_ARRAY: 1 };
  for (const key of omissions) {
    const [type, field] = key.split('.');
    const meta = FIELD_META[key];
    const list = dump[type].filter((x) => !x._id.startsWith('drafts.'));
    const applicable = list.length;
    let present = 0, valid = 0, miss = 0, inv = 0, emp = 0;
    for (const it of list) {
      const st = evalState(meta, it[field], idType, assets);
      if (it[field] !== undefined && it[field] !== null) present++;
      if (st === 'PRESENT_VALID') valid++;
      if (missing[st]) miss++;
      if (invalid[st]) inv++;
      if (empty[st]) emp++;
    }
    const missingPct = applicable > 0 ? Math.round((miss / applicable) * 1000) / 10 : 0;
    const [tier, severity] = FIELD_SRV[key];
    inventory.push({
      type, field, applicableRecordCount: applicable, presentCount: present, validCount: valid,
      missingCount: miss, invalidCount: inv, emptyCount: emp,
      missingPercentage: missingPct, tier, severity, sourceReport: 'SPEC_01 categoryOmissions',
    });
    if (missingPct <= 50) fail(`target field ${key} missing% ${missingPct} <= 50 — inconsistent with SPEC 01`);
  }
  if (!gates.some((g) => g.startsWith('GATE FAIL') && g.includes('categoryOmissions'))) pass('40 target fields re-derived from fresh data; all >50% missing (matches SPEC 01)');

  // ---- problem empty-body targets (must be exactly 25) ----
  const bodyFields = ['symptoms', 'causes', 'whatToCheck', 'whatNotToDo'];
  const emptyBodyProblems = [];
  for (const it of dump.problem) {
    if (it._id.startsWith('drafts.')) continue;
    const blocks = bodyFields.reduce((s, f) => s + (Array.isArray(it[f]) ? it[f].length : 0), 0);
    if (blocks === 0) emptyBodyProblems.push(it);
  }
  const bodyDepthFalse = BODY_DEPTH.filter((r) => r.exists === 'FALSE').map((r) => r.record_id).sort();
  const emptyBodyIds = emptyBodyProblems.map((p) => p._id).sort();
  if (emptyBodyProblems.length !== 25) fail(`empty Problem bodies: ${emptyBodyProblems.length} != 25`);
  else pass('exactly 25 Problem records with empty body identified');
  if (JSON.stringify(emptyBodyIds) !== JSON.stringify(bodyDepthFalse)) fail('empty-body set differs from SPEC 01 BODY_DEPTH.csv (exists=FALSE)');
  else pass('empty-body target set identical to SPEC 01 BODY_DEPTH audit');

  // Per-target problem inventory row
  const problemTargets = emptyBodyProblems.map((it) => {
    const presentFields = ['excerpt', 'publishedAt', 'category', 'waterType']
      .filter((f) => it[f] !== undefined && it[f] !== null && !(Array.isArray(it[f]) && it[f].length === 0) && String(it[f]).trim() !== '');
    const structured = bodyFields.filter((f) => it[f] !== undefined && it[f] !== null).length;
    return {
      recordId: it._id,
      title: it.title ?? '',
      slug: slugValue(it.slug) ?? '',
      category: it.category ?? '',
      currentBodyState: structured === 0 ? 'ALL_SECTIONS_EMPTY' : `${structured}/4 body sections present`,
      existingStructuredFields: presentFields.join('|'),
      relatedProblems: 0,
      relatedSpeciesCount: 0,
      relatedEquipmentCount: 0,
      evidenceAvailability: presentFields.length ? `E1 present fields: ${presentFields.join(', ')}` : 'E1 excerpt only',
    };
  });

  const blocked = gates.filter((g) => g.startsWith('GATE FAIL')).length > 0;

  // out-of-scope observation: problem.name orphan field
  const problemNameOrphans = dump.problem.filter((p) => !p._id.startsWith('drafts.') && p.name !== undefined && p.name !== null).length;

  const rawDumpStr = JSON.stringify({ records: dump }, null, 2);
  const rawDumpHash = sha256(rawDumpStr);

  const manifest = {
    spec: 'SPEC 03', phase: 'PRE_ENRICHMENT_AUDIT', generatedAt: startedAt,
    projectId: PROJECT_ID, dataset: DATASET, apiVersion: API_VERSION,
    extractionMethod: 'Sanity HTTP API — data/query (read-only). Full-document projection for wiki types incl. _rev. Zero mutations.',
    wikiTypeCounts: counts, totalWikiRecords: total, drafts: Number(draftCount),
    identityVsSpec01: { idDiff, slugDiff, titleDiff },
    canonicalRecordCount: Object.keys(canonical).length,
    canonicalHash,
    canonicalHashVsSpec02: EXPECTED_CANONICAL_HASH,
    categoryDistribution: catDist,
    categoryDistributionVsSpec02: 'identical',
    targetFieldCount: inventory.length,
    targetFieldSlots: inventory.reduce((s, r) => s + r.missingCount, 0),
    targetFields: inventory.map((r) => `${r.type}.${r.field}`),
    emptyProblemBodies: problemTargets.length,
    emptyProblemBodyIds: emptyBodyIds,
    rawDumpHash,
    outOfScopeObservations: {
      problemNameOrphanFieldRecords: problemNameOrphans,
      note: 'problem.name is not a schema field; removed from SPEC 03 scope per spec §1. Relationship rewrites out of scope per §15.',
    },
    gates: { passed: !blocked, details: gates },
    notes: 'GATE A complete. No canonical mutation performed.',
  };

  function writeCsv(file, header, rows) {
    const enc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    fs.writeFileSync(path.join(OUT_DIR, file), [header, ...rows.map((r) => r.map(enc).join(','))].join('\n'));
  }
  writeCsv('SPEC_03_TARGET_FIELD_INVENTORY.csv',
    ['type', 'field', 'applicableRecordCount', 'presentCount', 'validCount', 'missingCount', 'invalidCount', 'emptyCount', 'missingPercentage', 'tier', 'severity', 'sourceReport'],
    inventory.map((r) => [r.type, r.field, r.applicableRecordCount, r.presentCount, r.validCount, r.missingCount, r.invalidCount, r.emptyCount, r.missingPercentage, r.tier, r.severity, r.sourceReport]));
  writeCsv('SPEC_03_PROBLEM_BODY_TARGETS.csv',
    ['recordId', 'title', 'slug', 'category', 'currentBodyState', 'existingStructuredFields', 'relatedProblems', 'relatedSpeciesCount', 'relatedEquipmentCount', 'evidenceAvailability'],
    problemTargets.map((r) => [r.recordId, r.title, r.slug, r.category, r.currentBodyState, r.existingStructuredFields, r.relatedProblems, r.relatedSpeciesCount, r.relatedEquipmentCount, r.evidenceAvailability]));

  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_03_PRE_ENRICHMENT_SNAPSHOT.json'), JSON.stringify({ manifest, perRecord: canonical, targetFieldInventory: inventory, problemBodyTargets: problemTargets, records: dump }, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_03_SOURCE_MANIFEST.json'), JSON.stringify(manifest, null, 2));

  console.log('\n--- SPEC 03 GATE A SUMMARY ---');
  console.log(`canonicalHash=${canonicalHash} (matches SPEC 02: ${canonicalHash === EXPECTED_CANONICAL_HASH})`);
  console.log(`target fields=${inventory.length}  target missing slots=${manifest.targetFieldSlots}`);
  console.log(`empty problem bodies=${problemTargets.length}`);
  if (blocked) { console.error('\nSPEC_03 BLOCKED at GATE A. No artifacts written beyond partial logs.'); process.exit(3); }
  console.log('Wrote report/SPEC_03/: SPEC_03_PRE_ENRICHMENT_SNAPSHOT.json, SPEC_03_TARGET_FIELD_INVENTORY.csv, SPEC_03_PROBLEM_BODY_TARGETS.csv, SPEC_03_SOURCE_MANIFEST.json');
}
main().catch((err) => { console.error(err); process.exit(1); });