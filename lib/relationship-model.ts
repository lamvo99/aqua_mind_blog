import { isValidSlugValue } from './slug'
import { entityHref, readSlug } from './relationships'

/**
 * WEB-03C relationship model — pure normalization/selection helpers.
 *
 * Sources of truth (WEB-03B approved):
 * - Article → Article: explicit `post.relatedPosts`, category fallback only when empty.
 * - Article → Entity/Problem: reverse references, kept semantically separate.
 * - Article → Tool: reverse `tool.relatedPosts`, keyword fallback only when empty.
 * - Article → Learning Path: reverse `collection.steps[].post` membership.
 * - Tool → Problem: reverse `problem.relatedTools` references.
 * - Tool → Guide: `tool.relatedPosts` for Sanity-backed tools; static fallback otherwise.
 *
 * These functions are pure: no I/O, no Sanity client, no time, no mutation.
 */

export const ENTITY_TYPES = ['species', 'invertebrate', 'plant', 'coral', 'equipment'] as const
export type EntityType = (typeof ENTITY_TYPES)[number]
export type EntityTargetType = EntityType | 'problem'

const ENTITY_TYPE_ORDER = new Map<string, number>(ENTITY_TYPES.map((type, index) => [type, index]))

const UTILITY_PATHS = new Set(['/search', '/studio'])

export interface EntityTarget {
  kind: 'entity' | 'problem'
  type: EntityTargetType
  href: string
  label: string
  excerpt?: string
}

export interface ArticleTarget {
  href: string
  slug: string
  title: string
  excerpt?: string
  publishedAt?: string
}

export interface ToolTarget {
  href: string
  slug?: string
  label: string
}

export interface LearningPathTarget {
  href: string
  slug: string
  label: string
}

export interface ToolGuideTarget {
  href: string
  label: string
  kind: 'article' | 'resource'
}

export interface RawEntity {
  _id?: string
  _type?: string
  name?: string
  title?: string
  slug?: unknown
  excerpt?: string
}

export interface RawPost {
  _id?: string
  title?: string
  slug?: unknown
  excerpt?: string
  publishedAt?: string
}

export interface RawTool {
  _id?: string
  name?: string
  slug?: unknown
  toolUrl?: string
}

export interface RawLearningPath {
  _id?: string
  slug?: unknown
  title?: string
  steps?: Array<{ post?: { slug?: unknown } | null } | null> | null
}

export interface RawProblem {
  _id?: string
  title?: string
  slug?: unknown
  relatedTools?: Array<{ slug?: unknown } | null> | null
}

export interface FallbackLink {
  href: string
  label: string
}

export interface SelectArticlesInput {
  explicit?: RawPost[] | null
  fallback?: RawPost[] | null
  currentSlug?: string
  limit?: number
}

export interface SelectToolsInput {
  explicit?: RawTool[] | null
  fallback?: FallbackLink[] | null
  limit?: number
}

export interface SelectToolGuidesInput {
  explicit?: RawPost[] | null
  fallback?: FallbackLink[] | null
  limit?: number
}

/** Reject draft document ids. */
export function isDraftId(id: unknown): boolean {
  return typeof id === 'string' && id.startsWith('drafts.')
}

/**
 * Normalize an internal destination to a relative path.
 *
 * Accepts `/path` and `https://www.aquamind.life/path`; rejects external URLs,
 * protocol-relative URLs, query/filter destinations, fragments, whitespace,
 * malformed host-only values (`www.aquamind.life/...`) and utility routes.
 */
