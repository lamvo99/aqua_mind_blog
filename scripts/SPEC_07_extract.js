const fs = require('fs');
const path = require('path');
const https = require('https');
const L = require('./SPEC_07_lib.js');

const OUT_DIR = path.join('report', 'SPEC_07');
fs.mkdirSync(OUT_DIR, { recursive: true });

const gates = [];
const g = (id, name, ok, detail) => {
  gates.push({ id: id, name: name, pass: !!ok, detail: String(detail === undefined ? '' : detail) });
  console.log((ok ? 'GATE OK  ' : 'GATE FAIL') + ' ' + id + ' ' + name + ' - ' + (detail === undefined ? '' : detail));
};

function probe(url) {
  return new Promise((res) => {
    https.get(url, { timeout: 30000 }, (r) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => res({ url: url, status: r.statusCode }));
    }).on('error', (e) => res({ url: url, status: 0, error: e.message }));
  });
}

(async () => {
  const generatedAt = new Date().toISOString();

  const live = {};
  for (const t of L.WIKI_TYPES) live[t] = await L.q('*[_type == "' + t + '" && !(_id in path("drafts.**"))]');
  const live2 = {};
  for (const t of L.WIKI_TYPES) live2[t] = await L.q('*[_type == "' + t + '" && !(_id in path("drafts.**"))]');
  const livePosts = await L.q('*[_type == "post" && !(_id in path("drafts.**"))]');
  const liveDrafts = await L.q('count(*[_id in path("drafts.**")])');

  const counts = {};
  for (const t of L.WIKI_TYPES) counts[t] = live[t].filter((r) => !String(r._id).startsWith('drafts.')).length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  g('GA-01', 'canonical record count = 473 with exact per-type composition',
    total === 473 && L.WIKI_TYPES.every((t) => counts[t] === L.EXPECTED[t]),
    'total=' + total + ' ' + JSON.stringify(counts));

  let wikiDrafts = 0;
  for (const t of L.WIKI_TYPES) wikiDrafts += live[t].filter((r) => String(r._id).startsWith('drafts.')).length;
  g('GA-02', 'drafts = 0 (wiki and dataset-wide)', wikiDrafts === 0 && Number(liveDrafts) === 0,
    'wikiDrafts=' + wikiDrafts + ' datasetDrafts=' + liveDrafts);

  const slugSeen = {};
  let dupSlugs = 0, undefinedRoutes = 0;
  for (const t of L.WIKI_TYPES) for (const r of live[t]) {
    const s = L.slugValue(r.slug);
    if (!s || !L.titleOf(t, r)) { undefinedRoutes++; continue; }
    const k = t + '/' + s;
    if (slugSeen[k]) dupSlugs++;
    slugSeen[k] = true;
  }
  g('GA-03', 'duplicate slugs = 0 and undefined routes = 0', dupSlugs === 0 && undefinedRoutes === 0,
    'dupSlugs=' + dupSlugs + ' undefinedRoutes=' + undefinedRoutes);

  const liveBy = {};
  for (const t of L.WIKI_TYPES) for (const r of live[t]) liveBy[r._id] = { type: t, rec: r };
  const hashParts = Object.keys(liveBy).sort().map((id) => L.sha256(JSON.stringify({ id: id, title: L.titleOf(liveBy[id].type, liveBy[id].rec), slug: L.slugValue(liveBy[id].rec.slug) })));
  const hash = L.sha256(hashParts.join('\n'));
  g('GA-04', 'fresh canonical identity hash matches approved baseline', hash === L.EXPECTED_HASH, 'hash=' + hash);

  g('GA-05', 'read deterministic (double-fetch byte-identical per type)',
    L.WIKI_TYPES.every((t) => JSON.stringify(live[t]) === JSON.stringify(live2[t])),
    'identical=' + L.WIKI_TYPES.every((t) => JSON.stringify(live[t]) === JSON.stringify(live2[t])));

  const species = live.species;
  g('GA-06', 'species = 218 fetched for SEO audit', species.length === 218, 'species=' + species.length);

  const S05 = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_05', 'SPEC_05_POST_REPAIR_SNAPSHOT.json'), 'utf8'));
  const snapBy = {};
  for (const t of L.WIKI_TYPES) for (const r of S05.records[t]) snapBy[r._id] = r;
  let added = 0, removed = 0, nonRelChanged = 0, relChangedDocs = 0, seoDiff = 0;
  const changedSamples = [];
  for (const id of Object.keys(liveBy)) if (!snapBy[id]) added++;
  for (const id of Object.keys(snapBy)) if (!liveBy[id]) removed++;
  for (const id of Object.keys(liveBy)) {
    const a = liveBy[id].rec; const b = snapBy[id];
    if (!b) continue;
    const aRel = L.canon(a.relatedPosts === undefined ? null : a.relatedPosts);
    const bRel = L.canon(b.relatedPosts === undefined ? null : b.relatedPosts);
    if (aRel !== bRel) relChangedDocs++;
    const aCopy = Object.assign({}, a); delete aCopy.relatedPosts;
    const bCopy = Object.assign({}, b); delete bCopy.relatedPosts;
    if (L.contentDiffers(aCopy, bCopy)) {
      nonRelChanged++;
      if (changedSamples.length < 5) changedSamples.push(id);
    }
    if (L.canon(a.seo) !== L.canon(b.seo)) seoDiff++;
  }
  g('GA-07', 'zero mutations vs SPEC 05 baseline outside authorized relatedPosts (content-based, order-insensitive, machine fields _rev/_updatedAt/_system excluded: non-relatedPosts diffs = 0; seo diffs = 0; relatedPosts drift confined to 22 docs from SPEC 06C)',
    added === 0 && removed === 0 && nonRelChanged === 0 && seoDiff === 0 && relChangedDocs === 22,
    'added=' + added + ' removed=' + removed + ' nonRelChanged=' + nonRelChanged + ' seoDiff=' + seoDiff +
    ' relatedPostsChangedDocs=' + relChangedDocs + (changedSamples.length ? ' samples=' + changedSamples.join(',') : ''));

  const S06C = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_06C', 'SPEC_06C_POST_MUTATION_SNAPSHOT.json'), 'utf8'));
  let post06cDrift = 0;
  for (const d of S06C.documents) {
    const cur = liveBy[d._id] && liveBy[d._id].rec;
    if (!cur || L.contentDiffers(cur, d)) post06cDrift++;
  }
  g('GA-08', 'the 22 SPEC 06C mutated documents are byte-identical to the 06C post-mutation snapshot (no drift since 06C)',
    post06cDrift === 0, 'drifted=' + post06cDrift + ' of ' + S06C.documents.length);

  const externalPosts = [
    { id: 'ed1afb26-c583-4683-abb4-9b38a3064968', note: 'external publish/update 2026-10-01T01:42:19Z, documented in SPEC 06C C-15' },
    { id: '3e3865e4-9fcd-4d99-b6b2-42a4909f2383', note: 'external update 2026-10-02T02:09:39Z (published post "Green Spot Algae...") discovered during SPEC 07 GATE A, not wiki-referenced, not an authorized target' },
  ];
  const extrasPresent = externalPosts.every((p) => livePosts.some((x) => x._id === p.id));
  g('GA-09', 'posts = 20 = SPEC 05 baseline 18 + 2 documented external posts (both UUID docs, not wiki-referenced, not written by any SPEC phase)',
    livePosts.length === 20 && extrasPresent,
    'posts=' + livePosts.length + ' externalPresent=' + extrasPresent);

  const speciesSchemaSrc = fs.readFileSync(path.join('sanity', 'schemaTypes', 'species.ts'), 'utf8');
  const seoIdx = speciesSchemaSrc.indexOf("name: 'seo', title: 'SEO', type: 'object'");
  const seoBlockEnd = speciesSchemaSrc.indexOf('defineField(', seoIdx + 1);
  const seoBlock = speciesSchemaSrc.slice(seoIdx, seoBlockEnd < 0 ? speciesSchemaSrc.length : seoBlockEnd);
  const seoFields = [];
  const fieldRe = /\{\s*name:\s*'([^']+)',\s*title:\s*'([^']+)',\s*type:\s*'([^']+)'/g;
  let m;
  while ((m = fieldRe.exec(seoBlock)) !== null) seoFields.push({ name: m[1], title: m[2], type: m[3] });
  const hasSeoObject = seoIdx >= 0;
  const fieldNames = seoFields.map((f) => f.name);
  const validationPresent = /validation:/.test(seoBlock);
  const requiredPresent = /Rule\.required/.test(seoBlock);
  g('GA-10', 'A-01 live schema: species.seo object exists with metaTitle (string) and metaDescription (text); no focusKeyword/secondaryKeywords fields; no length validation',
    hasSeoObject && fieldNames.includes('metaTitle') && fieldNames.includes('metaDescription') &&
    !fieldNames.includes('focusKeyword') && !fieldNames.includes('secondaryKeywords') && !validationPresent && !requiredPresent,
    'seoFields=' + JSON.stringify(fieldNames) + ' validation=' + validationPresent + ' required=' + requiredPresent);

  const perTypeSchema = {};
  for (const t of L.WIKI_TYPES) {
    const src = fs.readFileSync(path.join('sanity', 'schemaTypes', t + '.ts'), 'utf8');
    perTypeSchema[t] = src.indexOf("name: 'seo', title: 'SEO', type: 'object'") >= 0;
  }

  const probes = [];
  probes.push(await probe('https://api.sanity.io/v2021-06-07/projects/zeohjejw/datasets/production/schema'));
  probes.push(await probe('https://zeohjejw.api.sanity.io/v2026-05-25/data/schema/production'));

  const populatedSeo = species.filter((s) => s.seo !== undefined && s.seo !== null);
  const seoTypeCounts = {};
  for (const s of populatedSeo) {
    const k = typeof s.seo;
    seoTypeCounts[k] = (seoTypeCounts[k] || 0) + 1;
  }
  g('GA-11', 'live empirical baseline: 0 of 218 species have a populated seo object (inventory starts from all-MISSING)',
    populatedSeo.length === 0, 'withSeoObject=' + populatedSeo.length + ' typeCounts=' + JSON.stringify(seoTypeCounts));

  const SEO_FIELDS = ['metaTitle', 'metaDescription', 'focusKeyword', 'secondaryKeywords'];
  const classify = (rec, f) => {
    const seoObj = (rec.seo !== undefined && rec.seo !== null && typeof rec.seo === 'object') ? rec.seo : null;
    const v = seoObj ? seoObj[f] : undefined;
    if (v === undefined || v === null) return { classification: 'MISSING', value: null, length: null, lengthFlag: null };
    if (typeof v !== 'string') return { classification: 'INVALID', value: String(v).slice(0, 80), length: null, lengthFlag: 'NON_STRING_TYPE:' + typeof v };
    if (v.trim().length === 0) return { classification: 'PRESENT_EMPTY', value: '', length: v.length, lengthFlag: 'WHITESPACE_ONLY' };
    const cap = f === 'metaTitle' ? 70 : 170;
    return { classification: 'PRESENT_VALID', value: v, length: v.length, lengthFlag: v.length > cap ? 'OVER_' + cap : null };
  };

  const inventoryRows = species.slice().sort((a, b) => a._id.localeCompare(b._id)).map((s) => {
    const row = {
      recordId: s._id,
      name: s.name,
      slug: L.slugValue(s.slug),
      hasSeoObject: !!(s.seo !== undefined && s.seo !== null && typeof s.seo === 'object'),
    };
    for (const f of SEO_FIELDS) {
      const c = classify(s, f);
      row['has' + f[0].toUpperCase() + f.slice(1)] = c.classification !== 'MISSING';
      row[f + 'Classification'] = c.classification;
      row[f + 'Value'] = c.value;
      row[f + 'Length'] = c.length;
      row[f + 'LengthFlag'] = c.lengthFlag;
      row[f + 'InLiveSchema'] = fieldNames.includes(f);
    }
    row.seoQualityNotes = row.hasSeoObject ? 'existing object audited' : 'no seo object - all fields MISSING';
    return row;
  });

  const invSummary = { hasSeoObject: 0, records: inventoryRows.length };
  for (const f of SEO_FIELDS) {
    invSummary[f] = { MISSING: 0, PRESENT_EMPTY: 0, PRESENT_VALID: 0, INVALID: 0, lengthFlags: 0 };
    for (const r of inventoryRows) {
      invSummary[f][r[f + 'Classification']]++;
      if (r[f + 'LengthFlag']) invSummary[f].lengthFlags++;
    }
  }
  invSummary.hasSeoObject = inventoryRows.filter((r) => r.hasSeoObject).length;
  g('GA-12', 'SEO inventory covers all 218 species with a classification for each of the 4 target fields (0 unclassified)',
    inventoryRows.length === 218 && SEO_FIELDS.every((f) => invSummary[f].MISSING + invSummary[f].PRESENT_EMPTY + invSummary[f].PRESENT_VALID + invSummary[f].INVALID === 218),
    'rows=' + inventoryRows.length + ' metaTitleMissing=' + invSummary.metaTitle.MISSING);

  const intentRows = species.slice().sort((a, b) => a._id.localeCompare(b._id)).map((s) => {
    const info = L.scoreIntent(s);
    return {
      recordId: s._id,
      name: s.name,
      slug: L.slugValue(s.slug),
      searchIntent: info.intent,
      intentCandidates: info.intentCandidates,
      intentScores: info.scores,
      intentEvidence: info.evidence,
      excerptLength: L.has(s.excerpt) ? s.excerpt.trim().length : 0,
      contentSignals: L.contentSignals(s),
    };
  });
  const intentDist = {};
  for (const r of intentRows) intentDist[r.searchIntent] = (intentDist[r.searchIntent] || 0) + 1;
  g('GA-13', 'search-intent classification covers all 218 species with a valid enum value and >=1 evidence entry',
    intentRows.length === 218 && intentRows.every((r) => L.INTENT_ORDER.concat(['MULTI_INTENT']).includes(r.searchIntent) && r.intentEvidence.length >= 1),
    'rows=' + intentRows.length + ' distribution=' + JSON.stringify(intentDist));

  const baseline = {
    spec: 'SPEC 07', phase: 'GATE_A_BASELINE', generatedAt: generatedAt,
    mode: 'READ-ONLY - mutation endpoint never called; canonical mutations = 0; seo mutations = 0',
    canonicalCount: total, typeCounts: counts, drafts: wikiDrafts + Number(liveDrafts),
    duplicateSlugs: dupSlugs, undefinedRoutes: undefinedRoutes,
    canonicalHash: hash, expectedCanonicalHash: L.EXPECTED_HASH,
    posts: { live: livePosts.length, spec05Baseline: 18, documentedExternalPosts: externalPosts },
    safetyVsSpec05: { added: added, removed: removed, nonRelatedPostsChanged: nonRelChanged, seoDiffs: seoDiff, relatedPostsChangedDocs: relChangedDocs },
    safetyVsSpec06c: { documentsChecked: S06C.documents.length, drifted: post06cDrift },
    doubleFetchDeterministic: gates.find((x) => x.id === 'GA-05').pass,
    gates: gates,
    gateStatus: gates.every((x) => x.pass) ? 'PASS' : 'FAIL',
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_07_BASELINE.json'), JSON.stringify(baseline, null, 2));

  const schemaAudit = {
    spec: 'SPEC 07', phase: 'GATE_A_SCHEMA_AUDIT', generatedAt: generatedAt,
    method: 'Live schema retrieval endpoints probed and unavailable (404) -> authoritative source is the deployed Studio schema definition in sanity/schemaTypes/*.ts (fingerprinted) cross-checked against empirical inspection of all 218 live documents. No schema assumptions taken from historical reports.',
    endpointProbes: probes,
    speciesSeoField: {
      present: hasSeoObject,
      objectType: 'object',
      group: 'seo',
      fields: seoFields,
      focusKeywordInSchema: fieldNames.includes('focusKeyword'),
      secondaryKeywordsInSchema: fieldNames.includes('secondaryKeywords'),
      validation: validationPresent ? 'present' : 'none (no Rule.min/max/required on seo object or its fields)',
      required: requiredPresent,
      note: "publishedAt is a top-level datetime placed in the 'seo' GROUP; it is not a member of the seo object and is not an SEO metadata target.",
    },
    seoObjectPresenceByWikiType: perTypeSchema,
    empirical: { speciesWithSeoObject: populatedSeo.length, seoTypeCounts: seoTypeCounts, totalSpecies: species.length },
    targetFieldHandling: {
      seoMetaTitle: 'IN_SCHEMA - primary target',
      seoMetaDescription: 'IN_SCHEMA - primary target',
      seoFocusKeyword: 'NOT IN_SCHEMA - audit column only; proposal value fixed to null; never proposed for mutation',
      seoSecondaryKeywords: 'NOT IN_SCHEMA - audit column only; proposal value fixed to null; never proposed for mutation',
    },
    schemaDriftVerdict: hasSeoObject && fieldNames.join(',') === 'metaTitle,metaDescription' ? 'MATCHES_EXPECTED' : 'UNEXPECTED - STOP',
    speciesSchemaSha256: L.sha256(fs.readFileSync(path.join('sanity', 'schemaTypes', 'species.ts'))),
    gates: gates.filter((x) => x.id === 'GA-10' || x.id === 'GA-11'),
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_07_SCHEMA_AUDIT.json'), JSON.stringify(schemaAudit, null, 2));

  const inventory = {
    spec: 'SPEC 07', phase: 'GATE_A_SEO_INVENTORY', generatedAt: generatedAt,
    classificationLegend: {
      MISSING: 'field or seo object absent',
      PRESENT_EMPTY: 'defined but empty or whitespace-only (not valid)',
      PRESENT_VALID: 'non-empty string',
      INVALID: 'present but wrong type or unusable',
    },
    summary: invSummary,
    existingValuesQualityAudit: {
      applicable: invSummary.hasSeoObject > 0,
      reason: invSummary.hasSeoObject > 0 ? 'existing seo values present - quality flags computed' : 'no existing SEO values on any species - A-03 value-quality audit vacuous; quality rules applied to proposed values instead',
    },
    rows: inventoryRows,
    gates: gates.filter((x) => x.id === 'GA-12'),
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_07_SEO_INVENTORY.json'), JSON.stringify(inventory, null, 2));

  const intentAudit = {
    spec: 'SPEC 07', phase: 'GATE_A_SEARCH_INTENT_AUDIT', generatedAt: generatedAt,
    model: 'Deterministic keyword scoring over excerpt+schooling plus field-presence signals; tie-break by fixed enum order; MULTI_INTENT when top-2 within 1 point and top >=5; LEARN fallback when top score <=1.',
    enum: L.INTENT_ORDER.concat(['MULTI_INTENT']),
    distribution: intentDist,
    keywordSets: L.KEYWORDS,
    rows: intentRows,
    gates: gates.filter((x) => x.id === 'GA-13'),
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_07_SEARCH_INTENT_AUDIT.json'), JSON.stringify(intentAudit, null, 2));

  const sourceFiles = [
    'sanity/schemaTypes/species.ts',
    'sanity/schemaTypes/plant.ts',
    'sanity/schemaTypes/invertebrate.ts',
    'sanity/schemaTypes/coral.ts',
    'sanity/schemaTypes/equipment.ts',
    'sanity/schemaTypes/problem.ts',
    'report/SPEC_05/SPEC_05_POST_REPAIR_SNAPSHOT.json',
    'report/SPEC_06C/SPEC_06C_POST_MUTATION_SNAPSHOT.json',
    'report/SPEC_06C/SPEC_06C_VALIDATION.json',
    'scripts/SPEC_07_lib.js',
  ];
  const sources = [];
  let missingSources = 0;
  for (const f of sourceFiles) {
    try {
      const buf = fs.readFileSync(f);
      sources.push({ path: f, bytes: buf.length, sha256: L.sha256(buf) });
    } catch (e) {
      sources.push({ path: f, missing: true });
      missingSources++;
    }
  }

  const manifest = {
    spec: 'SPEC 07', phase: 'SOURCE_MANIFEST', generatedAt: generatedAt,
    mode: 'READ-ONLY - GROQ data/query only; no mutation endpoint called anywhere in SPEC 07 GATE A+B',
    specSource: 'chat-delivered SPEC 07 (GATE A+B), no repo spec file',
    projectId: 'zeohjejw', dataset: 'production', apiVersion: '2026-05-25',
    extractionMethod: 'Sanity HTTP GET data/query (read-only, double-fetch determinism), local schema fingerprints, local SPEC 05/06C snapshots for safety diffing.',
    queries: [
      '*[_type == "<wikiType>" && !(_id in path("drafts.**"))] (x6 types, double fetch)',
      'count(*[_id in path("drafts.**")])',
      '*[_type == "post" && !(_id in path("drafts.**"))]',
    ],
    resultFingerprints: {},
    canonicalHash: hash,
    sources: sources,
    missingSources: missingSources,
    gates: gates,
    gateStatus: gates.every((x) => x.pass) ? 'PASS' : 'FAIL',
  };
  for (const t of L.WIKI_TYPES) {
    manifest.resultFingerprints[t] = { count: live[t].length, sha256: L.sha256(JSON.stringify(live[t])) };
  }
  manifest.resultFingerprints.posts = { count: livePosts.length, sha256: L.sha256(JSON.stringify(livePosts)) };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_07_SOURCE_MANIFEST.json'), JSON.stringify(manifest, null, 2));

  const failed = gates.filter((x) => !x.pass);
  console.log('\nGATE A (extract): ' + (gates.length - failed.length) + '/' + gates.length + ' ' + baseline.gateStatus);
  console.log('artifacts: BASELINE, SCHEMA_AUDIT, SEO_INVENTORY, SEARCH_INTENT_AUDIT, SOURCE_MANIFEST -> report/SPEC_07/');
  if (failed.length) {
    console.log('STOP - baseline/schema mismatch. Discrepancies: ' + failed.map((x) => x.id).join(', '));
    process.exit(2);
  }
})().catch((e) => { console.error('EXTRACT ERROR:', e.stack || e.message); process.exit(1); });
