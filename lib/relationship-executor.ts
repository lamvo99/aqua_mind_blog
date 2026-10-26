import { isRelationshipField } from './relationship-plan'

export type ApplyDecision = 'APPLY' | 'SKIP_ALREADY_PRESENT' | 'HOLD_EXISTING_ENTRY_CONFLICT' | 'REJECT_NON_RELATIONSHIP_PATH'

export interface PlannedEntry {
  ref: string
  conditions?: string[] | null
  confidence?: string | null
  evidenceNote?: string | null
}

export interface ExistingEntry {
  _key?: string
  _type?: string
  ref?: { _ref?: string } | string | null
  conditions?: string[] | null
  confidence?: string | null
  evidenceNote?: string | null
}

/** The only relationship path SPEC 12B is permitted to write. Never broaden this. */
export const SPEC_12B_ALLOWED_PATHS = ['compatibleSpecies'] as const

export function isAllowedWritePath(sourceType: string, path: string): boolean {
  return (SPEC_12B_ALLOWED_PATHS as readonly string[]).includes(path) && isRelationshipField(sourceType, path)
}

export function assertWriteAllowed(sourceType: string, path: string): void {
  if (!isAllowedWritePath(sourceType, path)) {
    throw new Error(`SPEC 12B refuses to write non-allowlisted path: ${sourceType}.${path}`)
  }
}

export function entryRefOf(entry: ExistingEntry | null | undefined): string | null {
  if (entry == null) return null
  const r = entry.ref
  if (r == null) return null
  if (typeof r === 'object') return r._ref ?? null
  return String(r)
}

export function entryShapeOf(entry: ExistingEntry | null | undefined): string {
  return JSON.stringify({
    conditions: entry?.conditions ?? null,
    confidence: entry?.confidence ?? null,
    evidenceNote: entry?.evidenceNote ?? null,
  })
}

export function buildEntry(candidateId: string, targetId: string, fields: Omit<PlannedEntry, 'ref'>): ExistingEntry {
  return {
    _key: 'rel' + candidateId.replace(/[^a-zA-Z0-9]/g, '').slice(-10),
    _type: 'compatibleEntry',
    ref: { _ref: targetId },
    conditions: fields.conditions ?? null,
    confidence: fields.confidence ?? null,
    evidenceNote: fields.evidenceNote ?? null,
  }
}

export function decideApply(existing: ExistingEntry[], planned: PlannedEntry, sourceType = 'species', path = 'compatibleSpecies'): ApplyDecision {
  if (!isAllowedWritePath(sourceType, path)) return 'REJECT_NON_RELATIONSHIP_PATH'
  const sameRef = existing.filter((e) => entryRefOf(e) === planned.ref)
  if (sameRef.some((e) => entryShapeOf(e) === entryShapeOf(planned))) return 'SKIP_ALREADY_PRESENT'
  if (sameRef.length > 0) return 'HOLD_EXISTING_ENTRY_CONFLICT'
  return 'APPLY'
}

/** Pure add-if-absent: returns a new array with the entry appended only when decision === APPLY. */
export function applyAddIfAbsent(existing: ExistingEntry[], planned: PlannedEntry, sourceType = 'species', path = 'compatibleSpecies'): { decision: ApplyDecision; changed: boolean; next: ExistingEntry[] } {
  const decision = decideApply(existing, planned, sourceType, path)
  if (decision !== 'APPLY') return { decision, changed: false, next: existing }
  return { decision, changed: true, next: [...existing, planned as ExistingEntry] }
}
