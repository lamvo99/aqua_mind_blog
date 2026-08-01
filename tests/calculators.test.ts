import { describe, it, expect } from 'vitest'
import { calculateVolume, validateVolumeInput, isValidVolumeInput } from '@/lib/calculators/volume'
import { calculateStocking, validateStockingInput, INCHES_PER_GALLON } from '@/lib/calculators/stocking'
import { calculateCo2, validateCo2Input } from '@/lib/calculators/co2'
import { calculateDose, validateDosingInput, ML_PER_TSP, ML_PER_TBSP } from '@/lib/calculators/dosing'
import { calculateLighting, validateLightingInput, TARGET_LUMENS_PER_L } from '@/lib/calculators/lighting'
import { calculatePumpFlow, validatePumpFlowInput } from '@/lib/calculators/pumpFlow'
import { calculateSalt, validateSaltMixInput } from '@/lib/calculators/saltMixing'
import { calculateWaterChange, validateWaterChangeInput } from '@/lib/calculators/waterChange'

describe('volume calculator', () => {
  it('rectangular tank: 60x30x40 cm = 72 L', () => {
    const r = calculateVolume({ shape: 'rectangular', length: 60, width: 30, height: 40, diameter: null, unit: 'cm', displacementPercent: 0 })
    expect(r.liters).toBe(72)
    expect(r.usGallons).toBeCloseTo(19.02, 1)
    expect(r.cubicCm).toBe(72000)
  })

  it('cube tank: 30 cm side = 27 L', () => {
    const r = calculateVolume({ shape: 'cube', length: 30, width: null, height: null, diameter: null, unit: 'cm', displacementPercent: null })
    expect(r.liters).toBe(27)
  })

  it('cylinder: d=40 h=50 → π*20^2*50 / 1000 = 62.8 L', () => {
    const r = calculateVolume({ shape: 'cylinder', length: null, width: null, height: 50, diameter: 40, unit: 'cm', displacementPercent: null })
    expect(r.liters).toBeCloseTo(62.8, 1)
  })

  it('applies displacement (20% → 80% of gross)', () => {
    const r = calculateVolume({ shape: 'rectangular', length: 60, width: 30, height: 40, diameter: null, unit: 'cm', displacementPercent: 20 })
    expect(r.liters).toBe(57.6)
  })

  it('supports inches input', () => {
    const r = calculateVolume({ shape: 'rectangular', length: 23.62, width: 11.81, height: 15.75, diameter: null, unit: 'in', displacementPercent: 0 })
    expect(r.liters).toBeCloseTo(72, 0)
  })

  it('zero dimensions produce zero liters without crashing', () => {
    const r = calculateVolume({ shape: 'rectangular', length: null, width: null, height: null, diameter: null, unit: 'cm', displacementPercent: null })
    expect(r.liters).toBe(0)
  })

  it('validation: rejects missing/out-of-range dims, accepts valid', () => {
    expect(validateVolumeInput({ shape: 'rectangular', length: null, width: 30, height: 40, diameter: null, unit: 'cm', displacementPercent: null }).length).toBeDefined()
    expect(Object.keys(validateVolumeInput({ shape: 'rectangular', length: 60, width: 30, height: 40, diameter: null, unit: 'cm', displacementPercent: 110 }))).toContain('displacement')
    expect(isValidVolumeInput({ shape: 'rectangular', length: 60, width: 30, height: 40, diameter: null, unit: 'cm', displacementPercent: 0 })).toBe(true)
    expect(isValidVolumeInput({ shape: 'cube', length: 0, width: null, height: null, diameter: null, unit: 'cm', displacementPercent: null })).toBe(false)
  })
})

describe('stocking calculator', () => {
  it('standard rule: 100 L ≈ 26.4 gal → 26.4 in capacity', () => {
    const r = calculateStocking({ volumeL: 100, level: 'standard', fishCount: null, adultCm: null })
    expect(r.capacityInches).toBeCloseTo(26.4, 1)
    expect(r.capacityCm).toBeCloseTo(67.1, 1)
  })

  it('level multipliers map correctly', () => {
    expect(INCHES_PER_GALLON.light).toBe(0.5)
    expect(INCHES_PER_GALLON.heavy).toBe(1.5)
  })

  it('status: lightly-stocked below 60%, at-capacity ≥60%, overstocked >100%', () => {
    const base = { level: 'standard' as const, adultCm: 5 }
    expect(calculateStocking({ volumeL: 100, ...base, fishCount: 5 }).status).toBe('lightly-stocked')
    expect(calculateStocking({ volumeL: 100, ...base, fishCount: 10 }).status).toBe('at-capacity')
    expect(calculateStocking({ volumeL: 100, ...base, fishCount: 20 }).status).toBe('overstocked')
  })

  it('null fishCount/adultCm → no status, null totals', () => {
    const r = calculateStocking({ volumeL: 100, level: 'standard', fishCount: null, adultCm: null })
    expect(r.totalCm).toBeNull()
    expect(r.utilizationPercent).toBeNull()
    expect(r.status).toBeNull()
  })

  it('validation: volume required, count ≤ 500, size within bounds', () => {
    expect(validateStockingInput({ volumeL: null, level: 'standard', fishCount: 1, adultCm: 5 }).volumeL).toBeDefined()
    expect(validateStockingInput({ volumeL: 100, level: 'standard', fishCount: 501, adultCm: 5 }).fishCount).toBeDefined()
    expect(validateStockingInput({ volumeL: 100, level: 'standard', fishCount: 1, adultCm: 201 }).adultCm).toBeDefined()
    expect(Object.keys(validateStockingInput({ volumeL: 100, level: 'standard', fishCount: 10, adultCm: 5 }))).toHaveLength(0)
  })
})

