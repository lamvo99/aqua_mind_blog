const projectId = 'zeohjejw';
const dataset = 'production';
const apiVersion = '2026-05-25';
const types = ['species','plant','coral','invertebrate','equipment','problem','inspiration'];

async function fetchAll(type) {
  const q = encodeURIComponent('*[_type == "' + type + '"]{_id,_type,name,scientificName,slug,waterType,family,region,aquariumStyle,group,category,difficulty}');
  const url = 'https://' + projectId + '.api.sanity.io/v' + apiVersion + '/data/query/' + dataset + '?query=' + q;
  const res = await fetch(url);
  const data = await res.json();
  return data.result || [];
}

async function main() {
  const all = {};
  for (const t of types) {
    const items = await fetchAll(t);
    all[t] = items;
    console.log(t + ': ' + items.length + ' total');
  }
  for (const [t, items] of Object.entries(all)) {
    const published = items.filter(i => !i._id.startsWith('drafts.'));
    const drafts = items.filter(i => i._id.startsWith('drafts.'));
    console.log('  ' + t + ': ' + published.length + ' published, ' + drafts.length + ' drafts');
  }
  for (const [t, items] of Object.entries(all)) {
    const slugs = items.map(i => i.slug?.current).filter(Boolean);
    const dupes = slugs.filter((s,i) => slugs.indexOf(s) !== i);
    if (dupes.length) console.log('  DUPE SLUGS in ' + t + ': ' + [...new Set(dupes)].join(', '));
  }
  for (const [t, items] of Object.entries(all)) {
    const sci = items.map(i => i.scientificName).filter(Boolean);
    const dupes = sci.filter((s,i) => sci.indexOf(s) !== i);
    if (dupes.length) console.log('  DUPE SCI in ' + t + ': ' + [...new Set(dupes)].join(', '));
  }
  const fs = require('fs');
  fs.writeFileSync('report/phase12-canonical-inventory.json', JSON.stringify(all, null, 2));
  console.log('Wrote report/phase12-canonical-inventory.json');
}
main().catch(console.error);
