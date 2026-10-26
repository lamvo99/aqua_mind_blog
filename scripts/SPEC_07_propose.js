const fs = require('fs');
const path = require('path');
const L = require('./SPEC_07_lib.js');

const OUT_DIR = path.join('report', 'SPEC_07');
fs.mkdirSync(OUT_DIR, { recursive: true });

const gates = [];
const g = (id, name, ok, detail) => {
  gates.push({ id: id, name: name, pass: !!ok, detail: String(detail === undefined ? '' : detail) });
  console.log((ok ? 'GATE OK  ' : 'GATE FAIL') + ' ' + id + ' ' + name + ' - ' + (detail === undefined ? '' : detail));
};

const VALID_CONFIDENCE = ['HIGH', 'MEDIUM', 'LOW', 'BLOCKED'];
const VALID_STATUS = ['NO_CHANGE', 'REVIEW_REQUIRED', 'MUTATION_READY', 'BLOCKED'];
const VALID_INTENT = L.INTENT_ORDER.concat(['MULTI_INTENT']);

(async () => {
  const generatedAt = new Date().toISOString();
  const species = await L.q('*[_type == "species" && !(_id in path("drafts.**"))]');
  g('GB-01', '218 species fetched for proposal generation', species.length === 218, 'species=' + species.length);

  const built = L.buildAllProposals(species);
  const rows = built.rows;

  g('GB-02', 'proposal rows = 218 with deterministic recordId ordering',
    rows.length === 218 && rows.every((r, i) => i === 0 || rows[i - 1].recordId.localeCompare(r.recordId) < 0),
    'rows=' + rows.length + ' sorted=' + rows.every((r, i) => i === 0 || rows[i - 1].recordId.localeCompare(r.recordId) < 0));

  const enumsOk = rows.every((r) =>
    VALID_CONFIDENCE.includes(r.confidence) && VALID_STATUS.includes(r.mutationStatus) &&
    VALID_INTENT.includes(r.searchIntent) && r.reason && r.reason.length > 20 &&
    Array.isArray(r.evidenceFields) && r.evidenceFields.length >= 2);
  g('GB-03', 'every proposal carries a valid confidence + status + searchIntent enum, a substantive reason, and >=2 evidence entries',
    enumsOk, 'invalid=' + rows.filter((r) => !(VALID_CONFIDENCE.includes(r.confidence) && VALID_STATUS.includes(r.mutationStatus))).length);

  const bannedHits = rows.filter((r) => r.bannedTitleHits.length || r.bannedDescriptionHits.length);
  g('GB-04', 'banned title/description patterns = 0 across all proposals',
    bannedHits.length === 0, 'hits=' + bannedHits.length);

  const overLen = rows.filter((r) => r.proposedTitleLength > 65 || r.proposedDescriptionLength > 160 || r.proposedDescriptionLength < 100);
  g('GB-05', 'proposed metaTitle <= 65 chars and metaDescription within 100-160 chars for all 218',
    overLen.length === 0, 'violations=' + overLen.length + (overLen.length ? ' sample=' + overLen.slice(0, 3).map((r) => r.title + ':' + r.proposedTitleLength + '/' + r.proposedDescriptionLength).join(' | ') : ''));

  const kwNull = rows.every((r) => r.focusKeyword === null && r.secondaryKeywords === null);
  g('GB-06', 'focusKeyword and secondaryKeywords are null on every row (fields absent from live schema - audit columns only, never proposed for mutation)',
    kwNull, 'nonNull=' + rows.filter((r) => r.focusKeyword !== null || r.secondaryKeywords !== null).length);

  const currentPresent = rows.filter((r) => r.currentMetaTitle !== null || r.currentMetaDescription !== null).length;
  g('GB-07', 'current SEO values = 0 present across all 218 (consistent with SEO_INVENTORY all-MISSING baseline; NO_CHANGE count = 0)',
    currentPresent === 0 && rows.filter((r) => r.mutationStatus === 'NO_CHANGE').length === 0,
    'currentPresent=' + currentPresent + ' noChange=' + rows.filter((r) => r.mutationStatus === 'NO_CHANGE').length);

  const rowsEqual = rows.every((r) => r.proposedMetaTitle && r.proposedMetaDescription &&
    (r.confidence !== 'BLOCKED' || ['CANNIBALIZATION_GENERIC_NAME', 'THIN_EXCERPT', 'TITLE_COLLISION'].includes(r.reasonCode)));
  g('GB-08', 'BLOCKED rows (if any) carry a documented block reason code; all rows have proposed values drafted for PM review',
    rowsEqual, 'blocked=' + rows.filter((r) => r.confidence === 'BLOCKED').length +
    ' codes=' + JSON.stringify(rows.filter((r) => r.confidence === 'BLOCKED').reduce((m, r) => { m[r.reasonCode] = (m[r.reasonCode] || 0) + 1; return m; }, {})));

  const counts = {
    total: rows.length,
    byConfidence: rows.reduce((m, r) => { m[r.confidence] = (m[r.confidence] || 0) + 1; return m; }, {}),
    byMutationStatus: rows.reduce((m, r) => { m[r.mutationStatus] = (m[r.mutationStatus] || 0) + 1; return m; }, {}),
    bySearchIntent: rows.reduce((m, r) => { m[r.searchIntent] = (m[r.searchIntent] || 0) + 1; return m; }, {}),
    byReasonCode: rows.reduce((m, r) => { m[r.reasonCode] = (m[r.reasonCode] || 0) + 1; return m; }, {}),
    bySeoStatus: rows.reduce((m, r) => { const k = r.seoStatus || 'null'; m[k] = (m[k] || 0) + 1; return m; }, {}),
    distinctnessFlags: rows.reduce((m, r) => { const k = r.distinctnessFlag || 'none'; m[k] = (m[k] || 0) + 1; return m; }, {}),
    existing: { metaTitle: 0, metaDescription: 0 },
    proposed: { metaTitle: rows.filter((r) => r.proposedMetaTitle).length, metaDescription: rows.filter((r) => r.proposedMetaDescription).length },
    noChange: rows.filter((r) => r.mutationStatus === 'NO_CHANGE').length,
    blockedSeoByContent: rows.filter((r) => r.seoStatus === 'BLOCKED_BY_CONTENT').length,
    blockedSeoByCannibalization: rows.filter((r) => r.seoStatus === 'BLOCKED_BY_CANNIBALIZATION').length,
  };

  const plan = {
    spec: 'SPEC 07', phase: 'GATE_B_PROPOSAL_PLAN', generatedAt: generatedAt,
    mode: 'READ-ONLY proposal generation - no mutation endpoint called; these are proposals for PM review, not applied changes',
    ordering: 'recordId ascending (localeCompare)',
    targetFields: { primary: ['seo.metaTitle', 'seo.metaDescription'], auditedOnly: ['seo.focusKeyword (NOT IN SCHEMA)', 'seo.secondaryKeywords (NOT IN SCHEMA)'] },
    generationRules: {
      title: 'IdentName (ScientificName): intent-aligned angle; <=65 chars; banned patterns excluded; content-anchored',
      description: 'Identity + level/waterType/region + size/tank/temp/ph/gh facts + diet + intent coverage sentence; <=160 chars; only populated record fields are used; factsDropped lists any fact omitted for length',
      confidence: 'BLOCKED: generic-name cannibalization OR excerpt<80 OR exact title collision; MEDIUM: shared-scientificName sibling OR parentSpecies variant OR MULTI_INTENT OR contentSignals<20; HIGH: otherwise',
      distinctness: 'near-dup flags recorded (title Jaccard>=0.75, description Jaccard>=0.80) for editorial review; template-level overlap alone does not downgrade confidence - identity overlap does',
    },
    counts: counts,
    gates: gates,
    gateStatus: gates.every((x) => x.pass) ? 'PASS' : 'FAIL',
    rows: rows,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_07_PROPOSAL_PLAN.json'), JSON.stringify(plan, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_07_PROPOSAL_PLAN.csv'), L.toCsv(L.PROPOSAL_COLUMNS, rows.map(L.flattenForCsv)));

  const byId = {};
  for (const r of rows) byId[r.recordId] = r;
  const nameOf = (id) => (byId[id] ? byId[id].title : id);

  const nameSeen = {}, sciSeen = {}, slugSeen = {};
  for (const s of species) {
    (nameSeen[s.name] = nameSeen[s.name] || []).push(s._id);
    if (s.scientificName) (sciSeen[s.scientificName] = sciSeen[s.scientificName] || []).push(s._id);
    const sl = L.slugValue(s.slug);
    if (sl) (slugSeen[sl] = slugSeen[sl] || []).push(s._id);
  }
  const exactNameDups = Object.entries(nameSeen).filter(([, v]) => v.length > 1);
  const exactSlugDups = Object.entries(slugSeen).filter(([, v]) => v.length > 1);
  const sciFamilies = Object.entries(sciSeen).filter(([, v]) => v.length > 1).map(([sci, ids]) => ({
    scientificName: sci, size: ids.length,
    members: ids.map((id) => ({ recordId: id, name: nameOf(id), slug: byId[id].slug, confidence: byId[id].confidence, reasonCode: byId[id].reasonCode })),
    note: 'Same scientificName across ' + ids.length + ' records (variety/morph/common-name pages). NOT automatically duplicate records - editorial must decide canonical ownership; proposals reviewed together.',
  }));
  const genericPairs = [];
  for (const s of species) {
    const ctx = built.ctx.perRecord[s._id];
    if (ctx.genericName) for (const sib of ctx.siblings) {
      if (s.name.toLowerCase().includes(sib.name.toLowerCase())) continue;
      genericPairs.push({ genericRecord: { recordId: s._id, name: s.name }, specificRecord: { recordId: sib.id, name: sib.name }, scientificName: s.scientificName, verdict: 'GENERIC_QUERY_OWNERSHIP_UNRESOLVED' });
    }
  }
  const variants = species.filter((s) => s.parentSpecies).map((s) => ({
    recordId: s._id, name: s.name, parentId: s.parentSpecies._ref || s.parentSpecies, parentName: nameOf(s.parentSpecies._ref || s.parentSpecies) || null,
    verdict: 'VARIANT_PAGES_PARENT_LINKED',
  }));

  const nearPairs = built.pairs.map((p) => ({
    a: { recordId: p.a, name: nameOf(p.a) }, b: { recordId: p.b, name: nameOf(p.b) },
    titleSimilarity: p.titleSim, descriptionSimilarity: p.descSim, overlap: p.overlap,
    sharedScientificName: !!(byId[p.a].siblingNames && byId[p.a].siblingNames.some((n) => n === nameOf(p.b))),
    assessment: p.titleSim >= 0.75 && p.descSim >= 0.80 ? 'HIGH_TEMPLATE_OVERLAP_REVIEW_TOGETHER' : 'TEMPLATE_OVERLAP_EXPECTED_FOR_CARE_PAGES',
  }));
  const exactTitleDups = (() => {
    const m = {};
    for (const r of rows) (m[L.normalize(r.proposedMetaTitle)] = m[L.normalize(r.proposedMetaTitle)] || []).push(r.recordId);
    return Object.entries(m).filter(([, v]) => v.length > 1).map(([k, v]) => ({ normalizedTitle: k, recordIds: v }));
  })();
  const exactDescDups = (() => {
    const m = {};
    for (const r of rows) (m[L.normalize(r.proposedMetaDescription)] = m[L.normalize(r.proposedMetaDescription)] || []).push(r.recordId);
    return Object.entries(m).filter(([, v]) => v.length > 1).map(([k, v]) => ({ normalizedDescription: k, recordIds: v }));
  })();

  const cannibalization = {
    spec: 'SPEC 07', phase: 'GATE_B_CANNIBALIZATION_AUDIT', generatedAt: generatedAt,
    method: 'Identity-level exact/near name analysis over all 218 species plus metadata-level similarity over generated proposals (normalized token Jaccard: title>=0.75, description>=0.80). Similar or shared names are NOT automatically concluded to be duplicate records - every pair is listed for editorial review.',
    identityLevel: {
      exactDuplicateNames: { count: exactNameDups.length, pairs: exactNameDups },
      exactDuplicateSlugs: { count: exactSlugDups.length, pairs: exactSlugDups },
      exactDuplicateScientificNames: { count: sciFamilies.length, records: sciFamilies.reduce((a, f) => a + f.size, 0), families: sciFamilies },
      genericVsSpecificNamePairs: { count: genericPairs.length, pairs: genericPairs },
      parentSpeciesVariants: { count: variants.length, records: variants },
    },
    metadataLevel: {
      exactDuplicateProposedTitles: { count: exactTitleDups.length, pairs: exactTitleDups },
      exactDuplicateProposedDescriptions: { count: exactDescDups.length, pairs: exactDescDups },
      nearDuplicatePairs: { count: nearPairs.length, threshold: 'title>=0.75 or description>=0.80', pairs: nearPairs },
      semanticDuplicationCandidates: nearPairs.filter((p) => p.overlap === 'NEAR_DUP_BOTH').length,
      potentialCannibalization: nearPairs.filter((p) => p.sharedScientificName || p.overlap === 'NEAR_DUP_BOTH').length,
    },
    policy: {
      note1: 'Template-level overlap between different species (shared care vocabulary) is expected and acceptable; identity fields differ in every pair unless listed under sharedScientificName.',
      note2: 'Records with shared scientificName or generic-name ownership questions are already downgraded to MEDIUM/BLOCKED in the proposal plan.',
      note3: 'No merge or canonicalization conclusion is drawn here - SPEC 07 is read-only; any canonical resolution is a separate PM decision.',
    },
    gates: gates.filter((x) => x.id === 'GB-04' || x.id === 'GB-08'),
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_07_CANNIBALIZATION_AUDIT.json'), JSON.stringify(cannibalization, null, 2));

  const failed = gates.filter((x) => !x.pass);
  console.log('\nGATE B (propose): ' + (gates.length - failed.length) + '/' + gates.length + ' ' + plan.gateStatus);
  console.log('counts: ' + JSON.stringify(counts.byConfidence) + ' statuses: ' + JSON.stringify(counts.byMutationStatus));
  console.log('artifacts: PROPOSAL_PLAN.json/.csv, CANNIBALIZATION_AUDIT.json -> report/SPEC_07/');
  if (failed.length) { console.log('STOP - proposal gate failure: ' + failed.map((x) => x.id).join(', ')); process.exit(2); }
})().catch((e) => { console.error('PROPOSE ERROR:', e.stack || e.message); process.exit(1); });
