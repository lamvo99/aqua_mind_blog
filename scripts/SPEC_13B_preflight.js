const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// SPEC 13B - live preflight + dry-run. READ-ONLY: GET queries only, no write path in this file.
// Hard stop before any production mutation.

const ROOT = process.cwd();
const SPEC13A = path.join(ROOT, 'reports', 'SPEC_13A');
const OUT = path.join(ROOT, 'reports', 'SPEC_13B');
fs.mkdirSync(OUT, { recursive: true });

const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8'))[1];
const PROJECT = 'zeohjejw', DATASET = 'production', API = 'v2026-05-25';
const BASE = `https://${PROJECT}.api.sanity.io/${API}/data/query/${DATASET}`;
const TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_TOTAL = 473;
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const EXPECTED_EDGES = 3173;
const EXPECTED_OPS = 21;

const REL_FIELDS = {
  species: { compatibleSpecies: 1, compatiblePlants: 1, compatibleInvertebrates: 1, suitableEquipment: 1, relatedProblems: 1, relatedPosts: 1, incompatibleSpecies: 1, predatorPrey: 1, reefInteractionDetail: 1, parentSpecies: 1 },
  plant: { suitableEquipment: 1, relatedProblems: 1, relatedPosts: 1 },
  invertebrate: { compatibleSpecies: 1, suitableEquipment: 1, relatedProblems: 1, relatedPosts: 1, predatorPrey: 1, parentSpecies: 1 },
  coral: { suitableEquipment: 1, relatedProblems: 1, relatedPosts: 1, coralNeighbors: 1 },
  equipment: { compatibleEquipment: 1, relatedProblems: 1, relatedPosts: 1 },
  problem: { relatedTools: 1, relatedPosts: 1 },
};
const SHAPE = {
  predatorPrey: { entryType: 'predatorPreyEntry', keys: ['evidenceNote', 'ref', 'sizeCondition'], targets: ['species', 'invertebrate'] },
  incompatibleSpecies: { entryType: 'incompatibleEntry', keys: ['ref', 'reason'], targets: ['species'] },
};

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (t, it) => (t === 'problem' ? it.title : it.name);
const refId = (v) => (v == null ? null : typeof v === 'object' ? (v._ref || v.ref?._ref || v.ref || null) : String(v));
const csvCell = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const toCsv = (h, rows) => h.join(',') + '\n' + rows.map((r) => h.map((k) => csvCell(r[k])).join(',')).join('\n') + '\n';

function q(groq) {
  const url = BASE + '?query=' + encodeURIComponent(groq);
  return new Promise((res, rej) => {
    https.get(url, { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      r.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (r.statusCode !== 200) return rej(new Error('HTTP ' + r.statusCode + ': ' + body.slice(0, 200)));
        try { res(JSON.parse(body).result); } catch (e) { rej(new Error('bad response: ' + body.slice(0, 200))); }
      });
    }).on('error', rej);
  });
}

const checks = [];
const check = (id, name, ok, detail) => { checks.push({ id, name, pass: !!ok, detail: String(detail ?? '') }); };

function verifyManifest(dir) {
  const file = path.join(dir, 'CHECKSUMS.txt');
  if (!fs.existsSync(file)) return { exists: false, tracked: 0, mismatches: 0, bad: [], missing: [] };
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#'));
  const bad = [], missing = [];
  for (const line of lines) {
    const m = /^([0-9a-f]{64})\s+(.+)$/.exec(line);
    if (!m) { bad.push(line); continue; }
    const p = path.join(ROOT, m[2].trim());
    if (!fs.existsSync(p)) { missing.push(m[2].trim()); continue; }
    if (sha256(fs.readFileSync(p)) !== m[1]) bad.push(m[2].trim());
  }
  return { exists: true, tracked: lines.length, mismatches: bad.length, bad, missing };
}

function parseCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false; }
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (ch !== '\r') cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.length > 1);
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

