import { describe, it, expect } from 'vitest'
import { buildToolRelationships } from '@/lib/tool-relationships'

const now = '2026-01-01T00:00:00Z'

function guide(slug: string, over: Record<string, any> = {}) {
  return { _id: `post-${slug}`, title: `Guide ${slug}`, slug: { current: slug }, excerpt: 'Excerpt', publishedAt: now, ...over }
}

function toolDoc(over: Record<string, any> = {}) {
  return {
    _id: 'tool-1',
    name: 'Water Change Calculator',
    slug: { current: 'water-change' },
    toolUrl: '/tools/water-change',
    relatedPosts: [guide('water-guide')],
    ...over,
  }
}

function problem(slug: string, title: string, toolSlugs: string[] = ['water-change'], over: Record<string, any> = {}) {
  return {
    _id: `problem-${slug}`,
    title,
    slug: { current: slug },
    relatedTools: toolSlugs.map((s) => ({ slug: { current: s } })),
    ...over,
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value as any)) deepFreeze((value as any)[key])
    Object.freeze(value)
  }
  return value
}

describe('buildToolRelationships — Tool → Guide', () => {
  it('uses tool.relatedPosts for Sanity-backed tools', () => {
    const result = buildToolRelationships({ toolDocument: toolDoc(), staticGuides: [{ href: '/learn/static', label: 'Static' }] })
    expect(result.guides).toEqual([{ href: '/posts/water-guide', label: 'Guide water-guide', kind: 'article' }])
  })

  it('does not invoke static fallback for a Sanity-backed tool with empty explicit guides', () => {
    const result = buildToolRelationships({
      toolDocument: toolDoc({ relatedPosts: [] }),
      staticGuides: [{ href: '/learn/static', label: 'Static' }],
    })
    expect(result.guides).toEqual([])
  })

  it('uses static fallback only when no Sanity tool document exists', () => {
    const result = buildToolRelationships({
      toolDocument: null,
      staticGuides: [{ href: '/tools/aquarium-calculator', label: 'Calculator' }],
    })
    expect(result.guides).toEqual([{ href: '/tools/aquarium-calculator', label: 'Calculator', kind: 'resource' }])
  })

  it('filters unpublished and invalid guides', () => {
    const result = buildToolRelationships({
      toolDocument: toolDoc({
        relatedPosts: [
          guide('published'),
          guide('draft', { _id: 'drafts.1' }),
          guide('invalid', { slug: { current: 'Bad Slug' } }),
          guide('unpublished', { publishedAt: undefined }),
        ],
      }),
    })
    expect(result.guides.map((g) => g.href)).toEqual(['/posts/published'])
  })
})

describe('buildToolRelationships — Tool → Problem', () => {
  it('derives only from problem.relatedTools and sorts by title', () => {
    const result = buildToolRelationships({
      toolDocument: toolDoc(),
      problems: [
        problem('z', 'Z problem'),
        problem('a', 'A problem'),
        problem('other', 'Other tool problem', ['lighting']),
      ],
    })
    expect(result.problems.map((p) => p.href)).toEqual(['/problems/a', '/problems/z'])
  })

  it('filters drafts, invalid slugs and duplicate references', () => {
    const result = buildToolRelationships({
      toolDocument: toolDoc(),
      problems: [
        problem('dup', 'Duplicate'),
        problem('dup', 'Duplicate'),
        problem('draft', 'Draft', ['water-change'], { _id: 'drafts.1' }),
        problem('bad', 'Bad slug', ['water-change'], { slug: { current: 'Bad Slug' } }),
      ],
    })
    expect(result.problems.map((p) => p.href)).toEqual(['/problems/dup'])
  })

  it('returns no problems for tools without references', () => {
    const result = buildToolRelationships({
      toolDocument: toolDoc({ slug: { current: 'aquarium-volume' } }),
      problems: [problem('a', 'A problem')],
    })
    expect(result.problems).toEqual([])
  })

  it('caps the problem list', () => {
    const problems = Array.from({ length: 8 }, (_, i) => problem(`p${i}`, `Problem ${i}`))
    expect(buildToolRelationships({ toolDocument: toolDoc(), problems }).problems).toHaveLength(5)
  })
})

describe('buildToolRelationships — general', () => {
  it('returns empty blocks for empty input', () => {
    expect(buildToolRelationships({})).toEqual({ problems: [], guides: [] })
  })

  it('keeps the two modules free of duplicate destinations', () => {
    const result = buildToolRelationships({
      toolDocument: toolDoc({ relatedPosts: [guide('shared')] }),
      problems: [problem('shared-problem', 'Problem', ['water-change'])],
    })
    const problemHrefs = result.problems.map((p) => p.href)
    const guideHrefs = result.guides.map((g) => g.href)
    expect(problemHrefs.filter((href) => guideHrefs.includes(href))).toEqual([])
    expect(result.problems).toHaveLength(1)
    expect(result.guides).toHaveLength(1)
  })

  it('does not mutate inputs', () => {
    const inputs = deepFreeze({
      toolDocument: toolDoc(),
      problems: [problem('a', 'A problem')],
      staticGuides: [{ href: '/learn/static', label: 'Static' }],
    })
    const snapshot = JSON.stringify(inputs)
    buildToolRelationships(inputs as any)
    expect(JSON.stringify(inputs)).toBe(snapshot)
  })
})
