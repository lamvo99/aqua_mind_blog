import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const ROOT = process.cwd()
const read = (p: string) => fs.readFileSync(path.join(ROOT, 'reports', 'SPEC_13A', p), 'utf8')

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

const candidates = parseCsv(read('CANDIDATES.csv'))
const evidence = parseCsv(read('EVIDENCE.csv'))
const held = parseCsv(read('HELD_REGISTER.csv'))
const coverage = parseCsv(read('COVERAGE_MATRIX.csv'))
const priority = parseCsv(read('PRIORITY_DECISIONS.csv'))
const conflicts = parseCsv(read('CONFLICTS.csv'))
const plan = JSON.parse(read('SPEC_13B_DRY_RUN_PLAN.json'))
const validations = JSON.parse(read('VALIDATION_RESULTS.json'))
const integrity = JSON.parse(read('INTEGRITY.json'))

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex')

describe('SPEC 13A - coverage research', () => {
  it('produces a coverage matrix for every relationship field', () => {
    expect(coverage).toHaveLength(28)
    expect(new Set(coverage.map((r) => r.sourceType))).toEqual(
      new Set(['species', 'plant', 'invertebrate', 'coral', 'equipment', 'problem']),
    )
    for (const r of coverage) {
      expect(Number(r.records)).toBeGreaterThan(0)
      expect(Number(r.recordsWithData) + Number(r.emptyRecords)).toBe(Number(r.records))
      expect(r).toHaveProperty('safetyTier')
      expect(r).toHaveProperty('priority')
    }
  })

  it('selects exactly two families and defers the rest', () => {
    expect(
      [...new Set(priority.filter((r) => r.decision === 'INCLUDE').map((r) => r.family))].sort(),
    ).toEqual(['incompatibleSpecies', 'predatorPrey'])
    expect([...new Set(coverage.filter((r) => r.priority === 'INCLUDE').map((r) => r.field))].sort()).toEqual(
      ['incompatibleSpecies', 'predatorPrey'],
    )
  })

  it('records the researched families as empty before planning', () => {
    const empty = coverage.filter((r) => r.field === 'predatorPrey' || r.field === 'incompatibleSpecies')
    expect(empty).toHaveLength(3)
    for (const r of empty) expect(Number(r.edgeCount)).toBe(0)
  })
})

describe('SPEC 13A - candidates', () => {
  it('stays inside the bounded batch', () => {
    expect(candidates.length).toBeGreaterThanOrEqual(20)
    expect(candidates.length).toBeLessThanOrEqual(40)
    expect(new Set(candidates.map((c) => c.family))).toEqual(
      new Set(['predatorPrey', 'incompatibleSpecies']),
    )
    expect(new Set(candidates.map((c) => c.sourceType))).toEqual(new Set(['species']))
  })

  it('marks every candidate PROPOSE_WITH_CAVEAT with valid metadata', () => {
    for (const c of candidates) {
      expect(c.decision).toBe('PROPOSE_WITH_CAVEAT')
      expect(['HIGH', 'MEDIUM']).toContain(c.confidence)
      expect(['P0', 'P1']).toContain(c.riskTier)
      expect(c.caveat.length).toBeGreaterThan(10)
      expect(c.rationale.length).toBeGreaterThan(10)
    }
  })

  it('uses unique candidate ids and no self-links', () => {
    expect(new Set(candidates.map((c) => c.candidateId)).size).toBe(candidates.length)
    for (const c of candidates) expect(c.sourceId).not.toBe(c.targetId)
  })

  it('keeps source/target pairs disjoint between the two families', () => {
    const prey = new Set(candidates.filter((c) => c.family === 'predatorPrey').map((c) => `${c.sourceId}|${c.targetId}`))
    const incompatible = candidates.filter((c) => c.family === 'incompatibleSpecies').map((c) => `${c.sourceId}|${c.targetId}`)
    for (const pair of incompatible) expect(prey.has(pair)).toBe(false)
  })

  it('anchors every candidate to a class-3 evidence row', () => {
    expect(evidence).toHaveLength(candidates.length)
    for (const c of candidates) {
      const row = evidence.find((e) => e.candidateId === c.candidateId)
      expect(row).toBeDefined()
      expect(row!.sourceClass).toBe('C3_SPECIALIST_REFERENCE')
      expect(row!.sourceUrl.startsWith('https://')).toBe(true)
      expect(row!.excerpt.length).toBeGreaterThan(20)
      expect(row!.evidenceId).toBe(c.evidenceId)
    }
  })
})

