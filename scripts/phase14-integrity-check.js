const fs = require('fs');

// 1. Read SANITY_API_TOKEN from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const tokenMatch = envContent.match(/SANITY_API_TOKEN="([^"]+)"/);
const TOKEN = tokenMatch ? tokenMatch[1] : null;

if (!TOKEN) {
  console.error('ERROR: SANITY_API_TOKEN not found in .env.local');
  process.exit(1);
}

const PROJECT_ID = 'zeohjejw';
const DATASET = 'production';
const API_VERSION = '2026-05-25';
const API_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;

const TYPES = ['species', 'plant', 'coral', 'invertebrate', 'equipment', 'problem', 'inspiration'];
const TAXONOMY_TYPES = ['species', 'plant', 'coral', 'invertebrate'];

const BASE_FIELDS = '_id, _type, name, scientificName, slug, waterType, group, region, aquariumStyle, difficulty, light, co2, coralType, category, isPredator, reefCompatibility, photosynthetic, growthForm, redPlant, localNames, aliases, parentSpecies, mainImage';

async function fetchAll(type) {
  const query = `*[_type == "${type}"]{${BASE_FIELDS}}`;
  const q = encodeURIComponent(query);
  const url = `${API_BASE}?query=${q}`;
  const res = await fetch(url);
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
    map[key].push({ id: item._id, name: item.name });
  }
  return Object.entries(map).filter(([k, v]) => v.length > 1);
}

