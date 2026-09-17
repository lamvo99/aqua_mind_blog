const { createClient } = require('@sanity/client')
const fs = require('fs')
const env = fs.readFileSync('.env.local', 'utf8')
const projectId = env.match(/NEXT_PUBLIC_SANITY_PROJECT_ID="([^"]+)"/)?.[1]
const dataset = env.match(/NEXT_PUBLIC_SANITY_DATASET="([^"]+)"/)?.[1] || 'production'
const token = env.match(/SANITY_API_TOKEN="([^"]+)"/)?.[1]
const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token })

async function main() {
  // Investigate the Copperband Butterflyfish draft
  const cbDraft = await client.getDocument('drafts.1z8rQFHeojDMTUo2hXSVV6')
  console.log('=== Copperband Butterflyfish DRAFT ===')
  console.log('  Name:', cbDraft?.name)
  console.log('  Slug:', cbDraft?.slug?.current)
  console.log('  WaterType:', cbDraft?.waterType)
  console.log('  Created:', cbDraft?._createdAt)
  console.log('  Updated:', cbDraft?._updatedAt)

  // Check if there's a published version
  const cbPublished = await client.fetch('*[_type == "species" && slug.current == "copperband-butterflyfish"]{_id, name}')
  console.log('  Published versions:', cbPublished.length)
  for (const p of cbPublished) {
    console.log('    -', p._id, p.name)
  }

  // Investigate the Bird's Nest Coral draft
  const bnDraft = await client.getDocument('drafts.BruaGKYCGDRQjkiQDnlmoW')
  console.log('\n=== Bird\'s Nest Coral DRAFT ===')
  console.log('  Name:', bnDraft?.name)
  console.log('  Slug:', bnDraft?.slug?.current)
  console.log('  CoralType:', bnDraft?.coralType)
  console.log('  Created:', bnDraft?._createdAt)
  console.log('  Updated:', bnDraft?._updatedAt)

  // Check if there's a published version
  const bnPublished = await client.fetch('*[_type == "coral" && slug.current == "bird-s-nest-coral"]{_id, name}')
  console.log('  Published versions:', bnPublished.length)
  for (const p of bnPublished) {
    console.log('    -', p._id, p.name)
  }

  // Also check: any other drafts across all types?
  console.log('\n=== ALL DRAFTS ===')
  const allDrafts = await client.fetch('*[_id in path("drafts.**")]{_id, _type, name}')
  console.log('Total drafts:', allDrafts.length)
  for (const d of allDrafts) {
    console.log(`  ${d._type}: ${d._id} — ${d.name}`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
