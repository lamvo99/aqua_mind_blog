// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import StylesIndexPage, { metadata } from '@/app/styles/page'
import { STYLE_SLUGS } from '@/lib/styles'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={typeof href === 'string' ? href : '#'} {...props}>
      {children}
    </a>
  ),
}))

afterEach(() => {
  cleanup()
})

describe('/styles index', () => {
  it('renders one H1 and links to all eight style guides exactly once', () => {
    const { container } = render(<StylesIndexPage />)
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: /aquascaping styles/i })).toBeTruthy()

    const styleLinks = [...container.querySelectorAll('a[href^="/styles/"]')]
    const hrefs = styleLinks.map((link) => link.getAttribute('href'))
    expect(hrefs).toHaveLength(8)
    expect(new Set(hrefs).size).toBe(8)
    expect(hrefs.sort()).toEqual(STYLE_SLUGS.map((slug) => `/styles/${slug}`).sort())
    for (const link of styleLinks) {
      expect((link.textContent || '').trim().length).toBeGreaterThan(0)
    }
  })

  it('uses a self-canonical and the expected metadata shape', () => {
    expect(metadata.title).toBe('Aquascaping Styles')
    expect(metadata.alternates?.canonical).toBe('https://www.aquamind.life/styles')
  })
})
