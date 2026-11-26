import { client } from './sanity'
import { applySpec28Overlay, applySpec28OverlayList, type Spec28OverlayType } from './content/spec28-overlay'
import type { CareBasisEntry, CareConfidenceEntry, EvidenceSourceRecord } from './care-evidence'
import { filterWave1RedirectDatabaseItems } from './wave1-redirects'

export type DatabaseType = 'species' | 'invertebrate' | 'plant' | 'coral' | 'equipment'

export interface SeoMetadata {
  metaTitle?: string | null
  metaDescription?: string | null
}

export interface PortableTextSpan {
  _key?: string
  _type?: string
  text?: string
  marks?: string[]
}

export interface PortableTextBlock {
  _key?: string
  _type?: string
  children?: PortableTextSpan[]
  style?: string
  listItem?: string
  level?: number
  markDefs?: { _key?: string; _type?: string; href?: string }[]
  asset?: unknown
  alt?: string
  caption?: string
  code?: string
  filename?: string
}

export type KnowledgeSection = PortableTextBlock[]

export interface SpeciesKnowledgeBody {
  _type?: "speciesKnowledgeBody"
  overview?: KnowledgeSection
  adultSizeGrowth?: KnowledgeSection
  behavior?: KnowledgeSection
  tankRequirements?: KnowledgeSection
  swimmingSpaceFootprint?: KnowledgeSection
  waterParameters?: KnowledgeSection
  feeding?: KnowledgeSection
  compatibility?: KnowledgeSection
  specialRequirements?: KnowledgeSection
  commonProblems?: KnowledgeSection
  breeding?: KnowledgeSection
  practicalVerdict?: KnowledgeSection
}

export interface PlantKnowledgeBody {
  _type?: "plantKnowledgeBody"
  overview?: KnowledgeSection
  light?: KnowledgeSection
  co2?: KnowledgeSection
  nutrients?: KnowledgeSection
  substrate?: KnowledgeSection
  placement?: KnowledgeSection
  growthAndTrimming?: KnowledgeSection
  waterParameters?: KnowledgeSection
  commonDeficiencies?: KnowledgeSection
  algaeSensitivity?: KnowledgeSection
  practicalVerdict?: KnowledgeSection
  commonProblems?: KnowledgeSection
  transition?: KnowledgeSection
}

export interface CoralKnowledgeBody {
  _type?: "coralKnowledgeBody"
  overview?: KnowledgeSection
  placement?: KnowledgeSection
  lightingPar?: KnowledgeSection
  flow?: KnowledgeSection
  waterChemistry?: KnowledgeSection
  nutrition?: KnowledgeSection
  growth?: KnowledgeSection
  aggressionSpacing?: KnowledgeSection
  compatibility?: KnowledgeSection
  commonProblems?: KnowledgeSection
  acclimation?: KnowledgeSection
  practicalVerdict?: KnowledgeSection
  lightingRisks?: KnowledgeSection
  reefCaveats?: KnowledgeSection
  chemistryProblems?: KnowledgeSection
}

export type KnowledgeBody =
  | SpeciesKnowledgeBody
  | PlantKnowledgeBody
  | CoralKnowledgeBody

export interface RelatedEntity {
  _id: string
  _type?: string
  name?: string
  title?: string
  slug?: { current: string }
  excerpt?: string
  mainImage?: any
  category?: string
  brand?: string
}

export interface RelatedPost {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  publishedAt?: string
  mainImage?: any
}

export interface CompatibleSpeciesEntry {
  ref?: RelatedEntity | null
  conditions?: string[]
  confidence?: string
}

export interface PredatorPreyEntry {
  ref?: RelatedEntity | null
  sizeCondition?: string
  evidenceNote?: string
}

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
  aliases?: string[]
  localNames?: string[]
  seo?: SeoMetadata | null
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
  reefCompatibility?: boolean | null
  minTankLengthCm?: number | null
  minTankWidthCm?: number | null
  swimmingSpace?: string | null
  jumpRisk?: string | null
  lidRequired?: string | null
  flowPreference?: string | null
  oxygenSensitivity?: string | null
  maturityRequirement?: string | null
  bioload?: string | null
  waterChangeSensitivity?: string | null
  breedingDifficulty?: string | null
  khMin?: number | null
  khMax?: number | null
  salinityMin?: number | null
  salinityMax?: number | null
  behaviorFlags?: string[] | null
  groupSize?: { min?: number | null; max?: number | null } | null
  communitySuitability?: string | null
  reefInteraction?: string | null
  predatesInverts?: string | null
  difficultyContext?: string | null
  difficultyConfidence?: string | null
  notRecommendedFor?: string[] | null
  knowledgeBody?: SpeciesKnowledgeBody | null
  compatibleSpecies?: CompatibleSpeciesEntry[] | null
  compatiblePlants?: RelatedEntity[] | null
  compatibleInvertebrates?: RelatedEntity[] | null
  suitableEquipment?: RelatedEntity[] | null
  relatedProblems?: RelatedEntity[] | null
  predatorPrey?: PredatorPreyEntry[] | null
  parentSpecies?: RelatedEntity | null
  relatedPosts?: RelatedPost[] | null
}

