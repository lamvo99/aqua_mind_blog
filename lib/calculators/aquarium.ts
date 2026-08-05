import { round } from "./units"

export type LightingMode = "low" | "medium" | "high"

export interface AquariumInput {
  lengthCm: number | null
  widthCm: number | null
  heightCm: number | null
  substrateDepthCm: number | null
  bagSizeLiters: number | null
  lightingMode: LightingMode
  usableVolumeRatio: number
}

export interface AquariumResult {
  grossLiters: number
  usableLiters: number
  substrateLiters: number
  bags: number
  lightingWatts: number
  lightingLabel: string
}

const MAX_DIM = 500
const LIGHTING_WATTS_PER_L: Record<LightingMode, { watts: number; label: string }> = {
  low: { watts: 0.3, label: "low-light plants (estimate)" },
  medium: { watts: 0.5, label: "medium-light plants (estimate)" },
  high: { watts: 0.8, label: "high-light / carpet plants (estimate)" },
}

export function calculateAquarium(input: AquariumInput): AquariumResult {
  const { lengthCm, widthCm, heightCm, substrateDepthCm, bagSizeLiters, lightingMode, usableVolumeRatio } = input

  const grossCm3 = (lengthCm ?? 0) * (widthCm ?? 0) * (heightCm ?? 0)
  const grossLiters = grossCm3 / 1000

  const substrateCm3 =
    lengthCm !== null && widthCm !== null && substrateDepthCm !== null
      ? lengthCm * widthCm * substrateDepthCm
      : 0
  const substrateLiters = substrateCm3 / 1000

  const usableLiters = grossLiters * usableVolumeRatio

  const bags =
    substrateLiters > 0 && bagSizeLiters !== null && bagSizeLiters > 0
      ? Math.ceil(substrateLiters / bagSizeLiters)
      : 0

  const lightingWatts = Math.ceil((usableLiters * LIGHTING_WATTS_PER_L[lightingMode].watts) / 5) * 5
  const lightingLabel = `Estimated fixture wattage — ${LIGHTING_WATTS_PER_L[lightingMode].label}. Rough planning estimate only.`

  return {
    grossLiters: round(grossLiters),
    usableLiters: round(usableLiters),
    substrateLiters: round(substrateLiters),
    bags,
    lightingWatts,
    lightingLabel,
  }
}

export function validateAquariumInput(input: AquariumInput): Record<string, string> {
  const errors: Record<string, string> = {}
  const { lengthCm, widthCm, heightCm, substrateDepthCm, bagSizeLiters } = input

  const checkDim = (value: number | null, key: string, label: string, max: number) => {
    if (value === null || value === undefined) return
    if (value <= 0) errors[key] = `${label} must be greater than zero`
    else if (value > max) errors[key] = `${label} looks too large (max ${max})`
  }

  checkDim(lengthCm, "lengthCol", "Length", MAX_DIM)
  checkDim(widthCm, "widthCol", "Width", MAX_DIM)
  checkDim(heightCm, "heightCol", "Height", MAX_DIM)
  if (substrateDepthCm !== null && substrateDepthCm !== undefined) {
    checkDim(substrateDepthCm, "substrateDepthCol", "Substrate depth", 50)
  }
  if (bagSizeLiters !== null && bagSizeLiters !== undefined && bagSizeLiters <= 0) {
    errors.bagSizeCol = "Bag size must be greater than zero"
  }

  return errors
}

export function isValidAquariumInput(input: AquariumInput): boolean {
  return Object.keys(validateAquariumInput(input)).length === 0
}
