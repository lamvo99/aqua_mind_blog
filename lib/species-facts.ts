export const SPACE_LABELS: Record<string, string> = {
  NONE: 'None',
  LOW: 'Low',
  MODERATE: 'Moderate',
  HIGH: 'High',
}

export const LID_LABELS: Record<string, string> = {
  NOT_REQUIRED: 'Not required',
  RECOMMENDED: 'Recommended',
  ESSENTIAL: 'Essential',
}

export const FLOW_LABELS: Record<string, string> = {
  STILL: 'Still / low',
  MODERATE: 'Moderate',
  STRONG: 'Strong',
}

export const OXYGEN_LABELS: Record<string, string> = {
  NEUTRAL: 'Standard demand',
  SENSITIVE: 'Sensitive — needs good aeration',
}

export const MATURITY_LABELS: Record<string, string> = {
  NONE: 'Not required',
  SUGGESTED: 'Suggested',
  REQUIRED: 'Required',
}

export const LEVEL_LABELS: Record<string, string> = {
  LOW: 'Low',
  MODERATE: 'Moderate',
  HIGH: 'High',
}

export const COMMUNITY_LABELS: Record<string, string> = {
  UNSUITABLE: 'Not suitable',
  CONDITIONAL: 'Conditional',
  SUITABLE: 'Suitable',
}

export const REEF_INTERACTION_LABELS: Record<string, string> = {
  REEF_SAFE: 'Reef safe',
  CAUTION: 'Use with caution',
  SPECIES_DEPENDENT: 'Species dependent',
  NOT_REEF_SAFE: 'Not reef safe',
}

export const PREDATES_INVERTS_LABELS: Record<string, string> = {
  NONE: 'No',
  POSSIBLE: 'Possible',
  LIKELY: 'Likely',
}

export const BREEDING_LABELS: Record<string, string> = {
  EASY: 'Easy',
  MODERATE: 'Moderate',
  DIFFICULT: 'Difficult',
}

export interface SpeciesHusbandryInput {
  minTankLengthCm?: number | null
  minTankWidthCm?: number | null
  swimmingSpace?: string | null
  jumpRisk?: string | null
  lidRequired?: string | null
  flowPreference?: string | null
  oxygenSensitivity?: string | null
  maturityRequirement?: string | null
  bioload?: string | null
  waterChangeSensitivity?: string | null
  khMin?: number | null
  khMax?: number | null
  salinityMin?: number | null
  salinityMax?: number | null
  behaviorFlags?: string[] | null
  groupSize?: { min?: number | null; max?: number | null } | null
  communitySuitability?: string | null
  reefInteraction?: string | null
  predatesInverts?: string | null
  breedingDifficulty?: string | null
  waterType?: string | null
}

export interface Fact {
  label: string
  value: string
}

export interface FactGroup {
  title: string
  facts: Fact[]
}

export function formatRange(min?: number | null, max?: number | null, unit = ''): string | null {
  const hasMin = min !== null && min !== undefined
  const hasMax = max !== null && max !== undefined
  if (!hasMin && !hasMax) return null
  if (hasMin && hasMax) return `${min}\u2013${max}${unit}`
  return `${hasMin ? min : max}${unit}`
}

export function formatGroupSize(group?: { min?: number | null; max?: number | null } | null): string | null {
  if (!group) return null
  const hasMin = group.min !== null && group.min !== undefined
  const hasMax = group.max !== null && group.max !== undefined
  if (!hasMin && !hasMax) return null
  if (hasMin && hasMax) return `${group.min}\u2013${group.max}`
  if (hasMin) return `${group.min}+`
  return `up to ${group.max}`
}

