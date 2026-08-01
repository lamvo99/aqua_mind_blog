import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'subscriber',
  title: 'Newsletter Subscriber',
  type: 'document',
  fields: [
    defineField({ name: 'email', title: 'Email', type: 'string', validation: (Rule: any) => Rule.required() }),
    defineField({
      name: 'status', title: 'Status', type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Confirmed', value: 'confirmed' },
        ],
      },
      initialValue: 'pending',
    }),
    defineField({ name: 'subscribedAt', title: 'Subscribed at', type: 'datetime', initialValue: () => new Date().toISOString() }),
    defineField({ name: 'confirmedAt', title: 'Confirmed at', type: 'datetime' }),
  ],
  preview: { select: { title: 'email', subtitle: 'status' } },
})
