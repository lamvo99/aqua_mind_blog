import { describe, it, expect } from 'vitest'
import { findMatches } from '@/lib/finder'
import type { FinderItem, FinderAnswers } from '@/lib/finder'

function item(overrides: Partial<FinderItem> & { _id: string; name: string; _type: 'species' | 'plant' | 'coral' }): FinderItem {
  return {
    slug: { current: overrides._id },
    tankSizeMinL: 50,
    difficulty: 'Beginner',
    ...overrides,
  } as FinderItem
}

const beginner = (): FinderAnswers => ({ water: 'freshwater', tank: 'medium', experience: 'beginner', light: 'medium' })

describe('findMatches', () => {
  it('empty items → empty results', () => {
    expect(findMatches([], beginner())).toHaveLength(0)
  })

  it('sorts by score descending', () => {
    const easy = item({ _id: 'easy', name: 'Easy', _type: 'species', tankSizeMinL: 10, difficulty: 'Beginner' })
    const hard = item({ _id: 'hard', name: 'Hard', _type: 'species', tankSizeMinL: 10, difficulty: 'Intermediate' })
    const r = findMatches([hard, easy], beginner())
    expect(r[0].item._id).toBe('easy')
    expect(r[1].item._id).toBe('hard')
  })

  it('coral excluded unless water == reef', () => {
    const coral = item({ _id: 'c1', name: 'Coral', _type: 'coral' })
    expect(findMatches([coral], beginner())).toHaveLength(0)
    expect(findMatches([coral], { ...beginner(), water: 'reef' }).length).toBeGreaterThan(0)
  })

  it('plant excluded for reef water', () => {
    const plant = item({ _id: 'p1', name: 'Plant', _type: 'plant' })
    expect(findMatches([plant], { ...beginner(), water: 'reef' })).toHaveLength(0)
  })

  it('freshwater species with saltwater origin excluded', () => {
    const salt = item({ _id: 's1', name: 'Clownfish', _type: 'species', origin: 'Indo-Pacific reefs' })
    expect(findMatches([salt], beginner())).toHaveLength(0)
    expect(findMatches([salt], { ...beginner(), water: 'reef' }).length).toBeGreaterThan(0)
  })

  it('reef water excludes species without salt origin', () => {
    const fresh = item({ _id: 'f1', name: 'Guppy', _type: 'species', origin: 'South America' })
    expect(findMatches([fresh], { ...beginner(), water: 'reef' })).toHaveLength(0)
  })

  it('species too large for tank excluded', () => {
    const huge = item({ _id: 'h1', name: 'Arowana', _type: 'species', tankSizeMinL: 500 })
    expect(findMatches([huge], { ...beginner(), tank: 'small' })).toHaveLength(0)
    expect(findMatches([huge], { ...beginner(), tank: 'large' }).length).toBeGreaterThan(0)
  })

  it('species 2+ difficulty levels above user excluded', () => {
    const expert = item({ _id: 'e1', name: 'Expert fish', _type: 'species', difficulty: 'Expert' })
    expect(findMatches([expert], beginner())).toHaveLength(0)
    expect(findMatches([expert], { ...beginner(), experience: 'advanced' }).length).toBeGreaterThan(0)
  })

  it('plant light match adds reason and score', () => {
    const plant = item({ _id: 'p1', name: 'Anubias', _type: 'plant', light: 'Low', difficulty: 'Beginner' })
    const r = findMatches([plant], { ...beginner(), water: 'planted', light: 'low' })
    expect(r[0].reasons.some((x) => x.toLowerCase().includes('does well under low light'))).toBe(true)
    const r2 = findMatches([plant], { ...beginner(), water: 'planted', light: 'high' })
    expect(r2[0].reasons.some((x) => x.toLowerCase().includes('does well under'))).toBe(false)
  })

  it('handles items with missing optional fields without crashing', () => {
    const bare = { _id: 'x1', _type: 'species', name: 'Bare', slug: { current: 'x1' } } as FinderItem
    const r = findMatches([bare], beginner())
    expect(r.length).toBeGreaterThan(0)
  })
})
