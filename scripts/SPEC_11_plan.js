/**
 * SPEC 11 Stage A — mutation plan, conflicts, completeness before/after.
 * READ-ONLY: reads RESEARCH_REGISTER.csv + baseline snapshot + wave1 profile,
 * writes PROPOSED_MUTATIONS.csv, CONFLICTS.csv, COMPLETENESS_BEFORE.csv,
 * COMPLETENESS_AFTER_PLAN.csv. No Sanity API usage. Deterministic output.
 */
const fs = require('fs');
const path = require('path');

const REPO = 'F:/AquaMind/aqua_mind_blog';
const TEMP = 'C:/Users/lam72/AppData/Local/Temp/opencode';
const OUT = path.join(REPO, 'report', 'SPEC_11');

const FIELD_DESTS = new Set([
  'minTankLengthCm', 'minTankWidthCm', 'swimmingSpace', 'jumpRisk', 'lidRequired',
  'flowPreference', 'oxygenSensitivity', 'maturityRequirement', 'bioload',
  'waterChangeSensitivity', 'salinityMin', 'salinityMax', 'behaviorFlags',
  'groupSize', 'communitySuitability', 'predatesInverts', 'tankSizeMinL',
  'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'ghMin', 'ghMax', 'diet', 'temperament',
]);
const BODY_SECTIONS = [
  'overview', 'adultSizeGrowth', 'behavior', 'tankRequirements', 'swimmingSpaceFootprint',
  'waterParameters', 'feeding', 'compatibility', 'specialRequirements', 'commonProblems',
  'breeding', 'practicalVerdict',
];
const ENUMS = {
  swimmingSpace: ['NONE', 'LOW', 'MODERATE', 'HIGH'],
  jumpRisk: ['NONE', 'LOW', 'MODERATE', 'HIGH'],
  lidRequired: ['NOT_REQUIRED', 'RECOMMENDED', 'ESSENTIAL'],
  flowPreference: ['STILL', 'MODERATE', 'STRONG'],
  oxygenSensitivity: ['NEUTRAL', 'SENSITIVE'],
  maturityRequirement: ['NONE', 'SUGGESTED', 'REQUIRED'],
  bioload: ['LOW', 'MODERATE', 'HIGH'],
  waterChangeSensitivity: ['LOW', 'MODERATE', 'HIGH'],
  communitySuitability: ['UNSUITABLE', 'CONDITIONAL', 'SUITABLE'],
  predatesInverts: ['NONE', 'POSSIBLE', 'LIKELY'],
};
const NUMERIC_DESTS = new Set(['minTankLengthCm', 'minTankWidthCm', 'tankSizeMinL', 'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'ghMin', 'ghMax', 'salinityMin', 'salinityMax']);
// Safety-critical destinations (SPEC 11 §14 dangerous-gap set): pending rows on these block L2.
const SAFETY_DESTS = new Set([
  'minTankLengthCm', 'minTankWidthCm', 'swimmingSpace', 'jumpRisk', 'lidRequired',
  'flowPreference', 'oxygenSensitivity', 'maturityRequirement', 'bioload',
  'waterChangeSensitivity', 'tankSizeMinL', 'communitySuitability', 'predatesInverts',
]);
// SPEC 09 CRITICAL requirement -> destination(s) that resolve it when planned
const REQ_TO_DEST = {
  min_tank_dimensions: ['minTankLengthCm'],
  tank_footprint: ['minTankWidthCm'],
  adult_footprint: ['minTankLengthCm', 'minTankWidthCm', 'body:swimmingSpaceFootprint'],
  swimming_space: ['swimmingSpace'],
  jumping_risk: ['jumpRisk'],
  lid_requirement: ['lidRequired'],
};
const SPACE_BLOCK_FIELDS = ['minTankLengthCm', 'minTankWidthCm', 'swimmingSpace', 'jumpRisk', 'lidRequired', 'flowPreference', 'oxygenSensitivity', 'maturityRequirement', 'waterChangeSensitivity', 'bioload'];

function parseCSV(t) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((x) => x !== ''));
}
function toCSV(headers, rows) {
  const esc = (v) => '"' + String(v === null || v === undefined ? '' : v).replace(/"/g, '""') + '"';
  const lines = [headers.map(esc).join(',')];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(','));
  return lines.join('\n') + '\n';
}
function write(file, content) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, file), content, 'utf8');
  console.log('WROTE report/SPEC_11/' + file + ' (' + content.length + ' bytes)');
}
function loadRegister() {
  const rows = parseCSV(fs.readFileSync(path.join(OUT, 'RESEARCH_REGISTER.csv'), 'utf8'));
  const hdr = rows[0];
  return rows.slice(1).map((r) => { const o = {}; hdr.forEach((h, i) => o[h] = r[i] === undefined ? '' : r[i]); return o; });
}
function loadSnapshot() {
  return JSON.parse(fs.readFileSync(path.join(TEMP, 'spec11_baseline_records.json'), 'utf8'));
}
function loadProfile() {
  return JSON.parse(fs.readFileSync(path.join(TEMP, 'spec11_wave1_profile.json'), 'utf8'));
}
function oldField(rec, dest) {
  if (!rec) return null;
  const v = rec[dest];
  if (v === undefined) return null;
  if (v === '') return null;
  return v;
}
function oldBody(rec, section) {
  if (!rec || !rec.knowledgeBody) return null;
  const v = rec.knowledgeBody[section];
  if (!v || (Array.isArray(v) && v.length === 0)) return null;
  return JSON.stringify(v);
}
function normForCompare(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (/^-?[0-9]+(\.[0-9]+)?$/.test(s)) return String(parseFloat(s));
  return s;
}

