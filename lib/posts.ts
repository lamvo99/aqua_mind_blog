import { client } from './sanity'

export async function getAllPosts() {
  return await client.fetch(`
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
}

export async function getPostBySlug(slug: string) {
  return await client.fetch(`
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
}

export async function getFeaturedPosts() {
  return await client.fetch(`
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
}

export async function getPostsByCategory(slug: string) {
  return await client.fetch(`
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
}

export async function getRelatedPosts(slug: string, categories: string[], limit = 3) {
  if (categories.length === 0) return []
  return await client.fetch(
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