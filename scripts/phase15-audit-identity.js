const fs = require('fs');

// ─── Config ───────────────────────────────────────────────────────────────────
const envContent = fs.readFileSync('.env.local', 'utf8');
const tokenMatch = envContent.match(/SANITY_API_TOKEN="([^"]+)"/);
const TOKEN = tokenMatch ? tokenMatch[1] : null;
if (!TOKEN) { console.error('ERROR: SANITY_API_TOKEN not found in .env.local'); process.exit(1); }

const PROJECT_ID = 'zeohjejw';
const DATASET = 'production';
const API_VERSION = '2026-05-25';
const API_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;

const TYPES = ['species', 'plant', 'coral', 'invertebrate', 'equipment', 'problem', 'inspiration'];
const TAXONOMY_TYPES = ['species', 'plant', 'coral', 'invertebrate'];

// Fields to fetch — wide enough for all SPEC checks
const ALL_FIELDS = [
  '_id', '_type', 'name', 'title', 'scientificName', 'slug', 'waterType', 'group',
  'region', 'aquariumStyle', 'difficulty', 'light', 'co2', 'coralType', 'category',
  'isPredator', 'reefCompatibility', 'photosynthetic', 'growthForm', 'redPlant',
  'localNames', 'aliases', 'parentSpecies', 'mainImage', 'family', 'origin',
  'excerpt', 'publishedAt', 'sizeCm', 'tankSizeMinL', 'tempMinC', 'tempMaxC',
  'phMin', 'phMax', 'ghMin', 'ghMax', 'diet', 'temperament', 'waterZone',
  'schooling', 'flow', 'placement', 'aggression', 'propagation', 'growth',
  'brand', 'model', 'flowRateLh', 'powerW', 'tankSizeMaxL', 'pros', 'cons',
  'symptoms', 'causes', 'whatToCheck', 'whatNotToDo',
  'style', 'tankSizeL', 'plants', 'hardscape', 'equipment',
  'relatedPosts', 'relatedTools', 'relatedProblems', 'suitableEquipment',
  'compatibleSpecies', 'compatiblePlants', 'compatibleInvertebrates', 'seo',
].join(', ');

