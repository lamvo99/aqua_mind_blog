import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'inspiration',
  title: 'Aquascape Inspiration',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule: any) => Rule.required() }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({ name: 'excerpt', title: 'Description', type: 'text', rows: 3 }),
    defineField({ name: 'publishedAt', title: 'Published at', type: 'datetime' }),
    defineField({
      name: 'style', title: 'Style', type: 'string',
      options: {
        list: ['Nature Aquarium', 'Iwagumi', 'Dutch', 'Jungle', 'Biotope', 'Paludarium', 'Reef'],
      },
    }),
    defineField({
      name: 'tankSizeL', title: 'Tank Size (L)', type: 'number',
    }),
    defineField({
      name: 'difficulty', title: 'Difficulty', type: 'string',
      options: { list: ['Beginner', 'Intermediate', 'Advanced'] },
    }),
    defineField({
      name: 'plants', title: 'Plants', type: 'array', of: [{ type: 'reference', to: [{ type: 'plant' }] }],
    }),
    defineField({
      name: 'hardscape', title: 'Hardscape', type: 'text', rows: 3,
    }),
    defineField({
      name: 'equipment', title: 'Equipment', type: 'array', of: [{ type: 'reference', to: [{ type: 'equipment' }] }],
    }),
    defineField({
      name: 'mainImage', title: 'Main Image', type: 'image', options: { hotspot: true },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'relatedPosts', title: 'Related Posts', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'post' }] }],
    }),
  ],
  preview: {
    select: { title: 'title', media: 'mainImage' },
  },
})
