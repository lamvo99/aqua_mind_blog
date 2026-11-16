import { defineType, defineField } from 'sanity'
import { isValidSlugValue, suggestSlug } from '../../lib/slug'
import { reviewFields } from './careEvidence'

export default defineType({
  name: 'problem',
  title: 'Aquarium Problem',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Problem Title', type: 'string', validation: (Rule: any) => Rule.required() }),
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
    defineField({ name: 'excerpt', title: 'Short Description', type: 'text', rows: 3 }),
    defineField({ name: 'publishedAt', title: 'Published at', type: 'datetime' }),
    defineField({
      name: 'category', title: 'Category', type: 'string',
      options: {
        list: [
          'fish', 'algae', 'water_quality', 'equipment', 'plant', 'coral', 'pest', 'invertebrate', 'other',
          // Legacy values remain readable during the transition.
          'water', 'plants',
        ],
      },
      description: 'Primary category describes the affected subject. Legacy water/plants remain readable and map to water_quality/plant in the UI.',
      validation: (Rule: any) => Rule.required(),
    }),
    defineField({
      name: 'waterType', title: 'Water Type', type: 'string',
      options: { list: ['freshwater', 'saltwater', 'both'] },
    }),
    defineField({
      name: 'symptoms', title: 'Symptoms', type: 'array', of: [{ type: 'block' }],
    }),
    defineField({
      name: 'causes', title: 'Common Causes', type: 'array', of: [{ type: 'block' }],
    }),
    defineField({
      name: 'whatToCheck', title: 'What to Check', type: 'array', of: [{ type: 'block' }],
    }),
    defineField({
      name: 'whatNotToDo', title: 'What Not to Do', type: 'array', of: [{ type: 'block' }],
    }),
    defineField({
      name: 'relatedPosts', title: 'Related Posts', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'post' }] }],
    }),
    defineField({
      name: 'relatedTools', title: 'Related Tools', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tool' }] }],
    }),
    defineField({
      name: 'howToDistinguish', title: 'How to Distinguish', type: 'array', of: [{ type: 'block' }],
    }),
    defineField({
      name: 'immediateAction', title: 'Immediate Action', type: 'array', of: [{ type: 'block' }],
    }),
    defineField({
      name: 'treatment', title: 'Treatment / Correction', type: 'array', of: [{ type: 'block' }],
    }),
    defineField({
      name: 'recovery', title: 'Recovery', type: 'array', of: [{ type: 'block' }],
    }),
    defineField({
      name: 'prevention', title: 'Prevention', type: 'array', of: [{ type: 'block' }],
    }),
    defineField({
      name: 'monitoring', title: 'Monitoring', type: 'array', of: [{ type: 'block' }],
    }),
    defineField({
      name: 'escalation', title: 'Escalation', type: 'array', of: [{ type: 'block' }],
    }),
    defineField({
      name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }],
      description: 'Cause, symptom, or system dimensions (for example temperature, parasite, emergency). Primary category must not be duplicated here.',
    }),
    defineField({
      name: 'affectedTypes', title: 'Affected Types', type: 'array', of: [{ type: 'string' }],
      options: { list: ['fish', 'plant', 'coral', 'invertebrate', 'equipment'] },
    }),
    defineField({
      name: 'severity', title: 'Severity', type: 'string',
      options: { list: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
      validation: (Rule: any) =>
        Rule.custom((val: any, ctx: any) => {
          if (val === 'CRITICAL' && (!Array.isArray(ctx?.document?.escalation) || ctx.document.escalation.length === 0)) {
            return 'CRITICAL severity requires a non-empty escalation path'
          }
          return true
        }),
    }),
    defineField({
      name: 'timeSensitivity', title: 'Time Sensitivity', type: 'string',
      options: { list: ['MONITOR', 'ACT_SOON', 'ACT_NOW'] },
      validation: (Rule: any) =>
        Rule.custom((val: any, ctx: any) => {
          if (val === 'ACT_NOW' && (!Array.isArray(ctx?.document?.escalation) || ctx.document.escalation.length === 0)) {
            return 'ACT_NOW time sensitivity requires a non-empty escalation path'
          }
          return true
        }),
    }),
    defineField({
      name: 'whenToSeekHelp', title: 'When to Seek Help', type: 'text', rows: 3,
      description: 'Problem-specific escalation guidance. Do not invent universal thresholds.',
    }),
    defineField({
      name: 'claimConfidence', title: 'Claim Confidence', type: 'array',
      of: [{ type: 'careConfidenceEntry' }],
      description: 'Evidence state and confidence for individual triage claims.',
    }),
    defineField({
      name: 'evidenceSources', title: 'Evidence Sources', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'evidenceSource' }] }],
      description: 'Real evidence source records used by this problem. No placeholder sources.',
    }),
    ...reviewFields,
  ],
  preview: {
    select: { title: 'title', subtitle: 'category' },
  },
})
