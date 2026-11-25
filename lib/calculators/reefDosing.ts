import { round } from "./units"
import { validateDimension } from "./types"

export type ReefParameter = "calcium" | "alkalinity" | "magnesium"
export type ReefProductKind = "all-in-one" | "balanced" | "correction" | "custom"
export type DoseUnit = "ml" | "g"
export type ParameterUnit = "ppm" | "dKH"

export interface DoseDefinition {
  amount: number
  perVolumeL: number
  raises: number
  raisesUnit: ParameterUnit
}

export interface DoseLimit {
  amount: number
  perVolumeL: number
}

export interface ReefProduct {
  id: string
  brand: string
  name: string
  kind: ReefProductKind
  parameter?: ReefParameter
  doseUnit?: DoseUnit
  dose?: DoseDefinition
  startingDose?: DoseDefinition
  rampPerWeek?: { amount: number; perVolumeL: number }
  maxDailyDose?: DoseLimit
  maxStartingDose?: DoseLimit
  components?: number
  form?: "liquid" | "powder" | "system"
  mix?: { powderG: number; solutionMl: number }
  sourceUrl: string
  sourceLabel: string
  verifiedAt: string
  notes?: string
}

export const REEF_RECOMMENDED_RANGES: Record<ReefParameter, { min: number; max: number; unit: ParameterUnit; label: string }> = {
  calcium: { min: 380, max: 450, unit: "ppm", label: "Calcium" },
  alkalinity: { min: 7, max: 12, unit: "dKH", label: "Alkalinity" },
  magnesium: { min: 1200, max: 1400, unit: "ppm", label: "Magnesium" },
}

/**
 * Conservative daily-change caps used to split a correction into multiple days.
 * These are editorial safety heuristics, not manufacturer limits. Product label
 * limits are applied separately and may be stricter.
 */
export const CONSERVATIVE_MAX_DAILY_CHANGE: Record<ReefParameter, number> = {
  calcium: 20,
  alkalinity: 1.4,
  magnesium: 50,
}

const VERIFIED_AT = "2026-11-26"

