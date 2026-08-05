import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/sanity', () => ({
  client: { fetch: vi.fn().mockResolvedValue([]) },
}))

import sitemap from '@/app/sitemap'
import robots from '@/app/robots'

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
      '/tools/aquarium-planner',
      '/tools/diagnostic',
      '/tools/compatibility-checker',
      '/problems/diagnose',
      '/learn',
      '/setup-planner',
    ]) {
      expect(urls).toContain(`https://aquamind.life${path === '/' ? '' : path}`)
    }
  })

  it('excludes search and finder (app-like, noindex) pages', async () => {
    const urls = (await sitemap()).map((e) => e.url)
    expect(urls.some((u) => u.includes('/search'))).toBe(false)
    expect(urls.some((u) => u.includes('/finder'))).toBe(false)
  })

  it('homepage has the highest priority', async () => {
    const home = (await sitemap()).find((e) => e.url === 'https://aquamind.life')
    expect(home?.priority).toBe(1)
  })

  it('appends dynamic docs from Sanity when present', async () => {
    const { client } = await import('@/lib/sanity')
    const fetchMock = vi.mocked(client.fetch)
    fetchMock
      .mockResolvedValueOnce([
        { _type: 'post', slug: 'cycling-101', publishedAt: '2026-01-01', updatedAt: null },
        { _type: 'species', slug: 'neon-tetra', publishedAt: '2026-01-01', updatedAt: null },
      ])
      .mockResolvedValueOnce([
        { slug: 'beginner-guides', count: 7 },
        { slug: 'empty-category', count: 0 },
      ])
      .mockResolvedValueOnce([{ slug: 'first-tank' }])
    const entries = await sitemap()
    const urls = entries.map((e) => e.url)
    expect(urls).toContain('https://aquamind.life/posts/cycling-101')
    expect(urls).toContain('https://aquamind.life/species/neon-tetra')
    expect(urls).toContain('https://aquamind.life/category/beginner-guides')
    expect(urls).not.toContain('https://aquamind.life/category/empty-category')
    expect(urls).toContain('https://aquamind.life/learn/first-tank')
  })
})

describe('robots', () => {
  it('allows crawl, blocks studio, points to sitemap', () => {
    const r = robots()
    expect(r.rules).toMatchObject({ userAgent: '*', allow: '/', disallow: '/studio' })
    expect(r.sitemap).toBe('https://aquamind.life/sitemap.xml')
  })
})
