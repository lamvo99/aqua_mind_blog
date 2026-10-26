// SPEC 09 — knowledge coverage audit engine. READ-ONLY: reads baseline snapshot, writes report CSVs.
const fs = require('fs');
const path = require('path');
const M = require('./SPEC_09_matrices');
const { CV, bodyText, matchBody } = M;

const OUT = path.join('report', 'SPEC_09');
const TEMP = 'C:\\Users\\lam72\\AppData\\Local\\Temp\\opencode';
const snap = JSON.parse(fs.readFileSync(path.join(OUT, 'SPEC_09_BASELINE_SNAPSHOT.json'), 'utf8'));
const TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const REQS = {
  species: M.speciesReqs, plant: M.plantReqs, invertebrate: M.invReqs,
  coral: M.coralReqs, equipment: M.equipReqs, problem: M.probReqs,
};
const SEV_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const titleOf = (t, r) => (t === 'problem' ? r.title : r.name);
const slugOf = (r) => (typeof r.slug === 'string' ? r.slug : r.slug?.current || '');

// §14 gap classification + §15 research flagging
function gapTypeFor(req, cov, fe) {
  if (cov === CV.COVERED || cov === CV.NA) return null;
  if (req.slot === 'rel' || req.slot === 'relbody') return 'RELATIONSHIP_GAP';
  if (req.slot === 'field' || req.slot === 'pair' || req.slot === 'fieldbody') return fe.length ? 'BODY_GAP' : 'CONTENT_GAP';
  if (cov === CV.UNC) return 'RESEARCH_GAP';
  return req.recurring ? 'SCHEMA_GAP' : 'BODY_GAP';
}
const researchFor = (cov, gt) => cov === CV.UNC || (cov !== CV.COVERED && cov !== CV.NA && !!gt && gt !== 'RELATIONSHIP_GAP');

