#!/usr/bin/env node
/**
 * Phase 15 — V1 Final QA & Freeze Audit Script
 * SPEC-05 through SPEC-10
 *
 * Reads SANITY_API_TOKEN from .env.local, fetches ALL documents via Sanity HTTP API,
 * and performs comprehensive integrity checks.
 *
 * Usage:  node scripts/phase15-audit-dataquality.js
 */

const fs = require('fs');

/* ── Load .env.local ──────────────────────────────────────────────────────── */
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

/* ── Fetch helpers ────────────────────────────────────────────────────────── */
async function sanityQuery(query, params = {}) {
  let url = `${API_BASE}?query=${encodeURIComponent(query)}`;
  for (const [k, v] of Object.entries(params)) {
    url += `&${k}=${encodeURIComponent(JSON.stringify(v))}`;
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sanity API ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.result || [];
}

async function fetchAllDocs() {
  const ALL_FIELDS = `{_id, _type, name, title, scientificName, slug, waterType, group, region, aquariumStyle, difficulty, light, co2, coralType, category, isPredator, reefCompatibility, photosynthetic, growthForm, redPlant, localNames, aliases, parentSpecies, mainImage, alias, aka, commonNames, localName, vietnameseName, tenKhoaHoc, tankSizeMinL, tankSizeMaxL, sizeCm, tempMinC, tempMaxC, phMin, phMax, ghMin, ghMax, flowRateLh, powerW, temperament, diet, compatibleSpecies, compatiblePlants, compatibleInvertebrates, suitableEquipment, relatedProblems, relatedPosts, placement, growth, flow, tan, lighting, feedSchedule}`;

  const TYPES = [
    'species', 'plant', 'coral', 'invertebrate', 'equipment', 'problem',
    'post', 'category', 'author', 'page', 'aquariumStyle', 'waterType',
    'difficultyrank', 'speciesGroup', 'equipmentCategory', 'problemCategory',
    'tankSetup', 'inspiration',
  ];

  const allDocs = [];
  for (const type of TYPES) {
    let start = 0;
    const batchSize = 1000;
    while (true) {
      const query = `*[_type=="${type}"]${ALL_FIELDS}[${start}...${start + batchSize}]`;
      const batch = await sanityQuery(query);
      if (!batch || batch.length === 0) break;
      allDocs.push(...batch);
      if (batch.length < batchSize) break;
      start += batchSize;
    }
  }
  return allDocs;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function displayName(d) {
  return d.name || d.title || d._id;
}

function normalize(val) {
  if (val === undefined || val === null) return null;
  if (Array.isArray(val)) return val.map(v => (typeof v === 'object' ? v._ref || v._id || v : v)).filter(Boolean);
  if (typeof val === 'object') return val._ref || val._id || val;
  return val;
}

function flatten(val) {
  const n = normalize(val);
  if (Array.isArray(n)) return n;
  if (n !== null && n !== undefined) return [n];
  return [];
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
async function main() {
  console.log('📡  Fetching all documents from Sanity …');
  const docs = await fetchAllDocs();
  console.log(`✅  Fetched ${docs.length} documents\n`);

  const byType = {};
  for (const d of docs) {
    (byType[d._type] = byType[d._type] || []).push(d);
  }

  const findings = [];

  function addFinding(spec, severity, msg) {
    findings.push({ spec, severity, message: msg });
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SPEC-05: Name / Alias / LocalName Integrity
     ═══════════════════════════════════════════════════════════════════════════ */
  console.log('─── SPEC-05: Name / Alias / LocalName Integrity ───');

  const nameIndex = {};   // name.toLowerCase() → { type, id }
  const aliasIndex = {};  // alias.toLowerCase() → { type, id, entityName }
  const localNameIndex = {}; // localName.toLowerCase() → { type, id, entityName }

  for (const d of docs) {
    if (!d.name && !d.title) continue;
    const n = displayName(d);

    // LocalName collisions
    const localNames = flatten(d.localName || d.localNames || d.vietnameseName || d.vnName);
    for (const ln of localNames) {
      if (typeof ln !== 'string') continue;
      const lnLower = ln.toLowerCase();
      if (localNameIndex[lnLower]) {
        addFinding('SPEC-05', 'ERROR',
          `LocalName collision: "${ln}" on ${localNameIndex[lnLower].type} "${localNameIndex[lnLower].entityName}" (${localNameIndex[lnLower].id}) and ${d._type} "${n}" (${d._id})`);
      } else {
        localNameIndex[lnLower] = { type: d._type, id: d._id, entityName: n };
      }
    }

    // Name collisions
    const key = n.toLowerCase();
    if (nameIndex[key]) {
      addFinding('SPEC-05', 'ERROR',
        `Name collision: "${n}" on ${nameIndex[key].type} (${nameIndex[key].id}) and ${d._type} (${d._id})`);
    } else {
      nameIndex[key] = { type: d._type, id: d._id };
    }

    // Aliases
    const aliases = flatten(d.alias || d.aka || d.aliases || d.commonNames);
    for (const a of aliases) {
      if (typeof a !== 'string') continue;
      const al = a.toLowerCase();
      if (aliasIndex[al]) {
        addFinding('SPEC-05', 'ERROR',
          `Conflicting alias: "${a}" used by ${aliasIndex[al].type} "${aliasIndex[al].entityName}" (${aliasIndex[al].id}) and ${d._type} "${n}" (${d._id})`);
      } else {
        aliasIndex[al] = { type: d._type, id: d._id, entityName: n };
      }

      // Alias collides with another entity's name
      if (nameIndex[al] && nameIndex[al].id !== d._id) {
        addFinding('SPEC-05', 'WARNING',
          `Alias "${a}" of ${d._type} "${n}" matches name of ${nameIndex[al].type}`);
      }
    }
  }

  // Vietnamese names mapped to wrong entity
  for (const d of docs) {
    const vn = d.vietnameseName;
    if (!vn || typeof vn !== 'string') continue;
    const currentName = displayName(d).toLowerCase();
    const vnLower = vn.toLowerCase();
    if (vnLower === currentName) continue;
    if (nameIndex[vnLower] && nameIndex[vnLower].id !== d._id) {
      addFinding('SPEC-05', 'WARNING',
        `Vietnamese name "${vn}" on ${d._type} "${displayName(d)}" matches name of ${nameIndex[vnLower].type}`);
    }
  }

  console.log(`  Aliases indexed: ${Object.keys(aliasIndex).length}`);
  console.log(`  LocalNames indexed: ${Object.keys(localNameIndex).length}`);
  console.log(`  Name entries: ${Object.keys(nameIndex).length}`);
  console.log('');

  /* ═══════════════════════════════════════════════════════════════════════════
     SPEC-06: Core Data Completeness
     ═══════════════════════════════════════════════════════════════════════════ */
  console.log('─── SPEC-06: Core Data Completeness ───');

  const criticalFields = {
    species: ['name', 'scientificName', 'slug', 'waterType', 'difficulty', 'aquariumStyle', 'group', 'tankSizeMinL', 'sizeCm', 'tempMinC', 'phMin', 'diet', 'temperament'],
    plant: ['name', 'scientificName', 'difficulty', 'placement', 'light', 'co2', 'growth', 'growthForm', 'aquariumStyle'],
    coral: ['name', 'scientificName', 'coralType', 'difficulty', 'light', 'flow', 'placement', 'photosynthetic', 'aquariumStyle'],
    invertebrate: ['name', 'scientificName', 'waterType', 'group', 'difficulty', 'aquariumStyle'],
    equipment: ['name', 'category', 'aquariumStyle'],
    problem: ['title', 'category', 'waterType'],
  };

  for (const [type, fields] of Object.entries(criticalFields)) {
    const items = byType[type] || [];
    if (items.length === 0) {
      addFinding('SPEC-06', 'WARNING', `No documents of type "${type}" found`);
      continue;
    }
    const missing = {};
    for (const f of fields) missing[f] = [];
    for (const d of items) {
      for (const f of fields) {
        const val = d[f];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          missing[f].push(displayName(d));
        }
      }
    }
    for (const [f, ids] of Object.entries(missing)) {
      if (ids.length > 0) {
        addFinding('SPEC-06', ids.length === items.length ? 'ERROR' : 'WARNING',
          `${type}.${f} missing on ${ids.length}/${items.length} entities: ${ids.slice(0, 5).join(', ')}${ids.length > 5 ? ` (+${ids.length - 5})` : ''}`);
      }
    }
    const totalMissing = Object.values(missing).reduce((s, a) => s + a.length, 0);
    const totalFields = fields.length * items.length;
    const completeness = totalFields > 0 ? ((1 - totalMissing / totalFields) * 100).toFixed(1) : '100.0';
    console.log(`  ${type}: ${items.length} entities, completeness ${completeness}%`);
  }
  console.log('');

  /* ═══════════════════════════════════════════════════════════════════════════
     SPEC-07: Numeric Data Integrity
     ═══════════════════════════════════════════════════════════════════════════ */
  console.log('─── SPEC-07: Numeric Data Integrity ───');

  const rangeFields = [
    ['tankSizeMinL', 'tankSizeMaxL', 'tank size (L)', 0.1, 10000],
    ['sizeCm', null, 'size (cm)', 0.1, 1000],
    ['tempMinC', 'tempMaxC', 'temperature (°C)', -5, 60],
    ['phMin', 'phMax', 'pH', 0, 14],
    ['ghMin', 'ghMax', 'GH', 0, 50],
    ['flowRateLh', null, 'flow rate (L/h)', 0, 50000],
    ['powerW', null, 'power (W)', 0, 10000],
  ];

  const numericTypes = ['species', 'plant', 'coral', 'invertebrate', 'equipment'];

  for (const [minField, maxField, label, minValid, maxValid] of rangeFields) {
    for (const type of numericTypes) {
      const items = byType[type] || [];
      for (const d of items) {
        const minVal = d[minField];
        const maxVal = maxField ? d[maxField] : null;

        if (minVal !== undefined && minVal !== null) {
          if (typeof minVal === 'string') {
            addFinding('SPEC-07', 'ERROR', `${type} "${displayName(d)}".${minField} is string "${minVal}" instead of number`);
          } else if (typeof minVal === 'number') {
            if (minVal < 0) {
              addFinding('SPEC-07', 'ERROR', `${type} "${displayName(d)}".${minField} is negative: ${minVal}`);
            } else if (minValid !== undefined && minVal < minValid) {
              addFinding('SPEC-07', 'WARNING', `${type} "${displayName(d)}".${minField}=${minVal} is below expected minimum ${minValid}`);
            } else if (maxValid !== undefined && minVal > maxValid) {
              addFinding('SPEC-07', 'ERROR', `${type} "${displayName(d)}".${minField}=${minVal} exceeds max plausible ${maxValid}`);
            }
          }
        }

        if (maxVal !== undefined && maxVal !== null) {
          if (typeof maxVal === 'string') {
            addFinding('SPEC-07', 'ERROR', `${type} "${displayName(d)}".${maxField} is string "${maxVal}" instead of number`);
          } else if (typeof maxVal === 'number') {
            if (maxVal < 0) {
              addFinding('SPEC-07', 'ERROR', `${type} "${displayName(d)}".${maxField} is negative: ${maxVal}`);
            } else if (maxValid !== undefined && maxVal > maxValid) {
              addFinding('SPEC-07', 'ERROR', `${type} "${displayName(d)}".${maxField}=${maxVal} exceeds max plausible ${maxValid}`);
            }
          }
        }

        // min <= max
        if (minVal !== undefined && minVal !== null && maxVal !== undefined && maxVal !== null) {
          if (typeof minVal === 'number' && typeof maxVal === 'number' && minVal > maxVal) {
            addFinding('SPEC-07', 'ERROR',
              `${type} "${displayName(d)}": ${minField}=${minVal} > ${maxField}=${maxVal}`);
          }
        }
      }
    }
  }
  console.log('  Numeric checks complete.\n');

  /* ═══════════════════════════════════════════════════════════════════════════
     SPEC-08: Semantic / Style Coverage
     ═══════════════════════════════════════════════════════════════════════════ */
  console.log('─── SPEC-08: Semantic / Style Coverage ───');

  const expectedStyles = [
    'Community', 'Planted', 'Low-Tech', 'High-Tech', 'Aquascaping',
    'Blackwater', 'Biotope', 'Amazon', 'South American', 'Southeast Asian',
    'African Cichlid', 'Shrimp', 'Betta', 'Nano', 'Predator', 'Large Fish',
    'Native', 'Regional',
    'Fish Only', 'FOWLR', 'Nano Reef', 'Mixed Reef', 'Soft Coral Reef',
    'LPS Reef', 'SPS Reef', 'NPS', 'Anemone', 'Clownfish', 'Marine Predator',
    'Invertebrate-focused',
    'Pond', 'Outdoor', 'Brackish',
  ];

  const styleCount = {};
  for (const s of expectedStyles) styleCount[s] = 0;

  const entityTypes = ['species', 'plant', 'coral', 'invertebrate', 'equipment'];
  for (const type of entityTypes) {
    for (const d of (byType[type] || [])) {
      const styles = flatten(d.aquariumStyle);
      for (const s of styles) {
        if (typeof s !== 'string') continue;
        const sl = s.toLowerCase();
        for (const exp of expectedStyles) {
          if (sl.includes(exp.toLowerCase())) {
            styleCount[exp]++;
          }
        }
      }
    }
  }

  for (const [style, count] of Object.entries(styleCount)) {
    if (count === 0) {
      addFinding('SPEC-08', 'WARNING', `No entities for aquariumStyle "${style}"`);
    }
    console.log(`  ${style}: ${count}`);
  }
  console.log('');

  /* ═══════════════════════════════════════════════════════════════════════════
     SPEC-09: Domain Coverage Gate
     ═══════════════════════════════════════════════════════════════════════════ */
  console.log('─── SPEC-09: Domain Coverage Gate ───');

  const domains = {
    freshwater: ['species', 'plant', 'invertebrate'],
    marine: ['coral', 'invertebrate'],
    all: ['species', 'plant', 'coral', 'invertebrate', 'equipment', 'problem'],
  };

  for (const [domain, types] of Object.entries(domains)) {
    const groupCount = {};
    for (const type of types) {
      for (const d of (byType[type] || [])) {
        const groups = flatten(d.group);
        for (const g of groups) {
          if (typeof g !== 'string') continue;
          groupCount[g] = (groupCount[g] || 0) + 1;
        }
      }
    }
    console.log(`  Domain "${domain}":`);
    const sorted = Object.entries(groupCount).sort((a, b) => b[1] - a[1]);
    for (const [g, c] of sorted) {
      console.log(`    ${g}: ${c}`);
    }
    if (sorted.length === 0) {
      addFinding('SPEC-09', 'WARNING', `No group data found for domain "${domain}"`);
    }
    console.log('');
  }

  // Check for defined speciesGroups with 0 references
  const groupDocs = byType['speciesGroup'] || [];
  const allReferencedGroups = new Set();
  for (const type of entityTypes) {
    for (const d of (byType[type] || [])) {
      const groups = flatten(d.group);
      for (const g of groups) {
        if (typeof g === 'string') allReferencedGroups.add(g);
      }
    }
  }
  for (const gd of groupDocs) {
    const gName = gd.name || gd.title || gd._id;
    if (!allReferencedGroups.has(gName)) {
      addFinding('SPEC-09', 'INFO', `SpeciesGroup "${gName}" defined but has 0 referenced entities`);
    }
  }
  console.log('');

  /* ═══════════════════════════════════════════════════════════════════════════
     SPEC-10: Relationship Integrity
     ═══════════════════════════════════════════════════════════════════════════ */
  console.log('─── SPEC-10: Relationship Integrity ───');

  const docIds = new Set(docs.map(d => d._id));
  const refFields = [
    'compatibleSpecies', 'compatiblePlants', 'compatibleInvertebrates',
    'suitableEquipment', 'relatedProblems', 'relatedPosts', 'parentSpecies',
    'species', 'plant', 'coral', 'invertebrate', 'equipment',
    'problems', 'posts', 'tankSetup',
  ];

  let totalRefs = 0;
  let brokenRefs = 0;
  let selfRefs = 0;

  for (const d of docs) {
    for (const field of refFields) {
      const raw = d[field];
      if (!raw) continue;
      const vals = flatten(raw);
      for (const ref of vals) {
        const refId = typeof ref === 'object' ? (ref._ref || ref._id) : ref;
        if (!refId || typeof refId !== 'string') continue;
        totalRefs++;
        if (refId === d._id) {
          selfRefs++;
          addFinding('SPEC-10', 'WARNING',
            `Self-reference: ${d._type} "${displayName(d)}" (${d._id}).${field} → ${refId}`);
        } else if (!docIds.has(refId)) {
          brokenRefs++;
          addFinding('SPEC-10', 'ERROR',
            `Broken reference: ${d._type} "${displayName(d)}" (${d._id}).${field} → "${refId}" not found`);
        }
      }
    }
  }

  console.log(`  Total references checked: ${totalRefs}`);
  console.log(`  Broken references: ${brokenRefs}`);
  console.log(`  Self-references: ${selfRefs}`);
  console.log('');

  /* ═══════════════════════════════════════════════════════════════════════════
     SUMMARY
     ═══════════════════════════════════════════════════════════════════════════ */
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    AUDIT SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');

  const errors = findings.filter(f => f.severity === 'ERROR');
  const warnings = findings.filter(f => f.severity === 'WARNING');
  const infos = findings.filter(f => f.severity === 'INFO');

  console.log(`  Total findings: ${findings.length}`);
  console.log(`    ERROR:   ${errors.length}`);
  console.log(`    WARNING: ${warnings.length}`);
  console.log(`    INFO:    ${infos.length}`);
  console.log('');

  if (errors.length > 0) {
    console.log('🔴  ERRORS:');
    for (const e of errors) console.log(`  [${e.spec}] ${e.message}`);
    console.log('');
  }
  if (warnings.length > 0) {
    console.log('🟡  WARNINGS:');
    for (const w of warnings) console.log(`  [${w.spec}] ${w.message}`);
    console.log('');
  }
  if (infos.length > 0) {
    console.log('🔵  INFO:');
    for (const i of infos) console.log(`  [${i.spec}] ${i.message}`);
    console.log('');
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅  All checks passed — no errors or warnings.');
  } else if (errors.length === 0) {
    console.log('⚠️   No errors, but warnings found. Review before V1 freeze.');
  } else {
    console.log('❌  Errors found — V1 freeze blocked. Fix all ERRORs first.');
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('💥  Audit script failed:', err);
  process.exit(2);
});
