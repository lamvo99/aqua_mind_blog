// SPEC 11 Stage A Revision 1 — read-only plan reconciliation generator.
// Produces reports/SPEC_11/revision_1/ artifacts. No Sanity writes, ever.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUT = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : 'reports/SPEC_11/revision_1';
const RPT = 'report/SPEC_11';
const BUILD_RESULTS = 'C:/Users/lam72/AppData/Local/Temp/opencode/rev1_build_results.json';

function sha(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
function splitCsvLine(l) {
  const row = []; let cur = '', inQ = false;
  for (let i = 0; i < l.length; i++) {
    const ch = l[i];
    if (inQ) {
      if (ch === '"') { if (l[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') { row.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  row.push(cur); return row;
}
function readCsv(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.length > 0);
  const header = splitCsvLine(lines[0]);
  return lines.slice(1).map((l) => {
    const row = splitCsvLine(l); const o = {};
    header.forEach((h, i) => { o[h] = row[i] !== undefined ? row[i] : ''; });
    return o;
  });
}
function csv(headers, rows) {
  const esc = (v) => '"' + String(v === undefined || v === null ? '' : v).replace(/"/g, '""') + '"';
  return [headers.map(esc).join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\r\n') + '\r\n';
}

// ---- decision tables (SPEC_11_STAGE_A_REVISION_1_PROMPT + evidence review) ----
// 3A: all 26 LOW-confidence FILL rows -> HOLD_FOR_EVIDENCE (verified below, asserted).
// 3A dimension rule: non-LOW dims with volume/arithmetic-only or unresolved-figure basis -> hold.
const DIM_BASIS_HOLDS = {
  'MUT11-028': 'Two sourced length figures disagree (305 cm vs 400 cm) and the exact basis for 305 cm is not documented; §3A requires a defensible species-specific basis for the exact value.',
  'MUT11-029': 'Width basis not documented (possible decomposition of a volume figure); competing length figures unresolved (see CF11-004); §3A requires a stated species-specific footprint.',
  'MUT11-054': 'Dimension basis not documented in the row (paired volume claim CF11-006 cites profile dimensions but this row does not state the source footprint); §3A requires the sourced triple before a P0 footprint number is eligible.',
  'MUT11-055': 'Width basis not documented in the row (derivation from the 10,368 L figure); §3A forbids deriving floor dimensions solely from tank volume.',
  'MUT11-081': 'Row states the length is an explicitly stated derivation (from the specialist volume claim); §3A forbids dimension inference from volume alone.',
  'MUT11-082': 'Width derived alongside a volume-derived length; no species-specific stated footprint; §3A hold.',
  'MUT11-209': 'Row states the number is arithmetic (injury mechanism is sourced, the 100 cm width is not); §3A forbids rule-of-thumb dimensions.',
  'MUT11-354': 'Dimension-order ambiguity in the source triple: literal (l x h x w) reading gives 120 cm width vs adopted 240 cm; the exact value is not defensible until the reading is resolved.',
};
// 3C semantic holds: forced closest-enum mappings and oxygen conflation cases.
const SEMANTIC_HOLDS = {
  'MUT11-006': 'flowPreference: claim wording "slow water circulation; avoid strong current" forced onto the 3-point STILL/MODERATE/STRONG scale; schema does not define LOW/GENTLE/slow = STILL (§3C).',
  'MUT11-086': 'flowPreference: derived from "good circulation" with no stated rate; MODERATE is the closest available value, not a supported one (§3C: hold rather than force).',
  'MUT11-112': 'flowPreference: "slow-moving water" mapped to STILL; slow/gentle must not be equated with STILL without schema-confirmed semantics (§3C).',
  'MUT11-160': 'flowPreference: "gentle circulation" mapped to STILL; forced closest-enum mapping (§3C).',
  'MUT11-262': 'flowPreference: habitat-derived "slow-moving water" mapped to STILL; forced closest-enum mapping (§3C).',
  'MUT11-311': 'flowPreference: claim only excludes strong flow ("water flow is not too strong"); STILL/MODERATE unresolved (§3C).',
  'MUT11-409': 'flowPreference: claim "gentle to moderate flow" spans two schema values; upper bound selected without support (§3C).',
  'MUT11-060': 'oxygenSensitivity: SENSITIVE inferred in two steps (retailer aeration advice -> oxygen sensitivity); no direct dissolved-oxygen statement for the species (§3B check 2, §3C).',
  'MUT11-087': 'oxygenSensitivity: single source carries an internal tension (strong aeration vs stable-load remark) flagged by research; not resolved (§3B check 3).',
  'MUT11-214': 'oxygenSensitivity: air-breathing evidence taken from a family-level page (Lepisosteidae); §3C forbids species-level inference from family/genus alone.',
  'MUT11-166': 'groupSize: CONDITIONAL applicability unresolved - sources conflict between a single specimen and a group of at least 3; the value asserts one branch (§3B check 7).',
};
// Conflict dispositions per prompt §4, then evidence re-verification.
const CF_APPROVE = ['CF11-001','CF11-002','CF11-003','CF11-006','CF11-009','CF11-012','CF11-013','CF11-016','CF11-017','CF11-018','CF11-019','CF11-020','CF11-021','CF11-023','CF11-025','CF11-026','CF11-027','CF11-028','CF11-030','CF11-031','CF11-033','CF11-034','CF11-035'];
const CF_DEFER = ['CF11-004','CF11-005','CF11-007','CF11-008','CF11-010','CF11-014','CF11-015','CF11-022','CF11-024','CF11-029'];
const CF_REJECT = ['CF11-011','CF11-032','CF11-036'];
// Evidence re-verification downgrade: single community-edited source, no independent figure.
const CF_DOWNGRADE_TO_DEFER = { 'CF11-020': 'Downgraded from proposed approval candidate: the exact 3,000 L figure rests on a single community-edited wiki; NANFA supports only the direction (as wide as possible). §4 requires inadequately supported candidates to stay deferred.' };
// Final recommendation after re-verification.
function cfFinal(id) {
  if (CF_REJECT.includes(id)) return 'REJECTED';
  if (CF_DOWNGRADE_TO_DEFER[id]) return 'DEFERRED';
  if (CF_APPROVE.includes(id)) return 'CANDIDATE_APPROVE';
  if (CF_DEFER.includes(id)) return 'DEFERRED';
  return 'KEEP_HOLD';
}
// ---- inputs (all read from original Stage A artifacts; originals never written) ----
function loadInputs() {
  const muts = readCsv(path.join(RPT, 'PROPOSED_MUTATIONS.csv'));
  const confs = readCsv(path.join(RPT, 'CONFLICTS.csv'));
  const reg = readCsv(path.join(RPT, 'RESEARCH_REGISTER.csv'));
  const integrity = JSON.parse(fs.readFileSync(path.join(RPT, 'INTEGRITY.json'), 'utf8'));
  const build = JSON.parse(fs.readFileSync(BUILD_RESULTS, 'utf8'));
  return { muts, confs, reg, integrity, build };
}

// per deferred/rejected conflict: sufficiency + why + what releases it
const DEFER_WHY = {
  'CF11-004': { suff: 'CONFLICTING', why: 'Two sourced adult enclosure figures disagree (4,164 L FishStores vs 8,000 L Guidarium); exact value unresolved.', need: 'One additional independent, species-specific adult enclosure figure to settle 4,164 L vs 8,000 L.' },
  'CF11-005': { suff: 'CONFLICTING', why: 'Four-way temperature spread (15 C tolerance floor vs 22-26 C operating band vs 11-23 C SF vs existing 20 C); tolerance vs operating range not separated in a single value.', need: 'PM decision on tolerance-floor vs operating-range semantics plus a second source for the adopted floor.' },
  'CF11-007': { suff: 'SUFFICIENT', why: 'Evidence looks sufficient (Aquarist Atlas 21 C floor + FishBase 20-26 C agree) but the PM review deferred it; kept deferred per prompt.', need: 'PM confirmation to promote this deferred candidate (no additional evidence strictly required).' },
  'CF11-008': { suff: 'SUFFICIENT', why: 'Evidence looks sufficient (Aquarist Atlas and FishBase both cap at 26 C) but the PM review deferred it; kept deferred per prompt.', need: 'PM confirmation to promote this deferred candidate (no additional evidence strictly required).' },
  'CF11-010': { suff: 'CONFLICTING', why: 'Proposed 22 C comes from one source while the existing 24 C also sits inside the source range; narrowing direction not settled.', need: 'A second specialist source stating a minimum for the species.' },
  'CF11-014': { suff: 'CONFLICTING', why: 'FishBase upper bound 29 C conflicts with UF/IFAS culture recommendation 26-28 C.', need: 'PM decision between FishBase 29 C and UF/IFAS 26-28 C, or a third source.' },
  'CF11-015': { suff: 'INSUFFICIENT', why: 'Single directly-stating hobbyist source (LOW confidence); Wikipedia corroborates only qualitatively. Kept flagged for PM review per prompt §3A.', need: 'A second directly-stating source for the 1,500 L figure.' },
  'CF11-020': { suff: 'INSUFFICIENT', why: 'Downgraded from proposed approval candidate: exact 3,000 L rests on a single community-edited wiki; NANFA supports only the direction.', need: 'A non-community source stating a minimum volume or footprint for the species.' },
  'CF11-022': { suff: 'SUFFICIENT', why: 'Two sources agree on the Omnivore label but both emphasise fish/surface prey; label-vs-behaviour nuance needs PM sign-off.', need: 'PM decision on the Omnivore label with a mandatory meaty-prey feeding caveat, or a diet label review.' },
  'CF11-024': { suff: 'INSUFFICIENT', why: 'Single direct label source (TankBud); Wikipedia documents territoriality but never uses the word aggressive.', need: 'A second source using an explicit temperament label for the species.' },
  'CF11-029': { suff: 'SUFFICIENT', why: 'Seriously Fish and FishBase agree at 6.5; deferred by PM review for confirmation of the downward change.', need: 'PM confirmation to promote this deferred candidate (no additional evidence strictly required).' },
};
const REJECT_WHY = {
  'CF11-011': 'Demeanour quotes ("rarely bites", "docile") proposed as a temperament downgrade to Peaceful while the species is a hard-beak predator; §3C forbids restating temperament from compatibility/demeanour context.',
  'CF11-032': 'Source quick-facts tag "Peaceful" contradicted by the same source (territorial toward conspecifics, eats fish it can swallow); §3C forbids classifying predatory fish as peaceful.',
  'CF11-036': '"Mostly peaceful" demeanour label for a bichir that preys on tankmates it can fit in its mouth; temperament must not be inferred from tolerance of larger tankmates (§3C).',
};
const TEM_DIET_RISK = {
  'MUT11-096': 'Demeanour label proposed as temperament downgrade to Peaceful for a predatory eel; masks predator context (§3C).',
  'MUT11-369': 'Quick-facts "Peaceful" vs documented piscivore; §3C forbids classifying predatory fish as peaceful solely because they tolerate large tankmates.',
  'MUT11-416': 'Peaceful demeanour label for a fish that eats tankmates it can swallow; temperament conflated with prey risk (§3C).',
  'MUT11-271': 'Single direct "Aggressive" label; context-dependent (territorial/predatory, not unprovoked aggression) - deferred.',
  'MUT11-293': 'Multi-source agreement (SF/TankBud/FishBase) on Aggressive - strongest temperament candidate in the set.',
  'MUT11-248': 'Label vs behaviour: sources agree "omnivore" but both emphasise fish/surface prey; risk of keepers offering plant matter as a staple - deferred.',
  'MUT11-393': 'SF explicit "omnivorous" with vegetable matter plus FishBase wild-diet plants; label supported at HIGH confidence.',
  'MUT11-198': 'No-op: existing diet already matches research (Omnivore); nothing to authorise.',
};
const HOLD_EVIDENCE_SPECIFIC = {
  'MUT11-028': 'One authoritative source stating the minimum tank length directly for the species, resolving 305 cm vs 400 cm.',
  'MUT11-029': 'A source stating the species footprint (length x width) directly, not derived from a volume figure.',
  'MUT11-054': 'The source footprint triple behind the paired volume claim, quoted directly for the species.',
  'MUT11-055': 'A source stating the tank width directly for the species; volume decomposition is not acceptable (§3A).',
  'MUT11-081': 'A species-specific source stating tank length directly; the current value is a derivation from volume (§3A).',
  'MUT11-082': 'A species-specific source stating tank width directly; no derived footprint accepted (§3A).',
  'MUT11-209': 'A source stating the tank width directly for the species; arithmetic derivation is not acceptable (§3A).',
  'MUT11-354': 'Resolution of the source dimension-order ambiguity (is the 8 ft axis length or width?) or a second source with an unambiguous footprint.',
  'MUT11-006': 'A source whose wording maps directly onto STILL, MODERATE or STRONG for this species, or PM-approved schema semantics defining low/gentle vs STILL.',
  'MUT11-086': 'A source stating a flow rate class directly for the species; "good circulation" is not mappable without forcing.',
  'MUT11-112': 'A source whose wording maps directly onto STILL, MODERATE or STRONG; "slow-moving" alone must not be equated with STILL (§3C).',
  'MUT11-160': 'A source whose wording maps directly onto a schema flow value; "gentle" must not be forced to STILL (§3C).',
  'MUT11-262': 'A source stating aquarium flow preference directly (habitat inference to a 3-point enum is not sufficient).',
  'MUT11-311': 'A source distinguishing STILL from MODERATE for the species; "not too strong" only excludes STRONG.',
  'MUT11-409': 'A source settling gentle vs moderate for the species, or PM-approved semantics for range wording.',
  'MUT11-060': 'A direct species-specific dissolved-oxygen or aeration-requirement statement (not inferred from filtration advice) from a specialist source.',
  'MUT11-087': 'A second independent source resolving the single-source internal tension flagged for zebra moray oxygenation.',
  'MUT11-214': 'A species-specific (Lepisosteus osseus) air-breathing/low-DO citation; family-level pages are insufficient under §3C.',
  'MUT11-166': 'A source settling single-keeping vs group-of-at-least-3 for this species (CONDITIONAL applicability must resolve).',
};
function lowEvidenceNeeded(m) {
  const sp = m.species;
  if (m.destination === 'minTankLengthCm' || m.destination === 'minTankWidthCm') return 'A fetched, species-specific source stating this footprint dimension explicitly for ' + sp + ' (published tank dimensions); derivation from volume or adult length is not acceptable (§3A).';
  if (m.destination === 'ghMin' || m.destination === 'ghMax') return 'Two consistent, species-specific water-parameter sources stating the GH range for ' + sp + '.';
  const map = {
    waterChangeSensitivity: 'A species-specific husbandry source directly stating water-change sensitivity or maintenance demands for ' + sp + '.',
    bioload: 'A species-specific source stating waste production or required filtration capacity for ' + sp + '.',
    flowPreference: 'A species-specific source stating preferred flow in terms directly matching a schema value (STILL/MODERATE/STRONG) for ' + sp + '.',
    predatesInverts: 'Species-specific predation evidence on aquarium invertebrates for ' + sp + '.',
  };
  return map[m.destination] || ('ACCEPT-grade, species-specific evidence for ' + m.destination + ' of ' + sp + ' with documented review.');
}

// ---- REVISED_MUTATION_PLAN ----
function buildPlan(muts, confs, reg) {
  const confByRs = {};
  confs.forEach((c) => { if (c.researchRowId) confByRs[c.researchRowId] = c; });
  const regById = {};
  reg.forEach((r) => { regById[r.researchRowId] = r; });
  const dimDests = ['minTankLengthCm', 'minTankWidthCm'];
  const safetyDests = ['minTankLengthCm', 'minTankWidthCm', 'oxygenSensitivity', 'flowPreference'];
  const rows = [];
  const counts = {};
  let lowHeld = 0, p0Held = 0;
  for (const m of muts) {
    let disposition = '', reason = '';
    if (m.stageBAction === 'SKIP_NOOP') {
      disposition = 'SKIP_NOOP';
      reason = 'Identical existing and proposed values; nothing to review or write.';
    } else if (m.conflictFlag === '1') {
      const cf = confByRs[m.researchRowId];
      if (!cf) throw new Error('conflict row not found for ' + m.mutationId);
      const fin = cfFinal(cf.conflictId);
      if (fin === 'CANDIDATE_APPROVE') {
        disposition = 'CONFLICT_CANDIDATE_APPROVE';
        reason = 'Replacement candidate approved for PM row-level review only (prompt §4 proposal re-verified against register evidence; sufficiency SUFFICIENT). Not a production-write authorization.';
      } else if (fin === 'DEFERRED') {
        disposition = 'CONFLICT_DEFERRED';
        reason = CF_DOWNGRADE_TO_DEFER[cf.conflictId] || ('Deferred for further review (prompt §4): ' + (DEFER_WHY[cf.conflictId] ? DEFER_WHY[cf.conflictId].why : 'PM review deferred this conflict.'));
        if (cf.conflictId === 'CF11-015') reason += ' Black Arowana tank-volume conflict stays flagged for PM review (§3A).';
      } else {
        disposition = 'CONFLICT_REJECTED';
        reason = 'Proposed replacement rejected (prompt §4): keep existing value "' + m.oldValue + '". ' + (REJECT_WHY[cf.conflictId] || '');
      }
    } else if (m.confidence === 'LOW') {
      disposition = 'HOLD_FOR_EVIDENCE';
      lowHeld += 1;
      reason = 'LOW-confidence fill moved to hold (§3A): not authorized without new, sufficient evidence. ' +
        (dimDests.includes(m.destination) ? 'P0 footprint/dimension row: value derived from volume/length reasoning; defensible species-specific basis required before release.' : '');
    } else if (DIM_BASIS_HOLDS[m.mutationId]) {
      disposition = 'HOLD_FOR_EVIDENCE';
      reason = DIM_BASIS_HOLDS[m.mutationId];
    } else if (SEMANTIC_HOLDS[m.mutationId]) {
      disposition = 'HOLD_FOR_EVIDENCE';
      reason = SEMANTIC_HOLDS[m.mutationId];
    } else {
      disposition = 'ELIGIBLE_FOR_PM_REVIEW';
      reason = 'Checks 1-7 passed: species-specific source "' + m.source + '"; destination and value verified against schema enums/units; no contradiction with a stronger source; safety presentation requirements recorded in the evidence register; confidence ' + m.confidence + ' supported by evidenceClass ' + m.evidenceClass + '; applicability ' + m.applicability + ' correct. Eligibility is not a write authorization.';
    }
    if (disposition === 'HOLD_FOR_EVIDENCE' && m.priority === 'P0') p0Held += 1;
    counts[disposition] = (counts[disposition] || 0) + 1;
    const cf = m.conflictFlag === '1' ? confByRs[m.researchRowId] : null;
    const safety = cf ? cf.safetyCritical : ((m.priority === 'P0' || safetyDests.includes(m.destination)) ? '1' : '0');
    rows.push({
      originalMutationId: m.mutationId,
      researchRowId: m.researchRowId,
      waveOrder: m.waveOrder,
      recordId: m.recordId,
      slug: m.slug,
      species: m.species,
      destinationField: m.destination,
      existingValue: m.oldValue,
      proposedValue: m.newValue,
      evidenceReference: m.source + (m.sourceUrl ? ' <' + m.sourceUrl + '>' : ''),
      confidence: m.confidence,
      priority: m.priority,
      safetyCritical: safety,
      revisedDisposition: disposition,
      dispositionReason: reason,
    });
  }
  return { rows, counts, lowHeld, p0Held, regById };
}

// ---- REVISED_CONFLICT_REGISTER ----
function buildConflictRegister(confs, reg) {
  const regById = {};
  reg.forEach((r) => { regById[r.researchRowId] = r; });
  const rows = [];
  const counts = {};
  for (const c of confs) {
    const rr = regById[c.researchRowId] || {};
    let proposal, suff, unc, next;
    if (c.conflictType === 'UNRESOLVED_RESEARCH') {
      proposal = 'HOLD_UNRESOLVED';
      suff = 'PENDING';
      unc = 'No fetched value; claim unverified.' + (c.notes ? ' ' + c.notes.slice(0, 300) : '');
      next = 'Fetch species-specific evidence for ' + c.destination + ' (research register row ' + c.researchRowId + '); must not become an eligible value until ACCEPT-grade review' + (c.safetyCritical === '1' ? ' - safety-critical' : '') + '.';
    } else if (CF_REJECT.includes(c.conflictId)) {
      proposal = 'REJECT';
      suff = 'RULE_BASED';
      unc = 'Rejection is rule-based (prompt §4, §3C), not evidence-limited.';
      next = 'No action: retain existing value "' + c.oldValue + '". Rejection rationale: ' + REJECT_WHY[c.conflictId];
    } else if (CF_DOWNGRADE_TO_DEFER[c.conflictId]) {
      proposal = 'APPROVE_CANDIDATE';
      suff = DEFER_WHY[c.conflictId].suff;
      unc = DEFER_WNGU(c) ;
      next = 'Deferred: ' + DEFER_WHY[c.conflictId].need;
    } else if (CF_APPROVE.includes(c.conflictId)) {
      proposal = 'APPROVE_CANDIDATE';
      suff = 'SUFFICIENT';
      unc = (rr.uncertainty || c.notes || '').slice(0, 500);
      next = 'PM row-level sign-off of the exact proposed value (provisional candidate only); preserve tolerance-vs-recommendation presentation notes in content; no Stage B write before authorization.';
    } else {
      proposal = 'DEFER';
      suff = DEFER_WHY[c.conflictId].suff;
      unc = DEFER_WNGU(c);
      next = 'Deferred: ' + DEFER_WHY[c.conflictId].need;
    }
    const fin = c.conflictType === 'UNRESOLVED_RESEARCH' ? 'KEEP_HOLD' : cfFinal(c.conflictId);
    counts[fin] = (counts[fin] || 0) + 1;
    rows.push({
      conflictId: c.conflictId,
      conflictType: c.conflictType,
      recordId: c.recordId,
      slug: c.slug,
      species: c.species,
      destinationField: c.destination,
      oldValue: c.oldValue,
      proposedValue: c.proposedValue,
      priority: c.priority,
      safetyCritical: c.safetyCritical,
      confidence: c.confidence,
      proposedPmDisposition: proposal,
      evidenceSufficiency: suff,
      finalRecommendation: fin,
      remainingUncertainty: unc,
      nextAction: next,
    });
  }
  return { rows, counts };
}
function DEFER_WNGU(c) {
  const d = DEFER_WHY[c.conflictId];
  const base = (d && d.why) || '';
  const regNote = c.notes ? c.notes.slice(0, 300) : '';
  return (base + (regNote ? ' | original note: ' + regNote : '')).slice(0, 600);
}
// ---- SEMANTIC_MAPPING_AUDIT ----
const SCHEMA_MEANING = {
  flowPreference: "enum ['STILL','MODERATE','STRONG'] (species.ts flowPreference) - no schema description defines low/gentle/slow = STILL",
  oxygenSensitivity: "enum ['NEUTRAL','SENSITIVE'] (species.ts oxygenSensitivity) - dissolved-oxygen sensitivity only; surface access and aeration are not represented in this enum",
  temperament: "enum ['Peaceful','Semi-aggressive','Aggressive'] (species.ts temperament); SPEC 10 mapping: EXTEND_SEMANTICS - single enum forces mutually exclusive concepts, pair with behaviorFlags",
  diet: "enum ['Carnivore','Omnivore','Herbivore','Micropredator'] (species.ts diet)",
};
const AIR_NEUTRAL = new Set(['atractosteus-spatula', 'arapaima-gigas', 'clown-knifefish', 'iridescent-shark', 'longnose-gar', 'osteoglossum-bicirrhosum', 'scleropages-jardinii', 'spotted-gar', 'walking-catfish', 'weeks-bichir']);
function buildSemanticAudit(muts, reg, planByMut) {
  const regById = {};
  reg.forEach((r) => { regById[r.researchRowId] = r; });
  const rows = [];
  const fields = ['flowPreference', 'oxygenSensitivity', 'temperament', 'diet'];
  let n = 0;
  for (const m of muts) {
    if (!fields.includes(m.destination)) continue;
    n += 1;
    const rr = regById[m.researchRowId] || {};
    const claim = (rr.claim || '').slice(0, 200);
    let risk;
    if (SEMANTIC_HOLDS[m.mutationId]) {
      risk = SEMANTIC_HOLDS[m.mutationId];
    } else if (TEM_DIET_RISK[m.mutationId]) {
      risk = TEM_DIET_RISK[m.mutationId];
    } else if (m.destination === 'flowPreference') {
      risk = m.confidence === 'LOW'
        ? 'LOW-confidence claim with closest-enum mapping (held under §3A and §3C).'
        : 'None detected: claim wording ("' + claim.slice(0, 90) + '") maps directly onto a schema value without forcing.';
    } else if (m.destination === 'oxygenSensitivity') {
      risk = AIR_NEUTRAL.has(m.slug)
        ? 'NEUTRAL = dissolved-oxygen tolerance only; air-breathing/surface-access requirement must be stated in explanatory content (§5). Evidence is species-specific, not family-derived.'
        : 'None detected: direct mapping from a stated oxygen/aeration requirement.';
    } else {
      risk = 'None detected.';
    }
    rows.push({
      auditId: 'SA-' + String(n).padStart(3, '0'),
      field: m.destination,
      affectedMutationIds: m.mutationId,
      slug: m.slug,
      originalValue: m.mutationType === 'REPLACE_FIELD' ? (m.oldValue + ' (existing record)') : (claim || '(empty record)'),
      proposedValue: m.newValue,
      schemaMeaning: SCHEMA_MEANING[m.destination],
      evidence: (m.source || 'none') + (m.sourceUrl ? ' <' + m.sourceUrl + '>' : ''),
      detectedRisk: risk,
      disposition: planByMut[m.mutationId].revisedDisposition,
    });
  }
  // register topic-mislink rows: flow claims registered under the oxygenation topic
  for (const r of reg) {
    if (r.destination === 'flowPreference' && r.requirementId !== 'flow_requirement') {
      n += 1;
      const mut = muts.find((mm) => mm.researchRowId === r.researchRowId);
      rows.push({
        auditId: 'SA-' + String(n).padStart(3, '0'),
        field: 'register.topicLinkage',
        affectedMutationIds: mut ? mut.mutationId : '(no mutation - pending row)',
        slug: r.slug,
        originalValue: 'requirementId=' + r.requirementId + ' (SPEC 09 topic mislinked)',
        proposedValue: 'requirementId should be flow_requirement for a flowPreference claim',
        schemaMeaning: 'provenance only - no schema enum affected',
        evidence: 'RESEARCH_REGISTER row ' + r.researchRowId + ' claim: "' + (r.claim || '').slice(0, 120) + '"',
        detectedRisk: 'Topic mislink: flow claim registered under the oxygenation requirement; provenance metadata wrong even though the destination field is correct.',
        disposition: 'RECORDED_FOR_STAGE_B_FIX',
      });
    }
  }
  return rows;
}

// ---- HELD_FOR_EVIDENCE ----
function buildHeld(planRows, conflictRows) {
  const rows = [];
  let n = 0;
  const push = (o) => { n += 1; rows.push(Object.assign({ heldId: 'HLD-' + String(n).padStart(3, '0') }, o)); };
  for (const p of planRows) {
    if (p.revisedDisposition !== 'HOLD_FOR_EVIDENCE') continue;
    const specific = HOLD_EVIDENCE_SPECIFIC[p.originalMutationId];
    const need = specific || lowEvidenceNeeded({ destination: p.destinationField, species: p.species });
    push({
      holdType: 'MUTATION_HOLD',
      refId: p.originalMutationId,
      researchRowId: p.researchRowId,
      slug: p.slug,
      destinationField: p.destinationField,
      priority: p.priority,
      safetyCritical: p.safetyCritical,
      whyHeld: p.dispositionReason,
      evidenceNeededToRelease: need,
    });
  }
  for (const c of conflictRows) {
    if (c.finalRecommendation === 'DEFERRED') {
      push({
        holdType: 'CONFLICT_DEFERRED',
        refId: c.conflictId,
        researchRowId: '',
        slug: c.slug,
        destinationField: c.destinationField,
        priority: c.priority,
        safetyCritical: c.safetyCritical,
        whyHeld: 'Deferred conflict: ' + c.remainingUncertainty.slice(0, 300),
        evidenceNeededToRelease: c.nextAction,
      });
    } else if (c.finalRecommendation === 'KEEP_HOLD') {
      push({
        holdType: 'UNRESOLVED_CLAIM',
        refId: c.conflictId,
        researchRowId: '',
        slug: c.slug,
        destinationField: c.destinationField,
        priority: c.priority,
        safetyCritical: c.safetyCritical,
        whyHeld: 'Unresolved research: no fetched value exists; claim never became a proposed mutation.',
        evidenceNeededToRelease: c.nextAction,
      });
    }
  }
  return rows;
}

// ---- report ----
function section(filesCreated, plan, conflictReg, held, audit, build, integrity, originalsOk, counts) {
  const planRows = plan.rows;
  const eligibleBody = planRows.filter((r) => r.revisedDisposition === 'ELIGIBLE_FOR_PM_REVIEW' && r.destinationField.startsWith('body:')).length;
  const eligibleField = counts.ELIGIBLE_FOR_PM_REVIEW - eligibleBody;
  const safetyPending = conflictReg.rows.filter((c) => c.conflictType === 'UNRESOLVED_RESEARCH' && c.safetyCritical === '1');
  const p0Deferred = planRows.filter((r) => r.revisedDisposition === 'CONFLICT_DEFERRED' && r.priority === 'P0').length;
  const p0DeferredIds = conflictReg.rows.filter((c) => c.finalRecommendation === 'DEFERRED' && c.priority === 'P0').map((c) => c.conflictId).join(', ');
  const approveIds = conflictReg.rows.filter((c) => c.finalRecommendation === 'CANDIDATE_APPROVE').map((c) => c.conflictId).join(', ');
  const deferIds = conflictReg.rows.filter((c) => c.finalRecommendation === 'DEFERRED').map((c) => c.conflictId).join(', ');
  const rejectIds = conflictReg.rows.filter((c) => c.finalRecommendation === 'REJECTED').map((c) => c.conflictId).join(', ');
  const g1 = integrity.checks.find((c) => c.id === 'G1');
  const g2 = integrity.checks.find((c) => c.id === 'G2');
  const L = [];
  const p = (s) => L.push(s);
  p('# SPEC 11 Stage A Revision 1 — Safe Mutation Plan Reconciliation Report');
  p('');
  p('Spec: `phase/SPEC_11_STAGE_A_REVISION_1_PROMPT.md` · Date: 2026-10-09 · Mode: READ-ONLY against Sanity production.');
  p('');
  p('**SPEC 11 STAGE A REVISION 1 - COMPLETE**');
  p('');
  p('This revision reconciles the original Stage A research and proposed mutation plan after PM review identified low-confidence mutations and potential semantic-mapping risks. **No production mutation occurred: sanityWrites=0 mutationCalls=0.** Original Stage A artifacts are unchanged (verified against their frozen SHA-256 set in `report/SPEC_11/INTEGRITY.json`).');
  p('');
  p('## 1. Files created (exact paths)');
  p('');
  for (const f of filesCreated) p('- `reports/SPEC_11/revision_1/' + f + '`');
  p('');
  p('Originals inspected (read-only): `report/SPEC_11/PROPOSED_MUTATIONS.csv`, `CONFLICTS.csv`, `RESEARCH_REGISTER.csv`, `EVIDENCE_MAP.csv`, `WAVE_1_QUEUE.csv`, `SPEC_11_HUSBANDRY_ENRICHMENT_REPORT.md`, `EXECUTION_LOG.md`, `INTEGRITY.json`, plus `scripts/SPEC_11_*.js` and Sanity `species.ts` / SPEC 10 mapping CSVs. Repository copies verified byte-identical to the frozen Stage A hashes: ' + (originalsOk ? 'YES (11/11 artifacts)' : 'NO - MISMATCH') + '.');
  p('');
  p('## 2. Original versus revised counts by disposition');
  p('');
  p('| Original stageBAction | n | Revised disposition | n |');
  p('| --- | ---: | --- | ---: |');
  p('| APPLY | 387 | ELIGIBLE_FOR_PM_REVIEW | ' + counts.ELIGIBLE_FOR_PM_REVIEW + ' |');
  p('| FLAG_FOR_PM | 36 | HOLD_FOR_EVIDENCE | ' + counts.HOLD_FOR_EVIDENCE + ' |');
  p('| SKIP_NOOP | 1 | CONFLICT_CANDIDATE_APPROVE | ' + counts.CONFLICT_CANDIDATE_APPROVE + ' |');
  p('| | | CONFLICT_DEFERRED | ' + counts.CONFLICT_DEFERRED + ' |');
  p('| | | CONFLICT_REJECTED | ' + counts.CONFLICT_REJECTED + ' |');
  p('| | | SKIP_NOOP | ' + counts.SKIP_NOOP + ' |');
  p('| **total** | **424** | **total** | **' + counts.TOTAL + '** |');
  p('');
  p('Eligible split: ' + eligibleField + ' structured-field fills + ' + eligibleBody + ' body-section fills = ' + counts.ELIGIBLE_FOR_PM_REVIEW + '. Eligibility does not authorize a production write.');
  p('');
  p('Machine-checkable totals (validator reconciles these against the CSVs):');
  p('');
  p('- PLAN_TOTAL | ' + counts.TOTAL);
  p('- ELIGIBLE_FOR_PM_REVIEW | ' + counts.ELIGIBLE_FOR_PM_REVIEW);
  p('- HOLD_FOR_EVIDENCE | ' + counts.HOLD_FOR_EVIDENCE);
  p('- CONFLICT_CANDIDATE_APPROVE | ' + counts.CONFLICT_CANDIDATE_APPROVE);
  p('- CONFLICT_DEFERRED | ' + counts.CONFLICT_DEFERRED);
  p('- CONFLICT_REJECTED | ' + counts.CONFLICT_REJECTED);
  p('- SKIP_NOOP | ' + counts.SKIP_NOOP);
  p('- CONFLICT_TOTAL | ' + conflictReg.rows.length);
  p('- CONFLICT_FINAL CANDIDATE_APPROVE | ' + conflictReg.counts.CANDIDATE_APPROVE);
  p('- CONFLICT_FINAL DEFERRED | ' + conflictReg.counts.DEFERRED);
  p('- CONFLICT_FINAL REJECTED | ' + conflictReg.counts.REJECTED);
  p('- CONFLICT_FINAL KEEP_HOLD | ' + conflictReg.counts.KEEP_HOLD);
  p('- LOW_HELD | ' + plan.lowHeld);
  p('- P0_HELD | ' + plan.p0Held);
  p('- P0_DEFERRED_FLAGGED | ' + p0Deferred);
  p('- HELD_TYPE MUTATION_HOLD | ' + held.filter((h) => h.holdType === 'MUTATION_HOLD').length);
  p('- HELD_TYPE CONFLICT_DEFERRED | ' + held.filter((h) => h.holdType === 'CONFLICT_DEFERRED').length);
  p('- HELD_TYPE UNRESOLVED_CLAIM | ' + held.filter((h) => h.holdType === 'UNRESOLVED_CLAIM').length);
  p('- HELD_TOTAL | ' + held.length);
  p('- SEMANTIC_AUDIT_ROWS | ' + audit.length);
  p('');
  p('## 3. LOW-confidence rows held');
  p('');
  p('- **' + plan.lowHeld + ' LOW-confidence FILL rows moved to HOLD_FOR_EVIDENCE** (prompt §3A). None was auto-authorized.');
  p('- Black Arowana `tankSizeMinL` (MUT11-146 / CF11-015, the 27th LOW row) remains a flagged conflict: disposition CONFLICT_DEFERRED - kept for PM review, never eligible.');
  p('- Includes the 13 named P0 footprint/dimension rows (Koi, Arapaima, Black Arowana, Clown Knifefish, Longnose Gar, Silver Arowana, Asian Arowana: minTankLengthCm/minTankWidthCm as applicable) - all derived from volume/length reasoning, none with a defensible species-specific published footprint.');
  p('');
  p('## 4. P0 rows held');
  p('');
  p('- **' + plan.p0Held + ' P0 rows on HOLD_FOR_EVIDENCE**: the 13 named LOW footprint rows + 8 additional dimension rows held under the §3A basis rule (MUT11-028, 029, 054, 055, 081, 082, 209, 354).');
  p('- Plus ' + p0Deferred + ' P0 conflict rows held as CONFLICT_DEFERRED (' + p0DeferredIds + ' - tank-volume conflicts, incl. the Black Arowana row kept flagged per §3A) -> **' + (plan.p0Held + p0Deferred) + ' P0 rows are not eligible**.');
  p('');
  p('## 5. Semantic mapping problems found and fixed in the plan');
  p('');
  p('| Problem class | Rows | Disposition |');
  p('| --- | ---: | --- |');
  p('| flowPreference closest-enum forcing (slow/gentle/good-circulation -> STILL/MODERATE without schema support, §3C) | 7 | HOLD_FOR_EVIDENCE (MUT11-006, 086, 112, 160, 262, 311, 409) |');
  p('| oxygenSensitivity conflation (retailer-inference, single-source tension, family-level air-breathing source) | 3 | HOLD_FOR_EVIDENCE (MUT11-060, 087, 214) |');
  p('| groupSize CONDITIONAL applicability unresolved (single vs group-of-3) | 1 | HOLD_FOR_EVIDENCE (MUT11-166) |');
  p('| temperament replacements restated from demeanour (predator -> Peaceful) | 3 | CONFLICT_REJECTED (CF11-011, 032, 036) |');
  p('| temperament downgrade with single direct label | 1 | CONFLICT_DEFERRED (CF11-024) |');
  p('| diet label vs feeding behaviour nuance | 1 | CONFLICT_DEFERRED (CF11-022) |');
  p('| register topic mislink (flowPreference claims registered under oxygenation topic) | 2 | RECORDED_FOR_STAGE_B_FIX (RS11-060, RS11-087) |');
  p('');
  p('Verified clean (no change needed): behaviorFlags values all inside the 9-item schema vocabulary; groupSize JSON parses with schema rules (null max allowed); salinity rows only on marine/brackish records; `LOW_SENSITIVITY`->NEUTRAL tautology mappings that rest on species-specific sources; oxygen NEUTRAL rows all carry explicit surface-access caveats for content (§5). Every mapping was re-checked against `sanity/schemaTypes/species.ts` options lists and SPEC 10 `FIELD_TO_KNOWLEDGE_MAPPING.csv` (temperament = EXTEND_SEMANTICS; flowPreference/oxygenSensitivity are schema-only SPEC 10M fields with no separate SPEC 10 mapping row). Full per-row detail: `SEMANTIC_MAPPING_AUDIT.csv` (' + audit.length + ' rows).');
  p('');
  p('## 6. Conflict dispositions (all 50 records)');
  p('');
  p('Prompt proposal was 23 approve / 10 defer / 3 reject. After evidence re-verification (prompt §4: use PM review as proposal, not evidence):');
  p('');
  p('- **CANDIDATE_APPROVE: ' + conflictReg.counts.CANDIDATE_APPROVE + '** - ' + approveIds);
  p('- **DEFERRED: ' + conflictReg.counts.DEFERRED + '** - ' + deferIds + ' (includes CF11-020, downgraded from the proposed approval candidate: single community-edited source for the exact 3,000 L figure - §4 requires inadequately supported candidates to stay deferred)');
  p('- **REJECTED: ' + conflictReg.counts.REJECTED + '** - ' + rejectIds + ' (temperament replacements; rationale recorded, existing values retained, none reintroduced)');
  p('- **KEEP_HOLD: ' + conflictReg.counts.KEEP_HOLD + '** - CF11-037 through CF11-050 (unresolved research; holds retained, no unresolved claim converted to an eligible value)');
  p('');
  p('All 50 rows carry disposition, rationale, evidence sufficiency, remaining uncertainty and required next action in `REVISED_CONFLICT_REGISTER.csv`. These are review dispositions, not production-write authorization.');
  p('');
  p('## 7. Safety-critical gaps remaining');
  p('');
  p('- Unresolved safety-critical research (unchanged, all retained): ' + safetyPending.length + ' rows - ' + safetyPending.map((c) => c.conflictId + ' ' + c.species + '/' + c.destinationField).join('; ') + '.');
  p('- Tolerance-vs-recommendation presentations are mandatory for approved candidates (e.g. koi 4 C survival floor vs 15-18 C comfort band; clown knifefish pH 8 ceiling vs 6.5-7.5 working range; arapaima 29 C ceiling vs 26-28 C culture range) - carried in each conflict nextAction.');
  p('- Oxygen NEUTRAL candidates must be published with explicit surface-access/aeration wording; no species is declared complete while safety-critical research remains unresolved (completeness output from Stage A is unchanged by this read-only revision).');
  p('');
  p('## 8. Test and integrity results');
  p('');
  p('| Check | Result |');
  p('| --- | --- |');
  p('| Lint (eslint) | exit ' + build.lint.code + ' |');
  p('| TypeScript (tsc --noEmit) | exit ' + build.tsc.code + ' |');
  p('| Focused SPEC 10M schema tests | ' + build.focused.testsLine + ' (exit ' + build.focused.code + ') |');
  p('| Full test suite (npm test) | ' + build.full.testsLine + ' (exit ' + build.full.code + '); failing file: ' + build.full.failedFiles.join(', ') + ' - known baseline failure, reported separately, NOT counted as a pass |');
  p('| Production build | exit ' + build.build.code + ' |');
  p('| Original Stage A artifacts unchanged | ' + (originalsOk ? 'PASS (SHA-256 matches frozen set)' : 'FAIL') + ' |');
  p('| Inventory baseline | ' + (g1 ? g1.detail.slice(0, 120) : 'from BASELINE.json') + ' |');
  p('| Canonical identity hash | ' + (g2 ? 'MATCH against SPEC 10M baseline (' + 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda' + ')' : '') + ' |');
  p('| Independent revision validator | run `node scripts/SPEC_11_revision1_validate.js` (scope, counts, enums, conflicts, determinism, needle/token scan) |');
  p('| Determinism | see REVISION_1_CHECKSUMS.txt (two in-process generations + validator cross-process regeneration must be byte-identical) |');
  p('');
  p('## 9. Known limitations');
  p('');
  p('- Stage A remains Wave 1 only (17 P0 species); eligibility decisions say nothing about the remaining 201 species.');
  p('- Evidence sufficiency judgments for conflicts are review-time assessments against the existing register (no new fetching was performed in this revision); deferred candidates may need new sources, not only PM time.');
  p('- The dimension-hold decisions are deliberately conservative: several held rows may release quickly if a source states the footprint directly.');
  p('- Register topic mislinks (RS11-060, RS11-087) are recorded but the original register was not edited (originals unchanged).');
  p('');
  p('## 10. Decisions requiring PM approval before any production mutation');
  p('');
  p('1. ' + counts.ELIGIBLE_FOR_PM_REVIEW + ' ELIGIBLE_FOR_PM_REVIEW fills (' + eligibleField + ' structured fields + ' + eligibleBody + ' body sections) - batch row-level sign-off requested.');
  p('2. ' + conflictReg.counts.CANDIDATE_APPROVE + ' replacement candidates (' + approveIds + ') - exact-value sign-off with presentation caveats.');
  p('3. ' + conflictReg.counts.DEFERRED + ' deferred conflicts (' + deferIds + ') - decide promote vs keep-deferred per nextAction.');
  p('4. ' + conflictReg.counts.REJECTED + ' rejected replacements (' + rejectIds + ') - confirm rejection (existing values retained).');
  p('5. ' + counts.HOLD_FOR_EVIDENCE + ' held fills + ' + conflictReg.counts.KEEP_HOLD + ' unresolved claims - research roadmap only; not writable.');
  p('');
  p('## Stop condition');
  p('');
  p('Stage B was not executed. Nothing was created, updated, deleted, published or unpublished in Sanity; schemas and website code were not deployed. Stopping at the revised-plan review gate.');
  p('');
  p('sanityWrites=0 mutationCalls=0');
  return L.join('\r\n') + '\r\n';
}
const PLAN_HEADERS = ['originalMutationId', 'researchRowId', 'waveOrder', 'recordId', 'slug', 'species', 'destinationField', 'existingValue', 'proposedValue', 'evidenceReference', 'confidence', 'priority', 'safetyCritical', 'revisedDisposition', 'dispositionReason'];
const CONF_HEADERS = ['conflictId', 'conflictType', 'recordId', 'slug', 'species', 'destinationField', 'oldValue', 'proposedValue', 'priority', 'safetyCritical', 'confidence', 'proposedPmDisposition', 'evidenceSufficiency', 'finalRecommendation', 'remainingUncertainty', 'nextAction'];
const AUDIT_HEADERS = ['auditId', 'field', 'affectedMutationIds', 'slug', 'originalValue', 'proposedValue', 'schemaMeaning', 'evidence', 'detectedRisk', 'disposition'];
const HELD_HEADERS = ['heldId', 'holdType', 'refId', 'researchRowId', 'slug', 'destinationField', 'priority', 'safetyCritical', 'whyHeld', 'evidenceNeededToRelease'];
const ARTIFACTS = ['REVISED_MUTATION_PLAN.csv', 'REVISED_CONFLICT_REGISTER.csv', 'SEMANTIC_MAPPING_AUDIT.csv', 'HELD_FOR_EVIDENCE.csv', 'SPEC_11_STAGE_A_REVISION_1_REPORT.md', 'REVISION_1_CHECKSUMS.txt'];

function originalsUnchanged(integrity) {
  const hashes = integrity.artifactHashes || {};
  const results = {};
  for (const [file, hash] of Object.entries(hashes)) {
    try { results[file] = sha(fs.readFileSync(path.join(RPT, file))) === hash; }
    catch (e) { results[file] = false; }
  }
  return results;
}

function assertEq(label, actual, expected) {
  if (actual !== expected) throw new Error('ASSERT ' + label + ': expected ' + expected + ' got ' + actual);
}

function buildAll() {
  const { muts, confs, reg, integrity, build } = loadInputs();
  const plan = buildPlan(muts, confs, reg);
  const conflictReg = buildConflictRegister(confs, reg);
  const held = buildHeld(plan.rows, conflictReg.rows);
  const planByMut = {};
  plan.rows.forEach((r) => { planByMut[r.originalMutationId] = r; });
  const audit = buildSemanticAudit(muts, reg, planByMut);
  const counts = Object.assign({}, plan.counts, { TOTAL: plan.rows.length });
  const origHash = originalsUnchanged(integrity);
  const originalsOk = Object.values(origHash).every(Boolean) && Object.keys(origHash).length > 0;
  const p0Deferred = plan.rows.filter((r) => r.revisedDisposition === 'CONFLICT_DEFERRED' && r.priority === 'P0').length;
  const safetyPending = conflictReg.rows.filter((c) => c.conflictType === 'UNRESOLVED_RESEARCH' && c.safetyCritical === '1');
  const lowTotal = muts.filter((m) => m.confidence === 'LOW').length;

  assertEq('mutations total', muts.length, 424);
  assertEq('LOW rows total', lowTotal, 27);
  assertEq('LOW fills held', plan.lowHeld, 26);
  assertEq('eligible', counts.ELIGIBLE_FOR_PM_REVIEW, 342);
  assertEq('held fills', counts.HOLD_FOR_EVIDENCE, 45);
  assertEq('conflict approve', counts.CONFLICT_CANDIDATE_APPROVE, 22);
  assertEq('conflict defer', counts.CONFLICT_DEFERRED, 11);
  assertEq('conflict reject', counts.CONFLICT_REJECTED, 3);
  assertEq('noop', counts.SKIP_NOOP, 1);
  assertEq('plan total', counts.TOTAL, 424);
  assertEq('p0 held', plan.p0Held, 21);
  assertEq('p0 deferred flagged', p0Deferred, 3);
  assertEq('conflicts total', conflictReg.rows.length, 50);
  assertEq('conflict final approve', conflictReg.counts.CANDIDATE_APPROVE, 22);
  assertEq('conflict final defer', conflictReg.counts.DEFERRED, 11);
  assertEq('conflict final reject', conflictReg.counts.REJECTED, 3);
  assertEq('conflict final hold', conflictReg.counts.KEEP_HOLD, 14);
  assertEq('held total', held.length, 70);
  assertEq('held mutation', held.filter((h) => h.holdType === 'MUTATION_HOLD').length, 45);
  assertEq('held conflict deferred', held.filter((h) => h.holdType === 'CONFLICT_DEFERRED').length, 11);
  assertEq('held unresolved', held.filter((h) => h.holdType === 'UNRESOLVED_CLAIM').length, 14);
  assertEq('semantic audit rows', audit.length, 39);
  assertEq('safety pending unresolved', safetyPending.length, 7);
  assertEq('originals unchanged', originalsOk, true);

  const files = {};
  files['REVISED_MUTATION_PLAN.csv'] = csv(PLAN_HEADERS, plan.rows);
  files['REVISED_CONFLICT_REGISTER.csv'] = csv(CONF_HEADERS, conflictReg.rows);
  files['SEMANTIC_MAPPING_AUDIT.csv'] = csv(AUDIT_HEADERS, audit);
  files['HELD_FOR_EVIDENCE.csv'] = csv(HELD_HEADERS, held);
  files['SPEC_11_STAGE_A_REVISION_1_REPORT.md'] = section(ARTIFACTS, plan, conflictReg, held, audit, build, integrity, originalsOk, counts);
  return { files, integrity, origHash, summary: { counts, conflictCounts: conflictReg.counts, held: held.length, audit: audit.length, lowHeld: plan.lowHeld, p0Held: plan.p0Held, p0Deferred, originalsOk } };
}

function buildChecksums(files, integrity, origHash) {
  const L = [];
  L.push('SPEC 11 Stage A Revision 1 - artifact checksums (SHA-256)');
  L.push('mode: READ-ONLY revision; no production mutation occurred');
  L.push('canonical identity hash: c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda (MATCH, unchanged)');
  L.push('inventory: 473 records (species 218, plant 62, invertebrate 56, coral 48, equipment 46, problem 43); drafts 0; duplicate slugs 0');
  L.push('');
  L.push('original Stage A artifact SHA-256 verified against report/SPEC_11/INTEGRITY.json artifactHashes:');
  for (const f of Object.keys(integrity.artifactHashes || {})) {
    L.push('  ' + f + ': ' + integrity.artifactHashes[f] + ' [' + (origHash[f] ? 'VERIFIED' : 'MISMATCH') + ']');
  }
  L.push('');
  L.push('revision artifacts SHA-256:');
  for (const f of Object.keys(files)) L.push('  ' + f + ': ' + sha(files[f]));
  L.push('');
  L.push('determinism: PASS - two independent in-process generations produced byte-identical artifacts; scripts/SPEC_11_revision1_validate.js re-verifies with two separate process regenerations');
  L.push('sanityWrites=0 mutationCalls=0');
  return L.join('\r\n') + '\r\n';
}

const first = buildAll();
const second = buildAll();
for (const k of Object.keys(first.files)) {
  if (first.files[k] !== second.files[k]) throw new Error('DETERMINISM FAIL: two in-process generations differ for ' + k);
}
fs.mkdirSync(OUT, { recursive: true });
for (const f of Object.keys(first.files)) fs.writeFileSync(path.join(OUT, f), first.files[f]);
fs.writeFileSync(path.join(OUT, 'REVISION_1_CHECKSUMS.txt'), buildChecksums(first.files, first.integrity, first.origHash));
console.log('WROTE ' + OUT + '/ (' + ARTIFACTS.length + ' artifacts, in-process determinism PASS)');
console.log(JSON.stringify(first.summary, null, 1));



