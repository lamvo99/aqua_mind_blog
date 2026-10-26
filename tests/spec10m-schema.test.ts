import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import species from '../sanity/schemaTypes/species'
import plant from '../sanity/schemaTypes/plant'
import invertebrate from '../sanity/schemaTypes/invertebrate'
import coral from '../sanity/schemaTypes/coral'
import equipment from '../sanity/schemaTypes/equipment'
import problem from '../sanity/schemaTypes/problem'
import { schemaTypes } from '../sanity/schemaTypes'
import {
  compatibleEntry,
  incompatibleEntry,
  predatorPreyEntry,
  reefInteractionEntry,
  coralNeighborEntry,
  speciesKnowledgeBody,
  coralKnowledgeBody,
  plantKnowledgeBody,
  invertebrateKnowledgeBody,
  equipmentKnowledgeBody,
} from '../sanity/schemaTypes/knowledgeStructures'

const ROOT = process.cwd()
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8')

function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = []; let row: string[] = []; let cur = ''; let q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++ } else q = false } else cur += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(cur); cur = '' }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = '' }
    else if (c !== '\r') cur += c
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row) }
  const rows2 = rows.filter((r) => r.some((x) => x.trim() !== ''))
  const hdr = rows2[0] || []
  return rows2.slice(1).map((r) => { const o: Record<string, string> = {}; hdr.forEach((h, i) => { o[h] = r[i] || '' }); return o })
}

const TYPES: Record<string, any> = { species, plant, invertebrate, coral, equipment, problem }
const fieldsOf = (t: any) => Object.fromEntries((t.fields || []).map((f: any) => [f.name, f]))

function makeRule() {
  const state: any = { required: false }
  const rec: any = new Proxy(state, {
    get(t: any, p: any) {
      if (p === 'required') return () => { t.required = true; return rec }
      if (p === '__required') return t.required
      if (p === 'custom') return () => rec
      if (p === 'then' || p === 'catch') return undefined
      return () => rec
    },
  })
  return rec
}
function fieldIsRequired(f: any): boolean {
  if (!f || typeof f.validation !== 'function') return false
  const rule = makeRule()
  try { f.validation(rule) } catch { return false }
  return rule.__required === true
}
const listValues = (f: any): string[] => (f?.options?.list || []).map((v: any) => (typeof v === 'string' ? v : v.value))

const EXPECTED_ADD: Record<string, string[]> = {
  species: ['minTankLengthCm', 'minTankWidthCm', 'swimmingSpace', 'jumpRisk', 'lidRequired', 'flowPreference', 'oxygenSensitivity', 'maturityRequirement', 'bioload', 'waterChangeSensitivity', 'breedingDifficulty', 'khMin', 'khMax', 'salinityMin', 'salinityMax', 'behaviorFlags', 'groupSize', 'communitySuitability', 'reefInteraction', 'predatesInverts', 'incompatibleSpecies', 'predatorPrey', 'reefInteractionDetail', 'knowledgeBody'],
  plant: ['feedingMode', 'substrateType', 'fertilizationPlan', 'ghMin', 'ghMax', 'khMin', 'khMax', 'heightCm', 'spreadCm', 'flowTolerance', 'parMin', 'parMax', 'knowledgeBody'],
  invertebrate: ['salinityMin', 'salinityMax', 'ghMin', 'ghMax', 'khMin', 'khMax', 'calciumRequirement', 'stabilityRequirement', 'riskFlags', 'moltingType', 'minTankVolumeL', 'breedingDifficulty', 'maturityRequirement', 'biofilmRequirement', 'predatorPrey', 'knowledgeBody'],
  coral: ['growthForm', 'parMin', 'parMax', 'flowPattern', 'salinityMin', 'salinityMax', 'phMin', 'phMax', 'dkhMin', 'dkhMax', 'caMin', 'caMax', 'mgMin', 'mgMax', 'no3Min', 'no3Max', 'po4Min', 'po4Max', 'feedingType', 'growthRate', 'spacing', 'aggressionTraits', 'coralNeighbors', 'knowledgeBody'],
  equipment: ['waterType', 'turnoverPerH', 'ratedCapacity', 'compatibleEquipment', 'relatedProblems', 'knowledgeBody'],
  problem: ['howToDistinguish', 'immediateAction', 'treatment', 'recovery', 'prevention', 'monitoring', 'escalation'],
}

