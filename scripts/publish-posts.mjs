import fs from 'fs'
import { createClient } from '@sanity/client'
import { posts } from './content-data.mjs'

const DRY_RUN = process.argv.includes('--dry-run')

const env = fs.readFileSync('.env.local', 'utf8')
const getEnv = (key) => {
  const line = env.split('\n').map((x) => x.trim()).find((x) => x.startsWith(key + '='))
  if (!line) return ''
  return line.split('=').slice(1).join('=').replace(/^"|"$/g, '')
}

const client = createClient({
  projectId: getEnv('NEXT_PUBLIC_SANITY_PROJECT_ID'),
  dataset: getEnv('NEXT_PUBLIC_SANITY_DATASET'),
  apiVersion: '2024-01-01',
  token: getEnv('SANITY_API_TOKEN'),
  useCdn: false,
})

async function uploadImage(imagePath, filename) {
  const buffer = fs.readFileSync(imagePath)
  const asset = await client.assets.upload('image', buffer, {
    filename,
    contentType: 'image/jpeg',
  })
  return asset._id
}

const wordCount = (blocks) =>
  blocks.filter((b) => b._type === 'block' && b.children).reduce((n, b) => n + b.children.reduce((m, c) => m + (c.text || '').trim().split(/\s+/).filter(Boolean).length, 0), 0)

console.log(DRY_RUN ? '=== DRY RUN (no writes) ===\n' : '=== PUBLISH MODE ===\n')

for (const post of posts) {
  const wc = wordCount(post.body)
  const h2Count = post.body.filter((b) => b.style === 'h2').length
  const bullets = post.body.filter((b) => b.listItem).length

  console.log(`--- ${post._id}`)
  console.log(`  title: ${post.title}`)
  console.log(`  body: ${post.body.length} blocks, ${wc} words, ${h2Count} H2, ${bullets} list items`)
  console.log(`  excerpt: ${post.excerpt.length} chars (target 120-160)`)
  console.log(`  metaTitle: ${post.seo.metaTitle.length} chars (target 50-60)`)
  console.log(`  metaDescription: ${post.seo.metaDescription.length} chars (target 150-160)`)
  console.log(`  tags: ${post.tags.join(', ')}`)
  console.log(`  image: ${post.imageFilename} (${fs.existsSync(post.imageFile) ? 'OK' : 'MISSING'})`)

  const flags = []
  if (post.excerpt.length < 120 || post.excerpt.length > 160) flags.push('excerpt-length')
  if (post.seo.metaTitle.length > 60) flags.push('metaTitle-long')
  if (post.seo.metaDescription.length > 160) flags.push('metaDesc-long')
  if (!fs.existsSync(post.imageFile)) flags.push('no-image')
  if (wc < 1500) flags.push('short-content')
  if (flags.length) console.log(`  ⚠ ${flags.join(', ')}`)
  else console.log('  ✓ all checks pass')
}

if (!DRY_RUN) {
  console.log('\nPublishing...')
  for (const post of posts) {
    console.log(`\n📝 Publishing: ${post._id} (${post.title})`)
    try {
      let imageRef = null
      if (fs.existsSync(post.imageFile)) {
        console.log('  📸 Uploading image...')
        const assetId = await uploadImage(post.imageFile, post.imageFilename)
        imageRef = {
          _type: 'image',
          asset: { _type: 'reference', _ref: assetId },
          alt: post.imageAlt,
        }
      }

      const existing = await client.fetch(`*[_id == $id][0]{publishedAt}`, { id: post._id })

      const patch = {
        excerpt: post.excerpt,
        status: 'published',
        body: post.body,
        tags: post.tags,
        isFeatured: post.isFeatured ?? false,
        seo: {
          metaTitle: post.seo.metaTitle,
          metaDescription: post.seo.metaDescription,
        },
        categories: [{ _type: 'reference', _ref: post.categoryRef }],
      }
      if (imageRef) patch.mainImage = imageRef
      if (!existing?.publishedAt) patch.publishedAt = new Date().toISOString()

      await client.patch(post._id).set(patch).commit()
      console.log('  ✅ Done')
      await new Promise((r) => setTimeout(r, 1000))
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`)
    }
  }
  console.log('\n🎉 All done!')
}
