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
      of: [{ type: 'reference', to: [{ type: 'species' }] }],
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
  ],
  preview: {
    select: { title: 'name', subtitle: 'scientificName', media: 'mainImage' },
  },
})
