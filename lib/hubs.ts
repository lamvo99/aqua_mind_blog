import { getAllPosts } from './posts'

export interface HubArticle {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  publishedAt?: string
  mainImage?: any
  categories?: { title: string; slug: { current: string } }[]
  tags?: string[]
  author?: { name?: string; image?: any }
  isFeatured?: boolean
}

export interface HubLink {
  href: string
  label: string
  description: string
}

export interface KnowledgeHub {
  slug: string
  title: string
  description: string
  intro: string
  reader: string
  articles: HubArticle[]
  articleSlugs: string[]
  databaseLinks: HubLink[]
  collections: HubLink[]
  nextStep: HubLink
  entityTypes: string[]
}

interface HubDefinition {
  slug: string
  title: string
  description: string
  intro: string
  reader: string
  match: (post: HubArticle) => boolean
  databaseLinks: HubLink[]
  collections: HubLink[]
  nextStep: HubLink
  entityTypes: string[]
  articleLimit?: number
}

const WATER_TAGS = new Set([
  'water quality',
  'ph',
  'gh',
  'kh',
  'tds',
  'ammonia',
  'nitrite',
  'nitrate',
  'nitrogen cycle',
  'water testing',
  'aquarium water parameters',
  'water change',
])

const PLANTED_TAGS = new Set([
  'planted aquarium',
  'planted tank',
  'aquatic plants',
  'aquascaping',
  'co2',
  'low-tech aquarium',
  'low-tech planted tank',
  'algae control',
])

function tagSet(post: HubArticle): Set<string> {
  return new Set((post.tags || []).map((tag) => tag.toLowerCase()))
}

function categorySet(post: HubArticle): Set<string> {
  return new Set((post.categories || []).map((category) => category.slug.current))
}

function hasAnyTag(post: HubArticle, tags: Set<string>): boolean {
  const values = tagSet(post)
  return Array.from(tags).some((tag) => values.has(tag))
}

const HUB_DEFINITIONS: HubDefinition[] = [
  {
    slug: 'water-parameters',
    title: 'Water parameters',
    description:
      'Learn what pH, GH, KH, TDS, ammonia, nitrite and nitrate mean, how to test them, and how to keep them stable.',
    intro:
      'Water chemistry is easier when you understand the few measurements that actually change decisions. This hub starts with the parameters, then connects them to the problems and tools that use them.',
    reader: 'For newer aquarists who can test a tank but are not sure what the numbers mean or which value to change first.',
    match: (post) => hasAnyTag(post, WATER_TAGS),
    databaseLinks: [
      { href: '/problems/high-ammonia', label: 'High ammonia', description: 'Symptoms, checks and what not to do.' },
      { href: '/problems/problem-high-nitrite', label: 'High nitrite', description: 'Why nitrite spikes and what to verify.' },
      { href: '/problems/problem-high-nitrate', label: 'High nitrate', description: 'Sources, test caveats and routine checks.' },
      { href: '/problems/cloudy-water', label: 'Cloudy water', description: 'Bacterial bloom vs particles vs green water.' },
      { href: '/equipment/master-test-kit', label: 'Master test kit', description: 'The test-kit entry in the equipment database.' },
      { href: '/tools/water-change', label: 'Water-change calculator', description: 'Plan a change instead of guessing.' },
    ],
    collections: [],
    nextStep: {
      href: '/problems/diagnose',
      label: 'Diagnose a water problem',
      description: 'Pick the symptoms you can see and get ranked likely causes.',
    },
    entityTypes: ['species', 'invertebrate', 'coral', 'equipment'],
    articleLimit: 6,
  },
  {
    slug: 'planted-tank',
    title: 'Planted tank',
    description:
      'A practical path into planted aquariums: light, CO₂, nutrients, algae and low-tech plant choices.',
    intro:
      'Planted tanks fail on balance, not on a single product. This hub groups the articles that explain light, CO₂, nutrients and algae, then points to the plant records and tools that help you plan.',
    reader: 'For aquarists moving from a fish-only tank to live plants, or fixing a planted tank that keeps growing algae.',
    match: (post) => hasAnyTag(post, PLANTED_TAGS) || categorySet(post).has('aquatic-plants'),
    databaseLinks: [
      { href: '/plants', label: 'Plant database', description: 'Browse plants by light, CO₂ and growth form.' },
      { href: '/tools/co2', label: 'CO₂ estimator', description: 'Estimate dissolved CO₂ from KH and pH.' },
      { href: '/tools/lighting', label: 'Lighting estimator', description: 'Sanity-check LED light for a planted tank.' },
      { href: '/problems/black-beard-algae', label: 'Black beard algae', description: 'A common planted-tank problem guide.' },
    ],
    collections: [
      { href: '/collections/low-tech-planted', label: 'Low-tech planted aquarium', description: 'A data-backed starting point without injected CO₂.' },
      { href: '/collections/beginner-freshwater', label: 'Beginner freshwater aquarium', description: 'Beginner-level fish, plants and invertebrates.' },
    ],
    nextStep: {
      href: '/plants',
      label: 'Browse the plant database',
      description: 'Check the stored light and CO₂ requirements before buying.',
    },
    entityTypes: ['plant'],
    articleLimit: 6,
  },
  {
    slug: 'aquarium-problems',
    title: 'Aquarium problems',
    description:
      'Learn from real aquarium problems: algae, cloudy water, new-tank syndrome, mini-cycles and water-quality crashes.',
    intro:
      'A problem is easier to solve when you can see the pattern. These articles explain common causes and checks; the problem database and diagnosis tool then help you narrow it down for your own tank.',
    reader: 'For aquarists who see a symptom and want to understand it before changing the tank.',
    match: (post) => categorySet(post).has('pest-and-problems'),
    databaseLinks: [
      { href: '/problems', label: 'Problem database', description: 'Symptoms, checks and what not to do.' },
      { href: '/problems/diagnose', label: 'Symptom diagnosis', description: 'Rank likely causes from the symptoms you can see.' },
      { href: '/problems/fish-gasping-surface', label: 'Fish gasping at the surface', description: 'An oxygen and water-quality check.' },
      { href: '/tools/diagnostic', label: 'Diagnostic tool', description: 'The legacy symptom tool, retained for existing links.' },
    ],
    collections: [],
    nextStep: {
      href: '/problems/diagnose',
      label: 'Start with the symptoms',
      description: 'Use the diagnosis wizard before making a large change.',
    },
    entityTypes: ['problem'],
    articleLimit: 6,
  },
  {
    slug: 'aquarium-equipment',
    title: 'Aquarium equipment',
    description:
      'Choose the equipment a tank actually needs, understand filter types, and avoid buying by habit.',
    intro:
      'Equipment is a system: filter, heater, light, test kit and flow have to match the tank. These articles explain the basics; the equipment database and calculators help with the specifics.',
    reader: 'For first-tank buyers and aquarists replacing a filter, heater or light without overbuying.',
    match: (post) =>
      categorySet(post).has('equipment') ||
      categorySet(post).has('aquarium-equipment') ||
      hasAnyTag(post, new Set(['equipment', 'filter', 'aquarium equipment'])),
    databaseLinks: [
      { href: '/equipment', label: 'Equipment database', description: 'Filters, heaters, lights, pumps and test kits.' },
      { href: '/equipment/aquarium-thermometer', label: 'Aquarium thermometer', description: 'A basic temperature check.' },
      { href: '/equipment/master-test-kit', label: 'Master test kit', description: 'The test-kit entry.' },
      { href: '/tools/pump-flow', label: 'Pump and filter flow', description: 'Check turnover for the tank volume.' },
      { href: '/tools/lighting', label: 'Lighting estimator', description: 'Sanity-check light for the tank.' },
    ],
    collections: [],
    nextStep: {
      href: '/equipment',
      label: 'Browse the equipment database',
      description: 'Check capacity and limitations on the record, not just the label.',
    },
    entityTypes: ['equipment'],
    articleLimit: 6,
  },
]