export function sanitizeInternalHref(value: unknown): string | null {
  if (typeof value !== 'string') return null
  let href = value.trim()
  if (!href) return null

  const siteUrl = 'https://www.aquamind.life'
  if (href.startsWith(siteUrl)) href = href.slice(siteUrl.length) || '/'
  else if (/^https?:\/\//i.test(href)) return null

  if (!href.startsWith('/') || href.startsWith('//')) return null
  if (/[?#]/.test(href)) return null
  if (/\s/.test(href)) return null
  if (UTILITY_PATHS.has(href.replace(/\/+$/, ''))) return null

  return href
}

function normalizeArticle(raw: RawPost | null | undefined, currentSlug?: string): ArticleTarget | null {
  if (!raw || typeof raw !== 'object') return null
  if (isDraftId(raw._id)) return null

  const slug = readSlug(raw.slug)
  if (!slug || !isValidSlugValue(slug)) return null
  if (currentSlug && slug === currentSlug) return null

  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (!title) return null
  if (typeof raw.publishedAt !== 'string' || !raw.publishedAt.trim()) return null

  const href = sanitizeInternalHref(`/posts/${slug}`)
  if (!href) return null

  return {
    href,
    slug,
    title,
    excerpt: typeof raw.excerpt === 'string' ? raw.excerpt : undefined,
    publishedAt: raw.publishedAt,
  }
}

function normalizeArticles(
  items: RawPost[] | null | undefined,
  currentSlug: string | undefined,
  limit: number
): ArticleTarget[] {
  if (!Array.isArray(items)) return []
  const seen = new Set<string>()
  const result: ArticleTarget[] = []
  for (const item of items) {
    const target = normalizeArticle(item, currentSlug)
    if (!target || seen.has(target.href)) continue
    seen.add(target.href)
    result.push(target)
    if (result.length >= limit) break
  }
  return result
}

/**
 * Article → Article.
 * Explicit `post.relatedPosts` wins; category fallback is used only when no
 * valid explicit target remains. The two sources are never concatenated.
 */
export function selectRelatedArticles({
  explicit,
  fallback,
  currentSlug,
  limit = 3,
}: SelectArticlesInput): ArticleTarget[] {
  const safeLimit = Math.max(0, Math.floor(limit))
  if (safeLimit === 0) return []

  const explicitTargets = normalizeArticles(explicit, currentSlug, safeLimit)
  if (explicitTargets.length > 0) return explicitTargets

  return normalizeArticles(fallback, currentSlug, safeLimit)
}

function normalizeEntity(raw: RawEntity | null | undefined): EntityTarget | null {
  if (!raw || typeof raw !== 'object') return null
  if (isDraftId(raw._id)) return null

  const type = raw._type
  const isEntity = typeof type === 'string' && (ENTITY_TYPES as readonly string[]).includes(type)
  const isProblem = type === 'problem'
  if (!isEntity && !isProblem) return null

  const slug = readSlug(raw.slug)
  if (!slug || !isValidSlugValue(slug)) return null

  const label = (typeof raw.name === 'string' ? raw.name : typeof raw.title === 'string' ? raw.title : '').trim()
  if (!label) return null

  const href = entityHref(type, slug)
  const safeHref = sanitizeInternalHref(href)
  if (!safeHref) return null

  return {
    kind: isProblem ? 'problem' : 'entity',
    type: type as EntityTargetType,
    href: safeHref,
    label,
    excerpt: typeof raw.excerpt === 'string' ? raw.excerpt : undefined,
  }
}

function dedupeEntities(items: EntityTarget[], limit: number): EntityTarget[] {
  const seen = new Set<string>()
  const result: EntityTarget[] = []
  for (const item of items) {
    const key = `${item.type}:${item.href}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push(item)
    if (result.length >= limit) break
  }
  return result
}

/**
 * Article → Entity (species / invertebrate / plant / coral / equipment).
 * Problems are excluded here on purpose; use `selectRelatedProblems`.
 */
export function selectRelatedEntities(items: RawEntity[] | null | undefined, limit = 4): EntityTarget[] {
  const safeLimit = Math.max(0, Math.floor(limit))
  if (!Array.isArray(items) || safeLimit === 0) return []

  const targets = items
    .map(normalizeEntity)
    .filter((item): item is EntityTarget => item !== null && item.kind === 'entity')
    .sort((a, b) => {
      const typeDelta = (ENTITY_TYPE_ORDER.get(a.type) ?? 99) - (ENTITY_TYPE_ORDER.get(b.type) ?? 99)
      if (typeDelta !== 0) return typeDelta
      return a.label.localeCompare(b.label)
    })

  return dedupeEntities(targets, safeLimit)
}

/**
 * Article → Problem (reverse references filtered to the problem type).
 */
export function selectRelatedProblems(items: RawEntity[] | null | undefined, limit = 4): EntityTarget[] {
  const safeLimit = Math.max(0, Math.floor(limit))
  if (!Array.isArray(items) || safeLimit === 0) return []

  const targets = items
    .map(normalizeEntity)
    .filter((item): item is EntityTarget => item !== null && item.kind === 'problem')
    .sort((a, b) => a.label.localeCompare(b.label))

  return dedupeEntities(targets, safeLimit)
}

function normalizeTool(raw: RawTool | null | undefined): ToolTarget | null {
  if (!raw || typeof raw !== 'object') return null
  if (isDraftId(raw._id)) return null

  const slug = readSlug(raw.slug)
  const label = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!label) return null

  const href =
    sanitizeInternalHref(raw.toolUrl) ??
    (slug && isValidSlugValue(slug) ? sanitizeInternalHref(`/tools/${slug}`) : null)
  if (!href) return null

  return {
    href,
    slug: slug && isValidSlugValue(slug) ? slug : undefined,
    label,
  }
}

function normalizeFallbackLinks(items: FallbackLink[] | null | undefined, limit: number): ToolTarget[] {
  if (!Array.isArray(items)) return []
  const seen = new Set<string>()
  const result: ToolTarget[] = []
  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const label = typeof item.label === 'string' ? item.label.trim() : ''
    const href = sanitizeInternalHref(item.href)
    if (!label || !href || seen.has(href)) continue
    seen.add(href)
    result.push({ href, label })
    if (result.length >= limit) break
  }
  return result
}

/**
 * Article → Tool.
 * Explicit reverse `tool.relatedPosts` matches win; the keyword-rule fallback
 * is used only when no explicit tool remains. Never merged.
 */
export function selectRelatedTools({ explicit, fallback, limit = 3 }: SelectToolsInput): ToolTarget[] {
  const safeLimit = Math.max(0, Math.floor(limit))
  if (safeLimit === 0) return []

  const explicitTargets: ToolTarget[] = []
  const seen = new Set<string>()
  if (Array.isArray(explicit)) {
    for (const item of explicit) {
      const target = normalizeTool(item)
      if (!target || seen.has(target.href)) continue
      seen.add(target.href)
      explicitTargets.push(target)
      if (explicitTargets.length >= safeLimit) break
    }
  }
  if (explicitTargets.length > 0) return explicitTargets

  return normalizeFallbackLinks(fallback, safeLimit)
}

/**
 * Article / Resource → Learning Path.
 * Membership is derived only from `collection.steps[].post`; input order is
 * preserved (callers pass paths in their editorial/display order).
 */
export function selectLearningPaths(
  paths: RawLearningPath[] | null | undefined,
  postSlug: string | null | undefined,
  limit = 4
): LearningPathTarget[] {
  const safeLimit = Math.max(0, Math.floor(limit))
  if (!Array.isArray(paths) || safeLimit === 0) return []

  const slug = typeof postSlug === 'string' ? postSlug.trim() : ''
  if (!slug || !isValidSlugValue(slug)) return []

  const seen = new Set<string>()
  const result: LearningPathTarget[] = []
  for (const path of paths) {
    if (!path || typeof path !== 'object' || isDraftId(path._id)) continue
    const pathSlug = readSlug(path.slug)
    const title = typeof path.title === 'string' ? path.title.trim() : ''
    if (!pathSlug || !isValidSlugValue(pathSlug) || !title) continue
    if (!Array.isArray(path.steps)) continue

    const isMember = path.steps.some((step) => readSlug(step?.post?.slug) === slug)
    if (!isMember) continue

    const href = sanitizeInternalHref(`/learn/${pathSlug}`)
    if (!href || seen.has(href)) continue
    seen.add(href)
    result.push({ href, slug: pathSlug, label: title })
    if (result.length >= safeLimit) break
  }
  return result
}

/**
 * Tool → Problem.
 * Derived only from `problem.relatedTools` references; sorted by title.
 */
export function selectProblemsForTool(
  problems: RawProblem[] | null | undefined,
  toolSlug: string | null | undefined,
  limit = 5
): EntityTarget[] {
  const safeLimit = Math.max(0, Math.floor(limit))
  if (!Array.isArray(problems) || safeLimit === 0) return []

  const slug = typeof toolSlug === 'string' ? toolSlug.trim() : ''
  if (!slug || !isValidSlugValue(slug)) return []

  const targets: EntityTarget[] = []
  for (const problem of problems) {
    if (!problem || typeof problem !== 'object' || isDraftId(problem._id)) continue
    const problemSlug = readSlug(problem.slug)
    const title = typeof problem.title === 'string' ? problem.title.trim() : ''
    if (!problemSlug || !isValidSlugValue(problemSlug) || !title) continue
    if (!Array.isArray(problem.relatedTools)) continue

    const referencesTool = problem.relatedTools.some((tool) => readSlug(tool?.slug) === slug)
    if (!referencesTool) continue

    const href = sanitizeInternalHref(`/problems/${problemSlug}`)
    if (!href) continue
    targets.push({ kind: 'problem', type: 'problem', href, label: title })
  }

  const sorted = targets.sort((a, b) => a.label.localeCompare(b.label))
  const deduped = dedupeEntities(sorted, safeLimit)
  return deduped
}

/**
 * Tool → Article / Guide.
 * `tool.relatedPosts` is the source of truth for Sanity-backed tools; static
 * fallback links are used only when no valid explicit target remains.
 */
export function selectToolGuides({ explicit, fallback, limit = 4 }: SelectToolGuidesInput): ToolGuideTarget[] {
  const safeLimit = Math.max(0, Math.floor(limit))
  if (safeLimit === 0) return []

  const articles = normalizeArticles(explicit, undefined, safeLimit)
  if (articles.length > 0) {
    return articles.map((article) => ({
      href: article.href,
      label: article.title,
      kind: 'article' as const,
    }))
  }

  const seen = new Set<string>()
  const result: ToolGuideTarget[] = []
  if (Array.isArray(fallback)) {
    for (const item of fallback) {
      if (!item || typeof item !== 'object') continue
      const label = typeof item.label === 'string' ? item.label.trim() : ''
      const href = sanitizeInternalHref(item.href)
      if (!label || !href || seen.has(href)) continue
      seen.add(href)
      result.push({ href, label, kind: 'resource' })
      if (result.length >= safeLimit) break
    }
  }
  return result
}
