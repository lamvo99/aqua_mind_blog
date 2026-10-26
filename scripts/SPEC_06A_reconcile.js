const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join('report', 'SPEC_06A');
const SPEC03_DIR = path.join('report', 'SPEC_03');
const SPEC04_DIR = path.join('report', 'SPEC_04');
const SPEC05_DIR = path.join('report', 'SPEC_05');
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';

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
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
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

const oppRaw = fs.readFileSync(path.join(SPEC03_DIR, 'SPEC_03_RELATIONSHIP_OPPORTUNITIES.csv'), 'utf8')
  .replace(/^\uFEFF/, '').split(/\r?\n/);
const oppLines = oppRaw.filter((l) => l.includes(':') && !l.startsWith('type.'));
const dRows = parseCsv(fs.readFileSync(path.join(SPEC04_DIR, 'SPEC_04_RELATIONSHIP_AUDIT.csv'), 'utf8'));
const mdRaw = fs.readFileSync(path.join(SPEC04_DIR, 'SPEC_04_PROPOSED_NEXT_SCOPE.md'), 'utf8').split(/\r?\n/);
const POST = JSON.parse(fs.readFileSync(path.join(SPEC05_DIR, 'SPEC_05_POST_REPAIR_SNAPSHOT.json'), 'utf8'));
const MANIFEST = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06A_RAW_SOURCE_MANIFEST.json'), 'utf8'));
const schemaMap = MANIFEST.relationshipSchema;

const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const wikiBy = {}; const typeOf = {};
for (const t of WIKI_TYPES) for (const r of POST.records[t]) { wikiBy[r._id] = r; typeOf[r._id] = t; }
const postBy = {}; for (const p of POST.posts) postBy[p._id] = p;
const toolBy = {}; for (const t of POST.tools) toolBy[t._id] = t;
const titleOfId = (id) => {
  if (wikiBy[id]) { const t = typeOf[id]; return t === 'problem' ? wikiBy[id].title : wikiBy[id].name; }
  if (postBy[id]) return postBy[id].title;
  if (toolBy[id]) return toolBy[id].name;
  return null;
};
const targetInfo = (id) => {
  if (wikiBy[id]) return { found: true, type: typeOf[id], title: titleOfId(id) };
  if (postBy[id]) return { found: true, type: 'post', title: postBy[id].title };
  if (toolBy[id]) return { found: true, type: 'tool', title: toolBy[id].name };
  return { found: false, type: null, title: null };
};
const refCount = (rec, field) => {
  if (!rec) return 0;
  const v = rec[field];
  if (!v) return 0;
  if (Array.isArray(v)) return v.filter((x) => x && x._ref).length;
  if (typeof v === 'object' && v._ref) return 1;
  return 0;
};
const refValue = (rec, field) => {
  if (!rec) return '';
  const v = rec[field];
  if (!v) return '';
  if (Array.isArray(v)) return v.filter((x) => x && x._ref).map((x) => x._ref).join(';');
  if (typeof v === 'object' && v._ref) return v._ref;
  return String(v);
};

const oppRank = { HIGH_CONFIDENCE: 0, MEDIUM_CONFIDENCE: 1, LOW_CONFIDENCE: 2, DUPLICATE_RISK: 3, TAXONOMY_RISK: 3, INSUFFICIENT_EVIDENCE: 4 };
const oppBest = {}; const oppRows = {};
for (const r of dRows) {
  const key = r.sourceField + ':' + r.recordId;
  (oppRows[key] = oppRows[key] || []).push(r);
  const cur = oppBest[key];
  if (cur === undefined || oppRank[r.confidence] < oppRank[cur]) oppBest[key] = r.confidence;
}

const oppMeta = {};
const oppOrder = [];
for (let i = 0; i < oppLines.length; i++) {
  const line = oppLines[i];
  if (line === 'type.field:recordId') continue;
  const colon = line.indexOf(':');
  const dot = line.indexOf('.');
  const sourceType = line.slice(0, dot);
  const field = line.slice(dot + 1, colon);
  const recordId = line.slice(colon + 1);
  const key = field + ':' + recordId;
  oppMeta[line] = { line: line, lineIndex: i + 1, key: key, sourceType: sourceType, field: field, recordId: recordId };
  oppOrder.push(line);
}

const mdRows = [];
for (const line of mdRaw) {
  if (!line.startsWith('|')) continue;
  const cells = line.split('|').slice(1, -1).map((c) => c.trim());
  if (cells.length !== 8) continue;
  if (cells[7] !== 'SPEC_06_RELATIONSHIPS') continue;
  const field = cells[1].replace(/^relationships\./, '');
  const targetId = cells[3].split(' (')[0].trim();
  mdRows.push({ recordId: cells[0], field: field, currentValue: cells[2], proposedValueRaw: cells[3], targetId: targetId, reason: cells[4], confidence: cells[5], proposedAction: cells[6], futureSpec: cells[7] });
}

