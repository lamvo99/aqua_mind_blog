import { validateDimension } from "./types"
import { round } from "./units"

export interface DosingInput {
  volumeL: number | null
  dosePerL: number | null
  headroomPercent: number | null
}

export interface DosingResult {
  totalMl: number
  totalMlWithHeadroom: number
  teaspoons: number
  tablespoons: number
}

export const ML_PER_TSP = 5
export const ML_PER_TBSP = 15

export function calculateDose(input: DosingInput): DosingResult {
  const volume = input.volumeL ?? 0
  const rate = input.dosePerL ?? 0
  const total = volume * rate
  const headroom = (input.headroomPercent ?? 0) / 100
  return {
    totalMl: round(total),
    totalMlWithHeadroom: round(total * (1 + headroom)),
    teaspoons: round(total / ML_PER_TSP, 1),
    tablespoons: round(total / ML_PER_TBSP, 1),
  }
}

export function validateDosingInput(input: DosingInput): Record<string, string> {
  const errors: Record<string, string> = {}
  const vErr = validateDimension(input.volumeL, "Tank volume", { min: 1, max: 20000 })
  if (vErr) errors.volumeL = vErr
  const dErr = validateDimension(input.dosePerL, "Dose rate", { min: 0.001, max: 1000 })
  if (dErr) errors.dosePerL = dErr
  if (input.headroomPercent !== null && input.headroomPercent !== undefined) {
    if (input.headroomPercent < 0 || input.headroomPercent > 100) {
      errors.headroomPercent = "Headroom must be between 0 and 100"
    }
  }
  return errors
}

export function isValidDosingInput(input: DosingInput): boolean {
  return Object.keys(validateDosingInput(input)).length === 0
}