// ---------- §6 behavioral flags (applicability only from structured signals or explicit text — never taxonomy) ----------
const txt = (type, r) => bodyText(type, r);
const flagsSpecies = {
  predator: { app: (r) => r.isPredator !== undefined || ['Carnivore', 'Micropredator'].includes(r.diet), cov: (r) => r.isPredator !== undefined ? CV.COVERED : CV.PARTIAL, sev: 'HIGH' },
  herbivore: { app: (r) => r.diet === 'Herbivore', cov: () => CV.COVERED, sev: 'MEDIUM' },
  coral_predator: { app: (r) => r.waterType === 'saltwater' && (/(coral|polyp).{0,40}(eat|pick|nip|graze)|eats coral/i.test(txt('species', r)) || (r.isPredator === true && r.reefCompatibility === false)), cov: (r) => /coral|polyp/i.test(txt('species', r)) && /(eat|pick|nip|graze)/i.test(txt('species', r)) ? CV.COVERED : CV.MISSING, sev: 'HIGH' },
  polyp_picker: { app: (r) => r.waterType === 'saltwater' && (/polyp/i.test(txt('species', r)) && /(pick|nip|eat)/i.test(txt('species', r))), cov: (r) => /(pick|nip).{0,20}polyp|polyp.{0,20}(pick|nip)/i.test(txt('species', r)) ? CV.COVERED : CV.MISSING, sev: 'HIGH' },
  invertebrate_predator: { app: (r) => (r.isPredator === true && r.waterType === 'saltwater') || /((shrimp|snail|crab|prawn)s?).{0,30}(eat|prey)/i.test(txt('species', r)), cov: (r) => /((shrimp|snail|crab|prawn)s?).{0,30}(eat|prey)/i.test(txt('species', r)) ? CV.COVERED : CV.MISSING, sev: 'HIGH' },
  schooling: { app: (r) => !!r.schooling || /school|shoal/i.test(txt('species', r)), cov: (r) => r.schooling ? (r.schooling.length >= 10 ? CV.COVERED : CV.PARTIAL) : CV.COVERED, sev: 'HIGH' },
  solitary: { app: (r) => /solitary|alone|single fish/i.test(txt('species', r)), cov: () => CV.COVERED, sev: 'MEDIUM' },
  territorial: { app: (r) => /territor/i.test(txt('species', r)) || r.temperament === 'Aggressive', cov: (r) => /territor/i.test(txt('species', r)) ? CV.COVERED : CV.PARTIAL, sev: 'HIGH' },
  aggressive: { app: (r) => ['Aggressive', 'Semi-aggressive'].includes(r.temperament) || /aggressive/i.test(txt('species', r)), cov: (r) => r.temperament ? CV.COVERED : CV.COVERED, sev: 'HIGH' },
  timid: { app: (r) => /timid|shy|skittish|nervous/i.test(txt('species', r)), cov: () => CV.COVERED, sev: 'MEDIUM' },
  jumper: { app: (r) => /\bjump/i.test(txt('species', r)), cov: () => CV.COVERED, sev: 'HIGH' },
  burrower: { app: (r) => /burrow|digs? (into|in)|sifts/i.test(txt('species', r)), cov: () => CV.COVERED, sev: 'MEDIUM' },
  cave_dweller: { app: (r) => /\bcave/i.test(txt('species', r)), cov: () => CV.COVERED, sev: 'MEDIUM' },
  open_water_swimmer: { app: (r) => /open water/i.test(txt('species', r)), cov: () => CV.COVERED, sev: 'MEDIUM' },
  strong_swimmer: { app: (r) => /(strong|powerful|fast|endless) swim/i.test(txt('species', r)), cov: () => CV.COVERED, sev: 'MEDIUM' },
  nocturnal: { app: (r) => /nocturnal|at night/i.test(txt('species', r)), cov: () => CV.COVERED, sev: 'MEDIUM' },
  requires_large_swimming_area: {
    app: (r) => (r.sizeCm || 0) >= 50 || (r.tankSizeMinL || 0) >= 400 || M.isArowana(r),
    cov: (r) => /(open water|swimming (space|area)|long tank|footprint|room to swim|too (small|short))/i.test(txt('species', r)) ? CV.COVERED : CV.MISSING,
    sev: (r) => ((r.sizeCm || 0) >= 60 ? 'CRITICAL' : 'HIGH'),
  },
  requires_mature_aquarium: {
    app: (r) => ['Advanced', 'Expert'].includes(r.difficulty) || /mature|established|cycled/i.test(txt('species', r)),
    cov: (r) => /mature|established|cycled/i.test(txt('species', r)) ? CV.COVERED : CV.MISSING, sev: 'HIGH',
  },
  requires_established_biofilm: { app: () => false, cov: () => CV.NA, sev: 'MEDIUM' },
};
const flagsInv = {
  predator: { app: (r) => r.diet === 'Carnivore', cov: () => CV.COVERED, sev: 'HIGH' },
  herbivore: { app: (r) => r.diet === 'Herbivore', cov: () => CV.COVERED, sev: 'MEDIUM' },
  nocturnal: { app: (r) => /nocturnal|at night/i.test(txt('invertebrate', r)), cov: () => CV.COVERED, sev: 'MEDIUM' },
  aggressive: { app: (r) => ['Aggressive', 'Semi-aggressive'].includes(r.temperament), cov: () => CV.COVERED, sev: 'HIGH' },
  territorial: { app: (r) => /territor/i.test(txt('invertebrate', r)), cov: () => CV.COVERED, sev: 'HIGH' },
  burrower: { app: (r) => /burrow|digs?/i.test(txt('invertebrate', r)), cov: () => CV.COVERED, sev: 'MEDIUM' },
  requires_mature_aquarium: { app: (r) => ['shrimp', 'snail'].includes(r.group) || /mature|established/i.test(txt('invertebrate', r)), cov: (r) => /mature|established|cycled/i.test(txt('invertebrate', r)) ? CV.COVERED : CV.MISSING, sev: 'HIGH' },
  requires_established_biofilm: {
    app: (r) => ['shrimp', 'snail'].includes(r.group) || ['Detritivore', 'Scavenger', 'Filter feeder'].includes(r.diet),
    cov: (r) => /biofilm|algae growth|microfilm/i.test(txt('invertebrate', r)) ? CV.COVERED : CV.MISSING, sev: 'HIGH',
  },
};
const FLAGS = { species: flagsSpecies, invertebrate: flagsInv, plant: {}, coral: {}, equipment: {}, problem: {} };
const NA_FLAG = 'NOT_APPLICABLE';

function evalFlags(type, r) {
  const out = {};
  for (const [name, def] of Object.entries(FLAGS[type])) {
    if (!def.app(r)) { out[name] = NA_FLAG; continue; }
    const cov = def.cov(r);
    out[name] = cov === CV.COVERED ? 'COVERED' : cov;
  }
  return out;
}

