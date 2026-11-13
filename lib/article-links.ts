export const ENTITY_LINK_TYPES = [
  'species',
  'invertebrate',
  'plant',
  'coral',
  'equipment',
  'problem',
] as const

export type EntityLinkType = (typeof ENTITY_LINK_TYPES)[number]

export interface EntityLink {
  type: EntityLinkType
  typeLabel: string
  name: string
  href: string
  excerpt?: string
}

export interface ArticleLink {
  _id?: string
  title: string
  slug: { current: string }
  excerpt?: string
  publishedAt?: string
  mainImage?: any
}

const ENTITY_CONFIG: Record<EntityLinkType, { label: string; path: string }> = {
  species: { label: 'Fish', path: '/species' },
  invertebrate: { label: 'Invertebrate', path: '/invertebrates' },
  plant: { label: 'Plant', path: '/plants' },
  coral: { label: 'Coral', path: '/corals' },
  equipment: { label: 'Equipment', path: '/equipment' },
  problem: { label: 'Problem guide', path: '/problems' },
}

const TYPE_ORDER = new Map(ENTITY_LINK_TYPES.map((type, index) => [type, index]))

export function entityHref(type: string, slug: string): string | null {
  const config = ENTITY_CONFIG[type as EntityLinkType]
  if (!config || !slug) return null
  return `${config.path}/${slug}`
}

export function entityTypeLabel(type: string): string {
  return ENTITY_CONFIG[type as EntityLinkType]?.label || type
}

export function prepareEntityLinks(items: any[] | null | undefined, limit = 4): EntityLink[] {
  if (!Array.isArray(items)) return []
  const seen = new Set<string>()
  const prepared: EntityLink[] = []

  for (const item of items) {
    const type = item?._type as EntityLinkType
    const slug = item?.slug?.current
    const name = item?.name || item?.title
    if (!ENTITY_LINK_TYPES.includes(type) || !slug || !name) continue
    if (typeof item?._id === 'string' && item._id.startsWith('drafts.')) continue
    const key = `${type}:${slug}`
    if (seen.has(key)) continue
    seen.add(key)
    prepared.push({
      type,
      typeLabel: entityTypeLabel(type),
      name,
      href: entityHref(type, slug) as string,
      excerpt: item?.excerpt,
    })
  }

  return prepared
    .sort((a, b) => {
      const typeDelta = (TYPE_ORDER.get(a.type) || 0) - (TYPE_ORDER.get(b.type) || 0)
      if (typeDelta !== 0) return typeDelta
      return a.name.localeCompare(b.name)
    })
    .slice(0, limit)
}

export function prepareArticleLinks(
  posts: any[] | null | undefined,
  currentSlug?: string,
  limit = 3
): ArticleLink[] {
  if (!Array.isArray(posts)) return []
  const seen = new Set<string>()
  const prepared: ArticleLink[] = []

  for (const post of posts) {
    const slug = post?.slug?.current
    if (!slug || !post?.title || !post?.publishedAt) continue
    if (currentSlug && slug === currentSlug) continue
    if (typeof post?._id === 'string' && post._id.startsWith('drafts.')) continue
    if (seen.has(slug)) continue
    seen.add(slug)
    prepared.push({
      _id: post._id,
      title: post.title,
      slug: { current: slug },
      excerpt: post.excerpt,
      publishedAt: post.publishedAt,
      mainImage: post.mainImage,
    })
  }

  // Explicit editorial relationships keep their order; this is not a generic
  // category ranking. Deduplication and published-only filtering are the only
  // transformations.
  return prepared.slice(0, limit)
}
