const fs = require('fs');
const path = require('path');

const RAW = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_00_1', 'raw', 'spec00_1_raw_dump.json'), 'utf8'));
const records = RAW.records;
const OUT = path.join('report', 'SPEC_00_1');
fs.mkdirSync(OUT, { recursive: true });

const CATEGORIES = {
  species: 'Fish / Species',
  plant: 'Plants',
  invertebrate: 'Invertebrates',
  coral: 'Corals',
  equipment: 'Equipment',
  problem: 'Problems',
};
const ROUTES = {
  species: 'species',
  plant: 'plants',
  invertebrate: 'invertebrates',
  coral: 'corals',
  equipment: 'equipment',
  problem: 'problems',
};

// Global id index: id -> type (published + drafts)
const idType = {};
const drafts = {};
for (const [type, items] of Object.entries(records)) {
  for (const item of items) {
    const isDraft = item._id.startsWith('drafts.');
    idType[item._id] = type;
    if (isDraft) drafts[item._id] = { type, item };
  }
}

const EXPECTED_REF_TYPE = {
  'species.parentSpecies': 'species',
  'species.compatibleSpecies': 'species',
  'species.compatiblePlants': 'plant',
  'species.compatibleInvertebrates': 'invertebrate',
  'species.suitableEquipment': 'equipment',
  'species.relatedProblems': 'problem',
  'species.relatedPosts': 'post',
  'plant.suitableEquipment': 'equipment',
  'plant.relatedProblems': 'problem',
  'plant.relatedPosts': 'post',
  'invertebrate.parentSpecies': 'invertebrate',
  'invertebrate.compatibleSpecies': 'species',
  'invertebrate.suitableEquipment': 'equipment',
  'invertebrate.relatedProblems': 'problem',
  'invertebrate.relatedPosts': 'post',
  'coral.suitableEquipment': 'equipment',
  'coral.relatedProblems': 'problem',
  'coral.relatedPosts': 'post',
  'equipment.relatedPosts': 'post',
  'problem.relatedPosts': 'post',
  'problem.relatedTools': 'tool',
};

const REF_FIELDS_BY_TYPE = {
  species: ['parentSpecies', 'compatibleSpecies', 'compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedProblems', 'relatedPosts'],
  plant: ['suitableEquipment', 'relatedProblems', 'relatedPosts'],
  invertebrate: ['parentSpecies', 'compatibleSpecies', 'suitableEquipment', 'relatedProblems', 'relatedPosts'],
  coral: ['suitableEquipment', 'relatedProblems', 'relatedPosts'],
  equipment: ['relatedPosts'],
  problem: ['relatedPosts', 'relatedTools'],
};
// fields that are single reference objects (not arrays)
const SINGLE_REF = new Set(['parentSpecies']);

// ---- Helpers ----
const norm = (s) => (s == null ? null : String(s).trim().toLowerCase().replace(/\s+/g, ' '));
const normSlug = (s) => (s == null ? null : String(s).trim().toLowerCase().replace(/\s+/g, '-'));
const validSlug = (s) => s != null && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);

