const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUT = path.join('report', 'SPEC_02');
const SPEC01 = path.join('report', 'SPEC_01');
const SPEC001 = path.join('report', 'SPEC_00_1');

const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED_COUNTS = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const CATEGORY_ENUMS = {
  problem: ['water', 'algae', 'plants', 'fish', 'equipment'],
  equipment: ['Filter', 'Light', 'Pump', 'Heater', 'CO\u2082 System', 'Substrate', 'Test Kit', 'Other'],
};
const SYSTEM = new Set(['_rev', '_updatedAt', '_createdAt']);
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);

const checks = [];
const check = (name, ok, detail) => { checks.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };

const pre = JSON.parse(fs.readFileSync(path.join(OUT, 'SPEC_02_PRE_REPAIR_SNAPSHOT.json'), 'utf8'));
const post = JSON.parse(fs.readFileSync(path.join(OUT, 'SPEC_02_POST_REPAIR_SNAPSHOT.json'), 'utf8'));
const plan = JSON.parse(fs.readFileSync(path.join(OUT, 'SPEC_02_REPAIR_PLAN.json'), 'utf8'));
const log = JSON.parse(fs.readFileSync(path.join(OUT, 'SPEC_02_MUTATION_LOG.json'), 'utf8'));

// ---- 1. Record count ----
const preTotal = Object.keys(pre.perRecord).length;
const postTotal = Object.keys(post.perRecord).length;
check('1. Record count = 473 (pre & post snapshot)', preTotal === 473 && postTotal === 473, `pre=${preTotal} post=${postTotal}`);
check('2. Per-type counts exact (post)', WIKI_TYPES.every((t) => post.manifest.wikiTypeCounts[t] === EXPECTED_COUNTS[t]), JSON.stringify(post.manifest.wikiTypeCounts));

// ---- 3. Target coverage ----
const logMap = new Map(log.entries.map((e) => [e.recordId, e]));
const allApplied = plan.targets.length === 21 && plan.targets.every((t) => logMap.get(t.recordId)?.status === 'APPLIED');
check('3. All 21 targets mutated with status APPLIED', allApplied, `mutations=${log.entries.length} statuses=${[...new Set(log.entries.map((e) => e.status))].join(',')}`);
check('4. Mutation log has no duplicate recordId, all revision-guarded', new Set(log.entries.map((e) => e.recordId)).size === 21 && log.entries.every((e) => e.revisionBefore && e.revisionAfter), '21 unique, revBefore+revAfter present');

// ---- 5. Schema enum compliance ----
let invalidCats = [];
for (const t of ['equipment', 'problem']) {
  const list = post.records[t] || [];
  for (const r of list) {
    if (r._id.startsWith('drafts.')) continue;
    if (!CATEGORY_ENUMS[t].includes(r.category)) invalidCats.push(`${t}:${r._id}=${r.category}`);
  }
}
check('5. All equipment+problem categories valid per schema enum (post)', invalidCats.length === 0, invalidCats.length ? invalidCats.join(',') : `equipment=${post.records.equipment.length} problem=${post.records.problem.length}`);

// also: every target's post value equals plan proposal
const postAll = {};
for (const t of WIKI_TYPES) for (const r of post.records[t]) postAll[r._id] = r;
check('6. All 21 target post values match plan proposals', plan.targets.every((t) => postAll[t.recordId]?.category === t.proposedValue));

// ---- 7. Mutation scope (only category changed) ----
const preAll = {};
for (const t of WIKI_TYPES) for (const r of pre.records[t]) preAll[r._id] = r;
const targetIds = new Set(plan.targets.map((t) => t.recordId));
const diffFields = (a, b) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out = {};
  for (const k of keys) {
    if (SYSTEM.has(k)) continue;
    if (JSON.stringify(a[k] ?? null) !== JSON.stringify(b[k] ?? null)) out[k] = { before: a[k] ?? null, after: b[k] ?? null };
  }
  return out;
};
let scopeViolations = 0, nonTargetChanges = 0;
const targetOnlyCategory = plan.targets.every((t) => {
  const d = diffFields(preAll[t.recordId], postAll[t.recordId]);
  const keys = Object.keys(d);
  if (!(keys.length === 1 && keys[0] === 'category')) { scopeViolations++; return false; }
  return true;
});
for (const id of Object.keys(postAll)) {
  if (targetIds.has(id)) continue;
  if (Object.keys(diffFields(preAll[id], postAll[id])).length) nonTargetChanges++;
}
check('7. Only category changed on the 21 targets', targetOnlyCategory, `violations=${scopeViolations}`);
check('8. Zero changes on non-target records (452)', nonTargetChanges === 0, `changes=${nonTargetChanges}`);
check('9. Unexpected mutations = 0', scopeViolations === 0 && nonTargetChanges === 0, '');