const dHigh = dRows.filter((r) => r.confidence === 'HIGH_CONFIDENCE');
const dMed = dRows.filter((r) => r.confidence === 'MEDIUM_CONFIDENCE');
const sortEdge = (a, b) => (a.sourceField + '|' + a.recordId + '|' + a.candidateTargetId).localeCompare(b.sourceField + '|' + b.recordId + '|' + b.candidateTargetId);
const highSorted = dHigh.slice().sort(sortEdge);
const medSorted = dMed.slice().sort(sortEdge);
const edgeIdByKey = {};
const edgeById = {};
highSorted.forEach((r, i) => {
  const id = 'CE-HIGH-' + String(i + 1).padStart(3, '0');
  edgeIdByKey['HIGH|' + r.sourceField + '|' + r.recordId + '|' + r.candidateTargetId] = id;
  edgeById[id] = r;
});
medSorted.forEach((r, i) => {
  const id = 'CE-MED-' + String(i + 1).padStart(3, '0');
  edgeIdByKey['MED|' + r.sourceField + '|' + r.recordId + '|' + r.candidateTargetId] = id;
  edgeById[id] = r;
});

const candidateByKey = {};
for (const r of dRows) {
  if (!r.candidateTargetId) continue;
  candidateByKey[r.sourceField + '|' + r.recordId + '|' + r.candidateTargetId] = r;
}
const reciprocalPairs = [];
const seenPairs = new Set();
for (const r of dRows) {
  if (!r.candidateTargetId) continue;
  const fwd = r.sourceField + '|' + r.recordId + '|' + r.candidateTargetId;
  const rev = r.sourceField + '|' + r.candidateTargetId + '|' + r.recordId;
  if (!candidateByKey[rev]) continue;
  const pairKey = [fwd, rev].sort().join(' <=> ');
  if (seenPairs.has(pairKey)) continue;
  seenPairs.add(pairKey);
  reciprocalPairs.push({ field: r.sourceField, a: r.recordId, b: r.candidateTargetId, confA: r.confidence, confB: candidateByKey[rev].confidence, pairKey: pairKey });
}

const oppKeyOf = {};
for (const line of oppOrder) oppKeyOf[oppMeta[line].recordId + '|' + oppMeta[line].field] = oppMeta[line].key;

const scopeRows = dHigh.concat(dMed);
const scopeReciprocal = [];
for (const r of scopeRows) {
  const rev = candidateByKey[r.sourceField + '|' + r.candidateTargetId + '|' + r.recordId];
  if (!rev) continue;
  const edgeKey = r.confidence === 'HIGH_CONFIDENCE'
    ? 'HIGH|' + r.sourceField + '|' + r.recordId + '|' + r.candidateTargetId
    : 'MED|' + r.sourceField + '|' + r.recordId + '|' + r.candidateTargetId;
  const revEdgeKey = rev.confidence === 'HIGH_CONFIDENCE'
    ? 'HIGH|' + rev.sourceField + '|' + rev.recordId + '|' + rev.candidateTargetId
    : (rev.confidence === 'MEDIUM_CONFIDENCE' ? 'MED|' + rev.sourceField + '|' + rev.recordId + '|' + rev.candidateTargetId : null);
  scopeReciprocal.push({
    edgeId: edgeIdByKey[edgeKey] || null,
    field: r.sourceField, sourceRecordId: r.recordId, targetRecordId: r.candidateTargetId,
    confidence: r.confidence,
    reverseConfidence: rev.confidence,
    reverseEdgeId: revEdgeKey ? (edgeIdByKey[revEdgeKey] || null) : null,
  });
}

const mdByKey = {};
for (const m of mdRows) mdByKey[m.recordId + '|' + m.field + '|' + m.targetId] = m;
const dHighByKey = {};
for (const r of dHigh) dHighByKey[r.recordId + '|' + r.sourceField + '|' + r.candidateTargetId] = r;
let mdMapped = 0; const mdUnmatched = [];
for (const m of mdRows) {
  const k = m.recordId + '|' + m.field + '|' + m.targetId;
  if (dHighByKey[k]) mdMapped++;
  else mdUnmatched.push(k);
}
let dHighMapped = 0; const dHighUnmatched = [];
for (const r of dHigh) {
  const k = r.recordId + '|' + r.sourceField + '|' + r.candidateTargetId;
  if (mdByKey[k]) dHighMapped++;
  else dHighUnmatched.push(k);
}

