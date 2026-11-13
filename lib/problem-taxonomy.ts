import mapping from './pilots/spec24-taxonomy-mapping.json'

export type ProblemCategory =
  | 'fish'
  | 'algae'
  | 'water_quality'
  | 'equipment'
  | 'plant'
  | 'coral'
  | 'pest'
  | 'invertebrate'
  | 'other'

export interface ProposedTaxonomyMapping {
  slug: string
  title: string
  from: 'algae'
  to: 'coral' | 'pest'
  reason: string
}

export interface AdditionalTaxonomyCase {
  slug: string
  from?: string
  primary?: ProblemCategory
  tags?: string[]
  flag?: 'DUPLICATE_TOPIC'
  duplicateOf?: string
  reason: string
}

export const PROBLEM_CATEGORIES = mapping.canonicalCategories as ProblemCategory[]
export const LEGACY_CATEGORY_ALIASES = mapping.legacyAliases as Record<string, ProblemCategory>
export const PROPOSED_TAXONOMY_MAPPINGS = mapping.proposedMappings as ProposedTaxonomyMapping[]
export const PROPOSED_TAXONOMY_SLUGS = PROPOSED_TAXONOMY_MAPPINGS.map((item) => item.slug)
export const ADDITIONAL_TAXONOMY_CASES = mapping.additionalCases as AdditionalTaxonomyCase[]

export const PROBLEM_CATEGORY_META: Record<
  ProblemCategory,
  { label: string; icon: string; description: string }
> = {
  fish: { label: 'Fish health', icon: '🐠', description: 'Disease, parasites and fish behaviour' },
  algae: { label: 'Algae', icon: '🟢', description: 'Algal growth and blooms' },
  water_quality: { label: 'Water quality', icon: '💧', description: 'Chemistry, clarity and stability' },
  equipment: { label: 'Equipment', icon: '⚙️', description: 'Equipment failure or limitation' },
  plant: { label: 'Plants', icon: '🌿', description: 'Aquatic plant health' },
  coral: { label: 'Corals', icon: '🪸', description: 'Coral disease, stress and bleaching' },
  pest: { label: 'Pests', icon: '🪱', description: 'Hitchhikers, anemones, worms and polyps' },
  invertebrate: { label: 'Invertebrates', icon: '🦐', description: 'Shrimp, snails and other invertebrates' },
  other: { label: 'Other', icon: '•', description: 'Uncategorised problem' },
}

export function normalizeProblemCategory(value?: string | null): ProblemCategory | undefined {
  if (!value) return undefined
  if ((PROBLEM_CATEGORIES as string[]).includes(value)) return value as ProblemCategory
  return LEGACY_CATEGORY_ALIASES[value]
}

export function problemCategoryLabel(value?: string | null): string {
  const category = normalizeProblemCategory(value)
  return category ? PROBLEM_CATEGORY_META[category].label : value || 'Uncategorised'
}

export function problemCategoryIcon(value?: string | null): string {
  const category = normalizeProblemCategory(value)
  return category ? PROBLEM_CATEGORY_META[category].icon : '•'
}

export function getProposedTaxonomyMapping(slug: string): ProposedTaxonomyMapping | undefined {
  return PROPOSED_TAXONOMY_MAPPINGS.find((item) => item.slug === slug)
}

export function isDuplicateIchTopic(slug: string): boolean {
  return slug === 'white-spot-disease' || slug === 'ich-white-spot-disease'
}

export interface TaxonomyRecord {
  _id?: string
  slug: string
  title?: string
  category?: string
  [key: string]: unknown
}

/**
 * Validates a read-only export against the proposed seven-record mapping.
 * A record may still carry the legacy `from` value or the already-migrated `to`
 * value (idempotent re-run). Any other category is a conflict.
 */
export function validateTaxonomyMapping(records: TaxonomyRecord[]): string[] {
  const issues: string[] = []
  for (const proposed of PROPOSED_TAXONOMY_MAPPINGS) {
    const matches = records.filter((record) => record.slug === proposed.slug)
    if (matches.length !== 1) {
      issues.push(`expected exactly one record for ${proposed.slug}, found ${matches.length}`)
      continue
    }
    const record = matches[0]
    if (record.title && record.title !== proposed.title) {
      issues.push(`${proposed.slug} title changed: expected "${proposed.title}", found "${record.title}"`)
    }
    if (record.category !== proposed.from && record.category !== proposed.to) {
      issues.push(
        `${proposed.slug} category is "${record.category}", expected "${proposed.from}" or already-migrated "${proposed.to}"`
      )
    }
  }
  return issues
}

export function categoryCounts(records: TaxonomyRecord[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const record of records) {
    const category = normalizeProblemCategory(record.category) || 'other'
    counts[category] = (counts[category] || 0) + 1
  }
  return counts
}
