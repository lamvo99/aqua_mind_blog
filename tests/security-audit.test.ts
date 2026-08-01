import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '..')

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next' || entry === '.git' || entry === 'tmp') continue
      out.push(...walk(full))
    } else if (/\.(tsx|ts)$/.test(entry) && !full.endsWith('.test.ts') && !full.endsWith('.test.tsx')) {
      out.push(full)
    }
  }
  return out
}

describe('static security audit', () => {
  const files = walk(ROOT)

  it('no dangerouslySetInnerHTML anywhere in source, except JsonLd (ld+json) which escapes <', () => {
    const offenders = files
      .map((f) => ({ f, src: readFileSync(f, 'utf8') }))
      .filter(({ f, src }) => src.includes('dangerouslySetInnerHTML'))
    for (const o of offenders) {
      const rel = o.f.replace(ROOT, '')
      expect(rel.endsWith(path.join('lib', 'seo', 'jsonld.tsx'))).toBe(true)
      expect(o.src).toContain('application/ld+json')
      expect(o.src).toContain('.replace(/</g, "\\\\u003c")')
    }
  })

  it('server-only Sanity client is never imported from client components', () => {
    const offenders = files
      .filter((f) => f.includes('components') || f.includes('lib\\store') || f.includes('lib/store'))
      .map((f) => ({ f, src: readFileSync(f, 'utf8') }))
      .filter(({ src }) => src.includes("'@/lib/sanity-server'") || src.includes('"@/lib/sanity-server"'))
    expect(offenders.map((o) => o.f.replace(ROOT, ''))).toEqual([])
  })

  it('every client bundle entry keeps secrets server-side (no NEXT_PUBLIC leak of keys)', () => {
    const files = walk(path.join(ROOT, 'app')).filter((f) => !f.includes(path.join('api')))
    const offenders = files
      .map((f) => ({ f, src: readFileSync(f, 'utf8') }))
      .filter(({ src }) => /process\.env\.(SANITY_API_TOKEN|RESEND_API_KEY|NEWSLETTER_SECRET|NEWSLETTER_FROM|SANITY_REVALIDATE_SECRET)/.test(src))
    expect(offenders.map((o) => o.f.replace(ROOT, ''))).toEqual([])
  })
})