describe('SPEC 13A - offline dry-run plan', () => {
  it('only plans the two prioritised relationship paths on species', () => {
    expect(plan.mode).toMatch(/OFFLINE PLAN ONLY/)
    expect(plan.operationCount).toBe(plan.operations.length)
    expect(plan.operations.length).toBe(candidates.length)
    for (const op of plan.operations) {
      expect(op.sourceType).toBe('species')
      expect(['predatorPrey', 'incompatibleSpecies']).toContain(op.path)
      expect(op.action).toBe('add-if-absent')
    }
    expect(JSON.stringify(plan)).not.toContain('data/mutate')
  })

  it('emits schema-exact entry objects with deterministic keys', () => {
    for (const op of plan.operations) {
      const v = op.value
      expect(v._key).toMatch(/^rel[0-9a-f]{10}$/)
      expect(v._key).toBe('rel' + sha256('13a|' + op.candidateId).slice(0, 10))
      expect(v.ref._type).toBe('reference')
      expect(v.ref._ref).toBeTruthy()
      if (op.path === 'predatorPrey') {
        expect(v._type).toBe('predatorPreyEntry')
        expect(Object.keys(v).sort()).toEqual(['_key', '_type', 'evidenceNote', 'ref', 'sizeCondition'])
        expect(typeof v.sizeCondition).toBe('string')
        expect(v.evidenceNote).toContain('https://')
      } else {
        expect(v._type).toBe('incompatibleEntry')
        expect(Object.keys(v).sort()).toEqual(['_key', '_type', 'reason', 'ref'])
        expect(['predation', 'temperament', 'size', 'water']).toContain(v.reason)
      }
    }
  })

  it('is idempotent and simulated only', () => {
    expect(plan.idempotency.duplicateEdgesOnReapply).toBe(0)
    expect(plan.idempotency.safeToReapply).toBe(true)
    expect(plan.simulated.relationshipEdgesAfter).toBe(
      plan.simulated.relationshipEdgesBefore + plan.operations.length,
    )
    expect(plan.simulated.note).toMatch(/SIMULATED/)
  })
})

describe('SPEC 13A - held register and conflicts', () => {
  it('never promotes held or rejected rows into the plan', () => {
    expect(held.length).toBeGreaterThan(0)
    const planKeys = new Set(plan.operations.map((o: any) => `${o.documentId}|${o.path}|${o.value.ref._ref}`))
    for (const h of held) {
      expect(['HOLD_EVIDENCE', 'REJECT_SEMANTIC_MAPPING']).toContain(h.decision)
      expect(planKeys.has(`${h.sourceId}|${h.field}|${h.targetId}`)).toBe(false)
    }
  })

  it('reports no unresolved conflicts in this batch', () => {
    expect(conflicts).toHaveLength(0)
  })
})

describe('SPEC 13A - validations and integrity', () => {
  it('passes all twelve validations', () => {
    expect(validations.checks).toHaveLength(12)
    expect(validations.checks.map((c: any) => c.id)).toEqual(
      Array.from({ length: 12 }, (_, i) => 'V-' + String(i + 1).padStart(2, '0')),
    )
    expect(validations.checks.filter((c: any) => !c.pass)).toEqual([])
    expect(validations.ok).toBe(true)
    expect(validations.simulated.duplicates).toBe(0)
    expect(validations.simulated.applied).toBe(plan.operations.length)
  })

  it('proves the research batch mutated nothing', () => {
    expect(integrity.content_mutations).toBe(0)
    expect(integrity.schema_changes).toBe(0)
    expect(integrity.deploys).toBe(0)
    expect(integrity.verdict).toBe('CLEAN')
    expect(integrity.identityMatch).toBe(true)
    expect(integrity.relationshipsBefore).toBe(3173)
    expect(integrity.relationshipsAfter).toBe(3173)
    expect(integrity.relationshipsUnchanged).toBe(true)
    expect(integrity.draftCount).toBe(0)
    expect(integrity.total).toBe(473)
  })
})
