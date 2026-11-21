import { describe, it, expect } from 'vitest'
import { parseListingQuery, hasListingQuery } from '@/lib/listing-filters'

describe('listing filter query state', () => {
  it('parses search, filters and ranges from a URL', () => {
    const state = parseListingQuery(new URLSearchParams('q=tetra&difficulty=Beginner&tankSizeMinL_min=20&tankSizeMinL_max=100'))
    expect(state.search).toBe('tetra')
    expect(state.filters).toEqual({ difficulty: 'Beginner' })
    expect(state.ranges).toEqual({ tankSizeMinL: { min: '20', max: '100' } })
  })

  it('parses Next searchParams records and takes the first array value', () => {
    const state = parseListingQuery({ waterType: ['freshwater', 'saltwater'], q: 'shrimp' })
    expect(state.search).toBe('shrimp')
    expect(state.filters).toEqual({ waterType: 'freshwater' })
  })

  it('detects filtered and clean states', () => {
    expect(hasListingQuery({})).toBe(false)
    expect(hasListingQuery({ difficulty: 'Beginner' })).toBe(true)
    expect(hasListingQuery(new URLSearchParams('tankSizeMinL_min=20'))).toBe(true)
  })

  it('ignores campaign parameters so they neither filter nor deindex', () => {
    const state = parseListingQuery({ utm_source: 'newsletter', gclid: 'abc' })
    expect(state.filters).toEqual({})
    expect(state.ranges).toEqual({})
    expect(hasListingQuery({ utm_source: 'newsletter' })).toBe(false)
    expect(hasListingQuery({ utm_source: 'newsletter', difficulty: 'Beginner' })).toBe(true)
  })
})
