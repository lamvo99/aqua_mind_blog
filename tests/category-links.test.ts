import { describe, it, expect } from 'vitest'
import { selectCategoryLinks, toCategoryLink } from '@/lib/category-links'

function category(slug: string, over: Record<string, any> = {}) {
  return { _id: `cat-${slug}`, title: `Category ${slug}`, slug: { current: slug }, description: 'Description', count: 3, ...over }
}

describe('toCategoryLink', () => {
  it('builds a canonical category route', () => {
    expect(toCategoryLink(category('beginner-guides'))).toMatchObject({
      href: '/category/beginner-guides',
      slug: 'beginner-guides',
      title: 'Category beginner-guides',
      count: 3,
    })
  })

  it('rejects invalid, missing and label-less categories', () => {
    expect(toCategoryLink(category('Bad Slug'))).toBeNull()
    expect(toCategoryLink({ title: 'No slug' } as any)).toBeNull()
    expect(toCategoryLink(category('no-title', { title: '   ' }))).toBeNull()
    expect(toCategoryLink(null)).toBeNull()
  })

  it('requires positive published content when requested', () => {
    expect(toCategoryLink(category('empty', { count: 0 }), { requirePublishedContent: true })).toBeNull()
    expect(toCategoryLink(category('unknown-count', { count: undefined }), { requirePublishedContent: true })).toBeNull()
    expect(toCategoryLink(category('published', { count: 1 }), { requirePublishedContent: true })?.href).toBe('/category/published')
  })

  it('allows count-less categories when content filtering is not requested', () => {
    expect(toCategoryLink(category('article-category', { count: undefined }))?.href).toBe('/category/article-category')
  })
})

describe('selectCategoryLinks', () => {
  it('filters empty categories for navigation use', () => {
    const links = selectCategoryLinks(
      [category('published', { count: 2 }), category('empty', { count: 0 })],
      { requirePublishedContent: true }
    )
    expect(links.map((link) => link.slug)).toEqual(['published'])
  })

  it('preserves input order and deduplicates by slug', () => {
    const links = selectCategoryLinks([
      category('first'),
      category('second'),
      category('first'),
    ])
    expect(links.map((link) => link.slug)).toEqual(['first', 'second'])
  })

  it('never emits query-style URLs', () => {
    for (const link of selectCategoryLinks([category('a'), category('b')])) {
      expect(link.href.startsWith('/category/')).toBe(true)
      expect(link.href.includes('?')).toBe(false)
    }
  })

  it('returns an empty array for invalid input', () => {
    expect(selectCategoryLinks(null)).toEqual([])
    expect(selectCategoryLinks(undefined)).toEqual([])
  })
})
