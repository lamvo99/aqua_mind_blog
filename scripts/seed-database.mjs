/**
 * Seed script for AquaMind database content.
 * Populates Sanity with curated, verified aquarium data in English.
 *
 * Usage: node scripts/seed-database.mjs
 * Reads SANITY_API_TOKEN / project id / dataset from .env.local
 *
 * All care parameters are widely published, verified ranges.
 * Idempotent: uses createOrReplace with deterministic _ids.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')

const getEnv = (key) => {
  const line = env.split('\n').map((x) => x.trim()).find((x) => x.startsWith(key + '='))
  if (!line) return ''
  return line.split('=').slice(1).join('=').replace(/^"|"$/g, '')
}

const token = getEnv('SANITY_API_TOKEN')
const projectId = getEnv('NEXT_PUBLIC_SANITY_PROJECT_ID')
const dataset = getEnv('NEXT_PUBLIC_SANITY_DATASET')

if (!token || !projectId || !dataset) {
  console.error('Missing env vars in .env.local')
  process.exit(1)
}

const MUTATE_URL = `https://${projectId}.api.sanity.io/v2023-01-01/data/mutate/${dataset}`

const PUBLISHED = '2026-07-31T00:00:00Z'

function slug(current) {
  return { _type: 'slug', current }
}

/** Portable text block */
function pt(text) {
  return [{ _type: 'block', style: 'normal', children: [{ _type: 'span', text, marks: [] }] }]
}

/** Portable text bullet list */
function ptList(items) {
  return items.map((text, i) => ({
    _type: 'block',
    _key: `li${i}`,
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    children: [{ _type: 'span', text, marks: [] }],
  }))
}

