const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// SPEC 13A - Phase C/D/E: coverage matrix, bounded evidence candidates, offline plan, validations.
// READ-ONLY. Builds artifacts only; never calls a mutation endpoint.

const OUT = path.join('reports', 'SPEC_13A');
const TEMP = 'C:/Users/lam72/AppData/Local/Temp/opencode';
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const PROJECT = 'zeohjejw', DATASET = 'production', API = 'v2026-05-25';
const BASE = `https://${PROJECT}.api.sanity.io/${API}/data/query/${DATASET}`;
const TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_TOTAL = 473;
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const EXPECTED_EDGES = 3173;
const DATE = '2026-10-20';

const REL_FIELDS = {
  species: { compatibleSpecies: { kind: 'objectArray', entryType: 'compatibleEntry', entryRef: 'ref', entryKeys: ['conditions', 'confidence', 'evidenceNote', 'ref'], target: ['species'] }, compatiblePlants: { kind: 'refArray', target: ['plant'] }, compatibleInvertebrates: { kind: 'refArray', target: ['invertebrate'] }, suitableEquipment: { kind: 'refArray', target: ['equipment'] }, relatedProblems: { kind: 'refArray', target: ['problem'] }, relatedPosts: { kind: 'refArray', target: ['post'] }, incompatibleSpecies: { kind: 'objectArray', entryType: 'incompatibleEntry', entryRef: 'ref', entryKeys: ['ref', 'reason'], target: ['species'] }, predatorPrey: { kind: 'objectArray', entryType: 'predatorPreyEntry', entryRef: 'ref', entryKeys: ['evidenceNote', 'ref', 'sizeCondition'], target: ['species', 'invertebrate'] }, reefInteractionDetail: { kind: 'objectArray', entryType: 'reefInteractionEntry', entryRef: 'coral', entryKeys: ['coral', 'frequency', 'monitoring', 'targets', 'tier'], target: ['coral'] }, parentSpecies: { kind: 'ref', target: ['species'] } },
  plant: { suitableEquipment: { kind: 'refArray', target: ['equipment'] }, relatedProblems: { kind: 'refArray', target: ['problem'] }, relatedPosts: { kind: 'refArray', target: ['post'] } },
  invertebrate: { compatibleSpecies: { kind: 'objectArray', entryType: 'compatibleEntry', entryRef: 'ref', entryKeys: ['conditions', 'confidence', 'evidenceNote', 'ref'], target: ['species'] }, suitableEquipment: { kind: 'refArray', target: ['equipment'] }, relatedProblems: { kind: 'refArray', target: ['problem'] }, relatedPosts: { kind: 'refArray', target: ['post'] }, predatorPrey: { kind: 'objectArray', entryType: 'predatorPreyEntry', entryRef: 'ref', entryKeys: ['evidenceNote', 'ref', 'sizeCondition'], target: ['species', 'invertebrate'] }, parentSpecies: { kind: 'ref', target: ['species'] } },
  coral: { suitableEquipment: { kind: 'refArray', target: ['equipment'] }, relatedProblems: { kind: 'refArray', target: ['problem'] }, relatedPosts: { kind: 'refArray', target: ['post'] }, coralNeighbors: { kind: 'objectArray', entryType: 'coralNeighborEntry', entryRef: 'ref', entryKeys: ['evidenceNote', 'ref', 'relation'], target: ['coral'] } },
  equipment: { compatibleEquipment: { kind: 'refArray', target: ['equipment'] }, relatedProblems: { kind: 'refArray', target: ['problem'] }, relatedPosts: { kind: 'refArray', target: ['post'] } },
  problem: { relatedTools: { kind: 'refArray', target: ['tool'] }, relatedPosts: { kind: 'refArray', target: ['post'] } },
};

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (t, it) => (t === 'problem' ? it.title : it.name);
const refId = (v) => (v == null ? null : typeof v === 'object' ? (v._ref || v.ref?._ref || v.ref || null) : String(v));
const csvCell = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const toCsv = (h, rows) => h.join(',') + '\n' + rows.map((r) => h.map((k) => csvCell(typeof r[k] === 'object' ? JSON.stringify(r[k]) : r[k])).join(',')).join('\n') + '\n';
function q(query) { const url = BASE + '?query=' + encodeURIComponent(query); return new Promise((res, rej) => { https.get(url, { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => { const c = []; r.on('data', (x) => c.push(Buffer.from(x))); r.on('end', () => { try { res(JSON.parse(Buffer.concat(c).toString()).result); } catch (e) { rej(e); } }); }).on('error', rej); }); }

const EV = {
  'EV-SF-OSCAR': { id: 'EV-SF-OSCAR', url: 'https://www.seriouslyfish.com/species/astronotus-ocellatus/', title: 'Seriously Fish - Astronotus ocellatus (Oscar)', publisher: 'Seriously Fish', cls: 'C3_SPECIALIST_REFERENCE', note: 'Behaviour and compatibility: "Although not especially aggressive for a cichlid of this size this species\' predatory nature dictates that it should not be combined with much smaller fishes." Diet: "feeding on a range of items including smaller fish, insects, crustaceans..."' },
  'EV-SF-ANGEL': { id: 'EV-SF-ANGELFISH', url: 'https://www.seriouslyfish.com/species/pterophyllum-scalare/', title: 'Seriously Fish - Pterophyllum "scalare" (Angelfish)', publisher: 'Seriously Fish', cls: 'C3_SPECIALIST_REFERENCE', note: 'Behaviour and compatibility: "Good community fish but may eat small fish such as tetras."' },
  'EV-SF-BALA': { id: 'EV-SF-BALASHARK', url: 'https://www.seriouslyfish.com/species/balantiocheilos-melanopterus/', title: 'Seriously Fish - Balantiocheilos melanopterus (Silver/Bala Shark)', publisher: 'Seriously Fish', cls: 'C3_SPECIALIST_REFERENCE', note: 'Behaviour and compatibility: "Though normally quite peaceful it will also eat very small fishes and can upset slow-moving or more timid tankmates with its constant activity and vigorous feeding behaviour."' },
  'EV-SF-PUFFER': { id: 'EV-SF-DWARFPUFFER', url: 'https://www.seriouslyfish.com/species/carinotetraodon-travancoricus/', title: 'Seriously Fish - Carinotetraodon travancoricus (Dwarf Puffer)', publisher: 'Seriously Fish', cls: 'C3_SPECIALIST_REFERENCE', note: 'Behaviour and compatibility: "Not usually recommended for the community tank, as it tends to nip the fins of slow-moving or long-finned fish." Diet: "It should be fed small snails (shell on) regularly..."' },
  'EV-SF-YOYO': { id: 'EV-SF-YOYOLOACH', url: 'https://www.seriouslyfish.com/species/botia-almorhae/', title: 'Seriously Fish - Botia almorhae (Yo-Yo Loach)', publisher: 'Seriously Fish', cls: 'C3_SPECIALIST_REFERENCE', note: 'Behaviour and compatibility: "Slow-moving, long-finned species such as ornamental bettas, guppies and many cichlids should also be avoided as trailing fins can be nipped." Diet: "most botiids also prey on aquatic snails..."' },
};

const OSCAR = '7kdig6Bk6SZq4GZkXcVXjK', ANGEL = '5oQB2MZ7gmZXjdwFqSs3qH', BALA = 'species-bala-shark', PUFFER = 'J1Tx0fWCuGNPno99A79QPg', YOYO = 'J1Tx0fWCuGNPno99A79RMf';
const T = {
  CHILI: 'ofTl1CTOUWuLwM28PxTCRz', GREENNEON: 'J1Tx0fWCuGNPno99A79RmJ', NEON: 'species-paracheirodon-innesi', CARDINAL: 'species-paracheirodon-axelrodi',
  CHERRY: '5oQB2MZ7gmZXjdwFqSs4kl', AMANO: 'invertebrate-caridina-multidentata', GHOST: 'invertebrate-palaemon-paludosus',
  PYGMYRASBORA: 'IlX7xILobrukz7d5Jng1HC', RAMSHORN: 'invertebrate-planorbarius-corneus', MTS: 'invertebrate-melanoides-tuberculata',
  HONEY: 'ofTl1CTOUWuLwM28PxTCMJ', BETTAIMB: 'I9bI8W8ZWcEwyIzM9DJbjY', GUPPY: 'species-poecilia-reticulata', PYGMYCORY: 'ofTl1CTOUWuLwM28PxTCJT', RUMMY: 'ofTl1CTOUWuLwM28PxTCdL',
};

// family, source, target, decision metadata
const PROPOSALS = [
  // predatorPrey (predator -> prey)
  ['predatorPrey', OSCAR, T.CHILI, 'EV-SF-OSCAR', 'HIGH', 'P0', 'sizeCondition: prey much smaller than adult oscar', 'Oscar is explicitly described as predatory toward much smaller fishes; chili rasbora is a 2 cm fish.'],
  ['predatorPrey', OSCAR, T.GREENNEON, 'EV-SF-OSCAR', 'HIGH', 'P0', 'sizeCondition: prey much smaller than adult oscar', 'Oscar predatory nature precludes much smaller fishes; green neon tetra is 2.5 cm.'],
  ['predatorPrey', OSCAR, T.NEON, 'EV-SF-OSCAR', 'HIGH', 'P0', 'sizeCondition: prey much smaller than adult oscar', 'Oscar predatory nature precludes much smaller fishes; neon tetra is 3.5 cm vs 35 cm adult.'],
  ['predatorPrey', OSCAR, T.CHERRY, 'EV-SF-OSCAR', 'HIGH', 'P0', 'sizeCondition: adult oscar; shrimp are prey-sized crustaceans', 'Oscar diet explicitly includes crustaceans and smaller fish.'],
  ['predatorPrey', OSCAR, T.AMANO, 'EV-SF-OSCAR', 'HIGH', 'P0', 'sizeCondition: adult oscar; shrimp are prey-sized crustaceans', 'Oscar diet explicitly includes crustaceans.'],
  ['predatorPrey', OSCAR, T.GHOST, 'EV-SF-OSCAR', 'HIGH', 'P0', 'sizeCondition: adult oscar; shrimp are prey-sized crustaceans', 'Oscar diet explicitly includes crustaceans.'],
  ['predatorPrey', ANGEL, T.NEON, 'EV-SF-ANGEL', 'HIGH', 'P0', 'sizeCondition: adult angelfish; neon tetra is small enough to swallow', 'Source explicitly states angelfish may eat small fish such as tetras.'],
  ['predatorPrey', ANGEL, T.GREENNEON, 'EV-SF-ANGEL', 'HIGH', 'P0', 'sizeCondition: adult angelfish; green neon tetra is small enough to swallow', 'Source explicitly states angelfish may eat small fish such as tetras.'],
  ['predatorPrey', ANGEL, T.CARDINAL, 'EV-SF-ANGEL', 'HIGH', 'P0', 'sizeCondition: adult angelfish; cardinal tetra is small enough to swallow', 'Source explicitly states angelfish may eat small fish such as tetras.'],
  ['predatorPrey', BALA, T.CHILI, 'EV-SF-BALA', 'MEDIUM', 'P0', 'sizeCondition: very small fishes', 'Source states it will eat very small fishes; chili rasbora is 2 cm.'],
  ['predatorPrey', BALA, T.PYGMYRASBORA, 'EV-SF-BALA', 'MEDIUM', 'P0', 'sizeCondition: very small fishes', 'Source states it will eat very small fishes; pygmy rasbora is 2 cm.'],
  ['predatorPrey', PUFFER, T.RAMSHORN, 'EV-SF-PUFFER', 'HIGH', 'P0', 'sizeCondition: small snails (shell on) are required diet', 'Source states small snails should be fed regularly; great ramshorn is a small snail.'],
  ['predatorPrey', PUFFER, T.MTS, 'EV-SF-PUFFER', 'HIGH', 'P0', 'sizeCondition: small snails (shell on) are required diet', 'Source states small snails should be fed regularly; Malaysian trumpet snail is a small snail.'],
  ['predatorPrey', YOYO, T.MTS, 'EV-SF-YOYO', 'MEDIUM', 'P0', 'sizeCondition: small aquatic snails', 'Source states botiid loaches prey on aquatic snails.'],
  ['predatorPrey', YOYO, T.RAMSHORN, 'EV-SF-YOYO', 'MEDIUM', 'P0', 'sizeCondition: small aquatic snails', 'Source states botiid loaches prey on aquatic snails.'],
  // incompatibleSpecies (non-prey reasons only; pairs disjoint from predatorPrey)
  ['incompatibleSpecies', BALA, T.HONEY, 'EV-SF-BALA', 'MEDIUM', 'P1', 'reason: temperament', 'Source warns it can upset slow-moving or more timid tankmates with constant activity.'],
  ['incompatibleSpecies', BALA, T.BETTAIMB, 'EV-SF-BALA', 'MEDIUM', 'P1', 'reason: temperament', 'Source warns it can upset slow-moving or more timid tankmates.'],
  ['incompatibleSpecies', YOYO, T.GUPPY, 'EV-SF-YOYO', 'HIGH', 'P1', 'reason: temperament', 'Source explicitly names guppies as susceptible to fin-nipping.'],
  ['incompatibleSpecies', YOYO, ANGEL, 'EV-SF-YOYO', 'MEDIUM', 'P1', 'reason: temperament', 'Source states many cichlids should be avoided due to trailing fins being nipped.'],
  ['incompatibleSpecies', PUFFER, ANGEL, 'EV-SF-PUFFER', 'MEDIUM', 'P1', 'reason: temperament', 'Source states it nips the fins of slow-moving or long-finned fish.'],
  ['incompatibleSpecies', OSCAR, T.PYGMYCORY, 'EV-SF-OSCAR', 'MEDIUM', 'P1', 'reason: size', 'Source states oscar should not be combined with much smaller fishes; pygmy corydoras is 2.5 cm.'],
];

const HELD = [
  { sourceType: 'species', sourceId: PUFFER, field: 'predatorPrey', targetId: T.CHERRY, decision: 'HOLD_EVIDENCE', riskTier: 'P1', reason: 'Source mentions reports of cohabitation with some freshwater shrimp with varying success; ambiguous, not a clear predation claim.' },
  { sourceType: 'species', sourceId: PUFFER, field: 'predatorPrey', targetId: T.GHOST, decision: 'HOLD_EVIDENCE', riskTier: 'P1', reason: 'No explicit shrimp-prey statement for dwarf puffer; ambiguous.' },
  { sourceType: 'species', sourceId: PUFFER, field: 'incompatibleSpecies', targetId: T.GUPPY, decision: 'HOLD_EVIDENCE', riskTier: 'P1', reason: 'Fin-nipping statement is generic (slow/long-finned); guppy not named. Held rather than inferred.' },
  { sourceType: 'species', sourceId: PUFFER, field: 'incompatibleSpecies', targetId: 'species-trichogaster-lalius', decision: 'HOLD_EVIDENCE', riskTier: 'P1', reason: 'Generic fin-nipping statement; dwarf gourami not named by source.' },
  { sourceType: 'species', sourceId: YOYO, field: 'incompatibleSpecies', targetId: 'I9bI8W8ZWcEwyIzM9DJbye', decision: 'REJECT_SEMANTIC_MAPPING', riskTier: 'P2', reason: 'Source names "ornamental bettas" (B. splendens); catalog record is Betta macrostoma, a different species.' },
  { sourceType: 'species', sourceId: YOYO, field: 'incompatibleSpecies', targetId: 'species-trichopodus-leerii', decision: 'HOLD_EVIDENCE', riskTier: 'P1', reason: 'Source names guppies/bettas/cichlids; pearl gourami is not covered by that statement.' },
  { sourceType: 'species', sourceId: OSCAR, field: 'incompatibleSpecies', targetId: ANGEL, decision: 'REJECT_SEMANTIC_MAPPING', riskTier: 'P2', reason: 'Angelfish (15 cm) is not "much smaller" than a 35 cm oscar; source caveat not met.' },
  { sourceType: 'species', sourceId: BALA, field: 'predatorPrey', targetId: T.CHERRY, decision: 'HOLD_EVIDENCE', riskTier: 'P1', reason: 'No explicit crustacean/shrimp predation statement for Bala shark.' },
  { sourceType: 'species', sourceId: BALA, field: 'predatorPrey', targetId: T.NEON, decision: 'HOLD_EVIDENCE', riskTier: 'P0', reason: 'Source says "very small fishes"; neon tetra (3.5 cm) is borderline, not clearly "very small". Held.' },
  { sourceType: 'species', sourceId: ANGEL, field: 'predatorPrey', targetId: T.RUMMY, decision: 'HOLD_EVIDENCE', riskTier: 'P1', reason: 'Rummynose tetra (5 cm) may be too large for adult angelfish; source does not specify.' },
];

(async () => {
  const baseline = JSON.parse(fs.readFileSync(path.join(OUT, 'BASELINE.json'), 'utf8'));
  // ---- fresh current state ----
  const live = {};
  for (const t of TYPES) live[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`);
  const liveById = {}; for (const t of TYPES) for (const r of live[t]) liveById[r._id] = t;
  const nameById = {}; for (const t of TYPES) for (const r of live[t]) nameById[r._id] = { type: t, name: titleOf(t, r), waterType: r.waterType ?? null };
  const existingEdges = new Set();
  const existingByType = {};
  for (const t of TYPES) existingByType[t] = new Set();
  let totalEdges = 0;
  for (const t of TYPES) for (const r of live[t]) for (const [field, spec] of Object.entries(REL_FIELDS[t] || {})) {
    const val = r[field]; if (val == null) continue;
    for (const item of (Array.isArray(val) ? val : [val])) { const tid = refId(item); if (!tid) continue; existingEdges.add(`${r._id}|${field}|${tid}`); existingByType[t].add(`${r._id}|${field}|${tid}`); totalEdges++; }
  }

  // ---- coverage matrix ----
  const coverageRows = [];
  for (const t of TYPES) for (const [field, spec] of Object.entries(REL_FIELDS[t] || {})) {
    const recs = live[t];
    const withData = recs.filter((r) => { const v = r[field]; return v != null && (!Array.isArray(v) || v.length > 0); }).length;
    const edgeCount = recs.reduce((a, r) => { const v = r[field]; if (v == null) return a; return a + (Array.isArray(v) ? v.map(refId).filter(Boolean).length : 1); }, 0);
    const isEntry = spec.kind === 'objectArray';
    coverageRows.push({
      sourceType: t, field, kind: spec.kind, targetTypes: spec.target.join('|'),
      records: recs.length, recordsWithData: withData, emptyRecords: recs.length - withData, edgeCount,
      applicability: field === 'reefInteractionDetail' ? 'saltwater/reef species only' : field === 'compatiblePlants' ? 'freshwater only' : 'all records of source type',
      safetyTier: field === 'predatorPrey' ? 'P0' : ['incompatibleSpecies', 'compatibleSpecies', 'reefInteractionDetail'].includes(field) ? 'P1' : 'P2/P3',
      direction: field === 'predatorPrey' ? 'directional (source=predator, ref=prey)' : ['compatibleSpecies', 'compatibleEquipment', 'coralNeighbors'].includes(field) ? 'symmetric intent; stored source->target' : 'directional source->target',
      schemaSupport: isEntry ? spec.entryType : 'reference',
      evidenceAvailability: ['predatorPrey', 'incompatibleSpecies'].includes(field) ? 'class-3 specialist references available (bounded batch)' : 'not researched in this batch',
      priority: ['predatorPrey', 'incompatibleSpecies'].includes(field) ? 'INCLUDE' : 'DEFER',
      reason: ['predatorPrey', 'incompatibleSpecies'].includes(field) ? 'High livestock-safety value with directly quotable specialist evidence.' : 'Deferred: lower immediate safety value or evidence requires tank-specific context.',
    });
  }

  // ---- priority decisions ----
  const priorityRows = ['predatorPrey', 'incompatibleSpecies'].map((f) => ({ family: f, decision: 'INCLUDE', rationale: REL_FIELDS.species[f].entryType + ' is empty and key livestock-safety evidence is available from class-3 specialist references.', targetEdges: f === 'predatorPrey' ? 15 : 6, riskTier: f === 'predatorPrey' ? 'P0' : 'P1' }))
    .concat(['reefInteractionDetail', 'coralNeighbors', 'compatibleEquipment', 'invertebrate.compatibleSpecies', 'invertebrate.suitableEquipment', 'equipment.relatedProblems', 'coral.relatedPosts'].map((f) => ({ family: f, decision: 'DEFER', rationale: 'Not selected for this bounded batch: evidence yield is lower, requires saltwater-equipment/reef-specific sourcing, or overlaps with work better suited to a later pass.', targetEdges: 0, riskTier: 'n/a' })));

  // ---- candidates / evidence / plan / validations ----
  const candidates = [], evidence = [], operations = [], held = [];
  const usedEvidence = new Set();
  let idx = 0;
  for (const [family, src, tgt, evKey, conf, risk, meta, rationale] of PROPOSALS) {
    idx++;
    const cid = 'REL13A-' + String(idx).padStart(4, '0');
    const ev = EV[evKey]; usedEvidence.add(evKey);
    const srcName = nameById[src], tgtName = nameById[tgt];
    const entry = family === 'predatorPrey'
      ? { _key: 'rel' + sha256('13a|' + cid).slice(0, 10), _type: 'predatorPreyEntry', ref: { _type: 'reference', _ref: tgt }, sizeCondition: meta.replace(/^sizeCondition:\s*/, ''), evidenceNote: `${ev.title} - ${ev.url}` }
      : { _key: 'rel' + sha256('13a|' + cid).slice(0, 10), _type: 'incompatibleEntry', ref: { _type: 'reference', _ref: tgt }, reason: meta.replace(/^reason:\s*/, '') };
    candidates.push({ candidateId: cid, family, sourceType: 'species', sourceId: src, sourceName: srcName?.name ?? '', field: family, targetId: tgt, targetName: tgtName?.name ?? '', targetType: liveById[tgt] ?? null, decision: 'PROPOSE_WITH_CAVEAT', confidence: conf, riskTier: risk, reasonClass: meta, evidenceId: ev.id, evidenceClass: ev.cls, caveat: family === 'predatorPrey' ? 'Predation risk depends on relative size and individual temperament; not an absolute rule for every tank.' : 'Risk depends on individual temperament, tank size and layout; monitor introductions.', rationale });
    evidence.push({ evidenceId: ev.id, family, candidateId: cid, sourceUrl: ev.url, sourceTitle: ev.title, publisher: ev.publisher, sourceClass: ev.cls, accessDate: DATE, excerpt: ev.note, claim: `${srcName?.name} - ${family === 'predatorPrey' ? 'preys on' : 'is incompatible with'} ${tgtName?.name} (${meta}).` });
    operations.push({ candidateId: cid, sourceType: 'species', documentId: src, path: family, action: 'add-if-absent', value: entry });
  }
  for (const h of HELD) {
    held.push({ registerId: 'HELD13A-' + String(held.length + 1).padStart(4, '0'), ...h, sourceName: nameById[h.sourceId]?.name ?? '', targetName: nameById[h.targetId]?.name ?? '', dateChecked: DATE });
  }

  // ---- validations ----
  const checks = [];
  const check = (id, name, ok, detail) => checks.push({ id, name, pass: !!ok, detail: String(detail ?? '') });
  const isEntryShape = (op) => { const spec = REL_FIELDS.species[op.path]; if (!spec) return false; const keys = Object.keys(op.value).filter((k) => k !== '_key' && k !== '_type').sort(); return op.value._type === spec.entryType && JSON.stringify(keys) === JSON.stringify(spec.entryKeys.slice().sort()); };
  check('V-01', 'every path is an allowed relationship field', operations.every((o) => REL_FIELDS[o.sourceType]?.[o.path]), `${operations.length} ops`);
  check('V-02', 'source and target IDs exist with allowed types', operations.every((o) => liveById[o.documentId] === o.sourceType && REL_FIELDS[o.sourceType][o.path].target.includes(liveById[o.value.ref._ref])), 'all resolve');
  check('V-03', 'no self-links', operations.every((o) => o.documentId !== o.value.ref._ref), 'none');
  check('V-04', 'no dangling references', operations.every((o) => !!liveById[o.value.ref._ref]), 'none');
  const planKeys = operations.map((o) => `${o.documentId}|${o.path}|${o.value.ref._ref}`);
  check('V-05', 'no duplicate edge within plan or against live data', new Set(planKeys).size === planKeys.length && planKeys.every((k) => !existingEdges.has(k)), `unique=${new Set(planKeys).size}`);
  const sim = new Set(existingEdges); let dup = 0, applied = 0;
  for (const k of planKeys) { if (sim.has(k)) { dup++; continue; } sim.add(k); applied++; }
  check('V-06', 'idempotent (zero duplicate edges on reapply)', dup === 0, `applied=${applied} duplicates=${dup}`);
  check('V-07', 'directionality respected (predator source -> prey ref; no auto reverse)', operations.every((o) => !planKeys.includes(`${o.value.ref._ref}|${o.path}|${o.documentId}`)), 'no reverse auto-add');
  check('V-08', 'entry-object shape matches schema exactly', operations.every(isEntryShape), 'entryType+keys per family');
  check('V-09', 'evidence row exists for every operation', operations.every((o) => evidence.some((e) => e.candidateId === o.candidateId)), `evidence=${evidence.length}`);
  check('V-10', 'no non-relationship field and no mutation client in plan', operations.every((o) => REL_FIELDS[o.sourceType][o.path]) && !JSON.stringify(operations).includes('data/mutate'), 'plan only');
  const spec12b = JSON.parse(fs.readFileSync('reports/SPEC_12A/SPEC_12B_DRY_RUN_PLAN.json', 'utf8'));
  const spec12bKeys = new Set(spec12b.operations.map((o) => `${o.documentId}|${o.path}|${o.value.ref._ref}`));
  check('V-11', 'no SPEC 12B candidate reintroduced', planKeys.every((k) => !spec12bKeys.has(k)), `spec12b=${spec12bKeys.size}`);
  check('V-12', 'no held/conflict/rejected/NA row leaked into plan', candidates.every((c) => c.decision === 'PROPOSE_WITH_CAVEAT') && held.every((h) => !planKeys.includes(`${h.sourceId}|${h.field}|${h.targetId}`)), `held=${held.length}`);
  const failed = checks.filter((c) => !c.pass);

  // ---- write artifacts ----
  fs.writeFileSync(path.join(OUT, 'COVERAGE_MATRIX.csv'), toCsv(['sourceType', 'field', 'kind', 'targetTypes', 'records', 'recordsWithData', 'emptyRecords', 'edgeCount', 'applicability', 'safetyTier', 'direction', 'schemaSupport', 'evidenceAvailability', 'priority', 'reason'], coverageRows.sort((a, b) => (a.sourceType + a.field).localeCompare(b.sourceType + b.field))));
  fs.writeFileSync(path.join(OUT, 'PRIORITY_DECISIONS.csv'), toCsv(['family', 'decision', 'rationale', 'targetEdges', 'riskTier'], priorityRows));
  fs.writeFileSync(path.join(OUT, 'CANDIDATES.csv'), toCsv(['candidateId', 'family', 'sourceType', 'sourceId', 'sourceName', 'field', 'targetId', 'targetName', 'targetType', 'decision', 'confidence', 'riskTier', 'reasonClass', 'evidenceId', 'evidenceClass', 'caveat', 'rationale'], candidates));
  fs.writeFileSync(path.join(OUT, 'EVIDENCE.csv'), toCsv(['evidenceId', 'family', 'candidateId', 'sourceUrl', 'sourceTitle', 'publisher', 'sourceClass', 'accessDate', 'excerpt', 'claim'], evidence));
  fs.writeFileSync(path.join(OUT, 'CONFLICTS.csv'), toCsv(['candidateId', 'sourceId', 'field', 'targetId', 'conflictType', 'detail', 'resolution'], []));
  fs.writeFileSync(path.join(OUT, 'HELD_REGISTER.csv'), toCsv(['registerId', 'sourceType', 'sourceId', 'sourceName', 'field', 'targetId', 'targetName', 'decision', 'riskTier', 'reason', 'dateChecked'], held));
  const plan = { specId: 'SPEC_13A', artifact: 'SPEC_13B_DRY_RUN_PLAN', generatedAt: new Date().toISOString(), mode: 'OFFLINE PLAN ONLY - not executed', target: { project: PROJECT, dataset: DATASET }, allowedFamilies: ['predatorPrey', 'incompatibleSpecies'], operationCount: operations.length, simulated: { relationshipEdgesBefore: totalEdges, relationshipEdgesAfter: totalEdges + applied, note: 'SIMULATED - not a live change' }, idempotency: { duplicateEdgesOnReapply: dup, safeToReapply: dup === 0 }, operations };
  fs.writeFileSync(path.join(OUT, 'SPEC_13B_DRY_RUN_PLAN.json'), JSON.stringify(plan, null, 2));
  fs.writeFileSync(path.join(OUT, 'VALIDATION_RESULTS.json'), JSON.stringify({ specId: 'SPEC_13A', ok: failed.length === 0, checks, simulated: { applied, duplicates: dup, before: totalEdges, after: totalEdges + applied } }, null, 2));

  // ---- integrity (post-run read-only) ----
  const post = {};
  for (const t of TYPES) post[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`);
  const counts = {}; for (const t of TYPES) counts[t] = post[t].length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const drafts = (await q('*[_id in path("drafts.**")]._id')).length;
  const canon = {}; for (const t of TYPES) for (const r of post[t]) canon[r._id] = { type: t, rec: r };
  const hash = sha256(Object.keys(canon).sort().map((id) => { const c = canon[id]; return sha256(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) })); }).join('\n'));
  let postEdges = 0; for (const t of TYPES) for (const r of post[t]) for (const field of Object.keys(REL_FIELDS[t] || {})) { const v = r[field]; if (v == null) continue; postEdges += Array.isArray(v) ? v.map(refId).filter(Boolean).length : 1; }
  const integrity = { specId: 'SPEC_13A', artifact: 'INTEGRITY', generatedAt: new Date().toISOString(), mode: 'READ-ONLY (GET query only; no writes, no deploy)', content_mutations: 0, schema_changes: 0, deploys: 0, counts, total, draftCount: drafts, identityHash: hash, identityMatch: hash === EXPECTED_HASH, relationshipsBefore: totalEdges, relationshipsAfter: postEdges, relationshipsUnchanged: postEdges === totalEdges, expectedEdges: EXPECTED_EDGES, verdict: hash === EXPECTED_HASH && postEdges === totalEdges && total === EXPECTED_TOTAL ? 'CLEAN' : 'REVIEW' };
  fs.writeFileSync(path.join(OUT, 'INTEGRITY.json'), JSON.stringify(integrity, null, 2));

  console.log(JSON.stringify({ coverageFields: coverageRows.length, candidates: candidates.length, operations: operations.length, evidence: evidence.length, held: held.length, validationsOk: failed.length === 0, applied, duplicates: dup, edgesBefore: totalEdges, edgesAfterSim: totalEdges + applied, integrity: integrity.verdict }, null, 2));
  process.exit(failed.length ? 2 : 0);

})().catch((e) => { console.error('FATAL', e); process.exit(2); });
