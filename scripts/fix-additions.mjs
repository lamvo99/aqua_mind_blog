/**
 * Post-seed fixes:
 *  1. Create Staurogyne repens (was skipped — Commons title uses "S. repens").
 *  2. Replace Blyxa japonica image (picked a multi-species shot by substring match).
 *  3. Rename "Favites Brain Coral" -> "Honeycomb Brain Coral" (correct common name for Favia favus).
 * Usage: node scripts/fix-additions.mjs
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
const PUBLISHED = '2026-07-31T00:00:00Z'
const toSlug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const norm = (s) => s.toLowerCase().replace(/[_\s]+/g, ' ').trim()

async function commonsSearch(query) {
  const url = new URL('https://commons.wikimedia.org/w/api.php')
  url.search = new URLSearchParams({
    action: 'query', generator: 'search', gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: '6', gsrlimit: '10', prop: 'imageinfo', iiprop: 'url|mime|size',
    iiurlwidth: '1600', format: 'json', origin: '*',
  })
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  const json = await res.json()
  return Object.values(json.query?.pages || {})
    .filter((p) => p.imageinfo?.[0])
    .map((p) => ({ title: p.title.replace(/^File:/, ''), thumburl: p.imageinfo[0].thumburl, mime: p.imageinfo[0].mime, size: p.imageinfo[0].size || 0 }))
    .filter((f) => f.mime.startsWith('image/') && f.mime !== 'image/svg+xml')
}

async function uploadImage(query, kw, filename) {
  const files = await commonsSearch(query)
  const hits = files.filter((f) => norm(kw).split(/\s+/).every((w) => norm(f.title).includes(w)))
  if (!hits.length) throw new Error('no match: ' + query)
  const best = hits.sort((a, b) => b.size - a.size)[0]
  const buf = Buffer.from(await (await fetch(best.thumburl, { headers: { 'User-Agent': UA } })).arrayBuffer())
  if (buf.length < 20000) throw new Error('too small: ' + best.title)
  const ext = path.extname(best.title).toLowerCase() || '.jpg'
  const asset = await client.assets.upload('image', buf, {
    filename: filename + ext,
    contentType: ext === '.png' ? 'image/png' : 'image/jpeg',
  })
  return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
}

/* 1. Create Staurogyne repens */
const exists = await client.fetch(`*[_type == "plant" && scientificName == "Staurogyne repens"][0]._id`)
if (exists) {
  console.log('Staurogyne repens already exists')
} else {
  try {
    const image = await uploadImage('Staurogyne repens', 's. repens', 'plant-staurogyne-repens')
    await client.create({
      _type: 'plant', name: 'Staurogyne repens', scientificName: 'Staurogyne repens',
      slug: { _type: 'slug', current: 'staurogyne-repens' }, publishedAt: PUBLISHED,
      light: 'Medium', co2: 'Low', growth: 'Medium', difficulty: 'Beginner', placement: 'Foreground',
      tempMinC: 22, tempMaxC: 28, phMin: 6, phMax: 7.5,
      propagation: 'Cut and replant stems; forms a low bush rather than a true carpet.',
      excerpt: 'Care profile for Staurogyne repens: medium light, low CO\u2082, beginner difficulty.',
      mainImage: image,
    })
    console.log('Created Staurogyne repens')
  } catch (err) {
    console.log('FAIL Staurogyne repens:', String(err).slice(0, 200))
  }
}

/* 2. Replace Blyxa japonica image with an exact-species file */
try {
  const doc = await client.fetch(`*[_type == "plant" && scientificName == "Blyxa japonica"][0] { _id, "old": mainImage.asset._ref }`)
  if (doc) {
    const image = await uploadImage('Blyxa japonica', 'blyxa japonica', 'plant-blyxa-japonica')
    await client.patch(doc._id).set({ mainImage: image }).commit()
    if (doc.old) { try { await client.delete(doc.old) } catch {} }
    console.log('Replaced Blyxa japonica image ->', JSON.stringify(image).slice(0, 80))
  } else {
    console.log('Blyxa japonica not found')
  }
} catch (err) {
  console.log('FAIL Blyxa japonica:', String(err).slice(0, 200))
}

/* 3. Rename Favites Brain Coral -> Honeycomb Brain Coral */
try {
  const doc = await client.fetch(`*[_type == "coral" && scientificName == "Favia favus"][0] { _id, name, "slug": slug.current }`)
  if (doc) {
    await client.patch(doc._id)
      .set({ name: 'Honeycomb Brain Coral', slug: { _type: 'slug', current: 'honeycomb-brain-coral' } })
      .commit()
    console.log(`Renamed "${doc.name}" -> Honeycomb Brain Coral (slug ${doc.slug} -> honeycomb-brain-coral)`)
  } else {
    console.log('Favia favus not found')
  }
} catch (err) {
  console.log('FAIL rename:', String(err).slice(0, 200))
}

await sleep(500)
console.log('Fixes done.')
