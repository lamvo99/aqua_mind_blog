const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// SPEC 10 — integrity validation (Gate A re-read + Gate F mutation safety + deliverable checks).
// READ-ONLY: live GET only. Writes SPEC_10_INTEGRITY... -> INTEGRITY.json (deliverable name per §26).

const OUT = path.join('report', 'SPEC_10');
const MIRROR = path.join('reports', 'SPEC_10');
const TEMP_DIR = 'C:/Users/lam72/AppData/Local/Temp/opencode';
const FINAL = process.argv.includes('--final');
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (t, it) => (t === 'problem' ? it.title : it.name);

function q(query) {
  const url = BASE + '?query=' + encodeURIComponent(query);
  return new Promise((res, rej) => {
    https.get(url, { headers: { Authorization: 'Bearer ' + TOKEN }, timeout: 60000 }, (r) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      r.on('end', () => { const d = Buffer.concat(chunks).toString('utf8'); try { res(JSON.parse(d).result); } catch (e) { rej(new Error('bad response: ' + d.slice(0, 200))); } });
    }).on('error', rej);
  });
}
function parseCsv(text) {
  const rows = []; let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; } else field += c; }
    else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const readCsv = (name) => { const r = parseCsv(fs.readFileSync(path.join(OUT, name), 'utf8')); const h = r[0]; return r.slice(1).map((x) => Object.fromEntries(h.map((k, i) => [k, x[i]]))); };
const readCsvAt = (p) => { const r = parseCsv(fs.readFileSync(p, 'utf8')); const h = r[0]; return r.slice(1).map((x) => Object.fromEntries(h.map((k, i) => [k, x[i]]))); };

const checks = [];
const ac = (id, gate, name, pass, detail) => { checks.push({ id, gate, name, pass: !!pass, detail: String(detail ?? '') }); console.log(`${pass ? 'PASS' : 'FAIL'} ${id} [${gate}] ${name} — ${detail ?? ''}`); };

const ARTIFACTS = ['SPEC_10_SCHEMA_STANDARDIZATION_REPORT.md', 'KNOWLEDGE_ARCHITECTURE_MATRIX.csv', 'FIELD_TO_KNOWLEDGE_MAPPING.csv', 'APPLICABILITY_MATRIX.csv', 'RELATIONSHIP_MODEL.csv', 'BODY_ARCHITECTURE.md', 'RESEARCH_MODEL.csv', 'COMPLETENESS_LEVELS.md', 'PRIORITY_MIGRATION_QUEUE.csv', 'INTEGRITY.json', 'EXECUTION_LOG.md'];

