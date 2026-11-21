import { describe, it, expect } from 'vitest'
import { searchCorpus, searchHref, type SearchDoc } from '@/lib/search-core'
import { mapSearchRows } from '@/lib/search-server'

const docs: SearchDoc[] = [
  { id: 'problem-1', type: 'problem', title: 'High Ammonia Poisoning', excerpt: 'Ammonia burns gills.', slug: 'high-ammonia' },
  { id: 'inspiration-1', type: 'inspiration', title: 'Reef Nano', excerpt: 'A miniature reef.', slug: 'reef-nano' },
  { id: 'collection-1', type: 'collection', title: 'Nano marine aquarium', excerpt: 'Small marine setup.', slug: 'nano-marine', href: '/collections/nano-marine' },
  { id: 'species-1', type: 'species', title: 'Paradise Fish', origin: 'East Asia, China, Vietnam, Korea', region: 'Southeast Asia', slug: 'macropodus-opercularis' },
]

describe('search Phase 2 coverage', () => {
  it('finds a problem by a relevant term', () => {
    const result = searchCorpus(docs, 'ammonia', 'all', 10)
    expect(result.results.map((hit) => hit.type)).toContain('problem')
  })

  it('finds inspiration and collection records', () => {
    expect(searchCorpus(docs, 'reef', 'all', 10).results.some((hit) => hit.type === 'inspiration')).toBe(true)
    expect(searchCorpus(docs, 'nano marine', 'collection', 10).results[0]?.type).toBe('collection')
  })

  it('finds entity origin and region text', () => {
    expect(searchCorpus(docs, 'vietnam', 'all', 10).results[0]?.matchedField).toBe('origin')
    expect(searchCorpus(docs, 'southeast asia', 'all', 10).results[0]?.matchedField).toBe('region')
  })

  it('builds correct result links for the new types', () => {
    expect(searchHref({ type: 'problem', slug: 'high-ammonia' })).toBe('/problems/high-ammonia')
    expect(searchHref({ type: 'inspiration', slug: 'reef-nano' })).toBe('/inspiration/reef-nano')
    expect(searchHref({ type: 'collection', slug: 'nano-marine', href: '/collections/nano-marine' })).toBe('/collections/nano-marine')
  })

  it('excludes draft documents and unpublished posts from the corpus', () => {
    const docs = mapSearchRows([
      { _id: 'drafts.species-1', _type: 'species', name: 'Draft Fish', slug: 'draft-fish' },
      { _id: 'post-1', _type: 'post', title: 'Unpublished Post', slug: 'unpublished-post' },
      { _id: 'post-2', _type: 'post', title: 'Published Post', publishedAt: '2026-01-01', slug: 'published-post' },
      { _id: 'species-2', _type: 'species', name: 'Live Fish', slug: 'live-fish' },
    ])
    expect(docs.map((doc) => doc.title)).toEqual(['Published Post', 'Live Fish'])
  })
})
