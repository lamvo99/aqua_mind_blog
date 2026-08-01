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

const IMG_PLAN = [
  { postId: '35519b9f-9e99-4482-aded-fdf56e94d638', heading: 'Reading Your Test Kit Like a Pro', file: 'equipment-master-test-kit.jpg', alt: 'Liquid aquarium water test kit with test tubes', caption: 'A liquid test kit is the only honest voice in a new tank.' },
  { postId: '35519b9f-9e99-4482-aded-fdf56e94d638', heading: 'Week 3: The First Fish', file: 'species-poecilia-reticulata.jpg', alt: 'Guppy, one of the first hardy fish for a new tank', caption: 'Hardy first fish like guppies tolerate the learning curve.' },
  { postId: '358ae9b7-d28e-486f-8395-91b8eea2592f', heading: 'Betta Fish: One Fish, Zero Drama', file: 'species-betta-splendens.jpg', alt: 'Colorful male betta fish', caption: 'A betta is a complete centerpiece in a heated small tank.' },
  { postId: '358ae9b7-d28e-486f-8395-91b8eea2592f', heading: 'Corydoras Catfish: The Cute Cleanup Crew', file: 'species-pygmy-corydoras.jpg', alt: 'Pygmy corydoras catfish on the substrate', caption: 'Corydoras patrol the bottom in happy groups of four or more.' },
  { postId: '54ee737f-b6ca-4a29-8711-9a8f7c6c7067', heading: 'The Filter Is a Bacteria Farm, Not a Sieve', file: 'equipment-canister-filter.jpg', alt: 'Aquarium canister filter', caption: 'The real work of a filter happens on the surfaces bacteria live on.' },
  { postId: '54ee737f-b6ca-4a29-8711-9a8f7c6c7067', heading: 'Step 4: You Remove the Nitrate', file: 'plant-anacharis.jpg', alt: 'Anacharis, a fast-growing aquarium plant', caption: 'Water changes and fast-growing plants are the only nitrate removers.' },
  { postId: '57b180a8-2b42-4b56-8677-21d1c88d692d', heading: 'Lighting: Simple Rules, Big Difference', file: 'equipment-led-aquarium-light.jpg', alt: 'LED aquarium light over a tank', caption: 'A timer-controlled LED keeps plant growth steady and algae down.' },
  { postId: '57b180a8-2b42-4b56-8677-21d1c88d692d', heading: 'Step 3: Plant Before You Fill', file: 'plant-anubias-nana-petite.jpg', alt: 'Anubias nana petite, an easy beginner plant', caption: 'Anubias and java fern thrive without rich soil or CO₂.' },
  { postId: '657b9f2f-25df-4dcb-9104-fc1e77f181a4', heading: 'Why Your Filter Is Full of Bacteria (Not Dirt)', file: 'equipment-internal-filter.jpg', alt: 'Internal aquarium filter', caption: 'Your filter is a bacteria house first, a dirt catcher second.' },
  { postId: '657b9f2f-25df-4dcb-9104-fc1e77f181a4', heading: 'Plants: The Silent Third Partner', file: 'plant-java-moss.jpg', alt: 'Java moss growing in an aquarium', caption: 'Plants quietly eat the nitrate that bacteria cannot remove.' },
  { postId: '86ba539d-352a-416c-9a7b-5031d396e7a1', heading: 'The Gravel Vacuum: Your Best Maintenance Tool', file: 'equipment-aquarium-gravel.jpg', alt: 'Aquarium gravel substrate', caption: 'The gravel vacuum lifts waste from the substrate during changes.' },
  { postId: '86ba539d-352a-416c-9a7b-5031d396e7a1', heading: 'What If You Have Hard Water or City Chloramine?', file: 'equipment-ro-di-water-filter.jpg', alt: 'RO/DI water filter for aquarium use', caption: 'Check your water report — chloramine needs the right dechlorinator.' },
  { postId: '8a27f344-c8e7-4dbf-8067-9b2ec2a7ed8f', heading: 'Sponge Filters: The Beginner Champion', file: 'equipment-air-pump.jpg', alt: 'Aquarium air pump for a sponge filter', caption: 'An air pump is all a sponge filter needs to run for years.' },
  { postId: '8a27f344-c8e7-4dbf-8067-9b2ec2a7ed8f', heading: 'Canister Filters: The Powerhouse (and the Pricey One)', file: 'equipment-canister-filter.jpg', alt: 'Canister filter for a larger aquarium', caption: 'Canisters hold the most media — and cost the most to service.' },
  { postId: 'c707b85c-1d22-4bd3-b9cb-2407dc374ea3', heading: 'The Three Forms of Dried Food: Flakes, Pellets, Wafers', file: 'equipment-flake-fish-food.jpg', alt: 'Flake fish food', caption: 'Flakes, pellets and wafers are the everyday diet of most tanks.' },
  { postId: 'c707b85c-1d22-4bd3-b9cb-2407dc374ea3', heading: 'The Golden Feeding Rules', file: 'equipment-automatic-fish-feeder.jpg', alt: 'Automatic fish feeder', caption: 'An automatic feeder beats a well-meaning neighbor when you travel.' },
  { postId: 'd07f41f4-58e1-4794-aaa1-2c6873e1b866', heading: 'The Case For a Nano Tank', file: 'inspiration-small-iwagumi-nano.jpg', alt: 'Small iwagumi style nano aquarium', caption: 'A 20–30L nano tank is a desktop centerpiece that teaches fast.' },
  { postId: 'd07f41f4-58e1-4794-aaa1-2c6873e1b866', heading: 'What Can Live in a 20–30L Tank', file: 'species-danio-margaritatus.jpg', alt: 'Celestial pearl danio, a small nano fish', caption: 'Tiny nano fish like celestial pearl danios shine in small tanks.' },
  { postId: 'd8eebef4-6b25-4895-8e5f-8c6e546305bc', heading: 'How to Test Your Way to the Right Schedule', file: 'equipment-master-test-kit.jpg', alt: 'Master liquid test kit for aquarium water', caption: 'Nitrate tests, not calendars, set your true change schedule.' },
  { postId: 'd8eebef4-6b25-4895-8e5f-8c6e546305bc', heading: 'When You Can Stretch to Every Two Weeks', file: 'plant-vallisneria-spiralis.jpg', alt: 'Vallisneria aquarium plant', caption: 'Heavy plant growth lets some tanks stretch their change interval.' },
  { postId: 'd92ce721-50df-47a6-b88a-ede573a7dc7f', heading: 'The Realistic Total: What a First Tank Costs', file: 'inspiration-low-tech-nature-aquarium.png', alt: 'Low tech planted nature aquarium', caption: 'A beautiful planted tank is achievable for a modest budget.' },
  { postId: 'd92ce721-50df-47a6-b88a-ede573a7dc7f', heading: 'Splurge Here: The Three Non-Negotiables', file: 'equipment-submersible-heater.jpg', alt: 'Submersible aquarium heater', caption: 'A reputable heater is fail-safe — a cheap one can cook your fish.' },
]

