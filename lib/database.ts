import { client } from './sanity'

export type DatabaseType = 'species' | 'plant' | 'coral' | 'equipment'

export interface DatabaseItem {
  _id: string
  _type: string
  name: string
  scientificName?: string
  slug: { current: string }
  excerpt?: string
  mainImage?: any
  category?: string
  brand?: string
}

export interface SpeciesDetail extends DatabaseItem {
  family?: string
  origin?: string
  sizeCm?: number
  tankSizeMinL?: number
  tempMinC?: number
  tempMaxC?: number
  phMin?: number
  phMax?: number
  ghMin?: number
  ghMax?: number
  diet?: string
  temperament?: string
  waterZone?: string
  schooling?: string
  difficulty?: string
  compatibleSpecies?: DatabaseItem[]
  relatedPosts?: any[]
}

const LIST_PROJECTION = `
  _id, _type, name, scientificName, slug, excerpt, mainImage, category, brand
`

export async function getDatabaseList(type: DatabaseType): Promise<DatabaseItem[]> {
  const extra = type === 'equipment' ? ', category, brand' : ''
  return await client.fetch(
    `*[_type == $type && defined(name) && defined(slug)] | order(name asc) {
      _id, _type, name, scientificName, slug, excerpt, mainImage ${extra}
    }`,
    { type }
  )
}

export async function getDatabaseItem(type: DatabaseType, slug: string): Promise<any | null> {
  const result = await client.fetch(
    `*[_type == $type && slug.current == $slug][0] {
      _id, _type, name, scientificName, slug, excerpt, mainImage,
      family, origin, sizeCm, tankSizeMinL, tempMinC, tempMaxC, phMin, phMax, ghMin, ghMax,
      diet, temperament, waterZone, schooling, difficulty,
      light, co2, growth, placement, propagation,
      flow, aggression, reefCompatibility,
      category, brand, model, flowRateLh, powerW, tankSizeMaxL, pros, cons,
      compatibleSpecies[]->{ _id, name, slug, mainImage, excerpt },
      relatedPosts[]->{ _id, title, slug, excerpt, publishedAt, mainImage }
    }`,
    { type, slug }
  )
  return result || null
}

export interface InspirationItem {
  _id: string
  _type: string
  title: string
  slug?: { current: string }
  excerpt?: string
  mainImage?: any
  style?: string
  tankSizeL?: number
  difficulty?: string
}

export async function getInspirationList(): Promise<InspirationItem[]> {
  return await client.fetch(
    `*[_type == "inspiration" && defined(title)] | order(publishedAt desc) {
      _id, _type, title, slug, excerpt, mainImage, style, tankSizeL, difficulty
    }`
  )
}

export async function getProblemsList(): Promise<any[]> {
  return await client.fetch(
    `*[_type == "problem" && defined(title)] | order(publishedAt desc) {
      _id, _type, title, slug, excerpt, category
    }`
  )
}

export async function getDatabaseItemsReferencingPost(postId: string, limit = 4) {
  return await client.fetch(
    `*[_type in ["species", "plant", "coral", "equipment", "problem"] && references($postId)][0...$limit] {
      _type,
      "name": coalesce(name, title),
      slug,
      excerpt
    }`,
    { postId, limit }
  )
}
