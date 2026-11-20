import { describe, it, expect } from 'vitest'
import {
  sanitizeInternalHref,
  selectLearningPaths,
  selectProblemsForTool,
  selectRelatedArticles,
  selectRelatedEntities,
  selectRelatedProblems,
  selectRelatedTools,
  selectToolGuides,
} from '@/lib/relationship-model'

const now = '2026-01-01T00:00:00Z'

function post(over: Record<string, any> = {}) {
  return {
    _id: 'post-1',
    _type: 'post',
    title: 'Post One',
    slug: { current: 'post-one' },
    excerpt: 'Excerpt',
    publishedAt: now,
    ...over,
  }
}

function entity(type: string, slug: string, name: string, over: Record<string, any> = {}) {
  return { _id: `${type}-${slug}`, _type: type, name, slug: { current: slug }, excerpt: 'Excerpt', ...over }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value as any)) deepFreeze((value as any)[key])
    Object.freeze(value)
  }
  return value
}

describe('sanitizeInternalHref', () => {
  it('accepts relative paths and normalizes the production host', () => {
    expect(sanitizeInternalHref('/posts/one')).toBe('/posts/one')
    expect(sanitizeInternalHref('https://www.aquamind.life/posts/one')).toBe('/posts/one')
  })

  it('rejects malformed, query, utility and external destinations', () => {
    for (const value of [
      'www.aquamind.life/posts/one',
      '/posts?page=2',
      '/posts#top',
      'https://example.com/post',
      '//cdn.example.com/x',
      '/search',
      '/studio',
      '  ',
      null,
      undefined,
    ]) {
      expect(sanitizeInternalHref(value as any)).toBeNull()
    }
  })
})

describe('selectRelatedArticles', () => {
  it('prefers explicit related posts over the category fallback', () => {
    const explicit = [post({ slug: { current: 'explicit' }, title: 'Explicit' })]
    const fallback = [post({ slug: { current: 'fallback' }, title: 'Fallback' })]
    const result = selectRelatedArticles({ explicit, fallback })
    expect(result.map((item) => item.slug)).toEqual(['explicit'])
  })

  it('uses the fallback only when no valid explicit target remains', () => {
    const explicit = [post({ _id: 'drafts.1', slug: { current: 'draft' } }), post({ publishedAt: undefined, slug: { current: 'unpublished' } })]
    const fallback = [post({ slug: { current: 'fallback' }, title: 'Fallback' })]
    expect(selectRelatedArticles({ explicit, fallback }).map((item) => item.slug)).toEqual(['fallback'])
  })

  it('never concatenates explicit and fallback results', () => {
    const explicit = [post({ slug: { current: 'explicit' } })]
    const fallback = [post({ slug: { current: 'f1' } }), post({ slug: { current: 'f2' } })]
    expect(selectRelatedArticles({ explicit, fallback })).toHaveLength(1)
  })

  it('filters drafts, unpublished posts, missing titles, invalid slugs and the current slug', () => {
    const items = [
      post({ _id: 'drafts.x', slug: { current: 'draft' } }),
      post({ publishedAt: undefined, slug: { current: 'unpublished' } }),
      post({ title: '   ', slug: { current: 'no-title' } }),
      post({ slug: { current: 'Bad Slug' } }),
      post({ slug: { current: 'current' } }),
      post({ slug: { current: 'valid' }, title: 'Valid' }),
    ]
    const result = selectRelatedArticles({ explicit: items, currentSlug: 'current' })
    expect(result.map((item) => item.slug)).toEqual(['valid'])
  })

  it('deduplicates by destination and preserves editorial order', () => {
    const items = [
      post({ slug: { current: 'b' }, title: 'B' }),
      post({ slug: { current: 'a' }, title: 'A' }),
      post({ slug: { current: 'b' }, title: 'B duplicate' }),
    ]
    expect(selectRelatedArticles({ explicit: items }).map((item) => item.slug)).toEqual(['b', 'a'])
  })

  it('respects the limit', () => {
    const items = ['a', 'b', 'c', 'd'].map((slug) => post({ slug: { current: slug } }))
    expect(selectRelatedArticles({ explicit: items, limit: 2 })).toHaveLength(2)
  })

  it('returns an empty array for empty or invalid input', () => {
    expect(selectRelatedArticles({})).toEqual([])
    expect(selectRelatedArticles({ explicit: null, fallback: null })).toEqual([])
  })
})