// ---------- record verdict (§10) ----------
function overallStatus(s) {
  if (s.critical > 0) return 'CRITICAL_GAPS';
  if (s.high >= 4 || s.missing / Math.max(1, s.applicable) >= 0.45) return 'THIN';
  if (s.medium >= 4 || s.missing >= 10 || (s.missing + s.partial) / Math.max(1, s.applicable) >= 0.35) return 'USABLE_WITH_GAPS';
  if (s.missing >= 1 || s.partial >= 5) return 'GOOD';
  return 'EXCELLENT';
}
const subdomainOf = (t, r) => {
  if (t === 'species') return `${r.waterType || '?'}/${r.group || 'unclassified'}`;
  if (t === 'invertebrate') return `${r.waterType || '?'}/${r.group || '?'}`;
  if (t === 'plant') return r.group || 'unclassified';
  if (t === 'coral') return r.coralType || 'unclassified';
  if (t === 'equipment') return r.category || 'unclassified';
  return `${r.category || '?'}/${r.waterType || 'both'}`;
};

function evalRecord(type, r) {
  const results = [];
  for (const req of REQS[type]) {
    if (req.applic && !req.applic(r)) {
      results.push({ requirement: req.id, label: req.label, coverage: CV.NA, severity: req.sev, gapType: null, researchRequired: false, fieldEvidence: [], bodyEvidence: [], relationshipEvidence: [], reason: req.naWhy || 'not applicable to this record' });
      continue;
    }
    const o = req.eval(type, r);
    const severity = req.sevBy ? (req.sevBy(r) || req.sev) : req.sev;
    const gapType = gapTypeFor(req, o.cov, o.fe);
    results.push({ requirement: req.id, label: req.label, coverage: o.cov, severity, gapType, researchRequired: researchFor(o.cov, gapType), fieldEvidence: o.fe, bodyEvidence: o.be, relationshipEvidence: o.re, reason: o.why });
  }
  const flags = evalFlags(type, r);
  const gaps = results.filter((x) => x.coverage !== CV.COVERED && x.coverage !== CV.NA);
  const count = (cov) => results.filter((x) => x.coverage === cov).length;
  const sevCount = (sev) => gaps.filter((g) => g.severity === sev).length;
  const recordGaps = gaps.filter((g) => g.gapType !== 'SCHEMA_GAP');
  const recSev = (sev) => recordGaps.filter((g) => g.severity === sev).length;
  // Record priority reflects the record's full knowledge state (all gap types) so it always
  // agrees with overallKnowledgeStatus; SCHEMA/RELATIONSHIP rows in the queue give the
  // one-fix-many alternative path for the same underlying gaps.
  const priority = sevCount('CRITICAL') ? 'P0' : sevCount('HIGH') ? 'P1' : sevCount('MEDIUM') ? 'P2' : sevCount('LOW') ? 'P3' : 'NONE';
  const s = { critical: sevCount('CRITICAL'), high: sevCount('HIGH'), medium: sevCount('MEDIUM'), low: sevCount('LOW'), missing: count(CV.MISSING), partial: count(CV.PARTIAL), applicable: results.filter((x) => x.coverage !== CV.NA).length };
  const sorted = gaps.slice().sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
  return {
    results, flags, gaps, s, priority,
    status: overallStatus(s),
    topGaps: sorted.slice(0, 5).map((g) => `${g.requirement}(${g.severity[0] + g.severity.slice(1).toLowerCase()})`),
    safetyGaps: sorted.filter((g) => g.severity === 'CRITICAL').map((g) => g.requirement),
    covered: count(CV.COVERED), partial: count(CV.PARTIAL), missing: count(CV.MISSING), na: count(CV.NA), unc: count(CV.UNC),
    research: results.filter((x) => x.researchRequired).length,
  };
}

// ---------- evaluate all ----------
const rows = [];
const perDomain = {};
for (const t of TYPES) {
  for (const r of snap.records[t]) {
    const e = evalRecord(t, r);
    rows.push({ type: t, rec: r, e });
  }
}
console.log(`evaluated ${rows.length} records`);

