import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'coral',
  title: 'Coral',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (Rule: any) => Rule.required() }),
    defineField({ name: 'scientificName', title: 'Scientific Name', type: 'string' }),
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
      name: 'group', title: 'Coral Group', type: 'string',
      description: 'Hobbyist or taxonomic grouping.',
      options: {
        list: [
          'LPS', 'SPS', 'Soft', 'NPS', 'Mushroom', 'Anemone',
          'Polyp', 'Colony', 'Single Polyp', 'Other',
        ],
      },
    }),
    defineField({ name: 'publishedAt', title: 'Published at', type: 'datetime' }),
    defineField({
      name: 'light', title: 'Light Requirement', type: 'string',
      options: { list: ['Low', 'Moderate', 'High', 'Very High'] },
    }),
    defineField({
      name: 'flow', title: 'Flow Requirement', type: 'string',
      options: { list: ['Low', 'Moderate', 'High'] },
    }),
    defineField({
      name: 'difficulty', title: 'Difficulty', type: 'string',
      options: { list: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
    }),
    defineField({
      name: 'coralType', title: 'Coral Type', type: 'string',
      options: { list: ['soft', 'lps', 'sps', 'nps'] },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'placement', title: 'Placement', type: 'string',
      options: { list: ['Sand bed', 'Low rock', 'Mid rock', 'High rock'] },
    }),
    defineField({
      name: 'aggression', title: 'Aggression', type: 'string',
      options: { list: ['Peaceful', 'Semi-aggressive', 'Aggressive'] },
    }),
    defineField({ name: 'reefCompatibility', title: 'Reef Safe?', type: 'boolean' }),
    defineField({ name: 'photosynthetic', title: 'Photosynthetic?', type: 'boolean' }),
    defineField({
      name: 'suitableEquipment', title: 'Suitable Equipment', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'equipment' }] }],
    }),
    defineField({
      name: 'relatedProblems', title: 'Common Problems', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'problem' }] }],
    }),
    defineField({
      name: 'aquariumStyle', title: 'Aquarium Style', type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Nano Reef', value: 'Nano Reef' },
          { title: 'Mixed Reef', value: 'Mixed Reef' },
          { title: 'Soft Coral Reef', value: 'Soft Coral Reef' },
          { title: 'LPS Reef', value: 'LPS Reef' },
          { title: 'SPS Reef', value: 'SPS Reef' },
          { title: 'NPS', value: 'NPS' },
          { title: 'Anemone / Clownfish', value: 'Anemone / Clownfish' },
          { title: 'Invertebrate-focused', value: 'Invertebrate-focused' },
        ],
      },
    }),
    defineField({
      name: 'tempMinC', title: 'Min Temperature (°C)', type: 'number',
      validation: (Rule: any) => Rule.min(0).max(35),
    }),
    defineField({
      name: 'tempMaxC', title: 'Max Temperature (°C)', type: 'number',
      validation: (Rule: any) => Rule.min(0).max(35),
    }),
    defineField({
      name: 'mainImage', title: 'Main Image', type: 'image', options: { hotspot: true },
    }),
    defineField({
      name: 'relatedPosts', title: 'Related Posts', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'post' }] }],
    }),
    defineField({
      name: 'growthForm', title: 'Growth Form', type: 'string',
      options: { list: ['BRANCHING', 'PLATING', 'ENCRUSTING', 'MASSIVE', 'FOLIACEOUS'] },
    }),
    defineField({
      name: 'parMin', title: 'Min PAR', type: 'number',
      validation: (Rule: any) => Rule.min(0),
    }),
    defineField({
      name: 'parMax', title: 'Max PAR', type: 'number',
      validation: (Rule: any) => Rule.min(0).custom((val: any, ctx: any) => {
        const min = ctx?.parent?.parMin;
        if (val == null || min == null) return true;
        return val >= min || 'parMax must be >= parMin';
      }),
    }),
    defineField({
      name: 'flowPattern', title: 'Flow Pattern', type: 'string',
      options: { list: ['DIRECT', 'INDIRECT', 'RANDOM', 'OSCILLATING', 'LAMINAR'] },
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
      name: 'phMin', title: 'Min pH', type: 'number',
      validation: (Rule: any) => Rule.min(3).max(11),
    }),
    defineField({
      name: 'phMax', title: 'Max pH', type: 'number',
      validation: (Rule: any) => Rule.min(3).max(11).custom((val: any, ctx: any) => {
        const min = ctx?.parent?.phMin;
        if (val == null || min == null) return true;
        return val >= min || 'phMax must be >= phMin';
      }),
    }),
    defineField({
      name: 'dkhMin', title: 'Min Alkalinity (dKH)', type: 'number',
      validation: (Rule: any) => Rule.min(0),
    }),
    defineField({
      name: 'dkhMax', title: 'Max Alkalinity (dKH)', type: 'number',
      validation: (Rule: any) => Rule.min(0).custom((val: any, ctx: any) => {
        const min = ctx?.parent?.dkhMin;
        if (val == null || min == null) return true;
        return val >= min || 'dkhMax must be >= dkhMin';
      }),
    }),
    defineField({
      name: 'caMin', title: 'Min Calcium (ppm)', type: 'number',
      validation: (Rule: any) => Rule.min(0),
    }),
    defineField({
      name: 'caMax', title: 'Max Calcium (ppm)', type: 'number',
      validation: (Rule: any) => Rule.min(0).custom((val: any, ctx: any) => {
        const min = ctx?.parent?.caMin;
        if (val == null || min == null) return true;
        return val >= min || 'caMax must be >= caMin';
      }),
    }),
    defineField({
      name: 'mgMin', title: 'Min Magnesium (ppm)', type: 'number',
      validation: (Rule: any) => Rule.min(0),
    }),
    defineField({
      name: 'mgMax', title: 'Max Magnesium (ppm)', type: 'number',
      validation: (Rule: any) => Rule.min(0).custom((val: any, ctx: any) => {
        const min = ctx?.parent?.mgMin;
        if (val == null || min == null) return true;
        return val >= min || 'mgMax must be >= mgMin';
      }),
    }),
    defineField({
      name: 'no3Min', title: 'Min Nitrate (ppm)', type: 'number',
      validation: (Rule: any) => Rule.min(0),
    }),
    defineField({
      name: 'no3Max', title: 'Max Nitrate (ppm)', type: 'number',
      validation: (Rule: any) => Rule.min(0).custom((val: any, ctx: any) => {
        const min = ctx?.parent?.no3Min;
        if (val == null || min == null) return true;
        return val >= min || 'no3Max must be >= no3Min';
      }),
    }),
    defineField({
      name: 'po4Min', title: 'Min Phosphate (ppm)', type: 'number',
      validation: (Rule: any) => Rule.min(0),
    }),
    defineField({
      name: 'po4Max', title: 'Max Phosphate (ppm)', type: 'number',
      validation: (Rule: any) => Rule.min(0).custom((val: any, ctx: any) => {
        const min = ctx?.parent?.po4Min;
        if (val == null || min == null) return true;
        return val >= min || 'po4Max must be >= po4Min';
      }),
    }),
    defineField({
      name: 'feedingType', title: 'Feeding Type', type: 'string',
      options: { list: ['ZOOXANTHELLAE', 'MIXED', 'CARNIVOROUS', 'NPS'] },
    }),
    defineField({
      name: 'growthRate', title: 'Growth Rate', type: 'string',
      options: { list: ['SLOW', 'MODERATE', 'FAST'] },
    }),
    defineField({
      name: 'spacing', title: 'Spacing', type: 'string',
      options: { list: ['CLOSE', 'MODERATE', 'SPACED'] },
    }),
    defineField({
      name: 'aggressionTraits', title: 'Aggression Traits', type: 'array',
      of: [{ type: 'string' }],
      description: 'Non-exclusive aggression traits. Absence is not a negative claim.',
      options: { list: ['SWEEPER', 'ALLELOPATHY', 'STING'] },
    }),
    defineField({
      name: 'coralNeighbors', title: 'Coral Neighbors', type: 'array',
      of: [{ type: 'coralNeighborEntry' }],
      description: 'Coral-to-coral neighbors with aggression relation type.',
    }),
    defineField({
      name: 'knowledgeBody', title: 'Knowledge Body', type: 'coralKnowledgeBody',
    }),
  ],
  preview: {
    select: { title: 'name', media: 'mainImage' },
  },
})
