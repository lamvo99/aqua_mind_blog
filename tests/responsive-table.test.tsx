// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import ResponsiveTable from '@/app/components/ResponsiveTable'

vi.mock('next/image', () => ({
  default: ({ src, alt, width, height, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} {...props} />
  ),
}))

vi.mock('@/lib/sanity', () => ({
  urlFor: () => ({
    width: () => ({ height: () => ({ url: () => 'https://example.com/image.png' }) }),
  }),
}))

afterEach(() => {
  cleanup()
})

function basicTable(overrides: Record<string, unknown> = {}) {
  return {
    caption: 'Water Parameters',
    hasHeader: true,
    columns: [
      { _key: 'col1', label: 'Parameter' },
      { _key: 'col2', label: 'Target' },
      { _key: 'col3', label: 'Range' },
    ],
    rows: [
      {
        _key: 'row1',
        cells: [
          { _key: 'c11', value: 'pH' },
          { _key: 'c12', value: '6.8' },
          { _key: 'c13', value: '6.5 - 7.2' },
        ],
      },
      {
        _key: 'row2',
        cells: [
          { _key: 'c21', value: 'Temperature' },
          { _key: 'c22', value: '25°C' },
          { _key: 'c23', value: '24 - 27°C' },
        ],
      },
    ],
    ...overrides,
  }
}

describe('ResponsiveTable component', () => {
  it('renders caption above the table', () => {
    render(<ResponsiveTable data={basicTable()} />)
    expect(screen.getByText('Water Parameters')).toBeTruthy()
  })

  it('renders a header row with th scope="col" by default', () => {
    render(<ResponsiveTable data={basicTable()} />)
    const headers = screen.getAllByRole('columnheader')
    expect(headers).toHaveLength(3)
    expect(headers[0].textContent).toBe('Parameter')
    expect(headers[0].getAttribute('scope')).toBe('col')
  })

  it('skips the header row when hasHeader is false', () => {
    render(<ResponsiveTable data={basicTable({ hasHeader: false })} />)
    expect(screen.queryAllByRole('columnheader')).toHaveLength(0)
    expect(screen.getAllByRole('cell')).toHaveLength(6)
  })

  it('skips the header row when there are no columns', () => {
    render(<ResponsiveTable data={basicTable({ columns: [] })} />)
    expect(screen.queryAllByRole('columnheader')).toHaveLength(0)
    expect(screen.getAllByRole('cell')).toHaveLength(6)
  })

  it('renders the correct number of rows and cells', () => {
    render(<ResponsiveTable data={basicTable()} />)
    expect(screen.getAllByRole('row')).toHaveLength(3) // 1 header + 2 body
    expect(screen.getAllByRole('cell')).toHaveLength(6)
  })

  it('renders empty cells without crashing', () => {
    const data = {
      caption: 'Table',
      hasHeader: false,
      columns: [{ _key: 'c1', label: 'Col A' }],
      rows: [{ _key: 'r1', cells: [{ _key: 'x1', value: '' }] }],
    }
    render(<ResponsiveTable data={data} />)
    const cells = screen.getAllByRole('cell')
    expect(cells).toHaveLength(1)
    expect(cells[0].textContent).toBe('')
  })

  it('pads rows with fewer cells than columns', () => {
    const data = {
      hasHeader: false,
      columns: [
        { _key: 'c1', label: 'A' },
        { _key: 'c2', label: 'B' },
      ],
      rows: [{ _key: 'r1', cells: [{ _key: 'x1', value: 'only one' }] }],
    }
    render(<ResponsiveTable data={data} />)
    const cells = screen.getAllByRole('cell')
    expect(cells).toHaveLength(2)
    expect(cells[0].textContent).toBe('only one')
    expect(cells[1].textContent).toBe('')
  })

  it('renders long text without truncation', () => {
    const long = 'This is a very long cell value that should wrap naturally and not be cut off ' + 'x'.repeat(500)
    render(
      <ResponsiveTable
        data={{
          hasHeader: false,
          columns: [{ _key: 'c1', label: 'A' }],
          rows: [{ _key: 'r1', cells: [{ _key: 'x1', value: long }] }],
        }}
      />,
    )
    expect(screen.getByText(long)).toBeTruthy()
  })

  it('keeps the table inside a horizontally scrollable wrapper', () => {
    const { container } = render(<ResponsiveTable data={basicTable()} />)
    const wrapper = container.querySelector('[data-testid="responsive-table"]')
    expect(wrapper).toBeTruthy()
    expect((wrapper as HTMLElement).className).toContain('overflow-x-auto')
    expect((wrapper as HTMLElement).className).toContain('rounded-xl')
  })

  it('returns null when there are no columns or rows', () => {
    const { container } = render(<ResponsiveTable data={{ hasHeader: true, columns: [], rows: [] }} />)
    expect(container.querySelector('[data-testid="responsive-table"]')).toBeNull()
  })

  it('renders cell text as plain text, never as HTML', () => {
    render(
      <ResponsiveTable
        data={{
          hasHeader: false,
          columns: [{ _key: 'c1', label: 'A' }],
          rows: [{ _key: 'r1', cells: [{ _key: 'x1', value: '<b>bold</b><script>window.__pwned=1</script>' }] }],
        }}
      />,
    )
    expect(document.querySelector('b')).toBeNull()
    expect(document.querySelector('script')).toBeNull()
    expect(screen.getByText(/__pwned/)).toBeTruthy()
  })
})

