import { describe, it, expect } from 'vitest'
import { diagnoseProblems, SYMPTOM_OPTIONS } from '@/lib/diagnosis'
import type { ProblemForDiagnosis } from '@/lib/diagnosis'

function problem(overrides: Partial<ProblemForDiagnosis> & { _id: string; title: string }): ProblemForDiagnosis {
  return { _type: 'problem', slug: { current: overrides._id }, symptomsText: '', ...overrides }
}

describe('diagnoseProblems', () => {
  it('no selection → empty results', () => {
    const p = problem({ _id: 'p1', title: 'Ich', symptomsText: 'white dots on body' })
    expect(diagnoseProblems([p], [])).toHaveLength(0)
  })

  it('matches symptoms via keywords (case-insensitive)', () => {
    const ich = problem({ _id: 'p1', title: 'Ich', symptomsText: 'White dots and fuzzy patches appear on the fins' })
    const r = diagnoseProblems([ich], ['spots', 'fins'])
    expect(r).toHaveLength(1)
    expect(r[0].score).toBe(100)
    expect(r[0].matched.sort()).toEqual(['fins', 'spots'].sort())
  })

  it('ranks by ratio of matched symptoms', () => {
    const ich = problem({ _id: 'p1', title: 'Ich', symptomsText: 'white dots appear on the body' })
    const algae = problem({ _id: 'p2', title: 'Algae', symptomsText: 'algae on glass, cloudy water' })
    const r = diagnoseProblems([ich, algae], ['spots', 'cloudy'])
    expect(r[0].problem._id).toBe('ich'.length ? 'p1' : 'p1') // spots(1/2=50) vs cloudy(1/2=50) tie → order by matched length tie-break
    expect(r[0].problem._id).toBe('p1')
  })

  it('partial match → partial score', () => {
    const p = problem({ _id: 'p1', title: 'Fin rot', symptomsText: 'fins are ragged' })
    const r = diagnoseProblems([p], ['fins', 'spots'])
    expect(r[0].score).toBe(50)
  })

  it('no matching keywords → excluded', () => {
    const p = problem({ _id: 'p1', title: 'Nitrate', symptomsText: 'high nitrates in the water column' })
    expect(diagnoseProblems([p], ['fins'])).toHaveLength(0)
  })

  it('missing symptomsText → no match, no crash', () => {
    const p = problem({ _id: 'p1', title: 'Empty' })
    expect(diagnoseProblems([p], ['fins'])).toHaveLength(0)
  })

  it('symptom option list is unique and non-empty', () => {
    const ids = SYMPTOM_OPTIONS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(SYMPTOM_OPTIONS.length).toBeGreaterThan(10)
    for (const s of SYMPTOM_OPTIONS) {
      expect(s.keywords.length).toBeGreaterThan(0)
    }
  })
})
