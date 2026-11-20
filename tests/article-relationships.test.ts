import { describe, it, expect } from 'vitest'
import { buildArticleRelationships, STATIC_TOOL_ROUTES } from '@/lib/article-relationships'

const now = '2026-01-01T00:00:00Z'

function post(slug: string, over: Record<string, any> = {}) {
  return { _id: `post-${slug}`, title: `Post ${slug}`, slug: { current: slug }, excerpt: 'Excerpt', publishedAt: now, ...over }
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

describe('buildArticleRelationships', () => {
  it('assembles three blocks with explicit articles first', () => {
    const result = buildArticleRelationships({
      postSlug: 'current',
      explicitPosts: [post('explicit')],
      fallbackPosts: [post('fallback')],
      databaseItems: [entity('species', 'fish', 'Fish'), entity('problem', 'problem', 'Problem')],
      reverseTools: [{ _id: 't1', name: 'Water Change', slug: { current: 'water-change' }, toolUrl: '/tools/water-change' }],
      learningPaths: [
        { slug: { current: 'path' }, title: 'Path', steps: [{ post: { slug: { current: 'current' } } }] },
      ],
      hubLinks: [{ href: '/hubs/water-parameters', label: 'Water parameters', description: 'Water' }],
    })

    expect(result.reading.articles.map((a) => a.slug)).toEqual(['explicit'])
    expect(result.reading.paths.map((p) => p.slug)).toEqual(['path'])
    expect(result.database.entities.map((e) => e.label)).toEqual(['Fish'])
    expect(result.database.problems.map((p) => p.label)).toEqual(['Problem'])
    expect(result.nextSteps.tools.map((t) => t.href)).toEqual(['/tools/water-change'])
    expect(result.nextSteps.hubs.map((h) => h.href)).toEqual(['/hubs/water-parameters'])
  })

  it('uses category fallback only when explicit articles are empty', () => {
    const result = buildArticleRelationships({
      postSlug: 'current',
      explicitPosts: [post('current')],
      fallbackPosts: [post('fallback')],
    })
    expect(result.reading.articles.map((a) => a.slug)).toEqual(['fallback'])
  })

  it('never concatenates explicit and fallback articles', () => {
    const result = buildArticleRelationships({
      postSlug: 'current',
      explicitPosts: [post('a')],
      fallbackPosts: [post('b'), post('c')],
    })
    expect(result.reading.articles).toHaveLength(1)
  })

  it('keeps entities and problems separate', () => {
    const result = buildArticleRelationships({
      postSlug: 'current',
      databaseItems: [entity('plant', 'plant', 'Plant'), entity('problem', 'problem', 'Problem')],
    })
    expect(result.database.entities.every((e) => e.kind === 'entity')).toBe(true)
    expect(result.database.problems.every((e) => e.kind === 'problem')).toBe(true)
  })

  it('uses explicit reverse tools first and static fallback only for verified routes', () => {
    const fallbackToolLinks = [
      { href: '/tools/aquarium-calculator', label: 'Aquarium calculator' },
      { href: '/tools/water-change', label: 'Water change' },
      { href: '/problems/diagnose', label: 'Diagnose' },
    ]

    const explicit = buildArticleRelationships({
      postSlug: 'current',
      reverseTools: [{ name: 'Lighting', slug: { current: 'lighting' }, toolUrl: '/tools/lighting' }],
      fallbackToolLinks,
    })
    expect(explicit.nextSteps.tools.map((t) => t.href)).toEqual(['/tools/lighting'])

    const fallback = buildArticleRelationships({ postSlug: 'current', fallbackToolLinks })
    expect(fallback.nextSteps.tools.map((t) => t.href)).toEqual(['/tools/aquarium-calculator'])
  })

  it('only emits static fallback routes that have no Sanity tool document', () => {
    expect(STATIC_TOOL_ROUTES).toEqual([
      '/tools/aquarium-calculator',
      '/tools/compatibility-checker',
      '/tools/diagnostic',
    ])
  })

  it('renders learning paths only for real step membership', () => {
    const result = buildArticleRelationships({
      postSlug: 'current',
      learningPaths: [
        { slug: { current: 'member' }, title: 'Member', steps: [{ post: { slug: { current: 'current' } } }] },
        { slug: { current: 'other' }, title: 'Other', steps: [{ post: { slug: { current: 'different' } } }] },
      ],
    })
    expect(result.reading.paths.map((p) => p.slug)).toEqual(['member'])
  })

  it('deduplicates destinations across blocks with a deterministic priority', () => {
    const result = buildArticleRelationships({
      postSlug: 'current',
      explicitPosts: [post('shared')],
      hubLinks: [{ href: '/posts/shared', label: 'Shared post' }],
    })
    expect(result.reading.articles.map((a) => a.href)).toEqual(['/posts/shared'])
    expect(result.nextSteps.hubs).toEqual([])
  })

  it('sanitizes hub links and drops duplicates/utility destinations', () => {
    const result = buildArticleRelationships({
      postSlug: 'current',
      hubLinks: [
        { href: 'https://www.aquamind.life/hubs/water-parameters', label: 'Water' },
        { href: '/hubs/water-parameters', label: 'Water duplicate' },
        { href: '/search', label: 'Search' },
        { href: 'www.aquamind.life/hubs/planted-tank', label: 'Malformed' },
        { href: '/hubs/aquarium-equipment', label: 'Equipment' },
        { href: '/hubs/planted-tank', label: 'Planted' },
      ],
    })
    expect(result.nextSteps.hubs.map((h) => h.href)).toEqual(['/hubs/water-parameters', '/hubs/aquarium-equipment'])
  })

  it('returns empty blocks for empty input', () => {
    const result = buildArticleRelationships({ postSlug: 'current' })
    expect(result.reading.articles).toEqual([])
    expect(result.reading.paths).toEqual([])
    expect(result.database.entities).toEqual([])
    expect(result.database.problems).toEqual([])
    expect(result.nextSteps.tools).toEqual([])
    expect(result.nextSteps.hubs).toEqual([])
  })

  it('does not mutate its inputs', () => {
    const inputs = deepFreeze({
      postSlug: 'current',
      explicitPosts: [post('a')],
      fallbackPosts: [post('b')],
      databaseItems: [entity('species', 'fish', 'Fish'), entity('problem', 'problem', 'Problem')],
      reverseTools: [{ name: 'Tool', slug: { current: 'tool' }, toolUrl: '/tools/tool' }],
      fallbackToolLinks: [{ href: '/tools/aquarium-calculator', label: 'Calculator' }],
      learningPaths: [{ slug: { current: 'path' }, title: 'Path', steps: [{ post: { slug: { current: 'current' } } }] }],
      hubLinks: [{ href: '/hubs/water-parameters', label: 'Water' }],
    })
    const snapshot = JSON.stringify(inputs)
    buildArticleRelationships(inputs as any)
    expect(JSON.stringify(inputs)).toBe(snapshot)
  })
})