describe('selectRelatedEntities / selectRelatedProblems', () => {
  it('classifies entities and problems separately', () => {
    const items = [
      entity('species', 'neon-tetra', 'Neon Tetra'),
      entity('problem', 'high-ammonia', 'High ammonia'),
      entity('equipment', 'filter-x', 'Filter X'),
    ]
    expect(selectRelatedEntities(items).map((item) => item.type)).toEqual(['species', 'equipment'])
    expect(selectRelatedProblems(items).map((item) => item.type)).toEqual(['problem'])
  })

  it('orders entities by type order then label', () => {
    const items = [
      entity('equipment', 'z-filter', 'Z Filter'),
      entity('species', 'z-fish', 'Z Fish'),
      entity('species', 'a-fish', 'A Fish'),
    ]
    expect(selectRelatedEntities(items).map((item) => item.label)).toEqual(['A Fish', 'Z Fish', 'Z Filter'])
  })

  it('deduplicates entities by type and destination', () => {
    const items = [entity('species', 'neon-tetra', 'Neon Tetra'), entity('species', 'neon-tetra', 'Neon Tetra')]
    expect(selectRelatedEntities(items)).toHaveLength(1)
  })

  it('excludes drafts, invalid slugs and label-less records', () => {
    const items = [
      entity('species', 'draft-fish', 'Draft', { _id: 'drafts.1' }),
      entity('species', 'Bad Slug', 'Bad'),
      entity('species', 'no-label', '   '),
      entity('species', 'valid-fish', 'Valid'),
    ]
    expect(selectRelatedEntities(items).map((item) => item.label)).toEqual(['Valid'])
  })

  it('returns empty arrays for empty input', () => {
    expect(selectRelatedEntities(null)).toEqual([])
    expect(selectRelatedProblems(undefined)).toEqual([])
  })
})

describe('selectRelatedTools', () => {
  it('prefers explicit tool references and builds hrefs from toolUrl or slug', () => {
    const explicit = [
      { _id: 'tool-1', name: 'Water Change Calculator', slug: { current: 'water-change' }, toolUrl: '/tools/water-change' },
      { _id: 'tool-2', name: 'Pump Flow', slug: { current: 'pump-flow' } },
    ]
    const fallback = [{ href: '/tools/lighting', label: 'Lighting' }]
    const result = selectRelatedTools({ explicit, fallback })
    expect(result.map((item) => item.href)).toEqual(['/tools/water-change', '/tools/pump-flow'])
  })

  it('falls back only when no valid explicit tool exists', () => {
    const fallback = [
      { href: '/tools/lighting', label: 'Lighting' },
      { href: '/posts?page=2', label: 'Bad query link' },
      { href: 'www.aquamind.life/tools/co2', label: 'Malformed' },
      { href: '/tools/lighting', label: 'Duplicate' },
    ]
    const result = selectRelatedTools({ explicit: [{ _id: 'drafts.1', name: 'Draft tool' }], fallback })
    expect(result).toEqual([{ href: '/tools/lighting', label: 'Lighting' }])
  })

  it('deduplicates explicit tools and respects the limit', () => {
    const explicit = [
      { name: 'A', slug: { current: 'a' } },
      { name: 'A again', slug: { current: 'a' } },
      { name: 'B', slug: { current: 'b' } },
    ]
    expect(selectRelatedTools({ explicit, limit: 5 }).map((item) => item.href)).toEqual(['/tools/a', '/tools/b'])
  })
})

describe('selectLearningPaths', () => {
  const paths = [
    {
      _id: 'c1',
      slug: { current: 'beginner-path' },
      title: 'Beginner Path',
      steps: [{ post: { slug: { current: 'post-one' } } }, { post: { slug: { current: 'other' } } }],
    },
    {
      _id: 'c2',
      slug: { current: 'planted-path' },
      title: 'Planted Path',
      steps: [{ post: { slug: { current: 'other' } } }],
    },
  ]

  it('derives membership only from collection steps and preserves order', () => {
    expect(selectLearningPaths(paths, 'post-one').map((item) => item.slug)).toEqual(['beginner-path'])
  })

  it('excludes non-members, drafts, invalid slugs/titles and duplicates', () => {
    const input = [
      { _id: 'drafts.1', slug: { current: 'draft-path' }, title: 'Draft', steps: [{ post: { slug: { current: 'post-one' } } }] },
      { slug: { current: 'Bad Path' }, title: 'Bad', steps: [{ post: { slug: { current: 'post-one' } } }] },
      { slug: { current: 'no-title' }, title: '  ', steps: [{ post: { slug: { current: 'post-one' } } }] },
      { slug: { current: 'no-steps' }, title: 'No steps' },
      paths[0],
      paths[0],
    ]
    expect(selectLearningPaths(input as any, 'post-one').map((item) => item.slug)).toEqual(['beginner-path'])
  })

  it('returns empty for invalid or missing post slugs', () => {
    expect(selectLearningPaths(paths, '')).toEqual([])
    expect(selectLearningPaths(paths, 'Bad Slug')).toEqual([])
    expect(selectLearningPaths(null, 'post-one')).toEqual([])
  })
})

