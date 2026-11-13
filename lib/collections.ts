import { getDatabaseCompareItems } from './database'

export interface CollectionItem {
  id: string
  type: string
  typeLabel: string
  name: string
  slug: string
  href: string
  why: string[]
}

export interface CollectionGroup {
  type: string
  label: string
  items: CollectionItem[]
}

export interface CollectionLink {
  href: string
  label: string
}

export interface Collection {
  slug: string
  title: string
  intent: string
  description: string
  criteria: string[]
  limitations?: string[]
  groups: CollectionGroup[]
  total: number
  furtherReading?: CollectionLink[]
}

interface Corpus {
  species: any[]
  plant: any[]
  coral: any[]
  invertebrate: any[]
  equipment: any[]
}

const TYPE_LABEL: Record<string, string> = {
  species: 'Fish',
  plant: 'Plants',
  coral: 'Corals',
  invertebrate: 'Invertebrates',
  equipment: 'Equipment',
}

const TYPE_PATH: Record<string, string> = {
  species: '/species',
  plant: '/plants',
  coral: '/corals',
  invertebrate: '/invertebrates',
  equipment: '/equipment',
}

function item(type: string, doc: any, why: Array<string | null | undefined>): CollectionItem {
  return {
    id: doc._id,
    type,
    typeLabel: TYPE_LABEL[type],
    name: doc.name,
    slug: doc.slug?.current,
    href: `${TYPE_PATH[type]}/${doc.slug?.current}`,
    why: why.filter((value): value is string => typeof value === 'string' && value.length > 0),
  }
}

function group(type: string, items: CollectionItem[]): CollectionGroup | null {
  if (items.length === 0) return null
  return { type, label: TYPE_LABEL[type], items }
}

const LOW_TECH_LIGHT = ['Low', 'Low-Medium', 'Medium']

