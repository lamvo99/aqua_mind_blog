import { describe, it, expect } from 'vitest'
import { POSTS_PER_PAGE, parsePageParam, parseRequestedPage } from '@/lib/pagination'

describe('pagination', () => {
  it('uses a single shared page size', () => {
    expect(POSTS_PER_PAGE).toBeGreaterThan(0)
  })

  it('treats a missing page as page 1', () => {
    expect(parsePageParam(undefined, 4)).toEqual({ page: 1, outOfRange: false })
  })

  it('accepts in-range pages', () => {
    expect(parsePageParam('1', 4)).toEqual({ page: 1, outOfRange: false })
    expect(parsePageParam('2', 4)).toEqual({ page: 2, outOfRange: false })
    expect(parsePageParam('4', 4)).toEqual({ page: 4, outOfRange: false })
  })

  it('flags an integer beyond the last page as out of range', () => {
    expect(parsePageParam('5', 4)).toEqual({ page: 1, outOfRange: true })
    expect(parsePageParam('99', 4)).toEqual({ page: 1, outOfRange: true })
  })

  it('normalizes invalid values to page 1 without flagging out-of-range', () => {
    for (const raw of ['0', '-1', '1.5', 'abc', '', ' 2', '2 ', 'NaN']) {
      expect(parsePageParam(raw, 4)).toEqual({ page: 1, outOfRange: false })
    }
  })

  it('handles repeated query parameters deterministically', () => {
    expect(parsePageParam(['2', '3'], 4)).toEqual({ page: 1, outOfRange: false })
  })

  it('treats a single-page listing correctly', () => {
    expect(parsePageParam('2', 1)).toEqual({ page: 1, outOfRange: true })
    expect(parsePageParam('1', 1)).toEqual({ page: 1, outOfRange: false })
  })

  it('rejects unsafe/huge numbers deterministically', () => {
    expect(parsePageParam('999999999999999999999', 4)).toEqual({ page: 1, outOfRange: false })
  })
})

describe('parseRequestedPage (shared by metadata and rendering)', () => {
  it('accepts positive integers', () => {
    expect(parseRequestedPage('1')).toBe(1)
    expect(parseRequestedPage('2')).toBe(2)
    expect(parseRequestedPage('42')).toBe(42)
  })

  it('returns null for anything that is not a single positive integer', () => {
    for (const raw of [undefined, ['2', '3'], '0', '-1', '1.5', 'abc', '', ' 2', '2 ', 'NaN', '1e3']) {
      expect(parseRequestedPage(raw as any)).toBeNull()
    }
  })

  it('returns null for unsafe integers', () => {
    expect(parseRequestedPage('999999999999999999999')).toBeNull()
  })

  it('stays consistent with parsePageParam', () => {
    for (const raw of ['1', '2', '4', '5', '0', 'abc', undefined] as any[]) {
      const requested = parseRequestedPage(raw)
      const parsed = parsePageParam(raw, 4)
      if (requested === null) expect(parsed).toEqual({ page: 1, outOfRange: false })
      else if (requested > 4) expect(parsed).toEqual({ page: 1, outOfRange: true })
      else expect(parsed).toEqual({ page: requested, outOfRange: false })
    }
  })
})
