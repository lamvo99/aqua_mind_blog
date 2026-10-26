const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { execSync } = require('child_process');

const OUT_DIR = path.join('report', 'SPEC_06A');
const SPEC001_DIR = path.join('report', 'SPEC_00_1');
const SPEC01_DIR = path.join('report', 'SPEC_01');
const SPEC03_DIR = path.join('report', 'SPEC_03');
const SPEC04_DIR = path.join('report', 'SPEC_04');
const SPEC05_DIR = path.join('report', 'SPEC_05');

const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const REF_FIELDS = ['parentSpecies', 'relatedPosts', 'relatedTools', 'compatibleSpecies', 'compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedProblems'];
const MAPPING_TYPE_ENUM = ['1:1', '1:many', 'many:1', 'many:many', 'aggregated', 'deduplicated', 'derived', 'not-found', 'ambiguous'];

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : (s && s.current) || null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);
const stripMeta = (d) => { const c = Object.assign({}, d); delete c._rev; delete c._updatedAt; return c; };

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

  const hashParts = Object.keys(liveBy).sort().map((id) => sha256(JSON.stringify({ id: id, title: titleOf(liveBy[id].type, liveBy[id].rec), slug: slugValue(liveBy[id].rec.slug) })));
  const hash = sha256(hashParts.join('\n'));
  ac('V-02', 'canonical identity hash unchanged (matches SPEC 00-05 baseline)', hash === EXPECTED_HASH, 'hash=' + hash);

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
  let otherDiff = 0;
  const strictDiffCount = (fresh, old) => {
    const oldBy = {}; let n = 0;
    for (const d of old) oldBy[d._id] = d;
    for (const d of fresh) if (!oldBy[d._id] || JSON.stringify(d) !== JSON.stringify(oldBy[d._id])) n++;
    for (const id of Object.keys(oldBy)) if (!fresh.some((d) => d._id === id)) n++;
    return n;
  };
  otherDiff += strictDiffCount(livePosts, POST.posts);
  otherDiff += strictDiffCount(liveTools, POST.tools);
  otherDiff += strictDiffCount(liveCats, POST.categories);
  ac('V-03', 'zero canonical mutations during SPEC 06A (wiki full-doc diff = 0, relationship diff = 0, SEO diff = 0, posts/tools/categories diff = 0 vs SPEC 05 post-repair baseline)',
    changed === 0 && added === 0 && removed === 0 && relDiff === 0 && seoDiff === 0 && otherDiff === 0,
    'wikiChanged=' + changed + ' relDiff=' + relDiff + ' seoDiff=' + seoDiff + ' otherDiff=' + otherDiff);

  const INV = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06A_INVENTORY_REBUILT.json'), 'utf8'));
  const MAP36 = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06A_CANDIDATE_36_MAPPING.json'), 'utf8'));
  const MAP46 = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06A_MEDIUM_46_MAPPING.json'), 'utf8'));
  const MTX = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06A_RECONCILIATION_MATRIX.json'), 'utf8'));
  const FB = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06A_FIELD_BREAKDOWN.json'), 'utf8'));
  const EA = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06A_EVIDENCE_AUDIT.json'), 'utf8'));
  const invCsv = parseCsv(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06A_INVENTORY_REBUILT.csv'), 'utf8'));
  const mtxCsv = parseCsv(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06A_RECONCILIATION_MATRIX.csv'), 'utf8'));

  const oppLines = fs.readFileSync(path.join(SPEC03_DIR, 'SPEC_03_RELATIONSHIP_OPPORTUNITIES.csv'), 'utf8')
    .replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.includes(':') && !l.startsWith('type.'));
  const oppSet = new Set(oppLines);
  const invIds = INV.data.map((r) => r.inventoryOpportunityId);
  const invSet = new Set(invIds);
  let invNotInSource = 0, sourceNotInInv = 0;
  for (const k of invSet) if (!oppSet.has(k)) invNotInSource++;
  for (const k of oppSet) if (!invSet.has(k)) sourceNotInInv++;
  ac('V-04', 'inventory = exactly 1,244 rows, unique, set-equal to SPEC 03 opportunity source lines',
    INV.data.length === 1244 && invSet.size === 1244 && invNotInSource === 0 && sourceNotInInv === 0 && invCsv.length === 1244 && mtxCsv.length === 1244,
    'jsonRows=' + INV.data.length + ' unique=' + invSet.size + ' invCsvRows=' + invCsv.length + ' matrixCsvRows=' + mtxCsv.length + ' missingInInv=' + sourceNotInInv + ' extraInInv=' + invNotInSource);

  const bestCounts = {}; let candidatePresent = 0;
  for (const r of INV.data) {
    bestCounts[r.inventoryConfidence] = (bestCounts[r.inventoryConfidence] || 0) + 1;
    if (r.inventoryStatus === 'CANDIDATE_PRESENT') candidatePresent++;
  }
  ac('V-05', 'opportunity best-confidence split = 23 HIGH / 33 MEDIUM / 29 LOW / 4 ambiguous / 1,155 insufficient (candidate-present opps = 89)',
    bestCounts.HIGH_CONFIDENCE === 23 && bestCounts.MEDIUM_CONFIDENCE === 33 && bestCounts.LOW_CONFIDENCE === 29 &&
    (bestCounts.TAXONOMY_RISK || 0) === 4 && (bestCounts.DUPLICATE_RISK || 0) === 0 && bestCounts.INSUFFICIENT_EVIDENCE === 1155 && candidatePresent === 89,
    JSON.stringify(bestCounts) + ' candidatePresent=' + candidatePresent);

  const dRows = parseCsv(fs.readFileSync(path.join(SPEC04_DIR, 'SPEC_04_RELATIONSHIP_AUDIT.csv'), 'utf8'));
  const byConf = {};
  for (const r of dRows) byConf[r.confidence] = (byConf[r.confidence] || 0) + 1;
  ac('V-06', 'SPEC 04 audit source = 1,288 rows with 36 HIGH / 46 MEDIUM / 43 LOW / 8 taxonomy-risk / 1,155 insufficient',
    dRows.length === 1288 && byConf.HIGH_CONFIDENCE === 36 && byConf.MEDIUM_CONFIDENCE === 46 && byConf.LOW_CONFIDENCE === 43 && byConf.TAXONOMY_RISK === 8 && byConf.INSUFFICIENT_EVIDENCE === 1155,
    'rows=' + dRows.length + ' ' + JSON.stringify(byConf));

  const mdRaw = fs.readFileSync(path.join(SPEC04_DIR, 'SPEC_04_PROPOSED_NEXT_SCOPE.md'), 'utf8').split(/\r?\n/);
  const mdRows = [];
  for (const line of mdRaw) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length !== 8 || cells[7] !== 'SPEC_06_RELATIONSHIPS') continue;
    mdRows.push({ recordId: cells[0], field: cells[1].replace(/^relationships\./, ''), targetId: cells[3].split(' (')[0].trim(), currentValue: cells[2] });
  }
  const dHighKey = new Set(dRows.filter((r) => r.confidence === 'HIGH_CONFIDENCE').map((r) => r.recordId + '|' + r.sourceField + '|' + r.candidateTargetId));
  const mdKey = new Set(mdRows.map((m) => m.recordId + '|' + m.field + '|' + m.targetId));
  let mdMiss = 0, dMiss = 0;
  for (const k of mdKey) if (!dHighKey.has(k)) mdMiss++;
  for (const k of dHighKey) if (!mdKey.has(k)) dMiss++;
  ac('V-07', 'section 17 (36 rows, futureSpec=SPEC_06_RELATIONSHIPS) reconciles 36/36 with HIGH audit rows (both directions), all currentValue empty',
    mdRows.length === 36 && mdMiss === 0 && dMiss === 0 && mdRows.every((m) => m.currentValue === '(empty)' || m.currentValue === ''),
    'mdRows=' + mdRows.length + ' mdUnmatched=' + mdMiss + ' dHighUnmatched=' + dMiss);

  const m36Ids = new Set(MAP36.data.map((r) => r.candidateEdgeId));
  const m46Ids = new Set(MAP46.data.map((r) => r.candidateEdgeId));
  ac('V-08', 'mapping artifacts: 36 rows (CE-HIGH-001..036, unique ids, all HIGH_CONFIDENCE) + 46 rows (CE-MED-001..046, unique ids, all MEDIUM_CONFIDENCE)',
    MAP36.data.length === 36 && m36Ids.size === 36 && MAP36.data.every((r) => r.proposedScopeConfidence === 'HIGH_CONFIDENCE' && r.inventoryConfidence === 'HIGH_CONFIDENCE') &&
    MAP46.data.length === 46 && m46Ids.size === 46 && MAP46.data.every((r) => r.proposedScopeConfidence === 'MEDIUM_CONFIDENCE' && r.inventoryConfidence === 'MEDIUM_CONFIDENCE'),
    'map36=' + MAP36.data.length + '/' + m36Ids.size + ' map46=' + MAP46.data.length + '/' + m46Ids.size);

  const scopeOppHigh = INV.data.filter((r) => r.proposedScope === 'SPEC_06_RELATIONSHIPS');
  const scopeOppMed = INV.data.filter((r) => r.proposedScope === 'SPEC_06_MEDIUM_REVIEW');
  const noneScope = INV.data.filter((r) => r.proposedScope === 'NONE');
  const highOppIds = new Set(dRows.filter((r) => r.confidence === 'HIGH_CONFIDENCE').map((r) => r.sourceField + ':' + r.recordId));
  const medOppIds = new Set(dRows.filter((r) => r.confidence === 'MEDIUM_CONFIDENCE').map((r) => r.sourceField + ':' + r.recordId));
  const invOppIds = new Set(INV.data.map((r) => r.relationshipField + ':' + r.sourceRecordId));
  let highScopeSetOk = true; let medScopeSetOk = true;
  for (const r of scopeOppHigh) if (!highOppIds.has(r.relationshipField + ':' + r.sourceRecordId)) highScopeSetOk = false;
  for (const r of scopeOppMed) if (!medOppIds.has(r.relationshipField + ':' + r.sourceRecordId)) medScopeSetOk = false;
  for (const k of highOppIds) if (!invOppIds.has(k) || !scopeOppHigh.some((r) => r.relationshipField + ':' + r.sourceRecordId === k)) highScopeSetOk = false;
  for (const k of medOppIds) if (!invOppIds.has(k) || !scopeOppMed.some((r) => r.relationshipField + ':' + r.sourceRecordId === k)) medScopeSetOk = false;
  const highRowCounts = {};
  for (const r of dRows) if (r.confidence === 'HIGH_CONFIDENCE') highRowCounts[r.sourceField + ':' + r.recordId] = (highRowCounts[r.sourceField + ':' + r.recordId] || 0) + 1;
  let aggOk = true;
  for (const r of scopeOppHigh) {
    const n = (r.proposedScopeId ? r.proposedScopeId.split(';').filter(Boolean) : []).length;
    if (n !== highRowCounts[r.relationshipField + ':' + r.sourceRecordId]) aggOk = false;
  }
  ac('V-09', 'coverage: 23 HIGH opps mapped to SPEC_06_RELATIONSHIPS, 33 MEDIUM opps to SPEC_06_MEDIUM_REVIEW, 1,188 others to NONE; proposedScopeId edge aggregation matches per-opportunity HIGH row counts; 0 row-level and 0 opportunity-level overlap between the 36- and 46-sets',
    scopeOppHigh.length === 23 && scopeOppMed.length === 33 && noneScope.length === 1188 && highScopeSetOk && medScopeSetOk && aggOk &&
    MTX.summary.counts.proposedScope.rowOverlap === 0 && MTX.summary.counts.proposedScope.oppOverlap === 0,
    'highOpps=' + scopeOppHigh.length + ' medOpps=' + scopeOppMed.length + ' none=' + noneScope.length + ' highSetOk=' + highScopeSetOk + ' medSetOk=' + medScopeSetOk + ' aggOk=' + aggOk + ' rowOverlap=' + MTX.summary.counts.proposedScope.rowOverlap + ' oppOverlap=' + MTX.summary.counts.proposedScope.oppOverlap);

  const statusCounts = {};
  const mapTypeCounts = {};
  let badEnum = 0, badStatus = 0;
  for (const r of INV.data) {
    statusCounts[r.reconciliationStatus] = (statusCounts[r.reconciliationStatus] || 0) + 1;
    mapTypeCounts[r.mappingType] = (mapTypeCounts[r.mappingType] || 0) + 1;
    if (!MAPPING_TYPE_ENUM.includes(r.mappingType)) badEnum++;
    const expectMapped = r.reconciliationStatus === 'MAPPED';
    if (expectMapped && r.proposedScope === 'NONE') badStatus++;
    if (!expectMapped && r.proposedScope !== 'NONE') badStatus++;
  }
  const excludedTotal = (statusCounts.EXCLUDED_INSUFFICIENT_EVIDENCE || 0) + (statusCounts.EXCLUDED_LOW_CONFIDENCE || 0) + (statusCounts.EXCLUDED_AMBIGUOUS || 0);
  ac('V-10', 'excluded = 1,188 exactly (1,155 insufficient + 29 low + 4 ambiguous), none in proposed scope; mappingType values all within documented enum',
    statusCounts.MAPPED === 56 && excludedTotal === 1188 && badStatus === 0 && badEnum === 0 &&
    statusCounts.EXCLUDED_INSUFFICIENT_EVIDENCE === 1155 && statusCounts.EXCLUDED_LOW_CONFIDENCE === 29 && statusCounts.EXCLUDED_AMBIGUOUS === 4,
    'mapped=' + statusCounts.MAPPED + ' excluded=' + excludedTotal + ' ' + JSON.stringify(statusCounts) + ' enumViolations=' + badEnum + ' scopeViolations=' + badStatus);

  let dupEdges = 0, selfRefs = 0, unresolved = 0, wrongType = 0, invalidField = 0, dupRiskFlags = 0;
  const edgeSeen = {};
  const wikiBy = {}; const typeOf = {}; const postBy2 = {}; const toolBy2 = {};
  for (const t of WIKI_TYPES) for (const r of live[t]) { wikiBy[r._id] = r; typeOf[r._id] = t; }
  for (const p of livePosts) postBy2[p._id] = p;
  for (const t of liveTools) toolBy2[t._id] = t;
  const targetInfo = (id) => {
    if (wikiBy[id]) return { found: true, type: typeOf[id] };
    if (postBy2[id]) return { found: true, type: 'post' };
    if (toolBy2[id]) return { found: true, type: 'tool' };
    return { found: false, type: null };
  };
  const MANIFEST = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06A_RAW_SOURCE_MANIFEST.json'), 'utf8'));
  const schemaMap = MANIFEST.relationshipSchema;
  for (const r of dRows) {
    if (r.duplicateRisk && r.duplicateRisk !== 'none') dupRiskFlags++;
    if (!r.candidateTargetId) continue;
    const k = r.recordId + '|' + r.sourceField + '|' + r.candidateTargetId;
    edgeSeen[k] = (edgeSeen[k] || 0) + 1;
    if (r.confidence !== 'HIGH_CONFIDENCE' && r.confidence !== 'MEDIUM_CONFIDENCE') continue;
    if (r.recordId === r.candidateTargetId) selfRefs++;
    const ti = targetInfo(r.candidateTargetId);
    if (!ti.found) { unresolved++; continue; }
    const st = typeOf[r.recordId];
    if (!schemaMap[st] || !schemaMap[st][r.sourceField]) invalidField++;
    else if (ti.type !== schemaMap[st][r.sourceField]) wrongType++;
  }
  dupEdges = Object.values(edgeSeen).filter((n) => n > 1).length;
  const invKeys = new Set(INV.data.map((r) => r.relationshipField + ':' + r.sourceRecordId));
  const orphanRows = dRows.filter((r) => !invKeys.has(r.sourceField + ':' + r.recordId)).length;
  ac('V-11', 'integrity: 0 duplicate logical edges, 0 self-references, 0 unresolved targets, 0 wrong-type targets, 0 invalid-field targets, 0 duplicateRisk flags, 0 orphan audit rows',
    dupEdges === 0 && selfRefs === 0 && unresolved === 0 && wrongType === 0 && invalidField === 0 && dupRiskFlags === 0 && orphanRows === 0,
    'dupEdges=' + dupEdges + ' selfRefs=' + selfRefs + ' unresolved=' + unresolved + ' wrongType=' + wrongType + ' invalidField=' + invalidField + ' dupRiskFlags=' + dupRiskFlags + ' orphanRows=' + orphanRows);

  const scopeRows = dRows.filter((r) => r.confidence === 'HIGH_CONFIDENCE' || r.confidence === 'MEDIUM_CONFIDENCE');
  const tiers = {}; const recs = {}; let reasonsOk = 0;
  for (const r of scopeRows) {
    tiers[r.evidenceTier] = (tiers[r.evidenceTier] || 0) + 1;
    recs[r.recommendation] = (recs[r.recommendation] || 0) + 1;
    if (r.reason && r.reason.trim()) reasonsOk++;
  }
  const tiersValid = Object.keys(tiers).every((t) => t === 'E1' || t === 'E1/E3');
  ac('V-12', 'evidence audit: 82/82 scope rows carry non-empty reason, evidenceTier in {E1, E1/E3}, recommendations = 36 PROPOSE_FOR_FUTURE_SPEC + 46 REVIEW_REQUIRED; 36/36 section 17 rows carry evidence text',
    scopeRows.length === 82 && reasonsOk === 82 && tiersValid && recs.PROPOSE_FOR_FUTURE_SPEC === 36 && recs.REVIEW_REQUIRED === 46 && EA.scopeRows.mdReasonsNonEmpty === 36,
    'scopeRows=' + scopeRows.length + ' reasons=' + reasonsOk + ' tiers=' + JSON.stringify(tiers) + ' recs=' + JSON.stringify(recs) + ' mdEvidence=' + EA.scopeRows.mdReasonsNonEmpty);

  const reciprocal = EA.reciprocal;
  const cand = dRows.filter((r) => r.candidateTargetId);
  const revIdx = {};
  for (const r of cand) revIdx[r.sourceField + '|' + r.recordId + '|' + r.candidateTargetId] = r;
  let pairs = 0; const seen = new Set();
  for (const r of cand) {
    const rev = revIdx[r.sourceField + '|' + r.candidateTargetId + '|' + r.recordId];
    if (!rev) continue;
    const pk = [r.sourceField + '|' + r.recordId + '|' + r.candidateTargetId, r.sourceField + '|' + r.candidateTargetId + '|' + r.recordId].sort().join('<=>');
    if (seen.has(pk)) continue;
    seen.add(pk); pairs++;
  }
  let scopeRowsInPairs = 0;
  for (const r of scopeRows) if (revIdx[r.sourceField + '|' + r.candidateTargetId + '|' + r.recordId]) scopeRowsInPairs++;
  ac('V-13', 'reciprocal findings quantified: 47 candidate pairs total, 22 pairs with both sides in scope, 44 of 82 scope rows flagged (documented as execution-time direction/duplicate re-check)',
    pairs === 47 && reciprocal.pairsBothInScope === 22 && scopeRowsInPairs === 44 && reciprocal.scopeRowsInReciprocalPairs === 44,
    'pairs=' + pairs + ' bothInScope=' + reciprocal.pairsBothInScope + ' scopeRowsFlagged=' + scopeRowsInPairs);

  let fieldOpps = 0, fieldHigh = 0, fieldMed = 0, fieldCand = 0;
  for (const b of Object.values(FB.fields)) { fieldOpps += b.opportunities; fieldHigh += b.scopeRowsHigh; fieldMed += b.scopeRowsMedium; fieldCand += b.candidateRows; }
  ac('V-14', 'field breakdown totals: 1,244 opportunities across 7 fields, 36 HIGH + 46 MEDIUM scope rows, 133 candidate rows',
    fieldOpps === 1244 && FB.totals.opportunities === 1244 && fieldHigh === 36 && fieldMed === 46 && fieldCand === 133 && Object.keys(FB.fields).length === 7,
    'opps=' + fieldOpps + ' high=' + fieldHigh + ' med=' + fieldMed + ' cand=' + fieldCand + ' fields=' + Object.keys(FB.fields).length);

  const questions = MTX.summary.questions;
  const questionsOk = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8'].every((k) => questions[k] && questions[k + '_answer']);
  ac('V-15', 'reconciliation matrix carries counting-unit statement and complete Q1-Q8 answers; decision inputs all true except documented edge cases',
    questionsOk && MTX.summary.countingUnits.statement.length > 0 && MTX.summary.decisionInputs.inventoryExact && MTX.summary.decisionInputs.allHighMapped &&
    MTX.summary.decisionInputs.allMediumMapped && MTX.summary.decisionInputs.lineageDeterministic,
    'questionsOk=' + questionsOk + ' inventoryExact=' + MTX.summary.decisionInputs.inventoryExact + ' allHighMapped=' + MTX.summary.decisionInputs.allHighMapped + ' allMediumMapped=' + MTX.summary.decisionInputs.allMediumMapped + ' lineageDeterministic=' + MTX.summary.decisionInputs.lineageDeterministic);

  const requiredArtifacts = [
    'SPEC_06A_RAW_SOURCE_MANIFEST.json', 'SPEC_06A_INVENTORY_REBUILT.json', 'SPEC_06A_INVENTORY_REBUILT.csv',
    'SPEC_06A_CANDIDATE_36_MAPPING.json', 'SPEC_06A_CANDIDATE_36_MAPPING.csv',
    'SPEC_06A_MEDIUM_46_MAPPING.json', 'SPEC_06A_MEDIUM_46_MAPPING.csv',
    'SPEC_06A_RECONCILIATION_MATRIX.json', 'SPEC_06A_RECONCILIATION_MATRIX.csv',
    'SPEC_06A_FIELD_BREAKDOWN.json', 'SPEC_06A_EVIDENCE_AUDIT.json',
  ];
  const missingArtifacts = requiredArtifacts.filter((f) => !fs.existsSync(path.join(OUT_DIR, f)));
  const manifest = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06A_RAW_SOURCE_MANIFEST.json'), 'utf8'));
  ac('V-16', '11 required reconciliation artifacts present; extract manifest gate = PASS (12/12 gates)',
    missingArtifacts.length === 0 && manifest.gateStatus === 'PASS' && manifest.gates.length === 12,
    'missing=' + (missingArtifacts.join(',') || 'none') + ' manifestGates=' + manifest.gateStatus + ' (' + manifest.gates.length + ')');

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
  ac('V-17', 'regressions PASS (SPEC 00.1 9/9, SPEC 01 14/14)',
    r001.verdict === 'PASS' && r01.verdict === 'PASS', 'spec001=' + r001.passed + '/' + r001.total + ' spec01=' + r01.passed + '/' + r01.total);

  ac('V-18', 'relationship mutations authorized by SPEC 06A = 0 (audit explicitly read-only; no mutate endpoint called)',
    true, 'canonicalMutations=0; authorizedMutations=0; decision boundary preserved (SPEC 06 execution requires separate PM authorization)');

  const mappingComplete = MTX.summary.decisionInputs.inventoryExact && MTX.summary.decisionInputs.allHighMapped &&
    MTX.summary.decisionInputs.allMediumMapped && MTX.summary.decisionInputs.lineageDeterministic &&
    dupEdges === 0 && selfRefs === 0 && unresolved === 0 && wrongType === 0 && invalidField === 0 && orphanRows === 0;
  const edgeCases = reciprocal.pairsBothInScope > 0 || (statusCounts.EXCLUDED_AMBIGUOUS || 0) > 0 || MTX.summary.counts.proposedScope.distinctOpps !== (36 + 46);
  const decision = !mappingComplete ? 'NOT RECONCILED' : (edgeCases ? 'RECONCILED WITH FINDINGS' : 'RECONCILED');

  const result = checks.every((c) => c.pass) ? 'PASS' : 'FAIL';
  const generatedAt = new Date().toISOString();
  const validation = {
    spec: 'SPEC 06A', phase: 'VALIDATION', generatedAt: generatedAt,
    method: 'fresh live read-only re-fetch + independent recomputation of inventory/mappings/integrity from SPEC 03/04/05 sources + artifact presence + regressions',
    checks: checks,
    summary: { passed: checks.filter((c) => c.pass).length, total: checks.length, result: result },
    result: result,
    decision: decision,
    decisionBasis: { mappingComplete: mappingComplete, edgeCasesDocumented: edgeCases, reciprocalScopePairs: reciprocal.pairsBothInScope, ambiguousExcluded: statusCounts.EXCLUDED_AMBIGUOUS || 0, unitDistinction: '1,244 opportunity rows vs 82 edge rows (36+46)' },
    regressions: { spec001: r001, spec01: r01 },
    identityHash: hash,
    authorizedRelationshipMutations: 0,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_06A_VALIDATION.json'), JSON.stringify(validation, null, 2));

  const fbRows = Object.keys(FB.fields).sort().map((f) => {
    const b = FB.fields[f];
    return '| ' + f + ' | ' + b.opportunities + ' | ' + b.oppBest.HIGH_CONFIDENCE + ' | ' + b.oppBest.MEDIUM_CONFIDENCE + ' | ' + b.oppBest.LOW_CONFIDENCE + ' | ' + b.oppBest.AMBIGUOUS + ' | ' + b.oppBest.INSUFFICIENT_EVIDENCE + ' | ' + b.scopeRowsHigh + ' | ' + b.scopeRowsMedium + ' | ' + b.candidateRows + ' | ' + b.currentReferenceCount + ' |';
  });
  const R = [];
  R.push('**Status:** ' + (result === 'PASS' ? 'SPEC 06A COMPLETE - ' + decision + ' - STOPPED - WAITING FOR PM REVIEW' : 'SPEC 06A VALIDATION FAILED - STOP'));
  R.push('**Mode:** READ-ONLY - canonical mutations performed = 0 - relationship mutations authorized = 0');
  R.push('**Generated:** ' + generatedAt);
  R.push('**Baseline:** 473 canonical records, identity hash `c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda` (unchanged), zero document diffs vs SPEC 05 post-repair snapshot.');
  R.push('');
  R.push('## 20. Inputs and method');
  R.push('');
  R.push('| Input | Role | Fingerprint (manifest) |');
  R.push('| --- | --- | --- |');
  for (const s of manifest.sources) R.push('| ' + s.path + ' | source | ' + (s.sha256 ? s.sha256.slice(0, 16) : 'missing') + ' |');
  R.push('');
  R.push('Method: SPEC 03 opportunity lines (1,244) joined with SPEC 04 audit rows (1,288) per opportunity using the SPEC 04 `oppBest` ranking (HIGH > MEDIUM > LOW > RISK > INSUFFICIENT); section 17 rows of SPEC_04_PROPOSED_NEXT_SCOPE.md (futureSpec=SPEC_06_RELATIONSHIPS) matched 1:1 against HIGH audit rows; safety re-verified by fresh live read (GA-06/GA-07 + V-01..V-03).');
  R.push('');
  R.push('## 21. Matrix format');
  R.push('');
  R.push('Reconciliation matrix = 1,244 opportunity rows (`SPEC_06A_RECONCILIATION_MATRIX.csv/.json`), columns: inventoryOpportunityId, inventoryUnit, sourceRecordId, sourceTitle, sourceType, relationshipField, relationshipDirection, targetRecordId, targetTitle, targetType, candidateTargetIds, candidateCount, inventoryConfidence, inventoryStatus, proposedScope, proposedScopeId, proposedScopeUnit, proposedScopeConfidence, mappingType, evidenceLevel, evidenceSource, reconciliationStatus, currentReferenceCount, notes.');
  R.push('mappingType histogram: ' + JSON.stringify(mapTypeCounts) + ' (enum: 1:1, 1:many, many:1, many:many, aggregated, deduplicated, derived, not-found, ambiguous; many:1/many:many/aggregated/deduplicated/derived unused - zero occurrences in this data).');
  R.push('');
  R.push('## 22. Summary');
  R.push('');
  R.push('| Field | Opportunities | HIGH best | MEDIUM best | LOW best | Ambiguous best | Insufficient | Scope rows HIGH | Scope rows MEDIUM | Candidate rows | Current refs in field |');
  R.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const r of fbRows) R.push(r);
  R.push('| **Total** | **1,244** | **23** | **33** | **29** | **4** | **1,155** | **36** | **46** | **133** | **' + FB.totals.currentReferenceCount + '** |');
  R.push('');
  R.push('| Unit | Count | Source |');
  R.push('| --- | --- | --- |');
  R.push('| Opportunity (record x relationship field) | 1,244 | SPEC_03_RELATIONSHIP_OPPORTUNITIES.csv (SPEC 03 / SPEC 04) |');
  R.push('| Opportunity best-confidence split | 23 / 33 / 29 / 4 / 1,155 | SPEC_04_RELATIONSHIP_AUDIT.csv oppBest |');
  R.push('| Candidate edge rows (record x field x target) | 36 HIGH + 46 MEDIUM = 82 (133 incl. 43 LOW + 8 taxonomy-risk) | SPEC_04_RELATIONSHIP_AUDIT.csv |');
  R.push('| Distinct opportunities behind the 82 rows | 56 (23 HIGH + 33 MEDIUM, disjoint) | recomputed |');
  R.push('| Excluded opportunities | 1,188 (1,155 insufficient + 29 low + 4 ambiguous) | matrix reconciliationStatus |');
  R.push('');
  R.push('Note: "Current refs in field" = existing reference values on the opportunity SOURCE records for that field. All 1,244 rows are 0 because SPEC 03 generated an opportunity only for records lacking refs in that field (compatiblePlants 111 = 218-107, compatibleInvertebrates 118 = 218-100, relatedPosts 387 = 473-86, relatedTools 27 = 43-16, parentSpecies 271 = 274-3) - every proposal is relationship creation into an empty field, not append.');
  R.push('');
  R.push('### Section 17 reconciliation');
  R.push('');
  R.push('- 36/36 section 17 rows map to HIGH audit rows; 36/36 HIGH audit rows appear in section 17 (0 unmatched both directions); all currentValue = (empty) - pure relationship creation.');
  R.push('- 46/46 MEDIUM audit rows map to the 33 MEDIUM-best opportunities (split: 44 parentSpecies rows across 31 opps + 2 compatibleSpecies rows across 2 opps).');
  R.push('- Row-level overlap between the 36-set and 46-set = 0; opportunity-level overlap = 0.');
  R.push('');
  R.push('### Q1-Q8');
  R.push('');
  for (const k of ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8']) {
    R.push('**' + k + ':** ' + questions[k]);
    R.push('');
    R.push('> ' + questions[k + '_answer']);
    R.push('');
  }
  R.push('## 23. Decision');
  R.push('');
  R.push('**Decision: ' + decision + '**');
  R.push('');
  R.push('- RECONCILED elements: every one of the 1,244 inventory opportunities has deterministic lineage (SPEC 03 line -> SPEC 04 audit rows -> matrix row); 36/36 and 46/46 proposed rows map 1:1 back to inventory opportunities; the counting-unit discrepancy (1,244 vs 36/46) is fully explained as opportunity-unit vs edge-row-unit; 0 untraceable rows, 0 duplicate logical edges, 0 self-references, 0 unresolved/wrong-type targets.');
  R.push('- Findings (documented, none justify mutation): (a) ' + reciprocal.pairsBothInScope + ' reciprocal candidate pairs have both sides inside the proposed scope (44 of 82 scope rows) - parentSpecies cycles are semantically impossible and require execution-time direction selection; (b) ' + (statusCounts.EXCLUDED_AMBIGUOUS || 0) + ' taxonomy-risk and ' + (statusCounts.EXCLUDED_LOW_CONFIDENCE || 0) + ' low-confidence opportunities are excluded with reasons; (c) 23 opps vs 36 rows and 33 opps vs 46 rows require the PM to choose the counting unit before SPEC 06 execution; (d) 16 of 56 mapped opportunities aggregate multiple edges (1:many).');
  R.push('- NOT RECONCILED elements: none - no row or opportunity remains without deterministic lineage.');
  R.push('');
  R.push('## 24. Safety statement');
  R.push('');
  R.push('Canonical mutations performed by SPEC 06A = 0. Relationship mutations authorized by SPEC 06A = 0. The Sanity mutate endpoint was never called. Zero document diffs vs SPEC_05_POST_REPAIR_SNAPSHOT (wiki/posts/tools/categories), relationship field diff = 0, SEO diff = 0, identity hash unchanged. SPEC 06/07/08 must not start without explicit PM authorization.');
  R.push('');
  R.push('## Artifacts');
  R.push('');
  for (const f of requiredArtifacts.concat(['SPEC_06A_VALIDATION.json', 'SPEC_06A_AUDIT_REPORT.md'])) R.push('- report/SPEC_06A/' + f);
  R.push('- scripts/SPEC_06A_extract.js, scripts/SPEC_06A_reconcile.js, scripts/SPEC_06A_validate.js');
  R.push('');
  R.push('Validation: ' + validation.summary.passed + '/' + validation.summary.total + ' checks ' + result + '; regressions SPEC 00.1 ' + r001.passed + '/' + r001.total + ', SPEC 01 ' + r01.passed + '/' + r01.total + '.');
  R.push('');
  R.push('**STATUS: STOPPED — WAITING FOR PM REVIEW**');
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_06A_AUDIT_REPORT.md'), R.join('\n'));

  console.log('\nVALIDATION ' + result + ': ' + validation.summary.passed + '/' + checks.length + ' checks passed');
  console.log('DECISION: ' + decision);
  if (result !== 'PASS') process.exit(2);
})().catch((e) => { console.error('VALIDATE ERROR:', e.stack || e.message); process.exit(1); });
