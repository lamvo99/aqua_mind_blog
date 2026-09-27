import { defineType } from 'sanity'

export default defineType({
  name: 'table',
  title: 'Table',
  type: 'object',
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional caption shown above the table.',
    },
    {
      name: 'hasHeader',
      title: 'Show column labels as a header row',
      type: 'boolean',
      initialValue: true,
      description: 'When on, column labels render as <th> header cells.',
    },
    {
      name: 'columns',
      title: 'Columns',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'tableColumn',
          title: 'Column',
          fields: [{ name: 'label', title: 'Column label (header)', type: 'string' }],
          preview: {
            select: { label: 'label' },
            prepare: ({ label }: { label?: string }) => ({ title: label || 'Untitled column' }),
          },
        },
      ],
      description: 'Define the table columns. Labels are used as header cells when the header row is enabled.',
    },
    {
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'tableRow',
          title: 'Row',
          fields: [
            {
              name: 'cells',
              title: 'Cells',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'tableCell',
                  title: 'Cell',
                  fields: [{ name: 'value', title: 'Value', type: 'string' }],
                  preview: {
                    select: { value: 'value' },
                    prepare: ({ value }: { value?: string }) => ({ title: value || '(empty)' }),
                  },
                },
              ],
              description: 'One cell per column, in the same order as the columns.',
            },
          ],
          preview: {
            select: { cells: 'cells' },
            prepare: ({ cells }: { cells?: { value?: string }[] }) => ({
              title: cells?.map((cell) => cell?.value ?? '').join(' | ') || '(empty row)',
            }),
          },
        },
      ],
      description: 'Each row should contain exactly as many cells as there are columns.',
    },
  ],
  preview: {
    select: { caption: 'caption', columns: 'columns', rows: 'rows' },
    prepare: ({ caption, columns, rows }: { caption?: string; columns?: unknown[]; rows?: unknown[] }) => ({
      title: caption || 'Table',
      subtitle: `${columns?.length ?? 0} columns × ${rows?.length ?? 0} rows`,
    }),
  },
})