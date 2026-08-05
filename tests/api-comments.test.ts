import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  sanityFetch: vi.fn(),
  sanityCreate: vi.fn(),
}))

vi.mock('@/lib/sanity-server', () => ({
  sanityClient: { fetch: mocks.sanityFetch, create: mocks.sanityCreate },
}))

import { GET, POST } from '@/app/api/comments/route'

function jsonReq(method: 'GET' | 'POST', url: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

describe('GET /api/comments', () => {
  beforeEach(() => {
    mocks.sanityFetch.mockReset()
    mocks.sanityCreate.mockReset()
  })

  it('400 without post slug', async () => {
    const res = await GET(jsonReq('GET', 'http://localhost/api/comments'))
    expect(res.status).toBe(400)
  })

  it('returns only approved comments for the post (raw Sanity contract)', async () => {
    mocks.sanityFetch.mockResolvedValue([
      { _id: 'c1', name: 'Alice', content: 'Nice!', _createdAt: '2026-01-01T00:00:00Z' },
      { _id: 'c2', name: 'Bob', content: 'Thanks', _createdAt: '2026-01-02T00:00:00Z' },
    ])
    const res = await GET(jsonReq('GET', 'http://localhost/api/comments?post=my-post'))
    expect(res.status).toBe(200)
    const { comments } = await res.json()
    expect(comments).toEqual([
      { _id: 'c1', name: 'Alice', content: 'Nice!', _createdAt: '2026-01-01T00:00:00Z' },
      { _id: 'c2', name: 'Bob', content: 'Thanks', _createdAt: '2026-01-02T00:00:00Z' },
    ])
    expect(mocks.sanityFetch).toHaveBeenCalledWith(
      expect.stringContaining('approved == true'),
      { slug: 'my-post' }
    )
  })

  it('null Sanity result → empty comments (no 500)', async () => {
    mocks.sanityFetch.mockResolvedValue(null)
    const res = await GET(jsonReq('GET', 'http://localhost/api/comments?post=x'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ comments: [] })
  })

  it('empty result → empty comments array', async () => {
    mocks.sanityFetch.mockResolvedValue([])
    const res = await GET(jsonReq('GET', 'http://localhost/api/comments?post=x'))
    expect(await res.json()).toEqual({ comments: [] })
  })
})

describe('POST /api/comments', () => {
  beforeEach(() => {
    mocks.sanityFetch.mockReset()
    mocks.sanityCreate.mockReset()
  })

  it('400 on malformed JSON', async () => {
    const req = new NextRequest('http://localhost/api/comments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{broken',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('honeypot filled → fake 200 success, never creates or queries', async () => {
    const res = await POST(jsonReq('POST', 'http://localhost/api/comments', {
      postSlug: 'x', name: 'Bot', content: 'spam', hp_comment: 'filled by bot',
    }))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ success: true, pending: true })
    expect(mocks.sanityCreate).not.toHaveBeenCalled()
    expect(mocks.sanityFetch).not.toHaveBeenCalled()
  })

  type CommentPayload = { name: string; content: string; postSlug?: string }
  const invalidPayloads: [CommentPayload, string][] = [
    [{ name: 'A', content: 'ok', postSlug: 'x' }, 'name'],
    [{ name: 'A'.repeat(81), content: 'ok', postSlug: 'x' }, 'name'],
    [{ name: 'Valid', content: 'x', postSlug: 'x' }, 'content'],
    [{ name: 'Valid', content: 'x'.repeat(2001), postSlug: 'x' }, 'content'],
    [{ name: 'Valid', content: 'ok' }, 'postSlug'],
  ]
  it.each(invalidPayloads)('400 for invalid payload %j', async (body) => {
    const res = await POST(jsonReq('POST', 'http://localhost/api/comments', body))
    expect(res.status).toBe(400)
  })

  it('400 for non-string email', async () => {
    const res = await POST(jsonReq('POST', 'http://localhost/api/comments', {
      postSlug: 'x', name: 'Valid', content: 'ok', email: 42,
    }))
    expect(res.status).toBe(400)
  })

  it('404 when the post slug does not exist', async () => {
    mocks.sanityFetch.mockResolvedValue([])
    const res = await POST(jsonReq('POST', 'http://localhost/api/comments', {
      postSlug: 'nope', name: 'Valid', content: 'ok',
    }))
    expect(res.status).toBe(404)
  })

  it('creates comment with approved:false and trims input', async () => {
    mocks.sanityFetch.mockResolvedValue([{ _id: 'post1' }])
    const res = await POST(jsonReq('POST', 'http://localhost/api/comments', {
      postSlug: 'my-post', name: '  Alice  ', email: 'a@b.com', content: '  Great article  ',
    }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, pending: true })
    expect(mocks.sanityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        _type: 'comment',
        name: 'Alice',
        content: 'Great article',
        approved: false,
        post: { _ref: 'post1', _type: 'reference' },
      })
    )
  })

  it('XSS payload is stored as plain text (never executed server-side)', async () => {
    mocks.sanityFetch.mockResolvedValue([{ _id: 'post1' }])
    const xss = '<script>alert(1)</script><img src=x onerror=alert(2)>'
    const res = await POST(jsonReq('POST', 'http://localhost/api/comments', {
      postSlug: 'my-post', name: 'Hacker', content: xss,
    }))
    expect(res.status).toBe(200)
    const created = mocks.sanityCreate.mock.calls[0][0]
    expect(created.content).toBe(xss) // stored verbatim; React escapes on render
  })
})
