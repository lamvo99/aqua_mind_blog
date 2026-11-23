import { client } from './sanity'
import { isValidSlugValue } from './slug'

function filterValidPosts<T extends { slug?: { current?: string | null } | null }>(posts: T[] | null | undefined): T[] {
  return (posts || []).filter((post) => Boolean(post?.slug?.current && isValidSlugValue(post.slug.current)))
}

export async function getAllPosts() {
  const posts = await client.fetch(`
    *[_type == "post" && defined(publishedAt)] | order(publishedAt desc) {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      mainImage,
      author->{
        name,
        slug,
        image
      },
      categories[]->{
        title,
        slug
      },
      tags,
      isFeatured
    }
  `)
  return filterValidPosts(posts)
}

export async function getPostBySlug(slug: string) {
  if (!isValidSlugValue(slug)) return null
  const post = await client.fetch(`
    *[_type == "post" && slug.current == $slug && defined(publishedAt)][0] {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      updatedAt,
      seo,
      relatedPosts[]->{
        _id,
        title,
        slug,
        excerpt,
        publishedAt
      },
      mainImage,
      body,
      author->{
        name,
        slug,
        image,
        bio
      },
      categories[]->{
        title,
        slug
      },
      tags,
      isFeatured
    }
  `, { slug })
  if (!post?.slug?.current || !isValidSlugValue(post.slug.current)) return null
  if (Array.isArray(post.relatedPosts)) post.relatedPosts = filterValidPosts(post.relatedPosts)
  return post
}

export async function getFeaturedPosts() {
  const posts = await client.fetch(`
    *[_type == "post" && isFeatured == true && defined(publishedAt)] | order(publishedAt desc) {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      mainImage,
      author->{
        name,
        slug,
        image
      },
      categories[]->{
        title,
        slug
      },
      tags
    }
  `)
  return filterValidPosts(posts)
}

export async function getPostsByCategory(slug: string) {
  const posts = await client.fetch(`
    *[_type == "post" && defined(publishedAt) && $slug in categories[]->slug.current] | order(publishedAt desc) {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      mainImage,
      author->{
        name,
        slug,
        image
      },
      categories[]->{
        title,
        slug
      },
      tags,
      isFeatured
    }
  `, { slug })
  return filterValidPosts(posts)
}

export async function getRelatedPosts(slug: string, categories: string[], limit = 3) {
  if (categories.length === 0) return []
  const posts = await client.fetch(
    `*[_type == "post" && defined(publishedAt) && slug.current != $slug
       && count(categories[]->slug.current[@ in $categories]) > 0] | order(publishedAt desc) [0...$limit] {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      mainImage,
      author->{
        name,
        slug,
        image
      },
      categories[]->{
        title,
        slug
      },
      tags,
      isFeatured
    }`,
    { slug, categories, limit }
  )
  return filterValidPosts(posts)
}

export async function getAllCategories() {
  return await client.fetch(`
    *[_type == "category"] | order(title asc) {
      _id,
      title,
      slug,
      description
    }
  `)
}

/**
 * Categories with their published-post count (single query, no N+1).
 * Used by homepage category navigation to omit empty categories.
 */
export async function getCategoriesWithCounts() {
  return await client.fetch(`
    *[_type == "category"] | order(title asc) {
      _id,
      title,
      slug,
      description,
      "count": count(*[_type == "post" && defined(publishedAt) && ^.slug.current in categories[]->slug.current])
    }
  `)
}