export interface PlantDetail extends DatabaseItem {
  light?: string
  co2?: string
  growth?: string
  difficulty?: string
  placement?: string
  tempMinC?: number | null
  tempMaxC?: number | null
  phMin?: number | null
  phMax?: number | null
  propagation?: string
  growthForm?: string
  redPlant?: boolean
  knowledgeBody?: PlantKnowledgeBody | null
  suitableEquipment?: RelatedEntity[] | null
  relatedProblems?: RelatedEntity[] | null
  relatedPosts?: RelatedPost[] | null
}

export interface CoralDetail extends DatabaseItem {
  coralType?: string
  light?: string
  flow?: string
  difficulty?: string
  placement?: string
  aggression?: string
  reefCompatibility?: boolean | null
  reefSafetyMeaning?: string | null
  photosynthetic?: boolean
  tempMinC?: number | null
  tempMaxC?: number | null
  temperatureTolerance?: string | null
  salinityMin?: number | null
  salinityMax?: number | null
  phMin?: number | null
  phMax?: number | null
  dkhMin?: number | null
  dkhMax?: number | null
  caMin?: number | null
  caMax?: number | null
  mgMin?: number | null
  mgMax?: number | null
  no3Min?: number | null
  no3Max?: number | null
  po4Min?: number | null
  po4Max?: number | null
  feedingType?: string
  growthRate?: string
  spacing?: string
  aggressionTraits?: string[]
  growthForm?: string
  parMin?: number | null
  parMax?: number | null
  flowPattern?: string
  growthRisk?: string
  growthRiskNote?: string
  suitabilityConditions?: string
  careBasis?: CareBasisEntry[] | null
  careConfidence?: CareConfidenceEntry[] | null
  evidenceSources?: EvidenceSourceRecord[] | null
  reviewStatus?: string
  lastReviewedAt?: string
  difficultyContext?: string | null
  difficultyConfidence?: string | null
  notRecommendedFor?: string[] | null
  knowledgeBody?: CoralKnowledgeBody | null
  suitableEquipment?: RelatedEntity[] | null
  relatedProblems?: RelatedEntity[] | null
  relatedPosts?: RelatedPost[] | null
}

const LIST_PROJECTION = `
  _id, _type, name, scientificName, slug, excerpt, mainImage, category, brand
`

export async function getDatabaseList(type: DatabaseType): Promise<DatabaseItem[]> {
  const extraFields = type === 'equipment' ? ', category, brand' : ''
  const semanticFields = `
    aquariumStyle, region, waterType, isPredator, reefCompatibility,
    difficulty, light, flow, co2, growth, placement, coralType,
    group, category, diet, temperament,
    aliases, localNames
  `
  const items = await client.fetch(
    `*[_type == $type && defined(name) && defined(slug.current)] | order(name asc) {
      _id, _type, name, scientificName, slug, excerpt, mainImage${extraFields}, ${semanticFields}
    }`,
    { type }
  )
  return filterWave1RedirectDatabaseItems(type, applySpec28OverlayList(type, items as DatabaseItem[]))
}

