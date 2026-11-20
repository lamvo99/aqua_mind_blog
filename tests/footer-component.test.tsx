// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import Footer from '@/app/components/footer'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={typeof href === 'string' ? href : '#'} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next/image', () => ({
  default: (props: any) => <img alt={props.alt || ''} {...props} />,
}))

vi.mock('@/lib/store', () => ({
  useNewsletter: () => ({ status: null, loading: false, subscribe: vi.fn() }),
}))

afterEach(() => {
  cleanup()
})

describe('Footer accessibility', () => {
  it('names the newsletter submit button and uses heading level 3 for footer sections', () => {
    render(<Footer />)
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Learn', level: 3 })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Explore', level: 3 })).toBeTruthy()
  })
})
