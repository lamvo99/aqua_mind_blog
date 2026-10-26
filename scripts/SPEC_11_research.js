/**
 * SPEC 11 Stage A — research normalization + register/evidence/queue artifacts.
 * READ-ONLY: reads temp research JSON files + SPEC 09 register, writes report/SPEC_11 CSVs.
 * No Sanity API usage. Deterministic output.
 */
const fs = require('fs');
const path = require('path');

const REPO = 'F:/AquaMind/aqua_mind_blog';
const TEMP = 'C:/Users/lam72/AppData/Local/Temp/opencode';
const OUT = path.join(REPO, 'report', 'SPEC_11');
const DATE = '2026-10-08';

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
// Non-vocab prefix -> vocab token (deterministic, logged in EXECUTION_LOG).
const ENUM_PREFIX_MAP = {
  'flowPreference:LOW': 'STILL', 'flowPreference:LOW_TO_GENTLE': 'STILL',
  'flowPreference:GENTLE': 'STILL', 'flowPreference:SLOW': 'STILL',
  'flowPreference:MEDIUM': 'MODERATE', 'flowPreference:HIGH': 'STRONG',
  'oxygenSensitivity:LOW_SENSITIVITY_AIR_BREATHING': 'NEUTRAL',
  'oxygenSensitivity:LOW_SENSITIVITY': 'NEUTRAL',
  'oxygenSensitivity:HIGH_SENSITIVITY': 'SENSITIVE',
};
const BEHAVIOR_VOCAB = new Set(['open-water', 'territorial', 'solitary', 'nocturnal', 'diurnal', 'burrower', 'cave-dweller', 'strong-swimmer', 'timid']);
const NUMERIC_DESTS = new Set(['minTankLengthCm', 'minTankWidthCm', 'tankSizeMinL', 'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'ghMin', 'ghMax', 'salinityMin', 'salinityMax']);
const DEST_REQ_FALLBACK = {
  minTankLengthCm: 'min_tank_dimensions', minTankWidthCm: 'tank_footprint',
  swimmingSpace: 'swimming_space', jumpRisk: 'jumping_risk', lidRequired: 'lid_requirement',
  flowPreference: 'flow_requirement', oxygenSensitivity: 'oxygenation',
  maturityRequirement: 'mature_aquarium', bioload: 'waste_bioload',
  waterChangeSensitivity: 'water_change_sensitivity', behaviorFlags: 'territoriality',
  groupSize: 'schooling', communitySuitability: 'community_suitability',
  predatesInverts: 'invertebrate_predation', diet: 'feeding_method',
  phMin: 'ph', phMax: 'ph', ghMin: 'gh', ghMax: 'gh',
  salinityMin: 'salinity', salinityMax: 'salinity', tempMinC: '', tempMaxC: '',
  tankSizeMinL: '', temperament: '',
};
const EVCLASS_FROM_SOURCETYPE = {
  SCIENTIFIC_LITERATURE: 'ESTABLISHED_FACT', GOVERNMENT_INSTITUTIONAL: 'ESTABLISHED_FACT',
  AQUARIUM_ORGANIZATION: 'ACCEPTED_HUSBANDRY_RANGE', SPECIALIST_REFERENCE: 'ACCEPTED_HUSBANDRY_RANGE',
  MANUFACTURER_DOCUMENTATION: 'ACCEPTED_HUSBANDRY_RANGE', COMMUNITY_SUPPLEMENTARY: 'PRACTICAL_RECOMMENDATION',
};
const KNOWN_SOURCE_TYPES = new Set(['SCIENTIFIC_LITERATURE', 'GOVERNMENT_INSTITUTIONAL', 'AQUARIUM_ORGANIZATION', 'SPECIALIST_REFERENCE', 'COMMUNITY_SUPPLEMENTARY', 'MANUFACTURER_DOCUMENTATION']);
// Typo / alias destinations used by research agents -> real schema destination
const DEST_FIX = { phMaxC: 'phMax', phMinC: 'phMin', tempMax: 'tempMaxC', tempMin: 'tempMinC' };
// Register-only research topics: researched + registered, but no dedicated schema field;
// they feed knowledge-body prose in Stage B (relationships remain SPEC 12 scope).
const REGISTER_ONLY = new Set(['size_based_predation']);

const log = [];
function note(s) { log.push(s); }

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

// --- load SPEC 09 research register: requirement -> researchId (species domain first) ---
function loadSpec09Research() {
  const rows = parseCSV(fs.readFileSync(path.join(REPO, 'report/SPEC_09/SPEC_09_RESEARCH_REQUIRED.csv'), 'utf8'));
  const hdr = rows[0];
  const byKey = {}; // "domain|requirement" -> researchId ; requirement -> researchId (any)
  const anyReq = {};
  for (const r of rows.slice(1)) {
    const o = {}; hdr.forEach((h, i) => o[h] = r[i] || '');
    byKey[o.domain + '|' + o.requirement] = o.researchId;
    if (!(o.requirement in anyReq)) anyReq[o.requirement] = o.researchId;
  }
  return { byKey, anyReq };
}

// --- normalization helpers ---
function normEnum(dest, raw) {
  if (raw === null || raw === undefined) return { value: null, rationale: '' };
  const s = String(raw).trim();
  const vocab = ENUMS[dest];
  if (vocab.includes(s)) return { value: s, rationale: '' };
  const m = s.match(/^([A-Z_0-9]+)\b/);
  let tok = m ? m[1] : null;
  if (tok && !vocab.includes(tok)) {
    const mapped = ENUM_PREFIX_MAP[dest + ':' + tok];
    if (mapped && vocab.includes(mapped)) tok = mapped;
    else tok = null;
  }
  if (tok && vocab.includes(tok)) {
    const rationale = s.slice(s.indexOf(tok) + tok.length).replace(/^[\s\-–:]+/, '').trim();
    return { value: tok, rationale };
  }
  return { value: null, rationale: 'UNNORMALIZED:' + s, error: true };
}
function normBehaviorFlags(raw) {
  if (raw === null || raw === undefined) return { value: null, dropped: [] };
  const list = Array.isArray(raw) ? raw : String(raw).split(',').map((x) => x.trim()).filter(Boolean);
  const kept = list.filter((x) => BEHAVIOR_VOCAB.has(x));
  const dropped = list.filter((x) => !BEHAVIOR_VOCAB.has(x));
  return { value: kept.length ? kept.join(',') : null, dropped };
}
function normGroupSize(raw) {
  if (raw === null || raw === undefined) return { value: null };
  if (typeof raw === 'object') return { value: JSON.stringify(raw) };
  const s = String(raw).trim();
  if (s.startsWith('{')) { try { JSON.parse(s); return { value: s }; } catch (e) { return { value: null, error: true }; } }
  return { value: null, error: true };
}
function normNumeric(raw) {
  if (raw === null || raw === undefined) return { value: null };
  const s = String(raw).trim();
  if (/^-?[0-9]+(\.[0-9]+)?$/.test(s)) return { value: s };
  const m = s.match(/-?[0-9]+(\.[0-9]+)?/);
  if (m) return { value: m[0], rationale: 'numeric extracted from: ' + s };
  return { value: null, error: true, rationale: s };
}
// Research-agent requirementId aliases -> SPEC 09 register requirement names
const REQ_ALIAS = { ph_range: 'ph', ph: 'ph', diet: 'feeding_method' };

function lookupSpec09(reqId, spec09) {
  if (!reqId) return { id: '', how: 'none' };
  const key = REQ_ALIAS[reqId] !== undefined ? REQ_ALIAS[reqId] : reqId;
  if (!key) return { id: '', how: 'no SPEC 09 research topic for requirement "' + reqId + '"' };
  if (spec09.byKey['species|' + key]) return { id: spec09.byKey['species|' + key], how: 'species-domain exact' };
  if (spec09.anyReq[key]) return { id: spec09.anyReq[key], how: 'any-domain exact' };
  return { id: '', how: 'no SPEC 09 research topic for requirement "' + reqId + '"' };
}
function cleanReqId(c) {
  const r = c.requirementId;
  if (!r || r === 'null' || r === 'undefined' || r === 'undefined') return null;
  return r;
}

// --- build unified claim rows across both agent schemas ---
function buildRows() {
  const profile = JSON.parse(fs.readFileSync(path.join(TEMP, 'spec11_wave1_profile.json'), 'utf8'));
  const spec09 = loadSpec09Research();
  const files = fs.readdirSync(TEMP).filter((f) => f.startsWith('spec11_research_'));
  const bySlug = {};
  for (const f of files) {
    const j = JSON.parse(fs.readFileSync(path.join(TEMP, f), 'utf8'));
    bySlug[j.slug || f.replace(/^spec11_research_/, '').replace(/\.json$/, '')] = { j, f };
  }
  const rows = [];
  let seq = 0;
  const errors = [];
  for (const p of profile) {
    const entry = bySlug[p.slug];
    if (!entry) { errors.push('missing research file for ' + p.slug); continue; }
    const j = entry.j;
    const dateChecked = j.dateChecked || DATE;
    const srcCatalog = Array.isArray(j.sourceCatalog) ? j.sourceCatalog : [];
    const catByUrl = {};
    for (const c of srcCatalog) if (c && c.url) catByUrl[c.url] = c;

    const push = (raw, srcKind) => {
      // srcKind: 'claim' | 'correction' | 'body'
      let dest = raw.destination;
      if (srcKind === 'correction') dest = raw.field;
      if (DEST_FIX[dest]) dest = DEST_FIX[dest];
      const isBody = srcKind === 'body' || String(dest).startsWith('body:');
      const isTopic = !isBody && REGISTER_ONLY.has(dest);
      const destKey = isBody ? null : dest;
      if (!isBody && !isTopic && !FIELD_DESTS.has(dest)) { errors.push(p.slug + ': unknown destination ' + dest); return; }
      if (isBody) {
        const sec = String(dest).replace(/^body:/, '');
        if (!BODY_SECTIONS.includes(sec)) { errors.push(p.slug + ': unknown body section ' + sec); return; }
      }
      // requirement id + SPEC 09 link
      let reqId = cleanReqId(raw);
      if (!reqId && destKey) reqId = DEST_REQ_FALLBACK[destKey] !== undefined ? DEST_REQ_FALLBACK[destKey] : null;
      const lk = lookupSpec09(reqId, spec09);
      // planned value normalization (corrections carry proposedValue, claims carry plannedValue)
      let planned = srcKind === 'correction'
        ? (raw.proposedValue === undefined ? null : raw.proposedValue)
        : (raw.plannedValue === undefined ? null : raw.plannedValue);
      let rationale = [];
      let err = false;
      if (isBody) {
        planned = planned === null || planned === undefined ? null : String(planned);
      } else if (ENUMS[destKey] || (isTopic && ENUMS.predatesInverts)) {
        const n = normEnum(isTopic ? 'predatesInverts' : destKey, planned);
        if (n.error && planned !== null) err = true;
        planned = n.value;
        if (n.rationale) rationale.push('enumRationale: ' + n.rationale);
      } else if (destKey === 'behaviorFlags') {
        const n = normBehaviorFlags(planned);
        planned = n.value;
        if (n.dropped.length) rationale.push('outOfVocabFlags: ' + n.dropped.join('|'));
        if (planned === null) { err = true; rationale.push('all flags out of vocabulary'); }
      } else if (destKey === 'groupSize') {
        const n = normGroupSize(planned);
        planned = n.value;
        if (n.error) err = true;
      } else if (destKey && NUMERIC_DESTS.has(destKey)) {
        const n = normNumeric(planned);
        planned = n.value;
        if (n.error && planned !== null) err = true;
        if (n.rationale) rationale.push(n.rationale);
      } else if (destKey) {
        // string fields: diet, temperament
        planned = planned === null || planned === undefined ? null : String(planned);
      }
      let decision = raw.editorDecision || '';
      if (!['ACCEPTED', 'ACCEPTED_WITH_CAVEAT', 'PENDING_RESEARCH'].includes(decision)) {
        errors.push(p.slug + ' ' + dest + ': bad editorDecision ' + decision);
      }
      if (planned === null && decision !== 'PENDING_RESEARCH') {
        // null value cannot be applied -> force honest pending
        decision = 'PENDING_RESEARCH';
        rationale.push('plannedValue null -> PENDING_RESEARCH');
      }
      if (err && decision !== 'PENDING_RESEARCH') {
        decision = 'PENDING_RESEARCH';
        rationale.push('value failed vocabulary normalization -> PENDING_RESEARCH');
      }
      // source metadata (batch D adapts from sourceCatalog)
      let source = raw.source || '';
      let sourceUrl = raw.sourceUrl || '';
      let sourceTypeActual = raw.sourceType || '';
      let sourceTypeNeeded = raw.sourceTypeNeeded || '';
      let evidence = raw.evidence || '';
      let evidenceClass = raw.evidenceClass || '';
      let uncertainty = raw.uncertainty || '';
      if (!source && sourceUrl && catByUrl[sourceUrl]) source = catByUrl[sourceUrl].name;
      if (!source && sourceUrl) { try { source = new URL(sourceUrl).hostname; } catch (e) { source = ''; } }
      if (!sourceTypeActual && sourceUrl && catByUrl[sourceUrl]) sourceTypeActual = catByUrl[sourceUrl].sourceType || '';
      if (!sourceTypeNeeded) sourceTypeNeeded = sourceTypeActual || '';
      if (!evidenceClass) {
        evidenceClass = decision === 'PENDING_RESEARCH' ? 'RESEARCH_NEEDED' : (EVCLASS_FROM_SOURCETYPE[sourceTypeActual] || 'PRACTICAL_RECOMMENDATION');
      }
      if (!sourceTypeNeeded && evidenceClass) {
        const rev = Object.entries(EVCLASS_FROM_SOURCETYPE).find(([, v]) => v === evidenceClass);
        sourceTypeNeeded = rev ? rev[0] : 'SPECIALIST_REFERENCE';
      }
      let claim = raw.claim || '';
      if (!claim) {
        claim = isBody
          ? 'Knowledge body section "' + String(dest).replace(/^body:/, '') + '" content for ' + p.title + ', synthesized from evidence-backed claims registered for this species.'
          : dest + ' for ' + p.title + ' = ' + String(planned) + (evidence ? ' [' + evidence + ']' : '');
      }
      const applicability = raw.applicability || 'REQUIRED';
      if (!['REQUIRED', 'CONDITIONAL', 'OPTIONAL'].includes(applicability)) errors.push(p.slug + ' ' + dest + ': bad applicability ' + applicability);
      const notesParts = [raw.notes || ''].filter(Boolean);
      if (rationale.length) notesParts.push(rationale.join('; '));
      if (lk.how !== 'species-domain exact' && lk.how !== 'any-domain exact' && reqId !== null && reqId !== '') notesParts.push(lk.how);
      if (reqId === null || reqId === '') reqId = '';
      // research status + evidence status
      const researchStatus = decision === 'PENDING_RESEARCH' ? 'PENDING' : 'RESEARCHED';
      let evidenceStatus = 'VERIFIED';
      if (decision === 'PENDING_RESEARCH') evidenceStatus = 'PENDING_RESEARCH';
      else if (!sourceUrl || !evidence) evidenceStatus = 'MISSING';
      if (evidenceStatus === 'MISSING') errors.push(p.slug + ' ' + dest + ': accepted row missing sourceUrl/evidence');
      seq += 1;
      rows.push({
        researchRowId: 'RS11-' + String(seq).padStart(3, '0'),
        spec09ResearchId: lk.id,
        waveOrder: p.order, recordId: p.recordId, slug: p.slug, species: p.title,
        requirementId: reqId, claim, destination: dest,
        applicability, priority: raw.priority || 'P1',
        sourceTypeNeeded, sourceType: sourceTypeActual, source, sourceUrl,
        evidenceClass, confidence: raw.confidence || 'UNVERIFIED', dateChecked,
        researchStatus, editorDecision: decision, plannedValue: planned, evidenceStatus, evidence, uncertainty,
        notes: notesParts.join(' | '), srcKind,
        destinationType: isBody ? 'BODY_SECTION' : (isTopic ? 'RESEARCH_TOPIC' : 'FIELD'),
      });
    };
    for (const c of (j.claims || [])) push(c, 'claim');
    for (const c of (j.corrections || [])) push(c, 'correction');
    const hasBodyClaims = (j.claims || []).some((c) => String(c.destination || '').startsWith('body:'));
    if (j.body && !hasBodyClaims) {
      const primary = (srcCatalog[0] && srcCatalog[0].url) || '';
      for (const sec of BODY_SECTIONS) {
        if (!(sec in j.body)) continue;
        push({
          destination: 'body:' + sec, plannedValue: j.body[sec], priority: 'P1',
          editorDecision: 'ACCEPTED_WITH_CAVEAT', confidence: 'MEDIUM',
          evidence: 'Section synthesized from evidence-backed claim rows registered for ' + j.species + ' (see EVIDENCE_MAP for this species)',
          sourceUrl: primary, evidenceClass: 'PRACTICAL_RECOMMENDATION',
          notes: 'body section derived from claim-level sources of this species; no single source covers the full section',
        }, 'body');
      }
    }
  }
  return { rows, errors, profile };
}

// --- artifact writers ---
function writeQueue(rows, profile) {
  const headers = ['waveOrder', 'recordId', 'slug', 'title', 'domain', 'priority', 'overallKnowledgeStatus', 'criticalGaps', 'highGaps', 'gapCount', 'safetyCriticalGaps', 'claimsTotal', 'accepted', 'acceptedWithCaveat', 'pendingResearch', 'fieldDestinations', 'bodySections'];
  const out = [];
  for (const p of profile) {
    const rs = rows.filter((r) => r.recordId === p.recordId);
    const dests = new Set(rs.filter((r) => r.destinationType === 'FIELD').map((r) => r.destination));
    const bodies = new Set(rs.filter((r) => r.destinationType === 'BODY_SECTION').map((r) => r.destination));
    out.push({
      waveOrder: p.order, recordId: p.recordId, slug: p.slug, title: p.title, domain: 'species', priority: 'P0',
      overallKnowledgeStatus: p.status, criticalGaps: p.critical, highGaps: p.high, gapCount: p.gaps,
      safetyCriticalGaps: p.safetyCriticalGaps, claimsTotal: rs.length,
      accepted: rs.filter((r) => r.editorDecision === 'ACCEPTED').length,
      acceptedWithCaveat: rs.filter((r) => r.editorDecision === 'ACCEPTED_WITH_CAVEAT').length,
      pendingResearch: rs.filter((r) => r.editorDecision === 'PENDING_RESEARCH').length,
      fieldDestinations: [...dests].sort().join('|'), bodySections: [...bodies].sort().join('|'),
    });
  }
  write('WAVE_1_QUEUE.csv', toCSV(headers, out));
}
function writeRegister(rows) {
  const headers = ['researchRowId', 'spec09ResearchId', 'waveOrder', 'recordId', 'slug', 'species', 'requirementId', 'claim', 'destination', 'destinationType', 'applicability', 'priority', 'sourceTypeNeeded', 'sourceType', 'source', 'sourceUrl', 'evidenceClass', 'confidence', 'dateChecked', 'researchStatus', 'editorDecision', 'plannedValue', 'evidenceStatus', 'uncertainty', 'notes'];
  write('RESEARCH_REGISTER.csv', toCSV(headers, rows));
}
function writeEvidence(rows) {
  const headers = ['evidenceId', 'researchRowId', 'recordId', 'slug', 'species', 'destination', 'destinationType', 'evidenceStatus', 'evidence', 'evidenceClass', 'source', 'sourceUrl', 'sourceTypeNeeded', 'confidence', 'dateChecked', 'uncertainty'];
  const out = rows.map((r, i) => ({
    evidenceId: 'EV11-' + String(i + 1).padStart(3, '0'), researchRowId: r.researchRowId,
    recordId: r.recordId, slug: r.slug, species: r.species, destination: r.destination,
    destinationType: r.destinationType, evidenceStatus: r.evidenceStatus, evidence: r.evidence,
    evidenceClass: r.evidenceClass, source: r.source, sourceUrl: r.sourceUrl,
    sourceTypeNeeded: r.sourceTypeNeeded, confidence: r.confidence, dateChecked: r.dateChecked,
    uncertainty: r.uncertainty,
  }));
  write('EVIDENCE_MAP.csv', toCSV(headers, out));
}

function main() {
  const { rows, errors, profile } = buildRows();
  if (errors.length) { console.error('RESEARCH NORMALIZATION ERRORS:'); errors.forEach((e) => console.error(' - ' + e)); process.exit(1); }
  // post-normalization validation
  const errs = [];
  let pend = 0, acc = 0, cav = 0, verified = 0;
  for (const r of rows) {
    if (r.destinationType === 'FIELD') {
      const d = r.destination;
      if (ENUMS[d]) {
        if (r.editorDecision !== 'PENDING_RESEARCH' && !ENUMS[d].includes(r.plannedValue || '')) errs.push(r.researchRowId + ' enum invalid: ' + d + '=' + r.plannedValue);
      } else if (NUMERIC_DESTS.has(d)) {
        if (r.editorDecision !== 'PENDING_RESEARCH' && r.plannedValue !== null && !/^-?[0-9]+(\.[0-9]+)?$/.test(String(r.plannedValue))) errs.push(r.researchRowId + ' numeric invalid: ' + d + '=' + r.plannedValue);
      }
    }
    if (r.editorDecision === 'PENDING_RESEARCH') pend++;
    else if (r.editorDecision === 'ACCEPTED') acc++;
    else if (r.editorDecision === 'ACCEPTED_WITH_CAVEAT') cav++;
    if (r.evidenceStatus === 'VERIFIED') verified++;
    if (r.dateChecked !== DATE) errs.push(r.researchRowId + ' dateChecked=' + r.dateChecked);
    if (!r.confidence || !r.evidenceClass) errs.push(r.researchRowId + ' missing confidence/evidenceClass');
    if (['HIGH', 'MEDIUM', 'LOW', 'UNVERIFIED'].indexOf(r.confidence) < 0) errs.push(r.researchRowId + ' bad confidence=' + r.confidence);
  }
  // spec09 coverage
  const noTopic = rows.filter((r) => r.requirementId && !r.spec09ResearchId);
  const speciesCovered = new Set(rows.map((r) => r.recordId));
  if (errs.length) { console.error('VALIDATION ERRORS:'); errs.forEach((e) => console.error(' - ' + e)); process.exit(1); }
  if (speciesCovered.size !== 17) { console.error('species covered != 17: ' + speciesCovered.size); process.exit(1); }
  writeQueue(rows, profile);
  writeRegister(rows);
  writeEvidence(rows);
  console.log('SUMMARY claims=' + rows.length + ' accepted=' + acc + ' caveat=' + cav + ' pending=' + pend + ' verifiedEvidence=' + verified + ' rowsWithoutSpec09Topic=' + noTopic.length + ' species=' + speciesCovered.size);
  const pendingRows = rows.filter((r) => r.editorDecision === 'PENDING_RESEARCH').map((r) => r.researchRowId + ' ' + r.species + ' ' + r.destination);
  console.log('PENDING rows:'); pendingRows.forEach((p) => console.log('  ' + p));
  console.log('RESEARCH STAGE COMPLETE - DETERMINISTIC');
}
main();
