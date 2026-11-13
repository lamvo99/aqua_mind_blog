export type ReefCompatibilitySource = "INTERPRETED" | "LEGACY_BOOLEAN" | "NOTE_ONLY"

export interface ReefCompatibilityDisplay {
  /** Short value for a parameter card. Never turns a legacy boolean into a confirmed conclusion. */
  label: string
  /** Explanatory sentence for a detail panel. */
  detail: string
  /** True only when a boolean flag and an explicit meaning are both present. */
  confirmed: boolean
  /** Which kind of stored data produced this display. */
  source: ReefCompatibilitySource
  flag: boolean | null
  meaning: string | null
}

/**
 * Interpret the legacy coral `reefCompatibility` boolean together with
 * `reefSafetyMeaning`. The boolean alone is NOT a confirmed reef-safe conclusion.
 */
export function interpretReefCompatibility(input: {
  reefCompatibility?: boolean | null
  reefSafetyMeaning?: string | null
}): ReefCompatibilityDisplay | null {
  const flag =
    typeof input.reefCompatibility === "boolean" ? input.reefCompatibility : null
  const meaning =
    typeof input.reefSafetyMeaning === "string" && input.reefSafetyMeaning.trim().length > 0
      ? input.reefSafetyMeaning.trim()
      : null

  if (flag === null && meaning === null) return null

  if (flag !== null && meaning) {
    return {
      label: `${flag ? "Yes" : "No"} \u2014 meaning recorded`,
      detail: meaning,
      confirmed: true,
      source: "INTERPRETED",
      flag,
      meaning,
    }
  }

  if (flag !== null) {
    return {
      label: `Legacy flag: ${flag ? "Yes" : "No"} \u2014 meaning not established`,
      detail: `The stored reef-compatibility field is a legacy boolean (${flag ? "Yes" : "No"}). No reefSafetyMeaning is recorded, so this is not a confirmed reef-safety conclusion. Do not read it as safe with every coral or invertebrate.`,
      confirmed: false,
      source: "LEGACY_BOOLEAN",
      flag,
      meaning: null,
    }
  }

  return {
    label: "Compatibility note only \u2014 no confirmed reef-safe flag",
    detail: meaning as string,
    confirmed: false,
    source: "NOTE_ONLY",
    flag: null,
    meaning,
  }
}
