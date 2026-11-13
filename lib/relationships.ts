export const ENTITY_ROUTES: Record<string, string> = {
  species: '/species',
  invertebrate: '/invertebrates',
  plant: '/plants',
  coral: '/corals',
  equipment: '/equipment',
  problem: '/problems',
}

export interface SlugValue {
  current?: string | null
}

export interface RelationshipRef {
  _id?: string | null
  _type?: string | null
  name?: string | null
  title?: string | null
  slug?: SlugValue | string | null
}

export function readSlug(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  if (!value || typeof value !== 'object') return null
  const current = (value as SlugValue).current
  if (typeof current !== 'string') return null
  const trimmed = current.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function entityHref(type: unknown, slug: unknown): string | null {
  if (typeof type !== 'string') return null
  const base = ENTITY_ROUTES[type]
  if (!base) return null
  const current = readSlug(slug)
  if (!current) return null
  return `${base}/${current}`
}

export function refHref(ref: RelationshipRef | null | undefined): string | null {
  if (!ref) return null
  return entityHref(ref._type, ref.slug)
}

export function refLabel(ref: RelationshipRef | null | undefined): string | null {
  if (!ref) return null
  const label = ref.name ?? ref.title
  return typeof label === 'string' && label.trim().length > 0 ? label.trim() : null
}

export function filterNavigableItems<T extends { slug?: SlugValue | string | null }>(
  items?: T[] | null,
): T[] {
  if (!Array.isArray(items)) return []
  return items.filter((item) => Boolean(item && readSlug(item.slug)))
}

export function conditionList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    .map((entry) => entry.trim())
}

const KNOWN_CONFIDENCE = new Set(['HIGH', 'MEDIUM', 'LOW', 'UNVERIFIED'])

export function confidenceLabel(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const raw = value.trim()
  if (raw.length === 0) return null
  const upper = raw.toUpperCase()
  if (KNOWN_CONFIDENCE.has(upper)) {
    return upper.charAt(0) + upper.slice(1).toLowerCase()
  }
  return raw
}
