import { round, litersToGallons } from "./units"
import { validateDimension, validatePercent } from "./types"

export interface WaterChangeInput {
  tankVolumeLiters: number | null
  changePercent: number | null
  currentParameter: number | null
  sourceParameter: number | null
}

export interface WaterChangeResult {
  changeVolumeLiters: number
  changeVolumeGallons: number
  remainingVolumeLiters: number
  resultingParameter: number | null
  deltaParameter: number | null
}

export function calculateWaterChange(input: WaterChangeInput): WaterChangeResult {
  const tank = input.tankVolumeLiters ?? 0
  const pct = (input.changePercent ?? 0) / 100
  const changeVolume = tank * pct
  const remaining = tank - changeVolume

  let resultingParameter: number | null = null
  let deltaParameter: number | null = null
  if (
    input.currentParameter !== null &&
    input.currentParameter !== undefined &&
    input.sourceParameter !== null &&
    input.sourceParameter !== undefined &&
    tank > 0
  ) {
    resultingParameter = round(
      (remaining * input.currentParameter + changeVolume * input.sourceParameter) / tank,
      2
    )
    deltaParameter = round(resultingParameter - input.currentParameter, 2)
  }

  return {
    changeVolumeLiters: round(changeVolume),
    changeVolumeGallons: round(litersToGallons(changeVolume)),
    remainingVolumeLiters: round(remaining),
    resultingParameter,
    deltaParameter,
  }
}

export function validateWaterChangeInput(input: WaterChangeInput): Record<string, string> {
  const errors: Record<string, string> = {}
  const tankErr = validateDimension(input.tankVolumeLiters, "Tank volume", { min: 1, max: 1000000 })
  if (tankErr) errors.tankVolumeLiters = tankErr
  const pctErr = validatePercent(input.changePercent, "Change percentage")
  if (pctErr) errors.changePercent = pctErr
  if (input.currentParameter !== null && input.currentParameter !== undefined && input.currentParameter < 0) {
    errors.currentParameter = "Current parameter cannot be negative"
  }
  if (input.sourceParameter !== null && input.sourceParameter !== undefined && input.sourceParameter < 0) {
    errors.sourceParameter = "Source water parameter cannot be negative"
  }
  return errors
}

export function isValidWaterChangeInput(input: WaterChangeInput): boolean {
  return Object.keys(validateWaterChangeInput(input)).length === 0
}