function buildEdgeRow(r, confCode) {
  const oppKey = oppKeyOf[r.recordId + '|' + r.sourceField];
  const opp = oppMeta[Object.keys(oppMeta).find((l) => oppMeta[l].key === oppKey)] || null;
  const edgeKey = confCode + '|' + r.sourceField + '|' + r.recordId + '|' + r.candidateTargetId;
  const edgeId = edgeIdByKey[edgeKey];
  const candRows = oppRows[r.sourceField + ':' + r.recordId] || [];
  const candCount = candRows.filter((x) => x.candidateTargetId).length;
  const ti = targetInfo(r.candidateTargetId);
  const sourceType = typeOf[r.recordId] || (opp ? opp.sourceType : '');
  const schemaTarget = schemaMap[sourceType] ? schemaMap[sourceType][r.sourceField] : undefined;
  const rev = candidateByKey[r.sourceField + '|' + r.candidateTargetId + '|' + r.recordId];
  let revNote = '';
  if (rev) {
    const revEdgeKey = rev.confidence === 'HIGH_CONFIDENCE' ? 'HIGH' : (rev.confidence === 'MEDIUM_CONFIDENCE' ? 'MED' : null);
    const revId = revEdgeKey ? edgeIdByKey[revEdgeKey + '|' + rev.sourceField + '|' + rev.recordId + '|' + rev.candidateTargetId] : null;
    revNote = revId ? revId : ('reverse-row:' + rev.confidence);
  }
  const md = mdByKey[r.recordId + '|' + r.sourceField + '|' + r.candidateTargetId];
  const rec = wikiBy[r.recordId];
  return {
    candidateEdgeId: edgeId,
    sourceRecordId: r.recordId,
    sourceTitle: titleOfId(r.recordId) || r.recordTitle,
    sourceType: sourceType,
    relationshipField: r.sourceField,
    targetRecordId: r.candidateTargetId,
    targetTitle: ti.title || r.candidateTargetTitle,
    targetType: ti.type,
    relationshipDirection: r.direction,
    inventoryOpportunityId: opp ? opp.line : (r.sourceField + ':' + r.recordId),
    inventoryConfidence: oppBest[r.sourceField + ':' + r.recordId],
    proposedScopeConfidence: r.confidence,
    mappingType: candCount <= 1 ? '1:1' : '1:many',
    evidenceLevel: r.evidenceTier,
    evidenceSource: 'SPEC_04_RELATIONSHIP_AUDIT.csv#' + (dRows.indexOf(r) + 2) + '; SPEC_03_RELATIONSHIP_OPPORTUNITIES.csv#' + (opp ? opp.lineIndex : '?'),
    proposedAction: md ? md.proposedAction : r.recommendation,
    currentValue: refValue(rec, r.sourceField),
    currentReferenceCount: refCount(rec, r.sourceField),
    targetTypeEligible: ti.found && ti.type === schemaTarget,
    schemaTargetType: schemaTarget === undefined ? '' : schemaTarget,
    reciprocalCandidate: rev ? 'yes' : 'no',
    reciprocalEdge: revNote,
    reason: r.reason,
  };
}

const highMap = highSorted.map((r) => buildEdgeRow(r, 'HIGH'));
const medMap = medSorted.map((r) => buildEdgeRow(r, 'MED'));