export const HUB_SLUGS = HUB_DEFINITIONS.map((definition) => definition.slug)

function buildHub(definition: HubDefinition, posts: HubArticle[]): KnowledgeHub | null {
  const articles = posts
    .filter((post) => post.slug?.current && definition.match(post))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')))
    .slice(0, definition.articleLimit || 6)

  const qualifies =
    articles.length >= 3 ||
    (articles.length >= 2 && definition.databaseLinks.length >= 3)

  if (!qualifies) return null

  return {
    slug: definition.slug,
    title: definition.title,
    description: definition.description,
    intro: definition.intro,
    reader: definition.reader,
    articles,
    articleSlugs: articles.map((article) => article.slug.current),
    databaseLinks: definition.databaseLinks,
    collections: definition.collections,
    nextStep: definition.nextStep,
    entityTypes: definition.entityTypes,
  }
}

export function buildHubsFromPosts(posts: HubArticle[]): KnowledgeHub[] {
  return HUB_DEFINITIONS.map((definition) => buildHub(definition, posts)).filter(
    (hub): hub is KnowledgeHub => hub !== null
  )
}

export async function getAllHubs(): Promise<KnowledgeHub[]> {
  try {
    const posts = (await getAllPosts()) as HubArticle[]
    return buildHubsFromPosts(posts)
  } catch {
    return []
  }
}

export async function getHub(slug: string): Promise<KnowledgeHub | null> {
  const hubs = await getAllHubs()
  return hubs.find((hub) => hub.slug === slug) || null
}

export function hubLink(hub: KnowledgeHub): HubLink {
  return { href: `/hubs/${hub.slug}`, label: hub.title, description: hub.description }
}

function definitionLink(definition: HubDefinition): HubLink {
  return {
    href: `/hubs/${definition.slug}`,
    label: definition.title,
    description: definition.description,
  }
}

/**
 * Hub links are resolved from the static hub definitions, not from a second
 * article query. Hub pages themselves still re-check content qualification at
 * build time. This keeps detail pages to their normal database query instead of
 * adding one article query per record.
 */
export async function getHubLinksForEntity(entityType: string): Promise<HubLink[]> {
  return HUB_DEFINITIONS.filter((definition) => definition.entityTypes.includes(entityType)).map(
    definitionLink
  )
}

export async function getHubLinksForPost(post: HubArticle): Promise<HubLink[]> {
  if (!post.slug?.current) return []
  return HUB_DEFINITIONS.filter((definition) => definition.match(post)).map(definitionLink)
}
