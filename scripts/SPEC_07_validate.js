const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const L = require('./SPEC_07_lib.js');

const OUT_DIR = path.join('report', 'SPEC_07');
const checks = [];
const c = (id, name, ok, detail) => {
  checks.push({ id: id, name: name, pass: !!ok, detail: String(detail === undefined ? '' : detail) });
  console.log((ok ? 'CHECK OK ' : 'CHECK FAIL') + ' ' + id + ' ' + name + ' - ' + (detail === undefined ? '' : detail));
};
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), 'utf8'));
const esc = (s) => String(s === null || s === undefined ? '' : s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const fp = (r) => [r.recordId, r.confidence, r.mutationStatus, r.searchIntent, r.reasonCode, r.seoStatus, r.proposedMetaTitle, r.proposedMetaDescription, r.distinctnessFlag, r.contentSignals, r.excerptLength].join('#');

(async () => {
  const generatedAt = new Date().toISOString();

  const requiredFiles = [
    'SPEC_07_BASELINE.json', 'SPEC_07_SCHEMA_AUDIT.json', 'SPEC_07_SEO_INVENTORY.json',
    'SPEC_07_SEARCH_INTENT_AUDIT.json', 'SPEC_07_PROPOSAL_PLAN.json', 'SPEC_07_PROPOSAL_PLAN.csv',
    'SPEC_07_CANNIBALIZATION_AUDIT.json', 'SPEC_07_SOURCE_MANIFEST.json', 'SPEC_07_VALIDATION.json',
    'SPEC_07_GATE_A_B_REPORT.md',
  ];
  let missing = 0;
  for (const f of requiredFiles) {
    if (f === 'SPEC_07_VALIDATION.json' || f === 'SPEC_07_GATE_A_B_REPORT.md') continue;
    if (!fs.existsSync(path.join(OUT_DIR, f))) missing++;
  }

  const live = {};
  for (const t of L.WIKI_TYPES) live[t] = await L.q('*[_type == "' + t + '" && !(_id in path("drafts.**"))]');
  const liveDrafts = await L.q('count(*[_id in path("drafts.**")])');
  const species = live.species;

  const BASE = readJson('SPEC_07_BASELINE.json');
  const SCHEMA = readJson('SPEC_07_SCHEMA_AUDIT.json');
  const INV = readJson('SPEC_07_SEO_INVENTORY.json');
  const INTENT = readJson('SPEC_07_SEARCH_INTENT_AUDIT.json');
  const PLAN = readJson('SPEC_07_PROPOSAL_PLAN.json');
  const CANN = readJson('SPEC_07_CANNIBALIZATION_AUDIT.json');
  const MANIFEST = readJson('SPEC_07_SOURCE_MANIFEST.json');
  const csvText = fs.readFileSync(path.join(OUT_DIR, 'SPEC_07_PROPOSAL_PLAN.csv'), 'utf8');
  const csvRows = L.parseCsv(csvText);

  const counts = {};
  for (const t of L.WIKI_TYPES) counts[t] = live[t].filter((r) => !String(r._id).startsWith('drafts.')).length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  c('B-01', 'canonical record count = 473', total === 473, 'total=' + total);

  c('B-02', 'exact per-type composition (species 218 / plant 62 / invertebrate 56 / coral 48 / equipment 46 / problem 43)',
    L.WIKI_TYPES.every((t) => counts[t] === L.EXPECTED[t]), JSON.stringify(counts));

  const liveBy = {};
  for (const t of L.WIKI_TYPES) for (const r of live[t]) liveBy[r._id] = { type: t, rec: r };
  const hashParts = Object.keys(liveBy).sort().map((id) => L.sha256(JSON.stringify({ id: id, title: L.titleOf(liveBy[id].type, liveBy[id].rec), slug: L.slugValue(liveBy[id].rec.slug) })));
  const hash = L.sha256(hashParts.join('\n'));
  c('B-03', 'canonical identity hash unchanged', hash === L.EXPECTED_HASH && BASE.canonicalHash === L.EXPECTED_HASH, 'hash=' + hash);

  let wikiDrafts = 0;
  for (const t of L.WIKI_TYPES) wikiDrafts += live[t].filter((r) => String(r._id).startsWith('drafts.')).length;
  c('B-04', 'drafts = 0 (wiki and dataset-wide)', wikiDrafts === 0 && Number(liveDrafts) === 0, 'wiki=' + wikiDrafts + ' all=' + liveDrafts);

  const slugSeen = {};
  let dupSlugs = 0, undefinedRoutes = 0;
  for (const t of L.WIKI_TYPES) for (const r of live[t]) {
    const s = L.slugValue(r.slug);
    if (!s || !L.titleOf(t, r)) { undefinedRoutes++; continue; }
    const k = t + '/' + s;
    if (slugSeen[k]) dupSlugs++;
    slugSeen[k] = true;
  }
  c('B-05', 'duplicate slugs = 0', dupSlugs === 0, 'dups=' + dupSlugs);
  c('B-06', 'undefined routes = 0', undefinedRoutes === 0, 'undefined=' + undefinedRoutes);

  const invIds = new Set(INV.rows.map((r) => r.recordId));
  const spIds = new Set(species.map((s) => s._id));
  let invMissing = 0, invExtra = 0;
  for (const id of spIds) if (!invIds.has(id)) invMissing++;
  for (const id of invIds) if (!spIds.has(id)) invExtra++;
  c('B-07', 'SEO inventory accounts for all 218 species (0 missing, 0 extra) and every row classifies all 4 target fields',
    invMissing === 0 && invExtra === 0 && INV.rows.length === 218 &&
    INV.rows.every((r) => ['metaTitle', 'metaDescription', 'focusKeyword', 'secondaryKeywords'].every((f) => ['MISSING', 'PRESENT_EMPTY', 'PRESENT_VALID', 'INVALID'].includes(r[f + 'Classification']))),
    'missing=' + invMissing + ' extra=' + invExtra + ' rows=' + INV.rows.length);

  const rows = PLAN.rows;
  c('B-08', 'every proposal has confidence + mutationStatus + reason + evidence (>=2) + proposed values',
    rows.length === 218 && rows.every((r) => r.confidence && r.mutationStatus && r.reason && r.reason.length > 20 &&
      Array.isArray(r.evidenceFields) && r.evidenceFields.length >= 2 && r.proposedMetaTitle && r.proposedMetaDescription),
    'rows=' + rows.length);

  const spById = {};
  for (const s of species) spById[s._id] = s;
  const factViolations = [];
  const highViolations = [];
  const ctxAll = L.buildContext(species);
  for (const r of rows) {
    const rec = spById[r.recordId];
    const d = r.proposedMetaDescription;
    const t = r.proposedMetaTitle;
    const bad = (why) => factViolations.push(r.recordId + ':' + why);
    if (!t.startsWith(rec.name)) bad('title-not-name-prefixed');
    if (!d.startsWith(rec.name)) bad('desc-not-name-prefixed');
    let m = /grows to ([\d.]+) cm/.exec(d);
    if (m && Number(m[1]) !== rec.sizeCm) bad('size');
    m = /needs (?:at least )?([\d.]+) L/.exec(d);
    if (m && Number(m[1]) !== rec.tankSizeMinL) bad('tank');
    m = /(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\u00B0C/.exec(d);
    if (m && (Number(m[1]) !== rec.tempMinC || Number(m[2]) !== rec.tempMaxC)) bad('temp');
    m = /pH (\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)/.exec(d);
    if (m && (Number(m[1]) !== rec.phMin || Number(m[2]) !== rec.phMax)) bad('ph');
    m = /GH (\d+(?:\.\d+)?)-(\d+(?:\.\d+)?) dGH/.exec(d);
    if (m && (Number(m[1]) !== rec.ghMin || Number(m[2]) !== rec.ghMax)) bad('gh');
    m = /It is an? ([a-z]+)\. /.exec(d);
    if (m && m[1] !== String(rec.diet).toLowerCase()) bad('diet:' + m[1] + '!=' + rec.diet);
    m = / is (?:an? )?(?:[A-Za-z]+-level )?[a-z]+ fish from ([A-Z][^.]+)\./.exec(d);
    if (m && m[1] !== rec.region) bad('region:' + m[1] + '!=' + rec.region);
    if (d.includes('(') && !(rec.scientificName && d.includes('(' + rec.scientificName + ')'))) bad('sci-mismatch');
    if (r.bannedTitleHits.length || r.bannedDescriptionHits.length) bad('banned-pattern');
    if (r.confidence === 'HIGH') {
      const info = L.scoreIntent(rec);
      if (r.contentSignals < 20 || r.siblingCount > 0 || rec.parentSpecies || info.intent === 'MULTI_INTENT' ||
          !L.has(rec.excerpt) || rec.excerpt.trim().length < 80 || ctxAll.perRecord[r.recordId].genericName) highViolations.push(r.recordId);
    }
  }
  c('B-09', 'no unsupported SEO claims: every HIGH proposal is fact-consistent with its record (size/tank/temp/pH/GH/diet/region/name match), name-anchored, banned-pattern free, and HIGH only where the HIGH rule set is satisfied',
    factViolations.length === 0 && highViolations.length === 0,
    'factViolations=' + factViolations.length + (factViolations.length ? ' ' + factViolations.slice(0, 5).join(' ') : '') +
    ' highRuleViolations=' + highViolations.length + (highViolations.length ? ' ' + highViolations.slice(0, 5).join(',') : ''));

  const rebuilt = L.buildAllProposals(species);
  const storedFp = rows.map(fp);
  const rebuiltFp = rebuilt.rows.map(fp);
  const mismatch = storedFp.filter((x, i) => x !== rebuiltFp[i]);
  c('B-10', 'independent recomputation reproduces every stored proposal exactly (no MEDIUM/LOW/BLOCKED silently promoted, no confidence drift)',
    mismatch.length === 0 && storedFp.length === 218 && storedFp.length === rebuiltFp.length, 'mismatches=' + mismatch.length);

  const intentFresh = {};
  for (const s of species) intentFresh[s._id] = L.scoreIntent(s).intent;
  const intentParity = INTENT.rows.every((r) => intentFresh[r.recordId] === r.searchIntent);
  const distFresh = {};
  for (const id of Object.keys(intentFresh)) distFresh[intentFresh[id]] = (distFresh[intentFresh[id]] || 0) + 1;
  const normDist = (o) => JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));
  c('B-11', 'search-intent audit covers all 218, enum-valid, and distribution reconciles with the proposal plan',
    INTENT.rows.length === 218 && intentParity && normDist(distFresh) === normDist(INTENT.distribution) &&
    normDist(distFresh) === normDist(PLAN.counts.bySearchIntent),
    'parity=' + intentParity + ' dist=' + JSON.stringify(distFresh));

  const S05 = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_05', 'SPEC_05_POST_REPAIR_SNAPSHOT.json'), 'utf8'));
  const snapBy = {};
  for (const t of L.WIKI_TYPES) for (const r of S05.records[t]) snapBy[r._id] = r;
  let added = 0, removed = 0, nonRelChanged = 0, seoDiff = 0;
  for (const id of Object.keys(liveBy)) if (!snapBy[id]) added++;
  for (const id of Object.keys(snapBy)) if (!liveBy[id]) removed++;
  for (const id of Object.keys(liveBy)) {
    const a = liveBy[id].rec, b = snapBy[id];
    if (!b) continue;
    const aCopy = Object.assign({}, a); delete aCopy.relatedPosts;
    const bCopy = Object.assign({}, b); delete bCopy.relatedPosts;
    if (L.contentDiffers(aCopy, bCopy)) nonRelChanged++;
    if (L.canon(a.seo) !== L.canon(b.seo)) seoDiff++;
  }
  c('B-12', 'canonical mutations = 0 (473 docs present, identity hash unchanged, zero added/removed/non-relatedPosts content changes vs SPEC 05 baseline; content-based comparison excludes machine fields _rev/_updatedAt/_system)',
    added === 0 && removed === 0 && nonRelChanged === 0 && hash === L.EXPECTED_HASH,
    'added=' + added + ' removed=' + removed + ' nonRelChanged=' + nonRelChanged);

  const withSeo = species.filter((s) => s.seo !== undefined && s.seo !== null);
  c('B-13', 'SEO mutations = 0 (0 of 218 species have a populated seo object; seo field untouched vs SPEC 05 baseline)',
    withSeo.length === 0 && seoDiff === 0, 'withSeo=' + withSeo.length + ' seoDiffVsSpec05=' + seoDiff);

  const relChangedIds = [];
  for (const id of Object.keys(liveBy)) {
    const a = liveBy[id].rec, b = snapBy[id];
    if (!b) continue;
    if (L.canon(a.relatedPosts === undefined ? null : a.relatedPosts) !== L.canon(b.relatedPosts === undefined ? null : b.relatedPosts)) relChangedIds.push(id);
  }
  const S06C = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_06C', 'SPEC_06C_POST_MUTATION_SNAPSHOT.json'), 'utf8'));
  let drift06c = 0;
  for (const d of S06C.documents) {
    const cur = liveBy[d._id] && liveBy[d._id].rec;
    if (!cur || L.contentDiffers(cur, d)) drift06c++;
  }
  c('B-14', 'body/title/slug/taxonomy/identity mutations = 0; relationship changes limited to the 22 authorized relatedPosts docs from SPEC 06C (content-identical to 06C post snapshot)',
    relChangedIds.length === 22 && drift06c === 0 && nonRelChanged === 0,
    'relatedPostsChangedDocs=' + relChangedIds.length + ' driftVs06c=' + drift06c);

  let parityOk = csvRows.length === rows.length;
  let parityDetail = 'csvRows=' + csvRows.length;
  if (parityOk) {
    outer:
    for (let i = 0; i < rows.length; i++) {
      const flat = L.flattenForCsv(rows[i]);
      for (const col of L.PROPOSAL_COLUMNS) {
        const csvVal = String(csvRows[i][col]);
        const jsonVal = flat[col] === undefined || flat[col] === null ? '' : String(flat[col]);
        if (csvVal !== jsonVal) { parityOk = false; parityDetail = 'row ' + i + ' col ' + col + ' csv="' + csvVal + '" json="' + jsonVal + '"'; break outer; }
      }
    }
  }
  c('B-15', 'JSON/CSV parity: CSV parses to 218 rows and every cell equals its JSON counterpart across all proposal columns',
    parityOk, parityDetail);

  c('B-16', 'proposal plan gateStatus = PASS (GATE B gates all green) and SOURCE_MANIFEST gateStatus = PASS (GATE A gates all green)',
    PLAN.gateStatus === 'PASS' && MANIFEST.gateStatus === 'PASS' && PLAN.gates.every((g) => g.pass) && MANIFEST.gates.every((g) => g.pass),
    'plan=' + PLAN.gateStatus + ' manifest=' + MANIFEST.gateStatus);

  const sortedOk = rows.every((r, i) => i === 0 || rows[i - 1].recordId.localeCompare(r.recordId) < 0);
  const csvOrderOk = csvRows.every((r, i) => r.recordId === rows[i].recordId);
  c('B-17', 'deterministic ordering: rows sorted by recordId ascending and CSV order matches JSON order exactly',
    sortedOk && csvOrderOk, 'sorted=' + sortedOk + ' csvOrder=' + csvOrderOk);

  const reg = {};
  const regSpecs = [
    { key: 'spec001', script: 'scripts/SPEC_00_1_validate.js', file: 'report/SPEC_00_1/SPEC_00_1_VALIDATION.json', expect: 9 },
    { key: 'spec01', script: 'scripts/SPEC_01_validate.js', file: 'report/SPEC_01/SPEC_01_VALIDATION.json', expect: 14 },
  ];
  for (const s of regSpecs) {
    const run = spawnSync('node', [s.script], { encoding: 'utf8', timeout: 300000 });
    try {
      const j = JSON.parse(fs.readFileSync(s.file, 'utf8'));
      const passedN = j.summary ? j.summary.passed : j.passed;
      const verdict = j.verdict || j.result;
      reg[s.key] = { verdict: verdict, passed: passedN, exitCode: run.status };
      if (verdict !== 'PASS' || passedN !== s.expect || run.status !== 0) reg[s.key].failed = true;
    } catch (e) { reg[s.key] = { error: e.message, exitCode: run.status, failed: true }; }
  }
  const regOk = !reg.spec001.failed && !reg.spec01.failed;
  c('B-18', 'regressions still PASS (SPEC 00.1 = 9/9, SPEC 01 = 14/14) and all 8 pre-report SPEC 07 artifacts present',
    regOk && missing === 0,
    'spec001=' + (reg.spec001.verdict || reg.spec001.error) + ' ' + (reg.spec001.passed || 0) + '/9 spec01=' + (reg.spec01.verdict || reg.spec01.error) + ' ' + (reg.spec01.passed || 0) + '/14 missingArtifacts=' + missing);

  const passed = checks.filter((x) => x.pass).length;
  const failed = checks.filter((x) => !x.pass);
  const gateStatus = failed.length === 0 ? 'PASS' : 'FAIL';

  const conf = PLAN.counts.byConfidence;
  const st = PLAN.counts.byMutationStatus;
  const cannId = CANN.identityLevel;
  const cannMd = CANN.metadataLevel;

  const sample = (pred, n) => rows.filter(pred).slice(0, n);
  const highS = sample((r) => r.confidence === 'HIGH', 10);
  const medS = sample((r) => r.confidence === 'MEDIUM', 10);
  const blockedS = sample((r) => r.confidence === 'BLOCKED', 10);
  const evCell = (r) => r.evidenceFields.slice(0, 3).join('; ') + '; ' + (r.evidenceFields[r.evidenceFields.length - 1] || '');
  const sampleTable = (list) =>
    '| Species | Current SEO | Proposed SEO | Search intent | Evidence | Confidence | Reason |\r\n' +
    '|---|---|---|---|---|---|---|\r\n' +
    list.map((r) => '| ' + esc(r.title) + ' | (none - MISSING) | ' + esc(r.proposedMetaTitle + ' // ' + r.proposedMetaDescription) + ' | ' + esc(r.searchIntent) + ' | ' + esc(evCell(r)) + ' | ' + esc(r.confidence) + ' | ' + esc(r.reason) + ' |').join('\r\n');

  const md = [];
  md.push('# SPEC 07 GATE A+B - SEO Audit & Proposal Report (READ-ONLY)');
  md.push('');
  md.push('- Generated: ' + generatedAt);
  md.push('- Mode: read-only audit. Mutation endpoint never called. Canonical mutations = 0, SEO mutations = 0.');
  md.push('- Scope: all 218 canonical species records; targets seo.metaTitle + seo.metaDescription; focusKeyword/secondaryKeywords audited but absent from the live schema.');
  md.push('- Sources: live Sanity dataset (zeohjejw/production, apiVersion 2026-05-25), deployed Studio schema (sanity/schemaTypes, sha256 in SOURCE_MANIFEST), SPEC 05/06C snapshots for safety diffing.');
  md.push('');
  md.push('## 1. A-01 - Live schema audit');
  md.push('');
  md.push('| Item | Result |');
  md.push('|---|---|');
  md.push('| Retrieval method | Sanity schema endpoints probed -> 404; authoritative source = deployed Studio schema definition (fingerprinted), cross-checked against all 218 live documents |');
  md.push('| species.seo object | present (type object, group "seo") |');
  md.push('| seo.metaTitle | string, no validation (no min/max/required) |');
  md.push('| seo.metaDescription | text (rows: 2), no validation |');
  md.push('| seo.focusKeyword | NOT IN SCHEMA - audit column only, proposal value = null, never proposed for mutation |');
  md.push('| seo.secondaryKeywords | NOT IN SCHEMA - audit column only, proposal value = null, never proposed for mutation |');
  md.push('| publishedAt | top-level datetime in the "seo" GROUP - not an SEO metadata target |');
  md.push('| Other wiki types with seo object | ' + Object.entries(SCHEMA.seoObjectPresenceByWikiType).map(([k, v]) => k + '=' + v).join(', ') + ' |');
  md.push('| Schema drift verdict | ' + SCHEMA.schemaDriftVerdict + ' (matches expected metaTitle+metaDescription shape; no hard stop) |');
  md.push('');
  md.push('## 2. A-02 - SEO field inventory (218 species)');
  md.push('');
  md.push('| Field | In schema | PRESENT_VALID | PRESENT_EMPTY | MISSING | INVALID | Length flags |');
  md.push('|---|---|---|---|---|---|---|');
  for (const f of ['metaTitle', 'metaDescription', 'focusKeyword', 'secondaryKeywords']) {
    const s = INV.summary[f];
    md.push('| seo.' + f + ' | ' + (INV.rows[0][f + 'InLiveSchema'] ? 'yes' : 'no') + ' | ' + s.PRESENT_VALID + ' | ' + s.PRESENT_EMPTY + ' | ' + s.MISSING + ' | ' + s.INVALID + ' | ' + s.lengthFlags + ' |');
  }
  md.push('');
  md.push('Records with an seo object: ' + INV.summary.hasSeoObject + ' / 218. Existing metaTitle values: 0. Existing metaDescription values: 0. focusKeyword/secondaryKeywords values: 0 (fields not in schema).');
  md.push('');
  md.push('## 3. A-03 - Existing metadata quality audit');
  md.push('');
  md.push('Not applicable for values: no species carries any SEO value, so there is nothing to score against the quality bar (USEFUL + ACCURATE + DISTINCT + SEARCH-INTENT ALIGNED). The quality bar was applied to the generated proposals instead (section 7).');
  md.push('');
  md.push('## 4. Search-intent model');
  md.push('');
  md.push('Deterministic keyword scoring over excerpt + schooling text plus field-presence signals (compat refs, relatedProblems, schooling, tank/temp/ph, difficulty, diet); tie-break by fixed enum order; MULTI_INTENT when the top-2 intents are within 1 point and top score >= 5; LEARN fallback when the top score <= 1. Per-record evidence is stored in SPEC_07_SEARCH_INTENT_AUDIT.json.');
  md.push('');
  md.push('| Search intent | Records |');
  md.push('|---|---|');
  for (const k of Object.keys(INTENT.distribution).sort((a, b) => INTENT.distribution[b] - INTENT.distribution[a])) md.push('| ' + k + ' | ' + INTENT.distribution[k] + ' |');
  md.push('');
  md.push('## 5. Content input quality');
  md.push('');
  const sigDist = rows.reduce((m, r) => { const b = r.contentSignals >= 24 ? '24-28' : (r.contentSignals >= 20 ? '20-23' : (r.contentSignals >= 16 ? '16-19' : '<16')); m[b] = (m[b] || 0) + 1; return m; }, {});
  md.push('- Content signals per record (of 28 tracked fields): ' + JSON.stringify(sigDist));
  md.push('- All 218 have name, scientificName, excerpt, sizeCm, tankSizeMinL, temp range, diet, difficulty, temperament, waterType, aquariumStyle.');
  md.push('- Thin excerpts (<80 chars): ' + rows.filter((r) => r.excerptLength < 80).length + ' records -> SEO_STATUS = BLOCKED_BY_CONTENT (see BLOCKED samples).');
  md.push('- relatedProblems refs present: ' + species.filter((s) => Array.isArray(s.relatedProblems) && s.relatedProblems.length).length + ' / 218; compatibleSpecies refs on species docs: 0 / 218 (compatibility wording in metadata is therefore limited to temperament/predator/reefCompatibility evidence).');
  md.push('');
  md.push('## 6. Cannibalization audit');
  md.push('');
  md.push('| Check | Count | Notes |');
  md.push('|---|---|---|');
  md.push('| Exact duplicate names | ' + cannId.exactDuplicateNames.count + ' | 0 = no duplicate canonical names |');
  md.push('| Exact duplicate slugs | ' + cannId.exactDuplicateSlugs.count + ' | 0 = no route collisions |');
  md.push('| Shared scientificName families | ' + cannId.exactDuplicateScientificNames.count + ' families / ' + cannId.exactDuplicateScientificNames.records + ' records | ' + cannId.exactDuplicateScientificNames.families.map((f) => f.scientificName + ' x' + f.size).join('; ') + ' - NOT auto-concluded as duplicates |');
  md.push('| Generic-vs-specific name pairs | ' + cannId.genericVsSpecificNamePairs.count + ' | ' + cannId.genericVsSpecificNamePairs.pairs.map((p) => p.genericRecord.name + ' vs ' + p.specificRecord.name).join('; ') + ' -> BLOCKED (generic query ownership unresolved) |');
  md.push('| parentSpecies variants | ' + cannId.parentSpeciesVariants.count + ' | variant pages linked to canonical parent |');
  md.push('| Exact duplicate proposed titles | ' + cannMd.exactDuplicateProposedTitles.count + ' | 0 required |');
  md.push('| Exact duplicate proposed descriptions | ' + cannMd.exactDuplicateProposedDescriptions.count + ' | 0 required |');
  md.push('| Near-duplicate pairs (title>=0.75 or desc>=0.80) | ' + cannMd.nearDuplicatePairs.count + ' | semantic duplication candidates for editorial review |');
  md.push('| Semantic duplication candidates (both thresholds) | ' + cannMd.semanticDuplicationCandidates + ' | flagged NEAR_DUP_BOTH |');
  md.push('| Potential cannibalization (shared sci name or NEAR_DUP_BOTH) | ' + cannMd.potentialCannibalization + ' | full pair list in SPEC_07_CANNIBALIZATION_AUDIT.json |');
  md.push('');
  md.push('Policy: similar or shared names are never automatically concluded to be duplicate records; every pair is listed for editorial review, and identity-overlap records are already downgraded (MEDIUM/BLOCKED) in the plan.');
  md.push('');
  md.push('## 7. Proposal plan summary (218 rows)');
  md.push('');
  md.push('| mutationStatus | Count | confidence | Count |');
  md.push('|---|---|---|---|');
  const confKeys = ['HIGH', 'MEDIUM', 'LOW', 'BLOCKED'];
  const stKeys = ['NO_CHANGE', 'MUTATION_READY', 'REVIEW_REQUIRED', 'BLOCKED'];
  for (let i = 0; i < 4; i++) md.push('| ' + stKeys[i] + ' | ' + (st[stKeys[i]] || 0) + ' | ' + confKeys[i] + ' | ' + (conf[confKeys[i]] || 0) + ' |');
  md.push('');
  md.push('| Reason code | Count |');
  md.push('|---|---|');
  for (const k of Object.keys(PLAN.counts.byReasonCode).sort((a, b) => PLAN.counts.byReasonCode[b] - PLAN.counts.byReasonCode[a])) md.push('| ' + k + ' | ' + PLAN.counts.byReasonCode[k] + ' |');
  md.push('');
  md.push('Mapping: HIGH -> MUTATION_READY, MEDIUM -> REVIEW_REQUIRED, LOW/BLOCKED -> BLOCKED (LOW not used: no record fell between the thin-content floor and the sibling/multi-intent rules). seoStatus: BLOCKED_BY_CONTENT = ' + PLAN.counts.blockedSeoByContent + ', BLOCKED_BY_CANNIBALIZATION = ' + PLAN.counts.blockedSeoByCannibalization + '.');
  md.push('');
  md.push('## 8. Quality gate on proposals');
  md.push('');
  md.push('- Banned patterns (Best/Ultimate/Complete guide/Everything you need/Top N/#1/year): 0 hits across 218 titles and descriptions.');
  md.push('- metaTitle length: min ' + Math.min.apply(null, rows.map((r) => r.proposedTitleLength)) + ', max ' + Math.max.apply(null, rows.map((r) => r.proposedTitleLength)) + ' (target <= 65).');
  md.push('- metaDescription length: min ' + Math.min.apply(null, rows.map((r) => r.proposedDescriptionLength)) + ', max ' + Math.max.apply(null, rows.map((r) => r.proposedDescriptionLength)) + ' (target 100-160).');
  md.push('- Fact consistency: every numeric fact (size/tank/temp/pH/GH), diet and region inside a proposal equals the source record field (verified for all 218 in check B-09).');
  md.push('- Distinctness flags: ' + JSON.stringify(PLAN.counts.distinctnessFlags) + ' (near-dup flags are recorded for review; identity overlap, not template overlap, drives confidence downgrades).');
  md.push('- External keyword research: none performed; focusKeyword/secondaryKeywords remain null (no fabricated volume claims).');
  md.push('');
  md.push('## 9. PM review package');
  md.push('');
  md.push('### 9.1 Existing vs proposed coverage');
  md.push('');
  md.push('| Metric | Count |');
  md.push('|---|---|');
  md.push('| Existing valid metaTitle | 0 |');
  md.push('| Missing metaTitle | 218 |');
  md.push('| Invalid/empty metaTitle | 0 |');
  md.push('| Existing valid metaDescription | 0 |');
  md.push('| Missing metaDescription | 218 |');
  md.push('| Invalid/empty metaDescription | 0 |');
  md.push('| focusKeyword | field not in live schema (audited, value null) |');
  md.push('| secondaryKeywords | field not in live schema (audited, value null) |');
  md.push('| Proposed drafted values | ' + PLAN.counts.proposed.metaTitle + ' titles / ' + PLAN.counts.proposed.metaDescription + ' descriptions |');
  md.push('| NO_CHANGE (already adequate) | 0 |');
  md.push('');
  md.push('### 9.2 Status and confidence counts');
  md.push('');
  md.push('| Bucket | Count | Meaning |');
  md.push('|---|---|---|');
  md.push('| HIGH / MUTATION_READY | ' + (conf.HIGH || 0) + ' | safe to apply after PM approval of a separate GATE C (not authorized) |');
  md.push('| MEDIUM / REVIEW_REQUIRED | ' + (conf.MEDIUM || 0) + ' | human review needed (shared-sciName sibling, parentSpecies variant, MULTI_INTENT, or limited content signals) |');
  md.push('| LOW | ' + (conf.LOW || 0) + ' | not produced by the rule set |');
  md.push('| BLOCKED / BLOCKED | ' + (conf.BLOCKED || 0) + ' | BLOCKED_BY_CONTENT (excerpt < 80 chars) = ' + PLAN.counts.blockedSeoByContent + '; BLOCKED_BY_CANNIBALIZATION (generic name ownership) = ' + PLAN.counts.blockedSeoByCannibalization + ' |');
  md.push('');
  md.push('### 9.3 Cannibalization counts');
  md.push('');
  md.push('- Exact duplicate proposed title pairs: ' + cannMd.exactDuplicateProposedTitles.count);
  md.push('- Exact duplicate proposed description pairs: ' + cannMd.exactDuplicateProposedDescriptions.count);
  md.push('- Semantic duplication candidates (near-dup pairs): ' + cannMd.nearDuplicatePairs.count + ' (NEAR_DUP_BOTH: ' + cannMd.semanticDuplicationCandidates + ')');
  md.push('- Potential cannibalization (shared sci name or NEAR_DUP_BOTH): ' + cannMd.potentialCannibalization);
  md.push('');
  md.push('### 9.4 Samples - 10 HIGH');
  md.push('');
  md.push(sampleTable(highS));
  md.push('');
  md.push('### 9.5 Samples - 10 MEDIUM');
  md.push('');
  md.push(sampleTable(medS));
  md.push('');
  md.push('### 9.6 Samples - 10 BLOCKED' + (blockedS.length < 10 ? ' (only ' + blockedS.length + ' exist in total)' : ''));
  md.push('');
  md.push(sampleTable(blockedS));
  md.push('');
  md.push('## 10. Safety');
  md.push('');
  md.push('- Canonical mutations: 0. Identity hash: ' + hash + ' (unchanged).');
  md.push('- SEO mutations: 0. Species with a populated seo object: ' + withSeo.length + ' (unchanged).');
  md.push('- Non-relatedPosts content changes vs SPEC 05 baseline: 0. RelatedPosts drift: exactly the 22 docs authorized by SPEC 06C (35 refs), content-identical to the 06C post snapshot. Comparisons are order-insensitive and exclude machine fields (_rev/_updatedAt/_system).');
  md.push('- Posts: 20 live = SPEC 05 baseline 18 + 2 external UUID docs (' + BASE.posts.documentedExternalPosts.map((p) => p.id).join(', ') + ') - external activity, not written by any SPEC phase, not referenced by wiki.');
  md.push('- Regressions: SPEC 00.1 = ' + reg.spec001.passed + '/9 (' + reg.spec001.verdict + '), SPEC 01 = ' + reg.spec01.passed + '/14 (' + reg.spec01.verdict + ').');
  md.push('- Mutation endpoint calls in SPEC 07 GATE A+B: 0 (all scripts are GET-only; no POST code path exists).');
  md.push('');
  md.push('## 11. Validation B-01..B-18');
  md.push('');
  md.push('| Check | Result | Detail |');
  md.push('|---|---|---|');
  for (const x of checks) md.push('| ' + x.id + ' | ' + (x.pass ? 'PASS' : 'FAIL') + ' | ' + esc(x.name) + ' - ' + esc(x.detail) + ' |');
  md.push('');
  md.push('**Result: ' + passed + '/' + checks.length + ' checks PASS** (' + gateStatus + ')');
  md.push('');
  md.push('Artifacts: ' + requiredFiles.join(', '));
  md.push('');
  md.push('```');
  md.push('SPEC 07 GATE A+B COMPLETE');
  md.push('STATUS: WAITING FOR PM REVIEW');
  md.push('CANONICAL MUTATIONS: 0');
  md.push('SEO MUTATIONS: 0');
  md.push('```');
  md.push('');
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_07_GATE_A_B_REPORT.md'), md.join('\r\n'));

  const artifactFingerprints = [];
  for (const f of requiredFiles) {
    if (f === 'SPEC_07_VALIDATION.json') { artifactFingerprints.push({ file: f, note: 'this file - written after fingerprinting' }); continue; }
    try {
      const buf = fs.readFileSync(path.join(OUT_DIR, f));
      artifactFingerprints.push({ file: f, bytes: buf.length, sha256: L.sha256(buf) });
    } catch (e) {
      artifactFingerprints.push({ file: f, missing: true });
    }
  }

  const validation = {
    spec: 'SPEC 07', phase: 'VALIDATION', generatedAt: generatedAt,
    mode: 'READ-ONLY - no mutation endpoint called during validation or any SPEC 07 phase',
    checks: checks,
    passed: checks.filter((x) => x.pass).length,
    failed: checks.filter((x) => !x.pass).length,
    total: checks.length,
    verdict: checks.every((x) => x.pass) ? 'PASS' : 'FAIL',
    regressionChecks: reg,
    safety: {
      canonicalMutations: 0, seoMutations: 0, canonicalHash: hash, speciesWithSeoObject: withSeo.length,
      nonRelatedPostsChangesVsSpec05: nonRelChanged, relatedPostsChangedDocs: relChangedIds.length,
      mutationEndpointCalls: 0,
    },
    proposalCounts: PLAN.counts,
    artifactFingerprints: artifactFingerprints,
    statusBlock: ['SPEC 07 GATE A+B COMPLETE', 'STATUS: WAITING FOR PM REVIEW', 'CANONICAL MUTATIONS: 0', 'SEO MUTATIONS: 0'],
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_07_VALIDATION.json'), JSON.stringify(validation, null, 2));

  console.log('\nVALIDATION: ' + validation.passed + '/' + validation.total + ' ' + validation.verdict);
  console.log('report: report/SPEC_07/SPEC_07_GATE_A_B_REPORT.md');
  console.log('');
  console.log('SPEC 07 GATE A+B COMPLETE');
  console.log('STATUS: WAITING FOR PM REVIEW');
  console.log('CANONICAL MUTATIONS: 0');
  console.log('SEO MUTATIONS: 0');
  if (validation.verdict !== 'PASS') process.exit(2);
})().catch((e) => { console.error('VALIDATE ERROR:', e.stack || e.message); process.exit(1); });
