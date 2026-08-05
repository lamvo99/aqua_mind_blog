import { describe, it, expect } from 'vitest'
import { resourcesForCategory, TOOL_LEARN_LINKS } from '@/lib/related'

describe('resourcesForCategory', () => {
  it('matches fish categories to species database and stocking tool', () => {
    const res = resourcesForCategory('guppy-care', 'Guppy Care')
    expect(res.some((r) => r.href === '/species' && r.section === 'database')).toBe(true)
    expect(res.some((r) => r.href === '/tools/stocking' && r.section === 'tool')).toBe(true)
  })

  it('matches beginner categories to setup planner and learn', () => {
    const res = resourcesForCategory('beginner-guides', 'Beginner Guides')
    expect(res.some((r) => r.href === '/setup-planner')).toBe(true)
    expect(res.some((r) => r.href === '/learn')).toBe(true)
  })

  it('falls back to defaults for unmatched categories while keeping fallbacks stacked', () => {
    const res = resourcesForCategory('latest-news', 'Latest News')
    expect(res.some((r) => r.href === '/posts')).toBe(true)
    expect(res.some((r) => r.href === '/tools')).toBe(true)
  })

  it('never returns duplicate hrefs', () => {
    const res = resourcesForCategory('planted-tank-basics', 'Planted Tank Basics')
    const hrefs = res.map((r) => r.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })

  it('caps the list at 4 entries', () => {
    for (const [slug, title] of [
      ['planted', 'Planted'],
      ['reef', 'Reef'],
      ['water-chemistry', 'Water Chemistry'],
    ]) {
      expect(resourcesForCategory(slug, title).length).toBeLessThanOrEqual(4)
    }
  })
})

describe('TOOL_LEARN_LINKS', () => {
  it('provides educational links for every tool route', () => {
    const routes = [
      '/tools/aquarium-calculator',
      '/tools/aquarium-volume',
      '/tools/stocking',
      '/tools/water-change',
      '/tools/co2',
      '/tools/lighting',
      '/tools/pump-flow',
      '/tools/salt-mixing',
      '/tools/dosing',
      '/tools/compatibility-checker',
      '/tools/diagnostic',
    ]
    for (const route of routes) {
      expect(TOOL_LEARN_LINKS[route], route).toBeDefined()
      expect(TOOL_LEARN_LINKS[route].length).toBeGreaterThan(0)
    }
  })

  it('only links to real internal routes', () => {
    const validPrefixes = ['/species', '/plants', '/corals', '/equipment', '/learn', '/posts', '/problems']
    for (const links of Object.values(TOOL_LEARN_LINKS)) {
      for (const link of links) {
        const ok = validPrefixes.some((p) => link.href === p || link.href.startsWith(p))
        expect(ok, `${link.href} is not an approved educational route`).toBe(true)
      }
    }
  })
})