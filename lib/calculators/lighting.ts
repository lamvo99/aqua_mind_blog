import { validateDimension } from "./types"
import { round } from "./units"

export type LightLevel = "low" | "medium" | "high"

export interface LightingInput {
  volumeL: number | null
  level: LightLevel
  ledWattage: number | null
}

export interface LightingResult {
  targetLumens: number
  targetLedWatts: number
  achievedLumens: number | null
  achievedLevel: LightLevel | null
}

export const TARGET_LUMENS_PER_L: Record<LightLevel, number> = {
  low: 20,
  medium: 35,
  high: 50,
}

export const LED_LUMENS_PER_WATT = 90

function levelFromLumensPerL(lmPerL: number): LightLevel {
  if (lmPerL >= 45) return "high"
  if (lmPerL >= 25) return "medium"
  return "low"
}

export function calculateLighting(input: LightingInput): LightingResult {
  const volume = input.volumeL ?? 0
  const targetLumens = volume * TARGET_LUMENS_PER_L[input.level]
  const targetLedWatts = Math.ceil((targetLumens / LED_LUMENS_PER_WATT) / 5) * 5
  let achievedLumens: number | null = null
  let achievedLevel: LightLevel | null = null
  if (input.ledWattage !== null && input.ledWattage !== undefined) {
    achievedLumens = round(input.ledWattage * LED_LUMENS_PER_WATT)
    achievedLevel = volume > 0 ? levelFromLumensPerL(achievedLumens / volume) : null
  }
  return { targetLumens: round(targetLumens), targetLedWatts, achievedLumens, achievedLevel }
}

export function validateLightingInput(input: LightingInput): Record<string, string> {
  const errors: Record<string, string> = {}
  const vErr = validateDimension(input.volumeL, "Tank volume", { min: 1, max: 20000 })
  if (vErr) errors.volumeL = vErr
  if (input.ledWattage !== null && input.ledWattage !== undefined) {
    const wErr = validateDimension(input.ledWattage, "Light wattage", { min: 1, max: 500 })
    if (wErr) errors.ledWattage = wErr
  }
  return errors
}

export function isValidLightingInput(input: LightingInput): boolean {
  return Object.keys(validateLightingInput(input)).length === 0
}
