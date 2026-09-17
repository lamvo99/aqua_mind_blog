const { createClient } = require('@sanity/client')
const fs = require('fs')

const env = fs.readFileSync('.env.local', 'utf8')
const projectId = env.match(/NEXT_PUBLIC_SANITY_PROJECT_ID="([^"]+)"/)?.[1]
const dataset = env.match(/NEXT_PUBLIC_SANITY_DATASET="([^"]+)"/)?.[1] || 'production'
const token = env.match(/SANITY_API_TOKEN="([^"]+)"/)?.[1]

const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token })

// These need to be recreated with scientific slugs
const FIXES = [
  {
    // Current: banggai-cardinalfish → should be pterapogon-kauderni
    currentSlug: 'banggai-cardinalfish',
    correctSlug: 'pterapogon-kauderni',
    type: 'species',
  },
  {
    // Current: foxface-rabbitfish → should be siganus-vulpinus
    currentSlug: 'foxface-rabbitfish',
    correctSlug: 'siganus-vulpinus',
    type: 'species',
  },
]

async function main() {
  for (const fix of FIXES) {
    console.log(`\nFixing: ${fix.currentSlug} → ${fix.correctSlug}`)

    // Find the record with the wrong slug
    const record = await client.fetch(
      `*[_type == "${fix.type}" && slug.current == "${fix.currentSlug}"][0] {_id, name, slug, ...}`
    )

    if (!record) {
      console.log(`  Record not found — skipping`)
      continue
    }

    console.log(`  Found: ${record._id} (${record.name})`)

    // Update slug to scientific name
    await client.patch(record._id).set({ slug: { _type: 'slug', current: fix.correctSlug } }).commit()
    console.log(`  Updated slug to ${fix.correctSlug}`)
  }

  console.log('\nDone!')
}

main().catch(e => { console.error(e); process.exit(1) })
