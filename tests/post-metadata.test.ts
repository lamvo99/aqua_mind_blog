import { describe, it, expect } from 'vitest'
import { resolvePostSeo } from '@/lib/seo/post-metadata'

const mainImage = { _type: 'image', asset: { _ref: 'image-a' } }
const ogImage = { _type: 'image', asset: { _ref: 'image-b' } }

const basePost = {
  title: 'Post title',
  excerpt: 'Post excerpt',
  mainImage,
}

describe('resolvePostSeo', () => {
  it('prefers authored meta title and description', () => {
    const result = resolvePostSeo({
      ...basePost,
      seo: { metaTitle: 'Authored title', metaDescription: 'Authored description' },
    })
    expect(result.title).toBe('Authored title')
    expect(result.description).toBe('Authored description')
  })

  it('falls back to title and excerpt when seo is missing', () => {
    const result = resolvePostSeo(basePost)
    expect(result.title).toBe('Post title')
    expect(result.description).toBe('Post excerpt')
  })

  it('falls back when authored values are blank', () => {
    const result = resolvePostSeo({
      ...basePost,
      seo: { metaTitle: '   ', metaDescription: '' },
    })
    expect(result.title).toBe('Post title')
    expect(result.description).toBe('Post excerpt')
  })

  it('prefers the authored OG image and falls back to the main image', () => {
    expect(resolvePostSeo({ ...basePost, seo: { ogImage } }).image).toBe(ogImage)
    expect(resolvePostSeo(basePost).image).toBe(mainImage)
    expect(resolvePostSeo({ title: 'x', excerpt: 'y' }).image).toBeNull()
  })

  it('handles an empty post without throwing', () => {
    expect(resolvePostSeo(null)).toEqual({ title: '', description: '', image: null })
  })
})