// ---------- aggregates ----------
const gapTypes = { CONTENT_GAP: 0, SCHEMA_GAP: 0, RELATIONSHIP_GAP: 0, BODY_GAP: 0, RESEARCH_GAP: 0 };
let researchGaps = 0, totalGaps = 0;
const schemaAgg = {}; const researchAgg = {};
for (const { type, rec, e } of rows) {
  for (const g of e.gaps) {
    totalGaps++;
    if (g.gapType) gapTypes[g.gapType]++;
    if (g.researchRequired) researchGaps++;
    if (g.gapType === 'SCHEMA_GAP') {
      const k = `${type}:${g.requirement}`;
      const a = schemaAgg[k] || (schemaAgg[k] = { type, requirement: g.requirement, label: g.label, count: 0, critical: 0, high: 0, medium: 0, low: 0, sevs: new Set() });
      a.count++; a.sevs.add(g.severity); a[g.severity.toLowerCase()]++;
    }
    if (g.researchRequired) {
      const k = `${type}:${g.requirement}`;
      const a = researchAgg[k] || (researchAgg[k] = { type, requirement: g.requirement, label: g.label, count: 0, sevs: new Set(), types: new Set(), ids: [] });
      a.count++; a.sevs.add(g.severity); a.types.add(g.gapType || 'RESEARCH_GAP');
      if (a.ids.length < 8) a.ids.push(rec._id);
    }
  }
}

// domain status table + requirement table (§11)
const domainStatus = []; const reqTable = [];
for (const t of TYPES) {
  const rs = rows.filter((x) => x.type === t);
  const dist = { EXCELLENT: 0, GOOD: 0, USABLE_WITH_GAPS: 0, THIN: 0, CRITICAL_GAPS: 0 };
  for (const x of rs) dist[x.e.status]++;
  domainStatus.push({ domain: t, records: rs.length, ...dist });
  for (const req of REQS[t]) {
    const cells = { covered: 0, partial: 0, missing: 0, na: 0, unc: 0, research: 0, critical: 0, high: 0, medium: 0, low: 0, affected: 0 };
    for (const x of rs) {
      const rr = x.e.results.find((y) => y.requirement === req.id);
      if (!rr) continue;
      if (rr.coverage === CV.COVERED) cells.covered++;
      else if (rr.coverage === CV.NA) cells.na++;
      else {
        cells[rr.coverage === CV.PARTIAL ? 'partial' : rr.coverage === CV.UNC ? 'unc' : 'missing']++;
        cells.affected++;
        cells[rr.severity.toLowerCase()]++;
        if (rr.researchRequired) cells.research++;
      }
    }
    reqTable.push({ domain: t, requirement: req.id, label: req.label, severity: req.sev, ...cells });
  }
}

// difficulty analysis (§21 Q1–Q3)
const diffAgg = {};
for (const { type, rec, e } of rows) {
  if (!['species', 'plant', 'coral', 'invertebrate'].includes(type)) continue;
  const d = rec.difficulty || 'Unspecified';
  const k = `${type}:${d}`;
  const a = diffAgg[k] || (diffAgg[k] = { type, difficulty: d, records: 0, withCritical: 0, withHigh: 0, statuses: {} });
  a.records++;
  if (e.s.critical > 0) a.withCritical++;
  if (e.s.high > 0) a.withHigh++;
  a.statuses[e.status] = (a.statuses[e.status] || 0) + 1;
}

