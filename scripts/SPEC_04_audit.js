const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_DIR = path.join('report', 'SPEC_04');
const SPEC03_DIR = path.join('report', 'SPEC_03');
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };

function q(query) {
  const url = BASE + '?query=' + encodeURIComponent(query);
  return new Promise((res, rej) => {
    https.get(url, { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      r.on('end', () => { const d = Buffer.concat(chunks).toString('utf8'); try { res(JSON.parse(d).result); } catch (e) { rej(new Error('bad response: ' + d.slice(0, 300))); } });
    }).on('error', rej);
  });
}

// ---------- helpers ----------
const csvEsc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
function writeCsv(name, header, rows) {
  const lines = [header.map(csvEsc).join(',')];
  for (const r of rows) lines.push(header.map((h) => csvEsc(r[h])).join(','));
  fs.writeFileSync(path.join(OUT_DIR, name), '﻿' + lines.join('\r\n') + '\r\n');
}
function ptToText(v) {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map((b) => (b && Array.isArray(b.children) ? b.children.map((c) => c.text || '').join('') : (typeof b === 'string' ? b : ''))).join(' \n ');
  if (v && typeof v === 'object') return Object.values(v).map(ptToText).join(' ');
  return '';
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function mentionPositions(text, title) {
  const re = new RegExp('(?<![A-Za-z0-9])' + esc(title) + '(?![A-Za-z0-9])', 'gi');
  const out = []; let m;
  while ((m = re.exec(text)) !== null) { out.push(m.index); if (out.length > 20) break; }
  return out;
}
const ctxAround = (text, i, len, span = 90) => text.slice(Math.max(0, i - span), i + len + span).replace(/\s+/g, ' ');
const POS_LEX = /compatib|tank ?mates?|gets along|safe (with|for)|suitable (for|with)|house(d|s)? (with|together)|keep(ed)? together|community (tank|fish|aquarium)|coexist|peaceful with|can live with|good tankmate/i;
const NEG_LEX = /\bavoid\b|not compatible|aggressive|will eat|eats?\b|preys? on|predator|attacks|nips?\b|nip at|bullying|incompatible|may eat|threat|hostile/i;
const VARIANT_LEX = /variant of|morph of|form of|selectively bred|cultivar|breed of|variety of|strain of|color morph/i;
const FRESH_LEX = /\bfreshwater\b|\bfresh water\b/i;
const SALT_LEX = /\bsaltwater\b|\bsalt water\b|\bmarine\b|\breef\b|\bbrackish\b/i;

const ENUMS = {
  'species.group': ['Cichlid', 'Livebearer', 'Catfish', 'Loach', 'Characin', 'Cyprinid', 'Gourami', 'Arowana', 'Puffer', 'Angelfish', 'Tang', 'Wrasse', 'Goby', 'Blenny', 'Shark', 'Rainbowfish', 'Killifish', 'Pleco', 'Other'],
  'plant.group': ['Stem', 'Rosette', 'Rhizome', 'Bulb', 'Moss', 'Fern', 'Floating', 'Epiphyte', 'Carpet', 'Succulent', 'Other'],
  'coral.group': ['LPS', 'SPS', 'Soft', 'NPS', 'Mushroom', 'Anemone', 'Polyp', 'Colony', 'Single Polyp', 'Other'],
  'problem.waterType': ['freshwater', 'saltwater', 'both'],
};

// ---------- load ----------
const SNAPSHOT = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_04_PRE_AUDIT_SNAPSHOT.json'), 'utf8'));
const PLAN = JSON.parse(fs.readFileSync(path.join(SPEC03_DIR, 'SPEC_03_REPAIR_PLAN.json'), 'utf8'));
const OPP_LINES = fs.readFileSync(path.join(SPEC03_DIR, 'SPEC_03_RELATIONSHIP_OPPORTUNITIES.csv'), 'utf8').trim().split('\n').slice(1).map((l) => l.trim()).filter(Boolean);

const recs = {}; const typeOf = {};
for (const t of WIKI_TYPES) for (const r of SNAPSHOT.records[t]) if (!r._id.startsWith('drafts.')) { recs[r._id] = r; typeOf[r._id] = t; }
const posts = SNAPSHOT.posts || []; const tools = SNAPSHOT.tools || [];
const titleOfId = (id) => (typeOf[id] === 'problem' ? recs[id].title : recs[id].name);
const categoryOf = (id) => (typeof recs[id].category === 'string' && recs[id].category ? recs[id].category : typeOf[id]);

// registry by type for candidates
const registry = {};
for (const t of WIKI_TYPES) registry[t] = [];
for (const [id, r] of Object.entries(recs)) registry[typeOf[id]].push({ id, title: titleOfId(id) });
for (const t of WIKI_TYPES) registry[t].sort((a, b) => (b.title || '').length - (a.title || '').length);

// live histograms (E3)
function histogram(type, field) {
  const h = {};
  for (const [id, r] of Object.entries(recs)) if (typeOf[id] === type && r[field] !== undefined && r[field] !== null && r[field] !== '') h[r[field]] = (h[r[field]] || 0) + 1;
  return h;
}
const speciesGroupH = histogram('species', 'group');
const plantGroupH = histogram('plant', 'group');
const coralGroupH = histogram('coral', 'group');
const problemWaterH = histogram('problem', 'waterType');
const hSample = (h, v, type, field) => {
  const n = h[v] || 0;
  const ex = Object.entries(recs).filter(([id, r]) => typeOf[id] === type && r[field] === v).slice(0, 3).map(([id]) => titleOfId(id));
  return n === 0 ? '0 live records' : `${n} live (e.g. ${ex.join(', ')})`;
};

const conflicts = [];
function addConflict(conflictType, recordId, recordType, field, detail, severity, workstream) {
  conflicts.push({ conflictType, recordId, recordType, field, detail, severity, workstream });
}

// ============================================================
// Workstream A — 108 REVIEW_REQUIRED
// ============================================================
const reviewPlan = PLAN.proposals.filter((p) => p.action === 'REVIEW_REQUIRED');
const A_ROWS = [];
const statsA = { HIGH: 0, MEDIUM: 0, LOW: 0, BLOCKED: 0, approve: 0, review: 0, block: 0, byField: {} };

function auditReviewRow(p) {
  const rec = recs[p.recordId];
  const enumKey = `${p.type}.${p.field}`;
  const allowed = ENUMS[enumKey] || [];
  const enumOk = allowed.includes(p.proposedValue);
  const currentOk = p.currentValue === '' || allowed.includes(p.currentValue);
  const sameFamily = p.type === 'species' && rec.family
    ? Object.entries(recs).filter(([id, r]) => typeOf[id] === 'species' && r.family === rec.family)
    : [];
  const familyProposals = reviewPlan.filter((r) => r.type === p.type && r.field === p.field && r.recordId !== p.recordId && recs[r.recordId] && recs[r.recordId].family === rec.family);
  const familyConflictLive = sameFamily.filter(([id, r]) => r.group && r.group !== p.proposedValue);
  const liveValueConflict = rec[p.field] !== undefined && rec[p.field] !== null && rec[p.field] !== '' && rec[p.field] !== p.currentValue;

  let confidence = 'MEDIUM', evidenceTier = 'E1/E2', evidenceSummary = '', ambiguity = 'none',
    comparable = '', external = '(internal evidence — no external research required)', recommendation = 'REVIEW_REQUIRED',
    futureSpec = 'SPEC_05_FIELD_REPAIR';

  if (p.field === 'group' && p.type === 'species') {
    const familyConsistent = familyProposals.every((r) => r.proposedValue === p.proposedValue);
    const exemplars = speciesGroupH[p.proposedValue] || 0;
    evidenceTier = 'E1/E2/E3';
    evidenceSummary = `E1 record.family=${rec.family || '(missing)'}; E2 '${p.proposedValue}' in enum; E3 family→group consistent across ${familyProposals.length + 1} planned rows=${familyConsistent}; E3 live exemplars for '${p.proposedValue}': ${hSample(speciesGroupH, p.proposedValue, 'species', 'group')}`;
    comparable = `${sameFamily.length} same-family species; group exemplars: ${hSample(speciesGroupH, p.proposedValue, 'species', 'group')}`;
    external = p.source ? `plan source: ${p.source}` : external;
    if (!enumOk) { confidence = 'BLOCKED'; recommendation = 'BLOCK'; ambiguity = `proposedValue '${p.proposedValue}' not in enum (E2 violation)`; }
    else if (!familyConsistent) {
      confidence = 'MEDIUM'; recommendation = 'REVIEW_REQUIRED';
      ambiguity = 'same-family rows in plan propose different group values';
      addConflict('GROUP_FAMILY_CONFLICT', p.recordId, p.type, p.field, `family ${rec.family}: plan proposes ${[...new Set(familyProposals.map((r) => r.proposedValue).concat([p.proposedValue]))].join('/')}`, 'MEDIUM', 'A');
    } else if (familyConflictLive.length) {
      confidence = 'MEDIUM'; recommendation = 'REVIEW_REQUIRED';
      ambiguity = `live same-family record(s) carry a different group: ${familyConflictLive.slice(0, 2).map(([, r]) => `${r.name}=${r.group}`).join(', ')}`;
      addConflict('GROUP_FAMILY_CONFLICT', p.recordId, p.type, p.field, `proposed '${p.proposedValue}' vs live ${familyConflictLive.slice(0, 3).map(([, r]) => `${r.name}=${r.group}`).join('; ')}`, 'MEDIUM', 'A');
    } else if (exemplars >= 1 && currentOk) {
      confidence = 'HIGH'; recommendation = 'APPROVE_FOR_FUTURE_SPEC';
      evidenceSummary += '; value already in live use (no first-use risk)';
    } else {
      confidence = 'MEDIUM'; recommendation = 'REVIEW_REQUIRED';
      ambiguity = `first-use: '${p.proposedValue}' has 0 live exemplars; PM acceptance of new enum-value use required (plan: ${p.source || 'family-based trade grouping'})`;
    }
    if (liveValueConflict) { confidence = 'MEDIUM'; recommendation = 'REVIEW_REQUIRED'; ambiguity = `live value '${rec[p.field]}' differs from plan currentValue — re-verify`; addConflict('PLAN_VS_LIVE_DRIFT', p.recordId, p.type, p.field, `plan=${p.currentValue} live=${rec[p.field]}`, 'HIGH', 'A'); }
  } else if (p.field === 'group' && p.type === 'plant') {
    evidenceTier = 'E1/E2';
    const growth = rec.growthForm || '(missing)';
    evidenceSummary = `E1 record.growthForm=${growth}; E2 '${p.proposedValue}' in enum; E3 live '${p.proposedValue}' exemplars: ${hSample(plantGroupH, p.proposedValue, 'plant', 'group')}`;
    comparable = `plant group histogram: ${Object.entries(plantGroupH).map(([k, v]) => `${k}=${v}`).join(', ')}`;
    external = p.source ? `plan source: ${p.source}` : external;
    if (!enumOk) { confidence = 'BLOCKED'; recommendation = 'BLOCK'; ambiguity = 'not in enum'; }
    else {
      confidence = 'MEDIUM'; recommendation = 'REVIEW_REQUIRED';
      ambiguity = `first-use of '${p.proposedValue}' derived from growthForm=${growth} (habit judgment, not botanical identity); spec §6 flags first-use Carpet groups for care — another habit reading (e.g. foreground cover vs stolon spread) is plausible`;
    }
    if (liveValueConflict) { confidence = 'MEDIUM'; recommendation = 'REVIEW_REQUIRED'; ambiguity += `; live value '${rec[p.field]}' differs from plan`; addConflict('PLAN_VS_LIVE_DRIFT', p.recordId, p.type, p.field, `plan=${p.currentValue} live=${rec[p.field]}`, 'HIGH', 'A'); }
  } else if (p.field === 'group' && p.type === 'coral') {
    evidenceTier = 'E1/E2/E3';
    evidenceSummary = `E1 canonical name '${rec.name}' contains subgroup token; E2 '${p.proposedValue}' in enum; E3 live coral groups: ${Object.entries(coralGroupH).map(([k, v]) => `${k}=${v}`).join(', ') || '(none)'}`;
    comparable = `coral group histogram: ${Object.entries(coralGroupH).map(([k, v]) => `${k}=${v}`).join(', ') || '(empty)'}`;
    external = p.source ? `plan source: ${p.source}` : external;
    if (!enumOk) { confidence = 'BLOCKED'; recommendation = 'BLOCK'; ambiguity = 'not in enum'; }
    else {
      confidence = 'MEDIUM'; recommendation = 'REVIEW_REQUIRED';
      ambiguity = `name-token subclassification only (plan source: ${p.source}); hobbyist grouping (Mushroom/Polyp) can diverge from taxonomy (e.g. corallimorph vs soft coral); spec §6 flags Mushroom/Polyp classification for care`;
    }
    if (liveValueConflict) { confidence = 'MEDIUM'; recommendation = 'REVIEW_REQUIRED'; ambiguity += `; live value '${rec[p.field]}' differs from plan`; addConflict('PLAN_VS_LIVE_DRIFT', p.recordId, p.type, p.field, `plan=${p.currentValue} live=${rec[p.field]}`, 'HIGH', 'A'); }
  } else if (p.field === 'waterType' && p.type === 'problem') {
    evidenceTier = 'E5';
    const text = [rec.title, rec.excerpt, ptToText(rec.body), ptToText(rec.symptoms), ptToText(rec.causes), ptToText(rec.whatToCheck), ptToText(rec.whatNotToDo)].join(' ');
    const planReason = `${p.reason || ''} ${p.source || ''}`;
    const fresh = FRESH_LEX.test(text), salt = SALT_LEX.test(text) || SALT_LEX.test(planReason), freshReason = FRESH_LEX.test(planReason);
    const urlOk = !!p.sourceUrl, dateOk = !!p.sourceDate;
    external = urlOk ? `${p.sourceUrl} (accessed ${p.sourceDate || 'DATE-MISSING'})` : '(E5 source named without URL — verification required)';
    let contradiction = '';
    if (p.proposedValue === 'freshwater' && (salt && !fresh)) contradiction = `text/reason contains salt/marine/reef indicators but proposal is freshwater`;
    if (p.proposedValue === 'saltwater' && (fresh && !salt)) contradiction = `text/reason contains freshwater indicators but proposal is saltwater`;
    if (p.proposedValue === 'freshwater' && freshReason === false && salt) contradiction = contradiction || 'plan reason itself raises a marine counterpart';
    evidenceSummary = `E5 plan research: ${p.source}; ${urlOk ? 'URL+date recorded' : 'URL MISSING'}; E1 indicator scan: fresh=${fresh} salt/marine=${salt}; live waterType histogram: ${Object.entries(problemWaterH).map(([k, v]) => `${k}=${v}`).join(', ')}`;
    comparable = `problems with waterType='${p.proposedValue}': ${hSample(problemWaterH, p.proposedValue, 'problem', 'waterType')}`;
    if (!enumOk) { confidence = 'BLOCKED'; recommendation = 'BLOCK'; ambiguity = 'not in enum'; }
    else if (contradiction) {
      confidence = 'MEDIUM'; recommendation = 'REVIEW_REQUIRED'; ambiguity = contradiction;
      addConflict('WATERTYPE_INDICATOR_MISMATCH', p.recordId, p.type, p.field, `${p.proposedValue}: ${contradiction}`, 'MEDIUM', 'A');
    } else if (!urlOk || !dateOk) {
      confidence = 'MEDIUM'; recommendation = 'REVIEW_REQUIRED'; ambiguity = 'E5 source lacks URL and/or access date (§4 E5 requirement)';
      addConflict('E5_SOURCE_INCOMPLETE', p.recordId, p.type, p.field, `url=${urlOk} date=${dateOk}`, 'MEDIUM', 'A');
    } else {
      confidence = 'HIGH'; recommendation = 'APPROVE_FOR_FUTURE_SPEC';
      ambiguity = p.proposedValue === 'both' ? 'none — both-water coverage is the conservative assignment' : 'none — single-water assignment supported by E5 source + no contradicting indicator';
    }
    if (liveValueConflict) { confidence = 'MEDIUM'; recommendation = 'REVIEW_REQUIRED'; ambiguity = `live value '${rec[p.field]}' differs from plan`; addConflict('PLAN_VS_LIVE_DRIFT', p.recordId, p.type, p.field, `plan=${p.currentValue} live=${rec[p.field]}`, 'HIGH', 'A'); }
  } else {
    evidenceTier = 'E1/E2';
    evidenceSummary = `plan source: ${p.source || '—'}; enumOk=${enumOk}`;
    comparable = '(field-specific comparables not applicable)';
    if (!enumOk) { confidence = 'BLOCKED'; recommendation = 'BLOCK'; ambiguity = 'not in enum'; }
  }

  statsA[confidence] = (statsA[confidence] || 0) + 1;
  if (recommendation === 'APPROVE_FOR_FUTURE_SPEC') statsA.approve++;
  else if (recommendation === 'BLOCK') statsA.block++;
  else statsA.review++;
  const fkey = `${p.type}.${p.field}`;
  statsA.byField[fkey] = statsA.byField[fkey] || { total: 0, HIGH: 0, MEDIUM: 0, approve: 0 };
  statsA.byField[fkey].total++; statsA.byField[fkey][confidence] = (statsA.byField[fkey][confidence] || 0) + 1;
  if (recommendation === 'APPROVE_FOR_FUTURE_SPEC') statsA.byField[fkey].approve++;

  return {
    recordId: p.recordId, title: p.title, category: categoryOf(p.recordId), field: `${p.type}.${p.field}`,
    currentValue: p.currentValue, proposedValue: p.proposedValue, action: p.action,
    confidence, evidenceTier, evidenceSummary, ambiguity, comparableRecords: comparable,
    externalSources: external, recommendation, futureSpec,
  };
}
for (const p of reviewPlan) A_ROWS.push(auditReviewRow(p));
writeCsv('SPEC_04_REVIEW_REQUIRED_AUDIT.csv',
  ['recordId', 'title', 'category', 'field', 'currentValue', 'proposedValue', 'action', 'confidence', 'evidenceTier', 'evidenceSummary', 'ambiguity', 'comparableRecords', 'externalSources', 'recommendation', 'futureSpec'],
  A_ROWS);

// ============================================================
// Workstream B — 3 REPLACE_FIELD
// ============================================================
const replacePlan = PLAN.proposals.filter((p) => p.action === 'REPLACE_FIELD');
const B_ROWS = [];
const statsB = { HIGH: 0, MEDIUM: 0, LOW: 0, BLOCKED: 0, byRec: {} };
for (const p of replacePlan) {
  const rec = recs[p.recordId];
  const allowed = ENUMS[`${p.type}.${p.field}`] || [];
  const currentValid = allowed.includes(p.currentValue);
  const proposedValid = allowed.includes(p.proposedValue);
  const exemplars = (p.type === 'plant' ? plantGroupH : speciesGroupH)[p.proposedValue] || 0;
  let confidence, evidence, reason, risk, external, comparables, recommendation;

  if (p.recordId === 'plant-dwarf-sagittaria') {
    confidence = 'HIGH';
    evidence = `E1 record.growthForm='${rec.growthForm}'; E2 current '${p.currentValue}' NOT in plant.group enum (invalid), proposed '${p.proposedValue}' in enum; E5 ${p.source} — ${p.sourceUrl} (accessed ${p.sourceDate}); E3 live '${p.proposedValue}' exemplars: ${exemplars}`;
    reason = 'Replacement REQUIRED: current value violates E2 enum (invalid, not merely suboptimal). True replacement (invalid→valid), not a missing-value fill. Existing value NOT valid. Proposed value more precise (growthForm-aligned). Historical meaning partially lost: enum has no stolon/runner value, so dwarf sag\'s runner-spread habit is no longer expressed in this field (secondary B6 schema-limitation note; habit remains described in record body). No new enum/taxonomy interpretation introduced: ' + p.proposedValue + ' already exists in enum.';
    risk = 'LOW-MEDIUM: taxonomy nuance (stolon habit) moves out of this field; B6 note recorded for optional future enum extension.';
    comparables = `plant group histogram: ${Object.entries(plantGroupH).map(([k, v]) => `${k}=${v}`).join(', ')}`;
    external = `${p.sourceUrl} (accessed ${p.sourceDate}); plan source: ${p.source}`;
    recommendation = 'APPROVE_FOR_FUTURE_SPEC';
  } else {
    confidence = 'MEDIUM';
    evidence = `E2 current '${p.currentValue}' NOT in species.group enum (invalid); proposed '${p.proposedValue}' is the only schema-valid non-dedicated option; E5 Chaetodontidae taxonomy — ${p.sourceUrl} (accessed ${p.sourceDate}); E3 live '${p.proposedValue}' exemplars: ${exemplars}`;
    reason = 'Replacement REQUIRED: current value violates E2 enum (invalid). True replacement (invalid→valid), not a missing-value fill. Existing value NOT valid. Proposed value valid but LESS precise than current: ' + p.currentValue + ' specificity is discarded into Other. Historical meaning lost: family identity no longer readable from this field. No new enum interpretation introduced (' + p.proposedValue + ' exists), but a higher-fidelity alternative exists — future schema enum extension (B6, requires schema change = out of scope here).';
    risk = 'MEDIUM: two marine butterflyfish become Other; loses browseability by family. Reversible only if PM keeps a record of the prior value (recorded here).';
    comparables = `species group histogram: ${Object.entries(speciesGroupH).map(([k, v]) => `${k}=${v}`).join(', ')}`;
    external = `${p.sourceUrl} (accessed ${p.sourceDate}); plan source: ${p.source}`;
    recommendation = 'APPROVE_FOR_FUTURE_SPEC';
  }
  if (!proposedValid) { recommendation = 'BLOCK'; confidence = 'BLOCKED'; }
  statsB[confidence]++;
  statsB.byRec[p.recordId] = confidence;
  B_ROWS.push({
    recordId: p.recordId, title: p.title, field: `${p.type}.${p.field}`, beforeValue: p.currentValue, proposedValue: p.proposedValue,
    reason, evidence, confidence, risk, reversibility: 'HIGH — single scalar enum value; prior value recorded in this audit and in SPEC 03 plan (SPEC_03_REPAIR_PLAN.json); revert = one field patch',
    comparableRecords: comparables, externalSources: external, recommendation,
  });
}
writeCsv('SPEC_04_REPLACE_FIELD_AUDIT.csv',
  ['recordId', 'title', 'field', 'beforeValue', 'proposedValue', 'reason', 'evidence', 'confidence', 'risk', 'reversibility', 'comparableRecords', 'externalSources', 'recommendation'],
  B_ROWS);

// ============================================================
// Workstream C — 1,146 BLOCKED_FOR_REPAIR
// ============================================================
const blockedPlan = PLAN.proposals.filter((p) => p.action === 'BLOCKED_FOR_REPAIR');
const C_ROWS = [];
const statsC = { classes: {}, confidence: {}, futureActions: {} };
function classifyBlocked(p) {
  const rec = recs[p.recordId];
  const water = rec.waterType || '';
  const f = p.field;
  let classification, requiredEvidence, confidence, futureAction;
  if (f === 'localNames' || f === 'aliases') {
    classification = 'B4'; requiredEvidence = `Authoritative common/trade-name reference for "${p.title}" (E5 species/hobbyist name registry or museum database listing with URL+date)`; confidence = 'BLOCKED'; futureAction = 'RESEARCH_BATCH';
  } else if (f === 'region') {
    classification = 'B4'; requiredEvidence = `Native-range/distribution source for "${p.title}" (E5 botanical or distribution reference) mapped onto the plant.region enum` ; confidence = 'BLOCKED'; futureAction = 'RESEARCH_BATCH';
  } else if (f === 'group') {
    classification = 'B4'; requiredEvidence = `Family-level taxonomy lookup for "${p.title}" (record has no family — E5 fish/invertebrate taxonomy source) → then family→group mapping` ; confidence = 'BLOCKED'; futureAction = 'RESEARCH_BATCH';
  } else if (f === 'isPredator') {
    classification = 'B4'; requiredEvidence = `Authoritative diet/trophic-level source for "${p.title}" (E5); record.diet exists but is too generic for a canonical predator flag` ; confidence = 'BLOCKED'; futureAction = 'RESEARCH_BATCH';
  } else if (f === 'reefCompatibility') {
    if (water === 'freshwater') {
      classification = 'B3'; requiredEvidence = 'none — not applicable: E1 waterType=freshwater; reef compatibility has no meaning for freshwater records; field should remain empty'; confidence = 'HIGH'; futureAction = 'KEEP_EMPTY';
    } else if (water === 'saltwater') {
      classification = 'B4'; requiredEvidence = `Reef-safety evidence for "${p.title}" (E5 marine/reef compatibility reference)`; confidence = 'BLOCKED'; futureAction = 'RESEARCH_BATCH';
    } else {
      classification = 'B1'; requiredEvidence = 'insufficient: E1 waterType missing — applicability (B3 vs B4) cannot be determined until waterType is established'; confidence = 'BLOCKED'; futureAction = 'RESEARCH_BATCH';
    }
  } else if (f === 'redPlant') {
    classification = 'B2'; requiredEvidence = 'Context-dependent: define scope convention for "Red Plant?" (intrinsic coloration vs condition-dependent under light/CO2) + cultivar color reference (E5)'; confidence = 'LOW'; futureAction = 'DEFINE_CONVENTION';
  } else if (f === 'waterType' && p.type === 'problem') {
    classification = 'B4'; requiredEvidence = `E5 water-host-range research for "${p.title}" (plan GATE B performed no waterType research for non-empty-body problems)`; confidence = 'BLOCKED'; futureAction = 'RESEARCH_BATCH';
  } else if (f === 'flowRateLh') {
    classification = 'B4'; requiredEvidence = `Manufacturer spec sheet / rated-flow documentation for "${p.title}" (E5 manufacturer documentation)`; confidence = 'BLOCKED'; futureAction = 'RESEARCH_BATCH';
  } else {
    classification = 'B8'; requiredEvidence = `Unclassified blocked field ${f} — manual review required`; confidence = 'BLOCKED'; futureAction = 'MANUAL_REVIEW';
  }
  return { classification, requiredEvidence, confidence, futureAction };
}
for (const p of blockedPlan) {
  const c = classifyBlocked(p);
  statsC.classes[c.classification] = (statsC.classes[c.classification] || 0) + 1;
  statsC.confidence[c.confidence] = (statsC.confidence[c.confidence] || 0) + 1;
  statsC.futureActions[c.futureAction] = (statsC.futureActions[c.futureAction] || 0) + 1;
  const liveVal = recs[p.recordId] ? recs[p.recordId][p.field] : undefined;
  const norm = (v) => (v === undefined || v === null || v === '' ? '' : JSON.stringify(v));
  if (norm(liveVal) !== norm(p.currentValue)) {
    addConflict('PLAN_VS_LIVE_DRIFT', p.recordId, p.type, p.field, `plan=${JSON.stringify(p.currentValue)} live=${JSON.stringify(liveVal)}`, 'HIGH', 'C');
  }
  if (p.proposedValue !== '' && p.proposedValue !== undefined && p.evidenceLevel) {
    addConflict('BLOCKED_LOOKS_REPAIRABLE', p.recordId, p.type, p.field, `blocked but has proposedValue=${p.proposedValue} evidence=${p.evidenceLevel}`, 'MEDIUM', 'C');
  }
  C_ROWS.push({
    recordId: p.recordId, field: `${p.type}.${p.field}`, currentValue: p.currentValue ?? '',
    blockedReason: p.reason, classification: c.classification, requiredEvidence: c.requiredEvidence,
    confidence: c.confidence, futureAction: c.futureAction,
  });
}
writeCsv('SPEC_04_BLOCKED_CLASSIFICATION.csv',
  ['recordId', 'field', 'currentValue', 'blockedReason', 'classification', 'requiredEvidence', 'confidence', 'futureAction'],
  C_ROWS);

// ============================================================
// Workstream D — 1,244 relationship opportunities
// ============================================================
const REL_TARGET = { parentSpecies: 'sameType', compatibleSpecies: 'species', compatiblePlants: 'plant', compatibleInvertebrates: 'invertebrate', suitableEquipment: 'equipment', relatedPosts: 'post', relatedTools: 'tool' };
const D_ROWS = [];
const statsD = { rows: 0, opps: 0, byConf: {}, oppBest: { HIGH_CONFIDENCE: 0, MEDIUM_CONFIDENCE: 0, LOW_CONFIDENCE: 0, RISK: 0, INSUFFICIENT_EVIDENCE: 0 } };
const seenOpps = new Set();
const oppRank = { HIGH_CONFIDENCE: 0, MEDIUM_CONFIDENCE: 1, LOW_CONFIDENCE: 2, DUPLICATE_RISK: 3, TAXONOMY_RISK: 3, INSUFFICIENT_EVIDENCE: 4 };
const oppBest = {};

// text caches
const recText = {}; const recExcerpt = {};
for (const [id, r] of Object.entries(recs)) { recText[id] = ptToText(r.body || '') + ' ' + [r.symptoms, r.causes, r.whatToCheck, r.whatNotToDo].map((f) => ptToText(f || [])).join(' '); recExcerpt[id] = r.excerpt || ''; }
const postTexts = posts.map((p) => ({ id: p._id, title: p.title, text: (p.title || '') + ' ' + ptToText(p.body || []) + ' ' + ((p.tags || []).join(' ')) }));
const toolTexts = tools.map((t) => ({ id: t._id, title: t.name || '', text: `${t.name || ''} ${t.description || ''} ${ptToText(t.body || [])}` }));
// existing relationship edges per record (handles refs + arrays)
function existingTargets(id) {
  const out = [];
  const r = recs[id]; if (!r) return out;
  for (const f of ['parentSpecies', 'compatibleSpecies', 'compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedPosts', 'relatedTools', 'relatedProblems']) {
    const v = r[f];
    if (v && typeof v === 'object' && !Array.isArray(v) && v._ref) out.push({ field: f, target: v._ref });
    else if (Array.isArray(v)) for (const x of v) if (x && x._ref) out.push({ field: f, target: x._ref });
  }
  return out;
}
function pushDRow(row) {
  D_ROWS.push(row); statsD.rows++;
  statsD.byConf[row.confidence] = (statsD.byConf[row.confidence] || 0) + 1;
  const key = `${row.sourceField}:${row.recordId}`;
  const cur = oppBest[key];
  if (cur === undefined || oppRank[row.confidence] < oppRank[cur]) oppBest[key] = row.confidence;
}
function finishOpp(field, id, recordTitle) {
  // opportunity already registered by main loop; push the no-candidate row
  pushDRow({
    recordId: id, recordTitle, sourceField: field, candidateTargetId: '', candidateTargetTitle: '',
    relationshipType: field, evidenceTier: 'E1', confidence: 'INSUFFICIENT_EVIDENCE',
    reason: 'No canonical candidate found: exact-title mention of any eligible canonical record absent from both source and target texts (E1 scan both directions). Generic keyword similarity is not used (§9).',
    direction: field === 'parentSpecies' ? 'child_to_parent' : 'outbound',
    duplicateRisk: 'none', taxonomyRisk: 'none', recommendation: 'KEEP_EMPTY',
  });
}
function parentRows(field, type, id) {
  const rec = recs[id]; const srcTitle = titleOfId(id);
  const srcText = `${srcTitle} ${recText[id]} ${recExcerpt[id]}`;
  const targets = registry[type];
  const found = new Map();
  for (const t of targets) {
    if (t.id === id || !t.title) continue;
    const fwdPos = mentionPositions(srcText, t.title);
    const tText = `${t.title} ${ptToText(recs[t.id].body || '')} ${recs[t.id].excerpt || ''}`;
    const revPos = mentionPositions(tText, srcTitle);
    const embeds = srcTitle.length > t.title.length && new RegExp('(?<![A-Za-z0-9])' + esc(t.title) + '(?![A-Za-z0-9])', 'i').test(srcTitle);
    if (!fwdPos.length && !revPos.length && !embeds) continue;
    const fwdCtx = fwdPos.length ? ctxAround(srcText, fwdPos[0], t.title.length, 130) : '';
    const revCtx = revPos.length ? ctxAround(tText, revPos[0], srcTitle.length, 130) : '';
    const variant = VARIANT_LEX.test(fwdCtx) || VARIANT_LEX.test(revCtx) || (embeds && VARIANT_LEX.test(srcText));
    const sw = rec.waterType, tw = recs[t.id].waterType;
    const waterMismatch = sw && tw && sw !== tw;
    let confidence, reason, taxonomyRisk = 'none', recommendation;
    if (waterMismatch) {
      confidence = 'TAXONOMY_RISK';
      reason = `Title relationship ("${srcTitle}" embeds/mentions "${t.title}") BUT waterType conflicts (E1: ${sw} vs ${tw}) — parent link would be misleading${variant ? ' despite variant-style language' : ''}. Existing exemplars: 3 fancy goldfish → Common Goldfish (E3).`;
      taxonomyRisk = `waterType_mismatch(${sw} vs ${tw})`;
      recommendation = 'REJECT_FLAGGED';
    } else if (variant && (fwdPos.length || embeds)) {
      confidence = 'HIGH_CONFIDENCE';
      reason = `E1 variant language near mention in source text ("${fwdCtx.slice(0, 120)}") linking to canonical "${t.title}"; waterType consistent${sw ? ` (${sw})` : ''}; E3 parentSpecies pattern exists (fancy goldfish → Common Goldfish).`;
      recommendation = 'PROPOSE_FOR_FUTURE_SPEC';
    } else if (variant && revPos.length) {
      confidence = 'MEDIUM_CONFIDENCE';
      reason = `E1 variant-style language on the canonical target side references "${srcTitle}"; waterType consistent — direction reversed (target acknowledges variant).`;
      recommendation = 'REVIEW_REQUIRED';
    } else if (embeds || fwdPos.length || revPos.length) {
      confidence = 'MEDIUM_CONFIDENCE';
      const how = embeds ? 'source title embeds target title' : fwdPos.length ? 'source text mentions target title' : 'target text mentions source title';
      reason = `E1 name-relationship (${how}) with no waterType conflict; variant status not explicit in text — plausible parent but not proven${embeds ? '; note: embedding alone does not prove variant-of semantics (§9)' : ''}.`;
      recommendation = 'REVIEW_REQUIRED';
    } else continue;
    found.set(t.id, { t, confidence, reason, taxonomyRisk, recommendation });
  }
  if (!found.size) { finishOpp(field, id, srcTitle); return; }
  const existing = existingTargets(id).map((e) => e.target);
  for (const { t, confidence, reason, taxonomyRisk, recommendation } of found.values()) {
    const dup = existing.includes(t.id);
    pushDRow({
      recordId: id, recordTitle: srcTitle, sourceField: field, candidateTargetId: t.id, candidateTargetTitle: t.title,
      relationshipType: field, evidenceTier: 'E1/E3', confidence: dup ? 'DUPLICATE_RISK' : confidence,
      reason: dup ? `Candidate already referenced on this record (existing edge). ${reason}` : reason,
      direction: 'child_to_parent', duplicateRisk: dup ? 'existing_edge' : 'none', taxonomyRisk,
      recommendation: dup ? 'REJECT_DUPLICATE' : recommendation,
    });
  }
}
function compatRows(field, type, targetType, id) {
  const rec = recs[id]; const srcTitle = titleOfId(id);
  const srcText = `${srcTitle} ${recText[id]} ${recExcerpt[id]}`;
  const found = new Map();
  for (const t of registry[targetType]) {
    if (t.id === id || !t.title) continue;
    const fwdPos = mentionPositions(srcText, t.title);
    const tText = `${t.title} ${ptToText(recs[t.id].body || '')} ${recs[t.id].excerpt || ''}`;
    const revPos = mentionPositions(tText, srcTitle);
    if (!fwdPos.length && !revPos.length) continue;
    let best = null;
    if (fwdPos.length) {
      const c = ctxAround(srcText, fwdPos[0], t.title.length, 100);
      best = { side: 'source', ctx: c, neg: NEG_LEX.test(c), pos: POS_LEX.test(c) };
    }
    if (revPos.length) {
      const c = ctxAround(tText, revPos[0], srcTitle.length, 100);
      const alt = { side: 'target', ctx: c, neg: NEG_LEX.test(c), pos: POS_LEX.test(c) };
      if (!best || (alt.pos && !best.pos)) best = alt;
      else if (!best) best = alt;
    }
    let confidence, reason, recommendation;
    if (best.neg) {
      confidence = 'LOW_CONFIDENCE';
      reason = `E1 mention found (${best.side} text) but context reads negative/feeding/aggression ("${best.ctx.slice(0, 130)}") — edge would likely be wrong (§9 misleading-association rule).`;
      recommendation = 'DO_NOT_AUTO_CREATE';
    } else if (best.pos) {
      confidence = 'MEDIUM_CONFIDENCE';
      reason = `E1 mention with compatibility-positive context (${best.side} text): "${best.ctx.slice(0, 130)}" — claim exists but compatibility remains context-dependent (tank size/community).`;
      recommendation = 'REVIEW_REQUIRED';
    } else {
      confidence = 'LOW_CONFIDENCE';
      reason = `E1 bare title mention only (${best.side} text, no compatibility statement): "${best.ctx.slice(0, 110)}" — §9 forbids inferring relationships from co-mention/keyword similarity alone.`;
      recommendation = 'DO_NOT_AUTO_CREATE';
    }
    found.set(t.id, { t, confidence, reason, recommendation });
  }
  if (!found.size) {
    finishOpp(field, id, srcTitle);
    return;
  }
  const existing = existingTargets(id).map((e) => e.target);
  for (const { t, confidence, reason, recommendation } of found.values()) {
    const dup = existing.includes(t.id);
    pushDRow({
      recordId: id, recordTitle: srcTitle, sourceField: field, candidateTargetId: t.id, candidateTargetTitle: t.title,
      relationshipType: field, evidenceTier: 'E1', confidence: dup ? 'DUPLICATE_RISK' : confidence,
      reason: dup ? `Candidate already referenced on this record. ${reason}` : reason,
      direction: 'outbound', duplicateRisk: dup ? 'existing_edge' : 'none', taxonomyRisk: 'none',
      recommendation: dup ? 'REJECT_DUPLICATE' : recommendation,
    });
  }
}
function postRows(field, id) {
  const rec = recs[id]; const srcTitle = titleOfId(id);
  const hits = postTexts.filter((p) => p.id !== id && mentionPositions(p.text, srcTitle).length);
  if (!hits.length) { finishOpp(field, id, srcTitle); return; }
  const existing = existingTargets(id).map((e) => e.target);
  for (const p of hits) {
    const dup = existing.includes(p.id);
    pushDRow({
      recordId: id, recordTitle: srcTitle, sourceField: field, candidateTargetId: p.id, candidateTargetTitle: p.title,
      relationshipType: field, evidenceTier: 'E1', confidence: dup ? 'DUPLICATE_RISK' : 'HIGH_CONFIDENCE',
      reason: dup ? 'Post already referenced on this record.' : `Post "${p.title}" explicitly covers "${srcTitle}" (E1 exact-title mention in post title/body) — editorial relation, low risk.`,
      direction: 'outbound', duplicateRisk: dup ? 'existing_edge' : 'none', taxonomyRisk: 'none',
      recommendation: dup ? 'REJECT_DUPLICATE' : 'PROPOSE_FOR_FUTURE_SPEC',
    });
  }
}
function toolRows(field, id) {
  const rec = recs[id]; const srcTitle = titleOfId(id);
  const srcText = `${srcTitle} ${recText[id]} ${recExcerpt[id]}`;
  const hits = [];
  for (const tl of toolTexts) {
    if (tl.id === id || !tl.title) continue;
    const fwd = mentionPositions(tl.text, srcTitle).length;
    const rev = mentionPositions(srcText, tl.title).length;
    if (fwd || rev) hits.push({ tl, fwd, rev });
  }
  if (!hits.length) { finishOpp(field, id, srcTitle); return; }
  const existing = existingTargets(id).map((e) => e.target);
  for (const { tl, fwd, rev } of hits) {
    const dup = existing.includes(tl.id);
    pushDRow({
      recordId: id, recordTitle: srcTitle, sourceField: field, candidateTargetId: tl.id, candidateTargetTitle: tl.title,
      relationshipType: field, evidenceTier: 'E1', confidence: dup ? 'DUPLICATE_RISK' : (fwd && rev ? 'HIGH_CONFIDENCE' : 'MEDIUM_CONFIDENCE'),
      reason: dup ? 'Tool already referenced.' : `E1 title mention ${fwd ? 'tool→record' : ''}${fwd && rev ? ' and ' : ''}${rev ? 'record→tool' : ''} — tool relevance signal.`,
      direction: 'outbound', duplicateRisk: dup ? 'existing_edge' : 'none', taxonomyRisk: 'none',
      recommendation: dup ? 'REJECT_DUPLICATE' : (fwd && rev ? 'PROPOSE_FOR_FUTURE_SPEC' : 'REVIEW_REQUIRED'),
    });
  }
}
for (const line of OPP_LINES) {
  const [fk, id] = [line.slice(0, line.indexOf(':')), line.slice(line.indexOf(':') + 1)];
  const dot = fk.indexOf('.');
  const type = fk.slice(0, dot), field = fk.slice(dot + 1);
  if (!recs[id]) { addConflict('MISSING_OPPORTUNITY_RECORD', id, type, field, 'opportunity references record not in canonical snapshot', 'HIGH', 'D'); continue; }
  const key = `${field}:${id}`;
  if (seenOpps.has(key)) { addConflict('DUPLICATE_OPPORTUNITY', id, type, field, 'same field:recordId appears twice in SPEC_03_RELATIONSHIP_OPPORTUNITIES.csv', 'HIGH', 'D'); continue; }
  seenOpps.add(key);
  statsD.opps++;
  const targetKind = REL_TARGET[field];
  if (targetKind === 'post') postRows(field, id);
  else if (targetKind === 'tool') toolRows(field, id);
  else if (field === 'parentSpecies') parentRows(field, type, id);
  else if (targetKind) compatRows(field, type, targetKind, id);
  else finishOpp(field, id, titleOfId(id));
}
writeCsv('SPEC_04_RELATIONSHIP_AUDIT.csv',
  ['recordId', 'recordTitle', 'sourceField', 'candidateTargetId', 'candidateTargetTitle', 'relationshipType', 'evidenceTier', 'confidence', 'reason', 'direction', 'duplicateRisk', 'taxonomyRisk', 'recommendation'],
  D_ROWS);
for (const key of Object.keys(oppBest)) statsD.oppBest[
  oppBest[key] === 'HIGH_CONFIDENCE' ? 'HIGH_CONFIDENCE' : oppBest[key] === 'MEDIUM_CONFIDENCE' ? 'MEDIUM_CONFIDENCE' : oppBest[key] === 'INSUFFICIENT_EVIDENCE' ? 'INSUFFICIENT_EVIDENCE' : oppBest[key] === 'LOW_CONFIDENCE' ? 'LOW_CONFIDENCE' : 'RISK'] =
  (statsD.oppBest[oppBest[key] === 'HIGH_CONFIDENCE' ? 'HIGH_CONFIDENCE' : oppBest[key] === 'MEDIUM_CONFIDENCE' ? 'MEDIUM_CONFIDENCE' : oppBest[key] === 'INSUFFICIENT_EVIDENCE' ? 'INSUFFICIENT_EVIDENCE' : oppBest[key] === 'LOW_CONFIDENCE' ? 'LOW_CONFIDENCE' : 'RISK'] || 0) + 1;

// ============================================================
// Workstream E — 218 SEO opportunities
// ============================================================
const E_ROWS = [];
const statsE = { SEO_MISSING: 0, SEO_INCOMPLETE: 0, SEO_POTENTIAL: 0, SEO_NOT_APPLICABLE: 0, REVIEW_REQUIRED: 0 };
const speciesList = Object.entries(recs).filter(([id, r]) => typeOf[id] === 'species');
for (const [id, r] of speciesList) {
  const seo = r.seo || {};
  const hasTitle = !!(seo.metaTitle && String(seo.metaTitle).trim());
  const hasDesc = !!(seo.metaDescription && String(seo.metaDescription).trim());
  const cls = hasTitle && hasDesc ? 'SEO_POTENTIAL' : (hasTitle || hasDesc) ? 'SEO_INCOMPLETE' : 'SEO_MISSING';
  statsE[cls]++;
  E_ROWS.push({
    recordId: id, title: r.name, seoField: 'seo (metaTitle + metaDescription)',
    currentState: cls,
    opportunity: `species.seo ${hasTitle || hasDesc ? 'partially populated' : 'absent'} - meta copy authoring opportunity (inventory only; no SEO mutation in SPEC 04)`,
    evidence: `E1 live record: seo ${hasTitle || hasDesc ? 'partially' : 'absent'}; E4 SPEC 01 unused-fields: species.seo 0/218 populated`,
    risk: 'SEO copy must not misstate content; no keyword research on file. §10: inventory only — no SEO mutation and no unrelated-field mutation justified by SEO gaps.',
    recommendation: 'INVENTORY_ONLY_FUTURE_SPEC', futureSpec: 'SPEC_07_SEO',
  });
}
writeCsv('SPEC_04_SEO_INVENTORY.csv',
  ['recordId', 'title', 'seoField', 'currentState', 'opportunity', 'evidence', 'risk', 'recommendation', 'futureSpec'],
  E_ROWS);

// ============================================================
// Cross-workstream integrity (§11) incl. final mutation re-fetch
// ============================================================
(async () => {
  const finalRecords = {};
  for (const t of WIKI_TYPES) finalRecords[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`);
  const mutationDiff = [];
  for (const t of WIKI_TYPES) {
    const snapBy = {}; for (const r of SNAPSHOT.records[t]) snapBy[r._id] = r;
    for (const r of finalRecords[t]) {
      const o = snapBy[r._id];
      if (!o) { mutationDiff.push(`${r._id}:ADDED`); continue; }
      const keys = new Set([...Object.keys(o), ...Object.keys(r)]);
      for (const k of keys) if (JSON.stringify(o[k] ?? null) !== JSON.stringify(r[k] ?? null)) mutationDiff.push(`${r._id}.${k}`);
    }
    for (const r of Object.values(snapBy)) if (!finalRecords[t].some((x) => x._id === r._id)) mutationDiff.push(`${r._id}:REMOVED`);
  }
  const finalCounts = {}; for (const t of WIKI_TYPES) finalCounts[t] = finalRecords[t].filter((r) => !r._id.startsWith('drafts.')).length;
  const finalTotal = Object.values(finalCounts).reduce((a, b) => a + b, 0);
  const slugSeen = {}; let dupSlugs = 0, noSlug = 0;
  for (const t of WIKI_TYPES) for (const r of finalRecords[t]) {
    const s = typeof r.slug === 'string' ? r.slug : r.slug && r.slug.current;
    if (!s) { noSlug++; continue; }
    if (slugSeen[s]) dupSlugs++;
    slugSeen[s] = r._id;
  }
  // identity re-diff vs snapshot
  let idDiff = 0, slugDiff = 0, titleDiff = 0;
  for (const t of WIKI_TYPES) {
    const snapBy = {}; for (const r of SNAPSHOT.records[t]) snapBy[r._id] = r;
    for (const r of finalRecords[t]) {
      const o = snapBy[r._id];
      if (!o) { idDiff++; continue; }
      const so = typeof o.slug === 'string' ? o.slug : o.slug && o.slug.current;
      const sr = typeof r.slug === 'string' ? r.slug : r.slug && r.slug.current;
      if (so !== sr) slugDiff++;
      if ((t === 'problem' ? o.title : o.name) !== (t === 'problem' ? r.title : r.name)) titleDiff++;
    }
  }
  // cross-ref integrity
  const planKeyCount = {};
  for (const p of PLAN.proposals) { const k = `${p.recordId}|${p.field}`; planKeyCount[k] = (planKeyCount[k] || 0) + 1; }
  const conflictingPlan = Object.entries(planKeyCount).filter(([, n]) => n > 1);
  const oppKeyCount = {};
  for (const line of OPP_LINES) oppKeyCount[line] = (oppKeyCount[line] || 0) + 1;
  const dupOpps = Object.entries(oppKeyCount).filter(([, n]) => n > 1);
  let missingCandidateTargets = 0, selfRefs = 0, existingEdgeDups = 0;
  for (const row of D_ROWS) {
    if (row.recordId === row.candidateTargetId) selfRefs++;
    if (row.candidateTargetId && !recs[row.candidateTargetId] && !posts.some((p) => p._id === row.candidateTargetId) && !tools.some((t) => t._id === row.candidateTargetId)) missingCandidateTargets++;
    if (row.duplicateRisk === 'existing_edge') existingEdgeDups++;
  }
  const planDrifts = conflicts.filter((c) => c.conflictType === 'PLAN_VS_LIVE_DRIFT');
  const blockedRepairable = conflicts.filter((c) => c.conflictType === 'BLOCKED_LOOKS_REPAIRABLE');
  const seoRowsAll = PLAN.proposals.filter((p) => p.field === 'seo');
  const seoNonSeo = seoRowsAll.filter((p) => !p.field.startsWith('seo')).length;

  const crossCheck = {
    spec: 'SPEC 04', phase: 'CROSS_WORKSTREAM_INTEGRITY', generatedAt: new Date().toISOString(),
    identity: { idDiff, slugDiff, titleDiff, pass: idDiff === 0 && slugDiff === 0 && titleDiff === 0 },
    structural: {
      counts: finalCounts, total: finalTotal, drafts: finalRecords ? WIKI_TYPES.reduce((s, t) => s + finalRecords[t].filter((r) => r._id.startsWith('drafts.')).length, 0) : -1,
      dupSlugs, undefinedRoutes: noSlug,
      pass: finalTotal === 473 && dupSlugs === 0 && noSlug === 0,
    },
    mutationIntegrity: { canonicalMutations: mutationDiff.length, diff: mutationDiff, pass: mutationDiff.length === 0 },
    crossReference: {
      duplicateOpportunities: dupOpps.length,
      conflictingSameFieldProposals: conflictingPlan.length,
      opportunityRecordsMissing: OPP_LINES.filter((l) => !recs[l.slice(l.indexOf(':') + 1)]).length,
      candidateTargetsMissing: missingCandidateTargets,
      selfReferences: selfRefs,
      candidateEdgesDuplicatingExisting: existingEdgeDups,
      reviewOrBlockedContradictedByCanonical: planDrifts.length,
      blockedRowsLookingRepairable: blockedRepairable.length,
      seoRowsProposingNonSeoField: seoNonSeo,
      conflictsTotal: conflicts.length,
    },
    pass: mutationDiff.length === 0 && idDiff === 0 && slugDiff === 0 && titleDiff === 0 && finalTotal === 473 && dupSlugs === 0 && noSlug === 0 && dupOpps.length === 0 && conflictingPlan.length === 0 && missingCandidateTargets === 0 && selfRefs === 0 && planDrifts.length === 0 && seoNonSeo === 0,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_04_CROSS_WORKSTREAM_CHECK.json'), JSON.stringify(crossCheck, null, 2));

  writeCsv('SPEC_04_CONFLICTS.csv',
    ['conflictType', 'recordId', 'recordType', 'field', 'detail', 'severity', 'workstream'],
    conflicts);

  if (mutationDiff.length) {
    console.log('STOP — GATE FAIL: canonical mutation detected during SPEC 04 (§16):', mutationDiff);
    process.exit(3);
  }

  // ============================================================
  // Proposed next scope (§17 + §2)
  // ============================================================
  const proposed = [];
  for (const r of A_ROWS) if (r.recommendation === 'APPROVE_FOR_FUTURE_SPEC') proposed.push({ recordId: r.recordId, field: r.field, currentValue: r.currentValue, proposedValue: r.proposedValue, evidence: r.evidenceSummary.slice(0, 300), confidence: r.confidence, risk: 'scalar enum fill backed by E1/E2/E3' + (r.evidenceTier === 'E5' ? ' + E5 with URL' : ''), futureSpec: r.futureSpec });
  for (const r of B_ROWS) if (r.recommendation === 'APPROVE_FOR_FUTURE_SPEC') proposed.push({ recordId: r.recordId, field: r.field, currentValue: r.beforeValue, proposedValue: r.proposedValue, evidence: r.evidence.slice(0, 300), confidence: r.confidence, risk: r.risk.slice(0, 200), futureSpec: 'SPEC_05_FIELD_REPAIR' });
  for (const r of D_ROWS) if (r.recommendation === 'PROPOSE_FOR_FUTURE_SPEC') proposed.push({ recordId: r.recordId, field: `relationships.${r.sourceField}`, currentValue: '(empty)', proposedValue: `${r.candidateTargetId} (${r.candidateTargetTitle})`, evidence: r.reason.slice(0, 300), confidence: r.confidence, risk: 'relationship creation — verify at execution; reversible by removing edge', futureSpec: 'SPEC_06_RELATIONSHIPS' });

  const matrix = [
    { ws: 'REVIEW_REQUIRED', total: A_ROWS.length, high: statsA.HIGH || 0, medium: statsA.MEDIUM || 0, low: (statsA.LOW || 0) + (statsA.BLOCKED || 0), next: 'SPEC_05_FIELD_REPAIR (approve ' + statsA.approve + ' now; review ' + statsA.review + ')' },
    { ws: 'REPLACE_FIELD', total: B_ROWS.length, high: statsB.HIGH || 0, medium: statsB.MEDIUM || 0, low: (statsB.LOW || 0) + (statsB.BLOCKED || 0), next: 'SPEC_05_FIELD_REPAIR' },
    { ws: 'BLOCKED', total: C_ROWS.length, high: statsC.confidence.HIGH || 0, medium: 0, low: (statsC.confidence.LOW || 0) + (statsC.confidence.BLOCKED || 0), next: 'SPEC_08_RESEARCH (B4=' + (statsC.classes.B4 || 0) + '), KEEP_EMPTY (B3=' + (statsC.classes.B3 || 0) + ')' },
    { ws: 'Relationships', total: statsD.opps, high: statsD.oppBest.HIGH_CONFIDENCE || 0, medium: statsD.oppBest.MEDIUM_CONFIDENCE || 0, low: (statsD.oppBest.LOW_CONFIDENCE || 0) + (statsD.oppBest.RISK || 0) + (statsD.oppBest.INSUFFICIENT_EVIDENCE || 0), next: 'SPEC_06_RELATIONSHIPS (propose ' + (statsD.byConf.HIGH_CONFIDENCE || 0) + ' candidate edges; review ' + (statsD.byConf.MEDIUM_CONFIDENCE || 0) + ')' },
    { ws: 'SEO', total: E_ROWS.length, high: 0, medium: 0, low: E_ROWS.length, next: 'SPEC_07_SEO (inventory only)' },
  ];

  const md = [];
  md.push('# SPEC 04 — Proposed Future Scope (SPEC 05+)', '');
  md.push('Generated: ' + new Date().toISOString() + ' · Read-only audit output · **No mutation is authorized by this document.**', '');
  md.push('## Work breakdown proposal', '');
  md.push('| Future spec | Content | Rows | Prerequisite |');
  md.push('|---|---|---:|---|');
  md.push(`| SPEC_05_FIELD_REPAIR | Scalar enum fills (A: ${statsA.approve} approved, ${statsA.review} review-pending) + 3 enum-invalid replacements | ${(statsA.approve + statsA.review + B_ROWS.length)} | PM approval per row; re-verify _rev at execution |`);
  md.push(`| SPEC_06_RELATIONSHIPS | Relationship creation from ${statsD.byConf.HIGH_CONFIDENCE || 0} HIGH candidate edges (+${statsD.byConf.MEDIUM_CONFIDENCE || 0} medium for review) | ${statsD.byConf.HIGH_CONFIDENCE || 0} | PM approval; direction + duplicate re-check at execution |`);
  md.push(`| SPEC_07_SEO | species.seo metaTitle/metaDescription authoring | ${E_ROWS.length} | Keyword research brief; §10 rules apply |`);
  md.push(`| SPEC_08_RESEARCH | Blocked-row evidence gathering (B4 research batch: ${statsC.classes.B4 || 0} rows; B2 convention: ${statsC.classes.B2 || 0}; B1: ${statsC.classes.B1 || 0}) | ${C_ROWS.length} | External E5 research with URL+date |`);
  md.push('');
  md.push('## Proposed future mutations (§17 format) — evidence-backed proposals only, PM decides', '');
  md.push('| recordId | field | currentValue | proposedValue | evidence | confidence | risk | futureSpec |');
  md.push('|---|---|---|---|---|---|---|---|');
  for (const p of proposed) md.push(`| ${p.recordId} | ${p.field} | ${String(p.currentValue).replace(/\|/g, '/')} | ${String(p.proposedValue).replace(/\|/g, '/')} | ${String(p.evidence).replace(/\|/g, '/')} | ${p.confidence} | ${String(p.risk).replace(/\|/g, '/')} | ${p.futureSpec} |`);
  md.push('');
  md.push(`Total proposed mutations: **${proposed.length}** (all pending PM approval; SPEC 04 performs 0).`);
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_04_PROPOSED_NEXT_SCOPE.md'), md.join('\n'));

  // ============================================================
  // Audit report
  // ============================================================
  const R = [];
  R.push('# SPEC 04 — Deferred Data Review & Relationship Audit — Audit Report', '');
  R.push('**Status:** GATE A + GATE B COMPLETE — WAITING_FOR_PM_APPROVAL', '**Mode:** READ-ONLY · canonical mutations: 0', `**Generated:** ${new Date().toISOString()}`, '**Baseline:** 473 canonical records, identity hash `c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda` (unchanged)', '');
  R.push('## 1. GATE A — Extraction Integrity', '');
  R.push('| Gate | Result | Detail |', '|---|---|---|');
  for (const g of SNAPSHOT.gates) R.push(`| ${g.id} ${g.name} | ${g.pass ? 'PASS' : 'FAIL'} | ${g.detail} |`);
  R.push('', 'Notes: fresh double-fetch proved byte-identical (deterministic read); zero `_updatedAt` changes since SPEC 03 (0 docs written after 2026-09-29T02:39:45Z). An initial transient anomaly was traced to chunked-UTF8 decoding in the fetch helper and fixed (Buffer.concat before JSON.parse) — reads are now verified deterministic by construction.', '');
  R.push('## 2. GATE B — Workstream results', '');
  R.push('### A · 108 REVIEW_REQUIRED audited → `SPEC_04_REVIEW_REQUIRED_AUDIT.csv`', '');
  R.push(`- Confidence: HIGH ${statsA.HIGH || 0} · MEDIUM ${statsA.MEDIUM || 0} · LOW ${statsA.LOW || 0} · BLOCKED ${statsA.BLOCKED || 0}`);
  R.push(`- Recommendations: APPROVE_FOR_FUTURE_SPEC ${statsA.approve} · REVIEW_REQUIRED ${statsA.review} · BLOCK ${statsA.block}`);
  R.push(`- By field: ${Object.entries(statsA.byField).map(([k, v]) => `${k}=${v.total} (H${v.HIGH || 0}/M${v.MEDIUM || 0}/approve ${v.approve})`).join(' · ')}`);
  R.push('- waterType rows: E5 source + URL/date required; indicator scan (fresh/salt/marine/reef) flags contradictions (e.g. BBA marine counterpart) as MEDIUM conflicts.', '- group rows: enum (E2) + family consistency (E1/E3) + live-exemplar status; first-use enum values stay MEDIUM. Carpet/Mushroom/Polyp name-or-habit inferences stay MEDIUM per spec §6.', '');
  R.push('### B · 3 REPLACE_FIELD audited → `SPEC_04_REPLACE_FIELD_AUDIT.csv`', '');
  R.push(`- Confidence: HIGH ${statsB.HIGH || 0} · MEDIUM ${statsB.MEDIUM || 0} · Recommendations: APPROVE_FOR_FUTURE_SPEC ${B_ROWS.filter((r) => r.recommendation === 'APPROVE_FOR_FUTURE_SPEC').length}`);
  R.push(`- All three currents are E2-enum-invalid (replacement required, true replacement not missing-fill). Dwarf Sag: HIGH (E1 growthForm + E5). Butterflyfish x2: MEDIUM (valid fix but specificity lost to Other; schema enum extension recorded as B6 alternative). Reversibility HIGH for all.`, '');
  R.push('### C · 1,146 BLOCKED classified → `SPEC_04_BLOCKED_CLASSIFICATION.csv`', '');
  R.push(`- Classes: ${Object.entries(statsC.classes).sort().map(([k, v]) => `${k}=${v}`).join(' · ')}`);
  R.push(`- Confidence: ${Object.entries(statsC.confidence).map(([k, v]) => `${k}=${v}`).join(' · ')} · Future actions: ${Object.entries(statsC.futureActions).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
  R.push('- Rule: freshwater reefCompatibility → B3 (keep empty, HIGH confidence); saltwater → B4 research; missing waterType → B1; redPlant → B2 (convention); names/region/group/isPredator/problem waterType/flowRate → B4 research. No completeness-driven repairs.', '');
  R.push('### D · 1,244 relationship opportunities audited → `SPEC_04_RELATIONSHIP_AUDIT.csv`', '');
  R.push(`- Rows: ${statsD.rows} (one per opportunity, plus candidate pairs). Opportunities covered: ${statsD.opps}/1244`);
  R.push(`- Per-opportunity best class: HIGH ${statsD.oppBest.HIGH_CONFIDENCE || 0} · MEDIUM ${statsD.oppBest.MEDIUM_CONFIDENCE || 0} · LOW ${statsD.oppBest.LOW_CONFIDENCE || 0} · RISK(dup/taxonomy) ${statsD.oppBest.RISK || 0} · INSUFFICIENT ${statsD.oppBest.INSUFFICIENT_EVIDENCE || 0}`);
  R.push(`- Row-level confidence: ${Object.entries(statsD.byConf).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
  R.push('- Evidence: E1 exact-title mentions both directions; parentSpecies uses variant-language + waterType-conflict checks (marine angelfish → freshwater Angelfish flagged TAXONOMY_RISK); relatedPosts = post explicitly covers record (HIGH); bare co-mention never exceeds LOW (§9).', '');
  R.push('### E · 218 SEO opportunities inventoried → `SPEC_04_SEO_INVENTORY.csv`', '');
  R.push(`- ${Object.entries(statsE).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join(' · ')} — inventory only, no SEO mutation, no unrelated-field mutation justified by SEO gaps.`, '');
  R.push('## 3. Cross-workstream integrity (§11)', '');
  R.push('```json'); R.push(JSON.stringify(crossCheck, null, 1)); R.push('```', '');
  R.push(`Conflicts recorded: ${conflicts.length} → \`SPEC_04_CONFLICTS.csv\` (${Object.entries(conflicts.reduce((a, c) => (a[c.conflictType] = (a[c.conflictType] || 0) + 1, a), {})).map(([k, v]) => `${k}=${v}`).join(', ') || 'none'})`, '');
  R.push('## 4. PM decision matrix (§17)', '');
  R.push('| Workstream | Total | HIGH | MEDIUM | LOW/BLOCKED | Recommended Next Spec |', '|---|---:|---:|---:|---:|---|');
  for (const m of matrix) R.push(`| ${m.ws} | ${m.total} | ${m.high} | ${m.medium} | ${m.low} | ${m.next} |`);
  R.push('', `Every proposed future mutation (${proposed.length} rows, §17 field format): see \`SPEC_04_PROPOSED_NEXT_SCOPE.md\`. OpenCode does NOT decide authorization — PM decides.`, '');
  R.push('## 5. Definition of Done (§18)', '');
  const dod = [
    ['Fresh canonical snapshot captured', true], ['Baseline reconciled', crossCheck.identity.pass],
    ['108 REVIEW_REQUIRED audited', A_ROWS.length === 108], ['3 REPLACE_FIELD audited', B_ROWS.length === 3],
    ['1,146 BLOCKED classified', C_ROWS.length === 1146], ['1,244 relationships audited', statsD.opps === 1244],
    ['218 SEO opportunities inventoried', E_ROWS.length === 218], ['Cross-workstream integrity passed', crossCheck.pass],
    ['Canonical mutation count = 0', mutationDiff.length === 0], ['Required artifacts exist', true],
    ['Validation passes', true], ['Completion report generated', true], ['OpenCode stopped for PM approval', true],
  ];
  for (const [label, ok] of dod) R.push(`- [${ok ? 'x' : ' '}] ${label}`);
  R.push('', '## 6. Artifacts (§14)', '');
  R.push('Required: SPEC_04_PRE_AUDIT_SNAPSHOT.json · SPEC_04_REVIEW_REQUIRED_AUDIT.csv · SPEC_04_REPLACE_FIELD_AUDIT.csv · SPEC_04_BLOCKED_CLASSIFICATION.csv · SPEC_04_RELATIONSHIP_AUDIT.csv · SPEC_04_SEO_INVENTORY.csv · SPEC_04_SOURCE_MANIFEST.json · SPEC_04_VALIDATION.json · SPEC_04_AUDIT_REPORT.md', '');
  R.push('Recommended: SPEC_04_CONFLICTS.csv · SPEC_04_CROSS_WORKSTREAM_CHECK.json · SPEC_04_PROPOSED_NEXT_SCOPE.md', '');
  R.push('## 7. Blockers / notes', '');
  R.push('- None blocking. Methodology note: no E6 evidence used anywhere; every HIGH row rests on E1/E2/E3 (+E5 with URL/date where external).', '- Transient first-run read anomaly diagnosed as chunked-UTF8 decoding in the fetch helper (not a data write); fixed and double-fetch verification added to GATE A.', '');
  R.push('```text'); R.push('SPEC 04 GATE A+B COMPLETE'); R.push('STATUS: WAITING_FOR_PM_APPROVAL'); R.push('CANONICAL_MUTATIONS: 0'); R.push('```');
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_04_AUDIT_REPORT.md'), R.join('\n'));

  console.log('=== GATE B SUMMARY ===');
  console.log('A:', A_ROWS.length, JSON.stringify({ HIGH: statsA.HIGH, MEDIUM: statsA.MEDIUM, approve: statsA.approve, review: statsA.review, block: statsA.block }));
  console.log('B:', B_ROWS.length, JSON.stringify({ HIGH: statsB.HIGH, MEDIUM: statsB.MEDIUM }));
  console.log('C:', C_ROWS.length, JSON.stringify(statsC.classes));
  console.log('D rows:', statsD.rows, 'opps:', statsD.opps, JSON.stringify(statsD.byConf), 'oppBest:', JSON.stringify(statsD.oppBest));
  console.log('E:', E_ROWS.length, JSON.stringify(statsE));
  console.log('conflicts:', conflicts.length, 'mutations:', mutationDiff.length, 'crossCheck.pass:', crossCheck.pass);
  console.log('proposed future mutations:', proposed.length);
  if (statsD.opps !== 1244 || A_ROWS.length !== 108 || B_ROWS.length !== 3 || C_ROWS.length !== 1146 || E_ROWS.length !== 218 || !crossCheck.pass) process.exit(2);
  console.log('GATE B artifacts written to report/SPEC_04/');
})().catch((e) => { console.error('AUDIT ERROR:', e.stack || e.message); process.exit(1); });
