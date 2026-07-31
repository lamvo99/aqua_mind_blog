/**
 * Seed additions: +15 species, +10 plants, +6 corals, +8 equipment, +8 problems, +5 inspiration.
 *
 * Rules enforced:
 *  - Dedupe by scientific name / product name against existing docs.
 *  - Every doc (except problems — schema has no image field) requires a
 *    high-confidence image from Wikimedia Commons BEFORE creation.
 *  - Batches of 8 creates; retry each failed item up to 2 times.
 *  - Items without a matching image are skipped and logged.
 *
 * Usage: node scripts/seed-additions.mjs
 */

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

const UA = 'AquaMindBackfill/1.0 (aquamind.life; xingzhuang5201314@gmail.com)'
const PUBLISHED = '2026-07-31T00:00:00Z'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const slug = (s) => ({ _type: 'slug', current: s })
const ptList = (items) => items.map((text, i) => ({
  _type: 'block', _key: `li${i}`, style: 'normal', listItem: 'bullet', level: 1,
  children: [{ _type: 'span', text, marks: [] }],
}))
const toSlug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

/* ------------------------------------------------------------------ */
/* Commons image search                                                 */
/* ------------------------------------------------------------------ */

async function commonsSearch(query) {
  const url = new URL('https://commons.wikimedia.org/w/api.php')
  url.search = new URLSearchParams({
    action: 'query', generator: 'search', gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: '6', gsrlimit: '10', prop: 'imageinfo', iiprop: 'url|mime|size',
    iiurlwidth: '1600', format: 'json', origin: '*',
  })
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error('Commons search failed: ' + res.status)
  const json = await res.json()
  return Object.values(json.query?.pages || {})
    .filter((p) => p.imageinfo?.[0])
    .map((p) => ({ title: p.title.replace(/^File:/, ''), thumburl: p.imageinfo[0].thumburl, mime: p.imageinfo[0].mime, size: p.imageinfo[0].size || 0 }))
    .filter((f) => f.mime.startsWith('image/') && f.mime !== 'image/svg+xml')
}

const norm = (s) => s.toLowerCase().replace(/[_\s]+/g, ' ').trim()

async function findImage(queries) {
  for (const { q, kw, skip = [] } of queries) {
    let files = []
    try { files = await commonsSearch(q) } catch { continue }
    const hits = files.filter((f) => {
      if (!norm(kw).split(/\s+/).every((w) => norm(f.title).includes(w))) return false
      return !skip.some((s) => norm(f.title).includes(norm(s)))
    })
    if (hits.length) {
      const best = hits.sort((a, b) => b.size - a.size)[0]
      return { title: best.title, url: best.thumburl }
    }
    await sleep(250)
  }
  return null
}

/* ------------------------------------------------------------------ */
/* Curated search plans (kw must appear in the Commons file title)     */
/* ------------------------------------------------------------------ */

const SPECIES_OVERRIDES = {
  'Honey Gourami': [{ q: 'Trichogaster chuna', kw: 'colisa chuna' }, { q: 'Colisa chuna', kw: 'colisa chuna' }],
  'Dubois\u2019 Tropheus': [{ q: 'Tropheus duboisi', kw: 'tropheus duboisi', skip: ['natural history museum', 'panoramio'] }],
  'Chili Rasbora': [{ q: 'Boraras brigittae', kw: 'boraras brigittae', skip: ['nano-aquarium'] }],
  'Red Garra': [{ q: 'Garra rufa', kw: 'garra rufa', skip: ['pedicure'] }],
  'German Blue Ram': [{ q: 'Mikrogeophagus ramirezi', kw: 'mikrogeophagus ramirezi' }, { q: 'Microgeophagus ramirezi', kw: 'ramirezi' }],
}

const EQUIPMENT_OVERRIDES = {
  'Protein Skimmer': [{ q: 'protein skimmer', kw: 'protein skimmer' }],
  'Automatic Fish Feeder': [{ q: 'automatic fish feeder', kw: 'automatic fish feeder' }],
  'RO/DI Water Filter': [{ q: 'Rodi', kw: 'rodi' }],
  'Air Stone': [{ q: 'air stone aquarium', kw: 'air stone' }],
  'Aquarium Gravel': [{ q: 'aquarium gravel', kw: 'aquarium gravel' }],
  'CO\u2082 Cylinder': [{ q: 'CO2 cylinder', kw: 'co2' }],
  'Water Test Strips': [{ q: 'water testing strips', kw: 'test strips' }],
  'Flake Fish Food': [{ q: 'TetraMin fish food', kw: 'tetramin' }],
}

