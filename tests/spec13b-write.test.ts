import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const ROOT = process.cwd()
const read = (p: string) => fs.readFileSync(path.join(ROOT, 'reports', 'SPEC_13B_WRITE', p), 'utf8')
const manifest = JSON.parse(read('EXECUTION_MANIFEST.json'))
const preflight = JSON.parse(read('PREFLIGHT.json'))
const post = JSON.parse(read('POST_WRITE_VERIFICATION.json'))
const integrity = JSON.parse(read('INTEGRITY.json'))
const rows = fs
  .readFileSync(path.join(ROOT, 'reports', 'SPEC_13B_WRITE', 'OPERATION_RESULTS.csv'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .slice(1)
  .map((l) => l.split(','))

const EXCLUDED = ['REL13A-0016', 'REL13A-0017', 'REL13A-0019', 'REL13A-0020']
const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex')

describe('SPEC 13B write - execution manifest', () => {
  it('authorizes exactly the 17 eligible operations', () => {
    expect(manifest.operationCount).toBe(17)
    expect(manifest.operations).toHaveLength(17)
    expect(new Set(manifest.operations.map((o: any) => o.candidateId)).size).toBe(17)
    expect(manifest.mode).toBe('add-if-absent')
    expect(manifest.concurrency).toBe('ifRevisionID')
    expect(manifest.batchLimit).toBe(5)
  })

  it('excludes all four manual-review candidates', () => {
    expect(manifest.excludedCandidateIds).toEqual(EXCLUDED)
    const ids = manifest.operations.map((o: any) => o.candidateId)
    for (const id of EXCLUDED) expect(ids).not.toContain(id)
  })

  it('keeps direction, shape, and deterministic keys', () => {
    for (const op of manifest.operations) {
      expect(['predatorPrey', 'incompatibleSpecies']).toContain(op.field)
      expect(op.sourceType).toBe('species')
      expect(op.direction).toMatch(/^source/)
      expect(op.key).toMatch(/^rel[0-9a-f]{10}$/)
      expect(op.key).toBe('rel' + sha256('13a|' + op.candidateId).slice(0, 10))
      expect(op.value._key).toBe(op.key)
      expect(op.value.ref._ref).toBe(op.targetId)
      if (op.field === 'predatorPrey') {
        expect(op.value._type).toBe('predatorPreyEntry')
        expect(Object.keys(op.value).sort()).toEqual(['_key', '_type', 'evidenceNote', 'ref', 'sizeCondition'])
      } else {
        expect(op.value._type).toBe('incompatibleEntry')
        expect(['predation', 'temperament', 'size', 'water']).toContain(op.value.reason)
      }
    }
  })
})

describe('SPEC 13B write - preflight gates', () => {
  it('records all 19 gates as passing', () => {
    expect(preflight.checks).toHaveLength(19)
    expect(preflight.checks.filter((c: any) => !c.pass)).toEqual([])
    expect(preflight.decision).toBe('READY_TO_WRITE')
  })

  it('started from the expected live baseline', () => {
    expect(preflight.live.total).toBe(473)
    expect(preflight.live.drafts).toBe(0)
    expect(preflight.live.duplicate).toEqual({ dupIds: 0, dupSlugs: 0 })
    expect(preflight.live.identity.match).toBe(true)
    expect(preflight.live.edges).toBe(3173)
    expect(preflight.projection).toEqual({ edgesBefore: 3173, eligibleOps: 17, edgesAfterExpected: 3190 })
    expect(preflight.present).toBe(0)
    expect(preflight.reverse).toBe(0)
    expect(preflight.unresolved).toBe(0)
  })

  it('captured revisions for all five source species', () => {
    expect(Object.keys(preflight.sourceRevisions)).toHaveLength(5)
    for (const rev of Object.values(preflight.sourceRevisions) as string[]) {
      expect(rev.length).toBeGreaterThan(10)
    }
  })
})

describe('SPEC 13B write - operation results', () => {
  it('applied and verified all 17 operations', () => {
    expect(rows).toHaveLength(17)
    for (const r of rows) {
      expect(r[4]).toBe('APPLIED_AND_VERIFIED')
      expect(r[5]).toBe('1')
      expect(r[9]).toBe('1')
      expect(r[10]).toBe('true')
      expect(r[11]).toBe('')
    }
  })

  it('touched only the approved documents and fields', () => {
    expect(new Set(rows.map((r) => r[1])).size).toBe(5)
    for (const r of rows) expect(['predatorPrey', 'incompatibleSpecies']).toContain(r[2])
    expect(rows.filter((r) => r[2] === 'predatorPrey')).toHaveLength(15)
    expect(rows.filter((r) => r[2] === 'incompatibleSpecies')).toHaveLength(2)
  })
})

describe('SPEC 13B write - post-write verification', () => {
  it('proves every approved edge exists exactly once', () => {
    expect(post.status).toBe('COMPLETE')
    expect(post.applied).toBe(17)
    expect(post.checks.allSeventeenPresent).toBe(true)
    expect(post.checks.eachExactlyOnce).toBe(true)
    expect(post.checks.excludedApplied).toBe(0)
  })

  it('shows the exact expected edge delta and no collateral change', () => {
    expect(post.edgesBefore).toBe(3173)
    expect(post.edgesAfter).toBe(3190)
    expect(post.edgeDelta).toBe(17)
    expect(post.checks.noPriorEdgeLost).toBe(true)
    expect(post.checks.unrelatedFieldsUnchanged).toBe(true)
    expect(post.checks.onlyApprovedDocumentsTouched).toBe(true)
    expect(post.checks.recordCountUnchanged).toBe(true)
    expect(post.checks.identityUnchanged).toBe(true)
    expect(post.checks.draftsZero).toBe(true)
    expect(post.fingerprint.match).toBe(true)
    expect(post.fingerprint.method).toContain('excluding _rev')
  })

  it('is idempotent on reapply', () => {
    expect(post.idempotency).toEqual({ additionalOperationsOnReapply: 0, expected: 0, pass: true })
  })

  it('confirms every excluded candidate is still absent', () => {
    const excludedIds = new Set(EXCLUDED)
    for (const op of manifest.operations) expect(excludedIds.has(op.candidateId)).toBe(false)
    const applied = new Set(rows.map((r) => r[0]))
    for (const id of EXCLUDED) expect(applied.has(id)).toBe(false)
  })
})

describe('SPEC 13B write - integrity', () => {
  it('records 17 mutations and zero schema/deploy changes', () => {
    expect(integrity.content_mutations).toBe(17)
    expect(integrity.schema_changes).toBe(0)
    expect(integrity.deploys).toBe(0)
    expect(integrity.verdict).toBe('CLEAN')
    expect(integrity.status).toBe('COMPLETE')
  })

  it('leaves records, identity, and prior artifacts intact', () => {
    expect(integrity.records).toEqual({ before: 473, after: 473 })
    expect(integrity.drafts).toEqual({ before: 0, after: 0 })
    expect(integrity.identity.match).toBe(true)
    expect(integrity.relationships).toEqual({ before: 3173, after: 3190, delta: 17, expectedDelta: 17 })
    expect(integrity.artifactIntegrity.spec13a.mismatches).toBe(0)
    expect(integrity.artifactIntegrity.spec13b.mismatches).toBe(0)
    expect(integrity.artifactIntegrity.spec12b.mismatches).toBe(0)
    expect(integrity.artifactIntegrity.spec12a.bad).toEqual(['tests/spec12a-plan.test.ts'])
  })
})
