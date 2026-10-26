const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUT = path.join('report', 'SPEC_00_2');
const envContent = fs.readFileSync('.env.local', 'utf8');
const TOKEN = (envContent.match(/SANITY_API_TOKEN="([^"]+)"/) || [])[1];
if (!TOKEN) { console.error('SANITY_API_TOKEN not found in .env.local'); process.exit(1); }

const PROJECT_ID = 'zeohjejw';
const DATASET = 'production';
const API_VERSION = '2026-05-25';
const QUERY_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;
const MUTATE_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/mutate/${DATASET}`;

const loadedMatrix = JSON.parse(fs.readFileSync(path.join(OUT, 'SPEC_00_2_REPAIR_MATRIX.json'), 'utf8'));
const matrix = Array.isArray(loadedMatrix) ? loadedMatrix : loadedMatrix.rows;
if (!Array.isArray(matrix) || matrix.length !== 21) { console.error('unexpected matrix shape/length:', matrix?.length); process.exit(1); }

const hashOf = (id, title, slug) => crypto.createHash('sha256').update(JSON.stringify({ id, title, slug })).digest('hex');

async function q(groq) {
  const res = await fetch(`${QUERY_BASE}?query=${encodeURIComponent(groq)}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`query failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).result;
}
async function mutate(mutations) {
  const res = await fetch(`${MUTATE_BASE}?returnIds=true&returnDocuments=true`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mutations }),
  });
  if (!res.ok) throw new Error(`mutate failed ${res.status}: ${(await res.text()).slice(0, 400)}`);
  return res.json();
}
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);

async function main() {
  const log = [];
  let stopAll = false;
  let applied = 0;
  const startedAt = new Date().toISOString();

  for (const row of matrix) {
    if (stopAll) { log.push({ record_id: row.record_id, status: 'SKIPPED_STOP' }); continue; }
    if (row.mutation_allowed !== 'true') { log.push({ record_id: row.record_id, status: 'BLOCKED', reason: row.blocked_reason }); continue; }

    const id = row.record_id;
    const wantTitle = row.repair_action !== 'RESTORE_SLUG';
    const wantSlug = row.repair_action !== 'RESTORE_TITLE';

    try {
      // ---- Precondition checks (SPEC 00.2 §12) ----
      const cur = await q(`*[_id == "${id}"][0]{_id, _type, title, name, slug}`);
      if (!cur || !cur._id) throw new Error(`record ${id} does not exist`);
      const curTitle = cur.title ?? null;
      const curName = cur.name ?? null;
      const curSlug = slugValue(cur.slug);

      // title guard: set only if title surface is empty
      if (wantTitle && curTitle != null && String(curTitle).trim() !== '') {
        log.push({ record_id: id, status: 'ABORT', reason: `current title already populated ("${curTitle}")` });
        console.error(`ABORT    ${id}: title already set "${curTitle}"`); continue;
      }
      // name surface must still carry the evidence value (concurrency guard)
      if (wantTitle && row.name_field && curName !== row.name_field) {
        log.push({ record_id: id, status: 'ABORT', reason: `name field changed concurrently ("${curName}" vs "${row.name_field}")` });
        console.error(`ABORT    ${id}: name field changed concurrently`); continue;
      }

      // slug guard: skip if already a proper identical object; convert string; abort on mismatch/missing-target
      if (wantSlug) {
        if (cur.slug && typeof cur.slug === 'object' && cur.slug.current === row.proposed_slug) {
          log.push({ record_id: id, status: 'NO_CHANGE_VERIFIED', reason: 'slug already correct slug object' });
          console.log(`NO_CHANGE ${id}: slug already correct`); continue;
        }
        if (curSlug && curSlug !== row.proposed_slug) {
          log.push({ record_id: id, status: 'ABORT', reason: `slug present with different value "${curSlug}"` });
          console.error(`ABORT    ${id}: current slug "${curSlug}" != proposed "${row.proposed_slug}"`); continue;
        }
        if (curSlug === null && !cur.slug) {
          log.push({ record_id: id, status: 'ABORT', reason: 'no slug value present at all (evidence expected a string)' });
          console.error(`ABORT    ${id}: slug absent entirely`); continue;
        }
      }

      // uniqueness: proposed slug not used by any other record of the same type
      if (wantSlug && row.proposed_slug) {
        const all = await q(`*[_type == "${row.document_type}"][]{_id, slug}`);
        const clash = all.find((x) => x._id !== id && slugValue(x.slug) === row.proposed_slug);
        if (clash) throw new Error(`proposed slug "${row.proposed_slug}" already owned by ${clash._id}`);
      }

      // ---- Build minimal patch ----
      const set = {};
      if (wantTitle && row.proposed_title) set.title = row.proposed_title;
      if (wantSlug && row.proposed_slug) set.slug = { _type: 'slug', current: row.proposed_slug };
      if (Object.keys(set).length === 0) { log.push({ record_id: id, status: 'NOOP' }); continue; }

      const api = await mutate([{ patch: { id, set } }]);
      const doc = api.results?.[0]?.document || null;
      const newTitle = doc?.title ?? null;
      const newSlug = slugValue(doc?.slug);

      const okTitle = !wantTitle || newTitle === row.proposed_title;
      const okSlug = !wantSlug || newSlug === row.proposed_slug;
      if (!okTitle || !okSlug) {
        stopAll = true;
        log.push({ record_id: id, status: 'VERIFY_FAIL', reason: `title(${JSON.stringify(newTitle)} ok=${okTitle}) slug(${newSlug} ok=${okSlug})`, api });
        console.error(`VERIFY_FAIL ${id}: post-write mismatch — stopping further repairs`);
        continue;
      }

      applied++;
      row.post_mutation_hash = hashOf(id, newTitle, newSlug);
      log.push({ record_id: id, status: 'APPLIED', fields: Object.keys(set), old: { title: curTitle, slug: curSlug, name: curName }, new: { title: newTitle, slug: newSlug }, evidence: row.evidence_level, timestamp: new Date().toISOString() });
      console.log(`APPLIED   ${id}  set[${Object.keys(set).join(',')}]`);
    } catch (err) {
      stopAll = true;
      log.push({ record_id: id, status: 'FAILED', reason: err.message });
      console.error(`FAILED    ${id}: ${err.message}`);
      break;
    }
  }

  fs.writeFileSync(path.join(OUT, 'SPEC_00_2_MUTATION_LOG.json'), JSON.stringify({ startedAt, completedAt: new Date().toISOString(), applied, stopAll, entries: log }, null, 2));
  fs.writeFileSync(path.join(OUT, 'SPEC_00_2_REPAIR_MATRIX.json'), JSON.stringify(matrix, null, 2));
  const HEADERS = Object.keys(matrix[0]);
  const esc = (v) => (v == null ? '' : /[",\n\r]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v));
  fs.writeFileSync(path.join(OUT, 'SPEC_00_2_REPAIR_MATRIX.csv'), HEADERS.join(',') + '\n' + matrix.map((r) => HEADERS.map((h) => esc(r[h])).join(',')).join('\n') + '\n');

  console.log(`\nApplied ${applied} mutations. stopAll=${stopAll} -> ${stopAll ? 'ABORT remaining (see log)' : 'OK'}`);
}
main().catch((e) => { console.error(e); process.exit(1); });