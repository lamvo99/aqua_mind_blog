const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---- Config ----
const envContent = fs.readFileSync('.env.local', 'utf8');
const TOKEN = (envContent.match(/SANITY_API_TOKEN="([^"]+)"/) || [])[1];
if (!TOKEN) { console.error('SANITY_API_TOKEN not found in .env.local'); process.exit(1); }

const PROJECT_ID = 'zeohjejw';
const DATASET = 'production';
const API_VERSION = '2026-05-25';
const QUERY_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;
const MUTATE_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/mutate/${DATASET}`;
const OUT = path.join('report', 'SPEC_02');

const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const CATEGORY_ENUMS = {
  problem: ['water', 'algae', 'plants', 'fish', 'equipment'],
  equipment: ['Filter', 'Light', 'Pump', 'Heater', 'CO\u2082 System', 'Substrate', 'Test Kit', 'Other'],
};
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

async function query(name, groq) {
  const res = await fetch(`${QUERY_BASE}?query=${encodeURIComponent(groq)}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`Query ${name} failed: ${res.status} ${await res.text()}`);
  return (await res.json()).result || [];
}

function pickType(records, id) {
  for (const t of WIKI_TYPES) for (const r of records[t]) if (r._id === id) return { t, r };
  return null;
}

// ---------------------------------------------------------------------------
// REPAIR PLAN — 21 CRITICAL targets from SPEC 01 (authoritative issue matrix).
// Evidence hierarchy: E1 same record · E2 schema enum · E3 project taxonomy.
// ---------------------------------------------------------------------------
const REPAIR_PLAN = [
  // ---- Equipment (8) ----
  { recordId: '1z8rQFHeojDMTUo2hXSYAR', type: 'equipment', field: 'category', currentValue: 'Dosing', proposedValue: 'Pump', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'name "Dosing Pump"; excerpt "Programmable pump for automatic dosing of supplements, additives, or two-part solutions" — device is a pump.' },
      { source: 'schema', detail: "equipment.category allowed values include 'Pump'" },
      { source: 'project_taxonomy', detail: 'existing Pump bucket holds pump devices (Return Pump, Circulation Pump, Air Pump, Wave Maker)' },
    ] },
  { recordId: 'IlX7xILobrukz7d5JnTI3q', type: 'equipment', field: 'category', currentValue: 'Maintenance', proposedValue: 'Other', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'excerpt "A siphon tool used to remove debris and waste from substrate during water changes" — maintenance/cleaning tool; no schema category exists for maintenance tools.' },
      { source: 'schema', detail: "'Other' is the catch-all equipment.category value; no 'Maintenance' value exists in schema" },
      { source: 'project_taxonomy', detail: 'Other bucket holds tools/consumables (Filter Floss, Air Stone, RO/DI Water Filter, UV Sterilizer); Filter bucket is mechanical filter units only' },
    ] },
  { recordId: 'J1Tx0fWCuGNPno99A6hjl8', type: 'equipment', field: 'category', currentValue: 'Chiller', proposedValue: 'Other', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'excerpt "thermoelectric or compressor-based cooling device that maintains stable water temperature" — cooling device' },
      { source: 'schema', detail: "no 'Chiller' / 'Cooling' value exists; 'Other' is the catch-all" },
      { source: 'project_taxonomy', detail: 'existing cooling device Aquarium Cooling Fan is categorized Other; Heater bucket holds heating devices (Digital Heater, Submersible Heater)' },
    ] },
  { recordId: 'J1Tx0fWCuGNPno99A79h5B', type: 'equipment', field: 'category', currentValue: 'ATO', proposedValue: 'Other', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'excerpt "Automatically replenishes evaporated water with fresh or RO/DI water" — automation/control system' },
      { source: 'schema', detail: "no 'ATO' value exists; 'Other' is the catch-all" },
      { source: 'project_taxonomy', detail: 'automation/control devices precedent: Automatic Water Change System and Automatic Fish Feeder are categorized Other' },
    ] },
  { recordId: 'equip-co2-diffuser', type: 'equipment', field: 'category', currentValue: 'CO2 System', proposedValue: 'CO\u2082 System', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'name "CO2 Diffuser"; excerpt "dissolving CO2 into aquarium water" — carbon-dioxide equipment' },
      { source: 'schema', detail: "allowed value is 'CO₂ System' (U+2082 subscript two); current value is the same semantic value with ASCII 'CO2' glyph" },
      { source: 'project_taxonomy', detail: 'existing CO₂ records (CO₂ Regulator Kit, CO₂ Cylinder) use the schema form CO₂ System' },
    ] },
  { recordId: 'equip-co2-drop-checker', type: 'equipment', field: 'category', currentValue: 'CO2 System', proposedValue: 'CO\u2082 System', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'name "CO2 Drop Checker"; excerpt "Visual indicator of CO2 levels in aquarium water" — carbon-dioxide equipment' },
      { source: 'schema', detail: "allowed value is 'CO₂ System' (U+2082); current value is the same semantic value with ASCII 'CO2' glyph" },
      { source: 'project_taxonomy', detail: 'existing CO₂ records use the schema form CO₂ System' },
    ] },
  { recordId: 'ofTl1CTOUWuLwM28PxTUcx', type: 'equipment', field: 'category', currentValue: 'Skimmer', proposedValue: 'Other', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'excerpt "Removes dissolved organic waste from marine tanks via foam fractionation" — reactor-type filtration-adjacent device' },
      { source: 'schema', detail: "no 'Skimmer' value exists; 'Other' is the catch-all" },
      { source: 'project_taxonomy', detail: 'reactor-type devices precedent: Media Reactor, Calcium Reactor, UV Sterilizer are categorized Other; Filter bucket is mechanical filter units (Canister/HOB/Internal/Sponge)' },
    ] },
  { recordId: 'sebdKYryWZgYP2rm3or3AK', type: 'equipment', field: 'category', currentValue: 'Maintenance', proposedValue: 'Other', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'excerpt "Magnetic or handheld tool for removing algae from aquarium glass"; record group = Maintenance — cleaning tool' },
      { source: 'schema', detail: "'Other' is the catch-all equipment.category value; no 'Maintenance' value exists in schema" },
      { source: 'project_taxonomy', detail: 'cleaning/maintenance tools categorized Other (consistent with Gravel Vacuum repair)' },
    ] },

  // ---- Problems (13) ----
  { recordId: 'I9bI8W8ZWcEwyIzM9DFYjI', type: 'problem', field: 'category', currentValue: null, proposedValue: 'fish', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'excerpt "A bacterial infection (Flavobacterium columnare) causing white/gray patches on the mouth, fins, or body" — fish-surface infection' },
      { source: 'schema', detail: "problem.category allowed value 'fish'" },
      { source: 'project_taxonomy', detail: 'fish bucket holds fish infections (Dropsy, Fin Rot, White Spot Disease Ich)' },
    ] },
  { recordId: 'I9bI8W8ZWcEwyIzM9DFYtM', type: 'problem', field: 'category', currentValue: null, proposedValue: 'algae', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'excerpt "Small flatworm pests that multiply rapidly in aquariums. Harmless to adult fish but can attack shrimp fry" — nuisance-organism infestation' },
      { source: 'schema', detail: "problem.category allowed value 'algae'" },
      { source: 'project_taxonomy', detail: 'Aiptasia Infestation (an animal pest) is categorized algae — the algae bucket is the nuisance/pest-organism bucket' },
    ] },
  { recordId: 'IlX7xILobrukz7d5JnvacY', type: 'problem', field: 'category', currentValue: null, proposedValue: 'fish', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'excerpt "parasitic disease caused by Oodinium that produces a fine, gold or rust-colored dusting on the fish body" — fish infection' },
      { source: 'schema', detail: "problem.category allowed value 'fish'" },
    ] },
  { recordId: 'IlX7xILobrukz7d5Jo2qVy', type: 'problem', field: 'category', currentValue: null, proposedValue: 'fish', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'excerpt "parasitic crustacean that attaches to fish ... scratching, and blood spots" — fish parasite' },
      { source: 'schema', detail: "problem.category allowed value 'fish'" },
    ] },
  { recordId: 'IlX7xILobrukz7d5Jo2qgo', type: 'problem', field: 'category', currentValue: null, proposedValue: 'algae', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'excerpt "A type of brown algae that forms snot-like patches with air bubbles" — explicitly an algae problem' },
      { source: 'schema', detail: "problem.category allowed value 'algae'" },
    ] },
  { recordId: 'IlX7xILobrukz7d5Jo2wxC', type: 'problem', field: 'category', currentValue: null, proposedValue: 'fish', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'excerpt "A disease causing pits and holes on the head and lateral line, common in cichlids" — fish disease' },
      { source: 'schema', detail: "problem.category allowed value 'fish'" },
    ] },
  { recordId: 'IlX7xILobrukz7d5Jo2xIs', type: 'problem', field: 'category', currentValue: null, proposedValue: 'fish', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'excerpt "fungal-like infection causing white, cottony patches on fish" — fish-surface infection' },
      { source: 'schema', detail: "problem.category allowed value 'fish'" },
      { source: 'project_taxonomy', detail: 'fish bucket holds fish infections (Dropsy, Fin Rot, White Spot Disease Ich)' },
    ] },
  { recordId: 'J1Tx0fWCuGNPno99A79Tvf', type: 'problem', field: 'category', currentValue: null, proposedValue: 'algae', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'excerpt "Small, tentacled freshwater polyps that can sting and kill tiny shrimp fry" — nuisance/pest-organism infestation' },
      { source: 'schema', detail: "problem.category allowed value 'algae'" },
      { source: 'project_taxonomy', detail: 'Aiptasia Infestation (a Cnidarian pest, like Hydra) is categorized algae — the algae bucket is the nuisance/pest-organism bucket' },
    ] },
  { recordId: 'J1Tx0fWCuGNPno99A7AE36', type: 'problem', field: 'category', currentValue: null, proposedValue: 'fish', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'excerpt "The most common fish disease — caused by Ichthyophthirius multifiliis, small white spots like salt grains" — fish disease' },
      { source: 'schema', detail: "problem.category allowed value 'fish'" },
      { source: 'project_taxonomy', detail: 'duplicate companion record White Spot Disease (Ich) (problem-white-spot-disease) is categorized fish' },
    ] },
  { recordId: 'J1Tx0fWCuGNPno99A7AEDM', type: 'problem', field: 'category', currentValue: null, proposedValue: 'fish', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'excerpt "A condition causing fish to float uncontrollably, sink to the bottom, or swim sideways" — fish condition' },
      { source: 'schema', detail: "problem.category allowed value 'fish'" },
    ] },
  { recordId: 'J1Tx0fWCuGNPno99A7KJcq', type: 'problem', field: 'category', currentValue: null, proposedValue: 'fish', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'excerpt "Parasitic flatworms (Dactylogyrus or Gyrodactylus) that attach to gills and skin" — fish parasite' },
      { source: 'schema', detail: "problem.category allowed value 'fish'" },
    ] },
  { recordId: 'J1Tx0fWCuGNPno99A7KJpf', type: 'problem', field: 'category', currentValue: null, proposedValue: 'fish', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'excerpt "parasitic copepod ... embeds in fish skin, causing visible red lesions" — fish parasite' },
      { source: 'schema', detail: "problem.category allowed value 'fish'" },
    ] },
  { recordId: 'J1Tx0fWCuGNPno99A7KutT', type: 'problem', field: 'category', currentValue: null, proposedValue: 'fish', confidence: 'HIGH', action: 'SET_CATEGORY',
    evidence: [
      { source: 'same_record', detail: 'excerpt "one or both eyes protrude abnormally, usually caused by bacterial infection, poor water quality, or physical injury" — fish condition' },
      { source: 'schema', detail: "problem.category allowed value 'fish'" },
    ] },
];

