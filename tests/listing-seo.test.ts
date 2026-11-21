import { describe, it, expect } from 'vitest'
import { withListingSeo } from '@/lib/listing-seo'
import { generateMetadata } from '@/app/species/page'

const base = { title: 'Fish Species Database', description: 'Browse fish.' }

describe('listing SEO policy', () => {
  it('keeps the clean listing indexable and self-canonical', () => {
    const md = withListingSeo(base, '/species', {})
    expect(md.alternates?.canonical).toBe('https://www.aquamind.life/species')
    expect(md.robots).toEqual({ index: true, follow: true })
  })

  it('makes filtered listings noindex,follow and canonical to the clean base', () => {
    const md = withListingSeo(base, '/species', { difficulty: 'Beginner' })
    expect(md.alternates?.canonical).toBe('https://www.aquamind.life/species')
    expect(md.robots).toEqual({ index: false, follow: true })
  })

  it('treats range and category query states as filtered', () => {
    expect(withListingSeo(base, '/species', { tankSizeMinL_min: '20' }).robots).toEqual({ index: false, follow: true })
    expect(withListingSeo(base, '/problems', { category: 'fish' }).robots).toEqual({ index: false, follow: true })
  })

  it('keeps campaign-tagged clean listings indexable', () => {
    expect(withListingSeo(base, '/species', { utm_source: 'newsletter' }).robots).toEqual({ index: true, follow: true })
  })

  it('wires the policy into the species listing page', async () => {
    const clean = await generateMetadata({ searchParams: Promise.resolve({}) })
    const filtered = await generateMetadata({ searchParams: Promise.resolve({ difficulty: 'Beginner' }) })
    expect(clean.alternates?.canonical).toBe('https://www.aquamind.life/species')
    expect(clean.robots).toEqual({ index: true, follow: true })
    expect(filtered.alternates?.canonical).toBe('https://www.aquamind.life/species')
    expect(filtered.robots).toEqual({ index: false, follow: true })
  })
})
