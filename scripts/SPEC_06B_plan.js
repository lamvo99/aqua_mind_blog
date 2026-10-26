const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join('report', 'SPEC_06B');
const SPEC06A_DIR = path.join('report', 'SPEC_06A');
const SPEC04_DIR = path.join('report', 'SPEC_04');
fs.mkdirSync(OUT_DIR, { recursive: true });

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').replace(/^\?/, '').split(/\r?\n/).filter((l) => l.length);
  const parseLine = (l) => {
    const o = []; let cur = ''; let inQ = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (inQ) {
        if (ch === String.fromCharCode(34) && l[i + 1] === String.fromCharCode(34)) { cur += String.fromCharCode(34); i++; }
        else if (ch === String.fromCharCode(34)) inQ = false;
        else cur += ch;
      } else if (ch === String.fromCharCode(34)) inQ = true;
      else if (ch === ',') { o.push(cur); cur = ''; }
      else cur += ch;
    }
    o.push(cur);
    return o;
  };
  const hdr = parseLine(lines[0]);
  return lines.slice(1).map((l) => {
    const vals = parseLine(l);
    const row = {};
    hdr.forEach((h, i) => { row[h] = vals[i] !== undefined ? vals[i] : ''; });
    return row;
  });
}
const csvCell = (v) => {
  const s = v === undefined || v === null ? '' : String(v);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) return '"' + s.replace(/"/g, '""') + '"';
  return s;
};
const toCsv = (headers, rows) => {
  const out = [headers.map(csvCell).join(',')];
  for (const r of rows) out.push(headers.map((h) => csvCell(r[h])).join(','));
  return out.join('\r\n');
};
const writeJson = (name, obj) => fs.writeFileSync(path.join(OUT_DIR, name), JSON.stringify(obj, null, 2));
const writeCsv = (name, headers, rows) => fs.writeFileSync(path.join(OUT_DIR, name), toCsv(headers, rows));
const generatedAt = new Date().toISOString();

const MANIFEST = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06B_RAW_SOURCE_MANIFEST.json'), 'utf8'));
const map36 = JSON.parse(fs.readFileSync(path.join(SPEC06A_DIR, 'SPEC_06A_CANDIDATE_36_MAPPING.json'), 'utf8'));
const map46 = JSON.parse(fs.readFileSync(path.join(SPEC06A_DIR, 'SPEC_06A_MEDIUM_46_MAPPING.json'), 'utf8'));
const matrix = JSON.parse(fs.readFileSync(path.join(SPEC06A_DIR, 'SPEC_06A_RECONCILIATION_MATRIX.json'), 'utf8'));
const dRows = parseCsv(fs.readFileSync(path.join(SPEC04_DIR, 'SPEC_04_RELATIONSHIP_AUDIT.csv'), 'utf8'));
const edgeStates = MANIFEST.edgeStates;
const compatConvention = MANIFEST.compatConvention;

const edges = map36.data.concat(map46.data);
const edgeByKey = {};
for (const e of edges) edgeByKey[e.sourceRecordId + '|' + e.relationshipField + '|' + e.targetRecordId] = e;
const oppById = {};
for (const r of matrix.data) oppById[r.inventoryOpportunityId] = r;

const candidateRows = dRows.filter((r) => r.candidateTargetId);
const candRowByKey = {};
for (const r of candidateRows) candRowByKey[r.recordId + '|' + r.sourceField + '|' + r.candidateTargetId] = r;

const pairs = [];
const seenPairs = new Set();
for (const r of candidateRows) {
  const rev = candRowByKey[r.candidateTargetId + '|' + r.sourceField + '|' + r.recordId];
  if (!rev) continue;
  const a = r.recordId < r.candidateTargetId ? r.recordId : r.candidateTargetId;
  const b = r.recordId < r.candidateTargetId ? r.candidateTargetId : r.recordId;
  const pk = r.sourceField + '|' + a + '|' + b;
  if (seenPairs.has(pk)) continue;
  seenPairs.add(pk);
  const rowA = r.recordId === a ? r : rev;
  const rowB = r.recordId === a ? rev : r;
  pairs.push({ field: r.sourceField, a: a, b: b, rowA: rowA, rowB: rowB });
}
pairs.sort((x, y) => (x.field + '|' + x.a + '|' + x.b).localeCompare(y.field + '|' + y.a + '|' + y.b));

