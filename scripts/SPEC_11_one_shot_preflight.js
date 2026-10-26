const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// SPEC 11 one-shot - pre-write preflight (READ-ONLY, GET only).

const OUT = path.join('reports', 'SPEC_11', 'one_shot');
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_TOTAL = 473;
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const shaFile = (f) => sha256(fs.readFileSync(f));
const slugValue = (s) => (typeof s === 'string' ? s : (s && s.current) || null);
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
  checks.push({ id, name, pass: !!ok, detail: String(detail == null ? '' : detail) });
  console.log((ok ? 'CHECK OK ' : 'CHECK FAIL ') + id + ' ' + name + ' - ' + (detail == null ? '' : detail));
};

function verifySourceChain() {
  const results = {};
  const p11 = 'report/SPEC_11';
  const mirror = 'reports/SPEC_11';
  const rev = 'reports/SPEC_11/revision_1';

  const integrity = JSON.parse(fs.readFileSync(path.join(p11, 'INTEGRITY.json'), 'utf8'));
  results.stageAFinal = integrity.finalRun === true;
  results.stageAGates = integrity.gatesPassed + '/' + (integrity.gatesPassed + integrity.gatesFailed);
  results.stageAWrites = integrity.sanityWrites;
  check('P-01', 'Stage A INTEGRITY finalRun + gates pass + writes 0',
    integrity.finalRun === true && integrity.gatesFailed === 0 && integrity.sanityWrites === 0 && integrity.mutationCalls === 0,
    'finalRun=' + integrity.finalRun + ' gates=' + results.stageAGates + ' writes=' + integrity.sanityWrites);

  let mirrorOk = 0; const mirrorBad = [];
  for (const [f, h] of Object.entries(integrity.artifactHashes)) {
    const mp = path.join(mirror, f);
    if (fs.existsSync(mp) && shaFile(mp) === h) mirrorOk++; else mirrorBad.push(f);
  }
  check('P-02', 'Stage A mirror reports/SPEC_11 byte-identical', mirrorBad.length === 0,
    'ok=' + mirrorOk + '/' + Object.keys(integrity.artifactHashes).length + (mirrorBad.length ? ' bad=' + mirrorBad.join(',') : ''));

  const rv = JSON.parse(fs.readFileSync(path.join(rev, 'REVISION_VALIDATION.json'), 'utf8'));
  const rvChecks = rv.checks || [];
  const rvFailed = rvChecks.filter((c) => !c.pass).length;
  check('P-03', 'Revision 1 validation all checks pass', rvChecks.length >= 15 && rvFailed === 0,
    'passed=' + (rvChecks.length - rvFailed) + '/' + rvChecks.length + ' writes=' + rv.sanityWrites);

  const sums = fs.readFileSync(path.join(rev, 'REVISION_1_CHECKSUMS.txt'), 'utf8');
  const entries = [...sums.matchAll(/^\s+([A-Z0-9_.-]+\.(?:csv|md|txt|json)):\s*([a-f0-9]{64})/gm)];
  const bad = entries.filter(([, f, h]) => {
    const inRev = path.join(rev, f);
    const inP11 = path.join(p11, f);
    const target = fs.existsSync(inRev) ? inRev : (fs.existsSync(inP11) ? inP11 : null);
    return !target || shaFile(target) !== h;
  });
  check('P-04', 'Revision 1 checksums re-verified (original + revision)', entries.length >= 15 && bad.length === 0,
    'entries=' + entries.length + (bad.length ? ' bad=' + bad.map((b) => b[1]).join(',') : ''));

  return { integrity, mirrorOk, mirrorTotal: Object.keys(integrity.artifactHashes).length, revEntries: entries.length, rvFailed };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const source = verifySourceChain();

  const fetchWiki = async () => { const out = {}; for (const t of WIKI_TYPES) out[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`); return out; };
  const read1 = await fetchWiki();
  const read2 = await fetchWiki();
  let mismatches = 0;
  for (const t of WIKI_TYPES) if (JSON.stringify(read1[t]) !== JSON.stringify(read2[t])) mismatches++;
  check('B-01', 'deterministic double-read identical (6 domains)', mismatches === 0, 'mismatchedTypes=' + mismatches);
  const records = read1;

  const draftDocs = await q('*[_id in path("drafts.**")]._id');
  const counts = {};
  for (const t of WIKI_TYPES) counts[t] = records[t].length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  check('B-02', '473 records / domain counts frozen', total === EXPECTED_TOTAL && WIKI_TYPES.every((t) => counts[t] === EXPECTED[t]),
    'total=' + total + '/' + EXPECTED_TOTAL + ' ' + JSON.stringify(counts));

  let wikiDrafts = 0;
  for (const t of WIKI_TYPES) for (const r of records[t]) if (String(r._id).startsWith('drafts.')) wikiDrafts++;
  check('B-03', 'drafts = 0', wikiDrafts === 0 && draftDocs.length === 0, 'wikiDrafts=' + wikiDrafts + ' datasetDrafts=' + draftDocs.length);

  const slugSeen = {}; let dupSlugs = 0, noSlug = 0;
  for (const t of WIKI_TYPES) for (const r of records[t]) {
    const s = slugValue(r.slug);
    if (!s) { noSlug++; continue; }
    if (slugSeen[s]) dupSlugs++;
    slugSeen[s] = r._id;
  }
  check('B-04', 'duplicate slugs = 0', dupSlugs === 0 && noSlug === 0, 'duplicates=' + dupSlugs + ' noSlug=' + noSlug);

  const canonical = {};
  for (const t of WIKI_TYPES) for (const r of records[t]) canonical[r._id] = { type: t, rec: r };
  const canonicalIds = Object.keys(canonical).sort();
  const hashParts = canonicalIds.map((id) => {
    const c = canonical[id];
    return sha256(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) }));
  });
  const identityHash = sha256(hashParts.join('\n'));
  check('B-05', 'canonical identity hash matches baseline', identityHash === EXPECTED_HASH,
    identityHash === EXPECTED_HASH ? 'MATCH' : identityHash);

  const relFields = ['compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedProblems', 'relatedPosts', 'relatedTools', 'parentSpecies', 'compatibleSpecies', 'incompatibleSpecies', 'predatorPrey'];
  const relSeal = sha256(WIKI_TYPES.map((t) => records[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id)))
    .map((r) => JSON.stringify(relFields.map((f) => (Array.isArray(r[f]) ? r[f].map((v) => (v && v._ref) || v) : r[f] == null ? null : r[f])))).join('\n')).join('\n'));
  const seoSeal = sha256(WIKI_TYPES.map((t) => records[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id)))
    .map((r) => JSON.stringify(r.seo || null)).join('\n')).join('\n'));
  const titleSlugSeal = sha256(hashParts.join('\n'));

  const revisions = {};
  for (const t of WIKI_TYPES) for (const r of records[t]) revisions[r._id] = { rev: r._rev, updatedAt: r._updatedAt };

  // observed field inventory per type (union of keys across docs)
  const observed = {};
  for (const t of WIKI_TYPES) {
    const s = new Set();
    for (const r of records[t]) Object.keys(r).forEach((k) => s.add(k));
    observed[t] = [...s].sort();
  }
  const speciesObserved = observed.species;

  const failed = checks.filter((c) => !c.pass);
  const baseline = {
    specId: 'SPEC_11', artifact: 'ONE_SHOT_PRE_WRITE_BASELINE', generatedAt: new Date().toISOString(),
    mode: 'READ-ONLY preflight before one-shot production writes',
    authorization: 'one_shot invocation = production write authorization; repo schema treated as authoritative (user decision)',
    checks,
    inventory: { counts, total, drafts: wikiDrafts, datasetDrafts: draftDocs.length, duplicateSlugs: dupSlugs, noSlug },
    identity: { hash: identityHash, expected: EXPECTED_HASH, match: identityHash === EXPECTED_HASH },
    seals: { titleSlugSeal, seoSeal, relSeal },
    revisions,
    observedFieldInventory: observed,
    speciesObservedFields: speciesObserved,
    sourceChain: {
      stageAIntegrity: { finalRun: source.integrity.finalRun, gatesPassed: source.integrity.gatesPassed, gatesFailed: source.integrity.gatesFailed, sanityWrites: source.integrity.sanityWrites, mutationCalls: source.integrity.mutationCalls },
      stageAMirror: source.mirrorOk + '/' + source.mirrorTotal,
      revision1ChecksumEntries: source.revEntries,
      revision1ValidationFailed: source.rvFailed,
      note: 'Frozen SPEC 11 upstream artifacts were absent and regenerated deterministically; verified here before use. phase/11 PM package + Phases 01-03 were not reproducible (hardcoded SHA-256, untracked) and are not consumed.',
    },
    environment: {
      gitHead: require('child_process').execSync('git rev-parse --short HEAD').toString().trim(),
      node: process.version,
    },
  };
  fs.writeFileSync(path.join(OUT, 'PRE_WRITE_BASELINE.json'), JSON.stringify(baseline, null, 2));
  console.log('WROTE ' + path.join(OUT, 'PRE_WRITE_BASELINE.json'));
  if (failed.length) { console.error('PREFLIGHT FAILED: ' + failed.map((c) => c.id).join(',')); process.exit(2); }
  console.log('PREFLIGHT PASS - 473 / hash MATCH / seals captured / source chain verified');
  console.log('species observed fields: ' + speciesObserved.length);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
