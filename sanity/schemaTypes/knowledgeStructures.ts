import { defineType, defineField } from 'sanity'

export const compatibleEntry = defineType({
  name: 'compatibleEntry',
  title: 'Compatible Species Entry',
  type: 'object',
  fields: [
    defineField({
      name: 'ref', title: 'Species', type: 'reference', to: [{ type: 'species' }],
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'conditions', title: 'Conditions', type: 'array', of: [{ type: 'string' }],
      description: 'Conditional compatibility conditions. Empty conditions mean unconditional compatibility. Absence of conditions is not a negative claim.',
    }),
    defineField({
      name: 'confidence', title: 'Confidence', type: 'string',
      options: { list: ['HIGH', 'MEDIUM', 'LOW', 'UNVERIFIED'] },
    }),
    defineField({
      name: 'evidenceNote', title: 'Evidence Note', type: 'text', rows: 2,
      validation: (Rule: any) => Rule.custom((val: any, ctx: any) => {
        const parent = ctx?.parent;
        if (parent && Array.isArray(parent.conditions) && parent.conditions.length > 0 && !val) {
          return 'Evidence note required when conditions are used';
        }
        return true;
      }),
    }),
  ],
})

export const incompatibleEntry = defineType({
  name: 'incompatibleEntry',
  title: 'Incompatible Species Entry',
  type: 'object',
  fields: [
    defineField({
      name: 'ref', title: 'Species', type: 'reference', to: [{ type: 'species' }],
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'reason', title: 'Reason', type: 'string',
      options: { list: ['predation', 'temperament', 'size', 'water'] },
      validation: (Rule: any) => Rule.required(),
    }),
  ],
})

