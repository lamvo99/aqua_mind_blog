import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import { isSanityImageUrl, sanityImageLoader, getSanityWidths, buildSanitySrcSet } from '@/lib/image-loader'

const SANITY_SRC =
  'https://cdn.sanity.io/images/abc123/production/deadbeef-1920x1080.jpg?rect=0,0,1920,1080&w=800&h=450&q=80'

describe('isSanityImageUrl', () => {
  it('accepts https Sanity CDN URLs', () => {
    expect(isSanityImageUrl(SANITY_SRC)).toBe(true)
    expect(isSanityImageUrl('https://cdn.sanity.io/images/abc/production/x-100x100.png')).toBe(true)
  })

  it('rejects local paths, other hosts and lookalike hosts', () => {
    expect(isSanityImageUrl('/logo-3d.png')).toBe(false)
    expect(isSanityImageUrl('https://example.com/image.jpg')).toBe(false)
    expect(isSanityImageUrl('https://cdn.sanity.io.evil.example/image.jpg')).toBe(false)
    expect(isSanityImageUrl('http://cdn.sanity.io/images/abc/production/x.jpg')).toBe(false)
    expect(isSanityImageUrl('')).toBe(false)
  })
})

describe('sanityImageLoader', () => {
  it('rewrites Sanity URLs to the CDN and never emits /_next/image', () => {
    const out = sanityImageLoader({ src: SANITY_SRC, width: 640, quality: 70 })
    const url = new URL(out)

    expect(url.origin).toBe('https://cdn.sanity.io')
    expect(url.pathname).toBe('/images/abc123/production/deadbeef-1920x1080.jpg')
    expect(url.searchParams.get('w')).toBe('640')
    expect(url.searchParams.get('q')).toBe('70')
    expect(url.searchParams.get('auto')).toBe('format')
    expect(url.searchParams.get('rect')).toBe('0,0,1920,1080')
    expect(url.searchParams.has('h')).toBe(false)
    expect(url.searchParams.has('fit')).toBe(false)
    expect(out).not.toContain('/_next/image')
  })

  it('defaults quality to 75 when Next.js omits it', () => {
    const out = sanityImageLoader({ src: SANITY_SRC, width: 1280 })
    expect(new URL(out).searchParams.get('q')).toBe('75')
  })

  it('preserves format and other Sanity transformation params', () => {
    const src = 'https://cdn.sanity.io/images/abc/production/x-800x600.jpg?fm=webp&crop=center&fp=0.5,0.5&w=800&h=600'
    const out = sanityImageLoader({ src, width: 320, quality: 60 })
    const url = new URL(out)

    expect(url.searchParams.get('fm')).toBe('webp')
    expect(url.searchParams.get('crop')).toBe('center')
    expect(url.searchParams.get('fp')).toBe('0.5,0.5')
    expect(url.searchParams.get('w')).toBe('320')
    expect(url.searchParams.get('q')).toBe('60')
    expect(url.searchParams.has('h')).toBe(false)
  })

  it('rounds fractional widths and never emits zero/negative widths', () => {
    expect(new URL(sanityImageLoader({ src: SANITY_SRC, width: 640.4 })).searchParams.get('w')).toBe('640')
    expect(new URL(sanityImageLoader({ src: SANITY_SRC, width: 0 })).searchParams.get('w')).toBe('1')
  })

  it('caps widths at the intrinsic asset width so Sanity never upscales', () => {
    const cropped = 'https://cdn.sanity.io/images/abc/production/hero-1536x1024.png?rect=0,128,1536,768'
    expect(new URL(sanityImageLoader({ src: cropped, width: 3840 })).searchParams.get('w')).toBe('1536')

    const plain = 'https://cdn.sanity.io/images/abc/production/thumb-800x600.jpg'
    expect(new URL(sanityImageLoader({ src: plain, width: 1200 })).searchParams.get('w')).toBe('800')
  })

  it('uses the rect crop width as the cap when a crop is present', () => {
    const src = 'https://cdn.sanity.io/images/abc/production/hero-4000x3000.jpg?rect=100,100,900,600'
    expect(new URL(sanityImageLoader({ src, width: 3840 })).searchParams.get('w')).toBe('900')
  })

  it('keeps the requested width when it is below the source width', () => {
    const src = 'https://cdn.sanity.io/images/abc/production/hero-1536x1024.png'
    expect(new URL(sanityImageLoader({ src, width: 640 })).searchParams.get('w')).toBe('640')
  })

  it('returns non-Sanity sources unchanged', () => {
    expect(sanityImageLoader({ src: '/logo-3d.png', width: 128, quality: 75 })).toBe('/logo-3d.png')
    expect(sanityImageLoader({ src: 'https://example.com/a.jpg', width: 128 })).toBe('https://example.com/a.jpg')
  })
})

