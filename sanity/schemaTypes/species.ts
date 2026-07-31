import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'species',
  title: 'Fish Species',
  type: 'document',
  groups: [
    { name: 'identity', title: 'Identity' },
    { name: 'care', title: 'Care' },
    { name: 'compatibility', title: 'Compatibility' },
    { name: 'media', title: 'Media' },
    { name: 'seo', title: 'SEO' },
    { name: 'related', title: 'Related' },
  ],
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', group: 'identity', validation: (Rule: any) => Rule.required() }),
    defineField({ name: 'scientificName', title: 'Scientific Name', type: 'string', group: 'identity' }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug', group: 'identity',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({ name: 'family', title: 'Family', type: 'string', group: 'identity' }),
    defineField({ name: 'origin', title: 'Origin', type: 'string', group: 'identity' }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3, group: 'identity' }),
    defineField({ name: 'publishedAt', title: 'Published at', type: 'datetime', group: 'seo' }),
    defineField({
      name: 'sizeCm', title: 'Adult Size (cm)', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(0.5).max(500),
    }),
    defineField({
      name: 'tankSizeMinL', title: 'Minimum Tank Size (L)', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(1),
    }),
    defineField({
      name: 'tempMinC', title: 'Min Temperature (°C)', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(0).max(40),
    }),
    defineField({
      name: 'tempMaxC', title: 'Max Temperature (°C)', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(0).max(40),
    }),
    defineField({
      name: 'phMin', title: 'Min pH', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(3).max(11),
    }),
    defineField({
      name: 'phMax', title: 'Max pH', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(3).max(11),
    }),
    defineField({
      name: 'ghMin', title: 'Min GH (dGH)', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(0).max(40),
    }),
    defineField({
      name: 'ghMax', title: 'Max GH (dGH)', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(0).max(40),
    }),
    defineField({
      name: 'diet', title: 'Diet', type: 'string', group: 'care',
      options: { list: ['Carnivore', 'Omnivore', 'Herbivore', 'Micropredator'] },
    }),
    defineField({
      name: 'temperament', title: 'Temperament', type: 'string', group: 'care',
      options: { list: ['Peaceful', 'Semi-aggressive', 'Aggressive'] },
    }),
    defineField({
      name: 'waterZone', title: 'Water Zone', type: 'string', group: 'care',
      options: { list: ['Top', 'Middle', 'Bottom', 'All levels'] },
    }),
    defineField({ name: 'schooling', title: 'Schooling Requirements', type: 'text', rows: 2, group: 'care' }),
    defineField({
      name: 'difficulty', title: 'Difficulty', type: 'string', group: 'care',
      options: { list: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
    }),
    defineField({
      name: 'compatibleSpecies', title: 'Compatible Species', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'species' }] }], group: 'compatibility',
    }),
    defineField({
      name: 'mainImage', title: 'Main Image', type: 'image', options: { hotspot: true }, group: 'media',
    }),
    defineField({
      name: 'seo', title: 'SEO', type: 'object', group: 'seo',
      fields: [
        { name: 'metaTitle', title: 'Meta Title', type: 'string' },
        { name: 'metaDescription', title: 'Meta Description', type: 'text', rows: 2 },
      ],
    }),
    defineField({
      name: 'relatedPosts', title: 'Related Posts', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'post' }] }], group: 'related',
    }),
  ],
  preview: {
    select: { title: 'name', media: 'mainImage', subtitle: 'scientificName' },
  },
})