export const REEF_PRODUCTS: ReefProduct[] = [
  {
    id: "tm-all-for-reef",
    brand: "Tropic Marin",
    name: "All-For-Reef (liquid)",
    kind: "all-in-one",
    form: "liquid",
    startingDose: { amount: 5, perVolumeL: 100, raises: 0, raisesUnit: "dKH" },
    rampPerWeek: { amount: 2.5, perVolumeL: 100 },
    maxStartingDose: { amount: 25, perVolumeL: 100 },
    sourceUrl: "https://www.tropic-marin.com/all-for-reef/?lang=en",
    sourceLabel: "Tropic Marin All-For-Reef product page",
    verifiedAt: VERIFIED_AT,
    notes:
      "Official start: 5 ml per 100 L daily; increase by 2.5 ml per 100 L per week; do not exceed 25 ml per 100 L per day. Use calcium as the dosing regulator and measure KH periodically.",
  },
  {
    id: "tm-all-for-reef-powder",
    brand: "Tropic Marin",
    name: "All-For-Reef (powder, mixed solution)",
    kind: "all-in-one",
    form: "powder",
    mix: { powderG: 160, solutionMl: 1000 },
    startingDose: { amount: 5, perVolumeL: 100, raises: 0, raisesUnit: "dKH" },
    rampPerWeek: { amount: 2.5, perVolumeL: 100 },
    maxStartingDose: { amount: 25, perVolumeL: 100 },
    sourceUrl: "https://www.tropic-marin.com/all-for-reef/?lang=en",
    sourceLabel: "Tropic Marin All-For-Reef product page",
    verifiedAt: VERIFIED_AT,
    notes:
      "Mix 160 g powder into about 900 ml RO/DI water to make 1 L of dosing solution. Dose the mixed solution like the liquid: 5 ml/100 L/day start, +2.5 ml/100 L/week, max 25 ml/100 L/day.",
  },
  {
    id: "aquaforest-component-123",
    brand: "Aquaforest",
    name: "Component 1+2+3+ (balanced system)",
    kind: "balanced",
    form: "system",
    components: 3,
    startingDose: { amount: 25, perVolumeL: 100, raises: 0, raisesUnit: "dKH" },
    sourceUrl:
      "https://aquaforest.eu/en/blog/components-123-by-aquaforest-how-to-figure-out-dosage-for-your-reef-tank/",
    sourceLabel: "Aquaforest Components 1+2+3+ dosage guide",
    verifiedAt: VERIFIED_AT,
    notes:
      "Official reference: ~25 ml per 100 L daily of each component for a moderately stocked SPS reef. Dose all three equally; divide into small portions. Lower-demand tanks should start lower and measure Ca/KH/Mg; this is a reference, not a correction formula.",
  },
  {
    id: "red-sea-calcium-liquid",
    brand: "Red Sea",
    name: "Calcium+ (liquid)",
    kind: "correction",
    parameter: "calcium",
    doseUnit: "ml",
    dose: { amount: 1, perVolumeL: 100, raises: 2, raisesUnit: "ppm" },
    sourceUrl: "https://redseafish.com/reef-care-program/foundation-elements/calcium-supplement/",
    sourceLabel: "Red Sea Calcium+ product page",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "red-sea-calcium-powder",
    brand: "Red Sea",
    name: "Calcium+ (powder)",
    kind: "correction",
    parameter: "calcium",
    doseUnit: "g",
    dose: { amount: 1, perVolumeL: 100, raises: 3.6, raisesUnit: "ppm" },
    sourceUrl: "https://redseafish.com/reef-care-program/foundation-elements/calcium-supplement/",
    sourceLabel: "Red Sea Calcium+ product page",
    verifiedAt: VERIFIED_AT,
    notes: "1 kg powder makes 1.8 L of stock solution.",
  },
  {
    id: "red-sea-kh-liquid",
    brand: "Red Sea",
    name: "KH/Alkalinity (liquid)",
    kind: "correction",
    parameter: "alkalinity",
    doseUnit: "ml",
    dose: { amount: 1, perVolumeL: 100, raises: 0.1, raisesUnit: "dKH" },
    sourceUrl: "https://redseafish.com/reef-care-program/foundation-elements/kh-alkalinity-supplement/",
    sourceLabel: "Red Sea KH/Alkalinity product page",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "red-sea-kh-powder",
    brand: "Red Sea",
    name: "KH/Alkalinity (powder)",
    kind: "correction",
    parameter: "alkalinity",
    doseUnit: "g",
    dose: { amount: 1, perVolumeL: 100, raises: 0.33, raisesUnit: "dKH" },
    sourceUrl: "https://redseafish.com/reef-care-program/foundation-elements/kh-alkalinity-supplement/",
    sourceLabel: "Red Sea KH/Alkalinity product page",
    verifiedAt: VERIFIED_AT,
    notes: "1 kg powder makes 10 L of stock solution.",
  },
  {
    id: "red-sea-magnesium-liquid",
    brand: "Red Sea",
    name: "Magnesium (liquid)",
    kind: "correction",
    parameter: "magnesium",
    doseUnit: "ml",
    dose: { amount: 1, perVolumeL: 100, raises: 1, raisesUnit: "ppm" },
    sourceUrl: "https://redseafish.com/reef-care-program/foundation-elements/magnesium-supplement/",
    sourceLabel: "Red Sea Magnesium product page",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "red-sea-magnesium-powder",
    brand: "Red Sea",
    name: "Magnesium (powder)",
    kind: "correction",
    parameter: "magnesium",
    doseUnit: "g",
    dose: { amount: 1, perVolumeL: 100, raises: 1.34, raisesUnit: "ppm" },
    sourceUrl: "https://redseafish.com/reef-care-program/foundation-elements/magnesium-supplement/",
    sourceLabel: "Red Sea Magnesium product page",
    verifiedAt: VERIFIED_AT,
    notes: "1 kg powder makes 1.7 L of stock solution.",
  },
  {
    id: "tm-balling-a",
    brand: "Tropic Marin",
    name: "Original Balling Part A (Calcium)",
    kind: "correction",
    parameter: "calcium",
    doseUnit: "ml",
    dose: { amount: 50, perVolumeL: 100, raises: 10, raisesUnit: "ppm" },
    maxDailyDose: { amount: 150, perVolumeL: 100 },
    sourceUrl: "https://www.tropic-marin.com/original-balling-components/?lang=en",
    sourceLabel: "Tropic Marin Original Balling Components",
    verifiedAt: VERIFIED_AT,
    notes: "Balling A/B/C are separate solutions; do not mix them. Part A raises calcium.",
  },
  {
    id: "tm-balling-b",
    brand: "Tropic Marin",
    name: "Original Balling Part B (Alkalinity)",
    kind: "correction",
    parameter: "alkalinity",
    doseUnit: "ml",
    dose: { amount: 50, perVolumeL: 100, raises: 1.4, raisesUnit: "dKH" },
    maxDailyDose: { amount: 150, perVolumeL: 100 },
    sourceUrl: "https://www.tropic-marin.com/original-balling-components/?lang=en",
    sourceLabel: "Tropic Marin Original Balling Components",
    verifiedAt: VERIFIED_AT,
    notes: "Balling Part B raises alkalinity. Do not mix with Part A directly.",
  },
  {
    id: "seachem-reef-advantage-calcium",
    brand: "Seachem",
    name: "Reef Advantage Calcium",
    kind: "correction",
    parameter: "calcium",
    doseUnit: "g",
    dose: { amount: 5, perVolumeL: 150, raises: 12, raisesUnit: "ppm" },
    maxDailyDose: { amount: 10, perVolumeL: 150 },
    sourceUrl: "https://www.seachem.com/reef-adv-calcium.php",
    sourceLabel: "Seachem Reef Advantage Calcium directions",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "seachem-reef-advantage-magnesium",
    brand: "Seachem",
    name: "Reef Advantage Magnesium",
    kind: "correction",
    parameter: "magnesium",
    doseUnit: "g",
    dose: { amount: 5, perVolumeL: 80, raises: 5, raisesUnit: "ppm" },
    maxDailyDose: { amount: 25, perVolumeL: 80 },
    sourceUrl: "https://www.seachem.com/reef-adv-magnesium.php",
    sourceLabel: "Seachem Reef Advantage Magnesium directions",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "seachem-reef-builder",
    brand: "Seachem",
    name: "Reef Builder",
    kind: "correction",
    parameter: "alkalinity",
    doseUnit: "g",
    dose: { amount: 3, perVolumeL: 150, raises: 0.7, raisesUnit: "dKH" },
    maxDailyDose: { amount: 12, perVolumeL: 150 },
    sourceUrl: "https://www.seachem.com/reef-builder.php",
    sourceLabel: "Seachem Reef Builder directions",
    verifiedAt: VERIFIED_AT,
    notes: "Seachem states 3 g/150 L raises alkalinity by 0.25 meq/L (≈0.7 dKH).",
  },
  {
    id: "seachem-reef-carbonate",
    brand: "Seachem",
    name: "Reef Carbonate",
    kind: "correction",
    parameter: "alkalinity",
    doseUnit: "ml",
    dose: { amount: 5, perVolumeL: 80, raises: 0.7, raisesUnit: "dKH" },
    maxDailyDose: { amount: 20, perVolumeL: 80 },
    sourceUrl: "https://www.seachem.com/reef-carbonate.php",
    sourceLabel: "Seachem Reef Carbonate directions",
    verifiedAt: VERIFIED_AT,
    notes: "Seachem states 5 ml/80 L raises alkalinity by 0.25 meq/L (≈0.7 dKH).",
  },
  {
    id: "custom",
    brand: "Custom / generic",
    name: "Custom product (enter label values)",
    kind: "custom",
    sourceUrl: "",
    sourceLabel: "Your product label",
    verifiedAt: "",
    notes:
      "Use for generic or Chinese products when no verified manufacturer data is available. Correction mode needs the label dose and the expected parameter rise. Label-only mode just multiplies the label dose by your water volume when the label gives no expected rise.",
  },
]

