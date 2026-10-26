const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// SPEC 10 — READ-ONLY Gate A baseline verification.
// No mutation calls anywhere (GET query only). Baseline docs go to temp (deliverables list is fixed).

const TEMP_DIR = 'C:/Users/lam72/AppData/Local/Temp/opencode';
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_TOTAL = 473;
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';

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

const gates = [];
const gate = (id, name, ok, detail) => {
  gates.push({ id, name, pass: !!ok, detail: String(detail ?? '') });
  console.log(`${ok ? 'GATE OK' : 'GATE FAIL'} ${id} ${name} — ${detail ?? ''}`);
  if (!ok) process.exitCode = 2;
};

(async () => {
  async function fetchWiki() {
    const out = {};
    for (const t of WIKI_TYPES) out[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`);
    return out;
  }
  const read1 = await fetchWiki();
  const read2 = await fetchWiki();
  let mismatches = 0;
  for (const t of WIKI_TYPES) if (JSON.stringify(read1[t]) !== JSON.stringify(read2[t])) mismatches++;
  gate('A-00', 'deterministic double-read identical (6 domains)', mismatches === 0, `mismatchedTypes=${mismatches}`);
  if (mismatches > 0) { console.log('STOP: double-read not deterministic.'); process.exit(2); }
  const records = read1;

  const draftDocs = await q('*[_id in path("drafts.**")]._id');

  const counts = {};
  for (const t of WIKI_TYPES) counts[t] = records[t].length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  gate('A-01', '473 records confirmed / 6 domains reconciled',
    total === EXPECTED_TOTAL && WIKI_TYPES.every((t) => counts[t] === EXPECTED[t]),
    `total=${total}/${EXPECTED_TOTAL} ${JSON.stringify(counts)}`);

  let wikiDrafts = 0;
  for (const t of WIKI_TYPES) for (const r of records[t]) if (String(r._id).startsWith('drafts.')) wikiDrafts++;
  gate('A-02', 'drafts = 0', wikiDrafts === 0, `wikiDrafts=${wikiDrafts} datasetDrafts=${draftDocs.length}`);

  const slugSeen = {}; let dupSlugs = 0; let noSlug = 0;
  for (const t of WIKI_TYPES) for (const r of records[t]) {
    const s = slugValue(r.slug);
    if (!s) { noSlug++; continue; }
    if (slugSeen[s]) dupSlugs++;
    slugSeen[s] = r._id;
  }
  gate('A-03', 'duplicate slugs = 0 / no missing slug', dupSlugs === 0 && noSlug === 0,
    `duplicates=${dupSlugs} noSlug=${noSlug}`);

  const canonical = {};
  for (const t of WIKI_TYPES) for (const r of records[t]) canonical[r._id] = { type: t, rec: r };
  const hashParts = Object.keys(canonical).sort().map((id) => {
    const c = canonical[id];
    return sha256(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) }));
  });
  const identityHash = sha256(hashParts.join('\n'));
  gate('A-04', 'SPEC 09 identity hash verified', identityHash === EXPECTED_HASH,
    `hash=${identityHash === EXPECTED_HASH ? 'MATCH' : identityHash}`);

  const failed = gates.filter((g) => !g.pass);
  if (failed.length) {
    console.log('STOP: baseline mismatch — SPEC 10 will not proceed. Failing: ' + failed.map((g) => g.id).join(','));
    process.exit(2);
  }

  const baseline = {
    specId: 'SPEC_10',
    generatedAt: new Date().toISOString(),
    mode: 'READ-ONLY',
    counts, total, identityHash, datasetDrafts: draftDocs.length, gates,
    records: Object.fromEntries(WIKI_TYPES.map((t) => [
      t, records[t].slice().sort((a, b) => String(a._id).localeCompare(String(b._id))),
    ])),
    notes: 'SPEC 10 pre-architecture baseline (temp working file) for Gate F full-document diff. Not a deliverable artifact.',
  };
  fs.writeFileSync(path.join(TEMP_DIR, 'spec10_baseline.json'), JSON.stringify(baseline));
  console.log(`BASELINE written: ${TEMP_DIR}/spec10_baseline.json`);
  console.log(`GATE A PASS — 473 records / 6 domains / hash MATCH / drafts 0 / dupSlugs 0`);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
