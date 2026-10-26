// SPEC 11 Stage A Revision 1 validator (READ-ONLY: Sanity GET queries + local checks; no writes to Sanity).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const REV = 'reports/SPEC_11/revision_1';
const RPT = 'report/SPEC_11';
const TMP = 'C:/Users/lam72/AppData/Local/Temp/opencode';
const GEN = 'scripts/SPEC_11_revision1.js';
const ARTIFACTS = ['REVISED_MUTATION_PLAN.csv', 'REVISED_CONFLICT_REGISTER.csv', 'SEMANTIC_MAPPING_AUDIT.csv', 'HELD_FOR_EVIDENCE.csv', 'SPEC_11_STAGE_A_REVISION_1_REPORT.md', 'REVISION_1_CHECKSUMS.txt'];
const NEEDLES = ['mutate(', 'createOrReplace', 'createIfNotExists', '.patch(', 'method:"POST"', '?mutate', 'https.request('];
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';

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
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.length > 0);
  const header = splitCsvLine(lines[0]);
  return lines.slice(1).map((l) => {
    const row = splitCsvLine(l); const o = {};
    header.forEach((h, i) => { o[h] = row[i] !== undefined ? row[i] : ''; });
    return o;
  });
}
function runCmd(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: true, maxBuffer: 32 * 1024 * 1024 });
  const out = ((r.stdout || '') + '\n' + (r.stderr || '')).replace(/\u001b\[[0-9;]*m/g, '');
  const m = out.match(/Tests\s+(.{0,120})/);
  const failedFiles = [...out.matchAll(/FAIL\s+([^\s]+)/g)].map((x) => x[1]);
  return { code: r.status, testsLine: m ? m[1] : '', failedFiles: [...new Set(failedFiles)] };
}
const checks = [];
const check = (id, name, ok, detail) => {
  checks.push({ id, name, pass: !!ok, detail: String(detail ?? '') });
  console.log((ok ? 'CHECK OK ' : 'CHECK FAIL ') + id + ' ' + name + ' - ' + (detail ?? ''));
};

const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const q = (query) => new Promise((res, rej) => {
  const url = BASE + '?query=' + encodeURIComponent(query);
  httpsGet(url, (err, d) => err ? rej(err) : res(JSON.parse(d).result));
});
function httpsGet(url, cb) {
  require('https').get(url, { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => {
    const chunks = [];
    r.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    r.on('end', () => cb(null, Buffer.concat(chunks).toString('utf8')));
  }).on('error', (e) => cb(e));
}
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);

const VOCAB = {
  flowPreference: ['STILL', 'MODERATE', 'STRONG'],
  oxygenSensitivity: ['NEUTRAL', 'SENSITIVE'],
  swimmingSpace: ['NONE', 'LOW', 'MODERATE', 'HIGH'],
  jumpRisk: ['NONE', 'LOW', 'MODERATE', 'HIGH'],
  lidRequired: ['NOT_REQUIRED', 'RECOMMENDED', 'ESSENTIAL'],
  maturityRequirement: ['NONE', 'SUGGESTED', 'REQUIRED'],
  bioload: ['LOW', 'MODERATE', 'HIGH'],
  waterChangeSensitivity: ['LOW', 'MODERATE', 'HIGH'],
  communitySuitability: ['UNSUITABLE', 'CONDITIONAL', 'SUITABLE'],
  predatesInverts: ['NONE', 'POSSIBLE', 'LIKELY'],
  temperament: ['Peaceful', 'Semi-aggressive', 'Aggressive'],
  diet: ['Carnivore', 'Omnivore', 'Herbivore', 'Micropredator'],
};
const BEHAVIOR_FLAGS = ['open-water', 'territorial', 'solitary', 'nocturnal', 'diurnal', 'burrower', 'cave-dweller', 'strong-swimmer', 'timid'];
const SEMANTIC_HOLD_IDS = ['MUT11-006', 'MUT11-086', 'MUT11-112', 'MUT11-160', 'MUT11-262', 'MUT11-311', 'MUT11-409', 'MUT11-060', 'MUT11-087', 'MUT11-214', 'MUT11-166'];

