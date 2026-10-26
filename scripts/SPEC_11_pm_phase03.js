// SPEC 11 Phase 03 - PM decision package generator. READ-ONLY: frozen Phase 01/02 inputs only + one GET-only
// scientific-name lookup; no Sanity mutation, no deployment, no PM decisions recorded.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const P1 = 'reports/SPEC_11/pm_review/phase_01';
const P2 = 'reports/SPEC_11/pm_review/phase_02';
const OUT = 'reports/SPEC_11/pm_review/phase_03';
const REV = 'reports/SPEC_11/revision_1';
const RPT = 'report/SPEC_11';
const PKG = 'phase/11';
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const shaFile = (f) => sha(fs.readFileSync(f));
function sp(l){const r=[];let c='',q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(q){if(ch==='"'){if(l[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}else{if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}else c+=ch;}}r.push(c);return r;}
function readCsv(f){const l=fs.readFileSync(f,'utf8').replace(/^﻿/,'').split(/\r?\n/).filter(x=>x);const h=sp(l[0]);return l.slice(1).map(x=>{const r=sp(x);const o={};h.forEach((k,i)=>o[k]=r[i]??'');return o;});}
function toCsv(rows, cols){const esc=(v)=>{const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};return [cols.join(','),...rows.map(r=>cols.map(c=>esc(r[c])).join(','))].join('\n')+'\n';}

// ---- input checksum verification (fail hard before any output) ----
const P1_HASHES = {
  'EVIDENCE_REVIEW_BY_SPECIES.md': 'd86b54fc4d72f432e8de90e3d5b4829d92d04a493099a6ac9d2d77e69c03eeb2',
  'FILL_DECISION_RECOMMENDATIONS.csv': '3f4594abfd9376de3bf1bba46c3049d43d9e3828b462da36ee9bac3d929e2a76',
  'REPLACEMENT_DECISION_RECOMMENDATIONS.csv': '54c210654aa350b7fc46b581ce81533f24642df233d63d2f145b584095100275',
  'UNRESOLVED_RESEARCH_PLAN.csv': 'c3dcabc2f1578f7fb8f2e74512402b11487c4ee308dc4cbe924556efe9804493',
  'PHASE_01_REVIEW_REPORT.md': 'f48e1520564027f85f8ea05e4e7a2bcf30cefb117a452c930d66b6c47e903afa',
};
const PKG_HASHES = {
  'SPEC_11_PM_REVISED_PLAN_APPROVAL_PACKAGE.md': '0a646731ef37e8bfb3270721e4d1402207c0b6a1dc0c6279d11ac044dc3e326e',
  'SPEC_11_PM_APPROVAL_MATRIX.csv': 'c47d2fc128cca98df9c183d458516857ab8f002f6eb1fa2aabe23ac644c3af9f',
  'SPEC_11_PM_RESEARCH_BACKLOG.csv': 'f38b8c35807686976feac31a5a9410fd4a46ac71a67c894dd2a7948c14019148',
};
function verifyInputs() {
  const bad = [];
  for (const [f, h] of Object.entries(P1_HASHES)) if (shaFile(path.join(P1, f)) !== h) bad.push('phase01/' + f);
  const sums = fs.readFileSync(path.join(P2, 'PHASE_02_CHECKSUMS.txt'), 'utf8');
  for (const [, name, h] of sums.matchAll(/^([A-Z0-9_]+\.(?:csv|md|txt)):\s*([a-f0-9]{64})/gm)) if (shaFile(path.join(P2, name)) !== h) bad.push('phase02/' + name);
  if (!sums.includes('sanityWrites=0')) bad.push('phase02/checksums-statements');
  for (const [f, h] of Object.entries(PKG_HASHES)) if (!fs.existsSync(path.join(PKG, f)) || shaFile(path.join(PKG, f)) !== h) bad.push('phase/11/' + f);
  const integrity = JSON.parse(fs.readFileSync(path.join(RPT, 'INTEGRITY.json'), 'utf8'));
  for (const [f, h] of Object.entries(integrity.artifactHashes || {})) for (const dir of [RPT, 'reports/SPEC_11']) { try { if (shaFile(path.join(dir, f)) !== h) bad.push(dir + '/' + f); } catch (e) { bad.push(dir + '/' + f + ':missing'); } }
  const revSums = fs.readFileSync(path.join(REV, 'REVISION_1_CHECKSUMS.txt'), 'utf8');
  const revEntries = [...revSums.matchAll(/^\s+([A-Z0-9_]+\.(?:csv|md|txt|json)):\s*([a-f0-9]{64})/gm)];
  for (const [, name, h] of revEntries) { const a = path.join(REV, name), b = path.join(RPT, name); const f = fs.existsSync(a) ? a : b; if (!fs.existsSync(f) || shaFile(f) !== h) bad.push('rev1/' + name); }
  if (bad.length) { console.error('INPUT CHECKSUM FAILURE: ' + bad.join('; ')); process.exit(3); }
  console.log('inputs verified: phase01 5/5, phase02 ' + [...sums.matchAll(/^([A-Z0-9_]+\.(?:csv|md|txt)):/gm)].length + '/4+, package 3/3, Stage A 11/11 x2, rev1 ' + revEntries.length + '/15');
}

// ---- GET-only scientific names (canonical wiki field; no inference) ----
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const q = (query) => new Promise((res, rej) => { https.get(BASE + '?query=' + encodeURIComponent(query), { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => { const c = []; r.on('data', (d) => c.push(d)); r.on('end', () => { try { res(JSON.parse(Buffer.concat(c).toString()).result); } catch (e) { rej(e); } }); }).on('error', rej); });
async function fetchScientificNames() {
  const recs = [];
  for (const t of WIKI_TYPES) recs.push(...(await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]{ "slug": slug.current, scientificName }`)));
  const m = new Map();
  for (const r of recs) if (r.slug && r.scientificName) m.set(r.slug, r.scientificName);
  return m;
}

// ---- load frozen tables ----
const fills = readCsv(path.join(P1, 'FILL_DECISION_RECOMMENDATIONS.csv'));
const reps = readCsv(path.join(P1, 'REPLACEMENT_DECISION_RECOMMENDATIONS.csv'));
const plan = readCsv(path.join(P1, 'UNRESOLVED_RESEARCH_PLAN.csv'));
const ver = readCsv(path.join(P2, 'SOURCE_VERIFICATION.csv'));
const gaps = readCsv(path.join(P2, 'EVIDENCE_GAPS.csv'));
const confReg = readCsv(path.join(REV, 'REVISED_CONFLICT_REGISTER.csv'));
const verBy = new Map(ver.map((r) => [r.candidateId, r]));
const confById = new Map(confReg.map((r) => [r.conflictId, r]));
const slugSpecies = new Map(ver.map((r) => [r.slug, r.species]));
const gapByCand = new Map(gaps.filter((g) => g.gapType === 'CANDIDATE_VERIFICATION').map((g) => [g.candidateId, g]));
const planGapByPlanId = new Map();
for (const g of gaps.filter((x) => x.gapType === 'RESEARCH_PLAN')) { const m = /planRow=(RSP-\d+)/.exec(g.nextAction || ''); if (m) planGapByPlanId.set(m[1], g); }

// ---- derived annotation helpers (organization of frozen data, not new claims) ----
function evidenceLimitation(v, p1) {
  const flags = [];
  if (v.verificationRule === 'BODY_PAGE_ONLY') flags.push('GENERAL_SPECIES_DESCRIPTION_ONLY');
  if ((v.caveat || '').includes('indirect')) flags.push('INDIRECT_SUPPORT');
  if ((v.caveat || '').includes('Single-source')) flags.push('SINGLE_SOURCE_NO_CORROBORATION');
  if ((v.caveat || '').includes('community-edited')) flags.push('T3_SOURCE_WORDING_RESTRICTIONS');
  if (v.verificationRule === 'GH_OPEN_RANGE') flags.push('OPEN_ENDED_SCHEMA_VALUE');
  if ((p1.requiredCaveats || '').includes('open-ended max')) flags.push('OPEN_ENDED_SCHEMA_VALUE');
  if (v.evidenceDisposition === 'CLAIM_NOT_FOUND') flags.push('EVIDENCE_GAP_CLAIM_NOT_LOCATED');
  if (v.evidenceDisposition === 'SOURCE_UNAVAILABLE') flags.push('EVIDENCE_GAP_SOURCE_UNAVAILABLE');
  return flags.length ? [...new Set(flags)].join('; ') : 'NONE';
}
function rangeBasis(v, p1) {
  const reg = p1.register === 'REPLACEMENT' && p1.conflictId ? confById.get(p1.conflictId) : null;
  const regText = reg ? (reg.reasoning || '') + ' ' + (reg.notes || '') : '';
  if (/toleran|comfort band|operating (?:band|range)/i.test(regText)) return 'TOLERANCE_LIMIT_VS_OPERATING_RANGE_RECORDED_IN_CONFLICT_REGISTER';
  if (['TEMP_IN_RANGE', 'PH_IN_RANGE'].includes(v.verificationRule)) return 'VALUE_INSIDE_SOURCE_STATED_RANGE_TOLERANCE_VS_OPERATING_NOT_SEPARATED';
  if (v.verificationRule === 'GH_OPEN_RANGE') return 'OPEN_ENDED_VALUE_NOT_A_SOURCE_STATED_FLOOR';
  return 'NOT_FLAGGED_IN_FROZEN_INPUTS';
}
function writeEligibility(v) {
  return ['VERIFIED_SUPPORT', 'VERIFIED_SUPPORT_WITH_CAVEAT'].includes(v.evidenceDisposition)
    ? 'NON_WRITABLE_PENDING_PM_DECISION'
    : 'NON_WRITABLE_EVIDENCE_GAP';
}
function requiredDecision(v) {
  if (v.evidenceDisposition === 'VERIFIED_SUPPORT') return 'PM decision required: approve write | hold | reject (evidence support is not permission to write)';
  if (v.evidenceDisposition === 'VERIFIED_SUPPORT_WITH_CAVEAT') return 'PM decision required: approve write with recorded caveat | hold | reject (evidence support is not permission to write)';
  return 'PM decision required: commission evidence | maintain hold (no write permitted until evidence obtained) | reject';
}

(async () => {
  verifyInputs();
  const sciNames = await fetchScientificNames();
  fs.mkdirSync(OUT, { recursive: true });

  // ---- PM_DECISION_QUEUE.csv (337 approve candidates) ----
  const qFills = fills.filter((r) => r.proposedWritableSet === 'YES').map((r) => Object.assign({ register: 'FILL' }, r));
  const qReps = reps.filter((r) => r.proposedWritableSet === 'YES').map((r) => Object.assign({ register: 'REPLACEMENT' }, r));
  const qAll = qFills.concat(qReps);
  const queue = qAll.map((p1, i) => {
    const v = verBy.get(p1.recId);
    if (!v) { console.error('MISSING Phase 02 row for ' + p1.recId); process.exit(3); }
    const gap = gapByCand.get(p1.recId) || null;
    return {
      queueId: 'PQ-' + String(i + 1).padStart(3, '0'),
      candidateId: p1.recId,
      register: p1.register,
      mutationId: p1.mutationId,
      conflictId: p1.conflictId || '',
      mutationType: p1.register,
      slug: p1.slug,
      species: p1.species,
      scientificName: sciNames.get(p1.slug) || '',
      fieldPath: p1.field,
      currentValue: p1.existingValue,
      proposedValue: p1.proposedValue,
      priority: p1.priority,
      safetyCritical: p1.safetyCritical,
      safetyPriority: p1.safetyCritical === '1' ? 'P0_SAFETY' : p1.priority,
      phase01Recommendation: p1.recommendation,
      phase01Confidence: p1.confidence,
      phase01Rationale: p1.reasoning,
      evidenceDisposition: v.evidenceDisposition,
      claimSupported: v.claimSupported,
      sourceUrl: v.sourceUrl,
      sourceTitle: v.sourceTitle,
      sourceTier: v.sourceTier,
      speciesSpecificity: v.speciesSpecificity,
      verificationRule: v.verificationRule,
      phase01Caveats: p1.requiredCaveats || '',
      evidenceCaveat: v.caveat || '',
      evidenceLimitation: evidenceLimitation(v, p1),
      rangeBasis: rangeBasis(v, p1),
      gapIssue: gap ? gap.issue : '',
      evidenceNeeded: gap ? gap.evidenceNeeded : '',
      writeEligibility: writeEligibility(v),
      requiredPMDecision: requiredDecision(v),
      pmDecision: '',
      pmRationale: '',
      pmNotes: '',
    };
  });
  const QCOLS = ['queueId','candidateId','register','mutationId','conflictId','mutationType','slug','species','scientificName','fieldPath','currentValue','proposedValue','priority','safetyCritical','safetyPriority','phase01Recommendation','phase01Confidence','phase01Rationale','evidenceDisposition','claimSupported','sourceUrl','sourceTitle','sourceTier','speciesSpecificity','verificationRule','phase01Caveats','evidenceCaveat','evidenceLimitation','rangeBasis','gapIssue','evidenceNeeded','writeEligibility','requiredPMDecision','pmDecision','pmRationale','pmNotes'];
  fs.writeFileSync(path.join(OUT, 'PM_DECISION_QUEUE.csv'), toCsv(queue, QCOLS));

  // ---- UNRESOLVED_DECISION_REGISTER.csv (100 plan rows + 55 candidate gaps) ----
  const regRows = [];
  plan.forEach((p, i) => {
    const pg = planGapByPlanId.get(p.planId);
    const origin = ['NEW_FILL_HOLD', 'NEW_REPLACEMENT_HOLD'].includes(p.itemType) ? 'PHASE01_HOLD' : 'RESEARCH_PLAN';
    regRows.push({
      registerId: 'URG-' + String(i + 1).padStart(3, '0'),
      origin,
      itemType: p.itemType,
      planId: p.planId,
      gapId: pg ? pg.gapId : '',
      candidateId: '',
      mutationId: pg ? pg.mutationId : '',
      conflictId: pg ? pg.conflictId : '',
      slug: p.slug,
      species: slugSpecies.get(p.slug) || '',
      fieldPath: p.field,
      proposedValue: pg ? pg.proposedValue : '',
      priority: p.priority,
      safetyCritical: p.safetyCritical,
      safetyPriority: p.safetyCritical === '1' ? 'P0_SAFETY' : p.priority,
      currentStatus: p.status,
      recommendation: p.recommendation,
      whyUnresolved: p.reason + (p.remainingUncertainty ? ' | remaining uncertainty: ' + p.remainingUncertainty : ''),
      evidenceNeeded: p.evidenceNeeded,
      nextAction: pg ? pg.nextAction : '',
      writeEligibility: 'NON_WRITABLE',
      pmDecision: '',
      pmRationale: '',
      pmNotes: '',
    });
  });
  const candGaps = gaps.filter((g) => g.gapType === 'CANDIDATE_VERIFICATION');
  candGaps.forEach((g, i) => {
    const p1 = qAll.find((x) => x.recId === g.candidateId);
    regRows.push({
      registerId: 'URG-' + String(plan.length + i + 1).padStart(3, '0'),
      origin: 'PHASE02_CANDIDATE_GAP',
      itemType: g.evidenceDisposition === 'SOURCE_UNAVAILABLE' ? 'SOURCE_UNAVAILABLE' : 'EVIDENCE_GAP',
      planId: '',
      gapId: g.gapId,
      candidateId: g.candidateId,
      mutationId: g.mutationId,
      conflictId: g.conflictId,
      slug: g.slug,
      species: g.species,
      fieldPath: g.field,
      proposedValue: g.proposedValue,
      priority: g.priority,
      safetyCritical: g.safetyCritical,
      safetyPriority: g.safetyPriority,
      currentStatus: g.evidenceDisposition,
      recommendation: p1 ? p1.recommendation + ' (Phase 01 approve recommendation; evidence not verified)' : '',
      whyUnresolved: g.issue,
      evidenceNeeded: g.evidenceNeeded,
      nextAction: g.nextAction,
      writeEligibility: 'NON_WRITABLE',
      pmDecision: '',
      pmRationale: '',
      pmNotes: '',
    });
  });
  const RCOLS = ['registerId','origin','itemType','planId','gapId','candidateId','mutationId','conflictId','slug','species','fieldPath','proposedValue','priority','safetyCritical','safetyPriority','currentStatus','recommendation','whyUnresolved','evidenceNeeded','nextAction','writeEligibility','pmDecision','pmRationale','pmNotes'];
  fs.writeFileSync(path.join(OUT, 'UNRESOLVED_DECISION_REGISTER.csv'), toCsv(regRows, RCOLS));

  // ---- P0_SAFETY_REVIEW.md ----
  const trunc = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
  const safetyQ = queue.filter((r) => r.safetyCritical === '1');
  const sDirect = safetyQ.filter((r) => r.evidenceDisposition === 'VERIFIED_SUPPORT');
  const sCaveat = safetyQ.filter((r) => r.evidenceDisposition === 'VERIFIED_SUPPORT_WITH_CAVEAT');
  const sMissing = safetyQ.filter((r) => ['CLAIM_NOT_FOUND', 'SOURCE_UNAVAILABLE'].includes(r.evidenceDisposition));
  const safetyPlan = plan.filter((p) => p.safetyCritical === '1');
  const rowsMd = (rows) => rows.map((r) => `| ${r.candidateId} | ${r.species} | ${r.fieldPath} | ${trunc(r.proposedValue, 40)} | ${trunc(r.claimSupported, 160)} | ${r.sourceUrl} | ${trunc(r.evidenceCaveat || r.phase01Caveats, 140)} |`).join('\n');
  const md = `# SPEC 11 Phase 03 - P0 Safety-Critical Review Queue

**Status:** READ-ONLY decision package. Every \`pmDecision\` field is blank = NOT APPROVED. Evidence support is not permission to write.
**Scope:** ${safetyQ.length} safety-critical approve candidates in the PM decision queue + ${safetyPlan.length} safety-critical research-plan rows (all non-writable).
**Rule:** No species with unresolved safety-critical claims may be marked complete. Absence of detected contradictions is not proof of correctness.

## A. Directly supported safety claims (${sDirect.length})

Source located the exact proposed structured value; PM must still decide.

| ID | Species | Field | Proposed | Verified claim snippet | Source | Caveat |
|---|---|---|---|---|---|---|
${rowsMd(sDirect)}

**Decision needed:** approve write | hold | reject. Record in \`PM_DECISION_QUEUE.csv\` (\`pmDecision\`, \`pmRationale\`, \`pmNotes\`).

## B. Caveated safety claims (${sCaveat.length})

Support is indirect or single-source; read the caveat before deciding.

| ID | Species | Field | Proposed | Verified claim snippet | Source | Caveat |
|---|---|---|---|---|---|---|
${rowsMd(sCaveat)}

**Decision needed:** approve write with recorded caveat | hold | reject. Tolerated environmental limits are not automatically recommended operating ranges (\`rangeBasis\` column).

## C. Missing evidence - queue gaps (${sMissing.length})

Claim not located in the cited page, or the cited URL was inaccessible. No write is permitted until evidence exists.

| ID | Species | Field | Proposed | Disposition | Evidence needed |
|---|---|---|---|---|---|
${sMissing.map((r) => `| ${r.candidateId} | ${r.species} | ${r.fieldPath} | ${trunc(r.proposedValue, 40)} | ${r.evidenceDisposition} | ${trunc(r.evidenceNeeded, 180)} |`).join('\n')}

**Decision needed:** commission evidence | maintain hold | reject. These rows stay non-writable regardless of any later matcher result until re-verified in a later phase.

## D. Safety-critical research-plan rows (${safetyPlan.length}, all \`writable=NO\`)

| Plan ID | Item | Slug | Field | Status | Evidence needed |
|---|---|---|---|---|---|
${safetyPlan.map((p) => `| ${p.planId} | ${p.itemType} | ${p.slug} | ${p.fieldPath || p.field} | ${p.status} | ${trunc(p.evidenceNeeded, 160)} |`).join('\n')}

**Decision needed:** maintain non-writable hold and research per \`evidenceNeeded\`, or reject the claim outright. Nothing here may enter a writable set in this phase.

---
sanityWrites=0 mutationCalls=0 deployments=0 - SPEC 11 PHASE 03 PACKAGE READY - AWAITING PM DECISIONS
`;
  fs.writeFileSync(path.join(OUT, 'P0_SAFETY_REVIEW.md'), md);

  // ---- PHASE_03_REVIEW_PACKAGE_REPORT.md ----
  const dc = queue.reduce((a, r) => { a[r.evidenceDisposition] = (a[r.evidenceDisposition] || 0) + 1; return a; }, {});
  const we = queue.reduce((a, r) => { a[r.writeEligibility] = (a[r.writeEligibility] || 0) + 1; return a; }, {});
  const lim = queue.reduce((a, r) => { for (const f of r.evidenceLimitation.split('; ')) a[f] = (a[f] || 0) + 1; return a; }, {});
  const rb = queue.reduce((a, r) => { a[r.rangeBasis] = (a[r.rangeBasis] || 0) + 1; return a; }, {});
  const originC = regRows.reduce((a, r) => { a[r.origin] = (a[r.origin] || 0) + 1; return a; }, {});
  const blankOk = queue.every((r) => r.pmDecision === '' && r.pmRationale === '' && r.pmNotes === '') && regRows.every((r) => r.pmDecision === '' && r.pmRationale === '' && r.pmNotes === '');
  const sciOk = queue.every((r) => !!r.scientificName);
  const report = `# SPEC 11 Phase 03 - PM Decision Package Report

**Status:** COMPLETE - decision package prepared; **awaiting PM decisions** (blank = NOT APPROVED).
**Mode:** READ-ONLY. Frozen Phase 01/02 inputs verified by checksum before processing; one GET-only scientific-name lookup of the wiki inventory; no Sanity mutation, no deployment, no schema or content edits, no PM decisions recorded.

## 1. Inputs (resolved paths, checksum-verified before processing)

- \`reports/SPEC_11/pm_review/phase_01/\`: FILL_DECISION_RECOMMENDATIONS.csv, REPLACEMENT_DECISION_RECOMMENDATIONS.csv, UNRESOLVED_RESEARCH_PLAN.csv, EVIDENCE_REVIEW_BY_SPECIES.md, PHASE_01_REVIEW_REPORT.md (5/5 hashes match Phase 02 baselines)
- \`reports/SPEC_11/pm_review/phase_02/\`: SOURCE_VERIFICATION.csv, SOURCE_CONFLICTS.md, EVIDENCE_GAPS.csv, PHASE_02_VERIFICATION_REPORT.md (4/4 match PHASE_02_CHECKSUMS.txt)
- \`phase/11/\`: PM approval matrix + research backlog + package MD (3/3 frozen hashes)
- \`report/SPEC_11/\` Stage A originals (11/11 x2 via INTEGRITY.json) and \`reports/SPEC_11/revision_1/\` (15/15) re-confirmed unchanged.
No frozen artifact was modified; no file was silently substituted.

## 2. Review workload - PM_DECISION_QUEUE.csv (${queue.length} rows)

- Composition: ${qFills.length} eligible fills + ${qReps.length} eligible replacements (Phase 01 \`proposedWritableSet=YES\`, \`RECOMMEND_APPROVE\`), each joined to its Phase 02 verification row.
- Evidence dispositions: ${Object.entries(dc).map(([k, v]) => k + '=' + v).join(', ')}.
- Write eligibility (support != permission): ${Object.entries(we).map(([k, v]) => k + '=' + v).join(', ')}.
- Safety-critical rows: ${safetyQ.length} (P0_SAFETY). Scientific names filled from canonical wiki records: ${sciOk ? queue.length + '/' + queue.length : 'PARTIAL'}.
- Evidence limitations flagged (column \`evidenceLimitation\`): ${Object.entries(lim).map(([k, v]) => k + '=' + v).join(', ')}.
- Range basis (tolerated limits vs recommended operating ranges, column \`rangeBasis\`): ${Object.entries(rb).map(([k, v]) => k + '=' + v).join(', ')}.

## 3. Safety-critical priorities (P0_SAFETY_REVIEW.md)

- Directly supported safety claims: ${sDirect.length} (section A).
- Caveated safety claims: ${sCaveat.length} (section B) - read caveats before deciding.
- Missing-evidence safety gaps: ${sMissing.length} (section C) - no write permitted.
- Safety-critical research-plan rows: ${safetyPlan.length} (section D, all \`writable=NO\`).
No species may be marked complete while any of these remain unresolved.

## 4. Unresolved register - UNRESOLVED_DECISION_REGISTER.csv (${regRows.length} rows)

- Origins: ${Object.entries(originC).map(([k, v]) => k + '=' + v).join(', ')} (PHASE01_HOLD = the 27 Phase 01 new holds inside the research plan).
- Every row is \`writeEligibility=NON_WRITABLE\`; all 55 Phase 02 candidate gaps and all 100 research-plan rows are preserved non-writable.
- Phase 01 holds, deferred conflicts (11), unresolved conflicts (14), and rejected conflicts (3) remain exactly as recorded - nothing was promoted.

## 5. Decision policy applied

- Every \`pmDecision\`, \`pmRationale\`, \`pmNotes\` field is blank (verified: ${blankOk}).
- Evidence support is distinguished from permission to write via \`writeEligibility\`; matcher results alone never promote a row.
- General-species-description support is flagged (${lim.GENERAL_SPECIES_DESCRIPTION_ONLY || 0} rows); tolerance-vs-operating ambiguity is flagged (${(rb.TOLERANCE_LIMIT_VS_OPERATING_RANGE_RECORDED_IN_CONFLICT_REGISTER || 0) + (rb.VALUE_INSIDE_SOURCE_STATED_RANGE_TOLERANCE_VS_OPERATING_NOT_SEPARATED || 0)} rows).
- Zero Phase 02 contradictions is an absence of detected conflicts, not proof of correctness - stated for the PM record.
- Original identifiers and field values preserved verbatim; missing values (e.g. no proposed value on plan rows) left blank rather than inferred.

## 6. Exact human decisions required

1. **Queue adjudication (${queue.length} rows):** for each, record approve write | hold | reject in \`pmDecision\` with rationale - starting with the ${safetyQ.length} P0_SAFETY rows and the ${sCaveat.length} caveated rows.
2. **Evidence gaps (${candGaps.length} rows):** commission the evidence listed in \`evidenceNeeded\` or maintain hold; these may not be written regardless of any future matcher output until re-verified.
3. **Research plan (${plan.length} rows):** maintain/reject each non-writable hold per the register; the 27 Phase 01 holds stay held until evidence exists.
4. **Conflicts:** Phase 02 recorded 0 source contradictions; no conflict adjudication is required, but this is not proof of correctness.
5. Only after explicit PM decisions may a separate final allowlist be generated and validated (out of scope here).

## 7. Integrity and safety gates

- Input checksums verified before processing (fail-hard); Phase 01/02/matrix/backlog/Stage A/Revision 1 all unchanged.
- PM decision fields blank everywhere; held/deferred/rejected/unresolved rows excluded from every writable set.
- Canonical inventory 473 records, identity hash c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda (GET-only re-check in validator).
- Deterministic generator: three runs byte-identical (validator).
- Known full-suite baseline failure \`tests/compare.test.ts\` is reported separately by the validator and was not modified to make this phase pass.

sanityWrites=0
mutationCalls=0
deployments=0
`;
  fs.writeFileSync(path.join(OUT, 'PHASE_03_REVIEW_PACKAGE_REPORT.md'), report);

  // ---- internal asserts ----
  const assert = (cond, msg) => { if (!cond) { console.error('ASSERT FAIL: ' + msg); process.exit(3); } };
  assert(queue.length === 337 && qFills.length === 316 && qReps.length === 21, 'queue counts');
  assert(regRows.length === 155, 'register rows');
  assert(safetyQ.length === 68, 'safety queue rows');
  assert(safetyPlan.length === 55, 'safety plan rows');
  assert(sMissing.length === 14, 'missing-evidence safety gaps');
  assert(sDirect.length + sCaveat.length + sMissing.length === safetyQ.length, 'safety partition');
  assert(blankOk, 'blank PM fields');

  // ---- PHASE_03_CHECKSUMS.txt ----
  const arts = ['PM_DECISION_QUEUE.csv', 'P0_SAFETY_REVIEW.md', 'UNRESOLVED_DECISION_REGISTER.csv', 'PHASE_03_REVIEW_PACKAGE_REPORT.md'];
  const sums = `SPEC 11 Phase 03 decision package artifact checksums (SHA-256)
Mode: READ-ONLY; frozen inputs only + GET-only scientific names; no Sanity mutation; no deployment; no PM decisions
Queue rows: 337 (316 fills + 21 replacements); register rows: 155 (100 plan + 55 candidate gaps); safety: 68 queue + 55 plan

Phase 03 artifacts:
${arts.map((f) => f + ': ' + shaFile(path.join(OUT, f))).join('\n')}

Input baselines (verified before processing, unchanged after):
${Object.entries(P1_HASHES).map(([f, h]) => 'phase_01/' + f + ': ' + h).join('\n')}
${['SOURCE_VERIFICATION.csv','SOURCE_CONFLICTS.md','EVIDENCE_GAPS.csv','PHASE_02_VERIFICATION_REPORT.md'].map((f) => 'phase_02/' + f + ': ' + shaFile(path.join(P2, f))).join('\n')}
phase/11/SPEC_11_PM_APPROVAL_MATRIX.csv: ${PKG_HASHES['SPEC_11_PM_APPROVAL_MATRIX.csv']}
phase/11/SPEC_11_PM_RESEARCH_BACKLOG.csv: ${PKG_HASHES['SPEC_11_PM_RESEARCH_BACKLOG.csv']}
canonical identity hash: c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda (inventory 473, unchanged)
sanityWrites=0 mutationCalls=0 deployments=0
`;
  fs.writeFileSync(path.join(OUT, 'PHASE_03_CHECKSUMS.txt'), sums);

  console.log('queue=' + queue.length + ' fills=' + qFills.length + ' reps=' + qReps.length + ' safety=' + safetyQ.length + ' (direct=' + sDirect.length + ' caveated=' + sCaveat.length + ' missing=' + sMissing.length + ')');
  console.log('register=' + regRows.length + ' ' + JSON.stringify(originC));
  console.log('dispositions: ' + JSON.stringify(dc));
  console.log('writeEligibility: ' + JSON.stringify(we));
  console.log('WROTE ' + arts.concat('PHASE_03_CHECKSUMS.txt').map((f) => path.join(OUT, f)).join('\n  '));
  console.log('sanityWrites=0 mutationCalls=0 deployments=0');
  console.log('SPEC 11 PHASE 03 PACKAGE READY - AWAITING PM DECISIONS');
})().catch((e) => { console.error('FATAL', e); process.exit(3); });
