import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'plant',
  title: 'Aquatic Plant',
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
      options: { list: ['Low', 'Low-Medium', 'Medium', 'Medium-High', 'High'] },
    }),
    defineField({
      name: 'co2', title: 'CO₂ Requirement', type: 'string',
      options: { list: ['None', 'Low', 'Medium', 'High'] },
    }),
    defineField({
      name: 'growth', title: 'Growth Rate', type: 'string',
      options: { list: ['Slow', 'Medium', 'Fast'] },
    }),
    defineField({
      name: 'difficulty', title: 'Difficulty', type: 'string',
      options: { list: ['Beginner', 'Intermediate', 'Advanced'] },
    }),
    defineField({
      name: 'placement', title: 'Placement', type: 'string',
      options: { list: ['Foreground', 'Midground', 'Background', 'Floating', 'Epiphyte'] },
    }),
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
    defineField({ name: 'propagation', title: 'Propagation', type: 'text', rows: 2 }),
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
