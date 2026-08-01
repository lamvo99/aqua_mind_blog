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

const [posts, tools, collections, authors] = await Promise.all([
  client.fetch(`*[_type == "post"]{slug, isFeatured, "author": author->name, "bodyImgs": count(body[_type == "image"]), "bodyLen": length(body)}`),
  client.fetch(`*[_type == "tool"]{name, slug, toolUrl, category}`),
  client.fetch(`*[_type == "collection"]{title, slug, level, topic, "steps": count(steps), "validSteps": count(steps[] {post->{_id}, tool->{_id}}[]) }`),
  client.fetch(`*[_type == "author"]{_id, name}`),
])

console.log('=== AUTHORS ===')
for (const a of authors) console.log(`- ${a.name} (${a._id})`)

console.log('\n=== POSTS (12) ===')
for (const p of posts) {
  const status = p.bodyLen ? 'content' : 'EMPTY BODY'
  console.log(`- ${p.slug.current} | featured=${p.isFeatured} | author=${p.author || 'MISSING'} | bodyImgs=${p.bodyImgs} | ${status}`)
}

console.log('\n=== TOOLS (expect 8) ===')
for (const t of tools) console.log(`- ${t.slug.current} | ${t.category} | ${t.toolUrl}`)

console.log('\n=== COLLECTIONS (expect 3-4) ===')
for (const c of collections) {
  console.log(`- ${c.slug.current} | ${c.level}/${c.topic} | steps=${c.steps} valid=${c.validSteps}`)
}

const featured = posts.filter((p) => p.isFeatured)
const missingAuthor = posts.filter((p) => !p.author)
const missingImg = posts.filter((p) => p.bodyLen && p.bodyImgs === 0)
const toolSlugs = tools.map((t) => t.slug.current)
const hardcoded = ['aquarium-volume', 'water-change', 'co2', 'dosing', 'pump-flow', 'salt-mixing', 'lighting', 'stocking']
const missingTools = hardcoded.filter((s) => !toolSlugs.includes(s))

console.log('\n=== DOD CHECK ===')
console.log(`featured >=1: ${featured.length >= 1 ? 'PASS' : 'FAIL'} (${featured.length})`)
console.log(`all posts have author: ${missingAuthor.length === 0 ? 'PASS' : 'FAIL ' + missingAuthor.length}`)
console.log(`content posts have >=1 body image: ${missingImg.length === 0 ? 'PASS' : 'FAIL ' + missingImg.length} (content posts without img: ${missingImg.map((p) => p.slug.current).join(', ')})`)
console.log(`8 tool docs match hardcoded slugs: ${missingTools.length === 0 ? 'PASS' : 'FAIL missing: ' + missingTools.join(', ')}`)
console.log(`collections 3-4 with valid steps: ${collections.length >= 3 && collections.length <= 4 && collections.every((c) => c.steps === c.validSteps) ? 'PASS' : 'FAIL'} (${collections.length})`)
