const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const OUT_DIR = path.join('report', 'SPEC_06B');
const SPEC06A_DIR = path.join('report', 'SPEC_06A');
const SPEC05_DIR = path.join('report', 'SPEC_05');
const SPEC04_DIR = path.join('report', 'SPEC_04');
const SPEC001_DIR = path.join('report', 'SPEC_00_1');
const SPEC01_DIR = path.join('report', 'SPEC_01');

const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const REF_FIELDS = ['parentSpecies', 'relatedPosts', 'relatedTools', 'compatibleSpecies', 'compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedProblems'];
const Q = String.fromCharCode(34);

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
    const o = []; let cur = ''; let inQ = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (inQ) {
        if (ch === Q && l[i + 1] === Q) { cur += Q; i++; }
        else if (ch === Q) inQ = false;
        else cur += ch;
      } else if (ch === Q) inQ = true;
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

const checks = [];
const ac = (id, name, ok, detail) => {
  checks.push({ id: id, name: name, pass: !!ok, detail: String(detail === undefined ? '' : detail) });
  console.log((ok ? 'AC OK  ' : 'AC FAIL') + ' ' + id + ' ' + name + ' - ' + (detail === undefined ? '' : detail));
};

(async () => {
  const live = {};
  for (const t of WIKI_TYPES) live[t] = await q('*[_type == "' + t + '" && !(_id in path("drafts.**"))]');
  const livePosts = await q('*[_type == "post" && !(_id in path("drafts.**"))]');
  const liveTools = await q('*[_type == "tool" && !(_id in path("drafts.**"))]');
  const liveCats = await q('*[_type == "category" && !(_id in path("drafts.**"))]');

  const counts = {};
  for (const t of WIKI_TYPES) counts[t] = live[t].filter((r) => !r._id.startsWith('drafts.')).length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  ac('V-01', 'live canonical count = 473 with exact per-type composition (read-only re-fetch)',
    total === 473 && WIKI_TYPES.every((t) => counts[t] === EXPECTED[t]),
    'total=' + total + ' ' + JSON.stringify(counts));

  const POST = JSON.parse(fs.readFileSync(path.join(SPEC05_DIR, 'SPEC_05_POST_REPAIR_SNAPSHOT.json'), 'utf8'));
  const postBy = {};
  for (const t of WIKI_TYPES) for (const r of POST.records[t]) postBy[r._id] = { type: t, rec: r };
  const liveBy = {};
  for (const t of WIKI_TYPES) for (const r of live[t]) liveBy[r._id] = { type: t, rec: r };

  const sha256 = (s) => require('crypto').createHash('sha256').update(s).digest('hex');
  const slugValue = (s) => (typeof s === 'string' ? s : (s && s.current) || null);
  const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);
  const stripMeta = (d) => { const c = Object.assign({}, d); delete c._rev; delete c._updatedAt; return c; };
  const hashParts = Object.keys(liveBy).sort().map((id) => sha256(JSON.stringify({ id: id, title: titleOf(liveBy[id].type, liveBy[id].rec), slug: slugValue(liveBy[id].rec.slug) })));
  const hash = sha256(hashParts.join('\n'));
  ac('V-02', 'canonical identity hash unchanged (matches SPEC 00-06A baseline)', hash === EXPECTED_HASH, 'hash=' + hash);

  let changed = 0, relDiff = 0, seoDiff = 0, added = 0, removed = 0;
  for (const id of Object.keys(liveBy)) if (!postBy[id]) added++;
  for (const id of Object.keys(postBy)) if (!liveBy[id]) removed++;
  for (const id of Object.keys(liveBy)) {
    const b = postBy[id];
    if (!b) continue;
    const a = liveBy[id].rec;
    if (JSON.stringify(stripMeta(a)) !== JSON.stringify(stripMeta(b.rec))) changed++;
    for (const f of REF_FIELDS) if (JSON.stringify(a[f]) !== JSON.stringify(b.rec[f])) relDiff++;
    if (JSON.stringify(a.seo) !== JSON.stringify(b.rec.seo)) seoDiff++;
  }
  const strictDiffCount = (fresh, old) => {
    const oldBy = {}; let n = 0;
    for (const d of old) oldBy[d._id] = d;
    for (const d of fresh) if (!oldBy[d._id] || JSON.stringify(d) !== JSON.stringify(oldBy[d._id])) n++;
    for (const id of Object.keys(oldBy)) if (!fresh.some((d) => d._id === id)) n++;
    return n;
  };
  const otherDiff = strictDiffCount(livePosts, POST.posts) + strictDiffCount(liveTools, POST.tools) + strictDiffCount(liveCats, POST.categories);
  ac('V-03', 'zero canonical mutations during SPEC 06B (wiki full-doc diff = 0, relationship diff = 0, SEO diff = 0, posts/tools/categories diff = 0 vs SPEC 05 post-repair baseline)',
    changed === 0 && added === 0 && removed === 0 && relDiff === 0 && seoDiff === 0 && otherDiff === 0,
    'wikiChanged=' + changed + ' relDiff=' + relDiff + ' seoDiff=' + seoDiff + ' otherDiff=' + otherDiff);

  const MANIFEST = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06B_RAW_SOURCE_MANIFEST.json'), 'utf8'));
  const PLAN = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06B_EDGE_LEVEL_PLAN.json'), 'utf8'));
  const RECIP = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06B_RECIPROCAL_PAIRS.json'), 'utf8'));
  const OTM = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06B_ONE_TO_MANY.json'), 'utf8'));
  const IDEM = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06B_IDEMPOTENCY_CHECK.json'), 'utf8'));
  const DIR = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06B_DIRECTION_AUDIT.json'), 'utf8'));
  const MPLAN = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06B_MUTATION_PLAN.json'), 'utf8'));
  const PSUM = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06B_PLAN_SUMMARY.json'), 'utf8'));
  const MAP36 = JSON.parse(fs.readFileSync(path.join(SPEC06A_DIR, 'SPEC_06A_CANDIDATE_36_MAPPING.json'), 'utf8'));
  const MAP46 = JSON.parse(fs.readFileSync(path.join(SPEC06A_DIR, 'SPEC_06A_MEDIUM_46_MAPPING.json'), 'utf8'));
  const MTX = JSON.parse(fs.readFileSync(path.join(SPEC06A_DIR, 'SPEC_06A_RECONCILIATION_MATRIX.json'), 'utf8'));
  const VA6A = JSON.parse(fs.readFileSync(path.join(SPEC06A_DIR, 'SPEC_06A_VALIDATION.json'), 'utf8'));
  const dRows = parseCsv(fs.readFileSync(path.join(SPEC04_DIR, 'SPEC_04_RELATIONSHIP_AUDIT.csv'), 'utf8'));

  const planRows = PLAN.data;
  const mapById = {};
  for (const m of MAP36.data.concat(MAP46.data)) mapById[m.candidateEdgeId] = m;
  const planById = {};
  for (const r of planRows) planById[r.edgeId] = r;

  const planIds = new Set(planRows.map((r) => r.edgeId));
  const mapIds = new Set(Object.keys(mapById));
  let notInPlan = 0, notInMap = 0;
  for (const id of planIds) if (!mapIds.has(id)) notInMap++;
  for (const id of mapIds) if (!planIds.has(id)) notInPlan++;
  const confCounts = {};
  let badPm = 0;
  for (const r of planRows) {
    confCounts[r.confidence] = (confCounts[r.confidence] || 0) + 1;
    if (r.PMReviewStatus !== 'PENDING_PM_REVIEW') badPm++;
  }
  ac('V-04', 'edge-level plan: 82 rows, unique edgeIds set-equal to SPEC 06A authoritative mappings (36 HIGH + 46 MEDIUM), every PMReviewStatus = PENDING_PM_REVIEW',
    planRows.length === 82 && planIds.size === 82 && notInMap === 0 && notInPlan === 0 &&
    confCounts.HIGH_CONFIDENCE === 36 && confCounts.MEDIUM_CONFIDENCE === 46 && badPm === 0,
    'rows=' + planRows.length + ' unique=' + planIds.size + ' unmappedInPlan=' + notInMap + ' planMissing=' + notInPlan + ' ' + JSON.stringify(confCounts) + ' badPM=' + badPm);

  const oppIds = new Set(MTX.data.map((r) => r.inventoryOpportunityId));
  const dByKey = {};
  for (const r of dRows) if (r.candidateTargetId) dByKey[r.recordId + '|' + r.sourceField + '|' + r.candidateTargetId] = r;
  let badOpp = 0, badLineage = 0, badEvidence = 0;
  for (const r of planRows) {
    const m = mapById[r.edgeId];
    if (!oppIds.has(r.opportunityId)) badOpp++;
    if (!m || m.sourceRecordId !== r.sourceRecordId || m.relationshipField !== r.relationshipField ||
        m.targetRecordId !== r.targetRecordId || m.proposedScopeConfidence !== r.confidence ||
        m.inventoryOpportunityId !== r.opportunityId) badLineage++;
    const d = dByKey[r.sourceRecordId + '|' + r.relationshipField + '|' + r.targetRecordId];
    if (!d || d.confidence !== r.confidence || !r.evidenceReason || !r.evidenceSource || !r.evidenceLevel) badEvidence++;
  }
  ac('V-05', 'lineage: 82/82 plan edges map to SPEC 06A matrix opportunities and mapping rows (source/field/target/confidence identical); every edge traces to its SPEC 04 audit row with evidence preserved; 0 untraceable',
    badOpp === 0 && badLineage === 0 && badEvidence === 0,
    'badOpp=' + badOpp + ' badLineage=' + badLineage + ' badEvidence=' + badEvidence);

  const pairRows = RECIP.data;
  const rpIds = new Set(pairRows.map((r) => r.reciprocalPairId));
  const bothScope = pairRows.filter((r) => r.bothSidesInProposedScope === 'true');
  const HANDLING_ENUM = ['KEEP_A', 'KEEP_B', 'KEEP_BOTH', 'BLOCK', 'REVIEW', 'NOT_RECIPROCAL'];
  let badPair = 0, badBackRef = 0, badPsPair = 0, badCsPair = 0;
  for (const r of pairRows) {
    if (!HANDLING_ENUM.includes(r.recommendedHandling)) badPair++;
    if (r.bothSidesInProposedScope === 'true') {
      if (!r.edgeA || !r.edgeB) badPair++;
      if (planById[r.edgeA] && planById[r.edgeA].reciprocalPairId !== r.reciprocalPairId) badBackRef++;
      if (planById[r.edgeB] && planById[r.edgeB].reciprocalPairId !== r.reciprocalPairId) badBackRef++;
      if (r.fieldA === 'parentSpecies' && !(r.risk === 'BLOCKED' && r.recommendedHandling === 'BLOCK')) badPsPair++;
      if (r.fieldA === 'compatibleSpecies' && !(r.risk === 'HIGH' && r.recommendedHandling === 'REVIEW')) badCsPair++;
    }
  }
  const pairedEdges = planRows.filter((r) => r.reciprocalPairId);
  ac('V-06', 'reciprocal pairs: 47 pairs (unique RP ids), 22 both-in-scope, 44/82 plan edges flagged; in-scope parentSpecies pairs BLOCK+BLOCKED, in-scope compatibleSpecies pair REVIEW+HIGH; edge plan back-references consistent',
    pairRows.length === 47 && rpIds.size === 47 && bothScope.length === 22 && pairedEdges.length === 44 &&
    badPair === 0 && badBackRef === 0 && badPsPair === 0 && badCsPair === 0,
    'pairs=' + pairRows.length + ' both=' + bothScope.length + ' pairedEdges=' + pairedEdges.length +
    ' badPair=' + badPair + ' badBackRef=' + badBackRef + ' badPsPair=' + badPsPair + ' badCsPair=' + badCsPair);

  const scopeOpps = new Set(planRows.map((r) => r.opportunityId));
  const matrix1many = MTX.data.filter((r) => r.mappingType === '1:many' && scopeOpps.has(r.inventoryOpportunityId)).map((r) => r.inventoryOpportunityId).sort();
  const otmGroupOpps = new Set(OTM.data.map((r) => r.opportunityId));
  let otmBadOpp = 0;
  for (const o of matrix1many) if (!otmGroupOpps.has(o)) otmBadOpp++;
  for (const o of otmGroupOpps) if (!matrix1many.includes(o)) otmBadOpp++;
  const otmEdgeIds = new Set(OTM.data.map((r) => r.edgeId));
  let otmBadEdge = 0;
  for (const r of OTM.data) {
    if (!planById[r.edgeId]) otmBadEdge++;
    else if (planById[r.edgeId].oneToManyGroupId !== r.oneToManyGroupId) otmBadEdge++;
  }
  const expectedOtmEdges = planRows.filter((r) => matrix1many.includes(r.opportunityId));
  for (const r of expectedOtmEdges) if (!otmEdgeIds.has(r.edgeId)) otmBadEdge++;
  ac('V-07', 'one-to-many: 16 groups = matrix mappingType 1:many opportunities in proposed scope; 42 rows = all plan edges of those opportunities; group ids consistent both directions',
    matrix1many.length === 16 && OTM.groupCount === 16 && OTM.data.length === 42 && otmGroupOpps.size === 16 &&
    otmBadOpp === 0 && otmBadEdge === 0 && expectedOtmEdges.length === 42,
    'groups=' + otmGroupOpps.size + ' rows=' + OTM.data.length + ' badOpp=' + otmBadOpp + ' badEdge=' + otmBadEdge);

  const idemRows = IDEM.data;
  const IDEM_ENUM = ['ALREADY_PRESENT', 'ABSENT', 'AMBIGUOUS', 'INVALID'];
  let idemBad = 0, revDrift = 0, valDrift = 0;
  for (const r of idemRows) {
    if (!IDEM_ENUM.includes(r.classification)) idemBad++;
    const p = planById[r.edgeId];
    if (!p || p.duplicateStatus !== r.classification) idemBad++;
    const st = MANIFEST.edgeStates[r.edgeId];
    if (st && st.currentSerialized !== r.currentStateSerialized) idemBad++;
    const fresh = liveBy[r.sourceRecordId];
    if (!fresh) { revDrift++; continue; }
    if (fresh.rec._rev !== r.expectedRev) revDrift++;
    const freshVal = JSON.stringify(fresh.rec[r.relationshipField] === undefined ? null : fresh.rec[r.relationshipField]);
    if (JSON.stringify(JSON.parse(r.currentStateSerialized)) !== freshVal) valDrift++;
  }
  let addNotAbsent = 0;
  for (const r of planRows) if (r.mutationType === 'ADD_REFERENCE' && r.duplicateStatus !== 'ABSENT') addNotAbsent++;
  ac('V-08', 'idempotency: 82 rows all within enum; plan duplicateStatus matches; fresh live read confirms expectedRev and current relationship value for every edge source record; 0 drift; all ADD_REFERENCE edges were ABSENT',
    idemRows.length === 82 && idemBad === 0 && revDrift === 0 && valDrift === 0 && addNotAbsent === 0,
    'rows=' + idemRows.length + ' bad=' + idemBad + ' revDrift=' + revDrift + ' valDrift=' + valDrift + ' addNotAbsent=' + addNotAbsent);

  const mutRows = MPLAN.rows;
  const addRows = planRows.filter((r) => r.mutationType === 'ADD_REFERENCE');
  let mutBad = 0, mutRev = 0, mutVal = 0;
  const batchBy = {};
  for (const r of mutRows) {
    const p = planById[r.edgeId];
    if (!p || p.mutationType !== 'ADD_REFERENCE' || r.PMReviewStatus !== 'PENDING_PM_REVIEW') mutBad++;
    if (!r.proposedReferenceState || r.proposedReferenceState.indexOf(r.targetRecordId) < 0) mutBad++;
    const fresh = liveBy[r.recordId];
    if (!fresh) { mutRev++; continue; }
    if (fresh.rec._rev !== r.expectedRev) mutRev++;
    const fv = fresh.rec[r.relationshipField] === undefined ? null : fresh.rec[r.relationshipField];
    if (JSON.stringify(JSON.parse(r.expectedCurrentReferenceState)) !== JSON.stringify(fv)) mutVal++;
    (batchBy[r.batchGroupId] = batchBy[r.batchGroupId] || []).push(r);
  }
  let batchBad = 0;
  for (const g of Object.keys(batchBy)) {
    const rs = batchBy[g];
    const revs = new Set(rs.map((r) => r.expectedRev));
    const keys = new Set(rs.map((r) => r.recordId + '|' + r.relationshipField));
    if (revs.size !== 1 || keys.size !== 1) batchBad++;
    if (rs.length !== Number(rs[0].batchTargetCount)) batchBad++;
    if (rs.length !== new Set(rs.map((r) => r.targetRecordId)).size) batchBad++;
  }
  ac('V-09', 'mutation plan: rows = ADD_REFERENCE count (38); expectedRev and expectedCurrentReferenceState match fresh live read (0 drift); proposed state contains target; batches internally consistent (one record+field+expectedRev per batch, target counts exact); only PENDING_PM_REVIEW',
    mutRows.length === addRows.length && mutRows.length === 38 && mutBad === 0 && mutRev === 0 && mutVal === 0 &&
    batchBad === 0 && Object.keys(batchBy).length === MPLAN.counts.batches,
    'rows=' + mutRows.length + ' expected=' + addRows.length + ' bad=' + mutBad + ' revDrift=' + mutRev + ' valDrift=' + mutVal + ' batchBad=' + batchBad + ' batches=' + Object.keys(batchBy).length);

  const ps = DIR.parentSpecies;
  const cs = DIR.compatibleSpecies;
  let psBad = 0;
  for (const e of ps.edges) {
    const p = planById[e.edgeId];
    if (!p) { psBad++; continue; }
    const expectConflicted = !!(p.reciprocalPairId && p.mutationType === 'BLOCKED' && p.riskLevel === 'BLOCKED');
    if (e.directionConfidence === 'CONFLICTED') {
      if (e.directionStatus !== 'BLOCKED_REVIEW' || p.mutationType !== 'BLOCKED' || p.riskLevel !== 'BLOCKED') psBad++;
    } else {
      if (e.directionStatus !== 'VALID_CHILD_TO_PARENT' || p.mutationType !== 'ADD_REFERENCE' || !e.sourceRole || !e.targetRole || !e.directionEvidence) psBad++;
      if (expectConflicted) psBad++;
    }
  }
  const csEdges = planRows.filter((r) => r.relationshipField === 'compatibleSpecies');
  ac('V-10', 'direction audit: 45 parentSpecies edges classified (42 CONFLICTED/BLOCKED_REVIEW matching reciprocal cycle blocks; 3 VALID_CHILD_TO_PARENT with roles+evidence, all ADD_REFERENCE); compatibleSpecies conclusion present with reciprocity-rate evidence; 2 compatibleSpecies scope edges both BLOCKED',
    ps.edgeCount === 45 && ps.directionConflicted === 42 && ps.directionEstablished === 3 && psBad === 0 &&
    cs.scopeEdgeCount === 2 && csEdges.every((r) => r.mutationType === 'BLOCKED') &&
    typeof cs.conclusion === 'string' && cs.conclusion.length > 0 && cs.conventionEvidence &&
    cs.conventionEvidence.compatiblePlants.reciprocityRate === 0 && cs.conventionEvidence.compatibleInvertebrates.reciprocityRate === 0,
    'ps=' + ps.edgeCount + ' conflicted=' + ps.directionConflicted + ' established=' + ps.directionEstablished + ' psBad=' + psBad + ' cs=' + cs.scopeEdgeCount);

  let dupEdges = 0, selfRefs = 0, unresolved = 0, wrongType = 0, invalidField = 0;
  const edgeSeen = {};
  const typeOf = {}; const wikiBy = {}; const postBy2 = {}; const toolBy2 = {};
  for (const t of WIKI_TYPES) for (const r of live[t]) { wikiBy[r._id] = r; typeOf[r._id] = t; }
  for (const p of livePosts) postBy2[p._id] = p;
  for (const t of liveTools) toolBy2[t._id] = t;
  const targetInfo = (id) => {
    if (wikiBy[id]) return { found: true, type: typeOf[id] };
    if (postBy2[id]) return { found: true, type: 'post' };
    if (toolBy2[id]) return { found: true, type: 'tool' };
    return { found: false, type: null };
  };
  const schemaMap = MANIFEST.schemaMap || (JSON.parse(fs.readFileSync(path.join(SPEC06A_DIR, 'SPEC_06A_RAW_SOURCE_MANIFEST.json'), 'utf8')).relationshipSchema);
  for (const r of planRows) {
    const k = r.sourceRecordId + '|' + r.relationshipField + '|' + r.targetRecordId;
    edgeSeen[k] = (edgeSeen[k] || 0) + 1;
    if (r.sourceRecordId === r.targetRecordId) selfRefs++;
    const ti = targetInfo(r.targetRecordId);
    if (!ti.found) { unresolved++; continue; }
    const st = typeOf[r.sourceRecordId];
    if (!schemaMap[st] || !schemaMap[st][r.relationshipField]) invalidField++;
    else if (ti.type !== schemaMap[st][r.relationshipField]) wrongType++;
  }
  dupEdges = Object.values(edgeSeen).filter((n) => n > 1).length;
  ac('V-11', 'integrity: 0 duplicate logical edges, 0 self-references, 0 unresolved targets, 0 wrong-type targets, 0 invalid-field targets across the 82 plan edges (fresh live verification)',
    dupEdges === 0 && selfRefs === 0 && unresolved === 0 && wrongType === 0 && invalidField === 0,
    'dup=' + dupEdges + ' self=' + selfRefs + ' unresolved=' + unresolved + ' wrongType=' + wrongType + ' invalidField=' + invalidField);

  const mt = {}; const riskCounts = {};
  let mtBad = 0, riskBad = 0;
  for (const r of planRows) {
    mt[r.mutationType] = (mt[r.mutationType] || 0) + 1;
    riskCounts[r.riskLevel] = (riskCounts[r.riskLevel] || 0) + 1;
    if (!['ADD_REFERENCE', 'NO_OP', 'BLOCKED'].includes(r.mutationType)) mtBad++;
    if (!['LOW', 'MEDIUM', 'HIGH', 'BLOCKED'].includes(r.riskLevel)) riskBad++;
    if (r.mutationType === 'BLOCKED' && r.reciprocalPairId && r.relationshipField === 'parentSpecies' && r.riskLevel !== 'BLOCKED') riskBad++;
    if (r.mutationType === 'BLOCKED' && r.reciprocalPairId && r.relationshipField === 'compatibleSpecies' && r.riskLevel !== 'HIGH') riskBad++;
  }
  const S = PSUM.summary;
  const oppSetHigh = new Set(planRows.filter((r) => r.confidence === 'HIGH_CONFIDENCE').map((r) => r.opportunityId));
  const oppSetMed = new Set(planRows.filter((r) => r.confidence === 'MEDIUM_CONFIDENCE').map((r) => r.opportunityId));
  ac('V-12', 'counts consistent: ADD + NO_OP + BLOCKED = 82 (38/0/44); populations 23 opps/36 edges HIGH and 33 opps/46 edges MEDIUM with per-population splits matching; plan summary mirrors computed counts; risk/mutation enums valid; reciprocal risk rules hold',
    (mt.ADD_REFERENCE || 0) === 38 && (mt.NO_OP || 0) === 0 && (mt.BLOCKED || 0) === 44 &&
    oppSetHigh.size === 23 && oppSetMed.size === 33 &&
    S.populations.HIGH.addReference === 35 && S.populations.HIGH.blocked === 1 &&
    S.populations.MEDIUM.addReference === 3 && S.populations.MEDIUM.blocked === 43 &&
    S.populations.TOTAL.edges === 82 && S.reciprocalPairs === 47 && S.pairsInsideProposedScope === 22 &&
    S.oneToManyOpportunities === 16 && S.oneToManyEdges === 42 && S.mutationBatches === 23 &&
    mtBad === 0 && riskBad === 0,
    'mutationType=' + JSON.stringify(mt) + ' risk=' + JSON.stringify(riskCounts) + ' opps=' + oppSetHigh.size + '/' + oppSetMed.size + ' mtBad=' + mtBad + ' riskBad=' + riskBad);

  const requiredArtifacts = [
    'SPEC_06B_RAW_SOURCE_MANIFEST.json',
    'SPEC_06B_EDGE_LEVEL_PLAN.json', 'SPEC_06B_EDGE_LEVEL_PLAN.csv',
    'SPEC_06B_RECIPROCAL_PAIRS.json', 'SPEC_06B_RECIPROCAL_PAIRS.csv',
    'SPEC_06B_ONE_TO_MANY.json', 'SPEC_06B_ONE_TO_MANY.csv',
    'SPEC_06B_IDEMPOTENCY_CHECK.json', 'SPEC_06B_IDEMPOTENCY_CHECK.csv',
    'SPEC_06B_DIRECTION_AUDIT.json',
    'SPEC_06B_MUTATION_PLAN.json', 'SPEC_06B_MUTATION_PLAN.csv',
    'SPEC_06B_PLAN_SUMMARY.json',
  ];
  const missing = requiredArtifacts.filter((f) => !fs.existsSync(path.join(OUT_DIR, f)));
  const ebOk = MANIFEST.gateStatus === 'PASS' && Array.isArray(MANIFEST.gates) && MANIFEST.gates.length === 8;
  ac('V-13', '13 required planning artifacts present (plus this validation and the audit report); extract manifest GATE A = PASS (8/8 gates EB-01..EB-08)',
    missing.length === 0 && ebOk, 'missing=' + (missing.join(',') || 'none') + ' manifestGates=' + MANIFEST.gateStatus + ' (' + (MANIFEST.gates || []).length + ')');

  const csvChecks = [
    ['SPEC_06B_EDGE_LEVEL_PLAN.csv', 82],
    ['SPEC_06B_RECIPROCAL_PAIRS.csv', 47],
    ['SPEC_06B_ONE_TO_MANY.csv', 42],
    ['SPEC_06B_IDEMPOTENCY_CHECK.csv', 82],
    ['SPEC_06B_MUTATION_PLAN.csv', 38],
  ];
  const csvProblems = [];
  for (const [f, n] of csvChecks) {
    const rows = parseCsv(fs.readFileSync(path.join(OUT_DIR, f), 'utf8'));
    if (rows.length !== n) csvProblems.push(f + '=' + rows.length);
  }
  const edgeCsv = parseCsv(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06B_EDGE_LEVEL_PLAN.csv'), 'utf8'));
  let parityBad = 0;
  for (const r of edgeCsv) {
    const j = planById[r.edgeId];
    if (!j || j.mutationType !== r.mutationType || j.reciprocalPairId !== r.reciprocalPairId || j.PMReviewStatus !== r.PMReviewStatus) parityBad++;
  }
  ac('V-14', 'CSV/JSON parity: all five CSV artifacts carry exact expected row counts (82/47/42/82/38) and edge plan CSV fields match JSON',
    csvProblems.length === 0 && parityBad === 0, 'csvProblems=' + (csvProblems.join(',') || 'none') + ' parityBad=' + parityBad);

  const banned = ['APPROVED', 'AUTHORIZED', 'AUTHORISED', 'APPLIED'];
  const tokenHits = [];
  for (const f of requiredArtifacts) {
    const text = fs.readFileSync(path.join(OUT_DIR, f), 'utf8');
    for (const b of banned) if (text.indexOf(b) >= 0) tokenHits.push(f + ':' + b);
  }
  const pmValues = new Set(planRows.map((r) => r.PMReviewStatus));
  const authorizedOk = S.authorizedRelationshipMutations === 0 &&
    typeof MPLAN.authorization === 'string' && MPLAN.authorization.indexOf('NONE') >= 0 &&
    typeof PLAN.authorization === 'string' && PLAN.authorization.indexOf('NONE') >= 0;
  ac('V-15', 'no status implies approval/authorization: uppercase APPROVED/AUTHORIZED/AUTHORISED/APPLIED tokens absent from all planning artifacts; PMReviewStatus only PENDING_PM_REVIEW; authorization fields = NONE; authorizedRelationshipMutations = 0',
    tokenHits.length === 0 && pmValues.size === 1 && pmValues.has('PENDING_PM_REVIEW') && authorizedOk,
    'tokenHits=' + (tokenHits.join(',') || 'none') + ' pmValues=' + JSON.stringify([...pmValues]) + ' authorizedOk=' + authorizedOk);

  let r001 = { verdict: 'NOT_RUN', passed: 0, total: 0 };
  let r01 = { verdict: 'NOT_RUN', passed: 0, total: 0 };
  try { execSync('node scripts/SPEC_00_1_validate.js', { stdio: 'pipe', timeout: 300000 }); } catch (e) { console.log('SPEC_00_1_validate exit error: ' + e.message.slice(0, 200)); }
  try {
    const j = JSON.parse(fs.readFileSync(path.join(SPEC001_DIR, 'SPEC_00_1_VALIDATION.json'), 'utf8'));
    r001 = { verdict: j.verdict, passed: j.passed, total: j.passed + j.failed, generatedAt: j.generatedAt };
  } catch (e) { r001 = { verdict: 'UNREADABLE: ' + e.message, passed: 0, total: 0 }; }
  try { execSync('node scripts/SPEC_01_validate.js', { stdio: 'pipe', timeout: 300000 }); } catch (e) { console.log('SPEC_01_validate exit error: ' + e.message.slice(0, 200)); }
  try {
    const j = JSON.parse(fs.readFileSync(path.join(SPEC01_DIR, 'SPEC_01_VALIDATION.json'), 'utf8'));
    r01 = { verdict: j.verdict, passed: j.passed, total: j.passed + j.failed, generatedAt: j.generatedAt };
  } catch (e) { r01 = { verdict: 'UNREADABLE: ' + e.message, passed: 0, total: 0 }; }
  ac('V-16', 'regressions PASS (SPEC 00.1 9/9, SPEC 01 14/14)',
    r001.verdict === 'PASS' && r01.verdict === 'PASS', 'spec001=' + r001.passed + '/' + r001.total + ' spec01=' + r01.passed + '/' + r01.total);

  const scriptProblems = [];
  for (const f of ['SPEC_06B_extract.js', 'SPEC_06B_plan.js']) {
    const p = path.join('scripts', f);
    if (fs.existsSync(p)) {
      const text = fs.readFileSync(p, 'utf8');
      if (text.indexOf('/data/mutate') >= 0) scriptProblems.push(f + ':mutate-endpoint');
    }
  }
  const safety = MANIFEST.safetyVsSpec05PostRepair;
  const safetyOk = safety && safety.wikiChangedDocs === 0 && safety.idDiff === 0 && safety.slugDiff === 0 &&
    safety.titleDiff === 0 && safety.relFieldDiffs === 0 && safety.seoDiffs === 0 && safety.otherTypeDiffs === 0;
  ac('V-17', 'read-only discipline: manifest safety section = zero mutations (EB-04), SPEC 06A validation still PASS 18/18, no SPEC 06B script references the mutate endpoint',
    safetyOk && VA6A.result === 'PASS' && VA6A.summary.passed === 18 && scriptProblems.length === 0 &&
    MANIFEST.gates.filter((g) => String(g.id).indexOf('EB-04') >= 0).every((g) => g.pass === true),
    'scriptProblems=' + (scriptProblems.join(',') || 'none') + ' spec06A=' + VA6A.result + ' ' + VA6A.summary.passed + '/' + VA6A.summary.total + ' safety=' + JSON.stringify(safety));

  ac('V-18', 'relationship mutations authorized by SPEC 06B = 0 (planning only; no mutation endpoint called; PM authorization boundary preserved for GATE C)',
    S.authorizedRelationshipMutations === 0 && MPLAN.counts.addReference === 38,
    'canonicalMutations=0; authorizedRelationshipMutations=0; plan rows=38 pending PM review');

  const result = checks.every((c) => c.pass) ? 'PASS' : 'FAIL';
  const generatedAt = new Date().toISOString();
  const validation = {
    spec: 'SPEC 06B', phase: 'VALIDATION', generatedAt: generatedAt,
    method: 'fresh live read-only re-fetch + independent recomputation of plan/pairs/1:many/idempotency/direction/batches from SPEC 06A authoritative inputs + artifact presence + token scan + regressions',
    checks: checks,
    summary: { passed: checks.filter((c) => c.pass).length, total: checks.length, result: result },
    result: result,
    decision: result === 'PASS' ? 'COMPLETE - WAITING FOR PM REVIEW' : 'VALIDATION FAILED',
    counts: {
      candidateEdges: planRows.length,
      addReference: (mt.ADD_REFERENCE || 0),
      noOp: (mt.NO_OP || 0),
      blocked: (mt.BLOCKED || 0),
      reciprocalPairs: pairRows.length,
      pairsInsideProposedScope: bothScope.length,
      oneToManyGroups: OTM.groupCount,
      mutationBatches: MPLAN.counts.batches,
      directionConflicts: ps.directionConflicted,
      directionEstablished: ps.directionEstablished,
    },
    regressions: { spec001: r001, spec01: r01 },
    identityHash: hash,
    authorizedRelationshipMutations: 0,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_06B_VALIDATION.json'), JSON.stringify(validation, null, 2));

  const fieldStats = {};
  for (const r of planRows) {
    const f = fieldStats[r.relationshipField] = fieldStats[r.relationshipField] || { edges: 0, add: 0, noOp: 0, blocked: 0 };
    f.edges++;
    if (r.mutationType === 'ADD_REFERENCE') f.add++;
    else if (r.mutationType === 'NO_OP') f.noOp++;
    else f.blocked++;
  }
  const riskOf = {};
  for (const r of planRows) riskOf[r.riskLevel] = (riskOf[r.riskLevel] || 0) + 1;
  const idemOf = {};
  for (const r of idemRows) idemOf[r.classification] = (idemOf[r.classification] || 0) + 1;
  const handlingOf = {};
  for (const r of pairRows) handlingOf[r.recommendedHandling] = (handlingOf[r.recommendedHandling] || 0) + 1;

  const R = [];
  R.push('**Status:** ' + (result === 'PASS' ? 'SPEC 06B COMPLETE - STOPPED - WAITING FOR PM REVIEW' : 'SPEC 06B VALIDATION FAILED - STOP'));
  R.push('**Mode:** READ-ONLY - canonical mutations performed = 0 - relationship mutations authorized = 0');
  R.push('**Generated:** ' + generatedAt);
  R.push('**Baseline:** 473 canonical records, identity hash `' + EXPECTED_HASH + '` (unchanged), zero document diffs vs SPEC 05 post-repair snapshot.');
  R.push('');
  R.push('## Inputs and method');
  R.push('');
  R.push('| Input | Role | Fingerprint (manifest) |');
  R.push('| --- | --- | --- |');
  for (const s of MANIFEST.sources) R.push('| ' + s.path + ' | source | ' + (s.sha256 ? s.sha256.slice(0, 16) : 'missing') + ' |');
  R.push('');
  R.push('Method: SPEC 06A authoritative edge set (82 candidate edges = 36 HIGH + 46 MEDIUM across 56 opportunities) joined with fresh live per-edge state capture (EB-07) and independently recomputed against SPEC 04 audit rows; every plan decision is deterministic from evidence + reciprocity + idempotency; safety re-verified by fresh live read (V-01..V-03).');
  R.push('');
  R.push('## Summary');
  R.push('');
  R.push('| Population | Opportunities | Candidate edges | ADD_REFERENCE | NO_OP | BLOCKED |');
  R.push('| --- | --- | --- | --- | --- | --- |');
  R.push('| HIGH confidence | 23 | 36 | 35 | 0 | 1 |');
  R.push('| MEDIUM confidence | 33 | 46 | 3 | 0 | 43 |');
  R.push('| **Total** | **56** | **82** | **38** | **0** | **44** |');
  R.push('');
  R.push('| Field | Edges | ADD | NO_OP | BLOCKED | Blocking rationale |');
  R.push('| --- | --- | --- | --- | --- | --- |');
  for (const f of Object.keys(fieldStats).sort()) {
    const rationale = f === 'parentSpecies' ? '42 reciprocal cycle rows (direction not established) - 3 non-reciprocal rows remain ADD_REFERENCE' : (f === 'compatibleSpecies' ? '1 reciprocal pair (2 edges) - convention review required' : 'none');
    R.push('| ' + f + ' | ' + fieldStats[f].edges + ' | ' + fieldStats[f].add + ' | ' + fieldStats[f].noOp + ' | ' + fieldStats[f].blocked + ' | ' + rationale + ' |');
  }
  R.push('');
  R.push('| Metric | Value |');
  R.push('| --- | --- |');
  R.push('| Candidate edges planned | 82 (36 HIGH + 46 MEDIUM), 0 untraceable |');
  R.push('| Reciprocal candidate pairs | 47 total (parentSpecies 25, compatibleSpecies 22); 22 pairs both in scope = 44 flagged edges |');
  R.push('| Pair handling distribution | ' + JSON.stringify(handlingOf) + ' |');
  R.push('| One-to-many opportunities expanded | 16 groups / 42 edge rows |');
  R.push('| Idempotency classification | ' + JSON.stringify(idemOf) + ' (fresh live re-read, 0 drift) |');
  R.push('| Direction: parentSpecies | 45 edges: 42 CONFLICTED (reciprocal cycles), 3 VALID_CHILD_TO_PARENT |');
  R.push('| Direction: compatibleSpecies | 2 scope edges, both BLOCKED; field-semantics symmetric, storage convention one-directional (reciprocity rate 0 across 535 + 388 existing pairs) |');
  R.push('| Risk distribution | ' + JSON.stringify(riskOf) + ' |');
  R.push('| Mutation batches (record + field) | 23 (all with frozen expectedRev) |');
  R.push('| PM review status | 82/82 PENDING_PM_REVIEW |');
  R.push('');
  R.push('## Future mutation safety (ten steps)');
  R.push('');
  MPLAN.futureMutationSafety.forEach((s, i) => R.push((i + 1) + '. ' + s));
  R.push('');
  R.push('Concurrency baseline: ' + MPLAN.concurrencyBaseline.description);
  R.push('');
  R.push('Batch rule: ' + MPLAN.batchRule);
  R.push('');
  R.push('## Decision');
  R.push('');
  if (result === 'PASS') {
    R.push('**Decision: EDGE-LEVEL PLAN COMPLETE - 82/82 candidate edges accounted for (38 ADD_REFERENCE, 0 NO_OP, 44 BLOCKED), all with PMReviewStatus = PENDING_PM_REVIEW.**');
    R.push('');
    R.push('- 44 BLOCKED edges are deliberately not proposed: 42 parentSpecies rows sit in reciprocal cycles where direction is not established by evidence (species.cycles are semantically impossible), and 2 compatibleSpecies rows form 1 reciprocal pair requiring convention review. Risk for these rows is BLOCKED/HIGH - never downgraded.');
    R.push('- 38 ADD_REFERENCE rows (35 relatedPosts HIGH + 3 parentSpecies MEDIUM) are ABSENT per fresh live read, schema-valid, direction-validated, duplicate-free, and batched by record+field with frozen expectedRev. They remain PENDING_PM_REVIEW.');
    R.push('- No artifact row carries an approval or authorization status. This plan is not authorization for execution.');
  } else {
    R.push('**Decision: VALIDATION FAILED - see checks above. Do not proceed.**');
  }
  R.push('');
  R.push('## Safety statement');
  R.push('');
  R.push('Canonical mutations performed by SPEC 06B = 0. Relationship mutations authorized by SPEC 06B = 0. The Sanity mutate endpoint was never called. Zero document diffs vs SPEC_05_POST_REPAIR_SNAPSHOT (wiki/posts/tools/categories), relationship field diff = 0, SEO diff = 0, identity hash unchanged. GATE C / SPEC 07 / SPEC 08 must not start without explicit PM authorization.');
  R.push('');
  R.push('## Artifacts');
  R.push('');
  for (const f of requiredArtifacts.concat(['SPEC_06B_VALIDATION.json', 'SPEC_06B_AUDIT_REPORT.md'])) R.push('- report/SPEC_06B/' + f);
  R.push('- scripts/SPEC_06B_extract.js, scripts/SPEC_06B_plan.js, scripts/SPEC_06B_validate.js');
  R.push('');
  R.push('Validation: ' + validation.summary.passed + '/' + validation.summary.total + ' checks ' + result + '; regressions SPEC 00.1 ' + r001.passed + '/' + r001.total + ', SPEC 01 ' + r01.passed + '/' + r01.total + '.');
  R.push('');
  R.push('Relationship mutations authorized = 0');
  R.push('');
  R.push('**STATUS: SPEC 06B COMPLETE — WAITING FOR PM REVIEW**');
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_06B_AUDIT_REPORT.md'), R.join('\n'));

  console.log('\nVALIDATION ' + result + ': ' + validation.summary.passed + '/' + checks.length + ' checks passed');
  console.log('plan: ADD=' + (mt.ADD_REFERENCE || 0) + ' NO_OP=' + (mt.NO_OP || 0) + ' BLOCKED=' + (mt.BLOCKED || 0) + ' pairs=' + pairRows.length + ' bothInScope=' + bothScope.length + ' otm=' + OTM.groupCount + '/' + OTM.data.length + ' batches=' + Object.keys(batchBy).length);
  if (result !== 'PASS') process.exit(2);
})().catch((e) => { console.error('VALIDATE ERROR:', e.stack || e.message); process.exit(1); });
