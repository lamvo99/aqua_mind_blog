export interface CompareField {
  key: string
  label: string
  extract: (item: any) => string
}

const str = (v: any): string => (v === null || v === undefined || v === "" ? "" : String(v))
const range = (min: any, max: any, unit = ""): string => {
  if (min == null && max == null) return ""
  if (min != null && max != null) return `${min}–${max}${unit}`
  return `${min ?? max}${unit}`
}

export const COMPARE_FIELDS: Record<string, CompareField[]> = {
  species: [
    { key: "sizeCm", label: "Adult size", extract: (i) => str(i.sizeCm) + " cm" },
    { key: "tankSizeMinL", label: "Min tank size", extract: (i) => str(i.tankSizeMinL) + " L" },
    { key: "temp", label: "Temperature", extract: (i) => range(i.tempMinC, i.tempMaxC, "°C") },
    { key: "ph", label: "pH range", extract: (i) => range(i.phMin, i.phMax) },
    { key: "gh", label: "Hardness (GH)", extract: (i) => range(i.ghMin, i.ghMax, " dGH") },
    { key: "diet", label: "Diet", extract: (i) => str(i.diet) },
    { key: "temperament", label: "Temperament", extract: (i) => str(i.temperament) },
    { key: "waterZone", label: "Water zone", extract: (i) => str(i.waterZone) },
    { key: "schooling", label: "Schooling", extract: (i) => str(i.schooling) },
    { key: "difficulty", label: "Difficulty", extract: (i) => str(i.difficulty) },
  ],
  plant: [
    { key: "light", label: "Light", extract: (i) => str(i.light) },
    { key: "co2", label: "CO₂", extract: (i) => str(i.co2) },
    { key: "growth", label: "Growth rate", extract: (i) => str(i.growth) },
    { key: "difficulty", label: "Difficulty", extract: (i) => str(i.difficulty) },
    { key: "placement", label: "Placement", extract: (i) => str(i.placement) },
    { key: "temp", label: "Temperature", extract: (i) => range(i.tempMinC, i.tempMaxC, "°C") },
    { key: "ph", label: "pH range", extract: (i) => range(i.phMin, i.phMax) },
    { key: "propagation", label: "Propagation", extract: (i) => str(i.propagation) },
  ],
  coral: [
    { key: "light", label: "Light", extract: (i) => str(i.light) },
    { key: "flow", label: "Flow", extract: (i) => str(i.flow) },
    { key: "difficulty", label: "Difficulty", extract: (i) => str(i.difficulty) },
    { key: "placement", label: "Placement", extract: (i) => str(i.placement) },
    { key: "aggression", label: "Aggression", extract: (i) => str(i.aggression) },
    { key: "reefCompatibility", label: "Reef safe", extract: (i) => (i.reefCompatibility == null ? "" : i.reefCompatibility ? "Yes" : "No") },
    { key: "temp", label: "Temperature", extract: (i) => range(i.tempMinC, i.tempMaxC, "°C") },
  ],
  equipment: [
    { key: "category", label: "Category", extract: (i) => str(i.category) },
    { key: "brand", label: "Brand", extract: (i) => str(i.brand) },
    { key: "model", label: "Model", extract: (i) => str(i.model) },
    { key: "flowRateLh", label: "Flow rate", extract: (i) => str(i.flowRateLh) + " L/h" },
    { key: "powerW", label: "Power", extract: (i) => str(i.powerW) + " W" },
    { key: "tankSizeMaxL", label: "Max tank size", extract: (i) => str(i.tankSizeMaxL) + " L" },
  ],
}

export const MAX_COMPARE = 3