const speciesData = [
  // --- Freshwater ---
  {
    name: 'Betta splendens', commonName: 'Siamese Fighting Fish',
    family: 'Osphronemidae', origin: 'Southeast Asia (Thailand, Cambodia, Vietnam)',
    excerpt: 'One of the most popular aquarium fish, known for flowing fins and labyrinth breathing. Best kept alone or with peaceful tankmates.',
    sizeCm: 6.5, tankSizeMinL: 20, tempMinC: 24, tempMaxC: 28, phMin: 6, phMax: 7.5, ghMin: 5, ghMax: 20,
    diet: 'Carnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'Keep solitary — males fight each other.', difficulty: 'Beginner',
  },
  {
    name: 'Paracheirodon innesi', commonName: 'Neon Tetra',
    family: 'Characidae', origin: 'Blackwater rivers of the Amazon basin',
    excerpt: 'A classic schooling tetra with a bright blue-red stripe. Hardy, peaceful and ideal for community tanks.',
    sizeCm: 3.5, tankSizeMinL: 40, tempMinC: 22, tempMaxC: 26, phMin: 5, phMax: 7, ghMin: 1, ghMax: 10,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'School of 6 or more.', difficulty: 'Beginner',
  },
  {
    name: 'Poecilia reticulata', commonName: 'Guppy',
    family: 'Poeciliidae', origin: 'Northern South America and Caribbean',
    excerpt: 'Colorful, active livebearer that is extremely easy to breed. Tolerates a wide range of water conditions.',
    sizeCm: 5, tankSizeMinL: 40, tempMinC: 22, tempMaxC: 28, phMin: 6.8, phMax: 7.8, ghMin: 8, ghMax: 25,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'Best in groups; males may chase females.', difficulty: 'Beginner',
  },
  {
    name: 'Danio rerio', commonName: 'Zebrafish',
    family: 'Cyprinidae', origin: 'India, Pakistan, Bangladesh',
    excerpt: 'An energetic, hardy fish with horizontal stripes. A great beginner species that thrives in cooler water.',
    sizeCm: 5, tankSizeMinL: 40, tempMinC: 18, tempMaxC: 26, phMin: 6.5, phMax: 7.5, ghMin: 5, ghMax: 19,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'School of 6 or more.', difficulty: 'Beginner',
  },
  {
    name: 'Corydoras paleatus', commonName: 'Peppered Corydoras',
    family: 'Callichthyidae', origin: 'Southeastern Brazil, Rio de la Plata basin',
    excerpt: 'A charming armored catfish that scavenges the substrate. Peaceful and social, great for community tanks.',
    sizeCm: 7, tankSizeMinL: 60, tempMinC: 22, tempMaxC: 26, phMin: 6, phMax: 7.5, ghMin: 2, ghMax: 12,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Bottom', schooling: 'Group of 4 or more.', difficulty: 'Beginner',
  },
  {
    name: 'Pterophyllum scalare', commonName: 'Angelfish',
    family: 'Cichlidae', origin: 'Amazon basin, Peru, Colombia, Brazil',
    excerpt: 'Graceful, tall-bodied cichlid. Semi-aggressive when breeding; pairs may defend territory.',
    sizeCm: 15, tankSizeMinL: 120, tempMinC: 24, tempMaxC: 30, phMin: 6, phMax: 7.5, ghMin: 2, ghMax: 12,
    diet: 'Carnivore', temperament: 'Semi-aggressive', waterZone: 'Middle', schooling: 'Keep in pairs or small groups.', difficulty: 'Intermediate',
  },
  {
    name: 'Symphysodon aequifasciatus', commonName: 'Discus',
    family: 'Cichlidae', origin: 'Amazon river system, Brazil',
    excerpt: 'The king of the aquarium — demanding stable warm water and high-quality food. Very rewarding for experienced keepers.',
    sizeCm: 20, tankSizeMinL: 200, tempMinC: 26, tempMaxC: 30, phMin: 5.5, phMax: 6.5, ghMin: 1, ghMax: 8,
    diet: 'Carnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'Best in groups of 5 or more.', difficulty: 'Advanced',
  },
  {
    name: 'Trichogaster lalius', commonName: 'Dwarf Gourami',
    family: 'Osphronemidae', origin: 'India, Bangladesh',
    excerpt: 'A small labyrinth fish with beautiful red-blue stripes. Hardy but prone to stress in poor water conditions.',
    sizeCm: 7.5, tankSizeMinL: 60, tempMinC: 24, tempMaxC: 28, phMin: 6, phMax: 7.5, ghMin: 4, ghMax: 10,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Top', schooling: 'One male per tank.', difficulty: 'Beginner',
  },
  {
    name: 'Hypostomus plecostomus', commonName: 'Common Pleco',
    family: 'Loricariidae', origin: 'South America',
    excerpt: 'Grows much larger than most expect (30+ cm). Needs a very large tank; consider a dwarf species for smaller setups.',
    sizeCm: 35, tankSizeMinL: 300, tempMinC: 22, tempMaxC: 28, phMin: 6.5, phMax: 7.5, ghMin: 5, ghMax: 15,
    diet: 'Herbivore', temperament: 'Peaceful', waterZone: 'Bottom', schooling: 'Solitary or with other plecos in large tanks.', difficulty: 'Intermediate',
  },
  {
    name: 'Carassius auratus', commonName: 'Fancy Goldfish',
    family: 'Cyprinidae', origin: 'Domesticated in China',
    excerpt: 'Coldwater classic. Fancy varieties need more space and better filtration than common goldfish — 150 L+ for a single adult.',
    sizeCm: 25, tankSizeMinL: 150, tempMinC: 18, tempMaxC: 23, phMin: 6.5, phMax: 7.5, ghMin: 5, ghMax: 19,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'All levels', schooling: 'Best in groups of 2–3.', difficulty: 'Beginner',
  },
  {
    name: 'Paracheirodon axelrodi', commonName: 'Cardinal Tetra',
    family: 'Characidae', origin: 'Upper Orinoco and Negro rivers',
    excerpt: 'Brighter and larger than the neon tetra. Prefers soft, slightly acidic blackwater conditions.',
    sizeCm: 5, tankSizeMinL: 60, tempMinC: 23, tempMaxC: 27, phMin: 5.5, phMax: 7, ghMin: 1, ghMax: 10,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'School of 6 or more.', difficulty: 'Intermediate',
  },
  {
    name: 'Otocinclus affinis', commonName: 'Otocinclus Catfish',
    family: 'Loricariidae', origin: 'Brazil, Rio de Janeiro region',
    excerpt: 'Small algae-eating catfish that is the perfect cleanup crew for planted tanks. Needs established algae or supplemental food.',
    sizeCm: 5, tankSizeMinL: 40, tempMinC: 22, tempMaxC: 27, phMin: 6, phMax: 7.5, ghMin: 5, ghMax: 15,
    diet: 'Herbivore', temperament: 'Peaceful', waterZone: 'Bottom', schooling: 'Group of 6 or more.', difficulty: 'Beginner',
  },
  {
    name: 'Trigonostigma heteromorpha', commonName: 'Harlequin Rasbora',
    family: 'Danionidae', origin: 'Malaysia, Thailand, Sumatra',
    excerpt: 'A peaceful, hardy schooling fish with a distinctive black triangle marking. Ideal for planted community tanks.',
    sizeCm: 5, tankSizeMinL: 60, tempMinC: 23, tempMaxC: 28, phMin: 6, phMax: 7.5, ghMin: 2, ghMax: 10,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'School of 8 or more.', difficulty: 'Beginner',
  },
  {
    name: 'Gymnocorymbus ternetzi', commonName: 'Black Skirt Tetra',
    family: 'Characidae', origin: 'Paraguay and Guapore river basins',
    excerpt: 'Hardy tetra with a distinctive black body and flowing fins. Peaceful but may nip fins of slow tankmates.',
    sizeCm: 6, tankSizeMinL: 60, tempMinC: 22, tempMaxC: 26, phMin: 6, phMax: 7.5, ghMin: 4, ghMax: 15,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'School of 6 or more.', difficulty: 'Beginner',
  },
  {
    name: 'Puntius titteya', commonName: 'Cherry Barb',
    family: 'Cyprinidae', origin: 'Sri Lanka',
    excerpt: 'A shy, peaceful barb that shows intense red color when happy. Great for planted aquariums.',
    sizeCm: 5, tankSizeMinL: 60, tempMinC: 23, tempMaxC: 27, phMin: 6, phMax: 7.5, ghMin: 4, ghMax: 15,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'School of 6 or more.', difficulty: 'Beginner',
  },
  {
    name: 'Ancistrus cf. cirrhosus', commonName: 'Bristlenose Pleco',
    family: 'Loricariidae', origin: 'Amazon basin',
    excerpt: 'A manageable pleco (up to 13 cm) that eats algae and fits most community tanks. Males grow bristly tentacles.',
    sizeCm: 13, tankSizeMinL: 80, tempMinC: 23, tempMaxC: 27, phMin: 6.5, phMax: 7.5, ghMin: 4, ghMax: 15,
    diet: 'Herbivore', temperament: 'Peaceful', waterZone: 'Bottom', schooling: 'One or a pair per tank.', difficulty: 'Beginner',
  },
  {
    name: 'Apistogramma cacatuoides', commonName: 'Cockatoo Dwarf Cichlid',
    family: 'Cichlidae', origin: 'Amazon tributaries, Peru',
    excerpt: 'A colorful dwarf cichlid that forms harem groups. Territorial when breeding; best in a species or biotope tank.',
    sizeCm: 8, tankSizeMinL: 60, tempMinC: 24, tempMaxC: 28, phMin: 6, phMax: 7, ghMin: 2, ghMax: 10,
    diet: 'Carnivore', temperament: 'Semi-aggressive', waterZone: 'Bottom', schooling: 'One male with 2–3 females.', difficulty: 'Intermediate',
  },
  {
    name: 'Danio margaritatus', commonName: 'Celestial Pearl Danio',
    family: 'Danionidae', origin: 'Small ponds in Myanmar',
    excerpt: 'A tiny, stunning fish covered in galaxy-like spots. Shy and needs a planted, dimly lit tank.',
    sizeCm: 2.5, tankSizeMinL: 40, tempMinC: 22, tempMaxC: 26, phMin: 6.5, phMax: 7.5, ghMin: 2, ghMax: 10,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'School of 6 or more.', difficulty: 'Intermediate',
  },
  {
    name: 'Chromobotia macracanthus', commonName: 'Clown Loach',
    family: 'Botiidae', origin: 'Southeast Asia (Sumatra, Borneo)',
    excerpt: 'Playful, social loach with striking orange-black stripes. Grows to 30 cm and needs a very large group.',
    sizeCm: 30, tankSizeMinL: 400, tempMinC: 25, tempMaxC: 30, phMin: 6, phMax: 7.5, ghMin: 3, ghMax: 12,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Bottom', schooling: 'Group of 5 or more.', difficulty: 'Intermediate',
  },
  {
    name: 'Pangio kuhlii', commonName: 'Kuhli Loach',
    family: 'Cobitidae', origin: 'Southeast Asia',
    excerpt: 'Eel-like, nocturnal loach that loves hiding among plants and driftwood. Peaceful scavenger.',
    sizeCm: 10, tankSizeMinL: 60, tempMinC: 24, tempMaxC: 28, phMin: 5.5, phMax: 7, ghMin: 1, ghMax: 8,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Bottom', schooling: 'Group of 3 or more.', difficulty: 'Beginner',
  },
  {
    name: 'Xiphophorus hellerii', commonName: 'Swordtail',
    family: 'Poeciliidae', origin: 'Mexico and Central America',
    excerpt: 'Active livebearer named after the male\'s long sword-like tail. Very easy to keep and breed.',
    sizeCm: 14, tankSizeMinL: 80, tempMinC: 22, tempMaxC: 28, phMin: 7, phMax: 8.3, ghMin: 8, ghMax: 25,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'Best in groups with more females than males.', difficulty: 'Beginner',
  },
  {
    name: 'Melanotaenia boesemani', commonName: 'Boesemani Rainbowfish',
    family: 'Melanotaeniidae', origin: 'West Papua, Indonesia',
    excerpt: 'Known for a striking blue-to-orange gradient body. Needs a roomy tank and a group to look its best.',
    sizeCm: 11, tankSizeMinL: 120, tempMinC: 24, tempMaxC: 28, phMin: 6.8, phMax: 7.8, ghMin: 8, ghMax: 18,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'School of 6 or more.', difficulty: 'Intermediate',
  },
  {
    name: 'Aphyosemion australe', commonName: 'Lyretail Killifish',
    family: 'Nothobranchiidae', origin: 'West Africa (Gabon, Congo)',
    excerpt: 'A stunning killifish with lyre-shaped fins. Best kept in a small, heavily planted tank.',
    sizeCm: 6, tankSizeMinL: 40, tempMinC: 22, tempMaxC: 26, phMin: 6, phMax: 7.5, ghMin: 2, ghMax: 10,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Top', schooling: 'Pairs or small groups.', difficulty: 'Intermediate',
  },
  {
    name: 'Pseudotropheus zebra', commonName: 'Zebra Mbuna Cichlid',
    family: 'Cichlidae', origin: 'Lake Malawi, Africa',
    excerpt: 'An aggressive African cichlid that needs a hard, alkaline Malawi tank. Not for beginners or community tanks.',
    sizeCm: 12, tankSizeMinL: 200, tempMinC: 24, tempMaxC: 28, phMin: 7.5, phMax: 8.5, ghMin: 10, ghMax: 25,
    diet: 'Herbivore', temperament: 'Aggressive', waterZone: 'Middle', schooling: 'Overstocked groups to spread aggression.', difficulty: 'Intermediate',
  },
  // --- Marine ---
  {
    name: 'Amphiprion ocellaris', commonName: 'Ocellaris Clownfish',
    family: 'Pomacentridae', origin: 'Indo-Pacific reefs',
    excerpt: 'The classic orange clownfish made famous by animation. Hardy and reef-safe, can host anemones.',
    sizeCm: 8, tankSizeMinL: 100, tempMinC: 24, tempMaxC: 28, phMin: 8, phMax: 8.4, ghMin: 8, ghMax: 12,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'Pairs strongly bonded.', difficulty: 'Beginner',
  },
  {
    name: 'Chromis viridis', commonName: 'Green Chromis',
    family: 'Pomacentridae', origin: 'Indo-Pacific',
    excerpt: 'A peaceful, schooling damselfish that adds shimmering movement to a reef tank.',
    sizeCm: 10, tankSizeMinL: 120, tempMinC: 24, tempMaxC: 28, phMin: 8, phMax: 8.4, ghMin: 8, ghMax: 12,
    diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'Group of 5 or more.', difficulty: 'Beginner',
  },
  {
    name: 'Zebrasoma flavescens', commonName: 'Yellow Tang',
    family: 'Acanthuridae', origin: 'Hawaii and Pacific reefs',
    excerpt: 'A bright yellow surgeonfish that needs a very large tank and plenty of grazing rock.',
    sizeCm: 20, tankSizeMinL: 400, tempMinC: 24, tempMaxC: 28, phMin: 8.1, phMax: 8.4, ghMin: 8, ghMax: 12,
    diet: 'Herbivore', temperament: 'Semi-aggressive', waterZone: 'Middle', schooling: 'One per tank, or a large group.', difficulty: 'Intermediate',
  },
  {
    name: 'Pseudanthias squamipinnis', commonName: 'Lyretail Anthias',
    family: 'Serranidae', origin: 'Indo-Pacific',
    excerpt: 'A reef planktivore that needs frequent small feedings. Groups with one dominant male.',
    sizeCm: 15, tankSizeMinL: 400, tempMinC: 24, tempMaxC: 28, phMin: 8.1, phMax: 8.4, ghMin: 8, ghMax: 12,
    diet: 'Carnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'Group of 6 or more.', difficulty: 'Advanced',
  },
]