export const TRACE_GUIDANCE = [
  {
    brand: "Red Sea",
    name: "Trace Colors A/B/C/D",
    note: "Red Sea states these should only be dosed according to a measured requirement. There is no universal ml/100 L correction formula; test first.",
    sourceUrl: "https://redseafish.com/reef-care-program/trace-elements/trace-colors-pack/",
    sourceLabel: "Red Sea Trace Colors product page",
  },
  {
    brand: "Tropic Marin",
    name: "All-For-Reef trace content",
    note: "All-For-Reef already includes essential trace elements. Do not stack additional trace supplements without a measured need.",
    sourceUrl: "https://www.tropic-marin.com/all-for-reef/?lang=en",
    sourceLabel: "Tropic Marin All-For-Reef product page",
  },
]

export interface CorrectionInput {
  productId: string
  volumeL: number | null
  current: number | null
  target: number | null
  daysSinceLastTest?: number | null
}

export type CustomDoseMode = "correction" | "label"

export interface CustomCorrectionInput {
  volumeL: number | null
  current: number | null
  target: number | null
  parameter: ReefParameter
  amount: number | null
  perVolumeL: number | null
  raises: number | null
  unit: DoseUnit
  daysSinceLastTest?: number | null
}

export interface CustomLabelDoseInput {
  volumeL: number | null
  amount: number | null
  perVolumeL: number | null
  unit: DoseUnit
  parameter?: ReefParameter | null
}

