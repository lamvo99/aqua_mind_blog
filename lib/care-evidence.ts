/**
 * SPEC 24 — evidence-aware care claim helpers.
 *
 * This module is deliberately framework-free so the same rules can be used by
 * Sanity-adjacent validation, the UI, the migration dry-run and unit tests.
 * It never resolves legacy `(E1)` markers and never invents sources.
 */

export const CONFIDENCE_LEVELS = ['HIGH', 'MEDIUM', 'LOW', 'UNVERIFIED'] as const
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number]

export const CARE_BASES = ['TARGET', 'TOLERANCE', 'OBSERVED', 'SINGLE_TARGET', 'UNKNOWN'] as const
export type CareBasis = (typeof CARE_BASES)[number]

export const CLAIM_STATES = [
  'VERIFIED',
  'UNVERIFIED',
  'NOT_APPLICABLE',
  'NOT_RESEARCHED',
  'NOT_REPORTED',
] as const
export type ClaimState = (typeof CLAIM_STATES)[number]

export const REVIEW_STATUSES = ['UNREVIEWED', 'IN_REVIEW', 'REVIEWED', 'NEEDS_REVIEW'] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]

export const GROWTH_RISKS = ['LOW', 'MODERATE', 'HIGH', 'UNKNOWN'] as const
export type GrowthRisk = (typeof GROWTH_RISKS)[number]

export const SOURCE_TYPES = [
  'PEER_REVIEWED',
  'AUTHORITATIVE_INSTITUTION',
  'VETERINARY_REFERENCE',
  'SCIENTIFIC_DATABASE',
  'SPECIALIST_REFERENCE',
  'MANUFACTURER',
  'ENCYCLOPEDIA',
  'HOBBYIST',
] as const
export type SourceType = (typeof SOURCE_TYPES)[number]

export const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export type Severity = (typeof SEVERITIES)[number]

export const TIME_SENSITIVITIES = ['MONITOR', 'ACT_SOON', 'ACT_NOW'] as const
export type TimeSensitivity = (typeof TIME_SENSITIVITIES)[number]

export const AFFECTED_TYPES = ['fish', 'plant', 'coral', 'invertebrate', 'equipment'] as const
export type AffectedType = (typeof AFFECTED_TYPES)[number]

export interface EvidenceSourceRecord {
  sourceId: string
  title: string
  author?: string
  publisher?: string
  url: string
  sourceType: SourceType
  publishedAt?: string
  updatedAt?: string
  accessedAt: string
  supportedClaimKeys: string[]
  limitations?: string
  reviewer?: string
}

export interface CareDisagreement {
  sourceId: string
  min?: number
  max?: number
  value?: string
  note?: string
}

export interface CareBasisEntry {
  claimKey: string
  basis: CareBasis
  note?: string
}

export interface CareConfidenceEntry {
  claimKey: string
  label?: string
  confidence: ConfidenceLevel
  state?: ClaimState
  sourceIds?: string[]
  displayValue?: string
  unit?: string
  note?: string
  disagreements?: CareDisagreement[]
}

export interface CareClaim {
  claimKey: string
  label: string
  basis: CareBasis
  confidence: ConfidenceLevel
  state: ClaimState
  sourceIds: string[]
  displayValue?: string
  unit?: string
  note?: string
  disagreements: CareDisagreement[]
}

export interface ReviewMetadata {
  lastReviewedAt?: string
  reviewStatus?: ReviewStatus | string
  reviewedBy?: string
}

export interface NumericCareRange {
  min?: number | null
  max?: number | null
  unit?: string | null
  basis?: CareBasis | string | null
}

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  PEER_REVIEWED: 'Peer-reviewed research',
  AUTHORITATIVE_INSTITUTION: 'Authoritative institution',
  VETERINARY_REFERENCE: 'Veterinary reference',
  SCIENTIFIC_DATABASE: 'Scientific database',
  SPECIALIST_REFERENCE: 'Specialist reference',
  MANUFACTURER: 'Manufacturer documentation',
  ENCYCLOPEDIA: 'Encyclopedia / tertiary summary',
  HOBBYIST: 'Hobbyist / supplementary',
}

const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  HIGH: 'High confidence',
  MEDIUM: 'Medium confidence',
  LOW: 'Low confidence',
  UNVERIFIED: 'Unverified',
}

const BASIS_LABELS: Record<CareBasis, string> = {
  TARGET: 'Target',
  TOLERANCE: 'Tolerance',
  OBSERVED: 'Observed',
  SINGLE_TARGET: 'Single target',
  UNKNOWN: 'Unknown basis',
}

