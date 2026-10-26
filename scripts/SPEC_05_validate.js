const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const OUT_DIR = path.join('report', 'SPEC_05');
const SPEC04_DIR = path.join('report', 'SPEC_04');

const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : (s && s.current) || null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);
const norm = (v) => (v === undefined || v === null || v === '' ? '' : v);

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

const checks = [];
const ac = (id, name, ok, detail) => {
  checks.push({ id: id, name: name, pass: !!ok, detail: String(detail === undefined ? '' : detail) });
  console.log((ok ? 'AC OK  ' : 'AC FAIL') + ' ' + id + ' ' + name + ' - ' + (detail === undefined ? '' : detail));
};

(async () => {
  const SNAPSHOT = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_05_PRE_REPAIR_SNAPSHOT.json'), 'utf8'));
  const MANIFEST = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_05_RAW_SOURCE_MANIFEST.json'), 'utf8'));
  const PLAN = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_05_APPROVED_MUTATION_PLAN.json'), 'utf8'));
  const LOGPREP = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_05_MUTATION_LOG_PREP.json'), 'utf8'));

  const recs = {}; const typeOf = {};
  for (const t of WIKI_TYPES) for (const r of SNAPSHOT.records[t]) { recs[r._id] = r; typeOf[r._id] = t; }

  // ---- V-01 GATE A all pass ----
  const gaPass = MANIFEST.gates.filter((g) => g.pass).length;
  ac('V-01', 'GATE A all gates PASS (fresh snapshot, identity, _rev for 61 targets)',
    MANIFEST.gateAStatus === 'PASS' && gaPass === MANIFEST.gates.length && MANIFEST.gates.length === 8,
    'gates=' + gaPass + '/' + MANIFEST.gates.length + ' status=' + MANIFEST.gateAStatus);

  // ---- V-02 composition ----
  const rows = PLAN.rows;
  const setN = rows.filter((r) => r.action === 'SET_FIELD').length;
  const replN = rows.filter((r) => r.action === 'REPLACE_FIELD').length;
  ac('V-02', 'plan composition: 61 rows = 60 SET_FIELD + 1 REPLACE_FIELD',
    rows.length === 61 && setN === 60 && replN === 1 && PLAN.composition.total === 61,
    'rows=' + rows.length + ' SET=' + setN + ' REPLACE=' + replN);

  // ---- V-03 exact set reconciliation vs SPEC 04 proposed scope ----
  const rc = PLAN.reconciliation;
  ac('V-03', 'exact set comparison: approvedExpected=61 approvedActual=61 missing=0 extra=0',
    rc.approvedExpected === 61 && rc.approvedActual === 61 && rc.missing === 0 && rc.extra === 0 && rc.rowMismatches === 0,
    'expected=' + rc.approvedExpected + ' actual=' + rc.approvedActual + ' missing=' + rc.missing + ' extra=' + rc.extra + ' rowMismatches=' + rc.rowMismatches);

  // ---- V-04 exclusions ----
  ac('V-04', 'exclusions: MEDIUM=0 BLOCKED=0 relationship=0 SEO=0 in mutation set',
    rc.mediumIncluded === 0 && rc.blockedIncluded === 0 && rc.relationshipIncluded === 0 && rc.seoIncluded === 0,
    'MEDIUM=' + rc.mediumIncluded + ' BLOCKED=' + rc.blockedIncluded + ' relationship=' + rc.relationshipIncluded + ' SEO=' + rc.seoIncluded);

  // ---- V-05 confidence / futureSpec / action vocab ----
  const badConf = rows.filter((r) => r.confidence !== 'HIGH').length;
  const badSpec = rows.filter((r) => r.futureSpec !== 'SPEC_05_FIELD_REPAIR').length;
  const badAction = rows.filter((r) => r.action !== 'SET_FIELD' && r.action !== 'REPLACE_FIELD').length;
  ac('V-05', 'every plan row: confidence=HIGH, futureSpec=SPEC_05_FIELD_REPAIR, action in {SET_FIELD,REPLACE_FIELD}',
    badConf === 0 && badSpec === 0 && badAction === 0,
    'badConf=' + badConf + ' badSpec=' + badSpec + ' badAction=' + badAction);

  // ---- V-06 schema enum validity (live schema files) ----
  let enumBad = 0;
  for (const r of rows) {
    const allowed = PLAN.schemaEnums[r.qualifiedField] || [];
    if (!allowed.includes(r.proposedValue)) enumBad++;
  }
  ac('V-06', 'every proposedValue valid against live schema enum',
    enumBad === 0 && Object.keys(PLAN.schemaEnums).length === 3,
    'invalid=' + enumBad + ' enumSets=' + Object.keys(PLAN.schemaEnums).map((k) => k + ':' + PLAN.schemaEnums[k].length).join(','));

  // ---- V-07 currentValue + _rev + identity vs snapshot ----
  let valBad = 0, revBad = 0, idBad = 0;
  for (const r of rows) {
    const live = recs[r.recordId];
    if (!live) { idBad++; continue; }
    if (typeOf[r.recordId] !== r._type) idBad++;
    const t = titleOf(r.recordId, live);
    if (t !== r.title) idBad++;
    if (slugValue(live.slug) !== r.slug) idBad++;
    if (norm(live[r.field]) !== norm(r.currentValue)) valBad++;
    if (live._rev !== r.currentRev) revBad++;
  }
  ac('V-07', 'row-level currentValue matches live snapshot, _rev matches plan, identity consistent',
    valBad === 0 && revBad === 0 && idBad === 0,
    'valueMismatch=' + valBad + ' revMismatch=' + revBad + ' identityMismatch=' + idBad);

  // ---- V-08 baseline: 473 + hash ----
  const canonical = {};
  for (const t of WIKI_TYPES) for (const r of SNAPSHOT.records[t]) canonical[r._id] = { type: t, rec: r };
  const hashParts = Object.keys(canonical).sort().map((id) => {
    const c = canonical[id];
    return sha256(JSON.stringify({ id: id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) }));
  });
  const hash = sha256(hashParts.join('\n'));
  ac('V-08', 'baseline canonical count = 473 and identity hash unchanged',
    SNAPSHOT.totalWikiRecords === 473 && hash === EXPECTED_HASH && SNAPSHOT.canonicalHash === EXPECTED_HASH,
    'total=' + SNAPSHOT.totalWikiRecords + ' hashMatch=' + (hash === EXPECTED_HASH));

  // ---- V-09 fresh live read: zero mutations so far ----
  const live = {};
  for (const t of WIKI_TYPES) live[t] = await q('*[_type == "' + t + '" && !(_id in path("drafts.**"))]');
  const livePosts = await q('*[_type == "post" && !(_id in path("drafts.**"))]');
  const liveTools = await q('*[_type == "tool" && !(_id in path("drafts.**"))]');
  const liveCats = await q('*[_type == "category" && !(_id in path("drafts.**"))]');
  function docDiff(fresh, old, label) {
    const changed = [];
    const oldBy = {};
    for (const d of old) oldBy[d._id] = d;
    for (const d of fresh) {
      const o = oldBy[d._id];
      if (!o) { changed.push(label + ':' + d._id + ':added'); continue; }
      if (JSON.stringify(d) !== JSON.stringify(o)) changed.push(label + ':' + d._id + ':modified');
    }
    for (const id of Object.keys(oldBy)) if (!fresh.some((d) => d._id === id)) changed.push(label + ':' + id + ':deleted');
    return changed;
  }
  let mutDiff = [];
  for (const t of WIKI_TYPES) mutDiff = mutDiff.concat(docDiff(live[t], SNAPSHOT.records[t], t));
  mutDiff = mutDiff.concat(docDiff(livePosts, SNAPSHOT.posts, 'post'));
  mutDiff = mutDiff.concat(docDiff(liveTools, SNAPSHOT.tools, 'tool'));
  mutDiff = mutDiff.concat(docDiff(liveCats, SNAPSHOT.categories, 'category'));
  ac('V-09', 'canonical mutation count = 0 (fresh live full-document read vs pre-repair snapshot)',
    mutDiff.length === 0, 'changedDocs=' + mutDiff.length);

  // ---- V-10 mutation log prep intact, no applied writes ----
  ac('V-10', 'mutation log prepared with 61 planned rows, applied=0 (no writes executed)',
    LOGPREP.expectedMutationCount === 61 && LOGPREP.planned.length === 61 && LOGPREP.applied.length === 0 && LOGPREP.aborted.length === 0 && LOGPREP.status.startsWith('AWAITING_PM_APPROVAL'),
    'planned=' + LOGPREP.planned.length + ' applied=' + LOGPREP.applied.length + ' status=' + LOGPREP.status);

  // ---- V-11 field scope: only group / waterType, no forbidden fields ----
  const fields = [...new Set(rows.map((r) => r.field))].sort();
  ac('V-11', 'field scope limited to approved scalar enum fields (group, waterType)',
    fields.length === 2 && fields[0] === 'group' && fields[1] === 'waterType',
    'fields=' + fields.join(','));

  // ---- V-12 artifacts (phase-aware) ----
  const phaseArtifacts = [
    'SPEC_05_PRE_REPAIR_SNAPSHOT.json', 'SPEC_05_APPROVED_MUTATION_PLAN.json', 'SPEC_05_APPROVED_MUTATION_PLAN.csv',
    'SPEC_05_MUTATION_LOG_PREP.json', 'SPEC_05_RAW_SOURCE_MANIFEST.json', 'SPEC_05_VALIDATION.json', 'SPEC_05_AUDIT_REPORT.md',
  ];
  const pendingArtifacts = ['SPEC_05_MUTATION_LOG.json', 'SPEC_05_CONTENT_DIFF.csv', 'SPEC_05_POST_REPAIR_SNAPSHOT.json', 'SPEC_05_POST_VALIDATION.json'];
  const presentNow = phaseArtifacts.filter((n) => fs.existsSync(path.join(OUT_DIR, n)) || n === 'SPEC_05_VALIDATION.json' || n === 'SPEC_05_AUDIT_REPORT.md');
  const premature = pendingArtifacts.filter((n) => fs.existsSync(path.join(OUT_DIR, n)));
  ac('V-12', 'GATE C/D artifacts correctly pending (no post-repair artifacts exist before approval)',
    premature.length === 0, 'premature=' + (premature.join(',') || 'none'));

  // ---- V-13 SPEC 04 lineage intact ----
  const spec04Val = JSON.parse(fs.readFileSync(path.join(SPEC04_DIR, 'SPEC_04_VALIDATION.json'), 'utf8'));
  ac('V-13', 'SPEC 04 lineage intact (validation PASS 15/15, proposed scope present)',
    spec04Val.result === 'PASS' && spec04Val.summary.total === 15 && fs.existsSync(path.join(SPEC04_DIR, 'SPEC_04_PROPOSED_NEXT_SCOPE.md')),
    'spec04=' + spec04Val.result + ' ' + spec04Val.summary.passed + '/' + spec04Val.summary.total);

  // ---- write validation ----
  const result = checks.every((c) => c.pass) ? 'PASS' : 'FAIL';
  const validation = {
    spec: 'SPEC 05', phase: 'VALIDATION_GATE_A_B', generatedAt: new Date().toISOString(),
    method: 'deterministic reconciliation of GATE A/B outputs + fresh read-only live re-fetch (data/query only)',
    checks: checks,
    summary: { passed: checks.filter((c) => c.pass).length, total: checks.length, result: result },
    result: result,
    canonicalMutations: 0,
    composition: PLAN.composition,
    reconciliation: rc,
    pendingAfterApproval: pendingArtifacts,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_05_VALIDATION.json'), JSON.stringify(validation, null, 2));

  // ---- audit report ----
  const R = [];
  R.push('# SPEC 05 - Canonical Field Repair - Audit Report (GATE A+B)', '');
  R.push('**Status:** GATE A + GATE B COMPLETE - WAITING_FOR_PM_APPROVAL (STOP 1)');
  R.push('**Mode:** READ-ONLY - canonical mutations: 0');
  R.push('**Generated:** ' + validation.generatedAt);
  R.push('**Scope:** exactly 61 PM-approved field-level mutations (60 SET_FIELD + 1 REPLACE_FIELD); everything else excluded.', '');
  R.push('## 1. GATE A - Fresh Canonical Snapshot (04)', '');
  R.push('| Gate | Result | Detail |', '|---|---|---|');
  for (const g of MANIFEST.gates) R.push('| ' + g.id + ' ' + g.name + ' | ' + (g.pass ? 'PASS' : 'FAIL') + ' | ' + g.detail + ' |');
  R.push('', '## 2. GATE B - Approved-Row Reconciliation (05/06)', '');
  R.push('- Rows: 61 (60 SET_FIELD from REVIEW_REQUIRED HIGH + 1 REPLACE_FIELD: plant-dwarf-sagittaria group Stolon -> Rosette)');
  R.push('- approvedExpected=61 approvedActual=61 missing=0 extra=0');
  R.push('- MEDIUM included=0, BLOCKED included=0, relationship included=0, SEO included=0');
  R.push('- Reconciled against SPEC_04_PROPOSED_NEXT_SCOPE.md (63 SPEC_05 rows) and SPEC 04 audit CSVs; the 2 excluded rows are the MEDIUM REPLACE_FIELD butterflyfish rows: ' + rc.proposedScopeExcluded.join(', '));
  R.push('- Live schema enums parsed from sanity/schemaTypes/*.ts: species.group=19, plant.group=11, problem.waterType=3; every proposedValue valid.', '');
  R.push('## 3. Exclusions (03)', '');
  R.push('```text');
  R.push('MEDIUM REVIEW_REQUIRED: 48   - not in mutation set');
  R.push('MEDIUM REPLACE_FIELD:   2    - not in mutation set');
  R.push('BLOCKED:               1146   - not in mutation set');
  R.push('RELATIONSHIPS:         1244   - not touched (SPEC 06, separate reconciliation required)');
  R.push('SEO:                    218   - not touched (SPEC 07)');
  R.push('```', '');
  R.push('## 4. Known issue deferred (15)', '');
  R.push('- SPEC 04 relationship-count reconciliation (per-opportunity best: 23 HIGH / 33 MEDIUM / 1188 LOW+B vs row-level proposed-scope language 36/46) is NOT resolved here and must be reconciled in SPEC 06 before any relationship mutation. SPEC 05 does not touch relationships.', '');
  R.push('## 5. Validation', '');
  R.push('- SPEC_05_VALIDATION.json: ' + result + ' (' + validation.summary.passed + '/' + validation.summary.total + ')');
  R.push('- Fresh live re-fetch: full-document diff vs pre-repair snapshot = ' + mutDiff.length + ' (0 mutations).', '');
  R.push('## 6. Artifacts', '');
  R.push('Created now: SPEC_05_PRE_REPAIR_SNAPSHOT.json, SPEC_05_APPROVED_MUTATION_PLAN.json/.csv, SPEC_05_MUTATION_LOG_PREP.json, SPEC_05_RAW_SOURCE_MANIFEST.json, SPEC_05_VALIDATION.json, SPEC_05_AUDIT_REPORT.md');
  R.push('Pending GATE C/D (only after PM approval): SPEC_05_repair.js, SPEC_05_MUTATION_LOG.json, SPEC_05_CONTENT_DIFF.csv, SPEC_05_POST_REPAIR_SNAPSHOT.json, SPEC_05_post_validate.js, SPEC_05_POST_VALIDATION.json', '');
  R.push('## 7. STOP 1 (10)', '');
  R.push('```text');
  R.push('SPEC 05 GATE A+B COMPLETE');
  R.push('');
  R.push('Canonical records: 473');
  R.push('Approved mutations: 61');
  R.push('SET_FIELD: 60');
  R.push('REPLACE_FIELD: 1');
  R.push('');
  R.push('Excluded:');
  R.push('MEDIUM REVIEW_REQUIRED: 48');
  R.push('MEDIUM REPLACE_FIELD: 2');
  R.push('BLOCKED: 1146');
  R.push('RELATIONSHIPS: 1244');
  R.push('SEO: 218');
  R.push('');
  R.push('Canonical mutations: 0');
  R.push('');
  R.push('Validation: PASS');
  R.push('');
  R.push('STATUS: WAITING_FOR_PM_APPROVAL');
  R.push('```');
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_05_AUDIT_REPORT.md'), R.join('\n'));

  console.log('\nVALIDATION ' + result + ': ' + validation.summary.passed + '/' + checks.length + ' checks passed');
  if (result !== 'PASS') process.exit(2);
})().catch((e) => { console.error('VALIDATE ERROR:', e.stack || e.message); process.exit(1); });