const plantData = [
  { name: 'Anubias barteri', scientificName: 'Anubias barteri', light: 'Low', co2: 'None', growth: 'Slow', difficulty: 'Beginner', placement: 'Epiphyte', tempMinC: 22, tempMaxC: 28, phMin: 6, phMax: 7.5, propagation: 'Divide the rhizome with a sharp knife; never bury the rhizome in substrate.' },
  { name: 'Java Fern', scientificName: 'Microsorum pteropus', light: 'Low', co2: 'None', growth: 'Slow', difficulty: 'Beginner', placement: 'Epiphyte', tempMinC: 20, tempMaxC: 28, phMin: 6, phMax: 7.5, propagation: 'Tie to rock or wood; plantlets form on leaf edges and can be removed.' },
  { name: 'Java Moss', scientificName: 'Taxiphyllum barbieri', light: 'Low', co2: 'None', growth: 'Medium', difficulty: 'Beginner', placement: 'Epiphyte', tempMinC: 18, tempMaxC: 28, phMin: 5.5, phMax: 8, propagation: 'Trim and spread; any fragment can grow into a new colony.' },
  { name: 'Amazon Sword', scientificName: 'Echinodorus grisebachii', light: 'Medium', co2: 'Low', growth: 'Medium', difficulty: 'Beginner', placement: 'Midground', tempMinC: 22, tempMaxC: 28, phMin: 6.5, phMax: 7.5, propagation: 'Runners; remove daughter plants once they have roots.' },
  { name: 'Cryptocoryne wendtii', scientificName: 'Cryptocoryne wendtii', light: 'Low-Medium', co2: 'Low', growth: 'Medium', difficulty: 'Beginner', placement: 'Foreground', tempMinC: 22, tempMaxC: 28, phMin: 6, phMax: 7.5, propagation: 'Runners; expect leaves to melt when conditions change, new leaves regrow.' },
  { name: 'Monte Carlo', scientificName: 'Micranthemum tweediei', light: 'High', co2: 'Medium', growth: 'Fast', difficulty: 'Intermediate', placement: 'Foreground', tempMinC: 20, tempMaxC: 26, phMin: 5, phMax: 7.5, propagation: 'Trim and replant stem cuttings; forms a carpet with CO₂.' },
  { name: 'Dwarf Hairgrass', scientificName: 'Eleocharis parvula', light: 'Medium-High', co2: 'Medium', growth: 'Fast', difficulty: 'Intermediate', placement: 'Foreground', tempMinC: 18, tempMaxC: 26, phMin: 6, phMax: 7.5, propagation: 'Sends runners that create a grass-like carpet.' },
  { name: 'Hornwort', scientificName: 'Ceratophyllum demersum', light: 'Low', co2: 'None', growth: 'Fast', difficulty: 'Beginner', placement: 'Background', tempMinC: 15, tempMaxC: 26, phMin: 6, phMax: 7.5, propagation: 'Any trimmed stem section floats and grows on its own.' },
  { name: 'Bucephalandra', scientificName: 'Bucephalandra spp.', light: 'Low', co2: 'Low', growth: 'Slow', difficulty: 'Intermediate', placement: 'Epiphyte', tempMinC: 22, tempMaxC: 28, phMin: 6, phMax: 7, propagation: 'Rhizome division; plant on hardscape, never bury rhizome.' },
  { name: 'Dwarf Baby Tears', scientificName: 'Hemianthus callitrichoides', light: 'High', co2: 'High', growth: 'Fast', difficulty: 'Advanced', placement: 'Foreground', tempMinC: 20, tempMaxC: 26, phMin: 5, phMax: 7.5, propagation: 'Replant cuttings; needs strong light and CO₂ to form a dense carpet.' },
  { name: 'Ludwigia repens', scientificName: 'Ludwigia repens', light: 'Medium', co2: 'Low-Medium', growth: 'Fast', difficulty: 'Intermediate', placement: 'Background', tempMinC: 20, tempMaxC: 28, phMin: 6, phMax: 7.5, propagation: 'Cut stems and replant; tops turn red under strong light.' },
  { name: 'Ambulia', scientificName: 'Limnophila sessiliflora', light: 'Medium', co2: 'Low', growth: 'Fast', difficulty: 'Beginner', placement: 'Background', tempMinC: 22, tempMaxC: 28, phMin: 6, phMax: 7.5, propagation: 'Cuttings root easily; a great low-tech background plant.' },
  { name: 'Water Wisteria', scientificName: 'Hygrophila difformis', light: 'Medium', co2: 'Low', growth: 'Fast', difficulty: 'Beginner', placement: 'Background', tempMinC: 22, tempMaxC: 28, phMin: 6, phMax: 7.5, propagation: 'Cuttings; develops deeply divided leaves under good light.' },
  { name: 'Vallisneria spiralis', scientificName: 'Vallisneria spiralis', light: 'Medium', co2: 'None', growth: 'Medium', difficulty: 'Beginner', placement: 'Background', tempMinC: 18, tempMaxC: 28, phMin: 6.5, phMax: 8, propagation: 'Runners; spreads quickly across the back of the tank.' },
  { name: 'Rotala rotundifolia', scientificName: 'Rotala rotundifolia', light: 'Medium-High', co2: 'Medium', growth: 'Fast', difficulty: 'Intermediate', placement: 'Background', tempMinC: 22, tempMaxC: 28, phMin: 5.5, phMax: 7.5, propagation: 'Stem cuttings; turns pink-red under high light and iron.' },
  { name: 'Dwarf Sagittaria', scientificName: 'Sagittaria subulata', light: 'Low-Medium', co2: 'None', growth: 'Medium', difficulty: 'Beginner', placement: 'Foreground', tempMinC: 20, tempMaxC: 28, phMin: 6, phMax: 8, propagation: 'Runners; forms a nice lawn even without CO₂.' },
  { name: 'Alternanthera reineckii', scientificName: 'Alternanthera reineckii', light: 'Medium-High', co2: 'Medium', growth: 'Medium', difficulty: 'Intermediate', placement: 'Midground', tempMinC: 22, tempMaxC: 28, phMin: 5.5, phMax: 7.5, propagation: 'Stem cuttings; famous red accent plant.' },
  { name: 'Cabomba caroliniana', scientificName: 'Cabomba caroliniana', light: 'Medium', co2: 'Medium', growth: 'Fast', difficulty: 'Beginner', placement: 'Background', tempMinC: 18, tempMaxC: 28, phMin: 6, phMax: 7.5, propagation: 'Cuttings; delicate fan-like leaves shed if conditions are poor.' },
  { name: 'Marsilea hirsuta', scientificName: 'Marsilea hirsuta', light: 'Low-Medium', co2: 'Low', growth: 'Medium', difficulty: 'Beginner', placement: 'Foreground', tempMinC: 20, tempMaxC: 28, phMin: 6, phMax: 7.5, propagation: 'Runners; clover-like carpet that stays short in bright light.' },
  { name: 'Cryptocoryne balansae', scientificName: 'Cryptocoryne balansae', light: 'Medium', co2: 'Low', growth: 'Medium', difficulty: 'Intermediate', placement: 'Background', tempMinC: 22, tempMaxC: 28, phMin: 6, phMax: 7.5, propagation: 'Runners; long crinkled leaves up to 50 cm.' },
]

