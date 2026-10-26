const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUT = path.join('report', 'SPEC_00_2');
fs.mkdirSync(OUT, { recursive: true });

// ---- Current production state (SPEC 00.1 raw snapshot) ----
const RAW = JSON.parse(fs.readFileSync(path.join('report', 'SPEC_00_1', 'raw', 'spec00_1_raw_dump.json'), 'utf8'));
const records = RAW.records;

// ---- Prior canonical manifests (corroborating E1 evidence) ----
function collectById(root, acc) {
  if (!root) return acc;
  if (Array.isArray(root)) { for (const x of root) collectById(x, acc); return acc; }
  if (typeof root === 'object') {
    if (root._id) acc[root._id] = { name: root.name ?? root.title ?? null, slug: root.slug?.current ?? root.slug ?? null };
    for (const v of Object.values(root)) collectById(v, acc);
  }
  return acc;
}
const PRIOR_FILES = ['report/phase14-baseline-lock.json', 'report/phase13-full-inventory.json', 'report/DATABASE_PHASE_13_EQUIPMENT_PROBLEM_AUDIT.md'];
const stripBom = (p) => { const s = fs.readFileSync(p, 'utf8'); return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s; };
const priorMap = {};
for (const f of PRIOR_FILES.slice(0, 2)) collectById(JSON.parse(stripBom(f)), priorMap);
const md = fs.readFileSync(PRIOR_FILES[2], 'utf8');
const mdSlugName = {};
for (const line of md.split('\n')) {
  const m = line.match(/^\|\s*\d+\s*\|\s*([^|]+?)\s*\|\s*[^|]*?\s*\|\s*([a-z0-9-]+)\s*\|$/);
  if (m) mdSlugName[m[2]] = m[1].trim();
}

// ---- Targets (detect dynamically; assert against SPEC 00.2 lists) ----
const ROUTES = { species: 'species', plant: 'plants', invertebrate: 'invertebrates', coral: 'corals', equipment: 'equipment', problem: 'problems' };
const nullTitleProblems = records.problem.filter((p) => p.title == null || String(p.title).trim() === '');
const nullSlugRecords = [];
for (const [type, items] of Object.entries(records)) {
  if (!ROUTES[type]) continue;
  for (const it of items) {
    if (it._id.startsWith('drafts.')) continue;
    if (it.slug?.current == null || String(it.slug.current).trim() === '') nullSlugRecords.push({ type, item: it });
  }
}
const SPEC_NULL_TITLE_IDS = ['I9bI8W8ZWcEwyIzM9DFYjI','I9bI8W8ZWcEwyIzM9DFYtM','I9bI8W8ZWcEwyIzM9DNIu8','IlX7xILobrukz7d5JnvacY','IlX7xILobrukz7d5Jo2qVy','IlX7xILobrukz7d5Jo2qgo','IlX7xILobrukz7d5Jo2wxC','IlX7xILobrukz7d5Jo2xIs','J1Tx0fWCuGNPno99A79Tvf','J1Tx0fWCuGNPno99A7AE36','J1Tx0fWCuGNPno99A7AEDM','J1Tx0fWCuGNPno99A7KJcq','J1Tx0fWCuGNPno99A7KJpf','J1Tx0fWCuGNPno99A7KutT'];
const SPEC_NULL_SLUG_IDS = ['1z8rQFHeojDMTUo2hXSXqh','1z8rQFHeojDMTUo2hXSXuo','1z8rQFHeojDMTUo2hXSYAR','PZ8Kai1VvEL468NS2LLeg8','PZ8Kai1VvEL468NS2LLfrf','sebdKYryWZgYP2rm3or3AK','PZ8Kai1VvEL468NS2LLeDy','I9bI8W8ZWcEwyIzM9DNIu8'];
const gotTitle = nullTitleProblems.map((p) => p._id).sort();
const gotSlug = nullSlugRecords.map((r) => r.item._id).sort();
if (JSON.stringify(gotTitle) !== JSON.stringify([...SPEC_NULL_TITLE_IDS].sort()) || JSON.stringify(gotSlug) !== JSON.stringify([...SPEC_NULL_SLUG_IDS].sort())) {
  console.error('BASELINE target mismatch'); process.exit(2);
}

// ---- Live read of exact current surfaces (same-document evidence) ----
const envContent = fs.readFileSync('.env.local', 'utf8');
const TOKEN = (envContent.match(/SANITY_API_TOKEN="([^"]+)"/) || [])[1];
const BASE = `https://${RAW.manifest.projectId}.api.sanity.io/v${RAW.manifest.apiVersion}/data/query/production`;
const TARGET_IDS = [...new Set([...SPEC_NULL_TITLE_IDS, ...SPEC_NULL_SLUG_IDS])];
async function fetchTargets() {
  const ids = [...new Set(TARGET_IDS)];
  const out = {};
  for (const id of ids) {
    const r = await fetch(BASE + '?query=' + encodeURIComponent(`*[_id == "${id}"][0]{_id, _type, name, title, slug, excerpt, category, publishedAt}`), { headers: { Authorization: 'Bearer ' + TOKEN } });
    if (!r.ok) throw new Error('fetch ' + id + ' failed ' + r.status);
    out[id] = (await r.json()).result || null;
  }
  return out;
}

