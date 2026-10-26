const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// SPEC 10M — Gate A: source contract + schema inventory BEFORE + content baseline (READ-ONLY).

const TEMP_DIR = 'C:/Users/lam72/AppData/Local/Temp/opencode';
const OUT = path.join('report', 'SPEC_10M');
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_TOTAL = 473;
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const SCHEMA_FILES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem', 'index'];
const SPEC10_ARTIFACTS = [
  'SPEC_10_SCHEMA_STANDARDIZATION_REPORT.md', 'KNOWLEDGE_ARCHITECTURE_MATRIX.csv',
  'FIELD_TO_KNOWLEDGE_MAPPING.csv', 'APPLICABILITY_MATRIX.csv', 'RELATIONSHIP_MODEL.csv',
  'BODY_ARCHITECTURE.md', 'COMPLETENESS_LEVELS.md', 'RESEARCH_MODEL.csv',
  'PRIORITY_MIGRATION_QUEUE.csv', 'INTEGRITY.json', 'EXECUTION_LOG.md',
];

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);

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
const check = (id, name, ok, detail) => {
  checks.push({ id, name, pass: !!ok, detail: String(detail ?? '') });
  console.log(`${ok ? 'CHECK OK ' : 'CHECK FAIL'} ${id} ${name} — ${detail ?? ''}`);
  if (!ok) process.exitCode = 2;
};

// ---- schema source parser (structural inventory, no execution) ----
function parseSchemaFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const fieldsIdx = src.indexOf('fields: [');
  const header = src.slice(0, fieldsIdx < 0 ? src.length : fieldsIdx);
  const typeName = (/(?:^|\n)\s*name:\s*'([^']+)'/.exec(header) || [])[1] || null;
  const typeTitle = (/(?:^|\n)\s*title:\s*'([^']+)'/.exec(header) || [])[1] || null;
  const jsonType = (/(?:^|\n)\s*type:\s*'([^']+)'/.exec(header) || [])[1] || null;
  const groups = [];
  const gIdx = header.indexOf('groups: [');
  if (gIdx >= 0) {
    const gEnd = header.indexOf(']', gIdx);
    const gSrc = header.slice(gIdx, gEnd);
    const re = /\{\s*name:\s*'([^']+)',\s*title:\s*'([^']+)'/g;
    let m; while ((m = re.exec(gSrc))) groups.push({ name: m[1], title: m[2] });
  }
  const fields = [];
  let idx = fieldsIdx;
  while (idx >= 0) {
    const start = src.indexOf('defineField({', idx);
    if (start < 0) break;
    let depth = 0, i = start + 'defineField('.length, end = -1;
    for (; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end < 0) break;
    const block = src.slice(start, end + 1);
    const grab = (re) => (re.exec(block) || [])[1] || null;
    const optionsSrc = (() => { const o = block.indexOf('options:'); if (o < 0) return null; let d = 0, j = o + 'options:'.length; for (; j < block.length; j++) { if (block[j] === '{') d++; else if (block[j] === '}') { d--; if (d === 0) return block.slice(o, j + 1); } } return block.slice(o); })();
    const listVals = optionsSrc ? ((/list:\s*\[([\s\S]*?)\]/.exec(optionsSrc) || [])[1] || '')
      .split(/[\n,]/).map((s) => (s.match(/'(?:[^'\\]|\\.)*'/g) || []).map((v) => v.slice(1, -1)))
      .flat().filter(Boolean) : [];
    fields.push({
      name: grab(/name:\s*'([^']+)'/),
      title: grab(/title:\s*'([^']+)'/),
      type: grab(/type:\s*'([^']+)'/),
      group: grab(/group:\s*'([^']+)'/),
      hasValidation: /validation:/.test(block),
      required: /Rule\.required\(\)/.test(block),
      of: (block.match(/of:\s*\[([^\]]*)\]/) || [])[1] ? (block.match(/of:\s*\[([^\]]*)\]/)[1].match(/type:\s*'([^']+)'/g) || []).map((s) => /'([^']+)'/.exec(s)[1]) : [],
      to: (block.match(/to:\s*\[([^\]]*)\]/) || [])[1] ? (block.match(/to:\s*\[([^\]]*)\]/)[1].match(/type:\s*'([^']+)'/g) || []).map((s) => /'([^']+)'/.exec(s)[1]) : [],
      optionsRaw: optionsSrc,
      listValues: listVals,
      blockSha256: sha256(block),
    });
    idx = end;
  }
  return {
    file: path.basename(file),
    fileSha256: sha256(src),
    typeName, typeTitle, jsonType, groups,
    fields,
    definedNames: typeName ? [typeName] : (src.match(/^\s{2}([a-zA-Z][a-zA-Z0-9]*),\s*$/gm) || []).map((s) => s.trim().replace(',', '')),
  };
}

function parseIndexFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const imports = [...src.matchAll(/import\s+(\w+)\s+from\s+'\.\/(\w+)'/g)].map((m) => ({ local: m[1], module: m[2] }));
  const arr = (/\[\s*([\s\S]*?)\]\s*(?:;|\n)/.exec(src.slice(src.indexOf('export const schemaTypes'))) || [])[1] || '';
  const exported = arr.split(',').map((s) => s.trim()).filter(Boolean);
  return { file: path.basename(file), fileSha256: sha256(src), imports, exported };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  // Gate A-1: SPEC 10 artifacts loaded
  const missing = SPEC10_ARTIFACTS.filter((f) => !fs.existsSync(path.join('report', 'SPEC_10', f)));
  check('A-01', 'SPEC 10 artifacts loaded (11/11)', missing.length === 0, `missing=${missing.length ? missing.join(',') : 0}`);
  const spec10Int = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_10', 'INTEGRITY.json'), 'utf8'));
  check('A-02', 'SPEC 10 INTEGRITY finalRun + all checks passed + writes 0',
    spec10Int.finalRun === true && spec10Int.status.includes('COMPLETE') &&
    spec10Int.checksPassed === spec10Int.checksTotal && spec10Int.sanityWrites === 0,
    `status="${spec10Int.status}" ${spec10Int.checksPassed}/${spec10Int.checksTotal} writes=${spec10Int.sanityWrites}`);

  // mirror byte-identical (SPEC 10) — proves report set complete before deriving from it
  let mirrorOk = 0, mirrorBad = [];
  for (const f of SPEC10_ARTIFACTS) {
    const a = path.join('report', 'SPEC_10', f), b = path.join('reports', 'SPEC_10', f);
    if (fs.existsSync(a) && fs.existsSync(b) && sha256(fs.readFileSync(a)) === sha256(fs.readFileSync(b))) mirrorOk++; else mirrorBad.push(f);
  }
  check('A-03', 'SPEC 10 mirror byte-identical 11/11', mirrorOk === SPEC10_ARTIFACTS.length, `ok=${mirrorOk} bad=${mirrorBad.join(',') || 'none'}`);

  const queue = fs.readFileSync(path.join('report', 'SPEC_10', 'PRIORITY_MIGRATION_QUEUE.csv'), 'utf8').trim().split(/\r?\n/).length - 1;
  check('A-04', 'SPEC 10 migration queue loaded (106 items)', queue === 106, `items=${queue}`);

  // Gate A-2: current schema inventory captured
  const schemaDir = path.join('sanity', 'schemaTypes');
  const files = SCHEMA_FILES.map((n) => path.join(schemaDir, n + '.ts'));
  const missingSchema = files.filter((f) => !fs.existsSync(f));
  check('A-05', 'current schema files present (7/7)', missingSchema.length === 0, `missing=${missingSchema.join(',') || '0'}`);
  const parsed = files.map(parseSchemaFile);
  const indexParsed = parseIndexFile(path.join(schemaDir, 'index.ts'));
  const totalFields = parsed.reduce((a, p) => a + p.fields.length, 0);
  check('A-06', 'schema inventory parsed (fields>0, types named)', totalFields > 60 && parsed.every((p) => p.typeName || p.file === 'index.ts'),
    `files=${parsed.length} fields=${totalFields}`);

  // Gate A-3: content baseline double-read (deterministic, read-only)
  const fetchWiki = async () => { const out = {}; for (const t of WIKI_TYPES) out[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`); return out; };
  const read1 = await fetchWiki();
  const read2 = await fetchWiki();
  let mismatches = 0;
  for (const t of WIKI_TYPES) if (JSON.stringify(read1[t]) !== JSON.stringify(read2[t])) mismatches++;
  check('A-07', 'deterministic double-read identical (6 domains)', mismatches === 0, `mismatchedTypes=${mismatches}`);
  const records = read1;

  const draftDocs = await q('*[_id in path("drafts.**")]._id');
  const counts = {};
  for (const t of WIKI_TYPES) counts[t] = records[t].length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  check('A-08', '473 records / domain counts', total === EXPECTED_TOTAL && WIKI_TYPES.every((t) => counts[t] === EXPECTED[t]),
    `total=${total}/${EXPECTED_TOTAL} ${JSON.stringify(counts)}`);

  let wikiDrafts = 0;
  for (const t of WIKI_TYPES) for (const r of records[t]) if (String(r._id).startsWith('drafts.')) wikiDrafts++;
  check('A-09', 'drafts = 0', wikiDrafts === 0 && draftDocs.length === 0, `wikiDrafts=${wikiDrafts} datasetDrafts=${draftDocs.length}`);

  const slugSeen = {}; let dupSlugs = 0, noSlug = 0;
  for (const t of WIKI_TYPES) for (const r of records[t]) {
    const s = slugValue(r.slug);
    if (!s) { noSlug++; continue; }
    if (slugSeen[s]) dupSlugs++;
    slugSeen[s] = r._id;
  }
  check('A-10', 'duplicate slugs = 0', dupSlugs === 0 && noSlug === 0, `duplicates=${dupSlugs} noSlug=${noSlug}`);

  const canonical = {};
  for (const t of WIKI_TYPES) for (const r of records[t]) canonical[r._id] = { type: t, rec: r };
  const hashParts = Object.keys(canonical).sort().map((id) => {
    const c = canonical[id];
    return sha256(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) }));
  });
  const identityHash = sha256(hashParts.join('\n'));
  check('A-11', 'canonical identity hash MATCH', identityHash === EXPECTED_HASH,
    `hash=${identityHash === EXPECTED_HASH ? 'MATCH' : identityHash}`);

  // Gate A-4: precondition for approved compatibleSpecies entry-shape extension (SPEC 10 REL-M01/M02)
  const csEmpty = (records.species.every((r) => Array.isArray(r.compatibleSpecies) === false || r.compatibleSpecies.length === 0))
    && (records.invertebrate.every((r) => Array.isArray(r.compatibleSpecies) === false || r.compatibleSpecies.length === 0));
  const csNonEmpty = [...records.species, ...records.invertebrate].filter((r) => Array.isArray(r.compatibleSpecies) && r.compatibleSpecies.length > 0).length;
  check('A-12', 'compatibleSpecies empty on 218 species + 56 invertebrates (entry-shape precondition)', csEmpty, `nonEmptyDocs=${csNonEmpty}`);

  const relFields = ['compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedProblems', 'relatedPosts', 'relatedTools', 'parentSpecies'];
  const relCounts = {};
  for (const t of WIKI_TYPES) for (const f of relFields) {
    const n = records[t].reduce((a, r) => a + (Array.isArray(r[f]) ? r[f].length : 0), 0);
    if (n) relCounts[t + '.' + f] = n;
  }
  check('A-13', 'relationship data extracted for baseline', Object.keys(relCounts).length > 0, JSON.stringify(relCounts));

  const failed = checks.filter((c) => !c.pass);
  if (failed.length) {
    console.log('STOP — Gate A failed: ' + failed.map((c) => c.id).join(','));
    process.exit(2);
  }

  // content baseline (temp — full records for Gate F byte-diff)
  const baseline = {
    specId: 'SPEC_10M',
    generatedAt: new Date().toISOString(),
    mode: 'SCHEMA CODE ONLY — pre-migration content baseline (temp)',
    counts, total, identityHash, datasetDrafts: draftDocs.length, relCounts,
    records: Object.fromEntries(WIKI_TYPES.map((t) => [
      t, records[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id))),
    ])),
    notes: 'Full-document baseline for SPEC 10M Gate F. Not a deliverable artifact.',
  };
  fs.writeFileSync(path.join(TEMP_DIR, 'spec10m_baseline.json'), JSON.stringify(baseline));
  console.log('BASELINE written: ' + TEMP_DIR + '/spec10m_baseline.json');

  // SCHEMA_INVENTORY_BEFORE.json (deliverable)
  const before = {
    specId: 'SPEC_10M',
    artifact: 'SCHEMA_INVENTORY_BEFORE',
    generatedAt: new Date().toISOString(),
    mode: 'READ-ONLY',
    gateA: {
      checks,
      spec10Artifacts: SPEC10_ARTIFACTS,
      spec10Integrity: { status: spec10Int.status, finalRun: spec10Int.finalRun, checksPassed: spec10Int.checksPassed, checksTotal: spec10Int.checksTotal, sanityWrites: spec10Int.sanityWrites },
      spec10MirrorOk: mirrorOk,
      unresolvedArchitectureConflicts: [],
    },
    baseline: {
      counts, total, identityHash, drafts: wikiDrafts, datasetDrafts: draftDocs.length,
      duplicateSlugs: dupSlugs, relationshipReferenceCounts: relCounts,
      compatibleSpeciesPrecondition: { speciesDocs: records.species.length, invertebrateDocs: records.invertebrate.length, nonEmpty: csNonEmpty },
      contentBaselineFile: TEMP_DIR + '/spec10m_baseline.json',
    },
    schema: {
      schemaDir: 'sanity/schemaTypes',
      index: indexParsed,
      types: parsed.filter((p) => p.file !== 'index.ts'),
      totals: { types: parsed.filter((p) => p.file !== 'index.ts').length, fields: totalFields },
    },
    environment: {
      gitHead: require('child_process').execSync('git rev-parse --short HEAD').toString().trim(),
      gitBranch: require('child_process').execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
      node: process.version,
      mode: 'SCHEMA CODE ONLY — no Sanity content mutation calls permitted',
    },
    note: 'Inventory captured BEFORE SPEC 10M schema code changes. Content untouched.',
  };
  fs.writeFileSync(path.join(OUT, 'SCHEMA_INVENTORY_BEFORE.json'), JSON.stringify(before, null, 2));
  console.log('WROTE ' + path.join(OUT, 'SCHEMA_INVENTORY_BEFORE.json'));
  console.log('GATE A PASS — SPEC 10 sources loaded / schema inventory captured / 473 baseline / hash MATCH / compatibleSpecies empty');
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
