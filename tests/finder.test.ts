import { describe, it, expect } from 'vitest'
import { findMatches, intentToParams, paramsToIntent } from '@/lib/finder'
import type { FinderItem, FinderIntent } from '@/lib/finder'

function item(overrides: Partial<FinderItem> & { _id: string; name: string; _type: FinderItem['_type'] }): FinderItem {
  return {
    slug: { current: overrides._id },
    tankSizeMinL: 50,
    difficulty: 'Beginner',
    waterType: 'freshwater',
    ...overrides,
  } as FinderItem
}

const beginnerIntent: FinderIntent = {
  waterType: 'freshwater',
  tankRange: 'medium',
  difficulty: 'beginner',
  light: 'medium',
}

describe('findMatches', () => {
  it('empty items → empty results', () => {
    expect(findMatches([], beginnerIntent)).toHaveLength(0)
  })

  it('sorts by match count descending', () => {
    const easy = item({ _id: 'easy', name: 'Easy', _type: 'species', tankSizeMinL: 10, difficulty: 'Beginner', waterType: 'freshwater' })
    const hard = item({ _id: 'hard', name: 'Hard', _type: 'species', tankSizeMinL: 10, difficulty: 'Intermediate', waterType: 'freshwater' })
    // beginner matches Beginner exactly (+1 match), Intermediate is also match (+1), but Beginner gets better explanation
    const r = findMatches([hard, easy], beginnerIntent)
    expect(r).toHaveLength(2)
    // Both pass hard constraints, both pass difficulty (within 1 level), sort stable
    expect(r.find(x => x.item._id === 'easy')).toBeDefined()
    expect(r.find(x => x.item._id === 'hard')).toBeDefined()
  })

  it('hard constraint: water type mismatch excludes', () => {
    const salt = item({ _id: 's1', name: 'Clownfish', _type: 'species', waterType: 'saltwater' })
    expect(findMatches([salt], beginnerIntent)).toHaveLength(0)
  })

  it('hard constraint: tank too small excludes', () => {
    const huge = item({ _id: 'h1', name: 'Arowana', _type: 'species', tankSizeMinL: 500 })
    expect(findMatches([huge], { ...beginnerIntent, tankRange: 'small' })).toHaveLength(0)
  })

  it('soft constraint: difficulty 2+ levels above excluded as hard constraint', () => {
    const expert = item({ _id: 'e1', name: 'Expert', _type: 'species', difficulty: 'Expert', waterType: 'freshwater' })
    const easy = item({ _id: 'e2', name: 'Easy', _type: 'species', difficulty: 'Beginner', waterType: 'freshwater' })
    const intent: FinderIntent = { ...beginnerIntent, difficulty: 'beginner' }
    // Expert (rank 3) vs beginner (rank 0) → diff=3, excluded
    expect(findMatches([expert], intent)).toHaveLength(0)
    // Easy passes
    expect(findMatches([easy], intent)).toHaveLength(1)
    // Expert passes when user is advanced
    expect(findMatches([expert], { ...intent, difficulty: 'advanced' }).length).toBeGreaterThan(0)
  })

  it('unknown water type passes all water checks', () => {
    const fish = item({ _id: 'f1', name: 'Any', _type: 'species', waterType: 'freshwater' })
    const r = findMatches([fish], { waterType: undefined })
    expect(r).toHaveLength(1)
    expect(r[0].constraints.find(c => c.field === 'waterType')?.status).toBe('unknown')
  })

  it('unknown tank size passes tank checks', () => {
    const fish = item({ _id: 'f1', name: 'Any', _type: 'species' })
    const r = findMatches([fish], { tankSizeL: undefined, tankRange: undefined })
    expect(r).toHaveLength(1)
    expect(r[0].constraints.find(c => c.field === 'tankSize')?.status).toBe('unknown')
  })

  it('handles items with missing optional fields', () => {
    const bare = { _id: 'x1', _type: 'species', name: 'Bare', slug: { current: 'x1' } } as FinderItem
    const r = findMatches([bare], beginnerIntent)
    expect(r.length).toBeGreaterThan(0)
  })

  it('equipment included in results', () => {
    const eq = item({ _id: 'eq1', name: 'Filter', _type: 'equipment', category: 'Filtration' })
    const r = findMatches([eq], beginnerIntent)
    expect(r).toHaveLength(1)
  })

  it('invertebrate included when water type matches', () => {
    const inv = item({ _id: 'inv1', name: 'Shrimp', _type: 'invertebrate', waterType: 'freshwater' })
    const r = findMatches([inv], beginnerIntent)
    expect(r).toHaveLength(1)
  })

  it('invertebrate excluded when water type mismatches', () => {
    const inv = item({ _id: 'inv1', name: 'Shrimp', _type: 'invertebrate', waterType: 'saltwater' })
    expect(findMatches([inv], beginnerIntent)).toHaveLength(0)
  })

  it('explanation builds from match constraints', () => {
    const fish = item({ _id: 'f1', name: 'Tetra', _type: 'species', difficulty: 'Beginner', tankSizeMinL: 40, waterType: 'freshwater' })
    const r = findMatches([fish], beginnerIntent)
    expect(r[0].explanation.length).toBeGreaterThan(0)
  })

  it('constraint detail provides match/no_match/unknown', () => {
    const fish = item({ _id: 'f1', name: 'Tetra', _type: 'species', waterType: 'freshwater' })
    const r = findMatches([fish], beginnerIntent)
    const waterC = r[0].constraints.find(c => c.field === 'waterType')
    expect(waterC?.status).toBe('match')
  })
})

describe('URL state', () => {
  it('roundtrips intent through params', () => {
    const intent: FinderIntent = { waterType: 'saltwater', tankRange: 'large', difficulty: 'advanced', light: 'high' }
    const params = intentToParams(intent)
    const back = paramsToIntent(params)
    expect(back.waterType).toBe('saltwater')
    expect(back.tankRange).toBe('large')
    expect(back.difficulty).toBe('advanced')
    expect(back.light).toBe('high')
  })

  it('empty params → empty intent', () => {
    const intent = paramsToIntent('')
    expect(intent.waterType).toBeUndefined()
    expect(intent.tankRange).toBeUndefined()
  })
})
