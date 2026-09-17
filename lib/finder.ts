// ===== TYPES =====

export type WaterType = "freshwater" | "saltwater"
export type TankRange = "nano" | "small" | "medium" | "large"
export type DifficultyLevel = "beginner" | "intermediate" | "advanced"
export type LightLevel = "low" | "medium" | "high"
export type Co2Level = "none" | "low" | "medium" | "high"

export interface FinderIntent {
  waterType?: WaterType
  tankRange?: TankRange
  tankSizeL?: number
  difficulty?: DifficultyLevel
  light?: LightLevel
  co2?: Co2Level
  style?: string
  region?: string
  predator?: boolean
  reefSafe?: boolean
}

export interface FinderItem {
  _id: string
  _type: "species" | "plant" | "coral" | "invertebrate" | "equipment"
  name: string
  slug: { current: string }
  difficulty?: string
  tankSizeMinL?: number
  tankSizeMaxL?: number
  light?: string
  co2?: string
  waterType?: string
  sizeCm?: number
  tempMinC?: number
  tempMaxC?: number
  phMin?: number
  phMax?: number
  origin?: string
  region?: string
  aquariumStyle?: string[]
  isPredator?: boolean
  reefCompatibility?: boolean
  category?: string
  group?: string
  mainImage?: any
}

export type MatchStatus = "match" | "no_match" | "unknown"

export interface ConstraintResult {
  field: string
  label: string
  status: MatchStatus
  detail?: string
}

export interface FinderResult {
  item: FinderItem
  constraints: ConstraintResult[]
  matchCount: number
  unknownCount: number
  explanation: string[]
}

// ===== CONSTANTS =====

const TANK_RANGES: Record<TankRange, [number, number]> = {
  nano: [0, 30],
  small: [30, 80],
  medium: [80, 200],
  large: [200, 50000],
}

const DIFF_RANK: Record<string, number> = {
  Beginner: 0, Intermediate: 1, Advanced: 2, Expert: 3,
}

const EXP_MAP: Record<DifficultyLevel, number> = {
  beginner: 0, intermediate: 1, advanced: 2,
}

const PLANT_LIGHT: Record<LightLevel, string[]> = {
  low: ["Low", "Low-Medium"],
  medium: ["Medium", "Medium-High"],
  high: ["High"],
}

const CORAL_LIGHT: Record<LightLevel, string[]> = {
  low: ["Low", "Moderate"],
  medium: ["Moderate", "High"],
  high: ["High", "Very High"],
}

const CO2_MAP: Record<Co2Level, string[]> = {
  none: ["None"],
  low: ["None", "Low"],
  medium: ["None", "Low", "Medium"],
  high: ["None", "Low", "Medium", "High"],
}

// ===== MATCHING ENGINE =====

function checkConstraint(field: string, label: string, status: MatchStatus, detail?: string): ConstraintResult {
  return { field, label, status, detail }
}

function matchWaterType(item: FinderItem, intent: FinderIntent): ConstraintResult {
  if (!intent.waterType) return checkConstraint("waterType", "Water type", "unknown")
  if (!item.waterType) return checkConstraint("waterType", "Water type", "unknown")
  if (item.waterType === intent.waterType) {
    return checkConstraint("waterType", "Water type", "match", `${item.waterType}`)
  }
  return checkConstraint("waterType", "Water type", "no_match", `${item.waterType} ≠ ${intent.waterType}`)
}

function matchTankSize(item: FinderItem, intent: FinderIntent): ConstraintResult {
  if (item._type === "equipment") {
    // Equipment: check if tank capacity overlaps with user's tank
    if (intent.tankSizeL == null) return checkConstraint("tankSize", "Tank size", "unknown")
    if (item.tankSizeMinL && item.tankSizeMinL > intent.tankSizeL) {
      return checkConstraint("tankSize", "Tank size", "no_match", `Requires ≥${item.tankSizeMinL}L`)
    }
    if (item.tankSizeMaxL && item.tankSizeMaxL < intent.tankSizeL) {
      return checkConstraint("tankSize", "Tank size", "no_match", `Max ${item.tankSizeMaxL}L`)
    }
    return checkConstraint("tankSize", "Tank size", "match")
  }

  if (intent.tankSizeL == null && !intent.tankRange) return checkConstraint("tankSize", "Tank size", "unknown")
  
  const minRequired = item.tankSizeMinL
  if (minRequired == null) return checkConstraint("tankSize", "Tank size", "unknown")

  // Direct numeric check
  if (intent.tankSizeL != null) {
    if (minRequired > intent.tankSizeL) {
      return checkConstraint("tankSize", "Tank size", "no_match", `Needs ≥${minRequired}L, you have ${intent.tankSizeL}L`)
    }
    return checkConstraint("tankSize", "Tank size", "match", `Needs ≥${minRequired}L — fits`)
  }

  // Range-based check
  if (intent.tankRange) {
    const [, max] = TANK_RANGES[intent.tankRange]
    if (minRequired > max) {
      return checkConstraint("tankSize", "Tank size", "no_match", `Needs ≥${minRequired}L, too large for ${intent.tankRange} tank`)
    }
    return checkConstraint("tankSize", "Tank size", "match")
  }

  return checkConstraint("tankSize", "Tank size", "unknown")
}

