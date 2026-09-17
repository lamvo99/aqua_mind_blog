import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'

describe('Phase 6 Audit', () => {
  const inventory = JSON.parse(readFileSync('scripts/audit-inventory.json', 'utf8'))

  it('has all 7 entity types', () => {
    const types = ['species', 'plant', 'coral', 'equipment', 'invertebrate', 'problem', 'inspiration']
    for (const type of types) {
      expect(inventory[type]).toBeDefined()
      expect(inventory[type].count).toBeGreaterThan(0)
    }
  })

  it('total entities is 403 (published only, drafts excluded)', () => {
    const total = Object.values(inventory).reduce((sum: number, d: any) => sum + d.count, 0)
    expect(total).toBe(403)
  })

  it('species has waterType distribution', () => {
    expect(inventory.species.distributions.waterType).toBeDefined()
    expect(inventory.species.distributions.waterType['freshwater']).toBe(122)
    expect(inventory.species.distributions.waterType['saltwater']).toBe(28)
  })

  it('species has difficulty distribution', () => {
    expect(inventory.species.distributions.difficulty).toBeDefined()
    expect(inventory.species.distributions.difficulty['Beginner']).toBe(71)
  })

  it('corals have coralType distribution', () => {
    expect(inventory.coral.distributions.coralType).toBeDefined()
    const total = Object.values(inventory.coral.distributions.coralType).reduce((s: number, v: any) => s + v, 0)
    expect(total).toBe(48)
  })

  it('plants have growthForm distribution', () => {
    expect(inventory.plant.distributions.growthForm).toBeDefined()
  })

  it('equipment has category distribution', () => {
    expect(inventory.equipment.distributions.category).toBeDefined()
  })

  it('invertebrates have group distribution', () => {
    expect(inventory.invertebrate.distributions.group).toBeDefined()
  })

  it('no critical duplicate candidates beyond known pairs', () => {
    expect(inventory.species.duplicateCandidates.length).toBeLessThanOrEqual(10)
    expect(inventory.coral.duplicateCandidates.length).toBeLessThanOrEqual(5)
  })
})