const EXPECTED_NEW_TYPES = [
  'compatibleEntry', 'incompatibleEntry', 'predatorPreyEntry', 'reefInteractionEntry', 'coralNeighborEntry',
  'speciesKnowledgeBody', 'coralKnowledgeBody', 'plantKnowledgeBody', 'invertebrateKnowledgeBody', 'equipmentKnowledgeBody',
]

const camelKey = (k: string) => k.replace(/^body:/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase())

function resolveQueueTarget(target: string): { domain: string; fields: string[]; value?: string; block?: string; objectParts?: string[] } {
  const idx = target.indexOf(': ')
  const domain = target.slice(0, idx)
  let rest = target.slice(idx + 2)
  if (rest.startsWith('newBlock:')) return { domain, fields: [], block: rest.slice('newBlock:'.length) }
  rest = rest.replace('ALLOLEPATHY', 'ALLELOPATHY').replace('ENCRASTING', 'ENCRUSTING')
  let value: string | undefined
  const bracket = rest.match(/^([A-Za-z0-9]+)\[([^\]]+)\]$/)
  if (bracket) return { domain, fields: [bracket[1]], value: bracket[2] }
  let objectParts: string[] | undefined
  const brace = rest.match(/^(.+?)\s*\{([^}]+)\}$/)
  if (brace) { rest = brace[1]; objectParts = brace[2].split(',').map((s) => s.trim()) }
  rest = rest.replace(/\s*\(ppt\).*/, '').replace(/\s+or\s+.*$/, '')
  const parts = rest.split(' + ').flatMap((p) => {
    const segs = p.split('/')
    if (segs.length === 2 && /^(Max|max)$/.test(segs[1]) && /[Mm]in$/.test(segs[0])) {
      return [segs[0], segs[0].replace(/[Mm]in$/, '') + (segs[1] === 'max' ? 'max' : 'Max')]
    }
    return segs
  })
  return { domain, fields: parts, objectParts }
}

describe('SPEC 10M schema validation (createSchema graph)', () => {
  it('builds the full schema graph with zero validation problems', async () => {
    const { createSchema } = await import('sanity')
    const { codeInput } = await import('@sanity/code-input')
    const plugin = codeInput() as any
    const all = [...schemaTypes, ...((plugin.schema && plugin.schema.types) || [])] as any[]
    const schema = createSchema({ name: 'default', types: all })
    const problems = ((schema as any)._validation || []).flatMap((g: any) =>
      (g.problems || []).map((p: any) => ({ type: g.type, severity: p.severity, message: p.message })))
    expect(problems.filter((p: any) => p.severity === 'error')).toEqual([])
    const names = schema.getTypeNames()
    for (const t of EXPECTED_NEW_TYPES) expect(names).toContain(t)
    expect(names).toContain('species')
    expect(names).toContain('problem')
  })
})

describe('SPEC 10M Gate C — P0 representations', () => {
  const sp = fieldsOf(species)
  it.each([
    ['jumpRisk', 'string', ['NONE', 'LOW', 'MODERATE', 'HIGH']],
    ['lidRequired', 'string', ['NOT_REQUIRED', 'RECOMMENDED', 'ESSENTIAL']],
    ['swimmingSpace', 'string', ['NONE', 'LOW', 'MODERATE', 'HIGH']],
  ])('%s exists with type %s and exact enum', (name, type, list) => {
    expect(sp[name]).toBeTruthy()
    expect(sp[name].type).toBe(type)
    expect(listValues(sp[name])).toEqual(list)
    expect(fieldIsRequired(sp[name])).toBe(false)
  })
  it.each(['minTankLengthCm', 'minTankWidthCm'])('%s numeric P0 field exists and is optional', (name) => {
    expect(sp[name]).toBeTruthy()
    expect(sp[name].type).toBe('number')
    expect(fieldIsRequired(sp[name])).toBe(false)
  })
  it('problem escalation block exists as portable-text array', () => {
    const f = fieldsOf(problem).escalation
    expect(f).toBeTruthy()
    expect(f.type).toBe('array')
    expect((f.of || []).map((o: any) => o.type)).toEqual(['block'])
  })
})

