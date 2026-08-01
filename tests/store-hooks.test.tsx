// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { useNewsletter, useComments } from '@/lib/store'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('useNewsletter', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts idle, reads stored confirmed state', () => {
    localStorage.setItem('aquamind_newsletter', 'confirmed')
    const { result } = renderHook(() => useNewsletter())
    expect(result.current.status).toBe('subscribed')
  })

  it('treats legacy "true" as confirmed', () => {
    localStorage.setItem('aquamind_newsletter', 'true')
    const { result } = renderHook(() => useNewsletter())
    expect(result.current.status).toBe('subscribed')
  })

  it('?newsletter=confirmed in URL → subscribed and param removed', () => {
    window.history.replaceState({}, '', '/?newsletter=confirmed')
    const { result } = renderHook(() => useNewsletter())
    expect(result.current.status).toBe('subscribed')
    expect(localStorage.getItem('aquamind_newsletter')).toBe('confirmed')
    expect(window.location.search).toBe('')
  })

  it('subscribe success (pending response) → pending + localStorage', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ success: true, pending: true }),
    }))
    const { result } = renderHook(() => useNewsletter())
    await act(async () => { await result.current.subscribe('a@b.com') })
    expect(result.current.status).toBe('pending')
    expect(localStorage.getItem('aquamind_newsletter')).toBe('pending')
  })

  it('subscribe success (confirmed response) → subscribed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ success: true, confirmed: true }),
    }))
    const { result } = renderHook(() => useNewsletter())
    await act(async () => { await result.current.subscribe('a@b.com') })
    expect(result.current.status).toBe('subscribed')
  })

  it('subscribe network failure → error state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    const { result } = renderHook(() => useNewsletter())
    await act(async () => { await result.current.subscribe('a@b.com') })
    expect(result.current.status).toBe('error')
    expect(result.current.loading).toBe(false)
  })

  it('HTTP 4xx is treated as error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    const { result } = renderHook(() => useNewsletter())
    await act(async () => { await result.current.subscribe('a@b.com') })
    expect(result.current.status).toBe('error')
  })
})

describe('useComments', () => {
  it('merges local pending comments with approved server comments', async () => {
    localStorage.setItem('aquamind_comments', JSON.stringify({
      'post-x': [{ id: 'local1', postSlug: 'post-x', name: 'Me', email: '', content: 'mine', date: '2026-01-01T00:00:00Z', avatar: '', pending: true }],
    }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ comments: [{ _id: 'c1', name: 'Admin', content: 'approved', _createdAt: '2026-01-02T00:00:00Z' }] }),
    }))
    const { result } = renderHook(() => useComments('post-x'))
    await act(async () => {})
    expect(result.current.comments.length).toBe(2)
    expect(result.current.comments[0].pending).toBe(true)
    expect(result.current.comments[1].id).toBe('c1')
    expect(result.current.loading).toBe(false)
  })

  it('server failure → falls back to local comments only', async () => {
    localStorage.setItem('aquamind_comments', JSON.stringify({
      'post-x': [{ id: 'local1', postSlug: 'post-x', name: 'Me', email: '', content: 'mine', date: '2026-01-01T00:00:00Z', avatar: '' }],
    }))
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const { result } = renderHook(() => useComments('post-x'))
    await act(async () => {})
    expect(result.current.comments).toHaveLength(1)
  })

  it('addComment POSTs to the API and stores locally as pending', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, pending: true }) })
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useComments('post-x'))
    await act(async () => {
      await result.current.addComment('Alice', 'a@b.com', 'Hello', '')
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/comments', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"postSlug":"post-x"'),
    }))
    expect(result.current.submitState).toBe('pending')
    expect(result.current.comments[0]).toMatchObject({ name: 'Alice', content: 'Hello', pending: true })
  })

  it('addComment sends the honeypot value to the API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, pending: true }) })
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useComments('post-x'))
    await act(async () => {
      await result.current.addComment('Alice', '', 'Hi', 'spam-fill')
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/comments', expect.objectContaining({
      body: expect.stringContaining('"hp_comment":"spam-fill"'),
    }))
  })

  it('addComment API failure → error state but comment still kept locally', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
    const { result } = renderHook(() => useComments('post-x'))
    await act(async () => {
      await result.current.addComment('Alice', '', 'Hi', '')
    })
    expect(result.current.submitState).toBe('error')
    expect(result.current.comments).toHaveLength(1)
  })
})
