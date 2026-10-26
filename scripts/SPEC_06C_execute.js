const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_DIR = path.join('report', 'SPEC_06C');
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const MUTATE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/mutate/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];

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

const ser = (v) => JSON.stringify(v === undefined ? null : v);
const stripSys = (d) => { const c = Object.assign({}, d); delete c._rev; delete c._updatedAt; return c; };
const now = () => new Date().toISOString();

const log = [];
const events = [];
const emit = (msg) => { events.push({ timestamp: now(), message: msg }); console.log(msg); };

(async () => {
  const PLAN = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'SPEC_06C_EXECUTION_PLAN.json'), 'utf8'));
  if (PLAN.gateStatus !== 'PASS' || PLAN.counts.authorized !== 35 || PLAN.batches.length !== 22) {
    console.log('STOP - execution plan gate not PASS or counts unexpected: ' + PLAN.gateStatus + '/' + PLAN.counts.authorized + '/' + PLAN.batches.length);
    process.exit(2);
  }
  emit('SPEC 06C execution start - authorized=35 batches=22 sources=22 - mode=conditional writes, field=relatedPosts only');

  const postById = {};
  for (const p of await q('*[_type == "post" && !(_id in path("drafts.**"))]')) postById[p._id] = p;
  const wikiBy = {};
  for (const t of WIKI_TYPES) for (const r of await q('*[_type == "' + t + '" && !(_id in path("drafts.**"))]')) wikiBy[r._id] = r;

  const edgeMeta = {};
  for (const e of PLAN.edgeRows) edgeMeta[e.edgeId] = e;

  const preDocs = {};
  let preOk = true;
  for (const s of PLAN.sources) {
    const fresh = wikiBy[s._id];
    if (!fresh) { preOk = false; emit('STOP - source missing before snapshot: ' + s._id); break; }
    if (fresh._rev !== s._rev) { preOk = false; emit('STOP - revision drift before snapshot: ' + s._id + ' plan=' + s._rev + ' live=' + fresh._rev); break; }
    preDocs[s._id] = fresh;
  }
  if (!preOk) { process.exit(3); }

  const preSnapshot = {
    spec: 'SPEC 06C', phase: 'PRE_MUTATION_SNAPSHOT', generatedAt: now(),
    purpose: 'complete mutation baseline before the first write (rollback reference; no blind rollback)',
    authorizedEdges: PLAN.counts.authorized,
    documents: Object.keys(preDocs).sort().map((id) => preDocs[id]),
    edges: PLAN.edgeRows.map((e) => ({
      sourceId: e.sourceId,
      sourceTitle: e.sourceTitle,
      targetId: e.targetId,
      targetTitle: e.targetTitle,
      expectedRev: e.expectedRev,
      beforeRelatedPosts: preDocs[e.sourceId].relatedPosts === undefined ? null : preDocs[e.sourceId].relatedPosts,
      approvedMutation: { relationshipField: 'relatedPosts', action: 'ADD_REFERENCE', addRef: e.targetId },
      timestamp: now(),
    })),
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_06C_PRE_MUTATION_SNAPSHOT.json'), JSON.stringify(preSnapshot, null, 2));
  emit('pre-mutation snapshot saved: ' + Object.keys(preDocs).length + ' source documents, ' + PLAN.edgeRows.length + ' approved edges');

  let stopAll = false;
  let applied = 0, noOp = 0, failed = 0, aborted = 0;
  const postState = {};

  for (const b of PLAN.batches) {
    if (stopAll) {
      for (const eid of b.edgeIds) {
        log.push({ edgeId: eid, sourceId: b.sourceId, sourceTitle: b.sourceTitle, targetId: edgeMeta[eid].targetId, targetTitle: edgeMeta[eid].targetTitle, relationshipField: 'relatedPosts', confidence: 'HIGH_CONFIDENCE', mutationType: 'ADD_REFERENCE', expectedRev: b.expectedRev, actualRevBefore: b.expectedRev, actualRevAfter: '', status: 'ABORTED', timestamp: now() });
        aborted++;
      }
      continue;
    }

    // 4.1 fresh fetch source record
    const fresh = wikiBy[b.sourceId] ? await q('*[_type == "' + b.sourceType + '" && _id == "' + b.sourceId + '"]') : null;
    const doc = Array.isArray(fresh) && fresh.length === 1 ? fresh[0] : null;
    if (!doc) {
      stopAll = true;
      emit('STOP - source document missing at batch ' + b.batchGroupId + ': ' + b.sourceId);
      for (const eid of b.edgeIds) {
        log.push({ edgeId: eid, sourceId: b.sourceId, sourceTitle: b.sourceTitle, targetId: edgeMeta[eid].targetId, targetTitle: edgeMeta[eid].targetTitle, relationshipField: 'relatedPosts', confidence: 'HIGH_CONFIDENCE', mutationType: 'ADD_REFERENCE', expectedRev: b.expectedRev, actualRevBefore: '', actualRevAfter: '', status: 'ABORTED', timestamp: now() });
        aborted++;
      }
      continue;
    }

    // 4.2 verify revision
    if (doc._rev !== b.expectedRev) {
      stopAll = true;
      emit('STOP - revision drift at batch ' + b.batchGroupId + ': ' + b.sourceId + ' expected=' + b.expectedRev + ' live=' + doc._rev + ' (refetch reported, no write attempted)');
      for (const eid of b.edgeIds) {
        log.push({ edgeId: eid, sourceId: b.sourceId, sourceTitle: b.sourceTitle, targetId: edgeMeta[eid].targetId, targetTitle: edgeMeta[eid].targetTitle, relationshipField: 'relatedPosts', confidence: 'HIGH_CONFIDENCE', mutationType: 'ADD_REFERENCE', expectedRev: b.expectedRev, actualRevBefore: doc._rev, actualRevAfter: '', status: 'ABORTED', timestamp: now() });
        aborted++;
      }
      continue;
    }

    // 4.3 verify current relatedPosts
    const cur = doc.relatedPosts;
    if (ser(cur) !== b.expectedCurrentReferenceState) {
      stopAll = true;
      emit('STOP - value drift at batch ' + b.batchGroupId + ': ' + b.sourceId + ' expected=' + b.expectedCurrentReferenceState + ' live=' + ser(cur));
      for (const eid of b.edgeIds) {
        log.push({ edgeId: eid, sourceId: b.sourceId, sourceTitle: b.sourceTitle, targetId: edgeMeta[eid].targetId, targetTitle: edgeMeta[eid].targetTitle, relationshipField: 'relatedPosts', confidence: 'HIGH_CONFIDENCE', mutationType: 'ADD_REFERENCE', expectedRev: b.expectedRev, actualRevBefore: doc._rev, actualRevAfter: '', status: 'ABORTED', timestamp: now() });
        aborted++;
      }
      continue;
    }
    const existing = Array.isArray(cur) ? cur.filter((x) => x && x._ref) : [];
    let dup = false;
    for (const t of b.targetIds) if (existing.some((x) => x._ref === t)) dup = true;
    if (dup) {
      stopAll = true;
      emit('STOP - duplicate reference at batch ' + b.batchGroupId + ': target already present on ' + b.sourceId + ' -> NO_OP recorded');
      for (const eid of b.edgeIds) {
        const e = edgeMeta[eid];
        const present = existing.some((x) => x._ref === e.targetId);
        log.push({ edgeId: eid, sourceId: b.sourceId, sourceTitle: b.sourceTitle, targetId: e.targetId, targetTitle: e.targetTitle, relationshipField: 'relatedPosts', confidence: 'HIGH_CONFIDENCE', mutationType: 'ADD_REFERENCE', expectedRev: b.expectedRev, actualRevBefore: doc._rev, actualRevAfter: doc._rev, status: present ? 'NO_OP' : 'ABORTED', timestamp: now() });
        if (present) noOp++; else aborted++;
      }
      continue;
    }

    // 4.4 verify targets
    let targetBad = null;
    for (const t of b.targetIds) {
      const td = postById[t];
      if (!td) { targetBad = t + ' missing'; break; }
      if (String(td._id).startsWith('drafts.')) { targetBad = t + ' not published'; break; }
      if (td._type !== 'post') { targetBad = t + ' wrong type ' + td._type; break; }
      if (!b.targetIds.includes(t)) { targetBad = t + ' not in approved plan'; break; }
      if (t === b.sourceId) { targetBad = t + ' self reference'; break; }
    }
    if (targetBad) {
      stopAll = true;
      emit('STOP - target check failed at batch ' + b.batchGroupId + ': ' + targetBad);
      for (const eid of b.edgeIds) {
        log.push({ edgeId: eid, sourceId: b.sourceId, sourceTitle: b.sourceTitle, targetId: edgeMeta[eid].targetId, targetTitle: edgeMeta[eid].targetTitle, relationshipField: 'relatedPosts', confidence: 'HIGH_CONFIDENCE', mutationType: 'ADD_REFERENCE', expectedRev: b.expectedRev, actualRevBefore: doc._rev, actualRevAfter: '', status: 'ABORTED', timestamp: now() });
        aborted++;
      }
      continue;
    }

    // conditional write: one field-level patch against expectedRev
    const nextArr = existing.slice();
    const crypto = require('crypto');
    for (const t of b.targetIds) {
      if (nextArr.some((x) => x._ref === t)) continue;
      const key = crypto.createHash('sha256').update(b.sourceId + '|' + t).digest('hex').slice(0, 16);
      nextArr.push({ _key: key, _type: 'reference', _ref: t });
    }
    const body = { mutations: [{ patch: { id: b.sourceId, ifRevisionID: b.expectedRev, set: { relatedPosts: nextArr } } }] };
    let respOk = false, respText = '';
    try {
      const resp = await fetch(MUTATE, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      });
      respText = await resp.text();
      if (!resp.ok) { respOk = false; emit('STOP - mutation API error at batch ' + b.batchGroupId + ': HTTP ' + resp.status + ' ' + respText); }
      else {
        try { JSON.parse(respText); respOk = true; } catch (e) { emit('STOP - mutation API response not JSON at batch ' + b.batchGroupId + ': ' + respText.slice(0, 200)); }
      }
    } catch (e) {
      emit('STOP - mutation request failed at batch ' + b.batchGroupId + ': ' + e.message);
    }
    if (!respOk) {
      stopAll = true;
      for (const eid of b.edgeIds) {
        log.push({ edgeId: eid, sourceId: b.sourceId, sourceTitle: b.sourceTitle, targetId: edgeMeta[eid].targetId, targetTitle: edgeMeta[eid].targetTitle, relationshipField: 'relatedPosts', confidence: 'HIGH_CONFIDENCE', mutationType: 'ADD_REFERENCE', expectedRev: b.expectedRev, actualRevBefore: doc._rev, actualRevAfter: '', status: 'FAILED', timestamp: now() });
        failed++;
      }
      continue;
    }

    // post-write verification (section 7)
    const refetch = await q('*[_type == "' + b.sourceType + '" && _id == "' + b.sourceId + '"]');
    const after = Array.isArray(refetch) && refetch.length === 1 ? refetch[0] : null;
    const problems = [];
    if (!after) problems.push('refetch missing');
    else {
      if (after._rev === b.expectedRev) problems.push('_rev unchanged');
      const afterArr = Array.isArray(after.relatedPosts) ? after.relatedPosts : [];
      const afterRefs = afterArr.filter((x) => x && x._ref).map((x) => x._ref);
      const wanted = nextArr.map((x) => x._ref);
      if (JSON.stringify(afterRefs.slice().sort()) !== JSON.stringify(wanted.slice().sort())) problems.push('relatedPosts mismatch: got ' + JSON.stringify(afterRefs) + ' want ' + JSON.stringify(wanted));
      if (new Set(afterRefs).size !== afterRefs.length) problems.push('duplicate reference present');
      const beforeDoc = stripSys(doc);
      const afterDoc = stripSys(after);
      delete beforeDoc.relatedPosts; delete afterDoc.relatedPosts;
      if (JSON.stringify(beforeDoc) !== JSON.stringify(afterDoc)) problems.push('unrelated fields changed');
      if (after._id !== doc._id) problems.push('identity changed');
      if (JSON.stringify(after.slug) !== JSON.stringify(doc.slug)) problems.push('slug changed');
      if ((after.title || after.name) !== (doc.title || doc.name)) problems.push('title changed');
      if (JSON.stringify(after.seo) !== JSON.stringify(doc.seo)) problems.push('seo changed');
      if (JSON.stringify(after.body) !== JSON.stringify(doc.body)) problems.push('body changed');
    }
    if (problems.length) {
      stopAll = true;
      emit('STOP - post-write verification mismatch at batch ' + b.batchGroupId + ': ' + problems.join('; '));
      for (const eid of b.edgeIds) {
        log.push({ edgeId: eid, sourceId: b.sourceId, sourceTitle: b.sourceTitle, targetId: edgeMeta[eid].targetId, targetTitle: edgeMeta[eid].targetTitle, relationshipField: 'relatedPosts', confidence: 'HIGH_CONFIDENCE', mutationType: 'ADD_REFERENCE', expectedRev: b.expectedRev, actualRevBefore: doc._rev, actualRevAfter: after ? after._rev : '', status: 'FAILED', timestamp: now() });
        failed++;
      }
      if (after) postState[b.sourceId] = after;
      continue;
    }

    postState[b.sourceId] = after;
    for (const eid of b.edgeIds) {
      log.push({ edgeId: eid, sourceId: b.sourceId, sourceTitle: b.sourceTitle, targetId: edgeMeta[eid].targetId, targetTitle: edgeMeta[eid].targetTitle, relationshipField: 'relatedPosts', confidence: 'HIGH_CONFIDENCE', mutationType: 'ADD_REFERENCE', expectedRev: b.expectedRev, actualRevBefore: doc._rev, actualRevAfter: after._rev, status: 'APPLIED', timestamp: now() });
      applied++;
    }
    emit('batch ' + b.batchGroupId + ' APPLIED - ' + b.sourceId + ' (+' + b.targetCount + ' refs, rev ' + doc._rev + ' -> ' + after._rev + ')');
  }

  const anyMissing = PLAN.edgeRows.filter((e) => !log.some((l) => l.edgeId === e.edgeId));
  for (const e of anyMissing) {
    log.push({ edgeId: e.edgeId, sourceId: e.sourceId, sourceTitle: e.sourceTitle, targetId: e.targetId, targetTitle: e.targetTitle, relationshipField: 'relatedPosts', confidence: 'HIGH_CONFIDENCE', mutationType: 'ADD_REFERENCE', expectedRev: e.expectedRev, actualRevBefore: '', actualRevAfter: '', status: 'ABORTED', timestamp: now() });
    aborted++;
  }

  const postSnapshot = {
    spec: 'SPEC 06C', phase: 'POST_MUTATION_SNAPSHOT', generatedAt: now(),
    documents: Object.keys(postState).sort().map((id) => postState[id]),
    missingSources: PLAN.sources.filter((s) => !postState[s._id]).map((s) => s._id),
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_06C_POST_MUTATION_SNAPSHOT.json'), JSON.stringify(postSnapshot, null, 2));

  const changedDocs = [];
  let unrelatedChanges = 0, identityChanges = 0, relatedAdded = 0, relatedRemoved = 0;
  for (const s of PLAN.sources) {
    const a = preDocs[s._id];
    const b = postState[s._id];
    if (!b) continue;
    const aSys = { _id: a._id, _rev: a._rev, _type: a._type };
    const aR = a.relatedPosts || [];
    const bR = b.relatedPosts || [];
    const aRefs = (Array.isArray(aR) ? aR : []).filter((x) => x && x._ref).map((x) => x._ref);
    const bRefs = (Array.isArray(bR) ? bR : []).filter((x) => x && x._ref).map((x) => x._ref);
    const added = bRefs.filter((x) => !aRefs.includes(x));
    const removed = aRefs.filter((x) => !bRefs.includes(x));
    const strippedA = stripSys(a); delete strippedA.relatedPosts;
    const strippedB = stripSys(b); delete strippedB.relatedPosts;
    const other = JSON.stringify(strippedA) !== JSON.stringify(strippedB);
    if (other) unrelatedChanges++;
    if (a._id !== b._id) identityChanges++;
    if (added.length || removed.length || a._rev !== b._rev || other) {
      changedDocs.push({
        _id: a._id, _type: a._type,
        revBefore: aSys._rev, revAfter: b._rev,
        relatedPostsBefore: aRefs, relatedPostsAfter: bRefs,
        relatedPostsAdded: added, relatedPostsRemoved: removed,
        unrelatedFieldsChanged: other ? Object.keys(strippedA).filter((k) => JSON.stringify(strippedA[k]) !== JSON.stringify(strippedB[k])) : [],
        onlyRelatedPostsPlusSystemFieldsChanged: !other,
      });
    }
    relatedAdded += added.length;
    relatedRemoved += removed.length;
  }
  const diff = {
    spec: 'SPEC 06C', phase: 'DIFF', generatedAt: now(),
    basis: 'pre-mutation snapshot vs post-mutation snapshot (system fields _rev/_updatedAt excluded from semantic comparison)',
    totals: {
      sourceDocuments: PLAN.sources.length,
      changedDocuments: changedDocs.length,
      relatedPostsAdditions: relatedAdded,
      relatedPostsRemovals: relatedRemoved,
      unrelatedFieldChanges: unrelatedChanges,
      identityChanges: identityChanges,
      authorizedEdgeDeltaExpected: 35,
    },
    changedDocuments: changedDocs,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_06C_DIFF.json'), JSON.stringify(diff, null, 2));

  const statusCounts = {};
  for (const l of log) statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
  const mutationLog = {
    spec: 'SPEC 06C', phase: 'MUTATION_LOG', generatedAt: now(),
    allowedStatusValues: ['APPLIED', 'NO_OP', 'FAILED', 'ABORTED'],
    expectedFinalResult: { APPLIED: 35, NO_OP: 0, FAILED: 0, ABORTED: 0 },
    rows: log.length,
    statusCounts: statusCounts,
    stopAllTriggered: stopAll,
    data: log,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_06C_MUTATION_LOG.json'), JSON.stringify(mutationLog, null, 2));
  const hdr = ['edgeId', 'sourceId', 'sourceTitle', 'targetId', 'targetTitle', 'relationshipField', 'confidence', 'mutationType', 'expectedRev', 'actualRevBefore', 'actualRevAfter', 'status', 'timestamp'];
  const esc = (v) => { const s = String(v === undefined || v === null ? '' : v); return /[",\r\n]/.test(s) ? String.fromCharCode(34) + s.replace(/"/g, String.fromCharCode(34) + String.fromCharCode(34)) + String.fromCharCode(34) : s; };
  const csv = [hdr.join(',')].concat(log.map((l) => hdr.map((h) => esc(l[h])).join(','))).join('\r\n');
  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_06C_MUTATION_LOG.csv'), csv);

  fs.writeFileSync(path.join(OUT_DIR, 'SPEC_06C_EXECUTION_EVENTS.json'), JSON.stringify({ spec: 'SPEC 06C', phase: 'EXECUTION_EVENTS', generatedAt: now(), events: events }, null, 2));

  console.log('\nEXECUTION RESULT: APPLIED=' + statusCounts.APPLIED + ' NO_OP=' + (statusCounts.NO_OP || 0) + ' FAILED=' + (statusCounts.FAILED || 0) + ' ABORTED=' + (statusCounts.ABORTED || 0));
  console.log('diff: changedDocs=' + diff.totals.changedDocuments + ' relatedPosts+' + relatedAdded + ' unrelated=' + unrelatedChanges + ' identity=' + identityChanges);
  if (stopAll || applied !== 35) { console.log('EXECUTION INCOMPLETE - see events'); process.exit(3); }
  console.log('GATE C EXECUTION: 35/35 APPLIED');
})().catch((e) => { console.error('EXECUTE ERROR:', e.stack || e.message); process.exit(1); });