// ---- Issue-id mapping ----
const issueCsv = fs.readFileSync(path.join('report', 'SPEC_00_1', 'SPEC_00_1_INTEGRITY_ISSUES.csv'), 'utf8').trim().split('\n').slice(1);
const issueByRec = {};
for (const ln of issueCsv) {
  const cells = ln.match(/("[^"]*"|[^,]*)/g)?.map((c) => (c || '').replace(/^"|"$/g, '')) ?? [];
  if (issueByRec[cells[3]]?.[0]?.issue_type === undefined && (cells[5] === 'NULL_TITLE' || cells[5] === 'NULL_SLUG')) {
    (issueByRec[cells[3]] = issueByRec[cells[3]] || []).push({ issue_id: cells[0], severity: cells[1], issue_type: cells[5] });
  } else if (issueByRec[cells[3]]) {
    if (cells[5] === 'NULL_TITLE' || cells[5] === 'NULL_SLUG') issueByRec[cells[3]].push({ issue_id: cells[0], severity: cells[1], issue_type: cells[5] });
  } else if (cells[5] === 'NULL_TITLE' || cells[5] === 'NULL_SLUG') {
    issueByRec[cells[3]] = [{ issue_id: cells[0], severity: cells[1], issue_type: cells[5] }];
  }
}

const hashOf = (id, title, slug) => crypto.createHash('sha256').update(JSON.stringify({ id, title, slug })).digest('hex');

const rows = [];
const snapshotRecords = {};

(async () => {
  const live = await fetchTargets();

  // ---- 14 NULL-title problems ----
  for (const id of SPEC_NULL_TITLE_IDS) {
    const cur = live[id];
    if (!cur) { console.error('missing live record ' + id); process.exit(2); }
    const nameField = cur.name ?? null;               // same-document evidence
    const titleField = cur.title ?? null;             // broken surface
    const slugVal = typeof cur.slug === 'string' ? cur.slug : cur.slug?.current ?? null;
    const prior = priorMap[id];
    if (!nameField) { console.error('no name evidence for ' + id); process.exit(2); }
    if (prior?.name && prior.name !== nameField) { console.error('prior manifest name mismatch for ' + id); process.exit(2); }
    const isBBA = id === 'I9bI8W8ZWcEwyIzM9DNIu8';
    const proposedTitle = nameField;
    const needsSlug = isBBA ? true : false;
    const action = needsSlug ? 'RESTORE_TITLE_AND_SLUG' : 'RESTORE_TITLE';
    const evidenceSources = [
      `same-document legacy name field = "${nameField}"`,
      prior?.name ? `prior canonical manifest name "${prior.name}" (${PRIOR_FILES[0]}/${PRIOR_FILES[1]})` : null,
      mdSlugName[slugVal] ? `Phase 13 audit doc row "${mdSlugName[slugVal]}" | ${slugVal} (${PRIOR_FILES[2]})` : null,
      cur.excerpt ? 'current excerpt corroboration' : null,
      typeof cur.slug === 'string' ? 'same-document string slug (needs conversion to slug object)' : null,
    ].filter(Boolean);
    rows.push({
      issue_id: (issueByRec[id] || []).map((x) => x.issue_id).join('|') || 'n/a',
      record_id: id,
      document_type: 'problem',
      category: cur.category ?? '',
      current_title: '',
      current_slug: needsSlug ? '' : (slugVal ?? ''),
      name_field: nameField,
      proposed_title: proposedTitle,
      proposed_slug: needsSlug ? slugVal : '',
      evidence_level: 'E1',
      evidence_sources: evidenceSources.join('; '),
      repair_action: action,
      confidence: 'high',
      mutation_allowed: 'true',
      blocked_reason: '',
      duplicate_review: id === 'J1Tx0fWCuGNPno99A7AE36' ? 'MANIFEST_DISTINCT_RECORDS_SEPARATE_SLUGS' : '',
      pre_mutation_hash: hashOf(id, titleField, titleField === null ? (needsSlug ? null : slugVal) : slugVal),
      post_mutation_hash: '',
    });
    snapshotRecords[id] = { _type: 'problem', ...cur };
  }

  // ---- 7 NULL-slug (non-BBA) records: 6 equipment + Sea Cucumber ----
  for (const { type, item } of nullSlugRecords) {
    const id = item._id;
    if (id === 'I9bI8W8ZWcEwyIzM9DNIu8') continue;
    const cur = live[id];
    const slugRaw = typeof cur?.slug === 'string' ? cur.slug : cur?.slug?.current ?? null;
    if (!slugRaw) { console.error('no slug evidence for ' + id); process.exit(2); }
    const prior = priorMap[id];
    if (prior?.slug && prior.slug !== slugRaw) { console.error('prior manifest slug mismatch for ' + id); process.exit(2); }
    rows.push({
      issue_id: (issueByRec[id] || []).map((x) => x.issue_id).join('|') || 'n/a',
      record_id: id,
      document_type: type,
      category: cur?.category ?? '',
      current_title: '',
      current_slug: '',
      name_field: cur?.name ?? '',
      proposed_title: '',
      proposed_slug: slugRaw,
      evidence_level: 'E1',
      evidence_sources: [
        `same-document string slug = "${slugRaw}"`,
        prior?.slug ? `prior canonical manifest slug "${prior.slug}" (${PRIOR_FILES[0]}/${PRIOR_FILES[1]})` : null,
        mdSlugName[slugRaw] ? `Phase 13 audit doc row "${mdSlugName[slugRaw]}" | ${slugRaw}` : null,
        'conversion: string -> slug object required for /[route]/[slug] routing',
      ].filter(Boolean).join('; '),
      repair_action: 'RESTORE_SLUG',
      confidence: 'high',
      mutation_allowed: 'true',
      blocked_reason: '',
      duplicate_review: '',
      pre_mutation_hash: hashOf(id, null, null),
      post_mutation_hash: '',
    });
    snapshotRecords[id] = { _type: type, ...cur };
  }

  // ---- Write artifacts ----
  const HEADERS = ['issue_id', 'record_id', 'document_type', 'category', 'current_title', 'current_slug', 'name_field', 'proposed_title', 'proposed_slug', 'evidence_level', 'evidence_sources', 'repair_action', 'confidence', 'mutation_allowed', 'blocked_reason', 'duplicate_review', 'pre_mutation_hash', 'post_mutation_hash'];
  const esc = (v) => (v == null ? '' : /[",\n\r]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v));
  fs.writeFileSync(path.join(OUT, 'SPEC_00_2_REPAIR_MATRIX.csv'), HEADERS.join(',') + '\n' + rows.map((r) => HEADERS.map((h) => esc(r[h])).join(',')).join('\n') + '\n');
  fs.writeFileSync(path.join(OUT, 'SPEC_00_2_REPAIR_MATRIX.json'), JSON.stringify({ generatedAt: new Date().toISOString(), rows, count: rows.length }, null, 2));
  fs.writeFileSync(path.join(OUT, 'SPEC_00_2_PRE_MUTATION_SNAPSHOT.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    projectId: RAW.manifest.projectId, dataset: RAW.manifest.dataset, apiVersion: RAW.manifest.apiVersion,
    evidenceFiles: PRIOR_FILES,
    mutationTargets: rows.map((r) => ({ record_id: r.record_id, document_type: r.document_type, fields: r.repair_action === 'RESTORE_TITLE_AND_SLUG' ? ['title', 'slug'] : r.repair_action === 'RESTORE_TITLE' ? ['title'] : ['slug'] })),
    records: snapshotRecords,
  }, null, 2));
  fs.writeFileSync(path.join(OUT, 'SPEC_00_2_REPAIR_PLAN.json'), JSON.stringify({ generatedAt: new Date().toISOString(), plan: rows.map((r) => ({ record_id: r.record_id, repair_action: r.repair_action, proposed_title: r.proposed_title, proposed_slug: r.proposed_slug, evidence_level: r.evidence_level, mutation_allowed: r.mutation_allowed })) }, null, 2));

  // ---- Human-review gate summary ----
  console.log('==== SPEC 00.2 STEP 5 — HUMAN-REVIEW GATE (rebuilt) ====');
  console.log(`Baseline: 473 records | Critical 14 | High 38 | mutations: ${rows.length} (0 blocked)`);
  console.log('Evidence: E1 same-document (legacy name field / string slug) + prior canonical manifests; nothing invented');
  console.log('\nTitle restorations (set title = existing legacy name field):');
  for (const r of rows.filter((x) => x.repair_action.startsWith('RESTORE_TITLE'))) console.log(`  ${r.record_id}  "${r.name_field}"`);
  console.log('\nSlug restorations (string -> {_type:slug} object):');
  for (const r of rows.filter((x) => x.repair_action !== 'RESTORE_TITLE')) console.log(`  ${r.record_id}  [${r.document_type}]  "${r.proposed_slug}"`);
  console.log('\nIch case:', rows.find((r) => r.duplicate_review)?.duplicate_review);
  console.log('\nWrote report/SPEC_00_2/{SPEC_00_2_REPAIR_MATRIX.csv,.json, SPEC_00_2_REPAIR_PLAN.json, SPEC_00_2_PRE_MUTATION_SNAPSHOT.json}');
})().catch((e) => { console.error(e); process.exit(1); });