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
    *[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      updatedAt,
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