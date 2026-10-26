// SPEC 11 Phase 02 deliverables validator - READ-ONLY (local checks, public GET re-fetch, one Sanity GET-only inventory read).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { spawnSync } = require('child_process');

const OUT = 'reports/SPEC_11/pm_review/phase_02';
const P1 = 'reports/SPEC_11/pm_review/phase_01';
const REV = 'reports/SPEC_11/revision_1';
const RPT = 'report/SPEC_11';
const PKG = 'phase/11';
const FILES = ['SOURCE_VERIFICATION.csv', 'SOURCE_CONFLICTS.md', 'EVIDENCE_GAPS.csv', 'PHASE_02_VERIFICATION_REPORT.md', 'PHASE_02_CHECKSUMS.txt'];
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const PKG_HASHES = {
  'SPEC_11_PM_REVISED_PLAN_APPROVAL_PACKAGE.md': '0a646731ef37e8bfb3270721e4d1402207c0b6a1dc0c6279d11ac044dc3e326e',
  'SPEC_11_PM_APPROVAL_MATRIX.csv': 'c47d2fc128cca98df9c183d458516857ab8f002f6eb1fa2aabe23ac644c3af9f',
  'SPEC_11_PM_RESEARCH_BACKLOG.csv': 'f38b8c35807686976feac31a5a9410fd4a46ac71a67c894dd2a7948c14019148',
};
const NEEDLES = ['mutate(', 'createOrReplace', 'createIfNotExists', '.patch(', 'method:"POST"', '?mutate', 'https.request('];
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const shaFile = (f) => sha(fs.readFileSync(f));
const UA = 'AquaMindWiki-Verification/1.0 (research evidence check; GET only; contact: repo maintainers)';
function sp(l) { const r = []; let c = '', q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '"') { if (l[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else { if (ch === '"') q = true; else if (ch === ',') { r.push(c); c = ''; } else c += ch; } } r.push(c); return r; }
function readCsv(file) { const lines = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.length > 0); const h = sp(lines[0]); return lines.slice(1).map((l) => { const r = sp(l); const o = {}; h.forEach((k, i) => { o[k] = r[i] ?? ''; }); return o; }); }
const checks = [];
const check = (id, name, ok, detail) => { checks.push({ id, pass: !!ok }); console.log((ok ? 'CHECK OK   ' : 'CHECK FAIL ') + id + ' ' + name + ' - ' + detail); };