function buildMutations(reg, snap) {
  const out = [];
  const errors = [];
  let seq = 0;
  for (const r of reg) {
    if (r.editorDecision === 'PENDING_RESEARCH') continue;
    if (r.destinationType !== 'FIELD' && r.destinationType !== 'BODY_SECTION') continue; // RESEARCH_TOPIC: no schema target
    if (r.plannedValue === '' && r.destinationType !== 'FIELD') continue;
    const rec = snap.records.species.find((x) => x._id === r.recordId);
    if (!rec) { errors.push(r.researchRowId + ': record not in snapshot'); continue; }
    const isBody = r.destinationType === 'BODY_SECTION';
    const section = isBody ? r.destination.replace(/^body:/, '') : '';
    if (isBody && !BODY_SECTIONS.includes(section)) { errors.push(r.researchRowId + ': bad section'); continue; }
    if (!isBody) {
      const d = r.destination;
      if (!FIELD_DESTS.has(d)) { errors.push(r.researchRowId + ': not a schema field ' + d); continue; }
      if (ENUMS[d] && !ENUMS[d].includes(r.plannedValue)) { errors.push(r.researchRowId + ': enum invalid ' + d + '=' + r.plannedValue); continue; }
      if (NUMERIC_DESTS.has(d) && !/^-?[0-9]+(\.[0-9]+)?$/.test(r.plannedValue)) { errors.push(r.researchRowId + ': numeric invalid ' + d + '=' + r.plannedValue); continue; }
    }
    const oldV = isBody ? oldBody(rec, section) : oldField(rec, r.destination);
    const newV = r.plannedValue;
    const same = normForCompare(oldV) !== null && normForCompare(oldV) === normForCompare(newV);
    let mutationType, conflictFlag = 0, stageBAction;
    if (oldV === null) { mutationType = 'FILL_FIELD'; stageBAction = 'APPLY'; }
    else if (same) { mutationType = 'NOOP_SAME_VALUE'; stageBAction = 'SKIP_NOOP'; }
    else {
      mutationType = isBody ? 'REPLACE_BODY_SECTION' : 'REPLACE_FIELD';
      conflictFlag = 1;
      stageBAction = 'FLAG_FOR_PM';
    }
    seq += 1;
    out.push({
      mutationId: 'MUT11-' + String(seq).padStart(3, '0'),
      researchRowId: r.researchRowId, waveOrder: r.waveOrder, recordId: r.recordId, slug: r.slug, species: r.species,
      destination: r.destination, destinationType: r.destinationType,
      path: isBody ? 'knowledgeBody.' + section : r.destination,
      mutationType, oldValue: oldV === null ? '' : String(oldV), newValue: String(newV === null ? '' : newV),
      conflictFlag, stageBAction, applicability: r.applicability, priority: r.priority,
      confidence: r.confidence, evidenceClass: r.evidenceClass,
      source: r.source, sourceUrl: r.sourceUrl, reason: r.claim,
      notes: r.notes,
    });
  }
  return { mutations: out, errors };
}