const coralData = [
  { name: 'Zoanthids', scientificName: 'Zoanthus spp.', light: 'Moderate', flow: 'Low-Moderate', difficulty: 'Beginner', placement: 'Low rock', aggression: 'Semi-aggressive', reefCompatibility: true, tempMinC: 24, tempMaxC: 27, excerpt: 'Colorful colonial polyps that are very forgiving for new reef keepers.' },
  { name: 'Hammer Coral', scientificName: 'Euphyllia ancora', light: 'Moderate', flow: 'Moderate', difficulty: 'Intermediate', placement: 'Mid rock', aggression: 'Aggressive', reefCompatibility: true, tempMinC: 24, tempMaxC: 27, excerpt: 'Has sweeping tentacles that can sting neighbors — give it space.' },
  { name: 'Staghorn Acropora', scientificName: 'Acropora millepora', light: 'High', flow: 'High', difficulty: 'Advanced', placement: 'High rock', aggression: 'Aggressive', reefCompatibility: true, tempMinC: 24, tempMaxC: 27, excerpt: 'A demanding SPS coral requiring pristine water and stable parameters.' },
  { name: 'Candy Cane Coral', scientificName: 'Caulastrea furcata', light: 'Low-Moderate', flow: 'Low-Moderate', difficulty: 'Beginner', placement: 'Sand bed', aggression: 'Peaceful', reefCompatibility: true, tempMinC: 24, tempMaxC: 27, excerpt: 'Distinctive fleshy polyps on a branching skeleton; great first LPS.' },
  { name: 'Ricordea Mushroom', scientificName: 'Ricordea florida', light: 'Low-Moderate', flow: 'Low', difficulty: 'Beginner', placement: 'Sand bed', aggression: 'Peaceful', reefCompatibility: true, tempMinC: 24, tempMaxC: 27, excerpt: 'Wavy, colorful mushrooms that are extremely hardy.' },
  { name: 'Duncan Coral', scientificName: 'Duncanopsammia axifuga', light: 'Moderate', flow: 'Moderate', difficulty: 'Beginner', placement: 'Mid rock', aggression: 'Peaceful', reefCompatibility: true, tempMinC: 24, tempMaxC: 27, excerpt: 'Long green tentacles with daisy-like tips; a hardy beginner LPS.' },
  { name: 'Goniopora', scientificName: 'Goniopora stokesi', light: 'Moderate-High', flow: 'Moderate', difficulty: 'Advanced', placement: 'Mid rock', aggression: 'Peaceful', reefCompatibility: true, tempMinC: 24, tempMaxC: 27, excerpt: 'The flower pot coral — challenging to keep long-term without diligent feeding.' },
  { name: 'Toadstool Leather', scientificName: 'Sarcophyton spp.', light: 'Moderate', flow: 'Low-Moderate', difficulty: 'Beginner', placement: 'Sand bed', aggression: 'Aggressive', reefCompatibility: true, tempMinC: 24, tempMaxC: 27, excerpt: 'Soft coral that sheds skin and releases chemical warfare when stressed.' },
  { name: 'Montipora Capricornis', scientificName: 'Montipora capricornis', light: 'Moderate-High', flow: 'Moderate-High', difficulty: 'Intermediate', placement: 'Mid rock', aggression: 'Peaceful', reefCompatibility: true, tempMinC: 24, tempMaxC: 27, excerpt: 'Plate-forming SPS that grows quickly once established.' },
  { name: 'Acan Lords', scientificName: 'Acanthastrea lordhowensis', light: 'Moderate', flow: 'Low-Moderate', difficulty: 'Intermediate', placement: 'Low rock', aggression: 'Aggressive', reefCompatibility: true, tempMinC: 24, tempMaxC: 27, excerpt: 'Fleshy, meaty corals with intense colors; will sting nearby corals at night.' },
  { name: 'Blastomussa', scientificName: 'Blastomussa wellsi', light: 'Low-Moderate', flow: 'Low', difficulty: 'Intermediate', placement: 'Low rock', aggression: 'Peaceful', reefCompatibility: true, tempMinC: 24, tempMaxC: 27, excerpt: 'A low-light LPS with bubble-like polyps, suited to shaded areas.' },
]