const INSPIRATION_OVERRIDES = {
  'Small Iwagumi Nano': [{ q: 'nano aquarium aquascape', kw: 'nano aquascape' }],
  'Amazon Biotope': [{ q: 'biotope aquarium', kw: 'biotope aquarium' }],
  'Reef Nano': [{ q: 'nano reef', kw: 'nano reef' }],
  'Mountain Valley Scape': [{ q: 'aquascaping', kw: 'aquascaping' }],
  'Planted Community Aquarium': [{ q: 'planted aquarium', kw: 'planted aquarium', skip: ['planted nano'] }],
}

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const speciesData = [
  { sci: 'Corydoras pygmaeus', common: 'Pygmy Corydoras', family: 'Callichthyidae', origin: 'Rio Madeira basin, Brazil',
    sizeCm: 2.5, tankSizeMinL: 40, tempMinC: 22, tempMaxC: 26, phMin: 5.5, phMax: 7.5, ghMin: 2, ghMax: 12,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Bottom', schooling: 'School of 8 or more.', difficulty: 'Beginner' },
  { sci: 'Trichogaster chuna', common: 'Honey Gourami', family: 'Osphronemidae', origin: 'India and Bangladesh',
    sizeCm: 5, tankSizeMinL: 40, tempMinC: 24, tempMaxC: 28, phMin: 6, phMax: 7.5, ghMin: 4, ghMax: 12,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Top', schooling: 'Pairs; one male per tank.', difficulty: 'Beginner' },
  { sci: 'Microdevario kubotai', common: 'Kubotai Rasbora', family: 'Danionidae', origin: 'Tenasserim region, Myanmar',
    sizeCm: 2.2, tankSizeMinL: 40, tempMinC: 22, tempMaxC: 27, phMin: 6.5, phMax: 7.5, ghMin: 2, ghMax: 10,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'School of 8 or more.', difficulty: 'Beginner' },
  { sci: 'Boraras brigittae', common: 'Chili Rasbora', family: 'Danionidae', origin: 'Southwest Borneo, Indonesia',
    sizeCm: 2, tankSizeMinL: 20, tempMinC: 23, tempMaxC: 27, phMin: 4, phMax: 7, ghMin: 1, ghMax: 8,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'School of 8 or more.', difficulty: 'Intermediate' },
  { sci: 'Garra rufa', common: 'Red Garra', family: 'Cyprinidae', origin: 'Middle East and Turkey',
    sizeCm: 12, tankSizeMinL: 200, tempMinC: 20, tempMaxC: 27, phMin: 6.5, phMax: 8, ghMin: 5, ghMax: 19,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Bottom', schooling: 'Groups of 5 or more.', difficulty: 'Beginner' },
  { sci: 'Mikrogeophagus ramirezi', common: 'German Blue Ram', family: 'Cichlidae', origin: 'Venezuela and Colombia',
    sizeCm: 6, tankSizeMinL: 60, tempMinC: 26, tempMaxC: 29, phMin: 5.5, phMax: 7, ghMin: 1, ghMax: 8,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Bottom', schooling: 'Pairs; give them a territory.', difficulty: 'Intermediate' },
  { sci: 'Nannostomus beckfordi', common: 'Golden Pencilfish', family: 'Lebiasinidae', origin: 'Guianas and Amazon basin',
    sizeCm: 6, tankSizeMinL: 40, tempMinC: 24, tempMaxC: 28, phMin: 5.5, phMax: 7.5, ghMin: 2, ghMax: 10,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Top', schooling: 'School of 6 or more.', difficulty: 'Intermediate' },
  { sci: 'Hemigrammus rhodostomus', common: 'Rummynose Tetra', family: 'Characidae', origin: 'Lower Amazon and Rio Negro',
    sizeCm: 5, tankSizeMinL: 60, tempMinC: 24, tempMaxC: 28, phMin: 5.5, phMax: 7.5, ghMin: 2, ghMax: 10,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'School of 8 or more.', difficulty: 'Intermediate' },
  { sci: 'Gasteropelecus sternicla', common: 'Silver Hatchetfish', family: 'Gasteropelecidae', origin: 'Amazon basin, South America',
    sizeCm: 6.5, tankSizeMinL: 80, tempMinC: 24, tempMaxC: 28, phMin: 6, phMax: 7.5, ghMin: 4, ghMax: 12,
    diet: 'Carnivore', temperament: 'Peaceful', waterZone: 'Top', schooling: 'Group of 6 or more; cover the tank!', difficulty: 'Intermediate' },
  { sci: 'Betta smaragdina', common: 'Emerald Betta', family: 'Osphronemidae', origin: 'Mekong basin, Southeast Asia',
    sizeCm: 7, tankSizeMinL: 40, tempMinC: 24, tempMaxC: 28, phMin: 6, phMax: 7.5, ghMin: 2, ghMax: 10,
    diet: 'Carnivore', temperament: 'Peaceful', waterZone: 'Top', schooling: 'Solitary; one male per tank.', difficulty: 'Beginner' },
  { sci: 'Panaqolus maccus', common: 'Clown Pleco', family: 'Loricariidae', origin: 'Rio Orinoco basin, Venezuela',
    sizeCm: 10, tankSizeMinL: 60, tempMinC: 24, tempMaxC: 28, phMin: 6.5, phMax: 7.5, ghMin: 4, ghMax: 15,
    diet: 'Herbivore', temperament: 'Peaceful', waterZone: 'Bottom', schooling: 'Solitary or a pair.', difficulty: 'Beginner' },
  { sci: 'Tropheus duboisi', common: 'Dubois\u2019 Tropheus', family: 'Cichlidae', origin: 'Lake Tanganyika, Africa',
    sizeCm: 12, tankSizeMinL: 300, tempMinC: 24, tempMaxC: 28, phMin: 7.8, phMax: 8.6, ghMin: 12, ghMax: 25,
    diet: 'Herbivore', temperament: 'Aggressive', waterZone: 'Middle', schooling: 'Overstocked groups to spread aggression.', difficulty: 'Expert' },
  { sci: 'Centropyge loricula', common: 'Flame Angelfish', family: 'Pomacanthidae', origin: 'Indo-Pacific reefs',
    sizeCm: 12, tankSizeMinL: 200, tempMinC: 24, tempMaxC: 27, phMin: 8.1, phMax: 8.4, ghMin: 8, ghMax: 12,
    diet: 'Omnivore', temperament: 'Semi-aggressive', waterZone: 'All levels', schooling: 'One per tank, or a bonded pair.', difficulty: 'Intermediate' },
  { sci: 'Amphiprion percula', common: 'Percula Clownfish', family: 'Pomacentridae', origin: 'Melanesia and northern Australia',
    sizeCm: 8, tankSizeMinL: 100, tempMinC: 24, tempMaxC: 28, phMin: 8, phMax: 8.4, ghMin: 8, ghMax: 12,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'Pairs strongly bonded.', difficulty: 'Beginner' },
  { sci: 'Pterapogon kauderni', common: 'Banggai Cardinalfish', family: 'Apogonidae', origin: 'Banggai Islands, Indonesia',
    sizeCm: 8, tankSizeMinL: 100, tempMinC: 24, tempMaxC: 28, phMin: 8, phMax: 8.4, ghMin: 8, ghMax: 12,
    diet: 'Carnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'Small groups of 3\u20135.', difficulty: 'Intermediate' },
]

const plantData = [
  { name: 'Cryptocoryne beckettii', scientificName: 'Cryptocoryne beckettii', light: 'Low-Medium', co2: 'Low', growth: 'Medium', difficulty: 'Beginner', placement: 'Midground', tempMinC: 22, tempMaxC: 28, phMin: 6, phMax: 7.5, propagation: 'Runners; a hardy classic that tolerates moderate conditions.' },
  { name: 'Staurogyne repens', scientificName: 'Staurogyne repens', light: 'Medium', co2: 'Low', growth: 'Medium', difficulty: 'Beginner', placement: 'Foreground', tempMinC: 22, tempMaxC: 28, phMin: 6, phMax: 7.5, propagation: 'Cut and replant stems; forms a low bush rather than a true carpet.' },
  { name: 'Hydrocotyle tripartita', scientificName: 'Hydrocotyle tripartita', light: 'Medium', co2: 'Low', growth: 'Fast', difficulty: 'Intermediate', placement: 'Foreground', tempMinC: 20, tempMaxC: 26, phMin: 6, phMax: 7.5, propagation: 'Stem cuttings; clover-like leaves creep along the substrate.' },
  { name: 'Pygmy Chain Sword', scientificName: 'Echinodorus tenellus', light: 'Medium', co2: 'None', growth: 'Medium', difficulty: 'Beginner', placement: 'Foreground', tempMinC: 20, tempMaxC: 28, phMin: 6, phMax: 7.5, propagation: 'Runners that slowly form a grassy lawn.' },
  { name: 'Pogostemon stellatus', scientificName: 'Pogostemon stellatus', light: 'High', co2: 'High', growth: 'Medium', difficulty: 'Intermediate', placement: 'Background', tempMinC: 22, tempMaxC: 28, phMin: 6, phMax: 7.5, propagation: 'Stem cuttings; whorled leaves turn orange-red under strong light.' },
  { name: 'Rotala indica', scientificName: 'Rotala indica', light: 'Medium-High', co2: 'Medium', growth: 'Fast', difficulty: 'Intermediate', placement: 'Background', tempMinC: 22, tempMaxC: 28, phMin: 5.5, phMax: 7.5, propagation: 'Stem cuttings; forgiving alternative to Rotala rotundifolia.' },
  { name: 'Anacharis', scientificName: 'Egeria densa', light: 'Low', co2: 'None', growth: 'Fast', difficulty: 'Beginner', placement: 'Background', tempMinC: 15, tempMaxC: 26, phMin: 6, phMax: 7.5, propagation: 'Any trimmed stem section grows into a new plant; keep out of cold-hardy fish-only tanks.' },
  { name: 'Rice Paddy Herb', scientificName: 'Limnophila aromatica', light: 'High', co2: 'High', growth: 'Medium', difficulty: 'Advanced', placement: 'Background', tempMinC: 22, tempMaxC: 28, phMin: 6, phMax: 7.5, propagation: 'Stem cuttings; purple undersides appear under strong light and iron.' },
  { name: 'Blyxa japonica', scientificName: 'Blyxa japonica', light: 'Medium-High', co2: 'Medium', growth: 'Medium', difficulty: 'Intermediate', placement: 'Midground', tempMinC: 22, tempMaxC: 28, phMin: 5.5, phMax: 7.5, propagation: 'Runners; grass-like rosettes prefer soft, slightly acidic water.' },
  { name: 'Anubias nana Petite', scientificName: 'Anubias barteri var. nana', light: 'Low', co2: 'None', growth: 'Slow', difficulty: 'Beginner', placement: 'Epiphyte', tempMinC: 22, tempMaxC: 28, phMin: 6, phMax: 7.5, propagation: 'Rhizome division; attach to hardscape, never bury the rhizome.' },
]

const coralData = [
  { name: 'Galaxea', scientificName: 'Galaxea fascicularis', light: 'Moderate-High', flow: 'Moderate', difficulty: 'Intermediate', placement: 'Mid rock', aggression: 'Aggressive', reefCompatibility: true, tempMinC: 24, tempMaxC: 27, excerpt: 'Long, glassy tentacles with stinging power — give it plenty of distance from neighbors.' },
  { name: 'Cauliflower Coral', scientificName: 'Pocillopora damicornis', light: 'High', flow: 'High', difficulty: 'Intermediate', placement: 'High rock', aggression: 'Semi-aggressive', reefCompatibility: true, tempMinC: 24, tempMaxC: 27, excerpt: 'A branching SPS that is hardy by acropora standards; brown bases with pink tips.' },
  { name: 'Bird\u2019s Nest Coral', scientificName: 'Seriatopora hystrix', light: 'High', flow: 'High', difficulty: 'Intermediate', placement: 'High rock', aggression: 'Aggressive', reefCompatibility: true, tempMinC: 24, tempMaxC: 27, excerpt: 'Delicate thin branches that grow into a bird\u2019s nest shape; strong sweeper tentacles at night.' },
  { name: 'Favites Brain Coral', scientificName: 'Favia favus', light: 'Moderate', flow: 'Low-Moderate', difficulty: 'Beginner', placement: 'Sand bed', aggression: 'Semi-aggressive', reefCompatibility: true, tempMinC: 24, tempMaxC: 27, excerpt: 'A hardy massive LPS with maze-like grooves; tolerant of less stable conditions.' },
  { name: 'Elegance Coral', scientificName: 'Catalaphyllia jardinei', light: 'Moderate', flow: 'Low-Moderate', difficulty: 'Advanced', placement: 'Sand bed', aggression: 'Aggressive', reefCompatibility: true, tempMinC: 24, tempMaxC: 27, excerpt: 'Flamboyant tentacles with vivid tips; sensitive to water quality swings.' },
  { name: 'Open Brain Coral', scientificName: 'Trachyphyllia geoffroyi', light: 'Moderate', flow: 'Low', difficulty: 'Beginner', placement: 'Sand bed', aggression: 'Semi-aggressive', reefCompatibility: true, tempMinC: 24, tempMaxC: 27, excerpt: 'A fleshy, colorful LPS that stays on the sand bed and tolerates feeding.' },
]

const equipmentData = [
  { name: 'Protein Skimmer', category: 'Filter', excerpt: 'Removes dissolved organic waste from marine tanks via foam fractionation. Essential for reef systems.', pros: ['Removes organics water changes miss', 'Boosts oxygenation', 'Keeps nitrate manageable'], cons: ['Aquarium only (fails in freshwater)', 'Needs weekly cup cleaning', 'Tuning takes practice'] },
  { name: 'Automatic Fish Feeder', category: 'Other', excerpt: 'Dispenses dry food on a timer while you are away. Choose one with a reliable mechanism and dry pellets.', pros: ['Covers vacations', 'Consistent portion control', 'Works with dry food'], cons: ['Can jam with moist food', 'Battery or power dependency', 'No overfeeding safeguard'] },
  { name: 'RO/DI Water Filter', category: 'Other', excerpt: 'Produces pure water for mixing salt or topping off. Removes silicate, nitrate and heavy metals.', pros: ['Cleanest water source', 'Reduces algae triggers', 'Long-lasting membranes'], cons: ['Wastes several liters per liter made', 'Slow production rate', 'Prefilters need replacement'] },
  { name: 'Air Stone', category: 'Other', excerpt: 'Creates fine bubbles for oxygenation and gentle surface movement. Cheap insurance for emergencies.', pros: ['Very cheap', 'Drives gentle water movement', 'Works with any air pump'], cons: ['Needs an air pump', 'Clogs and needs cleaning', 'Can be noisy with cheap pumps'] },
  { name: 'Aquarium Gravel', category: 'Substrate', excerpt: 'Inert gravel for freshwater tanks. Rinse thoroughly before use; depth of 2\u20135 cm suits most planted tanks.', pros: ['Cheap and reusable', 'Easy to clean', 'Neutral for most fish'], cons: ['No nutrients for plants', 'Heavy', 'Can trap waste without vacuuming'] },
  { name: 'CO\u2082 Cylinder', category: 'CO\u2082 System', excerpt: 'Pressurized container feeding CO\u2082 through a regulator into the planted tank. The reliable heart of a high-tech setup.', pros: ['Stable, long-lasting CO\u2082 supply', 'Cheaper per gram than disposable cartridges', 'Refillable'], cons: ['Higher startup cost', 'Must be secured upright', 'Requires refill logistics'] },
  { name: 'Water Test Strips', category: 'Test Kit', excerpt: 'Dip-and-read strips for quick multi-parameter checks. Great for weekly monitoring; confirm results with liquid kits.', pros: ['Fast and easy', 'Multiple parameters at once', 'No dripping or counting'], cons: ['Less precise than liquid tests', 'Expire and fade', 'Ammonia strips read only in fresh water'] },
  { name: 'Flake Fish Food', category: 'Other', excerpt: 'The classic dry staple for community tanks. Feed only what fish eat in 2 minutes, once or twice daily.', pros: ['Complete nutrition for most fish', 'Long shelf life when sealed', 'Universal'], cons: ['Pulverizes in water', 'Not ideal for bottom feeders', 'Floating — requires sinking forms for bottom fish'] },
]

const problemData = [
  { name: 'Fin Rot', category: 'fish', slugKey: 'fin-rot',
    excerpt: 'Fins look frayed, ragged or are visibly shrinking with white or red edges.',
    symptoms: ['Frayed, ragged or disintegrating fins', 'White or red margins on damaged fin tissue', 'Fins shorten progressively'],
    causes: ['Poor water quality (high ammonia or nitrite)', 'Injury followed by bacterial infection', 'Overcrowding and chronic stress'],
    whatToCheck: ['Ammonia, nitrite and nitrate levels', 'Fin condition over several days', 'Signs of bullying or fin nipping'],
    whatNotToDo: ['Do not medicate before fixing water quality', 'Do not treat in tiny unfiltered containers while medicating'] },
  { name: 'Old Tank Syndrome', category: 'water', slugKey: 'old-tank-syndrome',
    excerpt: 'Water quality slowly worsens over months or years despite regular small water changes.',
    symptoms: ['Slowly worsening water quality despite water changes', 'Fish become lethargic with clamped fins', 'Nitrate rises while minerals deplete'],
    causes: ['Years of accumulated organic waste', 'Substrate packed with mulm', 'Minerals used up by plants and bacteria'],
    whatToCheck: ['Nitrate and GH/kH trend over weeks', 'Substrate condition and age', 'Filter media age and saturation'],
    whatNotToDo: ['Do not strip-clean the entire tank in one day', 'Do not replace all media and substrate at once'] },
  { name: 'Hair Algae', category: 'algae', slugKey: 'hair-algae',
    excerpt: 'Long green strands coat plants, hardscape and glass. Common in young or bright tanks.',
    symptoms: ['Long green hair-like strands on plants and decor', 'Attaches to slow-growing plants and rock', 'Grows rapidly under long photoperiods'],
    causes: ['Photoperiod too long or light too strong', 'Phosphate and nitrate imbalance', 'Low plant mass relative to nutrients'],
    whatToCheck: ['Light duration and intensity', 'Phosphate and nitrate readings', 'Plant health and surface coverage'],
    whatNotToDo: ['Do not just pull it out — it regrows from the base', 'Do not run a long blackout without addressing nutrients'] },
  { name: 'Staghorn Algae', category: 'algae', slugKey: 'staghorn-algae',
    excerpt: 'Grey-green branching tufts shaped like antlers on plant tips and filter outlets.',
    symptoms: ['Grey-green branching tufts that look like antlers', 'Grows on plant tips and filter outlets', 'Prefers high-flow areas'],
    causes: ['CO\u2082 fluctuations in planted tanks', 'Nutrient imbalance with low phosphate', 'Unstable water chemistry'],
    whatToCheck: ['CO\u2082 drop checker stability', 'Phosphate and potassium levels', 'Flow pattern around the growth'],
    whatNotToDo: ['Do not cut CO\u2082 off completely to stop it', 'Do not use strong oxidizers on delicate plants'] },
  { name: 'Plant Nutrient Deficiency', category: 'plants', slugKey: 'plant-nutrient-deficiency',
    excerpt: 'Leaves yellow, develop pinholes or new growth looks twisted and stunted.',
    symptoms: ['Yellowing older leaves (nitrogen) or new leaves (iron)', 'Pinholes in older leaves (potassium)', 'Stunted or twisted new growth'],
    causes: ['Nitrate, potassium, phosphate or iron shortage', 'Hard water locking micronutrients', 'Dense plant mass outgrowing dosing'],
    whatToCheck: ['Nitrate and phosphate test readings', 'GH/kH and iron dosing', 'Which leaves are affected (old vs new)'],
    whatNotToDo: ['Do not add random fertilizers without testing', 'Do not assume every yellow leaf is iron deficiency'] },
  { name: 'Dropsy', category: 'fish', slugKey: 'dropsy',
    excerpt: 'Abdomen swells and scales stand out like a pinecone — usually a bacterial infection.',
    symptoms: ['Swollen abdomen with scales standing out like a pinecone', 'Bulging eyes and raised scales', 'Lethargy and loss of appetite'],
    causes: ['Bacterial infection of internal organs', 'Poor water quality and long-term stress', 'Overfeeding'],
    whatToCheck: ['Water quality immediately', 'Feeding frequency', 'Quarantine readiness'],
    whatNotToDo: ['Do not use salt baths as the first response', 'Do not keep the fish with tankmates while severely bloated'] },
  { name: 'Temperature Shock', category: 'fish', slugKey: 'temperature-shock',
    excerpt: 'Sudden temperature swings after water changes, heater failure or power cuts stress fish.',
    symptoms: ['Fish darting or flashing after a water change', 'Sudden listlessness or gasping', 'Clamped fins and rapid breathing'],
    causes: ['Adding water of a very different temperature', 'Heater failure or stuck thermostat', 'Power outage in cold months'],
    whatToCheck: ['Water temperature before and after changes', 'Heater function and wattage vs tank size', 'Thermometer accuracy'],
    whatNotToDo: ['Do not pour warm water straight into the tank', 'Do not raise temperature more than 1\u20132 \u00b0C per day during treatment'] },
  { name: 'Filter Crash', category: 'equipment', slugKey: 'filter-crash',
    excerpt: 'The biological filter fails after aggressive cleaning, media replacement or a long outage.',
    symptoms: ['Ammonia rises within days of cleaning the filter', 'Cloudy water and stressed fish', 'Sudden biofilm die-off smell'],
    causes: ['Cleaning all media in tap water at once', 'Replacing all media simultaneously', 'Long power outage in hot weather'],
    whatToCheck: ['Ammonia and nitrite trend', 'Media condition and cleaning history', 'Biological load vs media capacity'],
    whatNotToDo: ['Do not deep-clean media with hot or chlorinated water', 'Do not replace all media at once'] },
]

const inspirationData = [
  { name: 'Small Iwagumi Nano', style: 'Iwagumi', tankSizeL: 20, difficulty: 'Beginner',
    excerpt: 'A tiny scape proving the rule of three: one focal stone, two supports, one low carpet.',
    hardscape: 'Three small Seiryu stones with a slight lean; fine sand and a compact carpet plant.' },
  { name: 'Amazon Biotope', style: 'Biotope', tankSizeL: 180, difficulty: 'Intermediate',
    excerpt: 'A faithful slice of a South American river: soft acidic water, driftwood tangles and dappled shade.',
    hardscape: 'Branchy driftwood and leaf litter; floating plants break up the light.' },
  { name: 'Reef Nano', style: 'Reef', tankSizeL: 40, difficulty: 'Advanced',
    excerpt: 'A miniature reef with LPS corals and a single fish. Every parameter change matters at this scale.',
    hardscape: 'Two to three rocks arranged as an arch; open sand bed in front.' },
  { name: 'Mountain Valley Scape', style: 'Nature Aquarium', tankSizeL: 100, difficulty: 'Intermediate',
    excerpt: 'Layered stones receding into the distance create a valley perspective like classic nature aquaria.',
    hardscape: 'Multiple stone tiers rising toward the back; carpet plants flowing through the valley floor.' },
  { name: 'Planted Community Aquarium', style: 'Nature Aquarium', tankSizeL: 120, difficulty: 'Beginner',
    excerpt: 'A forgiving mixed layout of easy plants and peaceful fish — the classic starter showpiece.',
    hardscape: 'A single piece of driftwood with Anubias attached; sand path across the front.' },
]

/* ------------------------------------------------------------------ */
/* Document builders                                                   */
/* ------------------------------------------------------------------ */

function speciesDoc(s, image) {
  return {
    _type: 'species', name: s.common, scientificName: s.sci, family: s.family, origin: s.origin,
    slug: slug(toSlug(s.sci)), publishedAt: PUBLISHED, sizeCm: s.sizeCm, tankSizeMinL: s.tankSizeMinL,
    tempMinC: s.tempMinC, tempMaxC: s.tempMaxC, phMin: s.phMin, phMax: s.phMax,
    ghMin: s.ghMin, ghMax: s.ghMax, diet: s.diet, temperament: s.temperament,
    waterZone: s.waterZone, schooling: s.schooling, difficulty: s.difficulty,
    excerpt: `Care profile for ${s.common} (${s.sci}): ${s.sizeCm} cm adult size, ${s.tempMinC}\u2013${s.tempMaxC}\u00b0C, pH ${s.phMin}\u2013${s.phMax}, ${s.difficulty.toLowerCase()} difficulty.`,
    mainImage: image,
  }
}

function plantDoc(p, image) {
  return {
    _type: 'plant', name: p.name, scientificName: p.scientificName, slug: slug(toSlug(p.name)),
    publishedAt: PUBLISHED, light: p.light, co2: p.co2, growth: p.growth, difficulty: p.difficulty,
    placement: p.placement, tempMinC: p.tempMinC, tempMaxC: p.tempMaxC, phMin: p.phMin, phMax: p.phMax,
    propagation: p.propagation,
    excerpt: `Care profile for ${p.name}: ${p.light.toLowerCase()} light, ${p.co2.toLowerCase()} CO\u2082, ${p.difficulty.toLowerCase()} difficulty.`,
    mainImage: image,
  }
}

function coralDoc(c, image) {
  return {
    _type: 'coral', name: c.name, scientificName: c.scientificName, slug: slug(toSlug(c.name)),
    publishedAt: PUBLISHED, light: c.light, flow: c.flow, difficulty: c.difficulty,
    placement: c.placement, aggression: c.aggression, reefCompatibility: c.reefCompatibility,
    tempMinC: c.tempMinC, tempMaxC: c.tempMaxC, excerpt: c.excerpt, mainImage: image,
  }
}

function equipmentDoc(e, image) {
  return {
    _type: 'equipment', name: e.name, slug: slug(toSlug(e.name)), publishedAt: PUBLISHED,
    category: e.category, excerpt: e.excerpt, pros: e.pros, cons: e.cons, mainImage: image,
  }
}

function problemDoc(p) {
  return {
    _type: 'problem', title: p.name, slug: slug(p.slugKey), excerpt: p.excerpt, publishedAt: PUBLISHED,
    category: p.category, symptoms: ptList(p.symptoms), causes: ptList(p.causes),
    whatToCheck: ptList(p.whatToCheck), whatNotToDo: ptList(p.whatNotToDo),
  }
}

function inspirationDoc(i, image) {
  return {
    _type: 'inspiration', title: i.name, slug: slug(toSlug(i.name)), excerpt: i.excerpt,
    publishedAt: PUBLISHED, style: i.style, tankSizeL: i.tankSizeL, difficulty: i.difficulty,
    hardscape: i.hardscape, mainImage: image,
  }
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

const existing = await client.fetch(
  `*[_type in ["species","plant","coral","equipment","problem","inspiration"]] { _type, name, scientificName, title }`
)
const dedupeKeys = {
  species: new Set(existing.filter((d) => d._type === 'species').map((d) => (d.scientificName || d.name || '').toLowerCase())),
  plant: new Set(existing.filter((d) => d._type === 'plant').map((d) => (d.scientificName || d.name || '').toLowerCase())),
  coral: new Set(existing.filter((d) => d._type === 'coral').map((d) => (d.scientificName || d.name || '').toLowerCase())),
  equipment: new Set(existing.filter((d) => d._type === 'equipment').map((d) => d.name.toLowerCase())),
  problem: new Set(existing.filter((d) => d._type === 'problem').map((d) => d.title.toLowerCase())),
  inspiration: new Set(existing.filter((d) => d._type === 'inspiration').map((d) => d.title.toLowerCase())),
}

const plans = { species: speciesData, plant: plantData, coral: coralData, equipment: equipmentData, problem: problemData, inspiration: inspirationData }
const report = { created: {}, skippedNoImage: {}, skippedDuplicate: {}, failed: {} }

for (const type of Object.keys(plans)) {
  report.created[type] = []
  report.skippedNoImage[type] = []
  report.skippedDuplicate[type] = []
  report.failed[type] = []
  const batchDocs = []
  const batchLabels = []

  for (const item of plans[type]) {
    const key = (type === 'equipment' || type === 'problem' || type === 'inspiration'
      ? item.name : item.sci || item.scientificName || item.name).toLowerCase()
    if (dedupeKeys[type].has(key)) {
      report.skippedDuplicate[type].push(item.name)
      continue
    }
    dedupeKeys[type].add(key)

    let image = null
    if (type !== 'problem') {
      const queries = SPECIES_OVERRIDES[item.common] || SPECIES_OVERRIDES[item.name]
        || EQUIPMENT_OVERRIDES[item.name] || INSPIRATION_OVERRIDES[item.name]
        || [{ q: item.sci || item.scientificName || item.name, kw: item.sci || item.scientificName || item.name }]
      const found = await findImage(queries)
      if (!found) {
        report.skippedNoImage[type].push(item.name)
        process.stdout.write(`  skip ${type}/${item.name} (no image)\n`)
        continue
      }
      let buf
      try {
        const res = await fetch(found.url, { headers: { 'User-Agent': UA } })
        buf = Buffer.from(await res.arrayBuffer())
      } catch (err) {
        report.failed[type].push({ name: item.name, error: String(err).slice(0, 100) })
        continue
      }
      if (buf.length < 20000) {
        report.skippedNoImage[type].push(item.name)
        process.stdout.write(`  skip ${type}/${item.name} (image too small)\n`)
        continue
      }
      const ext = path.extname(found.title).toLowerCase() || '.jpg'
      const asset = await client.assets.upload('image', buf, {
        filename: `${type}-${toSlug(item.name || item.common)}${ext}`,
        contentType: ext === '.png' ? 'image/png' : 'image/jpeg',
      })
      image = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
      process.stdout.write(`  img ${type}/${item.name || item.common} <- ${found.title}\n`)
    }

    const builders = {
      species: () => speciesDoc(item, image),
      plant: () => plantDoc(item, image),
      coral: () => coralDoc(item, image),
      equipment: () => equipmentDoc(item, image),
      problem: () => problemDoc(item),
      inspiration: () => inspirationDoc(item, image),
    }
    batchDocs.push(builders[type]())
    batchLabels.push(item.name)

    if (batchDocs.length >= 8) {
      await flush(type, batchDocs, batchLabels, report)
      batchDocs.length = 0
      batchLabels.length = 0
    }
    await sleep(150)
  }
  if (batchDocs.length) await flush(type, batchDocs, batchLabels, report)
  console.log(`${type}: +${report.created[type].length} created, ${report.skippedDuplicate[type].length} dup, ${report.skippedNoImage[type].length} no-image, ${report.failed[type].length} failed`)
}

async function flush(type, docs, labels, report) {
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const tx = client.transaction()
      for (const d of docs) tx.create(d)
      await tx.commit()
      report.created[type].push(...labels)
      return
    } catch (err) {
      if (attempt < 2) {
        await sleep(500)
        continue
      }
      const failedLabels = labels
      report.failed[type].push(...failedLabels.map((name) => ({ name, error: String(err).slice(0, 150) })))
      console.log(`  FAILED batch ${type}: ${failedLabels.join(', ')} — ${String(err).slice(0, 120)}`)
    }
  }
}

/* ------------------------------------------------------------------ */
/* Final report                                                        */
/* ------------------------------------------------------------------ */

console.log('\n=== SEED ADDITIONS REPORT ===')
const table = {}
for (const type of Object.keys(plans)) {
  table[type] = {
    existing: existing.filter((d) => d._type === type).length,
    created: report.created[type].length,
    skippedDuplicate: report.skippedDuplicate[type].length,
    skippedNoImage: report.skippedNoImage[type].length,
    failed: report.failed[type].length,
  }
}
console.table(table)
console.log('\nSkipped - no image:', JSON.stringify(report.skippedNoImage, null, 1))
console.log('Skipped - duplicate:', JSON.stringify(report.skippedDuplicate, null, 1))
console.log('Failed:', JSON.stringify(report.failed, null, 1))

fs.writeFileSync(
  path.join(__dirname, '.seed-additions-report.json'),
  JSON.stringify({ table, ...report }, null, 2),
  'utf8'
)
console.log('Report saved to scripts/.seed-additions-report.json')
