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
  _id, title, slug, "body": body[]{
    _type,
    style,
    "text": coalesce(children[].text, ""),
    "asset": asset._ref
  }
}`)

for (const p of posts) {
  console.log(`\n### ${p.slug?.current} (${p.title})`)
  const blocks = p.body || []
  for (const b of blocks) {
    if (b._type === 'block') {
      const t = Array.isArray(b.text) ? b.text[0] || '' : String(b.text || '').trim()
      if (b.style === 'h2' || b.style === 'h3' || b.style === 'h1') console.log(`  [${b.style}] ${t}`)
      else if (b.style === 'code') console.log('  [code]')
    } else if (b._type === 'image') {
      console.log(`  [img] ${b.asset}`)
    }
  }
}
