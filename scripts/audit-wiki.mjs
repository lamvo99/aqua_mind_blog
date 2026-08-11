/**
 * PHASE 0 audit — read-only.
 * Queries every species/plant/coral/equipment document, dumps full docs to a JSON
 * report and prints a summary: fields present, scientificName coverage,
 * environment indicators, unknown fields.
 *
 * Usage: node scripts/audit-wiki.mjs
 * Requires SANITY_API_TOKEN / project id / dataset in .env.local
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

const API = `https://${projectId}.api.sanity.io/v2021-06-07/data/query/${dataset}?query=`

const query = encodeURIComponent(
  `*[_type in ["species","plant","coral","equipment"]] | order(_type, name asc) { ..., "slug": slug.current }`
)

const res = await fetch(API + query, { headers: { Authorization: `Bearer ${token}` } })
if (!res.ok) {
  console.error('Query failed:', res.status, await res.text())
  process.exit(1)
}

const { result: docs } = await res.json()

const SCHEMA_FIELDS = {
  species: ['_id', '_type', 'name', 'scientificName', 'slug', 'family', 'origin', 'excerpt', 'publishedAt', 'sizeCm', 'tankSizeMinL', 'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'ghMin', 'ghMax', 'diet', 'temperament', 'waterZone', 'schooling', 'difficulty', 'compatibleSpecies', 'mainImage', 'seo', 'relatedPosts'],
  plant: ['_id', '_type', 'name', 'scientificName', 'slug', 'excerpt', 'publishedAt', 'light', 'co2', 'growth', 'difficulty', 'placement', 'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'propagation', 'mainImage', 'relatedPosts'],
  coral: ['_id', '_type', 'name', 'scientificName', 'slug', 'excerpt', 'publishedAt', 'light', 'flow', 'difficulty', 'placement', 'aggression', 'reefCompatibility', 'tempMinC', 'tempMaxC', 'mainImage', 'relatedPosts'],
  equipment: ['_id', '_type', 'name', 'brand', 'model', 'slug', 'category', 'excerpt', 'publishedAt', 'flowRateLh', 'powerW', 'tankSizeMinL', 'tankSizeMaxL', 'pros', 'cons', 'mainImage', 'relatedPosts'],
}

const ENV_KEYWORDS = /freshwater|saltwater|brackish|marine|reef|salt water|fresh water|estuar/i

const counts = { species: 0, plant: 0, coral: 0, equipment: 0 }
const noScientificName = []
const envHints = []
const unknownFields = new Map()
const missingRequired = []
const duplicates = new Map()

for (const doc of docs) {
  counts[doc._type] = (counts[doc._type] || 0) + 1
  const storedKeys = Object.keys(doc)
  const known = new Set([...(SCHEMA_FIELDS[doc._type] || []), '_createdAt', '_updatedAt', '_rev', '_key'])
  const unknown = storedKeys.filter((k) => !known.has(k) && !k.startsWith('_'))
  if (unknown.length) unknownFields.set(doc._type, [...new Set([...(unknownFields.get(doc._type) || []), ...unknown])])

  const displayName = doc.name || doc.title || '(no name)'
  if (!doc.scientificName || !String(doc.scientificName).trim()) {
    noScientificName.push({ _type: doc._type, _id: doc._id, name: displayName, slug: doc.slug })
  }

  // Environment indicator hunt: any string field (excluding assets/ids)
  const haystack = []
  for (const [k, v] of Object.entries(doc)) {
    if (k.startsWith('_') || k === 'mainImage' || k === 'slug' || k === 'compatibleSpecies' || k === 'relatedPosts' || k === 'seo') continue
    if (typeof v === 'string') haystack.push(`${k}:${v}`)
    if (Array.isArray(v)) haystack.push(...v.filter((x) => typeof x === 'string'))
  }
  const envHit = haystack.filter((h) => ENV_KEYWORDS.test(h))
  if (envHit.length) {
    envHints.push({ _type: doc._type, name: displayName, slug: doc.slug, hints: envHit.slice(0, 4) })
  }

  // required by schema (from validation) but empty
  const required = {
    species: ['name', 'slug'],
    plant: ['name', 'slug'],
    coral: ['name', 'slug'],
    equipment: ['name', 'slug', 'category'],
  }[doc._type]
  const missing = (required || []).filter((f) => doc[f] === undefined || doc[f] === null || doc[f] === '')
  if (missing.length) missingRequired.push({ _type: doc._type, name: displayName, slug: doc.slug, missing })

  const sciKey = (doc.scientificName || '').toLowerCase().replace(/\s+/g, ' ')
  if (sciKey) {
    if (!duplicates.has(sciKey)) duplicates.set(sciKey, [])
    duplicates.get(sciKey).push({ _type: doc._type, name: displayName, slug: doc.slug })
  }
}

// ---- Output ----
const lines = []
lines.push('===== WIKI CONTENT AUDIT (PHASE 0) =====')
lines.push(`Total documents: ${docs.length}`)
lines.push(`Counts by _type: ${JSON.stringify(counts)}`)
lines.push('')
lines.push(`-- Missing scientificName: ${noScientificName.length} --`)
for (const d of noScientificName) lines.push(`  [${d._type}] ${d.name} (/${d.slug})`)
lines.push('')
lines.push(`-- Environment indicators in existing fields: ${envHints.length} --`)
for (const d of envHints) lines.push(`  [${d._type}] ${d.name}: ${d.hints.join(' | ')}`)
lines.push('')
lines.push('-- Unknown/legacy fields (in docs but not in current schema) --')
for (const [t, fields] of unknownFields) lines.push(`  ${t}: ${fields.join(', ')}`)
lines.push('')
lines.push(`-- Missing required fields: ${missingRequired.length} --`)
for (const d of missingRequired) lines.push(`  [${d._type}] ${d.name}: missing ${d.missing.join(', ')}`)
lines.push('')
lines.push('-- Duplicate scientificName candidates --')
for (const [k, v] of duplicates) {
  if (v.length > 1) lines.push(`  ${k}: ${v.map((x) => `${x._type}/${x.slug}`).join(' + ')}`)
}
lines.push('')

const report = {
  generatedAt: new Date().toISOString(),
  total: docs.length,
  counts,
  noScientificName,
  envHints,
  unknownFields: Object.fromEntries(unknownFields),
  missingRequired,
  duplicateScientificNames: [...duplicates.entries()].filter(([, v]) => v.length > 1),
  docs,
}

const outPath = path.join(process.env.TEMP || '/tmp', 'opencode', 'aquamind', 'wiki-audit.json')
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(report, null, 2))
console.log(lines.join('\n'))
console.log(`Full JSON report: ${outPath}`)
