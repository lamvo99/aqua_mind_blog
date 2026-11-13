import type {
  CareConfidenceEntry,
  EvidenceSourceRecord,
  ReviewStatus,
  Severity,
  TimeSensitivity,
} from './care-evidence'
import { hasRealReview } from './care-evidence'

export const TRIAGE_SECTION_ORDER = [
  { key: 'symptoms', label: 'Symptoms', description: 'Observable signs' },
  { key: 'immediateAction', label: 'Immediate actions', description: 'Safe, reversible first steps' },
  { key: 'whatToCheck', label: 'What to check', description: 'Measurements and observations' },
  { key: 'causes', label: 'Possible causes', description: 'Qualified possibilities, not a diagnosis' },
  { key: 'whatNotToDo', label: 'What not to do', description: 'Actions that can make it worse' },
  { key: 'howToDistinguish', label: 'How to distinguish', description: 'Differential clues' },
  { key: 'treatment', label: 'Treatment / correction', description: 'Only where evidence supports it' },
  { key: 'recovery', label: 'Recovery', description: 'What improvement looks like' },
  { key: 'monitoring', label: 'Monitoring', description: 'What to measure and when' },
  { key: 'escalation', label: 'Escalation / when to seek help', description: 'Problem-specific warning signs' },
  { key: 'prevention', label: 'Prevention', description: 'Reduce recurrence risk' },
] as const

export type TriageSectionKey = (typeof TRIAGE_SECTION_ORDER)[number]['key']

export type TriageCoverageState =
  | 'REVIEWED'
  | 'DRAFT_IN_REVIEW'
  | 'NOT_YET_RESEARCHED'
  | 'NOT_APPLICABLE'
  | 'NOT_YET_VERIFIED'

export interface TriageCoverageEntry {
  key: TriageSectionKey
  label: string
  state: TriageCoverageState
  note?: string
}

export interface ProblemTriageDraft {
  slug: string
  title: string
  category: string
  tags?: string[]
  affectedTypes?: string[]
  severity?: Severity
  timeSensitivity?: TimeSensitivity
  whenToSeekHelp?: string
  symptoms?: any[]
  immediateAction?: any[]
  whatToCheck?: any[]
  causes?: any[]
  whatNotToDo?: any[]
  howToDistinguish?: any[]
  treatment?: any[]
  recovery?: any[]
  monitoring?: any[]
  escalation?: any[]
  prevention?: any[]
  evidenceSources?: EvidenceSourceRecord[]
  claimConfidence?: CareConfidenceEntry[]
  lastReviewedAt?: string
  reviewStatus?: ReviewStatus
  notYetVerifiedSections?: TriageSectionKey[]
  notApplicableSections?: TriageSectionKey[]
  coverageNotes?: Partial<Record<TriageSectionKey | 'severity' | 'timeSensitivity', string>>
}

const COVERAGE_LABELS: Record<TriageCoverageState, string> = {
  REVIEWED: 'Content available and reviewed',
  DRAFT_IN_REVIEW: 'Draft / in review',
  NOT_YET_RESEARCHED: 'Not yet researched',
  NOT_APPLICABLE: 'Not applicable',
  NOT_YET_VERIFIED: 'Not yet verified',
}

export function triageCoverageLabel(state: TriageCoverageState): string {
  return COVERAGE_LABELS[state]
}

export function hasBlocks(value: unknown): value is any[] {
  return Array.isArray(value) && value.length > 0
}

export function deriveTriageCoverage(record: ProblemTriageDraft): TriageCoverageEntry[] {
  const reviewed = hasRealReview({ reviewStatus: record.reviewStatus, lastReviewedAt: record.lastReviewedAt })
  return TRIAGE_SECTION_ORDER.map((section) => {
    const value = record[section.key]
    let state: TriageCoverageState
    if (hasBlocks(value)) {
      state = reviewed ? 'REVIEWED' : 'DRAFT_IN_REVIEW'
    } else if (record.notApplicableSections?.includes(section.key)) {
      state = 'NOT_APPLICABLE'
    } else if (record.notYetVerifiedSections?.includes(section.key)) {
      state = 'NOT_YET_VERIFIED'
    } else if (section.key === 'treatment') {
      // Treatment is never implied by absence; it is explicitly not verified.
      state = 'NOT_YET_VERIFIED'
    } else {
      state = 'NOT_YET_RESEARCHED'
    }
    return {
      key: section.key,
      label: section.label,
      state,
      note: record.coverageNotes?.[section.key],
    }
  })
}

export function textToBlocks(text: string, keyPrefix = 'spec24'): any[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => ({
      _type: 'block',
      _key: `${keyPrefix}-${index}`,
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: `${keyPrefix}-${index}-span`, text: paragraph, marks: [] }],
    }))
}

export function validateTriageSafety(record: ProblemTriageDraft): string[] {
  const issues: string[] = []
  if (record.severity === 'CRITICAL' || record.timeSensitivity === 'ACT_NOW') {
    if (!hasBlocks(record.escalation) && !record.whenToSeekHelp) {
      issues.push(`${record.slug}: CRITICAL/ACT_NOW requires escalation or whenToSeekHelp`)
    }
  }
  const highUrgency =
    record.severity === 'HIGH' ||
    record.severity === 'CRITICAL' ||
    record.timeSensitivity === 'ACT_SOON' ||
    record.timeSensitivity === 'ACT_NOW'
  if (highUrgency && !hasRealReview({ reviewStatus: record.reviewStatus, lastReviewedAt: record.lastReviewedAt })) {
    if (!record.coverageNotes?.severity && !record.coverageNotes?.timeSensitivity) {
      issues.push(`${record.slug}: draft high urgency requires a severity or time-sensitivity coverage note`)
    }
  }
  const treatmentText = JSON.stringify(record.treatment || [])
  if (/\b(dose|dosage|dosing|antibiotic|copper sulfate|formalin|malachite)\b/i.test(treatmentText)) {
    issues.push(`${record.slug}: treatment contains medication/dosage language without review`)
  }
  return issues
}

export const TRIAGE_DISCLAIMER =
  'This is general guidance, not a definitive diagnosis. Measure before changing anything, and seek qualified aquatic or veterinary help for severe or spreading disease.'
