import fs from 'fs'
import { createClient } from '@sanity/client'

const env = fs.readFileSync('.env.local', 'utf8')
const getEnv = (key) => {
  const line = env.split('\n').map((x) => x.trim()).find((x) => x.startsWith(key + '='))
  if (!line) return ''
  return line.split('=').slice(1).join('=').replace(/^"|"$/g, '')
}

const client = createClient({
  projectId: getEnv('NEXT_PUBLIC_SANITY_PROJECT_ID'),
  dataset: getEnv('NEXT_PUBLIC_SANITY_DATASET'),
  apiVersion: '2026-05-25',
  token: getEnv('SANITY_API_TOKEN'),
  useCdn: false,
})

const SLUG = 'keeping-aquarium-fish-where-to-start-a-complete-beginner-s-guide'

const images = await client.fetch(
  `*[_type in ["species", "equipment"] && defined(mainImage)]{
    "file": mainImage.asset->.originalFilename,
    "assetId": mainImage.asset._ref
  }`
)
const byFile = Object.fromEntries(images.map((i) => [i.file, i.assetId]))

const insertions = [
  { afterHeading: 'Decide What Kind of Fish You Want to Keep', file: 'species-paracheirodon-innesi.jpg' },
  { afterHeading: 'The Nitrogen Cycle: The Most Important Beginner Concept', file: 'equipment-master-test-kit.jpg' },
  { afterHeading: 'Feeding Aquarium Fish', file: 'equipment-flake-fish-food.jpg' },
]

const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]`, { slug: SLUG })
const body = post.body || []

const report = { skipped: [], inserted: [] }

for (const ins of insertions) {
  const assetId = byFile[ins.file]
  if (!assetId) {
    report.skipped.push({ afterHeading: ins.afterHeading, file: ins.file, reason: 'asset not found' })
    continue
  }
  const hIdx = body.findIndex((b) => b._type === 'block' && b.style === 'h2' && (b.children?.[0]?.text || '').trim() === ins.afterHeading)
  if (hIdx === -1) {
    report.skipped.push({ afterHeading: ins.afterHeading, file: ins.file, reason: 'heading not found' })
    continue
  }
  if (body.some((b) => b._type === 'image' && b.asset?._ref === assetId)) {
    report.skipped.push({ afterHeading: ins.afterHeading, file: ins.file, reason: 'image already in body' })
    continue
  }
  const imgBlock = {
    _type: 'image',
    _key: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    asset: { _type: 'reference', _ref: assetId },
  }
  body.splice(hIdx + 1, 0, imgBlock)
  report.inserted.push({ afterHeading: ins.afterHeading, file: ins.file, assetId })
}

if (report.inserted.length) {
  await client.patch(post._id).set({ body }).commit()
}

const imgCount = body.filter((b) => b._type === 'image').length
console.log(JSON.stringify({ ...report, totalBodyImagesAfter: imgCount }, null, 2))
