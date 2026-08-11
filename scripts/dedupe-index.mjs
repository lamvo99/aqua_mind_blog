/**
 * PHASE 2 — dedupe index.
 * Builds the blacklist of every scientificName currently in Sanity
 * (species/plant/coral/invertebrate), normalized: lowercase, whitespace collapsed.
 * Reads .env.local; no writes to Sanity.
 *
 * Usage: node scripts/dedupe-index.mjs
 * Output: scripts/data/scientific-name-blacklist.json
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')

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

const normalize = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim()

const API = `https://${projectId}.api.sanity.io/v2021-06-07/data/query/${dataset}?query=`
const q = encodeURIComponent(
  `*[_type in ["species","plant","coral","invertebrate"]] { _type, name, slug, scientificName }`
)

const res = await fetch(API + q, { headers: { Authorization: `Bearer ${token}` } })
if (!res.ok) throw new Error(`query: ${res.status} ${await res.text()}`)
const docs = (await res.json()).result

const entries = []
const rawMissing = []
for (const d of docs) {
  if (!d.scientificName || !normalize(String(d.scientificName))) {
    rawMissing.push(`${d._type}/${d.slug?.current ?? d.name}`)
    continue
  }
  entries.push({
    scientificName: String(d.scientificName).trim(),
    key: normalize(String(d.scientificName)),
    _type: d._type,
    slug: d.slug?.current,
  })
}

const keyCount = new Map()
for (const e of entries) keyCount.set(e.key, (keyCount.get(e.key) || 0) + 1)
const dups = [...keyCount.entries()].filter(([, n]) => n > 1)

const out = {
  generatedAt: new Date().toISOString(),
  totalRawDocs: docs.length,
  indexed: entries.length,
  blacklist: entries.map((e) => e.key).sort(),
  detail: entries,
  duplicates: dups,
  missingScientificName: rawMissing,
}

const outPath = path.join(__dirname, 'data', 'scientific-name-blacklist.json')
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(out, null, 2))

console.log(`Indexed: ${entries.length} scientific names (from ${docs.length} docs)`)
console.log(`Duplicates: ${dups.length ? dups.map(([k]) => k).join(', ') : 'none'}`)
console.log(`Docs with empty scientificName: ${rawMissing.length ? rawMissing.join(', ') : 'none'}`)
console.log(`Blacklist written: ${outPath}`)