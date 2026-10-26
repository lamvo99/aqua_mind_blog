const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const OUT_DIR = path.join('report', 'SPEC_04');
const SPEC03_DIR = path.join('report', 'SPEC_03');

const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';

const A_CONF = new Set(['HIGH', 'MEDIUM', 'LOW', 'BLOCKED']);
const D_CONF = new Set(['HIGH_CONFIDENCE', 'MEDIUM_CONFIDENCE', 'LOW_CONFIDENCE', 'DUPLICATE_RISK', 'TAXONOMY_RISK', 'INSUFFICIENT_EVIDENCE']);
const SEO_CLASSES = new Set(['SEO_MISSING', 'SEO_INCOMPLETE', 'SEO_POTENTIAL', 'SEO_NOT_APPLICABLE', 'REVIEW_REQUIRED']);
const ALLOWED_RECS = new Set([
  'REVIEW_REQUIRED', 'APPROVE_FOR_FUTURE_SPEC', 'PROPOSE_FOR_FUTURE_SPEC', 'DO_NOT_AUTO_CREATE',
  'REJECT_FLAGGED', 'REJECT_DUPLICATE', 'KEEP_EMPTY', 'BLOCK', 'INVENTORY_ONLY_FUTURE_SPEC',
]);

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);
const normField = (f) => String(f).replace(/^[a-z]+\./, '');

function q(query) {
  const url = BASE + '?query=' + encodeURIComponent(query);
  return new Promise((res, rej) => {
    https.get(url, { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      r.on('end', () => {
        const d = Buffer.concat(chunks).toString('utf8');
        try { res(JSON.parse(d).result); } catch (e) { rej(new Error('bad response: ' + d.slice(0, 300))); }
      });
    }).on('error', rej);
  });
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').replace(/^\?/, '').split(/\r?\n/).filter((l) => l.length);
  const parseLine = (l) => {
    const o = []; let cur = '', inQ = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (inQ) {
        if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQ = false;
        else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ',') { o.push(cur); cur = ''; }
      else cur += ch;
    }
    o.push(cur);
    return o;
  };
  const hdr = parseLine(lines[0]);
  return lines.slice(1).map((l) => {
    const vals = parseLine(l);
    const row = {};
    hdr.forEach((h, i) => { row[h] = vals[i] ?? ''; });
    return row;
  });
}

const checks = [];
const ac = (id, name, ok, detail) => {
  checks.push({ id, name, pass: !!ok, detail: String(detail ?? '') });
  console.log(`${ok ? 'AC OK  ' : 'AC FAIL'} ${id} ${name} - ${detail ?? ''}`);
};

