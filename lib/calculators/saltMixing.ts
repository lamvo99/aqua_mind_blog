import { validateDimension, validatePercent } from "./types"
import { round } from "./units"

export interface SaltMixInput {
  volumeL: number | null
  sg: number | null
  headroomPercent: number | null
}

export interface SaltMixResult {
  grams: number
  kg: number
  gramsWithHeadroom: number
  saltPerLiter: number
}

const G_PER_L_AT_SG_1_023 = 35
const SG_TO_G_SLOPE = G_PER_L_AT_SG_1_023 / 0.023

export function calculateSalt(input: SaltMixInput): SaltMixResult {
  const volume = input.volumeL ?? 0
  const sg = input.sg ?? 1
  const saltPerLiter = SG_TO_G_SLOPE * (sg - 1)
  const grams = saltPerLiter * volume
  const headroom = (input.headroomPercent ?? 0) / 100
  return {
    grams: round(grams),
    kg: round(grams / 1000, 2),
    gramsWithHeadroom: round(grams * (1 + headroom)),
    saltPerLiter: round(saltPerLiter, 1),
  }
}

export function validateSaltMixInput(input: SaltMixInput): Record<string, string> {
  const errors: Record<string, string> = {}
  const vErr = validateDimension(input.volumeL, "Water volume", { min: 1, max: 20000 })
  if (vErr) errors.volumeL = vErr
  if (input.sg === null || input.sg === undefined || Number.isNaN(input.sg)) {
    errors.sg = "Specific gravity is required"
  } else if (input.sg < 1.018 || input.sg > 1.03) {
    errors.sg = "Specific gravity must be between 1.018 and 1.030"
  }
  if (input.headroomPercent !== null && input.headroomPercent !== undefined) {
    const pErr = validatePercent(input.headroomPercent, "Headroom")
    if (pErr) errors.headroomPercent = pErr
  }
  return errors
}

export function isValidSaltMixInput(input: SaltMixInput): boolean {
  return Object.keys(validateSaltMixInput(input)).length === 0
}
