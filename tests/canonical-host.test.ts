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

import sitemap from '@/app/sitemap'
import robots from '@/app/robots'
import { client } from '@/lib/sanity'
import {
  organizationSchema,
  websiteSchema,
  breadcrumbSchema,
  articleSchema,
  howToSchema,
  collectionPageSchema,
} from '@/lib/seo/jsonld'
import { generateMetadata } from '@/app/species/[slug]/page'
import { getDatabaseItem } from '@/lib/database'

const SITE = 'https://www.aquamind.life'
const APEX = 'https://aquamind.life'

const fetchMock = vi.mocked(client.fetch)
const getDatabaseItemMock = vi.mocked(getDatabaseItem)

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue([] as never)
  getDatabaseItemMock.mockReset()
})

describe('SPEC 08.1 canonical host alignment', () => {
  it('Test 1 — site URL is https://www.aquamind.life', async () => {
    expect(process.env.NEXT_PUBLIC_SITE_URL || SITE).toBe(SITE)
    const entries = await sitemap()
    expect(entries[0].url).toBe(SITE)
    expect(organizationSchema().url).toBe(SITE)
    expect(websiteSchema().url).toBe(SITE)
  })

  it('Test 2 — species canonical uses www host', async () => {
    getDatabaseItemMock.mockResolvedValue({
      name: 'Peppered Corydoras',
      slug: { current: 'corydoras-paleatus' },
      excerpt: 'A hardy bottom dweller.',
      mainImage: null,
      seo: { metaTitle: 'Peppered Corydoras (Corydoras paleatus): behavior and temperament', metaDescription: 'x'.repeat(150) },
    } as never)
    const withSeo = await generateMetadata({ params: Promise.resolve({ slug: 'corydoras-paleatus' }) })
    expect(withSeo.alternates?.canonical).toBe(`${SITE}/species/corydoras-paleatus`)
    expect(withSeo.alternates?.canonical).not.toContain(APEX)

    getDatabaseItemMock.mockResolvedValue({
      name: 'Green Neon Tetra',
      slug: { current: 'paracheirodon-simulans' },
      excerpt: 'A peaceful tetra.',
      mainImage: null,
    } as never)
    const withoutSeo = await generateMetadata({ params: Promise.resolve({ slug: 'paracheirodon-simulans' }) })
    expect(withoutSeo.alternates?.canonical).toBe(`${SITE}/species/paracheirodon-simulans`)
  })

  it('Test 3 — species og:url uses www host', async () => {
    getDatabaseItemMock.mockResolvedValue({
      name: 'Green Neon Tetra',
      slug: { current: 'paracheirodon-simulans' },
      excerpt: 'A peaceful tetra.',
      mainImage: null,
      seo: { metaTitle: 'Green Neon Tetra: behavior and temperament', metaDescription: 'y'.repeat(150) },
    } as never)
    const md = await generateMetadata({ params: Promise.resolve({ slug: 'paracheirodon-simulans' }) })
    expect(md.openGraph?.url).toBe(`${SITE}/species/paracheirodon-simulans`)
    expect(md.openGraph?.url).not.toContain(APEX)
  })

  it('Test 4 — all sitemap URLs use www host, no apex/localhost/query', async () => {
    fetchMock
      .mockResolvedValueOnce([
        { _type: 'species', slug: 'neon-tetra', publishedAt: '2026-01-01', updatedAt: null },
        { _type: 'post', slug: 'cycling-101', publishedAt: '2026-01-01', updatedAt: null },
      ] as never)
      .mockResolvedValueOnce([{ slug: 'beginner-guides', count: 7 }] as never)
      .mockResolvedValueOnce([{ slug: 'first-tank' }] as never)
    const entries = await sitemap()
    const urls = entries.map((e) => e.url)
    expect(urls.length).toBeGreaterThan(0)
    for (const url of urls) {
      expect(url.startsWith(`${SITE}/`) || url === SITE).toBe(true)
      expect(url.includes('aquamind.life') && !url.startsWith(SITE)).toBe(false)
      expect(url.includes('localhost')).toBe(false)
      expect(url.includes('127.0.0.1')).toBe(false)
      expect(url.includes('?')).toBe(false)
    }
    expect(urls).toContain(`${SITE}/species/neon-tetra`)
    expect(urls).toContain(`${SITE}/posts/cycling-101`)
    expect(urls).toContain(`${SITE}/category/beginner-guides`)
    expect(urls).toContain(`${SITE}/learn/first-tank`)
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('Test 5 — robots sitemap directive uses www host', () => {
    const r = robots()
    expect(r.sitemap).toBe(`${SITE}/sitemap.xml`)
    expect(r.rules).toMatchObject({ userAgent: '*', allow: '/', disallow: '/studio' })
  })

  it('Test 6 — JSON-LD canonical site URLs use www host', () => {
    const org = organizationSchema()
    expect(org.url).toBe(SITE)
    expect(org.logo).toBe(`${SITE}/logo.png`)

    const site = websiteSchema()
    expect(site.url).toBe(SITE)
    expect(site.potentialAction.target.urlTemplate).toBe(`${SITE}/search?q={search_term_string}`)

    const bc = breadcrumbSchema([
      { label: 'Home', href: '/' },
      { label: 'Fish', href: '/species' },
      { label: 'Neon Tetra', href: '/species/neon-tetra' },
    ])
    expect(bc.itemListElement[0].item).toBe(`${SITE}/`)
    expect(bc.itemListElement[1].item).toBe(`${SITE}/species`)
    expect(bc.itemListElement[2].item).toBe(`${SITE}/species/neon-tetra`)

    const article = articleSchema({
      title: 'Cycling 101',
      excerpt: 'How to cycle a tank.',
      publishedAt: '2026-01-01',
      updatedAt: null,
      slug: { current: 'cycling-101' },
      mainImage: null,
      categories: [],
    })
    expect(article.mainEntityOfPage['@id']).toBe(`${SITE}/posts/cycling-101`)
    expect(article.publisher.logo).toBe(`${SITE}/logo.png`)

    const howTo = howToSchema('Title', 'Desc', [{ name: 'a', text: 'b' }], '/tools/co2')
    expect(howTo.url).toBe(`${SITE}/tools/co2`)

    const collection = collectionPageSchema({
      name: 'Fish Species Database',
      url: `${SITE}/species`,
      items: [{ title: 'Neon Tetra', url: `${SITE}/species/neon-tetra` }],
    })
    expect(collection.url).toBe(`${SITE}/species`)
    expect(collection.mainEntity.itemListElement[0].url).toBe(`${SITE}/species/neon-tetra`)
  })
})
