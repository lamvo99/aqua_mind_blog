const API_BASE = 'https://zeohjejw.api.sanity.io/v2026-05-25/data/query/production';
const TOKEN = process.env.SANITY_API_TOKEN;

async function fetchAll(type) {
  const q = encodeURIComponent(`*[_type == "${type}"]{_id, name, scientificName, slug, localNames, aliases, group, family}`);
  const res = await fetch(`${API_BASE}?query=${q}`);
  const data = await res.json();
  return data.result || [];
}

async function main() {
  // Fetch all species to find targets
  const species = await fetchAll('species');
  
  const targets = [
    { match: 'arowana', label: 'Arowana' },
    { match: 'piranha', label: 'Piranha' },
    { match: 'arapaima', label: 'Arapaima' },
    { match: 'bichir', label: 'Bichir' },
    { match: 'snakehead', label: 'Snakehead' },
    { match: 'pleco', label: 'Pleco' },
    { match: 'corydoras', label: 'Corydoras' },
    { match: 'goby', label: 'Goby' },
    { match: 'puffer', label: 'Puffer' },
    { match: 'tang', label: 'Tang' },
    { match: 'angelfish', label: 'Angelfish' },
  ];

  for (const t of targets) {
    const matches = species.filter(i => 
      i.name.toLowerCase().includes(t.match) || 
      i.scientificName?.toLowerCase().includes(t.match)
    );
    if (matches.length) {
      console.log(`${t.label}:`);
      for (const m of matches) {
        console.log(`  ${m.name} (${m._id}) - sci: ${m.scientificName || 'none'}`);
        console.log(`    localNames: ${JSON.stringify(m.localNames || [])}`);
        console.log(`    aliases: ${JSON.stringify(m.aliases || [])}`);
      }
    }
  }
  
  // Also check invertebrates for shrimp pleco-related
  const inverts = await fetchAll('invertebrate');
  const shrimpTargets = inverts.filter(i => 
    i.name.toLowerCase().includes('cherry') || 
    i.name.toLowerCase().includes('neocaridina') ||
    i.name.toLowerCase().includes('caridina') ||
    i.name.toLowerCase().includes('sulawesi')
  );
  if (shrimpTargets.length) {
    console.log('\nShrimp targets:');
    for (const s of shrimpTargets) {
      console.log(`  ${s.name} (${s._id}) - sci: ${s.scientificName}`);
    }
  }
}

main().catch(console.error);
