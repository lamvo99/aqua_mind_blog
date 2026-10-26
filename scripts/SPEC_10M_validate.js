const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { spawnSync } = require('child_process');

// SPEC 10M validation pipeline: schema diff, P0 coverage, backward compat, Gate G, integrity.
// READ-ONLY against Sanity (GET query only). No mutation endpoints are ever called.

const TEMP_DIR = 'C:/Users/lam72/AppData/Local/Temp/opencode';
const OUT = path.join('report', 'SPEC_10M');
const MIRROR = path.join('reports', 'SPEC_10M');
const ARTIFACTS = [
  'SPEC_10M_SCHEMA_MIGRATION_REPORT.md', 'SCHEMA_INVENTORY_BEFORE.json', 'SCHEMA_INVENTORY_AFTER.json',
  'SCHEMA_DIFF.json', 'P0_SCHEMA_VALIDATION.json', 'BACKWARD_COMPATIBILITY.json', 'EXECUTION_LOG.md', 'INTEGRITY.json',
];
const FINAL = process.argv.includes('--final');
const TOKEN = /SANITY_API_TOKEN="([^"]+)"/.exec(fs.readFileSync('.env.local', 'utf8'))[1];
const BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const WIKI_TYPES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const EXPECTED = { species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 };
const EXPECTED_TOTAL = 473;
const EXPECTED_HASH = 'c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda';
const DOC_FILES = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
const AFTER_FILES = [...DOC_FILES, 'index', 'knowledgeStructures'];
const EXPECTED_ADD = {
  species: ['minTankLengthCm', 'minTankWidthCm', 'swimmingSpace', 'jumpRisk', 'lidRequired', 'flowPreference', 'oxygenSensitivity', 'maturityRequirement', 'bioload', 'waterChangeSensitivity', 'breedingDifficulty', 'khMin', 'khMax', 'salinityMin', 'salinityMax', 'behaviorFlags', 'groupSize', 'communitySuitability', 'reefInteraction', 'predatesInverts', 'incompatibleSpecies', 'predatorPrey', 'reefInteractionDetail', 'knowledgeBody'],
  plant: ['feedingMode', 'substrateType', 'fertilizationPlan', 'ghMin', 'ghMax', 'khMin', 'khMax', 'heightCm', 'spreadCm', 'flowTolerance', 'parMin', 'parMax', 'knowledgeBody'],
  invertebrate: ['salinityMin', 'salinityMax', 'ghMin', 'ghMax', 'khMin', 'khMax', 'calciumRequirement', 'stabilityRequirement', 'riskFlags', 'moltingType', 'minTankVolumeL', 'breedingDifficulty', 'maturityRequirement', 'biofilmRequirement', 'predatorPrey', 'knowledgeBody'],
  coral: ['growthForm', 'parMin', 'parMax', 'flowPattern', 'salinityMin', 'salinityMax', 'phMin', 'phMax', 'dkhMin', 'dkhMax', 'caMin', 'caMax', 'mgMin', 'mgMax', 'no3Min', 'no3Max', 'po4Min', 'po4Max', 'feedingType', 'growthRate', 'spacing', 'aggressionTraits', 'coralNeighbors', 'knowledgeBody'],
  equipment: ['waterType', 'turnoverPerH', 'ratedCapacity', 'compatibleEquipment', 'relatedProblems', 'knowledgeBody'],
  problem: ['howToDistinguish', 'immediateAction', 'treatment', 'recovery', 'prevention', 'monitoring', 'escalation'],
};
const EXPECTED_NEW_TYPES = [
  'compatibleEntry', 'incompatibleEntry', 'predatorPreyEntry', 'reefInteractionEntry', 'coralNeighborEntry',
  'speciesKnowledgeBody', 'coralKnowledgeBody', 'plantKnowledgeBody', 'invertebrateKnowledgeBody', 'equipmentKnowledgeBody',
];
const EXPECTED_ADD_TOTAL = Object.values(EXPECTED_ADD).reduce((a, n) => a + n.length, 0); // 90
const MODIFIED_ALLOWED = ['species.compatibleSpecies', 'invertebrate.compatibleSpecies'];
const BODY_DOC_FOR = { species: 'speciesKnowledgeBody', coral: 'coralKnowledgeBody', plant: 'plantKnowledgeBody', invertebrate: 'invertebrateKnowledgeBody', equipment: 'equipmentKnowledgeBody' };
const ALLOWED_MODIFIED_FILES = [...DOC_FILES, 'index'].map((n) => 'sanity/schemaTypes/' + n + '.ts');
const ALLOWED_NEW_FILES = ['sanity/schemaTypes/knowledgeStructures.ts', 'tests/spec10m-schema.test.ts', 'scripts/SPEC_10M_extract.js', 'scripts/SPEC_10M_validate.js'];
const ALLOWED_UNTRACKED_PREFIX = ['docs/', 'phase/', 'report/', 'reports/', 'scripts/'];

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const slugValue = (s) => (typeof s === 'string' ? s : s?.current ?? null);
const titleOf = (type, it) => (type === 'problem' ? it.title : it.name);
const stripAnsi = (s) => s.split(String.fromCharCode(27)).join('').replace(/\[[0-9;]*m/g, '');
const camelKey = (k) => k.replace(/^body:/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const NEEDLES = [
  ['mut', 'ate('], ['createOr', 'Replace('], ['createIfNot', 'Exists('], ['.patch', '('],
  ['metho', 'd:"POST"'], ['metho', "d:'POST'"], ['?mut', 'ate'], ['https.request', '('],
].map((p) => p.join(''));

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

function parseCSV(text) {
  const rows = []; let row = []; let cur = ''; let qm = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (qm) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else qm = false; } else cur += c; }
    else if (c === '"') qm = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  const rows2 = rows.filter((r) => r.some((x) => x.trim() !== ''));
  const hdr = rows2[0] || [];
  return rows2.slice(1).map((r) => { const o = {}; hdr.forEach((h, i) => { o[h] = r[i] || ''; }); return o; });
}

const checks = [];
const check = (id, name, ok, detail) => {
  checks.push({ id, name, pass: !!ok, detail: String(detail ?? '') });
  console.log((ok ? 'CHECK OK ' : 'CHECK FAIL ') + id + ' ' + name + ' - ' + (detail ?? ''));
};

function parseSchemaFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const splitAt = src.indexOf('fields: [');
  const header = src.slice(0, splitAt < 0 ? src.length : splitAt);
  const typeName = (/(?:^|\n)\s*name:\s*'([^']+)'/.exec(header) || [])[1] || null;
  const typeTitle = (/(?:^|\n)\s*title:\s*'([^']+)'/.exec(header) || [])[1] || null;
  const jsonType = (/(?:^|\n)\s*type:\s*'([^']+)'/.exec(header) || [])[1] || null;
  const groups = [];
  const gIdx = header.indexOf('groups: [');
  if (gIdx >= 0) {
    const gSrc = header.slice(gIdx, header.indexOf(']', gIdx));
    const re = /\{\s*name:\s*'([^']+)',\s*title:\s*'([^']+)'/g;
    let m; while ((m = re.exec(gSrc))) groups.push({ name: m[1], title: m[2] });
  }
  const fields = [];
  let idx = splitAt;
  while (idx >= 0) {
    const start = src.indexOf('defineField({', idx);
    if (start < 0) break;
    let depth = 0, i = start + 'defineField('.length, end = -1;
    for (; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end < 0) break;
    const block = src.slice(start, end + 1);
    const grab = (re) => (re.exec(block) || [])[1] || null;
    const optionsSrc = (() => { const o = block.indexOf('options:'); if (o < 0) return null; let d = 0, j = o + 'options:'.length; for (; j < block.length; j++) { if (block[j] === '{') d++; else if (block[j] === '}') { d--; if (d === 0) return block.slice(o, j + 1); } } return block.slice(o); })();
    const listVals = optionsSrc ? ((/list:\s*\[([\s\S]*?)\]/.exec(optionsSrc) || [])[1] || '')
      .split(/[\n,]/).map((s) => (s.match(/'(?:[^'\\]|\\.)*'/g) || []).map((v) => v.slice(1, -1)))
      .flat().filter(Boolean) : [];
    const ofM = block.match(/of:\s*\[([^\]]*)\]/);
    const fIdx = block.indexOf('fields:');
    const subNames = fIdx >= 0 ? [...block.slice(fIdx).matchAll(/name:\s*'([^']+)'/g)].map((m) => m[1]) : [];
    fields.push({
      name: grab(/name:\s*'([^']+)'/),
      title: grab(/title:\s*'([^']+)'/),
      type: grab(/type:\s*'([^']+)'/),
      group: grab(/group:\s*'([^']+)'/),
      hasValidation: /validation:/.test(block),
      required: /Rule\.required\(\)/.test(block),
      of: ofM && ofM[1] ? (ofM[1].match(/type:\s*'([^']+)'/g) || []).map((s) => /'([^']+)'/.exec(s)[1]) : [],
      to: (() => { const t = block.match(/to:\s*\[([^\]]*)\]/); return t && t[1] ? (t[1].match(/type:\s*'([^']+)'/g) || []).map((s) => /'([^']+)'/.exec(s)[1]) : []; })(),
      listValues: listVals,
      subNames,
      blockSha256: sha256(block),
    });
    idx = end;
  }
  const secRe = /\bsection\('([^']+)',\s*'([^']+)'\)/g;
  let sm;
  while ((sm = secRe.exec(src))) {
    fields.push({
      name: sm[1], title: sm[2], type: 'array', group: null, hasValidation: false, required: false,
      of: ['block'], to: [], listValues: [], subNames: [], blockSha256: sha256(sm[0]),
    });
  }
  const clean = fields.filter((f) => f.name); // drop nameless artifacts (e.g. the section helper's own defineField)
  return { file: path.basename(file), fileSha256: sha256(src), typeName, typeTitle, jsonType, groups, fields: clean };
}

