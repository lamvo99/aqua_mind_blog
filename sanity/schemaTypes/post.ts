import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (Rule: any) => Rule.required() }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3 }),
    defineField({ name: 'publishedAt', title: 'Published at', type: 'datetime', initialValue: () => new Date().toISOString() }),
    defineField({ name: 'updatedAt', title: 'Updated at', type: 'datetime' }),
    defineField({ name: 'status', title: 'Status', type: 'string', options: { list: [{ title: 'Draft', value: 'draft' }, { title: 'Published', value: 'published' }] }, initialValue: 'draft' }),
    defineField({ name: 'author', title: 'Author', type: 'reference', to: [{ type: 'author' }] }),
    defineField({ name: 'categories', title: 'Categories', type: 'array', of: [{ type: 'reference', to: [{ type: 'category' }] }] }),
    defineField({
      name: 'mainImage', title: 'Main Image', type: 'image', options: { hotspot: true },
    }),
    defineField({
      name: 'body', title: 'Body', type: 'array',
      of: [{ type: 'block' }, { type: 'image', options: { hotspot: true } }, { type: 'code' }],
    }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'isFeatured', title: 'Is Featured?', type: 'boolean', initialValue: false }),
    defineField({ name: 'relatedPosts', title: 'Related Posts', type: 'array', of: [{ type: 'reference', to: [{ type: 'post' }] }] }),
    defineField({
      name: 'seo', title: 'SEO', type: 'object',
      fields: [
        { name: 'metaTitle', title: 'Meta Title', type: 'string' },
        { name: 'metaDescription', title: 'Meta Description', type: 'text', rows: 2 },
        { name: 'ogImage', title: 'OG Image', type: 'image' },
      ],
    }),
  ],
  preview: {
    select: { title: 'title', author: 'author.name', media: 'mainImage' },
    prepare(selection: any) {
      const { author } = selection
      return { ...selection, subtitle: author && `by ${author}` }
    },
  },
})