export interface CorrectionResult {
  product: ReefProduct
  parameter: ReefParameter
  unit: ParameterUnit
  totalAmount: number
  dailyAmount: number
  days: number
  totalChange: number
  dailyChange: number
  maxDailyAmount: number | null
  maxDailyChange: number
  measuredDailyChange: number | null
  maintenanceDailyAmount: number | null
  warnings: string[]
}

export interface SystemDoseResult {
  product: ReefProduct
  dailyAmount: number
  weeklyAmount: number
  totalDailyAcrossComponents: number | null
  maxDailyAmount: number | null
  rampPerWeekAmount: number | null
  warnings: string[]
}

export interface LabelDoseResult {
  product: ReefProduct
  totalAmount: number
  unit: DoseUnit
  labelAmount: number
  labelPerVolumeL: number
  warnings: string[]
}

export function getReefProduct(productId: string): ReefProduct | undefined {
  return REEF_PRODUCTS.find((product) => product.id === productId)
}

function amountForDelta(product: ReefProduct, volumeL: number, delta: number): number {
  if (!product.dose) return 0
  return (delta / product.dose.raises) * (product.dose.amount / product.dose.perVolumeL) * volumeL
}

function addCommonWarnings(
  product: ReefProduct,
  parameter: ReefParameter,
  unit: ParameterUnit,
  current: number,
  target: number,
  warnings: string[]
): void {
  const range = REEF_RECOMMENDED_RANGES[parameter]
  if (current < range.min || current > range.max) {
    warnings.push(
      `Current ${range.label.toLowerCase()} (${current} ${unit}) is outside the common reef reference range ${range.min}–${range.max} ${unit}. Verify the test before dosing.`
    )
  }
  if (target < range.min || target > range.max) {
    warnings.push(
      `Target ${range.label.toLowerCase()} (${target} ${unit}) is outside the common reef reference range ${range.min}–${range.max} ${unit}. Confirm this is intentional.`
    )
  }
  if (parameter === "calcium" || parameter === "alkalinity") {
    warnings.push(
      "Do not mix calcium and alkalinity supplements directly; add them at least 30 minutes apart, ideally at different times of day."
    )
  }
  if (product.kind === "custom") {
    warnings.push("Custom product: verify the label concentration and unit. This is not a manufacturer-verified dose.")
  }
}

function correctionForProduct(
  product: ReefProduct,
  input: { volumeL: number | null; current: number | null; target: number | null; daysSinceLastTest?: number | null }
): CorrectionResult {
  const volume = input.volumeL ?? 0
  const current = input.current ?? 0
  const target = input.target ?? 0
  const parameter = product.parameter ?? "calcium"
  const unit = product.dose?.raisesUnit ?? REEF_RECOMMENDED_RANGES[parameter].unit
  const totalChange = Math.max(0, target - current)
  const totalAmount = product.dose ? amountForDelta(product, volume, totalChange) : 0
  const maxDailyChange = CONSERVATIVE_MAX_DAILY_CHANGE[parameter]
  const maxDailyAmount = product.maxDailyDose
    ? (product.maxDailyDose.amount / product.maxDailyDose.perVolumeL) * volume
    : null
  // Subtract a tiny epsilon so exact ratios (e.g. 1.4 / 1.4) are not rounded
  // up to an extra day by floating-point noise.
  const daysByChange = totalChange > 0 ? Math.max(1, Math.ceil(totalChange / maxDailyChange - 1e-9)) : 1
  const daysByDose = maxDailyAmount && totalAmount > 0 ? Math.ceil(totalAmount / maxDailyAmount - 1e-9) : 1
  const days = Math.max(1, daysByChange, daysByDose)
  const dailyAmount = totalAmount / days
  const dailyChange = totalChange / days
  const daysSince = input.daysSinceLastTest && input.daysSinceLastTest > 0 ? input.daysSinceLastTest : null
  const measuredDailyChange = daysSince ? totalChange / daysSince : null
  const maintenanceDailyAmount =
    measuredDailyChange && product.dose ? amountForDelta(product, volume, measuredDailyChange) : null
  const warnings: string[] = []

  if (target <= current) {
    warnings.push("This calculator only raises a parameter. For lowering, use water changes or a product-specific method; do not dose a raising product.")
  }
  addCommonWarnings(product, parameter, unit, current, target, warnings)
  if (days > 1) {
    warnings.push(
      `Total correction is split over ${days} days (≈${round(dailyAmount, 2)} ${product.doseUnit}/day, ≈${round(dailyChange, 2)} ${unit}/day) to respect the conservative daily-change cap. Follow the product label if it is stricter.`
    )
  }
  if (maxDailyAmount && totalAmount > maxDailyAmount) {
    warnings.push(
      `The product label limits each dose to about ${round(maxDailyAmount, 2)} ${product.doseUnit}/day for this volume, so the correction is split across ${days} days.`
    )
  }
  if (daysSince) {
    warnings.push(
      `Maintenance estimate assumes the tank was at your target at the last test and no supplement was dosed during the ${daysSince}-day test period. Use it only as a rough guide.`
    )
  }
  if (product.notes) warnings.push(product.notes)

  return {
    product,
    parameter,
    unit,
    totalAmount: round(totalAmount, 2),
    dailyAmount: round(dailyAmount, 2),
    days,
    totalChange: round(totalChange, 2),
    dailyChange: round(dailyChange, 2),
    maxDailyAmount: maxDailyAmount === null ? null : round(maxDailyAmount, 2),
    maxDailyChange,
    measuredDailyChange: measuredDailyChange === null ? null : round(measuredDailyChange, 2),
    maintenanceDailyAmount: maintenanceDailyAmount === null ? null : round(maintenanceDailyAmount, 2),
    warnings,
  }
}

