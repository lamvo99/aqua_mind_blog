const fs = require('fs')
const report = JSON.parse(fs.readFileSync('scripts/audit-inventory.json', 'utf8'))

console.log('=== COMPREHENSIVE DATABASE INVENTORY ===\n')

const types = ['species', 'plant', 'coral', 'equipment', 'invertebrate', 'problem', 'inspiration']
let total = 0

for (const type of types) {
  const d = report[type]
  total += d.count
  console.log(`\n--- ${type.toUpperCase()} (${d.count}) ---`)
  
  // Key distributions
  for (const field of ['waterType', 'difficulty', 'region', 'category', 'group', 'coralType', 'light', 'co2', 'growthForm', 'isPredator', 'reefCompatibility', 'temperament', 'diet', 'waterZone', 'schooling', 'photosynthetic', 'redPlant', 'aquariumStyle']) {
    const dist = d.distributions[field]
    if (dist && Object.keys(dist).length > 0) {
      const clean = {}
      for (const [k, v] of Object.entries(dist)) {
        const key = k === '__NULL__' ? '(none)' : k.replace(/"/g, '')
        clean[key] = v
      }
      console.log(`  ${field}: ${JSON.stringify(clean)}`)
    }
  }
  
  // Missing fields
  const criticalFields = {
    species: ['waterType', 'difficulty', 'region', 'tankSizeMinL', 'tempMinC', 'tempMaxC', 'phMin', 'phMax', 'sizeCm', 'temperament', 'diet'],
    plant: ['waterType', 'difficulty', 'light', 'co2', 'growthForm', 'aquariumStyle'],
    coral: ['waterType', 'difficulty', 'light', 'coralType', 'photosynthetic', 'aquariumStyle'],
    equipment: ['category', 'group', 'tankSizeMinL', 'tankSizeMaxL'],
    invertebrate: ['waterType', 'difficulty', 'region', 'aquariumStyle', 'reefCompatibility'],
    problem: ['category', 'waterType'],
    inspiration: ['category'],
  }
  
  const fields = criticalFields[type] || []
  for (const f of fields) {
    const dist = d.distributions[f]
    const nullCount = dist?.['__NULL__'] || 0
    if (nullCount > 0) {
      console.log(`  MISSING ${f}: ${nullCount}/${d.count} (${Math.round(nullCount/d.count*100)}%)`)
    }
  }
  
  // Duplicates
  if (d.duplicateCandidates.length > 0) {
    console.log(`  DUPLICATES: ${d.duplicateCandidates.join(', ')}`)
  }
}

console.log(`\n\n=== TOTAL: ${total} ===`)
