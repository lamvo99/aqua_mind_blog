/**
 * Backfill script: find real species-correct images on Wikimedia Commons,
 * upload to Sanity, and patch mainImage on documents missing it.
 *
 * Usage: node scripts/backfill-images.mjs
 * Reads scripts/.image-audit.json (output of audit-images.mjs).
 *
 * Confidence rule: the Commons file title must contain the scientific name
 * (or a required keyword for generic items). No approximate images.
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
const COMMONS = 'https://commons.wikimedia.org/w/api.php'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Search Commons and return candidate files [{title, thumburl, mime}] */
async function commonsSearch(query) {
  const url = new URL(COMMONS)
  url.search = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: '6',
    gsrlimit: '10',
    prop: 'imageinfo',
    iiprop: 'url|mime|size',
    iiurlwidth: '1600',
    format: 'json',
    origin: '*',
  })
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error('Commons search failed: ' + res.status)
  const json = await res.json()
  const pages = json.query?.pages || {}
  return Object.values(pages)
    .filter((p) => p.imageinfo?.[0])
    .map((p) => ({
      title: p.title.replace(/^File:/, ''),
      thumburl: p.imageinfo[0].thumburl,
      mime: p.imageinfo[0].mime,
      size: p.imageinfo[0].size || 0,
    }))
    .filter((f) => f.mime.startsWith('image/') && f.mime !== 'image/svg+xml')
}

const norm = (s) => s.toLowerCase().replace(/[_\s]+/g, ' ').trim()

/** High-confidence check: every word of kw appears in the file title */
function titleMatches(title, kw) {
  const t = norm(title)
  return norm(kw).split(/\s+/).every((w) => t.includes(w))
}

/** Per-item search overrides for generic items (equipment / inspiration) */
const SEARCH_OVERRIDES = {
  'Hang-On-Back Filter': { q: 'hang on aquarium filter', kw: 'hang on filter' },
  'Canister Filter': { q: 'canister filter aquarium', kw: 'canister filter' },
  'Sponge Filter': { q: 'sponge aquarium filter', kw: 'sponge filter' },
  'Internal Filter': { q: 'internal aquarium filter', kw: 'internal filter' },
  'Submersible Heater': { q: 'aquarium heater', kw: 'aquarium heater' },
  'LED Aquarium Light': { q: 'aquarium led light', kw: 'aquarium light' },
  'Circulation Pump (Powerhead)': { q: 'aquarium powerhead', kw: 'powerhead' },
  'Air Pump': { q: 'aquarium air pump', kw: 'air pump' },
  'CO\u2082 Regulator Kit': { q: 'aquarium co2 regulator', kw: 'co2 regulator' },
  'Master Test Kit': { q: 'water testing kit', kw: 'water testing kit' },
  'Sponge Filter': { q: 'aquarium sponge filter', kw: 'sponge filter' },
  'Angelfish': { q: 'Pterophyllum scalare', kw: 'Pterophyllum scalare' },
  'Cryptocoryne balansae': { q: 'Cryptocoryne crispatula', kw: 'cryptocoryne crispatula' },
  'Bucephalandra': { q: 'Bucephalandra motleyana', kw: 'bucephalandra motleyana' },
  'Vallisneria spiralis': { q: 'Vallisneria spiralis vasp', kw: 'vallisneria spiralis' },
  'Classic Iwagumi': { q: 'iwagumi', kw: 'iwagumi scape' },
  'Dutch Planted Tank': { q: 'Dutch style aquascape', kw: 'enchanted garden' },
  'Low-Tech Nature Aquarium': { q: 'aquascape nature aquarium', kw: 'aquascape' },
  'Jungle Biotope': { q: 'aquascape jungle', kw: 'aquascape' },
  'Nano Paludarium': { q: 'paludarium', kw: 'paludarium' },
}

/** Find the best Commons file for an item. Returns {title, url} or null. */
async function findImage(item) {
  const over = SEARCH_OVERRIDES[item.label]
  const queries = []
  if (over) {
    queries.push({ q: over.q, kw: over.kw })
  } else if (item.type === 'species') {
    if (item.scientificName) queries.push({ q: item.scientificName, kw: item.scientificName })
    queries.push({ q: item.label, kw: item.label })
  } else if (item.type === 'plant' || item.type === 'coral') {
    if (item.scientificName) queries.push({ q: item.scientificName, kw: item.scientificName })
    queries.push({ q: item.label, kw: item.label })
  } else {
    queries.push({ q: item.label, kw: item.label })
  }

  for (const { q, kw } of queries) {
    let files = []
    try {
      files = await commonsSearch(q)
    } catch {
      continue
    }
    const hits = files.filter((f) => titleMatches(f.title, kw))
    if (hits.length) {
      const best = hits.sort((a, b) => b.size - a.size)[0]
      return { title: best.title, url: best.thumburl }
    }
    await sleep(250)
  }
  return null
}

async function download(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error('Download failed: ' + res.status)
  return Buffer.from(await res.arrayBuffer())
}

const audit = JSON.parse(fs.readFileSync(path.join(__dirname, '.image-audit.json'), 'utf8'))
const needsImage = audit.missing.filter((m) => m.type !== 'problem')

const results = { done: [], manual: [], failed: [] }
let i = 0

for (const item of needsImage) {
  i++
  const label = item.label
  process.stdout.write(`[${i}/${needsImage.length}] ${item.type}: ${label} ... `)
  try {
    const found = await findImage(item)
    if (!found) {
      results.manual.push(item)
      console.log('MANUAL NEEDED (no match)')
      continue
    }
    const buf = await download(found.url)
    if (buf.length < 20000) {
      results.manual.push(item)
      console.log('MANUAL NEEDED (download too small / likely thumbnail placeholder)')
      continue
    }
    const ext = path.extname(found.title).toLowerCase() || '.jpg'
    const asset = await client.assets.upload('image', buf, {
      filename: `${item.type}-${item.slug}${ext}`,
      contentType: ext === '.png' ? 'image/png' : 'image/jpeg',
    })
    const docId = await client.fetch(
      `*[_type == $t && slug.current == $s][0]._id`,
      { t: item.type, s: item.slug }
    )
    if (!docId) throw new Error('doc not found by slug')
    await client
      .patch(docId)
      .set({ mainImage: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } } })
      .commit()
    results.done.push({ ...item, commonsFile: found.title, commonsUrl: found.url, assetId: asset._id })
    console.log(`OK <- ${found.title}`)
  } catch (err) {
    results.failed.push({ ...item, error: String(err).slice(0, 200) })
    console.log('FAILED: ' + String(err).slice(0, 150))
  }
  await sleep(250)
}

console.log('\n=== BACKFILL RESULT ===')
console.log(`DONE: ${results.done.length}`)
console.log(`MANUAL NEEDED: ${results.manual.length} -> ${results.manual.map((m) => m.label).join(', ')}`)
console.log(`FAILED (errors): ${results.failed.length} -> ${results.failed.map((m) => m.label).join(', ')}`)

fs.writeFileSync(
  path.join(__dirname, '.backfill-report.json'),
  JSON.stringify(results, null, 2),
  'utf8'
)
console.log('Report saved to scripts/.backfill-report.json')
