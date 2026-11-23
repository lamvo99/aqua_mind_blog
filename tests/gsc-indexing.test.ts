import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const dynamicPages = [
  'app/species/[slug]/page.tsx',
  'app/plants/[slug]/page.tsx',
  'app/corals/[slug]/page.tsx',
  'app/invertebrates/[slug]/page.tsx',
  'app/equipment/[slug]/page.tsx',
  'app/problems/[slug]/page.tsx',
  'app/posts/[slug]/page.tsx',
  'app/category/[slug]/page.tsx',
  'app/inspiration/[slug]/page.tsx',
  'app/collections/[slug]/page.tsx',
  'app/learn/[slug]/page.tsx',
  'app/styles/[slug]/page.tsx',
  'app/hubs/[slug]/page.tsx',
]

function read(file: string) {
  return fs.readFileSync(path.resolve(file), 'utf8')
}

describe('GSC indexing policy regression guards', () => {
  it('every generated dynamic route rejects unknown params with a real 404', () => {
    for (const file of dynamicPages) {
      const source = read(file)
      expect(source, `${file} must declare dynamicParams = false`).toContain('export const dynamicParams = false')
      expect(source, `${file} must call notFound()`).toContain('notFound()')
    }
  })

  it('keeps the styles landing page in the sitemap', () => {
    const source = read('app/sitemap.ts')
    expect(source).toContain('path: "/styles"')
  })

  it('filters unpublished posts from sitemap input and output', () => {
    const source = read('app/sitemap.ts')
    expect(source).toContain('_type != "post" || defined(publishedAt)')
    expect(source).toContain('doc._type === "post" && !doc.publishedAt')
  })

  it('renders a server-side H1 shell for useSearchParams routes', () => {
    expect(read('app/wiki/page.tsx')).toContain('<Suspense')
    expect(read('app/wiki/page.tsx')).toContain('<WikiHub items={items} />')
    expect(read('app/tools/aquarium-calculator/page.tsx')).toContain('<Suspense')
    expect(read('app/tools/aquarium-calculator/page.tsx')).toContain('<AquariumPlanner />')
  })

  it('keeps search and studio out of the crawlable sitemap', () => {
    const sitemapSource = read('app/sitemap.ts')
    expect(sitemapSource).not.toContain('"/search"')
    expect(sitemapSource).not.toContain('"/studio"')
    const robotsSource = read('app/robots.ts')
    expect(robotsSource).toContain('disallow: "/studio"')
    expect(robotsSource).toContain('sitemap: `${siteUrl}/sitemap.xml`')
  })

  it('keeps clean and filtered listing SEO policy covered by the existing helpers', () => {
    const listingSeo = read('lib/listing-seo.ts')
    expect(listingSeo).toContain("filtered ? { index: false, follow: true } : { index: true, follow: true }")
    expect(listingSeo).toContain('canonical: `${SITE_URL}${path}`')
  })
})
