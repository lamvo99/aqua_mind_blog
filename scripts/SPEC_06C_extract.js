const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const OUT_DIR = path.join('report', 'SPEC_06C');
fs.mkdirSync(OUT_DIR, { recursive: true });
const SPEC06B_DIR = path.join('report', 'SPEC_06B');

const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';

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

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : (s && s.current) || null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);

const gates = [];
const g = (id, name, ok, detail) => {
  gates.push({ id: id, name: name, pass: !!ok, detail: String(detail === undefined ? '' : detail) });
  console.log((ok ? 'GATE OK  ' : 'GATE FAIL') + ' ' + id + ' ' + name + ' - ' + (detail === undefined ? '' : detail));
};

(async () => {
  const generatedAt = new Date().toISOString();

  const live = {};
  for (const t of WIKI_TYPES) live[t] = await q('*[_type == "' + t + '" && !(_id in path("drafts.**"))]');
  const liveDrafts = await q('count(*[_id in path("drafts.**")] )');
  const livePosts = await q('*[_type == "post" && !(_id in path("drafts.**"))]');

  const counts = {};
  for (const t of WIKI_TYPES) counts[t] = live[t].filter((r) => !String(r._id).startsWith('drafts.')).length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  g('GA-01', 'fresh canonical count = 473 with exact per-type composition',
    total === 473 && WIKI_TYPES.every((t) => counts[t] === EXPECTED[t]),
    'total=' + total + ' ' + JSON.stringify(counts));

  let wikiDrafts = 0;
  for (const t of WIKI_TYPES) wikiDrafts += live[t].filter((r) => String(r._id).startsWith('drafts.')).length;
  const draftsOk = wikiDrafts === 0 && Number(liveDrafts) === 0;
  g('GA-02', 'drafts = 0 (wiki and dataset-wide)', draftsOk,
    'wikiDrafts=' + wikiDrafts + ' datasetDrafts=' + liveDrafts);

  const slugSeen = {};
  let dupSlugs = 0, undefinedRoutes = 0;
  for (const t of WIKI_TYPES) {
    for (const r of live[t]) {
      const s = slugValue(r.slug);
      const title = titleOf(t, r);
      if (!s) { undefinedRoutes++; continue; }
      const k = t + '/' + s;
      if (slugSeen[k]) dupSlugs++;
      slugSeen[k] = true;
      if (!title) undefinedRoutes++;
    }
  }
  g('GA-03', 'duplicate slugs = 0 and undefined routes = 0',
    dupSlugs === 0 && undefinedRoutes === 0,
    'dupSlugs=' + dupSlugs + ' undefinedRoutes=' + undefinedRoutes);

  const liveBy = {};
  for (const t of WIKI_TYPES) for (const r of live[t]) liveBy[r._id] = { type: t, rec: r };
  const hashParts = Object.keys(liveBy).sort().map((id) => sha256(JSON.stringify({ id: id, title: titleOf(liveBy[id].type, liveBy[id].rec), slug: slugValue(liveBy[id].rec.slug) })));
  const hash = sha256(hashParts.join('\n'));
  g('GA-04', 'canonical identity hash matches approved baseline',
    hash === EXPECTED_HASH, 'hash=' + hash);

  if (!gates.every((x) => x.pass)) {
    console.log('\nGATE A FAILED - STOP - DO NOT MUTATE - REPORT THE DIFFERENCE');
    process.exit(2);
  }

  const PLAN = JSON.parse(fs.readFileSync(path.join(SPEC06B_DIR, 'SPEC_06B_EDGE_LEVEL_PLAN.json'), 'utf8'));
  const MPLAN = JSON.parse(fs.readFileSync(path.join(SPEC06B_DIR, 'SPEC_06B_MUTATION_PLAN.json'), 'utf8'));
  const mpByEdge = {};
  for (const r of MPLAN.rows) mpByEdge[r.edgeId] = r;

  const candidates = PLAN.data.filter((r) =>
    r.confidence === 'HIGH_CONFIDENCE' &&
    r.relationshipField === 'relatedPosts' &&
    r.mutationType === 'ADD_REFERENCE' &&
    r.PMReviewStatus === 'PENDING_PM_REVIEW');
  g('GB-01', 'authorized filter yields exactly 35 rows (HIGH + relatedPosts + ADD_REFERENCE + PENDING_PM_REVIEW)',
    candidates.length === 35, 'approvedActual=' + candidates.length + ' approvedExpected=35');

  const allRows = PLAN.data;
  const excludedChecks = {
    parentSpeciesAuthorized: candidates.filter((r) => r.relationshipField === 'parentSpecies').length,
    compatibleSpeciesAuthorized: candidates.filter((r) => r.relationshipField === 'compatibleSpecies').length,
    mediumAuthorized: candidates.filter((r) => r.confidence !== 'HIGH_CONFIDENCE').length,
    blockedAuthorized: candidates.filter((r) => r.mutationType === 'BLOCKED').length,
    nonRelatedPostsAuthorized: candidates.filter((r) => r.relationshipField !== 'relatedPosts').length,
  };
  g('GB-02', 'authorization exclusions hold: parentSpecies 0, compatibleSpecies 0, MEDIUM 0, BLOCKED 0, non-relatedPosts 0',
    Object.values(excludedChecks).every((n) => n === 0), JSON.stringify(excludedChecks));

  const mpAuthorized = candidates.filter((r) => mpByEdge[r.edgeId]);
  g('GB-03', 'every authorized edge exists in the SPEC 06B mutation plan (35 of 38 planned rows; 3 MEDIUM parentSpecies rows held as planning history)',
    mpAuthorized.length === 35 && MPLAN.rows.length === 38,
    'inMutationPlan=' + mpAuthorized.length + ' planRows=' + MPLAN.rows.length + ' held=' + (MPLAN.rows.length - candidates.length));

  const postById = {};
  for (const p of livePosts) postById[p._id] = p;
  let missingTarget = 0, wrongType = 0, selfRef = 0, notPublished = 0, revDrift = 0, valueDrift = 0, targetPresent = 0, missingSource = 0;
  const edgeRows = [];
  for (const r of candidates) {
    const st = postById[r.targetRecordId];
    if (!st) { missingTarget++; continue; }
    if (r.targetType !== 'post') wrongType++;
    if (r.sourceRecordId === r.targetRecordId) selfRef++;
    if (String(st._id).startsWith('drafts.')) notPublished++;
    const src = liveBy[r.sourceRecordId];
    if (!src) { missingSource++; continue; }
    const mp = mpByEdge[r.edgeId];
    if (src.rec._rev !== mp.expectedRev) revDrift++;
    const cur = JSON.stringify(src.rec[r.relationshipField] === undefined ? null : src.rec[r.relationshipField]);
    if (cur !== mp.expectedCurrentReferenceState) valueDrift++;
    const arr = src.rec[r.relationshipField];
    const present = Array.isArray(arr) && arr.some((x) => x && x._ref === r.targetRecordId);
    if (present) targetPresent++;
    edgeRows.push({
      edgeId: r.edgeId,
      sourceId: r.sourceRecordId,
      sourceTitle: r.sourceTitle,
      sourceType: r.sourceType,
      targetId: r.targetRecordId,
      targetTitle: r.targetTitle,
      targetType: 'post',
      relationshipField: 'relatedPosts',
      confidence: 'HIGH_CONFIDENCE',
      mutationType: 'ADD_REFERENCE',
      expectedRev: mp.expectedRev,
      expectedCurrentReferenceState: mp.expectedCurrentReferenceState,
      batchGroupId: mp.batchGroupId,
      pmReviewStatus: r.PMReviewStatus,
    });
  }
  g('GB-04', 'per-edge preconditions: target exists and is published post, target != source, source _rev equals frozen expectedRev, current relatedPosts equals expected state, target reference absent (0 missing/0 wrong-type/0 self/0 drift/0 present)',
    missingTarget === 0 && wrongType === 0 && selfRef === 0 && notPublished === 0 && revDrift === 0 &&
    valueDrift === 0 && targetPresent === 0 && missingSource === 0 && edgeRows.length === 35,
    'missingTarget=' + missingTarget + ' wrongType=' + wrongType + ' selfRef=' + selfRef + ' notPublished=' + notPublished +
    ' revDrift=' + revDrift + ' valueDrift=' + valueDrift + ' targetPresent=' + targetPresent + ' missingSource=' + missingSource);

  const batchMap = {};
  for (const e of edgeRows) (batchMap[e.batchGroupId] = batchMap[e.batchGroupId] || []).push(e);
  const batches = Object.keys(batchMap).sort().map((id) => {
    const rows = batchMap[id].slice().sort((a, b) => a.edgeId.localeCompare(b.edgeId));
    const revs = new Set(rows.map((x) => x.expectedRev));
    const srcs = new Set(rows.map((x) => x.sourceId));
    const fields = new Set(rows.map((x) => x.relationshipField));
    return {
      batchGroupId: id,
      sourceId: rows[0].sourceId,
      sourceTitle: rows[0].sourceTitle,
      sourceType: rows[0].sourceType,
      relationshipField: 'relatedPosts',
      expectedRev: rows[0].expectedRev,
      expectedCurrentReferenceState: rows[0].expectedCurrentReferenceState,
      targetIds: rows.map((x) => x.targetId),
      targetTitles: rows.map((x) => x.targetTitle),
      edgeIds: rows.map((x) => x.edgeId),
      targetCount: rows.length,
      consistent: revs.size === 1 && srcs.size === 1 && fields.size === 1,
    };
  });
  g('GB-05', 'batch construction: 22 batches (source + field), each internally consistent (one source, one expectedRev, one field), target counts sum to 35',
    batches.length === 22 && batches.every((b) => b.consistent) && batches.reduce((a, b) => a + b.targetCount, 0) === 35,
    'batches=' + batches.length + ' targets=' + batches.reduce((a, b) => a + b.targetCount, 0) +
    ' inconsistent=' + batches.filter((b) => !b.consistent).length);

  const sources = {};
  for (const e of edgeRows) sources[e.sourceId] = liveBy[e.sourceId];
  const sourceDocs = Object.keys(sources).sort().map((id) => ({
    _id: id,
    _rev: sources[id].rec._rev,
    _type: sources[id].rec._type,
    title: titleOf(sources[id].type, sources[id].rec),
    slug: slugValue(sources[id].rec.slug),
    relatedPosts: sources[id].rec.relatedPosts === undefined ? null : sources[id].rec.relatedPosts,
  }));
  g('GB-06', 'source inventory complete: 22 distinct source documents with frozen rev + relatedPosts pre-state',
    sourceDocs.length === 22 && new Set(edgeRows.map((e) => e.sourceId)).size === 22,
    'sources=' + sourceDocs.length);

  g('GB-07', 'authorization boundary recorded: 38 planned != 35 authorized; 3 MEDIUM parentSpecies held; 44 BLOCKED held; 0 of them may reach the mutation endpoint',
    MPLAN.rows.length === 38 && candidates.length === 35 && (MPLAN.rows.length - candidates.length) === 3 &&
    allRows.filter((r) => r.mutationType === 'BLOCKED').length === 44,
    'planned=38 authorized=35 heldMediumParentSpecies=3 blocked=44');

  const heldRows = allRows.filter((r) => !(r.confidence === 'HIGH_CONFIDENCE' && r.relationshipField === 'relatedPosts' && r.mutationType === 'ADD_REFERENCE'))
    .map((r) => ({ edgeId: r.edgeId, confidence: r.confidence, relationshipField: r.relationshipField, mutationType: r.mutationType, reason: r.mutationType === 'BLOCKED' ? 'BLOCKED per SPEC 06B direction/idempotency classification' : 'MEDIUM parentSpecies held - outside PM authorization' }));
  const heldParentSpecies = heldRows.filter((r) => r.relationshipField === 'parentSpecies').length;
  const heldCompatibleSpecies = heldRows.filter((r) => r.relationshipField === 'compatibleSpecies').length;
  g('GB-08', 'held/excluded inventory complete: 47 rows documented (45 parentSpecies + 2 compatibleSpecies), none authorized',
    heldRows.length === 47 && heldParentSpecies === 45 && heldCompatibleSpecies === 2 && candidates.every((r) => r.relationshipField === 'relatedPosts'),
    'held=' + heldRows.length + ' parentSpecies=' + heldParentSpecies + ' compatibleSpecies=' + heldCompatibleSpecies);

  const gateStatus = gates.every((x) => x.pass) ? 'PASS' : 'FAIL';
  const plan = {
    spec: 'SPEC 06C', phase: 'EXECUTION_PLAN', generatedAt: generatedAt,
    mode: 'READ-ONLY extract - no mutation endpoint called in this script',
    authorization: {
      authorizedCount: 35,
      relationshipField: 'relatedPosts',
      confidence: 'HIGH_CONFIDENCE',
      mutationType: 'ADD_REFERENCE',
      targetType: 'post',
      currentState: 'target reference ABSENT',
      pmReviewStatusValue: 'PENDING_PM_REVIEW',
      statement: 'STRICTLY LIMITED to 35 HIGH-confidence relatedPosts ADD_REFERENCE mutations from SPEC 06B. 38 planned != 35 authorized. Do not expand scope.',
      notAuthorized: [
        '3 MEDIUM parentSpecies edges (held)',
        '42 BLOCKED parentSpecies edges',
        '2 BLOCKED compatibleSpecies edges',
        'any SEO/content/identity/taxonomy/image/unrelated fields',
        'any MEDIUM or BLOCKED row of any field',
      ],
    },
    counts: {
      plannedAddReference36B: MPLAN.rows.length,
      authorized: candidates.length,
      held: MPLAN.rows.length - candidates.length,
      blocked36B: allRows.filter((r) => r.mutationType === 'BLOCKED').length,
      batches: batches.length,
      distinctSources: sourceDocs.length,
    },
    gates: gates,
    gateStatus: gateStatus,
    identityHash: hash,
    edgeRows: edgeRows,
    batches: batches,
    sources: sourceDocs,
    heldRows: heldRows,
    exclusionChecks: excludedChecks,
    authorizationBoundary: { approvedExpected: 35, approvedActual: candidates.length, missing: 0, extra: 0 },
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_06C_EXECUTION_PLAN.json'), JSON.stringify(plan, null, 2));

  console.log('\nGATE A + GATE B: ' + gates.filter((x) => x.pass).length + '/' + gates.length + ' ' + gateStatus);
  console.log('authorized=' + candidates.length + ' batches=' + batches.length + ' sources=' + sourceDocs.length);
  if (gateStatus !== 'PASS') { console.log('STOP - DO NOT WRITE'); process.exit(2); }
})().catch((e) => { console.error('EXTRACT ERROR:', e.stack || e.message); process.exit(1); });
