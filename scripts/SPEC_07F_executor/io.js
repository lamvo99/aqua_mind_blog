'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const L = require('../SPEC_07_lib.js');

const sha256Text = (s) => crypto.createHash('sha256').update(s).digest('hex');
const shaFile = (p) => sha256Text(fs.readFileSync(p));

const fileExists = (p) => {
  try { fs.accessSync(p); return true; } catch (e) { return false; }
};

const readText = (p) => fs.readFileSync(p, 'utf8');
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const readCsv = (p) => L.parseCsv(fs.readFileSync(p, 'utf8'));
const toCsv = (cols, rows) => L.toCsv(cols, rows);
const csvCell = (v) => L.csvCell(v);

const writeText = (p, text) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text, 'utf8');
};

const writeJson = (p, obj) => writeText(p, JSON.stringify(obj, null, 2) + '\n');

const nowIso = () => new Date().toISOString();

const fingerprintOf = (file) => {
  if (!fileExists(file)) return { file: file, exists: false, bytes: 0, sha256: null };
  const buf = fs.readFileSync(file);
  return { file: file, exists: true, bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') };
};

const normalizePath = (p) => String(p).replace(/\\/g, '/');

module.exports = {
  sha256Text, shaFile, fileExists, readText, readJson, readCsv, toCsv, csvCell,
  writeText, writeJson, nowIso, fingerprintOf, normalizePath, L,
};