const pairInfoByEdge = {};
const recipRows = [];
let rpIndex = 0;
for (const p of pairs) {
  rpIndex++;
  const rpId = 'RP-' + String(rpIndex).padStart(3, '0');
  const edgeA = edgeByKey[p.a + '|' + p.field + '|' + p.b] || null;
  const edgeB = edgeByKey[p.b + '|' + p.field + '|' + p.a] || null;
  const bothScope = !!(edgeA && edgeB);
  const hasTax = p.rowA.confidence === 'TAXONOMY_RISK' || p.rowB.confidence === 'TAXONOMY_RISK';
  let directionRelationship = '';
  let risk = '';
  let handling = '';
  if (p.field === 'parentSpecies') {
    directionRelationship = bothScope ? 'MUTUALLY_EXCLUSIVE' : 'ONE_SIDED_EXCLUDED';
    if (bothScope) { risk = 'BLOCKED'; handling = 'BLOCK'; }
    else if (hasTax) { risk = 'BLOCKED'; handling = 'BLOCK'; }
    else { risk = 'LOW'; handling = 'BLOCK'; }
  } else if (p.field === 'compatibleSpecies') {
    directionRelationship = bothScope ? 'SYMMETRIC_CANDIDATE' : 'ONE_SIDED_EXCLUDED';
    if (bothScope) { risk = 'HIGH'; handling = 'REVIEW'; }
    else if (hasTax) { risk = 'BLOCKED'; handling = 'BLOCK'; }
    else { risk = 'LOW'; handling = 'BLOCK'; }
  } else {
    directionRelationship = 'NON_DIRECTIONAL_RECIPROCAL';
    risk = hasTax ? 'BLOCKED' : 'LOW';
    handling = 'BLOCK';
  }
  recipRows.push({
    reciprocalPairId: rpId,
    edgeA: edgeA ? edgeA.candidateEdgeId : '',
    edgeB: edgeB ? edgeB.candidateEdgeId : '',
    sourceA: p.a,
    targetA: p.b,
    fieldA: p.field,
    sourceB: p.b,
    targetB: p.a,
    fieldB: p.field,
    sameField: 'true',
    directionRelationship: directionRelationship,
    evidenceA: p.rowA.evidenceTier + ' | ' + p.rowA.confidence + ' | ' + p.rowA.reason,
    evidenceB: p.rowB.evidenceTier + ' | ' + p.rowB.confidence + ' | ' + p.rowB.reason,
    risk: risk,
    recommendedHandling: handling,
    bothSidesInProposedScope: bothScope ? 'true' : 'false',
  });
  if (edgeA) pairInfoByEdge[edgeA.candidateEdgeId] = { rpId: rpId, directionRelationship: directionRelationship, handling: handling, risk: risk, field: p.field, bothScope: bothScope, partnerEdgeId: edgeB ? edgeB.candidateEdgeId : '' };
  if (edgeB) pairInfoByEdge[edgeB.candidateEdgeId] = { rpId: rpId, directionRelationship: directionRelationship, handling: handling, risk: risk, field: p.field, bothScope: bothScope, partnerEdgeId: edgeA ? edgeA.candidateEdgeId : '' };
}

const scopeOpps = new Set(edges.map((e) => e.inventoryOpportunityId));
const otmOpps = matrix.data.filter((r) => r.mappingType === '1:many' && scopeOpps.has(r.inventoryOpportunityId)).map((r) => r.inventoryOpportunityId).sort();
const otmGroupByOpp = {};
otmOpps.forEach((k, i) => { otmGroupByOpp[k] = 'OTM-' + String(i + 1).padStart(3, '0'); });

