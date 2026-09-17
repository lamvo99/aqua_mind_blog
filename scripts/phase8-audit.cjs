const { createClient } = require('@sanity/client')
const fs = require('fs')

const env = fs.readFileSync('.env.local', 'utf8')
const projectId = env.match(/NEXT_PUBLIC_SANITY_PROJECT_ID="([^"]+)"/)?.[1]
const dataset = env.match(/NEXT_PUBLIC_SANITY_DATASET="([^"]+)"/)?.[1] || 'production'
const token = env.match(/SANITY_API_TOKEN="([^"]+)"/)?.[1]

const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token })

async function fetchAll(type, projection) {
  let all = []
  let lastId = null
  while (true) {
    const q = lastId
      ? `*[_type == "${type}" && _id > "${lastId}"] | order(_id asc) [0...500] ${projection}`
      : `*[_type == "${type}"] | order(_id asc) [0...500] ${projection}`
    const batch = await client.fetch(q)
    if (!batch.length) break
    all = all.concat(batch)
    lastId = batch[batch.length - 1]._id
    if (batch.length < 500) break
  }
  return all
}

function getSlugCurrent(slug) {
  if (!slug) return null
  if (typeof slug === 'string') return slug
  if (slug.current) return slug.current
  return null
}

function isSlugValid(val) {
  if (!val) return false
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(val)
}

function isStringNumeric(val) {
  return typeof val === 'string' && /^-?\d+(\.\d+)?$/.test(val.trim())
}

