import { describe, it, expect } from 'vitest'
import { cmToIn, inToCm, litersToGallons, gallonsToLiters, toCm, toUnit, round } from '@/lib/calculators/units'

describe('units', () => {
  it('converts cm to inches', () => {
    expect(cmToIn(2.54)).toBeCloseTo(1, 10)
    expect(cmToIn(0)).toBe(0)
  })

  it('converts inches to cm (round trip)', () => {
    expect(inToCm(1)).toBeCloseTo(2.54, 10)
    expect(inToCm(cmToIn(50))).toBeCloseTo(50, 10)
  })

  it('converts liters to gallons and back', () => {
    expect(litersToGallons(3.78541)).toBeCloseTo(1, 10)
    expect(gallonsToLiters(1)).toBeCloseTo(3.78541, 10)
    expect(litersToGallons(0)).toBe(0)
  })

  it('toCm respects unit (cm passthrough, in converts)', () => {
    expect(toCm(10, 'cm')).toBe(10)
    expect(toCm(1, 'in')).toBeCloseTo(2.54, 10)
  })

  it('toUnit respects unit', () => {
    expect(toUnit(10, 'cm')).toBe(10)
    expect(toUnit(2.54, 'in')).toBeCloseTo(1, 10)
  })

  it('rounds to N decimals', () => {
    expect(round(1.23456, 2)).toBe(1.23)
    expect(round(1.235, 2)).toBe(1.24)
    expect(round(12.345)).toBe(12.3)
    expect(round(0, 0)).toBe(0)
    expect(round(-1.5)).toBe(-1.5)
  })
})
