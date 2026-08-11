/**
 * PHASE 1 — migration: set waterType on all species + coralType on all corals.
 *
 * Mapping was verified in PHASE 0 audit (freshwater/saltwater judged per
 * species from known habitat, coralType from coral morphology/taxonomy).
 * ScientificName is the dedupe key; migration is keyed by slug (stable URL).
 *
 * Usage:
 *   node scripts/migrate-taxonomy.mjs           # DRY-RUN: print planned patches, write nothing
 *   node scripts/migrate-taxonomy.mjs --apply   # actually patch Sanity
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')

const getEnv = (key) => {
  const line = env.split('\n').map((x) => x.trim()).find((x) => x.startsWith(key + '='))
  if (!line) return ''
  return line.split('=').slice(1).join('=').replace(/^"|"$/g, '')
}

const token = getEnv('SANITY_API_TOKEN')
const projectId = getEnv('NEXT_PUBLIC_SANITY_PROJECT_ID')
const dataset = getEnv('NEXT_PUBLIC_SANITY_DATASET')

if (!token || !projectId || !dataset) {
  console.error('Missing env vars in .env.local')
  process.exit(1)
}

const APPLY = process.argv.includes('--apply')
const API = `https://${projectId}.api.sanity.io/v2021-06-07/data/`
const QUERY_API = API + `query/${dataset}?query=`
const MUTATE_API = API + `mutate/${dataset}`

// ---- Verified mapping (PHASE 0) ----
// saltwater species: Banggai Cardinalfish, Flame Angelfish, Green Chromis,
// Lyretail Anthias, Ocellaris Clownfish, Percula Clownfish, Yellow Tang.
// Guppy = freshwater (brackish-tolerant), rest = freshwater. No brackish.
const SPECIES_WATER_TYPE = {
  'pterapogon-kauderni': 'saltwater',
  'centropyge-loricula': 'saltwater',
  'chromis-viridis': 'saltwater',
  'pseudanthias-squamipinnis': 'saltwater',
  'amphiprion-ocellaris': 'saltwater',
  'amphiprion-percula': 'saltwater',
  'zebrasoma-flavescens': 'saltwater',
}

// soft: 3 (Ricordea, Toadstool, Zoanthids) · lps: 10 · sps: 4 · nps: 0
const CORAL_TYPE = {
  'ricordea-mushroom': 'soft',
  'toadstool-leather': 'soft',
  'zoanthids': 'soft',
  'acan-lords': 'lps',
  'blastomussa': 'lps',
  'candy-cane-coral': 'lps',
  'duncan-coral': 'lps',
  'elegance-coral': 'lps',
  'galaxea': 'lps',
  'goniopora': 'lps',
  'hammer-coral': 'lps',
  'honeycomb-brain-coral': 'lps',
  'open-brain-coral': 'lps',
  'bird-s-nest-coral': 'sps',
  'cauliflower-coral': 'sps',
  'montipora-capricornis': 'sps',
  'staghorn-acropora': 'sps',
}

async function fetchDocs(_type) {
  const q = encodeURIComponent(`*[_type == "${_type}"] { _id, name, slug }`)
  const res = await fetch(QUERY_API + q, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`query ${_type}: ${res.status} ${await res.text()}`)
  return (await res.json()).result
}

async function run() {
  const [species, corals] = await Promise.all([fetchDocs('species'), fetchDocs('coral')])

  const planned = []
  const noMapping = []

  for (const doc of species) {
    const slug = doc.slug?.current
    if (!slug) continue
    const value = SPECIES_WATER_TYPE[slug] || 'freshwater'
    if (doc.waterType) continue // already migrated
    planned.push({ _type: 'species', name: doc.name, slug, set: { waterType: value }, _id: doc._id })
  }
  for (const doc of corals) {
    const slug = doc.slug?.current
    if (!slug) continue
    const value = CORAL_TYPE[slug]
    if (!value) {
      noMapping.push({ name: doc.name, slug })
      continue
    }
    if (doc.coralType) continue
    planned.push({ _type: 'coral', name: doc.name, slug, set: { coralType: value }, _id: doc._id })
  }

  console.log(`DRY RUN ${APPLY ? '(APPLY MODE)' : ''}`)
  console.log(`Planned patches: ${planned.length}`)
  for (const p of planned) console.log(`  [${p._type}] ${p.name} (${p.slug}) -> ${JSON.stringify(p.set)}`)
  if (noMapping.length) {
    console.log(`Corals without mapping (SKIPPED): ${noMapping.length}`)
    for (const n of noMapping) console.log(`  ${n.name} (${n.slug})`)
  }

  if (!APPLY) {
    console.log('\nNo changes written. Run with --apply to apply.')
    return
  }

  // Batches of 30
  for (let i = 0; i < planned.length; i += 30) {
    const batch = planned.slice(i, i + 30)
    const mutations = batch.map((p) => ({ patch: { id: p._id, set: p.set } }))
    const res = await fetch(MUTATE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mutations }),
    })
    if (!res.ok) throw new Error(`mutate batch ${i}: ${res.status} ${await res.text()}`)
    const body = await res.json()
    console.log(`Applied batch ${i / 30 + 1} (${batch.length} patches), transaction: ${body.transactionId}`)
  }
  console.log('Migration complete.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})