describe('SPEC 10M Gate B — migration queue coverage (106 items)', () => {
  const queue = parseCSV(read('report/SPEC_10/PRIORITY_MIGRATION_QUEUE.csv'))
  const implTargets = queue.filter((r) => ['SCHEMA_MIGRATION', 'BODY_BLOCK', 'RELATIONSHIP_SLOT'].includes(r.itemType))
  it('queue migration items = 76 (64 schema + 7 body + 5 relationship)', () => {
    expect(implTargets.length).toBe(76)
    expect(queue.length).toBe(106)
  })
  it.each(implTargets.map((r) => [r.queueId, r.target, r.itemType] as [string, string, string]))(
    '%s %s structurally implemented', (_id, target, itemType) => {
      const { domain, fields, value, block, objectParts } = resolveQueueTarget(target)
      const doc = TYPES[domain]
      expect(doc, `domain ${domain}`).toBeTruthy()
      if (itemType === 'BODY_BLOCK') {
        const f = fieldsOf(doc)[block!]
        expect(f, `block ${block}`).toBeTruthy()
        expect(f.type).toBe('array')
        expect((f.of || []).map((o: any) => o.type)).toEqual(['block'])
        return
      }
      for (const name of fields) {
        const f = fieldsOf(doc)[name]
        expect(f, `${domain}.${name} for target "${target}"`).toBeTruthy()
        if (value) {
          expect(listValues(f)).toContain(value)
          expect(f.type).toBe('array')
        }
      }
      if (objectParts && fields.length === 1) {
        const f = fieldsOf(doc)[fields[0]]
        const sub = (f.fields || []).map((s: any) => s.name)
        for (const p of objectParts) expect(sub).toContain(p)
      }
    },
  )
  it('alternative sgMin/sgMax representation NOT implemented (no duplicate source of truth)', () => {
    expect(fieldsOf(species).sgMin).toBeUndefined()
    expect(fieldsOf(species).sgMax).toBeUndefined()
    expect(fieldsOf(coral).sgMin).toBeUndefined()
    expect(fieldsOf(invertebrate).sgMin).toBeUndefined()
  })
})

describe('SPEC 10M — exact field additions vs approved set', () => {
  const before = JSON.parse(read('report/SPEC_10M/SCHEMA_INVENTORY_BEFORE.json'))
  it('no field removed anywhere; additions match approved lists exactly', () => {
    for (const t of before.schema.types) {
      const after = fieldsOf(TYPES[t.typeName])
      for (const f of t.fields) expect(after[f.name], `${t.typeName}.${f.name} must not be removed`).toBeTruthy()
      const beforeNames = new Set(t.fields.map((f: any) => f.name))
      const added = Object.keys(after).filter((n) => !beforeNames.has(n))
      expect(added.sort(), `${t.typeName} additions`).toEqual([...(EXPECTED_ADD[t.typeName] || [])].sort())
    }
  })
  it('only approved structural modifications: compatibleSpecies entry shape on 2 domains', () => {
    expect(fieldsOf(species).compatibleSpecies.of).toEqual([{ type: 'compatibleEntry' }])
    expect(fieldsOf(invertebrate).compatibleSpecies.of).toEqual([{ type: 'compatibleEntry' }])
    expect(fieldsOf(coral).reefCompatibility.type).toBe('boolean')
    expect(fieldsOf(species).tankSizeMinL.type).toBe('number')
    expect(fieldsOf(equipment).flowRateLh.type).toBe('number')
    expect(fieldsOf(species).reefCompatibility.type).toBe('boolean')
  })
  it('all newly added document-level fields are optional (no field-level required)', () => {
    for (const [domain, names] of Object.entries(EXPECTED_ADD)) {
      const fs2 = fieldsOf(TYPES[domain])
      for (const n of names) expect(fieldIsRequired(fs2[n]), `${domain}.${n} optional`).toBe(false)
    }
  })
  it('index registers all 10 new structure types', () => {
    const src = read('sanity/schemaTypes/index.ts')
    for (const t of EXPECTED_NEW_TYPES) {
      expect(src).toContain(t)
    }
    expect(schemaTypes.map((t: any) => t.name)).toEqual(expect.arrayContaining(EXPECTED_NEW_TYPES))
  })
})

