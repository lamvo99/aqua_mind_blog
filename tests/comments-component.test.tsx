// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import Comments from '@/app/components/Comments'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

function okFetch(json: unknown) {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => json })
}

describe('Comments component', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', okFetch({ comments: [] }))
  })

  it('renders heading with comment count and empty state', async () => {
    render(<Comments postSlug="post-x" />)
    expect(screen.getByText('Comments (0)')).toBeTruthy()
    await waitFor(() => expect(screen.getByText('No comments yet. Be the first!')).toBeTruthy())
  })

  it('shows server-approved comments and hides loading emptiness', async () => {
    vi.stubGlobal('fetch', okFetch({
      comments: [{ _id: 'c1', name: 'Alice', content: 'Great read!', _createdAt: '2026-01-01T00:00:00Z' }],
    }))
    render(<Comments postSlug="post-x" />)
    await waitFor(() => expect(screen.getByText('Great read!')).toBeTruthy())
    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.queryByText('No comments yet. Be the first!')).toBeNull()
  })

  it('submits the form and shows pending moderation notice', async () => {
    render(<Comments postSlug="post-x" />)
    fireEvent.change(screen.getByPlaceholderText('Your name *'), { target: { value: 'Alice' } })
    fireEvent.change(screen.getByPlaceholderText('Write a comment...'), { target: { value: 'Hello world' } })
    fireEvent.click(screen.getByRole('button', { name: 'Post Comment' }))

    await waitFor(() => {
      expect(screen.getByText('Your comment is awaiting moderation. It will appear here once approved.')).toBeTruthy()
    })
    expect(screen.getByText('Pending approval')).toBeTruthy()
    // fields reset
    expect((screen.getByPlaceholderText('Your name *') as HTMLInputElement).value).toBe('')
  })

  it('renders XSS payload as plain text (no script execution)', async () => {
    vi.stubGlobal('fetch', okFetch({
      comments: [{
        _id: 'c1', name: '<b>Bob</b>', content: '<img src=x onerror="window.__pwned=1"><script>window.__pwned=2</script>', _createdAt: '2026-01-01T00:00:00Z',
      }],
    }))
    render(<Comments postSlug="post-x" />)
    await waitFor(() => expect(screen.getByText(/window\.__pwned/)).toBeTruthy())
    expect(document.querySelector('script')).toBeNull()
    expect(document.querySelector('img[src="x"]')).toBeNull()
    // name is escaped too — literal text, not bold HTML
    expect(document.querySelector('b')).toBeNull()
  })

  it('disables submit while submitting and shows error on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    render(<Comments postSlug="post-x" />)
    fireEvent.change(screen.getByPlaceholderText('Your name *'), { target: { value: 'Alice' } })
    fireEvent.change(screen.getByPlaceholderText('Write a comment...'), { target: { value: 'Hello' } })
    fireEvent.click(screen.getByRole('button', { name: 'Post Comment' }))
    await waitFor(() => {
      expect(screen.getByText('Could not submit your comment. Please try again.')).toBeTruthy()
    })
  })
})