const assets = await client.fetch('*[_type=="sanity.imageAsset"]{_id, originalFilename}')
const assetByFile = Object.fromEntries(assets.map((a) => [a.originalFilename, a._id]))

const postsWithBodies = await client.fetch('*[_type=="post" && _id in $ids]{_id, title, body}', {
  ids: [...new Set(IMG_PLAN.map((i) => i.postId))],
})
const bodyByPost = Object.fromEntries(postsWithBodies.map((p) => [p._id, p]))

let imgCount = 0
for (const item of IMG_PLAN) {
  const assetId = assetByFile[item.file]
  if (!assetId) { console.log('MISSING ASSET:', item.file); continue }
  const body = bodyByPost[item.postId]?.body
  if (!body) { console.log('MISSING POST:', item.postId); continue }

  const idx = body.findIndex((b) => b._type === 'block' && b.style === 'h2' && b.children?.map((c) => c.text).join(' ').startsWith(item.heading))
  if (idx === -1) { console.log('HEADING NOT FOUND:', item.postId.slice(0, 8), item.heading); continue }

  const key = `bodyimg-${item.postId.slice(0, 8)}-${item.file.replace(/\.[a-z]+$/i, '')}`
  if (body.some((b) => b._key === key)) { console.log('SKIP (exists):', item.file); continue }

  const imgBlock = {
    _key: key,
    _type: 'image',
    alt: item.alt,
    caption: item.caption,
    asset: { _type: 'reference', _ref: assetId },
  }
  body.splice(idx + 1, 0, imgBlock)
  await client.patch(item.postId).set({ body }).commit()
  imgCount++
  console.log('INSERTED:', item.file, '-> after "', item.heading, '"')
  await sleep(400)
}
console.log('\nBody images inserted:', imgCount)

