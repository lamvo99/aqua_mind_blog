const { createClient } = require('@sanity/client')
const fs = require('fs')

const env = fs.readFileSync('.env.local', 'utf8')
const projectId = env.match(/NEXT_PUBLIC_SANITY_PROJECT_ID="([^"]+)"/)?.[1]
const dataset = env.match(/NEXT_PUBLIC_SANITY_DATASET="([^"]+)"/)?.[1] || 'production'
const token = env.match(/SANITY_API_TOKEN="([^"]+)"/)?.[1]

const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token })

// Duplicate slugs to fix (keep older record, rename newer)
const SLUG_FIXES = [
  // Species duplicates
  { id: '1z8rQFHeojDMTUo2hXSV4m', slug: 'gasteropelecus-sternicla-hatchetfish', reason: 'Hatchetfish conflicts with Silver Hatchetfish' },
  { id: '1z8rQFHeojDMTUo2hXSV9i', slug: 'nannostomus-beckfordi-golden', reason: 'Golden Pencilfish duplicate' },
  { id: '1z8rQFHeojDMTUo2hXSW6w', slug: 'macropodus-opercularis-paradise', reason: 'Paradise Fish duplicate' },
  { id: 'PZ8Kai1VvEL468NS2LLaqK', slug: 'poecilia-sphenops-molly', reason: 'Molly conflicts with Short-finned Molly' },
  { id: 'sebdKYryWZgYP2rm3oqsPG', slug: 'carassius-auratus-common', reason: 'Common Goldfish conflicts with Fancy Goldfish' },
  // Plant duplicates
  { id: '1z8rQFHeojDMTUo2hXSXE2', slug: 'bucephalandra-phase7', reason: 'Bucephalandra duplicate' },
  { id: 'sebdKYryWZgYP2rm3or05S', slug: 'ceratopteris-thalictroides-sprite', reason: 'Water Sprite duplicate' },
  { id: 'PZ8Kai1VvEL468NS2LLcNl', slug: 'rotala-macrandra-red', reason: 'Rotala Macrandra duplicate' },
  // Coral duplicates
  { id: 'sebdKYryWZgYP2rm3or0mk', slug: 'stylophora-pistillata-catspaw', reason: 'Cat Paw conflicts with Stylophora Coral' },
  // Equipment duplicates
  { id: '1z8rQFHeojDMTUo2hXSY4g', slug: 'protein-skimmer-phase7', reason: 'Protein Skimmer duplicate' },
  { id: 'PZ8Kai1VvEL468NS2LLfda', slug: 'gravel-vacuum-phase7', reason: 'Gravel Vacuum duplicate' },
  { id: 'sebdKYryWZgYP2rm3or2P6', slug: 'aquarium-chiller-phase7', reason: 'Aquarium Chiller duplicate' },
  // Invertebrate duplicates
  { id: 'sebdKYryWZgYP2rm3or1AM', slug: 'caridina-dennerli-red-cherry', reason: 'Sulawesi Red Cherry conflicts with Cardinal' },
]

// Coral waterType fixes (all corals are saltwater)
const CORAL_WATER_FIXES = [
  '1z8rQFHeojDMTUo2hX9Rpx', // Dendronephthya
  '5oQB2MZ7gmZXjdwFqSrVl7', // Montipora Digitata
  'BruaGKYCGDRQjkiQDnlmjC', // Galaxea
  'BruaGKYCGDRQjkiQDnlmrB', // Honeycomb Brain Coral
  'BruaGKYCGDRQjkiQDnlmtq', // Elegance Coral
  'BruaGKYCGDRQjkiQDnlmwV', // Open Brain Coral (Phase 7)
  'I9bI8W8ZWcEwyIzM9CjDmS', // Green Star Polyps
  'I9bI8W8ZWcEwyIzM9CttlY', // Palythoa
  'I9bI8W8ZWcEwyIzM9Ctty8', // Lobo Coral
  'I9bI8W8ZWcEwyIzM9Ctu8C', // Bubble Coral
  'I9bI8W8ZWcEwyIzM9DJffc', // Dendrophyllia Coral
  'IlX7xILobrukz7d5JnTHt0', // Torch Coral
  'IlX7xILobrukz7d5JnvhK2', // Stylophora Coral
  'BruaGKYCGDRQjkiQDnlmoW', // Bird's Nest Coral
  'BruaGKYCGDRQjkiQDnlmrB', // Honeycomb Brain Coral
]

// Plant growthForm fixes
const PLANT_GROWTH_FIXES = [
  { id: 'IlX7xILobrukz7d5Jo2xiA', growthForm: 'Floating', name: 'Water Sprite' },
  { id: 'ofTl1CTOUWuLwM28PxTLn5', growthForm: 'Stem', name: 'Blyxa japonica' },
  { id: 'plant-alternanthera-reineckii', growthForm: 'Stem', name: 'Alternanthera reineckii' },
  { id: 'plant-amazon-sword', growthForm: 'Rosette', name: 'Amazon Sword' },
]

async function main() {
  let fixed = 0
  let errors = 0

  // Fix duplicate slugs
  console.log('=== FIXING DUPLICATE SLUGS ===')
  for (const fix of SLUG_FIXES) {
    try {
      await client.patch(fix.id).set({ slug: { _type: 'slug', current: fix.slug } }).commit()
      console.log(`  Fixed: ${fix.id} → ${fix.slug}`)
      fixed++
    } catch (e) {
      console.log(`  ERROR: ${fix.id}: ${e.message}`)
      errors++
    }
  }

  // Fix coral waterType
  console.log('\n=== FIXING CORAL WATER TYPE ===')
  for (const id of CORAL_WATER_FIXES) {
    try {
      await client.patch(id).set({ waterType: 'saltwater' }).commit()
      console.log(`  Fixed waterType: ${id}`)
      fixed++
    } catch (e) {
      console.log(`  ERROR: ${id}: ${e.message}`)
      errors++
    }
  }

  // Fix plant growthForm
  console.log('\n=== FIXING PLANT GROWTH FORM ===')
  for (const fix of PLANT_GROWTH_FIXES) {
    try {
      await client.patch(fix.id).set({ growthForm: fix.growthForm }).commit()
      console.log(`  Fixed growthForm: ${fix.name} → ${fix.growthForm}`)
      fixed++
    } catch (e) {
      console.log(`  ERROR: ${fix.name}: ${e.message}`)
      errors++
    }
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`Fixed: ${fixed}`)
  console.log(`Errors: ${errors}`)
}

main().catch(e => { console.error(e); process.exit(1) })
