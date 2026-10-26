import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'invertebrate',
  title: 'Invertebrate (Shrimp, Snail, Crab…)',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (Rule: any) => Rule.required() }),
    defineField({
      name: 'scientificName', title: 'Scientific Name', type: 'string',
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3 }),
    defineField({
      name: 'localNames', title: 'Local / Trade Names', type: 'array',
      description: 'Verified Vietnamese, regional, or aquarium trade names for discovery.',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'aliases', title: 'Search Aliases', type: 'array',
      description: 'Alternate common names, accepted search synonyms, or common spelling variants.',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'parentSpecies', title: 'Parent Species', type: 'reference',
      description: 'If this is a variant/morph, point to the canonical species record.',
      to: [{ type: 'invertebrate' }],
    }),
    defineField({ name: 'publishedAt', title: 'Published at', type: 'datetime' }),
    defineField({
      name: 'waterType', title: 'Water Type', type: 'string',
      options: { list: ['freshwater', 'saltwater', 'brackish'] },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'group', title: 'Group', type: 'string',
      options: { list: ['shrimp', 'snail', 'starfish', 'crab', 'anemone', 'urchin', 'other'] },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({ name: 'sizeCm', title: 'Adult Size (cm)', type: 'number', validation: (Rule: any) => Rule.min(0.1).max(100) }),
    defineField({
      name: 'tempMinC', title: 'Min Temperature (°C)', type: 'number',
      validation: (Rule: any) => Rule.min(0).max(40),
    }),
    defineField({
      name: 'tempMaxC', title: 'Max Temperature (°C)', type: 'number',
      validation: (Rule: any) => Rule.min(0).max(40),
    }),
    defineField({
      name: 'phMin', title: 'Min pH', type: 'number',
      validation: (Rule: any) => Rule.min(3).max(11),
    }),
    defineField({
      name: 'phMax', title: 'Max pH', type: 'number',
      validation: (Rule: any) => Rule.min(3).max(11),
    }),
    defineField({
      name: 'difficulty', title: 'Difficulty', type: 'string',
      options: { list: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
    }),
    defineField({
      name: 'diet', title: 'Diet', type: 'string',
      options: { list: ['Carnivore', 'Omnivore', 'Herbivore', 'Scavenger', 'Detritivore', 'Filter feeder'] },
    }),
    defineField({
      name: 'temperament', title: 'Temperament', type: 'string',
      options: { list: ['Peaceful', 'Semi-aggressive', 'Aggressive'] },
    }),
    defineField({
      name: 'aquariumStyle', title: 'Aquarium Style', type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Community', value: 'Community' },
          { title: 'Shrimp', value: 'Shrimp' },
          { title: 'Planted', value: 'Planted' },
          { title: 'Low-Tech', value: 'Low-Tech' },
          { title: 'Mixed Reef', value: 'Mixed Reef' },
          { title: 'Invertebrate-focused', value: 'Invertebrate-focused' },
          { title: 'Fish Only', value: 'Fish Only' },
          { title: 'Nano Reef', value: 'Nano Reef' },
          { title: 'Anemone / Clownfish', value: 'Anemone / Clownfish' },
        ],
      },
    }),
    defineField({
      name: 'region', title: 'Region', type: 'string',
      options: {
        list: [
          { title: 'South America', value: 'South America' },
          { title: 'Amazon Basin', value: 'Amazon Basin' },
          { title: 'Southeast Asia', value: 'Southeast Asia' },
          { title: 'South Asia', value: 'South Asia' },
          { title: 'East Asia', value: 'East Asia' },
          { title: 'Africa', value: 'Africa' },
          { title: 'Marine Indo-Pacific', value: 'Marine Indo-Pacific' },
          { title: 'Caribbean / Western Atlantic', value: 'Caribbean / Western Atlantic' },
          { title: 'Red Sea', value: 'Red Sea' },
        ],
      },
    }),
    defineField({ name: 'reefCompatibility', title: 'Reef Compatible?', type: 'boolean' }),
    defineField({
      name: 'compatibleSpecies', title: 'Compatible Species', type: 'array',
      of: [{ type: 'compatibleEntry' }],
      description: 'Conditional compatibility entries with optional conditions[] (SPEC 10 REL-M01/M02).',
    }),
    defineField({
      name: 'suitableEquipment', title: 'Suitable Equipment', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'equipment' }] }],
    }),
    defineField({
      name: 'relatedProblems', title: 'Common Problems', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'problem' }] }],
    }),
    defineField({
      name: 'mainImage', title: 'Main Image', type: 'image', options: { hotspot: true },
    }),
    defineField({
      name: 'relatedPosts', title: 'Related Posts', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'post' }] }],
    }),
    defineField({
      name: 'salinityMin', title: 'Min Salinity (ppt)', type: 'number',
      validation: (Rule: any) => Rule.min(0),
    }),
    defineField({
      name: 'salinityMax', title: 'Max Salinity (ppt)', type: 'number',
      validation: (Rule: any) => Rule.min(0).custom((val: any, ctx: any) => {
        const min = ctx?.parent?.salinityMin;
        if (val == null || min == null) return true;
        return val >= min || 'salinityMax must be >= salinityMin';
      }),
    }),
    defineField({
      name: 'ghMin', title: 'Min GH (dGH)', type: 'number',
      validation: (Rule: any) => Rule.min(0).max(40),
    }),
    defineField({
      name: 'ghMax', title: 'Max GH (dGH)', type: 'number',
      validation: (Rule: any) => Rule.min(0).max(40).custom((val: any, ctx: any) => {
        const min = ctx?.parent?.ghMin;
        if (val == null || min == null) return true;
        return val >= min || 'ghMax must be >= ghMin';
      }),
    }),
    defineField({
      name: 'khMin', title: 'Min KH (dKH)', type: 'number',
      validation: (Rule: any) => Rule.min(0).max(40),
    }),
    defineField({
      name: 'khMax', title: 'Max KH (dKH)', type: 'number',
      validation: (Rule: any) => Rule.min(0).max(40).custom((val: any, ctx: any) => {
        const min = ctx?.parent?.khMin;
        if (val == null || min == null) return true;
        return val >= min || 'khMax must be >= khMin';
      }),
    }),
    defineField({
      name: 'calciumRequirement', title: 'Calcium Requirement', type: 'string',
      options: { list: ['NONE', 'SUGGESTED', 'REQUIRED'] },
    }),
    defineField({
      name: 'stabilityRequirement', title: 'Stability Requirement', type: 'string',
      options: { list: ['LOW', 'MODERATE', 'CRITICAL'] },
    }),
    defineField({
      name: 'riskFlags', title: 'Risk Flags', type: 'array',
      of: [{ type: 'string' }],
      description: 'Non-exclusive risk flags. Absence is not a negative claim.',
      options: { list: ['STARVATION', 'ESCAPE'] },
    }),
    defineField({
      name: 'moltingType', title: 'Molting Type', type: 'string',
      options: { list: ['NONE', 'RARE', 'FREQUENT'] },
    }),
    defineField({
      name: 'minTankVolumeL', title: 'Min Tank Volume (L)', type: 'number',
      validation: (Rule: any) => Rule.min(1),
    }),
    defineField({
      name: 'breedingDifficulty', title: 'Breeding Difficulty', type: 'string',
      options: { list: ['EASY', 'MODERATE', 'DIFFICULT'] },
    }),
    defineField({
      name: 'maturityRequirement', title: 'Mature Aquarium Requirement', type: 'string',
      options: { list: ['NONE', 'SUGGESTED', 'REQUIRED'] },
    }),
    defineField({
      name: 'biofilmRequirement', title: 'Biofilm Requirement', type: 'string',
      options: { list: ['NONE', 'REQUIRED'] },
    }),
    defineField({
      name: 'predatorPrey', title: 'Predator / Prey', type: 'array',
      of: [{ type: 'predatorPreyEntry' }],
      description: 'Predator -> prey typed references with size condition and evidence note.',
    }),
    defineField({
      name: 'knowledgeBody', title: 'Knowledge Body', type: 'invertebrateKnowledgeBody',
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'scientificName', media: 'mainImage' },
  },
})