const COMPARE_PROJECTIONS: Record<DatabaseType, string> = {
  species: `
    _id, _type, name, slug, mainImage, sizeCm, tankSizeMinL,
    tempMinC, tempMaxC, phMin, phMax, ghMin, ghMax,
    diet, temperament, waterZone, schooling, difficulty, waterType,
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
    light, flow, difficulty, placement, aggression, reefCompatibility, coralType,
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
  const items = await client.fetch(
    `*[_type == $type && defined(name) && defined(slug.current)] | order(name asc) {
      ${COMPARE_PROJECTIONS[type]}
    }`,
    { type }
  )
  return filterWave1RedirectDatabaseItems(type, applySpec28OverlayList(type, items as any[]))
}

export function getDatabaseItem(type: 'species', slug: string): Promise<SpeciesDetail | null>
export function getDatabaseItem(type: 'plant', slug: string): Promise<PlantDetail | null>
export function getDatabaseItem(type: 'coral', slug: string): Promise<CoralDetail | null>
export function getDatabaseItem(type: 'invertebrate' | 'equipment', slug: string): Promise<any | null>
export function getDatabaseItem(type: DatabaseType, slug: string): Promise<any | null>
export async function getDatabaseItem(type: DatabaseType, slug: string): Promise<any | null> {
  const result = await client.fetch(
    `*[_type == $type && slug.current == $slug][0] {
      _id, _type, name, scientificName, slug, excerpt, mainImage,
      seo { metaTitle, metaDescription },
      family, origin, sizeCm, tankSizeMinL, tempMinC, tempMaxC, phMin, phMax, ghMin, ghMax,
      diet, temperament, waterZone, schooling, difficulty, waterType,
      group, aliases, localNames,
      parentSpecies->{ _id, _type, name, slug },
      light, co2, growth, placement, propagation, growthForm, redPlant,
      coralType, flow, aggression, reefCompatibility, photosynthetic,
      temperatureTolerance,
      category, brand, model, flowRateLh, powerW, tankSizeMinL, tankSizeMaxL, pros, cons,
      aquariumStyle, region, isPredator,
      minTankLengthCm, minTankWidthCm, swimmingSpace, jumpRisk, lidRequired, flowPreference,
      oxygenSensitivity, maturityRequirement, bioload, waterChangeSensitivity, breedingDifficulty,
      khMin, khMax, salinityMin, salinityMax, behaviorFlags, groupSize,
      communitySuitability, reefInteraction, predatesInverts,
      difficultyContext, difficultyConfidence, notRecommendedFor,
      parMin, parMax, flowPattern, dkhMin, dkhMax, caMin, caMax, mgMin, mgMax,
      no3Min, no3Max, po4Min, po4Max, feedingType, growthRate, spacing, aggressionTraits,
      reefSafetyMeaning, growthRisk, growthRiskNote, parBasis, suitabilityConditions,
      careBasis, careConfidence, lastReviewedAt, reviewStatus,
      "evidenceSources": evidenceSources[]->{ sourceId, title, author, publisher, url, sourceType, publishedAt, updatedAt, accessedAt, supportedClaimKeys, limitations, reviewer },
      knowledgeBody,
      "compatibleSpecies": compatibleSpecies[]{ ref->{ _id, name, slug, mainImage, excerpt }, conditions, confidence },
      compatiblePlants[]->{ _id, name, slug, mainImage, excerpt },
      compatibleInvertebrates[]->{ _id, name, slug, mainImage, excerpt },
      suitableEquipment[]->{ _id, name, slug, mainImage, category, brand },
      relatedProblems[]->{ _id, title, slug, excerpt, category },
      "predatorPrey": predatorPrey[]{ ref->{ _id, _type, name, slug }, sizeCondition, evidenceNote },
      "compatibleEquipment": compatibleEquipment[]->{ _id, _type, name, slug, category, brand },
      relatedPosts[]->{ _id, title, slug, excerpt, publishedAt, mainImage }
    }`,
    { type, slug }
  )
  return result ? applySpec28Overlay(type, result as Record<string, any>) : null
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
  const items = await client.fetch(
    `*[_type == "problem"] | order(coalesce(name, title) asc) {
      _id, _type, name, title, slug, excerpt, category, waterType,
      tags, affectedTypes, severity, timeSensitivity, reviewStatus
    }`
  )
  return applySpec28OverlayList('problem', items as any[])
}

export async function getProblemDetail(slug: string): Promise<any | null> {
  const result = await client.fetch(
    `*[_type == "problem" && slug.current == $slug][0] {
      _id, title, excerpt, category, waterType, tags, affectedTypes,
      severity, timeSensitivity, whenToSeekHelp,
      symptoms, causes, whatToCheck, whatNotToDo, howToDistinguish,
      immediateAction, treatment, recovery, prevention, monitoring, escalation,
      claimConfidence, lastReviewedAt, reviewStatus,
      "evidenceSources": evidenceSources[]->{ sourceId, title, author, publisher, url, sourceType, publishedAt, updatedAt, accessedAt, supportedClaimKeys, limitations, reviewer },
      relatedPosts[]->{ _id, title, slug },
      relatedTools[]->{ _id, name, slug }
    }`,
    { slug }
  )
  return result ? applySpec28Overlay('problem', result as Record<string, any>) : null
}

export async function getDatabaseItemsReferencingPost(postId: string, limit = 8) {
  const items = await client.fetch(
    `*[_type in ["species", "plant", "coral", "equipment", "invertebrate", "problem"]
       && references($postId)
       && defined(slug.current)
       && defined(coalesce(name, title))
       && !(_id in path("drafts.**"))]
      | order(_type asc, coalesce(name, title) asc) [0...$limit] {
      _type,
      "name": coalesce(name, title),
      slug,
      excerpt,
      publishedAt
    }`,
    { postId, limit }
  )
  return (items as any[]).map((item) => {
    const entry = applySpec28Overlay(item._type as Spec28OverlayType, item)
    return entry ?? item
  })
}
