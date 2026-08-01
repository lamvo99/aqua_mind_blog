import { describe, it, expect } from 'vitest'
import { formatDate, formatDateShort, formatDateNumeric, formatRelativeTime, numberFormat, cn, estimateReadingTime } from '@/lib/utils'

describe('utils', () => {
  it('formatDate renders long date', () => {
    expect(formatDate('2026-01-15')).toBe('January 15, 2026')
  })

  it('formatDateShort renders short month', () => {
    expect(formatDateShort('2026-01-15')).toBe('Jan 15, 2026')
  })

  it('formatDateNumeric renders 2-digit day/month', () => {
    expect(formatDateNumeric('2026-01-05')).toBe('01/05/2026')
  })

  it('formatRelativeTime: recent → seconds, old (>30d) → short date', () => {
    const tenSecAgo = new Date(Date.now() - 10_000).toISOString()
    expect(formatRelativeTime(tenSecAgo)).toContain('second')
    expect(formatRelativeTime('2025-01-01')).toMatch(/Jan 1, 2025/)
  })

  it('formatRelativeTime invalid date does not crash', () => {
    expect(() => formatRelativeTime('not-a-date')).not.toThrow()
  })

  it('numberFormat groups digits', () => {
    expect(numberFormat(1234567)).toBe('1.234.567')
    expect(numberFormat(1234567, 'en-US')).toBe('1,234,567')
  })

  it('cn joins truthy classes only', () => {
    expect(cn('a', true && 'b', false && 'c', null, undefined, '', 'd')).toBe('a b d')
    expect(cn()).toBe('')
  })

  it('estimateReadingTime: 1 min minimum, ~200 wpm', () => {
    expect(estimateReadingTime(undefined)).toBe(1)
    expect(estimateReadingTime([])).toBe(1)
    const body = [{ _type: 'block', children: [{ text: 'word '.repeat(400) }] }]
    expect(estimateReadingTime(body)).toBe(2)
    expect(estimateReadingTime([{ _type: 'image', _sanityAsset: 'image-1' }])).toBe(1)
  })
})
