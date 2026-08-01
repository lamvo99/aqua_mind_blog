import { describe, it, expect } from 'vitest'
import { validateDimension, validatePercent } from '@/lib/calculators/types'

describe('validateDimension', () => {
  it.each([
    [null, 'is required'],
    [NaN, 'is required'],
    [Infinity, 'must be a valid number'],
    [-Infinity, 'must be a valid number'],
    [0, 'must be greater than zero'],
    [-5, 'must be greater than zero'],
  ])('rejects invalid value %s', (value, msgPart) => {
    expect(validateDimension(value as any, 'Tank')).toContain(msgPart)
  })

  it('enforces min/max bounds', () => {
    expect(validateDimension(0.5, 'X', { min: 1, max: 500 })).toBe('X must be at least 1')
    expect(validateDimension(501, 'X', { min: 1, max: 500 })).toBe('X must be at most 500')
    expect(validateDimension(250, 'X', { min: 1, max: 500 })).toBeNull()
  })

  it('accepts valid values', () => {
    expect(validateDimension(10, 'X')).toBeNull()
    expect(validateDimension(1, 'X', { allowZero: true })).toBeNull()
  })

  it('rejects non-numeric values as required (type guard)', () => {
    expect(validateDimension(undefined as any, 'X')).toContain('required')
  })
})

describe('validatePercent', () => {
  it.each([
    [null, 'required'],
    [NaN, 'required'],
    [-1, 'cannot be negative'],
    [101, 'must be between 0 and 100'],
  ])('rejects %s', (value, msgPart) => {
    expect(validatePercent(value as any, 'P')).toContain(msgPart)
  })

  it('accepts boundary values 0 and 100', () => {
    expect(validatePercent(0, 'P')).toBeNull()
    expect(validatePercent(100, 'P')).toBeNull()
  })
})
