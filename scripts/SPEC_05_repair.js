const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_DIR = path.join('report', 'SPEC_05');
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const MUT = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/mutate/production';
const norm = (v) => (v === undefined || v === null || v === '' ? '' : v);
const slugValue = (s) => (typeof s === 'string' ? s : (s && s.current) || null);

function request(url, method, payload) {
  return new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : null;
    const u = new URL(url);
    const opts = {
      hostname: u.hostname, path: u.pathname + u.search, method: method,
      headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
      timeout: 60000,
    };
    if (body) opts.headers['Content-Length'] = Buffer.byteLength(body);
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(text); } catch (e) { /* not json */ }
        resolve({ status: res.statusCode, text: text, json: json });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

function csvEsc(v) {
  const s = v === undefined || v === null ? '' : String(v);
  const Q = String.fromCharCode(34);
  return s.includes(',') || s.includes('"') || s.includes('\n') ? Q + s.replace(/"/g, Q + Q) + Q : s;
}

(async () => {
  const PLAN = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_05_APPROVED_MUTATION_PLAN.json'), 'utf8'));
  const SNAPSHOT = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_05_PRE_REPAIR_SNAPSHOT.json'), 'utf8'));
  const rows = PLAN.rows;
  console.log('GATE C: executing exactly ' + rows.length + ' approved mutations (expected 61)');

  if (rows.length !== 61) { console.log('ABORT: plan rows != 61'); process.exit(2); }

  const applied = [];
  const aborted = [];
  let authFailure = false;

  for (const row of rows) {
    const rid = row.recordId;
    const label = rid + '.' + row.field;
    if (authFailure) { aborted.push({ recordId: rid, field: row.field, action: row.action, reason: 'skipped: auth failure halted batch' }); continue; }

    // 1. fetch live record
    let live;
    try {
      const r = await request(BASE + '?query=' + encodeURIComponent('*[_id == ' + JSON.stringify(rid) + '][0]'), 'GET', null);
      if (r.status !== 200) { aborted.push({ recordId: rid, field: row.field, action: row.action, reason: 'fetch failed status=' + r.status }); continue; }
      live = r.json && r.json.result;
    } catch (e) { aborted.push({ recordId: rid, field: row.field, action: row.action, reason: 'fetch error: ' + e.message }); continue; }
    if (!live) { aborted.push({ recordId: rid, field: row.field, action: row.action, reason: 'record not found' }); continue; }

    // 2. verify identity
    const title = row._type === 'problem' ? live.title : live.name;
    if (live._type !== row._type || title !== row.title || slugValue(live.slug) !== row.slug) {
      aborted.push({ recordId: rid, field: row.field, action: row.action, reason: 'identity mismatch (type/title/slug)' });
      continue;
    }
    // 3. verify _rev
    if (live._rev !== row.currentRev) {
      aborted.push({ recordId: rid, field: row.field, action: row.action, reason: '_rev conflict: expected ' + row.currentRev + ' live ' + live._rev + ' - DO NOT FORCE WRITE' });
      continue;
    }
    // 4. verify current field value exactly matches approved currentValue
    if (norm(live[row.field]) !== norm(row.currentValue)) {
      aborted.push({ recordId: rid, field: row.field, action: row.action, reason: 'currentValue mismatch: expected ' + JSON.stringify(row.currentValue) + ' live ' + JSON.stringify(live[row.field]) });
      continue;
    }
    if (row.proposedValue === row.currentValue) {
      aborted.push({ recordId: rid, field: row.field, action: row.action, reason: 'proposedValue equals current value' });
      continue;
    }

    // 5. apply field-level patch only (ifRev conditional, no whole-document replacement)
    const ts = new Date().toISOString();
    let resp;
    try {
      resp = await request(MUT, 'POST', { mutations: [{ patch: { id: rid, ifRevisionID: row.currentRev, set: { [row.field]: row.proposedValue } } }] });
    } catch (e) {
      aborted.push({ recordId: rid, field: row.field, action: row.action, reason: 'mutation request error: ' + e.message });
      continue;
    }
    if (resp.status === 401 || resp.status === 403) {
      authFailure = true;
      aborted.push({ recordId: rid, field: row.field, action: row.action, reason: 'auth failure status=' + resp.status + ' - halting batch: ' + resp.text.slice(0, 200) });
      continue;
    }
    if (resp.status < 200 || resp.status >= 300) {
      aborted.push({ recordId: rid, field: row.field, action: row.action, reason: 'mutation rejected status=' + resp.status + ': ' + resp.text.slice(0, 300) });
      continue;
    }

    // 6. post-write verification: value applied, rev bumped, only the approved field changed
    let after;
    try {
      const r = await request(BASE + '?query=' + encodeURIComponent('*[_id == ' + JSON.stringify(rid) + '][0]'), 'GET', null);
      after = r.json && r.json.result;
    } catch (e) { after = null; }
    if (!after) { aborted.push({ recordId: rid, field: row.field, action: row.action, reason: 'post-write refetch failed' }); continue; }
    if (after[row.field] !== row.proposedValue) {
      aborted.push({ recordId: rid, field: row.field, action: row.action, reason: 'post-write value not as approved: ' + JSON.stringify(after[row.field]) });
      continue;
    }
    if (after._rev === live._rev) {
      aborted.push({ recordId: rid, field: row.field, action: row.action, reason: '_rev did not change after mutation' });
      continue;
    }
    const changed = [];
    const keys = new Set([...Object.keys(live), ...Object.keys(after)]);
    for (const k of keys) {
      if (k === '_rev' || k === '_updatedAt') continue;
      if (JSON.stringify(live[k]) !== JSON.stringify(after[k])) changed.push(k);
    }
    if (changed.length !== 1 || changed[0] !== row.field) {
      aborted.push({ recordId: rid, field: row.field, action: row.action, reason: 'unexpected field changes: [' + changed.join(',') + '] (expected exactly [' + row.field + '])' });
      continue;
    }

    applied.push({
      recordId: rid, _type: row._type, title: row.title, slug: row.slug, field: row.field,
      action: row.action, confidence: row.confidence,
      before: row.currentValue, after: row.proposedValue,
      revBefore: live._rev, revAfter: after._rev,
      timestamp: new Date().toISOString(), appliedAt: ts,
      evidence: row.evidence.slice(0, 600),
      changedFields: changed,
    });
    console.log('APPLIED ' + (applied.length) + '/61 ' + label + ' ' + JSON.stringify(row.currentValue) + ' -> ' + JSON.stringify(row.proposedValue));
  }

  const generatedAt = new Date().toISOString();
  const log = {
    spec: 'SPEC 05', phase: 'MUTATION_LOG', generatedAt: generatedAt,
    status: applied.length === 61 && aborted.length === 0 ? 'APPLIED_61_OF_61' : 'PARTIAL_' + applied.length + '_OF_61',
    expectedMutationCount: 61,
    composition: { SET_FIELD: applied.filter((a) => a.action === 'SET_FIELD').length, REPLACE_FIELD: applied.filter((a) => a.action === 'REPLACE_FIELD').length },
    appliedCount: applied.length, abortedCount: aborted.length,
    safety: 'field-level patch with ifRevisionID conditional; per-record identity + _rev + currentValue verification before write; post-write single-field diff verification; no force write; no whole-document replacement',
    applied: applied, aborted: aborted,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_05_MUTATION_LOG.json'), JSON.stringify(log, null, 2));

  const Q = String.fromCharCode(34);
  const lines = ['recordId,_type,title,slug,field,action,confidence,beforeValue,afterValue,revBefore,revAfter,timestamp,evidence'];
  for (const a of applied) {
    lines.push([a.recordId, a._type, a.title, a.slug, a.field, a.action, a.confidence, a.before, a.after, a.revBefore, a.revAfter, a.timestamp, a.evidence].map(csvEsc).join(','));
  }
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_05_CONTENT_DIFF.csv'), String.fromCharCode(0xFEFF) + lines.join('\r\n') + '\r\n');

  console.log('\nGATE C result: applied=' + applied.length + '/61 aborted=' + aborted.length);
  if (aborted.length) {
    console.log('ABORTED RECORDS:');
    for (const a of aborted) console.log('  ' + a.recordId + '.' + a.field + ': ' + a.reason);
    process.exit(2);
  }
  console.log('SPEC_05_MUTATION_LOG.json + SPEC_05_CONTENT_DIFF.csv written');
})().catch((e) => { console.error('REPAIR ERROR:', e.stack || e.message); process.exit(1); });
