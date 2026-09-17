const { createClient } = require('@sanity/client')
const fs = require('fs')
const env = fs.readFileSync('.env.local', 'utf8')
const projectId = env.match(/NEXT_PUBLIC_SANITY_PROJECT_ID="([^"]+)"/)?.[1]
const dataset = env.match(/NEXT_PUBLIC_SANITY_DATASET="([^"]+)"/)?.[1] || 'production'
const token = env.match(/SANITY_API_TOKEN="([^"]+)"/)?.[1]
const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token })

const SPECIES_FIELDS = `{
  _id, _rev, name, scientificName, slug, family, origin, excerpt, publishedAt,
  sizeCm, tankSizeMinL, tempMinC, tempMaxC, phMin, phMax, ghMin, ghMax,
  diet, temperament, waterZone, schooling, difficulty, waterType,
  aquariumStyle, region, isPredator, reefCompatibility,
  compatibleSpecies[]->{_id, name},
  compatiblePlants[]->{_id, name},
  compatibleInvertebrates[]->{_id, name},
  suitableEquipment[]->{_id, name},
  relatedProblems[]->{_id, name},
  mainImage, seo, relatedPosts[]->{_id, name}
}`

const CORAL_FIELDS = `{
  _id, _rev, name, scientificName, slug, excerpt, publishedAt,
  light, flow, difficulty, coralType, placement, aggression,
  reefCompatibility, photosynthetic,
  suitableEquipment[]->{_id, name},
  relatedProblems[]->{_id, name},
  aquariumStyle, tempMinC, tempMaxC,
  mainImage, relatedPosts[]->{_id, name}
}`

const speciesNames = [
  'Banggai Cardinalfish', 'Convict Cichlid', 'Flame Angelfish',
  'Foxface Rabbitfish', 'Frontosa Cichlid', 'Green Chromis',
  'Jack Dempsey', 'Mandarin Fish', 'Royal Gramma'
]

const coralNames = ['Bird\'s Nest Coral', 'Frogspawn Coral']

async function fetchDuplicates(type, fields, names) {
  const results = {}
  for (const name of names) {
    const query = `*[_type == $type && name == $name] ${fields}`
    const docs = await client.fetch(query, { type, name })
    if (docs.length > 1) {
      results[name] = docs
      console.log(`  ⚠ DUPLICATE: "${name}" has ${docs.length} records`)
    } else {
      console.log(`  ✓ UNIQUE: "${name}" has ${docs.length} record`)
      results[name] = docs
    }
  }
  return results
}

function serialize(doc) {
  const seen = new WeakSet()
  return JSON.parse(JSON.stringify(doc, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]'
      seen.add(value)
    }
    if (value === undefined) return null
    return value
  }))
}

async function main() {
  console.log('Connecting to Sanity...')
  console.log(`Project: ${projectId}, Dataset: ${dataset}\n`)

  console.log('=== SPECIES DUPLICATES ===')
  const speciesData = await fetchDuplicates('species', SPECIES_FIELDS, speciesNames)

  console.log('\n=== CORAL DUPLICATES ===')
  const coralData = await fetchDuplicates('coral', CORAL_FIELDS, coralNames)

  const comparison = { species: {}, coral: {} }

  console.log('\n=== SIDE-BY-SIDE COMPARISONS ===\n')

  for (const [name, docs] of Object.entries(speciesData)) {
    const docA = serialize(docs[0])
    const docB = serialize(docs[1])
    const diff = {}
    const allKeys = new Set([...Object.keys(docA), ...Object.keys(docB)])
    for (const key of allKeys) {
      if (key.startsWith('_')) continue
      const valA = JSON.stringify(docA[key])
      const valB = JSON.stringify(docB[key])
      if (valA !== valB) {
        diff[key] = { record_A: docA[key] ?? null, record_B: docB[key] ?? null }
      }
    }
    comparison.species[name] = { count: docs.length, documents: docs.map(d => serialize(d)), differences: diff }

    console.log(`--- ${name} (${docs.length} records) ---`)
    console.log(`  ID A: ${docs[0]._id}  |  ID B: ${docs[1]._id}`)
    console.log(`  Rev A: ${docs[0]._rev}  |  Rev B: ${docs[1]._rev}`)
    if (Object.keys(diff).length === 0) {
      console.log('  ✅ Records are IDENTICAL')
    } else {
      console.log(`  ❌ ${Object.keys(diff).length} field(s) differ:`)
      for (const [field, vals] of Object.entries(diff)) {
        console.log(`    - ${field}:`)
        console.log(`        A: ${JSON.stringify(vals.record_A)}`)
        console.log(`        B: ${JSON.stringify(vals.record_B)}`)
      }
    }
    console.log()
  }

  for (const [name, docs] of Object.entries(coralData)) {
    if (docs.length < 2) {
      comparison.coral[name] = { count: docs.length, documents: docs.map(d => serialize(d)), differences: {} }
      console.log(`--- ${name} (${docs.length} records) ---`)
      console.log(`  ✅ No duplicate (less than 2 records)\n`)
      continue
    }
    const docA = serialize(docs[0])
    const docB = serialize(docs[1])
    const diff = {}
    const allKeys = new Set([...Object.keys(docA), ...Object.keys(docB)])
    for (const key of allKeys) {
      if (key.startsWith('_')) continue
      const valA = JSON.stringify(docA[key])
      const valB = JSON.stringify(docB[key])
      if (valA !== valB) {
        diff[key] = { record_A: docA[key] ?? null, record_B: docB[key] ?? null }
      }
    }
    comparison.coral[name] = { count: docs.length, documents: docs.map(d => serialize(d)), differences: diff }

    console.log(`--- ${name} (${docs.length} records) ---`)
    console.log(`  ID A: ${docs[0]._id}  |  ID B: ${docs[1]._id}`)
    console.log(`  Rev A: ${docs[0]._rev}  |  Rev B: ${docs[1]._rev}`)
    if (Object.keys(diff).length === 0) {
      console.log('  ✅ Records are IDENTICAL')
    } else {
      console.log(`  ❌ ${Object.keys(diff).length} field(s) differ:`)
      for (const [field, vals] of Object.entries(diff)) {
        console.log(`    - ${field}:`)
        console.log(`        A: ${JSON.stringify(vals.record_A)}`)
        console.log(`        B: ${JSON.stringify(vals.record_B)}`)
      }
    }
    console.log()
  }

  fs.writeFileSync('scripts/duplicate-comparison.json', JSON.stringify(comparison, null, 2))
  console.log('Comparison saved to scripts/duplicate-comparison.json')
}

main().catch(err => { console.error('ERROR:', err); process.exit(1) })