describe('selectProblemsForTool', () => {
  const problems = [
    { _id: 'p1', title: 'Z problem', slug: { current: 'z-problem' }, relatedTools: [{ slug: { current: 'water-change' } }] },
    { _id: 'p2', title: 'A problem', slug: { current: 'a-problem' }, relatedTools: [{ slug: { current: 'water-change' } }] },
    { _id: 'p3', title: 'Unrelated', slug: { current: 'unrelated' }, relatedTools: [{ slug: { current: 'lighting' } }] },
    { _id: 'p4', title: 'No tools', slug: { current: 'no-tools' } },
  ]

  it('derives only from problem.relatedTools and sorts by title', () => {
    expect(selectProblemsForTool(problems, 'water-change').map((item) => item.href)).toEqual([
      '/problems/a-problem',
      '/problems/z-problem',
    ])
  })

  it('excludes drafts, invalid problem slugs and invalid tool slugs', () => {
    const input = [
      { _id: 'drafts.1', title: 'Draft', slug: { current: 'draft' }, relatedTools: [{ slug: { current: 'water-change' } }] },
      { title: 'Bad slug', slug: { current: 'Bad Slug' }, relatedTools: [{ slug: { current: 'water-change' } }] },
      ...problems,
    ]
    expect(selectProblemsForTool(input as any, 'water-change')).toHaveLength(2)
    expect(selectProblemsForTool(problems, 'Bad Slug')).toEqual([])
  })
})

describe('selectToolGuides', () => {
  it('prefers tool.relatedPosts and never merges the static fallback', () => {
    const explicit = [post({ slug: { current: 'guide-one' }, title: 'Guide One' })]
    const fallback = [{ href: '/learn/beginner-path', label: 'Beginner path' }]
    const result = selectToolGuides({ explicit, fallback })
    expect(result).toEqual([{ href: '/posts/guide-one', label: 'Guide One', kind: 'article' }])
  })

  it('uses the static fallback only when no valid explicit guide exists', () => {
    const result = selectToolGuides({
      explicit: [post({ publishedAt: undefined, slug: { current: 'unpublished' } })],
      fallback: [{ href: '/tools/stocking', label: 'Stocking calculator' }],
    })
    expect(result).toEqual([{ href: '/tools/stocking', label: 'Stocking calculator', kind: 'resource' }])
  })

  it('drops malformed fallback destinations', () => {
    const result = selectToolGuides({
      fallback: [
        { href: '/posts?page=2', label: 'Query' },
        { href: 'www.aquamind.life/posts/one', label: 'Malformed' },
        { href: '/learn/beginner-path', label: 'Valid path' },
      ],
    })
    expect(result.map((item) => item.href)).toEqual(['/learn/beginner-path'])
  })
})

describe('purity and immutability', () => {
  it('does not mutate inputs', () => {
    const explicit = deepFreeze([post({ slug: { current: 'a' } }), post({ slug: { current: 'b' } })])
    const fallback = deepFreeze([post({ slug: { current: 'c' } })])
    const entities = deepFreeze([entity('species', 'fish', 'Fish'), entity('problem', 'problem', 'Problem')])
    const paths = deepFreeze([
      { slug: { current: 'path' }, title: 'Path', steps: [{ post: { slug: { current: 'a' } } }] },
    ])
    const problems = deepFreeze([
      { title: 'Problem', slug: { current: 'problem' }, relatedTools: [{ slug: { current: 'tool' } }] },
    ])

    const snapshot = JSON.stringify({ explicit, fallback, entities, paths, problems })

    selectRelatedArticles({ explicit, fallback })
    selectRelatedEntities(entities)
    selectRelatedProblems(entities)
    selectLearningPaths(paths as any, 'a')
    selectProblemsForTool(problems as any, 'tool')

    expect(JSON.stringify({ explicit, fallback, entities, paths, problems })).toBe(snapshot)
  })

  it('is deterministic for the same input', () => {
    const items = [entity('species', 'b', 'B'), entity('species', 'a', 'A')]
    expect(selectRelatedEntities(items)).toEqual(selectRelatedEntities(items))
  })
})
