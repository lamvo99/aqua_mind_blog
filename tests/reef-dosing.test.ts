import { describe, it, expect } from 'vitest'
import {
  calculateCorrection,
  calculateCustomCorrection,
  calculateCustomLabelDose,
  calculateSystemDose,
  CONSERVATIVE_MAX_DAILY_CHANGE,
  getReefProduct,
  isValidReefDosingInput,
  REEF_PRODUCTS,
  REEF_RECOMMENDED_RANGES,
  TRACE_GUIDANCE,
  validateReefDosingInput,
  type ReefProduct,
} from '@/lib/calculators/reefDosing'

function correctionProduct(id: string): ReefProduct {
  const product = getReefProduct(id)
  if (!product) throw new Error(`missing product ${id}`)
  return product
}

describe('reef product data', () => {
  it('has unique ids and non-empty brand/name for every product', () => {
    const ids = REEF_PRODUCTS.map((product) => product.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const product of REEF_PRODUCTS) {
      expect(product.brand.trim()).not.toBe('')
      expect(product.name.trim()).not.toBe('')
    }
  })

  it('links every manufacturer product to an https source verified on a real date', () => {
    for (const product of REEF_PRODUCTS) {
      if (product.kind === 'custom') {
        expect(product.sourceUrl).toBe('')
        continue
      }
      expect(product.sourceUrl, product.id).toMatch(/^https:\/\//)
      expect(product.sourceLabel.trim(), product.id).not.toBe('')
      expect(product.verifiedAt, product.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('defines a complete correction rate and matching unit for correction products', () => {
    for (const product of REEF_PRODUCTS.filter((item) => item.kind === 'correction')) {
      expect(product.parameter, product.id).toBeTruthy()
      expect(product.dose, product.id).toBeTruthy()
      expect(product.doseUnit, product.id).toMatch(/^(ml|g)$/)

      const parameter = product.parameter!
      const unit = REEF_RECOMMENDED_RANGES[parameter].unit
      expect(product.dose!.raisesUnit, product.id).toBe(unit)
      expect(product.dose!.amount, product.id).toBeGreaterThan(0)
      expect(product.dose!.perVolumeL, product.id).toBeGreaterThan(0)
      expect(product.dose!.raises, product.id).toBeGreaterThan(0)

      if (product.maxDailyDose) {
        expect(product.maxDailyDose.amount, product.id).toBeGreaterThan(0)
        expect(product.maxDailyDose.perVolumeL, product.id).toBeGreaterThan(0)
      }
    }
  })

  it('defines a starting dose for all-in-one and balanced products', () => {
    for (const product of REEF_PRODUCTS.filter((item) => item.kind === 'all-in-one' || item.kind === 'balanced')) {
      expect(product.startingDose, product.id).toBeTruthy()
      expect(product.startingDose!.amount, product.id).toBeGreaterThan(0)
      expect(product.startingDose!.perVolumeL, product.id).toBeGreaterThan(0)

      if (product.maxStartingDose) {
        const startRate = product.startingDose!.amount / product.startingDose!.perVolumeL
        const maxRate = product.maxStartingDose.amount / product.maxStartingDose.perVolumeL
        expect(maxRate, product.id).toBeGreaterThan(startRate)
      }
    }
  })

  it('covers the brands the calculator advertises', () => {
    const ids = REEF_PRODUCTS.map((product) => product.id)
    for (const id of [
      'tm-all-for-reef',
      'tm-all-for-reef-powder',
      'tm-balling-a',
      'tm-balling-b',
      'aquaforest-component-123',
      'red-sea-calcium-liquid',
      'red-sea-kh-liquid',
      'red-sea-magnesium-liquid',
      'seachem-reef-advantage-calcium',
      'seachem-reef-advantage-magnesium',
      'seachem-reef-builder',
      'seachem-reef-carbonate',
      'custom',
    ]) {
      expect(ids, id).toContain(id)
    }
  })

  it('keeps conservative daily-change caps below the range width', () => {
    expect(CONSERVATIVE_MAX_DAILY_CHANGE.calcium).toBe(20)
    expect(CONSERVATIVE_MAX_DAILY_CHANGE.alkalinity).toBe(1.4)
    expect(CONSERVATIVE_MAX_DAILY_CHANGE.magnesium).toBe(50)
  })

  it('marks trace products as measurement-guided only', () => {
    expect(TRACE_GUIDANCE.length).toBeGreaterThan(0)
    for (const item of TRACE_GUIDANCE) {
      expect(item.note.toLowerCase()).toMatch(/measured|test/)
      expect(item.sourceUrl).toMatch(/^https:\/\//)
    }
  })

  it('returns undefined for an unknown product id', () => {
    expect(getReefProduct('does-not-exist')).toBeUndefined()
  })
})

describe('all-in-one and balanced system doses', () => {
  it('uses the official All-For-Reef starting dose for 200 L', () => {
    const result = calculateSystemDose('tm-all-for-reef', 200)
    expect(result.dailyAmount).toBe(10)
    expect(result.weeklyAmount).toBe(70)
    expect(result.rampPerWeekAmount).toBe(5)
    expect(result.maxDailyAmount).toBe(50)
    expect(result.totalDailyAcrossComponents).toBeNull()
    expect(result.warnings.some((warning) => /starting\/reference dose/i.test(warning))).toBe(true)
    expect(result.warnings.some((warning) => /measure/i.test(warning))).toBe(true)
  })

  it('explains how to mix the All-For-Reef powder', () => {
    const result = calculateSystemDose('tm-all-for-reef-powder', 100)
    expect(result.dailyAmount).toBe(5)
    expect(result.weeklyAmount).toBe(35)
    expect(result.warnings.some((warning) => /160 g powder/i.test(warning))).toBe(true)
  })

  it('doses each Aquaforest component equally and reports the combined total', () => {
    const result = calculateSystemDose('aquaforest-component-123', 200)
    expect(result.dailyAmount).toBe(50)
    expect(result.totalDailyAcrossComponents).toBe(150)
    expect(result.maxDailyAmount).toBeNull()
    expect(result.warnings.some((warning) => /all components equally/i.test(warning))).toBe(true)
  })

  it('rejects a correction product in system mode', () => {
    expect(() => calculateSystemDose('red-sea-calcium-liquid', 200)).toThrow(/all-in-one or balanced/i)
  })

  it('rejects an unknown product in system mode', () => {
    expect(() => calculateSystemDose('nope', 200)).toThrow()
  })
})

describe('correction doses from measured values', () => {
  it('calculates a one-day Red Sea calcium correction', () => {
    const result = calculateCorrection({
      productId: 'red-sea-calcium-liquid',
      volumeL: 200,
      current: 380,
      target: 400,
    })
    expect(result.parameter).toBe('calcium')
    expect(result.unit).toBe('ppm')
    expect(result.totalChange).toBe(20)
    expect(result.totalAmount).toBe(20)
    expect(result.dailyAmount).toBe(20)
    expect(result.days).toBe(1)
    expect(result.dailyChange).toBe(20)
    expect(result.maxDailyAmount).toBeNull()
    expect(result.measuredDailyChange).toBeNull()
    expect(result.maintenanceDailyAmount).toBeNull()
    expect(result.warnings.some((warning) => /calcium and alkalinity/i.test(warning))).toBe(true)
  })

  it('estimates maintenance consumption from days since last test', () => {
    const result = calculateCorrection({
      productId: 'red-sea-kh-liquid',
      volumeL: 100,
      current: 7,
      target: 8,
      daysSinceLastTest: 7,
    })
    expect(result.totalAmount).toBe(10)
    expect(result.days).toBe(1)
    expect(result.measuredDailyChange).toBe(0.14)
    expect(result.maintenanceDailyAmount).toBe(1.43)
    expect(result.warnings.some((warning) => /test period/i.test(warning))).toBe(true)
  })

  it('splits a large calcium correction over multiple days', () => {
    const result = calculateCorrection({
      productId: 'seachem-reef-advantage-calcium',
      volumeL: 200,
      current: 380,
      target: 420,
    })
    expect(result.totalChange).toBe(40)
    expect(result.totalAmount).toBe(22.22)
    expect(result.days).toBe(2)
    expect(result.dailyAmount).toBe(11.11)
    expect(result.dailyChange).toBe(20)
    expect(result.maxDailyAmount).toBe(13.33)
    expect(result.warnings.some((warning) => /split over 2 days/i.test(warning))).toBe(true)
    expect(result.warnings.some((warning) => /product label limits/i.test(warning))).toBe(true)
  })

  it('uses the stricter product label limit when it is lower than the safety cap', () => {
    const result = calculateCorrection({
      productId: 'seachem-reef-advantage-magnesium',
      volumeL: 100,
      current: 1200,
      target: 1300,
    })
    expect(result.totalAmount).toBe(125)
    expect(result.days).toBe(4)
    expect(result.dailyAmount).toBe(31.25)
    expect(result.dailyChange).toBe(25)
    expect(result.maxDailyChange).toBe(50)
    expect(result.dailyChange).toBeLessThan(result.maxDailyChange)
    expect(result.maxDailyAmount).toBe(31.25)
  })

  it('calculates a Tropic Marin Balling calcium dose', () => {
    const result = calculateCorrection({
      productId: 'tm-balling-a',
      volumeL: 100,
      current: 400,
      target: 410,
    })
    expect(result.totalAmount).toBe(50)
    expect(result.days).toBe(1)
    expect(result.maxDailyAmount).toBe(150)
    expect(result.warnings.some((warning) => /do not mix/i.test(warning))).toBe(true)
  })

  it('calculates Red Sea powder calcium from grams', () => {
    const result = calculateCorrection({
      productId: 'red-sea-calcium-powder',
      volumeL: 100,
      current: 400,
      target: 410,
    })
    expect(result.product.doseUnit).toBe('g')
    expect(result.totalAmount).toBe(2.78)
  })

  it('warns and returns zero when the target is below the current value', () => {
    const result = calculateCorrection({
      productId: 'red-sea-calcium-liquid',
      volumeL: 200,
      current: 420,
      target: 400,
    })
    expect(result.totalChange).toBe(0)
    expect(result.totalAmount).toBe(0)
    expect(result.dailyAmount).toBe(0)
    expect(result.warnings.some((warning) => /only raises/i.test(warning))).toBe(true)
  })

  it('warns when current or target is outside the common reef range', () => {
    const result = calculateCorrection({
      productId: 'red-sea-kh-liquid',
      volumeL: 100,
      current: 6,
      target: 13,
    })
    expect(result.warnings.some((warning) => /outside the common reef reference range/i.test(warning))).toBe(true)
  })

  it('rejects a system product in correction mode', () => {
    expect(() =>
      calculateCorrection({ productId: 'tm-all-for-reef', volumeL: 200, current: 380, target: 400 })
    ).toThrow(/correction product/i)
  })
})

describe('custom product labels', () => {
  it('calculates a custom calcium correction', () => {
    const result = calculateCustomCorrection({
      volumeL: 100,
      current: 400,
      target: 420,
      parameter: 'calcium',
      amount: 1,
      perVolumeL: 100,
      raises: 2,
      unit: 'ml',
    })
    expect(result.product.kind).toBe('custom')
    expect(result.product.doseUnit).toBe('ml')
    expect(result.unit).toBe('ppm')
    expect(result.totalAmount).toBe(10)
    expect(result.days).toBe(1)
    expect(result.warnings.some((warning) => /custom product/i.test(warning))).toBe(true)
  })

  it('supports custom products dosed in grams for alkalinity', () => {
    const result = calculateCustomCorrection({
      volumeL: 150,
      current: 7,
      target: 8.4,
      parameter: 'alkalinity',
      amount: 3,
      perVolumeL: 100,
      raises: 0.7,
      unit: 'g',
    })
    expect(result.unit).toBe('dKH')
    expect(result.product.doseUnit).toBe('g')
    expect(result.totalAmount).toBe(9)
    expect(result.days).toBe(1)
  })

  it('rejects an incomplete custom label', () => {
    expect(() =>
      calculateCustomCorrection({
        volumeL: 100,
        current: 400,
        target: 420,
        parameter: 'calcium',
        amount: 1,
        perVolumeL: 100,
        raises: 0,
        unit: 'ml',
      })
    ).toThrow(/needs a dose/i)
  })

  it('scales a label-only dose when the label gives no expected rise', () => {
    const result = calculateCustomLabelDose({
      volumeL: 200,
      amount: 5,
      perVolumeL: 100,
      unit: 'ml',
    })
    expect(result.totalAmount).toBe(10)
    expect(result.unit).toBe('ml')
    expect(result.labelAmount).toBe(5)
    expect(result.labelPerVolumeL).toBe(100)
    expect(result.warnings.some((warning) => /does not target a measured/i.test(warning))).toBe(true)
    expect(result.warnings.some((warning) => /daily, weekly or per application/i.test(warning))).toBe(true)
  })

  it('supports label-only doses in grams', () => {
    const result = calculateCustomLabelDose({
      volumeL: 150,
      amount: 3,
      perVolumeL: 100,
      unit: 'g',
      parameter: 'alkalinity',
    })
    expect(result.totalAmount).toBe(4.5)
    expect(result.unit).toBe('g')
  })

  it('rejects an incomplete label-only dose', () => {
    expect(() =>
      calculateCustomLabelDose({
        volumeL: 100,
        amount: null,
        perVolumeL: 100,
        unit: 'ml',
      })
    ).toThrow(/label-only mode needs/i)
    expect(() =>
      calculateCustomLabelDose({
        volumeL: null,
        amount: 5,
        perVolumeL: 100,
        unit: 'ml',
      })
    ).toThrow(/label-only mode needs/i)
  })
})

describe('reef dosing validation', () => {
  it('accepts a complete all-in-one input with no measured values', () => {
    const input = { productId: 'tm-all-for-reef', volumeL: 200 }
    expect(validateReefDosingInput(input)).toEqual({})
    expect(isValidReefDosingInput(input)).toBe(true)
  })

  it('accepts a complete correction input', () => {
    const input = {
      productId: 'red-sea-calcium-liquid',
      volumeL: 200,
      current: 380,
      target: 420,
    }
    expect(validateReefDosingInput(input)).toEqual({})
    expect(isValidReefDosingInput(input)).toBe(true)
  })

  it('requires water volume and measured values for correction products', () => {
    const errors = validateReefDosingInput({
      productId: 'red-sea-calcium-liquid',
      volumeL: null,
      current: null,
      target: null,
    })
    expect(errors.volumeL).toBeTruthy()
    expect(errors.current).toBeTruthy()
    expect(errors.target).toBeTruthy()
    expect(isValidReefDosingInput({ productId: 'red-sea-calcium-liquid', volumeL: null })).toBe(false)
  })

  it('rejects implausible measured values', () => {
    const low = validateReefDosingInput({
      productId: 'red-sea-calcium-liquid',
      volumeL: 200,
      current: 100,
      target: 400,
    })
    expect(low.current).toBeTruthy()

    const highTarget = validateReefDosingInput({
      productId: 'red-sea-calcium-liquid',
      volumeL: 200,
      current: 400,
      target: 2000,
    })
    expect(highTarget.target).toBeTruthy()
  })

  it('validates the optional days-since-test field', () => {
    const base = {
      productId: 'red-sea-calcium-liquid',
      volumeL: 200,
      current: 380,
      target: 400,
    }
    expect(validateReefDosingInput({ ...base, daysSinceLastTest: 0 })).toEqual({})
    expect(validateReefDosingInput({ ...base, daysSinceLastTest: 1 })).toEqual({})
    expect(validateReefDosingInput({ ...base, daysSinceLastTest: 365 })).toEqual({})
    expect(validateReefDosingInput({ ...base, daysSinceLastTest: 366 }).daysSinceLastTest).toBeTruthy()
    expect(validateReefDosingInput({ ...base, daysSinceLastTest: -1 }).daysSinceLastTest).toBeTruthy()
  })

  it('enforces the water-volume bounds', () => {
    for (const volume of [0, -10, 20001]) {
      const errors = validateReefDosingInput({ productId: 'tm-all-for-reef', volumeL: volume })
      expect(errors.volumeL, String(volume)).toBeTruthy()
    }
  })

  it('requires every custom label field', () => {
    const errors = validateReefDosingInput({
      productId: 'custom',
      volumeL: 100,
      customParameter: 'calcium',
      customAmount: null,
      customPerVolumeL: null,
      customRaises: null,
      customUnit: 'ml',
      current: 400,
      target: 420,
    })
    expect(errors.customAmount).toBeTruthy()
    expect(errors.customPerVolumeL).toBeTruthy()
    expect(errors.customRaises).toBeTruthy()
    expect(errors.customParameter).toBeUndefined()
    expect(errors.customUnit).toBeUndefined()
  })

  it('accepts a complete custom label', () => {
    const input = {
      productId: 'custom',
      volumeL: 100,
      current: 400,
      target: 420,
      customParameter: 'calcium' as const,
      customAmount: 1,
      customPerVolumeL: 100,
      customRaises: 2,
      customUnit: 'ml' as const,
    }
    expect(validateReefDosingInput(input)).toEqual({})
    expect(isValidReefDosingInput(input)).toBe(true)
  })

  it('accepts a label-only custom product without measured values or expected rise', () => {
    const input = {
      productId: 'custom',
      volumeL: 200,
      customMode: 'label' as const,
      customAmount: 5,
      customPerVolumeL: 100,
      customUnit: 'ml' as const,
    }
    expect(validateReefDosingInput(input)).toEqual({})
    expect(isValidReefDosingInput(input)).toBe(true)
  })

  it('still requires a dose and volume in label-only mode', () => {
    const errors = validateReefDosingInput({
      productId: 'custom',
      volumeL: 200,
      customMode: 'label',
      customAmount: null,
      customPerVolumeL: null,
      customUnit: 'ml',
    })
    expect(errors.customAmount).toBeTruthy()
    expect(errors.customPerVolumeL).toBeTruthy()
    expect(errors.current).toBeUndefined()
    expect(errors.target).toBeUndefined()
    expect(errors.customRaises).toBeUndefined()
  })

  it('still requires measured values and an expected rise in custom correction mode', () => {
    const errors = validateReefDosingInput({
      productId: 'custom',
      volumeL: 200,
      customMode: 'correction',
      customAmount: 5,
      customPerVolumeL: 100,
      customUnit: 'ml',
    })
    expect(errors.current).toBeTruthy()
    expect(errors.target).toBeTruthy()
    expect(errors.customRaises).toBeTruthy()
  })

  it('rejects an unknown product id', () => {
    const errors = validateReefDosingInput({ productId: 'unknown', volumeL: 100 })
    expect(errors.productId).toBeTruthy()
  })
})