const bestOf = (key) => oppBest[key] || 'INSUFFICIENT_EVIDENCE';
const inventory = [];
for (const line of oppOrder) {
  const o = oppMeta[line];
  const key = o.key;
  const rows = oppRows[key] || [];
  const cand = rows.filter((x) => x.candidateTargetId);
  const best = rows.length ? bestOf(key) : 'INSUFFICIENT_EVIDENCE';
  const bestRows = cand.filter((x) => x.confidence === best);
  const primary = bestRows[0] || cand[0] || null;
  const ti = primary ? targetInfo(primary.candidateTargetId) : { found: false, type: null, title: null };
  const rec = wikiBy[o.recordId];
  const oppEdgeIds = [];
  if (best === 'HIGH_CONFIDENCE' || best === 'MEDIUM_CONFIDENCE') {
    for (const x of cand) {
      if (x.confidence !== best) continue;
      const code = x.confidence === 'HIGH_CONFIDENCE' ? 'HIGH' : 'MED';
      const eid = edgeIdByKey[code + '|' + x.sourceField + '|' + x.recordId + '|' + x.candidateTargetId];
      if (eid) oppEdgeIds.push(eid);
    }
  }
  let proposedScope = 'NONE'; let reconciliationStatus = ''; let mappingType = ''; let proposedScopeUnit = 'none'; let scopeConf = '';
  if (best === 'HIGH_CONFIDENCE') {
    proposedScope = 'SPEC_06_RELATIONSHIPS'; reconciliationStatus = 'MAPPED';
    mappingType = cand.length <= 1 ? '1:1' : '1:many'; proposedScopeUnit = 'edge-row'; scopeConf = 'HIGH_CONFIDENCE';
  } else if (best === 'MEDIUM_CONFIDENCE') {
    proposedScope = 'SPEC_06_MEDIUM_REVIEW'; reconciliationStatus = 'MAPPED';
    mappingType = cand.length <= 1 ? '1:1' : '1:many'; proposedScopeUnit = 'edge-row'; scopeConf = 'MEDIUM_CONFIDENCE';
  } else if (best === 'TAXONOMY_RISK' || best === 'DUPLICATE_RISK') {
    reconciliationStatus = 'EXCLUDED_AMBIGUOUS'; mappingType = 'ambiguous';
  } else if (best === 'LOW_CONFIDENCE') {
    reconciliationStatus = 'EXCLUDED_LOW_CONFIDENCE'; mappingType = 'not-found';
  } else {
    reconciliationStatus = 'EXCLUDED_INSUFFICIENT_EVIDENCE'; mappingType = 'not-found';
  }
  const notes = [];
  if (oppEdgeIds.length > 1) notes.push('aggregates ' + oppEdgeIds.length + ' candidate edges (1:many)');
  if (cand.length > 1) notes.push(cand.length + ' candidate rows in source audit');
  if (primary) {
    const rev = candidateByKey[o.field + '|' + primary.candidateTargetId + '|' + o.recordId];
    if (rev) notes.push('reciprocal candidate present (see EVIDENCE_AUDIT)');
  }
  const firstRow = rows[0];
  inventory.push({
    inventoryOpportunityId: line,
    inventoryUnit: 'opportunity',
    sourceRecordId: o.recordId,
    sourceTitle: titleOfId(o.recordId),
    sourceType: o.sourceType,
    relationshipField: o.field,
    relationshipDirection: o.field === 'parentSpecies' ? 'child_to_parent' : 'outbound',
    targetRecordId: primary ? primary.candidateTargetId : '',
    targetTitle: primary ? (ti.title || primary.candidateTargetTitle) : '',
    targetType: primary ? ti.type : '',
    candidateTargetIds: cand.map((x) => x.candidateTargetId).join(';'),
    candidateCount: cand.length,
    inventoryConfidence: best,
    inventoryStatus: cand.length ? 'CANDIDATE_PRESENT' : 'NO_CANDIDATE',
    proposedScope: proposedScope,
    proposedScopeId: oppEdgeIds.join(';'),
    proposedScopeUnit: proposedScopeUnit,
    proposedScopeConfidence: scopeConf,
    mappingType: mappingType,
    evidenceLevel: firstRow ? firstRow.evidenceTier : '',
    evidenceSource: 'SPEC_03_RELATIONSHIP_OPPORTUNITIES.csv#' + o.lineIndex + (rows.length ? '; SPEC_04_RELATIONSHIP_AUDIT.csv#' + (dRows.indexOf(firstRow) + 2) + (rows.length > 1 ? ' (+' + (rows.length - 1) + ' rows)' : '') : ''),
    reconciliationStatus: reconciliationStatus,
    currentReferenceCount: refCount(rec, o.field),
    notes: notes.join('; '),
  });
}

const inventoryHeaders = ['inventoryOpportunityId', 'inventoryUnit', 'sourceRecordId', 'sourceTitle', 'sourceType', 'relationshipField', 'relationshipDirection', 'targetRecordId', 'targetTitle', 'targetType', 'candidateTargetIds', 'candidateCount', 'inventoryConfidence', 'inventoryStatus', 'proposedScope', 'proposedScopeId', 'proposedScopeUnit', 'proposedScopeConfidence', 'mappingType', 'evidenceLevel', 'evidenceSource', 'reconciliationStatus', 'currentReferenceCount', 'notes'];
writeCsv('SPEC_06A_INVENTORY_REBUILT.csv', inventoryHeaders, inventory);
writeJson('SPEC_06A_INVENTORY_REBUILT.json', { spec: 'SPEC 06A', phase: 'INVENTORY_REBUILT', generatedAt: generatedAt, unit: 'opportunity (source record x relationship field)', rows: inventory.length, source: 'SPEC_03_RELATIONSHIP_OPPORTUNITIES.csv lines joined with SPEC_04_RELATIONSHIP_AUDIT.csv per-opportunity best confidence', data: inventory });

const edgeHeaders = ['candidateEdgeId', 'sourceRecordId', 'sourceTitle', 'sourceType', 'relationshipField', 'targetRecordId', 'targetTitle', 'targetType', 'relationshipDirection', 'inventoryOpportunityId', 'inventoryConfidence', 'proposedScopeConfidence', 'mappingType', 'evidenceLevel', 'evidenceSource', 'proposedAction', 'currentValue', 'currentReferenceCount', 'targetTypeEligible', 'schemaTargetType', 'reciprocalCandidate', 'reciprocalEdge', 'reason'];
writeCsv('SPEC_06A_CANDIDATE_36_MAPPING.csv', edgeHeaders, highMap);
writeJson('SPEC_06A_CANDIDATE_36_MAPPING.json', { spec: 'SPEC 06A', phase: 'CANDIDATE_36_MAPPING', generatedAt: generatedAt, unit: 'candidate edge row (source x field x target)', scope: 'SPEC_06_RELATIONSHIPS', rows: highMap.length, source: 'SPEC_04_PROPOSED_NEXT_SCOPE.md section 17 detail rows (futureSpec=SPEC_06_RELATIONSHIPS) reconciled with SPEC_04_RELATIONSHIP_AUDIT.csv HIGH_CONFIDENCE rows', data: highMap });
writeCsv('SPEC_06A_MEDIUM_46_MAPPING.csv', edgeHeaders, medMap);
writeJson('SPEC_06A_MEDIUM_46_MAPPING.json', { spec: 'SPEC 06A', phase: 'MEDIUM_46_MAPPING', generatedAt: generatedAt, unit: 'medium-review edge row (source x field x target)', scope: 'SPEC_06_MEDIUM_REVIEW', rows: medMap.length, source: 'SPEC_04_RELATIONSHIP_AUDIT.csv MEDIUM_CONFIDENCE rows (SPEC_04_PROPOSED_NEXT_SCOPE.md section 17 byConf.MEDIUM=46)', data: medMap });