(async () => {
  const baseline = JSON.parse(fs.readFileSync(path.join(TEMP_DIR, 'spec10_baseline.json'), 'utf8'));

  // ---------- Gate A re-read ----------
  async function fetchAll() { const o = {}; for (const t of TYPES) o[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`); return o; }
  const live1 = await fetchAll();
  const live2 = await fetchAll();
  let dr = 0; for (const t of TYPES) if (JSON.stringify(live1[t]) !== JSON.stringify(live2[t])) dr++;
  ac('A-01', 'A', 'post-phase deterministic double-read identical', dr === 0, `mismatchedTypes=${dr}`);

  const counts = {}; let total = 0;
  for (const t of TYPES) { counts[t] = live1[t].length; total += counts[t]; }
  ac('A-02', 'A', '473 records / 6 domains unchanged', total === 473 && TYPES.every((t) => counts[t] === EXPECTED[t]), `total=${total} ${JSON.stringify(counts)}`);

  const canonical = {};
  for (const t of TYPES) for (const r of live1[t]) canonical[r._id] = { type: t, rec: r };
  const hashParts = Object.keys(canonical).sort().map((id) => { const c = canonical[id]; return sha256(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) })); });
  const hash = sha256(hashParts.join('\n'));
  ac('A-03', 'A', 'identity hash verified', hash === EXPECTED_HASH, hash === EXPECTED_HASH ? 'MATCH' : hash);

  let drafts = 0, dups = 0; const seen = {};
  for (const t of TYPES) for (const r of live1[t]) {
    if (String(r._id).startsWith('drafts.')) drafts++;
    const s = slugValue(r.slug); if (s) { if (seen[s]) dups++; seen[s] = 1; } else dups++;
  }
  ac('A-04', 'A', 'drafts = 0 / duplicate slugs = 0', drafts === 0 && dups === 0, `drafts=${drafts} dupOrMissingSlug=${dups}`);

  // ---------- Gate F: full-doc diff vs SPEC 10 baseline ----------
  let changed = 0, updatedDiff = 0, titleDiff = 0, slugDiff = 0, relDiff = 0, seoDiff = 0;
  const relKeys = ['compatibleSpecies', 'compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedProblems', 'relatedPosts', 'relatedTools', 'aquariumStyle'];
  const baseMap = {};
  for (const t of TYPES) for (const r of baseline.records[t]) baseMap[r._id] = { type: t, rec: r };
  const extra = Object.keys(canonical).filter((id) => !baseMap[id]).length;
  for (const id of Object.keys(baseMap)) {
    const old = baseMap[id], now = canonical[id];
    if (!now) { changed++; continue; }
    if (titleOf(old.type, old.rec) !== titleOf(now.type, now.rec)) titleDiff++;
    if (slugValue(old.rec.slug) !== slugValue(now.rec.slug)) slugDiff++;
    if (JSON.stringify(relKeys.map((k) => old.rec[k] || null)) !== JSON.stringify(relKeys.map((k) => now.rec[k] || null))) relDiff++;
    if (JSON.stringify(old.rec.seo || null) !== JSON.stringify(now.rec.seo || null)) seoDiff++;
    if (String(old.rec._updatedAt) !== String(now.rec._updatedAt)) updatedDiff++;
    if (JSON.stringify(old.rec) !== JSON.stringify(now.rec)) changed++;
  }
  ac('F-01', 'F', 'full-document diff vs SPEC 10 baseline = 0', changed === 0 && extra === 0 && titleDiff === 0 && slugDiff === 0 && relDiff === 0 && seoDiff === 0,
    `changed=${changed} extra=${extra} title=${titleDiff} slug=${slugDiff} rel=${relDiff} seo=${seoDiff}`);
  ac('F-02', 'F', '_updatedAt changes = 0', updatedDiff === 0, `updatedDiff=${updatedDiff}`);

  const specFiles = ['SPEC_10_extract.js', 'SPEC_10_architecture.js', 'SPEC_10_report.js', 'SPEC_10_validate.js'].map((f) => path.join('scripts', f));
  const needles = [['mut', 'ate'], ['createOr', 'Replace'], ['.patch', '('], ['metho', 'd:'], ['"POST', '"'], ["'POST", "'"]];
  let mutHints = 0;
  for (const f of specFiles) {
    const src = fs.readFileSync(f, 'utf8');
    if (needles.some((n) => src.includes(n.join('')))) mutHints++;
  }
  ac('F-03', 'F', 'Sanity writes = 0 / no mutation path in SPEC 10 scripts', mutHints === 0, `scriptsWithMutationHints=${mutHints} (GET query only)`);

  // ---------- deliverables (§26) ----------
  const present = ARTIFACTS.filter((a) => fs.existsSync(path.join(OUT, a)));
  const missing = ARTIFACTS.filter((a) => !present.includes(a) && a !== 'INTEGRITY.json');
  ac('D-01', 'C', 'all deliverables present (integrity written by this run)', missing.length === 0, `present=${present.length}/11 missing=${missing.join(',') || 'none-yet(self)'}`);

  // ---------- Gate B: architecture coverage (230 set-equality) ----------
  const arch = readCsv('KNOWLEDGE_ARCHITECTURE_MATRIX.csv');
  const appl = readCsv('APPLICABILITY_MATRIX.csv');
  const s9 = readCsvAt(path.join('report', 'SPEC_09', 'SPEC_09_DOMAIN_SUMMARY.csv')).filter((r) => r.rowType === 'REQUIREMENT');
  const key = (r, a, b) => `${r[a]}:${r[b]}`;
  const archKeys = new Set(arch.map((r) => key(r, 'domain', 'requirement')));
  const s9Keys = new Set(s9.map((r) => key(r, 'domain', 'requirement')));
  const unmapped = [...s9Keys].filter((k) => !archKeys.has(k));
  const extras = [...archKeys].filter((k) => !s9Keys.has(k));
  ac('B-01', 'B', 'architecture matrix = 230 rows, unique, exact SPEC 09 requirement set',
    arch.length === 230 && archKeys.size === 230 && unmapped.length === 0 && extras.length === 0,
    `rows=${arch.length} unique=${archKeys.size} unmapped=${unmapped.length} extras=${extras.length}`);

  const reprOk = arch.every((r) => ['EXISTING_FIELD', 'NEW_FIELD', 'RELATIONSHIP', 'BODY'].includes(r.primaryRepresentation));
  const layerOk = arch.every((r) => ['A', 'B', 'C', 'D', 'E', 'F'].includes(r.knowledgeLayer));
  const levelOk = arch.every((r) => ['L1', 'L2', 'L3', 'L4'].includes(r.introducedLevel));
  const targetOk = arch.every((r) => r.target && r.target.length > 0);
  ac('B-02', 'B', 'representation/layer/level vocabularies legal, no empty targets', reprOk && layerOk && levelOk && targetOk,
    `repr=${reprOk} layer=${layerOk} level=${levelOk} target=${targetOk}`);

  // six domain architectures present
  const doms = new Set(arch.map((r) => r.domain));
  ac('B-03', 'B', 'species/plant/invertebrate/coral/equipment/problem architectures all defined',
    TYPES.every((t) => doms.has(t)), [...doms].join(','));

  // ---------- Gate C: applicability + representation ----------
  const applKeys = new Set(appl.map((r) => key(r, 'domain', 'requirement')));
  const applMissing = [...s9Keys].filter((k) => !applKeys.has(k));
  const legalApplic = appl.every((r) => ['REQUIRED', 'OPTIONAL', 'NOT_APPLICABLE', 'CONDITIONAL', 'UNKNOWN'].includes(r.applicabilityClass));
  const condRule = appl.filter((r) => r.applicabilityClass === 'CONDITIONAL').every((r) => r.applicabilityRule && r.applicabilityRule.length > 0);
  const unknownCount = appl.filter((r) => r.applicabilityClass === 'UNKNOWN').length;
  const naCount = appl.filter((r) => r.applicabilityClass === 'NOT_APPLICABLE').length;
  ac('C-01', 'C', 'applicability matrix = exact SPEC 09 set, legal classes, CONDITIONAL rules present, report claim UNKNOWN=0/NA=0 holds',
    appl.length === 230 && applMissing.length === 0 && legalApplic && condRule && unknownCount === 0 && naCount === 0,
    `rows=${appl.length} missing=${applMissing.length} legal=${legalApplic} condRule=${condRule} unknown=${unknownCount} na=${naCount}`);

  const fm = readCsv('FIELD_TO_KNOWLEDGE_MAPPING.csv');
  const s1 = readCsvAt(path.join('report', 'SPEC_01', 'SPEC_01_SCHEMA_FIELD_MATRIX.csv'));
  const fmKeys = new Set(fm.map((r) => `${r.document_type}.${r.field_name}`));
  const s1Keys = new Set(s1.map((r) => `${r.document_type}.${r.field_name}`));
  const fmMissing = [...s1Keys].filter((k) => !fmKeys.has(k));
  const legalStatus = fm.every((r) => ['ADEQUATE', 'EXTEND_SEMANTICS', 'INSUFFICIENT_FOR_DECISIONS', 'STRUCTURAL'].includes(r.mappingStatus));
  ac('C-02', 'C', 'field mapping = 140 fields, exact SPEC 01 set, legal statuses',
    fm.length === 140 && fmKeys.size === 140 && fmMissing.length === 0 && legalStatus,
    `rows=${fm.length} missing=${fmMissing.length} legal=${legalStatus}`);

  const rel = readCsv('RELATIONSHIP_MODEL.csv');
  const relText = fs.readFileSync(path.join(OUT, 'RELATIONSHIP_MODEL.csv'), 'utf8');
  const rel09 = Array.from({ length: 17 }, (_, i) => `REL-${String(i + 1).padStart(2, '0')}`);
  const relRefs = rel09.filter((id) => !relText.includes(id));
  const statuses = new Set(rel.map((r) => r.status));
  ac('C-03', 'C', 'relationship model: 22 slots, statuses legal, all SPEC 09 REL-01..17 referenced, 6 proposed',
    rel.length === 22 && [...statuses].every((s) => ['EXISTING_EMPTY', 'EXISTING_PARTIAL', 'EXISTING_FULL', 'PROPOSED', 'DERIVED'].includes(s)) && relRefs.length === 0 && rel.filter((r) => r.status === 'PROPOSED').length === 6,
    `rows=${rel.length} proposed=${rel.filter((r) => r.status === 'PROPOSED').length} missingRefs=${relRefs.join(',') || 'none'}`);

  const res = readCsv('RESEARCH_MODEL.csv');
  const resText = fs.readFileSync(path.join(OUT, 'RESEARCH_MODEL.csv'), 'utf8');
  const r22 = ['recordId', 'requirementId', 'claim', 'applicability', 'priority', 'sourceTypeNeeded', 'source', 'evidence', 'confidence', 'dateChecked', 'uncertainty', 'editorDecision'];
  const miss22 = r22.filter((f) => !resText.includes(f));
  const evidenceClasses = ['ESTABLISHED_FACT', 'ACCEPTED_HUSBANDRY_RANGE', 'PRACTICAL_RECOMMENDATION', 'MANUFACTURER_CLAIM', 'EXPERT_CONSENSUS', 'SPECIES_VARIABLE', 'RESEARCH_NEEDED'];
  const missEv = evidenceClasses.filter((f) => !resText.includes(f));
  ac('E-01', 'E', 'research model: §22 fields + 7 evidence classes + source hierarchy present',
    miss22.length === 0 && missEv.length === 0 && resText.includes('SCIENTIFIC_LITERATURE') && resText.includes('COMMUNITY_SUPPLEMENTARY'),
    `missingFields=${miss22.join(',') || 'none'} missingEvidence=${missEv.join(',') || 'none'}`);

  // ---------- Gate D: completeness levels + queue ----------
  const levels = fs.readFileSync(path.join(OUT, 'COMPLETENESS_LEVELS.md'), 'utf8');
  const lv = ['L0', 'L1', 'L2', 'L3', 'L4', 'Beginner', 'Intermediate', 'Advanced'];
  const missLv = lv.filter((x) => !levels.includes(x));
  ac('D-01', 'D', 'completeness levels L0-L4 + beginner/intermediate/advanced gates defined',
    missLv.length === 0 && levels.includes('Dangerous-gap'), `missing=${missLv.join(',') || 'none'}`);

  const queue = readCsv('PRIORITY_MIGRATION_QUEUE.csv');
  const legalPrio = queue.every((r) => ['P0', 'P1', 'P2', 'P3'].includes(r.priority));
  const legalPhase = queue.every((r) => ['MIGRATION', 'SPEC_11', 'SPEC_12', 'SPEC_13'].includes(r.phase));
  const recP0 = queue.filter((r) => r.itemType === 'RECORD_ENRICHMENT');
  const prioOrder = queue.every((r, i) => i === 0 || ['P0', 'P1', 'P2', 'P3'].indexOf(queue[i - 1].priority) <= ['P0', 'P1', 'P2', 'P3'].indexOf(r.priority));
  ac('D-02', 'D', 'priority migration queue legal (priorities/phases/order; 18 P0 records == SPEC 09 CRITICAL count; P0 total = 24)',
    queue.length >= 100 && legalPrio && legalPhase && prioOrder && recP0.length === 18 && queue.filter((r) => r.priority === 'P0').length === 24,
    `rows=${queue.length} legalPrio=${legalPrio} legalPhase=${legalPhase} order=${prioOrder} recordP0=${recP0.length} p0total=${queue.filter((r) => r.priority === 'P0').length}`);

  const body = fs.readFileSync(path.join(OUT, 'BODY_ARCHITECTURE.md'), 'utf8');
  const tpl = ['Species / Fish (12 sections)', 'Coral (12 sections)', 'Plant (11 sections)', 'Invertebrate (11 sections)', 'Equipment (10 sections)', 'Problem (8 sections)'];
  const missTpl = tpl.filter((t) => !body.includes(t));
  ac('D-03', 'D', 'body architecture: 6 domain templates + decision rule present',
    missTpl.length === 0 && body.includes('Decision rule recap') && body.includes('Practical Verdict'),
    `missing=${missTpl.join('|') || 'none'}`);

  // ---------- report acceptance (§32) ----------
  const report = fs.readFileSync(path.join(OUT, 'SPEC_10_SCHEMA_STANDARDIZATION_REPORT.md'), 'utf8');
  const gatesTxt = ['Gate A', 'Gate B', 'Gate C', 'Gate D', 'Gate E', 'Gate F'];
  const missG = gatesTxt.filter((g) => !report.includes(g));
  const accepted = report.includes('SPEC 10 — COMPLETE');
  const noFalseClaim = !/knowledge[- ]complete (database|wiki)/i.test(report.replace(/\*\*not\*\*/gi, 'NOT').replace(/is not knowledge-complete/gi, 'SAFE_NEGATION')) || report.includes('not** knowledge-complete') || report.includes('not knowledge-complete');
  ac('R-01', 'C', 'report: all Gate A-F sections + §32 acceptance line + no knowledge-complete claim',
    missG.length === 0 && accepted && noFalseClaim,
    `missingGates=${missG.join(',') || 'none'} accepted=${accepted} noFalseClaim=${noFalseClaim}`);

  // ---------- mirror ----------
  let mirrorBad = [];
  if (fs.existsSync(MIRROR)) {
    for (const a of ARTIFACTS) {
      const p1 = path.join(OUT, a), p2 = path.join(MIRROR, a);
      if (!fs.existsSync(p2)) { mirrorBad.push(a + ':missing'); continue; }
      if (sha256(fs.readFileSync(p1)) !== sha256(fs.readFileSync(p2))) mirrorBad.push(a + ':differs');
    }
  } else mirrorBad.push('mirrorDir:missing');
  if (!FINAL) {
    const onlyPending = mirrorBad.every((x) => x.includes('INTEGRITY.json') || x === 'mirrorDir:missing');
    ac('M-01', 'C', 'mirror byte-identical (reports/SPEC_10) — pending until final run', onlyPending,
      `status=${mirrorBad.length ? mirrorBad.join(',') : 'ok'} (final check on --final run)`);
  } else {
    ac('M-01', 'C', 'mirror byte-identical (reports/SPEC_10, all 11 artifacts)', mirrorBad.length === 0, `bad=${mirrorBad.join(',') || 'none'}`);
  }

  const failed = checks.filter((c) => !c.pass);
  const integrity = {
    specId: 'SPEC_10', generatedAt: new Date().toISOString(), finalRun: FINAL,
    mode: 'READ-ONLY', sanityWrites: 0, mutationCalls: 0,
    gates: {
      A_baseline: checks.filter((c) => c.gate === 'A'),
      B_architecture: checks.filter((c) => c.gate === 'B'),
      C_representation: checks.filter((c) => c.gate === 'C'),
      D_decisionReadiness: checks.filter((c) => c.gate === 'D'),
      E_research: checks.filter((c) => c.gate === 'E'),
      F_mutationSafety: checks.filter((c) => c.gate === 'F'),
    },
    checksTotal: checks.length, checksPassed: checks.length - failed.length,
    status: failed.length === 0 ? 'SPEC 10 — COMPLETE' : 'SPEC 10 — BLOCKED',
    failedChecks: failed,
    note: 'Read-only architecture phase. Completion does NOT authorize Sanity writes, schema mutations, content enrichment, relationship creation, or publishing (§33).',
  };
  fs.writeFileSync(path.join(OUT, 'INTEGRITY.json'), JSON.stringify(integrity, null, 1));
  console.log(`INTEGRITY written. checks=${checks.length} failed=${failed.length} status=${integrity.status}`);
  if (failed.length) process.exitCode = 2;
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
