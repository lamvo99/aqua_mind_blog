import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'comment',
  title: 'Comment',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (Rule: any) => Rule.required().max(80) }),
    defineField({ name: 'email', title: 'Email (private)', type: 'string', validation: (Rule: any) => Rule.max(120) }),
    defineField({
      name: 'content', title: 'Content', type: 'text', rows: 4,
      validation: (Rule: any) => Rule.required().min(2).max(2000),
    }),
    defineField({ name: 'post', title: 'Post', type: 'reference', to: [{ type: 'post' }], validation: (Rule: any) => Rule.required() }),
    defineField({
      name: 'approved', title: 'Approved', type: 'boolean', initialValue: false,
      description: 'Only approved comments are shown publicly on the site.',
    }),
  ],
  preview: {
    select: { title: 'content', subtitle: 'name', media: 'post.mainImage' },
    prepare(selection: any) {
      const { title, subtitle } = selection
      return { ...selection, title: title ? title.slice(0, 60) : 'Untitled', subtitle: subtitle ? `by ${subtitle}` : 'Anonymous' }
    },
  },
})