describe('Sanity srcSet descriptors', () => {
  const parse = (srcSet: string) =>
    srcSet.split(', ').map((entry) => {
      const [url, descriptor] = entry.split(' ')
      return {
        descriptor,
        width: Number(descriptor.replace('w', '')),
        urlWidth: Number(new URL(url).searchParams.get('w')),
      }
    })

  it('never advertises a descriptor wider than the source and matches the returned width', () => {
    const src = 'https://cdn.sanity.io/images/abc/production/hero-1536x1024.png?rect=0,128,1536,768'
    const widths = getSanityWidths(src, { fill: true })
    const entries = parse(buildSanitySrcSet(src, widths))

    expect(Math.max(...widths)).toBe(1536)
    expect(entries.length).toBeGreaterThan(1)
    expect(entries[entries.length - 1].descriptor).toBe('1536w')
    for (const entry of entries) {
      expect(entry.width).toBeLessThanOrEqual(1536)
      expect(entry.urlWidth).toBe(entry.width)
    }
  })

  it('handles small listing assets without inventing large descriptors', () => {
    const src = 'https://cdn.sanity.io/images/abc/production/card-470x313.jpg?rect=0,0,470,313'
    const widths = getSanityWidths(src, { fill: true })
    expect(Math.max(...widths)).toBe(470)
    expect(widths.every((width) => width <= 470)).toBe(true)

    for (const entry of parse(buildSanitySrcSet(src, widths))) {
      expect(entry.urlWidth).toBe(entry.width)
    }
  })

  it('uses 1x/2x/3x widths for fixed images and stops at the source width', () => {
    const catalogue = 'https://cdn.sanity.io/images/abc/production/avatar-1024x1024.png'
    expect(getSanityWidths(catalogue, { width: 20 })).toEqual([20, 40, 60])

    const small = 'https://cdn.sanity.io/images/abc/production/thumb-48x48.png'
    expect(getSanityWidths(small, { width: 24 })).toEqual([24, 48])
  })

  it('falls back to the source width when a fixed image is larger than the asset', () => {
    const src = 'https://cdn.sanity.io/images/abc/production/banner-800x600.jpg'
    expect(getSanityWidths(src, { width: 1200 })).toEqual([800])
  })

  it('keeps descriptors unique and sorted', () => {
    const src = 'https://cdn.sanity.io/images/abc/production/hero-1920x1080.png'
    const widths = getSanityWidths(src, { sizes: '100vw' })
    expect(widths).toEqual([...new Set(widths)].sort((a, b) => a - b))
    expect(widths).toContain(1920)
  })
})

describe('Sanity-backed next/image usages', () => {
  it('use the SanityImage wrapper, so no Sanity asset is proxied through /_next/image', () => {
    const files = [
      'app/components/PostCard.tsx',
      'app/components/PortableText.tsx',
      'app/components/database/DatabaseCard.tsx',
      'app/components/database/DatabaseGrid.tsx',
      'app/components/database/InspirationGrid.tsx',
      'app/components/database/RelationshipSection.tsx',
      'app/components/wiki/WikiHub.tsx',
      'app/posts/[slug]/page.tsx',
      'app/corals/[slug]/page.tsx',
      'app/equipment/[slug]/page.tsx',
      'app/inspiration/[slug]/page.tsx',
      'app/invertebrates/[slug]/page.tsx',
      'app/learn/[slug]/page.tsx',
      'app/plants/[slug]/page.tsx',
      'app/species/[slug]/page.tsx',
      'app/styles/[slug]/page.tsx',
    ]

    const offenders: string[] = []

    for (const file of files) {
      const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8')
      const tags = source.match(/<Image\b[\s\S]*?\/>/g) || []

      for (const tag of tags) {
        const isSanitySource = tag.includes('urlFor(') || /\bsrc=\{(imageUrl|imgUrl)\}/.test(tag)
        if (isSanitySource && !tag.startsWith('<SanityImage')) {
          offenders.push(`${file}: not using SanityImage — ${tag.replace(/\s+/g, ' ').slice(0, 120)}`)
        }
        if (isSanitySource && !/\balt=/.test(tag)) {
          offenders.push(`${file}: missing alt — ${tag.replace(/\s+/g, ' ').slice(0, 120)}`)
        }
      }
    }

    expect(offenders).toEqual([])
  })
})
