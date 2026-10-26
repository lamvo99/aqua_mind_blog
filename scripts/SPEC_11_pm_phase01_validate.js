// SPEC 11 Phase 01 deliverables validator - READ-ONLY (local checks + one GET-only inventory read).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { spawnSync } = require('child_process');

const OUT = 'reports/SPEC_11/pm_review/phase_01';
const REV = 'reports/SPEC_11/revision_1';
const RPT = 'report/SPEC_11';
const PKG = 'phase/11';
const FILES = ['EVIDENCE_REVIEW_BY_SPECIES.md', 'FILL_DECISION_RECOMMENDATIONS.csv', 'REPLACEMENT_DECISION_RECOMMENDATIONS.csv', 'UNRESOLVED_RESEARCH_PLAN.csv', 'PHASE_01_REVIEW_REPORT.md'];
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const PKG_HASHES = {
  'SPEC_11_PM_REVISED_PLAN_APPROVAL_PACKAGE.md': '0a646731ef37e8bfb3270721e4d1402207c0b6a1dc0c6279d11ac044dc3e326e',
  'SPEC_11_PM_APPROVAL_MATRIX.csv': 'c47d2fc128cca98df9c183d458516857ab8f002f6eb1fa2aabe23ac644c3af9f',
  'SPEC_11_PM_RESEARCH_BACKLOG.csv': 'f38b8c35807686976feac31a5a9410fd4a46ac71a67c894dd2a7948c14019148',
};
const NEEDLES = ['mutate(', 'createOrReplace', 'createIfNotExists', '.patch(', 'method:"POST"', '?mutate', 'https.request('];
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const shaFile = (f) => sha(fs.readFileSync(f));
function splitCsvLine(l) { const row = []; let cur = '', inQ = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (inQ) { if (ch === '"') { if (l[i + 1] === '"') { cur += '"'; i++; } else inQ = false; } else cur += ch; } else { if (ch === '"') inQ = true; else if (ch === ',') { row.push(cur); cur = ''; } else cur += ch; } } row.push(cur); return row; }
function readCsv(file) { const lines = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.length > 0); const h = splitCsvLine(lines[0]); return lines.slice(1).map((l) => { const r = splitCsvLine(l); const o = {}; h.forEach((k, i) => { o[k] = r[i] ?? ''; }); return o; }); }
const checks = [];
const check = (id, name, ok, detail) => { checks.push({ id, pass: !!ok }); console.log((ok ? 'CHECK OK   ' : 'CHECK FAIL ') + id + ' ' + name + ' - ' + detail); };