export function calculateCorrection(input: CorrectionInput): CorrectionResult {
  const product = getReefProduct(input.productId)
  if (!product || product.kind !== "correction") {
    throw new Error("Choose a correction product")
  }
  return correctionForProduct(product, input)
}

export function calculateCustomCorrection(input: CustomCorrectionInput): CorrectionResult {
  if (!input.amount || !input.perVolumeL || !input.raises) {
    throw new Error("Custom product needs a dose, a dose volume and a parameter rise")
  }
  const product: ReefProduct = {
    id: "custom-runtime",
    brand: "Custom / generic",
    name: "Custom product",
    kind: "custom",
    parameter: input.parameter,
    doseUnit: input.unit,
    dose: {
      amount: input.amount,
      perVolumeL: input.perVolumeL,
      raises: input.raises,
      raisesUnit: REEF_RECOMMENDED_RANGES[input.parameter].unit,
    },
    sourceUrl: "",
    sourceLabel: "Your product label",
    verifiedAt: "",
  }
  return correctionForProduct(product, input)
}

export function calculateCustomLabelDose(input: CustomLabelDoseInput): LabelDoseResult {
  const volume = input.volumeL ?? 0
  const amount = input.amount ?? 0
  const perVolumeL = input.perVolumeL ?? 0
  if (volume <= 0 || amount <= 0 || perVolumeL <= 0) {
    throw new Error("Label-only mode needs a water volume, a dose amount and a label dose volume")
  }
  const totalAmount = (amount / perVolumeL) * volume
  const product: ReefProduct = {
    id: "custom-label-runtime",
    brand: "Custom / generic",
    name: "Custom product (label dose)",
    kind: "custom",
    parameter: input.parameter ?? undefined,
    doseUnit: input.unit,
    sourceUrl: "",
    sourceLabel: "Your product label",
    verifiedAt: "",
  }
  return {
    product,
    totalAmount: round(totalAmount, 2),
    unit: input.unit,
    labelAmount: amount,
    labelPerVolumeL: perVolumeL,
    warnings: [
      `Label-only dose: ${amount} ${input.unit} per ${perVolumeL} L scaled to ${volume} L. This does not target a measured Ca/KH/Mg value.`,
      "Check whether the label dose is daily, weekly or per application. Add that amount at the label's stated frequency — do not assume it is daily.",
      "Custom product: verify the label concentration and unit. This is not a manufacturer-verified dose.",
      "Test Ca/KH/Mg before and after starting a new product, and do not stack it with another supplement without measuring the result.",
    ],
  }
}

