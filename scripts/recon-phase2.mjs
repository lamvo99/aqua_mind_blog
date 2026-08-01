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

const posts = await client.fetch(`*[_type == "post"] | order(publishedAt desc) {
  _id, title, slug, excerpt, publishedAt, status, isFeatured,
  "author": author->name, "categories": categories[]->slug.current,
  "mainImage": mainImage.asset._ref,
  "bodyImages": body[_type == "image"].asset._ref,
  "bodyBlocks": length(body[_type == "block"]),
}`)
console.log('=== POSTS ===')
for (const p of posts) {
  console.log(`- ${p.slug?.current} | featured=${p.isFeatured} | author=${p.author ?? "NULL"} | cat=[${(p.categories || []).join(",")}] | img=${p.mainImage ? "Y" : "N"} | bodyImgs=${(p.bodyImages || []).length} | blocks=${p.bodyBlocks} | len=${p.bodyLength} | ${p.status}`)
}

const authors = await client.fetch(`*[_type == "author"]{_id, name, slug}`)
console.log('\n=== AUTHORS ===')
console.log(JSON.stringify(authors, null, 1))

const cats = await client.fetch(`*[_type == "category"]{_id, title, slug}`)
console.log('\n=== CATEGORIES ===')
console.log(cats.map((c) => `${c.slug?.current}:${c.title}`).join(' | '))

const problems = await client.fetch(`*[_type == "problem"]{title, slug, "tools": relatedTools[]->{slug}.slug.current, "toolsCount": count(relatedTools)}`)
console.log('\n=== PROBLEMS relatedTools ===')
for (const p of problems) console.log(`- ${p.slug?.current} | tools=[${(p.tools || []).join(",")}]`)

const tools = await client.fetch(`*[_type == "tool"]{name, slug, toolUrl, category}`)
console.log('\n=== EXISTING TOOL DOCS ===')
console.log(tools.length ? JSON.stringify(tools, null, 1) : '(none)')

const collections = await client.fetch(`*[_type == "collection"]{title, slug, level, topic, "stepsCount": length(steps)}`)
console.log('\n=== COLLECTIONS ===')
console.log(collections.length ? JSON.stringify(collections, null, 1) : '(none)')
