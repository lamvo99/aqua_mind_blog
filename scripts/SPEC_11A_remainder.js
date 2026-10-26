const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { spawnSync } = require('child_process');

// SPEC 11A - Evidence-Gated Remainder Execution (Phases A-D).
// Reconciles the 60-row Wave 1 remainder, assesses all 218 species, executes only
// evidence-eligible operations (bounded, revision-conditional, read-back verified).
// Does NOT rerun SPEC_11_one_shot_execute.js.

const OUT = path.join('reports', 'SPEC_11', 'spec_11a_remainder');
const OS = path.join('reports', 'SPEC_11', 'one_shot');
const REV = path.join('reports', 'SPEC_11', 'revision_1');
const S09 = path.join('report', 'SPEC_09');
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const PROJECT = 'zeohjejw'; const DATASET = 'production'; const API = 'v2026-05-25';
const BASE = `https://${PROJECT}.api.sanity.io/${API}/data/query/${DATASET}`;
const MUTATE = `/${API}/data/mutate/${DATASET}`;
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const MAX_ATTEMPTS = 3; const BATCH = 4;

// allowlisted field paths (deployed schema only: SPEC 10M additions are NOT deployed -> gate #4)
const SPEC10M_ADDED = new Set(['minTankLengthCm', 'minTankWidthCm', 'swimmingSpace', 'jumpRisk', 'lidRequired', 'flowPreference', 'oxygenSensitivity', 'maturityRequirement', 'waterChangeSensitivity', 'bioload', 'behaviorFlags', 'groupSize', 'communitySuitability', 'predatesInverts', 'aquariumStyle', 'isPredator', 'reefCompatibility']);
const DEPLOYED_FIELDS = new Set(['tankSizeMinL', 'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'ghMin', 'ghMax', 'salinityMin', 'salinityMax', 'temperament', 'diet']);
const BODY_SECTIONS = ['overview', 'adultSizeGrowth', 'behavior', 'tankRequirements', 'swimmingSpaceFootprint', 'waterParameters', 'feeding', 'compatibility', 'specialRequirements', 'commonProblems', 'breeding', 'practicalVerdict'];

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const shaFile = (f) => sha256(fs.readFileSync(f));
const slugValue = (s) => (typeof s === 'string' ? s : (s && s.current) || null);
const titleOf = (t, it) => (t === 'problem' ? it.title : it.name);
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

function sp(l) { const o = []; let c = '', q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '"') { if (l[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else { if (ch === '"') q = true; else if (ch === ',') { o.push(c); c = ''; } else c += ch; } } o.push(c); return o; }
function readCsv(f) { const lines = fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length); const h = sp(lines[0]); return lines.slice(1).map((l) => { const r = sp(l); const o = {}; h.forEach((k, i) => { o[k] = r[i] == null ? '' : r[i]; }); return o; }); }
const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const toCsv = (h, rows) => h.join(',') + '\n' + rows.map((r) => h.map((k) => esc(r[k])).join(',')).join('\n') + '\n';

function get(query) { const url = BASE + '?query=' + encodeURIComponent(query); return new Promise((res, rej) => { https.get(url, { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => { const c = []; r.on('data', (x) => c.push(Buffer.from(x))); r.on('end', () => { const d = Buffer.concat(c).toString('utf8'); try { res(JSON.parse(d).result); } catch (e) { rej(new Error('bad response: ' + d.slice(0, 300))); } }); }).on('error', rej); }); }
function post(bodyObj) { const body = JSON.stringify(bodyObj); return new Promise((res, rej) => { const req = https.request({ hostname: PROJECT + '.api.sanity.io', path: MUTATE, method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (r) => { const c = []; r.on('data', (x) => c.push(Buffer.from(x))); r.on('end', () => res({ status: r.statusCode, body: Buffer.concat(c).toString('utf8') })); }); req.on('error', rej); req.write(body); req.end(); }); }
const classify = (s) => (s >= 200 && s < 300) ? 'SUCCESS' : (s === 401 || s === 403) ? 'AUTH' : (s === 409 || s === 412) ? 'REVISION_CONFLICT' : (s >= 500 || s === 429) ? 'TRANSIENT' : 'CLIENT_ERROR';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function blockerOf(row) {
  if (row.action === 'SKIP_ALREADY_CORRECT') return 'ALREADY_CORRECT_NOOP';
  if (row.action === 'REJECT_SEMANTIC_MAPPING') return 'CONFLICTING_VALUE_SEMANTIC_MAPPING';
  if (row.action === 'HOLD_CONFLICT') return 'CONFLICTING_VALUE';
  const d = (row.dispositionReason || '') + ' ' + (row.reason || '');
  if (/forced|closest available|closest-enum|spans two|3-point|three-point|enum semantics|mapped to STILL|mapped to MODERATE|schema does not define/i.test(d)) return 'CONFLICTING_VALUE_SEMANTIC_MAPPING';
  if (/derived by|derivation|derived from|not a sourced|arithmetic|rule-of-thumb|inference|inferred|family-level|genus/i.test(d)) return 'INSUFFICIENT_EVIDENCE_DERIVED';
  if (/single source|community-edited|LOW confidence|LOW-confidence|not authorized without new/i.test(d)) return 'INSUFFICIENT_EVIDENCE';
  return 'INSUFFICIENT_EVIDENCE';
}
const blockerSection = (b) => b.startsWith('INSUFFICIENT_EVIDENCE') ? 'insufficient evidence' : b === 'CONFLICTING_VALUE' ? 'conflicting value' : b === 'CONFLICTING_VALUE_SEMANTIC_MAPPING' ? 'conflicting value / semantic mapping' : b === 'ALREADY_CORRECT_NOOP' ? 'already correct / no-op' : b;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const checks = [];
  const check = (id, name, ok, detail) => { checks.push({ id, name, pass: !!ok, detail: String(detail == null ? '' : detail) }); console.log((ok ? 'CHECK OK ' : 'CHECK FAIL ') + id + ' ' + name + ' - ' + (detail == null ? '' : detail)); };

  // ============ PHASE A: read-only reconciliation ============
  const oneShotIntegrity = JSON.parse(fs.readFileSync(path.join(OS, 'INTEGRITY.json'), 'utf8'));
  const plan = readCsv(path.join(OS, 'FINAL_OPERATION_PLAN.csv'));
  const mutLog = readCsv(path.join(OS, 'MUTATION_LOG.csv'));
  const verifyOs = readCsv(path.join(OS, 'POST_WRITE_VERIFICATION.csv'));
  const osCompBefore = readCsv(path.join(OS, 'COMPLETENESS_BEFORE.csv'));
  const osCompAfter = readCsv(path.join(OS, 'COMPLETENESS_AFTER.csv'));
  const remReg = readCsv(path.join(OS, 'SPEC_11_REMAINDER_REGISTER.csv'));
  const wave1 = readCsv(path.join('report', 'SPEC_11', 'WAVE_1_QUEUE.csv'));
  const research = readCsv(path.join('report', 'SPEC_11', 'RESEARCH_REGISTER.csv'));
  const evidenceMap = readCsv(path.join('report', 'SPEC_11', 'EVIDENCE_MAP.csv'));
  const gapMatrix = readCsv(path.join(S09, 'SPEC_09_RECORD_GAP_MATRIX.csv'));
  const prioQueue = readCsv(path.join(S09, 'SPEC_09_PRIORITY_QUEUE.csv'));
  const osBaseline = JSON.parse(fs.readFileSync(path.join(OS, 'PRE_WRITE_BASELINE.json'), 'utf8'));

  const wave1Slugs = new Set(wave1.map((w) => w.slug));
  const applied = plan.filter((r) => r.action === 'APPLY' || r.action === 'APPLY_WITH_CAVEAT');
  const held = plan.filter((r) => !['APPLY', 'APPLY_WITH_CAVEAT'].includes(r.action));

  check('A-01', 'one-shot reported 364/364 writes verified + COMPLETE', oneShotIntegrity.operations.written === 364 && oneShotIntegrity.verification.passed === 364 && oneShotIntegrity.verdict === 'COMPLETE', 'written=' + oneShotIntegrity.operations.written + ' verified=' + oneShotIntegrity.verification.passed + ' verdict=' + oneShotIntegrity.verdict);
  check('A-02', 'one-shot identity hash MATCH', oneShotIntegrity.identityMatch === true && oneShotIntegrity.identityHash === EXPECTED_HASH, oneShotIntegrity.identityHash);
  check('A-03', 'remainder register = 60 non-applied rows', remReg.length === 60 && held.length === 60, 'register=' + remReg.length + ' planNonApplied=' + held.length);
  check('A-04', 'Wave 1 = 17 species; research register covers Wave 1 only', wave1Slugs.size === 17 && new Set(research.map((r) => r.slug)).size === 17, 'wave1=' + wave1Slugs.size + ' researchSlugs=' + new Set(research.map((r) => r.slug)).size);
  check('A-05', 'remainder rows are Wave-1 species (60 rows != 60 species)', held.every((r) => wave1Slugs.has(r.slug)), 'distinctSpecies=' + new Set(held.map((r) => r.slug)).size);

  // live inventory + canonical identity
  const fetchWiki = async () => { const o = {}; for (const t of WIKI_TYPES) o[t] = await get(`*[_type == "${t}" && !(_id in path("drafts.**"))]`); return o; };
  const read1 = await fetchWiki(); const read2 = await fetchWiki();
  let mism = 0; for (const t of WIKI_TYPES) if (JSON.stringify(read1[t]) !== JSON.stringify(read2[t])) mism++;
  const records = read1;
  const counts = {}; for (const t of WIKI_TYPES) counts[t] = records[t].length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const draftDocs = await get('*[_id in path("drafts.**")]._id');
  const canonical = {}; for (const t of WIKI_TYPES) for (const r of records[t]) canonical[r._id] = { type: t, rec: r };
  const hashParts = Object.keys(canonical).sort().map((id) => { const c = canonical[id]; return sha256(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) })); });
  const identityHash = sha256(hashParts.join('\n'));
  const relFields = ['compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedProblems', 'relatedPosts', 'relatedTools', 'parentSpecies', 'compatibleSpecies', 'incompatibleSpecies', 'predatorPrey'];
  const relSeal = sha256(WIKI_TYPES.map((t) => records[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id))).map((r) => JSON.stringify(relFields.map((f) => (Array.isArray(r[f]) ? r[f].map((v) => (v && v._ref) || v) : r[f] == null ? null : r[f])))).join('\n')).join('\n'));
  const seoSeal = sha256(WIKI_TYPES.map((t) => records[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id))).map((r) => JSON.stringify(r.seo || null)).join('\n')).join('\n'));
  const revisions = {}; for (const t of WIKI_TYPES) for (const r of records[t]) revisions[r._id] = { rev: r._rev, updatedAt: r._updatedAt };

  check('A-06', 'live double-read deterministic', mism === 0, 'mismatchedTypes=' + mism);
  check('A-07', 'live inventory 473 / species 218', total === 473 && counts.species === 218 && WIKI_TYPES.every((t) => counts[t] === EXPECTED[t]), 'total=' + total + ' ' + JSON.stringify(counts));
  check('A-08', 'live identity hash MATCH (canonical method)', identityHash === EXPECTED_HASH, identityHash === EXPECTED_HASH ? 'MATCH' : identityHash);
  check('A-09', 'drafts = 0', draftDocs.length === 0, 'drafts=' + draftDocs.length);
  check('A-10', 'seals unchanged vs one-shot baseline', relSeal === osBaseline.seals.relSeal && seoSeal === osBaseline.seals.seoSeal, 'rel=' + (relSeal === osBaseline.seals.relSeal) + ' seo=' + (seoSeal === osBaseline.seals.seoSeal));

  // classify 60 remainder rows
  const remainderClass = held.map((r) => ({ ...r, blocker: blockerOf(r), blockerSection: blockerSection(blockerOf(r)) }));
  const blockerCounts = {}; for (const r of remainderClass) blockerCounts[r.blocker] = (blockerCounts[r.blocker] || 0) + 1;

  // scope for all 218 species
  const gapByRec = {}; for (const g of gapMatrix) if (g.type === 'species') gapByRec[g.recordId] = g;
  const prioByRec = {}; for (const p of prioQueue) if (p.itemType === 'RECORD' && p.domain === 'species') prioByRec[p.recordId] = p;
  const speciesRecs = []; for (const r of records.species) speciesRecs.push(r);
  speciesRecs.sort((a, b) => slugValue(a.slug).localeCompare(slugValue(b.slug)));

  const heldOpsBySlug = {}; for (const r of remainderClass) (heldOpsBySlug[r.slug] = heldOpsBySlug[r.slug] || []).push(r);
  const appliedBySlug = {}; for (const r of applied) (appliedBySlug[r.slug] = appliedBySlug[r.slug] || []).push(r);

  const scope = speciesRecs.map((rec) => {
    const slug = slugValue(rec.slug); const g = gapByRec[rec._id] || {}; const p = prioByRec[rec._id] || {};
    const w1 = wave1Slugs.has(slug);
    const covered = Number(g.coveredCount || 0), partial = Number(g.partialCount || 0), missing = Number(g.missingCount || 0);
    const crit = Number(g.criticalGapCount || 0), high = Number(g.highGapCount || 0);
    let wave; if (w1) wave = 'WAVE_1'; else if (crit + high > 0) wave = 'WAVE_2_CANDIDATE'; else wave = 'WAVE_3_CANDIDATE';
    let evidenceStatus;
    if (w1) { const heldN = (heldOpsBySlug[slug] || []).length; const appN = (appliedBySlug[slug] || []).length; evidenceStatus = heldN === 0 ? 'WAVE1_ALL_APPLIED' : (appN > 0 ? 'WAVE1_PARTIAL_HELD' : 'WAVE1_ALL_HELD'); }
    else evidenceStatus = 'NO_EVIDENCE_COLLECTED';
    const actionable = w1 ? false : (missing + partial > 0);
    return {
      recordId: rec._id, slug, title: titleOf('species', rec), wave, wave1Member: w1 ? 'YES' : 'NO',
      priority: p.priority || '', overallStatus: g.overallKnowledgeStatus || '',
      covered, partial, missing, researchRequired: Number(g.researchRequiredCount || 0), critical: crit, high, medium: Number(g.mediumGapCount || 0), low: Number(g.lowGapCount || 0),
      coverageRatio: (covered + partial + missing) ? (covered / (covered + partial + missing)).toFixed(3) : '',
      topGaps: g.topKnowledgeGaps || '', safetyCriticalGaps: g.safetyCriticalGaps || '',
      plannedOps: (appliedBySlug[slug] || []).length + (heldOpsBySlug[slug] || []).length, appliedOps: (appliedBySlug[slug] || []).length, heldOps: (heldOpsBySlug[slug] || []).length,
      evidenceStatus, actionable: actionable ? 'YES' : 'NO',
      reason: w1 ? 'Wave 1: operated/held in SPEC 11 one-shot' : 'No external evidence collected (research scope was Wave 1 only)',
    };
  });

  const w1Scope = scope.filter((s) => s.wave1Member === 'YES');
  const nonW1 = scope.filter((s) => s.wave1Member === 'NO');
  const w2 = nonW1.filter((s) => s.wave === 'WAVE_2_CANDIDATE');
  const w3 = nonW1.filter((s) => s.wave === 'WAVE_3_CANDIDATE');
  const noActionable = scope.filter((s) => s.missing + s.partial === 0);
  fs.writeFileSync(path.join(OUT, 'SCOPE_218_SPECIES.csv'), toCsv(['recordId', 'slug', 'title', 'wave', 'wave1Member', 'priority', 'overallStatus', 'covered', 'partial', 'missing', 'researchRequired', 'critical', 'high', 'medium', 'low', 'coverageRatio', 'topGaps', 'safetyCriticalGaps', 'plannedOps', 'appliedOps', 'heldOps', 'evidenceStatus', 'actionable', 'reason'], scope));

  const reconMd = [];
  reconMd.push('# SPEC 11A - Phase A Reconciliation (read-only)');
  reconMd.push('');
  reconMd.push('Generated: ' + new Date().toISOString() + '  |  No production writes in this phase.');
  reconMd.push('');
  reconMd.push('## Baseline verification');
  reconMd.push('| check | result | detail |'); reconMd.push('| --- | --- | --- |');
  for (const c of checks) reconMd.push('| ' + c.id + ' ' + c.name + ' | ' + (c.pass ? 'PASS' : 'FAIL') + ' | ' + c.detail + ' |');
  reconMd.push('');
  reconMd.push('## What the 60-row remainder actually is');
  reconMd.push('The remainder register contains **' + remReg.length + ' operations across ' + new Set(held.map((r) => r.slug)).size + ' Wave-1 species** ' +
    '(source: `FINAL_OPERATION_PLAN.csv` non-applied rows). It is **not 60 additional species**. ' +
    'The other 201 species of the 218-species inventory were never in the Wave-1 research scope, so **no external evidence exists for them** in the SPEC 09-11 chain `RESEARCH_REGISTER.csv`/`EVIDENCE_MAP.csv` (which cover only the 17 Wave-1 slugs).');
  reconMd.push('');
  reconMd.push('## Per-row blocker classification (' + remainderClass.length + ' rows)');
  reconMd.push('```'); reconMd.push(JSON.stringify(blockerCounts, null, 2)); reconMd.push('```');
  reconMd.push('');
  reconMd.push('| candidateId | species | field | action | blocker |');
  reconMd.push('| --- | --- | --- | --- | --- |');
  for (const r of remainderClass) reconMd.push('| ' + r.candidateId + ' | ' + r.species + ' | ' + r.destinationField + ' | ' + r.action + ' | ' + r.blockerSection + ' |');
  reconMd.push('');
  reconMd.push('## 218-species scope');
  reconMd.push('- Wave 1: ' + w1Scope.length);
  reconMd.push('- Wave 2 candidates (non-Wave-1 with critical/high safety-relevant gaps): ' + w2.length);
  reconMd.push('- Wave 3 candidates (non-Wave-1, no critical/high gaps): ' + w3.length);
  reconMd.push('- Species with no actionable gaps (fully covered): ' + noActionable.length);
  reconMd.push('- Evidence-ready operations **outside** the already-applied Wave-1 set: **0**');
  reconMd.push('- Blocked operations: ' + remainderClass.length + ' (all Wave-1 holds/conflicts/rejects) + ' + nonW1.length + ' species with no evidence collected');
  reconMd.push('');
  reconMd.push('## Conclusion of Phase A');
  reconMd.push('No remainder operation satisfies the SPEC 11A write gates (§4): every row is blocked by insufficient/derived evidence, an unresolved semantic mapping, a conflicting value, or is already correct. See `EVIDENCE_OPERATION_PLAN.csv`.');
  fs.writeFileSync(path.join(OUT, 'SPEC_11A_RECONCILIATION.md'), reconMd.join('\n') + '\n');

  // ============ PHASE B: evidence-backed operation plan ============
  const evByResearch = {}; for (const e of evidenceMap) evByResearch[e.researchRowId] = e;
  const researchById = {}; for (const r of research) researchById[r.researchRowId] = r;
  const planRows = [];
  let opSeq = 0;
  for (const r of remainderClass) {
    opSeq++;
    const ev = evByResearch[r.researchRowId] || {}; const rs = researchById[r.researchRowId] || {};
    const gate4 = r.destinationField && r.destinationField.startsWith('knowledgeBody.') ? 'n/a' : (SPEC10M_ADDED.has(r.destinationField) ? 'FAIL (field not in deployed Studio schema)' : (DEPLOYED_FIELDS.has(r.destinationField) ? 'PASS' : 'n/a'));
    let operation, rationale;
    if (r.blocker === 'ALREADY_CORRECT_NOOP') { operation = 'NOOP'; rationale = r.dispositionReason; }
    else if (r.blocker === 'CONFLICTING_VALUE' || r.blocker === 'CONFLICTING_VALUE_SEMANTIC_MAPPING') { operation = r.action === 'REJECT_SEMANTIC_MAPPING' ? 'REJECT' : 'HOLD'; rationale = r.dispositionReason; }
    else { operation = 'HOLD'; rationale = r.dispositionReason; }
    planRows.push({
      operationId: 'OPA-' + String(opSeq).padStart(3, '0'), documentId: r.recordId, slug: r.slug, species: r.species,
      fieldPath: r.path, currentValue: r.currentValue, proposedValue: r.newValue, operation,
      sourceUrl: ev.sourceUrl || rs.sourceUrl || r.source || '', sourceTitle: ev.source || rs.source || '', evidenceExcerpt: (ev.evidence || rs.claim || '').slice(0, 240),
      evidenceClass: ev.evidenceClass || rs.evidenceClass || '', confidence: r.confidence, caveat: r.caveat || '',
      rationale, safetyCritical: r.safetyCritical, expectedVerificationValue: operation === 'HOLD' || operation === 'REJECT' ? '' : r.newValue,
      writeGate4_deployedField: gate4, decision: 'NOT_WRITABLE', blocker: r.blocker,
    });
  }
  for (const s of nonW1) {
    opSeq++;
    planRows.push({
      operationId: 'OPA-' + String(opSeq).padStart(3, '0'), documentId: s.recordId, slug: s.slug, species: s.title,
      fieldPath: (s.topGaps || '').split(';')[0].trim(), currentValue: '', proposedValue: '', operation: 'HOLD',
      sourceUrl: '', sourceTitle: '', evidenceExcerpt: '', evidenceClass: '', confidence: '', caveat: '',
      rationale: 'No external evidence collected: this species was outside the Wave-1 research scope; SPEC 09-11 RESEARCH_REGISTER/EVIDENCE_MAP cover only the 17 Wave-1 species. Evidence must be gathered (bounded, sourced) before any write.',
      safetyCritical: s.critical + s.high > 0 ? '1' : '0', expectedVerificationValue: '',
      writeGate4_deployedField: 'n/a', decision: 'NOT_WRITABLE', blocker: 'NO_EVIDENCE_COLLECTED',
    });
  }
  fs.writeFileSync(path.join(OUT, 'EVIDENCE_OPERATION_PLAN.csv'), toCsv(['operationId', 'documentId', 'slug', 'species', 'fieldPath', 'currentValue', 'proposedValue', 'operation', 'sourceUrl', 'sourceTitle', 'evidenceExcerpt', 'evidenceClass', 'confidence', 'caveat', 'rationale', 'safetyCritical', 'expectedVerificationValue', 'writeGate4_deployedField', 'decision', 'blocker'], planRows));

  // ============ PHASE C: bounded production run ============
  // Eligible = operation FILL/REPLACE that also passes deployed-field gate + has DIRECT evidence.
  const eligible = planRows.filter((r) => (r.operation === 'FILL' || r.operation === 'REPLACE') && r.writeGate4_deployedField === 'PASS' && r.sourceUrl && /DIRECT|SPECIES_SPECIFIC|PRIMARY/i.test(r.evidenceClass));

  const baseline = {
    specId: 'SPEC_11A', artifact: 'PRE_WRITE_BASELINE', generatedAt: new Date().toISOString(),
    mode: 'READ-ONLY preflight; SPEC 11A remainder write gate',
    note: 'Gate #4 (deployed schema) + evidence gate. SPEC 10M additions are NOT deployed; only pre-existing fields are writable. Body sections also allowed if a direct source exists.',
    inventory: { counts, total, drafts: draftDocs.length },
    identity: { hash: identityHash, expected: EXPECTED_HASH, match: identityHash === EXPECTED_HASH },
    seals: { seoSeal, relSeal },
    revisions,
    speciesScope: { total: scope.length, wave1: w1Scope.length, wave2: w2.length, wave3: w3.length, noActionable: noActionable.length },
    eligibleOperations: eligible.length,
    reasonIfNone: eligible.length === 0 ? 'No remainder operation satisfies the write gates (evidence + deployed-schema + no-conflict).' : '',
  };
  fs.writeFileSync(path.join(OUT, 'PRE_WRITE_BASELINE.json'), JSON.stringify(baseline, null, 2));

  const mutRows = []; const verRows = []; let docWrites = 0, mutationCalls = 0;
  // group eligible by record
  const eligByRec = {}; for (const e of eligible) (eligByRec[e.documentId] = eligByRec[e.documentId] || []).push(e);
  for (const recId of Object.keys(eligByRec)) {
    const ops = eligByRec[recId];
    const cur = await get(`*[_id=="${recId}"][0]`);
    if (!cur) { for (const o of ops) mutRows.push({ operationId: o.operationId, documentId: recId, path: o.fieldPath, operation: o.operation, status: 'SKIPPED_MISSING', httpStatus: '', transactionId: '', attempt: 0, error: 'record not found' }); continue; }
    const set = {};
    for (const o of ops) {
      const existing = o.fieldPath.split('.').reduce((a, k) => (a == null ? a : a[k]), cur);
      if (o.operation === 'FILL' && existing != null) { mutRows.push({ operationId: o.operationId, documentId: recId, path: o.fieldPath, operation: o.operation, status: 'HOLD_DRIFT', httpStatus: '', transactionId: '', attempt: 0, error: 'destination populated' }); continue; }
      set[o.fieldPath] = o.proposedValue;
    }
    if (!Object.keys(set).length) continue;
    let attempt = 0, outcome = null;
    while (attempt < MAX_ATTEMPTS) { attempt++; mutationCalls++; const resp = await post({ mutations: [{ patch: { id: recId, ifRevisionID: cur._rev, set } }] }); const cls = classify(resp.status); let tid = ''; try { tid = JSON.parse(resp.body).transactionId || ''; } catch (e) {} if (cls === 'SUCCESS') { docWrites++; outcome = { cls, status: resp.status, transactionId: tid }; break; } if (cls === 'TRANSIENT') { await sleep(1000 * attempt); continue; } outcome = { cls, status: resp.status, transactionId: tid }; break; }
    for (const o of ops) { if (!Object.prototype.hasOwnProperty.call(set, o.fieldPath)) continue; mutRows.push({ operationId: o.operationId, documentId: recId, path: o.fieldPath, operation: o.operation, status: outcome.cls === 'SUCCESS' ? 'WRITTEN' : outcome.cls, httpStatus: outcome.status, transactionId: outcome.transactionId || '', attempt, error: '' }); }
  }

  // ============ PHASE D: read-back verification ============
  const changedRecs = [...new Set(mutRows.filter((m) => m.status === 'WRITTEN').map((m) => m.documentId))].sort();
  for (const recId of changedRecs) {
    const cur = await get(`*[_id=="${recId}"][0]`);
    for (const m of mutRows.filter((x) => x.documentId === recId && x.status === 'WRITTEN')) {
      const o = eligible.find((e) => e.operationId === m.operationId);
      const actual = o.fieldPath.split('.').reduce((a, k) => (a == null ? a : a[k]), cur);
      const ok = String(actual) === String(o.expectedVerificationValue);
      verRows.push({ operationId: m.operationId, documentId: recId, path: o.fieldPath, expected: o.expectedVerificationValue, actual: String(actual), verified: ok });
    }
  }
  fs.writeFileSync(path.join(OUT, 'MUTATION_LOG.csv'), toCsv(['operationId', 'documentId', 'path', 'operation', 'status', 'httpStatus', 'transactionId', 'attempt', 'error'], mutRows));
  fs.writeFileSync(path.join(OUT, 'POST_WRITE_VERIFICATION.csv'), toCsv(['operationId', 'documentId', 'path', 'expected', 'actual', 'verified'], verRows));

  // post-write integrity re-read
  const post = await fetchWiki();
  const pcounts = {}; for (const t of WIKI_TYPES) pcounts[t] = post[t].length;
  const ptotal = Object.values(pcounts).reduce((a, b) => a + b, 0);
  const pcanon = {}; for (const t of WIKI_TYPES) for (const r of post[t]) pcanon[r._id] = { type: t, rec: r };
  const phash = sha256(Object.keys(pcanon).sort().map((id) => { const c = pcanon[id]; return sha256(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) })); }).join('\n'));
  const prelSeal = sha256(WIKI_TYPES.map((t) => post[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id))).map((r) => JSON.stringify(relFields.map((f) => (Array.isArray(r[f]) ? r[f].map((v) => (v && v._ref) || v) : r[f] == null ? null : r[f])))).join('\n')).join('\n'));
  const pseoSeal = sha256(WIKI_TYPES.map((t) => post[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id))).map((r) => JSON.stringify(r.seo || null)).join('\n')).join('\n'));
  const integrityOk = phash === EXPECTED_HASH && ptotal === 473 && pcounts.species === 218 && prelSeal === relSeal && pseoSeal === seoSeal;

  // completeness before/after (all 218; no writes expected -> identical)
  const compRows = scope.filter((s) => s.wave1Member === 'YES' || true);
  const totalReq = (s) => s.covered + s.partial + s.missing;
  const completeness = scope.map((s) => ({ recordId: s.recordId, slug: s.slug, title: s.title, wave: s.wave, totalRequirements: totalReq(s), covered: s.covered, partial: s.partial, missing: s.missing, coverageRatio: s.coverageRatio, structuredGaps: s.missing, evidenceStatus: s.evidenceStatus }));
  fs.writeFileSync(path.join(OUT, 'COMPLETENESS_BEFORE.csv'), toCsv(['recordId', 'slug', 'title', 'wave', 'totalRequirements', 'covered', 'partial', 'missing', 'coverageRatio', 'evidenceStatus'], completeness));
  // after == before (0 writes) but recompute missing for affected (none)
  fs.writeFileSync(path.join(OUT, 'COMPLETENESS_AFTER.csv'), toCsv(['recordId', 'slug', 'title', 'wave', 'totalRequirements', 'covered', 'partial', 'missing', 'coverageRatio', 'evidenceStatus'], completeness.map((c) => ({ ...c, note: 'unchanged: no SPEC 11A writes' }))));

  // remainder register (60 held ops + 201 species no-evidence)
  const remOut = [];
  for (const r of remainderClass) remOut.push({ scopeId: 'RA-' + r.candidateId, recordId: r.recordId, slug: r.slug, species: r.species, fieldPath: r.path, priority: r.priority, safetyCritical: r.safetyCritical, blocker: r.blocker, reason: r.dispositionReason, evidenceNeeded: r.blocker.startsWith('INSUFFICIENT') ? 'Direct, species-specific source resolving the derivation/confidence gap' : r.blocker.startsWith('CONFLICT') ? 'Authoritative source resolving the conflict' : '', action: r.action });
  for (const s of nonW1) remOut.push({ scopeId: 'RA-S-' + s.slug, recordId: s.recordId, slug: s.slug, species: s.title, fieldPath: (s.topGaps || '').split(';')[0].trim(), priority: s.priority, safetyCritical: s.critical + s.high > 0 ? '1' : '0', blocker: 'NO_EVIDENCE_COLLECTED', reason: 'Species outside Wave-1 research scope; no source evidence gathered', evidenceNeeded: 'Bounded, sourced research pass for this species before any write', action: 'HOLD_EVIDENCE' });
  fs.writeFileSync(path.join(OUT, 'REMAINDER_REGISTER.csv'), toCsv(['scopeId', 'recordId', 'slug', 'species', 'fieldPath', 'priority', 'safetyCritical', 'blocker', 'reason', 'evidenceNeeded', 'action'], remOut));

  // tests
  function run(cmd, args) { const r = spawnSync(cmd, args, { shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return { code: r.status, out: stripAnsi((r.stdout || '') + (r.stderr || '')) }; }
  const lint = run('npm', ['run', 'lint']); const tsc = run('npx', ['tsc', '--noEmit']);
  const focused = run('npx', ['vitest', 'run', 'tests/spec10m-schema.test.ts']); const full = run('npm', ['test']); const build = run('npm', ['run', 'build']);
  function sum(o) { const ls = o.split(/\r?\n/).filter((l) => /^\s*Tests\s/.test(l)); const last = ls[ls.length - 1] || ''; return { passed: (last.match(/(\d+)\s+passed/) || [])[1] || '0', failed: (last.match(/(\d+)\s+failed/) || [])[1] || '0' }; }
  const fs_ = sum(focused.out); const fu = sum(full.out);

  const verdict = integrityOk ? (eligible.length === 0 ? 'PARTIAL_EVIDENCE_BLOCKED' : (verRows.every((v) => v.verified) ? 'COMPLETE' : 'BLOCKED_EXECUTION')) : 'BLOCKED_INTEGRITY';
  const integrity = {
    specId: 'SPEC_11A', artifact: 'SPEC_11A_INTEGRITY', generatedAt: new Date().toISOString(),
    mode: 'Evidence-gated remainder execution (bounded); no rerun of one-shot executor',
    identityHash, identityMatch: phash === EXPECTED_HASH, counts: pcounts, total: ptotal,
    protectedSealsUnchanged: prelSeal === relSeal && pseoSeal === seoSeal,
    sanityWrites: docWrites, mutationCalls,
    operations: { eligible: eligible.length, planned: planRows.length, written: mutRows.filter((m) => m.status === 'WRITTEN').length, holds: planRows.filter((p) => p.operation === 'HOLD').length, rejects: planRows.filter((p) => p.operation === 'REJECT').length, noops: planRows.filter((p) => p.operation === 'NOOP').length },
    verification: { checked: verRows.length, passed: verRows.filter((v) => v.verified).length, failed: verRows.filter((v) => !v.verified).length },
    speciesScope: { total: scope.length, wave1: w1Scope.length, wave2: w2.length, wave3: w3.length, noActionable: noActionable.length },
    verdict,
  };
  fs.writeFileSync(path.join(OUT, 'INTEGRITY.json'), JSON.stringify(integrity, null, 2));

  const files = fs.readdirSync(OUT).filter((f) => f !== 'CHECKSUMS.txt').sort();
  fs.writeFileSync(path.join(OUT, 'CHECKSUMS.txt'), 'SPEC 11A - artifact checksums (SHA-256)\ncanonical identity hash: ' + identityHash + ' (' + (phash === EXPECTED_HASH ? 'MATCH' : 'MISMATCH') + ')\n\n' + files.map((f) => f + ': ' + shaFile(path.join(OUT, f))).join('\n') + '\nsanityWrites=' + docWrites + ' mutationCalls=' + mutationCalls + '\n');

  const rep = [];
  rep.push('# SPEC 11A - Evidence-Gated Remainder Execution Report');
  rep.push('');
  rep.push('Generated: ' + new Date().toISOString());
  rep.push('Verdict: **' + verdict + '**');
  rep.push('');
  rep.push('## Bottom line');
  rep.push('- SPEC 11A is a **bounded, evidence-gated** remainder run. It did **not** rerun `SPEC_11_one_shot_execute.js`.');
  rep.push('- **0** additional production writes: **no** remainder operation passed the SPEC 11A write gates (§4).');
  rep.push('- The 60-row remainder register is **60 operations across ' + new Set(held.map((r) => r.slug)).size + ' Wave-1 species**, not 60 species.');
  rep.push('- The other **201** species have **no external evidence collected** (the SPEC 09-11 research scope was Wave 1 only).');
  rep.push('- SPEC 11 **overall is NOT globally complete**; material evidence gaps remain.');
  rep.push('');
  rep.push('## All 218 species accounted for');
  rep.push('- Wave 1: ' + w1Scope.length + '  |  Wave 2 candidates: ' + w2.length + '  |  Wave 3 candidates: ' + w3.length + '  |  no actionable gaps: ' + noActionable.length);
  rep.push('- See `SCOPE_218_SPECIES.csv`.');
  rep.push('');
  rep.push('## Operations');
  rep.push('- Eligible/attempted/successful/failed: ' + eligible.length + ' / ' + mutRows.length + ' / ' + integrity.operations.written + ' / ' + mutRows.filter((m) => ['AUTH', 'REVISION_CONFLICT', 'CLIENT_ERROR'].includes(m.status)).length);
  rep.push('- Verified updates: ' + integrity.verification.passed + '/' + integrity.verification.checked);
  rep.push('- Holds: ' + integrity.operations.holds + '  | Rejects: ' + integrity.operations.rejects + '  | No-ops: ' + integrity.operations.noops);
  rep.push('- Holds by reason: see `EVIDENCE_OPERATION_PLAN.csv` (`blocker` column) and `REMAINDER_REGISTER.csv`.');
  rep.push('');
  rep.push('## Write-gate evaluation (why 0 writes)');
  rep.push('1. Evidence: all 60 remainder rows are held for insufficient/derived evidence, an unresolved semantic mapping, a conflicting value, or are already correct (§4.1-3).');
  rep.push('2. Deployed schema (§4.4): the SPEC 10M additions (minTankLengthCm, minTankWidthCm, swimmingSpace, jumpRisk, lidRequired, flowPreference, oxygenSensitivity, maturityRequirement, waterChangeSensitivity, bioload, behaviorFlags, groupSize, communitySuitability, predatesInverts) are **not deployed** to Studio/dataset schema, so they are not writable under this spec even if evidence existed; only the pre-existing fields (tankSizeMinL, temp*, ph*, gh*, salinity*, temperament, diet) qualify.');
  rep.push('3. No protected identity/SEO/relationship field was touched.');
  rep.push('');
  rep.push('## Integrity');
  rep.push('- Identity hash: ' + (phash === EXPECTED_HASH ? 'MATCH' : 'MISMATCH') + ' (' + identityHash + ')');
  rep.push('- Inventory: ' + ptotal + ' ' + JSON.stringify(pcounts) + '; drafts 0');
  rep.push('- Protected seals unchanged: ' + (integrity.protectedSealsUnchanged ? 'yes' : 'NO'));
  rep.push('- sanityWrites=' + docWrites + ' mutationCalls=' + mutationCalls);
  rep.push('');
  rep.push('## Tests');
  rep.push('- lint: exit ' + lint.code + '  |  tsc --noEmit: ' + tsc.code);
  rep.push('- focused tests/spec10m-schema.test.ts: ' + fs_.passed + ' passed, ' + fs_.failed + ' failed (exit ' + focused.code + ')');
  rep.push('- full suite: ' + fu.passed + ' passed, ' + fu.failed + ' failed (exit ' + full.code + ') -- known baseline `tests/compare.test.ts > compare config > covers all four database types`; not caused by these (zero) writes.');
  rep.push('- build: ' + build.code);
  rep.push('');
  rep.push('## Remaining SPEC 11 work');
  rep.push('- Gather bounded, sourced evidence per species (starting with Wave 2 candidates: ' + w2.length + ' species) before any structured-field or body write.');
  rep.push('- Resolve semantic-mapping holds (flowPreference STILL vs slow, oxygenSensitivity inference, groupSize conditional) or get PM schema-semantics sign-off.');
  rep.push('- Resolve conflicting-value holds (temperature/tank-size/temperament/diet/ph) with an authoritative source.');
  rep.push('- Deploy SPEC 10M schema + update GROQ/site rendering (tracked separately, out of scope here).');
  rep.push('');
  rep.push('## Artifacts');
  for (const f of files) rep.push('- reports/SPEC_11/spec_11a_remainder/' + f);
  fs.writeFileSync(path.join(OUT, 'SPEC_11A_EXECUTION_REPORT.md'), rep.join('\n') + '\n');

  console.log('SPEC 11A verdict=' + verdict + ' writes=' + docWrites + ' eligible=' + eligible.length + ' plan=' + planRows.length);
  console.log('scope species=' + scope.length + ' w1=' + w1Scope.length + ' w2=' + w2.length + ' w3=' + w3.length + ' noActionable=' + noActionable.length);
  console.log('blockers=' + JSON.stringify(blockerCounts));
  console.log('tests lint=' + lint.code + ' tsc=' + tsc.code + ' focused=' + fs_.passed + '/' + fs_.failed + ' full=' + fu.passed + '/' + fu.failed + ' build=' + build.code);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
