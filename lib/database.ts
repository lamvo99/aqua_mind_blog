import { client } from './sanity'

export type DatabaseType = 'species' | 'invertebrate' | 'plant' | 'coral' | 'equipment'

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
  aquariumStyle?: string[]
  region?: string
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
  waterType?: string
  isPredator?: boolean
  reefCompatibility?: boolean
  compatibleSpecies?: DatabaseItem[]
  relatedPosts?: any[]
}

const LIST_PROJECTION = `
  _id, _type, name, scientificName, slug, excerpt, mainImage, category, brand
`

export async function getDatabaseList(type: DatabaseType): Promise<DatabaseItem[]> {
  const extraFields = type === 'equipment' ? ', category, brand' : ''
  const semanticFields = `
    aquariumStyle, region, waterType, isPredator, reefCompatibility,
    difficulty, light, flow, co2, growth, placement, coralType,
    group, category, diet, temperament
  `
  return await client.fetch(
    `*[_type == $type && defined(name) && defined(slug)] | order(name asc) {
      _id, _type, name, scientificName, slug, excerpt, mainImage ${extraFields} ${semanticFields}
    }`,
    { type }
  )
}

const COMPARE_PROJECTIONS: Record<DatabaseType, string> = {
  species: `
    _id, _type, name, slug, mainImage, sizeCm, tankSizeMinL,
    tempMinC, tempMaxC, phMin, phMax, ghMin, ghMax,
    diet, temperament, waterZone, schooling, difficulty,
    aquariumStyle, region, isPredator, reefCompatibility
  `,
  invertebrate: `
    _id, _type, name, slug, mainImage, group, waterType, sizeCm,
    tempMinC, tempMaxC, phMin, phMax,
    diet, temperament, difficulty,
    aquariumStyle, region, reefCompatibility
  `,
  plant: `
    _id, _type, name, slug, mainImage,
    light, co2, growth, difficulty, placement,
    tempMinC, tempMaxC, phMin, phMax, propagation,
    aquariumStyle, region, growthForm, redPlant
  `,
  coral: `
    _id, _type, name, slug, mainImage,
    light, flow, difficulty, placement, aggression, reefCompatibility,
    tempMinC, tempMaxC,
    aquariumStyle, photosynthetic
  `,
  equipment: `
    _id, _type, name, slug, mainImage,
    category, brand, model, flowRateLh, powerW, tankSizeMinL, tankSizeMaxL, pros, cons,
    aquariumStyle
  `,
}

export async function getDatabaseCompareItems(type: DatabaseType): Promise<any[]> {
  return await client.fetch(
    `*[_type == $type && defined(name) && defined(slug)] | order(name asc) {
      ${COMPARE_PROJECTIONS[type]}
    }`,
    { type }
  )
}

export async function getDatabaseItem(type: DatabaseType, slug: string): Promise<any | null> {
  const result = await client.fetch(
    `*[_type == $type && slug.current == $slug][0] {
      _id, _type, name, scientificName, slug, excerpt, mainImage,
      family, origin, sizeCm, tankSizeMinL, tempMinC, tempMaxC, phMin, phMax, ghMin, ghMax,
      diet, temperament, waterZone, schooling, difficulty, waterType,
      group,
      light, co2, growth, placement, propagation, growthForm, redPlant,
      coralType, flow, aggression, reefCompatibility, photosynthetic,
      category, brand, model, flowRateLh, powerW, tankSizeMinL, tankSizeMaxL, pros, cons,
      aquariumStyle, region, isPredator,
      compatibleSpecies[]->{ _id, name, slug, mainImage, excerpt },
      compatiblePlants[]->{ _id, name, slug, mainImage, excerpt },
      compatibleInvertebrates[]->{ _id, name, slug, mainImage, excerpt },
      suitableEquipment[]->{ _id, name, slug, mainImage, category, brand },
      relatedProblems[]->{ _id, title, slug, excerpt, category },
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
    `*[_type == "problem"] | order(name asc) {
      _id, _type, name, title, slug, excerpt, category, waterType
    }`
  )
}

export async function getDatabaseItemsReferencingPost(postId: string, limit = 4) {
  return await client.fetch(
    `*[_type in ["species", "plant", "coral", "equipment", "invertebrate", "problem"] && references($postId)][0...$limit] {
      _type,
      "name": coalesce(name, title),
      slug,
      excerpt
    }`,
    { postId, limit }
  )
}