const STATE_LABELS: Record<ClaimState, string> = {
  VERIFIED: 'Evidence supported',
  UNVERIFIED: 'Unverified',
  NOT_APPLICABLE: 'Not applicable',
  NOT_RESEARCHED: 'Not yet researched',
  NOT_REPORTED: 'Not reported',
}

const REVIEW_LABELS: Record<ReviewStatus, string> = {
  UNREVIEWED: 'Not yet reviewed',
  IN_REVIEW: 'Draft / in review',
  REVIEWED: 'Reviewed',
  NEEDS_REVIEW: 'Needs review',
}

const CLAIM_ORDER = [
  'temperature',
  'temperatureTolerance',
  'salinity',
  'ph',
  'alkalinity',
  'calcium',
  'magnesium',
  'nitrate',
  'phosphate',
  'par',
  'flow',
  'placement',
  'growthRisk',
  'reefSafety',
  'difficulty',
]

export function confidenceLabel(value: string): string {
  return CONFIDENCE_LABELS[value as ConfidenceLevel] || value
}

export function basisLabel(value: string): string {
  return BASIS_LABELS[value as CareBasis] || value
}

export function claimStateLabel(value: string): string {
  return STATE_LABELS[value as ClaimState] || value
}

export function reviewStatusLabel(value: string): string {
  return REVIEW_LABELS[value as ReviewStatus] || value
}

export function sourceTypeLabel(value: string): string {
  return SOURCE_TYPE_LABELS[value as SourceType] || value
}

export function humanizeClaimKey(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function isAbsoluteHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() !== value || value.length === 0) return false
  if (!/^https?:\/\//i.test(value)) return false
  try {
    const parsed = new URL(value)
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.length > 0
  } catch {
    return false
  }
}

export function validateEvidenceSource(source: Partial<EvidenceSourceRecord>): string[] {
  const issues: string[] = []
  if (!source.sourceId || !/^S\d+$/.test(source.sourceId)) issues.push('sourceId must match the stable S<number> format')
  if (!source.title || source.title.trim().length === 0) issues.push('title is required')
  if (!isAbsoluteHttpUrl(source.url)) issues.push('url must be an absolute http(s) URL')
  if (!source.sourceType || !SOURCE_TYPES.includes(source.sourceType as SourceType)) issues.push('sourceType is required and must be a known value')
  if (!source.accessedAt) issues.push('accessedAt is required for a reviewed source')
  if (!Array.isArray(source.supportedClaimKeys) || source.supportedClaimKeys.length === 0) {
    issues.push('supportedClaimKeys must contain at least one claim key')
  }
  return issues
}

export function validateCareEvidence(
  input: {
    careBasis?: CareBasisEntry[] | null
    careConfidence?: CareConfidenceEntry[] | null
    evidenceSources?: EvidenceSourceRecord[] | null
  },
  registry?: EvidenceSourceRecord[]
): string[] {
  const issues: string[] = []
  const sources = registry || input.evidenceSources || []
  const sourcesById = new Map(sources.map((source) => [source.sourceId, source]))
  const basisByKey = new Map<string, CareBasisEntry>()

  for (const entry of input.careBasis || []) {
    if (!entry.claimKey) issues.push('careBasis entry is missing claimKey')
    if (!CARE_BASES.includes(entry.basis)) issues.push(`careBasis.${entry.claimKey} has an invalid basis`)
    if (basisByKey.has(entry.claimKey)) issues.push(`careBasis.${entry.claimKey} is duplicated`)
    basisByKey.set(entry.claimKey, entry)
  }

  const seen = new Set<string>()
  for (const claim of input.careConfidence || []) {
    if (!claim.claimKey) issues.push('careConfidence entry is missing claimKey')
    if (seen.has(claim.claimKey)) issues.push(`careConfidence.${claim.claimKey} is duplicated`)
    seen.add(claim.claimKey)
    if (!CONFIDENCE_LEVELS.includes(claim.confidence)) {
      issues.push(`careConfidence.${claim.claimKey} has an invalid confidence`)
    }
    if (claim.state && !CLAIM_STATES.includes(claim.state)) {
      issues.push(`careConfidence.${claim.claimKey} has an invalid state`)
    }
    if (claim.state === 'VERIFIED' && claim.confidence === 'UNVERIFIED') {
      issues.push(`careConfidence.${claim.claimKey} cannot be VERIFIED with UNVERIFIED confidence`)
    }
    const sourceIds = claim.sourceIds || []
    if (claim.confidence === 'HIGH' && sourceIds.length === 0) {
      issues.push(`careConfidence.${claim.claimKey} has HIGH confidence without a source`)
    }
    if (!basisByKey.has(claim.claimKey)) {
      issues.push(`careConfidence.${claim.claimKey} has no matching careBasis entry`)
    }
    for (const sourceId of sourceIds) {
      const source = sourcesById.get(sourceId)
      if (!source) {
        issues.push(`careConfidence.${claim.claimKey} cites unknown source ${sourceId}`)
        continue
      }
      if (!source.supportedClaimKeys.includes(claim.claimKey) && !source.supportedClaimKeys.includes('*')) {
        issues.push(`source ${sourceId} does not declare support for claim ${claim.claimKey}`)
      }
    }
    for (const disagreement of claim.disagreements || []) {
      if (disagreement.min != null && disagreement.max != null && disagreement.min > disagreement.max) {
        issues.push(`careConfidence.${claim.claimKey} disagreement ${disagreement.sourceId} has min > max`)
      }
    }
  }

  return issues
}

