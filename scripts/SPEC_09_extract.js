const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// SPEC 09 — READ-ONLY baseline extract + integrity gates.
// No mutation calls are made anywhere in this script (GET query only).

const OUT_DIR = path.join('report', 'SPEC_09');
fs.mkdirSync(OUT_DIR, { recursive: true });

const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_TOTAL = 473;
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';

// Route directories that must exist for wiki slugs to be resolvable.
const ROUTES = {
  species: 'app/species/[slug]/page.tsx',
  plant: 'app/plants/[slug]/page.tsx',
  invertebrate: 'app/invertebrates/[slug]/page.tsx',
  coral: 'app/corals/[slug]/page.tsx',
  equipment: 'app/equipment/[slug]/page.tsx',
  problem: 'app/problems/[slug]/page.tsx',
};

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);

// Read-only GROQ GET. No POST, no mutation endpoint.
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

const gates = [];
const gate = (id, name, ok, detail) => {
  gates.push({ id, name, pass: !!ok, detail: String(detail ?? '') });
  console.log(`${ok ? 'GATE OK' : 'GATE FAIL'} ${id} ${name} — ${detail ?? ''}`);
  if (!ok) process.exitCode = 2;
};

(async () => {
  // ---- read #1 ----
  async function fetchWiki() {
    const out = {};
    for (const t of WIKI_TYPES) out[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`);
    return out;
  }
  const read1 = await fetchWiki();
  // ---- read #2 (deterministic double-read, §17) ----
  const read2 = await fetchWiki();

  let doubleReadMismatches = 0;
  for (const t of WIKI_TYPES) {
    const a = JSON.stringify(read1[t]);
    const b = JSON.stringify(read2[t]);
    if (a !== b) doubleReadMismatches++;
  }
  gate('A-00', 'deterministic double-read identical (6 types)',
    doubleReadMismatches === 0, `mismatchedTypes=${doubleReadMismatches}`);
  if (doubleReadMismatches > 0) {
    console.log('STOP: double-read not deterministic — required data cannot be read reliably.');
    process.exit(2);
  }
  const records = read1;

  const draftDocs = await q('*[_id in path("drafts.**")]._id');

  // ---- A-01 exact type counts + total ----
  const counts = {};
  for (const t of WIKI_TYPES) counts[t] = records[t].length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const countsOk = WIKI_TYPES.every((t) => counts[t] === EXPECTED[t]);
  gate('A-01', 'canonical count = 473 with exact type counts',
    total === EXPECTED_TOTAL && countsOk,
    `total=${total}/${EXPECTED_TOTAL} ${JSON.stringify(counts)}`);

  // ---- A-02 drafts = 0 (wiki) ----
  let wikiDraftRows = 0;
  for (const t of WIKI_TYPES) for (const r of records[t]) if (String(r._id).startsWith('drafts.')) wikiDraftRows++;
  gate('A-02', 'drafts = 0 (wiki records)',
    wikiDraftRows === 0, `wikiDrafts=${wikiDraftRows} datasetDrafts=${draftDocs.length}`);

  // ---- A-03 no duplicate slugs / A-04 no undefined routes ----
  const slugSeen = {}; let dupSlugs = 0; let noSlug = 0;
  const dupList = []; const noSlugList = [];
  for (const t of WIKI_TYPES) for (const r of records[t]) {
    const s = slugValue(r.slug);
    if (!s) { noSlug++; noSlugList.push(`${t}:${r._id}`); continue; }
    if (slugSeen[s]) { dupSlugs++; dupList.push(`${t}:${s}`); }
    slugSeen[s] = r._id;
  }
  gate('A-03', 'no duplicate slugs', dupSlugs === 0,
    `duplicates=${dupSlugs}${dupList.length ? ' ' + dupList.slice(0, 5).join(' ') : ''}`);
  const missingRouteFiles = Object.entries(ROUTES).filter(([, p]) => !fs.existsSync(p)).map(([t]) => t);
  gate('A-04', 'no undefined routes (all wiki slugs present + route files exist)',
    noSlug === 0 && missingRouteFiles.length === 0,
    `recordsWithoutSlug=${noSlug} missingRouteFiles=${missingRouteFiles.join(',') || 'none'}`);

  // ---- A-05 canonical identity hash (algorithm from SPEC_03/04 validators) ----
  const canonical = {};
  for (const t of WIKI_TYPES) for (const r of records[t]) canonical[r._id] = { type: t, rec: r };
  const hashParts = Object.keys(canonical).sort().map((id) => {
    const c = canonical[id];
    return sha256(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) }));
  });
  const identityHash = sha256(hashParts.join('\n'));
  gate('A-05', 'canonical identity hash matches SPEC 09 baseline',
    identityHash === EXPECTED_HASH, `hash=${identityHash === EXPECTED_HASH ? 'MATCH' : identityHash}`);

  const failed = gates.filter((g) => !g.pass);
  if (failed.length) {
    console.log('STOP: baseline mismatch — SPEC 09 will not proceed. Failing gates: ' + failed.map((g) => g.id).join(','));
    process.exit(2);
  }

  // ---- immutable snapshot (full docs, sorted) ----
  const snapshot = {
    specId: 'SPEC_09',
    generatedAt: new Date().toISOString(),
    mode: 'READ-ONLY',
    source: { project: 'zeohjejw', dataset: 'production', apiVersion: '2026-05-25' },
    expected: { counts: EXPECTED, total: EXPECTED_TOTAL, identityHash: EXPECTED_HASH },
    counts, total,
    identityHash,
    doubleRead: { identical: true, mismatchedTypes: doubleReadMismatches },
    datasetDrafts: draftDocs.length,
    gates,
    records: Object.fromEntries(WIKI_TYPES.map((t) => [
      t, records[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id))),
    ])),
    notes: 'Immutable pre-audit snapshot. Full published wiki documents as read (GET only). Used for §17 post-audit integrity comparison (titles/slugs/categories/relationships/SEO/_updatedAt must not change).',
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_09_BASELINE_SNAPSHOT.json'), JSON.stringify(snapshot, null, 1));
  console.log(`SNAPSHOT written: ${path.join(OUT_DIR, 'SPEC_09_BASELINE_SNAPSHOT.json')}`);
  console.log(`BASELINE PASS — total=${total} hash=MATCH drafts=0 dupSlugs=0 noSlug=0`);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
