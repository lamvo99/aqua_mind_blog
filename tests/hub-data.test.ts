import { describe, it, expect } from 'vitest'
import { buildHubsFromPosts } from '@/lib/hubs'

const posts = ['one', 'two', 'three'].map((slug) => ({
  _id: `post-${slug}`,
  title: `Planted article ${slug}`,
  slug: { current: `planted-article-${slug}` },
  publishedAt: '2026-01-01T00:00:00Z',
  tags: ['planted aquarium'],
}))

describe('hub data selection', () => {
  it('does not repeat the low-tech collection across hub modules', () => {
    const planted = buildHubsFromPosts(posts).find((hub) => hub.slug === 'planted-tank')
    expect(planted).toBeTruthy()
    const hrefs = [...(planted?.databaseLinks || []), ...(planted?.collections || [])].map((link) => link.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
    expect((planted?.collections || []).filter((link) => link.href === '/collections/low-tech-planted')).toHaveLength(1)
  })
})