const equipmentData = [
  { name: 'Hang-On-Back Filter', category: 'Filter', excerpt: 'A simple filter that hangs on the tank rim. Ideal for small to medium freshwater tanks.', pros: ['Easy to install and maintain', 'Good surface agitation', 'Affordable'], cons: ['Limited media volume', 'Evaporation increases', 'Can be noisy at higher flow'] },
  { name: 'Canister Filter', category: 'Filter', excerpt: 'An external filter with high media capacity and flexible hose routing. Best for medium to large planted tanks.', pros: ['Large media capacity', 'Very quiet', 'Flexible media options'], cons: ['Higher cost', 'More setup work', 'Prime/startup care needed'] },
  { name: 'Sponge Filter', category: 'Filter', excerpt: 'An air-driven filter with a sponge media. Perfect for breeding tanks and shrimp setups.', pros: ['Extremely gentle flow', 'Great biological filtration', 'No electricity needed for moving parts'], cons: ['Low mechanical capacity', 'Needs air pump', 'Ugly in display tanks'] },
  { name: 'Internal Filter', category: 'Filter', excerpt: 'A compact submersible filter that sits inside the tank. Good for small aquariums.', pros: ['Compact', 'Cheap', 'Easy to service'], cons: ['Takes tank space', 'Lower capacity', 'Flow may disturb plants'] },
  { name: 'Submersible Heater', category: 'Heater', excerpt: 'Thermostatically controlled heating for tropical tanks. Choose roughly 1 watt per liter of water.', pros: ['Precise temperature control', 'Easy to place and hide', 'Wide wattage range'], cons: ['Glass versions can crack', 'Must stay submerged', 'Wattage must match tank size'] },
  { name: 'LED Aquarium Light', category: 'Light', excerpt: 'Energy-efficient lighting. For planted tanks, choose a fixture with full-spectrum LEDs and adjustable intensity.', pros: ['Low power use', 'Long lifespan', 'Full spectrum options'], cons: ['Initial cost', 'Poor units cause algae', 'PAR drops with water depth'] },
  { name: 'Circulation Pump (Powerhead)', category: 'Pump', excerpt: 'Provides water movement inside the tank. Essential for reef tanks and high-flow freshwater setups.', pros: ['Adjustable flow', 'Creates beneficial current', 'Easy to mount'], cons: ['Adds heat slightly', 'Needs regular cleaning', 'Placement matters'] },
  { name: 'Air Pump', category: 'Pump', excerpt: 'Drives sponge filters, air stones and surface agitation. Useful for emergency oxygenation.', pros: ['Cheap', 'Simple', 'Oxygenates on power-outage backup setups'], cons: ['Noise', 'Needs check valve', 'Low filtration power alone'] },
  { name: 'CO₂ Regulator Kit', category: 'CO₂ System', excerpt: 'Regulates CO₂ from a cylinder into your planted tank via diffuser or inline reactor.', pros: ['Enables high-tech planted tanks', 'Precise bubble control', 'Solenoid allows timer automation'], cons: ['Higher cost', 'Safety: use quality hardware', 'Needs drop checker to monitor'] },
  { name: 'Master Test Kit', category: 'Test Kit', excerpt: 'Liquid test kit for pH, ammonia, nitrite and nitrate. Essential for cycling and maintenance.', pros: ['Accurate if stored well', 'Covers all core parameters', 'Long shelf life'], cons: ['Expires', 'Manual reading', 'Higher quality costs more'] },
]

