import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule: any) => Rule.required() }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({ name: 'icon', title: 'Icon (emoji)', type: 'string' }),
    defineField({ name: 'color', title: 'Color', type: 'string' }),
    defineField({ name: 'parentCategory', title: 'Parent Category', type: 'reference', to: [{ type: 'category' }] }),
  ],
  preview: {
    select: { title: 'title' },
  },
})
