const fs = require('fs');
function parse(l) {
  const c = []; let b = '', q = false;
  for (let i = 0; i < l.length; i++) {
    const ch = l[i];
    if (q) { if (ch === '"') { if (l[i + 1] === '"') { b += '"'; i++; } else q = false; } else b += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { c.push(b); b = ''; } else b += ch;
  }
  c.push(b); return c;
}
const rows = fs.readFileSync('report/SPEC_01/SPEC_01_ISSUES.csv', 'utf8').trim().split('\n').slice(1).map(parse);
const crit = rows.filter((r) => r[1] === 'CRITICAL');
console.log('CRITICAL total:', crit.length);
const byId = {};
for (const r of crit) byId[r[3]] = { type: r[2], title: r[4], field: r[5], state: r[6], desc: r[10] };
for (const [id, v] of Object.entries(byId)) console.log(`  ${v.type} | ${v.title} | ${id} | ${v.field}=${v.state}`);

const dump = JSON.parse(fs.readFileSync('report/SPEC_01/raw/SPEC_01_RAW_DUMP.json', 'utf8')).records;
const WIKI = ['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem'];
console.log('\n=== FULL TARGET DETAIL ===');
const labelToType = { 'Equipment': 'equipment', 'Problems': 'problem' };
for (const id of Object.keys(byId)) {
  const v = byId[id];
  const rec = dump[labelToType[v.type] || v.type].find((r) => r._id === id);
  if (!rec) { console.log('\n!! not found', id); continue; }
  const keys = Object.keys(rec).filter((k) => !k.startsWith('_'));
  console.log(`\n--- ${v.type} :: ${id} :: ${v.title}`);
  console.log('  keys:', keys.join(', '));
  for (const k of keys) {
    let val = rec[k];
    if (k === '_updatedAt' || k === '_createdAt') continue;
    if (typeof val === 'object' && val !== null) {
      if (Array.isArray(val)) val = '[array len ' + val.length + '] ' + (val.length ? (val.slice(0, 2).map((x) => JSON.stringify(x).slice(0, 120))).join(' | ') : '');
      else if (val._type === 'slug') val = 'slug=' + (val.current || '');
      else if (val._type === 'image') val = 'image[asset=' + (val.asset?._ref || val.asset?._id || '?') + ' alt=' + (val.alt || '') + ']';
      else val = JSON.stringify(val).slice(0, 300);
    }
    if (Array.isArray(rec[k])) {
      // blocks: show text
      const blocks = rec[k].filter((x) => x && x._type === 'block');
      if (blocks.length) val = 'blocks=' + blocks.length + ' text?n/a';
      else val = val;
    }
    console.log(`    ${k}: ${String(val).slice(0, 220)}`);
  }
  // related problems target names
}