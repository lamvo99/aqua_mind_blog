import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/sanity', () => ({
  client: { fetch: vi.fn().mockResolvedValue([]) },
  urlFor: vi.fn(() => ({
    width: () => ({ height: () => ({ url: () => 'https://cdn.example/img.jpg' }) }),
  })),
}))

vi.mock('@/lib/database', () => ({
  getDatabaseItem: vi.fn(),
  getDatabaseList: vi.fn().mockResolvedValue([]),
}))

import { generateMetadata } from '@/app/species/[slug]/page'
import { getDatabaseItem } from '@/lib/database'

const mockedGetItem = vi.mocked(getDatabaseItem)

const props = (slug: string) => ({ params: Promise.resolve({ slug }) })

const SEO = {
  metaTitle: 'Peppered Corydoras (Corydoras paleatus): behavior and temperament',
  metaDescription:
    'Peppered Corydoras is a Beginner-level freshwater fish. Grows to 7 cm, needs 60 L at 22-28°C, pH 6-7.5. It is an omnivore. Covers behavior and temperament.',
}

const ITEM_WITH_SEO = {
  _id: 'species.abc',
  name: 'Peppered Corydoras',
  slug: { current: 'corydoras-paleatus' },
  excerpt: 'A hardy bottom dweller for community tanks.',
  mainImage: null,
  seo: { ...SEO },
}

const ITEM_WITHOUT_SEO = {
  _id: 'species.def',
  name: 'Green Neon Tetra',
  slug: { current: 'paracheirodon-simulans' },
  excerpt: 'A peaceful schooling tetra.',
  mainImage: null,
}

describe('species generateMetadata — SPEC 08 SEO integration', () => {
  beforeEach(() => {
    mockedGetItem.mockReset()
  })

  it('Case 1: uses seo.metaTitle / seo.metaDescription when present', async () => {
    mockedGetItem.mockResolvedValue(ITEM_WITH_SEO as any)
    const md = await generateMetadata(props('corydoras-paleatus'))

    expect(md.title).toEqual({ absolute: SEO.metaTitle })
    expect(md.description).toBe(SEO.metaDescription)
    expect(md.alternates?.canonical).toBe('https://www.aquamind.life/species/corydoras-paleatus')
    expect(md.openGraph?.title).toBe(SEO.metaTitle)
    expect(md.openGraph?.description).toBe(SEO.metaDescription)
    expect(md.openGraph?.url).toBe('https://www.aquamind.life/species/corydoras-paleatus')
    expect(md.twitter?.title).toBe(SEO.metaTitle)
    expect(md.twitter?.description).toBe(SEO.metaDescription)
    expect(md.robots).toBeUndefined()
  })

  it('Case 1b: rendered title length stays within the frozen 38-65 char bound', async () => {
    mockedGetItem.mockResolvedValue(ITEM_WITH_SEO as any)
    const md = await generateMetadata(props('corydoras-paleatus'))
    const t = md.title
    const rendered = typeof t === 'object' && t !== null && 'absolute' in t ? t.absolute : String(t)
    expect(rendered).toBe(SEO.metaTitle)
    expect((rendered as string).length).toBeGreaterThanOrEqual(38)
    expect((rendered as string).length).toBeLessThanOrEqual(65)
  })

  it('Case 2: safe documented fallback when seo is absent', async () => {
    mockedGetItem.mockResolvedValue(ITEM_WITHOUT_SEO as any)
    const md = await generateMetadata(props('paracheirodon-simulans'))

    expect(md.title).toBe('Green Neon Tetra — Fish Profile')
    expect(md.description).toBe('A peaceful schooling tetra.')
    expect(md.openGraph?.title).toBe('Green Neon Tetra — Fish Profile')
    expect(md.openGraph?.description).toBe('A peaceful schooling tetra.')
    expect(md.alternates?.canonical).toBe('https://www.aquamind.life/species/paracheirodon-simulans')
  })

  it('Case 2b: empty or whitespace-only seo values fall back safely', async () => {
    mockedGetItem.mockResolvedValue({
      ...ITEM_WITHOUT_SEO,
      seo: { metaTitle: '   ', metaDescription: '' },
    } as any)
    const md = await generateMetadata(props('paracheirodon-simulans'))

    expect(md.title).toBe('Green Neon Tetra — Fish Profile')
    expect(md.description).toBe('A peaceful schooling tetra.')
  })

  it('unknown slug returns a not-found title', async () => {
    mockedGetItem.mockResolvedValue(null as any)
    const md = await generateMetadata(props('does-not-exist'))
    expect(md.title).toBe('Not found')
  })
})
