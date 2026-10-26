export interface RelFieldSpec {
  kind: 'refArray' | 'objectArray' | 'ref'
  targets: string[]
  entryRef?: string
}

export const RELATIONSHIP_FIELDS: Record<string, Record<string, RelFieldSpec>> = {
  species: {
    compatibleSpecies: { kind: 'objectArray', targets: ['species'], entryRef: 'ref' },
    compatiblePlants: { kind: 'refArray', targets: ['plant'] },
    compatibleInvertebrates: { kind: 'refArray', targets: ['invertebrate'] },
    suitableEquipment: { kind: 'refArray', targets: ['equipment'] },
    relatedProblems: { kind: 'refArray', targets: ['problem'] },
    relatedPosts: { kind: 'refArray', targets: ['post'] },
    incompatibleSpecies: { kind: 'objectArray', targets: ['species'], entryRef: 'ref' },
    predatorPrey: { kind: 'objectArray', targets: ['species', 'invertebrate'], entryRef: 'ref' },
    reefInteractionDetail: { kind: 'objectArray', targets: ['coral'], entryRef: 'coral' },
    parentSpecies: { kind: 'ref', targets: ['species'] },
  },
  plant: {
    suitableEquipment: { kind: 'refArray', targets: ['equipment'] },
    relatedProblems: { kind: 'refArray', targets: ['problem'] },
    relatedPosts: { kind: 'refArray', targets: ['post'] },
  },
  invertebrate: {
    compatibleSpecies: { kind: 'objectArray', targets: ['species'], entryRef: 'ref' },
    suitableEquipment: { kind: 'refArray', targets: ['equipment'] },
    relatedProblems: { kind: 'refArray', targets: ['problem'] },
    relatedPosts: { kind: 'refArray', targets: ['post'] },
    predatorPrey: { kind: 'objectArray', targets: ['species', 'invertebrate'], entryRef: 'ref' },
    parentSpecies: { kind: 'ref', targets: ['species'] },
  },
  coral: {
    suitableEquipment: { kind: 'refArray', targets: ['equipment'] },
    relatedProblems: { kind: 'refArray', targets: ['problem'] },
    relatedPosts: { kind: 'refArray', targets: ['post'] },
    coralNeighbors: { kind: 'objectArray', targets: ['coral'], entryRef: 'ref' },
  },
  equipment: {
    compatibleEquipment: { kind: 'refArray', targets: ['equipment'] },
    relatedProblems: { kind: 'refArray', targets: ['problem'] },
    relatedPosts: { kind: 'refArray', targets: ['post'] },
  },
  problem: {
    relatedTools: { kind: 'refArray', targets: ['tool'] },
    relatedPosts: { kind: 'refArray', targets: ['post'] },
  },
}

export interface RelOperation {
  candidateId: string
  sourceType: string
  sourceId: string
  field: string
  op: 'add'
  targetId: string
}

export interface ValidationResult {
  ok: boolean
  errors: string[]
}

const NON_RELATIONSHIP_SAFE = new Set<string>()

export function isRelationshipField(sourceType: string, field: string): boolean {
  return Boolean(RELATIONSHIP_FIELDS[sourceType]?.[field])
}

export function fieldSpec(sourceType: string, field: string): RelFieldSpec | null {
  return RELATIONSHIP_FIELDS[sourceType]?.[field] ?? null
}

export function allowedTargets(sourceType: string, field: string): string[] {
  return fieldSpec(sourceType, field)?.targets ?? []
}

export function validateOperation(op: RelOperation, recordById: Record<string, string>): ValidationResult {
  const errors: string[] = []
  const spec = fieldSpec(op.sourceType, op.field)
  if (!spec) {
    errors.push(`field "${op.field}" is not a relationship field on "${op.sourceType}" (non-relationship path rejected)`)
    return { ok: false, errors }
  }
  if (!(op.sourceId in recordById)) errors.push(`source record not found: ${op.sourceId}`)
  else if (recordById[op.sourceId] !== op.sourceType) errors.push(`source type mismatch: ${op.sourceId} is ${recordById[op.sourceId]}, expected ${op.sourceType}`)
  if (op.targetId === op.sourceId) errors.push(`self-link rejected: ${op.sourceId}`)
  if (!(op.targetId in recordById)) errors.push(`target record not found (dangling): ${op.targetId}`)
  else if (!spec.targets.includes(recordById[op.targetId])) {
    errors.push(`target type ${recordById[op.targetId]} not allowed for ${op.sourceType}.${op.field} (allowed: ${spec.targets.join('|')})`)
  }
  if (NON_RELATIONSHIP_SAFE.has(op.field)) errors.push(`field not permitted in plan: ${op.field}`)
  return { ok: errors.length === 0, errors }
}

export function edgeKey(sourceId: string, field: string, targetId: string): string {
  return `${sourceId}|${field}|${targetId}`
}

export function existingEdgeKeys(edges: { sourceId: string; field: string; targetId: string }[]): Set<string> {
  return new Set(edges.map((e) => edgeKey(e.sourceId, e.field, e.targetId)))
}

export function isDuplicate(existing: Set<string>, op: RelOperation): boolean {
  return existing.has(edgeKey(op.sourceId, op.field, op.targetId))
}

export function simulatedApply(
  existing: Set<string>,
  ops: RelOperation[],
): { applied: number; duplicates: number; resulting: number } {
  let applied = 0
  let duplicates = 0
  const keys = new Set(existing)
  for (const op of ops) {
    const k = edgeKey(op.sourceId, op.field, op.targetId)
    if (keys.has(k)) {
      duplicates++
      continue
    }
    keys.add(k)
    applied++
  }
  return { applied, duplicates, resulting: keys.size }
}