describe('SPEC 10M Gate D — relationship structures', () => {
  const sp = fieldsOf(species)
  const inv = fieldsOf(invertebrate)
  const eq = fieldsOf(equipment)
  const cor = fieldsOf(coral)
  it('REL-P01 incompatibleSpecies with required reason enum', () => {
    expect(sp.incompatibleSpecies.of).toEqual([{ type: 'incompatibleEntry' }])
    const reason = (incompatibleEntry.fields || []).find((f: any) => f.name === 'reason')
    expect(listValues(reason)).toEqual(['predation', 'temperament', 'size', 'water'])
    expect(fieldIsRequired(reason)).toBe(true)
  })
  it('REL-M01/M02 compatibleEntry carries conditions[] + evidence rule + confidence vocab', () => {
    const names = (compatibleEntry.fields || []).map((f: any) => f.name)
    expect(names).toEqual(expect.arrayContaining(['ref', 'conditions', 'confidence', 'evidenceNote']))
    const cond: any = (compatibleEntry.fields || []).find((f: any) => f.name === 'conditions')
    expect(cond.type).toBe('array')
    const conf = (compatibleEntry.fields || []).find((f: any) => f.name === 'confidence')
    expect(listValues(conf)).toEqual(['HIGH', 'MEDIUM', 'LOW', 'UNVERIFIED'])
    expect(schemaTypes.map((t: any) => t.name)).toContain('compatibleEntry')
  })
  it('REL-P02 predatorPrey typed refs on species + invertebrate with evidence note required', () => {
    expect(sp.predatorPrey.of).toEqual([{ type: 'predatorPreyEntry' }])
    expect(inv.predatorPrey.of).toEqual([{ type: 'predatorPreyEntry' }])
    const ref: any = (predatorPreyEntry.fields || []).find((f: any) => f.name === 'ref')
    expect(ref.to).toEqual(expect.arrayContaining([{ type: 'species' }, { type: 'invertebrate' }]))
    const ev = (predatorPreyEntry.fields || []).find((f: any) => f.name === 'evidenceNote')
    expect(fieldIsRequired(ev)).toBe(true)
  })
  it('REL-P03 reefInteraction detail object shares tier enum with species.reefInteraction field', () => {
    expect(sp.reefInteractionDetail.of).toEqual([{ type: 'reefInteractionEntry' }])
    const tier = (reefInteractionEntry.fields || []).find((f: any) => f.name === 'tier')
    expect(listValues(tier)).toEqual(['REEF_SAFE', 'CAUTION', 'SPECIES_DEPENDENT', 'NOT_REEF_SAFE'])
    expect(listValues(sp.reefInteraction)).toEqual(listValues(tier))
    const coralRef: any = (reefInteractionEntry.fields || []).find((f: any) => f.name === 'coral')
    expect(coralRef.to).toEqual([{ type: 'coral' }])
  })
  it('REL-P04 coralNeighbors with aggression relation enum', () => {
    expect(cor.coralNeighbors.of).toEqual([{ type: 'coralNeighborEntry' }])
    const rel = (coralNeighborEntry.fields || []).find((f: any) => f.name === 'relation')
    expect(listValues(rel)).toEqual(['SWEEP', 'STING', 'SHADE', 'ALLELOPATHY', 'OVERGROW'])
  })
  it('REL-P05/P06 equipment compatibleEquipment + relatedProblems plain refs', () => {
    expect(eq.compatibleEquipment.of).toEqual([{ type: 'reference', to: [{ type: 'equipment' }] }])
    expect(eq.relatedProblems.of).toEqual([{ type: 'reference', to: [{ type: 'problem' }] }])
  })
  it('REL-D01 problem has no derived back-reference field (no duplicate source of truth)', () => {
    expect(fieldsOf(problem).relatedSpecies).toBeUndefined()
    expect(fieldsOf(problem).speciesBackrefs).toBeUndefined()
  })
  it('existing relationship slot shapes preserved (references stay references)', () => {
    expect(fieldsOf(species).compatiblePlants.of).toEqual([{ type: 'reference', to: [{ type: 'plant' }] }])
    expect(fieldsOf(species).compatibleInvertebrates.of).toEqual([{ type: 'reference', to: [{ type: 'invertebrate' }] }])
    expect(fieldsOf(species).suitableEquipment.of).toEqual([{ type: 'reference', to: [{ type: 'equipment' }] }])
    expect(fieldsOf(species).relatedProblems.of).toEqual([{ type: 'reference', to: [{ type: 'problem' }] }])
    expect(fieldsOf(invertebrate).suitableEquipment.of).toEqual([{ type: 'reference', to: [{ type: 'equipment' }] }])
    expect(fieldsOf(coral).relatedProblems.of).toEqual([{ type: 'reference', to: [{ type: 'problem' }] }])
  })
})

