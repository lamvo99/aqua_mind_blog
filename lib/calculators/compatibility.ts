export interface CompatSpecies {
  _id: string
  name: string
  slug: string
  scientificName?: string | null
  sizeCm?: number | null
  tankSizeMinL?: number | null
  tempMinC?: number | null
  tempMaxC?: number | null
  phMin?: number | null
  phMax?: number | null
  ghMin?: number | null
  ghMax?: number | null
  temperament?: string | null
  waterZone?: string | null
  schooling?: string | null
  diet?: string | null
  difficulty?: string | null
  compatibleWith: string[]
}

export interface Selection {
  slug: string
  count: number
}

export type Severity = "error" | "warning" | "info" | "ok"

export interface CompatIssue {
  severity: Severity
  message: string
}

export interface PairResult {
  a: string
  b: string
  knownCompatible: boolean
  issues: CompatIssue[]
}

export interface CheckResult {
  capacityCm: number
  totalCm: number
  utilizationPercent: number
  status: "overstocked" | "at-capacity" | "lightly-stocked" | null
  tankIssues: CompatIssue[]
  pairIssues: PairResult[]
}

const AGGRESSIVE = ["aggressive", "territorial", "semi-aggressive"]
const CM_PER_INCH = 2.54
const LITERS_PER_GALLON = 3.785

function overlaps(aMin?: number | null, aMax?: number | null, bMin?: number | null, bMax?: number | null): boolean {
  if (aMin == null || aMax == null || bMin == null || bMax == null) return true
  return aMin <= bMax && bMin <= aMax
}

function fmtTemp(c?: number | null, suffix = ""): string {
  return c != null ? `${c}${suffix}` : "?"
}

export function checkCompatibility(speciesMap: Record<string, CompatSpecies>, selections: Selection[], tankL: number): CheckResult {
  const selected = selections
    .map((s) => speciesMap[s.slug])
    .filter((s): s is CompatSpecies => Boolean(s))

  const tankIssues: CompatIssue[] = []
  for (const s of selected) {
    if (s.tankSizeMinL != null && s.tankSizeMinL > tankL) {
      tankIssues.push({
        severity: "error",
        message: `${s.name} needs at least ${s.tankSizeMinL} L — your ${tankL} L tank is too small.`,
      })
    }
    if (s.schooling && s.schooling.trim().length > 0) {
      const sel = selections.find((x) => x.slug === s.slug)
      if (!sel || sel.count < 6) {
        tankIssues.push({
          severity: "info",
          message: `${s.name} is a schooling species — keep at least 6 (${s.schooling}).`,
        })
      }
    }
  }

  const pairIssues: PairResult[] = []
  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      const a = selected[i]
      const b = selected[j]
      const knownCompatible =
        a.compatibleWith.includes(b.slug) || b.compatibleWith.includes(a.slug)
      const issues: CompatIssue[] = []

      if (!overlaps(a.tempMinC, a.tempMaxC, b.tempMinC, b.tempMaxC)) {
        issues.push({
          severity: "error",
          message: `Temperature mismatch: ${a.name} needs ${fmtTemp(a.tempMinC)}–${fmtTemp(a.tempMaxC)}°C, ${b.name} needs ${fmtTemp(b.tempMinC)}–${fmtTemp(b.tempMaxC)}°C.`,
        })
      }
      if (!overlaps(a.phMin, a.phMax, b.phMin, b.phMax)) {
        issues.push({
          severity: "error",
          message: `pH mismatch: ${a.name} prefers ${fmtTemp(a.phMin)}–${fmtTemp(a.phMax)}, ${b.name} prefers ${fmtTemp(b.phMin)}–${fmtTemp(b.phMax)}.`,
        })
      }
      if (
        a.ghMin != null && a.ghMax != null && b.ghMin != null && b.ghMax != null &&
        !overlaps(a.ghMin, a.ghMax, b.ghMin, b.ghMax)
      ) {
        issues.push({
          severity: "warning",
          message: `Hardness (GH) differs: ${a.name} wants ${a.ghMin}–${a.ghMax} dGH, ${b.name} wants ${b.ghMin}–${b.ghMax} dGH.`,
        })
      }
      const aAgg = AGGRESSIVE.includes((a.temperament || "").toLowerCase())
      const bAgg = AGGRESSIVE.includes((b.temperament || "").toLowerCase())
      if (aAgg && bAgg) {
        issues.push({
          severity: "warning",
          message: `${a.name} and ${b.name} are both ${a.temperament} — expect territory conflicts in smaller tanks.`,
        })
      }
      const aEats = (a.diet || "").toLowerCase().includes("carnivor")
      const bEats = (b.diet || "").toLowerCase().includes("carnivor")
      if (aEats && b.sizeCm && a.sizeCm && a.sizeCm > 2.5 * b.sizeCm) {
        issues.push({
          severity: "warning",
          message: `${a.name} (${a.sizeCm} cm, carnivorous) may try to eat ${b.name} (${b.sizeCm} cm).`,
        })
      }
      if (bEats && a.sizeCm && b.sizeCm && b.sizeCm > 2.5 * a.sizeCm) {
        issues.push({
          severity: "warning",
          message: `${b.name} (${b.sizeCm} cm, carnivorous) may try to eat ${a.name} (${a.sizeCm} cm).`,
        })
      }
      if (knownCompatible && issues.length === 0) {
        issues.push({
          severity: "ok",
          message: `${a.name} and ${b.name} are marked as known compatible in our database.`,
        })
      }

      pairIssues.push({ a: a.slug, b: b.slug, knownCompatible, issues })
    }
  }

  const gallons = tankL / LITERS_PER_GALLON
  const capacityCm = Math.round(gallons * CM_PER_INCH)
  const totalCm = selected.reduce((sum, s) => {
    const sel = selections.find((x) => x.slug === s.slug)
    return sum + (s.sizeCm || 0) * (sel?.count || 0)
  }, 0)
  const utilizationPercent = Math.round((totalCm / capacityCm) * 100)
  let status: CheckResult["status"] = null
  if (utilizationPercent > 100) status = "overstocked"
  else if (utilizationPercent >= 60) status = "at-capacity"
  else status = "lightly-stocked"

  return { capacityCm, totalCm, utilizationPercent, status, tankIssues, pairIssues }
}

export function buildShareUrl(tankL: number, selections: Selection[]): string {
  if (selections.length === 0) return "/tools/compatibility-checker"
  const fish = selections.map((s) => `${s.slug}:${s.count}`).join(",")
  return `/tools/compatibility-checker?tank=${tankL}&fish=${encodeURIComponent(fish)}`
}