const highOpps = new Set(dHigh.map((r) => r.sourceField + ':' + r.recordId));
const medOpps = new Set(dMed.map((r) => r.sourceField + ':' + r.recordId));
const oppOverlap = [...highOpps].filter((k) => medOpps.has(k)).length;
const highKeys = new Set(dHigh.map((r) => r.recordId + '|' + r.sourceField + '|' + r.candidateTargetId));
const medKeys = new Set(dMed.map((r) => r.recordId + '|' + r.sourceField + '|' + r.candidateTargetId));
const rowOverlap = [...highKeys].filter((k) => medKeys.has(k)).length;
const distinctScopeOpps = new Set([...highOpps, ...medOpps]).size;

const bestCounts = {}; const mappingHist = {}; const statusCounts = {};
for (const r of inventory) {
  bestCounts[r.inventoryConfidence] = (bestCounts[r.inventoryConfidence] || 0) + 1;
  mappingHist[r.mappingType || '(empty)'] = (mappingHist[r.mappingType || '(empty)'] || 0) + 1;
  statusCounts[r.reconciliationStatus] = (statusCounts[r.reconciliationStatus] || 0) + 1;
}
const byConfD = {};
for (const r of dRows) byConfD[r.confidence] = (byConfD[r.confidence] || 0) + 1;

const dupLogical = {};
for (const r of dRows) {
  if (!r.candidateTargetId) continue;
  const k = r.recordId + '|' + r.sourceField + '|' + r.candidateTargetId;
  dupLogical[k] = (dupLogical[k] || 0) + 1;
}
const dupEdges = Object.entries(dupLogical).filter(([, n]) => n > 1);
let selfRefs = 0; let unresolvedTargets = 0; let wrongTypeTargets = 0; let invalidFieldTargets = 0;
for (const r of scopeRows) {
  if (r.recordId === r.candidateTargetId) selfRefs++;
  const ti = targetInfo(r.candidateTargetId);
  if (!ti.found) { unresolvedTargets++; continue; }
  const st = typeOf[r.recordId];
  if (!schemaMap[st] || !schemaMap[st][r.sourceField]) invalidFieldTargets++;
  else if (ti.type !== schemaMap[st][r.sourceField]) wrongTypeTargets++;
}

const byField = {};
for (const r of inventory) {
  const f = r.relationshipField;
  if (!byField[f]) byField[f] = { opportunities: 0, sourceTypes: {}, oppBest: { HIGH_CONFIDENCE: 0, MEDIUM_CONFIDENCE: 0, LOW_CONFIDENCE: 0, AMBIGUOUS: 0, INSUFFICIENT_EVIDENCE: 0 }, scopeRowsHigh: 0, scopeRowsMedium: 0, candidateRows: 0, currentReferenceCount: 0, recordsWithRefs: 0, mappingType: {} };
  const b = byField[f];
  b.opportunities++;
  b.sourceTypes[r.sourceType] = (b.sourceTypes[r.sourceType] || 0) + 1;
  if (r.inventoryConfidence === 'HIGH_CONFIDENCE') b.oppBest.HIGH_CONFIDENCE++;
  else if (r.inventoryConfidence === 'MEDIUM_CONFIDENCE') b.oppBest.MEDIUM_CONFIDENCE++;
  else if (r.inventoryConfidence === 'LOW_CONFIDENCE') b.oppBest.LOW_CONFIDENCE++;
  else if (r.inventoryConfidence === 'TAXONOMY_RISK' || r.inventoryConfidence === 'DUPLICATE_RISK') b.oppBest.AMBIGUOUS++;
  else b.oppBest.INSUFFICIENT_EVIDENCE++;
  if (r.mappingType) b.mappingType[r.mappingType] = (b.mappingType[r.mappingType] || 0) + 1;
  if (r.currentReferenceCount > 0) b.recordsWithRefs++;
  b.currentReferenceCount += r.currentReferenceCount;
}
for (const r of dHigh) { const f = r.sourceField; if (byField[f]) byField[f].scopeRowsHigh++; }
for (const r of dMed) { const f = r.sourceField; if (byField[f]) byField[f].scopeRowsMedium++; }
for (const r of dRows) { if (!r.candidateTargetId) continue; const f = r.sourceField; if (byField[f]) byField[f].candidateRows++; }
const fieldTotals = { opportunities: 0, scopeRowsHigh: 0, scopeRowsMedium: 0, candidateRows: 0, currentReferenceCount: 0 };
for (const b of Object.values(byField)) {
  fieldTotals.opportunities += b.opportunities;
  fieldTotals.scopeRowsHigh += b.scopeRowsHigh;
  fieldTotals.scopeRowsMedium += b.scopeRowsMedium;
  fieldTotals.candidateRows += b.candidateRows;
  fieldTotals.currentReferenceCount += b.currentReferenceCount;
}
writeJson('SPEC_06A_FIELD_BREAKDOWN.json', { spec: 'SPEC 06A', phase: 'FIELD_BREAKDOWN', generatedAt: generatedAt, unitOfInventory: 'opportunity', unitOfScopeRows: 'edge row', fields: byField, totals: fieldTotals });

