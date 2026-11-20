import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/sanity', () => ({
  client: { fetch: vi.fn().mockResolvedValue([]) },
}))

import sitemap from '@/app/sitemap'
import robots from '@/app/robots'
import { isValidSlugValue } from '@/lib/slug'

type AnyRow = Record<string, any>

function mockSanity(rows: {
  docs?: AnyRow[]
  categories?: AnyRow[]
  collections?: AnyRow[]
}) {
  return (query: any): Promise<AnyRow[]> => {
    const q = String(query)
    if (q.includes('_type == "learn"')) {
      // The bug we are guarding against: learn docs do not exist in this dataset.
      return Promise.resolve([])
    }
    if (q.includes('_type == "collection"')) return Promise.resolve(rows.collections ?? [])
    if (q.includes('_type == "category"')) return Promise.resolve(rows.categories ?? [])
    if (q.includes('_type in $types')) return Promise.resolve(rows.docs ?? [])
    return Promise.resolve([])
  }
}

describe('sitemap', () => {
  it('includes all core pages including new tools, wiki and diagnose', async () => {
    const entries = await sitemap()
    const urls = entries.map((e) => e.url)
    for (const path of [
      '/',
      '/posts',
      '/wiki',
      '/database',
      '/tools',
      '/tools/aquarium-calculator',
      '/tools/diagnostic',
      '/tools/compatibility-checker',
      '/problems/diagnose',
      '/learn',
      '/setup-planner',
    ]) {
      expect(urls).toContain(`https://www.aquamind.life${path === '/' ? '' : path}`)
    }
  })

  it('excludes search (noindex) pages but includes finder', async () => {
    const urls = (await sitemap()).map((e) => e.url)
    expect(urls.some((u) => u.includes('/search'))).toBe(false)
    expect(urls.some((u) => u.includes('/finder'))).toBe(true)
  })

  it('homepage has the highest priority', async () => {
    const home = (await sitemap()).find((e) => e.url === 'https://www.aquamind.life')
    expect(home?.priority).toBe(1)
  })

  it('appends dynamic docs from Sanity when present', async () => {
    const { client } = await import('@/lib/sanity')
    vi.mocked(client.fetch).mockImplementation(
      mockSanity({
        docs: [
          { _type: 'post', slug: 'cycling-101', publishedAt: '2026-01-01T00:00:00Z', _updatedAt: '2026-01-03T00:00:00Z' },
          { _type: 'species', slug: 'neon-tetra', publishedAt: null, _updatedAt: null },
        ],
        categories: [
          { slug: 'beginner-guides', count: 7 },
          { slug: 'empty-category', count: 0 },
        ],
        collections: [{ slug: 'first-tank', _updatedAt: '2026-01-02T00:00:00Z' }],
      })
    ) as any

    const urls = (await sitemap()).map((e) => e.url)
    expect(urls).toContain('https://www.aquamind.life/posts/cycling-101')
    expect(urls).toContain('https://www.aquamind.life/species/neon-tetra')
    expect(urls).toContain('https://www.aquamind.life/category/beginner-guides')
    expect(urls).not.toContain('https://www.aquamind.life/category/empty-category')
    expect(urls).toContain('https://www.aquamind.life/learn/first-tank')
  })

  it('reads learning paths from collection documents, not learn documents', async () => {
    const { client } = await import('@/lib/sanity')
    const calls: string[] = []
    vi.mocked(client.fetch).mockImplementation(((query: any) => {
      calls.push(String(query))
      return mockSanity({ collections: [{ slug: 'tank-basics', _updatedAt: null }] })(query)
    }) as any)

    const urls = (await sitemap()).map((e) => e.url)
    expect(urls).toContain('https://www.aquamind.life/learn/tank-basics')
    expect(calls.some((q) => q.includes('_type == "learn"'))).toBe(false)
  })

  it('uses real timestamps for lastmod and never the generation time', async () => {
    const { client } = await import('@/lib/sanity')
    vi.mocked(client.fetch).mockImplementation(
      mockSanity({
        docs: [
          { _type: 'post', slug: 'with-updated-at', publishedAt: '2026-01-01T00:00:00Z', _updatedAt: '2026-02-01T00:00:00Z' },
          { _type: 'post', slug: 'with-published-at-only', publishedAt: '2026-01-05T00:00:00Z', _updatedAt: null },
          { _type: 'species', slug: 'no-timestamps', publishedAt: null, _updatedAt: null },
        ],
        collections: [{ slug: 'path-with-date', _updatedAt: '2026-03-01T00:00:00Z' }, { slug: 'path-without-date', _updatedAt: null }],
      })
    ) as any

    const entries = await sitemap()
    const byUrl = new Map(entries.map((e) => [e.url, e]))

    expect(byUrl.get('https://www.aquamind.life/posts/with-updated-at')?.lastModified).toBe('2026-02-01T00:00:00Z')
    expect(byUrl.get('https://www.aquamind.life/posts/with-published-at-only')?.lastModified).toBe('2026-01-05T00:00:00Z')
    expect(byUrl.get('https://www.aquamind.life/species/no-timestamps')?.lastModified).toBeUndefined()
    expect(byUrl.get('https://www.aquamind.life/learn/path-with-date')?.lastModified).toBe('2026-03-01T00:00:00Z')
    expect(byUrl.get('https://www.aquamind.life/learn/path-without-date')?.lastModified).toBeUndefined()

    // Static/list/hub/style/category rows have no trustworthy timestamp.
    for (const path of ['/', '/posts', '/wiki', '/learn', '/styles/iwagumi']) {
      expect(byUrl.get(`https://www.aquamind.life${path === '/' ? '' : path}`)?.lastModified).toBeUndefined()
    }
  })
  it('excludes post documents whose slug is not URL-safe', async () => {
    const { client } = await import('@/lib/sanity')
    vi.mocked(client.fetch).mockImplementation(
      mockSanity({
        docs: [
          { _type: 'post', slug: 'safe-post-slug', publishedAt: '2026-01-01T00:00:00Z', _updatedAt: '2026-01-02T00:00:00Z' },
          {
            _type: 'post',
            slug: 'Slug neocaridina-shrimp-reproduction-cycle',
            publishedAt: '2026-01-01T00:00:00Z',
            _updatedAt: '2026-01-02T00:00:00Z',
          },
          { _type: 'species', slug: 'neon-tetra', publishedAt: null, _updatedAt: null },
        ],
      })
    ) as any

    expect(isValidSlugValue('Slug neocaridina-shrimp-reproduction-cycle')).toBe(false)

    const urls = (await sitemap()).map((e) => e.url)
    expect(urls).toContain('https://www.aquamind.life/posts/safe-post-slug')
    expect(urls.some((u) => u.includes('Slug neocaridina'))).toBe(false)
    expect(urls.some((u) => u.includes(' '))).toBe(false)
    expect(urls).toContain('https://www.aquamind.life/species/neon-tetra')
  })

  it('emits only absolute https URLs without whitespace', async () => {
    const { client } = await import('@/lib/sanity')
    vi.mocked(client.fetch).mockImplementation(
      mockSanity({
        docs: [
          { _type: 'post', slug: 'valid-post', publishedAt: '2026-01-01T00:00:00Z', _updatedAt: null },
          { _type: 'post', slug: 'Bad Slug', publishedAt: '2026-01-01T00:00:00Z', _updatedAt: null },
        ],
        collections: [{ slug: 'path-one', _updatedAt: null }],
      })
    ) as any

    for (const entry of await sitemap()) {
      expect(entry.url).toMatch(/^https:\/\/www\.aquamind\.life(\/[^\s]*)?$/)
    }
  })

  it('includes the collections index and exactly the eight published setup collections', async () => {
    const urls = (await sitemap()).map((e) => e.url)
    const collectionPaths = [
      '/collections',
      '/collections/beginner-freshwater',
      '/collections/nano-aquarium',
      '/collections/low-tech-planted',
      '/collections/shrimp-aquarium',
      '/collections/beginner-reef',
      '/collections/soft-coral',
      '/collections/nano-marine',
      '/collections/beginner-invertebrates',
    ]

    for (const path of collectionPaths) {
      expect(urls.filter((url) => url === `https://www.aquamind.life${path}`)).toHaveLength(1)
    }
    expect(urls.some((url) => url.includes('/collections/fowlr'))).toBe(false)
    expect(new Set(urls).size).toBe(urls.length)
  })
})

describe('robots', () => {
  it('allows crawl, blocks studio, points to sitemap', () => {
    const r = robots()
    expect(r.rules).toMatchObject({ userAgent: '*', allow: '/', disallow: '/studio' })
    expect(r.sitemap).toBe('https://www.aquamind.life/sitemap.xml')
  })
})