function matchDifficulty(item: FinderItem, intent: FinderIntent): ConstraintResult {
  if (!intent.difficulty) return checkConstraint("difficulty", "Difficulty", "unknown")
  if (!item.difficulty) return checkConstraint("difficulty", "Difficulty", "unknown")

  const userRank = EXP_MAP[intent.difficulty]
  const itemRank = DIFF_RANK[item.difficulty] ?? 0
  const diff = itemRank - userRank

  if (diff >= 2) {
    return checkConstraint("difficulty", "Difficulty", "no_match", `${item.difficulty} — too advanced`)
  }
  if (diff === 1) {
    return checkConstraint("difficulty", "Difficulty", "match", `${item.difficulty} — slightly challenging`)
  }
  return checkConstraint("difficulty", "Difficulty", "match", `${item.difficulty} — matches your level`)
}

function matchLight(item: FinderItem, intent: FinderIntent): ConstraintResult {
  if (!intent.light) return checkConstraint("light", "Lighting", "unknown")
  if (!item.light) return checkConstraint("light", "Lighting", "unknown")

  if (item._type === "plant") {
    const ok = PLANT_LIGHT[intent.light]?.includes(item.light)
    return checkConstraint("light", "Lighting", ok ? "match" : "no_match", `${item.light}`)
  }
  if (item._type === "coral") {
    const ok = CORAL_LIGHT[intent.light]?.includes(item.light)
    return checkConstraint("light", "Lighting", ok ? "match" : "no_match", `${item.light}`)
  }
  return checkConstraint("light", "Lighting", "unknown")
}

function matchCo2(item: FinderItem, intent: FinderIntent): ConstraintResult {
  if (!intent.co2) return checkConstraint("co2", "CO₂", "unknown")
  if (item._type !== "plant") return checkConstraint("co2", "CO₂", "unknown")
  if (!item.co2) return checkConstraint("co2", "CO₂", "unknown")

  const allowed = CO2_MAP[intent.co2]
  if (allowed?.includes(item.co2)) {
    return checkConstraint("co2", "CO₂", "match", `${item.co2}`)
  }
  return checkConstraint("co2", "CO₂", "no_match", `${item.co2} needs more CO₂`)
}

function matchStyle(item: FinderItem, intent: FinderIntent): ConstraintResult {
  if (!intent.style) return checkConstraint("style", "Style", "unknown")
  if (!item.aquariumStyle || item.aquariumStyle.length === 0) return checkConstraint("style", "Style", "unknown")

  if (item.aquariumStyle.includes(intent.style)) {
    return checkConstraint("style", "Style", "match", intent.style)
  }
  return checkConstraint("style", "Style", "no_match", `Not typical for ${intent.style}`)
}

function matchRegion(item: FinderItem, intent: FinderIntent): ConstraintResult {
  if (!intent.region) return checkConstraint("region", "Region", "unknown")
  if (!item.region) return checkConstraint("region", "Region", "unknown")

  if (item.region === intent.region) {
    return checkConstraint("region", "Region", "match", item.region)
  }
  return checkConstraint("region", "Region", "no_match", `${item.region} ≠ ${intent.region}`)
}

function matchPredator(item: FinderItem, intent: FinderIntent): ConstraintResult {
  if (intent.predator === undefined) return checkConstraint("predator", "Predator", "unknown")
  if (intent.predator) {
    if (item.isPredator) return checkConstraint("predator", "Predator", "match", "Predator species")
    return checkConstraint("predator", "Predator", "no_match", "Not a predator")
  }
  // User wants non-predator
  if (item.isPredator) return checkConstraint("predator", "Predator", "no_match", "Predator — may eat tank mates")
  return checkConstraint("predator", "Predator", "match")
}

