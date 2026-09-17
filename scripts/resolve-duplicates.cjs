const { createClient } = require('@sanity/client')
const fs = require('fs')

const env = fs.readFileSync('.env.local', 'utf8')
const projectId = env.match(/NEXT_PUBLIC_SANITY_PROJECT_ID="([^"]+)"/)?.[1]
const dataset = env.match(/NEXT_PUBLIC_SANITY_DATASET="([^"]+)"/)?.[1] || 'production'
const token = env.match(/SANITY_API_TOKEN="([^"]+)"/)?.[1]

const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token })

const DUPLICATES = [
  { name: 'Banggai Cardinalfish', type: 'species', mergeReefCompat: true },
  { name: 'Convict Cichlid', type: 'species', mergeReefCompat: false },
  { name: 'Flame Angelfish', type: 'species', mergeReefCompat: true },
  { name: 'Foxface Rabbitfish', type: 'species', mergeReefCompat: true },
  { name: 'Frontosa Cichlid', type: 'species', mergeReefCompat: false },
  { name: 'Green Chromis', type: 'species', mergeReefCompat: true },
  { name: 'Jack Dempsey', type: 'species', mergeReefCompat: false },
  { name: 'Mandarin Fish', type: 'species', mergeReefCompat: true },
  { name: 'Royal Gramma', type: 'species', mergeReefCompat: true },
  { name: 'Frogspawn Coral', type: 'coral', mergeReefCompat: false },
]

async function main() {
  let merged = 0
  let deleted = 0
  let errors = 0

  for (const dup of DUPLICATES) {
    console.log(`\nProcessing: ${dup.name}`)

    // Find all records with this name
    const records = await client.fetch(
      `*[_type == "${dup.type}" && name == "${dup.name}"] | order(_id asc) {_id, name, slug, reefCompatibility, scientificName}`
    )

    if (records.length < 2) {
      console.log(`  Found ${records.length} records — skipping (not a duplicate)`)
      continue
    }

    // Sort: prefer record with scientific slug (contains hyphenated genus-species pattern)
    const sorted = records.sort((a, b) => {
      const aSci = a.scientificName ? 1 : 0
      const bSci = b.scientificName ? 1 : 0
      if (bSci !== aSci) return bSci - aSci
      // Prefer record with richer slug (longer = more specific)
      return (b.slug?.current?.length || 0) - (a.slug?.current?.length || 0)
    })

    const keep = sorted[0]
    const remove = sorted[1]

    console.log(`  KEEP: ${keep._id} (slug: ${keep.slug?.current})`)
    console.log(`  REMOVE: ${remove._id} (slug: ${remove.slug?.current})`)

    // Merge reefCompatibility if needed
    if (dup.mergeReefCompat && keep.reefCompatibility === undefined && remove.reefCompatibility !== undefined) {
      console.log(`  Merging reefCompatibility=${remove.reefCompatibility} from ${remove._id} to ${keep._id}`)
      await client.patch(keep._id).set({ reefCompatibility: remove.reefCompatibility }).commit()
      merged++
    }

    // Delete the duplicate
    try {
      await client.delete(remove._id)
      console.log(`  Deleted ${remove._id}`)
      deleted++
    } catch (e) {
      console.log(`  ERROR deleting ${remove._id}: ${e.message}`)
      errors++
    }
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`Merged: ${merged}`)
  console.log(`Deleted: ${deleted}`)
  console.log(`Errors: ${errors}`)
}

main().catch(e => { console.error(e); process.exit(1) })