describe('CO2 calculator', () => {
  it('kh=4, ph=7.0 → 3*4*10^0 = 12 ppm → Low', () => {
    const r = calculateCo2({ kh: 4, ph: 7 })
    expect(r.co2Ppm).toBe(12)
    expect(r.label).toContain('Low')
  })

  it('kh=3, ph=6.6 → 3*3*10^0.4 = 22.6 ppm → Optimal', () => {
    const r = calculateCo2({ kh: 3, ph: 6.6 })
    expect(r.co2Ppm).toBeCloseTo(22.6, 1)
    expect(r.label).toContain('Optimal')
  })

  it('kh=5, ph=6.5 → 3*5*10^0.5 = 47.4 ppm → Dangerously high', () => {
    const r = calculateCo2({ kh: 5, ph: 6.5 })
    expect(r.co2Ppm).toBeCloseTo(47.4, 1)
    expect(r.label).toContain('Dangerously high')
  })

  it('kh=10, ph=6.0 → 300 ppm → Dangerously high', () => {
    const r = calculateCo2({ kh: 10, ph: 6 })
    expect(r.co2Ppm).toBe(300)
    expect(r.label).toContain('Dangerously high')
  })

  it('validation: kh 1-30, ph 4-10', () => {
    expect(validateCo2Input({ kh: 0, ph: 7 }).kh).toBeDefined()
    expect(validateCo2Input({ kh: 31, ph: 7 }).kh).toBeDefined()
    expect(validateCo2Input({ kh: 4, ph: 3.5 }).ph).toBeDefined()
    expect(Object.keys(validateCo2Input({ kh: 4, ph: 7 }))).toHaveLength(0)
  })
})

describe('dosing calculator', () => {
  it('100 L × 1 ml/L = 100 ml, headroom 10% → 110 ml', () => {
    const r = calculateDose({ volumeL: 100, dosePerL: 1, headroomPercent: 10 })
    expect(r.totalMl).toBe(100)
    expect(r.totalMlWithHeadroom).toBe(110)
    expect(r.teaspoons).toBe(20)
    expect(r.tablespoons).toBeCloseTo(6.7, 1)
    expect(ML_PER_TSP).toBe(5)
    expect(ML_PER_TBSP).toBe(15)
  })

  it('zero headroom keeps total', () => {
    const r = calculateDose({ volumeL: 50, dosePerL: 2, headroomPercent: 0 })
    expect(r.totalMlWithHeadroom).toBe(100)
  })

  it('validation rejects missing/out-of-range inputs', () => {
    expect(validateDosingInput({ volumeL: null, dosePerL: 1, headroomPercent: 0 }).volumeL).toBeDefined()
    expect(validateDosingInput({ volumeL: 100, dosePerL: 0, headroomPercent: 0 }).dosePerL).toBeDefined()
    expect(validateDosingInput({ volumeL: 100, dosePerL: 1, headroomPercent: 101 }).headroomPercent).toBeDefined()
    expect(validateDosingInput({ volumeL: 100, dosePerL: 1, headroomPercent: -1 }).headroomPercent).toBeDefined()
  })
})

describe('lighting calculator', () => {
  it('targets: 100 L medium → 3500 lm, ceil to 5 W = 40 W', () => {
    const r = calculateLighting({ volumeL: 100, level: 'medium', ledWattage: null })
    expect(r.targetLumens).toBe(100 * TARGET_LUMENS_PER_L.medium)
    expect(r.targetLedWatts).toBe(40)
  })

  it('high light 100 L → 5000 lm → 55 W (ceil 55.5→56→60? uses /5 ceil then *5)', () => {
    const r = calculateLighting({ volumeL: 100, level: 'high', ledWattage: null })
    expect(r.targetLedWatts).toBe(60)
  })

  it('achieved level from wattage: 40 W on 100 L → 36 lm/L → medium', () => {
    const r = calculateLighting({ volumeL: 100, level: 'medium', ledWattage: 40 })
    expect(r.achievedLumens).toBe(3600)
    expect(r.achievedLevel).toBe('medium')
  })

  it('validation: volume required, wattage ≤ 500', () => {
    expect(validateLightingInput({ volumeL: null, level: 'low', ledWattage: null }).volumeL).toBeDefined()
    expect(validateLightingInput({ volumeL: 100, level: 'low', ledWattage: 501 }).ledWattage).toBeDefined()
  })
})