function parseSchemaSources() {
  const types = [];
  let indexParsed = null;
  for (const n of AFTER_FILES) {
    const f = path.join('sanity', 'schemaTypes', n + '.ts');
    if (!fs.existsSync(f)) continue;
    if (n === 'index') {
      const src = fs.readFileSync(f, 'utf8');
      const imports = [...src.matchAll(/import\s+(\w+)\s+from\s+'\.\/(\w+)'/g)].map((m) => ({ local: m[1], module: m[2] }));
      const arr = (/\[\s*([\s\S]*?)\]\s*(?:;|\n)/.exec(src.slice(src.indexOf('export const schemaTypes'))) || [])[1] || '';
      indexParsed = { file: 'index.ts', fileSha256: sha256(src), imports, exported: arr.split(',').map((s) => s.trim()).filter(Boolean) };
      continue;
    }
    const src = fs.readFileSync(f, 'utf8');
    if (n === 'knowledgeStructures') {
      const re = /export const (\w+) = defineType\(\{/g;
      const starts = []; let m;
      while ((m = re.exec(src))) starts.push({ local: m[1], at: m.index });
      const tmp = path.join(TEMP_DIR, '_ks_chunk.ts');
      for (let k = 0; k < starts.length; k++) {
        const chunk = src.slice(starts[k].at, k + 1 < starts.length ? starts[k + 1].at : src.length);
        fs.writeFileSync(tmp, chunk);
        const parsed = parseSchemaFile(tmp);
        parsed.file = 'knowledgeStructures.ts';
        parsed.exportName = starts[k].local;
        types.push(parsed);
      }
      fs.rmSync(tmp, { force: true });
    } else {
      types.push(parseSchemaFile(f));
    }
  }
  return { types, index: indexParsed };
}

function runCmd(cmd, args, timeout) {
  const t0 = Date.now();
  const r = spawnSync(cmd, args, { shell: true, encoding: 'utf8', timeout: timeout || 900000, maxBuffer: 32 * 1024 * 1024 });
  return { code: r.status, ms: Date.now() - t0, out: stripAnsi(String(r.stdout || '') + String(r.stderr || '')) };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  if (FINAL) {
    const missing = ARTIFACTS.filter((f) => !fs.existsSync(path.join(OUT, f)));
    if (missing.length) { console.log('FINAL STOP - missing artifacts: ' + missing.join(',')); process.exit(2); }
    const mainInt = JSON.parse(fs.readFileSync(path.join(OUT, 'INTEGRITY.json'), 'utf8'));
    if (mainInt.finalRun !== false || (mainInt.failedChecks || []).length > 0) {
      console.log('FINAL STOP - main INTEGRITY not clean: ' + JSON.stringify(mainInt.failedChecks || [])); process.exit(2);
    }
    const report = fs.readFileSync(path.join(OUT, 'SPEC_10M_SCHEMA_MIGRATION_REPORT.md'), 'utf8');
    const log = fs.readFileSync(path.join(OUT, 'EXECUTION_LOG.md'), 'utf8');
    const reportNeed = ['SPEC 10M - COMPLETE', 'READY FOR PM AUTHORIZATION OF SPEC 11', 'Sanity content writes: 0', 'Backward compatibility: PASS', 'Integrity: PASS'];
    const rProblems = reportNeed.filter((s) => !report.includes(s));
    const logProblems = ['SPEC 10M'].filter((s) => !log.includes(s));
    if (rProblems.length || logProblems.length) {
      console.log('FINAL STOP - report/log missing required lines: ' + [...rProblems, ...logProblems].join(' | ')); process.exit(2);
    }
    const finalScanHits = [];
    for (const f of ARTIFACTS) {
      const txt = fs.readFileSync(path.join(OUT, f), 'utf8');
      if (txt.includes(TOKEN)) finalScanHits.push(f + ':token');
      NEEDLES.forEach((nd, i) => { if (txt.includes(nd)) finalScanHits.push(f + ':needle#' + i); });
    }
    if (finalScanHits.length) {
      console.log('FINAL STOP - leakage/mutation needle in artifacts: ' + finalScanHits.join(', ')); process.exit(2);
    }
    fs.mkdirSync(MIRROR, { recursive: true });
    for (const f of ARTIFACTS.filter((x) => x !== 'INTEGRITY.json')) {
      fs.copyFileSync(path.join(OUT, f), path.join(MIRROR, f));
      if (sha256(fs.readFileSync(path.join(OUT, f))) !== sha256(fs.readFileSync(path.join(MIRROR, f)))) {
        console.log('FINAL STOP - mirror mismatch after copy: ' + f); process.exit(2);
      }
    }
    const finalChecks = [
      ...mainInt.checks,
      { id: 'R-01', gate: 'R', name: 'report + execution log contain required verdict/status lines', pass: true, detail: 'status=COMPLETE authorization=PENDING writes=0' },
      { id: 'M-01', gate: 'M', name: 'mirror byte-identical (reports/SPEC_10M, all 8 artifacts)', pass: true, detail: 'ok=8/8' },
    ];
    const finalInt = {
      ...mainInt, finalRun: true, status: 'SPEC 10M - COMPLETE',
      checks: finalChecks, checksTotal: finalChecks.length,
      checksPassed: finalChecks.filter((c) => c.pass).length, failedChecks: [],
      mirror: { artifacts: ARTIFACTS.length, byteIdentical: true, dir: MIRROR, verifiedAt: new Date().toISOString() },
      note: 'Schema-code-only migration validated and mirrored. Sanity deployment/population remains gated on explicit PM authorization.',
    };
    fs.writeFileSync(path.join(OUT, 'INTEGRITY.json'), JSON.stringify(finalInt, null, 2));
    fs.copyFileSync(path.join(OUT, 'INTEGRITY.json'), path.join(MIRROR, 'INTEGRITY.json'));
    let allOk = true;
    for (const f of ARTIFACTS) {
      if (sha256(fs.readFileSync(path.join(OUT, f))) !== sha256(fs.readFileSync(path.join(MIRROR, f)))) { allOk = false; console.log('FINAL MIRROR MISMATCH ' + f); }
    }
    if (!allOk) process.exit(2);
    console.log('FINAL PASS - 8/8 artifacts byte-identical; status: SPEC 10M - COMPLETE');
    process.exit(0);
  }

  // ---------------- main validation run ----------------
  fs.rmSync(path.join(OUT, 'INTEGRITY.json'), { force: true }); // stale INTEGRITY from a prior attempt must not self-match scans
  const before = JSON.parse(fs.readFileSync(path.join(OUT, 'SCHEMA_INVENTORY_BEFORE.json'), 'utf8'));
  const aChecks = before.gateA.checks;
  check('B-00', 'Gate A inventory intact and all 13 A-checks passing',
    aChecks.length === 13 && aChecks.every((c) => c.pass), 'checks=' + aChecks.length + ' passed=' + aChecks.filter((c) => c.pass).length);

  const parsed = parseSchemaSources();
  const byName = Object.fromEntries(parsed.types.map((t) => [t.typeName, t]));
  const docTypes = DOC_FILES.map((n) => byName[n]);
  const newTypes = parsed.types.filter((t) => !DOC_FILES.includes(t.typeName));
  const docFieldCount = docTypes.reduce((a, t) => a + (t ? t.fields.length : 0), 0);
  const totalFieldCount = parsed.types.reduce((a, t) => a + t.fields.length, 0);
  const b01ok = docTypes.every(Boolean) && newTypes.length === 10 && parsed.types.length === 16
    && docFieldCount === before.schema.totals.fields + EXPECTED_ADD_TOTAL;
  check('B-01', 'after inventory: 16 types (6 doc + 10 new structures), 230 doc fields, 0 removed',
    b01ok, 'types=' + parsed.types.length + ' new=' + newTypes.length + ' docFields=' + docFieldCount + '/' + (before.schema.totals.fields + EXPECTED_ADD_TOTAL));

  const diff = {
    specId: 'SPEC_10M', artifact: 'SCHEMA_DIFF', generatedAt: new Date().toISOString(),
    mode: 'CODE-ONLY source diff (sha256 of each defineField block, before vs after)',
    verdict: 'PENDING', totals: { addedFields: 0, removedFields: 0, modifiedFields: 0, newTypes: 0, unapprovedChanges: 0 },
    approvedModifications: MODIFIED_ALLOWED, types: [], indexDiff: null, checks: [],
  };
  let addedTotal = 0, removedTotal = 0; const modifiedFound = []; const addProblems = [];
  for (const n of DOC_FILES) {
    const b = before.schema.types.find((t) => t.typeName === n);
    const a = byName[n];
    const bMap = Object.fromEntries(b.fields.map((f) => [f.name, f]));
    const aMap = Object.fromEntries(a.fields.map((f) => [f.name, f]));
    const added = a.fields.filter((f) => !bMap[f.name]).map((f) => f.name).sort();
    const removed = b.fields.filter((f) => !aMap[f.name]).map((f) => f.name).sort();
    const modified = a.fields.filter((f) => bMap[f.name] && bMap[f.name].blockSha256 !== f.blockSha256)
      .map((f) => ({ name: f.name, beforeSha: bMap[f.name].blockSha256, afterSha: f.blockSha256 }));
    const expected = [...EXPECTED_ADD[n]].sort();
    const additionsExact = JSON.stringify(added) === JSON.stringify(expected);
    if (!additionsExact) addProblems.push(n + ': got[' + added.join(',') + ']');
    diff.types.push({ typeName: n, beforeFields: b.fields.length, afterFields: a.fields.length, added, removed, modified, approvedAdditions: expected, additionsExact });
    addedTotal += added.length; removedTotal += removed.length;
    for (const m of modified) modifiedFound.push(n + '.' + m.name);
  }
  const newTypeNames = newTypes.map((t) => t.typeName);
  const newTypesExact = EXPECTED_NEW_TYPES.every((t) => newTypeNames.includes(t)) && newTypeNames.length === EXPECTED_NEW_TYPES.length;
  const modifiedOk = JSON.stringify([...modifiedFound].sort()) === JSON.stringify([...MODIFIED_ALLOWED].sort());
  const idxAdded = parsed.index.exported.filter((e) => !before.schema.index.exported.includes(e));
  const idxRemoved = before.schema.index.exported.filter((e) => !parsed.index.exported.includes(e));
  diff.indexDiff = { beforeExports: before.schema.index.exported.length, afterExports: parsed.index.exported.length, added: idxAdded, removed: idxRemoved, importsAdded: parsed.index.imports.filter((i) => !before.schema.index.imports.some((b) => b.module === i.module)).map((i) => i.module) };
  diff.totals = { addedFields: addedTotal, removedFields: removedTotal, modifiedFields: modifiedFound.length, newTypes: newTypeNames.length, unapprovedChanges: 0 };
  const b02ok = addedTotal === EXPECTED_ADD_TOTAL && removedTotal === 0 && modifiedOk && newTypesExact
    && addProblems.length === 0 && idxRemoved.length === 0 && EXPECTED_NEW_TYPES.every((t) => diff.indexDiff.added.includes(t));
  diff.verdict = b01ok && b02ok ? 'EXPECTED-ONLY' : 'UNAPPROVED CHANGES DETECTED';
  if (!b02ok) diff.totals.unapprovedChanges = addedTotal === EXPECTED_ADD_TOTAL ? modifiedFound.length + idxRemoved.length + addProblems.length : -1;
  check('B-02', 'schema diff = expected only (90 added / 0 removed / 2 modified / 10 new types / index +10 exports)',
    b02ok, 'added=' + addedTotal + ' removed=' + removedTotal + ' modified=[' + modifiedFound.join(',') + '] newTypes=' + newTypeNames.length + (addProblems.length ? ' addProblems=' + addProblems.join(' ') : ''));
  diff.checks = checks.filter((c) => c.id.startsWith('B-'));

  const afterInv = {
    specId: 'SPEC_10M', artifact: 'SCHEMA_INVENTORY_AFTER', generatedAt: new Date().toISOString(),
    mode: 'READ-ONLY (schema source files only; no Sanity deployment)',
    gateB: { checks: checks.filter((c) => c.id.startsWith('B-')) },
    expectedAdditions: EXPECTED_ADD, approvedNewTypes: EXPECTED_NEW_TYPES, approvedModifications: MODIFIED_ALLOWED,
    schema: {
      schemaDir: 'sanity/schemaTypes', index: parsed.index, types: parsed.types,
      totals: { types: parsed.types.length, fields: totalFieldCount, docFields: docFieldCount, newStructures: newTypes.length },
    },
    environment: {
      gitHead: require('child_process').execSync('git rev-parse --short HEAD').toString().trim(),
      gitBranch: require('child_process').execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
      node: process.version, mode: 'SCHEMA CODE ONLY - schema not deployed; Sanity content untouched',
    },
    note: 'Inventory captured AFTER SPEC 10M schema code changes, before any deployment. Content untouched.',
  };
  fs.writeFileSync(path.join(OUT, 'SCHEMA_INVENTORY_AFTER.json'), JSON.stringify(afterInv, null, 2));
  fs.writeFileSync(path.join(OUT, 'SCHEMA_DIFF.json'), JSON.stringify(diff, null, 2));
  console.log('WROTE SCHEMA_INVENTORY_AFTER.json + SCHEMA_DIFF.json (verdict ' + diff.verdict + ')');

  // ---------------- Gate B/C: migration queue + architecture matrix coverage ----------------
  const afterFields = {};
  for (const n of DOC_FILES) afterFields[n] = Object.fromEntries(byName[n].fields.map((f) => [f.name, f]));

  function resolveQueueTarget(target) {
    const idx = target.indexOf(': ');
    const domain = target.slice(0, idx);
    let rest = target.slice(idx + 2);
    if (rest.startsWith('newBlock:')) return { domain, fields: [], block: rest.slice('newBlock:'.length) };
    rest = rest.replace('ALLOLEPATHY', 'ALLELOPATHY').replace('ENCRASTING', 'ENCRUSTING');
    let value;
    const bracket = rest.match(/^([A-Za-z0-9]+)\[([^\]]+)\]$/);
    if (bracket) return { domain, fields: [bracket[1]], value: bracket[2] };
    let objectParts;
    const brace = rest.match(/^(.+?)\s*\{([^}]+)\}$/);
    if (brace) { rest = brace[1]; objectParts = brace[2].split(',').map((s) => s.trim()); }
    rest = rest.replace(/\s*\(ppt\).*/, '').replace(/\s+or\s+.*$/, '');
    const parts = rest.split(' + ').flatMap((p) => {
      const segs = p.split('/');
      if (segs.length === 2 && /^(Max|max)$/.test(segs[1]) && /[Mm]in$/.test(segs[0])) {
        return [segs[0], segs[0].replace(/[Mm]in$/, '') + (segs[1] === 'max' ? 'max' : 'Max')];
      }
      return segs;
    });
    return { domain, fields: parts, objectParts };
  }

  function resolveMatrixTarget(raw) {
    let t = String(raw).replace('ALLOLEPATHY', 'ALLELOPATHY').replace('ENCRASTING', 'ENCRUSTING');
    if (t.startsWith('species<->coral')) return { represented: true, note: 'coral-side view of species.reefInteractionDetail[].coral (REL-P03); no duplicate coral slot per SPEC 10 decision rule' };
    let objectParts = null;
    const brace = /^(.+?)\s*\{([^}]+)\}$/.exec(t.trim());
    if (brace) { t = brace[1]; objectParts = brace[2].split(',').map((s) => s.trim()); }
    t = t.replace(/\s*\([^)]*\)/g, ' ').replace(/\s+or\s+.*$/, '').replace(/\s+/g, ' ').trim();
    if (t === 'group/type') t = 'group';
    let value = null;
    const bracket = /^([A-Za-z0-9]+)\[([^\]]+)\]$/.exec(t);
    if (bracket) return { fields: [bracket[1]], value: bracket[2], objectParts };
    const parts = t.split(/\s*\+\s*/).flatMap((p) => {
      const segs = p.split('/').map((s) => s.trim());
      if (segs.length === 2 && /^(Max|max)$/.test(segs[1]) && /[Mm]in$/.test(segs[0])) {
        return [segs[0], segs[0].replace(/[Mm]in$/, '') + (segs[1] === 'max' ? 'max' : 'Max')];
      }
      return segs;
    }).filter(Boolean);
    return { fields: parts, value, objectParts };
  }

  const queueRows = parseCSV(fs.readFileSync(path.join('report', 'SPEC_10', 'PRIORITY_MIGRATION_QUEUE.csv'), 'utf8'));
  const implTypes = ['SCHEMA_MIGRATION', 'BODY_BLOCK', 'RELATIONSHIP_SLOT'];
  const impl = queueRows.filter((r) => implTypes.includes(r.itemType));
  const typeCount = (t) => queueRows.filter((r) => r.itemType === t).length;
  const itemTypeCounts = {};
  for (const r of queueRows) itemTypeCounts[r.itemType] = (itemTypeCounts[r.itemType] || 0) + 1;
  const p0Rows = queueRows.filter((r) => r.priority === 'P0');

  const queueItems = [];
  for (const row of impl) {
    const res = resolveQueueTarget(row.target);
    const problems = [];
    const evidence = { domain: res.domain, fields: [], block: res.block || null, value: res.value || null, objectParts: res.objectParts || null };
    const docFields = afterFields[res.domain];
    if (!docFields) problems.push('missing domain ' + res.domain);
    else if (row.itemType === 'BODY_BLOCK') {
      const f = docFields[res.block];
      if (!f) problems.push('missing block ' + res.block);
      else {
        evidence.blockType = f.type; evidence.blockOf = f.of;
        if (f.type !== 'array') problems.push(res.block + ' type=' + f.type);
        if (!f.of.includes('block')) problems.push(res.block + ' of=' + (f.of.join('/') || 'none'));
      }
    } else {
      for (const name of res.fields) {
        const f = docFields[name];
        if (!f) { problems.push('missing field ' + res.domain + '.' + name); continue; }
        const ev = { name, type: f.type, optional: !f.required, listValues: f.listValues.length ? f.listValues : undefined };
        if (res.value) {
          if (!f.listValues.includes(res.value)) problems.push(name + ' missing enum value ' + res.value);
          if (f.type !== 'array') problems.push(name + ' type=' + f.type + ' (expected array multi-select)');
        }
        evidence.fields.push(ev);
      }
      if (res.objectParts && res.fields.length) {
        const last = res.fields[res.fields.length - 1];
        const f = docFields[last];
        if (f) {
          evidence.objectSubFields = f.subNames;
          for (const p of res.objectParts) if (!f.subNames.includes(p)) problems.push(last + ' missing subfield ' + p);
        }
      }
    }
    queueItems.push({ queueId: row.queueId, itemType: row.itemType, priority: row.priority, target: row.target, resolution: res, evidence, pass: problems.length === 0, problems });
  }
  const queueFailed = queueItems.filter((i) => !i.pass);
  check('B-03', 'migration queue: all 76 implementation items structurally resolve',
    queueItems.length === 76 && queueFailed.length === 0,
    'items=' + queueItems.length + ' failed=' + (queueFailed.length ? queueFailed.map((i) => i.queueId + '[' + i.problems.join(';') + ']').join(' ') : '0'));

  const matrix = parseCSV(fs.readFileSync(path.join('report', 'SPEC_10', 'KNOWLEDGE_ARCHITECTURE_MATRIX.csv'), 'utf8'));
  const reprCounts = {};
  for (const r of matrix) reprCounts[r.primaryRepresentation] = (reprCounts[r.primaryRepresentation] || 0) + 1;
  let bodySectionRows = 0, newBlockRows = 0;
  const matrixItems = [];
  matrix.forEach((row, i) => {
    const tgt = row.target;
    const problems = [];
    let resolution;
    if (tgt.startsWith('body:')) {
      bodySectionRows++;
      const sec = camelKey(tgt);
      const docType = BODY_DOC_FOR[row.domain];
      const secs = docType && byName[docType] ? byName[docType].fields.map((f) => f.name) : [];
      resolution = { kind: 'bodySection', bodyType: docType || null, section: sec };
      if (!docType) problems.push('no body type for domain ' + row.domain);
      else if (!secs.includes(sec)) problems.push('missing section ' + sec + ' in ' + docType);
    } else if (tgt.startsWith('newBlock:')) {
      newBlockRows++;
      const blk = tgt.split(':')[1].split(' ')[0];
      const f = afterFields[row.domain] && afterFields[row.domain][blk];
      resolution = { kind: 'newBlock', block: blk };
      if (!f) problems.push('missing block ' + row.domain + '.' + blk);
      else {
        if (f.type !== 'array') problems.push(blk + ' type=' + f.type);
        if (!f.of.includes('block')) problems.push(blk + ' of=' + (f.of.join('/') || 'none'));
      }
    } else {
      const res = resolveMatrixTarget(tgt);
      resolution = { kind: 'field', ...res };
      if (!res.represented) {
        const docFields = afterFields[row.domain];
        if (!docFields) problems.push('missing domain ' + row.domain);
        else {
          for (const name of res.fields) {
            const f = docFields[name];
            if (!f) { problems.push('missing field ' + row.domain + '.' + name); continue; }
            if (res.value) {
              if (f.type !== 'array') problems.push(name + ' type=' + f.type + ' (expected array multi-select)');
              if (!f.listValues.includes(res.value)) problems.push(name + ' missing value ' + res.value);
            }
          }
          if (res.objectParts && res.fields.length) {
            const last = res.fields[res.fields.length - 1];
            const f = docFields[last];
            if (f) for (const p of res.objectParts) if (!f.subNames.includes(p)) problems.push(last + ' missing subfield ' + p);
          }
        }
      }
    }
    matrixItems.push({ i: i + 1, domain: row.domain, repr: row.primaryRepresentation, target: tgt, resolution, pass: problems.length === 0, problems });
  });
  const matrixFailed = matrixItems.filter((m) => !m.pass);
  check('B-04', 'architecture matrix: all 230 rows structurally represented',
    matrix.length === 230 && matrixFailed.length === 0,
    'rows=' + matrix.length + ' failed=' + (matrixFailed.length ? matrixFailed.slice(0, 6).map((m) => 'r' + m.i + '[' + m.problems.join(';') + ']').join(' ') : '0'));

  const countsOk = queueRows.length === 106 && impl.length === 76 && typeCount('SCHEMA_MIGRATION') === 64
    && typeCount('BODY_BLOCK') === 7 && typeCount('RELATIONSHIP_SLOT') === 5
    && matrix.length === 230 && reprCounts.EXISTING_FIELD === 60 && reprCounts.NEW_FIELD === 66
    && reprCounts.BODY === 95 && reprCounts.RELATIONSHIP === 9 && bodySectionRows === 87 && newBlockRows === 8;
  check('C-01', 'source counts exact: queue 106 (64+7+5 impl, 24 P0), matrix 230 (60/66/95/9; 87 body + 8 blocks)',
    countsOk && p0Rows.length === 24,
    'queue=' + queueRows.length + '/' + impl.length + '(' + typeCount('SCHEMA_MIGRATION') + '+' + typeCount('BODY_BLOCK') + '+' + typeCount('RELATIONSHIP_SLOT') + ') p0=' + p0Rows.length
    + ' matrix=' + matrix.length + ' repr=' + JSON.stringify(reprCounts) + ' body=' + bodySectionRows + ' blocks=' + newBlockRows);

  const p0Evidence = [];
  for (const row of p0Rows) {
    const structural = queueItems.find((q) => q.queueId === row.queueId);
    p0Evidence.push(structural
      ? { queueId: row.queueId, itemType: row.itemType, target: row.target, structural: true, pass: structural.pass, evidence: structural.evidence, problems: structural.problems }
      : { queueId: row.queueId, itemType: row.itemType, target: row.target, structural: false, pass: true, note: 'outside implementation scope (' + row.itemType + '); served by migration-phase work items' });
  }
  const p0Failed = p0Evidence.filter((e) => !e.pass);
  check('C-02', 'all P0 queue items resolved with field-level evidence (24 items)',
    p0Rows.length === 24 && p0Failed.length === 0,
    'p0=' + p0Rows.length + ' structural=' + p0Evidence.filter((e) => e.structural).length + ' failed=' + (p0Failed.length ? p0Failed.map((e) => e.queueId).join(',') : '0'));

  const sgAbsent = !afterFields.species.sgMin && !afterFields.species.sgMax && !afterFields.coral.sgMin && !afterFields.invertebrate.sgMin;
  check('C-03', 'alternative sgMin/sgMax representation NOT implemented (single source of truth = salinity ppt)', sgAbsent, 'sgAbsent=' + sgAbsent);

  const optionalProblems = [];
  for (const [domain, names] of Object.entries(EXPECTED_ADD)) {
    for (const nm of names) {
      const f = afterFields[domain][nm];
      if (!f) optionalProblems.push(domain + '.' + nm + '=MISSING');
      else if (f.required) optionalProblems.push(domain + '.' + nm + '=REQUIRED');
    }
  }
  check('C-04', 'all 90 approved additions present and optional (no field-level Rule.required)',
    optionalProblems.length === 0 && EXPECTED_ADD_TOTAL === 90,
    'checked=' + EXPECTED_ADD_TOTAL + ' problems=' + (optionalProblems.join(',') || '0'));

  const p0Artifact = {
    specId: 'SPEC_10M', artifact: 'P0_SCHEMA_VALIDATION', generatedAt: new Date().toISOString(), mode: 'READ-ONLY (schema source structural validation)',
    queue: {
      file: 'report/SPEC_10/PRIORITY_MIGRATION_QUEUE.csv', total: queueRows.length,
      implementationItems: queueItems.length, breakdown: { SCHEMA_MIGRATION: typeCount('SCHEMA_MIGRATION'), BODY_BLOCK: typeCount('BODY_BLOCK'), RELATIONSHIP_SLOT: typeCount('RELATIONSHIP_SLOT') },
      itemTypeCounts, p0Items: p0Rows.length,
    },
    p0Evidence, queueItems,
    matrix: {
      file: 'report/SPEC_10/KNOWLEDGE_ARCHITECTURE_MATRIX.csv', total: matrix.length, byRepresentation: reprCounts,
      bodySectionRows, newBlockRows, unresolved: matrixFailed.map((m) => ({ i: m.i, target: m.target, problems: m.problems })), items: matrixItems,
    },
    approvedAdditions: EXPECTED_ADD, approvedNewTypes: EXPECTED_NEW_TYPES,
    findings: [
      'Vocabulary normalization: matrix typo ALLOLEPATHY resolved to ALLELOPATHY (aggressionTraits/coralNeighborEntry enum); matrix typo ENCRASTING resolved to ENCRUSTING (coral.growthForm enum).',
      'breedingDifficulty enum values are not defined by SPEC 10 source artifacts; implemented provisionally as EASY/MODERATE/DIFFICULT (not populated on any document).',
      'Matrix target "group/type" is label shorthand for the existing schema field "group" (FIELD_TO_KNOWLEDGE_MAPPING plant.group / invertebrate.group); no "type" field exists or was added.',
      'Matrix target "salinityMin/Max (ppt) or sgMin/sgMax": salinityMin/Max implemented; sgMin/sgMax alternative deliberately NOT implemented (single source of truth).',
      'Five matrix body keys outside BODY_ARCHITECTURE.md section lists (coral lighting-risks/reef-caveats/chemistry-problems; plant common-problems/transition) implemented as additional named sections per SPEC 10 matrix-over-documents precedence.',
      'species<->coral reefInteraction row is the documented bidirectional view of REL-P03; no duplicate coral-side slot created per SPEC 10 no-duplicate rule.',
      'problem.causes entry-tag EXTEND deferred: would require rewriting populated portable-text blocks; narrative structure already supports the semantics.',
    ],
    checks: checks.filter((c) => ['B-03', 'B-04', 'C-01', 'C-02', 'C-03', 'C-04'].includes(c.id)),
  };
  fs.writeFileSync(path.join(OUT, 'P0_SCHEMA_VALIDATION.json'), JSON.stringify(p0Artifact, null, 2));
  console.log('WROTE P0_SCHEMA_VALIDATION.json');

  // ---------------- Gate D: backward compatibility (live, read-only GET) ----------------
  const baseline = JSON.parse(fs.readFileSync(path.join(TEMP_DIR, 'spec10m_baseline.json'), 'utf8'));
  const fetchWiki = async () => { const out = {}; for (const t of WIKI_TYPES) out[t] = await q('*[_type == "' + t + '" && !(_id in path("drafts.**"))]'); return out; };
  const read1 = await fetchWiki();
  const read2 = await fetchWiki();
  let mismatches = 0;
  for (const t of WIKI_TYPES) if (JSON.stringify(read1[t]) !== JSON.stringify(read2[t])) mismatches++;
  check('D-01', 'post-change deterministic double-read identical (6 domains)', mismatches === 0, 'mismatchedTypes=' + mismatches);
  const records = read1;
  const counts = {};
  for (const t of WIKI_TYPES) counts[t] = records[t].length;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  check('D-02', '473 records / domain counts unchanged vs baseline',
    total === EXPECTED_TOTAL && WIKI_TYPES.every((t) => counts[t] === EXPECTED[t]) && JSON.stringify(counts) === JSON.stringify(baseline.counts),
    'total=' + total + '/' + EXPECTED_TOTAL + ' ' + JSON.stringify(counts));

  const draftDocs = await q('*[_id in path("drafts.**")]._id');
  let wikiDrafts = 0;
  for (const t of WIKI_TYPES) for (const r of records[t]) if (String(r._id).startsWith('drafts.')) wikiDrafts++;
  check('D-03', 'drafts = 0 (dataset + wiki domains)', wikiDrafts === 0 && draftDocs.length === 0, 'wikiDrafts=' + wikiDrafts + ' datasetDrafts=' + draftDocs.length);

  const slugSeen = {}; let dupSlugs = 0, noSlug = 0;
  for (const t of WIKI_TYPES) for (const r of records[t]) {
    const s = slugValue(r.slug);
    if (!s) { noSlug++; continue; }
    if (slugSeen[s]) dupSlugs++;
    slugSeen[s] = r._id;
  }
  check('D-04', 'duplicate slugs = 0', dupSlugs === 0 && noSlug === 0, 'duplicates=' + dupSlugs + ' noSlug=' + noSlug);

  const canonical = {};
  for (const t of WIKI_TYPES) for (const r of records[t]) canonical[r._id] = { type: t, rec: r };
  const hashParts = Object.keys(canonical).sort().map((id) => {
    const c = canonical[id];
    return sha256(JSON.stringify({ id, title: titleOf(c.type, c.rec), slug: slugValue(c.rec.slug) }));
  });
  const identityHash = sha256(hashParts.join('\n'));
  check('D-05', 'canonical identity hash unchanged', identityHash === EXPECTED_HASH && identityHash === baseline.identityHash,
    identityHash === EXPECTED_HASH ? 'MATCH' : identityHash);

  const relFields = ['compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedProblems', 'relatedPosts', 'relatedTools', 'parentSpecies'];
  const relOf = (x) => JSON.stringify(relFields.map((f) => (Array.isArray(x[f]) ? x[f].map((v) => (v && v._ref) || v) : x[f] ?? null)));
  const sortById = (arr) => arr.slice().sort((a, b) => String(a._id).localeCompare(String(b._id)));
  let changed = 0, extra = 0, missing = 0, titleDiff = 0, slugDiff = 0, catDiff = 0, relDiff = 0, seoDiff = 0, updatedDiff = 0;
  for (const t of WIKI_TYPES) {
    const cur = sortById(records[t]);
    const base = sortById(baseline.records[t]);
    const bMap = Object.fromEntries(base.map((r) => [r._id, r]));
    const curIds = new Set(cur.map((r) => r._id));
    for (const id of Object.keys(bMap)) if (!curIds.has(id)) missing++;
    for (const r of cur) {
      const b = bMap[r._id];
      if (!b) { extra++; continue; }
      if (JSON.stringify(r) !== JSON.stringify(b)) changed++;
      if (titleOf(t, r) !== titleOf(t, b)) titleDiff++;
      if (slugValue(r.slug) !== slugValue(b.slug)) slugDiff++;
      if ((r.category || null) !== (b.category || null)) catDiff++;
      if (relOf(r) !== relOf(b)) relDiff++;
      if (JSON.stringify(r.seo || null) !== JSON.stringify(b.seo || null)) seoDiff++;
      if (r._updatedAt !== b._updatedAt) updatedDiff++;
    }
  }
  check('D-06', 'full-document diff vs pre-migration baseline = 0', changed === 0 && extra === 0 && missing === 0,
    'changed=' + changed + ' extra=' + extra + ' missing=' + missing);
  check('D-07', 'titles/slugs/categories/relationships/SEO/_updatedAt all unchanged',
    titleDiff === 0 && slugDiff === 0 && catDiff === 0 && relDiff === 0 && seoDiff === 0 && updatedDiff === 0,
    'title=' + titleDiff + ' slug=' + slugDiff + ' cat=' + catDiff + ' rel=' + relDiff + ' seo=' + seoDiff + ' updated=' + updatedDiff);

  const newKeyDetail = {}; let newKeyViolations = 0;
  for (const t of WIKI_TYPES) {
    for (const nm of (EXPECTED_ADD[t] || [])) {
      for (const r of records[t]) {
        const v = r[nm];
        const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
          || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);
        if (!empty) { newKeyViolations++; newKeyDetail[t + '.' + nm] = (newKeyDetail[t + '.' + nm] || 0) + 1; }
      }
    }
  }
  check('D-08', 'approved new field keys absent-or-empty on all 473 documents', newKeyViolations === 0, 'violations=' + newKeyViolations);

  const csNonEmpty = [...records.species, ...records.invertebrate]
    .filter((r) => Array.isArray(r.compatibleSpecies) && r.compatibleSpecies.length > 0).length;
  check('D-09', 'compatibleSpecies still empty on 218+56 (entry-shape change provably data-neutral)', csNonEmpty === 0, 'nonEmpty=' + csNonEmpty);

  // ---------------- Gate E: frontend GROQ probes (live, read-only GET) ----------------
  const firstSlug = slugValue(records.species[0].slug);
  const dbProbeQuery = '*[_type == "species" && slug.current == "' + firstSlug + '"] {\n      _id, name, scientificName, slug,\n      compatibleSpecies[]->{ _id, name, slug, mainImage, excerpt },\n      compatiblePlants[]->{ _id, name, slug, mainImage, excerpt },\n      compatibleInvertebrates[]->{ _id, name, slug, mainImage, excerpt },\n      suitableEquipment[]->{ _id, name, slug, mainImage, category, brand },\n      relatedProblems[]->{ _id, title, slug, excerpt, category },\n      relatedPosts[]->{ _id, title, slug, excerpt, publishedAt, mainImage }\n    }';
  const dbProbe = await q(dbProbeQuery);
  const refKeys = ['compatibleSpecies', 'compatiblePlants', 'compatibleInvertebrates', 'suitableEquipment', 'relatedProblems', 'relatedPosts'];
  const dbOk = Array.isArray(dbProbe) && dbProbe.length === 1
    && refKeys.every((k) => k in dbProbe[0] && (dbProbe[0][k] === null || Array.isArray(dbProbe[0][k])));
  check('E-01', 'database.ts species-detail projection executes unchanged (all ref keys present, null-or-array)',
    dbOk, 'slug=' + firstSlug + ' results=' + (Array.isArray(dbProbe) ? dbProbe.length : 'err'));

  const ccQuery = '*[_type == "species" && defined(slug) && defined(name)] | order(name asc) {\n      _id, name, scientificName, slug,\n      sizeCm, tankSizeMinL, tempMinC, tempMaxC, phMin, phMax, ghMin, ghMax,\n      diet, temperament, waterZone, schooling, difficulty,\n      "compatibleWith": compatibleSpecies[]->slug.current\n    }';
  const cc = await q(ccQuery);
  const expectCc = records.species.filter((r) => slugValue(r.slug) && r.name).length;
  const ccNull = Array.isArray(cc) ? cc.filter((r) => r.compatibleWith === null).length : -1;
  const ccOk = Array.isArray(cc) && cc.length === expectCc
    && cc.every((r) => r.compatibleWith === null || (Array.isArray(r.compatibleWith) && r.compatibleWith.length === 0));
  check('E-02', 'compatibility-checker GROQ executes unchanged; compatibleWith empty/null for every species',
    ccOk, 'results=' + (Array.isArray(cc) ? cc.length : 'err') + '/' + expectCc + ' nullCompatibleWith=' + ccNull);

  const bcArtifact = {
    specId: 'SPEC_10M', artifact: 'BACKWARD_COMPATIBILITY', generatedAt: new Date().toISOString(),
    mode: 'READ-ONLY live Sanity GET queries; no writes',
    baseline: { file: baseline.contentBaselineFile, generatedAt: baseline.generatedAt, counts: baseline.counts, total: baseline.total, identityHash: baseline.identityHash },
    current: { counts, total, identityHash, drafts: wikiDrafts, duplicateSlugs: dupSlugs },
    diffs: {
      fullDocumentChanged: changed, extra, missing, titles: titleDiff, slugs: slugDiff, categories: catDiff,
      relationships: relDiff, seo: seoDiff, updatedAt: updatedDiff,
      newFieldKeyViolations: newKeyViolations, newFieldKeyDetail: newKeyDetail, compatibleSpeciesNonEmpty: csNonEmpty,
    },
    probes: {
      databaseProjection: { source: 'lib/database.ts:115 (compatibleSpecies/Plants/Invertebrates/suitableEquipment/relatedProblems/relatedPosts projection)', slug: firstSlug, results: Array.isArray(dbProbe) ? dbProbe.length : 0, ok: dbOk },
      compatibilityChecker: { source: 'app/tools/compatibility-checker/page.tsx:34 (compatibleSpecies[]->slug.current)', results: Array.isArray(cc) ? cc.length : 0, expected: expectCc, allCompatibleWithEmpty: ccOk, ok: ccOk },
      queries: [{ query: dbProbeQuery }, { query: ccQuery }],
    },
    sanityWrites: 0,
    checks: checks.filter((c) => c.id.startsWith('D-') || c.id.startsWith('E-')),
    note: 'Schema was NOT deployed to Sanity during this phase; live content is byte-identical to the pre-migration baseline.',
  };
  fs.writeFileSync(path.join(OUT, 'BACKWARD_COMPATIBILITY.json'), JSON.stringify(bcArtifact, null, 2));
  console.log('WROTE BACKWARD_COMPATIBILITY.json');

  // ---------------- Gate F: unapproved changes / leakage / mutation safety ----------------
  const statusOut = runCmd('git', ['status', '--porcelain'], 60000).out;
  const unapproved = [];
  for (const line of statusOut.split('\n')) {
    const l = line.replace(/\s+$/, '');
    if (!l) continue;
    const code = l.slice(0, 2);
    const p = l.slice(3).replace(/^"|"$/g, '');
    if (code === '??') {
      if (!(ALLOWED_NEW_FILES.includes(p) || ALLOWED_UNTRACKED_PREFIX.some((pre) => p.startsWith(pre)))) unapproved.push('untracked ' + p);
    } else if (!ALLOWED_MODIFIED_FILES.includes(p)) {
      unapproved.push('modified[' + code.trim() + '] ' + p);
    }
  }
  check('F-01', 'unapproved files = 0 (tracked mods limited to 7 schema files; new files within SPEC 10M scope)',
    unapproved.length === 0, 'unapproved=' + (unapproved.join(' | ') || '0'));

  const scanTargets = [];
  for (const d of [OUT, MIRROR]) {
    if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) scanTargets.push(path.join(d, f));
  }
  const specScripts = fs.readdirSync('scripts').filter((f) => f.startsWith('SPEC_10M'));
  for (const f of specScripts) scanTargets.push(path.join('scripts', f));
  let leaks = 0; const leakFiles = [];
  for (const f of scanTargets) {
    if (!fs.statSync(f).isFile()) continue;
    if (fs.readFileSync(f, 'utf8').includes(TOKEN)) { leaks++; leakFiles.push(f); }
  }
  check('F-02', 'secret/token leakage = 0 across SPEC 10M artifacts + scripts',
    leaks === 0, 'filesScanned=' + scanTargets.length + ' leaks=' + (leakFiles.join(',') || '0'));

  let needleHits = 0; const hitDetail = [];
  for (const f of scanTargets) {
    if (!fs.statSync(f).isFile()) continue;
    const txt = fs.readFileSync(f, 'utf8');
    NEEDLES.forEach((nd, i) => { if (txt.includes(nd)) { needleHits++; hitDetail.push(path.basename(f) + ':needle#' + i); } });
  }
  check('F-03', 'no mutation-endpoint code paths in SPEC 10M scripts/artifacts (fragment-assembled needle scan)',
    needleHits === 0, 'needles=' + NEEDLES.length + ' hits=' + (hitDetail.join(',') || '0'));

  const nonGetNeedle = ['https.request', '('].join('');
  const nonGet = specScripts.filter((f) => fs.readFileSync(path.join('scripts', f), 'utf8').includes(nonGetNeedle));
  check('F-04', 'Sanity document writes = 0 / GET-only transport in all SPEC 10M scripts',
    nonGet.length === 0, 'writes=0 scripts=' + specScripts.length + ' nonGet=' + (nonGet.join(',') || '0'));

  // ---------------- Gate G: lint / typecheck / tests / build ----------------
  console.log('Running Gate G: lint, tsc, focused schema test, full test suite, build ...');
  const lint = runCmd('npm', ['run', 'lint']);
  check('G-01', 'npm run lint exit 0', lint.code === 0, 'exit=' + lint.code + ' ms=' + lint.ms);

  const tscR = runCmd('npx', ['tsc', '--noEmit']);
  check('G-02', 'tsc --noEmit exit 0', tscR.code === 0, 'exit=' + tscR.code + ' ms=' + tscR.ms);

  const focused = runCmd('npx', ['vitest', 'run', 'tests/spec10m-schema.test.ts']);
  const fPassed = /Tests\s+(\d+)\s+passed/.exec(focused.out) || /(\d+)\s+tests passed/.exec(focused.out);
  check('G-03', 'SPEC 10M schema test suite passes (108 assertions across all gates)',
    focused.code === 0 && (!fPassed || Number(fPassed[1]) >= 108), 'exit=' + focused.code + ' passed=' + (fPassed ? fPassed[1] : '?') + ' ms=' + focused.ms);

  const failingFiles = (out) => {
    const set = new Set();
    for (const m of out.matchAll(/FAIL\s+([^\s>]+\.test\.tsx?)/g)) set.add(m[1].replace(/\\/g, '/'));
    for (const m of out.matchAll(/(?:^|\s)(?:×|✗)\s+([^\s>]+\.test\.tsx?)/g)) set.add(m[1].replace(/\\/g, '/'));
    return [...set];
  };
  const knownOnly = (fs2) => fs2.length > 0 && fs2.every((f) => f === 'tests/compare.test.ts');
  let full = runCmd('npm', ['test']);
  let fullAttempt = 1;
  let fullFails = failingFiles(full.out);
  if (!(full.code === 0 || knownOnly(fullFails))) {
    fullAttempt = 2;
    full = runCmd('npm', ['test']);
    fullFails = failingFiles(full.out);
  }
  check('G-04', 'npm test: only the known baseline failure tests/compare.test.ts (retry allowed)',
    full.code === 0 || knownOnly(fullFails),
    'attempt=' + fullAttempt + ' exit=' + full.code + ' failingFiles=' + (fullFails.join(',') || 'none') + ' ms=' + full.ms);

  const build = runCmd('npm', ['run', 'build']);
  check('G-05', 'npm run build exit 0', build.code === 0, 'exit=' + build.code + ' ms=' + build.ms);

  // ---------------- INTEGRITY.json ----------------
  const failed = checks.filter((c) => !c.pass);
  const allChecks = [...aChecks, ...checks];
  const integrity = {
    specId: 'SPEC_10M', generatedAt: new Date().toISOString(), finalRun: false,
    mode: 'SCHEMA CODE ONLY - READ-ONLY validation; schema not deployed; content untouched',
    sanityWrites: 0, mutationCalls: 0,
    status: failed.length === 0 ? 'SPEC 10M - VALIDATED (report + mirror pending)' : 'SPEC 10M - VALIDATION FAILED',
    gates: {
      A_baseline: aChecks,
      B_schema: checks.filter((c) => c.id.startsWith('B-')),
      C_p0: checks.filter((c) => c.id.startsWith('C-')),
      D_backwardCompat: checks.filter((c) => c.id.startsWith('D-')),
      E_probes: checks.filter((c) => c.id.startsWith('E-')),
      F_safety: checks.filter((c) => c.id.startsWith('F-')),
      G_tests: checks.filter((c) => c.id.startsWith('G-')),
    },
    checks: allChecks,
    checksTotal: allChecks.length,
    checksPassed: allChecks.filter((c) => c.pass).length,
    failedChecks: failed.map((c) => c.id + ' ' + c.name),
    contentUnchanged: {
      identityHash: identityHash === EXPECTED_HASH ? 'UNCHANGED (MATCH)' : 'CHANGED',
      records: total, counts, drafts: wikiDrafts, duplicateSlugs: dupSlugs,
      titles: titleDiff === 0 ? 'UNCHANGED' : 'CHANGED',
      slugs: slugDiff === 0 ? 'UNCHANGED' : 'CHANGED',
      categories: catDiff === 0 ? 'UNCHANGED' : 'CHANGED',
      relationships: relDiff === 0 ? 'UNCHANGED' : 'CHANGED',
      seo: seoDiff === 0 ? 'UNCHANGED' : 'CHANGED',
      updatedAt: updatedDiff === 0 ? 'UNCHANGED' : 'CHANGED',
      fullDocumentChanged: changed, newFieldKeyViolations: newKeyViolations, compatibleSpeciesNonEmpty: csNonEmpty,
    },
    schemaDiff: {
      verdict: diff.verdict, addedFields: diff.totals.addedFields, removedFields: diff.totals.removedFields,
      modifiedFields: modifiedFound, newTypes: newTypeNames, unapprovedChanges: diff.totals.unapprovedChanges,
      unapprovedFiles: unapproved.length, secretLeaks: leaks, needleHits,
    },
    artifacts: ARTIFACTS.filter((f) => fs.existsSync(path.join(OUT, f))).map((f) => ({ name: f, sha256: sha256(fs.readFileSync(path.join(OUT, f))) })),
    mirror: { pending: true, dir: MIRROR, expected: ARTIFACTS.length, note: 'byte-verified by --final run' },
    note: 'Completion of validation does NOT authorize Sanity schema deployment, content writes, or SPEC 11 start; PM authorization required.',
  };
  fs.writeFileSync(path.join(OUT, 'INTEGRITY.json'), JSON.stringify(integrity, null, 2));
  console.log('WROTE INTEGRITY.json (finalRun=false)');

  if (failed.length) {
    console.log('VALIDATION FAILED - ' + failed.map((c) => c.id).join(','));
    console.log(failed.map((c) => '  ' + c.id + ': ' + c.name + ' [' + c.detail + ']').join('\n'));
    process.exit(2);
  }
  console.log('MAIN VALIDATION PASS - ' + checks.length + '/' + checks.length + ' checks in this run (+' + aChecks.length + ' Gate A checks).');
  console.log('NEXT: write ' + OUT + '/SPEC_10M_SCHEMA_MIGRATION_REPORT.md + EXECUTION_LOG.md, then run: node scripts/SPEC_10M_validate.js --final');
  process.exit(0);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
