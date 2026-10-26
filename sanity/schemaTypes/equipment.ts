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
    defineField({
      name: 'waterType', title: 'Water Type Suitability', type: 'string',
      options: { list: ['freshwater', 'saltwater', 'both'] },
    }),
    defineField({
      name: 'turnoverPerH', title: 'Turnover per Hour (x)', type: 'number',
      validation: (Rule: any) => Rule.min(0.1),
    }),
    defineField({
      name: 'ratedCapacity', title: 'Rated Capacity', type: 'object',
      description: 'Manufacturer-rated capacity. Real-world suitability belongs to the body, not here.',
      fields: [
        { name: 'value', title: 'Value', type: 'number', validation: (Rule: any) => Rule.min(0) },
        { name: 'unit', title: 'Unit', type: 'string' },
        { name: 'basis', title: 'Basis', type: 'string' },
      ],
    }),
    defineField({
      name: 'compatibleEquipment', title: 'Compatible Equipment', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'equipment' }] }],
      description: 'Equipment-to-equipment dependency compatibility.',
    }),
    defineField({
      name: 'relatedProblems', title: 'Common Problems', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'problem' }] }],
      description: 'Failure-mode navigation to problem records.',
    }),
    defineField({
      name: 'knowledgeBody', title: 'Knowledge Body', type: 'equipmentKnowledgeBody',
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'brand', media: 'mainImage' },
  },
})