function buildConflicts(reg, mutations) {
  const out = [];
  let seq = 0;
  for (const m of mutations.filter((x) => x.conflictFlag === 1)) {
    seq += 1;
    out.push({
      conflictId: 'CF11-' + String(seq).padStart(3, '0'),
      conflictType: 'VALUE_CONFLICT', recordId: m.recordId, slug: m.slug, species: m.species,
      destination: m.destination, researchRowId: m.researchRowId,
      oldValue: m.oldValue, proposedValue: m.newValue,
      priority: m.priority, safetyCritical: SAFETY_DESTS.has(m.destination) ? 1 : 0,
      confidence: m.confidence,
      sources: m.source + (m.sourceUrl ? ' <' + m.sourceUrl + '>' : ''),
      assessment: 'Existing value materially differs from research-backed proposed value (SPEC 11 §15 material difference).',
      resolution: 'FLAGGED_FOR_PM', notes: m.notes,
    });
  }
  for (const r of reg.filter((x) => x.editorDecision === 'PENDING_RESEARCH')) {
    seq += 1;
    const safety = SAFETY_DESTS.has(r.destination) || r.priority === 'P0';
    out.push({
      conflictId: 'CF11-' + String(seq).padStart(3, '0'),
      conflictType: 'UNRESOLVED_RESEARCH', recordId: r.recordId, slug: r.slug, species: r.species,
      destination: r.destination, researchRowId: r.researchRowId,
      oldValue: '', proposedValue: '',
      priority: r.priority, safetyCritical: safety ? 1 : 0,
      confidence: r.confidence,
      sources: (r.source || '') + (r.sourceUrl ? ' <' + r.sourceUrl + '>' : ''),
      assessment: 'No credible source resolved this claim; value not proposed. ' + (r.uncertainty || r.notes || ''),
      resolution: 'DO_NOT_APPLY_PENDING_RESEARCH', notes: r.uncertainty,
    });
  }
  return out;
}

function loadSafetyGaps() {
  const rows = parseCSV(fs.readFileSync(path.join(REPO, 'report/SPEC_09/SPEC_09_RECORD_GAP_MATRIX.csv'), 'utf8'));
  const hdr = rows[0];
  const map = {};
  for (const r of rows.slice(1)) {
    const o = {}; hdr.forEach((h, i) => o[h] = r[i] === undefined ? '' : r[i]);
    if (o.recordId) map[o.recordId] = o.safetyCriticalGaps || '';
  }
  return map;
}
const L2_STRUCTURED = [...SPACE_BLOCK_FIELDS, 'communitySuitability', 'behaviorFlags', 'groupSize'];

function completeness(rec, plan, safetyGapsStr) {
  const present = (dest) => {
    if (dest.startsWith('body:')) return plan.bodies.has(dest.replace(/^body:/, ''));
    if (plan.fields.has(dest)) return true;
    const v = rec[dest];
    return v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);
  };
  const flagsNow = plan.flags || [];
  const l0 = Boolean(rec.name && rec.scientificName && rec.slug && rec.slug.current && rec.sizeCm !== null && rec.sizeCm !== undefined);
  const l1 = l0 && rec.tempMinC != null && rec.tempMaxC != null && rec.phMin != null && rec.phMax != null &&
    rec.tankSizeMinL != null && rec.diet && rec.temperament;
  const missingSpace = SPACE_BLOCK_FIELDS.filter((f) => !present(f));
  const openP0 = plan.openP0;
  const l2SpaceBlock = l1 && missingSpace.length === 0 && openP0 === 0;
  const structuredPresent = L2_STRUCTURED.filter(present).length;
  const hasTrio = flagsNow.some((f) => ['territorial', 'solitary', 'timid'].includes(f));
  const bodyList = plan.bodyList;
  const compatN = Array.isArray(rec.compatibleSpecies) ? rec.compatibleSpecies.length : 0;
  const incompatN = Array.isArray(rec.incompatibleSpecies) ? rec.incompatibleSpecies.length : 0;
  const relProblems = Array.isArray(rec.relatedProblems) ? rec.relatedProblems.length : 0;
  const l2Full = l2SpaceBlock && present('communitySuitability') && present('behaviorFlags') && hasTrio &&
    present('groupSize') && compatN >= 1 && incompatN >= 1 && bodyList.length >= 8 &&
    bodyList.includes('practicalVerdict');
  const l3 = l2Full && bodyList.length >= 10 && relProblems >= 3;
  const l4 = l3 && compatN >= 5;
  const notes = [];
  if (!l1) notes.push('L1-incomplete');
  if (missingSpace.length) notes.push('space-missing:' + missingSpace.join('|'));
  if (openP0 > 0) notes.push('openP0=' + openP0);
  if (l2SpaceBlock && !l2Full) {
    const miss = [];
    if (!present('communitySuitability')) miss.push('communitySuitability');
    if (!present('behaviorFlags')) miss.push('behaviorFlags'); else if (!hasTrio) miss.push('behaviorFlags(trio)');
    if (!present('groupSize')) miss.push('groupSize');
    if (compatN < 1 || incompatN < 1) miss.push('relations');
    if (bodyList.length < 8 || !bodyList.includes('practicalVerdict')) miss.push('body>=8+verdict');
    if (miss.length) notes.push('L2full-missing:' + miss.join('|'));
  }
  if (l2Full && !l3) notes.push('L3-blocked:' + (bodyList.length < 10 ? 'body>=10;' : '') + (relProblems < 3 ? 'relatedProblems<3' : ''));
  const level = l4 ? 4 : l3 ? 3 : l2Full ? 2 : l1 ? 1 : 0;
  return {
    l0: l0 ? 1 : 0, l1: l1 ? 1 : 0, l2SpaceBlock: l2SpaceBlock ? 1 : 0, l2Full: l2Full ? 1 : 0,
    l3: l3 ? 1 : 0, l4: l4 ? 1 : 0, levelMax: level, openP0,
    structuredL2Present: structuredPresent, bodySections: bodyList.length,
    relations: compatN + '/' + incompatN, notes: notes.join('; '),
  };
}

