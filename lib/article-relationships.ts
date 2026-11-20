import {
  sanitizeInternalHref,
  selectLearningPaths,
  selectRelatedArticles,
  selectRelatedEntities,
  selectRelatedProblems,
  selectRelatedTools,
} from './relationship-model'
import type {
  ArticleTarget,
  EntityTarget,
  FallbackLink,
  LearningPathTarget,
  RawEntity,
  RawLearningPath,
  RawPost,
  RawTool,
  ToolTarget,
} from './relationship-model'

/**
 * Tool routes verified (2026-11-17) to have no Sanity `tool` document.
 * Static/keyword fallback is restricted to these routes; tools with a
 * document must be linked through explicit `tool.relatedPosts` references.
 */
export const STATIC_TOOL_ROUTES = [
  '/tools/aquarium-calculator',
  '/tools/compatibility-checker',
  '/tools/diagnostic',
] as const

export const ARTICLE_RELATIONSHIP_LIMITS = {
  articles: 3,
  paths: 2,
  entities: 4,
  problems: 4,
  tools: 3,
  hubs: 2,
} as const

export interface HubLinkInput {
  href: string
  label: string
  description?: string
}

export interface HubLinkTarget {
  href: string
  label: string
  description?: string
}

export interface ArticleRelationshipInputs {
  postSlug: string
  explicitPosts?: RawPost[] | null
  fallbackPosts?: RawPost[] | null
  databaseItems?: RawEntity[] | null
  reverseTools?: RawTool[] | null
  fallbackToolLinks?: FallbackLink[] | null
  learningPaths?: RawLearningPath[] | null
  hubLinks?: HubLinkInput[] | null
}

export interface ArticleRelationshipBlocks {
  reading: {
    articles: ArticleTarget[]
    paths: LearningPathTarget[]
  }
  database: {
    entities: EntityTarget[]
    problems: EntityTarget[]
  }
  nextSteps: {
    tools: ToolTarget[]
    hubs: HubLinkTarget[]
  }
}

function normalizeHubLinks(links: HubLinkInput[] | null | undefined, limit: number): HubLinkTarget[] {
  if (!Array.isArray(links)) return []
  const seen = new Set<string>()
  const result: HubLinkTarget[] = []
  for (const link of links) {
    if (!link || typeof link !== 'object') continue
    const label = typeof link.label === 'string' ? link.label.trim() : ''
    const href = sanitizeInternalHref(link.href)
    if (!label || !href || seen.has(href)) continue
    seen.add(href)
    result.push({ href, label, description: link.description })
    if (result.length >= limit) break
  }
  return result
}

function normalizeStaticToolFallback(links: FallbackLink[] | null | undefined): FallbackLink[] {
  if (!Array.isArray(links)) return []
  const allowed = new Set<string>(STATIC_TOOL_ROUTES)
  const result: FallbackLink[] = []
  for (const link of links) {
    if (!link || typeof link !== 'object') continue
    const href = sanitizeInternalHref(link.href)
    if (!href || !allowed.has(href)) continue
    result.push({ href, label: link.label })
  }
  return result
}

/**
 * Assemble the three contextual relationship blocks for an article page.
 *
 * Dedupe priority (first occurrence wins): entities → problems → tools →
 * articles → paths → hubs. The rule is deterministic and documented in the
 * WEB-03D report.
 */
export function buildArticleRelationships(
  input: ArticleRelationshipInputs
): ArticleRelationshipBlocks {
  const seen = new Set<string>()
  const take = <T extends { href: string }>(items: T[]): T[] =>
    items.filter((item) => {
      if (seen.has(item.href)) return false
      seen.add(item.href)
      return true
    })

  const entities = take(selectRelatedEntities(input.databaseItems, ARTICLE_RELATIONSHIP_LIMITS.entities))
  const problems = take(selectRelatedProblems(input.databaseItems, ARTICLE_RELATIONSHIP_LIMITS.problems))
  const tools = take(
    selectRelatedTools({
      explicit: input.reverseTools,
      fallback: normalizeStaticToolFallback(input.fallbackToolLinks),
      limit: ARTICLE_RELATIONSHIP_LIMITS.tools,
    })
  )
  const articles = take(
    selectRelatedArticles({
      explicit: input.explicitPosts,
      fallback: input.fallbackPosts,
      currentSlug: input.postSlug,
      limit: ARTICLE_RELATIONSHIP_LIMITS.articles,
    })
  )
  const paths = take(
    selectLearningPaths(input.learningPaths, input.postSlug, ARTICLE_RELATIONSHIP_LIMITS.paths)
  )
  const hubs = take(normalizeHubLinks(input.hubLinks, ARTICLE_RELATIONSHIP_LIMITS.hubs))

  return {
    reading: { articles, paths },
    database: { entities, problems },
    nextSteps: { tools, hubs },
  }
}
