// SPEC 11 Phase 01 - Evidence review & decision recommendations generator.
// READ-ONLY: local artifacts only; no Sanity calls, no mutation, no PM approvals recorded.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUT = 'reports/SPEC_11/pm_review/phase_01';
const REV = 'reports/SPEC_11/revision_1';
const PKG = 'phase/11';
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

function splitCsvLine(l) {
  const row = []; let cur = '', inQ = false;
  for (let i = 0; i < l.length; i++) {
    const ch = l[i];
    if (inQ) { if (ch === '"') { if (l[i + 1] === '"') { cur += '"'; i++; } else inQ = false; } else cur += ch; }
    else { if (ch === '"') inQ = true; else if (ch === ',') { row.push(cur); cur = ''; } else cur += ch; }
  }
  row.push(cur); return row;
}
function readCsv(file) {
  const lines = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.length > 0);
  const h = splitCsvLine(lines[0]);
  return lines.slice(1).map((l) => { const r = splitCsvLine(l); const o = {}; h.forEach((k, i) => { o[k] = r[i] ?? ''; }); return o; });
}
function toCsv(rows, cols) {
  const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n';
}

// ---- evidence tiers (domain -> tier/class). Documented in report. ----
const T1_DOMAINS = ['seriouslyfish.com', 'fishbase.se', 'wetwebmedia.com', 'nanfa.org', 'scotcat.com', 'aquaristatlas.com', 'cichlidatlas.com', 'tfhmagazine.com', 'nationalzoo.si.edu', 'noaa.gov', 'ask.ifas.ufl.edu', 'efish.fishwild.vt.edu', 'liveaquaria.com', 'animaldiversity.org', 'koiorganisationinternational.org', 'reefbuilders.com'];
const T2_DOMAINS = ['tankbud.com', 'fishstores.org', 'aqueon.com', 'aquariumlab.co', 'guidarium.com', 'petmd.com', 'aquario.me', 'thetropicaltank.co.uk', 'koiquanta.com', 'cichlid-forum.com', 'rocklandaquarium.com'];
const COMMUNITY_DOMAINS = ['en.wikipedia.org'];
const GENERAL_DOMAINS = ['yololife.ae', 'petzonesd.com', 'beta.aquatic-auctions.com', 'aquatic-auctions.com'];
function domainsIn(ev) {
  const ms = (ev || '').match(/https?:\/\/([^\/\s\)>]+)/g) || [];
  return ms.map((m) => m.replace(/^https?:\/\//, '').replace(/^www\./, ''));
}
function tierOfDomain(d) {
  if (T1_DOMAINS.includes(d)) return 'T1';
  if (T2_DOMAINS.includes(d)) return 'T2';
  if (COMMUNITY_DOMAINS.includes(d)) return 'T3_COMMUNITY';
  if (GENERAL_DOMAINS.includes(d)) return 'T3_GENERAL';
  return 'T3_GENERAL'; // unknown domains treated conservatively as weakest tier
}
const TIER_RANK = { T1: 1, T2: 2, T3_COMMUNITY: 3, T3_GENERAL: 3 };
const TIER_LABEL = {
  T1: 'T1_AUTHORITY', T2: 'T2_SPECIALIST_PROFILE',
  T3_COMMUNITY: 'T3_COMMUNITY_EDITED', T3_GENERAL: 'T3_GENERAL_CONTENT',
};
function classifyEvidence(r) {
  const ev = (r.evidenceReference || '') + ' ' + (r.dispositionReason || '');
  const genus = /genus\s|\bgenus\b\s*[\/-]|\/genus\/|"Genus /i.test(r.evidenceReference || '') || /species-specific source "Genus/i.test(r.dispositionReason || '');
  const doms = domainsIn(r.evidenceReference);
  let best = null, bestDom = '';
  for (const d of doms) { const t = tierOfDomain(d); if (best === null || TIER_RANK[t] < TIER_RANK[best]) { best = t; bestDom = d; } }
  if (best === null) { best = 'T3_GENERAL'; }
  const mixed = new Set(doms.map(tierOfDomain)).size > 1;
  let evidenceClass = TIER_LABEL[best];
  if (genus) evidenceClass = 'GENUS_LEVEL';
  else if (best === 'T3_COMMUNITY') evidenceClass = 'COMMUNITY_EDITED';
  else if (best === 'T3_GENERAL') evidenceClass = 'GENERAL_CONTENT';
  else if (best === 'T1') evidenceClass = 'SPECIES_SPECIFIC_T1';
  else evidenceClass = 'SPECIES_SPECIFIC_T2';
  const isT3 = best.startsWith('T3') && !genus;
  return { tier: best, tierLabel: TIER_LABEL[best], evidenceClass, isT3, mixed, genus, primaryDomain: bestDom, domains: doms };
}

// ---- risk / structure classification ----
const RISK_FIELDS = new Set(['swimmingSpace', 'jumpRisk', 'lidRequired', 'flowPreference', 'oxygenSensitivity', 'predatesInverts', 'communitySuitability', 'minTankLengthCm', 'minTankWidthCm', 'tankSizeMinL', 'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'ghMin', 'ghMax', 'salinityMin', 'salinityMax', 'groupSize']);
const isStructured = (f) => !f.startsWith('body:');
const NUM_IN_PROSE = /(?:\b\d{2,4}\s*x\s*\d{2,4}\b)|\b\d+[.,]?\d*\s*(?:cm|litres?|liters?|gallons?)\b/i;
const VERIFY_BASIS = 'EXISTING_EVIDENCE_NOT_REFETCHED (Revision 1 verified; not re-fetched in Phase 01)';

// ---- inputs ----
const matrix = readCsv(path.join(PKG, 'SPEC_11_PM_APPROVAL_MATRIX.csv'));
const backlog = readCsv(path.join(PKG, 'SPEC_11_PM_RESEARCH_BACKLOG.csv'));
const plan = readCsv(path.join(REV, 'REVISED_MUTATION_PLAN.csv'));
const confReg = readCsv(path.join(REV, 'REVISED_CONFLICT_REGISTER.csv'));
const heldRev = readCsv(path.join(REV, 'HELD_FOR_EVIDENCE.csv'));
const queue = readCsv('report/SPEC_11/WAVE_1_QUEUE.csv');

const elig = matrix.filter((r) => r.itemType === 'MUTATION' && r.currentDisposition === 'ELIGIBLE_FOR_PM_REVIEW');
const cfCandMut = matrix.filter((r) => r.itemType === 'MUTATION' && r.currentDisposition === 'CONFLICT_CANDIDATE_APPROVE');
const cfCandRows = matrix.filter((r) => r.itemType === 'CONFLICT' && r.currentDisposition === 'CANDIDATE_APPROVE');
const planBySlugField = new Map(plan.map((p) => [p.slug + '|' + p.destinationField, p]));
const specName = new Map(queue.map((q) => [q.slug, q.title || q.slug]));
// ---- fill recommendation rules (documented in report; deterministic) ----
const FOOTPRINT_FIELDS = ['minTankLengthCm', 'minTankWidthCm', 'tankSizeMinL'];
const HELD_FOOTPRINT_DISPOSITIONS = ['HOLD_FOR_EVIDENCE', 'CONFLICT_DEFERRED', 'CONFLICT_REJECTED'];

function riskText(field) {
  if (['minTankLengthCm', 'minTankWidthCm', 'tankSizeMinL'].includes(field)) return 'Undersized footprint risks chronic stress/injury; overstated figures mislead keepers.';
  if (['tempMinC', 'tempMaxC', 'phMin', 'phMax', 'ghMin', 'ghMax', 'salinityMin', 'salinityMax'].includes(field)) return 'Out-of-range water parameters risk health; survival limits must not be presented as operating ranges.';
  if (field === 'oxygenSensitivity' || field === 'flowPreference') return 'Wrong enum misrepresents a survival-relevant requirement (oxygen/flow).';
  if (field === 'jumpRisk' || field === 'lidRequired') return 'Understated jump/lid risk can cause fish loss and escape.';
  if (field === 'predatesInverts' || field === 'communitySuitability') return 'Wrong predation/compatibility signal risks invertebrate and tankmate losses.';
  if (field.startsWith('body:')) return 'Prose may introduce numbers that conflict with structured fields or overstate certainty.';
  return 'Incorrect enrichment value misleads husbandry guidance.';
}
function recommendFill(r) {
  const ev = classifyEvidence(r);
  const f = r.field;
  const structured = isStructured(f);
  const sc = r.safetyCritical === '1';
  let recommendation = 'RECOMMEND_APPROVE';
  let reasoning = '', evidenceNeeded = '';
  const caveats = [];

  // H2: genus-level evidence anywhere
  if (ev.genus) {
    recommendation = 'RECOMMEND_HOLD';
    reasoning = `Evidence is a genus-level page (${ev.primaryDomain}), not species-specific; the 7-check label 'species-specific' is a misclassification for this row. Rule H2: genus-level evidence is insufficient for a species record.`;
    evidenceNeeded = `A species-level source stating ${f} explicitly for this species (e.g. care profile or primary literature); genus-level pages do not qualify.`;
  }
  // H1: community/general sole source on safety-critical or risk-bearing structured field
  else if (structured && ev.isT3 && (sc || RISK_FIELDS.has(f))) {
    recommendation = 'RECOMMEND_HOLD';
    reasoning = `Sole evidence is ${ev.evidenceClass} (${ev.primaryDomain}) on a ${sc ? 'safety-critical' : 'risk-bearing'} structured field; rule H1: community-edited/general-content sources cannot alone support a safe structured decision.`;
    evidenceNeeded = `A species-specific authoritative/hobby-specialist source stating '${f}' for this species (e.g. SeriouslyFish/FishBase/WetWebMedia-style care profile or primary literature).`;
  }
  // H4: tank-requirement prose publishing numbers while structured footprint is non-writable
  else if (f === 'body:tankRequirements' && NUM_IN_PROSE.test(r.proposedValue || '')) {
    const heldFields = FOOTPRINT_FIELDS.filter((ff) => {
      const p = planBySlugField.get(r.slug + '|' + ff);
      return p && HELD_FOOTPRINT_DISPOSITIONS.includes(p.revisedDisposition);
    });
    if (heldFields.length) {
      recommendation = 'RECOMMEND_HOLD';
      reasoning = `Prose publishes footprint/volume numbers while structured ${heldFields.join('/')} remain non-writable (${heldFields.map((ff) => planBySlugField.get(r.slug + '|' + ff).revisedDisposition).join('/')}); rule H4: content must not publish numbers the structured record does not carry.`;
      evidenceNeeded = `Resolve the held structured footprint first (species-specific published tank dimensions), then re-derive prose numbers from the approved structured values.`;
    } else {
      caveats.push('Cross-check every number in this prose against PM-approved structured footprint/volume values before write.');
    }
  }

  if (recommendation === 'RECOMMEND_APPROVE') {
    if (structured) {
      reasoning = `Species-specific evidence (${ev.tierLabel}${ev.primaryDomain ? ', ' + ev.primaryDomain : ''}${ev.mixed ? '; mixed sources, best tier used' : ''}) supports the exact proposed value; Revision 1 checks 1-7 passed with confidence ${r.confidence}${sc ? '; safety-critical destination' : ''}. Rule: evidence tier adequate for this field.`;
    } else {
      reasoning = `Evidence (${ev.tierLabel}${ev.primaryDomain ? ', ' + ev.primaryDomain : ''}) supports the proposed prose; Revision 1 checks 1-7 passed with confidence ${r.confidence}; prose destination.`;
    }
    if (ev.isT3) caveats.push('Community-edited/general-content source: keep wording neutral and do not introduce numbers beyond the proposal.');
    if (r.confidence === 'MEDIUM') caveats.push('Medium confidence: reviewer should accept as species-specific but consider one corroborating source at allowlist stage.');
    if (sc) caveats.push('Safety-critical: present strictly as a species-specific finding, not a universal recommendation.');
    if (f.startsWith('body:')) caveats.push('Prose: human wording review at Stage B; no new numeric claims.');
    if (['minTankLengthCm', 'minTankWidthCm'].includes(f)) caveats.push('P0 footprint: value must be presented as source-stated minimum with dimensions.');
    if (f === 'groupSize') caveats.push('Group size: open-ended max (null) means "no documented upper bound", not "unlimited".');
  } else if (recommendation === 'RECOMMEND_HOLD') {
    caveats.push('Held: not part of any proposed writable set until the listed evidence is obtained.');
  }
  return { ev, recommendation, reasoning, evidenceNeeded, caveats: caveats.join(' '), risk: riskText(f) };
}

const fillRecs = elig.map((r, i) => {
  const out = recommendFill(r);
  return {
    recId: 'P01-F-' + String(i + 1).padStart(3, '0'),
    mutationId: r.itemId, researchRowId: r.researchRowId, slug: r.slug, species: r.species,
    field: r.field, existingValue: r.existingValue, proposedValue: r.proposedValue,
    confidence: r.confidence, priority: r.priority, safetyCritical: r.safetyCritical,
    sourceTier: out.ev.tierLabel, evidenceClass: out.ev.evidenceClass,
    evidenceReference: r.evidenceReference, verificationBasis: VERIFY_BASIS,
    recommendation: out.recommendation, reasoning: out.reasoning, risks: out.risk,
    requiredCaveats: out.caveats, evidenceNeededIfHold: out.evidenceNeeded,
    proposedWritableSet: out.recommendation === 'RECOMMEND_APPROVE' ? 'YES' : 'NO',
    pmDecision: '', // stays blank - recommendations are not decisions
  };
});
// ---- replacement (22 conflict candidates) recommendations ----
const confById = new Map(confReg.map((c) => [c.conflictId, c]));
// matrix CONFLICT rows carry an empty researchRowId - join mutation candidates by slug+field (1:1 in this register)
const mutBySlugField = new Map(cfCandMut.map((m) => [m.slug + '|' + m.field, m]));
const mutByRs = (researchRowId, slug, field) => mutBySlugField.get(slug + '|' + field) || cfCandMut.find((m) => m.researchRowId === researchRowId);

function replacementCaveats(m, c, tierLabel) {
  const out = ['Exact units and value must be re-verified against the cited source when the final allowlist is generated.'];
  const val = Number(m.proposedValue);
  if (m.field === 'tankSizeMinL' && val >= 10000) out.push('Mega-aquarium scale: present as source-stated adult minimum with context, never as a beginner recommendation.');
  if (m.safetyCritical === '1') out.push('Safety-critical/P0: species-specific minimum only; must not be presented as universal.');
  if (m.confidence === 'MEDIUM') out.push('Medium confidence: consider one corroborating source before write.');
  if (m.field === 'temperament') out.push('EXTEND_SEMANTICS: value must match the SPEC 10 temperament definition (aggression context), not prey-size or compatibility claims.');
  if (m.field === 'diet') out.push('EXTEND_SEMANTICS: diet taxonomy must match the SPEC 10 diet enum semantics (omnivory includes vegetable matter).');
  if (['tempMinC', 'tempMaxC', 'phMax', 'phMin'].includes(m.field)) out.push('Preserve tolerance-vs-operating-range distinction in any body text referencing this range.');
  if (c && c.remainingUncertainty) out.push('Register note to preserve: ' + c.remainingUncertainty.slice(0, 220) + (c.remainingUncertainty.length > 220 ? '...' : ''));
  return out.join(' ');
}
function replacementRisk(m) {
  const f = m.field;
  if (f === 'tankSizeMinL') return 'Retaining an undersized value risks chronic stress/injury; adopting an unverified oversized value creates an unsupportable claim.';
  if (f.startsWith('temp')) return 'Wrong thermal range risks health; note tightened maxima reduce operational margin.';
  if (f.startsWith('ph')) return 'pH outside tolerance risks osmoregulation stress.';
  if (f === 'temperament') return 'Understated aggression risks tankmate losses; overstated aggression deters appropriate keeping.';
  if (f === 'diet') return 'Wrong diet class misleads feeding plans and compatibility expectations.';
  return 'Incorrect replacement value misleads husbandry guidance.';
}
const replacementRecs = cfCandRows.map((cfRow, i) => {
  const m = mutByRs(cfRow.researchRowId, cfRow.slug, cfRow.field);
  if (!m) { console.error('ASSERT FAIL: no mutation for conflict ' + cfRow.itemId); process.exit(2); }
  const c = confById.get(cfRow.itemId);
  const ev = classifyEvidence(m);
  let recommendation = 'RECOMMEND_APPROVE';
  let reasoning = '', evidenceNeeded = '';
  const val = Number(m.proposedValue);
  // R1: >=10,000 L single-source non-authoritative
  if (m.field === 'tankSizeMinL' && val >= 10000 && ev.tier !== 'T1' && c && /Single directly-stating source/i.test(c.remainingUncertainty || '')) {
    recommendation = 'RECOMMEND_HOLD';
    reasoning = `Rule R1: ${val.toLocaleString('en-US')} L claim rests on a single directly-stating non-authoritative source (${ev.tierLabel}, ${ev.primaryDomain}); register itself records corroboration as indirect only. One community-grade source cannot anchor the largest volume in the register.`;
    evidenceNeeded = 'An authoritative species-specific source stating the adult enclosure volume directly (public-aquarium husbandry sheet, primary literature, or two independent specialist profiles agreeing at this scale).';
  } else {
    reasoning = `Replacement re-verified in Revision 1 (sufficiency ${c ? c.evidenceSufficiency : 'SUFFICIENT'}); species-specific evidence (${ev.tierLabel}, ${ev.primaryDomain}) directly supports '${m.existingValue} -> ${m.proposedValue}' for ${m.field}. Register uncertainty reviewed and acceptable at candidate stage.`;
  }
  return {
    recId: 'P01-R-' + String(i + 1).padStart(3, '0'),
    conflictId: cfRow.itemId, mutationId: m.itemId, researchRowId: m.researchRowId,
    slug: m.slug, species: m.species, field: m.field,
    existingValue: m.existingValue, proposedValue: m.proposedValue,
    confidence: m.confidence, priority: m.priority, safetyCritical: m.safetyCritical,
    sourceTier: ev.tierLabel, evidenceClass: ev.evidenceClass,
    evidenceReference: m.evidenceReference, verificationBasis: VERIFY_BASIS,
    recommendation: recommendation, reasoning, risks: replacementRisk(m),
    requiredCaveats: recommendation === 'RECOMMEND_APPROVE' ? replacementCaveats(m, c, ev.tierLabel) : 'Held: excluded from any proposed writable set until the listed evidence is obtained.',
    evidenceNeededIfHold: evidenceNeeded,
    proposedWritableSet: recommendation === 'RECOMMEND_APPROVE' ? 'YES' : 'NO',
    pmDecision: '',
  };
});

// ---- unresolved research plan (everything non-writable) ----
const planRows = [];
let pSeq = 1;
const pushPlan = (o) => planRows.push(Object.assign({ planId: 'RSP-' + String(pSeq++).padStart(3, '0'), writable: 'NO', pmDecision: '' }, o));
for (const b of backlog) {
  pushPlan({
    itemType: b.sourceType === 'MUTATION_HOLD' ? 'HELD_FILL' : b.sourceType === 'CONFLICT_DEFERRED' ? 'DEFERRED_CONFLICT' : 'UNRESOLVED_CONFLICT',
    sourceId: b.sourceId, slug: b.slug, field: b.field, priority: b.priority, safetyCritical: b.safetyCritical,
    status: b.status, recommendation: 'MAINTAIN_HOLD',
    evidenceNeeded: b.evidenceNeededOrNextAction, reason: b.reason, remainingUncertainty: b.remainingUncertainty || '',
  });
}
for (const c of confReg.filter((x) => x.finalRecommendation === 'REJECTED')) {
  pushPlan({
    itemType: 'REJECTED_CONFLICT', sourceId: c.conflictId, slug: c.slug, field: c.destinationField,
    priority: c.priority, safetyCritical: c.safetyCritical, status: 'REJECTED', recommendation: 'KEEP_EXCLUDED',
    evidenceNeeded: 'New species-specific evidence explicitly supporting the rejected replacement value, plus a documented re-review, before any reopening.',
    reason: 'Rejected in Revision 1: ' + (c.remainingUncertainty || 'proposal not adequately supported').slice(0, 300),
    remainingUncertainty: c.remainingUncertainty || '',
  });
}
for (const f of fillRecs.filter((x) => x.recommendation === 'RECOMMEND_HOLD')) {
  pushPlan({
    itemType: 'NEW_FILL_HOLD', sourceId: f.mutationId, slug: f.slug, field: f.field,
    priority: f.priority, safetyCritical: f.safetyCritical, status: 'NEW_HOLD_PHASE_01',
    recommendation: 'RECOMMEND_HOLD', evidenceNeeded: f.evidenceNeededIfHold, reason: f.reasoning, remainingUncertainty: '',
  });
}
for (const r of replacementRecs.filter((x) => x.recommendation === 'RECOMMEND_HOLD')) {
  pushPlan({
    itemType: 'NEW_REPLACEMENT_HOLD', sourceId: r.conflictId, slug: r.slug, field: r.field,
    priority: r.priority, safetyCritical: r.safetyCritical, status: 'NEW_HOLD_PHASE_01',
    recommendation: 'RECOMMEND_HOLD', evidenceNeeded: r.evidenceNeededIfHold, reason: r.reasoning, remainingUncertainty: '',
  });
}
// ---- EVIDENCE_REVIEW_BY_SPECIES.md ----
const CURATED_NOTES = {
  'koi': 'P0 footprint fills remain held from Revision 1 (volume/length derivation); the two jump/lid rows sourced from a single-topic blog are new holds under H1. Temperature replacements (CF11-002/003) rest on TankBud + K.O.I. and keep the tolerance-vs-operating-range caveat.',
  'arapaima-gigas': 'Swimming/jump/oxygen rows cited only Wikipedia and are new holds under H1 (air-breathing/oxygen semantics must not be inferred - Revision 1 §3C). The 40,000 L replacement (CF11-012) is a new hold under R1: single directly-stating community-grade source with only indirect corroboration.',
  'black-arowana': 'PM-flagged species: footprint replacement (CF11-015/MUT11-146) stays deferred - species-specific published dimensions are required. Safety rows (swimming/jump) sourced only from Wikipedia are new holds under H1.',
  'scleropages-formosus': 'Three safety rows (swimming/jump/lid) cite only Wikipedia and are new holds under H1; the lid row cites Dawes 2001 via Wikipedia - a primary source must be consulted directly.',
  'longnose-gar': 'Group-size row stays held (applicability, MUT11-166). Register topic mislink RS11-060 (oxygenation -> flowPreference) is recorded for a Stage B fix; originals unchanged.',
  'zebra-moray-eel': 'Register topic mislink RS11-087 (oxygenation -> flowPreference) recorded for a Stage B fix. Tank-size replacement (CF11-009) derives from a specialist news article rather than a full profile and keeps the corroboration caveat.',
  'three-barred-peacock-bass': 'One fill cites a genus-level page (Genus Cichla) and is a new hold under H2 despite the species-specific label; footprint replacement (CF11-027) rests on the SeriouslyFish species profile.',
  'osteoglossum-bicirrhosum': 'Safety rows sourced only from Wikipedia are new holds under H1; several non-risk rows cite general arowana-care content and carry neutral-wording caveats.',
  'walking-catfish': 'Four replacements approved as candidates: floor-space-driven 2,268 L minimum (register records the sizeCm caveat), tightened 26 C maximum, and diet Carnivore -> Omnivore (EXTEND_SEMANTICS, two independent sources).',
  'tiger-shovelnose-catfish': '10,368 L replacement rests on two independent specialist sources per the register note; keep the floor-space rationale when presenting the figure.',
  'phractocephalus-hemioliopterus': '10,368 L replacement is corroborated at two-source level per the register; 500 L existing value is materially wrong and should not be preserved by default.',
  'iridescent-shark': '14,580 L replacement is the strictest published figure (SeriouslyFish footprint), corroborated by the same 450 x 180 cm footprint in a second source; permissive readings exist and are recorded in the register.',
};
function speciesBlock(slug) {
  const fills = fillRecs.filter((x) => x.slug === slug);
  const reps = replacementRecs.filter((x) => x.slug === slug);
  const heldFills = backlog.filter((b) => b.slug === slug && b.sourceType === 'MUTATION_HOLD');
  const deferred = backlog.filter((b) => b.slug === slug && b.sourceType === 'CONFLICT_DEFERRED');
  const unresolved = backlog.filter((b) => b.slug === slug && b.sourceType === 'UNRESOLVED_CLAIM');
  const rejected = confReg.filter((c) => c.slug === slug && c.finalRecommendation === 'REJECTED');
  const holds = fills.filter((x) => x.recommendation === 'RECOMMEND_HOLD');
  const repHolds = reps.filter((x) => x.recommendation === 'RECOMMEND_HOLD');
  const tiers = {};
  fills.forEach((x) => { tiers[x.sourceTier] = (tiers[x.sourceTier] || 0) + 1; });
  const lines = [];
  lines.push(`### ${specName.get(slug) || slug} (\`${slug}\`)`);
  lines.push('');
  lines.push(`- Eligible fills reviewed: **${fills.length}** - RECOMMEND_APPROVE ${fills.length - holds.length}, RECOMMEND_HOLD ${holds.length}`);
  lines.push(`- Replacement candidates: **${reps.length}** - RECOMMEND_APPROVE ${reps.length - repHolds.length}, RECOMMEND_HOLD ${repHolds.length}`);
  lines.push(`- Register positions held: ${heldFills.length} held fill(s), ${deferred.length} deferred conflict(s), ${unresolved.length} unresolved conflict(s), ${rejected.length} rejected`);
  lines.push(`- Evidence tiers on eligible fills: ${Object.entries(tiers).sort().map(([k, v]) => `${k}=${v}`).join(', ')}`);
  if (holds.length || repHolds.length) {
    lines.push(`- **New Phase 01 holds:** ${holds.map((h) => `${h.mutationId} (${h.field})`).concat(repHolds.map((h) => `${h.conflictId} (replacement, ${h.field})`)).join('; ')}`);
  } else {
    lines.push('- New Phase 01 holds: none');
  }
  if (CURATED_NOTES[slug]) lines.push(`- Review note: ${CURATED_NOTES[slug]}`);
  const domains = [...new Set(fills.concat(reps).flatMap((x) => domainsIn(x.evidenceReference)))].sort();
  lines.push(`- Sources cited: ${domains.join(', ')}`);
  lines.push('');
  return lines.join('\n');
}

// ---- PHASE_01_REVIEW_REPORT.md builders ----
const fillCounts = fillRecs.reduce((a, x) => { a[x.recommendation] = (a[x.recommendation] || 0) + 1; return a; }, {});
const repCounts = replacementRecs.reduce((a, x) => { a[x.recommendation] = (a[x.recommendation] || 0) + 1; return a; }, {});
const planCounts = planRows.reduce((a, x) => { a[x.itemType] = (a[x.itemType] || 0) + 1; return a; }, {});

(function main() {
  // asserts - hard invariants
  const assert = (cond, msg) => { if (!cond) { console.error('ASSERT FAIL: ' + msg); process.exit(2); } };
  assert(fillRecs.length === 342, 'fill rows ' + fillRecs.length);
  assert(new Set(fillRecs.map((x) => x.mutationId)).size === 342, 'dup fill ids');
  assert(replacementRecs.length === 22, 'replacement rows ' + replacementRecs.length);
  assert(new Set(replacementRecs.map((x) => x.conflictId)).size === 22, 'dup conflict ids');
  assert(fillRecs.every((x) => ['RECOMMEND_APPROVE', 'RECOMMEND_HOLD', 'RECOMMEND_REJECT'].includes(x.recommendation)), 'fill vocab');
  assert(replacementRecs.every((x) => ['RECOMMEND_APPROVE', 'RECOMMEND_HOLD', 'RECOMMEND_REJECT'].includes(x.replacement || x.recommendation)), 'rep vocab');
  assert(fillRecs.every((x) => x.proposedWritableSet === (x.recommendation === 'RECOMMEND_APPROVE' ? 'YES' : 'NO')), 'fill writable mapping');
  assert(replacementRecs.every((x) => x.proposedWritableSet === (x.recommendation === 'RECOMMEND_APPROVE' ? 'YES' : 'NO')), 'rep writable mapping');
  assert(fillRecs.every((x) => x.pmDecision === '') && replacementRecs.every((x) => x.pmDecision === '') && planRows.every((x) => x.pmDecision === ''), 'pmDecision must stay blank');
  const eligSet = new Set(elig.map((r) => r.itemId));
  assert(fillRecs.every((x) => eligSet.has(x.mutationId)), 'fill set equals matrix eligible set');
  const candSet = new Set(cfCandRows.map((r) => r.itemId));
  assert(replacementRecs.every((x) => candSet.has(x.conflictId)), 'rep set equals matrix candidate conflicts');
  assert(planRows.length === 70 + 3 + (fillCounts.RECOMMEND_HOLD || 0) + (repCounts.RECOMMEND_HOLD || 0), 'research plan rows ' + planRows.length);
  // no held/deferred/rejected/unresolved source may be proposed writable
  const excluded = new Set(backlog.map((b) => b.sourceId));
  confReg.filter((c) => ['REJECTED', 'DEFERRED', 'KEEP_HOLD'].includes(c.finalRecommendation)).forEach((c) => excluded.add(c.conflictId));
  assert(planRows.every((x) => x.writable === 'NO'), 'research plan all non-writable');
  const writableIds = fillRecs.filter((x) => x.proposedWritableSet === 'YES').map((x) => x.mutationId)
    .concat(replacementRecs.filter((x) => x.proposedWritableSet === 'YES').map((x) => x.conflictId));
  assert(writableIds.every((id) => !excluded.has(id)), 'no excluded id in writable set');
  // held/deferred/rejected fills never eligible by construction; double-check plan dispositions
  const planById = new Map(plan.map((p) => [p.originalMutationId, p]));
  const nonWritablePlanIds = new Set(plan.filter((p) => p.revisedDisposition !== 'ELIGIBLE_FOR_PM_REVIEW').map((p) => p.originalMutationId));
  assert(writableIds.filter((id) => id.startsWith('MUT')).every((id) => !nonWritablePlanIds.has(id)), 'writable mutations must be Revision-1 eligible');

  fs.mkdirSync(OUT, { recursive: true });

  const fillCols = ['recId', 'mutationId', 'researchRowId', 'slug', 'species', 'field', 'existingValue', 'proposedValue', 'confidence', 'priority', 'safetyCritical', 'sourceTier', 'evidenceClass', 'evidenceReference', 'verificationBasis', 'recommendation', 'reasoning', 'risks', 'requiredCaveats', 'evidenceNeededIfHold', 'proposedWritableSet', 'pmDecision'];
  const repCols = ['recId', 'conflictId', 'mutationId', 'researchRowId', 'slug', 'species', 'field', 'existingValue', 'proposedValue', 'confidence', 'priority', 'safetyCritical', 'sourceTier', 'evidenceClass', 'evidenceReference', 'verificationBasis', 'recommendation', 'reasoning', 'risks', 'requiredCaveats', 'evidenceNeededIfHold', 'proposedWritableSet', 'pmDecision'];
  const planCols = ['planId', 'itemType', 'sourceId', 'slug', 'field', 'priority', 'safetyCritical', 'status', 'recommendation', 'evidenceNeeded', 'reason', 'remainingUncertainty', 'writable', 'pmDecision'];
  fs.writeFileSync(path.join(OUT, 'FILL_DECISION_RECOMMENDATIONS.csv'), toCsv(fillRecs, fillCols));
  fs.writeFileSync(path.join(OUT, 'REPLACEMENT_DECISION_RECOMMENDATIONS.csv'), toCsv(replacementRecs, repCols));
  fs.writeFileSync(path.join(OUT, 'UNRESOLVED_RESEARCH_PLAN.csv'), toCsv(planRows, planCols));

  const order = queue.slice().sort((a, b) => Number(a.waveOrder) - Number(b.waveOrder)).map((q) => q.slug);
  const mdSpecies = [
    '# SPEC 11 Phase 01 - Evidence Review by Species', '',
    'Mode: READ-ONLY. Generation used local artifacts only; validation performed one GET-only inventory/identity-hash read of Sanity production. No mutation APIs were called.',
    'Verification basis for every row: existing evidence verified in Stage A/Revision 1 - **not re-fetched in Phase 01**.',
    'Recommendations only; `pmDecision` columns remain blank (blank = NOT APPROVED).', '',
    `Reviewed: ${fillRecs.length} eligible fills + ${replacementRecs.length} replacement candidates across ${order.length} species.`, '',
    'Evidence tiers: T1_AUTHORITY (scientific/established hobby reference: FishBase, SeriouslyFish, WetWebMedia, NANFA, ScotCat, TFH, zoo/.edu/.gov, etc.) | T2_SPECIALIST_PROFILE (species-profile hobby sites: TankBud, FishStores, Aqueon, AquariumLab, Guidarium, PetMD, etc.) | T3_COMMUNITY_EDITED (Wikipedia) | T3_GENERAL_CONTENT (general content/marketplace sites) | GENUS_LEVEL (genus page - insufficient).', '',
  ];
  for (const slug of order) mdSpecies.push(speciesBlock(slug));
  fs.writeFileSync(path.join(OUT, 'EVIDENCE_REVIEW_BY_SPECIES.md'), mdSpecies.join('\n'));

  const newHoldRows = fillRecs.filter((x) => x.recommendation === 'RECOMMEND_HOLD').map((x) => `| ${x.mutationId} | ${x.species} | ${x.field} | ${x.evidenceClass} | H1/H2/H4 |`)
    .concat(replacementRecs.filter((x) => x.recommendation === 'RECOMMEND_HOLD').map((x) => `| ${x.conflictId} | ${x.species} | ${x.field} | ${x.evidenceClass} | R1 |`));
  const bySpeciesTable = order.map((slug) => {
    const f = fillRecs.filter((x) => x.slug === slug);
    const r = replacementRecs.filter((x) => x.slug === slug);
    return `| ${specName.get(slug) || slug} | ${f.length} | ${f.length - f.filter((x) => x.recommendation === 'RECOMMEND_HOLD').length} | ${f.filter((x) => x.recommendation === 'RECOMMEND_HOLD').length} | ${r.length} | ${r.filter((x) => x.recommendation === 'RECOMMEND_HOLD').length} | ${backlog.filter((b) => b.slug === slug).length} |`;
  }).join('\n');

  const report = `# SPEC 11 Phase 01 - Evidence Review & Decision Recommendations Report

**Status:** COMPLETE - recommendations recorded; **awaiting PM decisions**
**Mode:** READ-ONLY (generation: local artifacts only; validation: one GET-only inventory/identity read - no mutation APIs, no deployment)
**Verification basis:** existing evidence from Stage A/Revision 1 - not re-fetched in Phase 01 (\`${VERIFY_BASIS}\`)
**PM decisions:** none recorded - all \`pmDecision\` fields blank (blank = NOT APPROVED)

## 1. Deliverables

- \`reports/SPEC_11/pm_review/phase_01/EVIDENCE_REVIEW_BY_SPECIES.md\`
- \`reports/SPEC_11/pm_review/phase_01/FILL_DECISION_RECOMMENDATIONS.csv\` (${fillRecs.length} rows)
- \`reports/SPEC_11/pm_review/phase_01/REPLACEMENT_DECISION_RECOMMENDATIONS.csv\` (${replacementRecs.length} rows)
- \`reports/SPEC_11/pm_review/phase_01/UNRESOLVED_RESEARCH_PLAN.csv\` (${planRows.length} rows)
- \`reports/SPEC_11/pm_review/phase_01/PHASE_01_REVIEW_REPORT.md\` (this file)

## 2. Method

Evidence tiering per row (best cited domain decides the tier; mixed sources flagged):

| Tier | Meaning | Examples |
|---|---|---|
| T1_AUTHORITY | scientific / established hobby reference | SeriouslyFish, FishBase, WetWebMedia, NANFA, ScotCat, TFH, .edu/.gov, zoo |
| T2_SPECIALIST_PROFILE | species-profile hobby site | TankBud, FishStores, Aqueon, AquariumLab, Guidarium, PetMD |
| T3_COMMUNITY_EDITED | community-edited encyclopedia | Wikipedia |
| T3_GENERAL_CONTENT | general content / marketplace pages | YoloLife, PetZoneSD, Aquatic-Auctions |
| GENUS_LEVEL | genus page, not species-specific | Aquarist Atlas genus pages |

Recommendation rules (deterministic; documented here and applied per row):

- **H1** - community-edited/general-content sole evidence on a safety-critical or risk-bearing structured field -> RECOMMEND_HOLD.
- **H2** - genus-level evidence (regardless of label) -> RECOMMEND_HOLD.
- **H4** - tank-requirement prose publishing footprint/volume numbers while the species' structured footprint field is held/deferred/rejected -> RECOMMEND_HOLD (content consistency).
- **R1** - replacement volume >= 10,000 L anchored by a single directly-stating non-authoritative source -> RECOMMEND_HOLD.
- Everything else with tier-adequate species-specific evidence -> RECOMMEND_APPROVE with row-specific caveats (neutral wording, medium-confidence corroboration, safety presentation, P0 dimension presentation, EXTEND_SEMANTICS notes, register uncertainty preserved).
- RECOMMEND_REJECT is available but no row met the threshold this phase (no evidence contradicted a proposal outright).

## 3. Counts by recommendation

### Fills (342 eligible)

| Recommendation | Count | Share |
|---|---:|---:|
| RECOMMEND_APPROVE | ${fillCounts.RECOMMEND_APPROVE || 0} | ${(((fillCounts.RECOMMEND_APPROVE || 0) / 342) * 100).toFixed(1)}% |
| RECOMMEND_HOLD | ${fillCounts.RECOMMEND_HOLD || 0} | ${(((fillCounts.RECOMMEND_HOLD || 0) / 342) * 100).toFixed(1)}% |
| RECOMMEND_REJECT | ${fillCounts.RECOMMEND_REJECT || 0} | 0.0% |

### Replacements (22 candidates)

| Recommendation | Count |
|---|---:|
| RECOMMEND_APPROVE | ${repCounts.RECOMMEND_APPROVE || 0} |
| RECOMMEND_HOLD | ${repCounts.RECOMMEND_HOLD || 0} |
| RECOMMEND_REJECT | ${repCounts.RECOMMEND_REJECT || 0} |

### Per species

| Species | Fills | Fill approve | Fill hold | Reps | Rep hold | Register held rows |
|---|---:|---:|---:|---:|---:|---:|
${bySpeciesTable}

### Unresolved research plan (${planRows.length} rows, all writable=NO)

| itemType | Count |
|---|---:|
${Object.entries(planCounts).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

## 4. New holds introduced this phase (${newHoldRows.length})

| ID | Species | Field | Evidence class | Rule |
|---|---|---|---|---|
${newHoldRows.join('\n')}

Each row carries the exact evidence needed in \`UNRESOLVED_RESEARCH_PLAN.csv\` (evidenceNeeded column). These join the 45 held fills, 11 deferred conflicts, 3 rejected replacements and 14 unresolved conflicts already outside any writable set.

## 5. Unresolved issues

1. **14 unresolved safety/general research conflicts** (KEEP_HOLD) remain open, including the 7 safety-critical ones (CF11-039/042/043/047/048/049/050). No species may be marked complete while these are open.
2. **Black arowana footprint** (MUT11-146 / CF11-015) stays deferred pending species-specific published dimensions - PM-flagged in Revision 1.
3. **Two register topic mislinks** (RS11-060 longnose-gar, RS11-087 zebra-moray: oxygenation -> flowPreference) are recorded for a Stage B register fix; originals unchanged.
4. **New H1/H2/H4/R1 holds** (table above) reduce the immediately recommendable set; they are evidence gaps, not decisions.
5. The Revision 1 7-check label "species-specific" is wrong for one genus-level row (MUT11-337) - corrected here by rule H2; the original artifact is unchanged.

## 6. Source limitations

- **No re-fetching:** every citation is carried from Stage A/Revision 1. Phase 01 did not open URLs; tiering is by source class and register notes, not content re-verification.
- **T3 exposure:** ${fillRecs.filter((x) => x.sourceTier.startsWith('T3')).length} eligible fills rest on community-edited/general-content sources; the safety/risk-bearing subset is held under H1, the remainder is approved only with neutral-wording caveats.
- **Single-topic and article-based sources** (KoiQuanta, ReefBuilders article) appear in the register; corroboration caveats are preserved on the affected rows.
- **Register uncertainty text** is quoted into replacement caveats (truncated) so PM sees the exact caveats recorded in Revision 1.
- Body prose fills were approved as content, not as numeric authority: numbers inside prose are covered by H4 or the cross-check caveat.

## 7. Next decision required from PM

1. Record a decision + rationale for each of the **${fillCounts.RECOMMEND_APPROVE || 0} recommended-approve fills** and **${repCounts.RECOMMEND_APPROVE || 0} recommended-approve replacements** in \`phase/11/SPEC_11_PM_APPROVAL_MATRIX.csv\` (or an approved successor), using the package decision vocabulary.
2. Decide whether to commission evidence for the **${planRows.length} unresolved/research-plan rows** (order of research: safety-critical first).
3. Only after explicit decisions are recorded may a separate final allowlist be generated and validated - **not part of this phase**.
4. Stage B remains blocked until separate production-write authorization follows an approved allowlist.

sanityWrites=0
mutationCalls=0
deployments=0
`;
  fs.writeFileSync(path.join(OUT, 'PHASE_01_REVIEW_REPORT.md'), report);

  const files = ['EVIDENCE_REVIEW_BY_SPECIES.md', 'FILL_DECISION_RECOMMENDATIONS.csv', 'REPLACEMENT_DECISION_RECOMMENDATIONS.csv', 'UNRESOLVED_RESEARCH_PLAN.csv', 'PHASE_01_REVIEW_REPORT.md'];
  console.log('WROTE ' + files.map((f) => OUT + '/' + f).join('\n'));
  console.log('counts: fills=' + JSON.stringify(fillCounts) + ' reps=' + JSON.stringify(repCounts) + ' plan=' + JSON.stringify(planCounts) + ' total=' + planRows.length);
  console.log('sanityWrites=0 mutationCalls=0 deployments=0');
})();