function matchReefSafe(item: FinderItem, intent: FinderIntent): ConstraintResult {
  if (intent.reefSafe === undefined) return checkConstraint("reefSafe", "Reef safe", "unknown")
  if (item._type !== "species" || item.waterType !== "saltwater") return checkConstraint("reefSafe", "Reef safe", "unknown")
  if (item.reefCompatibility === undefined) return checkConstraint("reefSafe", "Reef safe", "unknown")

  if (intent.reefSafe && item.reefCompatibility) {
    return checkConstraint("reefSafe", "Reef safe", "match", "Reef compatible")
  }
  if (intent.reefSafe && !item.reefCompatibility) {
    return checkConstraint("reefSafe", "Reef safe", "no_match", "Not reef safe")
  }
  return checkConstraint("reefSafe", "Reef safe", "unknown")
}

function matchEquipmentCategory(item: FinderItem, intent: FinderIntent): ConstraintResult {
  if (item._type !== "equipment") return checkConstraint("category", "Category", "unknown")
  if (!item.category) return checkConstraint("category", "Category", "unknown")
  return checkConstraint("category", "Category", "match", item.category)
}

// ===== MAIN FINDER =====

export function findMatches(items: FinderItem[], intent: FinderIntent): FinderResult[] {
  const results: FinderResult[] = []

  for (const item of items) {
    const constraints: ConstraintResult[] = []

    // Hard constraints
    const waterCheck = matchWaterType(item, intent)
    constraints.push(waterCheck)
    if (waterCheck.status === "no_match") continue

    const tankCheck = matchTankSize(item, intent)
    constraints.push(tankCheck)
    if (tankCheck.status === "no_match") continue

    const diffCheck = matchDifficulty(item, intent)
    constraints.push(diffCheck)
    if (diffCheck.status === "no_match") continue
    constraints.push(matchLight(item, intent))
    constraints.push(matchCo2(item, intent))
    constraints.push(matchStyle(item, intent))
    constraints.push(matchRegion(item, intent))
    constraints.push(matchPredator(item, intent))
    constraints.push(matchReefSafe(item, intent))
    constraints.push(matchEquipmentCategory(item, intent))

    const matchCount = constraints.filter((c) => c.status === "match").length
    const unknownCount = constraints.filter((c) => c.status === "unknown").length

    // Build explanation
    const explanation: string[] = []
    for (const c of constraints) {
      if (c.status === "match" && c.detail) explanation.push(c.detail)
    }
    if (item.tankSizeMinL) explanation.unshift(`Needs ≥${item.tankSizeMinL}L`)
    if (item.sizeCm) explanation.push(`Grows to ${item.sizeCm}cm`)

    results.push({ item, constraints, matchCount, unknownCount, explanation })
  }

  // Sort: most matches first, then fewest unknowns
  return results.sort((a, b) => {
    if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount
    return a.unknownCount - b.unknownCount
  })
}

// ===== URL STATE =====

export function intentToParams(intent: FinderIntent): string {
  const params = new URLSearchParams()
  if (intent.waterType) params.set("waterType", intent.waterType)
  if (intent.tankRange) params.set("tankRange", intent.tankRange)
  if (intent.tankSizeL) params.set("tankSizeL", intent.tankSizeL.toString())
  if (intent.difficulty) params.set("difficulty", intent.difficulty)
  if (intent.light) params.set("light", intent.light)
  if (intent.co2) params.set("co2", intent.co2)
  if (intent.style) params.set("style", intent.style)
  if (intent.region) params.set("region", intent.region)
  if (intent.predator) params.set("predator", "true")
  if (intent.reefSafe) params.set("reefSafe", "true")
  return params.toString()
}

export function paramsToIntent(search: string): FinderIntent {
  const params = new URLSearchParams(search)
  return {
    waterType: (params.get("waterType") as WaterType) || undefined,
    tankRange: (params.get("tankRange") as TankRange) || undefined,
    tankSizeL: params.get("tankSizeL") ? Number(params.get("tankSizeL")) : undefined,
    difficulty: (params.get("difficulty") as DifficultyLevel) || undefined,
    light: (params.get("light") as LightLevel) || undefined,
    co2: (params.get("co2") as Co2Level) || undefined,
    style: params.get("style") || undefined,
    region: params.get("region") || undefined,
    predator: params.get("predator") === "true",
    reefSafe: params.get("reefSafe") === "true",
  }
}