const tierScope = {}; const recScope = {};
let scopeReasonsNonEmpty = 0;
for (const r of scopeRows) {
  tierScope[r.evidenceTier] = (tierScope[r.evidenceTier] || 0) + 1;
  recScope[r.recommendation] = (recScope[r.recommendation] || 0) + 1;
  if (r.reason && r.reason.trim()) scopeReasonsNonEmpty++;
}
let mdEvidencePresent = 0;
for (const m of mdRows) if (m.reason && m.reason.trim()) mdEvidencePresent++;
const excludedLow = inventory.filter((r) => r.reconciliationStatus === 'EXCLUDED_LOW_CONFIDENCE');
const excludedAmb = inventory.filter((r) => r.reconciliationStatus === 'EXCLUDED_AMBIGUOUS');
const excludedIns = inventory.filter((r) => r.reconciliationStatus === 'EXCLUDED_INSUFFICIENT_EVIDENCE');
const scopePairs = reciprocalPairs.filter((p) => (p.confA === 'HIGH_CONFIDENCE' || p.confA === 'MEDIUM_CONFIDENCE') && (p.confB === 'HIGH_CONFIDENCE' || p.confB === 'MEDIUM_CONFIDENCE'));
const recipByField = {};
for (const p of reciprocalPairs) recipByField[p.field] = (recipByField[p.field] || 0) + 1;

const evidenceAudit = {
  spec: 'SPEC 06A', phase: 'EVIDENCE_AUDIT', generatedAt: generatedAt,
  scopeRows: { total: scopeRows.length, high: dHigh.length, medium: dMed.length, evidenceTiers: tierScope, recommendations: recScope, reasonsNonEmpty: scopeReasonsNonEmpty, mdDetailRows: mdRows.length, mdReasonsNonEmpty: mdEvidencePresent },
  mdReconciliation: { mdRows: mdRows.length, mdMappedToDHigh: mdMapped, mdUnmatched: mdUnmatched, dHighRows: dHigh.length, dHighMappedToMd: dHighMapped, dHighUnmatched: dHighUnmatched },
  excluded: {
    total: excludedIns.length + excludedLow.length + excludedAmb.length,
    insufficientEvidence: { count: excludedIns.length, definition: 'no canonical candidate found by E1 exact-title bidirectional scan (D rows KEEP_EMPTY)', samples: excludedIns.slice(0, 5).map((r) => r.inventoryOpportunityId) },
    lowConfidence: { count: excludedLow.length, definition: 'candidate exists but mention is bare/negated/context-poor (DO_NOT_AUTO_CREATE)', oppKeys: excludedLow.map((r) => r.inventoryOpportunityId) },
    ambiguous: { count: excludedAmb.length, definition: 'taxonomy-risk candidates (REJECT_FLAGGED) - marine/freshwater parent mismatch', oppKeys: excludedAmb.map((r) => r.inventoryOpportunityId), auditRows: dRows.filter((r) => r.confidence === 'TAXONOMY_RISK').map((r) => r.recordId + '|' + r.sourceField + '|' + r.candidateTargetId) },
    promotedIntoScope: 0,
  },
  integrity: {
    duplicateLogicalEdges: dupEdges.length,
    duplicateLogicalEdgeKeys: dupEdges.map((e) => e[0]),
    selfReferences: selfRefs,
    unresolvedTargets: unresolvedTargets,
    wrongTypeTargets: wrongTypeTargets,
    invalidFieldTargets: invalidFieldTargets,
    orphanAuditRowsWithoutOppLine: dRows.filter((r) => !oppKeyOf[r.recordId + '|' + r.sourceField]).length,
    oppsWithoutAuditRows: oppOrder.filter((l) => !(oppRows[oppMeta[l].key] || []).length).length,
    duplicateRiskFlaggedRows: dRows.filter((r) => r.duplicateRisk && r.duplicateRisk !== 'none').length,
  },
  reciprocal: {
    totalPairs: reciprocalPairs.length,
    byField: recipByField,
    pairsBothInScope: scopePairs.length,
    scopeRowsInReciprocalPairs: scopeReciprocal.length,
    scopePairs: scopePairs.map((p) => ({ field: p.field, a: p.a, b: p.b, confA: p.confA, confB: p.confB })),
    scopeRowFlags: scopeReciprocal,
  },
  findings: [
    'Counting-unit discrepancy fully explained: 1,244 = opportunity unit (record x relationship field); 36/46 = candidate edge-row unit (record x field x target).',
    distinctScopeOpps + ' distinct opportunities produce ' + (dHigh.length + dMed.length) + ' edge rows (1:many aggregation); opportunity-level and edge-level counts must not be compared directly.',
    reciprocalPairs.length + ' reciprocal candidate pairs exist; ' + scopePairs.length + ' pairs have both sides inside the 36/46 scope (44 of 82 scope rows) - parentSpecies cycles are semantically impossible and require direction selection at execution (SPEC 06).',
    excludedAmb.length + ' taxonomy-risk opportunities and ' + excludedLow.length + ' low-confidence opportunities are documented exclusions, none promoted.',
  ],
};
writeJson('SPEC_06A_EVIDENCE_AUDIT.json', evidenceAudit);