console.log('\n=== FEATURED ===')
const FEATURED = ['35519b9f-9e99-4482-aded-fdf56e94d638', '54ee737f-b6ca-4a29-8711-9a8f7c6c7067']
const featuredSlugs = await client.fetch('*[_type=="post"]{_id, slug, isFeatured}')
const keepFeatured = featuredSlugs.filter((p) => p.isFeatured).map((p) => p._id)
const targetFeatured = [...new Set([...FEATURED, ...keepFeatured])]
for (const p of featuredSlugs) {
  const should = targetFeatured.includes(p._id)
  if (!!p.isFeatured !== should) {
    await client.patch(p._id).set({ isFeatured: should }).commit()
    console.log('SET isFeatured =', should, p.slug.current)
    await sleep(400)
  }
}

console.log('\n=== COLLECTIONS ===')
const postBySlug = await client.fetch('*[_type=="post"]{_id, slug}')
const pid = (slug) => postBySlug.find((p) => p.slug.current === slug)?. _id

const COL_PLAN = {
  'beginner-s-first-freshwater-aquarium': [
    { title: 'Read the Complete Beginner Guide', post: 'keeping-aquarium-fish-where-to-start-a-complete-beginner-s-guide' },
    { title: 'Set Up Your First 40cm Tank', post: 'setting-up-a-40cm-aquarium-for-beginners-step-by-step' },
    { title: 'Choose Easy First Fish', post: 'the-easiest-aquarium-fish-for-beginners' },
    { title: 'Plan Your Water Change Routine', tool: 'water-change' },
  ],
  'understanding-and-managing-the-nitrogen-cycle': [
    { title: 'Learn How the Cycle Works', post: 'the-nitrogen-cycle-the-foundation-of-every-aquarium' },
    { title: 'Read the Simple Explanation', post: 'the-nitrogen-cycle-explained-simply' },
    { title: 'Find Your Water Change Schedule', post: 'how-often-should-you-change-aquarium-water' },
  ],
  'planted-tank-essentials': [
    { title: 'Set Up a Planted Tank the Right Way', post: 'setting-up-a-40cm-aquarium-for-beginners-step-by-step' },
    { title: 'Set Lighting Duration & Intensity', tool: 'lighting' },
    { title: 'Plan Fertilizer Dosing', tool: 'dosing' },
    { title: 'Tune CO₂ Injection', tool: 'co2' },
  ],
}

const cols = await client.fetch('*[_type=="collection"]{_id, slug}')
const toolBySlug = await client.fetch('*[_type=="tool"]{_id, slug}')

for (const [colSlug, steps] of Object.entries(COL_PLAN)) {
  const col = cols.find((c) => c.slug.current === colSlug)
  if (!col) { console.log('COLLECTION NOT FOUND:', colSlug); continue }
  const newSteps = steps.map((s, i) => {
    const step = { _key: `step-${colSlug.slice(0, 8)}-${i + 1}`, title: s.title }
    if (s.post) {
      const id = pid(s.post)
      if (!id) { console.log('POST NOT FOUND:', s.post); return null }
      step.post = { _type: 'reference', _ref: id }
    }
    if (s.tool) {
      const id = toolBySlug.find((t) => t.slug.current === s.tool)?._id
      if (!id) { console.log('TOOL NOT FOUND:', s.tool); return null }
      step.tool = { _type: 'reference', _ref: id }
    }
    return step
  }).filter(Boolean)
  if (newSteps.length !== steps.length) { console.log('SKIP (missing refs):', colSlug); continue }
  await client.patch(col._id).set({ steps: newSteps }).commit()
  console.log('UPDATED:', colSlug, '(' + newSteps.length + ' steps)')
  await sleep(400)
}

console.log('\nDone.')