const problemData = [
  {
    name: 'Cloudy Water', category: 'water', slugKey: 'cloudy-water',
    excerpt: 'Milky or hazy water that never fully clears.',
    symptoms: ['White or gray haze in the water column', 'Often appears right after setup or water change', 'Can return daily even with regular maintenance'],
    causes: ['Bacterial bloom during tank cycling', 'Overfeeding or dead plant matter', 'Disturbed substrate releasing particles', 'Filter media too clean or undersized'],
    whatToCheck: ['Ammonia, nitrite and nitrate levels', 'Feed amount and frequency', 'Filter flow and media condition', 'Dead plant leaves and rotting decor'],
    whatNotToDo: ['Do not do massive 90% water changes', 'Do not add chemical clarifiers as a habit', 'Do not add fish to speed up cycling'],
  },
  {
    name: 'Green Water Algae Bloom', category: 'algae', slugKey: 'green-water',
    excerpt: 'Water turns bright green from suspended single-celled algae.',
    symptoms: ['Water is green and pea-soup like', 'Green color returns quickly after water change', 'Glass looks clean but water is colored'],
    causes: ['Excess light (sunlight or long photoperiod)', 'Nutrient imbalance with high phosphate', 'Low competition from plants', 'Overfeeding'],
    whatToCheck: ['Light duration and intensity', 'Phosphate and nitrate readings', 'Live plant health and coverage', 'Direct sunlight exposure'],
    whatNotToDo: ['Do not rely on water changes alone', 'Do not blackout the tank for days without oxygen management', 'Do not use UV sterilizer without addressing the cause'],
  },
  {
    name: 'Brown Diatom Algae', category: 'algae', slugKey: 'brown-diatom-algae',
    excerpt: 'A dusty brown coating on glass, plants and decor, common in new tanks.',
    symptoms: ['Brown dust-like film on surfaces', 'Easy to wipe off but returns', 'Mostly in lower light areas'],
    causes: ['Normal part of the nitrogen cycle', 'High silicate in tap water', 'Low light conditions'],
    whatToCheck: ['Tank age (under 3 months = usually normal)', 'Silicate in source water', 'Stocking of algae eaters'],
    whatNotToDo: ['Do not use harsh chemical treatments', 'Do not scrub decorations aggressively (bacteria live there)'],
  },
  {
    name: 'Black Beard Algae', category: 'algae', slugKey: 'black-beard-algae',
    excerpt: 'Dark, hairy tufts that cling to hardscape and slow-growing plants.',
    symptoms: ['Black or dark green fuzzy patches', 'Grows on driftwood, rocks and plant edges', 'Very hard to remove by hand'],
    causes: ['Fluctuating CO₂ in planted tanks', 'High organic waste and phosphate', 'Low-flow dead zones', 'Inconsistent maintenance'],
    whatToCheck: ['CO₂ stability with a drop checker', 'Phosphate levels', 'Flow and dead spots', 'Filter cleaning schedule'],
    whatNotToDo: ['Do not bleach live plants', 'Do not add more fish to eat it before fixing the root cause'],
  },
  {
    name: 'Fish Gasping at Surface', category: 'fish', slugKey: 'fish-gasping-surface',
    excerpt: 'Fish hover at the surface, breathing rapidly. A possible oxygen emergency.',
    symptoms: ['Fish at surface gulping air', 'Rapid gill movement', 'Lethargic behavior'],
    causes: ['Low dissolved oxygen (high temperature or overcrowding)', 'Ammonia or nitrite spike', 'Bacterial bloom consuming oxygen', 'Damaged gills from parasites'],
    whatToCheck: ['Ammonia and nitrite immediately', 'Water temperature', 'Surface agitation and air pump', 'Filter condition'],
    whatNotToDo: ['Do not wait and watch — this can be fatal quickly', 'Do not add chemicals without testing first'],
  },
  {
    name: 'White Spot Disease (Ich)', category: 'fish', slugKey: 'white-spot-disease',
    excerpt: 'Tiny white salt-like grains on the body and fins of fish.',
    symptoms: ['White dots smaller than 1 mm on body and fins', 'Fish flashing against decor', 'Clamped fins and loss of appetite'],
    causes: ['Ich parasite (Ichthyophthirius multifiliis)', 'New fish introduced without quarantine', 'Temperature stress'],
    whatToCheck: ['Quarantine any new additions', 'Water temperature stability', 'Treatment duration (follow the full lifecycle)'],
    whatNotToDo: ['Do not stop treatment early when spots disappear', 'Do not mix incompatible treatments', 'Do not ignore stress factors'],
  },
  {
    name: 'Plant Leaves Melting', category: 'plants', slugKey: 'plant-leaves-melting',
    excerpt: 'Leaves turn transparent, mushy and fall apart shortly after planting.',
    symptoms: ['Leaves become translucent and soft', 'Tissue breaks down within days to weeks', 'New growth may still appear healthy'],
    causes: ['Emersed-grown plants adjusting to submersed growth', 'Cryptocoryne melt triggered by water change', 'Sudden light or temperature change'],
    whatToCheck: ['Growth stage of the plant', 'Stability of water parameters', 'Crown and root health'],
    whatNotToDo: ['Do not pull out melting plants immediately — they often regrow', 'Do not change parameters drastically to fix it'],
  },
  {
    name: 'Cyanobacteria (Blue-Green Slime)', category: 'water', slugKey: 'cyanobacteria',
    excerpt: 'Slimy blue-green or dark purple patches with a foul odor.',
    symptoms: ['Blue-green slime that lifts in sheets', 'Musty or earthy smell', 'Covers substrate and decor quickly'],
    causes: ['High organic waste and low flow', 'Low nitrate with high phosphate imbalance', 'Poor oxygenation', 'Overfeeding'],
    whatToCheck: ['Phosphate and nitrate readings', 'Flow and dead zones', 'Feeding amounts', 'Light cycle length'],
    whatNotToDo: ['Do not rely only on manual removal', 'Do not use antibiotics without expert guidance'],
  },
  {
    name: 'High Ammonia Poisoning', category: 'water', slugKey: 'high-ammonia',
    excerpt: 'Elevated ammonia levels cause burns, redness and rapid breathing.',
    symptoms: ['Red or inflamed gills', 'Rapid breathing and gasping', 'Lethargy, loss of appetite', 'Fish staying at the surface'],
    causes: ['Tank not fully cycled', 'Overstocking or overfeeding', 'Dead fish or decaying plant matter', 'Filter crash'],
    whatToCheck: ['Ammonia level (must be 0 in a cycled tank)', 'Nitrite and nitrate trend', 'Stocking density', 'Filter health'],
    whatNotToDo: ['Do not add more fish until ammonia is 0', 'Do not do sudden large changes without dechlorinating'],
  },
  {
    name: 'Low Filter Flow', category: 'equipment', slugKey: 'low-filter-flow',
    excerpt: 'The filter output weakens, reducing circulation and filtration.',
    symptoms: ['Visible drop in output flow', 'Debris settling on substrate', 'Algae in dead zones'],
    causes: ['Clogged intake or media', 'Impeller fouled or worn', 'Air trapped in the impeller housing', 'Kinked or dirty hoses'],
    whatToCheck: ['Intake sponge and pipe', 'Media condition and cleaning schedule', 'Impeller and shaft', 'Hoses for kinks and biofilm'],
    whatNotToDo: ['Do not clean all media in tap water at once (kills beneficial bacteria)', 'Do not ignore flow loss for weeks'],
  },
  {
    name: 'Fish Hiding or Chronic Stress', category: 'fish', slugKey: 'fish-hiding',
    excerpt: 'Fish hide constantly, refuse food and fade in color.',
    symptoms: ['Fish stay behind decor all day', 'Refusing food', 'Pale or dark color changes', 'Erratic darting'],
    causes: ['Bullying or incompatible tankmates', 'Too few hiding places for shy species', 'Poor water parameters', 'Loud or high-traffic area'],
    whatToCheck: ['Tankmate aggression and compatibility', 'Water parameters', 'Hiding spots and plant cover', 'Feeding response'],
    whatNotToDo: ['Do not add more fish hoping to distract aggressors', 'Do not dismiss it as normal for newly added fish for weeks'],
  },
]

