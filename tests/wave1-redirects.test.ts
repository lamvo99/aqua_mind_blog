import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import {
  WAVE1_REDIRECT_GROUPS,
  filterWave1RedirectDatabaseItems,
  filterWave1RedirectSources,
  getEnabledWave1Redirects,
  isWave1GroupActivatable,
  isWave1RedirectSourcePath,
  type Wave1RedirectGroup,
} from '@/lib/wave1-redirects'

const APPROVED_GROUPS = ['W1-09', 'W1-10']

const require = createRequire(import.meta.url)
const nextConfig = require('../next.config.js')

async function redirects() {
  return await nextConfig.redirects()
}

function activated(group: Wave1RedirectGroup): Wave1RedirectGroup {
  return {
    ...group,
    status: 'READY_FOR_ACTIVATION',
    contentMigrated: true,
    factualApproved: true,
    editorialApproved: true,
  }
}

describe('Wave 1 redirect gate', () => {
  it('contains the 11 Wave 1 groups and 22 unique paths', () => {
    expect(WAVE1_REDIRECT_GROUPS).toHaveLength(11)
    const paths = WAVE1_REDIRECT_GROUPS.flatMap((group) => [group.primary, group.secondary])
    expect(new Set(paths).size).toBe(22)
    for (const group of WAVE1_REDIRECT_GROUPS) {
      expect(group.primary).not.toBe(group.secondary)
      for (const path of [group.primary, group.secondary]) {
        expect(path.startsWith('/')).toBe(true)
        expect(path).not.toMatch(/[?#]/)
        expect(path).not.toMatch(/\/$/)
      }
    }
  })

  it('activates only the two groups with completed content migration', () => {
    expect(getEnabledWave1Redirects()).toEqual([
      {
        source: '/equipment/aquasoil-substrate',
        destination: '/equipment/aquarium-soil-substrate',
        statusCode: 301,
      },
      {
        source: '/invertebrates/neocaridina-davidi-cherry',
        destination: '/invertebrates/neocaridina-davidi',
        statusCode: 301,
      },
    ])
    for (const group of WAVE1_REDIRECT_GROUPS) {
      expect(isWave1GroupActivatable(group)).toBe(APPROVED_GROUPS.includes(group.group))
    }
  })

  it('adds only the two approved Wave 1 sources to next.config redirects', async () => {
    const list = await redirects()
    const sources = new Set(list.map((item: any) => item.source))
    expect(sources.has('/equipment/aquasoil-substrate')).toBe(true)
    expect(sources.has('/invertebrates/neocaridina-davidi-cherry')).toBe(true)
    for (const group of WAVE1_REDIRECT_GROUPS) {
      if (!APPROVED_GROUPS.includes(group.group)) {
        expect(sources.has(group.secondary)).toBe(false)
      }
    }
  })

  it('preserves the existing redirects', async () => {
    const list = await redirects()
    expect(list).toContainEqual({ source: '/tools/setup-planner', destination: '/setup-planner', permanent: true })
    expect(list).toContainEqual({ source: '/plants/java-moss', destination: '/plants/taxiphyllum-barbieri', permanent: true })
    expect(list).toContainEqual({ source: '/corals/acan-lords', destination: '/corals/acan-lord', permanent: true })
  })

  it('requires status plus all three approval flags to activate', () => {
    const base = WAVE1_REDIRECT_GROUPS[0]
    expect(isWave1GroupActivatable(activated(base))).toBe(true)
    expect(isWave1GroupActivatable({ ...activated(base), contentMigrated: false })).toBe(false)
    expect(isWave1GroupActivatable({ ...activated(base), factualApproved: false })).toBe(false)
    expect(isWave1GroupActivatable({ ...activated(base), editorialApproved: false })).toBe(false)
    expect(isWave1GroupActivatable({ ...activated(base), status: 'BLOCKED_BY_SPECIALIST' })).toBe(false)
  })

  it('excludes only enabled redirect sources from sitemap entries', () => {
    const base = WAVE1_REDIRECT_GROUPS[0]
    const active = activated(base)
    const entries = [
      { url: `https://www.aquamind.life${base.primary}` },
      { url: `https://www.aquamind.life${base.secondary}` },
      { url: 'https://www.aquamind.life/species' },
    ]

    expect(isWave1RedirectSourcePath(base.secondary, [active])).toBe(true)
    expect(isWave1RedirectSourcePath(base.primary, [active])).toBe(false)
    expect(filterWave1RedirectSources(entries, [active]).map((entry) => entry.url)).toEqual([
      `https://www.aquamind.life${base.primary}`,
      'https://www.aquamind.life/species',
    ])
  })

  it('is a no-op when no redirect group is active', () => {
    const entries = [{ url: 'https://www.aquamind.life/species/poecilia-sphenops' }]
    expect(filterWave1RedirectSources(entries, [])).toEqual(entries)
  })

  it('filters both active secondary sources from sitemap entries', () => {
    const entries = WAVE1_REDIRECT_GROUPS.flatMap((group) => [
      { url: `https://www.aquamind.life${group.primary}` },
      { url: `https://www.aquamind.life${group.secondary}` },
    ])
    const urls = filterWave1RedirectSources(entries).map((entry) => entry.url)
    for (const group of WAVE1_REDIRECT_GROUPS) {
      expect(urls).toContain(`https://www.aquamind.life${group.primary}`)
      if (APPROVED_GROUPS.includes(group.group)) {
        expect(urls).not.toContain(`https://www.aquamind.life${group.secondary}`)
      } else {
        expect(urls).toContain(`https://www.aquamind.life${group.secondary}`)
      }
    }
  })

  it('filters only active redirect sources from database lists and collections', () => {
    const items = [
      { slug: { current: 'aquasoil-substrate' }, name: 'secondary soil' },
      { slug: { current: 'aquarium-soil-substrate' }, name: 'primary soil' },
      { slug: { current: 'neocaridina-davidi-cherry' }, name: 'secondary shrimp' },
      { slug: { current: 'neocaridina-davidi' }, name: 'primary shrimp' },
      { slug: { current: 'other' }, name: 'other' },
    ]

    expect(filterWave1RedirectDatabaseItems('equipment', items).map((item) => item.slug.current)).toEqual([
      'aquarium-soil-substrate',
      'neocaridina-davidi-cherry',
      'neocaridina-davidi',
      'other',
    ])
    expect(filterWave1RedirectDatabaseItems('invertebrate', items).map((item) => item.slug.current)).toEqual([
      'aquasoil-substrate',
      'aquarium-soil-substrate',
      'neocaridina-davidi',
      'other',
    ])
    expect(filterWave1RedirectDatabaseItems('species', items)).toHaveLength(items.length)
  })

  it('does not filter held groups from database lists', () => {
    const items = [
      { slug: { current: 'ich-white-spot-disease' } },
      { slug: { current: 'white-spot-disease' } },
    ]
    expect(filterWave1RedirectDatabaseItems('problem', items)).toHaveLength(items.length)
  })

  it('puts the canonical record in the secondary slot for capped collection lists', () => {
    const items = [
      { slug: { current: 'neocaridina-davidi-cherry' }, name: 'secondary' },
      { slug: { current: 'other' }, name: 'other' },
      { slug: { current: 'neocaridina-davidi' }, name: 'primary' },
    ]
    expect(filterWave1RedirectDatabaseItems('invertebrate', items).map((item) => item.slug.current)).toEqual([
      'neocaridina-davidi',
      'other',
    ])
  })
})