describe('pump flow calculator', () => {
  it('100 L × 4 turnover = 400 L/h; 20% head loss → 500 L/h', () => {
    const r = calculatePumpFlow({ volumeL: 100, turnoverPerHour: 4, headLossPercent: 20 })
    expect(r.requiredFlowLh).toBe(400)
    expect(r.adjustedFlowLh).toBe(500)
    expect(r.requiredFlowGph).toBeCloseTo(105.7, 1)
  })

  it('zero head loss: adjusted == required', () => {
    const r = calculatePumpFlow({ volumeL: 50, turnoverPerHour: 3, headLossPercent: 0 })
    expect(r.adjustedFlowLh).toBe(r.requiredFlowLh)
  })

  it('validation', () => {
    expect(validatePumpFlowInput({ volumeL: 0, turnoverPerHour: 4, headLossPercent: 0 }).volumeL).toBeDefined()
    expect(validatePumpFlowInput({ volumeL: 100, turnoverPerHour: 0, headLossPercent: 0 }).turnoverPerHour).toBeDefined()
    expect(validatePumpFlowInput({ volumeL: 100, turnoverPerHour: 4, headLossPercent: 150 }).headLossPercent).toBeDefined()
  })
})

describe('salt mixing calculator', () => {
  it('100 L at SG 1.023 → 35 g/L → 3500 g', () => {
    const r = calculateSalt({ volumeL: 100, sg: 1.023, headroomPercent: 0 })
    expect(r.saltPerLiter).toBe(35)
    expect(r.grams).toBe(3500)
    expect(r.kg).toBe(3.5)
  })

  it('headroom 10% → 3850 g', () => {
    const r = calculateSalt({ volumeL: 100, sg: 1.023, headroomPercent: 10 })
    expect(r.gramsWithHeadroom).toBe(3850)
  })

  it('validation: sg required and 1.018–1.030', () => {
    expect(validateSaltMixInput({ volumeL: 100, sg: null, headroomPercent: 0 }).sg).toBeDefined()
    expect(validateSaltMixInput({ volumeL: 100, sg: 1.017, headroomPercent: 0 }).sg).toBeDefined()
    expect(validateSaltMixInput({ volumeL: 100, sg: 1.031, headroomPercent: 0 }).sg).toBeDefined()
    expect(Object.keys(validateSaltMixInput({ volumeL: 100, sg: 1.023, headroomPercent: 0 }))).toHaveLength(0)
  })
})

describe('water change calculator', () => {
  it('100 L tank, 25% change → 25 L exchanged, 75 L remain', () => {
    const r = calculateWaterChange({ tankVolumeLiters: 100, changePercent: 25, currentParameter: null, sourceParameter: null })
    expect(r.changeVolumeLiters).toBe(25)
    expect(r.changeVolumeGallons).toBeCloseTo(6.6, 1)
    expect(r.remainingVolumeLiters).toBe(75)
    expect(r.resultingParameter).toBeNull()
  })

  it('parameter mixing: nitrate 50, source 0, 25% change → 37.5', () => {
    const r = calculateWaterChange({ tankVolumeLiters: 100, changePercent: 25, currentParameter: 50, sourceParameter: 0 })
    expect(r.resultingParameter).toBe(37.5)
    expect(r.deltaParameter).toBe(-12.5)
  })

  it('100% change: parameter equals source', () => {
    const r = calculateWaterChange({ tankVolumeLiters: 100, changePercent: 100, currentParameter: 50, sourceParameter: 10 })
    expect(r.resultingParameter).toBe(10)
  })

  it('validation', () => {
    expect(validateWaterChangeInput({ tankVolumeLiters: 0, changePercent: 25, currentParameter: null, sourceParameter: null }).tankVolumeLiters).toBeDefined()
    expect(validateWaterChangeInput({ tankVolumeLiters: 100, changePercent: 101, currentParameter: null, sourceParameter: null }).changePercent).toBeDefined()
    expect(validateWaterChangeInput({ tankVolumeLiters: 100, changePercent: 25, currentParameter: -1, sourceParameter: null }).currentParameter).toBeDefined()
    expect(validateWaterChangeInput({ tankVolumeLiters: 100, changePercent: 25, currentParameter: null, sourceParameter: -1 }).sourceParameter).toBeDefined()
  })
})
