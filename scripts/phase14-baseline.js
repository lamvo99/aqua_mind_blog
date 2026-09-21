const fs = require('fs');

// 1. Read SANITY_API_TOKEN from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const tokenMatch = envContent.match(/SANITY_API_TOKEN="([^"]+)"/);
const TOKEN = tokenMatch ? tokenMatch[1] : null;

const PROJECT_ID = 'zeohjejw';
const DATASET = 'production';
const API_VERSION = '2026-05-25';
const API_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;

const TYPES = ['species', 'plant', 'coral', 'invertebrate', 'equipment', 'problem', 'inspiration'];
const TAXONOMY_TYPES = ['species', 'plant', 'coral', 'invertebrate'];

const BASE_FIELDS = '_id, name, scientificName, slug, waterType, group, region, aquariumStyle, difficulty, light, co2, coralType, category, isPredator, reefCompatibility, photosynthetic, growthForm, redPlant, localNames, aliases, parentSpecies, mainImage';

async function fetchAll(type) {
  const fields = BASE_FIELDS;
  const query = `*[_type == "${type}"]{${fields}}`;
  const q = encodeURIComponent(query);
  const url = `${API_BASE}?query=${q}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.result || [];
}

function findDuplicates(items, keyFn) {
  const map = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    if (!map[key]) map[key] = [];
    map[key].push({ id: item._id, name: item.name });
  }
  return Object.entries(map).filter(([k, v]) => v.length > 1);
}

async function main() {
  if (!fs.existsSync('report')) fs.mkdirSync('report', { recursive: true });

  const all = {};
  const summary = {};
  const global = {
    totalPublished: 0,
    totalDrafts: 0,
    totalEntities: 0,
    duplicateSlugsGlobal: 0,
    duplicateScientificNamesGlobal: 0,
    nullNameCount: 0,
    nullCategoryGroupCount: 0,
    parentSpeciesSetCount: 0,
    nonEmptyAliasesCount: 0,
    nonEmptyLocalNamesCount: 0,
    nonEmptyAquariumStyleCount: 0,
  };

  const allItems = {};

  // Fetch all types
  for (const t of TYPES) {
    const items = await fetchAll(t);
    all[t] = items;
    allItems[t] = items;

    const published = items.filter(i => !i._id.startsWith('drafts.'));
    const drafts = items.filter(i => i._id.startsWith('drafts.'));

    // Per-type duplicate slugs
    const slugDupes = findDuplicates(items, i => i.slug?.current);
    // Per-type duplicate scientific names
    const sciDupes = findDuplicates(items, i => i.scientificName);

    // Null name count
    const nullName = items.filter(i => !i.name || i.name.trim() === '').length;

    // Null category/group count
    const nullCatGroup = items.filter(i => !i.category && !i.group).length;

    // parentSpecies set (non-null)
    const parentSet = items.filter(i => i.parentSpecies !== null && i.parentSpecies !== undefined).length;

    // Non-empty aliases
    const hasAliases = items.filter(i => Array.isArray(i.aliases) && i.aliases.length > 0).length;

    // Non-empty localNames
    const hasLocalNames = items.filter(i => Array.isArray(i.localNames) && i.localNames.length > 0).length;

    // Non-empty aquariumStyle
    const hasStyle = items.filter(i => {
      if (Array.isArray(i.aquariumStyle)) return i.aquariumStyle.length > 0;
      if (typeof i.aquariumStyle === 'string') return i.aquariumStyle.trim() !== '';
      return false;
    }).length;

    summary[t] = {
      total: items.length,
      published: published.length,
      drafts: drafts.length,
      duplicateSlugs: slugDupes.map(([k, v]) => ({ slug: k, entities: v })),
      duplicateSlugsCount: slugDupes.length,
      duplicateScientificNames: sciDupes.map(([k, v]) => ({ scientificName: k, entities: v })),
      duplicateScientificNamesCount: sciDupes.length,
      nullNameCount: nullName,
      nullCategoryGroupCount: nullCatGroup,
      parentSpeciesSetCount: parentSet,
      nonEmptyAliasesCount: hasAliases,
      nonEmptyLocalNamesCount: hasLocalNames,
      nonEmptyAquariumStyleCount: hasStyle,
    };

    global.totalPublished += published.length;
    global.totalDrafts += drafts.length;
    global.totalEntities += items.length;
    global.nullNameCount += nullName;
    global.nullCategoryGroupCount += nullCatGroup;
    global.parentSpeciesSetCount += parentSet;
    global.nonEmptyAliasesCount += hasAliases;
    global.nonEmptyLocalNamesCount += hasLocalNames;
    global.nonEmptyAquariumStyleCount += hasStyle;

    console.log(`\n=== ${t.toUpperCase()} ===`);
    console.log(`  Total: ${items.length} | Published: ${published.length} | Drafts: ${drafts.length}`);
    console.log(`  Duplicate slugs: ${slugDupes.length}`);
    if (slugDupes.length) {
      for (const [k, v] of slugDupes) {
        console.log(`    "${k}" -> ${v.map(e => e.name).join(', ')}`);
      }
    }
    console.log(`  Duplicate scientific names: ${sciDupes.length}`);
    if (sciDupes.length) {
      for (const [k, v] of sciDupes) {
        console.log(`    "${k}" -> ${v.map(e => e.name).join(', ')}`);
      }
    }
    console.log(`  Null name: ${nullName} | Null category/group: ${nullCatGroup}`);
    console.log(`  parentSpecies set: ${parentSet} | Aliases: ${hasAliases} | LocalNames: ${hasLocalNames} | AquariumStyle: ${hasStyle}`);
  }

  // Cross-type duplicate scientific names (species+invertebrate, plant, coral)
  console.log('\n=== CROSS-TYPE DUPLICATE SCIENTIFIC NAMES ===');

  const crossTypeResults = {
    speciesInvertebrate: { type: 'species+invertebrate', duplicates: [] },
    plant: { type: 'plant', duplicates: [] },
    coral: { type: 'coral', duplicates: [] },
  };

  // species + invertebrate combined
  const spInvItems = [
    ...(allItems.species || []).map(i => ({ ...i, _domain: 'species' })),
    ...(allItems.invertebrate || []).map(i => ({ ...i, _domain: 'invertebrate' })),
  ];
  const spInvDupes = findDuplicates(spInvItems, i => i.scientificName);
  global.duplicateScientificNamesGlobal += spInvDupes.length;
  crossTypeResults.speciesInvertebrate.duplicates = spInvDupes.map(([k, v]) => ({
    scientificName: k,
    entities: v.map(e => ({ id: e._id, name: e.name, domain: e._domain })),
  }));
  if (spInvDupes.length) {
    console.log(`  species+invertebrate: ${spInvDupes.length} duplicate groups`);
    for (const [k, v] of spInvDupes) {
      console.log(`    "${k}" -> ${v.map(e => `${e.name} (${e._domain})`).join(', ')}`);
    }
  } else {
    console.log('  species+invertebrate: 0 duplicates');
  }

  // plant
  const plantDupes = findDuplicates(allItems.plant || [], i => i.scientificName);
  global.duplicateScientificNamesGlobal += plantDupes.length;
  crossTypeResults.plant.duplicates = plantDupes.map(([k, v]) => ({
    scientificName: k,
    entities: v.map(e => ({ id: e._id, name: e.name })),
  }));
  if (plantDupes.length) {
    console.log(`  plant: ${plantDupes.length} duplicate groups`);
    for (const [k, v] of plantDupes) {
      console.log(`    "${k}" -> ${v.map(e => e.name).join(', ')}`);
    }
  } else {
    console.log('  plant: 0 duplicates');
  }

  // coral
  const coralDupes = findDuplicates(allItems.coral || [], i => i.scientificName);
  global.duplicateScientificNamesGlobal += coralDupes.length;
  crossTypeResults.coral.duplicates = coralDupes.map(([k, v]) => ({
    scientificName: k,
    entities: v.map(e => ({ id: e._id, name: e.name })),
  }));
  if (coralDupes.length) {
    console.log(`  coral: ${coralDupes.length} duplicate groups`);
    for (const [k, v] of coralDupes) {
      console.log(`    "${k}" -> ${v.map(e => e.name).join(', ')}`);
    }
  } else {
    console.log('  coral: 0 duplicates');
  }

  // Per-type duplicate slug totals
  global.duplicateSlugsGlobal = Object.values(summary).reduce((sum, s) => sum + s.duplicateSlugsCount, 0);

  const report = {
    generatedAt: new Date().toISOString(),
    project: PROJECT_ID,
    dataset: DATASET,
    apiVersion: API_VERSION,
    globalSummary: global,
    perType: summary,
    crossTypeDuplicateScientificNames: crossTypeResults,
    rawInventory: all,
  };

  fs.writeFileSync('report/phase14-baseline-lock.json', JSON.stringify(report, null, 2));

  console.log('\n=== GLOBAL SUMMARY ===');
  console.log(`  Total entities: ${global.totalEntities}`);
  console.log(`  Total published: ${global.totalPublished}`);
  console.log(`  Total drafts: ${global.totalDrafts}`);
  console.log(`  Duplicate slugs (per-type): ${global.duplicateSlugsGlobal}`);
  console.log(`  Duplicate scientific names (cross-type): ${global.duplicateScientificNamesGlobal}`);
  console.log(`  Null name: ${global.nullNameCount}`);
  console.log(`  Null category/group: ${global.nullCategoryGroupCount}`);
  console.log(`  parentSpecies set: ${global.parentSpeciesSetCount}`);
  console.log(`  Non-empty aliases: ${global.nonEmptyAliasesCount}`);
  console.log(`  Non-empty localNames: ${global.nonEmptyLocalNamesCount}`);
  console.log(`  Non-empty aquariumStyle: ${global.nonEmptyAquariumStyleCount}`);
  console.log('\nWrote report/phase14-baseline-lock.json');
}

main().catch(console.error);
