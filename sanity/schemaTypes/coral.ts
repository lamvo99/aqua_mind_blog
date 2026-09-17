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
  ],
  preview: {
    select: { title: 'name', media: 'mainImage' },
  },
})