// ---- public GET mirrors (same pipeline as SPEC_11_phase02_fetch.js) ----
function fetchUrl(url, redirects = 0) {
  return new Promise((resolve) => {
    const lib = url.startsWith('http:') ? http : https;
    const req = lib.get(url, { headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*' }, timeout: 25000 }, (res) => {
      const status = res.statusCode;
      if (status >= 300 && status < 400 && res.headers.location && redirects < 5) {
        res.resume();
        let next = res.headers.location;
        if (next.startsWith('/')) { const u = new URL(url); next = u.protocol + '//' + u.host + next; }
        return fetchUrl(next, redirects + 1).then(resolve);
      }
      const chunks = []; let size = 0, aborted = false;
      res.on('data', (c) => { size += c.length; if (size > 2.5 * 1024 * 1024) { aborted = true; req.destroy(); return; } chunks.push(c); });
      res.on('end', () => { if (aborted) return resolve({ status, html: '' }); resolve({ status, html: Buffer.concat(chunks).toString('utf8') }); });
      res.on('error', (e) => resolve({ status, error: e.message, html: '' }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout', html: '' }); });
    req.on('error', (e) => resolve({ status: 0, error: e.message || 'network', html: '' }));
  });
}
function htmlToText(html) {
  let t = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  t = t.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ');
  return t.slice(0, 400000);
}
const norm = (t) => (t || '').toLowerCase().replace(/\s+/g, ' ');
const flat = (t) => t.replace(/,/g, '');

(async () => {
  const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];

  // V1 deliverables + counts + id sets vs phase 01
  const missing = FILES.filter((f) => !fs.existsSync(path.join(OUT, f)));
  let ver = [], gaps = [], fills = [], reps = [];
  if (!missing.length) {
    ver = readCsv(path.join(OUT, 'SOURCE_VERIFICATION.csv'));
    gaps = readCsv(path.join(OUT, 'EVIDENCE_GAPS.csv'));
    fills = readCsv(path.join(P1, 'FILL_DECISION_RECOMMENDATIONS.csv')).filter((r) => r.proposedWritableSet === 'YES');
    reps = readCsv(path.join(P1, 'REPLACEMENT_DECISION_RECOMMENDATIONS.csv')).filter((r) => r.proposedWritableSet === 'YES');
  }
  const verIds = new Set(ver.map((r) => r.candidateId));
  const fillRec = fills.map((f) => f.recId);
  const repRec = reps.map((r) => r.recId);
  const sameFills = fillRec.every((id) => verIds.has(id)) && ver.filter((r) => r.register === 'FILL').every((r) => { const f = fills.find((x) => x.recId === r.candidateId); return f && f.mutationId === r.mutationId; });
  const sameReps = repRec.every((id) => verIds.has(id)) && ver.filter((r) => r.register === 'REPLACEMENT').every((r) => { const f = reps.find((x) => x.recId === r.candidateId); return f && f.conflictId === r.conflictId; });
  const noExtra = [...verIds].every((id) => fillRec.includes(id) || repRec.includes(id));
  const gapC = gaps.reduce((a, g) => { a[g.gapType] = (a[g.gapType] || 0) + 1; return a; }, {});
  check('V1', '5 deliverables; SOURCE_VERIFICATION=337 = 316+21 approve recIds, unique; gaps=55+100',
    !missing.length && ver.length === 337 && verIds.size === 337 && fillRec.length === 316 && repRec.length === 21 && sameFills && sameReps && noExtra && gaps.length === 155 && gapC.CANDIDATE_VERIFICATION === 55 && gapC.RESEARCH_PLAN === 100,
    missing.length ? 'missing:' + missing : `rows=${ver.length} unique=${verIds.size} fills=${fillRec.length} reps=${repRec.length} sameFills=${sameFills} sameReps=${sameReps} noExtra=${noExtra} gaps=${JSON.stringify(gapC)}`);

  // V2 disposition vocabulary + register/id consistency + report/conflicts file agreement
  const VOCAB = new Set(['VERIFIED_SUPPORT', 'VERIFIED_SUPPORT_WITH_CAVEAT', 'CONFLICTING_EVIDENCE', 'INSUFFICIENT_EVIDENCE', 'SOURCE_UNAVAILABLE', 'SPECIES_MISMATCH', 'CLAIM_NOT_FOUND']);
  const vocabOk = ver.every((r) => VOCAB.has(r.evidenceDisposition));
  const regOk = ver.every((r) => (r.register === 'FILL' && r.mutationId && r.candidateId.startsWith('P01-F-')) || (r.register === 'REPLACEMENT' && r.mutationId && r.conflictId && r.candidateId.startsWith('P01-R-')));
  const dc = ver.reduce((a, r) => { a[r.evidenceDisposition] = (a[r.evidenceDisposition] || 0) + 1; return a; }, {});
  const report = fs.readFileSync(path.join(OUT, 'PHASE_02_VERIFICATION_REPORT.md'), 'utf8');
  const dispTable = {};
  for (const m of report.matchAll(/^\| (VERIFIED_SUPPORT|VERIFIED_SUPPORT_WITH_CAVEAT|CONFLICTING_EVIDENCE|INSUFFICIENT_EVIDENCE|SOURCE_UNAVAILABLE|SPECIES_MISMATCH|CLAIM_NOT_FOUND) \| (\d+) \| (\d+) \| (\d+) \|\s*$/gm)) dispTable[m[1]] = { fills: Number(m[2]), reps: Number(m[3]), total: Number(m[4]) };
  const regC = ver.reduce((a, r) => { const k = r.evidenceDisposition + '|' + r.register; a[k] = (a[k] || 0) + 1; return a; }, {});
  const repAgree = Object.keys(dc).every((d) => dispTable[d] && dispTable[d].total === dc[d] && dispTable[d].fills === (regC[d + '|FILL'] || 0) && dispTable[d].reps === (regC[d + '|REPLACEMENT'] || 0)) && Object.keys(dispTable).every((d) => (dc[d] || 0) === dispTable[d].total && dispTable[d].fills === (regC[d + '|FILL'] || 0) && dispTable[d].reps === (regC[d + '|REPLACEMENT'] || 0));
  const conflictCount = dc.CONFLICTING_EVIDENCE || 0;
  const conflictsDoc = fs.readFileSync(path.join(OUT, 'SOURCE_CONFLICTS.md'), 'utf8');
  const conflictDocOk = conflictCount === 0 ? /No contradictions were detected/.test(conflictsDoc) || /CONFLICTING_EVIDENCE candidates: \**0/.test(conflictsDoc) || conflictsDoc.includes('**0**') : conflictsDoc.length > 100;
  check('V2', 'disposition vocab valid; register/id consistent; report + conflicts doc match CSV counts',
    vocabOk && regOk && repAgree && conflictDocOk && conflictCount === 0 && (dc.SPECIES_MISMATCH || 0) === 0,
    `vocab=${vocabOk} reg=${regOk} reportAgree=${repAgree} conflicts=${conflictCount} mismatches=${dc.SPECIES_MISMATCH || 0} counts=${JSON.stringify(dc)}`);

  // V3 verified rows invariants
  const verified = ver.filter((r) => r.evidenceDisposition === 'VERIFIED_SUPPORT');
  const caveated = ver.filter((r) => r.evidenceDisposition === 'VERIFIED_SUPPORT_WITH_CAVEAT');
  const v3bad = verified.filter((r) => r.httpStatus !== '200' || /none located/i.test(r.claimSupported) || !r.speciesSpecificity.startsWith('MATCH') || !/^[a-f0-9]{64}$/.test(r.contentSha256) || !(r.claimSupported || '').trim() || !(r.rationale || '').trim());
  const c3bad = caveated.filter((r) => r.httpStatus !== '200' || !/^[a-f0-9]{64}$/.test(r.contentSha256) || !(r.caveat || '').trim() || !(r.rationale || '').trim());
  check('V3', 'VERIFIED_SUPPORT: http 200 + species MATCH + real snippet + rationale + contentSha256; caveated rows carry caveat + rationale',
    v3bad.length === 0 && c3bad.length === 0 && verified.length === 118 && caveated.length === 164,
    `verified=${verified.length} caveated=${caveated.length} v3bad=${v3bad.length} c3bad=${c3bad.length}` + (v3bad.length ? ' first=' + v3bad[0].candidateId : ''));

  // V4 fresh re-fetch of every verified URL; stored snippet must appear in fresh page text (whitespace-insensitive)
  const stripAnn = (s) => s.replace(/\s*\[[^\]]*\]\s*$/, '').trim();
  const key = (s) => flat(norm(s)).replace(/\s+/g, '');
  const vUrls = [...new Set(verified.concat(caveated).map((r) => r.sourceUrl))];
  const snippetsBy = {};
  for (const r of verified.concat(caveated)) {
    const base = stripAnn(r.claimSupported);
    if (!base || base.startsWith('prose reviewed at content stage')) continue;
    // multi-flag / conflict snippets join distinct page passages with ' | ' or ' >>> but later: '; each part must appear independently
    const parts = base.split(/\s+\|\s+|\s+>>>\s+but later:\s+/).map((p) => key(p).slice(0, 180)).filter((p) => p.length >= 20);
    if (!parts.length) continue;
    (snippetsBy[r.sourceUrl] = snippetsBy[r.sourceUrl] || []).push({ id: r.candidateId, parts });
  }
  const q4 = vUrls.slice();
  const res4 = {};
  async function worker4() { while (q4.length) { const u = q4.shift(); res4[u] = await fetchUrl(u); await new Promise((r) => setTimeout(r, 100)); } }
  await Promise.all([worker4(), worker4(), worker4(), worker4()]);
  let reFetchedOk = 0, snippetMiss = [], freshFail = [];
  for (const u of vUrls) {
    const rr = res4[u];
    if (!rr || rr.status !== 200 || !rr.html) { freshFail.push(u); continue; }
    reFetchedOk++;
    const ft = key(htmlToText(rr.html));
    for (const s of snippetsBy[u] || []) for (const p of s.parts) if (!ft.includes(p)) snippetMiss.push(s.id);
  }
  check('V4', 'fresh GET re-fetch: every verified URL returns 200 and every stored claim snippet is present in fresh page text',
    freshFail.length === 0 && snippetMiss.length === 0 && reFetchedOk === vUrls.length,
    `urls=${vUrls.length} freshOk=${reFetchedOk} snippetMiss=${snippetMiss.length}${snippetMiss.length ? ' ids=' + snippetMiss.slice(0, 5).join(',') : ''} freshFail=${freshFail.join(',') || 'none'}`);

  // V5 no writable promotion: phase 01 + package + Stage A + Revision 1 unchanged; research plan still writable=NO
  const P1_HASHES = {
    'EVIDENCE_REVIEW_BY_SPECIES.md': 'd86b54fc4d72f432e8de90e3d5b4829d92d04a493099a6ac9d2d77e69c03eeb2',
    'FILL_DECISION_RECOMMENDATIONS.csv': '3f4594abfd9376de3bf1bba46c3049d43d9e3828b462da36ee9bac3d929e2a76',
    'REPLACEMENT_DECISION_RECOMMENDATIONS.csv': '54c210654aa350b7fc46b581ce81533f24642df233d63d2f145b584095100275',
    'UNRESOLVED_RESEARCH_PLAN.csv': 'c3dcabc2f1578f7fb8f2e74512402b11487c4ee308dc4cbe924556efe9804493',
    'PHASE_01_REVIEW_REPORT.md': 'f48e1520564027f85f8ea05e4e7a2bcf30cefb117a452c930d66b6c47e903afa',
  };
  const p1Bad = Object.entries(P1_HASHES).filter(([f, h]) => shaFile(path.join(P1, f)) !== h).map(([f]) => f);
  const planRows = readCsv(path.join(P1, 'UNRESOLVED_RESEARCH_PLAN.csv'));
  const planLeak = planRows.filter((p) => p.writable !== 'NO' || p.pmDecision !== '');
  const matrixBlank = readCsv(path.join(PKG, 'SPEC_11_PM_APPROVAL_MATRIX.csv')).every((m) => m.pmDecision === '' && m.pmRationale === '');
  const pkgBad = Object.entries(PKG_HASHES).filter(([f, h]) => !fs.existsSync(path.join(PKG, f)) || shaFile(path.join(PKG, f)) !== h).map(([f]) => f);
  const integrity = JSON.parse(fs.readFileSync(path.join(RPT, 'INTEGRITY.json'), 'utf8'));
  const origBad = [];
  for (const [f, h] of Object.entries(integrity.artifactHashes || {})) for (const dir of [RPT, 'reports/SPEC_11']) { try { if (shaFile(path.join(dir, f)) !== h) origBad.push(dir + '/' + f); } catch (e) { origBad.push(dir + '/' + f + ':missing'); } }
  const revSums = fs.readFileSync(path.join(REV, 'REVISION_1_CHECKSUMS.txt'), 'utf8');
  const revEntries = [...revSums.matchAll(/^\s+([A-Z0-9_]+\.(?:csv|md|txt|json)):\s*([a-f0-9]{64})/gm)];
  const revBad = revEntries.filter(([, name, h]) => { const a = path.join(REV, name), b = path.join(RPT, name); const f = fs.existsSync(a) ? a : b; return !fs.existsSync(f) || shaFile(f) !== h; }).map(([, name]) => name);
  check('V5', 'no writable promotion: phase 01 + package + Stage A + Revision 1 byte-identical; plan 100 rows writable=NO; matrix pmDecision blank',
    p1Bad.length === 0 && planRows.length === 100 && planLeak.length === 0 && matrixBlank && pkgBad.length === 0 && origBad.length === 0 && revBad.length === 0 && revEntries.length === 15,
    `p1=${p1Bad.join(',') || '5/5'} plan=${planRows.length} leak=${planLeak.length} matrixBlank=${matrixBlank} pkg=${pkgBad.join(',') || '3/3'} stageA=${origBad.join(',') || '11/11 x2'} rev1=${revBad.join(',') || revEntries.length + '/' + revEntries.length}`);

  // V6 determinism: generator reruns byte-identical against fixed cache
  const hashOut = () => FILES.map((f) => shaFile(path.join(OUT, f)));
  const h1 = hashOut();
  const r1 = spawnSync(process.execPath, ['scripts/SPEC_11_phase02.js'], { encoding: 'utf8' });
  const h2 = hashOut();
  const r2 = spawnSync(process.execPath, ['scripts/SPEC_11_phase02.js'], { encoding: 'utf8' });
  const h3 = hashOut();
  const det = r1.status === 0 && r2.status === 0 && h1.join() === h2.join() && h2.join() === h3.join();
  check('V6', 'generator deterministic: two reruns produce byte-identical 5 deliverables from fixed _source_cache',
    det, det ? '6 files stable across 3 hash rounds (incl. checksums file)' : 'drift r1=' + r1.status + ' r2=' + r2.status + ' h1≠h2=' + (h1.join() !== h2.join()) + ' h2≠h3=' + (h2.join() !== h3.join()));

  // V7 needle + API-token scan on deliverables + phase 02 scripts
  const scanTargets = FILES.map((f) => path.join(OUT, f)).concat(['scripts/SPEC_11_phase02.js', 'scripts/SPEC_11_phase02_fetch.js']);
  const hits = [], tok = [];
  for (const f of scanTargets) { const txt = fs.readFileSync(f, 'utf8'); for (const n of NEEDLES) if (txt.includes(n)) hits.push(f + ':' + n); if (TOKEN.length > 10 && txt.includes(TOKEN)) tok.push(f); }
  check('V7', 'needle + API-token scan clean on deliverables and phase 02 scripts', hits.length === 0 && tok.length === 0, 'needles=' + (hits.join(',') || 'CLEAN') + ' tokens=' + (tok.join(',') || 'CLEAN'));

  // V8 live inventory + identity hash (GET only)
  const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
  const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
  const EXPECTED_COUNTS = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
  const q = (query) => new Promise((res, rej) => { https.get(BASE + '?query=' + encodeURIComponent(query), { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => { const c = []; r.on('data', (d) => c.push(d)); r.on('end', () => { try { res(JSON.parse(Buffer.concat(c).toString()).result); } catch (e) { rej(e); } }); }).on('error', rej); });
  const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
  const titleOf = (t, it) => (t === 'problem' ? it.title : it.name);
  const fetchW = async () => { const o = {}; for (const t of WIKI_TYPES) o[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`); return o; };
  const a1 = await fetchW(), a2 = await fetchW();
  let mis = 0; for (const t of WIKI_TYPES) if (JSON.stringify(a1[t]) !== JSON.stringify(a2[t])) mis++;
  const counts = {}; for (const t of WIKI_TYPES) counts[t] = a1[t].length;
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const canonical = {};
  for (const t of WIKI_TYPES) for (const rec of a1[t]) canonical[rec._id] = { t, rec };
  const hp = Object.keys(canonical).sort().map((id) => sha(JSON.stringify({ id, title: titleOf(canonical[id].t, canonical[id].rec), slug: slugValue(canonical[id].rec.slug) })));
  const ih = sha(hp.join('\n'));
  check('V8', 'live inventory 473 double-read + canonical identity hash unchanged', mis === 0 && total === 473 && ih === EXPECTED_HASH && WIKI_TYPES.every((t) => counts[t] === EXPECTED_COUNTS[t]), 'total=' + total + ' hash=' + (ih === EXPECTED_HASH ? 'MATCH' : 'MISMATCH'));

  // V9 PHASE_02_CHECKSUMS.txt self-consistency
  const sums = fs.readFileSync(path.join(OUT, 'PHASE_02_CHECKSUMS.txt'), 'utf8');
  const entries = [...sums.matchAll(/^([A-Z0-9_]+\.(?:csv|md|txt)):\s*([a-f0-9]{64})/gm)];
  const sumBad = entries.filter(([, name, h]) => !fs.existsSync(path.join(OUT, name)) || shaFile(path.join(OUT, name)) !== h).map(([, name]) => name);
  const sumsCarry = sums.includes('sanityWrites=0') && sums.includes('mutationCalls=0') && sums.includes('deployments=0');
  check('V9', 'PHASE_02_CHECKSUMS.txt: 4 artifact hashes match actual files; no-write statements present', entries.length === 4 && sumBad.length === 0 && sumsCarry, `entries=${entries.length} bad=${sumBad.join(',') || 'none'} statements=${sumsCarry}`);

  // V10 report required statements
  const st = report.includes('sanityWrites=0') && report.includes('mutationCalls=0') && report.includes('deployments=0') && /awaiting PM decisions/i.test(report) && report.includes('282/337') && report.includes('Do not treat any disposition as approval');
  check('V10', 'report carries required statements (awaiting PM, no-write, no-approval, support total)', st, st ? 'all present' : 'missing statement');

  // V11 tests: focused schema suite + full suite (compare.test.ts baseline reported separately)
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
  const t1 = spawnSync('npx', ['vitest', 'run', 'tests/spec10m-schema.test.ts'], { encoding: 'utf8', shell: true });
  const t1Out = stripAnsi((t1.stdout || '') + (t1.stderr || ''));
  const focusedOk = /108 passed/.test(t1Out) && !/failed/.test(t1Out.replace(/0 failed/g, ''));
  const t2 = spawnSync('npm', ['test'], { encoding: 'utf8', shell: true });
  const t2Out = stripAnsi((t2.stdout || '') + (t2.stderr || ''));
  const failLines = t2Out.split(/\r?\n/).filter((l) => /^\s*(FAIL|❯)\s/.test(l));
  const failFiles = [...new Set(failLines.map((l) => (/(tests|scripts)\/[^\s:]+\.(?:test\.)?[cm]?[jt]sx?/).exec(l)?.[0]).filter(Boolean))];
  const fullOk = /1 failed/.test(t2Out) && /372 passed/.test(t2Out) && failFiles.length === 1 && failFiles[0] === 'tests/compare.test.ts';
  check('V11', 'focused schema suite 108/108; full suite fails only known baseline tests/compare.test.ts (reported separately, not fixed)',
    focusedOk && fullOk, `focused=${focusedOk} fullBaseline=${fullOk} failFiles=${failFiles.join(',') || 'none'}`);

  const failed = checks.filter((c) => !c.pass);
  console.log('');
  console.log('GATES ' + (checks.length - failed.length) + '/' + checks.length + (failed.length ? ' FAILURES: ' + failed.map((c) => c.id).join(',') : ' ALL PASS'));
  console.log('known baseline failure (expected, not fixed): tests/compare.test.ts');
  console.log('sanityWrites=0');
  console.log('mutationCalls=0');
  console.log('deployments=0');
  if (failed.length) { console.log('PHASE 02 VALIDATION FAILED'); process.exit(2); }
  console.log('SPEC 11 PHASE 02 COMPLETE - AWAITING PM DECISIONS');
})().catch((e) => { console.error('FATAL', e); process.exit(2); });

