import { defineType, defineField } from 'sanity'
import { isValidSlugValue, suggestSlug } from '../../lib/slug'

export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule: any) => Rule.required() }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule: any) =>
        Rule.required().custom((value: any) => {
          const current = value?.current
          if (!current) return true
          if (isValidSlugValue(current)) return true
          return `Invalid slug: use lowercase letters, numbers and single hyphens (suggested: "${suggestSlug(current)}").`
        }),
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
