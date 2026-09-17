/**
 * DATABASE IMAGE REMEDIATION — replace low-quality / missing images.
 *
 * Usage:
 *   node scripts/remediate-images.mjs              # dry-run
 *   node scripts/remediate-images.mjs --apply       # write to Sanity
 *   node scripts/remediate-images.mjs --apply --only=p1   # P1 only
 *   node scripts/remediate-images.mjs --apply --only=p2   # P2 only
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

const APPLY = process.argv.includes('--apply')
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1] || 'all'

const client = createClient({
  projectId: getEnv('NEXT_PUBLIC_SANITY_PROJECT_ID'),
  dataset: getEnv('NEXT_PUBLIC_SANITY_DATASET'),
  apiVersion: '2026-05-25',
  token: getEnv('SANITY_API_TOKEN'),
  useCdn: false,
})

const UA = 'AquaMindBackfill/1.0 (aquamind.life; xingzhuang5201314@gmail.com)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* ------------------------------------------------------------------ */
/* Wikimedia Commons search                                             */
/* ------------------------------------------------------------------ */

async function commonsSearch(query) {
  const url = new URL('https://commons.wikimedia.org/w/api.php')
  url.search = new URLSearchParams({
    action: 'query', generator: 'search', gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: '6', gsrlimit: '10', prop: 'imageinfo', iiprop: 'url|mime|size',
    iiurlwidth: '1600', format: 'json', origin: '*',
  })
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error('Commons search failed: ' + res.status)
  const json = await res.json()
  return Object.values(json.query?.pages || {})
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

async function findImage(queries) {
  for (const { q, kw, skip = [] } of queries) {
    let files = []
    try { files = await commonsSearch(q) } catch { continue }
    const hits = files.filter((f) => {
      if (!norm(kw).split(/\s+/).every((w) => norm(f.title).includes(w))) return false
      return !skip.some((s) => norm(f.title).includes(norm(s)))
    })
    if (hits.length) {
      const best = hits.sort((a, b) => b.size - a.size)[0]
      return { title: best.title, url: best.thumburl }
    }
    await sleep(300)
  }
  return null
}

async function download(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error('Download failed: ' + res.status)
  return Buffer.from(await res.arrayBuffer())
}

/* ------------------------------------------------------------------ */
/* Remediation items                                                    */
/* ------------------------------------------------------------------ */

const ITEMS = [
  // === P1 — Important ===
  {
    priority: 'p1', type: 'species', name: 'Golden Pencilfish', slug: 'nannostomus-beckfordi',
    sciName: 'Nannostomus beckfordi',
    queries: [
      { q: 'Nannostomus beckfordi', kw: 'nannostomus beckfordi' },
      { q: 'Nannostomus', kw: 'nannostomus' },
    ],
  },
  {
    priority: 'p1', type: 'species', name: 'Emerald Dwarf Rasbora', slug: 'celestichthys-erythromicron',
    sciName: 'Celestichthys erythromicron',
    queries: [
      { q: 'Celestichthys erythromicron', kw: 'celestichthys erythromicron' },
      { q: 'Microrasbora erythromicron', kw: 'erythromicron' },
      { q: 'Danio erythromicron', kw: 'erythromicron' },
    ],
  },
  {
    priority: 'p1', type: 'equipment', name: 'Hang-On-Back Filter', slug: 'hang-on-back-filter',
    queries: [],
    skip: true, reason: 'No accurate Wikimedia Commons match found — manual image needed',
  },
  // Zoanthids — SKIP (needs manual verification, skip automated fix)

  // === P2 — Cleanup ===
  {
    priority: 'p2', type: 'species', name: 'Emerald Betta', slug: 'betta-smaragdina',
    sciName: 'Betta smaragdina',
    queries: [
      { q: 'Betta smaragdina', kw: 'betta smaragdina' },
      { q: 'Betta smaragdina', kw: 'smaragdina' },
    ],
  },
  {
    priority: 'p2', type: 'species', name: 'Yellow Tang', slug: 'zebrasoma-flavescens',
    sciName: 'Zebrasoma flavescens',
    queries: [
      { q: 'Zebrasoma flavescens', kw: 'zebrasoma flavescens' },
      { q: 'Yellow tang fish', kw: 'yellow tang' },
    ],
  },
  {
    priority: 'p2', type: 'coral', name: 'Acan Lords', slug: 'acan-lords',
    sciName: 'Acanthastrea lordhowensis',
    queries: [
      { q: 'Acanthastrea lordhowensis', kw: 'acanthastrea lordhowensis' },
      { q: 'Acan Lord coral', kw: 'acan' },
    ],
  },
  {
    priority: 'p2', type: 'equipment', name: 'Submersible Heater', slug: 'submersible-heater',
    queries: [
      { q: 'aquarium heater', kw: 'aquarium heater' },
      { q: 'submersible heater aquarium', kw: 'heater' },
    ],
  },
  {
    priority: 'p2', type: 'plant', name: 'Java Fern', slug: 'java-fern',
    sciName: 'Microsorum pteropus',
    queries: [
      { q: 'Microsorum pteropus', kw: 'microsorum pteropus' },
      { q: 'Java fern aquarium', kw: 'java fern' },
    ],
  },
  {
    priority: 'p2', type: 'plant', name: 'Cryptocoryne wendtii', slug: 'cryptocoryne-wendtii',
    sciName: 'Cryptocoryne wendtii',
    queries: [
      { q: 'Cryptocoryne wendtii', kw: 'cryptocoryne wendtii' },
      { q: 'Cryptocoryne wendtii', kw: 'wendtii' },
    ],
  },
  {
    priority: 'p2', type: 'plant', name: 'Dwarf Baby Tears', slug: 'dwarf-baby-tears',
    sciName: 'Hemianthus callitrichoides',
    queries: [
      { q: 'Hemianthus', kw: 'hemianthus' },
      { q: 'callitrichoides', kw: 'callitrichoides' },
      { q: 'HC Cuba aquarium', kw: 'hc' },
    ],
  },
  {
    priority: 'p2', type: 'plant', name: 'Vallisneria spiralis', slug: 'vallisneria-spiralis',
    sciName: 'Vallisneria spiralis',
    queries: [
      { q: 'Vallisneria spiralis', kw: 'vallisneria spiralis' },
      { q: 'Vallisneria spiralis', kw: 'vallisneria' },
    ],
  },
  {
    priority: 'p2', type: 'plant', name: 'Water Wisteria', slug: 'water-wisteria',
    sciName: 'Hygrophila difformis',
    queries: [
      { q: 'Hygrophila difformis', kw: 'hygrophila difformis' },
      { q: 'Water wisteria aquarium', kw: 'wisteria' },
    ],
  },
  {
    priority: 'p2', type: 'equipment', name: 'CO₂ Regulator Kit', slug: 'co-regulator-kit',
    queries: [],
    skip: true, reason: 'No accurate Wikimedia Commons match found — manual image needed',
  },
  {
    priority: 'p2', type: 'invertebrate', name: 'Rock Flower Anemone', slug: 'phymanthus-crucifer',
    sciName: 'Phymanthus crucifer',
    queries: [
      { q: 'Phymanthus crucifer', kw: 'phymanthus crucifer' },
      { q: 'Rock flower anemone', kw: 'flower anemone' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

const filtered = ONLY === 'all' ? ITEMS : ITEMS.filter((i) => i.priority === ONLY)
console.log(`Remediating ${filtered.length} items (${ONLY} priority)...\n`)

// Pre-fetch document IDs for all items
const slugs = filtered.filter((i) => !i.skip).map((i) => i.slug)
const typeMap = {}
for (const item of filtered.filter((i) => !i.skip)) {
  if (!typeMap[item.type]) typeMap[item.type] = []
  typeMap[item.type].push(item.slug)
}

const docIdMap = new Map()
for (const type of Object.keys(typeMap)) {
  const docs = await client.fetch(
    `*[_type == $type && defined(slug)] {_id, "slug": slug.current}`,
    { type }
  )
  for (const d of docs) {
    if (typeMap[type].includes(d.slug)) {
      docIdMap.set(d.slug, d._id)
    }
  }
}

const report = { applied: [], skipped: [], failed: [], dryRun: !APPLY }

for (const item of filtered) {
  process.stdout.write(`[${item.slug}] `)

  if (item.skip) {
    console.log(`SKIPPED: ${item.reason}`)
    report.skipped.push({ slug: item.slug, reason: item.reason })
    continue
  }

  // Find image
  let found = null
  try {
    found = await findImage(item.queries)
  } catch (err) {
    console.log(`SEARCH FAILED: ${String(err).slice(0, 80)}`)
    report.failed.push({ slug: item.slug, phase: 'search', error: String(err).slice(0, 200) })
    continue
  }
  if (!found) {
    console.log('NO IMAGE FOUND')
    report.skipped.push({ slug: item.slug, reason: 'no Commons match' })
    continue
  }

  // Download
  let buf
  try {
    buf = await download(found.url)
  } catch (err) {
    console.log(`DOWNLOAD FAILED: ${String(err).slice(0, 80)}`)
    report.failed.push({ slug: item.slug, phase: 'download', error: String(err).slice(0, 200) })
    continue
  }
  if (buf.length < 20000) {
    console.log(`TOO SMALL (${buf.length} bytes)`)
    report.skipped.push({ slug: item.slug, reason: `download too small (${buf.length} bytes)` })
    continue
  }

  if (!APPLY) {
    console.log(`DRY-RUN: would upload ${found.title} (${(buf.length / 1024).toFixed(0)}KB)`)
    report.applied.push({ slug: item.slug, file: found.title, size: buf.length, dryRun: true })
    continue
  }

  // Upload to Sanity
  try {
    const docId = docIdMap.get(item.slug)
    if (!docId) {
      console.log(`DOC NOT FOUND for slug "${item.slug}"`)
      report.failed.push({ slug: item.slug, phase: 'lookup', error: `Document not found for slug "${item.slug}"` })
      continue
    }

    const ext = path.extname(found.title).toLowerCase() || '.jpg'
    const asset = await client.assets.upload('image', buf, {
      filename: `${item.type}-${item.slug}${ext}`,
      contentType: ext === '.png' ? 'image/png' : 'image/jpeg',
    })

    await client
      .patch(docId)
      .set({ mainImage: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } } })
      .commit()

    console.log(`OK <- ${found.title} (${(buf.length / 1024).toFixed(0)}KB)`)
    report.applied.push({ slug: item.slug, file: found.title, size: buf.length, assetId: asset._id, docId })
  } catch (err) {
    console.log(`FAILED: ${String(err).slice(0, 100)}`)
    report.failed.push({ slug: item.slug, phase: 'upload', error: String(err).slice(0, 200) })
  }

  await sleep(300)
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

console.log('\n=== REMEDIATION RESULT ===')
console.log(`Applied: ${report.applied.length}`)
console.log(`Skipped: ${report.skipped.length}`)
console.log(`Failed: ${report.failed.length}`)
if (report.dryRun) console.log('\n(DRY-RUN — no changes made. Use --apply to write to Sanity.)')

const reportPath = path.join(__dirname, '.remediation-report.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8')
console.log(`Report saved to ${reportPath}`)
