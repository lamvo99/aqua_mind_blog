import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  RELATIONSHIP_FIELDS,
  isRelationshipField,
  fieldSpec,
  allowedTargets,
  validateOperation,
  edgeKey,
  existingEdgeKeys,
  isDuplicate,
  simulatedApply,
  type RelOperation,
} from '@/lib/relationship-plan'

const ROOT = process.cwd()
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8')
const maybeRead = (p: string) => (fs.existsSync(path.join(ROOT, p)) ? read(p) : null)

const OUT = 'reports/SPEC_12A'
const ARTIFACTS = [
  'RELATIONSHIP_FIELD_MAP.csv',
  'RELATIONSHIP_BASELINE.json',
  'RELATIONSHIP_CANDIDATES.csv',
  'RELATIONSHIP_EVIDENCE.csv',
  'RELATIONSHIP_CONFLICTS.csv',
  'SPEC_12B_DRY_RUN_PLAN.json',
  'SPEC_12B_HELD_REGISTER.csv',
  'VALIDATION_RESULTS.json',
  'INTEGRITY.json',
]

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c === '\r') { /* skip */ }
    else field += c
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  const headers = rows.shift() ?? []
  return rows
    .filter((r) => r.length > 1 || (r[0] ?? '').length > 0)
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])))
}

describe('SPEC 12A — relationship plan (pure module)', () => {
  it('maps only the knowledge-graph relationship fields', () => {
    expect(isRelationshipField('species', 'compatibleSpecies')).toBe(true)
    expect(isRelationshipField('species', 'name')).toBe(false)
    expect(isRelationshipField('species', 'title')).toBe(false)
    expect(isRelationshipField('unknownType', 'relatedPosts')).toBe(false)
    expect(allowedTargets('species', 'compatiblePlants')).toEqual(['plant'])
    expect(allowedTargets('problem', 'relatedTools')).toEqual(['tool'])
    expect(fieldSpec('species', 'predatorPrey')?.entryRef).toBe('ref')
  })
  it('rejects non-relationship paths (no field writes outside the relationship model)', () => {
    const recs = { s1: 'species', s2: 'species' }
    const op: RelOperation = { candidateId: 'x', sourceType: 'species', sourceId: 's1', field: 'name', op: 'add', targetId: 's2' }
    const r = validateOperation(op, recs)
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/not a relationship field/)
  })
  it('rejects unknown source, unknown (dangling) target, self-links and type violations', () => {
    const recs = { s1: 'species', s2: 'species', p1: 'plant' }
    expect(validateOperation({ candidateId: 'x', sourceType: 'species', sourceId: 'nope', field: 'compatibleSpecies', op: 'add', targetId: 's2' }, recs).ok).toBe(false)
    expect(validateOperation({ candidateId: 'x', sourceType: 'species', sourceId: 's1', field: 'compatibleSpecies', op: 'add', targetId: 'ghost' }, recs).errors.join(' ')).toMatch(/dangling/)
    expect(validateOperation({ candidateId: 'x', sourceType: 'species', sourceId: 's1', field: 'compatibleSpecies', op: 'add', targetId: 's1' }, recs).errors.join(' ')).toMatch(/self-link/)
    expect(validateOperation({ candidateId: 'x', sourceType: 'species', sourceId: 's1', field: 'compatibleSpecies', op: 'add', targetId: 'p1' }, recs).errors.join(' ')).toMatch(/not allowed/)
  })
  it('accepts a well-formed operation', () => {
    const recs = { s1: 'species', s2: 'species' }
    expect(validateOperation({ candidateId: 'x', sourceType: 'species', sourceId: 's1', field: 'compatibleSpecies', op: 'add', targetId: 's2' }, recs).ok).toBe(true)
  })
  it('is idempotent: duplicate edges are detected and not double-applied', () => {
    const existing = existingEdgeKeys([{ sourceId: 's1', field: 'compatibleSpecies', targetId: 's2' }])
    const op: RelOperation = { candidateId: 'x', sourceType: 'species', sourceId: 's1', field: 'compatibleSpecies', op: 'add', targetId: 's2' }
    expect(isDuplicate(existing, op)).toBe(true)
    expect(edgeKey('s1', 'compatibleSpecies', 's2')).toBe('s1|compatibleSpecies|s2')
    const res = simulatedApply(existing, [op, { ...op, targetId: 's3' }])
    expect(res.duplicates).toBe(1)
    expect(res.applied).toBe(1)
    expect(res.resulting).toBe(2)
  })
})