export const predatorPreyEntry = defineType({
  name: 'predatorPreyEntry',
  title: 'Predator / Prey Entry',
  type: 'object',
  fields: [
    defineField({
      name: 'ref', title: 'Prey', type: 'reference', to: [{ type: 'species' }, { type: 'invertebrate' }],
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({ name: 'sizeCondition', title: 'Size Condition', type: 'text', rows: 2, description: 'Size at which the predation risk applies.' }),
    defineField({
      name: 'evidenceNote', title: 'Evidence Note', type: 'text', rows: 2,
      validation: (Rule: any) => Rule.required(),
    }),
  ],
})

export const reefInteractionEntry = defineType({
  name: 'reefInteractionEntry',
  title: 'Reef Interaction Detail Entry',
  type: 'object',
  fields: [
    defineField({
      name: 'coral', title: 'Coral', type: 'reference', to: [{ type: 'coral' }],
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'tier', title: 'Tier', type: 'string',
      options: { list: ['REEF_SAFE', 'CAUTION', 'SPECIES_DEPENDENT', 'NOT_REEF_SAFE'] },
      description: 'Shared tier vocabulary with the species.reefInteraction field.',
    }),
    defineField({
      name: 'targets', title: 'Targets', type: 'array', of: [{ type: 'string' }],
      options: { list: ['soft', 'lps', 'sps', 'nps'] },
    }),
    defineField({ name: 'frequency', title: 'Frequency', type: 'text', rows: 1 }),
    defineField({ name: 'monitoring', title: 'Monitoring', type: 'text', rows: 2 }),
  ],
})

export const coralNeighborEntry = defineType({
  name: 'coralNeighborEntry',
  title: 'Coral Neighbor Entry',
  type: 'object',
  fields: [
    defineField({
      name: 'ref', title: 'Coral', type: 'reference', to: [{ type: 'coral' }],
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'relation', title: 'Relation', type: 'string',
      options: { list: ['SWEEP', 'STING', 'SHADE', 'ALLELOPATHY', 'OVERGROW'] },
    }),
    defineField({ name: 'evidenceNote', title: 'Distance / Evidence Note', type: 'text', rows: 2 }),
  ],
})

const section = (name: string, title: string) =>
  defineField({ name, title, type: 'array', of: [{ type: 'block' }] })

export const speciesKnowledgeBody = defineType({
  name: 'speciesKnowledgeBody',
  title: 'Species Knowledge Body',
  type: 'object',
  fields: [
    section('overview', 'Overview'),
    section('adultSizeGrowth', 'Adult Size & Growth'),
    section('behavior', 'Behavior'),
    section('tankRequirements', 'Tank Requirements'),
    section('swimmingSpaceFootprint', 'Swimming Space & Footprint'),
    section('waterParameters', 'Water Parameters'),
    section('feeding', 'Feeding'),
    section('compatibility', 'Compatibility'),
    section('specialRequirements', 'Special Requirements'),
    section('commonProblems', 'Common Problems'),
    section('breeding', 'Breeding (where applicable)'),
    section('practicalVerdict', 'Practical Verdict'),
  ],
})

export const coralKnowledgeBody = defineType({
  name: 'coralKnowledgeBody',
  title: 'Coral Knowledge Body',
  type: 'object',
  fields: [
    section('overview', 'Overview'),
    section('placement', 'Placement'),
    section('lightingPar', 'Lighting & PAR'),
    section('flow', 'Flow'),
    section('waterChemistry', 'Water Chemistry'),
    section('nutrition', 'Nutrition'),
    section('growth', 'Growth'),
    section('aggressionSpacing', 'Aggression & Spacing'),
    section('compatibility', 'Compatibility'),
    section('commonProblems', 'Common Problems'),
    section('acclimation', 'Acclimation'),
    section('practicalVerdict', 'Practical Verdict'),
    section('lightingRisks', 'Lighting Risks'),
    section('reefCaveats', 'Reef Caveats'),
    section('chemistryProblems', 'Chemistry Problems'),
  ],
})

export const plantKnowledgeBody = defineType({
  name: 'plantKnowledgeBody',
  title: 'Plant Knowledge Body',
  type: 'object',
  fields: [
    section('overview', 'Overview'),
    section('light', 'Light'),
    section('co2', 'CO2'),
    section('nutrients', 'Nutrients'),
    section('substrate', 'Substrate'),
    section('placement', 'Placement'),
    section('growthAndTrimming', 'Growth & Trimming'),
    section('waterParameters', 'Water Parameters'),
    section('commonDeficiencies', 'Common Deficiencies'),
    section('algaeSensitivity', 'Algae Sensitivity'),
    section('practicalVerdict', 'Practical Verdict'),
    section('commonProblems', 'Common Problems'),
    section('transition', 'Transition'),
  ],
})

export const invertebrateKnowledgeBody = defineType({
  name: 'invertebrateKnowledgeBody',
  title: 'Invertebrate Knowledge Body',
  type: 'object',
  fields: [
    section('overview', 'Overview'),
    section('tankRequirements', 'Tank Requirements'),
    section('waterParameters', 'Water Parameters'),
    section('dietAndFeeding', 'Diet & Feeding'),
    section('molting', 'Molting / Growth'),
    section('compatibility', 'Compatibility'),
    section('predators', 'Predators'),
    section('maturityBiofilm', 'Maturity / Biofilm'),
    section('breeding', 'Breeding'),
    section('commonProblems', 'Common Problems'),
    section('practicalVerdict', 'Practical Verdict'),
  ],
})

export const equipmentKnowledgeBody = defineType({
  name: 'equipmentKnowledgeBody',
  title: 'Equipment Knowledge Body',
  type: 'object',
  fields: [
    section('whatItDoes', 'What It Does'),
    section('specifications', 'Specifications'),
    section('realWorldCapacity', 'Real-World Capacity'),
    section('bestUse', 'Best Use'),
    section('limitations', 'Limitations'),
    section('compatibility', 'Compatibility'),
    section('maintenance', 'Maintenance'),
    section('failureModes', 'Failure Modes'),
    section('safety', 'Safety'),
    section('practicalVerdict', 'Practical Verdict'),
  ],
})