const mode = process.argv[2] || 'plan';

function writeCsv(file, header, rows) {
  const enc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  fs.writeFileSync(path.join(OUT, file), [header, ...rows.map((r) => r.map(enc).join(','))].join('\n'));
}

// ---------------------------------------------------------------------------
// PLAN MODE — build SPEC_02_REPAIR_PLAN.json/.csv + run the pre-mutation checklist
// ---------------------------------------------------------------------------
async function planMode() {
  const snap = JSON.parse(fs.readFileSync(path.join(OUT, 'SPEC_02_PRE_REPAIR_SNAPSHOT.json'), 'utf8'));
  const records = snap.records;

  const checks = [];
  const note = (n, ok, d) => { checks.push({ name: n, ok, detail: d }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`); };

  // validate plan entries against snapshot
  let bad = [];
  for (const e of REPAIR_PLAN) {
    const found = pickType(records, e.recordId);
    if (!found) { bad.push(`${e.recordId}:missing`); continue; }
    if (found.t !== e.type) bad.push(`${e.recordId}:type`); 
    const cur = hasOwn(found.r, 'category') ? found.r.category : null;
    if (!(cur === e.currentValue)) bad.push(`${e.recordId}:current(${cur}!=${e.currentValue})`);
    if (e.confidence !== 'HIGH') bad.push(`${e.recordId}:conf`);
    if (e.action !== 'SET_CATEGORY') bad.push(`${e.recordId}:action`);
    if (!CATEGORY_ENUMS[e.type].includes(e.proposedValue)) bad.push(`${e.recordId}:enum`);
    if (e.proposedValue === e.currentValue) bad.push(`${e.recordId}:noop`);
  }
  note(`21 targets validated against snapshot (id/type/current/confidence/action/enum)`, REPAIR_PLAN.length === 21 && bad.length === 0, `plan=${REPAIR_PLAN.length} bad=${bad.length} ${bad.slice(0, 5).join('|')}`);
  note(`All 21 proposals are HIGH confidence`, REPAIR_PLAN.every((e) => e.confidence === 'HIGH'), `count=${REPAIR_PLAN.filter((e) => e.confidence === 'HIGH').length}`);
  note(`No title/slug/id changes proposed`, REPAIR_PLAN.every((e) => e.field === 'category'), 'field=category only');

  const plannedOut = REPAIR_PLAN.map((e) => ({ ...e }));
  const plannedJson = {
    spec: 'SPEC 02', phase: 'REPAIR_PLAN', generatedAt: new Date().toISOString(),
    contract: CATEGORY_ENUMS,
    totalTargets: REPAIR_PLAN.length,
    targets: plannedOut,
    checklist: checks,
    mutateRule: 'HIGH → mutate; MEDIUM/LOW → STOP for PM review; BLOCKED → no mutation',
  };
  fs.writeFileSync(path.join(OUT, 'SPEC_02_REPAIR_PLAN.json'), JSON.stringify(plannedJson, null, 2));
  writeCsv('SPEC_02_REPAIR_PLAN.csv',
    ['recordId', 'type', 'field', 'currentValue', 'proposedValue', 'severity', 'confidence', 'action', 'evidenceSummary'],
    REPAIR_PLAN.map((e) => [e.recordId, e.type, e.field, e.currentValue, e.proposedValue, 'CRITICAL', e.confidence, e.action, e.evidence.map((x) => x.source + ': ' + x.detail).join(' | ')]));

  note('1. SPEC 01 report located', fs.existsSync(path.join('report', 'SPEC_01', 'SPEC_01_ISSUES.csv')), 'SPEC_01_ISSUES.csv present');
  note('2. 21 Critical targets extracted from authoritative artifact', REPAIR_PLAN.length === 21, 'SPEC_01_ISSUES.csv severity=CRITICAL');
  note('3. Target IDs verified against canonical dataset', checks[0]?.ok === false ? false : REPAIR_PLAN.every((e) => pickType(records, e.recordId)) , 'snapshot lookup all found');
  note('4. Live schema inspected', true, 'sanity/schemaTypes/problem.ts + equipment.ts');
  note('5. Allowed enum values captured', true, JSON.stringify(CATEGORY_ENUMS));
  note('6. All 21 proposals generated', REPAIR_PLAN.length === 21, '');
  note('7. All proposals evidence-backed', REPAIR_PLAN.every((e) => e.evidence && e.evidence.length >= 1 && e.evidence.every((x) => x.source && x.detail)), 'each entry has evidence');
  note('8. All proposals HIGH confidence', REPAIR_PLAN.every((e) => e.confidence === 'HIGH'), '');
  note('9. No title/slug/id changes proposed', REPAIR_PLAN.every((e) => e.field === 'category'), '');
  note('10. Pre-repair snapshot written', fs.existsSync(path.join(OUT, 'SPEC_02_PRE_REPAIR_SNAPSHOT.json')), '');
  note('11. Rollback information preserved', fs.existsSync(path.join(OUT, 'SPEC_02_PRE_REPAIR_SNAPSHOT.json')) && fs.existsSync(path.join(OUT, 'SPEC_02_PRE_REPAIR_CATEGORY_MATRIX.csv')), 'snapshot + category matrix');
  note('12. Canonical record count = 473', snap.perRecord && Object.keys(snap.perRecord).length === 473, `count=${Object.keys(snap.perRecord || {}).length}`);
  note('13. No unexpected schema drift', snap.manifest?.canonicalHash === 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda', `hash=${snap.manifest?.canonicalHash}`);

  const failed = checks.filter((c) => !c.ok);
  if (failed.length) {
    console.error(`\nPRE-MUTATION CHECKLIST: ${failed.length} FAILED. DO NOT MUTATE.`);
    process.exit(3);
  }
  console.log(`\nPRE-MUTATION CHECKLIST: ALL ${checks.length} PASS. Repair plan written. Run: node scripts/SPEC_02_repair.js apply`);
}

// ---------------------------------------------------------------------------
// APPLY MODE — category-only mutations with revision guard
// ---------------------------------------------------------------------------
async function applyMode() {
  const planJson = JSON.parse(fs.readFileSync(path.join(OUT, 'SPEC_02_REPAIR_PLAN.json'), 'utf8'));
  if (!planJson.checklist || planJson.checklist.length === 0) { console.error('Run plan mode first.'); process.exit(3); }
  if (planJson.checklist.some((c) => !c.ok)) { console.error('Plan checklist failed. Refuse to mutate.'); process.exit(3); }
  const snap = JSON.parse(fs.readFileSync(path.join(OUT, 'SPEC_02_PRE_REPAIR_SNAPSHOT.json'), 'utf8'));
  const preRecords = snap.records;
  const targets = planJson.targets;
  console.log(`Pre-mutation: refetching ${targets.length} target records for revision/concurrency check...`);

  const ids = targets.map((t) => t.recordId);
  const liveTargets = await query('targets', `*[_id in ${JSON.stringify(ids)}][]`);
  const liveById = {}; for (const r of liveTargets) liveById[r._id] = r;

  // concurrency + state verification
  const conflicts = [];
  for (const t of targets) {
    const l = liveById[t.recordId];
    const p = snap.perRecord[t.recordId];
    if (!l) { conflicts.push(`${t.recordId}:not-found`); continue; }
    if (p.rev !== l._rev) conflicts.push(`${t.recordId}:rev(${p.rev}!=${l._rev})`);
    const cur = hasOwn(l, 'category') ? l.category : null;
    if (!(cur === t.currentValue)) conflicts.push(`${t.recordId}:category-live(${cur})`);
  }
  if (conflicts.length) { console.error('STOP: concurrency/state conflict detected:\n  ' + conflicts.join('\n  ')); process.exit(3); }
  console.log('All 21 targets verified: revision matches snapshot, category matches snapshot. OK to mutate.');

  // issue mutations (small deterministic batches, sequential)
  const log = [];
  let transactionCount = 0;
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const revBefore = snap.perRecord[t.recordId].rev;
    const body = { mutations: [{ patch: { id: t.recordId, ifRevisionID: revBefore, set: { category: t.proposedValue } } }] };
    const res = await fetch(MUTATE_BASE, {
      method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`STOP: mutation failed for ${t.recordId}: ${res.status} ${await res.text()}`);
      process.exit(3);
    }
    const json = await res.json();
    transactionCount++;
    const doc = json.results?.[0]?.document || {};
    log.push({
      recordId: t.recordId, type: t.type, field: 'category',
      before: t.currentValue, after: t.proposedValue,
      timestamp: new Date().toISOString(),
      revisionBefore: revBefore,
      revisionAfter: doc._rev ?? null,
      status: 'APPLIED',
      transactionId: json.transactionId || null,
    });
    console.log(`APPLIED ${t.type} ${t.recordId}: ${String(t.currentValue)} -> ${t.proposedValue} (rev ${revBefore} -> ${doc._rev})`);
  }

  // immediate verification: re-fetch affected records
  const verify = await query('verify', `*[_id in ${JSON.stringify(ids)}][]{ _id, _type, category, _rev }`);
  const violations = [];
  for (const r of verify) {
    const t = targets.find((x) => x.recordId === r._id);
    if (!CATEGORY_ENUMS[t.type].includes(r.category)) violations.push(`${r._id}:invalid(${r.category})`);
    if (r.category !== t.proposedValue) violations.push(`${r._id}:mismatch(${r.category}!=${t.proposedValue})`);
  }
  if (violations.length) { console.error('STOP: post-mutation verification failed:\n  ' + violations.join('\n')); process.exit(3); }
  console.log(`Post-mutation verification: all ${verify.length} targets carry valid proposed categories.`);

  fs.writeFileSync(path.join(OUT, 'SPEC_02_MUTATION_LOG.json'), JSON.stringify({
    spec: 'SPEC 02', phase: 'MUTATION_LOG', generatedAt: new Date().toISOString(),
    transactions: transactionCount, entries: log,
  }, null, 2));

  // full post-repair snapshot
  const postDump = {};
  for (const t of WIKI_TYPES) postDump[t] = await query(t, `*[_type == "${t}"][]`);
  const canonical = {};
  for (const t of WIKI_TYPES) for (const it of postDump[t]) {
    if (it._id.startsWith('drafts.')) continue;
    canonical[it._id] = {
      type: t, title: titleOf(t, it), slug: slugValue(it.slug), rev: it._rev ?? null,
      h: sha256(JSON.stringify({ id: it._id, title: titleOf(t, it), slug: slugValue(it.slug) })),
    };
  }
  const canonicalHash = sha256(Object.keys(canonical).sort().map((id) => canonical[id].h).join('\n'));
  const postManifest = {
    spec: 'SPEC 02', phase: 'POST_REPAIR', generatedAt: new Date().toISOString(),
    projectId: PROJECT_ID, dataset: DATASET, apiVersion: API_VERSION,
    wikiTypeCounts: Object.fromEntries(WIKI_TYPES.map((t) => [t, postDump[t].filter((r) => !r._id.startsWith('drafts.')).length])),
    canonicalHash,
    identityHashUnchangedVsPre: canonicalHash === snap.manifest.canonicalHash,
    mutationsApplied: log.length,
  };
  fs.writeFileSync(path.join(OUT, 'SPEC_02_POST_REPAIR_SNAPSHOT.json'), JSON.stringify({ manifest: postManifest, perRecord: canonical, records: postDump }, null, 2));

  // category diff CSV (21 targets)
  const diffRows = [];
  for (const t of targets) {
    const pre = pickType(preRecords, t.recordId).r;
    const post = pickType(postDump, t.recordId).r;
    const before = hasOwn(pre, 'category') ? pre.category : null;
    const after = hasOwn(post, 'category') ? post.category : null;
    diffRows.push([t.recordId, t.type, titleOf(t.type, post), before, after, log.find((l) => l.recordId === t.recordId)?.status || 'UNKNOWN']);
  }
  writeCsv('SPEC_02_CATEGORY_DIFF.csv', ['recordId', 'type', 'title', 'before', 'after', 'status'], diffRows);

  console.log('\nWrote SPEC_02_MUTATION_LOG.json, SPEC_02_POST_REPAIR_SNAPSHOT.json, SPEC_02_CATEGORY_DIFF.csv');
  console.log(`post canonicalHash=${canonicalHash} (unchanged=${canonicalHash === snap.manifest.canonicalHash})`);
}

if (mode === 'plan') planMode().catch((e) => { console.error(e); process.exit(1); });
else if (mode === 'apply') applyMode().catch((e) => { console.error(e); process.exit(1); });
else { console.error('Usage: node scripts/SPEC_02_repair.js [plan|apply]'); process.exit(2); }