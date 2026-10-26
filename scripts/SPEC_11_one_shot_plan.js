const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// SPEC 11 one-shot - FINAL OPERATION PLAN (deterministic; READ-ONLY, no network).
// Derives explicit final actions from the regenerated Stage A + Revision 1 evidence.

const OUT = path.join('reports', 'SPEC_11', 'one_shot');
const RPT = path.join('report', 'SPEC_11');
const REV = path.join('reports', 'SPEC_11', 'revision_1');

function splitCsvLine(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else { if (ch === '"') q = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch; }
  }
  out.push(cur); return out;
}
function readCsv(file) {
  const lines = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length > 0);
  const h = splitCsvLine(lines[0]);
  return lines.slice(1).map((l) => { const r = splitCsvLine(l); const o = {}; h.forEach((k, i) => { o[k] = r[i] == null ? '' : r[i]; }); return o; });
}
const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
function toCsv(headers, rows) { return headers.join(',') + '\n' + rows.map((r) => headers.map((h) => esc(r[h])).join(',')).join('\n') + '\n'; }

const NUMERIC = new Set(['minTankLengthCm', 'minTankWidthCm', 'tankSizeMinL', 'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'ghMin', 'ghMax', 'salinityMin', 'salinityMax']);
const ENUM = new Set(['swimmingSpace', 'jumpRisk', 'lidRequired', 'flowPreference', 'oxygenSensitivity', 'maturityRequirement', 'bioload', 'waterChangeSensitivity', 'communitySuitability', 'predatesInverts', 'temperament', 'diet']);
const BODY_SECTIONS = ['overview', 'adultSizeGrowth', 'behavior', 'tankRequirements', 'swimmingSpaceFootprint', 'waterParameters', 'feeding', 'compatibility', 'specialRequirements', 'commonProblems', 'breeding', 'practicalVerdict'];
const CAVEAT = ' Confidence note: medium-confidence guidance drawn from published species care information; treat as conservative guidance, not a precise requirement.';

// authoritative schema (regenerated SPEC 10M inventory)
const schemaInv = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_10M', 'SCHEMA_INVENTORY_AFTER.json'), 'utf8'));
const spType = schemaInv.schema.types.find((t) => t.typeName === 'species');
const spFields = {};
for (const f of spType.fields) spFields[f.name] = f;
function enumList(name) { const f = spFields[name]; return f && f.listValues ? f.listValues : []; }

function newBlockKey() { return 'k' + crypto.randomBytes(6).toString('hex'); }
function proseToBlocks(text) {
  const t = String(text).trim();
  return [{
    _type: 'block', _key: newBlockKey(), style: 'normal', markDefs: [],
    children: [{ _type: 'span', _key: newBlockKey(), text: t, marks: [] }],
  }];
}

const plan = readCsv(path.join(REV, 'REVISED_MUTATION_PLAN.csv'));
const queue = readCsv(path.join(RPT, 'WAVE_1_QUEUE.csv'));
const titleBySlug = new Map(queue.map((q) => [q.slug, q.title || q.slug]));
const specNameByRec = new Map();
for (const q of queue) specNameByRec.set(q.recordId || q.slug, q.title || q.slug);

const rows = [];
let seq = 0;
const problems = [];

function finalAction(r) {
  const d = r.revisedDisposition, c = r.confidence;
  if (d === 'ELIGIBLE_FOR_PM_REVIEW') return c === 'LOW' ? 'HOLD_EVIDENCE' : (c === 'HIGH' ? 'APPLY' : 'APPLY_WITH_CAVEAT');
  if (d === 'CONFLICT_CANDIDATE_APPROVE') return c === 'HIGH' ? 'APPLY' : 'APPLY_WITH_CAVEAT';
  if (d === 'HOLD_FOR_EVIDENCE') return 'HOLD_EVIDENCE';
  if (d === 'CONFLICT_DEFERRED') return 'HOLD_CONFLICT';
  if (d === 'CONFLICT_REJECTED') return 'REJECT_SEMANTIC_MAPPING';
  if (d === 'SKIP_NOOP') return 'SKIP_ALREADY_CORRECT';
  return 'HOLD_EVIDENCE';
}

for (const r of plan) {
  seq++;
  const field = r.destinationField;
  const isBody = field.startsWith('body:');
  const section = isBody ? field.slice(5) : null;
  let action = finalAction(r);
  let reason = '';
  let newValue = r.proposedValue;
  let path = field;
  let applyReason = '';

  if (isBody) {
    if (!BODY_SECTIONS.includes(section)) { action = 'REJECT_SEMANTIC_MAPPING'; reason = 'unknown body section'; }
    else { path = 'knowledgeBody.' + section; }
  } else if (field === 'behaviorFlags') {
    const flags = String(r.proposedValue).split(',').map((s) => s.trim()).filter(Boolean);
    const vocab = enumList('behaviorFlags');
    const bad = flags.filter((f) => !vocab.includes(f));
    if (bad.length) { action = 'REJECT_SEMANTIC_MAPPING'; reason = 'behaviorFlags out of vocabulary: ' + bad.join('|'); }
    else newValue = JSON.stringify(flags);
  } else if (field === 'groupSize') {
    try {
      const g = JSON.parse(r.proposedValue);
      const out = {};
      if (g.min != null) out.min = Number(g.min);
      if (g.max != null) out.max = Number(g.max);
      if (out.min == null && out.max == null) throw new Error('empty');
      if (out.min != null && out.max != null && out.max < out.min) { action = 'REJECT_SEMANTIC_MAPPING'; reason = 'groupSize max < min'; }
      newValue = JSON.stringify(out);
    } catch (e) { action = 'REJECT_SEMANTIC_MAPPING'; reason = 'groupSize parse: ' + e.message; }
  } else if (NUMERIC.has(field)) {
    const n = Number(String(r.proposedValue).trim());
    if (!isFinite(n)) { action = 'REJECT_SEMANTIC_MAPPING'; reason = 'non-numeric value for numeric field'; }
    else newValue = String(n);
  } else if (ENUM.has(field)) {
    const vocab = enumList(field);
    if (vocab.length && !vocab.includes(String(r.proposedValue).trim())) { action = 'REJECT_SEMANTIC_MAPPING'; reason = 'enum value not in schema list'; }
    else newValue = String(r.proposedValue).trim();
  } else {
    action = 'REJECT_SEMANTIC_MAPPING'; reason = 'destination not an allowlisted schema field';
  }

  if (action === 'APPLY' || action === 'APPLY_WITH_CAVEAT') {
    if (!r.evidenceReference || !r.evidenceReference.trim()) { action = 'HOLD_EVIDENCE'; reason = 'no evidence reference'; }
    else if (action === 'APPLY_WITH_CAVEAT' && isBody) applyReason = CAVEAT.trim();
  }

  const applied = action === 'APPLY' || action === 'APPLY_WITH_CAVEAT';
  const existing = r.existingValue;
  if (applied && existing !== '' && existing != null && String(existing) === String(newValue)) { action = 'SKIP_ALREADY_CORRECT'; }

  rows.push({
    candidateId: 'OP-' + String(seq).padStart(3, '0'),
    originalMutationId: r.originalMutationId,
    researchRowId: r.researchRowId,
    recordId: r.recordId,
    slug: r.slug,
    species: titleBySlug.get(r.slug) || r.species || '',
    destinationField: field,
    path,
    action,
    mutationType: applied ? (existing === '' || existing == null ? 'fill' : 'replace') : 'none',
    currentValue: existing,
    newValue,
    confidence: r.confidence,
    priority: r.priority,
    safetyCritical: r.safetyCritical,
    source: r.evidenceReference,
    dispositionReason: r.dispositionReason,
    reason: reason || (applied ? '' : 'not applied'),
    caveat: applyReason,
  });
}

// ---- cross-field range validation per record (only among applied numeric rows) ----
const byRec = {};
for (const r of rows) { if (r.action === 'APPLY' || r.action === 'APPLY_WITH_CAVEAT') { (byRec[r.recordId] = byRec[r.recordId] || []).push(r); } }
const PAIRS = [['tempMinC', 'tempMaxC'], ['phMin', 'phMax'], ['ghMin', 'ghMax'], ['salinityMin', 'salinityMax']];
for (const [recId, list] of Object.entries(byRec)) {
  const map = {}; for (const r of list) map[r.destinationField] = Number(r.newValue);
  for (const [lo, hi] of PAIRS) {
    if (map[lo] != null && map[hi] != null && map[lo] > map[hi]) {
      for (const r of list) if (r.destinationField === lo || r.destinationField === hi) { r.action = 'HOLD_CONFLICT'; r.reason = 'cross-range: ' + lo + ' > ' + hi; }
      problems.push(recId + ': ' + lo + '>' + hi);
    }
  }
}

fs.mkdirSync(OUT, { recursive: true });
const headers = ['candidateId', 'originalMutationId', 'researchRowId', 'recordId', 'slug', 'species', 'destinationField', 'path', 'action', 'mutationType', 'currentValue', 'newValue', 'confidence', 'priority', 'safetyCritical', 'source', 'caveat', 'dispositionReason', 'reason'];
fs.writeFileSync(path.join(OUT, 'FINAL_OPERATION_PLAN.csv'), toCsv(headers, rows));

// ---- wave-1 coverage / remainder register (all 218 species) ----
const BASE = JSON.parse(fs.readFileSync(path.join(RPT, 'BASELINE.json'), 'utf8'));
const gapMatrix = readCsv(path.join('report', 'SPEC_09', 'SPEC_09_RECORD_GAP_MATRIX.csv'));
const speciesRecs = gapMatrix.filter((g) => g.domain === 'species' || g.type === 'species' || /species/i.test(g.domain || ''));
const wave1 = new Set(queue.map((q) => q.slug));
const remainder = [];
for (const r of rows) {
  if (r.action === 'APPLY' || r.action === 'APPLY_WITH_CAVEAT') continue;
  remainder.push({
    recordId: r.recordId, slug: r.slug, species: r.species, priority: r.priority, safetyCritical: r.safetyCritical,
    requirement: r.destinationField, evidenceNeeded: r.confidence === 'HIGH' ? '' : 'stronger/refreshed source evidence',
    reason: r.reason || r.action, action: r.action,
  });
}
for (const q of queue) {
  const appliedRec = rows.some((r) => r.recordId === q.recordId && (r.action === 'APPLY' || r.action === 'APPLY_WITH_CAVEAT'));
  if (!appliedRec) remainder.push({ recordId: q.recordId, slug: q.slug, species: q.title || q.slug, priority: q.priority || 'P0', safetyCritical: '1', requirement: '(no applied operation in this run)', evidenceNeeded: 'evidence not sufficient in this run', reason: 'HELD_ALL', action: 'HOLD_EVIDENCE' });
}
const remHeaders = ['recordId', 'slug', 'species', 'priority', 'safetyCritical', 'requirement', 'evidenceNeeded', 'reason', 'action'];
fs.writeFileSync(path.join(OUT, 'SPEC_11_REMAINDER_REGISTER.csv'), toCsv(remHeaders, remainder));

const counts = {};
for (const r of rows) counts[r.action] = (counts[r.action] || 0) + 1;
console.log('PLAN rows=' + rows.length + ' actions=' + JSON.stringify(counts));
console.log('applied=' + (counts.APPLY || 0) + (counts.APPLY_WITH_CAVEAT || 0) + ' records touched=' + Object.keys(byRec).length);
console.log('remainder rows=' + remainder.length);
if (problems.length) console.log('cross-range problems: ' + problems.join(', '));
fs.writeFileSync(path.join(OUT, 'plan_summary.json'), JSON.stringify({ counts, applied: (counts.APPLY || 0) + (counts.APPLY_WITH_CAVEAT || 0), recordsTouched: Object.keys(byRec).length }, null, 2));
console.log('WROTE FINAL_OPERATION_PLAN.csv + SPEC_11_REMAINDER_REGISTER.csv');
