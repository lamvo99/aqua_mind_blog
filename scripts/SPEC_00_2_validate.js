const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUT = path.join('report', 'SPEC_00_2');
const SPEC01 = path.join('report', 'SPEC_00_1');
const envContent = fs.readFileSync('.env.local', 'utf8');
const TOKEN = (envContent.match(/SANITY_API_TOKEN="([^"]+)"/) || [])[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';

const matrix = JSON.parse(fs.readFileSync(path.join(OUT, 'SPEC_00_2_REPAIR_MATRIX.json'), 'utf8'));
const matrixRows = Array.isArray(matrix) ? matrix : matrix.rows;
const preSnapshot = JSON.parse(fs.readFileSync(path.join(OUT, 'SPEC_00_2_PRE_MUTATION_SNAPSHOT.json'), 'utf8'));
const mutationLog = JSON.parse(fs.readFileSync(path.join(OUT, 'SPEC_00_2_MUTATION_LOG.json'), 'utf8'));

const hashOf = (id, title, slug) => crypto.createHash('sha256').update(JSON.stringify({ id, title, slug })).digest('hex');

async function q(groq) {
  const res = await fetch(`${BASE}?query=${encodeURIComponent(groq)}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`query failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).result;
}
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);

const ROUTE_MAP = { species: 'species', plant: 'plants', invertebrate: 'invertebrates', coral: 'corals', equipment: 'equipment', problem: 'problems' };

// ---- Re-read regenerated SPEC 00.1 artifacts (post-repair) ----
const raw = JSON.parse(fs.readFileSync(path.join(SPEC01, 'raw', 'spec00_1_raw_dump.json'), 'utf8'));
const inventory = JSON.parse(fs.readFileSync(path.join(SPEC01, 'SPEC_00_1_CANONICAL_INVENTORY.json'), 'utf8')).records;
const issuesCsv = fs.readFileSync(path.join(SPEC01, 'SPEC_00_1_INTEGRITY_ISSUES.csv'), 'utf8').trim().split('\n').slice(1);

const results = [];
function check(name, ok, detail = '') { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); }

