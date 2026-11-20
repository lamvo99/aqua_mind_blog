// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import Breadcrumb from '@/app/components/Breadcrumb'

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

describe('Breadcrumb', () => {
  it('gives the home icon link the accessible name Home', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Database', href: '/database' },
          { label: 'Angelfish' },
        ]}
      />
    )

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    const home = screen.getByRole('link', { name: 'Home' })

    expect(nav).toBeTruthy()
    expect(home.getAttribute('href')).toBe('/')
    expect(screen.getByRole('link', { name: 'Database' }).getAttribute('href')).toBe('/database')
    expect(screen.getByText('Angelfish')).toBeTruthy()
  })
})
