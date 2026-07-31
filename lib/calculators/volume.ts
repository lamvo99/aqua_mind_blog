import type { DimensionInput, VolumeResult, LengthUnit } from "./units"
import { toCm, litersToGallons, round } from "./units"
import { validateDimension as validateDim, validatePercent } from "./types"

export type TankShape = "rectangular" | "cube" | "cylinder"

export interface VolumeInput {
  shape: TankShape
  length: number | null
  width: number | null
  height: number | null
  diameter: number | null
  unit: LengthUnit
  displacementPercent: number | null
}

function cylinderVolumeCm3(diameterCm: number, heightCm: number): number {
  return Math.PI * Math.pow(diameterCm / 2, 2) * heightCm
}

function rectangularVolumeCm3(lengthCm: number, widthCm: number, heightCm: number): number {
  return lengthCm * widthCm * heightCm
}

export function calculateGrossVolumeCm3(input: VolumeInput): number {
  const unit = input.unit
  switch (input.shape) {
    case "cylinder": {
      const d = toCm(input.diameter ?? 0, unit)
      const h = toCm(input.height ?? 0, unit)
      return cylinderVolumeCm3(d, h)
    }
    case "cube": {
      const s = toCm(input.length ?? 0, unit)
      return s * s * s
    }
    case "rectangular":
    default: {
      const l = toCm(input.length ?? 0, unit)
      const w = toCm(input.width ?? 0, unit)
      const h = toCm(input.height ?? 0, unit)
      return rectangularVolumeCm3(l, w, h)
    }
  }
}

export function calculateVolume(input: VolumeInput): VolumeResult {
  const grossCm3 = calculateGrossVolumeCm3(input)
  const liters = grossCm3 / 1000
  const displacement = (input.displacementPercent ?? 0) / 100
  const actualLiters = liters * (1 - displacement)
  return {
    liters: round(actualLiters),
    usGallons: round(litersToGallons(actualLiters)),
    cubicCm: round(grossCm3, 0),
  }
}

export function validateVolumeInput(input: VolumeInput): Record<string, string> {
  const errors: Record<string, string> = {}
  const min = 1
  const max = 500

  if (input.shape === "cylinder") {
    const dErr = validateDim(input.diameter, "Diameter", { min, max })
    if (dErr) errors.diameter = dErr
    const hErr = validateDim(input.height, "Height", { min, max })
    if (hErr) errors.height = hErr
  } else if (input.shape === "cube") {
    const sErr = validateDim(input.length, "Side", { min, max })
    if (sErr) errors.length = sErr
  } else {
    const lErr = validateDim(input.length, "Length", { min, max })
    if (lErr) errors.length = lErr
    const wErr = validateDim(input.width, "Width", { min, max })
    if (wErr) errors.width = wErr
    const hErr = validateDim(input.height, "Height", { min, max })
    if (hErr) errors.height = hErr
  }

  if (input.displacementPercent !== null) {
    const pErr = validatePercent(input.displacementPercent, "Displacement")
    if (pErr) errors.displacement = pErr
  }

  return errors
}

export function isValidVolumeInput(input: VolumeInput): boolean {
  return Object.keys(validateVolumeInput(input)).length === 0
}
