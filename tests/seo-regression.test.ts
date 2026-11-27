import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

vi.mock('@/lib/sanity', () => ({
  client: { fetch: vi.fn() },
  urlFor: vi.fn(() => ({
    width: () => ({ height: () => ({ url: () => 'https://cdn.example/img.jpg' }) }),
  })),
}))

import sitemap from '@/app/sitemap'
import robots from '@/app/robots'
import { client } from '@/lib/sanity'
import { SITE_URL, withListingSeo } from '@/lib/listing-seo'
import { buildDetailMetadata } from '@/lib/seo/detail-metadata'
import {
  WAVE1_REDIRECT_GROUPS,
  getEnabledWave1Redirects,
  isWave1GroupActivatable,
} from '@/lib/wave1-redirects'
import {
  extractFirstPartyLinks,
  normalizeInternalUrl,
} from '../scripts/seo/check-internal-links.mjs'

const require = createRequire(import.meta.url)
const nextConfig = require('../next.config.js')

const SITE = 'https://www.aquamind.life'
const APPROVED_GROUPS = ['W1-09', 'W1-10']
const fetchMock = vi.mocked(client.fetch)

const SITEMAP_DOCS = [
  { _type: 'post', slug: 'seo-regression-post', publishedAt: '2026-01-01', _updatedAt: null },
  { _type: 'species', slug: 'seo-regression-fish', publishedAt: null, _updatedAt: null },
  { _type: 'equipment', slug: 'aquarium-soil-substrate', publishedAt: null, _updatedAt: null },
  { _type: 'invertebrate', slug: 'neocaridina-davidi', publishedAt: null, _updatedAt: null },
]

function walkSourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkSourceFiles(full))
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full)
  }
  return out
}

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockImplementation(((query: unknown) => {
    const q = String(query)
    if (q.includes('_type in $types')) return Promise.resolve(SITEMAP_DOCS as never)
    if (q.includes('_type == "category"')) return Promise.resolve([] as never)
    if (q.includes('_type == "collection"')) return Promise.resolve([] as never)
    return Promise.resolve([] as never)
  }) as never)
})

describe('SEO regression — sitemap invariants', () => {
  it('keeps every sitemap URL absolute, canonical and query-free', async () => {
    const entries = await sitemap()
    const urls = entries.map((entry) => entry.url)
    const paths = urls.map((url) => new URL(url).pathname)

    expect(urls.length).toBeGreaterThan(0)
    for (const url of urls) {
      expect(url === SITE || url.startsWith(`${SITE}/`), url).toBe(true)
      const parsed = new URL(url)
      expect(parsed.protocol, url).toBe('https:')
      expect(parsed.host, url).toBe('www.aquamind.life')
      expect(parsed.search, url).toBe('')
      expect(parsed.hash, url).toBe('')
    }
    expect(new Set(urls).size).toBe(urls.length)

    const redirects = await nextConfig.redirects()
    for (const redirect of redirects) {
      expect(paths, `${redirect.source} must not be in the sitemap`).not.toContain(redirect.source)
    }

    for (const nonIndexable of ['/search', '/studio']) {
      expect(paths, `${nonIndexable} must not be in the sitemap`).not.toContain(nonIndexable)
    }

    for (const required of [
      '/tools/reef-dosing',
      '/equipment/aquarium-soil-substrate',
      '/invertebrates/neocaridina-davidi',
      '/posts/seo-regression-post',
    ]) {
      expect(paths).toContain(required)
    }

    expect(paths).not.toContain('/equipment/aquasoil-substrate')
    expect(paths).not.toContain('/invertebrates/neocaridina-davidi-cherry')

    // No brittle exact count; surface the observed count in test output.
    console.info(`[seo-regression] observed sitemap count: ${urls.length}`)
  })
})

