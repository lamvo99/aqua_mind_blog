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

const AUTHOR_ID = '423346a3-a608-4433-8cbf-85d2a8fabb9d'
const FEATURED_SLUG = 'keeping-aquarium-fish-where-to-start-a-complete-beginner-s-guide'

const posts = await client.fetch(`*[_type == "post"]{_id, slug, isFeatured, author}`)

const report = { featured: [], authorAssigned: [] }

for (const p of posts) {
  if (p.slug?.current === FEATURED_SLUG && !p.isFeatured) {
    await client.patch(p._id).set({ isFeatured: true }).commit()
    report.featured.push(p.slug.current)
  }
  if (!p.author) {
    await client.patch(p._id).set({ author: { _type: 'reference', _ref: AUTHOR_ID } }).commit()
    report.authorAssigned.push(p.slug.current)
  }
}

console.log(JSON.stringify(report, null, 2))
