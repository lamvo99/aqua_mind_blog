/**
 * Audit script: check image fields on all database documents in Sanity.
 * Usage: node scripts/audit-images.mjs
 * Reports per-type: total docs, docs with valid image, docs missing/broken image.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@sanity/client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
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

const TYPES = ['species', 'plant', 'coral', 'equipment', 'inspiration', 'problem']

const docs = await client.fetch(
  `*[_type in $types] { _id, _type, name, title, scientificName, mainImage, "slug": slug.current }`,
  { types: TYPES }
)

const report = { perType: {}, missing: [], broken: [] }

for (const type of TYPES) {
  const typeDocs = docs.filter((d) => d._type === type)
  const entry = { total: typeDocs.length, valid: 0, missing: 0, broken: 0 }
  for (const d of typeDocs) {
    const label = d.name || d.title || d._id
    if (!d.mainImage) {
      entry.missing++
      report.missing.push({ type, label, slug: d.slug, scientificName: d.scientificName || null })
    } else {
      const ref = d.mainImage?.asset?._ref
      if (ref && ref.startsWith('image-')) {
        entry.valid++
      } else {
        entry.broken++
        report.broken.push({ type, label, ref: ref || null })
      }
    }
  }
  report.perType[type] = entry
}

console.log('=== IMAGE AUDIT REPORT ===')
console.table(report.perType)
console.log(`MISSING images: ${report.missing.length}`)
console.log(`BROKEN references: ${report.broken.length}`)

fs.writeFileSync(
  path.join(__dirname, '..', 'scripts', '.image-audit.json'),
  JSON.stringify(report, null, 2),
  'utf8'
)
console.log('Detail saved to scripts/.image-audit.json')