const classify = (state) => {
  const cur = state.currentValue;
  const isPresent = (() => {
    if (cur === null || cur === undefined) return false;
    if (Array.isArray(cur)) return cur.some((x) => x && x._ref === state.targetId);
    if (typeof cur === 'object' && cur._ref) return cur._ref === state.targetId;
    return false;
  })();
  if (!state.targetExists) return 'INVALID';
  if (!state.targetTypeEligible) return 'INVALID';
  if (isPresent) return 'ALREADY_PRESENT';
  const scalarConflict = state.relationshipField === 'parentSpecies' && cur !== null && cur !== undefined && !(Array.isArray(cur)) && typeof cur === 'object' && cur._ref && cur._ref !== state.targetId;
  if (scalarConflict) return 'AMBIGUOUS';
  return 'ABSENT';
};

const idemRows = [];
const idemByEdge = {};
for (const e of edges) {
  const st = edgeStates[e.candidateEdgeId];
  const classification = classify(st);
  idemByEdge[e.candidateEdgeId] = classification;
  idemRows.push({
    edgeId: e.candidateEdgeId,
    opportunityId: e.inventoryOpportunityId,
    confidence: e.proposedScopeConfidence,
    sourceRecordId: st.recordId,
    relationshipField: st.relationshipField,
    targetRecordId: st.targetId,
    expectedRev: st._rev,
    currentStateSerialized: st.currentSerialized,
    targetExists: st.targetExists ? 'true' : 'false',
    targetTypeLive: st.targetTypeLive || '',
    classification: classification,
    checkedAt: generatedAt,
  });
}

const decisionByEdge = {};
for (const e of edges) {
  const st = edgeStates[e.candidateEdgeId];
  const idem = idemByEdge[e.candidateEdgeId];
  const pi = pairInfoByEdge[e.candidateEdgeId];
  const inScopeRecip = pi && pi.bothScope;
  let mutationType = 'ADD_REFERENCE';
  let risk = e.proposedScopeConfidence === 'HIGH_CONFIDENCE' ? 'LOW' : 'MEDIUM';
  let blockReason = '';
  if (idem === 'ALREADY_PRESENT') { mutationType = 'NO_OP'; risk = 'LOW'; blockReason = 'target already present'; }
  else if (idem === 'INVALID') { mutationType = 'BLOCKED'; risk = 'HIGH'; blockReason = 'target invalid or unresolved'; }
  else if (idem === 'AMBIGUOUS') { mutationType = 'BLOCKED'; risk = 'HIGH'; blockReason = 'existing conflicting reference in scalar field'; }
  else if (inScopeRecip && pi.field === 'parentSpecies') { mutationType = 'BLOCKED'; risk = 'BLOCKED'; blockReason = 'reciprocal parentSpecies cycle - direction not established'; }
  else if (inScopeRecip && pi.field === 'compatibleSpecies') { mutationType = 'BLOCKED'; risk = 'HIGH'; blockReason = 'reciprocal compatibleSpecies pair - canonical convention review required'; }
  else if (inScopeRecip) { mutationType = 'BLOCKED'; risk = 'HIGH'; blockReason = 'reciprocal pair ambiguity'; }
  decisionByEdge[e.candidateEdgeId] = { mutationType: mutationType, riskLevel: risk, blockReason: blockReason, idempotency: idem, pair: pi };
}

const batches = {};
for (const e of edges) {
  const d = decisionByEdge[e.candidateEdgeId];
  if (d.mutationType !== 'ADD_REFERENCE') continue;
  const key = e.sourceRecordId + '|' + e.relationshipField;
  (batches[key] = batches[key] || []).push(e);
}
const batchIds = Object.keys(batches).sort();
const batchIdByKey = {};
batchIds.forEach((k, i) => { batchIdByKey[k] = 'B-' + String(i + 1).padStart(3, '0'); });

