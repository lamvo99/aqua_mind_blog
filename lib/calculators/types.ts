export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export function validateDimension(
  value: number | null,
  label: string,
  opts: { min?: number; max?: number; allowZero?: boolean } = {}
): string | null {
  if (value === null || Number.isNaN(value)) return `${label} is required`
  if (!Number.isFinite(value)) return `${label} must be a valid number`
  if (value <= 0) return `${label} must be greater than zero`
  if (opts.min !== undefined && value < opts.min) return `${label} must be at least ${opts.min}`
  if (opts.max !== undefined && value > opts.max) return `${label} must be at most ${opts.max}`
  return null
}

export function validatePercent(value: number | null, label: string): string | null {
  if (value === null || Number.isNaN(value)) return `${label} is required`
  if (value < 0) return `${label} cannot be negative`
  if (value > 100) return `${label} must be between 0 and 100`
  return null
}
