import { defineType, defineField } from 'sanity'

/**
 * SPEC 24 — shared evidence vocabulary.
 *
 * The reusable `evidenceSource` document is the single source registry. Claims
 * point at a source with its stable `sourceId` (for example "S1"), while the
 * owning document keeps an `evidenceSources` reference array so the UI can
 * resolve human-readable titles and URLs in one query.
 */

export const CONFIDENCE_LEVELS = ['HIGH', 'MEDIUM', 'LOW', 'UNVERIFIED'] as const
export const CARE_BASES = ['TARGET', 'TOLERANCE', 'OBSERVED', 'SINGLE_TARGET', 'UNKNOWN'] as const
export const REVIEW_STATUSES = ['UNREVIEWED', 'IN_REVIEW', 'REVIEWED', 'NEEDS_REVIEW'] as const
export const CLAIM_STATES = [
  'VERIFIED',
  'UNVERIFIED',
  'NOT_APPLICABLE',
  'NOT_RESEARCHED',
  'NOT_REPORTED',
] as const
export const GROWTH_RISKS = ['LOW', 'MODERATE', 'HIGH', 'UNKNOWN'] as const
export const SOURCE_TYPES = [
  'PEER_REVIEWED',
  'AUTHORITATIVE_INSTITUTION',
  'SPECIALIST_REFERENCE',
  'MANUFACTURER',
  'ENCYCLOPEDIA',
  'HOBBYIST',
] as const
export const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export const TIME_SENSITIVITIES = ['MONITOR', 'ACT_SOON', 'ACT_NOW'] as const
export const AFFECTED_TYPES = ['fish', 'plant', 'coral', 'invertebrate', 'equipment'] as const

