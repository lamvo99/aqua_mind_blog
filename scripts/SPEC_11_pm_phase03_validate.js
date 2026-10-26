// SPEC 11 Phase 03 deliverables validator - READ-ONLY (local checks + GET-only inventory/name reads).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { spawnSync } = require('child_process');

const OUT = 'reports/SPEC_11/pm_review/phase_03';
const P1 = 'reports/SPEC_11/pm_review/phase_01';
const P2 = 'reports/SPEC_11/pm_review/phase_02';
const REV = 'reports/SPEC_11/revision_1';
const RPT = 'report/SPEC_11';
const PKG = 'phase/11';
const FILES = ['PM_DECISION_QUEUE.csv', 'P0_SAFETY_REVIEW.md', 'UNRESOLVED_DECISION_REGISTER.csv', 'PHASE_03_REVIEW_PACKAGE_REPORT.md', 'PHASE_03_CHECKSUMS.txt'];
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const P1_HASHES = {
  'EVIDENCE_REVIEW_BY_SPECIES.md': 'd86b54fc4d72f432e8de90e3d5b4829d92d04a493099a6ac9d2d77e69c03eeb2',
  'FILL_DECISION_RECOMMENDATIONS.csv': '3f4594abfd9376de3bf1bba46c3049d43d9e3828b462da36ee9bac3d929e2a76',
  'REPLACEMENT_DECISION_RECOMMENDATIONS.csv': '54c210654aa350b7fc46b581ce81533f24642df233d63d2f145b584095100275',
  'UNRESOLVED_RESEARCH_PLAN.csv': 'c3dcabc2f1578f7fb8f2e74512402b11487c4ee308dc4cbe924556efe9804493',
  'PHASE_01_REVIEW_REPORT.md': 'f48e1520564027f85f8ea05e4e7a2bcf30cefb117a452c930d66b6c47e903afa',
};
const P2_FILES = ['SOURCE_VERIFICATION.csv', 'SOURCE_CONFLICTS.md', 'EVIDENCE_GAPS.csv', 'PHASE_02_VERIFICATION_REPORT.md'];
const PKG_HASHES = {
  'SPEC_11_PM_REVISED_PLAN_APPROVAL_PACKAGE.md': '0a646731ef37e8bfb3270721e4d1402207c0b6a1dc0c6279d11ac044dc3e326e',
  'SPEC_11_PM_APPROVAL_MATRIX.csv': 'c47d2fc128cca98df9c183d458516857ab8f002f6eb1fa2aabe23ac644c3af9f',
  'SPEC_11_PM_RESEARCH_BACKLOG.csv': 'f38b8c35807686976feac31a5a9410fd4a46ac71a67c894dd2a7948c14019148',
};
const NEEDLES = ['mutate(', 'createOrReplace', 'createIfNotExists', '.patch(', 'method:"POST"', '?mutate', 'https.request('];
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const shaFile = (f) => sha(fs.readFileSync(f));
function sp(l){const r=[];let c='',q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(q){if(ch==='"'){if(l[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}else{if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}else c+=ch;}}r.push(c);return r;}
function readCsv(file){const lines=fs.readFileSync(file,'utf8').replace(/^﻿/,'').split(/\r?\n/).filter((l)=>l.length>0);const h=sp(lines[0]);return lines.slice(1).map((l)=>{const r=sp(l);const o={};h.forEach((k,i)=>{o[k]=r[i]??'';});return o;});}
const checks = [];
const check = (id, name, ok, detail) => { checks.push({ id, pass: !!ok }); console.log((ok ? 'CHECK OK   ' : 'CHECK FAIL ') + id + ' ' + name + ' - ' + detail); };

(async () => {
  const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];

  // V1 deliverables + counts + id sets
  const missing = FILES.filter((f) => !fs.existsSync(path.join(OUT, f)));
  let queue = [], reg = [], fills = [], reps = [], plan = [], ver = [], gaps = [];
  if (!missing.length) {
    queue = readCsv(path.join(OUT, 'PM_DECISION_QUEUE.csv'));
    reg = readCsv(path.join(OUT, 'UNRESOLVED_DECISION_REGISTER.csv'));
    fills = readCsv(path.join(P1, 'FILL_DECISION_RECOMMENDATIONS.csv'));
    reps = readCsv(path.join(P1, 'REPLACEMENT_DECISION_RECOMMENDATIONS.csv'));
    plan = readCsv(path.join(P1, 'UNRESOLVED_RESEARCH_PLAN.csv'));
    ver = readCsv(path.join(P2, 'SOURCE_VERIFICATION.csv'));
    gaps = readCsv(path.join(P2, 'EVIDENCE_GAPS.csv'));
  }
  const qIds = new Set(queue.map((r) => r.candidateId));
  const yesFills = fills.filter((r) => r.proposedWritableSet === 'YES');
  const yesReps = reps.filter((r) => r.proposedWritableSet === 'YES');
  const yesIds = new Set(yesFills.concat(yesReps).map((r) => r.recId));
  const idSetOk = yesIds.size === 337 && qIds.size === 337 && [...yesIds].every((id) => qIds.has(id)) && [...qIds].every((id) => yesIds.has(id));
  const regIds = new Set(reg.map((r) => r.registerId));
  const originC = reg.reduce((a, r) => { a[r.origin] = (a[r.origin] || 0) + 1; return a; }, {});
  check('V1', '5 deliverables; queue=337 unique = phase01 YES recIds; register=155 unique (73 plan + 27 holds + 55 gaps)',
    !missing.length && queue.length === 337 && idSetOk && reg.length === 155 && regIds.size === 155 && originC.RESEARCH_PLAN === 73 && originC.PHASE01_HOLD === 27 && originC.PHASE02_CANDIDATE_GAP === 55,
    missing.length ? 'missing:' + missing : `queue=${queue.length} uniqueQ=${qIds.size} idSetOk=${idSetOk} reg=${reg.length} origins=${JSON.stringify(originC)}`);

  // V2 no-invented values: verbatim joins against frozen Phase 01/02 rows
  const p1By = new Map(fills.concat(reps).map((r) => [r.recId, r]));
  const vBy = new Map(ver.map((r) => [r.candidateId, r]));
  const gBy = new Map(gaps.filter((g) => g.gapType === 'CANDIDATE_VERIFICATION').map((g) => [g.candidateId, g]));
  const mism = [];
  for (const r of queue) {
    const p1 = p1By.get(r.candidateId), v = vBy.get(r.candidateId), g = gBy.get(r.candidateId);
    if (!p1 || !v) { mism.push(r.candidateId + ':missing-source'); continue; }
    const eq = (a, b) => String(a ?? '') === String(b ?? '');
    if (!eq(r.mutationId, p1.mutationId) || !eq(r.conflictId, p1.conflictId) || !eq(r.slug, p1.slug) || !eq(r.species, p1.species) || !eq(r.fieldPath, p1.field) || !eq(r.currentValue, p1.existingValue) || !eq(r.proposedValue, p1.proposedValue) || !eq(r.phase01Recommendation, p1.recommendation) || !eq(r.phase01Confidence, p1.confidence) || !eq(r.phase01Rationale, p1.reasoning) || !eq(r.phase01Caveats, p1.requiredCaveats) || !eq(r.safetyCritical, p1.safetyCritical) || !eq(r.priority, p1.priority)) mism.push(r.candidateId + ':p1');
    if (!eq(r.evidenceDisposition, v.evidenceDisposition) || !eq(r.claimSupported, v.claimSupported) || !eq(r.sourceUrl, v.sourceUrl) || !eq(r.sourceTitle, v.sourceTitle) || !eq(r.sourceTier, v.sourceTier) || !eq(r.speciesSpecificity, v.speciesSpecificity) || !eq(r.verificationRule, v.verificationRule) || !eq(r.evidenceCaveat, v.caveat)) mism.push(r.candidateId + ':p2');
    if (g) { if (!eq(r.gapIssue, g.issue) || !eq(r.evidenceNeeded, g.evidenceNeeded)) mism.push(r.candidateId + ':gap'); }
    else if (r.gapIssue || r.evidenceNeeded) mism.push(r.candidateId + ':unexpected-gap-fields');
    if (!eq(r.mutationType, r.register)) mism.push(r.candidateId + ':mutationType');
  }
  const planBy = new Map(plan.map((p) => [p.planId, p]));
  const regMism = [];
  for (const r of reg.filter((x) => x.origin !== 'PHASE02_CANDIDATE_GAP')) {
    const p = planBy.get(r.planId);
    if (!p) { regMism.push(r.registerId + ':no-plan'); continue; }
    if (p.itemType !== r.itemType || p.slug !== r.slug || p.field !== r.fieldPath || p.status !== r.currentStatus || p.recommendation !== r.recommendation || p.evidenceNeeded !== r.evidenceNeeded || p.priority !== r.priority || p.safetyCritical !== r.safetyCritical) regMism.push(r.registerId + ':plan');
    if (!(r.whyUnresolved || '').startsWith(p.reason)) regMism.push(r.registerId + ':reason');
  }
  for (const r of reg.filter((x) => x.origin === 'PHASE02_CANDIDATE_GAP')) {
    const g = gaps.find((x) => x.gapId === r.gapId);
    if (!g || g.gapType !== 'CANDIDATE_VERIFICATION' || g.field !== r.fieldPath || g.evidenceDisposition !== r.currentStatus || g.issue !== r.whyUnresolved || g.evidenceNeeded !== r.evidenceNeeded || g.nextAction !== r.nextAction || g.candidateId !== r.candidateId) regMism.push(r.registerId + ':gap');
  }
  check('V2', 'queue/register values verbatim from frozen Phase 01/02 rows (no invented values)',
    mism.length === 0 && regMism.length === 0, `queueMism=${mism.length}${mism.length ? ' e.g. ' + mism.slice(0, 4).join(',') : ''} regMism=${regMism.length}${regMism.length ? ' e.g. ' + regMism.slice(0, 4).join(',') : ''}`);

  // V3 all PM decision fields blank (queue + register + matrix)
  const blankQ = queue.every((r) => r.pmDecision === '' && r.pmRationale === '' && r.pmNotes === '');
  const blankR = reg.every((r) => r.pmDecision === '' && r.pmRationale === '' && r.pmNotes === '');
  const matrix = readCsv(path.join(PKG, 'SPEC_11_PM_APPROVAL_MATRIX.csv'));
  const blankM = matrix.every((m) => m.pmDecision === '' && m.pmRationale === '');
  check('V3', 'all pmDecision/pmRationale/pmNotes blank in queue + register + matrix', blankQ && blankR && blankM, `queue=${blankQ} register=${blankR} matrix=${blankM}`);

  // V4 non-writable policy: gaps and plan rows never writable; holds excluded from queue
  const weC = queue.reduce((a, r) => { a[r.writeEligibility] = (a[r.writeEligibility] || 0) + 1; return a; }, {});
  const gapCandIds = new Set(gaps.filter((g) => g.gapType === 'CANDIDATE_VERIFICATION').map((g) => g.candidateId));
  const gapRowsOk = queue.filter((r) => r.writeEligibility === 'NON_WRITABLE_EVIDENCE_GAP').length === 55 && [...gapCandIds].every((id) => qIds.has(id)) && queue.filter((r) => r.evidenceDisposition === 'CLAIM_NOT_FOUND' || r.evidenceDisposition === 'SOURCE_UNAVAILABLE').every((r) => r.writeEligibility === 'NON_WRITABLE_EVIDENCE_GAP' && gapCandIds.has(r.candidateId));
  const regAllNo = reg.every((r) => r.writeEligibility === 'NON_WRITABLE');
  const holdSources = new Set(plan.filter((p) => ['HELD_FILL', 'DEFERRED_CONFLICT', 'UNRESOLVED_CONFLICT', 'REJECTED_CONFLICT', 'NEW_FILL_HOLD', 'NEW_REPLACEMENT_HOLD'].includes(p.itemType)).map((p) => p.sourceId));
  const holdLeak = [...holdSources].filter((id) => queue.some((r) => r.mutationId === id || (r.conflictId && r.conflictId === id)));
  const supportWe = queue.filter((r) => ['VERIFIED_SUPPORT', 'VERIFIED_SUPPORT_WITH_CAVEAT'].includes(r.evidenceDisposition)).every((r) => r.writeEligibility === 'NON_WRITABLE_PENDING_PM_DECISION');
  check('V4', 'support != permission: 55 gaps + 100 plan rows non-writable; hold/deferred/rejected source IDs absent from queue',
    gapRowsOk && regAllNo && holdLeak.length === 0 && supportWe && weC.NON_WRITABLE_PENDING_PM_DECISION === 282 && weC.NON_WRITABLE_EVIDENCE_GAP === 55 && plan.every((p) => p.writable === 'NO'),
    `we=${JSON.stringify(weC)} regAllNo=${regAllNo} holdLeak=${holdLeak.length} planWritableNo=${plan.every((p) => p.writable === 'NO')}`);

  // V5 frozen inputs unchanged
  const p1Bad = Object.entries(P1_HASHES).filter(([f, h]) => shaFile(path.join(P1, f)) !== h).map(([f]) => f);
  const p2Bad = P2_FILES.filter((f) => { const sums = fs.readFileSync(path.join(P2, 'PHASE_02_CHECKSUMS.txt'), 'utf8'); const m = new RegExp('^' + f + ':\\s*([a-f0-9]{64})', 'm').exec(sums); return !m || shaFile(path.join(P2, f)) !== m[1]; });
  const pkgBad = Object.entries(PKG_HASHES).filter(([f, h]) => !fs.existsSync(path.join(PKG, f)) || shaFile(path.join(PKG, f)) !== h).map(([f]) => f);
  const integrity = JSON.parse(fs.readFileSync(path.join(RPT, 'INTEGRITY.json'), 'utf8'));
  const origBad = [];
  for (const [f, h] of Object.entries(integrity.artifactHashes || {})) for (const dir of [RPT, 'reports/SPEC_11']) { try { if (shaFile(path.join(dir, f)) !== h) origBad.push(dir + '/' + f); } catch (e) { origBad.push(dir + '/' + f + ':missing'); } }
  const revSums = fs.readFileSync(path.join(REV, 'REVISION_1_CHECKSUMS.txt'), 'utf8');
  const revEntries = [...revSums.matchAll(/^\s+([A-Z0-9_]+\.(?:csv|md|txt|json)):\s*([a-f0-9]{64})/gm)];
  const revBad = revEntries.filter(([, name, h]) => { const a = path.join(REV, name), b = path.join(RPT, name); const f = fs.existsSync(a) ? a : b; return !fs.existsSync(f) || shaFile(f) !== h; }).map(([, name]) => name);
  check('V5', 'frozen inputs unchanged: phase01 5/5, phase02 4/4, package 3/3, Stage A 11/11 x2, rev1 15/15',
    p1Bad.length === 0 && p2Bad.length === 0 && pkgBad.length === 0 && origBad.length === 0 && revBad.length === 0 && revEntries.length === 15,
    `p1=${p1Bad.join(',') || '5/5'} p2=${p2Bad.join(',') || '4/4'} pkg=${pkgBad.join(',') || '3/3'} stageA=${origBad.join(',') || '11/11 x2'} rev1=${revBad.join(',') || revEntries.length + '/15'}`);

  // V6 safety structure
  const safetyQ = queue.filter((r) => r.safetyCritical === '1');
  const safetyPlan = plan.filter((p) => p.safetyCritical === '1');
  const md = fs.readFileSync(path.join(OUT, 'P0_SAFETY_REVIEW.md'), 'utf8');
  const secA = /## A\. Directly supported safety claims \((\d+)\)/.exec(md), secB = /## B\. Caveated safety claims \((\d+)\)/.exec(md), secC = /## C\. Missing evidence - queue gaps \((\d+)\)/.exec(md), secD = /## D\. Safety-critical research-plan rows \((\d+)/.exec(md);
  const sDir = safetyQ.filter((r) => r.evidenceDisposition === 'VERIFIED_SUPPORT').length;
  const sCav = safetyQ.filter((r) => r.evidenceDisposition === 'VERIFIED_SUPPORT_WITH_CAVEAT').length;
  const sMis = safetyQ.filter((r) => ['CLAIM_NOT_FOUND', 'SOURCE_UNAVAILABLE'].includes(r.evidenceDisposition)).length;
  const prioOk = queue.every((r) => (r.safetyCritical === '1') === (r.safetyPriority === 'P0_SAFETY'));
  const mdRowsOk = safetyQ.every((r) => md.includes('| ' + r.candidateId + ' '));
  const planMdOk = safetyPlan.every((p) => md.includes('| ' + p.planId + ' |'));
  const report = fs.readFileSync(path.join(OUT, 'PHASE_03_REVIEW_PACKAGE_REPORT.md'), 'utf8');
  const completeRule = report.includes('No species may be marked complete') && md.includes('may be marked complete');
  check('V6', 'P0 safety review complete: sections A/B/C/D match counts; every safety row listed; no-species-complete rule stated',
    safetyQ.length === 68 && safetyPlan.length === 55 && secA && Number(secA[1]) === sDir && secB && Number(secB[1]) === sCav && secC && Number(secC[1]) === sMis && secD && Number(secD[1]) === 55 && sMis === 14 && prioOk && mdRowsOk && planMdOk && completeRule && safetyPlan.every((p) => (p.evidenceNeeded || '').trim()),
    `A=${secA && secA[1]}/${sDir} B=${secB && secB[1]}/${sCav} C=${secC && secC[1]}/${sMis} D=${secD && secD[1]} prioOk=${prioOk} mdRows=${mdRowsOk} planMd=${planMdOk} completeRule=${completeRule}`);

  // V7 determinism: three generator runs byte-identical
  const hashOut = () => FILES.map((f) => shaFile(path.join(OUT, f)));
  const h1 = hashOut();
  const r1 = spawnSync(process.execPath, ['scripts/SPEC_11_pm_phase03.js'], { encoding: 'utf8' });
  const h2 = hashOut();
  const r2 = spawnSync(process.execPath, ['scripts/SPEC_11_pm_phase03.js'], { encoding: 'utf8' });
  const h3 = hashOut();
  const det = r1.status === 0 && r2.status === 0 && h1.join() === h2.join() && h2.join() === h3.join();
  check('V7', 'generator deterministic: three runs produce byte-identical 5 deliverables', det, det ? '5 files stable across 3 hash rounds' : 'drift r1=' + r1.status + ' r2=' + r2.status + ' h1≠h2=' + (h1.join() !== h2.join()) + ' h2≠h3=' + (h2.join() !== h3.join()));

  // V8 needle + API-token scan
  const scanTargets = FILES.map((f) => path.join(OUT, f)).concat(['scripts/SPEC_11_pm_phase03.js']);
  const hits = [], tok = [];
  for (const f of scanTargets) { const txt = fs.readFileSync(f, 'utf8'); for (const n of NEEDLES) if (txt.includes(n)) hits.push(f + ':' + n); if (TOKEN.length > 10 && txt.includes(TOKEN)) tok.push(f); }
  check('V8', 'needle + API-token scan clean on deliverables and phase 03 script', hits.length === 0 && tok.length === 0, 'needles=' + (hits.join(',') || 'CLEAN') + ' tokens=' + (tok.join(',') || 'CLEAN'));

  // V9 live inventory 473 + identity hash + scientificName cross-check (GET only)
  const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
  const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
  const EXPECTED_COUNTS = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
  const qy = (query) => new Promise((res, rej) => { https.get(BASE + '?query=' + encodeURIComponent(query), { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => { const c = []; r.on('data', (d) => c.push(d)); r.on('end', () => { try { res(JSON.parse(Buffer.concat(c).toString()).result); } catch (e) { rej(e); } }); }).on('error', rej); });
  const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
  const titleOf = (t, it) => (t === 'problem' ? it.title : it.name);
  const fetchW = async () => { const o = {}; for (const t of WIKI_TYPES) o[t] = await qy(`*[_type == "${t}" && !(_id in path("drafts.**"))]`); return o; };
  const a1 = await fetchW(), a2 = await fetchW();
  let mis = 0; for (const t of WIKI_TYPES) if (JSON.stringify(a1[t]) !== JSON.stringify(a2[t])) mis++;
  const counts = {}; for (const t of WIKI_TYPES) counts[t] = a1[t].length;
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const canonical = {};
  for (const t of WIKI_TYPES) for (const rec of a1[t]) canonical[rec._id] = { t, rec };
  const hp = Object.keys(canonical).sort().map((id) => sha(JSON.stringify({ id, title: titleOf(canonical[id].t, canonical[id].rec), slug: slugValue(canonical[id].rec.slug) })));
  const ih = sha(hp.join('\n'));
  const sciMap = new Map();
  for (const t of WIKI_TYPES) for (const rec of a1[t]) if (slugValue(rec.slug) && rec.scientificName) sciMap.set(slugValue(rec.slug), rec.scientificName);
  const sciBad = queue.filter((r) => sciMap.get(r.slug) !== r.scientificName).map((r) => r.candidateId + ':' + r.slug);
  check('V9', 'live inventory 473 double-read + identity hash + every queue scientificName matches canonical record',
    mis === 0 && total === 473 && ih === EXPECTED_HASH && WIKI_TYPES.every((t) => counts[t] === EXPECTED_COUNTS[t]) && sciBad.length === 0 && queue.every((r) => !!r.scientificName),
    'total=' + total + ' hash=' + (ih === EXPECTED_HASH ? 'MATCH' : 'MISMATCH') + ' sciBad=' + (sciBad.slice(0, 3).join(',') || 'none'));

  // V10 PHASE_03_CHECKSUMS.txt self-consistency + report required statements
  const sums = fs.readFileSync(path.join(OUT, 'PHASE_03_CHECKSUMS.txt'), 'utf8');
  const entries = [...sums.matchAll(/^([A-Z0-9_]+\.(?:csv|md|txt)):\s*([a-f0-9]{64})/gm)];
  const sumBad = entries.filter(([, name, h]) => !fs.existsSync(path.join(OUT, name)) || shaFile(path.join(OUT, name)) !== h).map(([, name]) => name);
  const sumsCarry = sums.includes('sanityWrites=0') && sums.includes('mutationCalls=0') && sums.includes('deployments=0') && sums.includes(EXPECTED_HASH);
  const st = report.includes('sanityWrites=0') && report.includes('mutationCalls=0') && report.includes('deployments=0') && /awaiting PM decisions/i.test(report) && report.includes('NOT APPROVED') && (report.includes('support != permission') || report.includes('not permission to write')) && report.includes('not proof of correctness');
  check('V10', 'PHASE_03_CHECKSUMS.txt 4/4 artifact hashes match; report carries required statements', entries.length === 4 && sumBad.length === 0 && sumsCarry && st, `entries=${entries.length} bad=${sumBad.join(',') || 'none'} statements=${sumsCarry} report=${st}`);

  // V11 tests: focused schema suite + full suite baseline reported separately
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
  const t1 = spawnSync('npx', ['vitest', 'run', 'tests/spec10m-schema.test.ts'], { encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024 });
  const t1Out = stripAnsi((t1.stdout || '') + (t1.stderr || ''));
  const focusedOk = /108 passed/.test(t1Out) && !/failed/.test(t1Out.replace(/0 failed/g, ''));
  const t2 = spawnSync('npm', ['test'], { encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024 });
  const t2Out = stripAnsi((t2.stdout || '') + (t2.stderr || ''));
  const failLines = t2Out.split(/\r?\n/).filter((l) => /^\s*(FAIL|❯)\s/.test(l));
  const failFiles = [...new Set(failLines.map((l) => (/(tests|scripts)\/[^\s:]+\.(?:test\.)?[cm]?[jt]sx?/).exec(l)?.[0]).filter(Boolean))];
  const fullOk = t2.status === 1 && /1 failed/.test(t2Out) && /372 passed/.test(t2Out) && failFiles.length === 1 && failFiles[0] === 'tests/compare.test.ts';
  check('V11', 'focused schema suite 108/108; full suite fails only known baseline tests/compare.test.ts (reported separately, not fixed)',
    focusedOk && fullOk, `focused=${focusedOk} fullBaseline=${fullOk} failFiles=${failFiles.join(',') || 'none'}`);

  const failed = checks.filter((c) => !c.pass);
  console.log('');
  console.log('GATES ' + (checks.length - failed.length) + '/' + checks.length + (failed.length ? ' FAILURES: ' + failed.map((c) => c.id).join(',') : ' ALL PASS'));
  console.log('known baseline failure (expected, not fixed): tests/compare.test.ts');
  console.log('sanityWrites=0');
  console.log('mutationCalls=0');
  console.log('deployments=0');
  if (failed.length) { console.log('PHASE 03 VALIDATION FAILED'); process.exit(2); }
  console.log('SPEC 11 PHASE 03 PACKAGE READY - AWAITING PM DECISIONS');
})().catch((e) => { console.error('FATAL', e); process.exit(2); });

