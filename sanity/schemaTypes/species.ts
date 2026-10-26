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
    defineField({
      name: 'localNames', title: 'Local / Trade Names', type: 'array', group: 'identity',
      description: 'Verified Vietnamese, regional, or aquarium trade names for discovery (not canonical identity).',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'aliases', title: 'Search Aliases', type: 'array', group: 'identity',
      description: 'Alternate common names, accepted search synonyms, or common spelling variants.',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'group', title: 'Biological Group', type: 'string', group: 'identity',
      description: 'Taxonomic or hobbyist grouping (e.g. Cichlid, Catfish, Livebearer).',
      options: {
        list: [
          'Cichlid', 'Livebearer', 'Catfish', 'Loach', 'Characin', 'Cyprinid',
          'Gourami', 'Arowana', 'Puffer', 'Angelfish', 'Tang', 'Wrasse',
          'Goby', 'Blenny', 'Shark', 'Rainbowfish', 'Killifish', 'Pleco',
          'Other',
        ],
      },
    }),
    defineField({
      name: 'parentSpecies', title: 'Parent Species', type: 'reference', group: 'identity',
      description: 'If this is a variant/morph/form, point to the canonical species.',
      to: [{ type: 'species' }],
    }),
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
      of: [{ type: 'compatibleEntry' }], group: 'compatibility',
      description: 'Conditional compatibility entries with optional conditions[] (SPEC 10 REL-M01).',
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
    defineField({
      name: 'minTankLengthCm', title: 'Min Tank Length (cm)', type: 'number', group: 'care',
      description: 'Minimum tank length of the footprint (length x width). Unknown stays empty, never 0.',
      validation: (Rule: any) => Rule.min(0.1),
    }),
    defineField({
      name: 'minTankWidthCm', title: 'Min Tank Width (cm)', type: 'number', group: 'care',
      description: 'Minimum tank width of the footprint (length x width). Unknown stays empty, never 0.',
      validation: (Rule: any) => Rule.min(0.1),
    }),
    defineField({
      name: 'swimmingSpace', title: 'Swimming Space', type: 'string', group: 'care',
      options: { list: ['NONE', 'LOW', 'MODERATE', 'HIGH'] },
    }),
    defineField({
      name: 'jumpRisk', title: 'Jump Risk', type: 'string', group: 'care',
      options: { list: ['NONE', 'LOW', 'MODERATE', 'HIGH'] },
    }),
    defineField({
      name: 'lidRequired', title: 'Lid Requirement', type: 'string', group: 'care',
      options: { list: ['NOT_REQUIRED', 'RECOMMENDED', 'ESSENTIAL'] },
    }),
    defineField({
      name: 'flowPreference', title: 'Flow Preference', type: 'string', group: 'care',
      options: { list: ['STILL', 'MODERATE', 'STRONG'] },
    }),
    defineField({
      name: 'oxygenSensitivity', title: 'Oxygen Sensitivity', type: 'string', group: 'care',
      options: { list: ['NEUTRAL', 'SENSITIVE'] },
    }),
    defineField({
      name: 'maturityRequirement', title: 'Mature Aquarium Requirement', type: 'string', group: 'care',
      options: { list: ['NONE', 'SUGGESTED', 'REQUIRED'] },
    }),
    defineField({
      name: 'bioload', title: 'Bioload', type: 'string', group: 'care',
      options: { list: ['LOW', 'MODERATE', 'HIGH'] },
    }),
    defineField({
      name: 'waterChangeSensitivity', title: 'Water Change Sensitivity', type: 'string', group: 'care',
      options: { list: ['LOW', 'MODERATE', 'HIGH'] },
    }),
    defineField({
      name: 'breedingDifficulty', title: 'Breeding Difficulty', type: 'string', group: 'care',
      options: { list: ['EASY', 'MODERATE', 'DIFFICULT'] },
    }),
    defineField({
      name: 'khMin', title: 'Min KH (dKH)', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(0).max(40),
    }),
    defineField({
      name: 'khMax', title: 'Max KH (dKH)', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(0).max(40).custom((val: any, ctx: any) => {
        const min = ctx?.parent?.khMin;
        if (val == null || min == null) return true;
        return val >= min || 'khMax must be >= khMin';
      }),
    }),
    defineField({
      name: 'salinityMin', title: 'Min Salinity (ppt)', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(0),
    }),
    defineField({
      name: 'salinityMax', title: 'Max Salinity (ppt)', type: 'number', group: 'care',
      validation: (Rule: any) => Rule.min(0).custom((val: any, ctx: any) => {
        const min = ctx?.parent?.salinityMin;
        if (val == null || min == null) return true;
        return val >= min || 'salinityMax must be >= salinityMin';
      }),
    }),
    defineField({
      name: 'behaviorFlags', title: 'Behavior Flags', type: 'array', group: 'care',
      of: [{ type: 'string' }],
      description: 'Non-exclusive behavior flags. Presence is a positive signal; absence is not a negative claim.',
      options: {
        list: [
          'open-water', 'territorial', 'solitary', 'nocturnal', 'diurnal',
          'burrower', 'cave-dweller', 'strong-swimmer', 'timid',
        ],
      },
    }),
    defineField({
      name: 'groupSize', title: 'Group Size', type: 'object', group: 'care',
      description: 'Structured group size backing the schooling text.',
      fields: [
        { name: 'min', title: 'Min Group Size', type: 'number', validation: (Rule: any) => Rule.min(1).integer() },
        { name: 'max', title: 'Max Group Size', type: 'number', validation: (Rule: any) => Rule.min(1).integer() },
      ],
      validation: (Rule: any) => Rule.custom((val: any) => {
        if (!val || val.min == null || val.max == null) return true;
        return val.max >= val.min || 'max group size must be >= min group size';
      }),
    }),
    defineField({
      name: 'communitySuitability', title: 'Community Suitability', type: 'string', group: 'compatibility',
      options: { list: ['UNSUITABLE', 'CONDITIONAL', 'SUITABLE'] },
    }),
    defineField({
      name: 'reefInteraction', title: 'Reef Interaction', type: 'string', group: 'compatibility',
      description: 'Fish-side tiered reef interaction. Coral-side reefCompatibility keeps its existing meaning.',
      options: { list: ['REEF_SAFE', 'CAUTION', 'SPECIES_DEPENDENT', 'NOT_REEF_SAFE'] },
    }),
    defineField({
      name: 'predatesInverts', title: 'Predates Invertebrates', type: 'string', group: 'compatibility',
      options: { list: ['NONE', 'POSSIBLE', 'LIKELY'] },
    }),
    defineField({
      name: 'incompatibleSpecies', title: 'Incompatible Species', type: 'array', group: 'compatibility',
      of: [{ type: 'incompatibleEntry' }],
      description: 'Known incompatible species with required reason.',
    }),
    defineField({
      name: 'predatorPrey', title: 'Predator / Prey', type: 'array', group: 'compatibility',
      of: [{ type: 'predatorPreyEntry' }],
      description: 'Predator -> prey typed references with size condition and evidence note.',
    }),
    defineField({
      name: 'reefInteractionDetail', title: 'Reef Interaction Detail', type: 'array', group: 'compatibility',
      of: [{ type: 'reefInteractionEntry' }],
      description: 'Per-coral interaction detail: ref + tier + targets[] + frequency + monitoring.',
    }),
    defineField({
      name: 'knowledgeBody', title: 'Knowledge Body', type: 'speciesKnowledgeBody', group: 'care',
    }),
  ],
  preview: {
    select: { title: 'name', media: 'mainImage', subtitle: 'scientificName' },
  },
})