const isScalarField = (f) => f === 'parentSpecies';
const resultingRefs = (key) => {
  const list = batches[key].slice().sort((a, b) => a.candidateEdgeId.localeCompare(b.candidateEdgeId));
  const st = edgeStates[list[0].candidateEdgeId];
  const cur = st.currentValue;
  const existing = [];
  if (Array.isArray(cur)) for (const x of cur) if (x && x._ref) existing.push({ _ref: x._ref });
  else if (cur && typeof cur === 'object' && cur._ref) existing.push({ _ref: cur._ref });
  for (const e of list) if (!existing.some((x) => x._ref === e.targetRecordId)) existing.push({ _ref: e.targetRecordId });
  return existing;
};

const EDGE_HEADERS = ['edgeId', 'opportunityId', 'confidence', 'sourceRecordId', 'sourceType', 'sourceTitle', 'relationshipField', 'targetRecordId', 'targetType', 'targetTitle', 'direction', 'evidenceLevel', 'evidenceSource', 'evidenceReason', 'currentRelationshipState', 'proposedRelationshipState', 'mutationType', 'duplicateStatus', 'reciprocalPairId', 'oneToManyGroupId', 'riskLevel', 'PMReviewStatus'];
const edgePlanRows = [];
for (const e of edges) {
  const st = edgeStates[e.candidateEdgeId];
  const d = decisionByEdge[e.candidateEdgeId];
  const key = e.sourceRecordId + '|' + e.relationshipField;
  let proposedState = '';
  if (d.mutationType === 'ADD_REFERENCE') {
    if (isScalarField(e.relationshipField)) proposedState = 'SET ' + JSON.stringify({ _ref: e.targetRecordId }) + ' (field currently ' + st.currentSerialized + ')';
    else proposedState = 'APPEND ' + JSON.stringify({ _ref: e.targetRecordId }) + ' -> resulting array ' + JSON.stringify(resultingRefs(key));
  } else if (d.mutationType === 'NO_OP') {
    proposedState = 'NO_OP (target already present - no write planned)';
  } else {
    proposedState = 'NOT_PROPOSED (' + d.blockReason + ')';
  }
  edgePlanRows.push({
    edgeId: e.candidateEdgeId,
    opportunityId: e.inventoryOpportunityId,
    confidence: e.proposedScopeConfidence,
    sourceRecordId: e.sourceRecordId,
    sourceType: st.sourceTypeLive,
    sourceTitle: st.sourceTitleLive,
    relationshipField: e.relationshipField,
    targetRecordId: e.targetRecordId,
    targetType: st.targetTypeLive,
    targetTitle: st.targetTitleLive,
    direction: e.relationshipDirection,
    evidenceLevel: e.evidenceLevel,
    evidenceSource: e.evidenceSource,
    evidenceReason: e.reason,
    currentRelationshipState: st.currentSerialized + ' [' + d.idempotency + ']',
    proposedRelationshipState: proposedState,
    mutationType: d.mutationType,
    duplicateStatus: d.idempotency,
    reciprocalPairId: d.pair ? d.pair.rpId : '',
    oneToManyGroupId: otmGroupByOpp[e.inventoryOpportunityId] || '',
    riskLevel: d.riskLevel,
    PMReviewStatus: 'PENDING_PM_REVIEW',
  });
}
writeJson('SPEC_06B_EDGE_LEVEL_PLAN.json', { spec: 'SPEC 06B', phase: 'EDGE_LEVEL_PLAN', generatedAt: generatedAt, unit: 'edge (record x field x target)', rows: edgePlanRows.length, pmReviewStatusValue: 'PENDING_PM_REVIEW', authorization: 'NONE - planning only; not mutation authorization', data: edgePlanRows });
writeCsv('SPEC_06B_EDGE_LEVEL_PLAN.csv', EDGE_HEADERS, edgePlanRows);