function main() {
  const reg = loadRegister();
  const snap = loadSnapshot();
  const profile = loadProfile();
  const safetyGaps = loadSafetyGaps();
  const errors = [];
  if (reg.length !== 441) errors.push('register rows expected 441, got ' + reg.length);

  const { mutations, errors: mErr } = buildMutations(reg, snap);
  errors.push(...mErr);
  const conflicts = buildConflicts(reg, mutations);

  // per-record plan for AFTER completeness (wave 1 only gets a plan)
  const planByRecord = {};
  const pendingSafetyByRecord = {};
  for (const r of reg.filter((x) => x.editorDecision === 'PENDING_RESEARCH')) {
    if (SAFETY_DESTS.has(r.destination) || r.priority === 'P0') {
      pendingSafetyByRecord[r.recordId] = (pendingSafetyByRecord[r.recordId] || 0) + 1;
    }
  }
  for (const m of mutations) {
    if (m.stageBAction === 'SKIP_NOOP') continue;
    const p = planByRecord[m.recordId] = planByRecord[m.recordId] || { fields: new Set(), bodies: new Set(), flags: [], openP0: 0 };
    if (m.destinationType === 'BODY_SECTION') p.bodies.add(m.destination.replace(/^body:/, ''));
    else p.fields.add(m.destination);
    if (m.destination === 'behaviorFlags') p.flags = m.newValue.split(',').map((s) => s.trim()).filter(Boolean);
  }

  const beforeRows = [], afterRows = [];
  let noPhSpecies = null;
  for (const rec of snap.records.species) {
    const sg = safetyGaps[rec._id] || '';
    const critReqs = sg.split(';').map((s) => s.trim()).filter(Boolean);
    // BEFORE
    const beforePlan = { fields: new Set(), bodies: new Set(), flags: [], openP0: critReqs.length, bodyList: Object.keys(rec.knowledgeBody || {}).filter((k) => Array.isArray(rec.knowledgeBody[k]) && rec.knowledgeBody[k].length > 0) };
    const b = completeness(rec, beforePlan, sg);
    beforeRows.push({ recordId: rec._id, slug: (rec.slug && rec.slug.current) || '', title: rec.name, ...b });
    if (!rec.phMax) noPhSpecies = rec.name + ' (' + rec._id + ')';
    // AFTER
    const p = planByRecord[rec._id];
    let openP0After, bodyListAfter, flagsAfter;
    if (p) {
      const unresolvedCrit = critReqs.filter((req) => {
        const dests = REQ_TO_DEST[req];
        if (!dests) return true;
        return !dests.some((d) => d.startsWith('body:') ? p.bodies.has(d.replace(/^body:/, '')) : p.fields.has(d));
      });
      openP0After = (pendingSafetyByRecord[rec._id] || 0) + unresolvedCrit.length;
      bodyListAfter = [...p.bodies];
      flagsAfter = p.flags;
    } else {
      openP0After = critReqs.length;
      bodyListAfter = beforePlan.bodyList;
      flagsAfter = [];
    }
    const afterPlan = { fields: p ? p.fields : new Set(), bodies: p ? p.bodies : new Set(), flags: flagsAfter, openP0: openP0After, bodyList: bodyListAfter };
    const a = completeness(rec, afterPlan, sg);
    afterRows.push({ recordId: rec._id, slug: (rec.slug && rec.slug.current) || '', title: rec.name, ...a });
  }

  if (errors.length) { console.error('PLAN ERRORS:'); errors.forEach((e) => console.error(' - ' + e)); process.exit(1); }

  const mHeaders = ['mutationId', 'researchRowId', 'waveOrder', 'recordId', 'slug', 'species', 'destination', 'destinationType', 'path', 'mutationType', 'oldValue', 'newValue', 'conflictFlag', 'stageBAction', 'applicability', 'priority', 'confidence', 'evidenceClass', 'source', 'sourceUrl', 'reason', 'notes'];
  write('PROPOSED_MUTATIONS.csv', toCSV(mHeaders, mutations));
  const cHeaders = ['conflictId', 'conflictType', 'recordId', 'slug', 'species', 'destination', 'researchRowId', 'oldValue', 'proposedValue', 'priority', 'safetyCritical', 'confidence', 'sources', 'assessment', 'resolution', 'notes'];
  write('CONFLICTS.csv', toCSV(cHeaders, conflicts));
  const gHeaders = ['recordId', 'slug', 'title', 'levelMax', 'l0', 'l1', 'l2SpaceBlock', 'l2Full', 'l3', 'l4', 'openP0', 'structuredL2Present', 'bodySections', 'relations', 'notes'];
  write('COMPLETENESS_BEFORE.csv', toCSV(gHeaders, beforeRows));
  write('COMPLETENESS_AFTER_PLAN.csv', toCSV(gHeaders, afterRows));

  const fill = mutations.filter((m) => m.mutationType === 'FILL_FIELD').length;
  const replace = mutations.filter((m) => m.mutationType.startsWith('REPLACE')).length;
  const noop = mutations.filter((m) => m.mutationType === 'NOOP_SAME_VALUE').length;
  const flag = mutations.filter((m) => m.stageBAction === 'FLAG_FOR_PM').length;
  const valueConf = conflicts.filter((c) => c.conflictType === 'VALUE_CONFLICT').length;
  const unres = conflicts.filter((c) => c.conflictType === 'UNRESOLVED_RESEARCH').length;
  const unsafeUnres = conflicts.filter((c) => c.conflictType === 'UNRESOLVED_RESEARCH' && c.safetyCritical === 1).length;
  const w1 = afterRows.filter((r) => profile.some((p) => p.recordId === r.recordId));
  const l2bBefore = beforeRows.filter((r) => r.l2SpaceBlock === 1).length;
  const l2bAfter = w1.filter((r) => r.l2SpaceBlock === 1).length;
  const openP0AfterW1 = w1.reduce((s, r) => s + r.openP0, 0);
  const openP0BeforeW1 = beforeRows.filter((r) => profile.some((p) => p.recordId === r.recordId)).reduce((s, r) => s + r.openP0, 0);
  console.log('MUTATIONS total=' + mutations.length + ' fill=' + fill + ' replace=' + replace + ' noop=' + noop + ' flagForPM=' + flag);
  console.log('CONFLICTS value=' + valueConf + ' unresolved=' + unres + ' unresolvedSafety=' + unsafeUnres);
  console.log('COMPLETENESS wave1: l2SpaceBlock ' + l2bBefore + ' -> ' + l2bAfter + ' | openP0 ' + openP0BeforeW1 + ' -> ' + openP0AfterW1);
  console.log('L1 all-218 before=' + beforeRows.filter((r) => r.l1 === 1).length + ' after=' + afterRows.filter((r) => r.l1 === 1).length);
  console.log('species without phMax (L1 gap):', noPhSpecies || 'none');
  console.log('MUTATIONS STAGE COMPLETE - DETERMINISTIC');
}
main();
