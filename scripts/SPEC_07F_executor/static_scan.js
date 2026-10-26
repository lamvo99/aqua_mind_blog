'use strict';

const fs = require('fs');
const path = require('path');
const cfg = require('./config');
const C = require('../SPEC_07C_lib.js');

const LEGACY_WRITER = /^(SPEC_00_2_apply_repair|SPEC_0[235]_repair|SPEC_06C_execute|phase12-1-correct|phase12-1-fix|phase12-migrate|phase14-batch|seed-database)/;

function resolveLocal(fromFile, spec) {
  let resolved = path.resolve(path.dirname(fromFile), spec);
  if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) resolved = path.join(resolved, 'index.js');
  if (!fs.existsSync(resolved)) {
    for (const ext of ['.js', '.json', '.mjs']) {
      if (fs.existsSync(resolved + ext)) return resolved + ext;
    }
    return null;
  }
  return resolved;
}

function collectReachable(entryFile) {
  const seen = new Set();
  const queue = [path.resolve(entryFile)];
  const missing = [];
  while (queue.length) {
    const abs = queue.shift();
    if (seen.has(abs)) continue;
    if (!fs.existsSync(abs)) { missing.push(abs); continue; }
    seen.add(abs);
    const text = fs.readFileSync(abs, 'utf8');
    const re = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      const spec = m[1];
      if (spec.charAt(0) !== '.') continue;
      const resolved = resolveLocal(abs, spec);
      if (resolved) queue.push(resolved);
      else missing.push(spec + ' (from ' + path.basename(abs) + ')');
    }
  }
  return { files: Array.from(seen).sort(), missing: missing };
}

function rel(p) {
  return String(p).replace(/\\/g, '/');
}

function scanTexts(filePaths) {
  const texts = filePaths.map((f) => ({ name: rel(f), text: fs.readFileSync(f, 'utf8') }));
  return C.scanWriteCapablePaths(texts);
}

function scanApprovalText(text) {
  const hits = [];
  try { C.findApprovalTokens(JSON.parse(text), hits, 'json'); } catch (e) {}
  const rows = String(text).split('\n');
  for (let i = 0; i < rows.length; i++) {
    const v = rows[i].trim();
    if (v && C.APPROVAL_TOKENS.indexOf(v.toUpperCase()) >= 0) hits.push('line' + (i + 1) + '=' + v);
  }
  return hits;
}

function scanExecutionPath() {
  const entry = path.join(cfg.CODE_DIR, 'cli.js');
  const reachable = collectReachable(entry);
  const scan = scanTexts(reachable.files);
  const legacy = reachable.files.filter((f) => LEGACY_WRITER.test(path.basename(f)));
  const localRequires = [];
  const re = /require\(\s*['"](\.[^'"]+)['"]\s*\)/g;
  for (const f of reachable.files) {
    const text = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = re.exec(text)) !== null) localRequires.push(rel(f) + ' -> ' + m[1]);
  }
  return {
    entry: rel(entry),
    reachableFiles: reachable.files.map(rel),
    reachableCount: reachable.files.length,
    unresolvedRequires: reachable.missing,
    patternCount: scan.patternCount,
    filesScanned: scan.fileCount,
    hits: scan.hits,
    legacyWriterFiles: legacy.map(rel),
    localRequires: localRequires.sort(),
    writeCapableReachable: scan.hits.length > 0,
    legacyWriterReachable: legacy.length > 0,
  };
}

module.exports = { collectReachable, scanTexts, scanExecutionPath, scanApprovalText, LEGACY_WRITER, rel };