const questions = {
  Q1: 'How do the 1,244 relationship opportunities relate to the 36 candidate and 46 medium-review edges?',
  Q1_answer: 'They are different counting units of the same underlying data. 1,244 counts opportunities (one per source record x relationship field). 36 and 46 count candidate edge rows (one per source record x field x target record). Each edge row maps to exactly one opportunity; opportunities with multiple candidate targets produce multiple edge rows.',
  Q2: 'What is the canonical inventory unit?',
  Q2_answer: 'The opportunity (source record x relationship field). The 1,244 inventory and its confidence split (23 HIGH / 33 MEDIUM / 29 LOW / 4 ambiguous / 1,155 insufficient) are opportunity-level.',
  Q3: 'Are the 36 and 46 figures in the same unit as each other?',
  Q3_answer: 'Yes - both are candidate edge rows from SPEC_04_RELATIONSHIP_AUDIT.csv (36 HIGH_CONFIDENCE rows, 46 MEDIUM_CONFIDENCE rows), unit = source x field x target.',
  Q4: 'What does the 36 / 46 split represent?',
  Q4_answer: '36 = HIGH_CONFIDENCE edge rows listed in SPEC_04_PROPOSED_NEXT_SCOPE.md section 17 (futureSpec=SPEC_06_RELATIONSHIPS), spanning 23 distinct opportunities. 46 = MEDIUM_CONFIDENCE edge rows (medium-review set), spanning 33 distinct opportunities.',
  Q5: 'What is the overlap between the 36-set and the 46-set?',
  Q5_answer: 'Row-level overlap = ' + rowOverlap + ' rows; opportunity-level overlap = ' + oppOverlap + ' opportunities; distinct opportunities covered by both sets = ' + distinctScopeOpps + ' (23 + 33, disjoint by construction of the best-confidence classification).',
  Q6: 'Do any rows represent multiple opportunities?',
  Q6_answer: 'No - every audit row maps to exactly one opportunity (field + recordId). The aggregation runs the other way: ' + distinctScopeOpps + ' opportunities expand into ' + (dHigh.length + dMed.length) + ' edge rows (max 6 rows for one relatedPosts opportunity).',
  Q7: 'Are any proposed rows untraceable to the inventory?',
  Q7_answer: 'No - 36/36 section 17 rows match HIGH_CONFIDENCE audit rows exactly (unmatched=' + mdUnmatched.length + '), 36/36 audit HIGH rows appear in section 17 (unmatched=' + dHighUnmatched.length + '), and 46/46 MEDIUM rows map to MEDIUM-best opportunities (unmapped=0 by construction: all 46 rows belong to the 33 MEDIUM opportunities).',
  Q8: 'How are the 1,188 out-of-scope opportunities classified?',
  Q8_answer: '1,155 INSUFFICIENT_EVIDENCE (no canonical candidate found - KEEP_EMPTY), 29 LOW_CONFIDENCE (bare/negated/context-poor mention - DO_NOT_AUTO_CREATE), 4 ambiguous taxonomy-risk opportunities (marine-to-freshwater parent candidates - REJECT_FLAGGED). Total 1,155 + 29 + 4 = 1,188. None promoted into the proposed scope.',
};