// relationship register (§13) — measured, never modified
const recs = (t) => snap.records[t];
const withRefs = (t, k) => recs(t).filter((r) => Array.isArray(r[k]) && r[k].length).length;
const marineSpecies = recs('species').filter((r) => r.waterType !== 'freshwater').length;
const saltwaterSpecies = recs('species').filter((r) => r.waterType === 'saltwater').length;
const relRegister = [
  { id: 'REL-01', rel: 'Fish -> compatible fish', src: 'species', dst: 'species', slot: 'compatibleSpecies', stat: `${withRefs('species', 'compatibleSpecies')}/218`, affected: 218 - withRefs('species', 'compatibleSpecies'), sev: 'HIGH', note: 'Schema field exists but is empty on every species record — stocking knowledge absent' },
  { id: 'REL-02', rel: 'Fish -> incompatible fish', src: 'species', dst: 'species', slot: '(none)', stat: 'no schema field', affected: 218, sev: 'HIGH', note: 'No structured place for must-avoid combinations' },
  { id: 'REL-03', rel: 'Fish -> prey/predator links', src: 'species', dst: 'species/invertebrate', slot: '(none)', stat: 'no schema field', affected: 218, sev: 'HIGH', note: 'Predation knowledge only via coarse isPredator boolean + narrative' },
  { id: 'REL-04', rel: 'Fish -> coral interaction', src: 'species', dst: 'coral', slot: 'reefCompatibility', stat: `${recs('species').filter((r) => r.reefCompatibility !== undefined).length}/218 species carry reefCompatibility (boolean only)`, affected: marineSpecies, sev: 'HIGH', note: `${saltwaterSpecies} saltwater + ${marineSpecies - saltwaterSpecies} brackish species; boolean lacks species-level caveats (§7C)` },
  { id: 'REL-05', rel: 'Fish -> invertebrate predation', src: 'species', dst: 'invertebrate', slot: '(none)', stat: 'no schema field', affected: 218, sev: 'HIGH', note: 'compatibleInvertebrates (compat-only) does not express predation' },
  { id: 'REL-06', rel: 'Fish -> suitable plants', src: 'species', dst: 'plant', slot: 'compatiblePlants', stat: `${withRefs('species', 'compatiblePlants')}/218`, affected: 218 - withRefs('species', 'compatiblePlants'), sev: 'MEDIUM', note: 'Half the records lack plant pairing knowledge' },
  { id: 'REL-07', rel: 'Fish -> suitable invertebrates', src: 'species', dst: 'invertebrate', slot: 'compatibleInvertebrates', stat: `${withRefs('species', 'compatibleInvertebrates')}/218`, affected: 218 - withRefs('species', 'compatibleInvertebrates'), sev: 'MEDIUM', note: 'Compat refs missing on over half' },
  { id: 'REL-08', rel: 'Fish -> equipment', src: 'species', dst: 'equipment', slot: 'suitableEquipment', stat: `${withRefs('species', 'suitableEquipment')}/218`, affected: 218 - withRefs('species', 'suitableEquipment'), sev: 'MEDIUM', note: '87 species lack equipment pairing' },
  { id: 'REL-09', rel: 'Fish -> problems', src: 'species', dst: 'problem', slot: 'relatedProblems', stat: `${withRefs('species', 'relatedProblems')}/218`, affected: 218 - withRefs('species', 'relatedProblems'), sev: 'MEDIUM', note: '87 species lack troubleshooting links' },
  { id: 'REL-10', rel: 'Plant -> equipment/problems', src: 'plant', dst: 'equipment/problem', slot: 'suitableEquipment/relatedProblems', stat: `${withRefs('plant', 'suitableEquipment')}/62 eq, ${withRefs('plant', 'relatedProblems')}/62 prob`, affected: Math.max(62 - withRefs('plant', 'suitableEquipment'), 62 - withRefs('plant', 'relatedProblems')), sev: 'LOW', note: 'Coverage ~84% — minor gaps' },
  { id: 'REL-11', rel: 'Plant -> aquarium style', src: 'plant', dst: 'style', slot: 'aquariumStyle', stat: `${withRefs('plant', 'aquariumStyle')}/62`, affected: 62 - withRefs('plant', 'aquariumStyle'), sev: 'LOW', note: 'Fully populated' },
  { id: 'REL-12', rel: 'Invertebrate -> fish compat', src: 'invertebrate', dst: 'species', slot: 'compatibleSpecies', stat: `${withRefs('invertebrate', 'compatibleSpecies')}/56`, affected: 56, sev: 'HIGH', note: 'compatibleSpecies empty/absent on every invertebrate' },
  { id: 'REL-13', rel: 'Coral -> aggressive coral / spacing', src: 'coral', dst: 'coral', slot: '(none)', stat: 'no coral-coral refs; aggression field on self only', affected: 48, sev: 'HIGH', note: 'Sweeper/spacing knowledge cannot be expressed as relationships' },
  { id: 'REL-14', rel: 'Coral -> equipment/problems', src: 'coral', dst: 'equipment/problem', slot: 'suitableEquipment/relatedProblems', stat: `${withRefs('coral', 'suitableEquipment')}/48 eq, ${withRefs('coral', 'relatedProblems')}/48 prob`, affected: Math.max(48 - withRefs('coral', 'suitableEquipment'), 48 - withRefs('coral', 'relatedProblems')), sev: 'MEDIUM', note: '12 corals lack both links' },
  { id: 'REL-15', rel: 'Equipment -> suitable tank type/size', src: 'equipment', dst: 'tank', slot: 'aquariumStyle/tankSizeMinL+MaxL', stat: `${withRefs('equipment', 'aquariumStyle')}/46 style, ${recs('equipment').filter((r) => r.tankSizeMinL && r.tankSizeMaxL).length}/46 size range`, affected: recs('equipment').filter((r) => !(r.tankSizeMinL && r.tankSizeMaxL)).length, sev: 'MEDIUM', note: '20 equipment records have no tank size range' },
  { id: 'REL-16', rel: 'Problem -> affected species/equipment', src: 'problem', dst: 'species', slot: '(none back-ref)', stat: `reverse only: species.relatedProblems ${withRefs('species', 'relatedProblems')}/218`, affected: 43, sev: 'MEDIUM', note: 'No problem->species/equipment field; direction relies on source records' },
  { id: 'REL-17', rel: 'Problem -> tools', src: 'problem', dst: 'tool', slot: 'relatedTools', stat: `${withRefs('problem', 'relatedTools')}/43`, affected: 43 - withRefs('problem', 'relatedTools'), sev: 'LOW', note: '27 problems lack tool links' },
];
const prioFromSev = (s) => (s === 'CRITICAL' ? 'P0' : s === 'HIGH' ? 'P1' : s === 'MEDIUM' ? 'P2' : 'P3');
for (const r of relRegister) r.priority = prioFromSev(r.sev);

