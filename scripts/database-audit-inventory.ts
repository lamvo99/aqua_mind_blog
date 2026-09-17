import { createClient } from '@sanity/client'
import * as fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf8')
const projectId = envContent.match(/NEXT_PUBLIC_SANITY_PROJECT_ID="([^"]+)"/)?.[1]
const dataset = envContent.match(/NEXT_PUBLIC_SANITY_DATASET="([^"]+)"/)?.[1] || 'production'

if (!projectId) {
  console.error('Could not find NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false })

const ENTITY_TYPES = [
  'species',
  'plant',
  'coral',
  'equipment',
  'invertebrate',
  'problem',
  'inspiration',
] as const

type EntityType = (typeof ENTITY_TYPES)[number]

interface FieldDistribution {
  value: string
  count: number
}

interface MissingFieldReport {
  totalMissing: number
  percentageMissing: string
  affectedDocuments: string[]
}

interface DuplicateCandidate {
  names: string[]
  count: number
  _ids: string[]
}

interface TypeReport {
  type: EntityType
  totalCount: number
  fieldDistributions: Record<string, FieldDistribution[]>
  missingCriticalFields: Record<string, MissingFieldReport>
  duplicates: DuplicateCandidate[]
  sampleDocument: Record<string, any> | null
}

interface AuditReport {
  generatedAt: string
  projectId: string
  dataset: string
  summary: {
    totalDocuments: number
    byType: Record<EntityType, number>
  }
  typeReports: TypeReport[]
}

const CRITICAL_FIELDS: Record<EntityType, string[]> = {
  species: ['name', 'scientificName', 'slug', 'difficulty', 'waterType', 'region', 'sizeCm', 'tempMinC', 'tempMaxC'],
  plant: ['name', 'slug', 'difficulty', 'light', 'co2', 'region'],
  coral: ['name', 'slug', 'difficulty', 'light', 'flow', 'coralType'],
  equipment: ['name', 'slug', 'category', 'brand'],
  invertebrate: ['name', 'slug', 'difficulty', 'waterType', 'region'],
  problem: ['name', 'title', 'slug', 'category', 'waterType'],
  inspiration: ['title', 'slug', 'style', 'difficulty'],
}

const FULL_PROJECTIONS: Record<EntityType, string> = {
  species: `{
    _id, _type, name, scientificName, slug, excerpt, mainImage,
    family, origin, sizeCm, tankSizeMinL,
    tempMinC, tempMaxC, phMin, phMax, ghMin, ghMax,
    diet, temperament, waterZone, schooling, difficulty, waterType,
    isPredator, reefCompatibility, aquariumStyle, region,
    compatibleSpecies[]->name,
    compatiblePlants[]->name,
    compatibleInvertebrates[]->name,
    relatedPosts[]->title
  }`,
  plant: `{
    _id, _type, name, scientificName, slug, excerpt, mainImage,
    light, co2, growth, difficulty, placement,
    tempMinC, tempMaxC, phMin, phMax, propagation,
    aquariumStyle, region, growthForm, redPlant,
    compatibleInvertebrates[]->name,
    compatibleSpecies[]->name,
    relatedPosts[]->title
  }`,
  coral: `{
    _id, _type, name, scientificName, slug, excerpt, mainImage,
    light, flow, difficulty, placement, aggression, reefCompatibility,
    coralType, photosynthetic,
    tempMinC, tempMaxC,
    aquariumStyle, region,
    compatibleInvertebrates[]->name,
    compatibleSpecies[]->name,
    relatedPosts[]->title
  }`,
  equipment: `{
    _id, _type, name, slug, excerpt, mainImage,
    category, brand, model, flowRateLh, powerW,
    tankSizeMinL, tankSizeMaxL, pros, cons,
    aquariumStyle
  }`,
  invertebrate: `{
    _id, _type, name, scientificName, slug, excerpt, mainImage,
    group, waterType, sizeCm,
    tempMinC, tempMaxC, phMin, phMax,
    diet, temperament, difficulty,
    aquariumStyle, region, reefCompatibility,
    compatibleSpecies[]->name,
    relatedPosts[]->title
  }`,
  problem: `{
    _id, _type, name, title, slug, excerpt, category, waterType,
    symptoms, causes, solutions,
    relatedSpecies[]->name,
    relatedPosts[]->title
  }`,
  inspiration: `{
    _id, _type, title, slug, excerpt, mainImage,
    style, tankSizeL, difficulty, region,
    relatedPosts[]->title
  }`,
}

async function fetchAllOfType(type: EntityType): Promise<Record<string, any>[]> {
  const projection = FULL_PROJECTIONS[type]
  const query = `*[_type == "${type}"]${projection}`
  return client.fetch(query)
}

function buildDistribution(
  entities: Record<string, any>[],
  fieldName: string
): FieldDistribution[] {
  const counts = new Map<string, number>()
  for (const entity of entities) {
    let val = entity[fieldName]
    if (val === undefined || val === null) {
      counts.set('__missing__', (counts.get('__missing__') || 0) + 1)
      continue
    }
    if (Array.isArray(val)) {
      for (const item of val) {
        const s = String(item).trim()
        counts.set(s, (counts.get(s) || 0) + 1)
      }
    } else if (typeof val === 'object') {
      const s = JSON.stringify(val)
      counts.set(s, (counts.get(s) || 0) + 1)
    } else {
      const s = String(val).trim()
      counts.set(s, (counts.get(s) || 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
}

function detectDuplicates(entities: Record<string, any>[]): DuplicateCandidate[] {
  const nameMap = new Map<string, string[]>()
  for (const entity of entities) {
    const names: string[] = []
    if (entity.name) names.push(String(entity.name).trim().toLowerCase())
    if (entity.title) names.push(String(entity.title).trim().toLowerCase())
    if (entity.scientificName) names.push(String(entity.scientificName).trim().toLowerCase())

    for (const n of names) {
      if (!n) continue
      if (!nameMap.has(n)) {
        nameMap.set(n, [])
      }
      nameMap.get(n)!.push(entity._id)
    }
  }

  const duplicates: DuplicateCandidate[] = []
  for (const [name, ids] of nameMap.entries()) {
    if (ids.length > 1) {
      duplicates.push({
        names: [name],
        count: ids.length,
        _ids: ids,
      })
    }
  }

  const allNames = entities
    .map((e) => (e.name || e.title || '').trim().toLowerCase())
    .filter(Boolean)

  for (let i = 0; i < allNames.length; i++) {
    for (let j = i + 1; j < allNames.length; j++) {
      if (allNames[i] === allNames[j]) continue
      if (allNames[i].includes(allNames[j]) || allNames[j].includes(allNames[i])) {
        if (allNames[i].length > 3 && allNames[j].length > 3) {
          const alreadyReported = duplicates.some(
            (d) => d._ids.includes(entities[i]?._id) && d._ids.includes(entities[j]?._id)
          )
          if (!alreadyReported) {
            duplicates.push({
              names: [allNames[i], allNames[j]],
              count: 2,
              _ids: [entities[i]?._id, entities[j]?._id].filter(Boolean),
              ...(undefined as any),
            })
          }
        }
      }
    }
  }

  return duplicates
}

function reportMissingFields(
  entities: Record<string, any>[],
  criticalFields: string[]
): Record<string, MissingFieldReport> {
  const report: Record<string, MissingFieldReport> = {}
  for (const field of criticalFields) {
    const missingIds: string[] = []
    for (const entity of entities) {
      const val = entity[field]
      if (val === undefined || val === null || val === '') {
        missingIds.push(entity._id || entity.name || entity.title || 'unknown')
      }
    }
    report[field] = {
      totalMissing: missingIds.length,
      percentageMissing: entities.length > 0
        ? ((missingIds.length / entities.length) * 100).toFixed(1) + '%'
        : '0%',
      affectedDocuments: missingIds.slice(0, 20),
    }
  }
  return report
}

function buildTypeReport(type: EntityType): TypeReport {
  return {
    type,
    totalCount: 0,
    fieldDistributions: {},
    missingCriticalFields: {},
    duplicates: [],
    sampleDocument: null,
  }
}

function collectAllFields(entities: Record<string, any>[]): string[] {
  const fieldSet = new Set<string>()
  for (const entity of entities) {
    for (const key of Object.keys(entity)) {
      if (key.startsWith('_')) continue
      fieldSet.add(key)
    }
  }
  return Array.from(fieldSet).sort()
}

function pickStringVal(val: any): string {
  if (val === undefined || val === null) return 'N/A'
  if (typeof val === 'string') return val
  if (typeof val === 'boolean') return String(val)
  if (typeof val === 'number') return String(val)
  if (Array.isArray(val)) return val.map(pickStringVal).join(', ')
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

async function main() {
  console.log(`Audit for project: ${projectId}, dataset: ${dataset}`)
  console.log('Entity types:', ENTITY_TYPES.join(', '))

  const report: AuditReport = {
    generatedAt: new Date().toISOString(),
    projectId,
    dataset,
    summary: {
      totalDocuments: 0,
      byType: {} as Record<EntityType, number>,
    },
    typeReports: [],
  }

  for (const type of ENTITY_TYPES) {
    console.log(`\nFetching ${type}...`)
    const entities = await fetchAllOfType(type)
    console.log(`  Found ${entities.length} documents`)

    const typeReport = buildTypeReport(type)
    typeReport.totalCount = entities.length

    const fields = collectAllFields(entities)
    for (const field of fields) {
      typeReport.fieldDistributions[field] = buildDistribution(entities, field)
    }

    const critical = CRITICAL_FIELDS[type]
    typeReport.missingCriticalFields = reportMissingFields(entities, critical)

    typeReport.duplicates = detectDuplicates(entities)

    if (entities.length > 0) {
      const { _id, _type, ...cleanedSample } = entities[0]
      typeReport.sampleDocument = { _id, _type, ...cleanedSample }
    }

    report.typeReports.push(typeReport)
    report.summary.totalDocuments += entities.length
    report.summary.byType[type] = entities.length
  }

  console.log('\n--- SUMMARY ---')
  console.log(`Total documents: ${report.summary.totalDocuments}`)
  for (const [type, count] of Object.entries(report.summary.byType)) {
    console.log(`  ${type}: ${count}`)
  }

  for (const tr of report.typeReports) {
    const crit = tr.missingCriticalFields
    const critMissing = Object.entries(crit).filter(([, v]) => v.totalMissing > 0)
    if (critMissing.length > 0) {
      console.log(`\n[${tr.type}] Missing critical fields:`)
      for (const [field, info] of critMissing) {
        console.log(`  ${field}: ${info.totalMissing} missing (${info.percentageMissing})`)
      }
    }
    if (tr.duplicates.length > 0) {
      console.log(`\n[${tr.type}] Duplicate candidates: ${tr.duplicates.length}`)
      for (const dup of tr.duplicates.slice(0, 10)) {
        console.log(`  "${dup.names.join('" / "')}" (${dup.count} occurrences)`)
      }
    }
  }

  const outputPath = 'scripts/audit-inventory.json'
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))
  console.log(`\nFull report written to ${outputPath}`)
}

main().catch((err) => {
  console.error('Audit failed:', err)
  process.exit(1)
})
