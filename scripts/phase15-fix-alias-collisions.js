const { createClient } = require('@sanity/client');
const fs = require('fs');

// ─── Config ───────────────────────────────────────────────────────────────────
const env = fs.readFileSync('.env.local', 'utf8');
const TOKEN = env.match(/SANITY_API_TOKEN="([^"]+)"/)?.[1];
if (!TOKEN) { console.error('ERROR: SANITY_API_TOKEN not found in .env.local'); process.exit(1); }

const client = createClient({
  projectId: 'zeohjejw',
  dataset: 'production',
  apiVersion: '2026-05-25',
  useCdn: false,
  token: TOKEN,
});

const changes = [];

// ─── Fix 1: Remove "Pterophyllum" from Marble Angelfish aliases ──────────────
async function fix1() {
  console.log('\n═══ Fix 1: Pterophyllum alias collision ═══');
  console.log('"Pterophyllum" is the scientific genus for Angelfish — belongs on Angelfish only\n');

  const docs = await client.fetch(
    `*[_type in ["species","invertebrate"] && "Pterophyllum" in (aliases[])]{_id, _type, name, aliases}`
  );

  for (const doc of docs) {
    console.log(`  Found "${doc.name}" (_id: ${doc._id}, _type: ${doc._type})`);
    console.log(`    Current aliases: ${JSON.stringify(doc.aliases)}`);

    if (doc.name === 'Marble Angelfish') {
      const filtered = (doc.aliases || []).filter(a => a !== 'Pterophyllum');
      console.log(`    → Removing "Pterophyllum". New aliases: ${JSON.stringify(filtered)}`);
      await client.patch(doc._id).set({ aliases: filtered }).commit();
      changes.push(`Fix 1: Removed "Pterophyllum" from Marble Angelfish aliases (${doc._id})`);
      console.log(`    ✓ Patched successfully\n`);
    } else if (doc.name === 'Angelfish') {
      console.log(`    → Keeping "Pterophyllum" on Angelfish (correct owner)\n`);
    }
  }
}

// ─── Fix 2: "Sulawesi Cardinal Shrimp" name collision ────────────────────────
async function fix2() {
  console.log('═══ Fix 2: Sulawesi Cardinal Shrimp name collision ═══');
  console.log('Two invertebrate documents share the name "Sulawesi Cardinal Shrimp"\n');

  const docs = await client.fetch(
    `*[_type == "invertebrate" && name == "Sulawesi Cardinal Shrimp"]{_id, name, scientificName, slug, aliases, excerpt}`
  );

  console.log(`  Found ${docs.length} documents with this name:\n`);
  for (const d of docs) {
    console.log(`    _id: ${d._id}`);
    console.log(`    name: ${d.name}`);
    console.log(`    scientificName: ${d.scientificName || '(none)'}`);
    console.log(`    slug: ${d.slug?.current || '(none)'}`);
    console.log(`    aliases: ${JSON.stringify(d.aliases || [])}`);
    console.log(`    excerpt length: ${(d.excerpt || '').length}`);
    console.log('');
  }

  if (docs.length < 2) {
    console.log('  No duplicate found — skipping.\n');
    return;
  }

  // Both should be Caridina dennerli — check
  const sciNames = docs.map(d => d.scientificName).filter(Boolean);
  const allSameSpecies = sciNames.length === docs.length && new Set(sciNames).size === 1;

  // Prefer: keep the one with more data (longer excerpt, or slug containing scientific name)
  const scored = docs.map(d => ({
    ...d,
    score: (d.excerpt || '').length + (d.aliases || []).length * 10 + (d.scientificName ? 50 : 0),
  }));
  scored.sort((a, b) => b.score - a.score);
  const keep = scored[0];
  const remove = scored[1];

  console.log(`  Scientific names: ${JSON.stringify(sciNames)}`);

  // Check if names are actually different species
  if (sciNames.length > 0 && new Set(sciNames).size > 1) {
    // Different species — rename the less complete one
    console.log(`  → Different scientific names detected — renaming the non-canonical one`);
    const renameTarget = remove;
    const newName = renameTarget.scientificName
      ? `${renameTarget.scientificName} (${renameTarget.name})`
      : `${renameTarget.name} (Variant)`;
    console.log(`    Renaming "${renameTarget.name}" → "${newName}" (${renameTarget._id})`);
    await client.patch(renameTarget._id).set({ name: newName }).commit();
    changes.push(`Fix 2: Renamed "${renameTarget.name}" → "${newName}" (${renameTarget._id})`);
    console.log(`    ✓ Patched successfully\n`);
  } else {
    // Same species — delete the less complete one
    console.log(`  → Same species — removing the less complete duplicate`);
    console.log(`    KEEP: ${keep._id} (score: ${keep.score})`);
    console.log(`    REMOVE: ${remove._id} (score: ${remove.score})`);

    // Merge aliases if the one being removed has extra aliases
    const keepAliases = new Set(keep.aliases || []);
    const extraAliases = (remove.aliases || []).filter(a => !keepAliases.has(a));
    if (extraAliases.length > 0) {
      const merged = [...(keep.aliases || []), ...extraAliases];
      console.log(`    Merging extra aliases: ${JSON.stringify(extraAliases)}`);
      await client.patch(keep._id).set({ aliases: merged }).commit();
      changes.push(`Fix 2: Merged aliases ${JSON.stringify(extraAliases)} into ${keep.name} (${keep._id})`);
    }

    // Delete the duplicate
    try {
      await client.delete(remove._id);
      console.log(`    Deleted duplicate: ${remove._id}`);
      changes.push(`Fix 2: Deleted duplicate "Sulawesi Cardinal Shrimp" (${remove._id})`);
      console.log(`    ✓ Deleted successfully\n`);
    } catch (e) {
      console.error(`    ✗ Error deleting ${remove._id}: ${e.message}\n`);
    }
  }
}

// ─── Fix 3: Remove "RCS" from Cherry Shrimp aliases ─────────────────────────
async function fix3() {
  console.log('═══ Fix 3: RCS alias collision ═══');
  console.log('"RCS" = Red Cherry Shrimp — belongs on Red Cherry Shrimp only\n');

  const docs = await client.fetch(
    `*[_type in ["species","invertebrate"] && "RCS" in (aliases[])]{_id, _type, name, aliases}`
  );

  for (const doc of docs) {
    console.log(`  Found "${doc.name}" (_id: ${doc._id}, _type: ${doc._type})`);
    console.log(`    Current aliases: ${JSON.stringify(doc.aliases)}`);

    if (doc.name === 'Cherry Shrimp') {
      const filtered = (doc.aliases || []).filter(a => a !== 'RCS');
      console.log(`    → Removing "RCS". New aliases: ${JSON.stringify(filtered)}`);
      await client.patch(doc._id).set({ aliases: filtered }).commit();
      changes.push(`Fix 3: Removed "RCS" from Cherry Shrimp aliases (${doc._id})`);
      console.log(`    ✓ Patched successfully\n`);
    } else if (doc.name === 'Red Cherry Shrimp') {
      console.log(`    → Keeping "RCS" on Red Cherry Shrimp (correct owner)\n`);
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   Phase 15 — Fix Alias & Name Collisions (SPEC-05 fixes)  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  await fix1();
  await fix2();
  await fix3();

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   SUMMARY                                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  if (changes.length === 0) {
    console.log('  No changes needed.');
  } else {
    for (const c of changes) {
      console.log(`  ✓ ${c}`);
    }
  }
  console.log(`\nTotal changes: ${changes.length}`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