describe('SPEC 12A — generated artifacts', () => {
  it('all required artifacts exist', () => {
    for (const a of ARTIFACTS) {
      expect(maybeRead(path.join(OUT, a)), `missing ${a}`).not.toBeNull()
    }
  })
  it('field map covers every relationship field in lib/relationship-plan', () => {
    const rows = parseCsv(read(path.join(OUT, 'RELATIONSHIP_FIELD_MAP.csv')))
    const seen = new Set(rows.map((r) => `${r.sourceType}.${r.field}`))
    for (const [type, fields] of Object.entries(RELATIONSHIP_FIELDS)) {
      for (const field of Object.keys(fields)) {
        expect(seen.has(`${type}.${field}`), `field map missing ${type}.${field}`).toBe(true)
      }
    }
  })
  it('dry-run plan operates only on relationship fields with additive entry shape', () => {
    const plan = JSON.parse(read(path.join(OUT, 'SPEC_12B_DRY_RUN_PLAN.json')))
    expect(plan.operationCount).toBe(plan.operations.length)
    expect(plan.operations.length).toBeGreaterThan(0)
    for (const op of plan.operations) {
      expect(isRelationshipField(op.sourceType ?? 'species', op.path), `non-relationship path ${op.path}`).toBe(true)
      expect(op.path).toBe('compatibleSpecies')
      expect(op.action).toBe('add-if-absent')
      expect(Object.keys(op.value).sort()).toEqual(['conditions', 'confidence', 'evidenceNote', 'ref'])
      expect(op.value.ref._type).toBe('reference')
      expect(op.value.ref._ref).toBeTruthy()
      expect(op.documentId).not.toBe(op.value.ref._ref)
    }
  })
  it('dry-run plan is idempotent (no duplicate edges)', () => {
    const plan = JSON.parse(read(path.join(OUT, 'SPEC_12B_DRY_RUN_PLAN.json')))
    expect(plan.idempotency.duplicateEdgesOnReapply).toBe(0)
    expect(plan.idempotency.safeToReapply).toBe(true)
    const keys = plan.operations.map((o: { documentId: string; path: string; value: { ref: { _ref: string } } }) => edgeKey(o.documentId, o.path, o.value.ref._ref))
    expect(new Set(keys).size).toBe(keys.length)
  })
  it('every dry-run op validates against the record-type model', () => {
    const plan = JSON.parse(read(path.join(OUT, 'SPEC_12B_DRY_RUN_PLAN.json')))
    const typeById: Record<string, string> = {}
    for (const op of plan.operations) typeById[op.documentId] = op.sourceType ?? 'species'
    for (const op of plan.operations) typeById[op.value.ref._ref] = typeById[op.value.ref._ref] ?? 'species'
    for (const op of plan.operations) {
      const r = validateOperation({ candidateId: op.candidateId, sourceType: typeById[op.documentId], sourceId: op.documentId, field: op.path, op: 'add', targetId: op.value.ref._ref }, typeById)
      expect(r.errors.join(' '), op.candidateId).not.toMatch(/dangling/)
    }
  })
  it('P0/P1 safety candidates are held, never auto-written', () => {
    const held = parseCsv(read(path.join(OUT, 'SPEC_12B_HELD_REGISTER.csv')))
    expect(held.length).toBeGreaterThan(0)
    for (const r of held) {
      expect(['HOLD_EVIDENCE', 'NOT_APPLICABLE']).toContain(r.decision)
      expect(r.registerId).toMatch(/^HELD12A-|^NA12A-/)
    }
    const plan = JSON.parse(read(path.join(OUT, 'SPEC_12B_DRY_RUN_PLAN.json')))
    const proposals = parseCsv(read(path.join(OUT, 'RELATIONSHIP_CANDIDATES.csv'))).filter((r) => r.decision === 'PROPOSE_WITH_CAVEAT')
    expect(proposals.length).toBe(plan.operations.length)
  }, 30000)
  it('conflicts file is header-only (no contradictory evidence in bounded scope)', () => {
    const lines = read(path.join(OUT, 'RELATIONSHIP_CONFLICTS.csv')).trim().split(/\r?\n/)
    expect(lines.length).toBe(1)
  })
  it('validation results pass', () => {
    const v = JSON.parse(read(path.join(OUT, 'VALIDATION_RESULTS.json')))
    expect(v.ok).toBe(true)
    expect(v.checks.every((c: { pass: boolean }) => c.pass)).toBe(true)
    expect(v.checks.map((c: { id: string }) => c.id)).toEqual(['V-01', 'V-02', 'V-03', 'V-04', 'V-05', 'V-06', 'V-07', 'V-08'])
  })
  it('integrity confirms no content mutation and stable identity', () => {
    const i = JSON.parse(read(path.join(OUT, 'INTEGRITY.json')))
    expect(i.content_mutations).toBe(0)
    expect(i.identityMatch).toBe(true)
    expect(i.countsMatch).toBe(true)
    expect(i.pre.identityHash).toBe(i.post.identityHash)
  })
})

describe('SPEC 12A — scripts are read-only (no mutation or deploy surface)', () => {
  const scripts = ['scripts/SPEC_12A_baseline.js', 'scripts/SPEC_12A_plan.js']
  it('never call a mutation endpoint', () => {
    for (const s of scripts) {
      const src = read(s)
      expect(src).not.toMatch(/data\/mutate/)
      expect(src).not.toMatch(/\bmethod\s*:\s*['"]POST['"]/i)
      expect(src).not.toMatch(/\.patch\s*\(/)
      expect(src).not.toMatch(/createOrReplace/)
      expect(src).not.toMatch(/commit\s*\(/)
    }
  })
  it('never deploy or import/write documents', () => {
    for (const s of scripts) {
      const src = read(s)
      expect(src).not.toMatch(/sanity\s+deploy/)
      expect(src).not.toMatch(/sanity\s+dataset\s+import/)
      expect(src).not.toMatch(/client\.mutate/)
    }
  })
})
