import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'problem',
  title: 'Aquarium Problem',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Problem Title', type: 'string', validation: (Rule: any) => Rule.required() }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({ name: 'excerpt', title: 'Short Description', type: 'text', rows: 3 }),
    defineField({ name: 'publishedAt', title: 'Published at', type: 'datetime' }),
    defineField({
      name: 'category', title: 'Category', type: 'string',
      options: {
        list: ['water', 'algae', 'plants', 'fish', 'equipment'],
      },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'symptoms', title: 'Symptoms', type: 'array', of: [{ type: 'block' }],
    }),
    defineField({
      name: 'causes', title: 'Common Causes', type: 'array', of: [{ type: 'block' }],
    }),
    defineField({
      name: 'whatToCheck', title: 'What to Check', type: 'array', of: [{ type: 'block' }],
    }),
    defineField({
      name: 'whatNotToDo', title: 'What Not to Do', type: 'array', of: [{ type: 'block' }],
    }),
    defineField({
      name: 'relatedPosts', title: 'Related Posts', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'post' }] }],
    }),
    defineField({
      name: 'relatedTools', title: 'Related Tools', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tool' }] }],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'category' },
  },
})