// ---- 10. Identity stability ----
let idDiff = 0, slugDiff = 0, titleDiff = 0, bodyDiff = 0, imageDiff = 0, relDiff = 0;
const postIds = Object.keys(postAll);
for (const id of postIds) {
  if (!preAll[id]) { idDiff++; continue; }
  const a = preAll[id], b = postAll[id];
  const sA = slugValue(a.slug), sB = slugValue(b.slug);
  if (sA !== sB) slugDiff++;
  if ((a.title ?? a.name) !== (b.title ?? b.name)) titleDiff++;
  if (JSON.stringify(a.body ?? null) !== JSON.stringify(b.body ?? null)) bodyDiff++;
  if (JSON.stringify(a.image ?? null) !== JSON.stringify(b.image ?? null)) imageDiff++;
  for (const k of ['compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedProblems', 'relatedPosts', 'parentSpecies', 'relatedTools'])
    if (JSON.stringify(a[k] ?? null) !== JSON.stringify(b[k] ?? null)) relDiff++;
}
for (const id of Object.keys(preAll)) if (!postAll[id]) idDiff++;
check('10. ID set unchanged (pre→post, 473)', idDiff === 0, `diff=${idDiff}`);
check('11. Slug diff = 0', slugDiff === 0, `slugDiff=${slugDiff}`);
check('12. Title diff = 0', titleDiff === 0, `titleDiff=${titleDiff}`);
check('13. Body diff = 0', bodyDiff === 0, `bodyDiff=${bodyDiff}`);
check('14. Image diff = 0', imageDiff === 0, `imageDiff=${imageDiff}`);
check('15. Relationship diff = 0', relDiff === 0, `relDiff=${relDiff}`);

// ---- 16. Canonical identity hash unchanged ----
const canonical = {};
for (const t of WIKI_TYPES) for (const r of post.records[t]) {
  if (r._id.startsWith('drafts.')) continue;
  canonical[r._id] = sha256(JSON.stringify({ id: r._id, title: titleOf(t, r), slug: slugValue(r.slug) }));
}
const recomputedHash = sha256(Object.keys(canonical).sort().map((id) => canonical[id]).join('\n'));
check('16. Canonical identity hash unchanged pre→post', recomputedHash === pre.manifest.canonicalHash && recomputedHash === post.manifest.canonicalHash,
  `pre=${pre.manifest.canonicalHash} post=${post.manifest.canonicalHash} recomputed=${recomputedHash}`);

// ---- 17. SPEC 00.1 regression ----
const s001 = JSON.parse(fs.readFileSync(path.join(SPEC001, 'SPEC_00_1_VALIDATION.json'), 'utf8'));
check('17. SPEC 00.1 regression PASS', s001.verdict === 'PASS' || String(s001.verdict).toUpperCase() === 'PASS', undefined);

// ---- 18. SPEC 01 regression ----
const s01 = JSON.parse(fs.readFileSync(path.join(SPEC01, 'SPEC_01_VALIDATION.json'), 'utf8'));
const audit = JSON.parse(fs.readFileSync(path.join(SPEC01, 'SPEC_01_AUDIT_OUTPUT.json'), 'utf8'));
const criticalAfter = audit.severityCounts.CRITICAL || 0;
check('18. SPEC 01 regression PASS', s01.verdict === 'PASS', `verdict=${s01.verdict} checks=${s01.checks?.length}`);
check('19. SPEC 01 Critical structural category findings: AFTER = 0 (BEFORE = 21)', criticalAfter === 0, `critical=${criticalAfter}`);

const failed = checks.filter((c) => !c.ok);
const result = {
  spec: 'SPEC 02', phase: 'VALIDATION', generatedAt: new Date().toISOString(),
  checks,
  checksPassed: checks.length - failed.length,
  checksTotal: checks.length,
  BEFORE: { criticalCategoryFindings: 21, evidence: ['report/SPEC_02/SPEC_02_RAW_SOURCE_MANIFEST.json', 'report/SPEC_02/SPEC_02_REPAIR_PLAN.json'] },
  AFTER: { criticalCategoryFindings: criticalAfter, totalIssues: audit.issueCount, severities: audit.severityCounts },
  verdict: failed.length ? 'FAIL' : 'PASS',
  blockers: failed.map((f) => f.name),
};
fs.writeFileSync(path.join(OUT, 'SPEC_02_VALIDATION.json'), JSON.stringify(result, null, 2));
console.log(`\nSPEC_02_validate: ${checks.length - failed.length}/${checks.length} checks passed. Verdict: ${result.verdict}`);
if (failed.length) process.exit(3);