const fs = require('fs');
const d = JSON.parse(fs.readFileSync('report/SPEC_01/raw/SPEC_01_RAW_DUMP.json', 'utf8')).records;
const LABEL = { species: 'Fish / Species', plant: 'Plants', invertebrate: 'Invertebrates', coral: 'Corals', equipment: 'Equipment', problem: 'Problems' };
// 1) problem category distribution
const pc = {};
const problemList = [];
for (const p of d.problem) {
  if (p._id.startsWith('drafts.')) continue;
  const cat = p.category ?? '(MISSING)';
  pc[cat] = (pc[cat] || 0) + 1;
  problemList.push({ id: p._id, title: p.title, cat, wtype: p.waterType ?? '', ex: (p.excerpt || '').slice(0, 90) });
}
console.log('problem category distribution:', JSON.stringify(pc, null, 1));
console.log('\nALL PROBLEMS (category | waterType | title | excerpt):');
for (const p of problemList.sort((a, b) => (a.cat + a.title).localeCompare(b.cat + b.title))) {
  console.log(`  [${p.cat.padEnd(9)}] w=${String(p.wtype).padEnd(10)} ${p.title} — ${p.ex}`);
}
// 2) equipment category distribution + members
const ec = {};
for (const e of d.equipment) {
  if (e._id.startsWith('drafts.')) continue;
  ec[e.category] = (ec[e.category] || 0) + 1;
}
console.log('\nequipment category distribution:', JSON.stringify(ec, null, 1));
console.log('\nEQUIPMENT by category:');
for (const e of d.equipment.sort((a, b) => String(a.category).localeCompare(String(b.category)))) {
  if (e._id.startsWith('drafts.')) continue;
  console.log(`  [${String(e.category).padEnd(12)}] ${e.name} (${e._id})`);
}