(async () => {
  // ---- Fetch post-repair records (same projection as pre-snapshot) ----
  const postById = {};
  for (const id of Object.keys(preSnapshot.records)) {
    postById[id] = await q(`*[_id == "${id}"][0]{_id, _type, name, title, slug, excerpt, category, publishedAt}`);
  }

  const ids = Object.keys(preSnapshot.records);
  check('Step8 All 21 target IDs still exist after mutations', ids.every((id) => postById[id] && postById[id]._id === id), `fetched=${ids.filter((id) => postById[id]?._id).length}/${ids.length}`);

  // ---- Title restored (Step 8) ----
  const titleRows = matrixRows.filter((r) => r.repair_action !== 'RESTORE_SLUG');
  const titleOk = titleRows.every((r) => postById[r.record_id]?.title === r.proposed_title);
  check('Step8 Titles populated where repaired (14/14)', titleOk, titleRows.map((r) => `${r.record_id}=${JSON.stringify(postById[r.record_id]?.title)}`).join(', '));

  // ---- Slug restored as proper slug object (Step 8) ----
  const slugRows = matrixRows.filter((r) => r.repair_action !== 'RESTORE_TITLE');
  const slugOk = slugRows.every((r) => {
    const s = postById[r.record_id]?.slug;
    return s && typeof s === 'object' && s._type === 'slug' && s.current === r.proposed_slug;
  });
  check('Step8 Slugs populated where repaired (8/8)', slugOk, slugRows.map((r) => `${r.record_id}=${JSON.stringify(postById[r.record_id]?.slug)}`).join(', '));

  // ---- Slug uniqueness across namespace (Step 8 / AC-03) ----
  const allSlugs = {};
  for (const [type, items] of Object.entries(raw.records)) {
    if (!ROUTE_MAP[type]) continue;
    for (const it of items) {
      if (it._id.startsWith('drafts.')) continue;
      const s = slugValue(it.slug);
      if (s) { if (!allSlugs[s]) allSlugs[s] = []; allSlugs[s].push(`${type}:${it._id}`); }
    }
  }
  const dupGroups = Object.entries(allSlugs).filter(([, v]) => v.length > 1);
  check('Step8 No duplicate slugs in wiki namespace', dupGroups.length === 0, dupGroups.map(([s, v]) => `${s}:${v.join('|')}`).join('; '));

  // ---- No unexpected fields changed (Step 8 + Step 14) ----
  const AUTH = new Set(['title', 'slug']);
  const unexpected = [];
  for (const id of ids) {
    const pre = preSnapshot.records[id];
    const post = postById[id];
    if (!pre || !post) { unexpected.push(`${id}:missing`); continue; }
    for (const k of new Set([...Object.keys(pre), ...Object.keys(post)])) {
      if (AUTH.has(k) || k === '_type') continue;
      if (JSON.stringify(pre[k]) !== JSON.stringify(post[k])) unexpected.push(`${id}.${k}`);
    }
  }
  check('Step8/14 No unexpected fields changed beyond title/slug', unexpected.length === 0, unexpected.join(', ') || 'only title/slug mutated');

  // ---- Post-mutation hashes reconcile (Step 14) ----
  const hashMismatch = matrixRows.filter((r) => {
    const p = postById[r.record_id];
    return hashOf(r.record_id, p?.title ?? null, slugValue(p?.slug)) !== r.post_mutation_hash;
  });
  check('Step14 Post-mutation hashes fully reconciled', hashMismatch.length === 0, hashMismatch.map((r) => r.record_id).join(','));

  // ---- Mutation log integrity (Step 14) ----
  const appliedIds = mutationLog.entries.filter((e) => e.status === 'APPLIED').length;
  check('Step14 Mutation log shows exactly 21 applied, 0 failures', appliedIds === 21 && mutationLog.applied === 21 && !mutationLog.stopAll, `applied=${mutationLog.applied} stopAll=${mutationLog.stopAll}`);
  const logNoVerifyFail = mutationLog.entries.every((e) => !['VERIFY_FAIL', 'FAILED'].includes(e.status));
  check('Step14 No FAILED/VERIFY_FAIL entries in mutation log', logNoVerifyFail, '');

  // ---- Route verification (Step 12) ----
  const undefinedRoutes = inventory.filter((r) => /undefined/.test(r.route || '')).length;
  check('Step12 zero /undefined routes in canonical inventory', undefinedRoutes === 0, `/undefined=${undefinedRoutes}`);

  const routeChecks = [];
  for (const r of titleRows) {
    const rec = inventory.find((x) => x.canonical_id === r.record_id);
    routeChecks.push(`${['problems', ROUTE_MAP[r.document_type]].includes(ROUTE_MAP[r.document_type]) ? ROUTE_MAP[r.document_type] : r.document_type}/${r.proposed_slug || 'title'}`);
  }
  const repairedResolve = inventory.filter((r) => r.route_result === 'BROKEN' || /undefined/.test(r.route || '') || r.route_result === 'NOT REACHABLE').length;
  check('Step12 No broken/unreachable routes remain anywhere', repairedResolve === 0, `brokenOrUnreachable=${repairedResolve}`);
  const routeTargets = [
    ['problem',  ['I9bI8W8ZWcEwyIzM9DNIu8'], 'problems/black-beard-algae'],
    ['invertebrate', ['PZ8Kai1VvEL468NS2LLeDy'], 'invertebrates/holothuria'],
    ['equipment', ['1z8rQFHeojDMTUo2hXSXqh','1z8rQFHeojDMTUo2hXSXuo','1z8rQFHeojDMTUo2hXSYAR','PZ8Kai1VvEL468NS2LLeg8','PZ8Kai1VvEL468NS2LLfrf','sebdKYryWZgYP2rm3or3AK'], 'equipment/planted-led-light ...'],
  ];
  for (const [type, ids, label] of routeTargets) {
    const ok = ids.every((id) => inventory.some((r) => r.canonical_id === id && r.route_result === 'OK'));
    check(`Step12 ${label === 'problems/black-beard-algae' ? 'BBA route' : label === 'invertebrates/holothuria' ? 'Sea Cucumber route' : '6 Equipment routes'} resolve`, ok, ok ? 'OK' : ids.join(','));
  }

  // ---- Reference verification (Step 13) ----
  const globalById = {};
  for (const items of Object.values(raw.records)) for (const it of items) if (!it._id.startsWith('drafts.')) globalById[it._id] = it;
  const referencing = {};
  let brokenRefsToRepaired = 0;
  for (const it of Object.values(globalById)) {
    const refs = [];
    const walk = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) { for (const x of obj) walk(x); return; }
      if (typeof obj._ref === 'string') refs.push(obj._ref);
      for (const v of Object.values(obj)) walk(v);
    };
    walk(it);
    for (const ref of new Set(refs)) {
      if (ids.includes(ref)) { referencing[ref] = (referencing[ref] || 0) + 1; }
      if (ids.includes(ref) && !globalById[ref]) brokenRefsToRepaired++;
    }
  }
  check('Step13 Zero broken references to any repaired record', brokenRefsToRepaired === 0, `broken=${brokenRefsToRepaired}`);
  console.log(`      Info: inbound references to repaired records => ${totalRefs(Object.values(referencing))}`);

  // ---- Post-repair audit counts (Step 9-11 already done via SPEC 00.1 pipeline) ----
  const sev = {};
  const typeCount = {};
  for (const ln of issuesCsv) {
    const cells = ln.match(/("[^"]*"|[^,]*)/g)?.map((c) => (c || '').replace(/^"|"$/g, '')) ?? [];
    sev[cells[1]] = (sev[cells[1]] || 0) + 1;
    typeCount[cells[5]] = (typeCount[cells[5]] || 0) + 1;
  }
  const critical = sev.CRITICAL || 0;
  const high = sev.HIGH || 0;
  const nullSlugHigh = typeCount.NULL_SLUG || 0;
  check('AC-01 Critical identity restoration complete (0 Critical)', critical === 0, `CRITICAL=${critical}`);
  check('AC-02 All NULL_SLUG repaired (0 HIGH routing)', nullSlugHigh === 0, `NULL_SLUG records=${nullSlugHigh}`);

  // ---- SPEC 00.1 validation passed ----
  const spec01val = JSON.parse(fs.readFileSync(path.join(SPEC01, 'SPEC_00_1_VALIDATION.json'), 'utf8'));
  check('AC-10 SPEC 00.1 validation passes (9/9)', spec01val.verdict === 'PASS' && spec01val.failed === 0, `verdict=${spec01val.verdict}`);

  // ---- Summary ----
  const summary = {
    generatedAt: new Date().toISOString(),
    repairedRecords: ids.length,
    applied: mutationLog.applied,
    critical: critical,
    high: high,
    issuesTotalAfter: issuesCsv.length,
    severityAfter: sev,
    duplicateSlugGroups: dupGroups.length,
    undefinedRoutes: undefinedRoutes,
    results,
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    verdict: results.every((r) => r.ok) ? 'PASS' : 'FAIL',
  };
  fs.writeFileSync(path.join(OUT, 'SPEC_00_2_VALIDATION.json'), JSON.stringify(summary, null, 2));
  console.log(`\nSPEC 00.2 validation: ${summary.passed}/${results.length} checks passed. Verdict: ${summary.verdict}`);
})().catch((e) => { console.error(e); process.exit(1); });

function totalRefs(vals) { return vals.reduce((a, b) => a + b, 0); }