const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
const tokenMatch = envContent.match(/SANITY_API_TOKEN="([^"]+)"/);
const TOKEN = tokenMatch ? tokenMatch[1] : null;
const API_BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';

async function fetchQ(query) {
  const q = encodeURIComponent(query);
  const res = await fetch(`${API_BASE}?query=${q}`);
  return (await res.json()).result || [];
}

async function main() {
  // SPEC-05: Audit all Vietnamese terms
  console.log('=== SPEC-05: VIETNAMESE TERMS AUDIT ===\n');
  const vnTerms = [
    'Huyết Long', 'Kim Long', 'Ngân Long', 'Thanh Long', 'Hải Tượng Long',
    'Nẻ Nhật', 'Nẻ Điện', 'Nẻ Bút', 'Nẻ Sọc', 'Tôm Cherry',
    'Cá rồng trân châu', 'Kim Long Úc',
  ];

  for (const term of vnTerms) {
    const inLocal = await fetchQ(`*[_type in ["species","plant","coral","invertebrate"] && "${term}" in localNames] {
      _type, name, scientificName, localNames
    }`);
    const inAliases = await fetchQ(`*[_type in ["species","plant","coral","invertebrate"] && "${term}" in aliases] {
      _type, name, scientificName, aliases
    }`);
    console.log(`"${term}":`);
    if (inLocal.length) {
      for (const r of inLocal) console.log(`  localNames: ${r._type}/${r.name} (${r.scientificName})`);
    }
    if (inAliases.length) {
      for (const r of inAliases) console.log(`  aliases: ${r._type}/${r.name} (${r.scientificName})`);
    }
    if (!inLocal.length && !inAliases.length) console.log('  NOT FOUND');
  }

  // SPEC-06: Group field integrity
  console.log('\n=== SPEC-06: GROUP FIELD AUDIT ===\n');
  const species = await fetchQ(`*[_type == "species" && defined(group)] {_id, name, group}`);
  const groups = {};
  for (const s of species) {
    if (!groups[s.group]) groups[s.group] = [];
    groups[s.group].push(s.name);
  }
  for (const [g, names] of Object.entries(groups)) {
    console.log(`${g} (${names.length}): ${names.join(', ')}`);
  }

  // SPEC-07: Alias collisions
  console.log('\n=== SPEC-07: ALIAS COLLISIONS ===\n');
  const allSpecies = await fetchQ(`*[_type == "species"] {_id, name, aliases, localNames}`);
  const aliasMap = {};
  for (const s of allSpecies) {
    for (const a of (s.aliases || [])) {
      if (!aliasMap[a]) aliasMap[a] = [];
      aliasMap[a].push(`${s.name} (${s._id})`);
    }
    for (const ln of (s.localNames || [])) {
      const key = `local:${ln}`;
      if (!aliasMap[key]) aliasMap[key] = [];
      aliasMap[key].push(`${s.name} (${s._id})`);
    }
  }
  let collisionCount = 0;
  for (const [term, entities] of Object.entries(aliasMap)) {
    if (entities.length > 1) {
      console.log(`COLLISION: "${term}" → ${entities.join(' | ')}`);
      collisionCount++;
    }
  }
  if (collisionCount === 0) console.log('No alias/localName collisions found.');

  // SPEC-08: parentSpecies integrity
  console.log('\n=== SPEC-08: PARENT SPECIES INTEGRITY ===\n');
  const withParent = await fetchQ(`*[_type in ["species","invertebrate"] && defined(parentSpecies)] {
    _type, name, parentSpecies
  }`);
  if (withParent.length === 0) {
    console.log('No parentSpecies references set. (Expected — none were created in Phase 12)');
  } else {
    for (const r of withParent) {
      console.log(`${r._type}/${r.name} → parent: ${JSON.stringify(r.parentSpecies)}`);
    }
  }
}

main().catch(console.error);
