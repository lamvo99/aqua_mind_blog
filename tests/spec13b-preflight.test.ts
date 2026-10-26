import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const read = (p: string) => fs.readFileSync(path.join(ROOT, 'reports', 'SPEC_13B', p), 'utf8')
const read13a = (p: string) => fs.readFileSync(path.join(ROOT, 'reports', 'SPEC_13A', p), 'utf8')

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++ } else quoted = false
      } else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (ch !== '\r') cell += ch
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row) }
  const [header, ...body] = rows.filter((r) => r.length > 1)
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
}

const baseline = JSON.parse(read('LIVE_BASELINE.json'))
const integrity = JSON.parse(read('INTEGRITY.json'))
const dryRun = JSON.parse(read('DRY_RUN.json'))
const revalidation = parseCsv(read('CANDIDATE_REVALIDATION.csv'))
const evidenceReview = parseCsv(read('EVIDENCE_REVIEW.csv'))
const plan13a = JSON.parse(read13a('SPEC_13B_DRY_RUN_PLAN.json'))

describe('SPEC 13B - live preflight gates', () => {
  it('records every preflight gate as passing', () => {
    expect(baseline.checks.length).toBe(19)
    expect(baseline.checks.map((c: any) => c.id)).toEqual(
      Array.from({ length: 19 }, (_, i) => 'P-' + String(i + 1).padStart(2, '0')),
    )
    expect(baseline.checks.filter((c: any) => !c.pass)).toEqual([])
    expect(baseline.readOnly).toBe(true)
  })

  it('re-confirms the live baseline exactly', () => {
    expect(baseline.target).toEqual({ project: 'zeohjejw', dataset: 'production', api: 'v2026-05-25' })
    expect(baseline.total).toBe(473)
    expect(baseline.counts).toEqual({ species: 218, plant: 62, invertebrate: 56, coral: 48, equipment: 46, problem: 43 })
    expect(baseline.drafts).toBe(0)
    expect(baseline.duplicate).toEqual({ dupIds: 0, dupSlugs: 0 })
    expect(baseline.identity.match).toBe(true)
    expect(baseline.identity.hash).toBe('c6e358d5524f46b7cd003db64c8e189fb0db12224b7301d68fbaf1257467aeda')
    expect(baseline.relationships.totalEdges).toBe(3173)
    expect(baseline.artifactIntegrity.spec13a.mismatches).toBe(0)
    expect(baseline.artifactIntegrity.spec13b ?? null).toBeNull()
    expect(baseline.artifactIntegrity.spec12b.mismatches).toBe(0)
    expect(baseline.artifactIntegrity.spec12a.bad).toEqual(['tests/spec12a-plan.test.ts'])
  })

  it('captures revision ids for every planned source', () => {
    const sources = new Set(plan13a.operations.map((o: any) => o.documentId))
    expect(Object.keys(baseline.sourceRevisions).sort()).toEqual([...sources].sort())
    for (const rev of Object.values(baseline.sourceRevisions) as any[]) {
      expect(rev).toMatchObject({ type: 'species' })
      expect(typeof rev.revision).toBe('string')
      expect(rev.revision.length).toBeGreaterThan(10)
    }
  })
})

