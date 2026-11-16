/**
 * Resolve the effective SEO fields for a post.
 * Authored `seo` values win; post title/excerpt/mainImage are the fallbacks.
 */
export type PostSeoInput = {
  title?: string | null
  excerpt?: string | null
  mainImage?: unknown
  seo?: {
    metaTitle?: string | null
    metaDescription?: string | null
    ogImage?: unknown
  } | null
}

export function resolvePostSeo(post: PostSeoInput | null | undefined) {
  const seo = post?.seo || {}
  const title = (seo.metaTitle || "").trim() || (post?.title || "").trim()
  const description = (seo.metaDescription || "").trim() || (post?.excerpt || "").trim()
  const image = seo.ogImage || post?.mainImage || null
  return { title, description, image }
}