export const evidenceSource = defineType({
  name: 'evidenceSource',
  title: 'Evidence Source',
  type: 'document',
  fields: [
    defineField({
      name: 'sourceId',
      title: 'Stable Source ID',
      type: 'string',
      description: 'Stable, human-readable identifier used by claims, e.g. "S1". Unique across the registry.',
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({ name: 'author', title: 'Author / Organization', type: 'string' }),
    defineField({ name: 'publisher', title: 'Publisher', type: 'string' }),
    defineField({
      name: 'url',
      title: 'Absolute URL',
      type: 'url',
      validation: (Rule: any) =>
        Rule.required().uri({ scheme: ['http', 'https'], allowRelative: false }),
    }),
    defineField({
      name: 'sourceType',
      title: 'Source Type',
      type: 'string',
      options: { list: [...SOURCE_TYPES] },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'date' }),
    defineField({ name: 'updatedAt', title: 'Updated At', type: 'date' }),
    defineField({
      name: 'accessedAt',
      title: 'Accessed At',
      type: 'date',
      description: 'Required for any source actually reviewed as evidence.',
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'supportedClaimKeys',
      title: 'Supported Claim Keys',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Claim keys this source is allowed to support, e.g. "temperature" or "symptoms".',
      validation: (Rule: any) => Rule.required().min(1),
    }),
    defineField({
      name: 'limitations',
      title: 'Applicability / Limitations',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'reviewer',
      title: 'Reviewer',
      type: 'string',
      description: 'Only set when a named reviewer actually reviewed this source.',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'sourceId' },
  },
})

export const careDisagreement = defineType({
  name: 'careDisagreement',
  title: 'Source Disagreement',
  type: 'object',
  fields: [
    defineField({ name: 'sourceId', title: 'Source ID', type: 'string', validation: (Rule: any) => Rule.required() }),
    defineField({ name: 'min', title: 'Min', type: 'number' }),
    defineField({ name: 'max', title: 'Max', type: 'number' }),
    defineField({ name: 'value', title: 'Value / Range Text', type: 'string' }),
    defineField({ name: 'note', title: 'Note', type: 'text', rows: 2 }),
  ],
})

export const careBasisEntry = defineType({
  name: 'careBasisEntry',
  title: 'Care Claim Basis',
  type: 'object',
  fields: [
    defineField({ name: 'claimKey', title: 'Claim Key', type: 'string', validation: (Rule: any) => Rule.required() }),
    defineField({
      name: 'basis',
      title: 'Basis',
      type: 'string',
      options: { list: [...CARE_BASES] },
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({ name: 'note', title: 'Basis Note', type: 'text', rows: 2 }),
  ],
})

export const careConfidenceEntry = defineType({
  name: 'careConfidenceEntry',
  title: 'Claim Confidence',
  type: 'object',
  fields: [
    defineField({ name: 'claimKey', title: 'Claim Key', type: 'string', validation: (Rule: any) => Rule.required() }),
    defineField({ name: 'label', title: 'Display Label', type: 'string' }),
    defineField({
      name: 'confidence',
      title: 'Confidence',
      type: 'string',
      options: { list: [...CONFIDENCE_LEVELS] },
      validation: (Rule: any) =>
        Rule.required().custom((val: any, ctx: any) => {
          const parent = ctx?.parent
          if (val === 'HIGH' && (!Array.isArray(parent?.sourceIds) || parent.sourceIds.length === 0)) {
            return 'HIGH confidence requires at least one source ID'
          }
          return true
        }),
    }),
    defineField({
      name: 'state',
      title: 'Claim State',
      type: 'string',
      options: { list: [...CLAIM_STATES] },
      validation: (Rule: any) =>
        Rule.custom((val: any, ctx: any) => {
          if (val === 'VERIFIED' && ctx?.parent?.confidence === 'UNVERIFIED') {
            return 'A VERIFIED claim cannot have UNVERIFIED confidence'
          }
          return true
        }),
    }),
    defineField({
      name: 'sourceIds',
      title: 'Source IDs',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Stable sourceId values from the evidenceSource registry. Empty means no source supports this claim.',
    }),
    defineField({
      name: 'displayValue',
      title: 'Display Value / Range',
      type: 'string',
      description: 'Use when a value cannot be represented by the legacy numeric fields (for example SG salinity or conflicting ranges).',
    }),
    defineField({ name: 'unit', title: 'Unit', type: 'string' }),
    defineField({ name: 'note', title: 'Note / Caveat', type: 'text', rows: 3 }),
    defineField({
      name: 'disagreements',
      title: 'Source Disagreements',
      type: 'array',
      of: [{ type: 'careDisagreement' }],
      description: 'Preserve conflicting source ranges separately. Never average them into one value.',
    }),
  ],
  preview: {
    select: { title: 'claimKey', subtitle: 'confidence' },
  },
})

export const reviewFields = [
  defineField({
    name: 'lastReviewedAt',
    title: 'Last Reviewed At',
    type: 'date',
    description: 'Set only after a real editorial review. Editing or migrating a document is not a review.',
  }),
  defineField({
    name: 'reviewStatus',
    title: 'Review Status',
    type: 'string',
    options: { list: [...REVIEW_STATUSES] },
  }),
  defineField({
    name: 'reviewedBy',
    title: 'Reviewed By',
    type: 'string',
    description: 'Named AquaMind reviewer. Set only after an actual editorial review.',
  }),
]

export const difficultyFields = [
  defineField({
    name: 'difficultyContext',
    title: 'Difficulty Context',
    type: 'text',
    rows: 3,
    description: 'Qualification for the stored difficulty enum, e.g. "Beginner only with …".',
  }),
  defineField({
    name: 'notRecommendedFor',
    title: 'Not Recommended For',
    type: 'array',
    of: [{ type: 'string' }],
    description: 'Explicit exclusions that qualify the difficulty label.',
  }),
  defineField({
    name: 'difficultyConfidence',
    title: 'Difficulty Confidence',
    type: 'string',
    options: { list: [...CONFIDENCE_LEVELS] },
  }),
]
