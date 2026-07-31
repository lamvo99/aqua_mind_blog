/**
 * Upgrade script: replace low-quality Commons images (drawings, antique photos)
 * with real photos for 3 specific items, then re-patch Sanity mainImage.
 * Usage: node scripts/upgrade-images.mjs
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

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

const norm = (s) => s.toLowerCase().replace(/[_\s]+/g, ' ').trim()

async function findBest(query, kw) {
  const files = await commonsSearch(query)
  const hits = files.filter((f) => norm(f.title).split(/\s+/).every((w) => norm(kw).split(/\s+/).includes(w) || norm(f.title).includes(w)))
  const exact = files.filter((f) => norm(kw).split(/\s+/).every((w) => norm(f.title).includes(w)))
  return exact.sort((a, b) => b.size - a.size)[0] || null
}

async function replaceImage(type, slug, query, kw) {
  const doc = await client.fetch(`*[_type == $t && slug.current == $s][0] { _id, "old": mainImage.asset._ref }`, { t: type, s: slug })
  if (!doc) throw new Error('doc not found: ' + type + '/' + slug)
  const hit = await findBest(query, kw)
  if (!hit) throw new Error('no match for ' + slug)
  const buf = Buffer.from(await (await fetch(hit.thumburl, { headers: { 'User-Agent': UA } })).arrayBuffer())
  if (buf.length < 20000) throw new Error('download too small: ' + hit.title)
  const ext = path.extname(hit.title).toLowerCase() || '.jpg'
  const asset = await client.assets.upload('image', buf, {
    filename: `${type}-${slug}${ext}`,
    contentType: ext === '.png' ? 'image/png' : 'image/jpeg',
  })
  await client.patch(doc._id).set({ mainImage: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } } }).commit()
  if (doc.old) {
    try { await client.delete(doc.old) } catch {}
  }
  console.log(`OK ${type}/${slug}: ${doc.old || 'none'} -> ${hit.title} (${asset._id})`)
}

const items = [
  { type: 'plant', slug: 'bucephalandra', query: 'Bucephalandra motleyana', kw: 'bucephalandra motleyana' },
  { type: 'plant', slug: 'vallisneria-spiralis', query: 'Vallisneria spiralis vasp', kw: 'vallisneria spiralis' },
  { type: 'equipment', slug: 'master-test-kit', query: 'Hach Classroom Drinking Water Testing Kit', kw: 'hach classroom drinking water testing kit' },
]

for (const it of items) {
  try {
    await replaceImage(it.type, it.slug, it.query, it.kw)
  } catch (err) {
    console.log(`FAIL ${it.slug}: ${String(err).slice(0, 150)}`)
  }
  await sleep(250)
}
console.log('Upgrade done.')
