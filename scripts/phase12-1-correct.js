const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
const tokenMatch = envContent.match(/SANITY_API_TOKEN="([^"]+)"/);
const TOKEN = tokenMatch ? tokenMatch[1] : null;
const MUTATE_BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/mutate/production';
const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` };

const CORRECTIONS = [
  // SPEC-04: Correct Asian Arowana — add Kim Long (was incorrectly on Jardini)
  {
    id: 'species-scleropages-formosus',
    name: 'Asian Arowana',
    patch: {
      localNames: ['Huyết Long', 'Thanh Long', 'Kim Long'],
      aliases: ['Dragon Fish', 'Asian Dragon Fish', 'Golden Dragon Fish', 'Cá Kim Long', 'Cá Rồng'],
    },
    reason: 'FishBase confirms "Cá Kim Long" is Vietnamese for Scleropages formosus. Kim Long refers to the golden variety (Kim Long Quá Bối, Kim Long Hồng Vĩ) of Asian Arowana.',
  },
  // SPEC-04: Correct Jardini Arowana — remove Kim Long, add correct Vietnamese name
  {
    id: 'species-scleropages-jardinii',
    name: 'Jardini Arowana',
    patch: {
      localNames: ['Cá rồng trân châu', 'Kim Long Úc'],
      aliases: ['Jardinii', 'Australian Arowana', 'Northern Spearfish', 'Gulf Saratoga', 'Pearl Arowana', 'Cá trân châu long'],
    },
    reason: 'Vietnamese Wikipedia + Wikispecies confirm Scleropages jardinii = "Cá rồng trân châu". "Kim Long Úc" (Australian Kim Long) is used in some Vietnamese sources but must include "Úc" to distinguish from Asian Kim Long.',
  },
  // SPEC-04: Silver Arowana — verify Ngân Long (correct, no change needed)
  // {
  //   id: 'species-osteoglossum-bicirrhosum',
  //   name: 'Silver Arowana',
  //   patch: {}, // no change needed
  //   reason: 'Ngân Long correctly maps to Osteoglossum bicirrhosum. Verified.',
  // },
  // SPEC-04: Arapaima — verify Hải Tượng Long (correct, no change needed)
  // {
  //   id: 'species-arapaima-gigas',
  //   name: 'Arapaima',
  //   patch: {}, // no change needed
  //   reason: 'Hải Tượng Long correctly maps to Arapaima gigas. Verified.',
  // },
];

async function patchDoc(id, patch, name) {
  const body = { mutations: [{ patch: { id, set: patch } }] };
  const res = await fetch(MUTATE_BASE, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (data.error) {
    console.error(`  ERROR ${name} (${id}): ${data.error.message}`);
    return false;
  }
  console.log(`  OK: ${name} (${id})`);
  return true;
}

async function main() {
  console.log('=== SPEC-04: CORRECT AROWANA DATA ===\n');
  let ok = 0, err = 0;

  for (const c of CORRECTIONS) {
    console.log(`\n--- ${c.name} ---`);
    console.log(`  Reason: ${c.reason}`);
    if (Object.keys(c.patch).length === 0) {
      console.log('  No changes needed.');
      continue;
    }
    console.log(`  Patch: ${JSON.stringify(c.patch)}`);
    if (await patchDoc(c.id, c.patch, c.name)) ok++; else err++;
  }

  console.log(`\nDone: ${ok} corrected, ${err} errors, ${CORRECTIONS.length - ok - err} unchanged`);
}

main().catch(console.error);
