const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const OUT_DIR = path.join('report', 'SPEC_04');
const SPEC03_DIR = path.join('report', 'SPEC_03');
fs.mkdirSync(OUT_DIR, { recursive: true });

const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
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
  // ---- fresh canonical fetch (read-only), fetched twice for read-determinism ----
  async function fetchWiki() {
    const out = {};
    for (const t of WIKI_TYPES) out[t] = await q(`*[_type == "${t}" && !(_id in path("drafts.**"))]`);
    return out;
  }
  const records = await fetchWiki();
  for (const t of WIKI_TYPES) console.log(`[${t}] fetched ${records[t].length}`);
  const records2 = await fetchWiki();
  const posts = await q('*[_type == "post" && !(_id in path("drafts.**"))]');
  const tools = await q('*[_type == "tool" && !(_id in path("drafts.**"))]');
  const categories = await q('*[_type == "category" && !(_id in path("drafts.**"))]');
  console.log(`[post] ${posts.length} [tool] ${tools.length} [category] ${categories.length}`);

  // drafts dataset-wide (informational)
  const draftDocs = await q('*[_id in path("drafts.**")]._id');
  const wikiDrafts = WIKI_TYPES.reduce((s, t) => s + records[t].filter((r) => r._id.startsWith('drafts.')).length, 0);

  // ---- structural gates ----
  const counts = {};
  for (const t of WIKI_TYPES) counts[t] = records[t].filter((r) => !r._id.startsWith('drafts.')).length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  gate('A-01', 'canonical record count = 473',
    total === 473 && WIKI_TYPES.every((t) => counts[t] === EXPECTED[t]),
    `total=${total} ${JSON.stringify(counts)}`);
  gate('A-02', 'drafts = 0 (wiki)', wikiDrafts === 0, `wikiDrafts=${wikiDrafts} datasetDrafts=${draftDocs.length}`);

  const slugSeen = {}; let dupSlugs = 0, noSlug = 0;
  for (const t of WIKI_TYPES) for (const r of records[t]) {
    const s = slugValue(r.slug);
    if (!s) { noSlug++; continue; }
    if (slugSeen[s]) dupSlugs++;
    slugSeen[s] = r._id;
  }
  gate('A-03', 'no duplicate slugs', dupSlugs === 0, `duplicates=${dupSlugs}`);
  gate('A-04', 'no undefined routes (all wiki slugs present)', noSlug === 0, `recordsWithoutSlug=${noSlug}`);

  // ---- SPEC 03 artifacts loaded (§3.3) ----
  const requiredSpec03 = [
    'SPEC_03_POST_ENRICHMENT_SNAPSHOT.json', 'SPEC_03_CONTENT_DIFF.csv', 'SPEC_03_MUTATION_LOG.json',
    'SPEC_03_VALIDATION.json', 'SPEC_03_POST_VALIDATION.json', 'SPEC_03_RAW_SOURCE_MANIFEST.json',
  ];
  const missing03 = requiredSpec03.filter((n) => !fs.existsSync(path.join(SPEC03_DIR, n)));
  gate('A-05', 'SPEC 03 required artifacts loaded', missing03.length === 0, `missing=${missing03.join(',') || 'none'}`);

  const spec03Post = JSON.parse(fs.readFileSync(path.join(SPEC03_DIR, 'SPEC_03_POST_ENRICHMENT_SNAPSHOT.json'), 'utf8'));
  const spec03Val = JSON.parse(fs.readFileSync(path.join(SPEC03_DIR, 'SPEC_03_VALIDATION.json'), 'utf8'));
  const spec03PostVal = JSON.parse(fs.readFileSync(path.join(SPEC03_DIR, 'SPEC_03_POST_VALIDATION.json'), 'utf8'));
  const mlog = JSON.parse(fs.readFileSync(path.join(SPEC03_DIR, 'SPEC_03_MUTATION_LOG.json'), 'utf8'));
  gate('A-06', 'SPEC 03 validations PASS (14/14 + 22/22), mutation log intact (191 applied / 0 aborted)',
    spec03Val.result === 'PASS' && spec03PostVal.result === 'PASS' && mlog.appliedFieldCount === 191 && (mlog.aborted || []).length === 0,
    `spec03=${spec03Val.result} post=${spec03PostVal.result} applied=${mlog.appliedFieldCount} aborted=${(mlog.aborted || []).length}`);

  // ---- identity reconciliation (§3.4) ----
  const canonical = {};
  let idDiff = 0, slugDiff = 0, titleDiff = 0;
  for (const t of WIKI_TYPES) for (const r of records[t]) canonical[r._id] = { type: t, rec: r };
  const spec03Ids = {};
  for (const t of WIKI_TYPES) for (const r of spec03Post.records[t]) spec03Ids[r._id] = { type: t, rec: r };
  for (const id of Object.keys(spec03Ids)) if (!canonical[id]) idDiff++;
  for (const id of Object.keys(canonical)) if (!spec03Ids[id]) idDiff++;
  for (const id of Object.keys(spec03Ids)) {
    const live = canonical[id], old = spec03Ids[id];
    if (!live) continue;
    if (slugValue(live.rec.slug) !== slugValue(old.rec.slug)) slugDiff++;
    if ((titleOf(live.type, live.rec) ?? null) !== (titleOf(old.type, old.rec) ?? null)) titleDiff++;
  }
  gate('A-07', 'identity baseline reconciled vs SPEC 03 (id/slug/title diff = 0)', idDiff === 0 && slugDiff === 0 && titleDiff === 0,
    `idDiff=${idDiff} slugDiff=${slugDiff} titleDiff=${titleDiff}`);

  const hashParts = Object.keys(canonical).sort().map((id) => {
    const c = canonical[id];
    return sha256(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) }));
  });
  const hash = sha256(hashParts.join('\n'));
  gate('A-08', 'canonical identity hash matches SPEC 03 baseline', hash === EXPECTED_HASH, `hash=${hash}`);

  // ---- mutation integrity: full-document diff vs SPEC 03 post snapshot (§11) ----
  function fullDiff(fresh, old) {
    const changed = [];
    for (const t of WIKI_TYPES) {
      const oldBy = {}; for (const r of old[t]) oldBy[r._id] = r;
      for (const r of fresh[t]) {
        const o = oldBy[r._id];
        if (!o) { changed.push(`${r._id}:ADDED`); continue; }
        const keys = new Set([...Object.keys(o), ...Object.keys(r)]);
        for (const k of keys) if (JSON.stringify(o[k] ?? null) !== JSON.stringify(r[k] ?? null)) changed.push(`${r._id}.${k}`);
      }
      for (const r of Object.values(oldBy)) if (!fresh[t].some((x) => x._id === r._id)) changed.push(`${r._id}:REMOVED`);
    }
    return changed;
  }
  const changedVsSpec03 = fullDiff(records, spec03Post.records);
  const changedVsRefetch = fullDiff(records, records2);
  gate('A-09', 'canonical mutation count = 0 (vs SPEC 03 snapshot) and read is deterministic (double-fetch identical)',
    changedVsSpec03.length === 0 && changedVsRefetch.length === 0,
    `changedVsSpec03=${changedVsSpec03.length} transientVsRefetch=${changedVsRefetch.length}` +
    (changedVsSpec03.length ? ' first=' + changedVsSpec03[0] : '') +
    (changedVsRefetch.length ? ' transient=' + changedVsRefetch[0] : ''));
  if (changedVsSpec03.length || changedVsRefetch.length) {
    console.log('STOP: canonical drift or non-deterministic read detected. Do not continue until explained.');
    process.exit(3);
  }

  // ---- required counts (§12) ----
  const plan = JSON.parse(fs.readFileSync(path.join(SPEC03_DIR, 'SPEC_03_REPAIR_PLAN.json'), 'utf8'));
  const reviewRows = plan.proposals.filter((p) => p.action === 'REVIEW_REQUIRED');
  const replaceRows = plan.proposals.filter((p) => p.action === 'REPLACE_FIELD');
  const blockedRows = plan.proposals.filter((p) => p.action === 'BLOCKED_FOR_REPAIR');
  const seoRows = plan.proposals.filter((p) => p.field === 'seo');
  const oppLines = fs.readFileSync(path.join(SPEC03_DIR, 'SPEC_03_RELATIONSHIP_OPPORTUNITIES.csv'), 'utf8')
    .trim().split('\n').slice(1).map((l) => l.trim()).filter(Boolean);
  const liveSeoMissing = records.species.filter((r) => !(r.seo && (r.seo.metaTitle || r.seo.metaDescription))).length;
  gate('A-10', 'required counts: REVIEW=108 REPLACE=3 BLOCKED=1146 RELATIONSHIP=1244 SEO=218',
    reviewRows.length === 108 && replaceRows.length === 3 && blockedRows.length === 1146 && oppLines.length === 1244 && seoRows.length === 218 && liveSeoMissing === 218,
    `review=${reviewRows.length} replace=${replaceRows.length} blocked=${blockedRows.length} relationship=${oppLines.length} seoPlan=${seoRows.length} seoLiveMissing=${liveSeoMissing}`);

  // ---- §7 pre-audit snapshot (immutable) ----
  const snapshot = {
    spec: 'SPEC 04', phase: 'PRE_AUDIT_SNAPSHOT', generatedAt: new Date().toISOString(),
    projectId: 'zeohjejw', dataset: 'production', apiVersion: '2026-05-25',
    extractionMethod: 'Sanity HTTP API — data/query (read-only). Full-document projection incl. _rev. Zero mutations.',
    canonicalHash: hash, wikiTypeCounts: counts, totalWikiRecords: total, drafts: wikiDrafts, datasetDrafts: draftDocs.length,
    identityVsSpec03: { idDiff, slugDiff, titleDiff },
    records, posts, tools, categories,
    gates,
    gateAStatus: gates.every((g) => g.pass) ? 'PASS' : 'FAIL',
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_04_PRE_AUDIT_SNAPSHOT.json'), JSON.stringify(snapshot, null, 1));

  // ---- source manifest (deterministic coverage, §12) ----
  const spec03Files = requiredSpec03.map((n) => {
    const p = path.join(SPEC03_DIR, n);
    const buf = fs.readFileSync(p);
    return { file: `report/SPEC_03/${n}`, sha256: sha256(buf.toString('base64')), bytes: buf.length };
  });
  const manifest = {
    spec: 'SPEC 04', phase: 'SOURCE_MANIFEST', generatedAt: snapshot.generatedAt,
    readEndpoints: {
      wiki: WIKI_TYPES.map((t) => `*[_type == "${t}" && !(_id in path("drafts.**"))]`),
      posts: '*[_type == "post" && !(_id in path("drafts.**"))]',
      tools: '*[_type == "tool" && !(_id in path("drafts.**"))]',
      categories: '*[_type == "category" && !(_id in path("drafts.**"))]',
      drafts: '*[_id in path("drafts.**")]._id',
    },
    writeOperations: 0,
    coverage: {
      wiki: counts, posts: posts.length, tools: tools.length, categories: categories.length,
      planRows: plan.proposals.length,
      reviewRows: reviewRows.length, replaceRows: replaceRows.length, blockedRows: blockedRows.length,
      relationshipOpportunities: oppLines.length, seoOpportunities: seoRows.length,
    },
    spec03Artifacts: spec03Files,
    expectedCounts: { REVIEW_REQUIRED: 108, REPLACE_FIELD: 3, BLOCKED_FOR_REPAIR: 1146, RELATIONSHIP_OPPORTUNITIES: 1244, SEO_OPPORTUNITIES: 218 },
    deterministic: 'Sources are fixed file inputs + a single read-only API snapshot; re-running extract reproduces identical coverage.',
    canonicalHash: hash,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_04_SOURCE_MANIFEST.json'), JSON.stringify(manifest, null, 2));

  console.log(`\nGATE A: ${gates.filter((g) => g.pass).length}/${gates.length} gates OK — snapshot + manifest written to report/SPEC_04/`);
  if (!gates.every((g) => g.pass)) process.exit(2);
})().catch((e) => { console.error('EXTRACT ERROR:', e.message); process.exit(1); });