(async () => {
  // ---------- artifacts ----------
  const required = [
    'SPEC_04_PRE_AUDIT_SNAPSHOT.json', 'SPEC_04_REVIEW_REQUIRED_AUDIT.csv', 'SPEC_04_REPLACE_FIELD_AUDIT.csv',
    'SPEC_04_BLOCKED_CLASSIFICATION.csv', 'SPEC_04_RELATIONSHIP_AUDIT.csv', 'SPEC_04_SEO_INVENTORY.csv',
    'SPEC_04_SOURCE_MANIFEST.json', 'SPEC_04_VALIDATION.json', 'SPEC_04_AUDIT_REPORT.md',
  ];
  const recommended = ['SPEC_04_CONFLICTS.csv', 'SPEC_04_CROSS_WORKSTREAM_CHECK.json', 'SPEC_04_PROPOSED_NEXT_SCOPE.md'];
  const missingRequired = required.filter((n) => !fs.existsSync(path.join(OUT_DIR, n)));
  const missingRecommended = recommended.filter((n) => !fs.existsSync(path.join(OUT_DIR, n)));
  console.log(`artifacts required missing: ${missingRequired.join(',') || 'none'} (SPEC_04_VALIDATION.json pending write); recommended missing: ${missingRecommended.join(',') || 'none'}`);

  // ---------- inputs ----------
  const SNAPSHOT = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_04_PRE_AUDIT_SNAPSHOT.json'), 'utf8'));
  const PLAN = JSON.parse(fs.readFileSync(path.join(SPEC03_DIR, 'SPEC_03_REPAIR_PLAN.json'), 'utf8'));
  const CROSS = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_04_CROSS_WORKSTREAM_CHECK.json'), 'utf8'));
  const SPEC03_POST = JSON.parse(fs.readFileSync(path.join(SPEC03_DIR, 'SPEC_03_POST_ENRICHMENT_SNAPSHOT.json'), 'utf8'));
  const csvA = parseCsv(fs.readFileSync(path.join(OUT_DIR, 'SPEC_04_REVIEW_REQUIRED_AUDIT.csv'), 'utf8'));
  const csvB = parseCsv(fs.readFileSync(path.join(OUT_DIR, 'SPEC_04_REPLACE_FIELD_AUDIT.csv'), 'utf8'));
  const csvC = parseCsv(fs.readFileSync(path.join(OUT_DIR, 'SPEC_04_BLOCKED_CLASSIFICATION.csv'), 'utf8'));
  const csvD = parseCsv(fs.readFileSync(path.join(OUT_DIR, 'SPEC_04_RELATIONSHIP_AUDIT.csv'), 'utf8'));
  const csvE = parseCsv(fs.readFileSync(path.join(OUT_DIR, 'SPEC_04_SEO_INVENTORY.csv'), 'utf8'));
  const oppLines = fs.readFileSync(path.join(SPEC03_DIR, 'SPEC_03_RELATIONSHIP_OPPORTUNITIES.csv'), 'utf8')
    .replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.includes(':') && !l.startsWith('type.'));

  // ---------- fresh live fetch (read-only) ----------
  const live = {};
  for (const t of WIKI_TYPES) live[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`);
  const livePosts = await q('*[_type == "post" && !(_id in path("drafts.**"))]');
  const liveTools = await q('*[_type == "tool" && !(_id in path("drafts.**"))]');
  const liveCats = await q('*[_type == "category" && !(_id in path("drafts.**"))]');

  const counts = {};
  for (const t of WIKI_TYPES) counts[t] = live[t].filter((r) => !r._id.startsWith('drafts.')).length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  // ---------- AC-01 canonical record count = 473 ----------
  ac('AC-01', 'canonical record count = 473', total === 473 && WIKI_TYPES.every((t) => counts[t] === EXPECTED[t]),
    `total=${total} ${JSON.stringify(counts)}`);

  // ---------- AC-02 no duplicate slugs ----------
  const slugSeen = {}; let dupSlugs = 0;
  for (const t of WIKI_TYPES) for (const r of live[t]) {
    const s = slugValue(r.slug);
    if (!s) continue;
    if (slugSeen[s]) dupSlugs++;
    slugSeen[s] = r._id;
  }
  ac('AC-02', 'no duplicate slugs', dupSlugs === 0, `duplicates=${dupSlugs}`);

  // ---------- AC-03 no undefined routes ----------
  let noSlug = 0;
  for (const t of WIKI_TYPES) for (const r of live[t]) if (!slugValue(r.slug)) noSlug++;
  ac('AC-03', 'no undefined routes (all wiki slugs present)', noSlug === 0, `recordsWithoutSlug=${noSlug}`);

  // ---------- AC-04 ID/slug/title identity unchanged ----------
  const canonical = {};
  for (const t of WIKI_TYPES) for (const r of live[t]) canonical[r._id] = { type: t, rec: r };
  const spec03Ids = {};
  for (const t of WIKI_TYPES) for (const r of SPEC03_POST.records[t]) spec03Ids[r._id] = { type: t, rec: r };
  let idDiff = 0, slugDiff = 0, titleDiff = 0;
  for (const id of Object.keys(spec03Ids)) if (!canonical[id]) idDiff++;
  for (const id of Object.keys(canonical)) if (!spec03Ids[id]) idDiff++;
  for (const id of Object.keys(spec03Ids)) {
    const liveC = canonical[id], old = spec03Ids[id];
    if (!liveC) continue;
    if (slugValue(liveC.rec.slug) !== slugValue(old.rec.slug)) slugDiff++;
    if ((titleOf(liveC.type, liveC.rec) ?? null) !== (titleOf(old.type, old.rec) ?? null)) titleDiff++;
  }
  const hashParts = Object.keys(canonical).sort().map((id) => {
    const c = canonical[id];
    return sha256(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) }));
  });
  const hash = sha256(hashParts.join('\n'));
  ac('AC-04', 'ID/slug/title identity unchanged (incl. SPEC 03 hash)',
    idDiff === 0 && slugDiff === 0 && titleDiff === 0 && hash === EXPECTED_HASH,
    `idDiff=${idDiff} slugDiff=${slugDiff} titleDiff=${titleDiff} hash=${hash === EXPECTED_HASH ? 'MATCH' : hash}`);

  // ---------- AC-05 canonical mutation count = 0 (live full-doc vs pre-audit snapshot) ----------
  function docDiff(fresh, old, label) {
    const changed = [];
    const oldBy = {};
    for (const d of old) oldBy[d._id] = d;
    for (const d of fresh) {
      const o = oldBy[d._id];
      if (!o) { changed.push(`${label}:${d._id}:added`); continue; }
      if (JSON.stringify(d) !== JSON.stringify(o)) changed.push(`${label}:${d._id}:modified`);
    }
    for (const id of Object.keys(oldBy)) if (!fresh.some((d) => d._id === id)) changed.push(`${label}:${id}:deleted`);
    return changed;
  }
  let mutationDiff = [];
  for (const t of WIKI_TYPES) mutationDiff = mutationDiff.concat(docDiff(live[t], SNAPSHOT.records[t], t));
  mutationDiff = mutationDiff.concat(docDiff(livePosts, SNAPSHOT.posts, 'post'));
  mutationDiff = mutationDiff.concat(docDiff(liveTools, SNAPSHOT.tools, 'tool'));
  mutationDiff = mutationDiff.concat(docDiff(liveCats, SNAPSHOT.categories, 'category'));
  ac('AC-05', 'canonical mutation count = 0 (live vs pre-audit snapshot, full documents incl. _rev)',
    mutationDiff.length === 0, `changedDocs=${mutationDiff.length}${mutationDiff.length ? ' ' + mutationDiff.slice(0, 5).join(',') : ''}`);

  // ---------- AC-06 108 REVIEW_REQUIRED reconciled ----------
  const planReview = PLAN.proposals.filter((p) => p.action === 'REVIEW_REQUIRED');
  const planReviewKeys = new Set(planReview.map((p) => `${p.recordId}|${normField(p.field)}`));
  const csvAKeys = new Set(csvA.map((r) => `${r.recordId}|${normField(r.field)}`));
  let aMissing = 0, aExtra = 0;
  for (const k of planReviewKeys) if (!csvAKeys.has(k)) aMissing++;
  for (const k of csvAKeys) if (!planReviewKeys.has(k)) aExtra++;
  ac('AC-06', '108 REVIEW_REQUIRED rows reconciled (Workstream A vs SPEC 03 plan)',
    planReview.length === 108 && csvA.length === 108 && aMissing === 0 && aExtra === 0,
    `plan=${planReview.length} csv=${csvA.length} missing=${aMissing} extra=${aExtra}`);

  // ---------- AC-07 3 REPLACE_FIELD reconciled ----------
  const planReplace = PLAN.proposals.filter((p) => p.action === 'REPLACE_FIELD');
  const planReplaceKeys = new Set(planReplace.map((p) => `${p.recordId}|${normField(p.field)}`));
  const csvBKeys = new Set(csvB.map((r) => `${r.recordId}|${normField(r.field)}`));
  let bMissing = 0, bExtra = 0;
  for (const k of planReplaceKeys) if (!csvBKeys.has(k)) bMissing++;
  for (const k of csvBKeys) if (!planReplaceKeys.has(k)) bExtra++;
  ac('AC-07', '3 REPLACE_FIELD rows reconciled (Workstream B vs SPEC 03 plan)',
    planReplace.length === 3 && csvB.length === 3 && bMissing === 0 && bExtra === 0,
    `plan=${planReplace.length} csv=${csvB.length} missing=${bMissing} extra=${bExtra}`);

  // ---------- AC-08 1,146 BLOCKED reconciled ----------
  const planBlocked = PLAN.proposals.filter((p) => p.action === 'BLOCKED_FOR_REPAIR');
  const planBlockedKeys = new Set(planBlocked.map((p) => `${p.recordId}|${normField(p.field)}`));
  const csvCKeys = new Set(csvC.map((r) => `${r.recordId}|${normField(r.field)}`));
  let cMissing = 0, cExtra = 0;
  for (const k of planBlockedKeys) if (!csvCKeys.has(k)) cMissing++;
  for (const k of csvCKeys) if (!planBlockedKeys.has(k)) cExtra++;
  ac('AC-08', '1,146 BLOCKED rows reconciled (Workstream C vs SPEC 03 plan)',
    planBlocked.length === 1146 && csvC.length === 1146 && cMissing === 0 && cExtra === 0,
    `plan=${planBlocked.length} csv=${csvC.length} missing=${cMissing} extra=${cExtra}`);

  // ---------- AC-09 1,244 relationship opportunities reconciled ----------
  const oppKeys = new Set(oppLines.map((l) => `${l.slice(l.indexOf('.') + 1, l.indexOf(':'))}:${l.slice(l.indexOf(':') + 1)}`));
  const dKeys = new Set(csvD.map((r) => `${r.sourceField}:${r.recordId}`));
  let dMissing = 0, dExtra = 0;
  for (const k of oppKeys) if (!dKeys.has(k)) dMissing++;
  for (const k of dKeys) if (!oppKeys.has(k)) dExtra++;
  ac('AC-09', '1,244 relationship opportunities reconciled (Workstream D vs SPEC 03 opportunity list)',
    oppKeys.size === 1244 && dKeys.size === 1244 && dMissing === 0 && dExtra === 0,
    `opps=${oppKeys.size} csvUnique=${dKeys.size} csvRows=${csvD.length} missing=${dMissing} extra=${dExtra}`);

  // ---------- AC-10 218 SEO opportunities reconciled ----------
  const planSeo = PLAN.proposals.filter((p) => p.field === 'seo');
  const planSeoIds = new Set(planSeo.map((p) => p.recordId));
  const csvEIds = new Set(csvE.map((r) => r.recordId));
  let eMissing = 0, eExtra = 0;
  for (const id of planSeoIds) if (!csvEIds.has(id)) eMissing++;
  for (const id of csvEIds) if (!planSeoIds.has(id)) eExtra++;
  const badClass = csvE.filter((r) => !SEO_CLASSES.has(r.currentState)).length;
  ac('AC-10', '218 SEO opportunities reconciled (Workstream E vs plan field=seo; classification enum valid)',
    planSeo.length === 218 && csvE.length === 218 && eMissing === 0 && eExtra === 0 && badClass === 0,
    `plan=${planSeo.length} csv=${csvE.length} missing=${eMissing} extra=${eExtra} badClass=${badClass}`);

  // ---------- AC-11 evidence/confidence metadata on every classified item ----------
  const aMeta = csvA.filter((r) => !A_CONF.has(r.confidence) || !r.evidenceTier || !r.evidenceSummary).length;
  const bMeta = csvB.filter((r) => !A_CONF.has(r.confidence) || !r.evidence).length;
  const cMeta = csvC.filter((r) => !A_CONF.has(r.confidence) || !r.blockedReason || !r.requiredEvidence).length;
  const dMeta = csvD.filter((r) => !D_CONF.has(r.confidence) || !r.evidenceTier || !r.reason).length;
  const eMeta = csvE.filter((r) => !r.evidence || !r.recommendation || !r.risk).length;
  ac('AC-11', 'every classified item has evidence/confidence metadata (A/B/C/D conf in model; E per §10 columns)',
    aMeta === 0 && bMeta === 0 && cMeta === 0 && dMeta === 0 && eMeta === 0,
    `A_bad=${aMeta}/${csvA.length} B_bad=${bMeta}/${csvB.length} C_bad=${cMeta}/${csvC.length} D_bad=${dMeta}/${csvD.length} E_bad=${eMeta}/${csvE.length}`);

  // ---------- AC-12 no self-references ----------
  const canonicalIds = new Set([...Object.keys(canonical), ...livePosts.map((p) => p._id), ...liveTools.map((t) => t._id)]);
  let selfRefs = 0, badTargets = 0;
  for (const r of csvD) {
    if (r.candidateTargetId && r.candidateTargetId === r.recordId) selfRefs++;
    if (r.candidateTargetId && !canonicalIds.has(r.candidateTargetId)) badTargets++;
  }
  ac('AC-12', 'no relationship opportunity creates a self-reference (targets resolve to canonical ids)',
    selfRefs === 0 && badTargets === 0, `selfRefs=${selfRefs} unresolvedTargets=${badTargets}`);

  // ---------- AC-13 no relationship opportunity silently mutates canonical data ----------
  const mutLogAbsent = !fs.existsSync(path.join(OUT_DIR, 'SPEC_04_MUTATION_LOG.json'));
  ac('AC-13', 'no silent canonical mutation (live diff 0 + cross-check clean + no SPEC 04 mutation log)',
    mutationDiff.length === 0 && CROSS.mutationIntegrity.canonicalMutations === 0 && CROSS.pass === true && mutLogAbsent,
    `liveChanged=${mutationDiff.length} crossCheckMutations=${CROSS.mutationIntegrity.canonicalMutations} crossCheck.pass=${CROSS.pass} mutationLogAbsent=${mutLogAbsent}`);

  // ---------- AC-14 no unsupported external claim presented as canonical fact ----------
  const allRecRows = [...csvA.map((r) => ['A', r.recommendation]), ...csvB.map((r) => ['B', r.recommendation]),
    ...csvD.map((r) => ['D', r.recommendation]), ...csvE.map((r) => ['E', r.recommendation])];
  const badRecs = allRecRows.filter(([, rec]) => !ALLOWED_RECS.has(rec));
  const e6Rows = [...csvA, ...csvB, ...csvD, ...csvE].filter((r) => String(r.evidenceTier || '').includes('E6'));
  const e5NoUrl = [...csvA, ...csvB].filter((r) =>
    String(r.evidenceTier || '').includes('E5') && !/https?:\/\//.test(String(r.externalSources || '')));
  const cFutureBad = csvC.filter((r) => !['RESEARCH_BATCH', 'KEEP_EMPTY', 'DEFINE_CONVENTION', 'MANUAL_REVIEW'].includes(r.futureAction)).length;
  const dExternal = csvD.filter((r) => /E5|E6/.test(String(r.evidenceTier || '')));
  ac('AC-14', 'no unsupported external claim presented as canonical fact (no E6; E5 rows carry URL; recommendations non-executing)',
    badRecs.length === 0 && e6Rows.length === 0 && e5NoUrl.length === 0 && cFutureBad === 0 && dExternal.length === 0,
    `badRecs=${badRecs.length}${badRecs.length ? '(' + badRecs.slice(0, 3).map((x) => x.join(':')).join(' ') + ')' : ''} E6=${e6Rows.length} E5_without_url=${e5NoUrl.length} badFutureAction=${cFutureBad} D_external_tiers=${dExternal.length}`);

  // ---------- AC-15 SPEC 03 identity hash remains consistent ----------
  const manifest = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_04_SOURCE_MANIFEST.json'), 'utf8'));
  const snapshotA08 = (SNAPSHOT.gates || []).find((g) => g.id === 'A-08');
  ac('AC-15', 'SPEC 03 identity hash remains consistent (manifest + snapshot A-08 + live recompute)',
    manifest.canonicalHash === EXPECTED_HASH && !!snapshotA08 && snapshotA08.pass === true && hash === EXPECTED_HASH,
    `manifest=${manifest.canonicalHash === EXPECTED_HASH} snapshotA08=${snapshotA08 ? snapshotA08.pass : 'missing'} live=${hash === EXPECTED_HASH}`);

  // ---------- write validation output ----------
  const result = checks.every((c) => c.pass) ? 'PASS' : 'FAIL';
  const stillMissingRequired = missingRequired.filter((n) => n !== 'SPEC_04_VALIDATION.json');
  const artifactsComplete = stillMissingRequired.length === 0;
  const out = {
    spec: 'SPEC 04', phase: 'VALIDATION', generatedAt: new Date().toISOString(),
    method: 'read-only live re-fetch (data/query only) + deterministic reconciliation of GATE A/B artifacts against SPEC 03 canonical sources',
    checks,
    summary: { passed: checks.filter((c) => c.pass).length, total: checks.length, result },
    result,
    canonicalMutations: 0,
    artifacts: {
      required, recommended,
      missingRequired: stillMissingRequired, missingRecommended,
      complete: artifactsComplete,
      note: 'SPEC_04_VALIDATION.json is this file (written at validation time).',
    },
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_04_VALIDATION.json'), JSON.stringify(out, null, 2));
  console.log(`\nVALIDATION ${result}: ${out.summary.passed}/${checks.length} checks passed`);
  console.log(`Artifacts: ${artifactsComplete ? 'COMPLETE' : 'INCOMPLETE'} (required missing: ${stillMissingRequired.join(',') || 'none'}; recommended missing: ${missingRecommended.join(',') || 'none'})`);
  if (result !== 'PASS') process.exit(2);
})().catch((e) => { console.error('VALIDATION ERROR:', e.stack || e.message); process.exit(1); });
