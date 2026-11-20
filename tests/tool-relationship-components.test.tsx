// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import ToolRelationshipGroups from '@/app/components/tools/ToolRelationshipGroups'

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

const problem = { kind: 'problem' as const, type: 'problem' as const, href: '/problems/cyanobacteria', label: 'Cyanobacteria' }
const guide = { href: '/posts/water-change-guide', label: 'Water change guide', kind: 'article' as const }

describe('ToolRelationshipGroups', () => {
  it('renders both groups with descriptive headings and links', () => {
    render(<ToolRelationshipGroups problems={[problem]} guides={[guide]} />)
    expect(screen.getByRole('heading', { name: /troubleshoot related problems/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /related guides/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /Cyanobacteria/ }).getAttribute('href')).toBe('/problems/cyanobacteria')
    expect(screen.getByRole('link', { name: /Water change guide/ }).getAttribute('href')).toBe('/posts/water-change-guide')
  })

  it('renders only the problems group when there are no guides', () => {
    render(<ToolRelationshipGroups problems={[problem]} guides={[]} />)
    expect(screen.getByRole('heading', { name: /troubleshoot related problems/i })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /related guides/i })).toBeNull()
  })

  it('renders only the guides group when there are no problems', () => {
    render(<ToolRelationshipGroups problems={[]} guides={[guide]} />)
    expect(screen.queryByRole('heading', { name: /troubleshoot related problems/i })).toBeNull()
    expect(screen.getByRole('heading', { name: /related guides/i })).toBeTruthy()
  })

  it('labels static fallback destinations as related resources', () => {
    render(
      <ToolRelationshipGroups
        problems={[]}
        guides={[{ href: '/species', label: 'Species database', kind: 'resource' }]}
      />
    )
    expect(screen.getByRole('heading', { name: /related resources/i })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /related guides/i })).toBeNull()
  })

  it('renders nothing when both groups are empty', () => {
    const { container } = render(<ToolRelationshipGroups problems={[]} guides={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
