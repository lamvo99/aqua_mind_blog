import { describe, it, expect } from 'vitest'
import { COMPARE_FIELDS, MAX_COMPARE } from '@/lib/compare'

describe('compare config', () => {
  it('covers all four database types', () => {
    expect(Object.keys(COMPARE_FIELDS).sort()).toEqual(['coral', 'equipment', 'plant', 'species'].sort())
  })

  it('MAX_COMPARE is 3', () => {
    expect(MAX_COMPARE).toBe(3)
  })

  it('species rows extract values with units', () => {
    const fields = COMPARE_FIELDS.species
    const item = { sizeCm: 6, tankSizeMinL: 40, tempMinC: 22, tempMaxC: 26, phMin: 6, phMax: 7.5, ghMin: 2, ghMax: 8, diet: 'Omnivore', temperament: 'Peaceful', waterZone: 'Middle', schooling: 'Yes', difficulty: 'Beginner' }
    const row = Object.fromEntries(fields.map((f) => [f.key, f.extract(item)]))
    expect(row.sizeCm).toBe('6 cm')
    expect(row.temp).toBe('22–26°C')
    expect(row.ph).toBe('6–7.5')
    expect(row.gh).toBe('2–8 dGH')
  })

  it('range handles single-sided and missing bounds', () => {
    const temp = COMPARE_FIELDS.species.find((f) => f.key === 'temp')!
    expect(temp.extract({ tempMinC: 20, tempMaxC: null })).toBe('20°C')
    expect(temp.extract({ tempMinC: null, tempMaxC: 30 })).toBe('30°C')
    expect(temp.extract({ tempMinC: null, tempMaxC: null })).toBe('')
    expect(temp.extract({})).toBe('')
  })

  it('null/undefined values render as empty string', () => {
    const diet = COMPARE_FIELDS.species.find((f) => f.key === 'diet')!
    expect(diet.extract({ diet: null })).toBe('')
    expect(diet.extract({ diet: '' })).toBe('')
    expect(diet.extract({ diet: 0 })).toBe('0')
  })

  it('coral reefCompatibility renders Yes/No', () => {
    const field = COMPARE_FIELDS.coral.find((f) => f.key === 'reefCompatibility')!
    expect(field.extract({ reefCompatibility: true })).toBe('Yes')
    expect(field.extract({ reefCompatibility: false })).toBe('No')
    expect(field.extract({ reefCompatibility: null })).toBe('')
  })

  it('equipment rows append L/h and W units', () => {
    const flow = COMPARE_FIELDS.equipment.find((f) => f.key === 'flowRateLh')!
    const power = COMPARE_FIELDS.equipment.find((f) => f.key === 'powerW')!
    expect(flow.extract({ flowRateLh: 600 })).toBe('600 L/h')
    expect(power.extract({ powerW: 12 })).toBe('12 W')
  })
})
