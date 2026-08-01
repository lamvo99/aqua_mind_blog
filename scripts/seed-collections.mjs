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

const [posts, tools, images] = await Promise.all([
  client.fetch(`*[_type == "post"]{_id, slug, title}`),
  client.fetch(`*[_type == "tool"]{_id, slug, name}`),
  client.fetch(`*[_type in ["species","plant","coral","equipment"] && defined(mainImage)]{"file": mainImage.asset->.originalFilename, "assetId": mainImage.asset._ref}`),
])

const postBySlug = Object.fromEntries(posts.map((p) => [p.slug?.current, p]))
const toolBySlug = Object.fromEntries(tools.map((t) => [t.slug?.current, t]))
const assetByFile = Object.fromEntries(images.map((i) => [i.file, i.assetId]))

const ref = (type, doc) => ({ _type: 'reference', _ref: doc._id })

const collections = [
  {
    slug: 'beginner-s-first-freshwater-aquarium',
    title: "Beginner's First Freshwater Aquarium",
    description: 'Follow this path from zero to a healthy first tank: choosing your setup, picking fish, and keeping the water safe.',
    level: 'Beginner', topic: 'Freshwater',
    image: 'species-paracheirodon-innesi.jpg',
    steps: [
      { title: 'Read the Complete Beginner Guide', estimatedTime: '30 min', post: 'keeping-aquarium-fish-where-to-start-a-complete-beginner-s-guide' },
      { title: 'Size Your Tank Correctly', estimatedTime: '5 min', tool: 'aquarium-volume' },
      { title: 'Choose Compatible Fish', estimatedTime: '10 min', tool: 'stocking' },
      { title: 'Plan Your Water Change Routine', estimatedTime: '5 min', tool: 'water-change' },
    ],
  },
  {
    slug: 'understanding-and-managing-the-nitrogen-cycle',
    title: 'Understanding & Managing the Nitrogen Cycle',
    description: 'Master the most important concept in aquariums: how the nitrogen cycle works, how to cycle a tank, and how to keep it stable.',
    level: 'Beginner', topic: 'Freshwater',
    image: 'equipment-master-test-kit.jpg',
    steps: [
      { title: 'Learn How the Cycle Works', estimatedTime: '20 min', post: 'keeping-aquarium-fish-where-to-start-a-complete-beginner-s-guide' },
      { title: 'Dose CO₂ for Planted Tanks', estimatedTime: '5 min', tool: 'co2' },
      { title: 'Schedule Safe Water Changes', estimatedTime: '5 min', tool: 'water-change' },
    ],
  },
  {
    slug: 'planted-tank-essentials',
    title: 'Planted Tank Essentials',
    description: 'Set up a lush planted aquarium: lighting, fertilization and CO₂ tuned to your tank volume.',
    level: 'Intermediate', topic: 'Planted',
    image: 'plant-java-moss.jpg',
    steps: [
      { title: 'Get the Basics First', estimatedTime: '30 min', post: 'keeping-aquarium-fish-where-to-start-a-complete-beginner-s-guide' },
      { title: 'Set Lighting Duration & Intensity', estimatedTime: '5 min', tool: 'lighting' },
      { title: 'Plan Fertilizer Dosing', estimatedTime: '10 min', tool: 'dosing' },
      { title: 'Tune CO₂ Injection', estimatedTime: '10 min', tool: 'co2' },
    ],
  },
  {
    slug: 'marine-and-reef-fundamentals',
    title: 'Marine & Reef Fundamentals',
    description: 'The essentials for starting saltwater: mixing salt, water flow and lighting for a healthy reef.',
    level: 'Beginner', topic: 'Marine',
    image: 'coral-galaxea.jpg',
    steps: [
      { title: 'Learn the Basics Before Saltwater', estimatedTime: '30 min', post: 'keeping-aquarium-fish-where-to-start-a-complete-beginner-s-guide' },
      { title: 'Mix Salt to the Right Salinity', estimatedTime: '10 min', tool: 'salt-mixing' },
      { title: 'Match Flow to Your Tank', estimatedTime: '5 min', tool: 'pump-flow' },
      { title: 'Set Up Reef Lighting', estimatedTime: '5 min', tool: 'lighting' },
    ],
  },
]

const report = { created: [], skipped: [], brokenRefs: [] }

for (const c of collections) {
  const existing = await client.fetch(`*[_type == "collection" && slug.current == $s][0]`, { s: c.slug })
  if (existing) {
    report.skipped.push({ slug: c.slug, reason: 'already exists' })
    continue
  }
  const steps = []
  for (const s of c.steps) {
    let post = null
    let tool = null
    if (s.post) {
      post = postBySlug[s.post]
      if (!post) report.brokenRefs.push({ collection: c.slug, post: s.post })
    }
    if (s.tool) {
      tool = toolBySlug[s.tool]
      if (!tool) report.brokenRefs.push({ collection: c.slug, tool: s.tool })
    }
    steps.push({
      _type: 'object',
      _key: `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: s.title,
      estimatedTime: s.estimatedTime,
      ...(post ? { post: ref('post', post) } : {}),
      ...(tool ? { tool: ref('tool', tool) } : {}),
    })
  }
  const doc = await client.create({
    _type: 'collection',
    title: c.title,
    slug: { _type: 'slug', current: c.slug },
    description: c.description,
    level: c.level,
    topic: c.topic,
    steps,
    ...(c.image && assetByFile[c.image]
      ? { mainImage: { _type: 'image', asset: { _type: 'reference', _ref: assetByFile[c.image] } } }
      : {}),
  })
  report.created.push({ slug: c.slug, id: doc._id, steps: steps.length, hasImage: !!doc.mainImage })
}

console.log(JSON.stringify(report, null, 2))