describe('SPEC 13B - candidate revalidation', () => {
  it('revalidates all 21 candidates one-to-one', () => {
    expect(revalidation).toHaveLength(21)
    expect(new Set(revalidation.map((r) => r.candidateId)).size).toBe(21)
    expect(revalidation.map((r) => r.candidateId).sort()).toEqual(
      plan13a.operations.map((o: any) => o.candidateId).sort(),
    )
  })

  it('proves references, types, shapes, keys, and absence', () => {
    for (const r of revalidation) {
      expect(r.sourceExists).toBe('true')
      expect(r.targetExists).toBe('true')
      expect(r.typesOk).toBe('true')
      expect(r.shapeOk).toBe('true')
      expect(r.keyUniqueInDestination).toBe('true')
      expect(r.absentInLive).toBe('true')
      expect(r.reverseEdgePresent).toBe('false')
      expect(r.conflict).toBe('false')
      expect(r.alreadyPresent).toBe('false')
      expect(r.liveSourceRevision.length).toBeGreaterThan(10)
    }
  })

  it('splits 17 eligible from 4 manual-review candidates', () => {
    const eligible = revalidation.filter((r) => r.eligibility === 'ELIGIBLE')
    const manual = revalidation.filter((r) => r.eligibility === 'MANUAL_REVIEW')
    expect(eligible).toHaveLength(17)
    expect(manual).toHaveLength(4)
    expect(manual.map((r) => r.candidateId)).toEqual([
      'REL13A-0016', 'REL13A-0017', 'REL13A-0019', 'REL13A-0020',
    ])
    expect(eligible.filter((r) => r.family === 'predatorPrey')).toHaveLength(15)
    expect(eligible.filter((r) => r.family === 'incompatibleSpecies')).toHaveLength(2)
  })

  it('does not upgrade evidence class and flags generic statements', () => {
    expect(evidenceReview).toHaveLength(21)
    for (const e of evidenceReview) {
      expect(e.sourceClass).toBe('C3_SPECIALIST_REFERENCE')
      expect(['EXPLICIT_CATEGORY', 'EXPLICIT_SIZE_RULE', 'EXPLICIT_NAMED_SPECIES', 'GENERIC_INFERENCE']).toContain(e.evidenceStrength)
      expect(e.supportsClaim).toBe(e.evidenceStrength === 'GENERIC_INFERENCE' ? 'PARTIAL' : 'YES_WITH_CAVEAT')
    }
    const generic = evidenceReview.filter((e) => e.evidenceStrength === 'GENERIC_INFERENCE')
    expect(generic).toHaveLength(4)
    for (const e of generic) expect(e.reviewerDecision).toBe('MANUAL_REVIEW')
  })
})

describe('SPEC 13B - dry run only', () => {
  it('is derived from the live baseline and never mutates', () => {
    expect(dryRun.mode).toBe('LIVE_PREFLIGHT_DRY_RUN_ONLY')
    expect(dryRun.readOnly).toBe(true)
    expect(dryRun.edgeCountBefore).toBe(3173)
    expect(dryRun.eligibleOperations).toBe(17)
    expect(dryRun.operations).toHaveLength(17)
    expect(dryRun.alreadyPresentOperations).toBe(0)
    expect(dryRun.manualReviewOperations).toBe(4)
    expect(dryRun.conflicts).toBe(0)
    expect(dryRun.projectedEdgeCountIfApproved).toBe(dryRun.edgeCountBefore + dryRun.eligibleOperations)
    expect(dryRun.projectedEdgeCountIfApproved).toBe(3190)
    expect(JSON.stringify(dryRun)).not.toContain('data/mutate')
  })

  it('keeps manual-review candidates out of the executable subset', () => {
    const manual = new Set(dryRun.manualReviewCandidateIds)
    for (const op of dryRun.operations) expect(manual.has(op.candidateId)).toBe(false)
    expect(dryRun.manualReviewCandidateIds).toEqual([
      'REL13A-0016', 'REL13A-0017', 'REL13A-0019', 'REL13A-0020',
    ])
  })

  it('preserves the original entry payloads and idempotency contract', () => {
    const byId = new Map(plan13a.operations.map((o: any) => [o.candidateId, o]))
    for (const op of dryRun.operations) {
      const original: any = byId.get(op.candidateId)
      expect(original).toBeDefined()
      expect(op.documentId).toBe(original.documentId)
      expect(op.path).toBe(original.path)
      expect(op.value).toEqual(original.value)
      expect(op.action).toBe('add-if-absent')
    }
    expect(dryRun.idempotency).toEqual({ action: 'add-if-absent', expectedDuplicatesOnReapply: 0, safeToReapply: true })
  })
})

describe('SPEC 13B - integrity and hard stop', () => {
  it('proves zero production change', () => {
    expect(integrity.content_mutations).toBe(0)
    expect(integrity.schema_changes).toBe(0)
    expect(integrity.deploys).toBe(0)
    expect(integrity.totalBefore).toBe(integrity.totalAfter)
    expect(integrity.relationshipsBefore).toBe(3173)
    expect(integrity.relationshipsAfter).toBe(3173)
    expect(integrity.relationshipsUnchanged).toBe(true)
    expect(integrity.identityUnchanged).toBe(true)
    expect(integrity.verdict).toBe('CLEAN')
  })

  it('ends in READY_FOR_EXPLICIT_WRITE_APPROVAL without applying anything', () => {
    expect(integrity.decision).toBe('READY_FOR_EXPLICIT_WRITE_APPROVAL')
    expect(dryRun.projectionNote).toMatch(/read-only/i)
    const plan = JSON.parse(read13a('SPEC_13B_DRY_RUN_PLAN.json'))
    expect(plan.operationCount).toBe(21)
    expect(dryRun.operations.length).toBeLessThan(plan.operationCount)
  })
})