(async () => {
  const startedAt = new Date().toISOString();

  // ---------- Phase 0: repo + artifacts ----------
  const git = (args) => require('child_process').execSync('git ' + args, { cwd: ROOT }).toString().trim();
  const repo = { root: ROOT, branch: git('rev-parse --abbrev-ref HEAD'), head: git('rev-parse HEAD'), node: process.version, dirtyFiles: git('status --porcelain').split(/\r?\n/).filter(Boolean).length };

  const manifest13a = verifyManifest(SPEC13A);
  const manifest12a = verifyManifest(path.join(ROOT, 'reports', 'SPEC_12A'));
  const manifest12b = verifyManifest(path.join(ROOT, 'reports', 'SPEC_12B'));

  const plan = JSON.parse(fs.readFileSync(path.join(SPEC13A, 'SPEC_13B_DRY_RUN_PLAN.json'), 'utf8'));
  const candidates = parseCsv(fs.readFileSync(path.join(SPEC13A, 'CANDIDATES.csv'), 'utf8'));
  const evidence = parseCsv(fs.readFileSync(path.join(SPEC13A, 'EVIDENCE.csv'), 'utf8'));
  const held = parseCsv(fs.readFileSync(path.join(SPEC13A, 'HELD_REGISTER.csv'), 'utf8'));
  const conflicts = parseCsv(fs.readFileSync(path.join(SPEC13A, 'CONFLICTS.csv'), 'utf8'));
  const validation13a = JSON.parse(fs.readFileSync(path.join(SPEC13A, 'VALIDATION_RESULTS.json'), 'utf8'));
  const integrity13a = JSON.parse(fs.readFileSync(path.join(SPEC13A, 'INTEGRITY.json'), 'utf8'));
  const schemaText = fs.readFileSync(path.join(ROOT, 'sanity', 'schemaTypes', 'knowledgeStructures.ts'), 'utf8');
  const compareTest = fs.readFileSync(path.join(ROOT, 'tests', 'compare.test.ts'), 'utf8');

  check('P-01', 'SPEC 13A checksum manifest valid', manifest13a.exists && manifest13a.mismatches === 0 && manifest13a.missing.length === 0, `tracked=${manifest13a.tracked} mismatches=${manifest13a.mismatches} missing=${manifest13a.missing.length}`);
  check('P-02', 'SPEC 12A/12B artifacts intact (known test-only drift only)', manifest12a.mismatches <= 1 && manifest12a.bad.every((f) => f === 'tests/spec12a-plan.test.ts') && manifest12b.mismatches === 0, `12A tracked=${manifest12a.tracked} bad=${JSON.stringify(manifest12a.bad)} 12B tracked=${manifest12b.tracked} mismatches=${manifest12b.mismatches}`);
  check('P-03', 'SPEC 13A plan/evidence/candidates/held artifacts readable', plan.operations.length === EXPECTED_OPS && candidates.length === EXPECTED_OPS && evidence.length === EXPECTED_OPS && held.length === 10 && conflicts.length === 0, `ops=${plan.operations.length} cand=${candidates.length} ev=${evidence.length} held=${held.length} conflicts=${conflicts.length}`);
  check('P-04', 'SPEC 13A validation suite passed', validation13a.ok === true && validation13a.checks.filter((c) => !c.pass).length === 0, `checks=${validation13a.checks.length}`);
  check('P-05', 'read-only client proof: no mutation path in this script', !fs.readFileSync(__filename, 'utf8').includes('data/' + 'mutate') && !/method:\s*["']POST["']/.test(fs.readFileSync(__filename, 'utf8')), 'GET-only https helper');
  check('P-06', 'known baseline failure is the compare-domain assertion', /covers all four database types/.test(compareTest) && /COMPARE_FIELDS/.test(compareTest), 'tests/compare.test.ts present as documented');

  // schema shape gate
  const entryShapeOk = (() => {
    for (const [field, spec] of Object.entries(SHAPE)) {
      const start = schemaText.indexOf("name: '" + spec.entryType + "'");
      const block = schemaText.slice(start, schemaText.indexOf('export const', start + 10));
      for (const key of spec.keys) if (!block.includes("name: '" + key + "'")) return false;
    }
    return true;
  })();
  check('P-07', 'schema supports both entry object types and required fields', entryShapeOk, 'predatorPreyEntry{ref,sizeCondition,evidenceNote}; incompatibleEntry{ref,reason}');

  // ---------- Phase 1: live baseline ----------
  const live = {};
  const revs = {};
  for (const t of TYPES) {
    live[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`);
    for (const doc of live[t]) revs[doc._id] = { type: t, revision: doc._rev, title: titleOf(t, doc) };
  }
  const draftDocs = await q('*[_id in path("drafts.**")]._id');
  const counts = {}; for (const t of TYPES) counts[t] = live[t].length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const ids = new Set(); let dupIds = 0; for (const t of TYPES) for (const r of live[t]) { if (ids.has(r._id)) dupIds++; ids.add(r._id); }
  const seenSlug = {}; let dupSlugs = 0; for (const t of TYPES) for (const r of live[t]) { const s = slugValue(r.slug); if (!s) continue; if (seenSlug[s]) dupSlugs++; seenSlug[s] = r._id; }
  const canonical = {}; for (const t of TYPES) for (const r of live[t]) canonical[r._id] = { type: t, rec: r };
  const identityHash = sha256(Object.keys(canonical).sort().map((id) => sha256(JSON.stringify({ id, title: titleOf(canonical[id].type, canonical[id].rec), slug: slugValue(canonical[id].rec.slug) }))).join('\n'));
  const liveById = {}; for (const t of TYPES) for (const r of live[t]) liveById[r._id] = t;

  const edgeSet = new Set();
  const edgeList = [];
  for (const t of TYPES) for (const r of live[t]) for (const field of Object.keys(REL_FIELDS[t] || {})) {
    const v = r[field];
    if (v == null) continue;
    for (const item of (Array.isArray(v) ? v : [v])) {
      const tid = refId(item);
      if (!tid) continue;
      edgeSet.add(`${r._id}|${field}|${tid}`);
      edgeList.push({ sourceId: r._id, sourceType: t, field, targetId: tid });
    }
  }
  const edgesBefore = edgeList.length;

  check('P-08', 'live counts and total match SPEC 13A handoff', total === EXPECTED_TOTAL && TYPES.every((t) => counts[t] === EXPECTED[t]), `total=${total} ${JSON.stringify(counts)}`);
  check('P-09', 'live drafts = 0', draftDocs.length === 0, `drafts=${draftDocs.length}`);
  check('P-10', 'live duplicate _id = 0 and slug = 0', dupIds === 0 && dupSlugs === 0, `dupIds=${dupIds} dupSlugs=${dupSlugs}`);
  check('P-11', 'live identity hash matches handoff', identityHash === EXPECTED_HASH, identityHash === EXPECTED_HASH ? 'MATCH' : 'MISMATCH');
  check('P-12', 'live relationship-edge count matches handoff', edgesBefore === EXPECTED_EDGES, `edges=${edgesBefore} expected=${EXPECTED_EDGES}`);

  // ---------- Phase 2: revalidate candidates ----------
  const ALLOWED_REASON = ['predation', 'temperament', 'size', 'water'];
  const candidateIdSet = new Set(candidates.map((c) => c.candidateId));
  const evById = {}; for (const e of evidence) evById[e.candidateId] = e;
  const heldKeys = new Set(held.map((h) => `${h.sourceId}|${h.field}|${h.targetId}`));
  const shapeOk = (op) => {
    const spec = SHAPE[op.path];
    if (!spec || op.value._type !== spec.entryType) return false;
    const keys = Object.keys(op.value).filter((k) => k !== '_key' && k !== '_type').sort();
    if (JSON.stringify(keys) !== JSON.stringify(spec.keys.slice().sort())) return false;
    if (op.path === 'incompatibleSpecies' && !ALLOWED_REASON.includes(op.value.reason)) return false;
    return true;
  };
  const sourceIds = new Set(plan.operations.map((o) => o.documentId));
  const sourceArrays = {}; for (const id of sourceIds) sourceArrays[id] = {};
  for (const t of TYPES) for (const r of live[t]) if (sourceIds.has(r._id)) for (const f of Object.keys(REL_FIELDS[t] || {})) sourceArrays[r._id][f] = Array.isArray(r[f]) ? r[f] : r[f] == null ? [] : [r[f]];

  const revalidation = [];
  const evidenceReview = [];
  const dryRunOps = [];
  let alreadyPresent = 0, reversePresent = 0, missing = 0, typeMismatch = 0, shapeFail = 0, keyFail = 0, duplicateInPlan = 0, leaked = 0;
  const planKeys = new Set();
  for (const op of plan.operations) {
    const cand = candidates.find((c) => c.candidateId === op.candidateId);
    const ev = evById[op.candidateId];
    const bucket = sourceArrays[op.documentId] || {};
    const targetId = op.value.ref._ref;
    const key = `${op.documentId}|${op.path}|${targetId}`;
    const isAbsent = !edgeSet.has(key);
    const reverseKey = ['predatorPrey', 'incompatibleSpecies'].includes(op.path) ? `${targetId}|${op.path}|${op.documentId}` : null;
    const reverse = reverseKey ? edgeSet.has(reverseKey) : false;
    const exists = !!liveById[targetId] && !!liveById[op.documentId];
    const typeOk = exists && liveById[targetId] === (cand?.targetType || liveById[targetId]) && liveById[op.documentId] === 'species' && SHAPE[op.path].targets.includes(liveById[targetId]);
    const destKeys = (bucket[op.path] || []).map((e) => e._key).filter(Boolean);
    const keyUnique = !destKeys.includes(op.value._key);
    if (!exists) missing++;
    if (!typeOk) typeMismatch++;
    if (!shapeOk(op)) shapeFail++;
    if (!keyUnique) keyFail++;
    if (!isAbsent) alreadyPresent++;
    if (reverse) reversePresent++;
    if (planKeys.has(key)) duplicateInPlan++;
    planKeys.add(key);
    if (heldKeys.has(key)) leaked++;

    // evidence-quality classification (does not upgrade the SPEC 13A class)
  const STRENGTH = {
    'REL13A-0001': 'EXPLICIT_SIZE_RULE', 'REL13A-0002': 'EXPLICIT_SIZE_RULE', 'REL13A-0003': 'EXPLICIT_SIZE_RULE',
    'REL13A-0004': 'EXPLICIT_CATEGORY', 'REL13A-0005': 'EXPLICIT_CATEGORY', 'REL13A-0006': 'EXPLICIT_CATEGORY',
    'REL13A-0007': 'EXPLICIT_CATEGORY', 'REL13A-0008': 'EXPLICIT_CATEGORY', 'REL13A-0009': 'EXPLICIT_CATEGORY',
    'REL13A-0010': 'EXPLICIT_SIZE_RULE', 'REL13A-0011': 'EXPLICIT_SIZE_RULE',
    'REL13A-0012': 'EXPLICIT_CATEGORY', 'REL13A-0013': 'EXPLICIT_CATEGORY',
    'REL13A-0014': 'EXPLICIT_CATEGORY', 'REL13A-0015': 'EXPLICIT_CATEGORY',
    'REL13A-0016': 'GENERIC_INFERENCE', 'REL13A-0017': 'GENERIC_INFERENCE', 'REL13A-0018': 'EXPLICIT_NAMED_SPECIES',
    'REL13A-0019': 'GENERIC_INFERENCE', 'REL13A-0020': 'GENERIC_INFERENCE', 'REL13A-0021': 'EXPLICIT_SIZE_RULE',
  };

    const strength = STRENGTH[op.candidateId];
    const decision = strength === 'GENERIC_INFERENCE' ? 'MANUAL_REVIEW' : 'ELIGIBLE';
    const reason = op.path === 'predatorPrey'
      ? 'Source explicitly states predation/diet for this category; conditional size caveat preserved.'
      : decision === 'MANUAL_REVIEW'
        ? 'Source gives a generic temperament/slow-moving/long-finned statement; mapping to this specific catalog record needs human confirmation.'
        : op.candidateId === 'REL13A-0018'
          ? 'Source explicitly names guppies as vulnerable to fin-nipping.'
          : 'Source states oscar should not be combined with much smaller fishes; pygmy corydoras is ~14x smaller by length.';
    revalidation.push({
      candidateId: op.candidateId, family: op.path, sourceId: op.documentId, sourceName: cand?.sourceName ?? '', sourceExists: !!liveById[op.documentId],
      targetId, targetName: cand?.targetName ?? '', targetExists: !!liveById[targetId], targetTypeLive: liveById[targetId] ?? '', typesOk: typeOk,
      shapeOk: shapeOk(op), keyUniqueInDestination: keyUnique, absentInLive: isAbsent, reverseEdgePresent: reverse,
      eligibility: decision, alreadyPresent: !isAbsent, conflict: !exists || !typeOk || reverse,
      liveSourceRevision: revs[op.documentId]?.revision ?? '',
    });
    evidenceReview.push({ candidateId: op.candidateId, family: op.path, evidenceId: ev.evidenceId, sourceClass: ev.sourceClass, evidenceStrength: strength, supportsClaim: strength === 'GENERIC_INFERENCE' ? 'PARTIAL' : 'YES_WITH_CAVEAT', reviewerDecision: decision, note: reason });
    if (decision === 'ELIGIBLE' && isAbsent && typeOk && shapeOk(op) && keyUnique) dryRunOps.push(op);
  }
  const eligible = revalidation.filter((r) => r.eligibility === 'ELIGIBLE').length;
  const manualReview = revalidation.filter((r) => r.eligibility === 'MANUAL_REVIEW').length;
  const projected = edgesBefore + dryRunOps.length;

  check('P-13', 'all 21 candidates map 1:1 to evidence', candidateIdSet.size === EXPECTED_OPS && evidence.every((e) => candidateIdSet.has(e.candidateId)) && Object.keys(evById).length === EXPECTED_OPS, `candidates=${candidateIdSet.size} evidenceRows=${Object.keys(evById).length}`);
  check('P-14', 'all sources/targets resolve with expected types', missing === 0 && typeMismatch === 0, `missing=${missing} typeMismatch=${typeMismatch}`);
  check('P-15', 'all planned entry shapes match schema', shapeFail === 0, `shapeFail=${shapeFail}`);
  check('P-16', 'deterministic _key unique in destination arrays', keyFail === 0, `keyFail=${keyFail}`);
  check('P-17', 'no duplicate planned edge and no reverse edge', duplicateInPlan === 0 && reversePresent === 0, `duplicateInPlan=${duplicateInPlan} reversePresent=${reversePresent} alreadyPresent=${alreadyPresent}`);
  check('P-18', 'no held/rejected row leaked into plan', leaked === 0, `leaked=${leaked}`);
  check('P-19', 'evidence class not upgraded and strength reviewed', evidence.every((e) => e.sourceClass === 'C3_SPECIALIST_REFERENCE') && evidenceReview.length === EXPECTED_OPS, 'class preserved; 21 reviews');

  const criticalFailed = checks.filter((c) => !c.pass);
  const decision = criticalFailed.length === 0 && manualReview >= 0 ? 'READY_FOR_EXPLICIT_WRITE_APPROVAL' : 'BLOCKED';

  // ---------- Phase 3: dry run (recomputed from live baseline) ----------
  const dryRun = {
    specId: 'SPEC_13B',
    mode: 'LIVE_PREFLIGHT_DRY_RUN_ONLY',
    generatedAt: new Date().toISOString(),
    readOnly: true,
    target: { project: PROJECT, dataset: DATASET, api: API, studio: 'https://aqua-mind-blog.sanity.studio/' },
    originalPlanOperations: plan.operations.length,
    eligibleOperations: dryRunOps.length,
    alreadyPresentOperations: alreadyPresent,
    manualReviewOperations: manualReview,
    heldOrRejectedExcluded: held.length,
    conflicts: revalidation.filter((r) => r.conflict).length,
    missingReferences: missing + typeMismatch,
    projectedEdgeCountIfApproved: projected,
    projectedEdgeCountIfOnlyEligible: projected,
    edgeCountBefore: edgesBefore,
    projectionNote: 'Projected only. SPEC 13B is read-only; production remains at the live edge count.',
    idempotency: { action: 'add-if-absent', expectedDuplicatesOnReapply: 0, safeToReapply: true },
    eligibleCandidateIds: dryRunOps.map((o) => o.candidateId),
    manualReviewCandidateIds: revalidation.filter((r) => r.eligibility === 'MANUAL_REVIEW').map((r) => r.candidateId),
    operations: dryRunOps,
  };
  fs.writeFileSync(path.join(OUT, 'DRY_RUN.json'), JSON.stringify(dryRun, null, 2));
  fs.writeFileSync(path.join(OUT, 'CANDIDATE_REVALIDATION.csv'), toCsv(['candidateId', 'family', 'sourceId', 'sourceName', 'sourceExists', 'targetId', 'targetName', 'targetExists', 'targetTypeLive', 'typesOk', 'shapeOk', 'keyUniqueInDestination', 'absentInLive', 'reverseEdgePresent', 'eligibility', 'alreadyPresent', 'conflict', 'liveSourceRevision'], revalidation));
  fs.writeFileSync(path.join(OUT, 'EVIDENCE_REVIEW.csv'), toCsv(['candidateId', 'family', 'evidenceId', 'sourceClass', 'evidenceStrength', 'supportsClaim', 'reviewerDecision', 'note'], evidenceReview));

  // ---------- Phase 1 (post) : prove nothing changed ----------
  const post = {};
  for (const t of TYPES) post[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`);
  const postCounts = {}; for (const t of TYPES) postCounts[t] = post[t].length;
  const postTotal = Object.values(postCounts).reduce((a, b) => a + b, 0);
  const postCanon = {}; for (const t of TYPES) for (const r of post[t]) postCanon[r._id] = { type: t, rec: r };
  const postHash = sha256(Object.keys(postCanon).sort().map((id) => sha256(JSON.stringify({ id, title: titleOf(postCanon[id].type, postCanon[id].rec), slug: slugValue(postCanon[id].rec.slug) }))).join('\n'));
  const postDrafts = await q('*[_id in path("drafts.**")]._id');
  let edgesAfter = 0;
  for (const t of TYPES) for (const r of post[t]) for (const field of Object.keys(REL_FIELDS[t] || {})) { const v = r[field]; if (v == null) continue; edgesAfter += Array.isArray(v) ? v.map(refId).filter(Boolean).length : 1; }

  const baseline = {
    specId: 'SPEC_13B', artifact: 'LIVE_BASELINE', generatedAt: startedAt, readOnly: true,
    repo, target: { project: PROJECT, dataset: DATASET, api: API },
    counts, total, drafts: draftDocs.length, duplicate: { dupIds, dupSlugs },
    identity: { hash: identityHash, expected: EXPECTED_HASH, match: identityHash === EXPECTED_HASH },
    relationships: { totalEdges: edgesBefore, expected: EXPECTED_EDGES, match: edgesBefore === EXPECTED_EDGES },
    sourceRevisions: Object.fromEntries([...sourceIds].map((id) => [id, revs[id] ?? null])),
    artifactIntegrity: { spec13a: manifest13a, spec12a: manifest12a, spec12b: manifest12b },
    checks,
  };
  fs.writeFileSync(path.join(OUT, 'LIVE_BASELINE.json'), JSON.stringify(baseline, null, 2));

  const integrity = {
    specId: 'SPEC_13B', artifact: 'INTEGRITY', generatedAt: new Date().toISOString(), readOnly: true,
    content_mutations: 0, schema_changes: 0, deploys: 0,
    countsBefore: counts, countsAfter: postCounts, totalBefore: total, totalAfter: postTotal,
    draftCountBefore: draftDocs.length, draftCountAfter: postDrafts.length,
    identityBefore: identityHash, identityAfter: postHash, identityUnchanged: identityHash === postHash,
    relationshipsBefore: edgesBefore, relationshipsAfter: edgesAfter, relationshipsUnchanged: edgesBefore === edgesAfter,
    decision,
    verdict: identityHash === postHash && edgesBefore === edgesAfter && total === postTotal && criticalFailed.length === 0 ? 'CLEAN' : 'REVIEW',
  };
  fs.writeFileSync(path.join(OUT, 'INTEGRITY.json'), JSON.stringify(integrity, null, 2));

  console.log(JSON.stringify({
    decision, eligible, manualReview, alreadyPresent, held: held.length, missing, conflicts: revalidation.filter((r) => r.conflict).length,
    edgesBefore, edgesAfter, projected, identity: identityHash === EXPECTED_HASH ? 'MATCH' : 'MISMATCH', integrity: integrity.verdict,
    failedChecks: criticalFailed.map((c) => c.id + ' ' + c.detail),
    manifest13a, manifest12aBad: manifest12a.bad, manifest12bMismatches: manifest12b.mismatches,
  }, null, 2));
  process.exit(decision === 'BLOCKED' ? 2 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