// ---------- CSV writers ----------
const esc = (v) => { const s = typeof v === 'string' ? v : v === undefined || v === null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const writeCsv = (name, header, data) => {
  const lines = [header.join(',')];
  for (const d of data) lines.push(header.map((h) => esc(Array.isArray(d[h]) ? d[h].join('|') : d[h])).join(','));
  fs.writeFileSync(path.join(OUT, name), lines.join('\r\n') + '\r\n');
  console.log(`wrote ${name}: ${data.length} rows`);
};

// 1) RECORD GAP MATRIX (473 rows, one per canonical record — §10 + §8 evidence JSON)
writeCsv('SPEC_09_RECORD_GAP_MATRIX.csv', [
  'recordId', 'type', 'title', 'slug', 'domain', 'domainSubdomain', 'overallKnowledgeStatus',
  'criticalGapCount', 'highGapCount', 'mediumGapCount', 'lowGapCount',
  'coveredCount', 'partialCount', 'missingCount', 'researchRequiredCount',
  'topKnowledgeGaps', 'safetyCriticalGaps', 'recommendedEnrichmentPriority', 'flagSummary', 'requirementEvidence',
], rows.map(({ type, rec, e }) => {
  const flagVals = Object.values(e.flags);
  const flagSummary = `covered=${flagVals.filter((v) => v === 'COVERED').length};partial=${flagVals.filter((v) => v !== 'COVERED' && v !== NA_FLAG && v !== CV.MISSING).length};missing=${flagVals.filter((v) => v === CV.MISSING).length};na=${flagVals.filter((v) => v === NA_FLAG).length}`;
  return {
    recordId: rec._id, type, title: titleOf(type, rec), slug: slugOf(rec), domain: type, domainSubdomain: subdomainOf(type, rec),
    overallKnowledgeStatus: e.status, criticalGapCount: e.s.critical, highGapCount: e.s.high, mediumGapCount: e.s.medium, lowGapCount: e.s.low,
    coveredCount: e.covered, partialCount: e.partial, missingCount: e.missing, researchRequiredCount: e.research,
    topKnowledgeGaps: e.topGaps.join('; '), safetyCriticalGaps: e.safetyGaps.join('; '), recommendedEnrichmentPriority: e.priority,
    flagSummary, requirementEvidence: JSON.stringify(e.results),
  };
}));

// 2) DOMAIN SUMMARY (§11 both tables)
writeCsv('SPEC_09_DOMAIN_SUMMARY.csv', [
  'rowType', 'domain', 'requirement', 'label', 'severity', 'records', 'EXCELLENT', 'GOOD', 'USABLE_WITH_GAPS', 'THIN', 'CRITICAL_GAPS',
  'covered', 'partial', 'missing', 'na', 'uncertain', 'researchRequired', 'gapsCritical', 'gapsHigh', 'gapsMedium', 'gapsLow', 'affectedRecords',
], [
  ...domainStatus.map((d) => ({ rowType: 'DOMAIN_STATUS', domain: d.domain, requirement: '', label: '', severity: '', records: d.records, EXCELLENT: d.EXCELLENT, GOOD: d.GOOD, USABLE_WITH_GAPS: d.USABLE_WITH_GAPS, THIN: d.THIN, CRITICAL_GAPS: d.CRITICAL_GAPS, covered: '', partial: '', missing: '', na: '', uncertain: '', researchRequired: '', gapsCritical: '', gapsHigh: '', gapsMedium: '', gapsLow: '', affectedRecords: '' })),
  ...reqTable.map((q) => ({ rowType: 'REQUIREMENT', domain: q.domain, requirement: q.requirement, label: q.label, severity: q.severity, records: '', EXCELLENT: '', GOOD: '', USABLE_WITH_GAPS: '', THIN: '', CRITICAL_GAPS: '', covered: q.covered, partial: q.partial, missing: q.missing, na: q.na, uncertain: q.unc, researchRequired: q.research, gapsCritical: q.critical, gapsHigh: q.high, gapsMedium: q.medium, gapsLow: q.low, affectedRecords: q.affected })),
]);

// 3) PRIORITY QUEUE (RECORD + SCHEMA + RELATIONSHIP items)
const prioRows = [];
for (const { type, rec, e } of rows) {
  prioRows.push({
    itemType: 'RECORD', domain: type, priority: e.priority, recordId: rec._id, title: titleOf(type, rec), slug: slugOf(rec),
    gapCount: e.gaps.length, critical: e.s.critical, high: e.s.high, medium: e.s.medium, low: e.s.low,
    topGaps: e.topGaps.join('; '), rationale: e.priority === 'NONE' ? 'no gaps' : 'record-level knowledge state (all gap types); SCHEMA/RELATIONSHIP items give the batch-fix path',
  });
}
const schemaItems = Object.values(schemaAgg).sort((a, b) => (SEV_ORDER[[...a.sevs][0]] - SEV_ORDER[[...b.sevs][0]]) || b.count - a.count);
for (const s of schemaItems) {
  const sevs = [...s.sevs].sort((a, b) => SEV_ORDER[a] - SEV_ORDER[b]);
  prioRows.push({
    itemType: 'SCHEMA', domain: s.type, priority: prioFromSev(sevs[0]), recordId: '', title: s.label, slug: s.requirement,
    gapCount: s.count, critical: s.critical, high: s.high, medium: s.medium, low: s.low,
    topGaps: `${s.requirement} (SCHEMA_GAP)`, rationale: 'recurring knowledge with no structured field — fix once for all affected records',
  });
}
for (const r of relRegister) {
  prioRows.push({
    itemType: 'RELATIONSHIP', domain: r.src, priority: r.priority, recordId: '', title: r.rel, slug: r.id,
    gapCount: r.affected, critical: 0, high: r.sev === 'HIGH' ? r.affected : 0, medium: r.sev === 'MEDIUM' ? r.affected : 0, low: r.sev === 'LOW' ? r.affected : 0,
    topGaps: `${r.rel} (${r.stat})`, rationale: r.note,
  });
}
writeCsv('SPEC_09_PRIORITY_QUEUE.csv', ['itemType', 'domain', 'priority', 'recordId', 'title', 'slug', 'gapCount', 'critical', 'high', 'medium', 'low', 'topGaps', 'rationale'], prioRows);

// 4) SCHEMA GAP REGISTER
writeCsv('SPEC_09_SCHEMA_GAP_REGISTER.csv', ['registerId', 'domain', 'requirement', 'label', 'defaultSeverity', 'affectedRecords', 'criticalCount', 'highCount', 'mediumCount', 'lowCount', 'maxSeverity', 'priority', 'recommendedFix'], schemaItems.map((s, i) => {
  const sevs = [...s.sevs].sort((a, b) => SEV_ORDER[a] - SEV_ORDER[b]);
  return {
    registerId: `SG-${String(i + 1).padStart(3, '0')}`, domain: s.type, requirement: s.requirement, label: s.label, defaultSeverity: sevs[0],
    affectedRecords: s.count, criticalCount: s.critical, highCount: s.high, mediumCount: s.medium, lowCount: s.low,
    maxSeverity: sevs[0], priority: prioFromSev(sevs[0]),
    recommendedFix: `SPEC 10+ — add structured field(s) or standard body section for "${s.label}" (no mutation in SPEC 09)`,
  };
}));

// 5) RELATIONSHIP GAP REGISTER
writeCsv('SPEC_09_RELATIONSHIP_GAP_REGISTER.csv', ['registerId', 'relationship', 'sourceType', 'targetType', 'slotField', 'coverageStat', 'affectedRecords', 'severity', 'priority', 'gapType', 'note'], relRegister.map((r) => ({
  registerId: r.id, relationship: r.rel, sourceType: r.src, targetType: r.dst, slotField: r.slot, coverageStat: r.stat,
  affectedRecords: r.affected, severity: r.sev, priority: r.priority, gapType: 'RELATIONSHIP_GAP', note: r.note,
})));

// 6) RESEARCH REQUIRED (§15 aggregated by domain+requirement; per-gap flags live in record matrix JSON)
const researchRows = Object.values(researchAgg).sort((a, b) => b.count - a.count).map((a, i) => ({
  researchId: `RS-${String(i + 1).padStart(3, '0')}`, domain: a.type, requirement: a.requirement, label: a.label,
  affectedRecords: a.count, maxSeverity: [...a.sevs].sort((x, y) => SEV_ORDER[x] - SEV_ORDER[y])[0],
  gapTypes: [...a.types].join('|'),
  researchTopic: `${a.type}: ${a.label}`,
  researchReason: 'Missing/partial knowledge cannot be safely filled from model knowledge during SPEC 09 (audit-only)',
  preferredSourceType: a.type === 'equipment' ? 'manufacturer documentation' : a.type === 'problem' ? 'reputable aquatic/veterinary sources' : 'scientific literature / established aquarium organizations / authoritative species databases',
  exampleRecordIds: a.ids.join('|'),
}));
writeCsv('SPEC_09_RESEARCH_REQUIRED.csv', ['researchId', 'domain', 'requirement', 'label', 'affectedRecords', 'maxSeverity', 'gapTypes', 'researchTopic', 'researchReason', 'preferredSourceType', 'exampleRecordIds'], researchRows);

// ---------- console + temp summary for report composition ----------
const statusTotals = { EXCELLENT: 0, GOOD: 0, USABLE_WITH_GAPS: 0, THIN: 0, CRITICAL_GAPS: 0 };
for (const r of rows) statusTotals[r.e.status]++;
const flagAgg = {};
for (const { type, e } of rows) for (const [k, v] of Object.entries(e.flags)) {
  if (v === NA_FLAG) continue;
  const a = flagAgg[k] || (flagAgg[k] = { applicable: 0, covered: 0, partial: 0, missing: 0 });
  a.applicable++;
  if (v === 'COVERED') a.covered++; else if (v === CV.MISSING) a.missing++; else a.partial++;
}
const summary = {
  evaluatedRecords: rows.length,
  statusTotals, domainStatus,
  gapTotals: { totalGaps, ...gapTypes, researchRequiredGaps: researchGaps },
  schemaRegisterItems: schemaItems.length, relationshipRegisterItems: relRegister.length, researchRegisterItems: researchRows.length,
  priorityItems: { RECORD: rows.length, SCHEMA: schemaItems.length, RELATIONSHIP: relRegister.length },
  recordPriorityDist: rows.reduce((a, x) => (a[x.e.priority] = (a[x.e.priority] || 0) + 1, a), {}),
  severityGapDist: rows.reduce((a, x) => { for (const g of x.e.gaps) a[g.severity] = (a[g.severity] || 0) + 1; return a; }, {}),
  flagAgg, diffAgg,
  requirementCounts: Object.fromEntries(TYPES.map((t) => [t, REQS[t].length])),
  topSchemaItems: schemaItems.slice(0, 25).map((s) => ({ type: s.type, requirement: s.requirement, label: s.label, affected: s.count, sevs: [...s.sevs] })),
  worstRecords: rows.slice().sort((a, b) => (b.e.s.critical - a.e.s.critical) || (b.e.s.high - a.e.s.high)).slice(0, 25).map((x) => ({ type: x.type, title: titleOf(x.type, x.rec), slug: slugOf(x.rec), status: x.e.status, crit: x.e.s.critical, high: x.e.s.high, missing: x.e.missing, top: x.e.topGaps })),
};
fs.writeFileSync(path.join(TEMP, 'spec09_summary.json'), JSON.stringify(summary, null, 1));
console.log('STATUS', JSON.stringify(statusTotals));
console.log('GAPS', JSON.stringify(summary.gapTotals));
console.log('PRIORITY', JSON.stringify(summary.recordPriorityDist), 'SEV', JSON.stringify(summary.severityGapDist));
console.log('SCHEMA_ITEMS', schemaItems.length, 'REL_ITEMS', relRegister.length, 'RESEARCH_ITEMS', researchRows.length);
console.log('summary ->', path.join(TEMP, 'spec09_summary.json'));