describe('SEO regression — redirect map', () => {
  it('preserves the approved P1 and Wave 1 redirects with the expected status classes', async () => {
    const list = await nextConfig.redirects()
    const bySource = new Map(list.map((item: any) => [item.source, item]))

    expect(bySource.get('/tools/setup-planner')).toMatchObject({
      destination: '/setup-planner',
      permanent: true,
    })
    expect(bySource.get('/plants/java-moss')).toMatchObject({
      destination: '/plants/taxiphyllum-barbieri',
      permanent: true,
    })
    expect(bySource.get('/corals/acan-lords')).toMatchObject({
      destination: '/corals/acan-lord',
      permanent: true,
    })
    expect(bySource.get('/equipment/aquasoil-substrate')).toMatchObject({
      destination: '/equipment/aquarium-soil-substrate',
      statusCode: 301,
    })
    expect(bySource.get('/invertebrates/neocaridina-davidi-cherry')).toMatchObject({
      destination: '/invertebrates/neocaridina-davidi',
      statusCode: 301,
    })
  })

  it('contains no self-redirects, chains or loops', async () => {
    const list = await nextConfig.redirects()
    const sources = new Set(list.map((item: any) => item.source))
    for (const item of list) {
      expect(item.source).not.toBe(item.destination)
      expect(item.destination.startsWith('/')).toBe(true)
      expect(item.destination).not.toMatch(/[?#]/)
      expect(item.destination).not.toMatch(/\/$/)
      expect(sources.has(item.destination), `${item.source} -> ${item.destination} is a chain`).toBe(false)
    }
  })

  it('keeps only the two approved Wave 1 groups active', () => {
    expect(getEnabledWave1Redirects().map((redirect) => redirect.source).sort()).toEqual([
      '/equipment/aquasoil-substrate',
      '/invertebrates/neocaridina-davidi-cherry',
    ])
    for (const group of WAVE1_REDIRECT_GROUPS) {
      expect(isWave1GroupActivatable(group)).toBe(APPROVED_GROUPS.includes(group.group))
    }
  })
})

describe('SEO regression — canonical, robots and metadata', () => {
  it('uses the canonical www host in listing metadata', () => {
    expect(SITE_URL).toBe(SITE)

    const clean = withListingSeo({ title: 'Fish' }, '/species', {})
    expect(clean.alternates?.canonical).toBe(`${SITE}/species`)
    expect(clean.robots).toEqual({ index: true, follow: true })

    const filtered = withListingSeo({ title: 'Fish' }, '/species', { difficulty: 'Beginner' })
    expect(filtered.alternates?.canonical).toBe(`${SITE}/species`)
    expect(filtered.robots).toEqual({ index: false, follow: true })
  })

  it('builds detail canonicals on the canonical host and preserves authored SEO', () => {
    const fallback = buildDetailMetadata(
      { name: 'Test Equipment', excerpt: 'Fallback description' },
      { pathPrefix: 'equipment', slug: 'test-equipment', profileLabel: 'Equipment', imageAltSuffix: 'equipment' }
    )
    expect(fallback.alternates?.canonical).toBe(`${SITE}/equipment/test-equipment`)
    expect(fallback.openGraph?.url).toBe(`${SITE}/equipment/test-equipment`)

    const authored = buildDetailMetadata(
      {
        name: 'Test Equipment',
        excerpt: 'Fallback description',
        seo: { metaTitle: 'Authored title', metaDescription: 'Authored description' },
      },
      { pathPrefix: 'equipment', slug: 'test-equipment', profileLabel: 'Equipment', imageAltSuffix: 'equipment' }
    )
    expect(authored.title).toEqual({ absolute: 'Authored title' })
    expect(authored.description).toBe('Authored description')
    expect(authored.alternates?.canonical).toBe(`${SITE}/equipment/test-equipment`)
  })

  it('points robots.txt at the canonical sitemap and disallows Studio', () => {
    const r = robots()
    expect(r.sitemap).toBe(`${SITE}/sitemap.xml`)
    expect(r.rules).toMatchObject({ userAgent: '*', allow: '/', disallow: '/studio' })
  })

  it('has no accidental apex, http or localhost canonical values in app/lib', () => {
    // The newsletter confirmation email uses a localhost fallback for local dev;
    // it is not a canonical/SEO URL and is intentionally excluded.
    const nonSeoFiles = new Set([path.resolve('lib/newsletter.ts')])
    const files = [...walkSourceFiles(path.resolve('app')), ...walkSourceFiles(path.resolve('lib'))]
    for (const file of files) {
      if (nonSeoFiles.has(file)) continue
      const source = fs.readFileSync(file, 'utf8')
      if (!/canonical|SITE_URL|siteUrl/.test(source)) continue
      expect(source, file).not.toMatch(/https:\/\/aquamind\.life(?!\/)/)
      expect(source, file).not.toMatch(/http:\/\/www\.aquamind\.life/)
      expect(source, file).not.toMatch(/localhost:\d+/)
    }
  }, 15000)

  it('keeps the dedicated not-found route outside the sitemap', () => {
    expect(fs.existsSync(path.resolve('app/not-found.tsx'))).toBe(true)
    const sitemapSource = fs.readFileSync(path.resolve('app/sitemap.ts'), 'utf8')
    expect(sitemapSource).not.toContain('"/not-found"')
  })

  it('keeps search explicitly noindex', () => {
    const searchSource = fs.readFileSync(path.resolve('app/search/page.tsx'), 'utf8')
    expect(searchSource).toContain('robots: { index: false }')
  })
})

describe('SEO regression — internal-link parser', () => {
  const pageUrl = `${SITE}/posts`

  it('normalizes internal links and ignores non-HTTP/external forms', () => {
    expect(normalizeInternalUrl('/species/', pageUrl, SITE)).toBe(`${SITE}/species`)
    expect(normalizeInternalUrl('/species#section', pageUrl, SITE)).toBe(`${SITE}/species`)
    expect(normalizeInternalUrl('../plants', pageUrl, SITE)).toBe(`${SITE}/plants`)
    expect(normalizeInternalUrl('/species?page=2', pageUrl, SITE)).toBe(`${SITE}/species?page=2`)
    expect(normalizeInternalUrl('mailto:hello@example.com', pageUrl, SITE)).toBeNull()
    expect(normalizeInternalUrl('tel:+10000000000', pageUrl, SITE)).toBeNull()
    expect(normalizeInternalUrl('javascript:void(0)', pageUrl, SITE)).toBeNull()
    expect(normalizeInternalUrl('https://example.com/x', pageUrl, SITE)).toBeNull()
    expect(normalizeInternalUrl('#top', pageUrl, SITE)).toBeNull()
    expect(normalizeInternalUrl('/studio', pageUrl, SITE)).toBeNull()
  })

  it('extracts unique first-party links from rendered HTML', () => {
    const html = `
      <a href="/species">Species</a>
      <a href="https://www.aquamind.life/plants/">Plants</a>
      <a href="/species#section">Species hash</a>
      <a href="mailto:hello@example.com">Mail</a>
      <a href="https://example.com/external">External</a>
      <a href="#top">Top</a>
    `
    expect(extractFirstPartyLinks(html, pageUrl, SITE)).toEqual([`${SITE}/species`, `${SITE}/plants`])
  })
})
