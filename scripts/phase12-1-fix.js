const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
const tokenMatch = envContent.match(/SANITY_API_TOKEN="([^"]+)"/);
const TOKEN = tokenMatch ? tokenMatch[1] : null;
const MUTATE_BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/mutate/production';
const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` };

const FIXES = [
  // Fix 1: Sinularia — rename to "Sinularia Leather" (matches search alias)
  {
    id: '1z8rQFHeojDMTUo2hXSXVJ',
    patch: { name: 'Sinularia Leather' },
    reason: 'Entity name "Sinularia" didn\'t match search alias "Sinularia Leather". Renamed to match.',
  },
  // Fix 2: Cherry Shrimp (duplicate) — add aliases pointing to canonical
  {
    id: '5oQB2MZ7gmZXjdwFqSs4kl',
    patch: { aliases: ['Neocaridina', 'RCS'] },
    reason: 'Cherry Shrimp is a duplicate of Red Cherry Shrimp. Added aliases for search discoverability.',
  },
  // Fix 3: Marble Angelfish — keep as is but note it shares species with Angelfish
  // Marble Angelfish is a legitimate color morph, not a full duplicate
];

// Fix 4: Angelfish (species-pterophyllum-scalare) — add alias "Marble Angelfish" for search
const ANGELFISH_FIX = {
  id: 'species-pterophyllum-scalare',
  patch: { aliases: ['Pterophyllum', 'Marble Angelfish'] },
  reason: 'Angelfish is the canonical Pterophyllum scalare. Added Marble Angelfish as alias since it\'s the same species.',
};

async function patchDoc(id, patch, name) {
  const body = { mutations: [{ patch: { id, set: patch } }] };
  const res = await fetch(MUTATE_BASE, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (data.error) { console.error(`  ERROR ${name}: ${data.error.message}`); return false; }
  console.log(`  OK: ${name}`);
  return true;
}

async function main() {
  console.log('=== SPEC-04: DATA FIXES ===\n');
  let ok = 0;

  for (const f of FIXES) {
    console.log(`\n--- ${f.id} ---`);
    console.log(`  Reason: ${f.reason}`);
    if (await patchDoc(f.id, f.patch, f.id)) ok++;
  }

  console.log(`\n--- Angelfish fix ---`);
  console.log(`  Reason: ${ANGELFISH_FIX.reason}`);
  if (await patchDoc(ANGELFISH_FIX.id, ANGELFISH_FIX.patch, 'Angelfish')) ok++;

  console.log(`\nDone: ${ok} fixed`);
}

main().catch(console.error);
