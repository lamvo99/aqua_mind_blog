import { describe, it, expect } from 'vitest'
import {
  calculateAquarium,
  validateAquariumInput,
  isValidAquariumInput,
  type AquariumInput,
} from '@/lib/calculators/aquarium'

const base: AquariumInput = {
  lengthCm: 100,
  widthCm: 40,
  heightCm: 50,
  substrateDepthCm: 5,
  bagSizeLiters: 10,
  lightingMode: 'medium',
  usableVolumeRatio: 0.9,
}

describe('calculateAquarium', () => {
  it('computes gross liters from dimensions (cm³ / 1000)', () => {
    const r = calculateAquarium(base)
    expect(r.grossLiters).toBeCloseTo(200)
  })

  it('computes substrate liters from footprint × depth', () => {
    const r = calculateAquarium(base)
    expect(r.substrateLiters).toBeCloseTo(20) // 100 × 40 × 5 cm³
  })

  it('computes usable liters as gross × usable ratio', () => {
    const r = calculateAquarium(base)
    expect(r.usableLiters).toBeCloseTo(180)
  })

  it('computes bag count as ceil(substrate / bagSize)', () => {
    const r = calculateAquarium(base)
    expect(r.bags).toBe(2) // 20 / 10
    const r2 = calculateAquarium({ ...base, substrateDepthCm: 4 })
    expect(r2.bags).toBe(2) // 16 / 10 → ceil
  })

  it('rounds lighting wattage up to the nearest 5W based on usable volume', () => {
    const r = calculateAquarium({ ...base, lightingMode: 'medium' }) // 180 × 0.5 = 90
    expect(r.lightingWatts).toBe(90)
    const r2 = calculateAquarium({ ...base, lightingMode: 'high' }) // 180 × 0.8 = 144
    expect(r2.lightingWatts).toBe(145)
  })

  it('returns 0 bags when substrate or bag size is missing', () => {
    const r = calculateAquarium({ ...base, substrateDepthCm: null })
    expect(r.bags).toBe(0)
    const r2 = calculateAquarium({ ...base, bagSizeLiters: null })
    expect(r2.bags).toBe(0)
  })

  it('treats null dimensions as zero for gross volume', () => {
    const r = calculateAquarium({ ...base, lengthCm: null })
    expect(r.grossLiters).toBe(0)
  })
})

describe('validateAquariumInput', () => {
  it('accepts a valid input', () => {
    expect(validateAquariumInput(base)).toEqual({})
    expect(isValidAquariumInput(base)).toBe(true)
  })

  it('rejects zero or negative dimensions with per-field keys', () => {
    const errors = validateAquariumInput({ ...base, lengthCm: 0, widthCm: -10 })
    expect(errors.lengthCol).toMatch(/greater than zero/)
    expect(errors.widthCol).toMatch(/greater than zero/)
  })

  it('rejects oversized dimensions (max 500) and substrate depth (max 50)', () => {
    const errors = validateAquariumInput({ ...base, heightCm: 501, substrateDepthCm: 51 })
    expect(errors.heightCol).toMatch(/too large/)
    expect(errors.substrateDepthCol).toMatch(/too large/)
  })

  it('rejects non-positive bag size', () => {
    const errors = validateAquariumInput({ ...base, bagSizeLiters: 0 })
    expect(errors.bagSizeCol).toMatch(/greater than zero/)
    expect(isValidAquariumInput({ ...base, bagSizeLiters: 0 })).toBe(false)
  })

  it('ignores null values instead of flagging them (fields not yet filled)', () => {
    expect(validateAquariumInput({ ...base, lengthCm: null, substrateDepthCm: null })).toEqual({})
  })
})