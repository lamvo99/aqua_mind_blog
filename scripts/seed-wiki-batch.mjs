/**
 * PHASE 3 — seed a wiki data batch from scripts/drafts/<batch>.json.
 *
 * - Validates every scientificName against the dedupe blacklist.
 * - Idempotent: skips documents that already exist (slug or scientificName), unless --force.
 * - Attaches images from Wikimedia Commons (file title must contain the
 *   scientific name or a listed synonym — no approximate images).
 * - Type-aware: reads `type` from the batch file (default "species"); writes
 *   only the fields the matching schema defines (species vs invertebrate).
 *
 * Usage:
 *   node scripts/seed-wiki-batch.mjs                          # dry-run: plan only
 *   node scripts/seed-wiki-batch.mjs --draft=batch2           # dry-run another draft
 *   node scripts/seed-wiki-batch.mjs --apply --draft=batch2   # write docs + images
 *   node scripts/seed-wiki-batch.mjs --apply --no-images
 *   node scripts/seed-wiki-batch.mjs --apply --force          # createOrReplace existing
 *
 * Reads SANITY_API_TOKEN / project id / dataset from .env.local.
 * Report written to scripts/.seed-<batch>-report.json
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@sanity/client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const env = fs.readFileSync(path.join(root, '.env.local'), 'utf8')
const getEnv = (key) => {
  const line = env.split('\n').map((x) => x.trim()).find((x) => x.startsWith(key + '='))
  if (!line) return ''
  return line.split('=').slice(1).join('=').replace(/^"|"$/g, '')
}

const token = getEnv('SANITY_API_TOKEN')
const projectId = getEnv('NEXT_PUBLIC_SANITY_PROJECT_ID')
const dataset = getEnv('NEXT_PUBLIC_SANITY_DATASET')

if (!token || !projectId || !dataset) {
  console.error('Missing env vars in .env.local')
  process.exit(1)
}

const APPLY = process.argv.includes('--apply')
const WITH_IMAGES = APPLY && !process.argv.includes('--no-images')
const FORCE = process.argv.includes('--force')

const draftArg = process.argv.find((a) => a.startsWith('--draft='))
const draftName = (draftArg || '--draft=batch1').split('=')[1]
const batchFile = path.join(__dirname, 'drafts', `${draftName}.json`)
const batch = JSON.parse(fs.readFileSync(batchFile, 'utf8'))
const blacklist = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'scientific-name-blacklist.json'), 'utf8'))

const normalize = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim()
const slugFrom = (s) => normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-05-25',
  token,
  useCdn: false,
})

const UA = 'AquaMindBackfill/1.0 (aquamind.life; xingzhuang5201314@gmail.com)'
const COMMONS = 'https://commons.wikimedia.org/w/api.php'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const PUBLISHED = '2026-08-11T00:00:00Z'
const slug = (current) => ({ _type: 'slug', current })

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

const titleMatches = (title, kw) => {
  const t = normalize(title)
  return normalize(kw).split(/\s+/).every((w) => t.includes(w))
}

async function findImage(entry) {
  const keywords = (entry.imageKeywords || [entry.scientificName]).map(String)
  for (const kw of keywords) {
    let files = []
    try {
      files = await commonsSearch(kw)
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

// --- 1. Validate against the dedupe blacklist ---
const blackKeys = new Set(blacklist.blacklist || [])
const dups = batch.entries.filter((e) => blackKeys.has(normalize(e.scientificName)))
if (dups.length) {
  console.error(`BLOCKED: ${dups.length} scientific name(s) already exist in Sanity:`)
  for (const d of dups) console.error('  -', d.scientificName)
  process.exit(1)
}

// --- 2. Load existing docs to keep the batch idempotent ---
const existing = await client.fetch(
  `*[_type in ["species", "invertebrate"]] { _id, slug, scientificName, mainImage }`
)
const bySlug = new Map(existing.map((d) => [d.slug?.current, d._id]))
const bySci = new Map(existing.map((d) => [normalize(d.scientificName), d._id]))
const hasImage = (d) => !!(bySlug.get(d.slug) && existing.find((x) => x._id === bySlug.get(d.slug))?.mainImage)

const TYPE_FIELDS = {
  species: [
    'name', 'scientificName', 'family', 'origin', 'excerpt', 'publishedAt', 'sizeCm',
    'tankSizeMinL', 'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'ghMin', 'ghMax',
    'diet', 'temperament', 'waterZone', 'schooling', 'difficulty', 'waterType',
  ],
  invertebrate: [
    'name', 'scientificName', 'excerpt', 'publishedAt', 'sizeCm',
    'tempMinC', 'tempMaxC', 'phMin', 'phMax',
    'diet', 'temperament', 'difficulty', 'waterType', 'group',
  ],
}

const batchType = batch.type || 'species'
const docs = batch.entries.map((e) => {
  const type = e._type || batchType
  const fields = TYPE_FIELDS[type]
  if (!fields) throw new Error(`Unsupported _type in ${draftName}.json: ${type}`)
  const s = slugFrom(e.scientificName)
  const doc = { _id: `${type}-${s}`, _type: type, slug: slug(s) }
  for (const f of fields) {
    if (fields.includes('waterType') && f === 'waterType') doc.waterType = e.waterType || 'freshwater'
    else if (e[f] !== undefined) doc[f] = e[f]
  }
  doc.publishedAt = doc.publishedAt || PUBLISHED
  return { entry: e, _type: type, _id: doc._id, slug: s, doc }
})

const plan = { toCreate: [], toReplace: [], skipExisting: [], needImage: [] }
for (const d of docs) {
  if (bySlug.has(d.slug) || bySci.has(normalize(d.entry.scientificName))) {
    d.existingId = bySlug.get(d.slug) || bySci.get(normalize(d.entry.scientificName))
    if (FORCE) plan.toReplace.push(d)
    else plan.skipExisting.push(d)
    if (!FORCE && !hasImage(d)) plan.needImage.push(d)
  } else {
    plan.toCreate.push(d)
    plan.needImage.push(d)
  }
}

const printPlan = () => {
  console.log(`Batch "${batch.batch}" — ${batch.count} entries`)
  console.log(`  CREATE: ${plan.toCreate.length}`)
  if (plan.toReplace.length) console.log(`  REPLACE (--force): ${plan.toReplace.length}`)
  if (plan.skipExisting.length) {
    console.log(`  SKIP (already in Sanity): ${plan.skipExisting.map((d) => d.slug).join(', ')}`)
  }
  if (plan.needImage.length) console.log(`  IMAGES to fetch: ${plan.needImage.map((d) => d.slug).join(', ')}`)
  if (APPLY) {
    for (const d of plan.toCreate) {
      console.log(`  + ${d.slug}  (${d.entry.name})`)
    }
  }
}

if (!APPLY) {
  printPlan()
  console.log('\nDry-run only. Run with --apply to write to Sanity (--no-images to skip images).')
  process.exit(0)
}

// --- 3. Write documents, then attach images ---
const report = { batch: batch.batch, created: [], replaced: [], skipped: [], manual: [], failed: [] }

const createDoc = async (d) => {
  await client.createOrReplace(d.doc)
  return d
}

for (const d of plan.toCreate) {
  process.stdout.write(`[${d.slug}] creating... `)
  try {
    await createDoc(d)
    report.created.push(d.slug)
    console.log('OK')
  } catch (err) {
    report.failed.push({ slug: d.slug, error: String(err).slice(0, 200) })
    console.log('FAILED: ' + String(err).slice(0, 150))
  }
}

for (const d of plan.toReplace) {
  process.stdout.write(`[${d.slug}] replacing (--force)... `)
  try {
    await createDoc(d)
    report.replaced.push(d.slug)
    console.log('OK')
  } catch (err) {
    report.failed.push({ slug: d.slug, error: String(err).slice(0, 200) })
    console.log('FAILED: ' + String(err).slice(0, 150))
  }
}

for (const d of plan.skipExisting) {
  report.skipped.push(d.slug)
  console.log(`[${d.slug}] skipped (exists)`)
}

if (WITH_IMAGES) {
  console.log('\n--- Images (Wikimedia Commons) ---')
  const withImages = [...new Set(plan.needImage)].filter((d) => !report.failed.some((f) => f.slug === d.slug))
  for (const d of withImages) {
    process.stdout.write(`[${d.slug}] image... `)
    try {
      const found = await findImage(d.entry)
      if (!found) {
        report.manual.push(d.slug)
        console.log('MANUAL NEEDED (no Commons match)')
        continue
      }
      const buf = await download(found.url)
      if (buf.length < 20000) {
        report.manual.push(d.slug)
        console.log('MANUAL NEEDED (download too small)')
        continue
      }
      const ext = path.extname(found.title).toLowerCase() || '.jpg'
      const asset = await client.assets.upload('image', buf, {
        filename: `${d._type}-${d.slug}${ext}`,
        contentType: ext === '.png' ? 'image/png' : 'image/jpeg',
      })
      await client
        .patch(d._id)
        .set({ mainImage: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } } })
        .commit()
      report.created.find((s) => s === d.slug) // no-op keep
      console.log(`OK <- ${found.title}`)
    } catch (err) {
      report.failed.push({ slug: d.slug, phase: 'image', error: String(err).slice(0, 200) })
      console.log('FAILED: ' + String(err).slice(0, 150))
    }
    await sleep(250)
  }
}

console.log('\n=== SEED RESULT ===')
console.log(`Created: ${report.created.length}`)
console.log(`Replaced: ${report.replaced.length}`)
console.log(`Skipped (existing): ${report.skipped.length}`)
console.log(`Manual image needed: ${report.manual.length ? report.manual.join(', ') : 'none'}`)
console.log(`Failed: ${report.failed.length}`)

const reportPath = path.join(__dirname, `.seed-${batch.batch}-report.json`)
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8')
console.log(`Report saved to ${reportPath}`)