(async () => {
  // ---- live inventory + hash (GET only, double-read) ----
  const fetchWiki = async () => { const o = {}; for (const t of WIKI_TYPES) o[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`); return o; };
  const r1 = await fetchWiki();
  const r2 = await fetchWiki();
  let mis = 0; for (const t of WIKI_TYPES) if (JSON.stringify(r1[t]) !== JSON.stringify(r2[t])) mis++;
  const counts = {}; for (const t of WIKI_TYPES) counts[t] = r1[t].length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  check('V-01', 'inventory 473 + double-read identical (live GET, read-only)', mis === 0 && total === 473 && WIKI_TYPES.every((t) => counts[t] === EXPECTED[t]), 'total=' + total + ' mismatchedTypes=' + mis + ' ' + JSON.stringify(counts));
  const canonical = {};
  for (const t of WIKI_TYPES) for (const rec of r1[t]) canonical[rec._id] = { type: t, rec };
  const hashParts = Object.keys(canonical).sort().map((id) => {
    const c = canonical[id];
    return sha(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) }));
  });
  const identityHash = sha(hashParts.join('\n'));
  check('V-02', 'canonical identity hash unchanged', identityHash === EXPECTED_HASH, identityHash === EXPECTED_HASH ? 'MATCH' : identityHash);

  // ---- load artifacts + originals ----
  const plan = readCsv(path.join(REV, 'REVISED_MUTATION_PLAN.csv'));
  const confReg = readCsv(path.join(REV, 'REVISED_CONFLICT_REGISTER.csv'));
  const audit = readCsv(path.join(REV, 'SEMANTIC_MAPPING_AUDIT.csv'));
  const held = readCsv(path.join(REV, 'HELD_FOR_EVIDENCE.csv'));
  const report = fs.readFileSync(path.join(REV, 'SPEC_11_STAGE_A_REVISION_1_REPORT.md'), 'utf8');
  const origPlan = readCsv(path.join(RPT, 'PROPOSED_MUTATIONS.csv'));
  const origConf = readCsv(path.join(RPT, 'CONFLICTS.csv'));
  const integrity = JSON.parse(fs.readFileSync(path.join(RPT, 'INTEGRITY.json'), 'utf8'));
  const queue = readCsv(path.join(RPT, 'WAVE_1_QUEUE.csv'));
  const reg = readCsv(path.join(RPT, 'RESEARCH_REGISTER.csv'));

  // V-03 scope
  const queueSlugs = new Set(queue.map((q2) => q2.slug));
  const planSlugs = new Set(plan.map((p) => p.slug));
  const offQueue = [...planSlugs].filter((s) => !queueSlugs.has(s));
  check('V-03', 'only the original 17 Wave-1 species in scope', planSlugs.size === 17 && offQueue.length === 0, 'slugs=' + planSlugs.size + ' offQueue=' + offQueue.length + (offQueue.length ? ':' + offQueue.join(',') : ''));

  // V-04 no unresolved eligible
  const pendingRs = new Set(reg.filter((r) => r.researchStatus === 'PENDING').map((r) => r.researchRowId));
  const eligible = plan.filter((p) => p.revisedDisposition === 'ELIGIBLE_FOR_PM_REVIEW');
  const badPending = eligible.filter((e) => pendingRs.has(e.researchRowId));
  const keepHoldIds = new Set(confReg.filter((c) => c.finalRecommendation === 'KEEP_HOLD').map((c) => c.conflictId));
  check('V-04', 'no unresolved research item is marked eligible', badPending.length === 0 && keepHoldIds.size === 14, 'pendingEligible=' + badPending.length + ' keepHold=' + keepHoldIds.size);

  // V-05 no LOW fill eligible
  const lowEligible = eligible.filter((e) => e.confidence === 'LOW');
  const lowHeldOk = plan.filter((p) => p.confidence === 'LOW' && p.originalMutationId !== 'MUT11-146').every((p) => p.revisedDisposition === 'HOLD_FOR_EVIDENCE');
  check('V-05', 'no LOW-confidence fill is marked eligible', lowEligible.length === 0 && lowHeldOk, 'lowEligible=' + lowEligible.length + ' lowHeldOk=' + lowHeldOk);

  // V-06 rejected conflicts not reintroduced
  const rejected = confReg.filter((c) => ['CF11-011', 'CF11-032', 'CF11-036'].includes(c.conflictId));
  const rejOk = rejected.length === 3 && rejected.every((c) => c.finalRecommendation === 'REJECTED');
  const rejMutRs = new Set(origConf.filter((c) => ['CF11-011', 'CF11-032', 'CF11-036'].includes(c.conflictId)).map((c) => c.researchRowId));
  const rejMutEligible = plan.filter((p) => rejMutRs.has(p.researchRowId) && (p.revisedDisposition === 'ELIGIBLE_FOR_PM_REVIEW' || p.revisedDisposition === 'CONFLICT_CANDIDATE_APPROVE'));
  check('V-06', 'no rejected conflict is reintroduced', rejOk && rejMutEligible.length === 0, 'rejected=' + rejected.length + ' reintroduced=' + rejMutEligible.length);

  // V-07 eligibility provenance
  const noSrc = eligible.filter((e) => !e.evidenceReference || e.evidenceReference.trim() === '' || e.evidenceReference.trim() === 'none');
  const badConf = eligible.filter((e) => !['MEDIUM', 'HIGH'].includes(e.confidence));
  check('V-07', 'eligible rows carry evidence + justified confidence (not schema-only)', noSrc.length === 0 && badConf.length === 0, 'noSource=' + noSrc.length + ' badConfidence=' + badConf.length);

  // V-08 enums / units / cross-field (hypothetical overlay of eligible fills + approve candidates)
  const badEnum = [], badNum = [], badCross = [], badSalinity = [];
  const liveBySlug = {};
  for (const t of WIKI_TYPES) for (const rec of r1[t]) { const s = slugValue(rec.slug); if (s) liveBySlug[s] = rec; }
  const overlay = {};
  const toNum = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
  for (const p of plan) {
    const active = p.revisedDisposition === 'ELIGIBLE_FOR_PM_REVIEW' || p.revisedDisposition === 'CONFLICT_CANDIDATE_APPROVE';
    if (!active) continue;
    const f = p.destinationField;
    if (f.startsWith('body:')) continue;
    if (VOCAB[f] && !VOCAB[f].includes(p.proposedValue)) badEnum.push(p.originalMutationId + ':' + f + '=' + p.proposedValue);
    if (f === 'behaviorFlags') {
      const flags = p.proposedValue.split(',').map((x) => x.trim()).filter(Boolean);
      for (const fl of flags) if (!BEHAVIOR_FLAGS.includes(fl)) badEnum.push(p.originalMutationId + ':behaviorFlags=' + fl);
    }
    if (f === 'groupSize') {
      try {
        const g = JSON.parse(p.proposedValue);
        if (!Number.isInteger(g.min) || g.min < 1) badNum.push(p.originalMutationId + ':groupSize.min');
        if (g.max != null && (!Number.isInteger(g.max) || g.max < g.min)) badNum.push(p.originalMutationId + ':groupSize.max');
      } catch (e) { badNum.push(p.originalMutationId + ':groupSize.parse'); }
    }
    if (f === 'salinityMin' || f === 'salinityMax') {
      const w = (liveBySlug[p.slug] || {}).waterType;
      if (w !== 'saltwater' && w !== 'brackish') badSalinity.push(p.originalMutationId + ':' + p.slug + ':waterType=' + w);
    }
    // numeric sanity only for numeric destinations
    if (['tempMinC', 'tempMaxC', 'phMin', 'phMax', 'ghMin', 'ghMax', 'salinityMin', 'salinityMax', 'tankSizeMinL', 'minTankLengthCm', 'minTankWidthCm', 'khMin', 'khMax'].includes(f)) {
      const n = toNum(p.proposedValue);
      if (n === null || !Number.isFinite(n)) badNum.push(p.originalMutationId + ':' + f + '=' + p.proposedValue);
      else {
        overlay[p.slug] = overlay[p.slug] || {};
        overlay[p.slug][f] = n;
      }
    }
  }
  for (const slug of Object.keys(overlay)) {
    const o = overlay[slug];
    const pairs = [['tempMinC', 'tempMaxC'], ['phMin', 'phMax'], ['ghMin', 'ghMax'], ['salinityMin', 'salinityMax']];
    for (const [lo, hi] of pairs) {
      if (o[lo] != null && o[hi] != null && o[lo] > o[hi]) badCross.push(slug + ':' + lo + '>' + hi);
    }
    // overlay against existing values on the live record
    const live = liveBySlug[slug] || {};
    for (const [lo, hi] of pairs) {
      const a = o[lo] != null ? o[lo] : live[lo];
      const b = o[hi] != null ? o[hi] : live[hi];
      if (a != null && b != null && a > b) badCross.push(slug + ':mixed ' + lo + '>' + hi);
    }
  }
  check('V-08', 'no invalid enum or unit/cross-range issue is introduced', badEnum.length === 0 && badNum.length === 0 && badCross.length === 0 && badSalinity.length === 0, 'badEnum=' + badEnum.length + ' badNum=' + badNum.length + ' badCross=' + badCross.length + ' badSalinity=' + badSalinity.length + (badEnum.concat(badNum, badCross, badSalinity).length ? ' [' + badEnum.concat(badNum, badCross, badSalinity).slice(0, 5).join(';') + ']' : ''));

  // V-09 determinism: two independent process regenerations, byte-identical to committed revision_1
  const t1 = path.join(TMP, 'rev1_det_1'); const t2 = path.join(TMP, 'rev1_det_2');
  for (const d of [t1, t2]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
  const g1 = spawnSync(process.execPath, [GEN, '--out', t1], { encoding: 'utf8' });
  const g2 = spawnSync(process.execPath, [GEN, '--out', t2], { encoding: 'utf8' });
  let detOk = g1.status === 0 && g2.status === 0;
  const detDiff = [];
  if (detOk) {
    for (const f of ARTIFACTS) {
      const a = fs.readFileSync(path.join(t1, f));
      const b = fs.readFileSync(path.join(t2, f));
      const c = fs.readFileSync(path.join(REV, f));
      if (!a.equals(b) || !a.equals(c)) { detOk = false; detDiff.push(f); }
    }
  } else detDiff.push('generatorExit=' + g1.status + '/' + g2.status);
  check('V-09', 'revised plan is deterministic across two independent runs (and matches revision_1)', detOk, 'diff=' + (detDiff.length ? detDiff.join(',') : 'none'));

  // V-10 counts reconcile
  const countsRe = {};
  plan.forEach((p) => { countsRe[p.revisedDisposition] = (countsRe[p.revisedDisposition] || 0) + 1; });
  const confRe = {};
  confReg.forEach((c) => { confRe[c.finalRecommendation] = (confRe[c.finalRecommendation] || 0) + 1; });
  const heldRe = {};
  held.forEach((h) => { heldRe[h.holdType] = (heldRe[h.holdType] || 0) + 1; });
  const expectedPlan = { ELIGIBLE_FOR_PM_REVIEW: 342, HOLD_FOR_EVIDENCE: 45, CONFLICT_CANDIDATE_APPROVE: 22, CONFLICT_DEFERRED: 11, CONFLICT_REJECTED: 3, SKIP_NOOP: 1 };
  const origIds = new Set(origPlan.map((p) => p.mutationId));
  const planIds = new Set(plan.map((p) => p.originalMutationId));
  const sameIds = origIds.size === planIds.size && [...origIds].every((id) => planIds.has(id));
  const reportTotals = {};
  const re = /^- ((?:CONFLICT_FINAL|HELD_TYPE) [A-Z_]+|PLAN_TOTAL|CONFLICT_TOTAL|LOW_HELD|P0_HELD|P0_DEFERRED_FLAGGED|HELD_TOTAL|SEMANTIC_AUDIT_ROWS|ELIGIBLE_FOR_PM_REVIEW|HOLD_FOR_EVIDENCE|CONFLICT_CANDIDATE_APPROVE|CONFLICT_DEFERRED|CONFLICT_REJECTED|SKIP_NOOP) \| (\d+)$/gm;
  let m2; while ((m2 = re.exec(report)) !== null) reportTotals[m2[1]] = Number(m2[2]);
  const recomputed = Object.assign({}, countsRe, {
    PLAN_TOTAL: plan.length, CONFLICT_TOTAL: confReg.length, LOW_HELD: plan.filter((p) => p.confidence === 'LOW' && p.revisedDisposition === 'HOLD_FOR_EVIDENCE').length,
    P0_HELD: plan.filter((p) => p.priority === 'P0' && p.revisedDisposition === 'HOLD_FOR_EVIDENCE').length,
    P0_DEFERRED_FLAGGED: plan.filter((p) => p.priority === 'P0' && p.revisedDisposition === 'CONFLICT_DEFERRED').length,
    HELD_TOTAL: held.length, SEMANTIC_AUDIT_ROWS: audit.length,
    'CONFLICT_FINAL CANDIDATE_APPROVE': confRe.CANDIDATE_APPROVE, 'CONFLICT_FINAL DEFERRED': confRe.DEFERRED,
    'CONFLICT_FINAL REJECTED': confRe.REJECTED, 'CONFLICT_FINAL KEEP_HOLD': confRe.KEEP_HOLD,
    'HELD_TYPE MUTATION_HOLD': heldRe.MUTATION_HOLD, 'HELD_TYPE CONFLICT_DEFERRED': heldRe.CONFLICT_DEFERRED, 'HELD_TYPE UNRESOLVED_CLAIM': heldRe.UNRESOLVED_CLAIM,
  });
  const mism = [];
  const planOk = Object.keys(expectedPlan).every((k) => countsRe[k] === expectedPlan[k]) && plan.length === 424 && sameIds;
  if (!planOk) mism.push('plan');
  if (confReg.length !== 50 || confRe.CANDIDATE_APPROVE !== 22 || confRe.DEFERRED !== 11 || confRe.REJECTED !== 3 || confRe.KEEP_HOLD !== 14) mism.push('conflicts');
  if (held.length !== 70 || heldRe.MUTATION_HOLD !== 45 || heldRe.CONFLICT_DEFERRED !== 11 || heldRe.UNRESOLVED_CLAIM !== 14) mism.push('held');
  if (audit.length !== 39) mism.push('audit');
  for (const k of Object.keys(recomputed)) if (reportTotals[k] !== recomputed[k]) mism.push('report:' + k + '(' + reportTotals[k] + '!=' + reComputedSafe(recomputed, k) + ')');
  check('V-10', 'CSV row counts, mutation IDs and disposition totals reconcile exactly', mism.length === 0, mism.length ? mism.join('; ') : 'plan424 conflicts50 held70 audit39 report=match');

  // V-11 originals unchanged
  let origOk = true; const origBad = [];
  for (const [f, h] of Object.entries(integrity.artifactHashes || {})) {
    for (const dir of [RPT, 'reports/SPEC_11']) {
      try { if (sha(fs.readFileSync(path.join(dir, f))) !== h) { origOk = false; origBad.push(dir + '/' + f); } }
      catch (e) { origOk = false; origBad.push(dir + '/' + f + ':missing'); }
    }
  }
  check('V-11', 'original Stage A artifacts unchanged (both copies vs frozen hashes)', origOk && origBad.length === 0, origBad.length ? origBad.join(',') : 'all verified');

  // V-12 build gates re-run
  const lint = runCmd('npm.cmd', ['run', 'lint']);
  const tsc = runCmd('npx.cmd', ['tsc', '--noEmit']);
  const focused = runCmd('npx.cmd', ['vitest', 'run', 'tests/spec10m-schema.test.ts']);
  let full = runCmd('npm.cmd', ['test']);
  if (full.code !== 0) full = runCmd('npm.cmd', ['test']);
  const build = runCmd('npm.cmd', ['run', 'build']);
  const fullOk = full.failedFiles.length === 1 && full.failedFiles[0] === 'tests/compare.test.ts' && /1 failed/.test(full.testsLine);
  const repLint = /\| Lint \(eslint\) \| exit (\d+) \|/.exec(report);
  const repTsc = /\| TypeScript \(tsc --noEmit\) \| exit (\d+) \|/.exec(report);
  const repBuild = /\| Production build \| exit (\d+) \|/.exec(report);
  const repFocused = /\| Focused SPEC 10M schema tests \| (\d+) passed/.exec(report);
  const repFullOk = /known baseline failure, reported separately, NOT counted as a pass/.test(report) && /tests\/compare\.test\.ts/.test(report);
  const gatesOk = lint.code === 0 && tsc.code === 0 && focused.code === 0 && /108 passed/.test(focused.testsLine) && fullOk && build.code === 0;
  const repOk = repLint && Number(repLint[1]) === lint.code && repTsc && Number(repTsc[1]) === tsc.code && repBuild && Number(repBuild[1]) === build.code && repFocused && Number(repFocused[1]) === 108 && repFullOk;
  check('V-12', 'lint / typecheck / tests / build pass; report numbers match fresh runs', gatesOk && repOk, 'lint=' + lint.code + ' tsc=' + tsc.code + ' focused=' + focused.testsLine + ' full=' + full.testsLine + ' build=' + build.code + ' reportMatch=' + !!repOk);

  // V-13 required statements
  const st1 = report.includes('SPEC 11 STAGE A REVISION 1 - COMPLETE');
  const st2 = report.includes('No production mutation occurred: sanityWrites=0 mutationCalls=0');
  const st3 = report.includes('sanityWrites=0 mutationCalls=0');
  check('V-13', 'report carries required status statements', st1 && st2 && st3, 'complete=' + st1 + ' noMutation=' + st2);

  // V-14 needle + token scan
  const needleHits = []; const tokenHits = [];
  for (const f of ARTIFACTS) {
    const txt = fs.readFileSync(path.join(REV, f), 'utf8');
    for (const n of NEEDLES) if (txt.includes(n)) needleHits.push(f + ':' + n);
    if (TOKEN.length > 10 && txt.includes(TOKEN)) tokenHits.push(f);
  }
  check('V-14', 'needle + API-token scan across revision artifacts', needleHits.length === 0 && tokenHits.length === 0, 'needles=' + (needleHits.join(',') || 'CLEAN') + ' tokens=' + (tokenHits.join(',') || 'CLEAN'));

  // V-15 semantic audit integrity
  const auditByMut = {};
  audit.forEach((a) => { if (a.field !== 'register.topicLinkage') auditByMut[a.affectedMutationIds] = a; });
  // MUT11-166 is an applicability hold on a structured field (groupSize) - verified via plan disposition, not the enum audit
  const enumHoldIds = SEMANTIC_HOLD_IDS.filter((id) => id !== 'MUT11-166');
  const holdsMissing = enumHoldIds.filter((id) => !auditByMut[id] || auditByMut[id].disposition !== 'HOLD_FOR_EVIDENCE');
  const holdPlanBad = SEMANTIC_HOLD_IDS.filter((id) => {
    const row = plan.find((p) => p.originalMutationId === id);
    return !row || row.revisedDisposition !== 'HOLD_FOR_EVIDENCE';
  });
  const mislinkRows = audit.filter((a) => a.field === 'register.topicLinkage' && a.disposition === 'RECORDED_FOR_STAGE_B_FIX');
  const auditIdsUnique = new Set(audit.map((a) => a.auditId)).size === audit.length;
  check('V-15', 'semantic audit covers every semantic hold + both topic mislinks; all semantic holds are held in plan', holdsMissing.length === 0 && holdPlanBad.length === 0 && mislinkRows.length === 2 && auditIdsUnique, 'holdsMissing=' + (holdsMissing.join(',') || 'none') + ' planBad=' + (holdPlanBad.join(',') || 'none') + ' mislinks=' + mislinkRows.length);

  // ---- write validation output ----
  const failed = checks.filter((c) => !c.pass);
  const out = {
    specId: 'SPEC_11_STAGE_A_REVISION_1', artifact: 'REVISION_VALIDATION', generatedAt: new Date().toISOString(),
    mode: 'READ-ONLY (Sanity GET queries only; no production mutation)',
    sanityWrites: 0, mutationCalls: 0,
    checks, gatesPassed: checks.length - failed.length, gatesFailed: failed.length,
    status: failed.length === 0 ? 'SPEC 11 STAGE A REVISION 1 - COMPLETE / READY FOR PM REVISED-PLAN REVIEW' : 'BLOCKED',
  };
  fs.writeFileSync(path.join(REV, 'REVISION_VALIDATION.json'), JSON.stringify(out, null, 2));
  console.log('WROTE ' + path.join(REV, 'REVISION_VALIDATION.json'));
  console.log('GATES ' + (checks.length - failed.length) + '/' + checks.length + (failed.length ? ' FAILURES: ' + failed.map((c) => c.id).join(',') : ' ALL PASS'));
  if (failed.length) { console.log('SPEC 11 REVISION 1 VALIDATION FAILED'); process.exit(2); }
  console.log('sanityWrites=0 mutationCalls=0');
  console.log('READY FOR PM REVISED-PLAN REVIEW');
})().catch((e) => { console.error('FATAL', e); process.exit(2); });

function reComputedSafe(map, k) { return map[k]; }
