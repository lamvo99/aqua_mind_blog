import { validateDimension } from "./types"
import { litersToGallons, round } from "./units"

export type StockingLevel = "light" | "standard" | "heavy"

export interface StockingInput {
  volumeL: number | null
  level: StockingLevel
  fishCount: number | null
  adultCm: number | null
}

export interface StockingResult {
  capacityInches: number
  capacityCm: number
  totalCm: number | null
  utilizationPercent: number | null
  status: "lightly-stocked" | "at-capacity" | "overstocked" | null
}

export const INCHES_PER_GALLON: Record<StockingLevel, number> = {
  light: 0.5,
  standard: 1,
  heavy: 1.5,
}

const CM_PER_INCH = 2.54

export function calculateStocking(input: StockingInput): StockingResult {
  const volume = input.volumeL ?? 0
  const gallons = litersToGallons(volume)
  const capacityInches = gallons * INCHES_PER_GALLON[input.level]
  const capacityCm = capacityInches * CM_PER_INCH

  let totalCm: number | null = null
  let utilizationPercent: number | null = null
  let status: StockingResult["status"] = null

  if (input.fishCount !== null && input.adultCm !== null && input.fishCount > 0) {
    totalCm = round(input.fishCount * input.adultCm)
    utilizationPercent = Math.round((totalCm / capacityCm) * 100)
    if (utilizationPercent > 100) status = "overstocked"
    else if (utilizationPercent >= 60) status = "at-capacity"
    else status = "lightly-stocked"
  }

  return { capacityInches: round(capacityInches), capacityCm: round(capacityCm), totalCm, utilizationPercent, status }
}

export function validateStockingInput(input: StockingInput): Record<string, string> {
  const errors: Record<string, string> = {}
  const vErr = validateDimension(input.volumeL, "Tank volume", { min: 1, max: 20000 })
  if (vErr) errors.volumeL = vErr
  if (input.fishCount !== null && input.fishCount !== undefined) {
    const fErr = validateDimension(input.fishCount, "Fish count", { min: 1, max: 500 })
    if (fErr) errors.fishCount = fErr
  }
  if (input.adultCm !== null && input.adultCm !== undefined) {
    const aErr = validateDimension(input.adultCm, "Adult size", { min: 0.5, max: 200 })
    if (aErr) errors.adultCm = aErr
  }
  return errors
}

export function isValidStockingInput(input: StockingInput): boolean {
  return Object.keys(validateStockingInput(input)).length === 0
}
