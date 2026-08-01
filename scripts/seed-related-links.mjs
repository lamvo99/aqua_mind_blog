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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const P = {
  keeping: 'keeping-aquarium-fish-where-to-start-a-complete-beginner-s-guide',
  days30: 'your-first-30-days-with-an-aquarium-a-beginner-s-journal',
  easiest: 'the-easiest-aquarium-fish-for-beginners',
  cycle: 'the-nitrogen-cycle-the-foundation-of-every-aquarium',
  cm40: 'setting-up-a-40cm-aquarium-for-beginners-step-by-step',
  cycle2: 'the-nitrogen-cycle-explained-simply',
  wchange: 'how-to-change-aquarium-water-without-stressing-fish',
  filters: 'different-types-of-aquarium-filters-pros-and-cons',
  food: 'aquarium-fish-food-types-and-how-to-use-them',
  nano: '20-30l-nano-aquarium-the-perfect-choice-for-beginners',
  freq: 'how-often-should-you-change-aquarium-water',
  budget: 'budgeting-for-your-first-aquarium-how-much-is-enough',
}

const POSTS = {
  species: {
    'poecilia-reticulata': [P.easiest, P.keeping],
    'xiphophorus-hellerii': [P.easiest],
    'trichogaster-lalius': [P.easiest],
    'trichogaster-chuna': [P.easiest],
    'betta-splendens': [P.easiest, P.nano],
    'betta-smaragdina': [P.easiest],
    'gymnocorymbus-ternetzi': [P.easiest],
    'paracheirodon-innesi': [P.easiest],
    'paracheirodon-axelrodi': [P.easiest],
    'trigonostigma-heteromorpha': [P.easiest],
    'danio-rerio': [P.easiest, P.cycle2],
    'corydoras-pygmaeus': [P.easiest, P.nano],
    'corydoras-paleatus': [P.easiest],
    'puntius-titteya': [P.easiest],
    'otocinclus-affinis': [P.easiest, P.cm40],
    'carassius-auratus': [P.freq, P.wchange],
    'boraras-brigittae': [P.nano],
    'microdevario-kubotai': [P.nano],
    'danio-margaritatus': [P.nano],
    'pangio-kuhlii': [P.food, P.nano],
    'ancistrus-cf-cirrhosus': [P.food, P.cm40],
    'hypostomus-plecostomus': [P.food],
    'panaqolus-maccus': [P.food, P.nano],
    'chromobotia-macracanthus': [P.food, P.freq],
    'pterophyllum-scalare': [P.keeping, P.cm40],
    'mikrogeophagus-ramirezi': [P.keeping],
    'apistogramma-cacatuoides': [P.keeping],
    'aphyosemion-australe': [P.days30],
    'gasteropelecus-sternicla': [P.keeping],
    'hemigrammus-rhodostomus': [P.easiest],
    'nannostomus-beckfordi': [P.nano],
    'melanotaenia-boesemani': [P.keeping],
    'garra-rufa': [P.food],
    'kubotai': null,
  },
  plant: {
    'anubias-barteri': [P.cm40],
    'anubias-nana-petite': [P.cm40, P.nano],
    'java-fern': [P.cm40],
    'java-moss': [P.cm40, P.nano],
    'amazon-sword': [P.cm40],
    'cryptocoryne-wendtii': [P.cm40],
    'cryptocoryne-balansae': [P.cm40],
    'cryptocoryne-beckettii': [P.nano],
    'vallisneria-spiralis': [P.freq, P.cm40],
    'water-wisteria': [P.cm40, P.cycle2],
    'anacharis': [P.cycle2, P.freq],
    'hornwort': [P.cycle2, P.cm40],
    'cabomba-caroliniana': [P.cm40, P.cycle2],
    'ambulia': [P.cm40, P.cycle2],
    'dwarf-sagittaria': [P.nano, P.cm40],
    'bucephalandra': [P.nano],
    'marsilea-hirsuta': [P.nano],
    'monte-carlo': [P.nano],
    'dwarf-hairgrass': [P.nano],
    'pygmy-chain-sword': [P.nano],
    'hydrocotyle-tripartita': [P.nano],
    'staurogyne-repens': [P.nano],
  },
  equipment: {
    'canister-filter': [P.filters],
    'hang-on-back-filter': [P.filters, P.cm40],
    'internal-filter': [P.filters],
    'sponge-filter': [P.filters, P.nano],
    'air-pump': [P.filters],
    'air-stone': [P.filters],
    'master-test-kit': [P.cycle, P.wchange],
    'water-test-strips': [P.cycle],
    'led-aquarium-light': [P.cm40],
    'submersible-heater': [P.cm40, P.budget],
    'aquarium-gravel': [P.cm40, P.budget],
    'automatic-fish-feeder': [P.food],
    'flake-fish-food': [P.food],
    'ro-di-water-filter': [P.wchange],
  },
  problem: {
    'fin-rot': [P.wchange, P.days30],
    'old-tank-syndrome': [P.freq, P.wchange],
    'hair-algae': [P.freq, P.wchange],
    'staghorn-algae': [P.freq],
    'black-beard-algae': [P.freq, P.wchange],
    'brown-diatom-algae': [P.days30, P.cm40],
    'green-water': [P.freq, P.cycle],
    'cloudy-water': [P.days30, P.cycle],
    'cyanobacteria': [P.cycle, P.freq],
    'high-ammonia': [P.cycle, P.wchange],
    'fish-gasping-surface': [P.filters, P.cycle],
    'fish-hiding': [P.days30, P.easiest],
    'white-spot-disease': [P.wchange],
    'dropsy': [P.wchange],
    'temperature-shock': [P.wchange, P.cm40],
    'plant-nutrient-deficiency': [P.cm40, P.cycle2],
    'plant-leaves-melting': [P.cm40],
    'filter-crash': [P.cycle, P.filters],
    'low-filter-flow': [P.filters],
  },
  inspiration: {
    'small-iwagumi-nano': [P.nano],
    'nano-paludarium': [P.nano],
    'low-tech-nature-aquarium': [P.cm40, P.keeping],
    'planted-community-aquarium': [P.cm40],
    'jungle-biotope': [P.cm40],
    'amazon-biotope': [P.cm40, P.keeping],
    'classic-iwagumi': [P.cm40],
    'mountain-valley-scape': [P.cm40],
    'dutch-planted-tank': [P.cm40],
  },
}

