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

const tools = [
  {
    slug: 'aquarium-volume', name: 'Aquarium Volume Calculator',
    description: 'Calculate the exact water volume of your aquarium in liters and gallons — essential for dosing, stocking and water change planning.',
    toolUrl: '/tools/aquarium-volume', category: 'Volume',
    relatedSlugs: ['keeping-aquarium-fish-where-to-start-a-complete-beginner-s-guide', 'setting-up-a-40cm-aquarium-for-beginners-step-by-step'],
  },
  {
    slug: 'water-change', name: 'Water Change Calculator',
    description: 'Work out how much water to remove and replace for a safe partial water change, with a schedule that keeps your nitrogen cycle stable.',
    toolUrl: '/tools/water-change', category: 'Water Change',
    relatedSlugs: ['how-to-change-aquarium-water-without-stressing-fish', 'how-often-should-you-change-aquarium-water'],
  },
  {
    slug: 'co2', name: 'CO₂ Dosing Calculator',
    description: 'Estimate CO₂ injection rate and drop-checker targets for a planted tank based on tank volume and plant demand.',
    toolUrl: '/tools/co2', category: 'CO₂',
    relatedSlugs: ['the-nitrogen-cycle-the-foundation-of-every-aquarium', 'the-nitrogen-cycle-explained-simply'],
  },
  {
    slug: 'dosing', name: 'Fertilizer Dosing Calculator',
    description: 'Plan a weekly micro and macro nutrient dosing schedule for planted aquariums from liquid fertilizer concentrations.',
    toolUrl: '/tools/dosing', category: 'Dosing',
    relatedSlugs: ['setting-up-a-40cm-aquarium-for-beginners-step-by-step', 'keeping-aquarium-fish-where-to-start-a-complete-beginner-s-guide'],
  },
  {
    slug: 'pump-flow', name: 'Pump & Flow Rate Calculator',
    description: 'Match filter and circulation pump flow to your tank volume, aiming for the right turnover rate for freshwater or reef systems.',
    toolUrl: '/tools/pump-flow', category: 'Pump Flow',
    relatedSlugs: ['different-types-of-aquarium-filters-pros-and-cons', 'keeping-aquarium-fish-where-to-start-a-complete-beginner-s-guide'],
  },
  {
    slug: 'salt-mixing', name: 'Salt Mixing Calculator',
    description: 'Calculate the salt mix amount needed to reach your target salinity for marine and reef aquariums.',
    toolUrl: '/tools/salt-mixing', category: 'Salt Mixing',
    relatedSlugs: ['keeping-aquarium-fish-where-to-start-a-complete-beginner-s-guide'],
  },
  {
    slug: 'lighting', name: 'Lighting Duration & Intensity Guide',
    description: 'Find a starting point for light intensity and photoperiod based on your tank depth and whether you keep plants or corals.',
    toolUrl: '/tools/lighting', category: 'Lighting',
    relatedSlugs: ['setting-up-a-40cm-aquarium-for-beginners-step-by-step'],
  },
  {
    slug: 'stocking', name: 'Aquarium Stocking Calculator',
    description: 'Estimate a safe fish load for your tank size using the 1 inch per gallon rule and tank-size minimums per species.',
    toolUrl: '/tools/stocking', category: 'Stocking',
    relatedSlugs: ['the-easiest-aquarium-fish-for-beginners', 'keeping-aquarium-fish-where-to-start-a-complete-beginner-s-guide'],
  },
  {
    slug: 'setup-planner', name: 'Aquarium Setup Planner',
    description: 'Walk through every step of setting up a new aquarium — tank, equipment, cycling and first fish — with a personalized checklist.',
    toolUrl: '/setup-planner', category: 'Planner',
    relatedSlugs: ['keeping-aquarium-fish-where-to-start-a-complete-beginner-s-guide', 'setting-up-a-40cm-aquarium-for-beginners-step-by-step'],
  },
]

const posts = await client.fetch(`*[_type == "post"]{_id, slug}`)
const bySlug = Object.fromEntries(posts.map((p) => [p.slug?.current, p._id]))

const report = { created: [], skipped: [] }

for (const t of tools) {
  const existing = await client.fetch(`*[_type == "tool" && slug.current == $s][0]`, { s: t.slug })
  if (existing) {
    report.skipped.push({ slug: t.slug, reason: 'already exists' })
    continue
  }
  const relatedPosts = (t.relatedSlugs || [])
    .map((s) => bySlug[s])
    .filter(Boolean)
    .map((ref) => ({ _type: 'reference', _ref: ref }))
  const doc = await client.create({
    _type: 'tool',
    name: t.name,
    slug: { _type: 'slug', current: t.slug },
    description: t.description,
    toolUrl: t.toolUrl,
    category: t.category,
    relatedPosts,
  })
  report.created.push({ slug: t.slug, id: doc._id, relatedPosts: relatedPosts.length })
}

console.log(JSON.stringify(report, null, 2))
