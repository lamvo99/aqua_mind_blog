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
  apiVersion: '2024-01-01',
  token: getEnv('SANITY_API_TOKEN'),
  useCdn: false,
})

const pending = await client.fetch(
  `*[_type == "post" && (!defined(body) || count(body) == 0)] {
    _id, title, slug, "category": categories[0]->title, status
  }`
)
console.log('PENDING POSTS:')
console.log(JSON.stringify(pending, null, 2))

const categories = await client.fetch(`*[_type == "category"] { _id, title, slug }`)
console.log('\nCATEGORIES:')
console.log(JSON.stringify(categories, null, 2))
