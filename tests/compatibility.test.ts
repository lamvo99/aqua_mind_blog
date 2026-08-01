import { describe, it, expect } from 'vitest'
import { checkCompatibility, buildShareUrl } from '@/lib/calculators/compatibility'
import type { CompatSpecies } from '@/lib/calculators/compatibility'

function species(overrides: Partial<CompatSpecies> & { _id: string; name: string; slug: string }): CompatSpecies {
  return {
    scientificName: null,
    sizeCm: 5,
    tankSizeMinL: null,
    tempMinC: 22,
    tempMaxC: 28,
    phMin: 6,
    phMax: 7.5,
    ghMin: null,
    ghMax: null,
    temperament: 'peaceful',
    waterZone: 'middle',
    schooling: '',
    diet: 'omnivore',
    difficulty: 'Beginner',
    compatibleWith: [],
    ...overrides,
  }
}

const A = species({ _id: 'a', name: 'Species A', slug: 'a' })
const B = species({ _id: 'b', name: 'Species B', slug: 'b' })

describe('checkCompatibility', () => {
  it('empty selection → no pairs, null-ish totals, no crash', () => {
    const r = checkCompatibility({ a: A }, [], 100)
    expect(r.pairIssues).toHaveLength(0)
    expect(r.tankIssues).toHaveLength(0)
    expect(r.totalCm).toBe(0)
    expect(r.status).toBe('lightly-stocked')
  })

  it('ignores selections whose slug is missing from the map', () => {
    const r = checkCompatibility({ a: A }, [{ slug: 'ghost', count: 1 }, { slug: 'a', count: 1 }], 100)
    expect(r.pairIssues).toHaveLength(0)
    expect(r.tankIssues).toHaveLength(0)
  })

  it('flags tank too small (tankSizeMinL > tankL) as error', () => {
    const big = species({ _id: 'b', name: 'Big Fish', slug: 'big', tankSizeMinL: 200 })
    const r = checkCompatibility({ big }, [{ slug: 'big', count: 1 }], 100)
    expect(r.tankIssues.some((i) => i.severity === 'error' && i.message.includes('needs at least 200 L'))).toBe(true)
  })

  it('flags schooling species with < 6 as info', () => {
    const school = species({ _id: 's', name: 'Tetra', slug: 'tetra', schooling: 'schools of 6+' })
    const r = checkCompatibility({ tetra: school }, [{ slug: 'tetra', count: 3 }], 100)
    expect(r.tankIssues.some((i) => i.severity === 'info' && i.message.includes('keep at least 6'))).toBe(true)
    const ok = checkCompatibility({ tetra: school }, [{ slug: 'tetra', count: 6 }], 100)
    expect(ok.tankIssues.some((i) => i.message.includes('keep at least 6'))).toBe(false)
  })

  it('temperature mismatch → error', () => {
    const cold = species({ _id: 'c', name: 'Cold Fish', slug: 'cold', tempMinC: 10, tempMaxC: 16 })
    const r = checkCompatibility({ a: A, cold }, [{ slug: 'a', count: 1 }, { slug: 'cold', count: 1 }], 100)
    const pair = r.pairIssues[0]
    expect(pair.issues.some((i) => i.severity === 'error' && i.message.includes('Temperature mismatch'))).toBe(true)
  })

  it('pH mismatch → error', () => {
    const alkaline = species({ _id: 'p', name: 'Alkaline Fish', slug: 'alk', phMin: 8, phMax: 8.5 })
    const r = checkCompatibility({ a: A, alk: alkaline }, [{ slug: 'a', count: 1 }, { slug: 'alk', count: 1 }], 100)
    expect(r.pairIssues[0].issues.some((i) => i.severity === 'error' && i.message.includes('pH mismatch'))).toBe(true)
  })

  it('GH mismatch → warning only when both ranges known', () => {
    const soft = species({ _id: 's', name: 'Soft Fish', slug: 'soft', ghMin: 1, ghMax: 4 })
    const hard = species({ _id: 'h', name: 'Hard Fish', slug: 'hard', ghMin: 10, ghMax: 15 })
    const r = checkCompatibility({ soft, hard }, [{ slug: 'soft', count: 1 }, { slug: 'hard', count: 1 }], 100)
    expect(r.pairIssues[0].issues.some((i) => i.severity === 'warning' && i.message.includes('Hardness (GH)'))).toBe(true)
    // missing GH on one side → no warning
    const r2 = checkCompatibility({ a: A, hard }, [{ slug: 'a', count: 1 }, { slug: 'hard', count: 1 }], 100)
    expect(r2.pairIssues[0].issues.some((i) => i.message.includes('Hardness (GH)'))).toBe(false)
  })

  it('two aggressive species in same zone → warning mentioning water layer', () => {
    const agg1 = species({ _id: 'g1', name: 'Aggro 1', slug: 'g1', temperament: 'aggressive', waterZone: 'top' })
    const agg2 = species({ _id: 'g2', name: 'Aggro 2', slug: 'g2', temperament: 'aggressive', waterZone: 'top' })
    const r = checkCompatibility({ g1: agg1, g2: agg2 }, [{ slug: 'g1', count: 1 }, { slug: 'g2', count: 1 }], 100)
    expect(r.pairIssues[0].issues.some((i) => i.message.includes('same water layer'))).toBe(true)
  })

  it('carnivore may eat much smaller fish → warning', () => {
    const predator = species({ _id: 'pr', name: 'Predator', slug: 'pred', diet: 'carnivore', sizeCm: 20 })
    const prey = species({ _id: 'py', name: 'Prey', slug: 'prey', diet: 'flakes', sizeCm: 4 })
    const r = checkCompatibility({ pred: predator, prey }, [{ slug: 'pred', count: 1 }, { slug: 'prey', count: 1 }], 100)
    expect(r.pairIssues[0].issues.some((i) => i.message.includes('may try to eat'))).toBe(true)
  })

  it('known compatible pair with no other issues → ok severity message', () => {
    const c = species({ _id: 'c', name: 'Compatible', slug: 'c', compatibleWith: ['a'] })
    const r = checkCompatibility({ a: A, c }, [{ slug: 'a', count: 1 }, { slug: 'c', count: 1 }], 100)
    expect(r.pairIssues[0].issues.some((i) => i.severity === 'ok')).toBe(true)
  })

  it('stocking status computed from total cm vs capacity', () => {
    const big = species({ _id: 'b', name: 'Big', slug: 'big', sizeCm: 40 })
    const r = checkCompatibility({ big }, [{ slug: 'big', count: 10 }], 60)
    expect(r.status).toBe('overstocked')
    expect(r.utilizationPercent).toBeGreaterThan(100)
  })
})

describe('buildShareUrl', () => {
  it('empty selections → base path', () => {
    expect(buildShareUrl(100, [])).toBe('/tools/compatibility-checker')
  })

  it('encodes fish as slug:count pairs', () => {
    const url = buildShareUrl(120, [{ slug: 'a b', count: 3 }, { slug: 'c', count: 2 }])
    expect(url).toBe('/tools/compatibility-checker?tank=120&fish=' + encodeURIComponent('a b:3,c:2'))
  })
})
