// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import CategoryGrid from '@/app/components/category/CategoryGrid'
import CategoryChips from '@/app/components/category/CategoryChips'

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

const link = {
  key: 'cat-1',
  href: '/category/beginner-guides',
  title: 'Beginner Guides',
  slug: 'beginner-guides',
  description: 'Start here',
  count: 14,
}

describe('CategoryGrid', () => {
  it('renders canonical category links only', () => {
    render(<CategoryGrid links={[link]} />)
    const anchor = screen.getByRole('link', { name: /Beginner Guides/ })
    expect(anchor.getAttribute('href')).toBe('/category/beginner-guides')
    expect(document.querySelector('a[href*="?category="]')).toBeNull()
  })

  it('renders nothing when there are no links', () => {
    const { container } = render(<CategoryGrid links={[]} />)
    expect(container.firstChild).toBeNull()
  })
})

describe('CategoryChips', () => {
  it('links valid categories to their canonical route', () => {
    render(<CategoryChips categories={[{ _id: 'c1', title: 'Beginner Guides', slug: { current: 'beginner-guides' } }]} />)
    const anchor = screen.getByRole('link', { name: 'Beginner Guides' })
    expect(anchor.getAttribute('href')).toBe('/category/beginner-guides')
    expect(document.querySelector('a[href*="?category="]')).toBeNull()
  })

  it('renders a non-link label for invalid or missing slugs', () => {
    render(<CategoryChips categories={[{ _id: 'c2', title: 'Odd Category', slug: { current: 'Bad Slug' } }]} />)
    expect(screen.queryByRole('link', { name: 'Odd Category' })).toBeNull()
    expect(screen.getByText('Odd Category')).toBeTruthy()
  })

  it('renders nothing for entries without a title', () => {
    const { container } = render(<CategoryChips categories={[{ slug: { current: 'no-title' } }]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when there are no categories', () => {
    const { container } = render(<CategoryChips categories={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