const recipHeaders = ['reciprocalPairId', 'edgeA', 'edgeB', 'sourceA', 'targetA', 'fieldA', 'sourceB', 'targetB', 'fieldB', 'sameField', 'directionRelationship', 'evidenceA', 'evidenceB', 'risk', 'recommendedHandling', 'bothSidesInProposedScope'];
writeJson('SPEC_06B_RECIPROCAL_PAIRS.json', { spec: 'SPEC 06B', phase: 'RECIPROCAL_PAIRS', generatedAt: generatedAt, rows: recipRows.length, bothInScope: recipRows.filter((r) => r.bothSidesInProposedScope === 'true').length, handlingEnum: ['KEEP_A', 'KEEP_B', 'KEEP_BOTH', 'BLOCK', 'REVIEW', 'NOT_RECIPROCAL'], data: recipRows });
writeCsv('SPEC_06B_RECIPROCAL_PAIRS.csv', recipHeaders, recipRows);

const otmRows = [];
for (const opp of otmOpps) {
  const gid = otmGroupByOpp[opp];
  const groupEdges = edges.filter((e) => e.inventoryOpportunityId === opp).sort((a, b) => a.candidateEdgeId.localeCompare(b.candidateEdgeId));
  for (const e of groupEdges) {
    const d = decisionByEdge[e.candidateEdgeId];
    otmRows.push({
      oneToManyGroupId: gid,
      opportunityId: opp,
      edgeId: e.candidateEdgeId,
      target: e.targetRecordId + ' (' + (edgeStates[e.candidateEdgeId].targetTitleLive || '') + ')',
      targetEvidence: e.evidenceLevel + ' | ' + e.evidenceSource,
      duplicateStatus: d.idempotency,
      mutationStatus: d.mutationType,
    });
  }
}
writeJson('SPEC_06B_ONE_TO_MANY.json', { spec: 'SPEC 06B', phase: 'ONE_TO_MANY', generatedAt: generatedAt, groupCount: otmOpps.length, rows: otmRows.length, data: otmRows });
writeCsv('SPEC_06B_ONE_TO_MANY.csv', ['oneToManyGroupId', 'opportunityId', 'edgeId', 'target', 'targetEvidence', 'duplicateStatus', 'mutationStatus'], otmRows);

writeJson('SPEC_06B_IDEMPOTENCY_CHECK.json', { spec: 'SPEC 06B', phase: 'IDEMPOTENCY_CHECK', generatedAt: generatedAt, method: 'fresh live read of every source record involved in the 82 candidate edges (SPEC_06B_RAW_SOURCE_MANIFEST.edgeStates)', rows: idemRows.length, classificationEnum: ['ALREADY_PRESENT', 'ABSENT', 'AMBIGUOUS', 'INVALID'], data: idemRows });
writeCsv('SPEC_06B_IDEMPOTENCY_CHECK.csv', ['edgeId', 'opportunityId', 'confidence', 'sourceRecordId', 'relationshipField', 'targetRecordId', 'expectedRev', 'currentStateSerialized', 'targetExists', 'targetTypeLive', 'classification', 'checkedAt'], idemRows);

const parentSpeciesEdges = edgePlanRows.filter((r) => r.relationshipField === 'parentSpecies');
const psDirection = parentSpeciesEdges.map((r) => {
  const d = decisionByEdge[r.edgeId];
  const conflicted = !!(d.pair && d.pair.bothScope && d.pair.field === 'parentSpecies');
  return {
    edgeId: r.edgeId,
    opportunityId: r.opportunityId,
    confidence: r.confidence,
    sourceRecordId: r.sourceRecordId,
    sourceTitle: r.sourceTitle,
    targetRecordId: r.targetRecordId,
    targetTitle: r.targetTitle,
    sourceRole: 'child_or_variant_candidate',
    targetRole: 'parent_or_canonical_candidate',
    directionEvidence: 'D-row direction=' + r.direction + '; tier=' + r.evidenceLevel + '; ' + (conflicted ? 'REVERSE EDGE ' + d.pair.partnerEdgeId + ' claims the inverse parentage (pair ' + d.pair.rpId + ') - mutual parent claims impossible' : 'no reverse parent claim exists in the candidate set'),
    directionConfidence: conflicted ? 'CONFLICTED' : (r.confidence === 'HIGH_CONFIDENCE' ? 'HIGH' : 'MEDIUM'),
    directionStatus: conflicted ? 'BLOCKED_REVIEW' : 'VALID_CHILD_TO_PARENT',
    directionEvidenceReason: r.evidenceReason,
    reciprocalPairId: d.pair ? d.pair.rpId : '',
    mutationType: r.mutationType,
    riskLevel: r.riskLevel,
  };
});
const conflictedPs = psDirection.filter((x) => x.directionConfidence === 'CONFLICTED');
const validPs = psDirection.filter((x) => x.directionStatus === 'VALID_CHILD_TO_PARENT');

