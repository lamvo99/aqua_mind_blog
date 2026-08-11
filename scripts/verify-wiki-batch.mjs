/**
 * Verify a seeded wiki batch: all entries exist, waterType correct,
 * mainImage attached, no missing core fields.
 * Usage: node scripts/verify-wiki-batch.mjs [batchName]
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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

const batchName = process.argv[2] || 'batch1'
const batch = JSON.parse(fs.readFileSync(path.join(__dirname, 'drafts', batchName + '.json'), 'utf8'))
const batchType = batch.type || 'species'

const TYPE_FIELDS = {
  species: {
    query: 'name, slug, scientificName, waterType, mainImage, sizeCm, tankSizeMinL, tempMinC, tempMaxC, phMin, phMax, ghMin, ghMax, diet, temperament, waterZone, schooling, difficulty, publishedAt',
    required: ['name', 'slug', 'waterType', 'sizeCm', 'tankSizeMinL', 'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'ghMin', 'ghMax', 'diet', 'temperament', 'waterZone', 'schooling', 'difficulty', 'publishedAt'],
  },
  invertebrate: {
    query: 'name, slug, scientificName, waterType, group, mainImage, sizeCm, tempMinC, tempMaxC, phMin, phMax, diet, temperament, difficulty, publishedAt',
    required: ['name', 'slug', 'waterType', 'group', 'sizeCm', 'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'diet', 'temperament', 'difficulty', 'publishedAt'],
  },
}

const fields = TYPE_FIELDS[batchType]
if (!fields) throw new Error(`Unsupported batch type: ${batchType}`)

const API = `https://${projectId}.api.sanity.io/v2021-06-07/data/query/${dataset}?query=`
const q = encodeURIComponent(`*[_type == "${batchType}"] { ${fields.query} }`)

const res = await fetch(API + q, { headers: { Authorization: `Bearer ${token}` } })
if (!res.ok) throw new Error(`query: ${res.status} ${await res.text()}`)
const all = (await res.json()).result

const bySci = new Map(all.map((d) => [String(d.scientificName).toLowerCase().replace(/\s+/g, ' ').trim(), d]))

const required = fields.required
const missing = []
const noImage = []
const wrongWater = []
const notFound = []

for (const e of batch.entries) {
  const key = e.scientificName.toLowerCase().replace(/\s+/g, ' ').trim()
  const doc = bySci.get(key)
  if (!doc) {
    notFound.push(e.scientificName)
    continue
  }
  for (const f of required) {
    if (doc[f] === undefined || doc[f] === null || doc[f] === '') missing.push(`${doc.slug?.current || key}.${f}`)
  }
  if (!doc.mainImage?.asset) noImage.push(doc.slug?.current || key)
  if (doc.waterType !== (e.waterType || 'freshwater')) wrongWater.push(doc.slug?.current || key)
}

console.log(`Batch "${batch.batch}" — ${batch.entries.length} entries`)
console.log(`Docs found in Sanity: ${batch.entries.length - notFound.length}/${batch.entries.length}`)
console.log(`NOT FOUND: ${notFound.length ? notFound.join(', ') : 'none'}`)
console.log(`Missing required fields: ${missing.length ? missing.join(', ') : 'none'}`)
console.log(`Missing mainImage: ${noImage.length ? noImage.join(', ') : 'none'}`)
console.log(`Wrong waterType: ${wrongWater.length ? wrongWater.join(', ') : 'none'}`)
console.log(`Total ${batchType} docs in Sanity: ${all.length}`)