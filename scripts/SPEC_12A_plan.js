const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// SPEC 12A Phases B-E - build candidate/evidence/held/dry-run artifacts.
// READ-ONLY: no writes, no schema deploy. Uses the Phase A snapshot (no new mutation surface).

const TEMP = 'C:/Users/lam72/AppData/Local/Temp/opencode';
const OUT = path.join('reports', 'SPEC_12A');
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const DATE = '2026-10-18';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
function q(query) { const url = BASE + '?query=' + encodeURIComponent(query); return new Promise((res, rej) => { https.get(url, { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => { const c = []; r.on('data', (d) => c.push(Buffer.isBuffer(d) ? d : Buffer.from(d))); r.on('end', () => { try { res(JSON.parse(Buffer.concat(c).toString('utf8')).result); } catch (e) { rej(e); } }); }).on('error', rej); }); }

const REL_FIELDS = {
  species: { compatibleSpecies: { kind: 'objectArray', targets: ['species'], entryRef: 'ref' }, compatiblePlants: { kind: 'refArray', targets: ['plant'] }, compatibleInvertebrates: { kind: 'refArray', targets: ['invertebrate'] }, suitableEquipment: { kind: 'refArray', targets: ['equipment'] }, relatedProblems: { kind: 'refArray', targets: ['problem'] }, relatedPosts: { kind: 'refArray', targets: ['post'] }, incompatibleSpecies: { kind: 'objectArray', targets: ['species'], entryRef: 'ref' }, predatorPrey: { kind: 'objectArray', targets: ['species', 'invertebrate'], entryRef: 'ref' }, reefInteractionDetail: { kind: 'objectArray', targets: ['coral'], entryRef: 'coral' }, parentSpecies: { kind: 'ref', targets: ['species'] } },
  plant: { suitableEquipment: { kind: 'refArray', targets: ['equipment'] }, relatedProblems: { kind: 'refArray', targets: ['problem'] }, relatedPosts: { kind: 'refArray', targets: ['post'] } },
  invertebrate: { compatibleSpecies: { kind: 'objectArray', targets: ['species'], entryRef: 'ref' }, suitableEquipment: { kind: 'refArray', targets: ['equipment'] }, relatedProblems: { kind: 'refArray', targets: ['problem'] }, relatedPosts: { kind: 'refArray', targets: ['post'] }, predatorPrey: { kind: 'objectArray', targets: ['species', 'invertebrate'], entryRef: 'ref' }, parentSpecies: { kind: 'ref', targets: ['species'] } },
  coral: { suitableEquipment: { kind: 'refArray', targets: ['equipment'] }, relatedProblems: { kind: 'refArray', targets: ['problem'] }, relatedPosts: { kind: 'refArray', targets: ['post'] }, coralNeighbors: { kind: 'objectArray', targets: ['coral'], entryRef: 'ref' } },
  equipment: { compatibleEquipment: { kind: 'refArray', targets: ['equipment'] }, relatedProblems: { kind: 'refArray', targets: ['problem'] }, relatedPosts: { kind: 'refArray', targets: ['post'] } },
  problem: { relatedTools: { kind: 'refArray', targets: ['tool'] }, relatedPosts: { kind: 'refArray', targets: ['post'] } },
};

const EV_SF_BLEHERI = { url: 'https://www.seriouslyfish.com/species/hemigrammus-bleheri/', title: 'Seriously Fish — Hemigrammus bleheri (Firehead Tetra)', publisher: 'Seriously Fish', class: 'C3_SPECIALIST_REFERENCE', checked: DATE, note: 'Behaviour and Compatibility: "Ideally keep it with other South American species, such as other Hemigrammus or Hyphessobrycon species, pencil fish, Apistogramma dwarf cichlids, Corydoras and small Loricariids. In a more general community it can be combined with smaller rasboras, barbs, Anabantoids and West African dwarf cichlids such as Pelvicachromis species."' };
const EV_SF_STERBAI = { url: 'https://www.seriouslyfish.com/species/corydoras-sterbai/', title: "Seriously Fish — Hoplisoma sterbai (Sterba's Cory)", publisher: 'Seriously Fish', class: 'C3_SPECIALIST_REFERENCE', checked: DATE, note: 'Behaviour and Compatibility: "Very peaceful and suitable for many community tanks. Don\'t keep it with anything very large or aggressive. Good tankmates include small characins, cyprinids, anabantoids, dwarf cichlids and other peaceful catfish."' };
const FIREHEAD = 'I9bI8W8ZWcEwyIzM9Cj9MC', STERBAI = 'I9bI8W8ZWcEwyIzM9Ci1Vw';
const COND_FW = ['peaceful community tank', 'avoid large, boisterous or aggressive tankmates'];
const PROPOSALS = [
  [FIREHEAD, 'ofTl1CTOUWuLwM28PxTCaV', 'pencil fish', EV_SF_BLEHERI],
  [FIREHEAD, 'sebdKYryWZgYP2rm3oquNG', 'pencil fish', EV_SF_BLEHERI],
  [FIREHEAD, 'J1Tx0fWCuGNPno99A6UR1F', 'Apistogramma dwarf cichlid', EV_SF_BLEHERI],
  [FIREHEAD, 'IlX7xILobrukz7d5JnfjuY', 'Apistogramma dwarf cichlid', EV_SF_BLEHERI],
  [FIREHEAD, STERBAI, 'Corydoras', EV_SF_BLEHERI],
  [FIREHEAD, 'ofTl1CTOUWuLwM28PxTCJT', 'Corydoras', EV_SF_BLEHERI],
  [FIREHEAD, 'I9bI8W8ZWcEwyIzM9CuG2u', 'small Loricariid', EV_SF_BLEHERI],
  [FIREHEAD, 'J1Tx0fWCuGNPno99A6hsP7', 'small Loricariid', EV_SF_BLEHERI],
  [FIREHEAD, 'ofTl1CTOUWuLwM28PxTCRz', 'smaller rasbora', EV_SF_BLEHERI],
  [FIREHEAD, 'ofTl1CTOUWuLwM28PxTCP9', 'smaller rasbora', EV_SF_BLEHERI],
  [FIREHEAD, 'J1Tx0fWCuGNPno99A6hq84', 'smaller rasbora', EV_SF_BLEHERI],
  [FIREHEAD, 'ofTl1CTOUWuLwM28PxTCMJ', 'anabantoid', EV_SF_BLEHERI],
  [STERBAI, FIREHEAD, 'small characin', EV_SF_STERBAI],
  [STERBAI, 'ofTl1CTOUWuLwM28PxTCdL', 'small characin', EV_SF_STERBAI],
  [STERBAI, 'J1Tx0fWCuGNPno99A79RmJ', 'small characin', EV_SF_STERBAI],
  [STERBAI, 'ofTl1CTOUWuLwM28PxTCMJ', 'anabantoid', EV_SF_STERBAI],
  [STERBAI, 'ofTl1CTOUWuLwM28PxTCRz', 'cyprinid', EV_SF_STERBAI],
  [STERBAI, 'ofTl1CTOUWuLwM28PxTCP9', 'cyprinid', EV_SF_STERBAI],
  [STERBAI, 'J1Tx0fWCuGNPno99A6hq84', 'cyprinid', EV_SF_STERBAI],
  [STERBAI, 'J1Tx0fWCuGNPno99A6UR1F', 'dwarf cichlid', EV_SF_STERBAI],
  [STERBAI, 'IlX7xILobrukz7d5JnfjuY', 'dwarf cichlid', EV_SF_STERBAI],
  [STERBAI, 'ofTl1CTOUWuLwM28PxTCJT', 'peaceful catfish', EV_SF_STERBAI],
];

(async () => {
  const SNAP = JSON.parse(fs.readFileSync(path.join(TEMP, 'spec12a_snapshot.json'), 'utf8'));
  const waterById = {};
  for (const s of JSON.parse(fs.readFileSync(path.join(TEMP, 's12a_species.json'), 'utf8'))) waterById[s._id] = s.waterType;

  const byId = {};
  for (const t of TYPES) for (const r of SNAP.records[t]) byId[r._id] = t;
  for (const id of await q('*[_type=="post"]._id')) byId[id] = 'post';
  for (const id of await q('*[_type=="tool"]._id')) byId[id] = 'tool';

  const nameOf = (id) => { for (const t of TYPES) { const r = SNAP.records[t].find((x) => x._id === id); if (r) return { type: t, title: r.title, slug: r.slug }; } return { type: byId[id] || null, title: null, slug: null }; };

  const existing = [];
  for (const t of TYPES) for (const r of SNAP.records[t]) for (const [field, ids] of Object.entries(r.rel || {})) for (const tid of ids) existing.push({ sourceType: t, sourceId: r._id, field, targetId: tid });
  const edgeKeySet = new Set(existing.map((e) => `${e.sourceId}|${e.field}|${e.targetId}`));

  const validation = { totalCandidates: 0, checks: [] };
  const check = (id, name, ok, detail) => validation.checks.push({ id, name, pass: !!ok, detail: String(detail ?? '') });

  const dryRunOps = [], evidenceRows = [], candidateRows = [];
  let propIdx = 0, selfLinks = 0, danglingTargets = 0, typeViolations = 0;
  for (const [srcId, tgtId, group, ev] of PROPOSALS) {
    propIdx++;
    const cid = 'REL12A-' + String(propIdx).padStart(4, '0');
    const sType = byId[srcId], tType = byId[tgtId];
    const sName = nameOf(srcId), tName = nameOf(tgtId);
    let decision = 'PROPOSE_WITH_CAVEAT';
    if (!sType || sType !== 'species') { decision = 'REJECT_SEMANTIC_MAPPING'; typeViolations++; }
    if (!tType) { decision = 'HOLD_EVIDENCE'; danglingTargets++; }
    else if (!REL_FIELDS.species.compatibleSpecies.targets.includes(tType)) { decision = 'REJECT_SEMANTIC_MAPPING'; typeViolations++; }
    if (srcId === tgtId) { decision = 'REJECT_SEMANTIC_MAPPING'; selfLinks++; }
    if (edgeKeySet.has(`${srcId}|compatibleSpecies|${tgtId}`)) decision = 'SKIP_ALREADY_PRESENT';
    candidateRows.push({ candidateId: cid, sourceType: sType, sourceId: srcId, sourceTitle: sName.title, sourceSlug: sName.slug, field: 'compatibleSpecies', relationshipKind: 'COMPATIBLE_CONDITIONAL', direction: 'source->target', targetType: tType, targetId: tgtId, targetTitle: tName.title, targetSlug: tName.slug, evidenceGroup: group, rationale: `Seriously Fish lists "${group}" as a suitable companion for ${sName.title}.`, evidenceUrl: ev.url, evidenceClass: ev.class, confidence: 'MEDIUM', riskTier: 'P1', decision, alreadyPresent: edgeKeySet.has(`${srcId}|compatibleSpecies|${tgtId}`), conditions: COND_FW.join('; '), caveat: 'General community guidance; verify tank size, water parameters and temperament for the specific setup.', dateChecked: DATE });
    evidenceRows.push({ candidateId: cid, sourceUrl: ev.url, sourceTitle: ev.title, publisher: ev.publisher, sourceType: ev.class, accessDate: ev.checked, evidenceNote: ev.note, claim: `${sName.title} can be kept with ${group} (${tName.title}) in a community tank.` });
    if (decision === 'PROPOSE_WITH_CAVEAT') dryRunOps.push({ candidateId: cid, sourceType: sType, sourceId: srcId, field: 'compatibleSpecies', op: 'add', targetId: tgtId, entry: { ref: { _type: 'reference', _ref: tgtId }, conditions: COND_FW, confidence: 'MEDIUM', evidenceNote: `Seriously Fish (${ev.url})` } });
  }
  validation.totalCandidates = PROPOSALS.length;

  for (const e of existing) candidateRows.push({ candidateId: 'EXIST-' + sha256(`${e.sourceId}|${e.field}|${e.targetId}`).slice(0, 12), sourceType: e.sourceType, sourceId: e.sourceId, sourceTitle: nameOf(e.sourceId).title, sourceSlug: nameOf(e.sourceId).slug, field: e.field, relationshipKind: e.field, direction: 'source->target', targetType: byId[e.targetId] || null, targetId: e.targetId, targetTitle: nameOf(e.targetId).title, targetSlug: nameOf(e.targetId).slug, evidenceGroup: '', rationale: 'Edge already present in production; preserved, not duplicated.', evidenceUrl: '', evidenceClass: 'FIRST_PARTY_EXISTING', confidence: 'HIGH', riskTier: 'P3', decision: 'SKIP_ALREADY_PRESENT', alreadyPresent: true, conditions: '', caveat: '', dateChecked: DATE });

  const heldRows = [];
  const gapFields = [['species', 'compatibleSpecies', 'species'], ['species', 'incompatibleSpecies', 'species'], ['species', 'predatorPrey', 'species/invertebrate'], ['invertebrate', 'compatibleSpecies', 'species'], ['invertebrate', 'predatorPrey', 'species/invertebrate'], ['invertebrate', 'suitableEquipment', 'equipment'], ['coral', 'coralNeighbors', 'coral'], ['equipment', 'compatibleEquipment', 'equipment'], ['equipment', 'relatedProblems', 'problem']];
  let heldIdx = 0;
  for (const [stype, field, ttypes] of gapFields) for (const r of SNAP.records[stype]) {
    const present = (r.rel && r.rel[field] && r.rel[field].length) || 0;
    if (present > 0) continue;
    heldIdx++;
    const high = field.includes('predator') || field.includes('incompatible') || field === 'compatibleSpecies';
    heldRows.push({ registerId: 'HELD12A-' + String(heldIdx).padStart(5, '0'), sourceType: stype, sourceId: r._id, sourceTitle: r.title, field, targetType: ttypes, decision: 'HOLD_EVIDENCE', riskTier: high ? 'P1' : 'P2', reason: 'Schema slot exists but no authoritative evidence obtained within the bounded research scope of SPEC 12A; not promoted.', evidenceNote: '', dateChecked: DATE });
  }
  const naRows = [];
  let naIdx = 0;
  for (const r of SNAP.records.species) {
    const wt = waterById[r._id];
    if (wt === 'freshwater' && !((r.rel.predatorPrey || []).length)) { naIdx++; naRows.push({ registerId: 'NA12A-' + String(naIdx).padStart(5, '0'), sourceType: 'species', sourceId: r._id, sourceTitle: r.title, field: 'reefInteractionDetail', targetType: 'coral', decision: 'NOT_APPLICABLE', riskTier: 'P3', reason: 'Freshwater species: coral interaction detail not applicable.', dateChecked: DATE }); }
    if (wt === 'saltwater') { naIdx++; naRows.push({ registerId: 'NA12A-' + String(naIdx).padStart(5, '0'), sourceType: 'species', sourceId: r._id, sourceTitle: r.title, field: 'compatiblePlants', targetType: 'plant', decision: 'NOT_APPLICABLE', riskTier: 'P3', reason: 'Saltwater species: no marine plant records exist for this slot.', dateChecked: DATE }); }
  }

  const existingSet = new Set(edgeKeySet);
  let applied = 0, duplicates = 0;
  for (const op of dryRunOps) { const k = `${op.sourceId}|${op.field}|${op.targetId}`; if (existingSet.has(k)) { duplicates++; continue; } existingSet.add(k); applied++; }

  check('V-01', 'every dry-run op targets an allowed relationship path', dryRunOps.every((o) => REL_FIELDS[o.sourceType] && REL_FIELDS[o.sourceType][o.field]), 'ops=' + dryRunOps.length);
  check('V-02', 'every dry-run op target exists and has allowed type', dryRunOps.every((o) => byId[o.targetId] && REL_FIELDS[o.sourceType][o.field].targets.includes(byId[o.targetId])), 'violations=' + typeViolations);
  check('V-03', 'no self-links in dry-run plan', dryRunOps.every((o) => o.sourceId !== o.targetId), 'selfLinks=' + selfLinks);
  check('V-04', 'no dangling targets in dry-run plan', dryRunOps.every((o) => o.targetId in byId), 'dangling=' + danglingTargets);
  check('V-05', 'dry-run plan is idempotent (0 duplicate edges)', duplicates === 0, 'duplicates=' + duplicates);
  check('V-06', 'dry-run plan contains only compatibleSpecies relationship field', dryRunOps.every((o) => o.field === 'compatibleSpecies'), 'fields=' + JSON.stringify([...new Set(dryRunOps.map((o) => o.field))]));
  check('V-07', 'no non-relationship fields present in dry-run entries', dryRunOps.every((o) => Object.keys(o.entry).every((k) => ['ref', 'conditions', 'confidence', 'evidenceNote'].includes(k))), 'entryKeysOk');
  check('V-08', 'directionality: proposals span >=2 source records', new Set(dryRunOps.map((o) => o.sourceId)).size >= 2, 'sources=' + new Set(dryRunOps.map((o) => o.sourceId)).size);
  const failed = validation.checks.filter((c) => !c.pass);
  validation.ok = failed.length === 0;

  const base = JSON.parse(fs.readFileSync(path.join(OUT, 'RELATIONSHIP_BASELINE.json'), 'utf8'));
  const post = {};
  for (const t of TYPES) post[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`);
  const postCounts = {}; for (const t of TYPES) postCounts[t] = post[t].length;
  const postDrafts = (await q('*[_id in path("drafts.**")]._id')).length;
  const canonical = {}; for (const t of TYPES) for (const r of post[t]) canonical[r._id] = { type: t, rec: r };
  const titleOf = (t, r) => (t === 'problem' ? r.title : r.name);
  const postHash = sha256(Object.keys(canonical).sort().map((id) => { const c = canonical[id]; return sha256(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) })); }).join('\n'));
  const postRelCount = TYPES.reduce((a, t) => a + post[t].reduce((b, r) => b + Object.keys(REL_FIELDS[t] || {}).reduce((c, f) => c + ((Array.isArray(r[f]) ? r[f].length : r[f] ? 1 : 0)), 0), 0), 0);
  const integrity = { specId: 'SPEC_12A', artifact: 'INTEGRITY', generatedAt: new Date().toISOString(), mode: 'READ-ONLY (GET query only; no writes, no deploy)', content_mutations: 0, pre: { counts: base.counts, total: base.total, drafts: base.drafts, identityHash: base.identity.hash, relationshipEdges: base.existingEdgeCount }, post: { counts: postCounts, total: Object.values(postCounts).reduce((a, b) => a + b, 0), drafts: { datasetDrafts: postDrafts }, identityHash: postHash, relationshipEdges: postRelCount }, identityMatch: postHash === base.identity.hash && postHash === EXPECTED_HASH, countsMatch: JSON.stringify(postCounts) === JSON.stringify(base.counts), deployedSchema: base.deployedSchema, environment: base.environment };

  fs.mkdirSync(OUT, { recursive: true });
  const csv = (headers, rows) => headers.join(',') + '\n' + rows.map((r) => headers.map((h) => { const v = r[h] == null ? '' : String(r[h]); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',')).join('\n') + '\n';

  const REL_ID = {
    'species.compatibleSpecies': 'REL-M01', 'species.compatiblePlants': 'REL-M03', 'species.compatibleInvertebrates': 'REL-M04', 'species.suitableEquipment': 'REL-M05', 'species.relatedProblems': 'REL-M06', 'species.incompatibleSpecies': 'REL-P01', 'species.predatorPrey': 'REL-P02', 'species.reefInteractionDetail': 'REL-P03', 'species.parentSpecies': 'REL-PARENT', 'species.relatedPosts': 'REL-POST',
    'plant.suitableEquipment': 'REL-M07', 'plant.relatedProblems': 'REL-M08', 'plant.relatedPosts': 'REL-POST',
    'invertebrate.compatibleSpecies': 'REL-M02', 'invertebrate.suitableEquipment': 'REL-M11', 'invertebrate.relatedProblems': 'REL-M12', 'invertebrate.predatorPrey': 'REL-P02', 'invertebrate.parentSpecies': 'REL-PARENT', 'invertebrate.relatedPosts': 'REL-POST',
    'coral.suitableEquipment': 'REL-M09', 'coral.relatedProblems': 'REL-M10', 'coral.coralNeighbors': 'REL-P04', 'coral.relatedPosts': 'REL-POST',
    'equipment.compatibleEquipment': 'REL-P05', 'equipment.relatedProblems': 'REL-P06', 'equipment.relatedPosts': 'REL-POST',
    'problem.relatedTools': 'REL-M15', 'problem.relatedPosts': 'REL-POST',
  };
  const CONSUMERS = {
    'species.compatibleSpecies': 'lib/database.ts projection; app/species/[slug]/page.tsx; app/tools/compatibility-checker/page.tsx (GROQ)',
    'invertebrate.compatibleSpecies': 'lib/database.ts projection; app/invertebrates/[slug]/page.tsx',
    'species.compatiblePlants': 'none (schema-only)', 'species.compatibleInvertebrates': 'none (schema-only)', 'species.suitableEquipment': 'none (schema-only)', 'species.relatedProblems': 'none (schema-only)', 'species.relatedPosts': 'none (schema-only)', 'species.incompatibleSpecies': 'none (schema-only)', 'species.predatorPrey': 'none (schema-only)', 'species.reefInteractionDetail': 'none (schema-only)', 'species.parentSpecies': 'none (schema-only)',
    'plant.suitableEquipment': 'none (schema-only)', 'plant.relatedProblems': 'none (schema-only)', 'plant.relatedPosts': 'none (schema-only)',
    'invertebrate.suitableEquipment': 'none (schema-only)', 'invertebrate.relatedProblems': 'none (schema-only)', 'invertebrate.relatedPosts': 'none (schema-only)', 'invertebrate.predatorPrey': 'none (schema-only)', 'invertebrate.parentSpecies': 'none (schema-only)',
    'coral.suitableEquipment': 'none (schema-only)', 'coral.relatedProblems': 'none (schema-only)', 'coral.coralNeighbors': 'none (schema-only)', 'coral.relatedPosts': 'none (schema-only)',
    'equipment.compatibleEquipment': 'none (schema-only)', 'equipment.relatedProblems': 'none (schema-only)', 'equipment.relatedPosts': 'none (schema-only)',
    'problem.relatedTools': 'none (schema-only)', 'problem.relatedPosts': 'none (schema-only)',
  };
  const fieldMapRows = [];
  for (const t of TYPES) for (const [field, spec] of Object.entries(REL_FIELDS[t])) {
    const withData = SNAP.records[t].filter((r) => (r.rel && r.rel[field] && r.rel[field].length) || 0).length;
    const edges = existing.filter((e) => e.sourceType === t && e.field === field).length;
    fieldMapRows.push({ relationshipId: REL_ID[`${t}.${field}`] || 'REL-?', sourceType: t, field, kind: spec.kind, targetTypes: spec.targets.join('|'), direction: spec.kind === 'ref' ? 'source->target (single)' : 'source->target (array)', reciprocity: ['compatibleSpecies', 'compatibleEquipment', 'coralNeighbors'].includes(field) ? 'symmetric display recommended' : 'none', consumers: CONSUMERS[`${t}.${field}`] || 'none (schema-only)', validation: spec.kind === 'objectArray' ? `${spec.entryRef} required` : 'reference target type enforced', coverageRecords: withData, coverageEdges: edges });
  }
  fs.writeFileSync(path.join(OUT, 'RELATIONSHIP_FIELD_MAP.csv'), csv(['relationshipId', 'sourceType', 'field', 'kind', 'targetTypes', 'direction', 'reciprocity', 'consumers', 'validation', 'coverageRecords', 'coverageEdges'], fieldMapRows));

  fs.writeFileSync(path.join(OUT, 'RELATIONSHIP_CANDIDATES.csv'), csv(['candidateId', 'sourceType', 'sourceId', 'sourceTitle', 'sourceSlug', 'field', 'relationshipKind', 'direction', 'targetType', 'targetId', 'targetTitle', 'targetSlug', 'evidenceGroup', 'rationale', 'evidenceUrl', 'evidenceClass', 'confidence', 'riskTier', 'decision', 'alreadyPresent', 'conditions', 'caveat', 'dateChecked'], candidateRows));
  fs.writeFileSync(path.join(OUT, 'RELATIONSHIP_EVIDENCE.csv'), csv(['candidateId', 'sourceUrl', 'sourceTitle', 'publisher', 'sourceType', 'accessDate', 'evidenceNote', 'claim'], evidenceRows));
  fs.writeFileSync(path.join(OUT, 'RELATIONSHIP_CONFLICTS.csv'), csv(['candidateId', 'sourceType', 'sourceId', 'field', 'targetId', 'conflictType', 'detail', 'resolution', 'dateChecked'], []));
  fs.writeFileSync(path.join(OUT, 'SPEC_12B_HELD_REGISTER.csv'), csv(['registerId', 'sourceType', 'sourceId', 'sourceTitle', 'field', 'targetType', 'decision', 'riskTier', 'reason', 'evidenceNote', 'dateChecked'], [...heldRows, ...naRows]));

  const dryRun = { specId: 'SPEC_12A', artifact: 'SPEC_12B_DRY_RUN_PLAN', generatedAt: new Date().toISOString(), mode: 'OFFLINE PLAN ONLY - not executed', targetDataset: 'production', targetProject: 'zeohjejw', defaultOperation: 'additive/idempotent array add only (never replace existing arrays)', operationCount: dryRunOps.length, simulated: { relationshipEdgesBefore: existing.length, relationshipEdgesAfter: existing.length + applied, note: 'SIMULATED - not a live change' }, idempotency: { duplicateEdgesOnReapply: duplicates, safeToReapply: duplicates === 0 },   operations: dryRunOps.map((o) => ({ candidateId: o.candidateId, sourceType: o.sourceType, documentId: o.sourceId, path: o.field, action: 'add-if-absent', value: o.entry })), excludedNonRelationshipFields: true };
  fs.writeFileSync(path.join(OUT, 'SPEC_12B_DRY_RUN_PLAN.json'), JSON.stringify(dryRun, null, 2));
  validation.simulated = { applied, duplicates, before: existing.length, after: existing.length + applied };
  fs.writeFileSync(path.join(OUT, 'VALIDATION_RESULTS.json'), JSON.stringify(validation, null, 2));
  fs.writeFileSync(path.join(OUT, 'INTEGRITY.json'), JSON.stringify(integrity, null, 2));

  const decisions = {}; for (const c of candidateRows) decisions[c.decision] = (decisions[c.decision] || 0) + 1;
  console.log(JSON.stringify({ candidates: candidateRows.length, decisions, proposals: dryRunOps.length, held: heldRows.length, na: naRows.length, applied, duplicates, integrityIdentityMatch: integrity.identityMatch, validationOk: validation.ok }, null, 2));
  process.exit(failed.length ? 2 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