describe('ResponsiveTable via PortableText', () => {
  it('keeps existing blocks rendering and renders table blocks', async () => {
    const { default: PortableText } = await import('@/app/components/PortableText')
    const value = [
      {
        _type: 'block',
        _key: 'b1',
        style: 'h2',
        children: [{ _key: 'c1', text: 'Overview', marks: [] }],
      },
      {
        _type: 'image',
        _key: 'i1',
        asset: { _ref: 'image-some' },
        alt: 'a tank',
        caption: 'Nice tank',
      },
      {
        _type: 'code',
        _key: 'code1',
        language: 'bash',
        filename: 'seed.sh',
        code: 'echo hi',
      },
      {
        _type: 'table',
        _key: 't1',
        caption: 'Parameters',
        hasHeader: true,
        columns: [
          { _key: 'col1', label: 'Key' },
          { _key: 'col2', label: 'Value' },
        ],
        rows: [{ _key: 'r1', cells: [{ _key: 'v1', value: 'pH' }, { _key: 'v2', value: '6.8' }] }],
      },
      {
        _type: 'block',
        _key: 'b2',
        style: 'normal',
        children: [{ _key: 'c9', text: 'After paragraph', marks: [] }],
      },
    ]
    const { container } = render(<PortableText value={value} />)

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeTruthy()
    const img = container.querySelector('img[src="https://example.com/image.png"]')
    expect(img).toBeTruthy()
    expect(screen.getByText('seed.sh')).toBeTruthy()
    expect(screen.getByText('echo hi')).toBeTruthy()

    const table = screen.getByRole('table')
    expect(table).toBeTruthy()
    expect(within(table).getByText('Parameters')).toBeTruthy()
    expect(within(table).getByRole('columnheader', { name: 'Key' })).toBeTruthy()
    expect(within(table).getByRole('cell', { name: 'pH' })).toBeTruthy()
    expect(within(table).getByRole('cell', { name: '6.8' })).toBeTruthy()

    expect(screen.getByText('After paragraph')).toBeTruthy()
  })
})

describe('Table schema registration', () => {
  const root = path.resolve(__dirname, '..')

  it('defines the table object type with expected fields', () => {
    const src = readFileSync(path.join(root, 'sanity', 'schemaTypes', 'table.ts'), 'utf8')
    expect(src).toContain("name: 'table'")
    expect(src).toContain("type: 'object'")
    for (const field of ['caption', 'hasHeader', 'columns', 'rows']) {
      expect(src).toContain(`name: '${field}'`)
    }
    expect(src).toContain("initialValue: true") // hasHeader default
  })

  it('registers the table type in the schema index', () => {
    const src = readFileSync(path.join(root, 'sanity', 'schemaTypes', 'index.ts'), 'utf8')
    expect(src).toContain("import table from './table'")
    expect(src).toContain('table,')
  })

  it('allows table blocks inside the post body', () => {
    const src = readFileSync(path.join(root, 'sanity', 'schemaTypes', 'post.ts'), 'utf8')
    expect(src).toContain("{ type: 'table' }")
  })
})