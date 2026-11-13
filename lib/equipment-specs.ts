const UNKNOWN_MAX_TANK_SENTINEL = 9999

function finitePositive(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return value
}

export function formatPower(value: unknown): string | null {
  const watts = finitePositive(value)
  return watts === null ? null : `${watts} W`
}

export function formatFlowRate(value: unknown): string | null {
  const flow = finitePositive(value)
  return flow === null ? null : `${flow} L/h`
}

function isInvalidBound(value: unknown): boolean {
  return typeof value === 'number' && (!Number.isFinite(value) || value < 0)
}

export function formatTankSize(min: unknown, max: unknown): string | null {
  if (isInvalidBound(min) || isInvalidBound(max)) return null
  const lowRaw = finitePositive(min)
  const highRaw = finitePositive(max)
  const low = lowRaw === UNKNOWN_MAX_TANK_SENTINEL ? null : lowRaw
  const high = highRaw === UNKNOWN_MAX_TANK_SENTINEL ? null : highRaw

  if (low !== null && high !== null) {
    if (low > high) return null
    return `${low}–${high} L`
  }
  if (low !== null) return `From ${low} L`
  if (high !== null) return `Up to ${high} L`
  return null
}
