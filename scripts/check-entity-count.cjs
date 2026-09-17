const { createClient } = require('@sanity/client')
const fs = require('fs')
const env = fs.readFileSync('.env.local', 'utf8')
const projectId = env.match(/NEXT_PUBLIC_SANITY_PROJECT_ID="([^"]+)"/)?.[1]
const dataset = env.match(/NEXT_PUBLIC_SANITY_DATASET="([^"]+)"/)?.[1] || 'production'
const token = env.match(/SANITY_API_TOKEN="([^"]+)"/)?.[1]
const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token })

async function main() {
  const types = ['species', 'plant', 'coral', 'equipment', 'invertebrate', 'problem', 'inspiration']
  let totalPublished = 0
  let totalDraft = 0

  for (const type of types) {
    const all = await client.fetch(`*[_type == "${type}"]{_id, name, slug}`)
    const drafts = all.filter(s => s._id.startsWith('drafts.'))
    const published = all.filter(s => !s._id.startsWith('drafts.'))
    totalPublished += published.length
    totalDraft += drafts.length

    console.log(`${type}: ${published.length} published, ${drafts.length} draft`)

    if (drafts.length > 0) {
      for (const d of drafts) {
        console.log(`  DRAFT: ${d._id} — ${d.name} (${d.slug?.current})`)
      }
    }

    // Check for duplicate slugs among published
    const bySlug = {}
    for (const s of published) {
      const slug = s.slug?.current
      if (slug) {
        if (!bySlug[slug]) bySlug[slug] = []
        bySlug[slug].push(s)
      }
    }
    const dupes = Object.entries(bySlug).filter(([, v]) => v.length > 1)
    if (dupes.length > 0) {
      for (const [slug, items] of dupes) {
        console.log(`  DUPE SLUG: ${slug} — ${items.map(i => `${i._id}:${i.name}`).join(', ')}`)
      }
    }
  }

  console.log(`\nTOTAL: ${totalPublished} published, ${totalDraft} draft, ${totalPublished + totalDraft} all`)
}

main().catch(e => { console.error(e); process.exit(1) })
