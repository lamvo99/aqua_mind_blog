import { describe, it, expect } from 'vitest'
import {
  CATEGORY_GROUPS,
  groupForCategory,
  groupById,
  postMatchesGroup,
  postMatchesCategory,
} from '@/lib/categories'

function postWith(slugs: string[]) {
  return { _id: 'p1', title: 'T', categories: slugs.map((s) => ({ _id: s, title: s, slug: { current: s } })) }
}

describe('category groups', () => {
  it('every declared slug maps to its group (no orphans)', () => {
    for (const group of CATEGORY_GROUPS) {
      for (const slug of group.slugs) {
        expect(groupForCategory(slug)?.id).toBe(group.id)
      }
    }
  })

  it('groupById returns the right group', () => {
    expect(groupById('aquascaping')?.label).toBe('Aquascaping & DIY')
    expect(groupById('nope')).toBeUndefined()
  })

  it('unknown slug → undefined', () => {
    expect(groupForCategory('not-a-real-category')).toBeUndefined()
  })

  it('postMatchesGroup true when any category is in the group', () => {
    const post = postWith(['freshwater-fish', 'beginner-guides'])
    expect(postMatchesGroup(post, 'freshwater')).toBe(true)
    expect(postMatchesGroup(post, 'aquascaping')).toBe(false)
  })

  it('postMatchesCategory matches exact slug only', () => {
    const post = postWith(['freshwater-fish'])
    expect(postMatchesCategory(post, 'freshwater-fish')).toBe(true)
    expect(postMatchesCategory(post, 'freshwater')).toBe(false)
  })

  it('posts without categories never match', () => {
    const post = { _id: 'p', title: 'T' }
    expect(postMatchesGroup(post, 'freshwater')).toBe(false)
    expect(postMatchesCategory(post, 'freshwater-fish')).toBe(false)
  })
})
