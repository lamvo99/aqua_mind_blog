const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// SPEC 10N Phase E - read-only verification + schema/integration audit.
// No writes to Content Lake. GET query only.

const OUT = path.join('reports', 'SPEC_10N');
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_TOTAL = 473;
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);
const readIf = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');

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
  console.log((ok ? 'CHECK OK   ' : 'CHECK FAIL ') + id + ' ' + name + ' - ' + (detail ?? ''));
};

// --- integration sources ---
const SRC = {
  projection: readIf('lib/database.ts'),
  facts: readIf('lib/species-facts.ts'),
  speciesPage: readIf('app/species/[slug]/page.tsx'),
  invertPage: readIf('app/invertebrates/[slug]/page.tsx'),
  checker: readIf('app/tools/compatibility-checker/page.tsx'),
  test10m: readIf('tests/spec10m-schema.test.ts'),
  test10n: readIf('tests/spec10n-integration.test.ts'),
};
const RENDER_SCOPE = SRC.facts + '\n' + SRC.speciesPage + '\n' + SRC.invertPage;
const TEST_SCOPE = SRC.test10m + '\n' + SRC.test10n;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  // ---- integrity (read-only) ----
  const fetchWiki = async () => { const out = {}; for (const t of WIKI_TYPES) out[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`); return out; };
  const records = await fetchWiki();
  const draftDocs = await q('*[_id in path("drafts.**")]._id');
  const counts = {};
  for (const t of WIKI_TYPES) counts[t] = records[t].length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  check('N-A1', 'record counts match baseline', total === EXPECTED_TOTAL && WIKI_TYPES.every((t) => counts[t] === EXPECTED[t]),
    'total=' + total + '/' + EXPECTED_TOTAL + ' ' + JSON.stringify(counts));

  let wikiDrafts = 0;
  for (const t of WIKI_TYPES) for (const r of records[t]) if (String(r._id).startsWith('drafts.')) wikiDrafts++;
  check('N-A2', 'drafts = 0 (no drafts created)', wikiDrafts === 0 && draftDocs.length === 0, 'wikiDrafts=' + wikiDrafts + ' datasetDrafts=' + draftDocs.length);

  const canonical = {};
  for (const t of WIKI_TYPES) for (const r of records[t]) canonical[r._id] = { type: t, rec: r };
  const hashParts = Object.keys(canonical).sort().map((id) => {
    const c = canonical[id];
    return sha256(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) }));
  });
  const identityHash = sha256(hashParts.join('\n'));
  check('N-A3', 'canonical identity hash unchanged', identityHash === EXPECTED_HASH, identityHash === EXPECTED_HASH ? 'MATCH' : 'MISMATCH ' + identityHash);

  const relFields = ['compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedProblems', 'relatedPosts', 'relatedTools', 'parentSpecies', 'compatibleSpecies', 'incompatibleSpecies', 'predatorPrey'];
  const relSeal = sha256(WIKI_TYPES.map((t) => records[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id)))
    .map((r) => JSON.stringify(relFields.map((f) => (Array.isArray(r[f]) ? r[f].map((v) => (v && (v._ref || v.ref?._ref)) || v) : r[f] ?? null)))).join('\n')).join('\n'));
  const seoSeal = sha256(WIKI_TYPES.map((t) => records[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id)))
    .map((r) => JSON.stringify(r.seo || null)).join('\n')).join('\n'));

  // ---- schema field audit ----
  const diff = JSON.parse(readIf('report/SPEC_10M/SCHEMA_DIFF.json'));
  const rows = [];
  for (const t of diff.types) {
    for (const f of (t.approvedAdditions || [])) {
      const inProj = SRC.projection.includes(f) || (f === 'knowledgeBody' && SRC.projection.includes('knowledgeBody'));
      const rendered = RENDER_SCOPE.includes(f) || (f === 'knowledgeBody' && RENDER_SCOPE.includes('knowledgeBodySections'));
      const tested = TEST_SCOPE.includes(f);
      rows.push({
        type: t.typeName,
        field: f,
        schema_status: 'present (SPEC 10M)',
        query_integration: inProj ? 'projected' : 'schema-only',
        rendering_status: rendered ? 'rendered' : 'schema-only',
        test_status: tested ? 'covered' : 'not-covered',
        notes: f === 'knowledgeBody' ? 'Portable Text sections via PortableText' : '',
      });
    }
  }
  for (const f of diff.approvedModifications || []) {
    rows.push({
      type: f.split('.')[0],
      field: f.split('.')[1] + ' (modified)',
      schema_status: 'modified (SPEC 10M entry shape)',
      query_integration: SRC.projection.includes('compatibleSpecies[]{ ref->') ? 'projected (entry ref)' : 'NOT-integrated',
      rendering_status: (SRC.speciesPage.includes('compatibleSpeciesRefs') || SRC.invertPage.includes('compatibleSpeciesRefs')) ? 'rendered (entry ref)' : 'NOT-integrated',
      test_status: TEST_SCOPE.includes('compatibleSpeciesRefs') || TEST_SCOPE.includes('compatibleSpecies') ? 'covered' : 'not-covered',
      notes: 'bare []-> deref broken by object shape; fixed to [].ref->',
    });
  }
  const header = 'domain,field,schema_status,query_integration,rendering_status,test_status,notes\n';
  const csv = header + rows.map((r) => [r.type, r.field, r.schema_status, r.query_integration, r.rendering_status, r.test_status, r.notes].map((v) => /[",\n]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : v).join(',')).join('\n') + '\n';
  fs.writeFileSync(path.join(OUT, 'SCHEMA_FIELD_AUDIT.csv'), csv);

  const schemaOnly = rows.filter((r) => r.rendering_status === 'schema-only').length;
  const projected = rows.filter((r) => String(r.query_integration).startsWith('projected')).length;
  const rendered = rows.filter((r) => String(r.rendering_status).startsWith('rendered')).length;
  check('N-B1', '10 types / 90 fields / 2 modified accounted for', rows.length === 90 + 2, 'rows=' + rows.length);
  check('N-B2', 'schema field audit written', fs.existsSync(path.join(OUT, 'SCHEMA_FIELD_AUDIT.csv')), 'projected=' + projected + ' rendered=' + rendered + ' schema-only=' + schemaOnly);

  // ---- integration checks ----
  check('N-C1', 'database projection uses compatibleSpecies entry ref shape', SRC.projection.includes('compatibleSpecies[]{ ref->'), 'lib/database.ts');
  check('N-C2', 'compatibility-checker GROQ dereferences entry ref', SRC.checker.includes('compatibleSpecies[defined(ref)].ref->slug.current') && !SRC.checker.includes('compatibleSpecies[]->slug.current'), 'app/tools/compatibility-checker/page.tsx');
  check('N-C3', 'species/invertebrate pages unwrap entry refs', SRC.speciesPage.includes('compatibleSpeciesRefs') && SRC.invertPage.includes('compatibleSpeciesRefs'), 'pages');
  check('N-C4', 'husbandry rendering module present', SRC.facts.includes('buildHusbandryFacts') && SRC.speciesPage.includes('buildHusbandryFacts'), 'lib/species-facts.ts + species page');

  const failed = checks.filter((c) => !c.pass);
  const integrity = {
    specId: 'SPEC_10N',
    artifact: 'INTEGRITY',
    generatedAt: new Date().toISOString(),
    mode: 'READ-ONLY verification (GET query only; no Content Lake writes)',
    content_mutations: 0,
    checks,
    inventory: { counts, total, drafts: wikiDrafts, datasetDrafts: draftDocs.length, expected: { counts: EXPECTED, total: EXPECTED_TOTAL } },
    identity: { hash: identityHash, expected: EXPECTED_HASH, match: identityHash === EXPECTED_HASH },
    seals: { seoSeal, relSeal },
    schemaAudit: { rows: rows.length, projected, rendered, schemaOnly },
    deployedSchema: { studioUrl: 'https://aqua-mind-blog.sanity.studio/', workspace: 'default', dataset: 'production', projectId: 'zeohjejw' },
    environment: {
      gitHead: require('child_process').execSync('git rev-parse --short HEAD').toString().trim(),
      gitBranch: require('child_process').execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
      node: process.version,
    },
    verdict: failed.length ? 'FAIL' : 'PASS',
  };
  fs.writeFileSync(path.join(OUT, 'INTEGRITY.json'), JSON.stringify(integrity, null, 2));

  console.log('WROTE ' + path.join(OUT, 'INTEGRITY.json'));
  console.log('INTEGRITY ' + integrity.verdict + ' - total=' + total + ' hash=' + (identityHash === EXPECTED_HASH ? 'MATCH' : 'MISMATCH') + ' mutations=0');
  process.exit(failed.length ? 2 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
