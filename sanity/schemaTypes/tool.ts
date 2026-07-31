import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'tool',
  title: 'Tool',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (Rule: any) => Rule.required() }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
    defineField({ name: 'toolUrl', title: 'Tool URL (route path)', type: 'string' }),
    defineField({
      name: 'category', title: 'Category', type: 'string',
      options: {
        list: ['Volume', 'Water Change', 'CO₂', 'Dosing', 'Pump Flow', 'Salt Mixing', 'Lighting', 'Stocking', 'Planner'],
      },
    }),
    defineField({
      name: 'relatedPosts', title: 'Related Posts', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'post' }] }],
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'category' },
  },
})