const inspirationData = [
  {
    name: 'Classic Iwagumi', style: 'Iwagumi', tankSizeL: 120, difficulty: 'Intermediate',
    excerpt: 'A minimalist scape built around three stones and a single carpeting plant. The golden ratio guides stone placement.',
    hardscape: 'Seiryu stone trio with a slight forward lean; fine sand substrate in the foreground.',
  },
  {
    name: 'Low-Tech Nature Aquarium', style: 'Nature Aquarium', tankSizeL: 90, difficulty: 'Beginner',
    excerpt: 'A budget-friendly scape using easy plants and no CO₂ injection. Relies on low light and patience.',
    hardscape: 'Driftwood centerpiece with Anubias and Java Fern attached; gravel substrate.',
  },
  {
    name: 'Dutch Planted Tank', style: 'Dutch', tankSizeL: 200, difficulty: 'Advanced',
    excerpt: 'A plant-focused layout with terraced stems of contrasting colors, from foreground to background.',
    hardscape: 'Minimal hardscape — the plants themselves create the structure in tight rows.',
  },
  {
    name: 'Jungle Biotope', style: 'Jungle', tankSizeL: 150, difficulty: 'Beginner',
    excerpt: 'A dense, chaotic planting style that mimics a riverbank habitat. Great for shy fish and shrimp.',
    hardscape: 'Root wood tangles, leaf litter and floating plants for shaded areas.',
  },
  {
    name: 'Nano Paludarium', style: 'Paludarium', tankSizeL: 30, difficulty: 'Intermediate',
    excerpt: 'A small emersed setup with water, moss and terrestrial plants on a built-up slope.',
    hardscape: 'Foam and stone slope with emergent wood; waterfall feature adds humidity.',
  },
]