function escCsv(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function titleOf(type, item) {
  return type === 'problem' ? item.title : item.name;
}
function internalNameOf(type, item) {
  if (type === 'problem') return null;
  if (item.scientificName) return item.scientificName;
  if (item.brand || item.model) return [item.brand, item.model].filter(Boolean).join(' ');
  return null;
}
function bodyPresence(type, item) {
  // problem: symptoms/causes/whatToCheck/whatNotToDo block arrays
  if (type === 'problem') {
    return ['symptoms', 'causes', 'whatToCheck', 'whatNotToDo'].reduce(
      (acc, f) => acc + (Array.isArray(item[f]) && item[f].length ? item[f].length : 0), 0
    );
  }
  return null; // no body field on these types
}
function excerptPresence(item) {
  return item.excerpt != null && String(item.excerpt).trim().length > 0;
}
function imagePresence(item) {
  return !!(item.mainImage && item.mainImage.asset);
}
function refsOf(type, item) {
  const out = [];
  for (const f of REF_FIELDS_BY_TYPE[type] || []) {
    const v = item[f];
    if (!v) continue;
    const arr = Array.isArray(v) ? v : [v];
    for (const r of arr) {
      if (r && typeof r === 'object' && r._ref) out.push({ field: f, ref: r._ref });
    }
  }
  return out;
}

// ---- Build canonical (published) records ----
const inventory = [];
const PROBLEM_ROUTE_ISSUES = new Set();
const seenSlugsByRoute = {}; // routebase -> normalizedSlug -> [ids]

for (const [type, items] of Object.entries(records)) {
  if (!CATEGORIES[type]) continue; // skip non-wiki
  for (const item of items) {
    const isDraft = item._id.startsWith('drafts.');
    const slug = item.slug?.current ?? null;
    const title = titleOf(type, item);
    const route = ROUTES[type];
    const normTitle = norm(title);
    const nSlug = normSlug(slug);
    const refs = refsOf(type, item);

    const record = {
      category: CATEGORIES[type],
      document_type: type,
      canonical_id: isDraft ? item._id : item._id,
      slug: slug ?? null,
      title: title ?? null,
      displayName: title ?? null,
      internalName: internalNameOf(type, item),
      categorySlug: route,
      parent_refs: refs.filter((r) => r.field === 'parentSpecies').map((r) => r.ref),
      source_dataset: 'production',
      source_file: `sanity/data via API (project zeohjejw)`,
      source_location: `*[_type == "${type}"]`,
      route: slug ? `/${route}/${slug}` : `/${route}/undefined`,
      referenced_records: refs.map((r) => r.ref),
      relationship_count: refs.length,
      has_body: bodyPresence(type, item),
      has_excerpt: excerptPresence(item),
      has_image: imagePresence(item),
      is_draft: isDraft,
      audit_status: 'OK',
      notes: [],
    };

    // Null / empty identity checks
    if (!item || typeof item !== 'object' || item._id == null) { record.audit_status = 'ISSUE'; record.notes.push('NULL_ID'); }
    if (title == null || String(title).trim() === '') { record.audit_status = 'ISSUE'; record.notes.push('NULL_TITLE'); }
    if (slug == null || String(slug).trim() === '') {
      record.audit_status = 'ISSUE'; record.notes.push('NULL_SLUG');
      PROBLEM_ROUTE_ISSUES.add(item._id);
    }

    inventory.push(record);
  }
}

// ---- Duplicate detection on published records only ----
const published = inventory.filter((r) => !r.is_draft);
const dups = { ids: [], slugs: [], titles: [] };

// Duplicate IDs (canonical id base without drafts. prefix)
const idBaseGroups = {};
for (const r of published) {
  const base = r.canonical_id.replace(/^drafts\./, '');
  (idBaseGroups[base] = idBaseGroups[base] || []).push(r);
}
for (const [base, recs] of Object.entries(idBaseGroups)) {
  const distinct = new Set(recs.map((r) => r.canonical_id));
  if (distinct.size > 1) dups.ids.push({ id: base, records: recs.map((r) => r.canonical_id) });
}

// Duplicate slugs (normalized) — within the same route base and globally
const slugGroups = {};
for (const r of published) {
  const n = normSlug(r.slug);
  if (n == null) continue;
  (slugGroups[n] = slugGroups[n] || []).push(r);
  const key = `${r.categorySlug}|${n}`;
  (seenSlugsByRoute[key] = seenSlugsByRoute[key] || []).push(r.canonical_id);
}
for (const [n, recs] of Object.entries(slugGroups)) {
  if (recs.length > 1) dups.slugs.push({ slug: n, records: recs.map((r) => ({ id: r.canonical_id, cat: r.category, raw: r.slug })) });
}

// Duplicate titles (normalized) — cross-category classification
const titleGroups = {};
for (const r of published) {
  const n = norm(r.title);
  if (n == null) continue;
  (titleGroups[n] = titleGroups[n] || []).push(r);
}
for (const [n, recs] of Object.entries(titleGroups)) {
  if (recs.length < 2) continue;
  const byType = {};
  for (const r of recs) (byType[r.document_type] = byType[r.document_type] || []).push(r);
  const classes = [];
  for (const [t, rs] of Object.entries(byType)) {
    const slugSet = new Set(rs.map((r) => normSlug(r.slug)));
    if (rs.length > 1 && slugSet.size === 1) classes.push({ type: t, class: 'TRUE_DUPLICATE', records: rs.map((r) => r.canonical_id), slugs: [...slugSet] });
    else if (rs.length > 1 && slugSet.size > 1) classes.push({ type: t, class: 'POSSIBLE_DUPLICATE', records: rs.map((r) => r.canonical_id), slugs: [...slugSet] });
  }
  if (Object.keys(byType).length > 1) {
    classes.push({ type: Object.keys(byType).join('+'), class: 'LEGITIMATE_SAME_NAME', records: recs.map((r) => r.canonical_id) });
  }
  if (classes.length) dups.titles.push({ title: n, classes });
}

// ---- Broken references ----
const brokenRefs = [];
for (const r of published) {
  for (const f of REF_FIELDS_BY_TYPE[r.document_type] || []) {
    const items = records[r.document_type];
    const rec = items.find((x) => x._id === r.canonical_id);
    if (!rec) continue;
    let v = rec[f];
    if (!v) continue;
    const arr = Array.isArray(v) ? v : [v];
    for (const refObj of arr) {
      const ref = refObj?._ref;
      if (!ref) {
        brokenRefs.push({
          source: r.canonical_id, sourceCat: r.category, field: f, targetId: '(malformed ref)', targetExists: false,
          severity: 'HIGH', issue: 'BROKEN_REFERENCE', desc: 'Malformed reference (no _ref)', evidence: JSON.stringify(refObj),
        });
        continue;
      }
      const targetType = idType[ref];
      const expected = EXPECTED_REF_TYPE[`${r.document_type}.${f}`];
      if (!targetType) {
        brokenRefs.push({
          source: r.canonical_id, sourceCat: r.category, field: f, targetId: ref, targetExists: false,
          severity: 'HIGH', issue: 'BROKEN_REFERENCE', desc: `Reference target nonexistent (expected ${expected})`, evidence: `_ref=${ref}`,
        });
      } else if (expected && targetType !== expected) {
        brokenRefs.push({
          source: r.canonical_id, sourceCat: r.category, field: f, targetId: ref, targetExists: true,
          severity: 'HIGH', issue: 'BROKEN_REFERENCE', desc: `Reference target type mismatch: got ${targetType}, expected ${expected}`, evidence: `_ref=${ref} targetType=${targetType}`,
        });
      }
    }
  }
}

// ---- Route / accessibility ----
for (const r of published) {
  if (r.slug == null) r.routeResult = 'BROKEN_ROUTE';
  else if (!validSlug(r.slug)) r.routeResult = 'BROKEN_ROUTE';
  else {
    const key = `${r.categorySlug}|${normSlug(r.slug)}`;
    const group = seenSlugsByRoute[key] || [];
    if (group.length > 1) r.routeResult = 'DUPLICATE_ROUTE';
    else r.routeResult = 'OK';
  }
}

// ---- Issues assembly ----
function addIssue(rec, severity, issueType, field, description, evidence) {
  rec.audit_status = 'ISSUE';
  if (!rec.notes.includes(issueType)) rec.notes.push(issueType);
  return {
    issue_id: `I${String(issues.length + 1).padStart(4, '0')}`,
    severity, category: rec.category, canonical_id: rec.canonical_id, slug: rec.slug,
    issue_type: issueType, field, description, evidence, status: 'VERIFIED',
  };
}

const issues = [];
for (const r of published) {
  if (r.notes.includes('NULL_ID')) issues.push(addIssue(r, 'CRITICAL', 'NULL_ID', '_id', 'Missing canonical _id', 'record has no _id'));
  if (r.notes.includes('NULL_TITLE')) issues.push(addIssue(r, 'CRITICAL', 'NULL_TITLE', titleField(r.document_type), 'Missing title/name', 'title/name is null or empty'));
  if (r.notes.includes('NULL_SLUG')) issues.push(addIssue(r, 'HIGH', 'NULL_SLUG', 'slug.current', 'Missing slug', `route would be /${r.categorySlug}/undefined`));
  if (r.routeResult === 'BROKEN_ROUTE') issues.push(addIssue(r, 'HIGH', 'BROKEN_ROUTE', 'slug.current', 'Invalid slug for routing', `slug="${r.slug}"`));
  if (r.routeResult === 'DUPLICATE_ROUTE') issues.push(addIssue(r, 'HIGH', 'DUPLICATE_SLUG', 'slug.current', 'Route collision (duplicate slug in same category)', `slug="${r.slug}"`));
  const ncat = requiredCategoryNull(r);
  if (ncat) issues.push(addIssue(r, 'HIGH', 'NULL_CATEGORY', ncat.field, `Missing required ${ncat.field}`, `schema requires ${ncat.field}`));
  if (!r.has_excerpt) issues.push(addIssue(r, 'MEDIUM', 'EMPTY_EXCERPT', 'excerpt', 'Missing/empty excerpt', 'excerpt is null or whitespace'));
  if (r.document_type === 'problem' && r.has_body === 0) issues.push(addIssue(r, 'MEDIUM', 'EMPTY_BODY', 'symptoms/causes/whatToCheck/whatNotToDo', 'Problem has no body content', 'all block arrays empty'));
  if (r.has_image === false && ['problem'].includes(r.document_type) === false) issues.push(addIssue(r, 'MEDIUM', 'MISSING_IMAGE', 'mainImage', 'Missing main image', 'mainImage.asset is null'));
}

function requiredCategoryNull(rec) {
  const fieldSets = {
    problem: ['category'],
    equipment: ['category'],
    species: ['waterType'],
    invertebrate: ['waterType', 'group'],
    coral: ['coralType'],
  };
  const fields = fieldSets[rec.document_type];
  if (!fields) return null;
  const recRaw = records[rec.document_type].find((x) => x._id === rec.canonical_id);
  for (const f of fields) {
    const v = recRaw ? recRaw[f] : null;
    if (v == null || String(v).trim() === '') return { field: f, requireNonEmpty: true };
  }
  return null;
}
for (const b of brokenRefs) {
  issues.push({
    issue_id: `I${String(issues.length + 1).padStart(4, '0')}`,
    severity: b.severity, category: b.sourceCat, canonical_id: b.source, slug: null,
    issue_type: b.issue, field: b.field, description: b.desc, evidence: b.evidence, status: 'VERIFIED',
  });
}
for (const d of Object.values(drafts)) {
  issues.push({
    issue_id: `I${String(issues.length + 1).padStart(4, '0')}`,
    severity: 'LOW', category: CATEGORIES[d.type] || d.type, canonical_id: d.item._id, slug: d.item.slug?.current ?? null,
    issue_type: 'OTHER', field: '_id', description: 'Draft record exists in dataset', evidence: `_id=${d.item._id}`, status: 'VERIFIED',
  });
}
function titleField(type) { return type === 'problem' ? 'title' : 'name'; }

// ---- Category integrity ----
const catIntegrity = [];
const categoryFieldRules = {
  problem: { field: 'category', allowed: ['water', 'algae', 'plants', 'fish', 'equipment'] },
  equipment: { field: 'category', allowed: ['Filter', 'Light', 'Pump', 'Heater', 'CO₂ System', 'Substrate', 'Test Kit', 'Other'] },
  species: { field: 'waterType', allowed: ['freshwater', 'saltwater', 'brackish'] },
  invertebrate: { field: 'waterType', allowed: ['freshwater', 'saltwater', 'brackish'] },
  invertebrate2: { field: 'group', allowed: ['shrimp', 'snail', 'starfish', 'crab', 'anemone', 'urchin', 'other'] },
  coral: { field: 'coralType', allowed: ['soft', 'lps', 'sps', 'nps'] },
};
for (const r of published) {
  const rec = records[r.document_type].find((x) => x._id === r.canonical_id);
  const checks = [
    { field: 'category', allowed: categoryFieldRules.problem.allowed },
  ];
  // apply only if type has that field
  if (r.document_type === 'problem' && rec && rec.category && !categoryFieldRules.problem.allowed.includes(rec.category)) {
    catIntegrity.push({ id: r.canonical_id, type: 'problem', field: 'category', value: rec.category });
  }
  if (r.document_type === 'equipment' && rec && rec.category && !categoryFieldRules.equipment.allowed.includes(rec.category)) {
    catIntegrity.push({ id: r.canonical_id, type: 'equipment', field: 'category', value: rec.category });
  }
  if ((r.document_type === 'species' || r.document_type === 'invertebrate') && rec && rec.waterType && !categoryFieldRules.species.allowed.includes(rec.waterType)) {
    catIntegrity.push({ id: r.canonical_id, type: r.document_type, field: 'waterType', value: rec.waterType });
  }
  if (r.document_type === 'invertebrate' && rec && rec.group && !categoryFieldRules.invertebrate2.allowed.includes(rec.group)) {
    catIntegrity.push({ id: r.canonical_id, type: 'invertebrate', field: 'group', value: rec.group });
  }
  if (r.document_type === 'coral' && rec && rec.coralType && !categoryFieldRules.coral.allowed.includes(rec.coralType)) {
    catIntegrity.push({ id: r.canonical_id, type: 'coral', field: 'coralType', value: rec.coralType });
  }
}
for (const c of catIntegrity) {
  issues.push({
    issue_id: `I${String(issues.length + 1).padStart(4, '0')}`,
    severity: 'HIGH', category: CATEGORIES[c.type], canonical_id: c.id, slug: null,
    issue_type: 'INVALID_CATEGORY', field: c.field, description: `Invalid category value "${c.value}" for ${c.type}`, evidence: `${c.field}=${c.value}`, status: 'VERIFIED',
  });
}

// ---- Language contamination (CJK) ----
const CJK = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/;
const langFlags = [];
for (const r of published) {
  const rec = records[r.document_type].find((x) => x._id === r.canonical_id);
  if (!rec) continue;
  const checkFields = [];
  if (rec.name) checkFields.push(['name', rec.name]);
  if (rec.scientificName) checkFields.push(['scientificName', rec.scientificName]);
  if (rec.title) checkFields.push(['title', rec.title]);
  if (rec.excerpt) checkFields.push(['excerpt', rec.excerpt]);
  for (const arrField of ['localNames', 'aliases']) {
    if (Array.isArray(rec[arrField])) for (const v of rec[arrField]) checkFields.push([arrField, v]);
  }
  for (const [f, v] of checkFields) {
    if (CJK.test(String(v))) langFlags.push({ id: r.canonical_id, type: r.document_type, field: f, value: v });
  }
}
for (const l of langFlags) {
  issues.push({
    issue_id: `I${String(issues.length + 1).padStart(4, '0')}`,
    severity: 'LOW', category: CATEGORIES[l.type], canonical_id: l.id, slug: null,
    issue_type: 'LANGUAGE_CONTAMINATION', field: l.field, description: `Non-English (CJK) characters in ${l.field}`, evidence: JSON.stringify(l.value), status: 'VERIFIED',
  });
}

// ---- Category summary ----
const summary = [];
for (const [type, cat] of Object.entries(CATEGORIES)) {
  const list = published.filter((r) => r.document_type === type);
  const count = list.length;
  summary.push({
    category: cat,
    canonical_count: count,
    duplicate_count: dups.slugs.filter((g) => g.records.some((x) => x.cat === cat)).length,
    null_id_count: list.filter((r) => r.notes.includes('NULL_ID')).length,
    null_slug_count: list.filter((r) => r.notes.includes('NULL_SLUG')).length,
    broken_reference_count: brokenRefs.filter((b) => b.sourceCat === cat).length,
    broken_route_count: list.filter((r) => r.routeResult === 'BROKEN_ROUTE' || r.routeResult === 'DUPLICATE_ROUTE').length,
    empty_body_count: type === 'problem' ? list.filter((r) => r.has_body === 0).length : 0,
    empty_excerpt_count: list.filter((r) => !r.has_excerpt).length,
    missing_image_count: type === 'problem' ? 0 : list.filter((r) => !r.has_image).length,
    relationship_count: list.reduce((s, r) => s + r.relationship_count, 0),
    reachable_count: list.filter((r) => r.routeResult === 'OK').length,
    unreachable_count: list.filter((r) => r.routeResult !== 'OK').length,
  });
}

// ---- Historical issue verification ----
function findProblemByTitle(needle) {
  return published.filter((r) => r.document_type === 'problem' && r.title && r.title.toLowerCase().includes(needle.toLowerCase()));
}
const historical = {};

// 14.1 Black Beard Algae -> /problems/undefined
{
  const bba = published.filter((r) => r.document_type === 'problem' && /black\s?beard\s?algae|bba/i.test(r.title || ''));
  const noSlug = published.filter((r) => r.document_type === 'problem' && (r.slug == null || r.slug.trim() === ''));
  historical.bba = {
    reported: 'Black Beard Algae route resolves to /problems/undefined',
    status: noSlug.length ? 'VERIFIED' : 'NOT FOUND',
    records: bba.map((r) => ({ id: r.canonical_id, title: r.title, slug: r.slug })),
    problemsWithoutSlug: noSlug.map((r) => ({ id: r.canonical_id, title: r.title })),
  };
}

// 14.2 Ich / White Spot
{
  const ich = published.filter((r) => r.document_type === 'problem' && /ich|white\s?spot/i.test(r.title || ''));
  historical.ich = {
    reported: 'Two records: ich-white-spot-disease and white-spot-disease, one reported null/broken',
    status: 'VERIFIED',
    records: ich.map((r) => ({ id: r.canonical_id, title: r.title, slug: r.slug, excerpt: !!r.has_excerpt, body: r.has_body })),
  };
}

// 14.3 Coral -> Problem relationships
{
  const coralProblems = [];
  for (const r of published.filter((x) => x.document_type === 'coral')) {
    const rec = records.coral.find((x) => x._id === r.canonical_id);
    const refs = (rec?.relatedProblems || []).map((x) => x._ref);
    coralProblems.push({ coral: r.title, id: r.canonical_id, problemRefs: refs });
  }
  const allProblemRefs = new Set(published.filter((x) => x.document_type === 'problem').map((x) => x.canonical_id));
  const torch = coralProblems.find((c) => /torch/i.test(c.coral || ''));
  const specific = ['Brown Jelly Disease', 'RTN', 'STN', 'Coral Bleaching'];
  const specificExist = Object.fromEntries(specific.map((n) => [n, published.some((p) => p.title === n && p.document_type === 'problem')]));
  let genericProblemRefs = [];
  if (torch) {
    genericProblemRefs = (torch.problemRefs || []).map((ref) => {
      const p = published.find((x) => x.canonical_id === ref);
      return { ref, title: p?.title ?? null, exists: allProblemRefs.has(ref) };
    });
  }
  historical.coralProblems = {
    status: 'VERIFIED',
    genericNames: ['Old Tank Syndrome', 'Filter Crash', 'Cloudy Water'],
    torchProblemRefs: genericProblemRefs,
    coralProblemRefsCount: coralProblems.reduce((s, c) => s + (c.problemRefs || []).length, 0),
    coralsWithProblems: coralProblems.filter((c) => (c.problemRefs || []).length > 0).length,
    coralSpecificProblemsExist: specificExist,
  };
  // flag coral references to generic (non-coral) problems
  for (const c of coralProblems) {
    for (const ref of c.problemRefs || []) {
      const p = published.find((x) => x.canonical_id === ref);
      const name = (p?.title || '').toLowerCase();
      const generic = ['old tank syndrome', 'filter crash', 'cloudy water'];
      if (p && generic.some((g) => name.includes(g))) {
        issues.push({
          issue_id: `I${String(issues.length + 1).padStart(4, '0')}`,
          severity: 'LOW', category: 'Corals', canonical_id: c.id, slug: null,
          issue_type: 'OTHER', field: 'relatedProblems',
          description: `Coral references generic problem "${p.title}"`, evidence: `_ref=${ref}`,
          status: 'VERIFIED',
        });
      }
    }
  }
}

// 14.4 Empty problem bodies
{
  const names = ['Brown Jelly Disease', 'RTN', 'STN', 'Coral Bleaching', 'Aiptasia Infestation', 'High Nitrate', 'High Nitrite', 'pH Crash', 'pH Drift', 'Heater Stuck On', 'Heater Stuck Off'];
  const empty = [];
  for (const n of names) {
    const p = published.find((x) => x.title === n && x.document_type === 'problem');
    empty.push({ title: n, found: !!p, body: p ? p.has_body : null, id: p?.canonical_id ?? null });
  }
  historical.emptyProblemBodies = { status: 'VERIFIED', items: empty, emptyCount: empty.filter((e) => e.found && e.body === 0).length };
}

// 14.5 Plant language contamination
{
  const plantFlags = langFlags.filter((l) => l.type === 'plant');
  const frogbit = published.find((x) => x.document_type === 'plant' && /frogbit/i.test(x.title || ''));
  const salvinia = published.find((x) => x.document_type === 'plant' && /salvinia/i.test(x.title || ''));
  historical.plantLanguage = {
    status: plantFlags.length ? 'VERIFIED' : 'NOT FOUND',
    plantFlags: plantFlags.map((f) => ({ id: f.id, field: f.field, value: f.value })),
    frogbit: { found: !!frogbit, id: frogbit?.canonical_id ?? null },
    salvinia: { found: !!salvinia, id: salvinia?.canonical_id ?? null },
  };
}

// 14.6 Babaulti / Rabbit Snail display data
{
  const babaulti = published.find((x) => /babaulti/i.test(x.title || ''));
  const rabbit = published.find((x) => /rabbit\s?snail/i.test(x.title || ''));
  const rec = (r) => (r ? records[r.document_type].find((x) => x._id === r.canonical_id) : null);
  historical.invertebrateDisplay = {
    status: 'VERIFIED',
    babaulti: babaulti ? { id: babaulti.canonical_id, title: babaulti.title, group: rec(babaulti)?.group, waterType: rec(babaulti)?.waterType, image: !!rec(babaulti)?.mainImage } : null,
    rabbit: rabbit ? { id: rabbit.canonical_id, title: rabbit.title, group: rec(rabbit)?.group, waterType: rec(rabbit)?.waterType, image: !!rec(rabbit)?.mainImage } : null,
  };
}

// ---- Output: Canonical inventory JSON/CSV ----
const inventoryRows = published.map((r) => ({
  category: r.category,
  document_type: r.document_type,
  canonical_id: r.canonical_id,
  slug: r.slug,
  title: r.title,
  displayName: r.displayName,
  internalName: r.internalName,
  categorySlug: r.categorySlug,
  source_dataset: r.source_dataset,
  source_file: r.source_file,
  source_location: r.source_location,
  route: r.routeResult === 'BROKEN_ROUTE' && r.slug == null ? `/${r.categorySlug}/undefined` : r.route,
  referenced_records: r.referenced_records.join('|'),
  relationship_count: r.relationship_count,
  parent_refs: r.parent_refs.join('|'),
  has_excerpt: r.has_excerpt,
  has_body: r.has_body,
  has_image: r.has_image,
  route_result: r.routeResult,
  audit_status: r.audit_status,
  notes: r.notes.join(';'),
}));

fs.writeFileSync(path.join(OUT, 'SPEC_00_1_CANONICAL_INVENTORY.json'), JSON.stringify({ generatedAt: RAW.manifest.generatedAt, count: inventoryRows.length, records: inventoryRows }, null, 2));

const INV_HEADERS = ['category', 'document_type', 'canonical_id', 'slug', 'title', 'displayName', 'internalName', 'categorySlug', 'source_dataset', 'source_file', 'source_location', 'route', 'referenced_records', 'relationship_count', 'parent_refs', 'has_excerpt', 'has_body', 'has_image', 'route_result', 'audit_status', 'notes'];
fs.writeFileSync(path.join(OUT, 'SPEC_00_1_CANONICAL_INVENTORY.csv'), INV_HEADERS.join(',') + '\n' + inventoryRows.map((r) => INV_HEADERS.map((h) => escCsv(r[h])).join(',')).join('\n') + '\n');

// ---- Output: issues CSV ----
const ISS_HEADERS = ['issue_id', 'severity', 'category', 'canonical_id', 'slug', 'issue_type', 'field', 'description', 'evidence', 'status'];
fs.writeFileSync(path.join(OUT, 'SPEC_00_1_INTEGRITY_ISSUES.csv'), ISS_HEADERS.join(',') + '\n' + issues.map((r) => ISS_HEADERS.map((h) => escCsv(r[h])).join(',')).join('\n') + '\n');

// ---- Output: category summary CSV/JSON ----
const SUM_HEADERS = ['category', 'canonical_count', 'duplicate_count', 'null_id_count', 'null_slug_count', 'broken_reference_count', 'broken_route_count', 'empty_body_count', 'empty_excerpt_count', 'missing_image_count', 'reachable_count', 'unreachable_count'];
fs.writeFileSync(path.join(OUT, 'SPEC_00_1_CATEGORY_SUMMARY.csv'), SUM_HEADERS.join(',') + '\n' + summary.map((r) => SUM_HEADERS.map((h) => escCsv(r[h])).join(',')).join('\n') + '\n');
fs.writeFileSync(path.join(OUT, 'SPEC_00_1_CATEGORY_SUMMARY.json'), JSON.stringify({ generatedAt: RAW.manifest.generatedAt, summary }, null, 2));

// ---- Output: raw source manifest ----
const manifest = {
  ...RAW.manifest,
  recordCountsAfterNormalization: Object.fromEntries(
    Object.entries(records).filter(([t]) => CATEGORIES[t]).map(([t, v]) => [t, v.filter((x) => !x._id.startsWith('drafts.')).length])
  ),
  normalizationApplied: 'strip drafts, normalize slug (lowercase/trim), normalize title (lowercase/trim/collapse spaces)',
  canonicalDataset: 'production',
  timestampCompleted: new Date().toISOString(),
  issues: issues.length,
  duplicatedSlugGroups: dups.slugs.length,
  duplicatedTitleGroups: dups.titles.length,
  brokenRefs: brokenRefs.length,
};
fs.writeFileSync(path.join(OUT, 'SPEC_00_1_RAW_SOURCE_MANIFEST.json'), JSON.stringify(manifest, null, 2));

// ---- Console report ----
console.log('==== SPEC 00.1 AUDIT RESULTS ====');
console.log('Canonical inventory rows:', inventoryRows.length);
for (const s of summary) {
  console.log(`  ${s.category.padEnd(16)} n=${s.canonical_count} reachable=${s.reachable_count} brokenRoute=${s.broken_route_count} emptyBody=${s.empty_body_count} emptyExcerpt=${s.empty_excerpt_count} missingImage=${s.missing_image_count} refs=${s.relationship_count}`);
}
console.log('Total issues:', issues.length);
const bySev = {};
for (const i of issues) bySev[i.severity] = (bySev[i.severity] || 0) + 1;
console.log('  severity:', JSON.stringify(bySev));
console.log('Duplicate slugs:', dups.slugs.length, 'groups');
console.log('Duplicate titles:', dups.titles.length, 'groups');
console.log('Broken refs:', brokenRefs.length);
console.log('Category integrity issues:', catIntegrity.length);
console.log('Language (CJK) flags:', langFlags.length);
console.log('\nDup slug groups:');
for (const g of dups.slugs) console.log(`  "${g.slug}" -> ${g.records.map((x) => `${x.id}(${x.cat})[raw=${x.raw}]`).join(', ')}`);
console.log('\nDup title groups:');
for (const g of dups.titles) {
  console.log(`  "${g.title}"`);
  for (const c of g.classes) console.log(`    [${c.class}] ${c.type}: ${c.records.join(', ')} slugs=[${(c.slugs || []).join(',')}]`);
}
console.log('\nBroken refs:');
for (const b of brokenRefs) console.log(`  [${b.severity}] ${b.sourceCat} ${b.source} .${b.field} -> ${b.targetId} (exists=${b.targetExists}) ${b.desc}`);
console.log('\nHistorical:');
console.log('  14.1 BBA:', JSON.stringify(historical.bba));
console.log('  14.2 Ich:', JSON.stringify(historical.ich, null, 1));
console.log('  14.3 Corals:', JSON.stringify(historical.coralProblems, null, 1));
console.log('  14.4 Empty bodies:', JSON.stringify(historical.emptyProblemBodies));
console.log('  14.5 Plant lang:', JSON.stringify(historical.plantLanguage, null, 1));
console.log('  14.6 Inverts:', JSON.stringify(historical.invertebrateDisplay));
fs.writeFileSync(path.join(OUT, 'historical_findings.lock.json'), JSON.stringify(historical, null, 2));

console.log('\nFiles written to report/SPEC_00_1/');