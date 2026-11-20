import { client } from './sanity'

/**
 * Read-only relationship data fetchers for WEB-03D.
 * Selection/normalization stays in `lib/relationship-model.ts` and
 * `lib/article-relationships.ts`; this module only queries Sanity.
 */

export interface ToolReferenceRow {
  _id: string
  name?: string
  slug?: { current?: string } | null
  toolUrl?: string
}

export interface LearningPathRow {
  _id: string
  title?: string
  slug?: { current?: string } | null
  steps?: Array<{ post?: { slug?: { current?: string } | null } | null } | null> | null
}

/** Tools whose `relatedPosts` reference the given article (explicit reverse link). */
export async function getToolsReferencingPost(
  postId: string,
  limit = 8
): Promise<ToolReferenceRow[]> {
  return await client.fetch(
    `*[_type == "tool" && references($postId) && defined(slug.current) && !(_id in path("drafts.**"))]
      | order(name asc) [0...$limit] {
      _id,
      name,
      slug,
      toolUrl
    }`,
    { postId, limit }
  )
}

/** Learning paths whose steps reference the given article (actual membership only). */
export async function getLearningPathsForPost(postId: string): Promise<LearningPathRow[]> {
  return await client.fetch(
    `*[_type == "collection" && defined(slug.current) && defined(title) && count(steps[post._ref == $postId]) > 0]
      | order(title asc) {
      _id,
      title,
      "slug": slug.current,
      "steps": steps[]{ post->{ "slug": slug.current } }
    }`,
    { postId }
  )
}

export interface ToolDocumentRow extends ToolReferenceRow {
  relatedPosts?: Array<{
    _id?: string
    title?: string
    slug?: { current?: string } | null
    excerpt?: string
    publishedAt?: string
  }> | null
}

export interface ProblemForToolRow {
  _id: string
  title?: string
  slug?: { current?: string } | null
  relatedTools?: Array<{ slug?: { current?: string } | null } | null> | null
}

/** Single Tool document with its explicit guide references (published only). */
export async function getToolBySlug(slug: string): Promise<ToolDocumentRow | null> {
  return await client.fetch(
    `*[_type == "tool" && slug.current == $slug][0] {
      _id,
      name,
      slug,
      toolUrl,
      relatedPosts[]->{ _id, title, slug, excerpt, publishedAt }
    }`,
    { slug }
  )
}

/** Problems whose `relatedTools` reference the given Tool document. */
export async function getProblemsForTool(
  toolId: string,
  limit = 24
): Promise<ProblemForToolRow[]> {
  return await client.fetch(
    `*[_type == "problem" && references($toolId) && defined(slug.current) && defined(title)]
      | order(title asc) [0...$limit] {
      _id,
      title,
      slug,
      "relatedTools": relatedTools[]->{ "slug": slug.current }
    }`,
    { toolId, limit }
  )
}
