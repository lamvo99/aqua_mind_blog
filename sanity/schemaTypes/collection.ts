import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'collection',
  title: 'Collection / Learning Path',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule: any) => Rule.required() }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
    defineField({
      name: 'level', title: 'Level', type: 'string',
      options: { list: ['Beginner', 'Intermediate', 'Advanced'] },
    }),
    defineField({
      name: 'topic', title: 'Topic', type: 'string',
      options: { list: ['Freshwater', 'Planted', 'Marine', 'Reef', 'Paludarium'] },
    }),
    defineField({
      name: 'steps', title: 'Steps', type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'title', title: 'Title', type: 'string' },
          { name: 'estimatedTime', title: 'Estimated Time', type: 'string' },
          { name: 'post', title: 'Post', type: 'reference', to: [{ type: 'post' }] },
          { name: 'tool', title: 'Tool', type: 'reference', to: [{ type: 'tool' }] },
        ],
      }],
    }),
    defineField({
      name: 'mainImage', title: 'Main Image', type: 'image', options: { hotspot: true },
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'topic' },
  },
})