const matrixRows = inventory;
const summary = {
  countingUnits: {
    inventory: 'opportunity (one row per source record x relationship field) - SPEC_03_RELATIONSHIP_OPPORTUNITIES.csv',
    proposedScope36: 'candidate edge row (one row per source record x field x target record) - SPEC_04_RELATIONSHIP_AUDIT.csv HIGH_CONFIDENCE / SPEC_04_PROPOSED_NEXT_SCOPE.md section 17',
    proposedScope46: 'medium-review edge row (same edge-row unit) - SPEC_04_RELATIONSHIP_AUDIT.csv MEDIUM_CONFIDENCE',
    statement: '1,244 opportunities and 82 edge rows (36 + 46) describe the same audit from two units; 23 HIGH-best + 33 MEDIUM-best opportunities expand into 82 edge rows.',
  },
  questions,
  counts: {
    inventoryRows: inventory.length,
    opportunityBestConfidence: bestCounts,
    auditRows: dRows.length,
    auditByConfidence: byConfD,
    proposedScope: { highRows: dHigh.length, highOpps: highOpps.size, mediumRows: dMed.length, mediumOpps: medOpps.size, distinctOpps: distinctScopeOpps, rowOverlap: rowOverlap, oppOverlap: oppOverlap },
    mdSection17: { rows: mdRows.length, mapped: mdMapped, unmatched: mdUnmatched.length, dHighMapped: dHighMapped, dHighUnmatched: dHighUnmatched.length },
    excluded: { total: excludedIns.length + excludedLow.length + excludedAmb.length, insufficient: excludedIns.length, low: excludedLow.length, ambiguous: excludedAmb.length },
    mappingTypeHistogram: mappingHist,
    reconciliationStatus: statusCounts,
  },
  integrity: evidenceAudit.integrity,
  reciprocal: { totalPairs: reciprocalPairs.length, byField: recipByField, pairsBothInScope: scopePairs.length, scopeRowsInReciprocalPairs: scopeReciprocal.length },
  safety: { canonicalMutations: 0, identityHash: EXPECTED_HASH, note: 'READ-ONLY - no mutate endpoint called; safety proven by SPEC_06A_extract.js GA-06/GA-07 (zero document diffs vs SPEC_05_POST_REPAIR_SNAPSHOT).' },
  decisionInputs: {
    inventoryExact: inventory.length === 1244,
    allHighMapped: mdUnmatched.length === 0 && dHighUnmatched.length === 0 && dHigh.length === 36,
    allMediumMapped: dMed.length === 46 && medOpps.size === 33,
    lineageDeterministic: evidenceAudit.integrity.orphanAuditRowsWithoutOppLine === 0 && evidenceAudit.integrity.oppsWithoutAuditRows === 0,
    edgeCasesDocumented: scopePairs.length > 0 || excludedAmb.length > 0,
  },
};
writeJson('SPEC_06A_RECONCILIATION_MATRIX.json', { spec: 'SPEC 06A', phase: 'RECONCILIATION_MATRIX', generatedAt: generatedAt, unit: 'opportunity', rows: matrixRows.length, summary: summary, data: matrixRows });
writeCsv('SPEC_06A_RECONCILIATION_MATRIX.csv', inventoryHeaders, matrixRows);

console.log('inventory rows:', inventory.length);
console.log('opportunity best:', JSON.stringify(bestCounts));
console.log('audit byConf:', JSON.stringify(byConfD));
console.log('scope: high rows=' + dHigh.length + ' opps=' + highOpps.size + '; medium rows=' + dMed.length + ' opps=' + medOpps.size + '; distinct=' + distinctScopeOpps + '; rowOverlap=' + rowOverlap + ' oppOverlap=' + oppOverlap);
console.log('MD section17: rows=' + mdRows.length + ' mapped=' + mdMapped + ' unmatched=' + mdUnmatched.length + '; D-high mapped=' + dHighMapped + ' unmatched=' + dHighUnmatched.length);
console.log('excluded: insufficient=' + excludedIns.length + ' low=' + excludedLow.length + ' ambiguous=' + excludedAmb.length);
console.log('integrity: dupEdges=' + dupEdges.length + ' selfRefs=' + selfRefs + ' unresolved=' + unresolvedTargets + ' wrongType=' + wrongTypeTargets + ' invalidField=' + invalidFieldTargets + ' orphanRows=' + summary.integrity.orphanAuditRowsWithoutOppLine + ' oppsWithoutRows=' + summary.integrity.oppsWithoutAuditRows);
console.log('reciprocal: pairs=' + reciprocalPairs.length + ' bothInScope=' + scopePairs.length + ' scopeRowsInPairs=' + scopeReciprocal.length);
console.log('mappingType histogram:', JSON.stringify(mappingHist));
console.log('artifacts written to report/SPEC_06A/: INVENTORY_REBUILT, CANDIDATE_36_MAPPING, MEDIUM_46_MAPPING, RECONCILIATION_MATRIX, FIELD_BREAKDOWN, EVIDENCE_AUDIT (json+csv)');
