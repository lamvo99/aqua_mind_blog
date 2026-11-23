import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/sanity', () => ({
  client: { fetch: vi.fn() },
}))

import { client } from '@/lib/sanity'
import { getAllPosts, getPostBySlug, getPostsByCategory, getRelatedPosts } from '@/lib/posts'

const validPost = {
  _id: 'post-valid',
  title: 'Valid Post',
  slug: { current: 'valid-post' },
  publishedAt: '2026-01-01T00:00:00Z',
}
const invalidPost = {
  _id: 'post-invalid',
  title: 'Legacy Invalid Slug',
  slug: { current: 'Slug neocaridina-shrimp-reproduction-cycle' },
  publishedAt: '2026-01-01T00:00:00Z',
}

describe('post slug integrity', () => {
  beforeEach(() => {
    vi.mocked(client.fetch).mockReset()
  })

  it('removes invalid legacy slugs from public post lists', async () => {
    vi.mocked(client.fetch).mockResolvedValue([validPost, invalidPost] as never)
    const posts = await getAllPosts()
    expect(posts.map((post: any) => post.slug.current)).toEqual(['valid-post'])
  })

  it('does not fetch a post whose requested slug is invalid', async () => {
    const post = await getPostBySlug('Slug neocaridina-shrimp-reproduction-cycle')
    expect(post).toBeNull()
    expect(client.fetch).not.toHaveBeenCalled()
  })

  it('filters invalid slugs from category and related-post results', async () => {
    vi.mocked(client.fetch).mockResolvedValue([validPost, invalidPost] as never)
    expect((await getPostsByCategory('beginner-guides')).map((post: any) => post.slug.current)).toEqual(['valid-post'])
    expect((await getRelatedPosts('current-post', ['beginner-guides'])).map((post: any) => post.slug.current)).toEqual(['valid-post'])
  })
})