async function mutate(mutations) {
  const res = await fetch(MUTATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ mutations }),
  })
  const json = await res.json()
  if (json.error) {
    console.error('Mutation error:', JSON.stringify(json.error).slice(0, 300))
    process.exitCode = 1
  }
  return json
}

function speciesDoc(s) {
  return {
    _id: 'species-' + s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    _type: 'species',
    name: s.commonName,
    scientificName: s.name,
    family: s.family,
    origin: s.origin,
    excerpt: s.excerpt,
    publishedAt: PUBLISHED,
    sizeCm: s.sizeCm,
    tankSizeMinL: s.tankSizeMinL,
    tempMinC: s.tempMinC,
    tempMaxC: s.tempMaxC,
    phMin: s.phMin,
    phMax: s.phMax,
    ghMin: s.ghMin,
    ghMax: s.ghMax,
    diet: s.diet,
    temperament: s.temperament,
    waterZone: s.waterZone,
    schooling: s.schooling,
    difficulty: s.difficulty,
    slug: slug(s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')),
  }
}

function plantDoc(p) {
  return {
    _id: 'plant-' + p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    _type: 'plant',
    name: p.name,
    scientificName: p.scientificName,
    slug: slug(p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')),
    excerpt: `Care profile for ${p.name}: ${p.light.toLowerCase()} light, ${p.co2.toLowerCase()} CO₂, ${p.difficulty.toLowerCase()} difficulty.`,
    publishedAt: PUBLISHED,
    light: p.light,
    co2: p.co2,
    growth: p.growth,
    difficulty: p.difficulty,
    placement: p.placement,
    tempMinC: p.tempMinC,
    tempMaxC: p.tempMaxC,
    phMin: p.phMin,
    phMax: p.phMax,
    propagation: p.propagation,
  }
}

function coralDoc(c) {
  return {
    _id: 'coral-' + c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    _type: 'coral',
    name: c.name,
    scientificName: c.scientificName,
    slug: slug(c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')),
    excerpt: c.excerpt,
    publishedAt: PUBLISHED,
    light: c.light,
    flow: c.flow,
    difficulty: c.difficulty,
    placement: c.placement,
    aggression: c.aggression,
    reefCompatibility: c.reefCompatibility,
    tempMinC: c.tempMinC,
    tempMaxC: c.tempMaxC,
  }
}

function equipmentDoc(e) {
  return {
    _id: 'equipment-' + e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    _type: 'equipment',
    name: e.name,
    slug: slug(e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')),
    excerpt: e.excerpt,
    publishedAt: PUBLISHED,
    category: e.category,
    pros: e.pros || [],
    cons: e.cons || [],
  }
}

function problemDoc(p) {
  return {
    _id: 'problem-' + p.slugKey,
    _type: 'problem',
    title: p.name,
    slug: slug(p.slugKey),
    excerpt: p.excerpt,
    publishedAt: PUBLISHED,
    category: p.category,
    symptoms: ptList(p.symptoms),
    causes: ptList(p.causes),
    whatToCheck: ptList(p.whatToCheck),
    whatNotToDo: ptList(p.whatNotToDo),
  }
}

function inspirationDoc(i) {
  return {
    _id: 'inspiration-' + i.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    _type: 'inspiration',
    title: i.name,
    slug: slug(i.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')),
    excerpt: i.excerpt,
    publishedAt: PUBLISHED,
    style: i.style,
    tankSizeL: i.tankSizeL,
    difficulty: i.difficulty,
    hardscape: i.hardscape,
  }
}

const batch = async (label, docs) => {
  const mutations = docs.map((doc) => ({ createOrReplace: doc }))
  const res = await mutate(mutations)
  const ok = res.results ? res.results.length : 0
  console.log(`${label}: ${ok}/${docs.length} docs`)
}

console.log('Seeding AquaMind database...')
await batch('Species', speciesData.map(speciesDoc))
await batch('Plants', plantData.map(plantDoc))
await batch('Corals', coralData.map(coralDoc))
await batch('Equipment', equipmentData.map(equipmentDoc))
await batch('Problems', problemData.map(problemDoc))
await batch('Inspiration', inspirationData.map(inspirationDoc))
console.log('Done.')