export function calculateSystemDose(productId: string, volumeL: number | null): SystemDoseResult {
  const product = getReefProduct(productId)
  if (!product || (product.kind !== "all-in-one" && product.kind !== "balanced") || !product.startingDose) {
    throw new Error("Choose an all-in-one or balanced system product")
  }
  const volume = volumeL ?? 0
  const dailyAmount = (product.startingDose.amount / product.startingDose.perVolumeL) * volume
  const weeklyAmount = dailyAmount * 7
  const totalDailyAcrossComponents = product.components ? dailyAmount * product.components : null
  const maxDailyAmount = product.maxStartingDose
    ? (product.maxStartingDose.amount / product.maxStartingDose.perVolumeL) * volume
    : null
  const rampPerWeekAmount = product.rampPerWeek
    ? (product.rampPerWeek.amount / product.rampPerWeek.perVolumeL) * volume
    : null
  const warnings = [
    "This is the manufacturer's starting/reference dose, not a measured consumption calculation. Test Ca/KH/Mg and adjust gradually.",
  ]
  if (product.kind === "balanced") {
    warnings.push("Dose all components equally and divide the daily amount into small portions. This reference is for a moderately stocked SPS tank; lower-demand tanks should start lower and measure.")
  }
  if (product.mix) {
    warnings.push(`To make 1 L of solution, mix ${product.mix.powderG} g powder into about 900 ml RO/DI water, then top up to 1 L. Dose the mixed solution by the ml figures.`)
  }
  if (product.notes) warnings.push(product.notes)
  return {
    product,
    dailyAmount: round(dailyAmount, 2),
    weeklyAmount: round(weeklyAmount, 2),
    totalDailyAcrossComponents: totalDailyAcrossComponents === null ? null : round(totalDailyAcrossComponents, 2),
    maxDailyAmount: maxDailyAmount === null ? null : round(maxDailyAmount, 2),
    rampPerWeekAmount: rampPerWeekAmount === null ? null : round(rampPerWeekAmount, 2),
    warnings,
  }
}

export interface ReefDosingValidationInput {
  productId: string
  volumeL: number | null
  current?: number | null
  target?: number | null
  daysSinceLastTest?: number | null
  customAmount?: number | null
  customPerVolumeL?: number | null
  customRaises?: number | null
  customUnit?: DoseUnit
  customParameter?: ReefParameter
  customMode?: CustomDoseMode
}

export function validateReefDosingInput(input: ReefDosingValidationInput): Record<string, string> {
  const errors: Record<string, string> = {}
  const volumeError = validateDimension(input.volumeL, "Water volume", { min: 1, max: 20000 })
  if (volumeError) errors.volumeL = volumeError

  const product = getReefProduct(input.productId)
  if (!product) {
    errors.productId = "Choose a product"
    return errors
  }

  const labelOnly = product.kind === "custom" && input.customMode === "label"

  if ((product.kind === "correction" || product.kind === "custom") && !labelOnly) {
    const parameter = product.kind === "custom" ? input.customParameter : product.parameter
    const range = parameter ? REEF_RECOMMENDED_RANGES[parameter] : null
    if (input.current === null || input.current === undefined || Number.isNaN(input.current)) {
      errors.current = "Current value is required"
    } else if (range && (input.current < range.min * 0.5 || input.current > range.max * 1.8)) {
      errors.current = `Current value looks outside a plausible ${range.label.toLowerCase()} range`
    }
    if (input.target === null || input.target === undefined || Number.isNaN(input.target)) {
      errors.target = "Target value is required"
    } else if (range && (input.target < range.min * 0.5 || input.target > range.max * 1.8)) {
      errors.target = `Target value looks outside a plausible ${range.label.toLowerCase()} range`
    }
    if (input.daysSinceLastTest !== null && input.daysSinceLastTest !== undefined && input.daysSinceLastTest !== 0) {
      if (input.daysSinceLastTest < 1 || input.daysSinceLastTest > 365) {
        errors.daysSinceLastTest = "Days must be between 1 and 365"
      }
    }
  }

  if (product.kind === "custom") {
    if (!labelOnly && !input.customParameter) errors.customParameter = "Choose a parameter"
    if (!input.customAmount || input.customAmount <= 0) errors.customAmount = "Dose amount is required"
    if (!input.customPerVolumeL || input.customPerVolumeL <= 0) errors.customPerVolumeL = "Dose volume is required"
    if (!labelOnly && (!input.customRaises || input.customRaises <= 0)) {
      errors.customRaises = "Expected rise is required"
    }
    if (!input.customUnit || (input.customUnit !== "ml" && input.customUnit !== "g")) errors.customUnit = "Choose ml or g"
  }

  return errors
}

export function isValidReefDosingInput(input: ReefDosingValidationInput): boolean {
  return Object.keys(validateReefDosingInput(input)).length === 0
}