const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED_COUNTS = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const q = (query) => new Promise((res, rej) => { https.get(BASE + '?query=' + encodeURIComponent(query), { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => { const c = []; r.on('data', (d) => c.push(d)); r.on('end', () => { try { res(JSON.parse(Buffer.concat(c).toString()).result); } catch (e) { rej(e); } }); }).on('error', rej); });
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (t, it) => (t === 'problem' ? it.title : it.name);

(async () => {
  // V1 files + row counts
  const missing = FILES.filter((f) => !fs.existsSync(path.join(OUT, f)));
  let fills = [], reps = [], planRows = [];
  if (!missing.length) { fills = readCsv(path.join(OUT, 'FILL_DECISION_RECOMMENDATIONS.csv')); reps = readCsv(path.join(OUT, 'REPLACEMENT_DECISION_RECOMMENDATIONS.csv')); planRows = readCsv(path.join(OUT, 'UNRESOLVED_RESEARCH_PLAN.csv')); }
  const pc = planRows.reduce((a, x) => { a[x.itemType] = (a[x.itemType] || 0) + 1; return a; }, {});
  check('V1', 'all 5 deliverables present; rows = 342 fills / 22 replacements / 70+3+27 plan', !missing.length && fills.length === 342 && reps.length === 22 && planRows.length === 100 && pc.HELD_FILL === 45 && pc.DEFERRED_CONFLICT === 11 && pc.UNRESOLVED_CONFLICT === 14 && pc.REJECTED_CONFLICT === 3 && pc.NEW_FILL_HOLD === 26 && pc.NEW_REPLACEMENT_HOLD === 1, missing.length ? 'missing:' + missing : `fills=${fills.length} reps=${reps.length} plan=${planRows.length} ${JSON.stringify(pc)}`);

  // V2 id sets vs matrix
  const matrix = readCsv(path.join(PKG, 'SPEC_11_PM_APPROVAL_MATRIX.csv'));
  const eligSet = new Set(matrix.filter((r) => r.itemType === 'MUTATION' && r.currentDisposition === 'ELIGIBLE_FOR_PM_REVIEW').map((r) => r.itemId));
  const candSet = new Set(matrix.filter((r) => r.itemType === 'CONFLICT' && r.currentDisposition === 'CANDIDATE_APPROVE').map((r) => r.itemId));
  const fillIds = new Set(fills.map((f) => f.mutationId)), repIds = new Set(reps.map((r) => r.conflictId));
  const sameFill = fillIds.size === eligSet.size && [...eligSet].every((x) => fillIds.has(x));
  const sameRep = repIds.size === candSet.size && [...candSet].every((x) => repIds.has(x));
  const dupFree = fills.length === fillIds.size && reps.length === repIds.size && planRows.length === new Set(planRows.map((p) => p.planId)).size;
  check('V2', 'id sets match matrix exactly; no duplicate IDs', sameFill && sameRep && dupFree, 'eligibleSet=' + sameFill + ' candidateSet=' + sameRep + ' dupFree=' + dupFree);

  // V3 vocabulary, writable mapping, blank pmDecision, report counts
  const VOCAB = new Set(['RECOMMEND_APPROVE', 'RECOMMEND_HOLD', 'RECOMMEND_REJECT']);
  const vocabOk = fills.every((f) => VOCAB.has(f.recommendation)) && reps.every((r) => VOCAB.has(r.recommendation)) && planRows.every((p) => ['MAINTAIN_HOLD', 'KEEP_EXCLUDED', 'RECOMMEND_HOLD'].includes(p.recommendation));
  const writableOk = fills.every((f) => f.proposedWritableSet === (f.recommendation === 'RECOMMEND_APPROVE' ? 'YES' : 'NO')) && reps.every((r) => r.proposedWritableSet === (r.recommendation === 'RECOMMEND_APPROVE' ? 'YES' : 'NO')) && planRows.every((p) => p.writable === 'NO');
  const blankOk = fills.every((f) => f.pmDecision === '') && reps.every((r) => r.pmDecision === '') && planRows.every((p) => p.pmDecision === '') && matrix.every((m) => m.pmDecision === '' && m.pmRationale === '');
  const fc = fills.reduce((a, f) => { a[f.recommendation] = (a[f.recommendation] || 0) + 1; return a; }, {});
  const rc = reps.reduce((a, r) => { a[r.recommendation] = (a[r.recommendation] || 0) + 1; return a; }, {});
  const report = fs.readFileSync(path.join(OUT, 'PHASE_01_REVIEW_REPORT.md'), 'utf8');
  const repCountsOk = report.includes(`| RECOMMEND_APPROVE | ${fc.RECOMMEND_APPROVE || 0} |`) && report.includes(`| RECOMMEND_HOLD | ${fc.RECOMMEND_HOLD || 0} |`) && report.includes(`| RECOMMEND_APPROVE | ${rc.RECOMMEND_APPROVE || 0} |`) && report.includes('| RECOMMEND_HOLD | 1 |');
  check('V3', 'recommendation vocabulary valid; writable mapping correct; all pmDecision blank; report counts match CSVs', vocabOk && writableOk && blankOk && repCountsOk && (fc.RECOMMEND_APPROVE || 0) === 316 && (fc.RECOMMEND_HOLD || 0) === 26 && (rc.RECOMMEND_APPROVE || 0) === 21 && (rc.RECOMMEND_HOLD || 0) === 1, `fills=${JSON.stringify(fc)} reps=${JSON.stringify(rc)} vocab=${vocabOk} writable=${writableOk} blank=${blankOk} reportMatch=${repCountsOk}`);

  // V4 excluded sets never writable; research plan covers them
  const backlog = readCsv(path.join(PKG, 'SPEC_11_PM_RESEARCH_BACKLOG.csv'));
  const confReg = readCsv(path.join(REV, 'REVISED_CONFLICT_REGISTER.csv'));
  const planRev = readCsv(path.join(REV, 'REVISED_MUTATION_PLAN.csv'));
  const excluded = new Set(backlog.map((b) => b.sourceId));
  confReg.filter((c) => ['REJECTED', 'DEFERRED', 'KEEP_HOLD'].includes(c.finalRecommendation)).forEach((c) => excluded.add(c.conflictId));
  const writableIds = fills.filter((f) => f.proposedWritableSet === 'YES').map((f) => f.mutationId).concat(reps.filter((r) => r.proposedWritableSet === 'YES').map((r) => r.conflictId));
  const leak = writableIds.filter((id) => excluded.has(id));
  const backlogCovered = backlog.every((b) => planRows.some((p) => p.sourceId === b.sourceId && p.writable === 'NO'));
  const rejectedCovered = confReg.filter((c) => c.finalRecommendation === 'REJECTED').every((c) => planRows.some((p) => p.sourceId === c.conflictId && p.recommendation === 'KEEP_EXCLUDED'));
  const revEligible = new Set(planRev.filter((p) => p.revisedDisposition === 'ELIGIBLE_FOR_PM_REVIEW').map((p) => p.originalMutationId));
  const notEligibleWritable = writableIds.filter((id) => id.startsWith('MUT') && !revEligible.has(id));
  check('V4', '45+11+3+14 excluded rows all in plan with writable=NO; none leaked into proposed writable set', leak.length === 0 && backlogCovered && rejectedCovered && notEligibleWritable.length === 0 && excluded.size === 73, `leak=${leak.length} backlogCovered=${backlogCovered} rejectedCovered=${rejectedCovered} notEligibleWritable=${notEligibleWritable.length} excluded=${excluded.size}`);

  // V5 safety-critical rows carry evidence; none writable from plan
  const safPlan = planRows.filter((p) => p.safetyCritical === '1');
  const safMissingEvidence = safPlan.filter((p) => !(p.evidenceNeeded || '').trim());
  const safWritable = safPlan.filter((p) => p.writable !== 'NO');
  check('V5', 'every safety-critical research-plan row has evidence needed and writable=NO', safMissingEvidence.length === 0 && safWritable.length === 0, 'safetyPlanRows=' + safPlan.length + ' missingEvidence=' + safMissingEvidence.length + ' writable=' + safWritable.length);

  // V6 package + originals + revision artifacts unchanged
  const pkgBad = Object.entries(PKG_HASHES).filter(([f, h]) => !fs.existsSync(path.join(PKG, f)) || shaFile(path.join(PKG, f)) !== h).map(([f]) => f);
  const integrity = JSON.parse(fs.readFileSync(path.join(RPT, 'INTEGRITY.json'), 'utf8'));
  const origBad = [];
  for (const [f, h] of Object.entries(integrity.artifactHashes || {})) for (const dir of [RPT, 'reports/SPEC_11']) { try { if (shaFile(path.join(dir, f)) !== h) origBad.push(dir + '/' + f); } catch (e) { origBad.push(dir + '/' + f + ':missing'); } }
  const revSums = fs.readFileSync(path.join(REV, 'REVISION_1_CHECKSUMS.txt'), 'utf8');
  const revEntries = [...revSums.matchAll(/^\s+([A-Z0-9_]+\.(?:csv|md|txt|json)):\s*([a-f0-9]{64})/gm)];
  const revBad = revEntries.filter(([, name, h]) => { const a = path.join(REV, name), b = path.join(RPT, name); const f = fs.existsSync(a) ? a : b; return !fs.existsSync(f) || shaFile(f) !== h; }).map(([, name]) => name);
  check('V6', 'PM package files + original Stage A (both copies) + Revision 1 artifacts unchanged', pkgBad.length === 0 && origBad.length === 0 && revBad.length === 0 && revEntries.length === 15, `pkg=${pkgBad.join(',') || '3/3'} stageA=${origBad.join(',') || '11/11 x2'} rev1=${revBad.join(',') || revEntries.length + '/' + revEntries.length}`);

  // V7 determinism: two fresh runs byte-identical
  const hashAll = () => FILES.map((f) => shaFile(path.join(OUT, f)));
  const h1 = hashAll();
  const r1 = spawnSync(process.execPath, ['scripts/SPEC_11_pm_phase01.js'], { encoding: 'utf8' });
  const h2 = hashAll();
  const r2 = spawnSync(process.execPath, ['scripts/SPEC_11_pm_phase01.js'], { encoding: 'utf8' });
  const h3 = hashAll();
  const det = r1.status === 0 && r2.status === 0 && h1.join() === h2.join() && h2.join() === h3.join();
  check('V7', 'generator deterministic: two reruns byte-identical', det, det ? '5/5 files stable across 3 hash rounds' : 'hash drift r1=' + r1.status + ' r2=' + r2.status);

  // V8 needle + token scan
  const hits = [], tok = [];
  for (const f of FILES) { const txt = fs.readFileSync(path.join(OUT, f), 'utf8'); for (const n of NEEDLES) if (txt.includes(n)) hits.push(f + ':' + n); if (TOKEN.length > 10 && txt.includes(TOKEN)) tok.push(f); }
  check('V8', 'needle + API-token scan clean on deliverables', hits.length === 0 && tok.length === 0, 'needles=' + (hits.join(',') || 'CLEAN') + ' tokens=' + (tok.join(',') || 'CLEAN'));

  // V9 live inventory + identity hash (GET only)
  const fetchW = async () => { const o = {}; for (const t of WIKI_TYPES) o[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`); return o; };
  const a1 = await fetchW(), a2 = await fetchW();
  let mis = 0; for (const t of WIKI_TYPES) if (JSON.stringify(a1[t]) !== JSON.stringify(a2[t])) mis++;
  const counts = {}; for (const t of WIKI_TYPES) counts[t] = a1[t].length;
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const canonical = {};
  for (const t of WIKI_TYPES) for (const rec of a1[t]) canonical[rec._id] = { t, rec };
  const hp = Object.keys(canonical).sort().map((id) => sha(JSON.stringify({ id, title: titleOf(canonical[id].t, canonical[id].rec), slug: slugValue(canonical[id].rec.slug) })));
  const ih = sha(hp.join('\n'));
  check('V9', 'live inventory 473 double-read + canonical identity hash unchanged', mis === 0 && total === 473 && ih === EXPECTED_HASH && WIKI_TYPES.every((t) => counts[t] === EXPECTED_COUNTS[t]), 'total=' + total + ' hash=' + (ih === EXPECTED_HASH ? 'MATCH' : 'MISMATCH'));

  // V10 report statements
  const st = report.includes('sanityWrites=0') && report.includes('mutationCalls=0') && report.includes('deployments=0') && report.includes('awaiting PM decisions') && report.includes('blank = NOT APPROVED') && report.includes('Next decision required from PM');
  check('V10', 'report carries required statements (awaiting PM, no-write, next decision)', st, st ? 'all present' : 'missing statement');

  const failed = checks.filter((c) => !c.pass);
  console.log('');
  console.log('GATES ' + (checks.length - failed.length) + '/' + checks.length + (failed.length ? ' FAILURES: ' + failed.map((c) => c.id).join(',') : ' ALL PASS'));
  console.log('sanityWrites=0');
  console.log('mutationCalls=0');
  console.log('deployments=0');
  if (failed.length) { console.log('PHASE 01 VALIDATION FAILED'); process.exit(2); }
  console.log('PHASE 01 RECOMMENDATIONS COMPLETE - AWAITING PM DECISIONS');
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