export function humanizeFlag(flag: string): string {
  const words = String(flag).replace(/[-_]+/g, ' ').trim()
  if (!words) return ''
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function labelOf(map: Record<string, string>, value?: string | null): string | null {
  if (value === null || value === undefined || value === '') return null
  return map[value] || String(value)
}

function push(facts: Fact[], label: string, value: string | null) {
  if (value === null || value === undefined || value === '') return
  facts.push({ label, value })
}

function isMarine(waterType?: string | null): boolean {
  return waterType === 'saltwater' || waterType === 'brackish'
}

export function buildHusbandryFacts(item: SpeciesHusbandryInput): FactGroup[] {
  const space: Fact[] = []
  push(space, 'Min tank length', item.minTankLengthCm != null ? `${item.minTankLengthCm} cm` : null)
  push(space, 'Min tank width', item.minTankWidthCm != null ? `${item.minTankWidthCm} cm` : null)
  push(space, 'Swimming space', labelOf(SPACE_LABELS, item.swimmingSpace))
  push(space, 'Jump risk', labelOf(SPACE_LABELS, item.jumpRisk))
  push(space, 'Lid', labelOf(LID_LABELS, item.lidRequired))
  push(space, 'Flow', labelOf(FLOW_LABELS, item.flowPreference))
  push(space, 'Oxygen', labelOf(OXYGEN_LABELS, item.oxygenSensitivity))

  const water: Fact[] = []
  push(water, 'KH', formatRange(item.khMin, item.khMax, ' dKH'))
  const salinity = formatRange(item.salinityMin, item.salinityMax, ' ppt')
  if (salinity && (isMarine(item.waterType) || item.salinityMin != null || item.salinityMax != null)) push(water, 'Salinity', salinity)
  push(water, 'Mature aquarium', labelOf(MATURITY_LABELS, item.maturityRequirement))
  push(water, 'Bioload', labelOf(LEVEL_LABELS, item.bioload))
  push(water, 'Water-change sensitivity', labelOf(LEVEL_LABELS, item.waterChangeSensitivity))

  const behavior: Fact[] = []
  if (Array.isArray(item.behaviorFlags) && item.behaviorFlags.length > 0) {
    const flags = item.behaviorFlags.map(humanizeFlag).filter((f) => f !== '')
    if (flags.length > 0) push(behavior, 'Behavior', flags.join(', '))
  }
  push(behavior, 'Group size', formatGroupSize(item.groupSize))
  push(behavior, 'Community', labelOf(COMMUNITY_LABELS, item.communitySuitability))
  push(behavior, 'Reef interaction', labelOf(REEF_INTERACTION_LABELS, item.reefInteraction))
  push(behavior, 'Predates inverts', labelOf(PREDATES_INVERTS_LABELS, item.predatesInverts))
  push(behavior, 'Breeding', labelOf(BREEDING_LABELS, item.breedingDifficulty))

  const groups: FactGroup[] = [
    { title: 'Space & footprint', facts: space },
    { title: 'Water & maintenance', facts: water },
    { title: 'Behavior & social', facts: behavior },
  ]
  return groups.filter((g) => g.facts.length > 0)
}

export const KNOWLEDGE_BODY_SECTIONS: { key: string; title: string }[] = [
  { key: 'overview', title: 'Overview' },
  { key: 'adultSizeGrowth', title: 'Adult Size & Growth' },
  { key: 'behavior', title: 'Behavior' },
  { key: 'tankRequirements', title: 'Tank Requirements' },
  { key: 'swimmingSpaceFootprint', title: 'Swimming Space & Footprint' },
  { key: 'waterParameters', title: 'Water Parameters' },
  { key: 'feeding', title: 'Feeding' },
  { key: 'compatibility', title: 'Compatibility' },
  { key: 'specialRequirements', title: 'Special Requirements' },
  { key: 'commonProblems', title: 'Common Problems' },
  { key: 'breeding', title: 'Breeding' },
  { key: 'practicalVerdict', title: 'Practical Verdict' },
]

export function knowledgeBodySections(
  body?: Record<string, any[]> | null,
): { title: string; blocks: any[] }[] {
  if (!body || typeof body !== 'object') return []
  const known = new Set(KNOWLEDGE_BODY_SECTIONS.map((s) => s.key))
  const out: { title: string; blocks: any[] }[] = []
  for (const s of KNOWLEDGE_BODY_SECTIONS) {
    const blocks = body[s.key]
    if (Array.isArray(blocks) && blocks.length > 0) out.push({ title: s.title, blocks })
  }
  for (const key of Object.keys(body)) {
    if (key === '_type' || known.has(key)) continue
    const blocks = body[key]
    if (Array.isArray(blocks) && blocks.length > 0) out.push({ title: humanizeFlag(key), blocks })
  }
  return out
}

export function compatibleSpeciesRefs<T>(entries?: any[] | null): T[] {
  if (!Array.isArray(entries)) return []
  return entries
    .map((e) => (e && typeof e === 'object' && 'ref' in e ? e.ref : e))
    .filter((e): e is T => Boolean(e))
}
