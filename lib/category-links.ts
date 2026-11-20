import { isValidSlugValue } from './slug'
import { readSlug } from './relationships'
import { sanitizeInternalHref } from './relationship-model'

/**
 * WEB-03E category link model.
 * Produces canonical `/category/<slug>` destinations and never query-style
 * `?category=` URLs.
 */

export interface CategoryLinkSource {
  _id?: string
  title?: string
  slug?: unknown
  description?: string
  count?: number
}

export interface CategoryLink {
  key: string
  href: string
  title: string
  slug: string
  description?: string
  count?: number
}

export interface CategoryLinkOptions {
  /** Require a positive published-content count (homepage/navigation use). */
  requirePublishedContent?: boolean
}

export function toCategoryLink(
  category: CategoryLinkSource | null | undefined,
  options: CategoryLinkOptions = {}
): CategoryLink | null {
  if (!category || typeof category !== 'object') return null

  const slug = readSlug(category.slug)
  if (!slug || !isValidSlugValue(slug)) return null

  const title = typeof category.title === 'string' ? category.title.trim() : ''
  if (!title) return null

  if (options.requirePublishedContent) {
    if (typeof category.count !== 'number' || category.count <= 0) return null
  }

  const href = sanitizeInternalHref(`/category/${slug}`)
  if (!href) return null

  return {
    key: typeof category._id === 'string' && category._id ? category._id : href,
    href,
    title,
    slug,
    description: typeof category.description === 'string' ? category.description : undefined,
    count: typeof category.count === 'number' ? category.count : undefined,
  }
}

export function selectCategoryLinks(
  categories: CategoryLinkSource[] | null | undefined,
  options: CategoryLinkOptions = {}
): CategoryLink[] {
  if (!Array.isArray(categories)) return []

  const seen = new Set<string>()
  const result: CategoryLink[] = []
  for (const category of categories) {
    const link = toCategoryLink(category, options)
    if (!link || seen.has(link.slug)) continue
    seen.add(link.slug)
    result.push(link)
  }
  return result
}
