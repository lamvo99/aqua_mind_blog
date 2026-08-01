/**
 * 1.7: Upload missing mainImages found via Openverse (Flickr) after Commons
 * returned no exact matches. User approved alternative sources.
 * Dwarf Baby Tears + CO2 Regulator Kit. Hang-On-Back Filter: no exact match -> logged, skipped.
 *
 * Usage: node scripts/add-missing-images.mjs
 * Attribution recorded in scripts/.missing-images-report.json
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

const UA = 'AquaMindBackfill/1.0 (aquamind.life; xingzhuang5201314@gmail.com)'

const TARGETS = [
  {
    type: 'plant',
    slug: 'dwarf-baby-tears',
    url: 'https://api.openverse.org/v1/images/7d21669c-d964-4e7e-a9ee-675d1c4fe27c/thumb/',
    attribution: {
      title: 'Cuba (Hemianthus Callitrichoides)',
      creator: 'DGuarch',
      creatorUrl: 'https://www.flickr.com/photos/78690928@N08',
      sourceUrl: 'https://www.flickr.com/photos/78690928@N08/7646242558',
      license: 'CC BY-NC-SA 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/2.0/',
      foundVia: 'Openverse (Flickr)',
    },
  },
  {
    type: 'equipment',
    slug: 'co-regulator-kit',
    url: 'https://api.openverse.org/v1/images/fca32e97-f2de-4160-b8ea-8ac522954639/thumb/',
    attribution: {
      title: 'CO2 Regulator w/ solenoid',
      creator: 'Franklin Dattein',
      creatorUrl: 'https://www.flickr.com/photos/51035769981@N01',
      sourceUrl: 'https://www.flickr.com/photos/51035769981@N01/124224131',
      license: 'CC BY-NC 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-nc/2.0/',
      foundVia: 'Openverse (Flickr)',
    },
  },
]

const results = { done: [], skipped: [], failed: [] }

for (const t of TARGETS) {
  process.stdout.write(`${t.type}: ${t.slug} ... `)
  try {
    const res = await fetch(t.url, { headers: { 'User-Agent': UA } })
    if (!res.ok) throw new Error('download failed: ' + res.status)
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 20000) throw new Error('download too small: ' + buf.length)
    const ext = path.extname(new URL(t.url).pathname) || '.jpg'
    const asset = await client.assets.upload('image', buf, {
      filename: `${t.type}-${t.slug}${ext}`,
      contentType: ext === '.png' ? 'image/png' : 'image/jpeg',
    })
    const docId = await client.fetch(
      `*[_type == $t && slug.current == $s][0]._id`,
      { t: t.type, s: t.slug }
    )
    if (!docId) throw new Error('doc not found by slug')
    await client
      .patch(docId)
      .set({ mainImage: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } } })
      .commit()
    results.done.push({ type: t.type, slug: t.slug, assetId: asset._id, attribution: t.attribution })
    console.log(`OK -> ${asset._id}`)
  } catch (err) {
    results.failed.push({ type: t.type, slug: t.slug, error: String(err).slice(0, 200) })
    console.log('FAILED: ' + String(err).slice(0, 150))
  }
}

results.skipped.push({
  type: 'equipment',
  slug: 'hang-on-back-filter',
  reason: 'no exact product image found on Wikimedia Commons or Openverse (Flickr); plan rule: do not attach approximate image',
})

console.log('\n=== RESULT ===')
console.log(JSON.stringify(results, null, 2))
fs.writeFileSync(
  path.join(__dirname, '.missing-images-report.json'),
  JSON.stringify(results, null, 2),
  'utf8'
)
console.log('Report saved to scripts/.missing-images-report.json')