async function main() {
  console.log('=== PHASE 14 DATA INTEGRITY CHECK ===\n');

  const allItems = {};
  const allIds = new Set();

  // Fetch all entities
  for (const t of TYPES) {
    const items = await fetchAll(t);
    allItems[t] = items;
    for (const item of items) {
      allIds.add(item._id);
    }
    console.log(`Fetched ${items.length} ${t} entities`);
  }

  const totalEntities = TYPES.reduce((sum, t) => sum + (allItems[t]?.length || 0), 0);
  console.log(`\nTotal entities: ${totalEntities}\n`);

  const issues = {
    brokenParentRefs: [],
    selfReferences: [],
    circularChains: [],
    duplicateSlugsGlobal: [],
    duplicateSciNames: [],
    nullNames: [],
    nullWaterType: [],
    nullCategory: [],
    invalidRefs: [],
  };

  // ===== CHECK 1: Broken parentSpecies references =====
  console.log('--- CHECK 1: Broken parentSpecies references ---');
  for (const t of TAXONOMY_TYPES) {
    for (const item of allItems[t] || []) {
      if (item.parentSpecies) {
        const refId = extractRefId(item.parentSpecies);
        if (!refId) {
          issues.brokenParentRefs.push({
            type: t,
            id: item._id,
            name: item.name,
            ref: JSON.stringify(item.parentSpecies),
            reason: 'Cannot extract reference ID',
          });
        } else if (!allIds.has(refId)) {
          // Also check drafts. prefix
          const draftId = refId.startsWith('drafts.') ? refId : `drafts.${refId}`;
          if (!allIds.has(refId) && !allIds.has(draftId)) {
            issues.brokenParentRefs.push({
              type: t,
              id: item._id,
              name: item.name,
              refId,
              reason: 'Referenced document not found in any type',
            });
          }
        }
      }
    }
  }
  console.log(`  Broken parentSpecies refs: ${issues.brokenParentRefs.length}`);
  for (const issue of issues.brokenParentRefs) {
    console.log(`    [${issue.type}] ${issue.name} (${issue.id}) -> ${issue.refId || issue.ref}: ${issue.reason}`);
  }

  // ===== CHECK 2: Self-references =====
  console.log('\n--- CHECK 2: Self-references (parentSpecies -> self) ---');
  for (const t of TAXONOMY_TYPES) {
    for (const item of allItems[t] || []) {
      if (item.parentSpecies) {
        const refId = extractRefId(item.parentSpecies);
        if (refId && refId === item._id) {
          issues.selfReferences.push({
            type: t,
            id: item._id,
            name: item.name,
          });
        }
      }
    }
  }
  console.log(`  Self-references: ${issues.selfReferences.length}`);
  for (const issue of issues.selfReferences) {
    console.log(`    [${issue.type}] ${issue.name} (${issue.id})`);
  }

  // ===== CHECK 3: Circular parent chains =====
  console.log('\n--- CHECK 3: Circular parent chains ---');
  function findCircular(item, type, visited = new Set()) {
    const id = item._id;
    if (visited.has(id)) return [...visited, id];
    visited.add(id);
    if (item.parentSpecies) {
      const refId = extractRefId(item.parentSpecies);
      if (refId) {
        // Find the referenced item in any type
        for (const t of TAXONOMY_TYPES) {
          const found = (allItems[t] || []).find(i => i._id === refId);
          if (found) {
            const cycle = findCircular(found, t, new Set(visited));
            if (cycle) return cycle;
            break;
          }
        }
      }
    }
    return null;
  }
  const circularSeen = new Set();
  for (const t of TAXONOMY_TYPES) {
    for (const item of allItems[t] || []) {
      if (item.parentSpecies && !circularSeen.has(item._id)) {
        const cycle = findCircular(item, t);
        if (cycle) {
          const key = cycle.sort().join('->');
          if (!circularSeen.has(key)) {
            issues.circularChains.push({ chain: cycle, type: t });
            circularSeen.add(key);
          }
          for (const id of cycle) circularSeen.add(id);
        }
      }
    }
  }
  console.log(`  Circular chains: ${issues.circularChains.length}`);
  for (const issue of issues.circularChains) {
    console.log(`    ${issue.chain.join(' -> ')}`);
  }

  // ===== CHECK 4: Duplicate slugs across all types =====
  console.log('\n--- CHECK 4: Duplicate slugs across ALL types ---');
  const slugMap = {};
  for (const t of TYPES) {
    for (const item of allItems[t] || []) {
      const slug = item.slug?.current;
      if (!slug) continue;
      if (!slugMap[slug]) slugMap[slug] = [];
      slugMap[slug].push({ type: t, id: item._id, name: item.name });
    }
  }
  issues.duplicateSlugsGlobal = Object.entries(slugMap)
    .filter(([k, v]) => v.length > 1)
    .map(([slug, entities]) => ({ slug, entities }));
  console.log(`  Duplicate slugs (cross-type): ${issues.duplicateSlugsGlobal.length}`);
  for (const issue of issues.duplicateSlugsGlobal) {
    console.log(`    "${issue.slug}": ${issue.entities.map(e => `${e.name} [${e.type}]`).join(', ')}`);
  }

  // Per-type duplicate slugs
  console.log('\n--- Duplicate slugs per type ---');
  for (const t of TYPES) {
    const dupes = findDuplicates(allItems[t] || [], i => i.slug?.current);
    if (dupes.length > 0) {
      console.log(`  ${t}: ${dupes.length} duplicate groups`);
      for (const [slug, entities] of dupes) {
        console.log(`    "${slug}": ${entities.map(e => e.name).join(', ')}`);
      }
    } else {
      console.log(`  ${t}: 0 duplicate slugs`);
    }
  }

  // ===== CHECK 5: Duplicate scientific names within same domain =====
  console.log('\n--- CHECK 5: Duplicate scientific names within same domain ---');
  for (const t of TAXONOMY_TYPES) {
    const dupes = findDuplicates(allItems[t] || [], i => i.scientificName);
    issues.duplicateSciNames.push(...dupes.map(([sciName, entities]) => ({
      domain: t,
      scientificName: sciName,
      entities,
    })));
    if (dupes.length > 0) {
      console.log(`  ${t}: ${dupes.length} duplicate groups`);
      for (const [sciName, entities] of dupes) {
        console.log(`    "${sciName}": ${entities.map(e => e.name).join(', ')}`);
      }
    } else {
      console.log(`  ${t}: 0 duplicate scientific names`);
    }
  }

  // ===== CHECK 6: Entities with null name =====
  console.log('\n--- CHECK 6: Entities with null name ---');
  for (const t of TYPES) {
    const nullNames = (allItems[t] || []).filter(i => !i.name || i.name.trim() === '');
    if (nullNames.length > 0) {
      console.log(`  ${t}: ${nullNames.length} null names`);
      for (const item of nullNames) {
        issues.nullNames.push({ type: t, id: item._id });
        console.log(`    ${item._id}`);
      }
    } else {
      console.log(`  ${t}: 0 null names`);
    }
  }

  // ===== CHECK 7: Entities with null waterType (species, coral, invertebrate) =====
  console.log('\n--- CHECK 7: Entities with null waterType ---');
  const waterTypeRequired = ['species', 'coral', 'invertebrate'];
  for (const t of waterTypeRequired) {
    const nullWT = (allItems[t] || []).filter(i => !i.waterType);
    if (nullWT.length > 0) {
      console.log(`  ${t}: ${nullWT.length} null waterType`);
      for (const item of nullWT) {
        issues.nullWaterType.push({ type: t, id: item._id, name: item.name });
      }
    } else {
      console.log(`  ${t}: 0 null waterType`);
    }
  }

  // ===== CHECK 8: Entities with null category (equipment, problem) =====
  console.log('\n--- CHECK 8: Entities with null category ---');
  const catRequired = ['equipment', 'problem'];
  for (const t of catRequired) {
    const nullCat = (allItems[t] || []).filter(i => !i.category && !i.group);
    if (nullCat.length > 0) {
      console.log(`  ${t}: ${nullCat.length} null category/group`);
      for (const item of nullCat) {
        issues.nullCategory.push({ type: t, id: item._id, name: item.name });
      }
    } else {
      console.log(`  ${t}: 0 null category/group`);
    }
  }

  // ===== CHECK 9: Validate all parentSpecies refs are valid Sanity document refs =====
  console.log('\n--- CHECK 9: parentSpecies ref format validation ---');
  for (const t of TAXONOMY_TYPES) {
    for (const item of allItems[t] || []) {
      if (item.parentSpecies) {
        const ref = item.parentSpecies;
        const isValidFormat = ref && typeof ref === 'object' && ref._type === 'reference' && ref._ref;
        if (!isValidFormat) {
          issues.invalidRefs.push({
            type: t,
            id: item._id,
            name: item.name,
            ref: JSON.stringify(ref),
          });
          console.log(`  INVALID ref format: [${t}] ${item.name}: ${JSON.stringify(ref)}`);
        }
      }
    }
  }
  if (issues.invalidRefs.length === 0) {
    console.log('  All parentSpecies references are valid Sanity document references');
  }

  // ===== SUMMARY =====
  console.log('\n=== INTEGRITY CHECK SUMMARY ===');
  const totalIssues = issues.brokenParentRefs.length
    + issues.selfReferences.length
    + issues.circularChains.length
    + issues.duplicateSlugsGlobal.length
    + issues.duplicateSciNames.length
    + issues.nullNames.length
    + issues.nullWaterType.length
    + issues.nullCategory.length
    + issues.invalidRefs.length;

  console.log(`  Broken parentSpecies refs: ${issues.brokenParentRefs.length}`);
  console.log(`  Self-references: ${issues.selfReferences.length}`);
  console.log(`  Circular chains: ${issues.circularChains.length}`);
  console.log(`  Duplicate slugs (cross-type): ${issues.duplicateSlugsGlobal.length}`);
  console.log(`  Duplicate sci names (per-domain): ${issues.duplicateSciNames.length}`);
  console.log(`  Null names: ${issues.nullNames.length}`);
  console.log(`  Null waterType: ${issues.nullWaterType.length}`);
  console.log(`  Null category/group: ${issues.nullCategory.length}`);
  console.log(`  Invalid ref format: ${issues.invalidRefs.length}`);
  console.log(`  TOTAL ISSUES: ${totalIssues}`);
  console.log(`\nSTATUS: ${totalIssues === 0 ? 'PASS' : 'ISSUES FOUND'}`);

  // ===== WRITE REPORT =====
  if (!fs.existsSync('report')) fs.mkdirSync('report', { recursive: true });

  const report = `# DATABASE PHASE 14 — Data Quality Report (SPEC-13-14)

**Date:** ${new Date().toISOString().split('T')[0]}
**Phase:** 14 — Controlled Coverage Expansion + Taxonomy Normalization
**Status:** ${totalIssues === 0 ? 'PASS' : 'ISSUES FOUND — see details below'}

---

## Summary

| Check | Issues |
|-------|--------|
| Broken parentSpecies references | ${issues.brokenParentRefs.length} |
| Self-references (parentSpecies -> self) | ${issues.selfReferences.length} |
| Circular parent chains | ${issues.circularChains.length} |
| Duplicate slugs (cross-type) | ${issues.duplicateSlugsGlobal.length} |
| Duplicate scientific names (per-domain) | ${issues.duplicateSciNames.length} |
| Entities with null name | ${issues.nullNames.length} |
| Entities with null waterType | ${issues.nullWaterType.length} |
| Entities with null category/group | ${issues.nullCategory.length} |
| Invalid parentSpecies ref format | ${issues.invalidRefs.length} |
| **TOTAL** | **${totalIssues}** |

---

## 1. Broken parentSpecies References

${issues.brokenParentRefs.length === 0 ? 'No broken references found. All parentSpecies references resolve to existing documents.' : issues.brokenParentRefs.map(i => `- **[${i.type}] ${i.name}** (${i.id}) → ref ${i.refId || i.ref}: ${i.reason}`).join('\n')}

---

## 2. Self-References

${issues.selfReferences.length === 0 ? 'No self-references found. No entity points to itself via parentSpecies.' : issues.selfReferences.map(i => `- **[${i.type}] ${i.name}** (${i.id})`).join('\n')}

---

## 3. Circular Parent Chains

${issues.circularChains.length === 0 ? 'No circular parent chains found. All parentSpecies chains are acyclic.' : issues.circularChains.map(i => `- ${i.chain.join(' → ')}`).join('\n')}

---

## 4. Duplicate Slugs (Cross-Type)

${issues.duplicateSlugsGlobal.length === 0 ? 'No duplicate slugs found across all entity types.' : issues.duplicateSlugsGlobal.map(i => `- **"${i.slug}"**: ${i.entities.map(e => `${e.name} [${e.type}]`).join(', ')}`).join('\n')}

---

## 5. Duplicate Scientific Names (Per-Domain)

These are expected for variant/breed/morph entities within the same scientific species (e.g., goldfish variants all share *Carassius auratus*). This is intentional taxonomy modeling, not data errors.

${issues.duplicateSciNames.length === 0 ? 'No duplicate scientific names found.' : issues.duplicateSciNames.map(i => `- **${i.domain}**: *${i.scientificName}* — ${i.entities.map(e => e.name).join(', ')}`).join('\n')}

---

## 6. Entities with Null Name

${issues.nullNames.length === 0 ? 'No entities with null name.' : issues.nullNames.map(i => `- [${i.type}] ${i.id}`).join('\n')}

---

## 7. Entities with Null WaterType (species, coral, invertebrate)

${issues.nullWaterType.length === 0 ? 'No entities with null waterType in required domains.' : issues.nullWaterType.map(i => `- **[${i.type}] ${i.name}** (${i.id})`).join('\n')}

---

## 8. Entities with Null Category/Group (equipment, problem)

${issues.nullCategory.length === 0 ? 'No entities with null category/group in required domains.' : issues.nullCategory.map(i => `- **[${i.type}] ${i.name}** (${i.id})`).join('\n')}

---

## 9. Invalid parentSpecies Ref Format

${issues.invalidRefs.length === 0 ? 'All parentSpecies references use valid Sanity document reference format (object with _type: "reference" and _ref).' : issues.invalidRefs.map(i => `- **[${i.type}] ${i.name}** (${i.id}): ${i.ref}`).join('\n')}

---

## Entity Inventory

| Type | Count |
|------|------:|
${TYPES.map(t => `| ${t} | ${(allItems[t] || []).length} |`).join('\n')}
| **Total** | **${totalEntities}** |

---

*Generated by scripts/phase14-integrity-check.js*
`;

  fs.writeFileSync('report/DATABASE_PHASE_14_DATA_QUALITY_REPORT.md', report);
  console.log('\nWrote report/DATABASE_PHASE_14_DATA_QUALITY_REPORT.md');

  // Also write JSON for programmatic use
  fs.writeFileSync('report/phase14-integrity-check.json', JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalEntities,
    totalIssues,
    status: totalIssues === 0 ? 'PASS' : 'ISSUES_FOUND',
    issues: {
      brokenParentRefs: issues.brokenParentRefs.length,
      selfReferences: issues.selfReferences.length,
      circularChains: issues.circularChains.length,
      duplicateSlugsCrossType: issues.duplicateSlugsGlobal.length,
      duplicateSciNames: issues.duplicateSciNames.length,
      nullNames: issues.nullNames.length,
      nullWaterType: issues.nullWaterType.length,
      nullCategory: issues.nullCategory.length,
      invalidRefs: issues.invalidRefs.length,
    },
    details: issues,
    perTypeCounts: TYPES.reduce((acc, t) => {
      acc[t] = (allItems[t] || []).length;
      return acc;
    }, {}),
  }, null, 2));
  console.log('Wrote report/phase14-integrity-check.json');
}

main().catch(console.error);