describe('SPEC 10M Gate E — six body architectures', () => {
  const bodySections = (t: any) => (t.fields || []).map((f: any) => f.name)
  const isBlocks = (t: any, name: string) => {
    const f = (t.fields || []).find((x: any) => x.name === name)
    return !!f && f.type === 'array' && (f.of || []).every((o: any) => o.type === 'block')
  }
  const bodies: [string, any, number][] = [
    ['species', speciesKnowledgeBody, 12],
    ['coral', coralKnowledgeBody, 15],
    ['plant', plantKnowledgeBody, 13],
    ['invertebrate', invertebrateKnowledgeBody, 11],
    ['equipment', equipmentKnowledgeBody, 10],
  ]
  it.each(bodies)('%s body type supports its architecture sections', (name, type, minSections) => {
    const sections = bodySections(type)
    expect(sections.length).toBeGreaterThanOrEqual(minSections)
    for (const s of sections) expect(isBlocks(type, s), `${name} body section ${s}`).toBe(true)
    expect(sections).toContain('practicalVerdict')
  })
  it('domain documents expose exactly one knowledgeBody field of the right type', () => {
    expect(fieldsOf(species).knowledgeBody.type).toBe('speciesKnowledgeBody')
    expect(fieldsOf(coral).knowledgeBody.type).toBe('coralKnowledgeBody')
    expect(fieldsOf(plant).knowledgeBody.type).toBe('plantKnowledgeBody')
    expect(fieldsOf(invertebrate).knowledgeBody.type).toBe('invertebrateKnowledgeBody')
    expect(fieldsOf(equipment).knowledgeBody.type).toBe('equipmentKnowledgeBody')
  })
  it('every matrix body key maps to a body section field', () => {
    const matrix = parseCSV(read('report/SPEC_10/KNOWLEDGE_ARCHITECTURE_MATRIX.csv'))
    const bodyRows = matrix.filter((r) => r.primaryRepresentation === 'BODY')
    expect(bodyRows.length).toBe(95)
    const sectionRows = bodyRows.filter((r) => r.target.startsWith('body:'))
    expect(sectionRows.length).toBe(87)
    expect(bodyRows.filter((r) => r.target.startsWith('newBlock:')).length).toBe(8)
    const byDomain: Record<string, Set<string>> = {}
    for (const r of sectionRows) (byDomain[r.domain] = byDomain[r.domain] || new Set()).add(camelKey(r.target))
    const docFor: Record<string, any> = {
      species: speciesKnowledgeBody, plant: plantKnowledgeBody, invertebrate: invertebrateKnowledgeBody,
      coral: coralKnowledgeBody, equipment: equipmentKnowledgeBody,
    }
    for (const [domain, keys] of Object.entries(byDomain)) {
      const sections = new Set(bodySections(docFor[domain]))
      for (const k of keys) expect(sections.has(k), `${domain} section for ${k}`).toBe(true)
    }
  })
  it('problem supports the approved 8-section architecture via 11 block fields', () => {
    const blockFields = ['symptoms', 'causes', 'whatToCheck', 'whatNotToDo', 'howToDistinguish', 'immediateAction', 'treatment', 'recovery', 'prevention', 'monitoring', 'escalation']
    const f = fieldsOf(problem)
    for (const b of blockFields) {
      expect(f[b], `problem.${b}`).toBeTruthy()
      expect(f[b].type).toBe('array')
      expect((f[b].of || []).map((o: any) => o.type)).toEqual(['block'])
    }
    const matrix = parseCSV(read('report/SPEC_10/KNOWLEDGE_ARCHITECTURE_MATRIX.csv'))
    const blocks = matrix.filter((r) => r.target.startsWith('newBlock:')).map((r) => r.target.split(':')[1].split(' ')[0])
    for (const b of new Set(blocks)) expect(f[b], `matrix block ${b}`).toBeTruthy()
  })
})

