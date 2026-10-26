import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  buildHusbandryFacts,
  knowledgeBodySections,
  compatibleSpeciesRefs,
  formatRange,
  formatGroupSize,
  humanizeFlag,
} from '@/lib/species-facts'

const ROOT = process.cwd()
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8')

describe('SPEC 10N — GROQ projection integration', () => {
  const db = read('lib/database.ts')
  it('species detail projection includes the SPEC 10M husbandry fields', () => {
    for (const f of [
      'minTankLengthCm', 'minTankWidthCm', 'swimmingSpace', 'jumpRisk', 'lidRequired', 'flowPreference',
      'oxygenSensitivity', 'maturityRequirement', 'bioload', 'waterChangeSensitivity', 'breedingDifficulty',
      'khMin', 'khMax', 'salinityMin', 'salinityMax', 'behaviorFlags', 'groupSize',
      'communitySuitability', 'reefInteraction', 'predatesInverts', 'knowledgeBody',
    ]) {
      expect(db, `projection should include ${f}`).toContain(f)
    }
  })
  it('compatibleSpecies projection uses the entry shape (ref + conditions + confidence), not a bare deref', () => {
    expect(db).toContain('compatibleSpecies[]{ ref->')
    expect(db).not.toMatch(/compatibleSpecies\[\]->/)
  })
  it('compatibility-checker query dereferences the entry ref, not the entry object', () => {
    const src = read('app/tools/compatibility-checker/page.tsx')
    expect(src).toContain('compatibleSpecies[defined(ref)].ref->slug.current')
    expect(src).not.toContain('compatibleSpecies[]->slug.current')
  })
})

describe('SPEC 10N — compatibleSpecies entry-shape handling', () => {
  it('unwraps entry objects to their ref', () => {
    const entries = [{ ref: { _id: 'a', name: 'A' }, conditions: ['x'], confidence: 'HIGH' }]
    expect(compatibleSpeciesRefs(entries)).toEqual([{ _id: 'a', name: 'A' }])
  })
  it('passes through plain references (legacy) unchanged', () => {
    expect(compatibleSpeciesRefs([{ _id: 'b', name: 'B' }])).toEqual([{ _id: 'b', name: 'B' }])
  })
  it('drops null/undefined refs and tolerates non-arrays', () => {
    expect(compatibleSpeciesRefs([{ ref: null }, undefined, null, { ref: { _id: 'c' } }])).toEqual([{ _id: 'c' }])
    expect(compatibleSpeciesRefs(null)).toEqual([])
    expect(compatibleSpeciesRefs(undefined)).toEqual([])
  })
})

describe('SPEC 10N — husbandry facts (units, missing optional, legacy)', () => {
  it('renders valid values with units', () => {
    const groups = buildHusbandryFacts({
      minTankLengthCm: 120, minTankWidthCm: 45, swimmingSpace: 'HIGH', jumpRisk: 'MODERATE',
      lidRequired: 'ESSENTIAL', flowPreference: 'MODERATE', oxygenSensitivity: 'SENSITIVE',
      khMin: 3, khMax: 10, behaviorFlags: ['open-water', 'strong-swimmer'],
      groupSize: { min: 6, max: 10 }, communitySuitability: 'SUITABLE', predatesInverts: 'LIKELY',
      breedingDifficulty: 'DIFFICULT', waterType: 'freshwater',
    })
    const flat = Object.fromEntries(groups.flatMap((g) => g.facts.map((f) => [f.label, f.value])))
    expect(flat['Min tank length']).toBe('120 cm')
    expect(flat['Min tank width']).toBe('45 cm')
    expect(flat['Swimming space']).toBe('High')
    expect(flat['Lid']).toBe('Essential')
    expect(flat['Flow']).toBe('Moderate')
    expect(flat['Oxygen']).toBe('Sensitive — needs good aeration')
    expect(flat['KH']).toBe('3–10 dKH')
    expect(flat['Behavior']).toBe('Open water, Strong swimmer')
    expect(flat['Group size']).toBe('6–10')
    expect(flat['Predates inverts']).toBe('Likely')
    expect(flat['Breeding']).toBe('Difficult')
  })
  it('omits absent optional values and never emits empty labels', () => {
    const groups = buildHusbandryFacts({ swimmingSpace: 'LOW', jumpRisk: null, khMin: null, khMax: null })
    const labels = groups.flatMap((g) => g.facts.map((f) => f.label))
    expect(labels).toEqual(['Swimming space'])
    expect(groups.map((g) => g.title)).toEqual(['Space & footprint'])
    for (const g of groups) for (const f of g.facts) expect(f.value).not.toBe('')
  })
  it('legacy record with only pre-SPEC-10M fields yields no groups', () => {
    expect(buildHusbandryFacts({ waterType: 'freshwater' })).toEqual([])
    expect(buildHusbandryFacts({})).toEqual([])
  })
  it('salinity appears for brackish/saltwater or when a bound is set', () => {
    const marine = buildHusbandryFacts({ waterType: 'saltwater', salinityMin: 30, salinityMax: 35 })
    expect(marine.flatMap((g) => g.facts).find((f) => f.label === 'Salinity')?.value).toBe('30–35 ppt')
    const brackish = buildHusbandryFacts({ waterType: 'brackish', salinityMin: 5 })
    expect(brackish.flatMap((g) => g.facts).find((f) => f.label === 'Salinity')?.value).toBe('5 ppt')
    const fresh = buildHusbandryFacts({ waterType: 'freshwater' })
    expect(fresh.flatMap((g) => g.facts).some((f) => f.label === 'Salinity')).toBe(false)
  })
  it('formatRange / formatGroupSize handle single-sided and empty inputs', () => {
    expect(formatRange(2, 8, ' dGH')).toBe('2–8 dGH')
    expect(formatRange(20, null, '°C')).toBe('20°C')
    expect(formatRange(null, 30, '°C')).toBe('30°C')
    expect(formatRange(null, null)).toBe(null)
    expect(formatGroupSize({ min: 6 })).toBe('6+')
    expect(formatGroupSize({ max: 4 })).toBe('up to 4')
    expect(formatGroupSize({})).toBe(null)
    expect(formatGroupSize(null)).toBe(null)
  })
  it('humanizeFlag converts kebab flags to readable words', () => {
    expect(humanizeFlag('open-water')).toBe('Open water')
    expect(humanizeFlag('cave-dweller')).toBe('Cave dweller')
    expect(humanizeFlag('')).toBe('')
  })
})

describe('SPEC 10N — knowledge body rendering', () => {
  const block = (text: string) => ({ _type: 'block', _key: text, children: [{ _type: 'span', text }] })
  it('renders known species sections in canonical order', () => {
    const body = { practicalVerdict: [block('v')], overview: [block('o')] }
    const sections = knowledgeBodySections(body)
    expect(sections.map((s) => s.title)).toEqual(['Overview', 'Practical Verdict'])
  })
  it('appends non-species sections (other domains) with humanized titles', () => {
    const body = { molting: [block('m')], practicalVerdict: [block('v')] }
    const sections = knowledgeBodySections(body)
    expect(sections.map((s) => s.title)).toEqual(['Practical Verdict', 'Molting'])
  })
  it('ignores empty sections and missing body', () => {
    expect(knowledgeBodySections({ overview: [] })).toEqual([])
    expect(knowledgeBodySections(undefined)).toEqual([])
    expect(knowledgeBodySections(null)).toEqual([])
  })
})