const DEFINITIONS: Array<{
  slug: string
  title: string
  intent: string
  description: string
  criteria: string[]
  limitations?: string[]
  furtherReading?: CollectionLink[]
  build: (corpus: Corpus) => Array<CollectionGroup | null>
}> = [
  {
    slug: 'beginner-freshwater',
    title: 'Beginner freshwater aquarium',
    intent: 'Start a freshwater community tank with records the database already marks as beginner-level.',
    description:
      'Fish, plants and invertebrates from freshwater records whose stored difficulty is “Beginner”. This is a starting point, not a guarantee of compatibility between every item.',
    criteria: [
      'Water type is stored as freshwater.',
      'Difficulty is stored as Beginner.',
      'The record has a published slug and a name.',
    ],
    limitations: [
      'Compatibility between individual species is only shown where the database has a verified compatibility entry.',
      'Tank size still has to be checked on each record.',
    ],
    furtherReading: [
      { href: '/start-here', label: 'Start Here' },
      { href: '/posts/the-easiest-aquarium-fish-for-beginners', label: 'The easiest aquarium fish for beginners' },
    ],
    build: (corpus) => [
      group(
        'species',
        corpus.species
          .filter((doc) => doc.waterType === 'freshwater' && doc.difficulty === 'Beginner')
          .map((doc) => item('species', doc, ['Freshwater', 'Difficulty: Beginner', doc.tankSizeMinL ? `Minimum tank: ${doc.tankSizeMinL} L` : null]))
      ),
      group(
        'invertebrate',
        corpus.invertebrate
          .filter((doc) => doc.waterType === 'freshwater' && doc.difficulty === 'Beginner')
          .map((doc) => item('invertebrate', doc, ['Freshwater', 'Difficulty: Beginner', doc.group ? `Group: ${doc.group}` : null]))
      ),
      group(
        'plant',
        corpus.plant
          .filter((doc) => doc.difficulty === 'Beginner')
          .map((doc) => item('plant', doc, ['Difficulty: Beginner', doc.light ? `Light: ${doc.light}` : null, doc.co2 ? `CO₂: ${doc.co2}` : null]))
      ),
    ],
  },
  {
    slug: 'nano-aquarium',
    title: 'Nano aquarium',
    intent: 'Find records that fit a small freshwater tank without guessing from a name.',
    description:
      'Freshwater fish whose stored minimum tank is 40 L or less, small freshwater invertebrates, and equipment whose stored tank minimum is 40 L or less.',
    criteria: [
      'Fish: freshwater and minimum tank ≤ 40 L.',
      'Invertebrates: freshwater and adult size ≤ 5 cm (or no size recorded).',
      'Equipment: stored minimum tank ≤ 40 L.',
    ],
    limitations: [
      'A minimum tank is not a full swimming-space check; check the record and its footprint fields.',
      'Equipment capacity can be more restrictive than the tank range suggests.',
    ],
    build: (corpus) => [
      group(
        'species',
        corpus.species
          .filter((doc) => doc.waterType === 'freshwater' && typeof doc.tankSizeMinL === 'number' && doc.tankSizeMinL <= 40)
          .map((doc) => item('species', doc, [`Minimum tank: ${doc.tankSizeMinL} L`, doc.difficulty ? `Difficulty: ${doc.difficulty}` : null]))
      ),
      group(
        'invertebrate',
        corpus.invertebrate
          .filter((doc) => doc.waterType === 'freshwater' && (doc.sizeCm == null || doc.sizeCm <= 5))
          .map((doc) => item('invertebrate', doc, [doc.sizeCm ? `Adult size: ${doc.sizeCm} cm` : 'Size not recorded', doc.group ? `Group: ${doc.group}` : null]))
      ),
      group(
        'equipment',
        corpus.equipment
          .filter((doc) => typeof doc.tankSizeMinL === 'number' && doc.tankSizeMinL <= 40)
          .map((doc) => item('equipment', doc, [`Suitable from ${doc.tankSizeMinL} L`, doc.category ? `Category: ${doc.category}` : null]))
      ),
    ],
  },
  {
    slug: 'low-tech-planted',
    title: 'Low-tech planted aquarium',
    intent: 'Choose plants for a tank without injected CO₂.',
    description:
      'Plants whose stored CO₂ requirement is “None” and whose light requirement is low to medium. This is a data-backed starting point for a low-tech planted tank.',
    criteria: [
      'CO₂ is stored as None.',
      'Light is Low, Low-Medium or Medium.',
      'The record has a published slug.',
    ],
    limitations: [
      'Low-tech tanks still need appropriate light and nutrients; “None” refers to injected CO₂ only.',
      'Plant growth and trimming depend on the individual setup.',
    ],
    furtherReading: [
      { href: '/posts/low-tech-aquarium-without-co2', label: 'Low-tech aquarium without CO₂' },
      { href: '/tools/co2', label: 'CO₂ estimator' },
    ],
    build: (corpus) => [
      group(
        'plant',
        corpus.plant
          .filter((doc) => doc.co2 === 'None' && LOW_TECH_LIGHT.includes(doc.light))
          .map((doc) => item('plant', doc, ['CO₂: None', doc.light ? `Light: ${doc.light}` : null, doc.growth ? `Growth: ${doc.growth}` : null]))
      ),
    ],
  },
  {
    slug: 'shrimp-aquarium',
    title: 'Shrimp aquarium',
    intent: 'Find freshwater shrimp records for a dedicated shrimp tank.',
    description:
      'Invertebrate records whose stored group is “shrimp” and water type is freshwater.',
    criteria: ['Group is stored as shrimp.', 'Water type is freshwater.', 'The record has a published slug.'],
    limitations: [
      'Shrimp compatibility with fish is only shown where the database has a verified compatibility entry.',
      'Copper and medication sensitivity is not uniformly recorded; check the individual record.',
    ],
    furtherReading: [
      { href: '/posts/how-to-set-up-a-neocaridina-shrimp-tank', label: 'How to set up a Neocaridina shrimp tank' },
      { href: '/posts/how-to-cycle-a-shrimp-tank', label: 'How to cycle a shrimp tank' },
    ],
    build: (corpus) => [
      group(
        'invertebrate',
        corpus.invertebrate
          .filter((doc) => doc.waterType === 'freshwater' && doc.group === 'shrimp')
          .map((doc) => item('invertebrate', doc, ['Freshwater', 'Group: Shrimp', doc.difficulty ? `Difficulty: ${doc.difficulty}` : null]))
      ),
    ],
  },
  {
    slug: 'beginner-reef',
    title: 'Beginner reef aquarium',
    intent: 'Start a reef tank with corals the database marks as beginner-level and reef-compatible.',
    description:
      'Corals whose stored difficulty is “Beginner” and whose stored reef-compatibility flag is true. The flag describes the record’s stored status, not a guarantee for every tank.',
    criteria: ['Difficulty is stored as Beginner.', 'Reef compatibility is stored as true.', 'The record has a published slug.'],
    limitations: [
      'Coral records currently have limited water-chemistry and PAR coverage; check the record and wait for the P0-D accuracy work before treating this as a complete care plan.',
      'Reef compatibility does not describe growth or space competition.',
    ],
    build: (corpus) => [
      group(
        'coral',
        corpus.coral
          .filter((doc) => doc.difficulty === 'Beginner' && doc.reefCompatibility === true)
          .map((doc) => item('coral', doc, ['Difficulty: Beginner', 'Reef compatibility: true (as stored)', doc.coralType ? `Type: ${doc.coralType.toUpperCase()}` : null]))
      ),
    ],
  },
  {
    slug: 'soft-coral',
    title: 'Soft coral aquarium',
    intent: 'Browse soft corals without mixing them with stony coral records.',
    description: 'Coral records whose stored coral type is “soft”.',
    criteria: ['Coral type is stored as soft.', 'The record has a published slug.'],
    limitations: [
      'PAR, flow and growth/space fields are not consistently populated; check the individual record.',
      'Aggression and reef-safety labels do not describe overgrowth by themselves.',
    ],
    build: (corpus) => [
      group(
        'coral',
        corpus.coral
          .filter((doc) => doc.coralType === 'soft')
          .map((doc) => item('coral', doc, [doc.difficulty ? `Difficulty: ${doc.difficulty}` : null, doc.light ? `Light: ${doc.light}` : null, doc.flow ? `Flow: ${doc.flow}` : null]))
      ),
    ],
  },
  {
    slug: 'nano-marine',
    title: 'Nano marine aquarium',
    intent: 'Find marine fish records with a stored minimum tank of 100 L or less.',
    description:
      'Saltwater fish whose stored minimum tank is 100 L or less. This is a size filter, not a beginner guarantee.',
    criteria: ['Water type is stored as saltwater.', 'Minimum tank is 100 L or less.', 'The record has a published slug.'],
    limitations: [
      'Small tank size does not imply beginner suitability; check the record’s difficulty and behaviour.',
      'Marine chemistry guidance is outside this collection and is not inferred.',
    ],
    build: (corpus) => [
      group(
        'species',
        corpus.species
          .filter((doc) => doc.waterType === 'saltwater' && typeof doc.tankSizeMinL === 'number' && doc.tankSizeMinL <= 100)
          .map((doc) => item('species', doc, ['Saltwater', `Minimum tank: ${doc.tankSizeMinL} L`, doc.difficulty ? `Difficulty: ${doc.difficulty}` : null]))
      ),
    ],
  },
  {
    slug: 'beginner-invertebrates',
    title: 'Beginner invertebrates',
    intent: 'Find invertebrate records the database marks as beginner-level.',
    description: 'All invertebrate records whose stored difficulty is “Beginner”, across fresh and salt water.',
    criteria: ['Difficulty is stored as Beginner.', 'The record has a published slug.'],
    limitations: [
      'Water type and tank suitability still have to be checked on the record.',
      'This collection does not assert compatibility with fish.',
    ],
    build: (corpus) => [
      group(
        'invertebrate',
        corpus.invertebrate
          .filter((doc) => doc.difficulty === 'Beginner')
          .map((doc) => item('invertebrate', doc, [doc.waterType ? `Water: ${doc.waterType}` : null, doc.group ? `Group: ${doc.group}` : null]))
      ),
    ],
  },
]

