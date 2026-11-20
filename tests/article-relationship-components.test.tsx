// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import RelatedReading from '@/app/components/article/RelatedReading'
import RelatedDatabaseGroups from '@/app/components/article/RelatedDatabaseGroups'
import ArticleNextSteps from '@/app/components/article/ArticleNextSteps'

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

const article = {
  href: '/posts/related-one',
  slug: 'related-one',
  title: 'Related One',
  excerpt: 'A related article',
  publishedAt: '2026-01-01T00:00:00Z',
}

const path = { href: '/learn/beginner-path', slug: 'beginner-path', label: 'Beginner Path' }

const entity = {
  kind: 'entity' as const,
  type: 'species' as const,
  href: '/species/neon-tetra',
  label: 'Neon Tetra',
  excerpt: 'A schooling fish',
}

const problem = {
  kind: 'problem' as const,
  type: 'problem' as const,
  href: '/problems/high-ammonia',
  label: 'High ammonia',
}

const tool = { href: '/tools/water-change', label: 'Water Change Calculator' }
const hub = { href: '/hubs/water-parameters', label: 'Water parameters', description: 'Water chemistry' }

describe('RelatedReading', () => {
  it('renders article links and learning-path membership', () => {
    render(<RelatedReading articles={[article]} paths={[path]} />)
    expect(screen.getByRole('heading', { name: /related reading/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Related One/ }).getAttribute('href')).toBe('/posts/related-one')
    expect(screen.getByText(/part of this learning path/i)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Beginner Path' }).getAttribute('href')).toBe('/learn/beginner-path')
  })

  it('renders nothing when empty', () => {
    const { container } = render(<RelatedReading articles={[]} paths={[]} />)
    expect(container.firstChild).toBeNull()
  })
})

describe('RelatedDatabaseGroups', () => {
  it('renders separate Related entities and Troubleshoot groups', () => {
    render(<RelatedDatabaseGroups entities={[entity]} problems={[problem]} />)
    expect(screen.getByRole('heading', { name: /explore the database/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /related entities/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /troubleshoot/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Neon Tetra/ }).getAttribute('href')).toBe('/species/neon-tetra')
    expect(screen.getByRole('link', { name: 'High ammonia' }).getAttribute('href')).toBe('/problems/high-ammonia')
  })

  it('omits the Troubleshoot group when there are no problems', () => {
    render(<RelatedDatabaseGroups entities={[entity]} problems={[]} />)
    expect(screen.queryByRole('heading', { name: /troubleshoot/i })).toBeNull()
  })

  it('omits the entities group when there are no entities', () => {
    render(<RelatedDatabaseGroups entities={[]} problems={[problem]} />)
    expect(screen.queryByRole('heading', { name: /related entities/i })).toBeNull()
    expect(screen.getByRole('heading', { name: /troubleshoot/i })).toBeTruthy()
  })

  it('renders nothing when both groups are empty', () => {
    const { container } = render(<RelatedDatabaseGroups entities={[]} problems={[]} />)
    expect(container.firstChild).toBeNull()
  })
})

describe('ArticleNextSteps', () => {
  it('renders tools and knowledge hubs with hrefs', () => {
    render(<ArticleNextSteps tools={[tool]} hubs={[hub]} />)
    expect(screen.getByRole('heading', { name: /next steps/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /^tools$/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /knowledge hubs/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Water Change Calculator/ }).getAttribute('href')).toBe('/tools/water-change')
    expect(screen.getByRole('link', { name: /Water parameters/ }).getAttribute('href')).toBe('/hubs/water-parameters')
    expect(screen.getByText('Water chemistry')).toBeTruthy()
  })

  it('omits the hubs group when there are no hubs', () => {
    render(<ArticleNextSteps tools={[tool]} hubs={[]} />)
    expect(screen.queryByRole('heading', { name: /knowledge hubs/i })).toBeNull()
  })

  it('renders nothing when both groups are empty', () => {
    const { container } = render(<ArticleNextSteps tools={[]} hubs={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
