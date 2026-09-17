import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'species',
  title: 'Fish Species',
  type: 'document',
  groups: [
    { name: 'identity', title: 'Identity' },
    { name: 'care', title: 'Care' },
    { name: 'compatibility', title: 'Compatibility' },
    { name: 'media', title: 'Media' },
    { name: 'seo', title: 'SEO' },
    { name: 'related', title: 'Related' },
  ],
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', group: 'identity', validation: (Rule: any) => Rule.required() }),
    defineField({ name: 'scientificName', title: 'Scientific Name', type: 'string', group: 'identity' }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug', group: 'identity',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({ name: 'family', title: 'Family', type: 'string', group: 'identity' }),
    defineField({ name: 'origin', title: 'Origin', type: 'string', group: 'identity' }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3, group: 'identity' }),
    defineField({ name: 'publishedAt', title: 'Published at', type: 'datetime', group: 'seo' }),
    defineField({
      name: 'sizeCm', title: 'Adult Size (cm)', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(0.5).max(500),
    }),
    defineField({
      name: 'tankSizeMinL', title: 'Minimum Tank Size (L)', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(1),
    }),
    defineField({
      name: 'tempMinC', title: 'Min Temperature (°C)', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(0).max(40),
    }),
    defineField({
      name: 'tempMaxC', title: 'Max Temperature (°C)', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(0).max(40),
    }),
    defineField({
      name: 'phMin', title: 'Min pH', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(3).max(11),
    }),
    defineField({
      name: 'phMax', title: 'Max pH', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(3).max(11),
    }),
    defineField({
      name: 'ghMin', title: 'Min GH (dGH)', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(0).max(40),
    }),
    defineField({
      name: 'ghMax', title: 'Max GH (dGH)', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(0).max(40),
    }),
    defineField({
      name: 'diet', title: 'Diet', type: 'string', group: 'care',
      options: { list: ['Carnivore', 'Omnivore', 'Herbivore', 'Micropredator'] },
    }),
    defineField({
      name: 'temperament', title: 'Temperament', type: 'string', group: 'care',
      options: { list: ['Peaceful', 'Semi-aggressive', 'Aggressive'] },
    }),
    defineField({
      name: 'waterZone', title: 'Water Zone', type: 'string', group: 'care',
      options: { list: ['Top', 'Middle', 'Bottom', 'All levels'] },
    }),
    defineField({ name: 'schooling', title: 'Schooling Requirements', type: 'text', rows: 2, group: 'care' }),
    defineField({
      name: 'difficulty', title: 'Difficulty', type: 'string', group: 'care',
      options: { list: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
    }),
    defineField({
      name: 'waterType', title: 'Water Type', type: 'string', group: 'care',
      options: { list: ['freshwater', 'saltwater', 'brackish'] },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'aquariumStyle', title: 'Aquarium Style', type: 'array', group: 'care',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Community', value: 'Community' },
          { title: 'Planted', value: 'Planted' },
          { title: 'Low-Tech', value: 'Low-Tech' },
          { title: 'High-Tech / CO2', value: 'High-Tech / CO2' },
          { title: 'Aquascaping', value: 'Aquascaping' },
          { title: 'Blackwater', value: 'Blackwater' },
          { title: 'Biotope', value: 'Biotope' },
          { title: 'Amazon / South American', value: 'Amazon / South American' },
          { title: 'Southeast Asian', value: 'Southeast Asian' },
          { title: 'African Cichlid', value: 'African Cichlid' },
          { title: 'Shrimp', value: 'Shrimp' },
          { title: 'Betta / Nano', value: 'Betta / Nano' },
          { title: 'Predator', value: 'Predator' },
          { title: 'Large Fish', value: 'Large Fish' },
          { title: 'Native / Regional', value: 'Native / Regional' },
          { title: 'Fish Only', value: 'Fish Only' },
          { title: 'FOWLR', value: 'FOWLR' },
          { title: 'Nano Reef', value: 'Nano Reef' },
          { title: 'Mixed Reef', value: 'Mixed Reef' },
          { title: 'Anemone / Clownfish', value: 'Anemone / Clownfish' },
          { title: 'Marine Predator', value: 'Marine Predator' },
          { title: 'Pond / Outdoor', value: 'Pond / Outdoor' },
        ],
      },
    }),
    defineField({
      name: 'region', title: 'Region', type: 'string', group: 'care',
      options: {
        list: [
          { title: 'South America', value: 'South America' },
          { title: 'Amazon Basin', value: 'Amazon Basin' },
          { title: 'Central America', value: 'Central America' },
          { title: 'North America', value: 'North America' },
          { title: 'Southeast Asia', value: 'Southeast Asia' },
          { title: 'South Asia', value: 'South Asia' },
          { title: 'East Asia', value: 'East Asia' },
          { title: 'Africa', value: 'Africa' },
          { title: 'Australia / Oceania', value: 'Australia / Oceania' },
          { title: 'Europe', value: 'Europe' },
          { title: 'Marine Indo-Pacific', value: 'Marine Indo-Pacific' },
          { title: 'Red Sea', value: 'Red Sea' },
          { title: 'Caribbean / Western Atlantic', value: 'Caribbean / Western Atlantic' },
        ],
      },
    }),
    defineField({ name: 'isPredator', title: 'Predator?', type: 'boolean', group: 'care' }),
    defineField({ name: 'reefCompatibility', title: 'Reef Compatible?', type: 'boolean', group: 'compatibility' }),
    defineField({
      name: 'compatibleSpecies', title: 'Compatible Species', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'species' }] }], group: 'compatibility',
    }),
    defineField({
      name: 'compatiblePlants', title: 'Suitable Plants', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'plant' }] }], group: 'compatibility',
    }),
    defineField({
      name: 'compatibleInvertebrates', title: 'Compatible Invertebrates', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'invertebrate' }] }], group: 'compatibility',
    }),
    defineField({
      name: 'suitableEquipment', title: 'Suitable Equipment', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'equipment' }] }], group: 'compatibility',
    }),
    defineField({
      name: 'relatedProblems', title: 'Common Problems', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'problem' }] }], group: 'related',
    }),
    defineField({
      name: 'mainImage', title: 'Main Image', type: 'image', options: { hotspot: true }, group: 'media',
    }),
    defineField({
      name: 'seo', title: 'SEO', type: 'object', group: 'seo',
      fields: [
        { name: 'metaTitle', title: 'Meta Title', type: 'string' },
        { name: 'metaDescription', title: 'Meta Description', type: 'text', rows: 2 },
      ],
    }),
    defineField({
      name: 'relatedPosts', title: 'Related Posts', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'post' }] }], group: 'related',
    }),
  ],
  preview: {
    select: { title: 'name', media: 'mainImage', subtitle: 'scientificName' },
  },
})
