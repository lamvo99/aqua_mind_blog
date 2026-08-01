import fs from 'fs'
import { createClient } from '@sanity/client'

const env = fs.readFileSync('.env.local', 'utf8')
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

const probs = await client.fetch(`*[_type == "problem"]{title, "rt": relatedTools[]{slug->{current}}}`)
const withRt = probs.filter((p) => p.rt && p.rt.length)
console.log(`problems with relatedTools: ${withRt.length}/${probs.length}`)
const slugs = new Set()
for (const p of withRt) {
  const s = p.rt.map((t) => t.slug?.current || '(null ref!)').join(', ')
  console.log(`- ${p.title} -> ${s}`)
  p.rt.forEach((t) => t.slug?.current && slugs.add(t.slug.current))
}
console.log('unique tool slugs referenced:', [...slugs].join(', ') || '(none)')

const assets = await client.fetch(`*[_type in ["species","plant","coral","equipment"]]{_type, "name": coalesce(name, scientificName), "img": mainImage.asset._ref, "used": mainImage.asset->.originalFilename}`)
const withImg = assets.filter((a) => a.img)
console.log(`\ndocs with mainImage: ${withImg.length}/${assets.length}`)
const byType = {}
for (const a of withImg) (byType[a._type] = byType[a._type] || []).push(`${a.name} (${a.used})`)
for (const t of Object.keys(byType)) console.log(`\n[${t}] ${byType[t].length}`)
for (const t of Object.keys(byType)) for (const n of byType[t]) console.log(`  - ${n}`)

const cats = await client.fetch(`*[_type == "category"]{_id, title, slug}`)
console.log('\ncategories:', cats.map((c) => `${c.title} (${c.slug?.current})`).join(' | '))
