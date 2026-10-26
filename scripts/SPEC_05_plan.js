const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join('report', 'SPEC_05');
const SPEC04_DIR = path.join('report', 'SPEC_04');

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').replace(/^\?/, '').split(/\r?\n/).filter((l) => l.length);
  const parseLine = (l) => {
    const o = []; let cur = ''; let inQ = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (inQ) {
        if (ch === String.fromCharCode(34) && l[i + 1] === String.fromCharCode(34)) { cur += String.fromCharCode(34); i++; }
        else if (ch === String.fromCharCode(34)) inQ = false;
        else cur += ch;
      } else if (ch === String.fromCharCode(34)) inQ = true;
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
    hdr.forEach((h, i) => { row[h] = vals[i] !== undefined ? vals[i] : ''; });
    return row;
  });
}

function csvEsc(v) {
  const s = v === undefined || v === null ? '' : String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n') ? String.fromCharCode(34) + s.replace(/"/g, String.fromCharCode(34) + String.fromCharCode(34)) + String.fromCharCode(34) : s;
}
function writeCsv(name, header, rows) {
  const lines = [header.map(csvEsc).join(',')];
  for (const r of rows) lines.push(header.map((h) => csvEsc(r[h])).join(','));
  fs.writeFileSync(path.join(OUT_DIR, name), String.fromCharCode(0xFEFF) + lines.join('\r\n') + '\r\n');
}

function extractEnum(schemaFile, fieldName) {
  const src = fs.readFileSync(schemaFile, 'utf8');
  const idx = src.indexOf("name: '" + fieldName + "'");
  if (idx < 0) throw new Error('field ' + fieldName + ' not found in ' + schemaFile);
  const rest = src.slice(idx);
  const listIdx = rest.indexOf('list:');
  if (listIdx < 0) throw new Error('no enum list for ' + fieldName + ' in ' + schemaFile);
  const end = rest.indexOf(']', listIdx);
  const block = rest.slice(listIdx, end);
  return (block.match(/'([^']*)'/g) || []).map((s) => s.slice(1, -1));
}

const ENUMS = {
  'species.group': extractEnum(path.join('sanity', 'schemaTypes', 'species.ts'), 'group'),
  'plant.group': extractEnum(path.join('sanity', 'schemaTypes', 'plant.ts'), 'group'),
  'problem.waterType': extractEnum(path.join('sanity', 'schemaTypes', 'problem.ts'), 'waterType'),
};
console.log('schema enums loaded: ' + Object.entries(ENUMS).map(([k, v]) => k + '=' + v.length).join(', '));