const csScope = edgePlanRows.filter((r) => r.relationshipField === 'compatibleSpecies');
const directionAudit = {
  spec: 'SPEC 06B', phase: 'DIRECTION_AUDIT', generatedAt: generatedAt,
  parentSpecies: {
    rule: 'parentSpecies is directional: source = child/variant, target = parent/canonical. Reverse direction is never inferred from biological reciprocity. Direction not establishable -> BLOCKED/REVIEW.',
    edgeCount: parentSpeciesEdges.length,
    directionEstablished: validPs.length,
    directionConflicted: conflictedPs.length,
    edges: psDirection,
  },
  compatibleSpecies: {
    question: 'Is compatibleSpecies semantically directional or symmetric according to the live schema and existing canonical usage?',
    schemaSemantics: 'array of references to species (sanity/schemaTypes/species.ts, invertebrate.ts); schema carries no direction marker and no reciprocal constraint.',
    existingUsage: compatConvention.compatibleSpecies,
    conventionEvidence: {
      compatiblePlants: compatConvention.compatiblePlants,
      compatibleInvertebrates: compatConvention.compatibleInvertebrates,
      interpretation: 'Both populated compatibility fields show reciprocityRate = 0 (535 ordered pairs / 0 symmetric; 388 ordered pairs / 0 symmetric): the canonical convention stores compatibility arrays as one-directional editorial lists, never as mutual listings.',
    },
    conclusion: 'compatibleSpecies is field-semantics-symmetric (compatibility is a symmetric concept) but the database convention is one-directional storage. compatibleSpecies itself has zero existing references, so there is no field-specific usage evidence. For a reciprocal candidate pair the convention supports at most ONE direction, but evidence does not establish which side -> REVIEW (both edges BLOCKED pending PM decision). Do not assume symmetry.',
    inScopePairs: recipRows.filter((r) => r.bothSidesInProposedScope === 'true' && r.fieldA === 'compatibleSpecies').map((r) => ({ reciprocalPairId: r.reciprocalPairId, edgeA: r.edgeA, edgeB: r.edgeB, recommendedHandling: r.recommendedHandling })),
    scopeEdgeCount: csScope.length,
    scopeEdgeMutationTypes: csScope.map((r) => ({ edgeId: r.edgeId, mutationType: r.mutationType, riskLevel: r.riskLevel })),
  },
  otherFields: {
    note: 'relatedPosts, suitableEquipment and other non-parentSpecies fields carry direction=outbound (source record links outward); no direction ambiguity is possible for them in this candidate set.',
    reciprocalPairsInThoseFields: recipRows.filter((r) => r.fieldA !== 'parentSpecies' && r.fieldA !== 'compatibleSpecies').length,
  },
  summary: {
    parentSpeciesEdges: parentSpeciesEdges.length,
    parentSpeciesDirectionEstablished: validPs.length,
    parentSpeciesDirectionConflicted: conflictedPs.length,
    compatibleSpeciesEdges: csScope.length,
    compatibleSpeciesReviewEdges: csScope.filter((r) => r.mutationType === 'BLOCKED').length,
  },
};
writeJson('SPEC_06B_DIRECTION_AUDIT.json', directionAudit);

