import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  SPEC_12B_ALLOWED_PATHS,
  isAllowedWritePath,
  assertWriteAllowed,
  entryRefOf,
  entryShapeOf,
  buildEntry,
  decideApply,
  applyAddIfAbsent,
  type ExistingEntry,
  type PlannedEntry,
} from '@/lib/relationship-executor'

const ROOT = process.cwd()
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8')

const PLAN: PlannedEntry = {
  ref: 'target-1',
  conditions: ['peaceful community tank'],
  confidence: 'MEDIUM',
  evidenceNote: 'Seriously Fish (https://example.test/evidence)',
}

const EXISTING: ExistingEntry[] = [
  { _key: 'k1', ref: { _ref: 'other-1' }, conditions: ['x'], confidence: 'HIGH', evidenceNote: 'n1' },
]

describe('SPEC 12B — allowlist enforcement', () => {
  it('permits only compatibleSpecies', () => {
    expect(SPEC_12B_ALLOWED_PATHS).toEqual(['compatibleSpecies'])
    expect(isAllowedWritePath('species', 'compatibleSpecies')).toBe(true)
    expect(isAllowedWritePath('species', 'compatiblePlants')).toBe(false)
    expect(isAllowedWritePath('species', 'suitableEquipment')).toBe(false)
    expect(isAllowedWritePath('invertebrate', 'compatibleSpecies')).toBe(true)
    expect(isAllowedWritePath('equipment', 'compatibleEquipment')).toBe(false)
  })
  it('refuses to write fields other than compatibleSpecies', () => {
    expect(() => assertWriteAllowed('species', 'name')).toThrow(/refuses/)
    expect(() => assertWriteAllowed('species', 'title')).toThrow(/refuses/)
    expect(() => assertWriteAllowed('species', 'seo')).toThrow(/refuses/)
    expect(() => assertWriteAllowed('species', 'compatibleSpecies')).not.toThrow()
  })
})

describe('SPEC 12B — add-if-absent semantics', () => {
  it('APPLIES a genuinely new edge', () => {
    const res = applyAddIfAbsent(EXISTING, PLAN)
    expect(res.decision).toBe('APPLY')
    expect(res.changed).toBe(true)
    expect(res.next).toHaveLength(EXISTING.length + 1)
    expect(entryRefOf(res.next[res.next.length - 1])).toBe('target-1')
    // existing entries preserved
    expect(entryRefOf(res.next[0])).toBe('other-1')
  })
  it('SKIPS an exact existing entry (idempotent)', () => {
    const present: ExistingEntry[] = [...EXISTING, { _key: 'k2', ref: { _ref: 'target-1' }, conditions: PLAN.conditions, confidence: PLAN.confidence, evidenceNote: PLAN.evidenceNote }]
    const res = applyAddIfAbsent(present, PLAN)
    expect(res.decision).toBe('SKIP_ALREADY_PRESENT')
    expect(res.changed).toBe(false)
    expect(res.next).toBe(present)
  })
  it('HOLDS when the same reference exists with a different shape (never appends a duplicate)', () => {
    const conflicting: ExistingEntry[] = [...EXISTING, { _key: 'k3', ref: { _ref: 'target-1' }, conditions: ['different'], confidence: 'LOW', evidenceNote: 'other' }]
    const res = applyAddIfAbsent(conflicting, PLAN)
    expect(res.decision).toBe('HOLD_EXISTING_ENTRY_CONFLICT')
    expect(res.changed).toBe(false)
    expect(res.next.filter((e) => entryRefOf(e) === 'target-1')).toHaveLength(1)
  })
  it('REJECTS a non-relationship path', () => {
    expect(decideApply(EXISTING, PLAN, 'species', 'name')).toBe('REJECT_NON_RELATIONSHIP_PATH')
  })
})

describe('SPEC 12B — entry construction & shape', () => {
  it('builds an entry with a deterministic key and the planned fields only', () => {
    const e = buildEntry('REL12A-0001', 'target-1', { conditions: ['c'], confidence: 'MEDIUM', evidenceNote: 'ev' })
    expect(entryRefOf(e)).toBe('target-1')
    expect(e._key).toBe(buildEntry('REL12A-0001', 'target-9', {})._key) // deterministic per candidate, ref-independent
    expect(Object.keys(e).sort()).toEqual(['_key', '_type', 'conditions', 'confidence', 'evidenceNote', 'ref'])
  })
  it('entryShapeOf ignores the ref and is order-stable for comparison', () => {
    const a = { ref: { _ref: 'a' }, conditions: ['x'], confidence: 'MEDIUM' as const, evidenceNote: 'e' }
    const b = { ref: { _ref: 'b' }, conditions: ['x'], confidence: 'MEDIUM' as const, evidenceNote: 'e' }
    expect(entryShapeOf(a)).toBe(entryShapeOf(b))
  })
})

describe('SPEC 12B — executed artifacts & executor safety (no secrets required)', () => {
  const OUT = 'reports/SPEC_12B'
  const has = (p: string) => fs.existsSync(path.join(ROOT, p))
  it('produced the required SPEC 12B artifacts', () => {
    for (const f of ['PREFLIGHT.json', 'DRY_RUN_BEFORE.json', 'OPERATION_RESULTS.csv', 'POST_APPLY_VERIFICATION.json', 'INTEGRITY.json']) {
      expect(has(path.join(OUT, f)), `missing ${f}`).toBe(true)
    }
  })
  it('every operation result is verified or already present', () => {
    const text = read(path.join(OUT, 'OPERATION_RESULTS.csv'))
    const rows = text.trim().split(/\r?\n/).slice(1)
    expect(rows.length).toBe(22)
    for (const r of rows) expect(r).toMatch(/APPLIED_AND_VERIFIED|SKIP_ALREADY_PRESENT/)
  })
  it('post-apply verification is clean, scoped, and idempotent', () => {
    const v = JSON.parse(read(path.join(OUT, 'POST_APPLY_VERIFICATION.json')))
    expect(v.verdict).toBe('CLEAN')
    expect(v.identityMatch).toBe(true)
    expect(v.onlyCompatibleSpeciesChanged).toBe(true)
    expect(v.secondDryRunRemainingOps).toEqual([])
    expect(v.lostEdges).toBe(0)
    expect(v.edgesAfter).toBe(v.edgesBefore + v.addedEdges)
  })
  it('integrity confirms scope and no unrelated mutation', () => {
    const i = JSON.parse(read(path.join(OUT, 'INTEGRITY.json')))
    expect(i.identity.match).toBe(true)
    expect(i.duplicate.dupIds).toBe(0)
    expect(i.duplicate.dupSlugs).toBe(0)
    expect(i.content_mutations.field).toBe('compatibleSpecies')
    expect(i.scopeConfirmation.onlyCompatibleSpeciesChanged).toBe(true)
    expect(i.scopeConfirmation.noDeploy).toBe(true)
  })
  it('executor never logs secrets and is guarded by the allowlist', () => {
    const src = read('scripts/SPEC_12B_execute.js')
    expect(src).not.toMatch(/console\.log\([^)]*TOKEN/)
    expect(src).not.toMatch(/console\.log\([^)]*process\.env/)
    expect(src).toMatch(/compatibleSpecies/)
    expect(src).toMatch(/REL_FIELDS\.species\[field\]/)
  })
})
