const fs = require('fs');
const path = require('path');

const RAW = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_01', 'raw', 'SPEC_01_RAW_DUMP.json'), 'utf8'));
const records = RAW.records;
const OUT = path.join('report', 'SPEC_01');
fs.mkdirSync(OUT, { recursive: true });

const CATEGORIES = { species: 'Fish / Species', plant: 'Plants', invertebrate: 'Invertebrates', coral: 'Corals', equipment: 'Equipment', problem: 'Problems' };

// ---------------------------------------------------------------------------
// Schema-first model (derived from sanity/schemaTypes/*.ts)
// type: string|text|number|boolean|slug|datetime|arrayString|arrayRef|arrayBlock|image|object|reference
// ---------------------------------------------------------------------------
const S = {
  species: [
    { f: 'name', tier: 'A', t: 'string', req: true },
    { f: 'slug', tier: 'A', t: 'slug', req: true },
    { f: 'scientificName', tier: 'C', t: 'string' },
    { f: 'family', tier: 'C', t: 'string' },
    { f: 'origin', tier: 'C', t: 'string' },
    { f: 'excerpt', tier: 'B', t: 'text' },
    { f: 'localNames', tier: 'B', t: 'arrayString' },
    { f: 'aliases', tier: 'B', t: 'arrayString' },
    { f: 'group', tier: 'C', t: 'string', opts: ['Cichlid', 'Livebearer', 'Catfish', 'Loach', 'Characin', 'Cyprinid', 'Gourami', 'Arowana', 'Puffer', 'Angelfish', 'Tang', 'Wrasse', 'Goby', 'Blenny', 'Shark', 'Rainbowfish', 'Killifish', 'Pleco', 'Other'] },
    { f: 'parentSpecies', tier: 'D', t: 'reference', ref: ['species'] },
    { f: 'publishedAt', tier: 'B', t: 'datetime' },
    { f: 'sizeCm', tier: 'C', t: 'number', min: 0.5, max: 500 },
    { f: 'tankSizeMinL', tier: 'C', t: 'number', min: 1 },
    { f: 'tempMinC', tier: 'C', t: 'number', min: 0, max: 40 },
    { f: 'tempMaxC', tier: 'C', t: 'number', min: 0, max: 40 },
    { f: 'phMin', tier: 'C', t: 'number', min: 3, max: 11 },
    { f: 'phMax', tier: 'C', t: 'number', min: 3, max: 11 },
    { f: 'ghMin', tier: 'C', t: 'number', min: 0, max: 40 },
    { f: 'ghMax', tier: 'C', t: 'number', min: 0, max: 40 },
    { f: 'diet', tier: 'C', t: 'string', opts: ['Carnivore', 'Omnivore', 'Herbivore', 'Micropredator'] },
    { f: 'temperament', tier: 'C', t: 'string', opts: ['Peaceful', 'Semi-aggressive', 'Aggressive'] },
    { f: 'waterZone', tier: 'C', t: 'string', opts: ['Top', 'Middle', 'Bottom', 'All levels'] },
    { f: 'schooling', tier: 'C', t: 'text' },
    { f: 'difficulty', tier: 'C', t: 'string', opts: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
    { f: 'waterType', tier: 'C', t: 'string', req: true, opts: ['freshwater', 'saltwater', 'brackish'] },
    { f: 'aquariumStyle', tier: 'C', t: 'arrayString', opts: ['Community', 'Planted', 'Low-Tech', 'High-Tech / CO2', 'Aquascaping', 'Blackwater', 'Biotope', 'Amazon / South American', 'Southeast Asian', 'African Cichlid', 'Shrimp', 'Betta / Nano', 'Predator', 'Large Fish', 'Native / Regional', 'Fish Only', 'FOWLR', 'Nano Reef', 'Mixed Reef', 'Anemone / Clownfish', 'Marine Predator', 'Pond / Outdoor'] },
    { f: 'region', tier: 'C', t: 'string', opts: ['South America', 'Amazon Basin', 'Central America', 'North America', 'Southeast Asia', 'South Asia', 'East Asia', 'Africa', 'Australia / Oceania', 'Europe', 'Marine Indo-Pacific', 'Red Sea', 'Caribbean / Western Atlantic'] },
    { f: 'isPredator', tier: 'C', t: 'boolean' },
    { f: 'reefCompatibility', tier: 'C', t: 'boolean' },
    { f: 'compatibleSpecies', tier: 'D', t: 'arrayRef', ref: ['species'] },
    { f: 'compatiblePlants', tier: 'D', t: 'arrayRef', ref: ['plant'] },
    { f: 'compatibleInvertebrates', tier: 'D', t: 'arrayRef', ref: ['invertebrate'] },
    { f: 'suitableEquipment', tier: 'D', t: 'arrayRef', ref: ['equipment'] },
    { f: 'relatedProblems', tier: 'D', t: 'arrayRef', ref: ['problem'] },
    { f: 'mainImage', tier: 'B', t: 'image' },
    { f: 'seo', tier: 'E', t: 'object', sub: ['metaTitle', 'metaDescription'] },
    { f: 'relatedPosts', tier: 'D', t: 'arrayRef', ref: ['post'] },
  ],
  plant: [
    { f: 'name', tier: 'A', t: 'string', req: true },
    { f: 'slug', tier: 'A', t: 'slug', req: true },
    { f: 'scientificName', tier: 'C', t: 'string' },
    { f: 'excerpt', tier: 'B', t: 'text' },
    { f: 'localNames', tier: 'B', t: 'arrayString' },
    { f: 'aliases', tier: 'B', t: 'arrayString' },
    { f: 'group', tier: 'C', t: 'string', opts: ['Stem', 'Rosette', 'Rhizome', 'Bulb', 'Moss', 'Fern', 'Floating', 'Epiphyte', 'Carpet', 'Succulent', 'Other'] },
    { f: 'publishedAt', tier: 'B', t: 'datetime' },
    { f: 'light', tier: 'C', t: 'string', opts: ['Low', 'Low-Medium', 'Medium', 'Medium-High', 'High'] },
    { f: 'co2', tier: 'C', t: 'string', opts: ['None', 'Low', 'Medium', 'High'] },
    { f: 'growth', tier: 'C', t: 'string', opts: ['Slow', 'Medium', 'Fast'] },
    { f: 'difficulty', tier: 'C', t: 'string', opts: ['Beginner', 'Intermediate', 'Advanced'] },
    { f: 'placement', tier: 'C', t: 'string', opts: ['Foreground', 'Midground', 'Background', 'Floating', 'Epiphyte'] },
    { f: 'tempMinC', tier: 'C', t: 'number', min: 0, max: 40 },
    { f: 'tempMaxC', tier: 'C', t: 'number', min: 0, max: 40 },
    { f: 'phMin', tier: 'C', t: 'number', min: 3, max: 11 },
    { f: 'phMax', tier: 'C', t: 'number', min: 3, max: 11 },
    { f: 'propagation', tier: 'C', t: 'text' },
    { f: 'aquariumStyle', tier: 'C', t: 'arrayString', opts: ['Community', 'Planted', 'Low-Tech', 'High-Tech / CO2', 'Aquascaping', 'Blackwater', 'Biotope', 'Amazon / South American', 'Shrimp'] },
    { f: 'region', tier: 'C', t: 'string', opts: ['South America', 'Amazon Basin', 'Central America', 'North America', 'Southeast Asia', 'South Asia', 'East Asia', 'Africa', 'Australia / Oceania', 'Europe', 'Cosmopolitan'] },
    { f: 'growthForm', tier: 'C', t: 'string', opts: ['Stem', 'Rosette', 'Rhizome', 'Stolon', 'Bulb', 'Moss', 'Floating', 'Vine / Creeper'] },
    { f: 'redPlant', tier: 'C', t: 'boolean' },
    { f: 'suitableEquipment', tier: 'D', t: 'arrayRef', ref: ['equipment'] },
    { f: 'relatedProblems', tier: 'D', t: 'arrayRef', ref: ['problem'] },
    { f: 'mainImage', tier: 'B', t: 'image' },
    { f: 'relatedPosts', tier: 'D', t: 'arrayRef', ref: ['post'] },
  ],
  invertebrate: [
    { f: 'name', tier: 'A', t: 'string', req: true },
    { f: 'slug', tier: 'A', t: 'slug', req: true },
    { f: 'scientificName', tier: 'C', t: 'string', req: true },
    { f: 'excerpt', tier: 'B', t: 'text' },
    { f: 'localNames', tier: 'B', t: 'arrayString' },
    { f: 'aliases', tier: 'B', t: 'arrayString' },
    { f: 'parentSpecies', tier: 'D', t: 'reference', ref: ['invertebrate'] },
    { f: 'publishedAt', tier: 'B', t: 'datetime' },
    { f: 'waterType', tier: 'C', t: 'string', req: true, opts: ['freshwater', 'saltwater', 'brackish'] },
    { f: 'group', tier: 'C', t: 'string', req: true, opts: ['shrimp', 'snail', 'starfish', 'crab', 'anemone', 'urchin', 'other'] },
    { f: 'sizeCm', tier: 'C', t: 'number', min: 0.1, max: 100 },
    { f: 'tempMinC', tier: 'C', t: 'number', min: 0, max: 40 },
    { f: 'tempMaxC', tier: 'C', t: 'number', min: 0, max: 40 },
    { f: 'phMin', tier: 'C', t: 'number', min: 3, max: 11 },
    { f: 'phMax', tier: 'C', t: 'number', min: 3, max: 11 },
    { f: 'difficulty', tier: 'C', t: 'string', opts: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
    { f: 'diet', tier: 'C', t: 'string', opts: ['Carnivore', 'Omnivore', 'Herbivore', 'Scavenger', 'Detritivore', 'Filter feeder'] },
    { f: 'temperament', tier: 'C', t: 'string', opts: ['Peaceful', 'Semi-aggressive', 'Aggressive'] },
    { f: 'aquariumStyle', tier: 'C', t: 'arrayString', opts: ['Community', 'Shrimp', 'Planted', 'Low-Tech', 'Mixed Reef', 'Invertebrate-focused', 'Fish Only', 'Nano Reef', 'Anemone / Clownfish'] },
    { f: 'region', tier: 'C', t: 'string', opts: ['South America', 'Amazon Basin', 'Southeast Asia', 'South Asia', 'East Asia', 'Africa', 'Marine Indo-Pacific', 'Caribbean / Western Atlantic', 'Red Sea'] },
    { f: 'reefCompatibility', tier: 'C', t: 'boolean' },
    { f: 'compatibleSpecies', tier: 'D', t: 'arrayRef', ref: ['species'] },
    { f: 'suitableEquipment', tier: 'D', t: 'arrayRef', ref: ['equipment'] },
    { f: 'relatedProblems', tier: 'D', t: 'arrayRef', ref: ['problem'] },
    { f: 'mainImage', tier: 'B', t: 'image' },
    { f: 'relatedPosts', tier: 'D', t: 'arrayRef', ref: ['post'] },
  ],
  coral: [
    { f: 'name', tier: 'A', t: 'string', req: true },
    { f: 'slug', tier: 'A', t: 'slug', req: true },
    { f: 'scientificName', tier: 'C', t: 'string' },
    { f: 'excerpt', tier: 'B', t: 'text' },
    { f: 'localNames', tier: 'B', t: 'arrayString' },
    { f: 'aliases', tier: 'B', t: 'arrayString' },
    { f: 'group', tier: 'C', t: 'string', opts: ['LPS', 'SPS', 'Soft', 'NPS', 'Mushroom', 'Anemone', 'Polyp', 'Colony', 'Single Polyp', 'Other'] },
    { f: 'publishedAt', tier: 'B', t: 'datetime' },
    { f: 'light', tier: 'C', t: 'string', opts: ['Low', 'Moderate', 'High', 'Very High'] },
    { f: 'flow', tier: 'C', t: 'string', opts: ['Low', 'Moderate', 'High'] },
    { f: 'difficulty', tier: 'C', t: 'string', opts: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
    { f: 'coralType', tier: 'C', t: 'string', req: true, opts: ['soft', 'lps', 'sps', 'nps'] },
    { f: 'placement', tier: 'C', t: 'string', opts: ['Sand bed', 'Low rock', 'Mid rock', 'High rock'] },
    { f: 'aggression', tier: 'C', t: 'string', opts: ['Peaceful', 'Semi-aggressive', 'Aggressive'] },
    { f: 'reefCompatibility', tier: 'C', t: 'boolean' },
    { f: 'photosynthetic', tier: 'C', t: 'boolean' },
    { f: 'suitableEquipment', tier: 'D', t: 'arrayRef', ref: ['equipment'] },
    { f: 'relatedProblems', tier: 'D', t: 'arrayRef', ref: ['problem'] },
    { f: 'aquariumStyle', tier: 'C', t: 'arrayString', opts: ['Nano Reef', 'Mixed Reef', 'Soft Coral Reef', 'LPS Reef', 'SPS Reef', 'NPS', 'Anemone / Clownfish', 'Invertebrate-focused'] },
    { f: 'tempMinC', tier: 'C', t: 'number', min: 0, max: 35 },
    { f: 'tempMaxC', tier: 'C', t: 'number', min: 0, max: 35 },
    { f: 'mainImage', tier: 'B', t: 'image' },
    { f: 'relatedPosts', tier: 'D', t: 'arrayRef', ref: ['post'] },
  ],
  equipment: [
    { f: 'name', tier: 'A', t: 'string', req: true },
    { f: 'slug', tier: 'A', t: 'slug', req: true },
    { f: 'brand', tier: 'C', t: 'string' },
    { f: 'model', tier: 'C', t: 'string' },
    { f: 'category', tier: 'A', t: 'string', req: true, opts: ['Filter', 'Light', 'Pump', 'Heater', 'CO₂ System', 'Substrate', 'Test Kit', 'Other'] },
    { f: 'excerpt', tier: 'B', t: 'text' },
    { f: 'publishedAt', tier: 'B', t: 'datetime' },
    { f: 'flowRateLh', tier: 'C', t: 'number' },
    { f: 'powerW', tier: 'C', t: 'number' },
    { f: 'tankSizeMinL', tier: 'C', t: 'number' },
    { f: 'tankSizeMaxL', tier: 'C', t: 'number' },
    { f: 'aquariumStyle', tier: 'C', t: 'arrayString', opts: ['Community', 'Planted', 'Low-Tech', 'High-Tech / CO2', 'Aquascaping', 'Mixed Reef', 'SPS Reef', 'Fish Only', 'FOWLR', 'Pond / Outdoor'] },
    { f: 'pros', tier: 'C', t: 'arrayString' },
    { f: 'cons', tier: 'C', t: 'arrayString' },
    { f: 'mainImage', tier: 'B', t: 'image' },
    { f: 'relatedPosts', tier: 'D', t: 'arrayRef', ref: ['post'] },
  ],
  problem: [
    { f: 'title', tier: 'A', t: 'string', req: true },
    { f: 'slug', tier: 'A', t: 'slug', req: true },
    { f: 'excerpt', tier: 'B', t: 'text' },
    { f: 'publishedAt', tier: 'B', t: 'datetime' },
    { f: 'category', tier: 'A', t: 'string', req: true, opts: ['water', 'algae', 'plants', 'fish', 'equipment'] },
    { f: 'waterType', tier: 'C', t: 'string', opts: ['freshwater', 'saltwater', 'both'] },
    { f: 'symptoms', tier: 'C', t: 'arrayBlock' },
    { f: 'causes', tier: 'C', t: 'arrayBlock' },
    { f: 'whatToCheck', tier: 'C', t: 'arrayBlock' },
    { f: 'whatNotToDo', tier: 'C', t: 'arrayBlock' },
    { f: 'relatedPosts', tier: 'D', t: 'arrayRef', ref: ['post'] },
    { f: 'relatedTools', tier: 'D', t: 'arrayRef', ref: ['tool'] },
  ],
};

const TIER_WEIGHT = { A: 20, B: 15, C: 35, D: 15, E: 15 };
const SEV = {
  A: { MISSING: 'CRITICAL', NULL: 'CRITICAL', INVALID_TYPE: 'CRITICAL', INVALID_VALUE: 'CRITICAL', PRESENT_EMPTY: 'HIGH', EMPTY_ARRAY: 'HIGH', BROKEN_REFERENCE: 'CRITICAL', MALFORMED_BLOCK: 'CRITICAL' },
  B: { MISSING: 'MEDIUM', NULL: 'MEDIUM', INVALID_TYPE: 'MEDIUM', INVALID_VALUE: 'MEDIUM', PRESENT_EMPTY: 'MEDIUM', EMPTY_ARRAY: 'MEDIUM' },
  C: { MISSING: 'MEDIUM', NULL: 'MEDIUM', INVALID_TYPE: 'MEDIUM', INVALID_VALUE: 'HIGH', PRESENT_EMPTY: 'HIGH', EMPTY_ARRAY: 'MEDIUM', BROKEN_REFERENCE: 'HIGH', MALFORMED_BLOCK: 'HIGH' },
  D: { MISSING: 'LOW', NULL: 'LOW', INVALID_TYPE: 'LOW', INVALID_VALUE: 'LOW', PRESENT_EMPTY: 'LOW', EMPTY_ARRAY: 'LOW', BROKEN_REFERENCE: 'HIGH', MALFORMED_BLOCK: 'HIGH' },
  E: { MISSING: 'LOW', NULL: 'LOW', INVALID_TYPE: 'LOW', INVALID_VALUE: 'LOW', PRESENT_EMPTY: 'LOW', EMPTY_ARRAY: 'LOW' },
};
const CLASS_RULES = [
  { min: 80, label: 'STRUCTURALLY_COMPLETE' },
  { min: 60, label: 'MINOR_GAPS' },
  { min: 40, label: 'MODERATE_GAPS' },
  { min: 20, label: 'MAJOR_GAPS' },
  { min: 0, label: 'CRITICAL_STRUCTURAL_GAPS' },
];

// index of everything
const idType = {};        // id -> type (any doc)
for (const [type, items] of Object.entries(records)) for (const it of items) idType[it._id] = type;
const assets = new Set();
for (const a of records.sanityImageAsset) assets.add(a._id);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const validSlug = (s) => s != null && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
const norm = (v) => (v == null ? null : String(v).trim().toLowerCase().replace(/\s+/g, ' '));
const isoDate = (s) => typeof s === 'string' && !isNaN(Date.parse(s));

function escCsv(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// ---- field state evaluator ----
function evalState(cfg, item, ctx) {
  const v = item[cfg.f];
  if (v === undefined) return 'MISSING';
  if (v === null) return 'NULL';
  switch (cfg.t) {
    case 'string': case 'text': {
      if (typeof v !== 'string') return 'INVALID_TYPE';
      if (v.trim() === '') return 'PRESENT_EMPTY';
      if (cfg.opts && !cfg.opts.includes(v)) return 'INVALID_VALUE';
      return 'PRESENT_VALID';
    }
    case 'slug': {
      if (typeof v !== 'object' || v === null || typeof v.current !== 'string') return 'INVALID_TYPE';
      if (v.current.trim() === '') return 'PRESENT_EMPTY';
      if (!validSlug(v.current)) return 'INVALID_VALUE';
      return 'PRESENT_VALID';
    }
    case 'number': {
      if (typeof v !== 'number' || isNaN(v)) return 'INVALID_TYPE';
      if (cfg.min != null && v < cfg.min) return 'INVALID_VALUE';
      if (cfg.max != null && v > cfg.max) return 'INVALID_VALUE';
      return 'PRESENT_VALID';
    }
    case 'boolean': return typeof v === 'boolean' ? 'PRESENT_VALID' : 'INVALID_TYPE';
    case 'datetime': {
      if (typeof v !== 'string') return 'INVALID_TYPE';
      if (v.trim() === '') return 'PRESENT_EMPTY';
      if (!isoDate(v)) return 'INVALID_VALUE';
      return 'PRESENT_VALID';
    }
    case 'arrayString': {
      if (!Array.isArray(v)) return 'INVALID_TYPE';
      if (v.length === 0) return 'EMPTY_ARRAY';
      for (const e of v) if (typeof e !== 'string' || e.trim() === '' || (cfg.opts && !cfg.opts.includes(e))) return 'INVALID_VALUE';
      return 'PRESENT_VALID';
    }
    case 'arrayRef': {
      if (!Array.isArray(v)) return 'INVALID_TYPE';
      if (v.length === 0) return 'EMPTY_ARRAY';
      for (const r of v) {
        if (!r || typeof r !== 'object' || typeof r._ref !== 'string') return 'BROKEN_REFERENCE';
        if (!idType[r._ref]) return 'BROKEN_REFERENCE';
      }
      return 'PRESENT_VALID';
    }
    case 'arrayBlock': {
      if (!Array.isArray(v)) return 'INVALID_TYPE';
      if (v.length === 0) return 'EMPTY_ARRAY';
      for (const b of v) {
        if (!b || typeof b !== 'object' || typeof b._type !== 'string' || b._type !== 'block') return 'MALFORMED_BLOCK';
        if (!Array.isArray(b.children)) return 'MALFORMED_BLOCK';
        for (const c of b.children) if (!c || typeof c !== 'object' || typeof c.text !== 'string' && (!c._type || typeof c._type !== 'string')) return 'MALFORMED_BLOCK';
      }
      return 'PRESENT_VALID';
    }
    case 'image': {
      if (typeof v !== 'object') return 'INVALID_TYPE';
      const asset = v.asset;
      if (!asset) return 'PRESENT_EMPTY';
      if (typeof asset !== 'object' || typeof asset._ref !== 'string') return 'INVALID_TYPE';
      if (!assets.has(asset._ref)) return 'BROKEN_REFERENCE';
      return 'PRESENT_VALID';
    }
    case 'object': {
      if (typeof v !== 'object') return 'INVALID_TYPE';
      const subVals = (cfg.sub || []).map((s) => v[s]).filter((x) => x != null && String(x).trim() !== '');
      return subVals.length ? 'PRESENT_VALID' : 'PRESENT_EMPTY';
    }
    case 'reference': {
      if (typeof v !== 'object' || typeof v._ref !== 'string') return 'INVALID_TYPE';
      if (!idType[v._ref]) return 'BROKEN_REFERENCE';
      return 'PRESENT_VALID';
    }
    default: return 'PRESENT_VALID';
  }
}
function severity(cfg, state) {
  const base = (SEV[cfg.tier] || {})[state] || 'LOW';
  if (cfg.req) {
    if (cfg.tier === 'A' && ['MISSING', 'NULL', 'INVALID_TYPE', 'INVALID_VALUE'].includes(state)) return 'CRITICAL';
    if (cfg.tier !== 'A' && ['MISSING', 'NULL', 'INVALID_TYPE'].includes(state) && base === 'MEDIUM') return 'HIGH';
  }
  return base;
}
const validStates = new Set(['NOT_APPLICABLE']);
function imageClass(cfg, item) {
  const v = item.mainImage;
  if (!v || !v.asset) return 'NO_IMAGE';
  if (typeof v.asset._ref !== 'string' || !assets.has(v.asset._ref)) return 'INVALID_IMAGE_REF';
  return v.alt && String(v.alt).trim() !== '' ? 'IMAGE_PRESENT_VALID' : 'IMAGE_PRESENT_NO_ALT';
}

// ---------------------------------------------------------------------------
// build per-field weights (renormalized over applicable fields per type)
// ---------------------------------------------------------------------------
const typeWeights = {};
for (const [type, fields] of Object.entries(S)) {
  const tierCount = {};
  for (const c of fields) tierCount[c.tier] = (tierCount[c.tier] || 0) + 1;
  typeWeights[type] = fields.map((c) => ({ ...c, w: TIER_WEIGHT[c.tier] / tierCount[c.tier] }));
}
const applicableWeight = (type) => typeWeights[type].reduce((s, c) => s + c.w, 0);

// ---------------------------------------------------------------------------
// write schema matrix
// ---------------------------------------------------------------------------
const smatRows = [];
for (const [type, fields] of Object.entries(S)) {
  for (const c of fields) {
    smatRows.push({
      document_type: type, field_name: c.f, field_type: c.t,
      required_in_schema: c.req ? 'TRUE' : 'FALSE',
      array_or_scalar: c.t.startsWith('array') ? 'array' : c.t === 'reference' || c.t === 'image' || c.t === 'object' ? c.t : 'scalar',
      nullable: c.req ? 'FALSE' : 'TRUE',
      applicable_scope: CATEGORIES[type],
      depth_tier: c.tier,
      audit_rule: c.req ? 'required' : 'optional',
    });
  }
}
let csvOut = smatRows.map((r) => ['document_type', 'field_name', 'field_type', 'required_in_schema', 'array_or_scalar', 'nullable', 'applicable_scope', 'depth_tier', 'audit_rule'].map((h) => escCsv(r[h])).join(','));
fs.writeFileSync(path.join(OUT, 'SPEC_01_SCHEMA_FIELD_MATRIX.csv'), 'document_type,field_name,field_type,required_in_schema,array_or_scalar,nullable,applicable_scope,depth_tier,audit_rule\n' + csvOut.join('\n') + '\n');

// ---------------------------------------------------------------------------
// iterate records
// ---------------------------------------------------------------------------
const valid = new Set(['PRESENT_VALID']);
const missingSet = new Set(['MISSING', 'NULL']);
const emptySet = new Set(['PRESENT_EMPTY', 'EMPTY_ARRAY', 'INVALID_TYPE']); // INVALID_TYPE counts as invalid
const invalidSet = new Set(['INVALID_TYPE', 'INVALID_VALUE', 'BROKEN_REFERENCE', 'MALFORMED_BLOCK']);

const recordDepth = [];
const bodyRows = [];
const relationRows = [];
const issues = [];
let issueSeq = 0;
const perCat = {};

for (const type of Object.keys(S)) {
  const fields = typeWeights[type];
  const items = records[type].filter((x) => !x._id.startsWith('drafts.'));
  const catSummary = perCat[type] = {
    category: CATEGORIES[type], total: items.length,
    tierCount: {}, tierPop: { A: 0, B: 0, C: 0, D: 0, E: 0 },
    tierApplicable: { A: 0, B: 0, C: 0, D: 0, E: 0 },
    populated: 0, applicable: 0, missing: 0, empty: 0, invalid: 0,
    classCount: {},
  };
  for (const c of fields) catSummary.tierApplicable[c.tier]++;

  for (const it of items) {
    const id = it._id;
    const perTier = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    const states = {};
    let pop = 0, miss = 0, emp = 0, inv = 0;
    let wPop = 0, wTotal = applicableWeight(type);
    let imageClassVal = 'NO_IMAGE';

    for (const c of fields) {
      const st = evalState(c, it);
      states[c.f] = st;
      if (valid.has(st)) { pop++; perTier[c.tier]++; wPop += c.w; }
      else if (missingSet.has(st)) miss++;
      else if (invalidSet.has(st)) inv++;
      else if (emptySet.has(st)) emp++;
      if (st !== 'PRESENT_VALID') {
        const sev = severity(c, st);
        issues.push({
          issue_id: `I${String(++issueSeq).padStart(4, '0')}`, severity: sev, category: CATEGORIES[type],
          record_id: id, title: titleOf(type, it) ?? '', field: c.f, state: st, tier: c.tier,
          required_in_schema: c.req ? 'TRUE' : 'FALSE', field_type: c.t,
          description: `${c.f} — ${st}${c.req ? ' (required)' : ''}`,
          evidence: (JSON.stringify(it[c.f]) || '').slice(0, 200),
        });
      }
      if (c.f === 'mainImage') imageClassVal = imageClass(c, it);
    }

    const pct = wTotal > 0 ? Math.round((wPop / wTotal) * 1000) / 10 : 0;
    const cls = (CLASS_RULES.find((r) => pct >= r.min) || CLASS_RULES[CLASS_RULES.length - 1]).label;
    catSummary.classCount[cls] = (catSummary.classCount[cls] || 0) + 1;
    catSummary.populated += pop; catSummary.applicable += fields.length;
    catSummary.missing += miss; catSummary.empty += emp; catSummary.invalid += inv;
    for (const t of Object.keys(perTier)) { catSummary.tierPop[t] += perTier[t]; }

    recordDepth.push({
      document_type: type, canonical_id: id, title: titleOf(type, it) ?? '', slug: slugValue(it.slug) ?? '',
      category_value: it.category ?? it.group ?? '', applicable_fields: fields.length,
      populated_fields: pop, missing_fields: miss, empty_fields: emp, invalid_fields: inv,
      completeness_percent: pct, classification: cls, image_class: imageClassVal,
      tier_A: perTier.A, tier_B: perTier.B, tier_C: perTier.C, tier_D: perTier.D, tier_E: perTier.E,
      states: Object.entries(states).map(([f, s]) => `${f}:${s}`).join('|'),
    });

    // ---- body audit (problems only) ----
    if (type === 'problem') {
      const secs = ['symptoms', 'causes', 'whatToCheck', 'whatNotToDo'];
      let totalBlocks = 0, textBlocks = 0, headings = 0, lists = 0, links = 0, imgs = 0, malformed = 0, unsupported = 0, words = 0;
      const perSec = {};
      for (const sec of secs) {
        const arr = Array.isArray(it[sec]) ? it[sec] : null;
        const blocks = arr || [];
        perSec[sec] = blocks.length;
        totalBlocks += blocks.length;
        for (const b of blocks) {
          if (!b || b._type !== 'block' || !Array.isArray(b.children)) { malformed++; continue; }
          textBlocks++;
          if (b.style && b.style.startsWith('h')) headings++;
          if (b.listItem) lists++;
          for (const md of b.markDefs || []) if (md._type === 'link') links++;
          if (b._type !== 'block') unsupported++;
          for (const ch of b.children) {
            if (ch._type === 'span' && typeof ch.text === 'string') words += ch.text.split(/\s+/).filter(Boolean).length;
            if (ch._type && ch._type !== 'span') unsupported++;
          }
        }
      }
      bodyRows.push({
        record_id: id, title: titleOf(type, it) ?? '', exists: totalBlocks > 0 ? 'TRUE' : 'FALSE',
        block_count: totalBlocks, text_block_count: textBlocks, heading_count: headings,
        list_count: lists, link_count: links, image_count: imgs, malformed_blocks: malformed,
        unsupported_blocks: unsupported, word_count: words,
        symptoms_blocks: perSec.symptoms, causes_blocks: perSec.causes,
        whatToCheck_blocks: perSec.whatToCheck, whatNotToDo_blocks: perSec.whatNotToDo,
      });
    }

    // ---- relationship audit ----
    for (const c of fields) {
      if (!['arrayRef', 'reference'].includes(c.t)) continue;
      const v = it[c.f];
      const arr = Array.isArray(v) ? v : v ? [v] : [];
      for (const r of arr) {
        if (!r || typeof r !== 'object' || typeof r._ref !== 'string') {
          relationRows.push({ source_type: type, source_id: id, source_title: titleOf(type, it) ?? '', field: c.f, target_type: 'INVALID', target_id: '', target_exists: 'FALSE', target_reachable: 'FALSE', target_category_valid: 'FALSE', schema_compatible: 'FALSE' });
          continue;
        }
        const tid = r._ref;
        const ttype = idType[tid] || 'UNKNOWN';
        const tRec = (records[ttype] || []).find((x) => x._id === tid);
        const tSlug = validSlug(slugValue(tRec?.slug)) && tSlugNotUndef(tRec, ttype);
        const tCat = ttype === 'equipment' ? (tRec?.category != null) : ttype === 'problem' ? (tRec?.category != null) : 'N/A';
        relationRows.push({
          source_type: type, source_id: id, source_title: titleOf(type, it) ?? '', field: c.f,
          target_type: ttype, target_id: tid, target_exists: idType[tid] ? 'TRUE' : 'FALSE',
          target_reachable: tSlug ? 'TRUE' : 'FALSE',
          target_category_valid: ttype === 'INVALID' || !idType[tid] ? 'FALSE' : tCat === 'N/A' ? 'N/A' : tCat ? 'TRUE' : 'FALSE',
          schema_compatible: (c.ref || []).includes(ttype) ? 'TRUE' : 'FALSE',
        });
      }
    }
  }
  perCat[type].tierAvailable = fields.length;
}

function tSlugNotUndef(rec, type) {
  if (!rec) return false;
  const s = slugValue(rec.slug);
  return s && !String(s).includes('undefined');
}

// ---------------------------------------------------------------------------
// write CSVs
// ---------------------------------------------------------------------------
function writeCsv(file, header, rows) {
  fs.writeFileSync(path.join(OUT, file), header + '\n' + rows.map((r) => header.split(',').map((h) => escCsv(r[h])).join(',')).join('\n') + '\n');
}
writeCsv('SPEC_01_RECORD_DEPTH.csv', 'document_type,canonical_id,title,slug,category_value,applicable_fields,populated_fields,missing_fields,empty_fields,invalid_fields,completeness_percent,classification,image_class,tier_A,tier_B,tier_C,tier_D,tier_E,states', recordDepth);
writeCsv('SPEC_01_BODY_DEPTH.csv', 'record_id,title,exists,block_count,text_block_count,heading_count,list_count,link_count,image_count,malformed_blocks,unsupported_blocks,word_count,symptoms_blocks,causes_blocks,whatToCheck_blocks,whatNotToDo_blocks', bodyRows);
writeCsv('SPEC_01_RELATIONSHIP_AUDIT.csv', 'source_type,source_id,source_title,field,target_type,target_id,target_exists,target_reachable,target_category_valid,schema_compatible', relationRows);

const catRows = [];
for (const [type, c] of Object.entries(perCat)) {
  let ws = 0;
  for (const c2 of typeWeights[type]) ws += c2.w;
  catRows.push({
    category: c.category, document_type: type, total_records: c.total,
    applicable_field_slots: c.applicable, populated_slots: c.populated, missing_slots: c.missing,
    empty_slots: c.empty, invalid_slots: c.invalid,
    avg_completeness_percent: Math.round((c.populated / c.applicable) * 1000) / 10, // note: unweighted avg; weighted avg in report
    tier_A_pop: `${c.tierPop.A}/${c.tierApplicable.A * c.total}`,
    tier_B_pop: `${c.tierPop.B}/${c.tierApplicable.B * c.total}`,
    tier_C_pop: `${c.tierPop.C}/${c.tierApplicable.C * c.total}`,
    tier_D_pop: `${c.tierPop.D}/${c.tierApplicable.D * c.total}`,
    tier_E_pop: `${c.tierPop.E}/${c.tierApplicable.E * c.total}`,
    structural: Object.entries(c.classCount).map(([k, v]) => `${k}:${v}`).join(' '),
  });
}
writeCsv('SPEC_01_CATEGORY_SUMMARY.csv', 'category,document_type,total_records,applicable_field_slots,populated_slots,missing_slots,empty_slots,invalid_slots,avg_completeness_percent,tier_A_pop,tier_B_pop,tier_C_pop,tier_D_pop,tier_E_pop,structural', catRows);

writeCsv('SPEC_01_ISSUES.csv', 'issue_id,severity,category,record_id,title,field,state,tier,required_in_schema,field_type,description,evidence', issues);

// ---------------------------------------------------------------------------
// systemic patterns (computed; summarized in report)
// ---------------------------------------------------------------------------
const systemic = { schemaProblems: [], dataProblems: [], editorialProblems: [], unusedFields: [], categoryOmissions: [], inconsistentTypes: [], recurringRel: [], orphanFields: [] };
const P = {};
for (const [type, fields] of Object.entries(S)) {
  for (const c of fields) {
    const key = `${type}.${c.f}`;
    P[key] = { type, field: c.f, tier: c.tier, t: c.t, req: c.req, total: 0, present: 0, valid: 0, typeViol: 0, states: {} };
    const row = P[key];
    const list = (records[type] || []).filter((x) => !x._id.startsWith('drafts.'));
    row.total = list.length;
    for (const it of list) {
      const st = evalState(c, it);
      row.states[st] = (row.states[st] || 0) + 1;
      if (it[c.f] !== undefined && it[c.f] !== null) row.present++;
      if (st === 'PRESENT_VALID') row.valid++;
      if (st === 'INVALID_TYPE') row.typeViol++;
    }
  }
}
// orphan fields: data carries keys the schema does not define (e.g. problem.name, plant.parentSpecies)
const SCHEMA_KEYS = {};
for (const [type, fields] of Object.entries(S)) SCHEMA_KEYS[type] = new Set(fields.map((c) => c.f));
for (const [type, list] of Object.entries(records)) {
  if (!SCHEMA_KEYS[type]) continue;
  for (const it of list) {
    if (it._id.startsWith('drafts.')) continue;
    for (const k of Object.keys(it)) {
      if (k.startsWith('_')) continue;
      if (!SCHEMA_KEYS[type].has(k)) systemic.orphanFields.push(`${type}.${k} (id ${it._id})`);
    }
  }
}
for (const [key, p] of Object.entries(P)) {
  const { type, field } = p;
  if (p.valid === 0 && p.total >= 10) systemic.schemaProblems.push(`${key}: 0/${p.total} valid — schema field present but never populated`);
  if (p.valid === 0 && type === 'species' && field === 'seo') systemic.unusedFields.push(`${key} (0/${p.total})`);
  const omRate = 1 - p.valid / p.total;
  if (p.total >= 10 && omRate > 0.5 && !p.req) systemic.categoryOmissions.push(`${key}: ${p.valid}/${p.total} populated (${Math.round(omRate * 100)}% omitted)`);
  if (p.typeViol > 0) systemic.inconsistentTypes.push(`${key}: ${p.typeViol} type violations`);
}
const brokenByField = {};
for (const r of relationRows) if (r.target_exists === 'FALSE' || r.schema_compatible === 'FALSE') { const k = `${r.source_type}/${r.field}->${r.target_type}`; brokenByField[k] = (brokenByField[k] || 0) + 1; }
systemic.recurringRel = Object.entries(brokenByField).map(([k, v]) => `${k} (${v})`);
systemic.editorialProblems.push(`problems empty body: ${bodyRows.filter((r) => r.exists === 'FALSE').length}/${bodyRows.length}`);

const finalIssues = {
  generatedAt: new Date().toISOString(),
  schemaMatrixFields: smatRows.length,
  recordRows: recordDepth.length,
  bodyRows: bodyRows.length,
  relationRows: relationRows.length,
  issueCount: issues.length,
  severityCounts: issues.reduce((a, e) => { a[e.severity] = (a[e.severity] || 0) + 1; return a; }, {}),
  classificationThresholds: CLASS_RULES.map((r) => `>=${r.min}:${r.label}`),
  tierWeights: TIER_WEIGHT,
  categorySummary: catRows.map((r) => ({ category: r.category, total: r.total_records, avg: r.avg_completeness_percent, structural: r.structural })),
  systemic,
};
fs.writeFileSync(path.join(OUT, 'SPEC_01_AUDIT_OUTPUT.json'), JSON.stringify(finalIssues, null, 2));
fs.writeFileSync(path.join(OUT, 'SPEC_01_RECORD_SCORES.json'), JSON.stringify(
  recordDepth.map((r) => ({ canonical_id: r.canonical_id, completeness_percent: r.completeness_percent, classification: r.classification, applicable_fields: r.applicable_fields, populated_fields: r.populated_fields })),
  null, 2));

console.log(`Bucketed issues severity: ${JSON.stringify(finalIssues.severityCounts)}`);
console.log(`Issues total: ${issues.length} | record rows: ${recordDepth.length} | body rows: ${bodyRows.length} | relationship rows: ${relationRows.length}`);
console.log('\nCompleteness distribution by category (unweighted populated slots):');
for (const r of catRows) console.log(`  ${r.category.padEnd(18)} n=${r.total_records} app=${r.applicable_field_slots} pop=${r.populated_slots} avg=${r.avg_completeness_percent}%  ${r.structural}`);
console.log('\nSystemic highlights:');
console.log('  unused schema fields:', systemic.unusedFields.length ? systemic.unusedFields.join('; ') : 'none');
console.log('  category omissions (fields missing in >50%):', systemic.categoryOmissions.length);
console.log('  type violations:', systemic.inconsistentTypes.length ? systemic.inconsistentTypes.join('; ') : 'none');
console.log('  recurring broken/schema-incompatible relationships:', systemic.recurringRel.length ? systemic.recurringRel.join('; ') : 'none');
console.log('\nWrote SPEC_01_SCHEMA_FIELD_MATRIX.csv, SPEC_01_RECORD_DEPTH.csv, SPEC_01_BODY_DEPTH.csv, SPEC_01_RELATIONSHIP_AUDIT.csv, SPEC_01_CATEGORY_SUMMARY.csv, SPEC_01_ISSUES.csv, SPEC_01_AUDIT_OUTPUT.json');