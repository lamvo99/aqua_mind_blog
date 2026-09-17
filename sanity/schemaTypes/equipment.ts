import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'equipment',
  title: 'Equipment',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (Rule: any) => Rule.required() }),
    defineField({ name: 'brand', title: 'Brand', type: 'string' }),
    defineField({ name: 'model', title: 'Model', type: 'string' }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'category', title: 'Category', type: 'string',
      options: {
        list: ['Filter', 'Light', 'Pump', 'Heater', 'CO₂ System', 'Substrate', 'Test Kit', 'Other'],
      },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3 }),
    defineField({ name: 'publishedAt', title: 'Published at', type: 'datetime' }),
    defineField({ name: 'flowRateLh', title: 'Flow Rate (L/h)', type: 'number' }),
    defineField({ name: 'powerW', title: 'Power (W)', type: 'number' }),
    defineField({
      name: 'tankSizeMinL', title: 'Suitable Tank Min (L)', type: 'number',
    }),
    defineField({
      name: 'tankSizeMaxL', title: 'Suitable Tank Max (L)', type: 'number',
    }),
    defineField({
      name: 'aquariumStyle', title: 'Aquarium Style', type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Community', value: 'Community' },
          { title: 'Planted', value: 'Planted' },
          { title: 'Low-Tech', value: 'Low-Tech' },
          { title: 'High-Tech / CO2', value: 'High-Tech / CO2' },
          { title: 'Aquascaping', value: 'Aquascaping' },
          { title: 'Mixed Reef', value: 'Mixed Reef' },
          { title: 'SPS Reef', value: 'SPS Reef' },
          { title: 'Fish Only', value: 'Fish Only' },
          { title: 'FOWLR', value: 'FOWLR' },
          { title: 'Pond / Outdoor', value: 'Pond / Outdoor' },
        ],
      },
    }),
    defineField({ name: 'pros', title: 'Pros', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'cons', title: 'Cons', type: 'array', of: [{ type: 'string' }] }),
    defineField({
      name: 'mainImage', title: 'Main Image', type: 'image', options: { hotspot: true },
    }),
    defineField({
      name: 'relatedPosts', title: 'Related Posts', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'post' }] }],
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'brand', media: 'mainImage' },
  },
})
