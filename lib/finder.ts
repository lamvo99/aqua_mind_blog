export type FinderType = "species" | "plant" | "coral"
export type WaterType = "freshwater" | "planted" | "reef"
export type TankSize = "small" | "medium" | "large"
export type Experience = "beginner" | "intermediate" | "advanced"
export type Lighting = "low" | "medium" | "high"

export interface FinderItem {
  _id: string
  _type: FinderType
  name: string
  slug: { current: string }
  difficulty?: string
  tankSizeMinL?: number
  light?: string
  tempMinC?: number
  tempMaxC?: number
  phMin?: number
  phMax?: number
  origin?: string
  sizeCm?: number
  mainImage?: any
}

export interface FinderAnswers {
  water: WaterType
  tank: TankSize
  experience: Experience
  light: Lighting
}

export interface FinderResult {
  item: FinderItem
  score: number
  reasons: string[]
}

const DIFF_RANK: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2, Expert: 3 }

const TANK_RANGE: Record<TankSize, [number, number]> = {
  small: [0, 40],
  medium: [40, 150],
  large: [150, 20000],
}

const PLANT_LIGHT: Record<Lighting, string[]> = {
  low: ["Low", "Low-Medium"],
  medium: ["Medium", "Medium-High"],
  high: ["High"],
}

const CORAL_LIGHT: Record<Lighting, string[]> = {
  low: ["Low", "Moderate"],
  medium: ["Moderate", "High"],
  high: ["High", "Very High"],
}

const SALT_ORIGIN = /ocean|sea|reef|indian|pacific|atlantic|caribbean|indo|maldiv|philippin|indonesia|sri lanka|red sea|hawaii|florida/i

export function findMatches(items: FinderItem[], answers: FinderAnswers): FinderResult[] {
  const results: FinderResult[] = []
  for (const item of items) {
    const reasons: string[] = []
    let score = 0

    if (item._type === "coral") {
      if (answers.water !== "reef") continue
      score += 1
      reasons.push("Great for a reef tank")
    } else if (item._type === "plant") {
      if (answers.water === "reef") continue
      if (answers.water === "planted") {
        score += 2
        reasons.push("Perfect for a planted tank")
      } else {
        score += 1
      }
    } else {
      if (answers.water === "reef" && !SALT_ORIGIN.test(item.origin || "")) continue
      if (answers.water === "freshwater" && SALT_ORIGIN.test(item.origin || "")) continue
      score += 1
      reasons.push("Fits a freshwater community tank")
    }

    if (item._type === "species" && item.tankSizeMinL != null) {
      const [min, max] = TANK_RANGE[answers.tank]
      if (item.tankSizeMinL > max) continue
      if (item.tankSizeMinL > min) {
        score += 1
        reasons.push(`Fits a ${answers.tank} tank (needs ≥ ${item.tankSizeMinL} L)`)
      } else {
        score += 2
        reasons.push("Your tank size is comfortable")
      }
    } else {
      score += 2
    }

    const userD = DIFF_RANK[answers.experience === "advanced" ? "Advanced" : answers.experience === "intermediate" ? "Intermediate" : "Beginner"] ?? 0
    const d = DIFF_RANK[item.difficulty ?? ""] ?? 0
    const diff = d - userD
    if (diff >= 2) continue
    if (diff === 1) {
      score += 1
      reasons.push("Slightly above your experience level")
    } else if (diff === 0) {
      score += 3
      reasons.push("Difficulty matches your experience")
    } else {
      score += 2
      reasons.push("Easy to keep for your level")
    }

    if (item._type === "plant" && item.light) {
      if (PLANT_LIGHT[answers.light].includes(item.light)) {
        score += 2
        reasons.push(`Does well under ${item.light.toLowerCase()} light`)
      }
    } else if (item._type === "coral" && item.light) {
      if (CORAL_LIGHT[answers.light].includes(item.light)) {
        score += 2
        reasons.push(`Happy with ${item.light.toLowerCase()} light`)
      }
    } else {
      score += 1
    }

    results.push({ item, score, reasons })
  }
  return results.sort((a, b) => b.score - a.score)
}
