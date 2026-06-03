import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (Rule: any) => Rule.required() }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'role', title: 'Role', type: 'string' }),
    defineField({ name: 'bio', title: 'Bio', type: 'array', of: [{ type: 'block' }] }),
    defineField({
      name: 'socialLinks', title: 'Social Links', type: 'object',
      fields: [
        { name: 'website', title: 'Website', type: 'url' },
        { name: 'facebook', title: 'Facebook', type: 'url' },
        { name: 'instagram', title: 'Instagram', type: 'url' },
        { name: 'youtube', title: 'YouTube', type: 'url' },
        { name: 'twitter', title: 'Twitter / X', type: 'url' },
      ],
    }),
  ],
  preview: {
    select: { title: 'name', media: 'image' },
  },
})
