import { round } from "./units"
import { validateDimension } from "./types"

export interface Co2Input {
  kh: number | null
  ph: number | null
}

export interface Co2Result {
  co2Ppm: number
  label: string
}

const CO2_FACTOR = 3

export function calculateCo2(input: Co2Input): Co2Result {
  const kh = input.kh ?? 0
  const ph = input.ph ?? 0
  const co2Ppm = CO2_FACTOR * kh * Math.pow(10, 7 - ph)
  const rounded = round(co2Ppm, 1)

  let label: string
  if (rounded < 15) label = "Low — plants may struggle without supplementation"
  else if (rounded <= 30) label = "Optimal range for a planted aquarium"
  else if (rounded <= 40) label = "High — watch fish behavior for signs of stress"
  else label = "Dangerously high — gas exchange is required immediately"

  return { co2Ppm: rounded, label }
}

export function validateCo2Input(input: Co2Input): Record<string, string> {
  const errors: Record<string, string> = {}
  const khErr = validateDimension(input.kh, "KH", { min: 1, max: 30 })
  if (khErr) errors.kh = khErr
  const phErr = validateDimension(input.ph, "pH", { min: 4, max: 10 })
  if (phErr) errors.ph = phErr
  return errors
}

export function isValidCo2Input(input: Co2Input): boolean {
  return Object.keys(validateCo2Input(input)).length === 0
}
