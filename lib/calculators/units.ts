export type LengthUnit = "cm" | "in"

export interface DimensionInput {
  length: number | null
  width: number | null
  height: number | null
  unit: LengthUnit
}

export interface VolumeResult {
  liters: number
  usGallons: number
  cubicCm: number
}

export const CM_TO_INCH = 1 / 2.54
export const LITERS_PER_GALLON = 3.78541

export function cmToIn(cm: number): number {
  return cm * CM_TO_INCH
}

export function inToCm(inch: number): number {
  return inch / CM_TO_INCH
}

export function litersToGallons(liters: number): number {
  return liters / LITERS_PER_GALLON
}

export function gallonsToLiters(gallons: number): number {
  return gallons * LITERS_PER_GALLON
}

export function toCm(value: number, unit: LengthUnit): number {
  return unit === "in" ? inToCm(value) : value
}

export function toUnit(valueCm: number, unit: LengthUnit): number {
  return unit === "in" ? cmToIn(valueCm) : valueCm
}

export function round(value: number, decimals = 1): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}
