import { validateDimension, validatePercent } from "./types"
import { litersToGallons, round } from "./units"

export interface PumpFlowInput {
  volumeL: number | null
  turnoverPerHour: number | null
  headLossPercent: number | null
}

export interface PumpFlowResult {
  requiredFlowLh: number
  requiredFlowGph: number
  adjustedFlowLh: number
  adjustedFlowGph: number
}

export function calculatePumpFlow(input: PumpFlowInput): PumpFlowResult {
  const volume = input.volumeL ?? 0
  const turnover = input.turnoverPerHour ?? 0
  const headLoss = (input.headLossPercent ?? 0) / 100
  const required = volume * turnover
  const adjusted = required / (1 - headLoss)
  return {
    requiredFlowLh: round(required),
    requiredFlowGph: round(litersToGallons(required)),
    adjustedFlowLh: round(adjusted),
    adjustedFlowGph: round(litersToGallons(adjusted)),
  }
}

export function validatePumpFlowInput(input: PumpFlowInput): Record<string, string> {
  const errors: Record<string, string> = {}
  const vErr = validateDimension(input.volumeL, "Tank volume", { min: 1, max: 20000 })
  if (vErr) errors.volumeL = vErr
  const tErr = validateDimension(input.turnoverPerHour, "Turnover rate", { min: 0.1, max: 50 })
  if (tErr) errors.turnoverPerHour = tErr
  if (input.headLossPercent !== null && input.headLossPercent !== undefined) {
    const pErr = validatePercent(input.headLossPercent, "Head loss")
    if (pErr) errors.headLossPercent = pErr
  }
  return errors
}

export function isValidPumpFlowInput(input: PumpFlowInput): boolean {
  return Object.keys(validatePumpFlowInput(input)).length === 0
}
