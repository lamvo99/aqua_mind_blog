import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@sanity/client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
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

const counts = await client.fetch(`{
  "species": count(*[_type == "species"]),
  "plant": count(*[_type == "plant"]),
  "coral": count(*[_type == "coral"]),
  "equipment": count(*[_type == "equipment"]),
  "problem": count(*[_type == "problem"]),
  "inspiration": count(*[_type == "inspiration"])
}`)
console.log(JSON.stringify(counts, null, 2))
