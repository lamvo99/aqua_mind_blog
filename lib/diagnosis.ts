export interface SymptomOption {
  id: string
  label: string
  keywords: string[]
}

export interface ProblemForDiagnosis {
  _id: string
  _type: string
  title: string
  slug: { current: string }
  category?: string
  excerpt?: string
  symptomsText?: string
}

export interface DiagnosisMatch {
  problem: ProblemForDiagnosis
  matched: string[]
  score: number
}

export const SYMPTOM_OPTIONS: SymptomOption[] = [
  { id: "fins", label: "Frayed, ragged or discolored fins", keywords: ["frayed", "ragged", "disintegrating", "fins", "margins"] },
  { id: "spots", label: "White or fuzzy spots on body or fins", keywords: ["white dots", "white spot", "fuzzy", "ich", "dots"] },
  { id: "gasping", label: "Fish gasping or gulping at the surface", keywords: ["gasping", "gulping", "surface"] },
  { id: "breathing", label: "Rapid gill movement or heavy breathing", keywords: ["rapid", "breathing", "gill"] },
  { id: "lethargy", label: "Lethargy, low activity, refusing food", keywords: ["letharg", "refusing food", "appetite", "listlessness"] },
  { id: "clamped", label: "Clamped fins", keywords: ["clamped"] },
  { id: "flashing", label: "Flashing or rubbing against decor", keywords: ["flash", "rubbing"] },
  { id: "bloat", label: "Swollen belly or pinecone scales", keywords: ["swollen", "pinecone", "bloat"] },
  { id: "cloudy", label: "Cloudy or hazy water", keywords: ["cloudy", "haze", "hazy"] },
  { id: "greenwater", label: "Water turned green (pea soup)", keywords: ["pea-soup", "green water", "colored"] },
  { id: "algae", label: "Algae growth on plants, glass or decor", keywords: ["algae", "strands", "tufts", "patches", "slime", "film", "hair-like", "diatom"] },
  { id: "smell", label: "Foul, musty or earthy smell", keywords: ["musty", "earthy", "smell", "biofilm"] },
  { id: "leaves", label: "Yellowing, pinholes or melting leaves", keywords: ["yellowing", "pinholes", "translucent", "melting", "stunted", "twisted"] },
  { id: "hiding", label: "Fish hiding or staying behind decor", keywords: ["hiding", "behind decor"] },
  { id: "postwc", label: "Symptoms appeared after a water change", keywords: ["water change", "darting"] },
  { id: "flow", label: "Weak filter output or debris settling", keywords: ["flow", "debris", "dead zones"] },
]

function matches(symptom: SymptomOption, text: string): boolean {
  return symptom.keywords.some((k) => text.includes(k))
}

export function diagnoseProblems(
  problems: ProblemForDiagnosis[],
  selected: string[]
): DiagnosisMatch[] {
  const sel = SYMPTOM_OPTIONS.filter((s) => selected.includes(s.id))
  if (sel.length === 0) return []
  const results: DiagnosisMatch[] = []
  for (const problem of problems) {
    const text = ` ${(problem.symptomsText || "").toLowerCase()} `
    const matched = sel.filter((s) => matches(s, text)).map((s) => s.id)
    if (matched.length === 0) continue
    results.push({
      problem,
      matched,
      score: Math.round((matched.length / sel.length) * 100),
    })
  }
  return results.sort((a, b) => b.score - a.score || b.matched.length - a.matched.length)
}