const addEdges = edgePlanRows.filter((r) => r.mutationType === 'ADD_REFERENCE');
const noOpEdges = edgePlanRows.filter((r) => r.mutationType === 'NO_OP');
const blockedEdges = edgePlanRows.filter((r) => r.mutationType === 'BLOCKED');
const mutationPlanRows = addEdges.map((r) => {
  const st = edgeStates[r.edgeId];
  const key = r.sourceRecordId + '|' + r.relationshipField;
  const batchEdges = batches[key];
  const batchTargets = batchEdges.slice().sort((a, b) => a.candidateEdgeId.localeCompare(b.candidateEdgeId)).map((e) => e.targetRecordId);
  return {
    edgeId: r.edgeId,
    opportunityId: r.opportunityId,
    confidence: r.confidence,
    recordId: r.sourceRecordId,
    relationshipField: r.relationshipField,
    targetRecordId: r.targetRecordId,
    expectedCurrentReferenceState: st.currentSerialized,
    proposedReferenceState: isScalarField(r.relationshipField) ? JSON.stringify({ _ref: r.targetRecordId }) : JSON.stringify(resultingRefs(key)),
    expectedRev: st._rev,
    batchGroupId: batchIdByKey[key],
    batchTargetCount: batchTargets.length,
    batchTargets: batchTargets.join(';'),
    PMReviewStatus: 'PENDING_PM_REVIEW',
  };
});
const futureSafetySteps = [
  'Fresh-fetch source record.',
  'Verify _rev equals expectedRev (abort + refetch this record if different).',
  'Verify current relationship value equals expectedCurrentReferenceState.',
  'Verify target still exists.',
  'Verify target type matches the schema target type for this field.',
  'Verify proposed direction (child -> parent for parentSpecies).',
  'Verify no duplicate reference already present.',
  'Apply field-level conditional patch (patch with ifRevisionID) to exactly one relationship field.',
  'Refetch the record.',
  'Verify exactly one approved relationship field changed.',
];
writeJson('SPEC_06B_MUTATION_PLAN.json', {
  spec: 'SPEC 06B', phase: 'MUTATION_PLAN', generatedAt: generatedAt,
  authorization: 'NONE - this plan is not authorized. Relationship mutations authorized = 0. No mutation endpoint was called.',
  counts: { candidateEdges: edgePlanRows.length, addReference: addEdges.length, noOp: noOpEdges.length, blocked: blockedEdges.length, batches: batchIds.length },
  expectedWritePayloadColumns: ['recordId', 'relationshipField', 'targetRecordId', 'expectedCurrentReferenceState', 'proposedReferenceState', 'expectedRev'],
  concurrencyBaseline: { description: 'expectedRev is the live _rev captured by SPEC_06B_extract (EB-07). A future GATE C must abort any record whose current._rev differs.', recordRevBaseline: MANIFEST.recordRevBaseline },
  futureMutationSafety: futureSafetySteps,
  batchRule: 'All ADD_REFERENCE edges sharing the same recordId + relationshipField form one batch (B-nnn) and must be applied as a single field-level patch with one expectedRev; applying them separately would invalidate expectedRev after the first write.',
  rows: mutationPlanRows,
});
writeCsv('SPEC_06B_MUTATION_PLAN.csv', ['edgeId', 'opportunityId', 'confidence', 'recordId', 'relationshipField', 'targetRecordId', 'expectedCurrentReferenceState', 'proposedReferenceState', 'expectedRev', 'batchGroupId', 'batchTargetCount', 'batchTargets', 'PMReviewStatus'], mutationPlanRows);