function main() {
  console.log('=== PHASE 8: COMPREHENSIVE AUDIT ===\n')

  const fetchSpec = '{_id, _type, name, slug, waterType, difficulty, tankSizeMinL, tempMinC, tempMaxC, phMin, phMax, sizeCm, temperament, diet, isPredator, coralType, photosynthetic, light, co2, growthForm, category, group, reefCompatibility, aquariumStyle, compatibleInvertebrates, compatiblePlants, relatedProblems, relatedPosts, suitableEquipment}'

  const types = ['species', 'plant', 'coral', 'equipment', 'invertebrate', 'problem', 'inspiration']

  const VALID = {
    waterType: ['freshwater', 'saltwater', 'brackish'],
    difficulty: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    coralType: ['soft', 'lps', 'sps', 'nps'],
    light: ['Low', 'Low-Moderate', 'Moderate', 'Medium', 'Medium-High', 'High', 'Very High'],
    co2: ['None', 'Low', 'Medium', 'High', 'Required'],
    growthForm: ['Stem', 'Rosette', 'Rhizome', 'Stolon', 'Moss', 'Floating', 'Carpet'],
    temperament: ['Peaceful', 'Semi-aggressive', 'Aggressive'],
    diet: ['Carnivore', 'Omnivore', 'Herbivore', 'Micropredator'],
    equipmentCategory: ['Filter', 'Pump', 'Light', 'Heater', 'CO₂ System', 'Substrate', 'Test Kit', 'Maintenance', 'Other', 'Skimmer', 'ATO', 'Dosing', 'Chiller'],
    invertebrateGroup: ['shrimp', 'snail', 'crab', 'worm', 'crayfish', 'clam', 'starfish', 'anemone', 'urchin'],
  }

  const REQUIRED_FIELDS = {
    species: ['name', 'slug', 'waterType', 'difficulty', 'tankSizeMinL', 'tempMinC', 'tempMaxC'],
    plant: ['name', 'slug', 'difficulty', 'light', 'co2', 'growthForm'],
    coral: ['name', 'slug', 'coralType', 'waterType', 'light', 'photosynthetic'],
    equipment: ['name', 'slug', 'category'],
    invertebrate: ['name', 'slug', 'waterType', 'difficulty', 'group'],
    problem: ['name', 'slug'],
    inspiration: ['name', 'slug'],
  }

  const slugIssues = []
  const requiredFieldIssues = []
  const semanticIssues = []
  const numericIssues = []
  const waterTypeIssues = []
  const duplicateIssues = []
  const relationshipIssues = []

  const allEntities = {}       // type -> { _id, name, slugCurrent }
  const allSlugs = {}          // slug -> [{ type, _id, name }]
  const allNames = {}          // nameLower -> [{ type, _id }]
  const allIds = new Set()

  const fetchMap = {}

  async function run() {
    // 1. Fetch all entities per type
    for (const type of types) {
      console.log(`Fetching ${type}...`)
      const items = await fetchAll(type, fetchSpec)
      console.log(`  Got ${items.length} ${type}`)

      allEntities[type] = items.map(i => {
        const slugCurrent = getSlugCurrent(i.slug)
        return { _id: i._id, name: i.name, slugCurrent, _raw: i }
      })

      for (const item of allEntities[type]) {
        allIds.add(item._id)

        // Build slug index
        if (item.slugCurrent) {
          if (!allSlugs[item.slugCurrent]) allSlugs[item.slugCurrent] = []
          allSlugs[item.slugCurrent].push({ type, _id: item._id, name: item.name })
        }

        // Build name index (case-insensitive)
        if (item.name) {
          const nameLower = item.name.toLowerCase().trim()
          if (!allNames[nameLower]) allNames[nameLower] = []
          allNames[nameLower].push({ type, _id: item._id, name: item.name })
        }
      }
    }

    const byType = {}
    for (const type of types) {
      byType[type] = allEntities[type].length
    }
    const totalEntities = Object.values(byType).reduce((a, b) => a + b, 0)
    console.log(`\nTotal entities: ${totalEntities}`)

    // 2. SLUG INTEGRITY
    console.log('\n--- Slug Integrity ---')
    for (const type of types) {
      for (const item of allEntities[type]) {
        if (!item.slugCurrent) {
          slugIssues.push({ type, _id: item._id, name: item.name, issue: 'Missing slug', severity: 'critical' })
          continue
        }
        if (item.slugCurrent.trim() === '') {
          slugIssues.push({ type, _id: item._id, name: item.name, issue: 'Empty slug', severity: 'critical' })
          continue
        }
        if (!isSlugValid(item.slugCurrent)) {
          slugIssues.push({ type, _id: item._id, name: item.name, slug: item.slugCurrent, issue: 'Invalid slug format (must be lowercase with hyphens, no spaces)', severity: 'important' })
        }
      }
    }

    // Cross-type slug duplicates
    for (const [slug, entries] of Object.entries(allSlugs)) {
      if (entries.length > 1) {
        const typeList = entries.map(e => `${e.type}:${e.name}`).join(', ')
        slugIssues.push({ slug, issue: `Duplicate slug across types: ${typeList}`, entries: entries.map(e => ({ type: e.type, _id: e._id, name: e.name })), severity: 'critical' })
      }
    }
    console.log(`  Slug issues: ${slugIssues.length}`)

    // 3. REQUIRED FIELDS
    console.log('\n--- Required Fields ---')
    for (const type of types) {
      const required = REQUIRED_FIELDS[type] || []
      for (const item of allEntities[type]) {
        for (const field of required) {
          const val = item._raw[field]
          if (val === undefined || val === null || val === '') {
            requiredFieldIssues.push({ type, _id: item._id, name: item.name, field, issue: `Missing required field: ${field}`, severity: 'critical' })
          }
        }
      }
    }
    console.log(`  Required field issues: ${requiredFieldIssues.length}`)

    // 4. SEMANTIC VOCABULARY
    console.log('\n--- Semantic Vocabulary ---')
    for (const type of types) {
      for (const item of allEntities[type]) {
        const r = item._raw

        // waterType
        if (r.waterType && !VALID.waterType.includes(r.waterType)) {
          semanticIssues.push({ type, _id: item._id, name: item.name, field: 'waterType', value: r.waterType, allowed: VALID.waterType, severity: 'important' })
        }

        // difficulty
        if (r.difficulty && !VALID.difficulty.includes(r.difficulty)) {
          semanticIssues.push({ type, _id: item._id, name: item.name, field: 'difficulty', value: r.difficulty, allowed: VALID.difficulty, severity: 'important' })
        }

        // coralType
        if (r.coralType && !VALID.coralType.includes(r.coralType)) {
          semanticIssues.push({ type, _id: item._id, name: item.name, field: 'coralType', value: r.coralType, allowed: VALID.coralType, severity: 'important' })
        }

        // light
        if (r.light && !VALID.light.includes(r.light)) {
          semanticIssues.push({ type, _id: item._id, name: item.name, field: 'light', value: r.light, allowed: VALID.light, severity: 'important' })
        }

        // co2
        if (r.co2 && !VALID.co2.includes(r.co2)) {
          semanticIssues.push({ type, _id: item._id, name: item.name, field: 'co2', value: r.co2, allowed: VALID.co2, severity: 'important' })
        }

        // growthForm
        if (r.growthForm && !VALID.growthForm.includes(r.growthForm)) {
          semanticIssues.push({ type, _id: item._id, name: item.name, field: 'growthForm', value: r.growthForm, allowed: VALID.growthForm, severity: 'important' })
        }

        // temperament
        if (r.temperament && !VALID.temperament.includes(r.temperament)) {
          semanticIssues.push({ type, _id: item._id, name: item.name, field: 'temperament', value: r.temperament, allowed: VALID.temperament, severity: 'important' })
        }

        // diet
        if (r.diet && !VALID.diet.includes(r.diet)) {
          semanticIssues.push({ type, _id: item._id, name: item.name, field: 'diet', value: r.diet, allowed: VALID.diet, severity: 'important' })
        }

        // equipment category
        if (type === 'equipment' && r.category && !VALID.equipmentCategory.includes(r.category)) {
          semanticIssues.push({ type, _id: item._id, name: item.name, field: 'category', value: r.category, allowed: VALID.equipmentCategory, severity: 'important' })
        }

        // invertebrate group
        if (type === 'invertebrate' && r.group && !VALID.invertebrateGroup.includes(r.group)) {
          semanticIssues.push({ type, _id: item._id, name: item.name, field: 'group', value: r.group, allowed: VALID.invertebrateGroup, severity: 'important' })
        }
      }
    }
    console.log(`  Semantic issues: ${semanticIssues.length}`)

    // 5. NUMERIC INTEGRITY
    console.log('\n--- Numeric Integrity ---')
    for (const type of types) {
      for (const item of allEntities[type]) {
        const r = item._raw

        // Check string-in-numeric fields
        const numFields = ['tankSizeMinL', 'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'sizeCm', 'ghMin', 'ghMax']
        for (const f of numFields) {
          if (r[f] !== undefined && r[f] !== null && r[f] !== '') {
            if (typeof r[f] === 'string') {
              if (isStringNumeric(r[f])) {
                numericIssues.push({ type, _id: item._id, name: item.name, field: f, value: r[f], issue: 'String value in numeric field (should be number)', severity: 'important' })
              } else {
                numericIssues.push({ type, _id: item._id, name: item.name, field: f, value: r[f], issue: 'Non-numeric string in numeric field', severity: 'critical' })
              }
            }
          }
        }

        // tempMinC <= tempMaxC
        if (r.tempMinC != null && r.tempMaxC != null) {
          const minT = Number(r.tempMinC)
          const maxT = Number(r.tempMaxC)
          if (!isNaN(minT) && !isNaN(maxT) && minT > maxT) {
            numericIssues.push({ type, _id: item._id, name: item.name, field: 'tempMinC/tempMaxC', value: `${r.tempMinC} > ${r.tempMaxC}`, issue: 'tempMinC > tempMaxC', severity: 'critical' })
          }
        }

        // phMin <= phMax
        if (r.phMin != null && r.phMax != null) {
          const minP = Number(r.phMin)
          const maxP = Number(r.phMax)
          if (!isNaN(minP) && !isNaN(maxP) && minP > maxP) {
            numericIssues.push({ type, _id: item._id, name: item.name, field: 'phMin/phMax', value: `${r.phMin} > ${r.phMax}`, issue: 'phMin > phMax', severity: 'critical' })
          }
        }

        // tankSizeMinL > 0
        if (r.tankSizeMinL != null) {
          const v = Number(r.tankSizeMinL)
          if (!isNaN(v) && v <= 0) {
            numericIssues.push({ type, _id: item._id, name: item.name, field: 'tankSizeMinL', value: r.tankSizeMinL, issue: 'tankSizeMinL must be > 0', severity: 'critical' })
          }
        }

        // sizeCm > 0
        if (r.sizeCm != null) {
          const v = Number(r.sizeCm)
          if (!isNaN(v) && v <= 0) {
            numericIssues.push({ type, _id: item._id, name: item.name, field: 'sizeCm', value: r.sizeCm, issue: 'sizeCm must be > 0', severity: 'critical' })
          }
        }
      }
    }
    console.log(`  Numeric issues: ${numericIssues.length}`)

    // 6. WATER TYPE CONSISTENCY
    console.log('\n--- Water Type Consistency ---')
    const freshwaterOnlyStyles = ['Planted', 'Betta / Nano', 'High-Tech / CO2', 'Low-Tech', 'Aquascaping']
    const saltwaterOnlyStyles = ['Mixed Reef', 'Fish Only', 'Marine Predator', 'LPS Reef', 'SPS Reef', 'Soft Coral Reef', 'Nano Reef']

    for (const type of types) {
      for (const item of allEntities[type]) {
        const r = item._raw
        const wt = r.waterType
        const styles = Array.isArray(r.aquariumStyle) ? r.aquariumStyle : (r.aquariumStyle ? [r.aquariumStyle] : [])

        if (wt === 'freshwater') {
          for (const s of styles) {
            if (saltwaterOnlyStyles.includes(s)) {
              waterTypeIssues.push({ type, _id: item._id, name: item.name, waterType: wt, style: s, issue: `Freshwater entity has saltwater style: ${s}`, severity: 'important' })
            }
          }
        } else if (wt === 'saltwater') {
          for (const s of styles) {
            if (freshwaterOnlyStyles.includes(s)) {
              waterTypeIssues.push({ type, _id: item._id, name: item.name, waterType: wt, style: s, issue: `Saltwater entity has freshwater style: ${s}`, severity: 'important' })
            }
          }
        }

        // Corals should be saltwater
        if (type === 'coral' && wt && wt !== 'saltwater') {
          waterTypeIssues.push({ type, _id: item._id, name: item.name, waterType: wt, issue: `Coral should be saltwater, got: ${wt}`, severity: 'critical' })
        }

        // Plants should be freshwater (mostly)
        if (type === 'plant' && wt && wt !== 'freshwater' && wt !== 'brackish') {
          waterTypeIssues.push({ type, _id: item._id, name: item.name, waterType: wt, issue: `Plant should be freshwater, got: ${wt}`, severity: 'important' })
        }
      }
    }
    console.log(`  Water type issues: ${waterTypeIssues.length}`)

    // 7. DUPLICATE DETECTION (names across types)
    console.log('\n--- Duplicate Detection ---')
    for (const [nameLower, entries] of Object.entries(allNames)) {
      if (entries.length > 1) {
        // Check if different types
        const typesInvolved = [...new Set(entries.map(e => e.type))]
        if (typesInvolved.length > 1) {
          duplicateIssues.push({ name: entries[0].name, entries: entries.map(e => ({ type: e.type, _id: e._id })), issue: `Name "${entries[0].name}" found across types: ${typesInvolved.join(', ')}`, severity: 'important' })
        } else {
          // Same type duplicates
          duplicateIssues.push({ name: entries[0].name, entries: entries.map(e => ({ type: e.type, _id: e._id })), issue: `Duplicate name "${entries[0].name}" in ${entries[0].type}`, severity: 'critical' })
        }
      }
    }
    console.log(`  Duplicate issues: ${duplicateIssues.length}`)

    // 8. RELATIONSHIP INTEGRITY
    console.log('\n--- Relationship Integrity ---')
    const relFields = ['compatibleInvertebrates', 'compatiblePlants', 'relatedProblems', 'relatedPosts', 'suitableEquipment']
    let relChecks = 0

    for (const type of types) {
      for (const item of allEntities[type]) {
        for (const field of relFields) {
          const val = item._raw[field]
          if (!val || !Array.isArray(val) || val.length === 0) continue
          for (const ref of val) {
            relChecks++
            let refId = null
            if (ref && ref._ref) refId = ref._ref
            else if (typeof ref === 'string') refId = ref

            if (refId && !allIds.has(refId)) {
              relationshipIssues.push({ type, _id: item._id, name: item.name, field, refId, issue: `Reference "${refId}" not found in any document`, severity: 'important' })
            }
          }
        }
      }
    }
    console.log(`  Relationship checks: ${relChecks}, broken refs: ${relationshipIssues.length}`)

    // BUILD REPORT
    const critical = [...slugIssues, ...requiredFieldIssues, ...numericIssues, ...waterTypeIssues.filter(i => i.severity === 'critical'), ...duplicateIssues.filter(i => i.severity === 'critical'), ...relationshipIssues].filter(i => i.severity === 'critical').length
    const important = [...slugIssues, ...requiredFieldIssues, ...semanticIssues, ...numericIssues, ...waterTypeIssues, ...duplicateIssues, ...relationshipIssues].filter(i => i.severity === 'important').length
    const minor = 0
    const totalIssues = critical + important + minor

    const report = {
      totalEntities,
      byType,
      slugIssues,
      requiredFieldIssues,
      semanticIssues,
      numericIssues,
      waterTypeIssues,
      duplicateIssues,
      relationshipIssues,
      summary: {
        totalIssues,
        critical,
        important,
        minor,
      },
    }

    fs.writeFileSync('scripts/phase8-audit-report.json', JSON.stringify(report, null, 2))
    console.log('\n=== AUDIT REPORT SUMMARY ===')
    console.log(JSON.stringify(report.summary, null, 2))
    console.log(`\nFull report saved to scripts/phase8-audit-report.json`)
  }

  run().catch(e => { console.error(e); process.exit(1) })
}

main()
