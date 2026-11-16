import { describe, it, expect } from 'vitest'
import { isValidSlugValue, suggestSlug } from '@/lib/slug'

describe('slug validation', () => {
  it('accepts canonical slugs', () => {
    for (const slug of ['aquarium-phosphate', 'co2', 'a1-b2', 'neocaridina-davidi-cherry']) {
      expect(isValidSlugValue(slug)).toBe(true)
    }
  })

  it('rejects the known malformed published slug', () => {
    expect(isValidSlugValue('Slug neocaridina-shrimp-reproduction-cycle')).toBe(false)
  })

  it('rejects whitespace, uppercase, and unsafe characters', () => {
    for (const slug of [
      ' leading',
      'trailing ',
      'has space',
      'UPPERCASE',
      'double--hyphen',
      'trailing-hyphen-',
      '-leading-hyphen',
      'under_score',
      'dot.dot',
      'slash/slug',
      '',
      null,
      undefined,
    ]) {
      expect(isValidSlugValue(slug as any)).toBe(false)
    }
  })

  it('suggests a safe replacement without mutating anything', () => {
    expect(suggestSlug('Slug neocaridina-shrimp-reproduction-cycle')).toBe(
      'slug-neocaridina-shrimp-reproduction-cycle'
    )
    expect(suggestSlug("Beginner's First Tank")).toBe('beginners-first-tank')
    expect(suggestSlug('  CO2   Estimator  ')).toBe('co2-estimator')
    expect(suggestSlug('')).toBe('')
  })
})