const byConf = { HIGH: { edges: 0, ADD: 0, NO_OP: 0, BLOCKED: 0, opps: new Set() }, MEDIUM: { edges: 0, ADD: 0, NO_OP: 0, BLOCKED: 0, opps: new Set() } };
for (const r of edgePlanRows) {
  const c = r.confidence === 'HIGH_CONFIDENCE' ? 'HIGH' : 'MEDIUM';
  byConf[c].edges++;
  byConf[c].opps.add(r.opportunityId);
  if (r.mutationType === 'ADD_REFERENCE') byConf[c].ADD++;
  else if (r.mutationType === 'NO_OP') byConf[c].NO_OP++;
  else byConf[c].BLOCKED++;
}
const summary = {
  populations: {
    HIGH: { opportunities: byConf.HIGH.opps.size, edges: byConf.HIGH.edges, addReference: byConf.HIGH.ADD, noOp: byConf.HIGH.NO_OP, blocked: byConf.HIGH.BLOCKED },
    MEDIUM: { opportunities: byConf.MEDIUM.opps.size, edges: byConf.MEDIUM.edges, addReference: byConf.MEDIUM.ADD, noOp: byConf.MEDIUM.NO_OP, blocked: byConf.MEDIUM.BLOCKED },
    TOTAL: { opportunities: otmOpps.length ? new Set(edges.map((e) => e.inventoryOpportunityId)).size : 0, edges: edgePlanRows.length, addReference: addEdges.length, noOp: noOpEdges.length, blocked: blockedEdges.length },
  },
  reciprocalPairs: recipRows.length,
  pairsInsideProposedScope: recipRows.filter((r) => r.bothSidesInProposedScope === 'true').length,
  oneToManyOpportunities: otmOpps.length,
  oneToManyEdges: otmRows.length,
  alreadyPresentReferences: idemRows.filter((r) => r.classification === 'ALREADY_PRESENT').length,
  absentReferences: idemRows.filter((r) => r.classification === 'ABSENT').length,
  ambiguousReferences: idemRows.filter((r) => r.classification === 'AMBIGUOUS').length,
  invalidReferences: idemRows.filter((r) => r.classification === 'INVALID').length,
  directionConflicts: conflictedPs.length,
  directionEstablishedParentSpecies: validPs.length,
  blocked: blockedEdges.length,
  mutationBatches: batchIds.length,
  idempotency: idemRows.reduce((acc, r) => { acc[r.classification] = (acc[r.classification] || 0) + 1; return acc; }, {}),
  riskLevels: edgePlanRows.reduce((acc, r) => { acc[r.riskLevel] = (acc[r.riskLevel] || 0) + 1; return acc; }, {}),
  pmReviewStatuses: edgePlanRows.reduce((acc, r) => { acc[r.PMReviewStatus] = (acc[r.PMReviewStatus] || 0) + 1; return acc; }, {}),
  authorizedRelationshipMutations: 0,
};
summary.populations.TOTAL.opportunities = new Set(edges.map((e) => e.inventoryOpportunityId)).size;
writeJson('SPEC_06B_PLAN_SUMMARY.json', { spec: 'SPEC 06B', phase: 'PLAN_SUMMARY', generatedAt: generatedAt, summary: summary });

console.log('edges: ' + edgePlanRows.length + ' (HIGH=' + byConf.HIGH.edges + ' MEDIUM=' + byConf.MEDIUM.edges + ')');
console.log('mutationType: ADD=' + addEdges.length + ' NO_OP=' + noOpEdges.length + ' BLOCKED=' + blockedEdges.length);
console.log('populations: HIGH opps=' + byConf.HIGH.opps.size + ' edges=' + byConf.HIGH.edges + ' [ADD=' + byConf.HIGH.ADD + ' NO_OP=' + byConf.HIGH.NO_OP + ' BLOCKED=' + byConf.HIGH.BLOCKED + ']; MEDIUM opps=' + byConf.MEDIUM.opps.size + ' edges=' + byConf.MEDIUM.edges + ' [ADD=' + byConf.MEDIUM.ADD + ' NO_OP=' + byConf.MEDIUM.NO_OP + ' BLOCKED=' + byConf.MEDIUM.BLOCKED + ']');
console.log('reciprocal pairs: ' + recipRows.length + ' both-in-scope=' + summary.pairsInsideProposedScope + '; 1:many groups=' + otmOpps.length + ' rows=' + otmRows.length);
console.log('idempotency: ' + JSON.stringify(summary.idempotency) + '; risk: ' + JSON.stringify(summary.riskLevels) + '; pm: ' + JSON.stringify(summary.pmReviewStatuses));
console.log('parentSpecies direction: established=' + validPs.length + ' conflicted=' + conflictedPs.length + ' (of ' + parentSpeciesEdges.length + ')');
console.log('batches: ' + batchIds.length + '; direction audit + mutation plan written to report/SPEC_06B/');