export function validateNumericCareRange(range: NumericCareRange, claimKey = 'value'): string[] {
  const issues: string[] = []
  const hasMin = range.min != null
  const hasMax = range.max != null
  if (!hasMin && !hasMax) return issues
  if (!range.unit) issues.push(`${claimKey} has a numeric value but no unit`)
  if (!range.basis) issues.push(`${claimKey} has a numeric value but no basis`)
  if (hasMin && hasMax && Number(range.min) > Number(range.max)) {
    issues.push(`${claimKey} min must be less than or equal to max`)
  }
  return issues
}

export function validateNotRecommendedContradiction(
  suitabilityConditions?: string | null,
  notRecommendedFor?: string[] | null
): string[] {
  if (!suitabilityConditions || !notRecommendedFor || notRecommendedFor.length === 0) return []
  const normalized = suitabilityConditions.toLowerCase()
  const issues: string[] = []
  for (const item of notRecommendedFor) {
    const value = item.trim().toLowerCase()
    if (value.length >= 4 && normalized.includes(value)) {
      issues.push(`notRecommendedFor "${item}" also appears inside suitabilityConditions; review the contradiction`)
    }
  }
  return issues
}

export function buildCareClaims(input: {
  careBasis?: CareBasisEntry[] | null
  careConfidence?: CareConfidenceEntry[] | null
}): CareClaim[] {
  const basisByKey = new Map((input.careBasis || []).map((entry) => [entry.claimKey, entry]))
  const claims = (input.careConfidence || []).map((entry) => {
    const basis = basisByKey.get(entry.claimKey)?.basis || 'UNKNOWN'
    const state: ClaimState =
      entry.state || (entry.confidence === 'UNVERIFIED' ? 'UNVERIFIED' : 'VERIFIED')
    return {
      claimKey: entry.claimKey,
      label: entry.label || humanizeClaimKey(entry.claimKey),
      basis,
      confidence: entry.confidence,
      state,
      sourceIds: entry.sourceIds || [],
      displayValue: entry.displayValue,
      unit: entry.unit,
      note: entry.note,
      disagreements: entry.disagreements || [],
    }
  })
  return claims.sort((a, b) => {
    const ai = CLAIM_ORDER.indexOf(a.claimKey)
    const bi = CLAIM_ORDER.indexOf(b.claimKey)
    if (ai === -1 && bi === -1) return a.label.localeCompare(b.label)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

export function formatClaimValue(claim: CareClaim): string {
  if (claim.displayValue) return claim.displayValue
  return ''
}

export function resolveSources(
  sourceIds: string[] | null | undefined,
  sources: EvidenceSourceRecord[] | null | undefined
): EvidenceSourceRecord[] {
  const byId = new Map((sources || []).map((source) => [source.sourceId, source]))
  return (sourceIds || []).map((id) => byId.get(id)).filter((source): source is EvidenceSourceRecord => !!source)
}

export function sourceDisplayTitle(source: EvidenceSourceRecord): string {
  const publisher = source.publisher || source.author
  return publisher && !source.title.includes(publisher) ? `${source.title} — ${publisher}` : source.title
}

export function formatDisagreement(disagreement: CareDisagreement, sources: EvidenceSourceRecord[]): string {
  const source = sources.find((item) => item.sourceId === disagreement.sourceId)
  const label = source ? sourceDisplayTitle(source) : disagreement.sourceId
  if (disagreement.value) return `${label}: ${disagreement.value}`
  if (disagreement.min != null && disagreement.max != null) return `${label}: ${disagreement.min}–${disagreement.max}`
  if (disagreement.min != null) return `${label}: ≥ ${disagreement.min}`
  if (disagreement.max != null) return `${label}: ≤ ${disagreement.max}`
  return label
}

export function getReviewBadge(meta: ReviewMetadata): { show: boolean; label: string; detail?: string } {
  if (meta.reviewStatus === 'REVIEWED' && !!meta.lastReviewedAt) {
    return { show: true, label: 'Reviewed', detail: meta.lastReviewedAt }
  }
  const label = meta.reviewStatus ? reviewStatusLabel(meta.reviewStatus) : 'Not yet reviewed'
  return { show: false, label, detail: meta.lastReviewedAt }
}

export function hasRealReview(meta: ReviewMetadata): boolean {
  return meta.reviewStatus === 'REVIEWED' && !!meta.lastReviewedAt
}

export const HIGH_RISK_CLAIM_KEYS = new Set([
  'temperature',
  'temperatureTolerance',
  'salinity',
  'ph',
  'alkalinity',
  'calcium',
  'magnesium',
  'nitrate',
  'phosphate',
  'par',
  'flow',
  'growthRisk',
  'reefSafety',
  'difficulty',
  'treatment',
  'escalation',
  'severity',
  'timeSensitivity',
])

export interface PublishClosureInput {
  recordId?: string
  claims?: CareConfidenceEntry[] | null
  careBasis?: CareBasisEntry[] | null
  evidenceSources?: EvidenceSourceRecord[] | null
  registry?: EvidenceSourceRecord[] | null
  review?: ReviewMetadata
  requireHighRiskReview?: boolean
}

/**
 * Pre-publish closure gate. It is stricter than the editor-level validator:
 * it requires a unique registry, a record-level source list containing every
 * cited source, claim-key support, and (optionally) a named review for any
 * high-risk claim that is presented as verified.
 */
export function validatePublishClosure(input: PublishClosureInput): string[] {
  const prefix = input.recordId ? `${input.recordId}: ` : ''
  const issues: string[] = []
  const registry = input.registry || []
  const recordSources = input.evidenceSources || []
  const claims = input.claims || []

  const registryIds = new Set<string>()
  for (const source of registry) {
    for (const issue of validateEvidenceSource(source)) issues.push(`${prefix}registry ${source.sourceId || '?'}: ${issue}`)
    if (registryIds.has(source.sourceId)) issues.push(`${prefix}duplicate registry sourceId ${source.sourceId}`)
    registryIds.add(source.sourceId)
  }

  const recordSourceIds = new Set<string>()
  for (const source of recordSources) {
    if (recordSourceIds.has(source.sourceId)) {
      issues.push(`${prefix}duplicate record evidenceSource ${source.sourceId}`)
    }
    recordSourceIds.add(source.sourceId)
    if (!registryIds.has(source.sourceId)) {
      issues.push(`${prefix}record evidenceSource ${source.sourceId} is missing from the registry`)
    }
  }

  const registryById = new Map(registry.map((source) => [source.sourceId, source]))
  for (const claim of claims) {
    if (!CONFIDENCE_LEVELS.includes(claim.confidence)) {
      issues.push(`${prefix}${claim.claimKey}: invalid confidence`)
    }
    if (claim.state === 'VERIFIED' && claim.confidence === 'UNVERIFIED') {
      issues.push(`${prefix}${claim.claimKey}: VERIFIED with UNVERIFIED confidence`)
    }
    const sourceIds = claim.sourceIds || []
    if (claim.confidence === 'HIGH' && sourceIds.length === 0) {
      issues.push(`${prefix}${claim.claimKey}: HIGH confidence without a source`)
    }
    for (const sourceId of sourceIds) {
      if (!recordSourceIds.has(sourceId)) {
        issues.push(`${prefix}${claim.claimKey}: cited source ${sourceId} is not listed on the record`)
      }
      const source = registryById.get(sourceId)
      if (!source) {
        issues.push(`${prefix}${claim.claimKey}: cited source ${sourceId} is missing from the registry`)
        continue
      }
      if (!source.supportedClaimKeys.includes(claim.claimKey) && !source.supportedClaimKeys.includes('*')) {
        issues.push(`${prefix}${claim.claimKey}: source ${sourceId} does not declare support for this claim`)
      }
    }
    if (
      input.requireHighRiskReview &&
      HIGH_RISK_CLAIM_KEYS.has(claim.claimKey) &&
      (claim.state === 'VERIFIED' || claim.confidence === 'HIGH')
    ) {
      const review = input.review || {}
      if (!hasRealReview(review)) {
        issues.push(`${prefix}${claim.claimKey}: high-risk verified claim has no real review date/status`)
      }
      if (!review.reviewedBy) {
        issues.push(`${prefix}${claim.claimKey}: high-risk verified claim has no named reviewer`)
      }
    }
  }

  return issues
}