async function loadCorpus(): Promise<Corpus> {
  const [species, plant, coral, invertebrate, equipment] = await Promise.all([
    getDatabaseCompareItems('species'),
    getDatabaseCompareItems('plant'),
    getDatabaseCompareItems('coral'),
    getDatabaseCompareItems('invertebrate'),
    getDatabaseCompareItems('equipment'),
  ])
  return { species, plant, coral, invertebrate, equipment }
}

function buildCollection(
  definition: (typeof DEFINITIONS)[number],
  corpus: Corpus
): Collection {
  const groups = definition.build(corpus).filter((entry): entry is CollectionGroup => entry !== null)
  return {
    slug: definition.slug,
    title: definition.title,
    intent: definition.intent,
    description: definition.description,
    criteria: definition.criteria,
    limitations: definition.limitations,
    groups,
    total: groups.reduce((sum, entry) => sum + entry.items.length, 0),
    furtherReading: definition.furtherReading,
  }
}

/**
 * Builds every collection whose criteria match real records. Collections with
 * zero matching records are not published.
 */
export async function getCollections(): Promise<Collection[]> {
  try {
    const corpus = await loadCorpus()
    return DEFINITIONS.map((definition) => buildCollection(definition, corpus)).filter((collection) => collection.total > 0)
  } catch {
    return []
  }
}

export async function getCollection(slug: string): Promise<Collection | null> {
  try {
    const corpus = await loadCorpus()
    const definition = DEFINITIONS.find((entry) => entry.slug === slug)
    if (!definition) return null
    const collection = buildCollection(definition, corpus)
    return collection.total > 0 ? collection : null
  } catch {
    return null
  }
}

/** Collections considered but not published because the data cannot support them. */
export const UNPUBLISHED_COLLECTIONS = [
  {
    slug: 'fowlr',
    reason:
      'No field distinguishes a fish-only-with-live-rock setup. The only available signal is reefCompatibility=false (11 records), which is not a FOWLR criterion and would create an unsupported claim.',
  },
]
