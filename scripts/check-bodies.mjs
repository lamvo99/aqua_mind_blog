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

const posts = await client.fetch(`*[_type == "post"]{slug, "bodyLen": length(body), "excerpt": excerpt}`)
for (const p of posts) console.log(`${p.slug.current}: bodyLen=${p.bodyLen} excerpt=${(p.excerpt || '').slice(0, 80)}`)

const one = await client.fetch(`*[_type == "post" && slug.current == "keeping-aquarium-fish-where-to-start-a-complete-beginner-s-guide"][0].body`)
console.log('\nfirst 3 blocks of the full post:')
console.log(JSON.stringify((one || []).slice(0, 3), null, 1).slice(0, 1500))