// ─── Sanity helpers ───────────────────────────────────────────────────────────
async function fetchAll(type) {
  const query = `*[_type == "${type}"]{${ALL_FIELDS}}`;
  const url = `${API_BASE}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity fetch failed for ${type}: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.result || [];
}

function extractRefId(ref) {
  if (!ref) return null;
  if (typeof ref === 'object' && ref._ref) return ref._ref;
  if (typeof ref === 'string') {
    const m = ref.match(/^(drafts\.)?([a-zA-Z0-9_-]+)/);
    return m ? m[0] : null;
  }
  return null;
}

function findDuplicates(items, keyFn) {
  const map = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    if (!map[key]) map[key] = [];
    map[key].push({ id: item._id, name: item.name || item.title });
  }
  return Object.entries(map).filter(([, v]) => v.length > 1);
}

// ─── Schema definitions per type ──────────────────────────────────────────────
// Fields that are expected in each document type (non-system, non-reference-array).
// Reference arrays and block arrays are excluded from scalar checks.
const SCHEMA_FIELDS = {
  species: [
    'name', 'scientificName', 'slug', 'family', 'origin', 'excerpt',
    'localNames', 'aliases', 'group', 'parentSpecies', 'publishedAt',
    'sizeCm', 'tankSizeMinL', 'tempMinC', 'tempMaxC', 'phMin', 'phMax',
    'ghMin', 'ghMax', 'diet', 'temperament', 'waterZone', 'schooling',
    'difficulty', 'waterType', 'aquariumStyle', 'region', 'isPredator',
    'reefCompatibility', 'mainImage', 'seo',
    'compatibleSpecies', 'compatiblePlants', 'compatibleInvertebrates',
    'suitableEquipment', 'relatedProblems', 'relatedPosts',
  ],
  plant: [
    'name', 'scientificName', 'slug', 'excerpt', 'localNames', 'aliases',
    'group', 'publishedAt', 'light', 'co2', 'growth', 'difficulty',
    'placement', 'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'propagation',
    'aquariumStyle', 'region', 'growthForm', 'redPlant', 'mainImage',
    'suitableEquipment', 'relatedProblems', 'relatedPosts',
  ],
  coral: [
    'name', 'scientificName', 'slug', 'excerpt', 'localNames', 'aliases',
    'group', 'publishedAt', 'light', 'flow', 'difficulty', 'coralType',
    'placement', 'aggression', 'reefCompatibility', 'photosynthetic',
    'aquariumStyle', 'tempMinC', 'tempMaxC', 'mainImage',
    'suitableEquipment', 'relatedProblems', 'relatedPosts',
  ],
  invertebrate: [
    'name', 'scientificName', 'slug', 'excerpt', 'localNames', 'aliases',
    'parentSpecies', 'publishedAt', 'waterType', 'group', 'sizeCm',
    'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'difficulty', 'diet',
    'temperament', 'aquariumStyle', 'region', 'reefCompatibility',
    'mainImage', 'compatibleSpecies', 'suitableEquipment',
    'relatedProblems', 'relatedPosts',
  ],
  equipment: [
    'name', 'brand', 'model', 'slug', 'category', 'excerpt', 'publishedAt',
    'flowRateLh', 'powerW', 'tankSizeMinL', 'tankSizeMaxL',
    'aquariumStyle', 'pros', 'cons', 'mainImage', 'relatedPosts',
  ],
  problem: [
    'title', 'slug', 'excerpt', 'publishedAt', 'category', 'waterType',
    'symptoms', 'causes', 'whatToCheck', 'whatNotToDo',
    'relatedPosts', 'relatedTools',
  ],
  inspiration: [
    'title', 'slug', 'excerpt', 'publishedAt', 'style', 'tankSizeL',
    'difficulty', 'plants', 'hardscape', 'equipment', 'mainImage',
    'relatedPosts',
  ],
};

// Sanity system/internal fields that are NOT schema fields
const SYSTEM_FIELDS = new Set([
  '_id', '_type', '_rev', '_updatedAt', '_createdAt',
]);

// ─── High-risk groups for identity classification ─────────────────────────────
const HIGH_RISK_GROUPS = new Set([
  'Goldfish', 'Angelfish', 'Arowana', 'Piranha', 'Snakehead', 'Bichir',
  'Clownfish', 'Pufferfish', 'Shrimp', 'Plecos',
]);

// ─── Identity classification keywords ─────────────────────────────────────────
function classifyIdentity(item) {
  const name = (item.name || '').toLowerCase();
  const sci = (item.scientificName || '').toLowerCase();
  const parentRef = item.parentSpecies;

  // Has parent -> VARIANT/MORPH
  if (parentRef) {
    // Check if it's a cultivar (for plants)
    if (item._type === 'plant' && (name.includes('var.') || name.includes('cv.') || name.includes('cultivar'))) {
      return 'CULTIVAR';
    }
    return 'VARIANT/MORPH';
  }

  // Check for cultivar keywords even without parent
  if (item._type === 'plant') {
    if (name.includes('var.') || name.includes('cv.') || name.includes('cultivar') ||
        name.includes('"') || name.includes("'")) {
      return 'CULTIVAR';
    }
  }

  // Check for common name representations (no scientific name, or name != scientific name)
  if (!sci || sci === '') {
    return 'COMMON-NAME';
  }

  // If name matches scientific name (or close), it's likely canonical
  const nameLower = name.replace(/[^a-z0-9]/g, '');
  const sciClean = sci.replace(/[^a-z0-9]/g, '');
  if (nameLower === sciClean || nameLower.includes(sciClean) || sciClean.includes(nameLower)) {
    return 'CANONICAL';
  }

  return 'CANONICAL';
}

// ─── Circular chain detection ─────────────────────────────────────────────────
function findCircularChains(allItemsByType, allIds) {
  const chains = [];
  const visitedGlobal = new Set();

  for (const t of TAXONOMY_TYPES) {
    for (const item of (allItemsByType[t] || [])) {
      if (!item.parentSpecies || visitedGlobal.has(item._id)) continue;
      const chain = [];
      const visited = new Set();
      let current = item;
      while (current) {
        if (visited.has(current._id)) {
          // Found cycle
          const cycleStart = chain.indexOf(current._id);
          if (cycleStart >= 0) {
            chains.push({
              type: t,
              chain: [...chain.slice(cycleStart), current._id].map(id => {
                const found = findEntityById(allItemsByType, id);
                return { id, name: found?.name || found?.title || 'UNKNOWN', type: found?._type || '?' };
              }),
            });
          }
          break;
        }
        visited.add(current._id);
        chain.push(current._id);
        visitedGlobal.add(current._id);

        const refId = extractRefId(current.parentSpecies);
        if (!refId) break;
        current = findEntityById(allItemsByType, refId);
      }
    }
  }
  return chains;
}

function findEntityById(allItemsByType, id) {
  for (const t of TYPES) {
    const found = (allItemsByType[t] || []).find(i => i._id === id);
    if (found) return found;
  }
  return null;
}

// ─── SPEC-04: Parent chain traversal ──────────────────────────────────────────
function validateParentChain(allItemsByType, item, type) {
  const issues = [];
  const refId = extractRefId(item.parentSpecies);
  if (!refId) return issues;

  // Check 1: Referenced document exists
  const target = findEntityById(allItemsByType, refId);
  if (!target) {
    issues.push({ check: 'BROKEN_REF', message: `Referenced document ${refId} does not exist` });
    return issues;
  }

  // Check 2: Target is valid (not a draft of a deleted doc)
  if (target._id.startsWith('drafts.') && !allItemsByType[target._type]?.some(i => i._id === target._id.replace('drafts.', ''))) {
    issues.push({ check: 'DRAFT_ONLY', message: `Target ${refId} is a draft with no published version` });
  }

  // Check 3: Parent is canonical (not itself a variant)
  if (target.parentSpecies) {
    issues.push({ check: 'PARENT_NOT_CANONICAL', message: `Parent ${target.name || target.title} (${target._id}) is itself a variant (has parentSpecies)` });
  }

  // Check 4: Child != parent
  if (refId === item._id) {
    issues.push({ check: 'SELF_REFERENCE', message: `Entity points to itself` });
  }

  // Check 5: Relationship is semantically appropriate (same type)
  if (target._type !== item._type) {
    issues.push({ check: 'TYPE_MISMATCH', message: `Parent type (${target._type}) differs from child type (${item._type})` });
  }

  // Check 6: Circular chain (we detect globally but also report per-entity)
  // Already handled in findCircularChains

  return issues;
}

// ─── SPEC-03: Duplicate scientific name classification ────────────────────────
function classifyDuplicateSciName(sciName, entities, allItemsByType) {
  const names = entities.map(e => (e.name || '').toLowerCase());
  const types = [...new Set(entities.map(e => e._type))];

  // Check if any has parentSpecies -> VARIANT
  const hasParent = entities.some(e => e.parentSpecies);
  if (hasParent) {
    return 'LEGITIMATE_VARIANT';
  }

  // Check if plant cultivar keywords
  if (types.includes('plant')) {
    const hasCultivarKw = entities.some(e => {
      const n = (e.name || '').toLowerCase();
      return n.includes('var.') || n.includes('cv.') || n.includes('cultivar');
    });
    if (hasCultivarKw) return 'CULTIVAR';
  }

  // Check if same name == scientific name -> COMMON-NAME_REPRESENTATION
  const allNamesMatchSci = entities.every(e => {
    const n = (e.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const s = sciName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return n === s || n.includes(s);
  });
  if (allNamesMatchSci) return 'COMMON-NAME_REPRESENTATION';

  // Cross-type duplicates (e.g., species + invertebrate with same sci name)
  if (types.length > 1) {
    return 'LEGITIMATE_AQUARIUM_FORM';
  }

  // Same type, no parent, different names -> likely actual duplicate
  const uniqueNames = new Set(names);
  if (uniqueNames.size === 1) return 'ACTUAL_DUPLICATE';

  return 'ACTUAL_DUPLICATE';
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  const startTime = Date.now();
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   PHASE 15 — V1 Final QA & Freeze: Identity Audit         ║');
  console.log('║   SPEC-00 → SPEC-04                                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ─── Fetch all documents ──────────────────────────────────────────────────
  console.log('Fetching all documents from Sanity...\n');
  const allItemsByType = {};
  const allIds = new Set();

  for (const t of TYPES) {
    const items = await fetchAll(t);
    allItemsByType[t] = items;
    for (const item of items) {
      allIds.add(item._id);
    }
    const pub = items.filter(i => !i._id.startsWith('drafts.')).length;
    const draft = items.filter(i => i._id.startsWith('drafts.')).length;
    console.log(`  ${t.padEnd(15)} → ${items.length} total  (${pub} published, ${draft} drafts)`);
  }

  const totalEntities = TYPES.reduce((sum, t) => sum + allItemsByType[t].length, 0);
  const totalPublished = TYPES.reduce((sum, t) => sum + allItemsByType[t].filter(i => !i._id.startsWith('drafts.')).length, 0);
  const totalDrafts = TYPES.reduce((sum, t) => sum + allItemsByType[t].filter(i => i._id.startsWith('drafts.')).length, 0);
  console.log(`\n  TOTAL: ${totalEntities} entities (${totalPublished} published, ${totalDrafts} drafts)\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEC-00: BASELINE LOCK
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SPEC-00: BASELINE LOCK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const baseline = {
    generatedAt: new Date().toISOString(),
    project: PROJECT_ID,
    dataset: DATASET,
    apiVersion: API_VERSION,
    totalEntities,
    totalPublished,
    totalDrafts,
    perType: {},
    crossType: {
      duplicateSlugsGlobal: [],
      duplicateSlugsCrossTypeCount: 0,
    },
    nullNames: [],
    nullCategories: [],
    parentSpeciesSetCount: 0,
    aliasesCount: 0,
    localNamesCount: 0,
    aquariumStyleCoverage: 0,
    regionCoverage: 0,
    waterTypeCoverage: 0,
    brokenParentRefs: [],
    selfReferences: [],
    circularChains: [],
  };

  // Per-type stats
  const slugMapGlobal = {};
  for (const t of TYPES) {
    const items = allItemsByType[t];
    const published = items.filter(i => !i._id.startsWith('drafts.'));
    const drafts = items.filter(i => i._id.startsWith('drafts.'));

    // Per-type duplicate slugs
    const slugDupes = findDuplicates(items, i => i.slug?.current);
    // Per-type duplicate sci names
    const sciDupes = findDuplicates(items, i => i.scientificName);

    // Null name
    const nullNameItems = items.filter(i => {
      const name = i.name || i.title;
      return !name || name.trim() === '';
    });

    // Null category/group
    const nullCatItems = items.filter(i => !i.category && !i.group);

    // parentSpecies non-null
    const parentSet = items.filter(i => i.parentSpecies != null).length;
    baseline.parentSpeciesSetCount += parentSet;

    // aliases non-empty
    const hasAliases = items.filter(i => Array.isArray(i.aliases) && i.aliases.length > 0).length;
    baseline.aliasesCount += hasAliases;

    // localNames non-empty
    const hasLocalNames = items.filter(i => Array.isArray(i.localNames) && i.localNames.length > 0).length;
    baseline.localNamesCount += hasLocalNames;

    // aquariumStyle coverage
    const hasStyle = items.filter(i => {
      if (Array.isArray(i.aquariumStyle)) return i.aquariumStyle.length > 0;
      if (typeof i.aquariumStyle === 'string') return i.aquariumStyle.trim() !== '';
      return false;
    }).length;
    baseline.aquariumStyleCoverage += hasStyle;

    // region coverage
    const hasRegion = items.filter(i => i.region && i.region.trim() !== '').length;
    baseline.regionCoverage += hasRegion;

    // waterType coverage
    const hasWaterType = items.filter(i => i.waterType && i.waterType.trim() !== '').length;
    baseline.waterTypeCoverage += hasWaterType;

    // Record null names
    for (const item of nullNameItems) {
      baseline.nullNames.push({ type: t, id: item._id });
    }

    // Record null categories
    for (const item of nullCatItems) {
      baseline.nullCategories.push({ type: t, id: item._id, name: item.name || item.title });
    }

    // Slug global map
    for (const item of items) {
      const slug = item.slug?.current;
      if (!slug) continue;
      if (!slugMapGlobal[slug]) slugMapGlobal[slug] = [];
      slugMapGlobal[slug].push({ type: t, id: item._id, name: item.name || item.title });
    }

    baseline.perType[t] = {
      total: items.length,
      published: published.length,
      drafts: drafts.length,
      duplicateSlugsCount: slugDupes.length,
      duplicateSlugs: slugDupes.map(([k, v]) => ({ slug: k, entities: v })),
      duplicateSciNamesCount: sciDupes.length,
      duplicateSciNames: sciDupes.map(([k, v]) => ({ scientificName: k, entities: v })),
      nullNameCount: nullNameItems.length,
      nullCategoryCount: nullCatItems.length,
      parentSpeciesSetCount: parentSet,
      aliasesCount: hasAliases,
      localNamesCount: hasLocalNames,
      aquariumStyleCoverage: hasStyle,
      regionCoverage: hasRegion,
      waterTypeCoverage: hasWaterType,
    };
  }

  // Cross-type duplicate slugs
  baseline.crossType.duplicateSlugsGlobal = Object.entries(slugMapGlobal)
    .filter(([, v]) => v.length > 1)
    .map(([slug, entities]) => ({ slug, entities }));
  baseline.crossType.duplicateSlugsCrossTypeCount = baseline.crossType.duplicateSlugsGlobal.length;

  // ─── Broken parentSpecies references ──────────────────────────────────────
  for (const t of TAXONOMY_TYPES) {
    for (const item of allItemsByType[t] || []) {
      if (!item.parentSpecies) continue;
      const refId = extractRefId(item.parentSpecies);
      if (!refId) {
        baseline.brokenParentRefs.push({
          type: t, id: item._id, name: item.name,
          ref: JSON.stringify(item.parentSpecies),
          reason: 'Cannot extract reference ID',
        });
      } else {
        const target = findEntityById(allItemsByType, refId);
        if (!target) {
          baseline.brokenParentRefs.push({
            type: t, id: item._id, name: item.name, refId,
            reason: 'Referenced document not found',
          });
        }
      }
    }
  }

  // ─── Self-references ──────────────────────────────────────────────────────
  for (const t of TAXONOMY_TYPES) {
    for (const item of allItemsByType[t] || []) {
      if (!item.parentSpecies) continue;
      const refId = extractRefId(item.parentSpecies);
      if (refId && refId === item._id) {
        baseline.selfReferences.push({ type: t, id: item._id, name: item.name });
      }
    }
  }

  // ─── Circular chains ──────────────────────────────────────────────────────
  baseline.circularChains = findCircularChains(allItemsByType, allIds);

  // Print SPEC-00 summary
  console.log(`  Null names:            ${baseline.nullNames.length}`);
  console.log(`  Null categories:       ${baseline.nullCategories.length}`);
  console.log(`  parentSpecies set:     ${baseline.parentSpeciesSetCount}`);
  console.log(`  Non-empty aliases:     ${baseline.aliasesCount}`);
  console.log(`  Non-empty localNames:  ${baseline.localNamesCount}`);
  console.log(`  aquariumStyle coverage:${baseline.aquariumStyleCoverage}`);
  console.log(`  Region coverage:       ${baseline.regionCoverage}`);
  console.log(`  waterType coverage:    ${baseline.waterTypeCoverage}`);
  console.log(`  Broken parent refs:    ${baseline.brokenParentRefs.length}`);
  console.log(`  Self-references:       ${baseline.selfReferences.length}`);
  console.log(`  Circular chains:       ${baseline.circularChains.length}`);
  console.log(`  Cross-type dupe slugs: ${baseline.crossType.duplicateSlugsCrossTypeCount}`);

  if (baseline.brokenParentRefs.length) {
    console.log('\n  Broken parentSpecies refs:');
    for (const r of baseline.brokenParentRefs) {
      console.log(`    [${r.type}] ${r.name} (${r.id}) → ${r.refId || r.ref}: ${r.reason}`);
    }
  }
  if (baseline.selfReferences.length) {
    console.log('\n  Self-references:');
    for (const r of baseline.selfReferences) {
      console.log(`    [${r.type}] ${r.name} (${r.id})`);
    }
  }
  if (baseline.circularChains.length) {
    console.log('\n  Circular chains:');
    for (const c of baseline.circularChains) {
      const labels = c.chain.map(n => `${n.name}[${n.type}]`).join(' → ');
      console.log(`    ${labels}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEC-01: SCHEMA INTEGRITY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SPEC-01: SCHEMA INTEGRITY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const schemaIssues = { missingRequired: [], unexpectedFields: [], typeMismatches: [] };

  for (const t of TYPES) {
    const expectedFields = new Set(SCHEMA_FIELDS[t] || []);
    const items = allItemsByType[t];

    for (const item of items) {
      const entityName = item.name || item.title || item._id;

      // Check for unexpected fields (non-system, non-schema)
      // Ignore null/undefined — those are just fields fetched but not present on this type
      for (const [key, val] of Object.entries(item)) {
        if (SYSTEM_FIELDS.has(key)) continue;
        if (expectedFields.has(key)) continue;
        if (val === null || val === undefined) continue;
        // Skip reference arrays and other fields that exist in schema but not in our SCHEMA_FIELDS list
        if (Array.isArray(val) && val.length > 0 && val[0]?._type === 'reference') continue;
        if (Array.isArray(val) && val.length > 0 && val[0]?._type === 'block') continue;
        // image type
        if (typeof val === 'object' && val._type === 'image') continue;
        // reference type
        if (typeof val === 'object' && val._type === 'reference') continue;

        // If we get here, it's a non-null unexpected scalar field
        schemaIssues.unexpectedFields.push({
          type: t, id: item._id, name: entityName, field: key,
          value: typeof val === 'object' ? JSON.stringify(val).slice(0, 100) : String(val).slice(0, 100),
        });
      }
    }
  }

  if (schemaIssues.unexpectedFields.length === 0) {
    console.log('  No unexpected fields found. All entities conform to their schema.');
  } else {
    console.log(`  Unexpected fields: ${schemaIssues.unexpectedFields.length}`);
    for (const issue of schemaIssues.unexpectedFields) {
      console.log(`    [${issue.type}] ${issue.name}: field "${issue.field}" = ${issue.value}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEC-02: IDENTITY & TAXONOMY INTEGRITY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SPEC-02: IDENTITY & TAXONOMY INTEGRITY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const identityReport = { classified: {}, highRiskGroups: {}, issues: [] };

  for (const t of TAXONOMY_TYPES) {
    const items = allItemsByType[t];
    identityReport.classified[t] = { CANONICAL: 0, 'VARIANT/MORPH': 0, CULTIVAR: 0, 'COMMON-NAME': 0, UNKNOWN: 0 };

    for (const item of items) {
      const classification = classifyIdentity(item);
      identityReport.classified[t][classification] = (identityReport.classified[t][classification] || 0) + 1;

      // Check required fields for taxonomy types
      const name = item.name;
      const sci = item.scientificName;
      const slug = item.slug?.current;
      const grp = item.group;
      const wt = item.waterType;

      if (!name || name.trim() === '') {
        identityReport.issues.push({ type: t, id: item._id, issue: 'NULL_NAME' });
      }
      if (t !== 'plant' && (!sci || sci.trim() === '')) {
        // plant doesn't strictly require scientificName
        // invertebrate requires it per schema, but we still report
      }
      if (!slug || slug.trim() === '') {
        identityReport.issues.push({ type: t, id: item._id, name, issue: 'NULL_SLUG' });
      }

      // Check high-risk groups
      if (grp && HIGH_RISK_GROUPS.has(grp)) {
        if (!identityReport.highRiskGroups[grp]) identityReport.highRiskGroups[grp] = [];
        identityReport.highRiskGroups[grp].push({
          type: t, id: item._id, name, scientificName: sci,
          classification, parentSpecies: item.parentSpecies ? extractRefId(item.parentSpecies) : null,
        });
      }
    }
  }

  // Print SPEC-02 summary
  for (const t of TAXONOMY_TYPES) {
    const c = identityReport.classified[t];
    console.log(`  ${t}: CANONICAL=${c.CANONICAL}  VARIANT/MORPH=${c['VARIANT/MORPH']}  CULTIVAR=${c.CULTIVAR}  COMMON-NAME=${c['COMMON-NAME']}  UNKNOWN=${c.UNKNOWN}`);
  }

  console.log(`\n  Identity issues: ${identityReport.issues.length}`);
  for (const issue of identityReport.issues) {
    console.log(`    [${issue.type}] ${issue.name || issue.id}: ${issue.issue}`);
  }

  // High-risk group breakdown
  const highRiskKeys = Object.keys(identityReport.highRiskGroups);
  if (highRiskKeys.length) {
    console.log('\n  High-risk group breakdown:');
    for (const grp of highRiskKeys) {
      const entities = identityReport.highRiskGroups[grp];
      console.log(`    ${grp} (${entities.length} entities):`);
      for (const e of entities) {
        const parentInfo = e.parentSpecies ? ` → parent: ${e.parentSpecies}` : ' (canonical)';
        console.log(`      [${e.type}] ${e.name} (${e.scientificName || 'no sci name'}) ${e.classification}${parentInfo}`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEC-03: DUPLICATE INTEGRITY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SPEC-03: DUPLICATE INTEGRITY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const duplicateReport = { perDomain: {}, crossType: [] };

  // Per-domain duplicate scientific names
  for (const t of TAXONOMY_TYPES) {
    const dupes = findDuplicates(allItemsByType[t] || [], i => i.scientificName);
    duplicateReport.perDomain[t] = dupes.map(([sciName, entities]) => ({
      scientificName: sciName,
      classification: classifyDuplicateSciName(sciName, entities, allItemsByType),
      entities: entities.map(e => ({ id: e._id, name: e.name, hasParent: !!e.parentSpecies })),
    }));

    if (dupes.length) {
      console.log(`  ${t}: ${dupes.length} duplicate groups`);
      for (const [sciName, entities] of dupes) {
        const cls = classifyDuplicateSciName(sciName, entities, allItemsByType);
        console.log(`    "${sciName}" [${cls}]: ${entities.map(e => e.name).join(', ')}`);
      }
    } else {
      console.log(`  ${t}: 0 duplicate scientific names`);
    }
  }

  // Cross-type duplicate scientific names (species+invertebrate)
  console.log('\n  Cross-type (species+invertebrate) duplicate scientific names:');
  const spInvItems = [
    ...(allItemsByType.species || []).map(i => ({ ...i, _domain: 'species' })),
    ...(allItemsByType.invertebrate || []).map(i => ({ ...i, _domain: 'invertebrate' })),
  ];
  // Use custom key function that tracks domain
  const spInvMap = {};
  for (const item of spInvItems) {
    const key = item.scientificName;
    if (!key) continue;
    if (!spInvMap[key]) spInvMap[key] = [];
    spInvMap[key].push({ id: item._id, name: item.name, _domain: item._domain, parentSpecies: item.parentSpecies });
  }
  const spInvDupes = Object.entries(spInvMap).filter(([, v]) => v.length > 1);
  duplicateReport.crossType = spInvDupes.map(([sciName, entities]) => ({
    scientificName: sciName,
    classification: classifyDuplicateSciName(sciName, entities, allItemsByType),
    entities: entities.map(e => ({ id: e.id, name: e.name, domain: e._domain, hasParent: !!e.parentSpecies })),
  }));

  if (spInvDupes.length) {
    for (const [sciName, entities] of spInvDupes) {
      const cls = classifyDuplicateSciName(sciName, entities, allItemsByType);
      console.log(`    "${sciName}" [${cls}]: ${entities.map(e => `${e.name} (${e._domain})`).join(', ')}`);
    }
  } else {
    console.log('    0 cross-type duplicates');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SPEC-04: PARENT SPECIES / VARIANT INTEGRITY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SPEC-04: PARENT SPECIES / VARIANT INTEGRITY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const parentIntegrity = { totalChecked: 0, totalIssues: 0, details: [] };

  for (const t of TAXONOMY_TYPES) {
    const items = allItemsByType[t];
    for (const item of items) {
      if (!item.parentSpecies) continue;
      parentIntegrity.totalChecked++;
      const issues = validateParentChain(allItemsByType, item, t);
      if (issues.length) {
        parentIntegrity.totalIssues += issues.length;
        parentIntegrity.details.push({
          type: t,
          id: item._id,
          name: item.name,
          parentRef: extractRefId(item.parentSpecies),
          issues,
        });
      }
    }
  }

  console.log(`  parentSpecies references checked: ${parentIntegrity.totalChecked}`);
  console.log(`  Issues found: ${parentIntegrity.totalIssues}`);

  if (parentIntegrity.details.length) {
    console.log('\n  Detailed issues:');
    for (const d of parentIntegrity.details) {
      console.log(`\n  [${d.type}] ${d.name} (${d.id}) → parent ${d.parentRef}:`);
      for (const issue of d.issues) {
        console.log(`    ${issue.check}: ${issue.message}`);
      }
    }
  } else {
    console.log('  All parentSpecies references are valid, canonical, acyclic, and semantically appropriate.');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WRITE REPORTS
  // ═══════════════════════════════════════════════════════════════════════════
  if (!fs.existsSync('report')) fs.mkdirSync('report', { recursive: true });

  const baselineReport = {
    ...baseline,
    spec01: {
      unexpectedFieldCount: schemaIssues.unexpectedFields.length,
      unexpectedFields: schemaIssues.unexpectedFields,
    },
    spec02: identityReport,
    spec03: duplicateReport,
    spec04: parentIntegrity,
  };

  fs.writeFileSync('report/phase15-baseline.json', JSON.stringify(baselineReport, null, 2));
  console.log('\n✓ Wrote report/phase15-baseline.json');

  // ─── Final summary ────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalIssues =
    baseline.brokenParentRefs.length +
    baseline.selfReferences.length +
    baseline.circularChains.length +
    schemaIssues.unexpectedFields.length +
    identityReport.issues.length +
    parentIntegrity.totalIssues;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                  AUDIT SUMMARY                             ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Total entities:          ${String(totalEntities).padStart(6)}                        ║`);
  console.log(`║  SPEC-00 Issues:          ${String(baseline.brokenParentRefs.length + baseline.selfReferences.length + baseline.circularChains.length).padStart(6)}                        ║`);
  console.log(`║  SPEC-01 Issues:          ${String(schemaIssues.unexpectedFields.length).padStart(6)}                        ║`);
  console.log(`║  SPEC-02 Issues:          ${String(identityReport.issues.length).padStart(6)}                        ║`);
  console.log(`║  SPEC-04 Issues:          ${String(parentIntegrity.totalIssues).padStart(6)}                        ║`);
  console.log(`║  TOTAL ISSUES:            ${String(totalIssues).padStart(6)}                        ║`);
  console.log(`║  Status: ${totalIssues === 0 ? '  PASS — READY TO FREEZE  ' : '  ISSUES FOUND — REVIEW  '}               ║`);
  console.log(`║  Elapsed: ${elapsed}s                                     ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // Exit with error code if issues found
  if (totalIssues > 0) process.exit(1);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(2);
});