const FORBIDDEN_FIELDS = new Set(['title', 'slug', 'body', 'mainImage', 'seo', 'references', 'notes', 'description', 'parentSpecies', 'relatedPosts', 'relatedTools', 'compatibleSpecies', 'compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'aliases', 'localNames']);
const REL_FIELDS = new Set(['parentSpecies', 'relatedPosts', 'relatedTools', 'compatibleSpecies', 'compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment']);

const problems = [];
const fail = (msg) => { problems.push(msg); console.log('GATE B FAIL: ' + msg); };

(async () => {
  // ---- inputs ----
  const SNAPSHOT = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_05_PRE_REPAIR_SNAPSHOT.json'), 'utf8'));
  const MANIFEST = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_05_RAW_SOURCE_MANIFEST.json'), 'utf8'));
  const csvA = parseCsv(fs.readFileSync(path.join(SPEC04_DIR, 'SPEC_04_REVIEW_REQUIRED_AUDIT.csv'), 'utf8'));
  const csvB = parseCsv(fs.readFileSync(path.join(SPEC04_DIR, 'SPEC_04_REPLACE_FIELD_AUDIT.csv'), 'utf8'));
  const csvC = parseCsv(fs.readFileSync(path.join(SPEC04_DIR, 'SPEC_04_BLOCKED_CLASSIFICATION.csv'), 'utf8'));
  const md = fs.readFileSync(path.join(SPEC04_DIR, 'SPEC_04_PROPOSED_NEXT_SCOPE.md'), 'utf8');

  const recs = {}; const typeOf = {};
  for (const t of ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem']) {
    for (const r of SNAPSHOT.records[t]) { recs[r._id] = r; typeOf[r._id] = t; }
  }
  const titleOf = (id) => (typeOf[id] === 'problem' ? recs[id].title : recs[id].name);
  const norm = (v) => (v === undefined || v === null || v === '' ? '' : v);

  // ---- proposed-scope (SPEC 04 17) table rows with futureSpec = SPEC_05_FIELD_REPAIR ----
  const mdRows = [];
  for (const line of md.split(/\r?\n/)) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length !== 8) continue;
    if (cells[7] !== 'SPEC_05_FIELD_REPAIR') continue;
    mdRows.push({ recordId: cells[0], field: cells[1], currentValue: cells[2], proposedValue: cells[3], evidence: cells[4], confidence: cells[5], risk: cells[6], futureSpec: cells[7] });
  }
  const mdKey = (r) => r.recordId + '|' + r.field;
  const mdByKey = {};
  for (const r of mdRows) mdByKey[mdKey(r)] = r;

  // ---- build the 61 approved rows (SPEC 05 02) ----
  const planRows = [];
  const aHigh = csvA.filter((r) => r.confidence === 'HIGH' && r.futureSpec === 'SPEC_05_FIELD_REPAIR' && r.action === 'REVIEW_REQUIRED');
  for (const r of aHigh) {
    const dot = r.field.indexOf('.');
    planRows.push({
      recordId: r.recordId, _type: r.field.slice(0, dot), field: r.field.slice(dot + 1), qualifiedField: r.field,
      title: r.title, currentValue: r.currentValue, proposedValue: r.proposedValue, action: 'SET_FIELD',
      confidence: r.confidence, evidence: r.evidenceSummary, evidenceTier: r.evidenceTier,
      sourceReferences: r.externalSources, risk: 'Scalar enum fill; reversible by restoring recorded currentValue; field-level patch only, unrelated fields untouched.',
      futureSpec: 'SPEC_05_FIELD_REPAIR', sourceCsv: 'SPEC_04_REVIEW_REQUIRED_AUDIT.csv',
    });
  }
  const bHigh = csvB.filter((r) => r.confidence === 'HIGH');
  for (const r of bHigh) {
    const dot = r.field.indexOf('.');
    planRows.push({
      recordId: r.recordId, _type: r.field.slice(0, dot), field: r.field.slice(dot + 1), qualifiedField: r.field,
      title: r.title, currentValue: r.beforeValue, proposedValue: r.proposedValue, action: 'REPLACE_FIELD',
      confidence: r.confidence, evidence: r.evidence, evidenceTier: 'E1/E2/E5',
      sourceReferences: r.externalSources, risk: r.risk,
      futureSpec: 'SPEC_05_FIELD_REPAIR', sourceCsv: 'SPEC_04_REPLACE_FIELD_AUDIT.csv',
    });
  }

  // ---- GATE B checks ----
  if (aHigh.length !== 60) fail('A HIGH rows = ' + aHigh.length + ' (expected 60)');
  if (bHigh.length !== 1) fail('B HIGH rows = ' + bHigh.length + ' (expected 1)');
  const setCount = planRows.filter((r) => r.action === 'SET_FIELD').length;
  const replaceCount = planRows.filter((r) => r.action === 'REPLACE_FIELD').length;
  if (planRows.length !== 61) fail('plan rows = ' + planRows.length + ' (expected 61)');
  if (setCount !== 60) fail('SET_FIELD = ' + setCount + ' (expected 60)');
  if (replaceCount !== 1) fail('REPLACE_FIELD = ' + replaceCount + ' (expected 1)');

  const planKey = (r) => r.recordId + '|' + r.qualifiedField;
  const planKeys = new Set(planRows.map(planKey));

  // exact set comparison vs proposed scope (SPEC 05 06)
  const missing = [...planKeys].filter((k) => !mdByKey[k]);
  const mdExtra = Object.keys(mdByKey).filter((k) => !planKeys.has(k));
  const bMedium = csvB.filter((r) => r.confidence === 'MEDIUM');
  const bMediumKeys = bMedium.map((r) => r.recordId + '|' + r.field);
  const extraUnexpected = mdExtra.filter((k) => !bMediumKeys.includes(k));
  if (missing.length) fail('missing from proposed scope: ' + missing.join(','));
  if (mdExtra.length !== 2) fail('proposed-scope extras = ' + mdExtra.length + ' (expected 2 MEDIUM REPLACE excluded): ' + mdExtra.join(','));
  if (extraUnexpected.length) fail('unexpected extras vs proposed scope: ' + extraUnexpected.join(','));
  if (mdRows.length !== 63) fail('proposed-scope SPEC_05 rows = ' + mdRows.length + ' (expected 63 = 60 A + 3 B)');

  // per-row reconciliation vs SPEC 04 CSV artifacts
  let rowMismatches = 0;
  for (const r of planRows) {
    const mdR = mdByKey[planKey(r)];
    if (!mdR) continue;
    if (mdR.proposedValue !== r.proposedValue || mdR.confidence !== r.confidence) {
      rowMismatches++;
      fail('row mismatch vs proposed scope: ' + planKey(r) + ' md=' + mdR.proposedValue + '/' + mdR.confidence + ' plan=' + r.proposedValue + '/' + r.confidence);
    }
    if (norm(mdR.currentValue) !== norm(r.currentValue)) {
      rowMismatches++;
      fail('currentValue mismatch vs proposed scope: ' + planKey(r));
    }
  }

  // exclusions (SPEC 05 06)
  const mediumIncluded = planRows.filter((r) => r.confidence !== 'HIGH').length;
  const blockedKeys = new Set(csvC.map((r) => r.recordId + '|' + r.field));
  const blockedIncluded = planRows.filter((r) => blockedKeys.has(planKey(r))).length;
  const relationshipIncluded = planRows.filter((r) => REL_FIELDS.has(r.field) || r.action !== 'SET_FIELD' && r.action !== 'REPLACE_FIELD').length;
  const seoIncluded = planRows.filter((r) => r.field === 'seo' || r.field.startsWith('seo.')).length;
  if (mediumIncluded) fail('MEDIUM included = ' + mediumIncluded);
  if (blockedIncluded) fail('BLOCKED included = ' + blockedIncluded);
  if (relationshipIncluded) fail('relationship included = ' + relationshipIncluded);
  if (seoIncluded) fail('SEO included = ' + seoIncluded);

  // identity, live values, enums, forbidden fields (SPEC 05 07/08)
  let identityProblems = 0, valueProblems = 0, enumProblems = 0, forbiddenProblems = 0;
  for (const r of planRows) {
    const live = recs[r.recordId];
    if (!live) { identityProblems++; fail('record missing in snapshot: ' + r.recordId); continue; }
    if (typeOf[r.recordId] !== r._type) { identityProblems++; fail('_type mismatch: ' + r.recordId); }
    const slug = typeof live.slug === 'string' ? live.slug : (live.slug && live.slug.current) || '';
    if (!slug) { identityProblems++; fail('missing slug: ' + r.recordId); }
    if (titleOf(r.recordId) !== r.title) { identityProblems++; fail('title mismatch: ' + r.recordId + ' snapshot=' + titleOf(r.recordId) + ' plan=' + r.title); }
    if (norm(live[r.field]) !== norm(r.currentValue)) { valueProblems++; fail('currentValue does not match live value: ' + r.recordId + '.' + r.field + ' live=' + JSON.stringify(live[r.field]) + ' plan=' + JSON.stringify(r.currentValue)); }
    const allowed = ENUMS[r.qualifiedField];
    if (!allowed) { enumProblems++; fail('no schema enum for ' + r.qualifiedField); }
    else if (!allowed.includes(r.proposedValue)) { enumProblems++; fail('proposedValue not in live schema enum: ' + r.recordId + '.' + r.field + ' -> ' + r.proposedValue); }
    if (r.proposedValue === r.currentValue) { valueProblems++; fail('proposedValue equals currentValue: ' + r.recordId); }
    if (FORBIDDEN_FIELDS.has(r.field)) { forbiddenProblems++; fail('forbidden field in plan: ' + r.recordId + '.' + r.field); }
    r.currentRev = live._rev;
    r.slug = slug;
  }

  if (problems.length) {
    console.log('\nABORT GATE B - ' + problems.length + ' problem(s). No plan written.');
    process.exit(2);
  }

  // ---- write approved mutation plan ----
  const generatedAt = new Date().toISOString();
  const reconciliation = {
    approvedExpected: 61, approvedActual: planRows.length,
    missing: missing.length, extra: 0,
    mediumIncluded: mediumIncluded, blockedIncluded: blockedIncluded,
    relationshipIncluded: relationshipIncluded, seoIncluded: seoIncluded,
    proposedScopeRows: mdRows.length, proposedScopeExcluded: mdExtra,
    rowMismatches: rowMismatches,
    source: ['SPEC_04_PROPOSED_NEXT_SCOPE.md (futureSpec=SPEC_05_FIELD_REPAIR)', 'SPEC_04_REVIEW_REQUIRED_AUDIT.csv (HIGH)', 'SPEC_04_REPLACE_FIELD_AUDIT.csv (HIGH)'],
  };
  const planJson = {
    spec: 'SPEC 05', phase: 'APPROVED_MUTATION_PLAN', generatedAt: generatedAt,
    status: 'AWAITING_PM_APPROVAL (GATE C STOP 1 - no writes performed)',
    composition: { total: planRows.length, SET_FIELD: setCount, REPLACE_FIELD: replaceCount },
    excluded: { mediumReviewRequired: 48, mediumReplaceField: 2, blocked: 1146, relationships: 1244, seo: 218 },
    reconciliation: reconciliation,
    fieldScope: { allowed: [...new Set(planRows.map((r) => r.field))].sort(), forbidden: [...FORBIDDEN_FIELDS].sort() },
    schemaEnums: ENUMS,
    baseline: { canonicalHash: SNAPSHOT.canonicalHash, totalWikiRecords: SNAPSHOT.totalWikiRecords, expectedRevVerified: MANIFEST.gates.find((g) => g.id === 'GA-07').pass },
    rows: planRows,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_05_APPROVED_MUTATION_PLAN.json'), JSON.stringify(planJson, null, 2));
  writeCsv('SPEC_05_APPROVED_MUTATION_PLAN.csv',
    ['recordId', '_type', 'title', 'slug', 'field', 'currentValue', 'proposedValue', 'action', 'confidence', 'evidence', 'evidenceTier', 'sourceReferences', 'currentRev', 'futureSpec', 'risk'],
    planRows);

  // ---- mutation log prep (SPEC 05 09) ----
  const logPrep = {
    spec: 'SPEC 05', phase: 'MUTATION_LOG_PREP', generatedAt: generatedAt,
    status: 'AWAITING_PM_APPROVAL - prepared before any write',
    expectedMutationCount: 61,
    composition: { SET_FIELD: setCount, REPLACE_FIELD: replaceCount },
    safety: 'field-level patch only; per record verify _rev + currentValue + identity; abort record on mismatch; no force write; no whole-document replacement',
    planned: planRows.map((r) => ({ recordId: r.recordId, _type: r._type, title: r.title, field: r.field, action: r.action, expectedRev: r.currentRev, expectedCurrentValue: r.currentValue, proposedValue: r.proposedValue, evidence: r.evidence.slice(0, 500) })),
    applied: [],
    aborted: [],
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_05_MUTATION_LOG_PREP.json'), JSON.stringify(logPrep, null, 2));

  console.log('\nGATE B: PASS');
  console.log('  approvedExpected=' + reconciliation.approvedExpected + ' approvedActual=' + reconciliation.approvedActual + ' missing=' + reconciliation.missing + ' extra=' + reconciliation.extra);
  console.log('  MEDIUM=' + mediumIncluded + ' BLOCKED=' + blockedIncluded + ' relationship=' + relationshipIncluded + ' SEO=' + seoIncluded);
  console.log('  SET_FIELD=' + setCount + ' REPLACE_FIELD=' + replaceCount + ' excluded-md-rows=' + mdExtra.join(','));
  console.log('  plan + mutation-log-prep written to report/SPEC_05/');
})().catch((e) => { console.error('PLAN ERROR:', e.stack || e.message); process.exit(1); });