describe('SPEC 10M — no invented husbandry defaults / controlled vocabulary sanity', () => {
  it('no new field carries a default value', () => {
    for (const [domain, names] of Object.entries(EXPECTED_ADD)) {
      const fs2 = fieldsOf(TYPES[domain])
      for (const n of names) expect(fs2[n].initialValue, `${domain}.${n} no default`).toBeUndefined()
    }
  })
  it('numeric semantics: min/max pairs implemented as separate numeric fields', () => {
    const pairs: [any, string, string][] = [
      [species, 'khMin', 'khMax'], [species, 'salinityMin', 'salinityMax'],
      [plant, 'ghMin', 'ghMax'], [plant, 'khMin', 'khMax'], [plant, 'parMin', 'parMax'],
      [invertebrate, 'salinityMin', 'salinityMax'], [invertebrate, 'ghMin', 'ghMax'], [invertebrate, 'khMin', 'khMax'],
      [coral, 'phMin', 'phMax'], [coral, 'dkhMin', 'dkhMax'], [coral, 'caMin', 'caMax'], [coral, 'mgMin', 'mgMax'],
      [coral, 'no3Min', 'no3Max'], [coral, 'po4Min', 'po4Max'], [coral, 'salinityMin', 'salinityMax'], [coral, 'parMin', 'parMax'],
    ]
    for (const [type, a, b] of pairs) {
      const f = fieldsOf(type)
      expect(f[a].type, `${a}`).toBe('number')
      expect(f[b].type, `${b}`).toBe('number')
    }
  })
  it('multi-select flags are arrays of strings with exact vocabularies', () => {
    expect(listValues(fieldsOf(species).behaviorFlags)).toEqual(
      ['open-water', 'territorial', 'solitary', 'nocturnal', 'diurnal', 'burrower', 'cave-dweller', 'strong-swimmer', 'timid'])
    expect(listValues(fieldsOf(invertebrate).riskFlags)).toEqual(['STARVATION', 'ESCAPE'])
    expect(listValues(fieldsOf(coral).aggressionTraits)).toEqual(['SWEEPER', 'ALLELOPATHY', 'STING'])
  })
})
