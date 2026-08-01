import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  sanityFetch: vi.fn(),
  sanityPatch: vi.fn(() => ({ set: vi.fn(() => ({ commit: vi.fn().mockResolvedValue({}) })) })),
}))

vi.mock('@/lib/sanity-server', () => ({
  sanityClient: { fetch: mocks.sanityFetch, patch: mocks.sanityPatch },
}))

// Use the REAL token helpers to exercise the actual HMAC logic
import { GET } from '@/app/api/newsletter/confirm/route'
import { createToken } from '@/lib/newsletter'

function req(url: string): NextRequest {
  return new NextRequest(url, { method: 'GET' })
}

describe('GET /api/newsletter/confirm', () => {
  beforeEach(() => {
    vi.stubEnv('NEWSLETTER_SECRET', 'test-secret')
    vi.stubEnv('SANITY_API_TOKEN', 'test-token')
    mocks.sanityFetch.mockReset()
    mocks.sanityPatch.mockReset().mockReturnValue({ set: vi.fn(() => ({ commit: vi.fn().mockResolvedValue({}) })) })
  })

  it('400 without token', async () => {
    const res = await GET(req('http://localhost/api/newsletter/confirm'))
    expect(res.status).toBe(400)
  })

  it('400 for forged token (old unsigned base64 JSON format)', async () => {
    const forged = Buffer.from(JSON.stringify({ email: 'a@b.com' })).toString('base64url')
    const res = await GET(req(`http://localhost/api/newsletter/confirm?token=${forged}`))
    expect(res.status).toBe(400)
  })

  it('400 for tampered token (modified HMAC payload)', async () => {
    const token = createToken('a@b.com')
    const tampered = token.slice(0, -2) + (token.endsWith('AA') ? 'BB' : 'AA')
    const res = await GET(req(`http://localhost/api/newsletter/confirm?token=${tampered}`))
    expect(res.status).toBe(400)
  })

  it('400 when token was signed with a different secret', async () => {
    // The lib captures the secret at module load; reload it with a foreign secret
    vi.stubEnv('NEWSLETTER_SECRET', 'different-secret')
    vi.resetModules()
    const foreign = await import('@/lib/newsletter')
    const token = foreign.createToken('a@b.com')
    vi.stubEnv('NEWSLETTER_SECRET', 'test-secret')
    vi.resetModules()
    const { GET: ReloadedGET } = await import('@/app/api/newsletter/confirm/route')
    const res = await ReloadedGET(req(`http://localhost/api/newsletter/confirm?token=${encodeURIComponent(token)}`))
    expect(res.status).toBe(400)
  })

  it('valid token → marks subscriber confirmed, 302 to /?newsletter=confirmed', async () => {
    mocks.sanityFetch.mockResolvedValue([{ _id: 'sub1', status: 'pending' }])
    const token = createToken('a@b.com')
    const res = await GET(req(`http://localhost/api/newsletter/confirm?token=${encodeURIComponent(token)}`))
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('http://localhost/?newsletter=confirmed')
    expect(mocks.sanityPatch).toHaveBeenCalledWith('sub1')
    const { set } = mocks.sanityPatch.mock.results[0].value
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ status: 'confirmed' }))
  })

  it('valid token but subscriber missing → still redirects (idempotent, no crash)', async () => {
    mocks.sanityFetch.mockResolvedValue([])
    const token = createToken('a@b.com')
    const res = await GET(req(`http://localhost/api/newsletter/confirm?token=${encodeURIComponent(token)}`))
    expect(res.status).toBe(302)
    expect(mocks.sanityPatch).not.toHaveBeenCalled()
  })

  it('email with special characters survives the token round-trip', async () => {
    mocks.sanityFetch.mockResolvedValue([])
    const email = 'weird+tag@sub.example.com'
    const token = createToken(email)
    const res = await GET(req(`http://localhost/api/newsletter/confirm?token=${encodeURIComponent(token)}`))
    expect(res.status).toBe(302)
    expect(mocks.sanityFetch).toHaveBeenCalledWith(expect.any(String), { email })
  })
})