const PROBLEM_TOOLS = {
  'old-tank-syndrome': ['water-change'],
  'cloudy-water': ['water-change'],
  'high-ammonia': ['water-change'],
  'cyanobacteria': ['water-change'],
  'temperature-shock': ['water-change'],
  'brown-diatom-algae': ['water-change'],
  'hair-algae': ['lighting'],
  'staghorn-algae': ['lighting'],
  'black-beard-algae': ['lighting'],
  'green-water': ['lighting'],
  'fin-rot': ['water-change'],
  'dropsy': ['water-change'],
  'white-spot-disease': ['water-change'],
  'fish-gasping-surface': ['water-change'],
  'fish-hiding': ['stocking'],
  'plant-nutrient-deficiency': ['dosing'],
  'plant-leaves-melting': ['dosing'],
}

const posts = await client.fetch('*[_type=="post"]{_id, slug}')
const tools = await client.fetch('*[_type=="tool"]{_id, slug}')
const postId = (slug) => posts.find((p) => p.slug.current === slug)?._id
const toolId = (slug) => tools.find((t) => t.slug.current === slug)?._id

let updated = 0
for (const [type, map] of Object.entries(POSTS)) {
  const slugs = Object.keys(map).filter((s) => map[s])
  const items = await client.fetch(`*[_type==$type && slug.current in $slugs]{_id, slug}`, { type, slugs })
  for (const item of items) {
    const refs = map[item.slug.current].map((s) => postId(s)).filter(Boolean)
    if (refs.length === 0) continue
    await client.patch(item._id).set({
      relatedPosts: refs.map((_ref) => ({ _type: 'reference', _ref })),
    }).commit()
    updated++
    await sleep(300)
  }
}

for (const [slug, toolSlugs] of Object.entries(PROBLEM_TOOLS)) {
  const item = (await client.fetch('*[_type=="problem" && slug.current==$slug][0]{_id}', { slug }))
  if (!item) continue
  const refs = toolSlugs.map((s) => toolId(s)).filter(Boolean)
  if (refs.length === 0) continue
  await client.patch(item._id).set({
    relatedTools: refs.map((_ref) => ({ _type: 'reference', _ref })),
  }).commit()
  updated++
  await sleep(300)
}

console.log('Updated items:', updated)
