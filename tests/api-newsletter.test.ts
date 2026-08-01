import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  sanityFetch: vi.fn(),
  sanityCreate: vi.fn(),
  sendEmail: vi.fn(),
  createToken: vi.fn((email: string) => `token:${email}`),
}))

vi.mock('@/lib/sanity-server', () => ({
  sanityClient: { fetch: mocks.sanityFetch, create: mocks.sanityCreate },
}))
vi.mock('@/lib/newsletter', () => ({
  createToken: mocks.createToken,
  sendConfirmationEmail: mocks.sendEmail,
}))

import { POST } from '@/app/api/newsletter/route'

function req(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/newsletter', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('POST /api/newsletter', () => {
  beforeEach(() => {
    vi.resetModules()
    mocks.sanityFetch.mockReset().mockResolvedValue([])
    mocks.sanityCreate.mockReset().mockResolvedValue({ _id: 'sub1' })
    mocks.sendEmail.mockReset().mockResolvedValue(undefined)
    vi.stubEnv('RESEND_API_KEY', 're_testkey')
    vi.stubEnv('NODE_ENV', 'test')
  })

  it('400 on malformed JSON body', async () => {
    const res = await POST(req('{not json'))
    expect(res.status).toBe(400)
  })

  it('400 on missing email', async () => {
    const res = await POST(req({}))
    expect(res.status).toBe(400)
  })

  it.each(['plainaddress', 'a@b', '@domain.com', 'a b@c.com', ''])('400 on invalid email "%s"', async (email) => {
    const res = await POST(req({ email }))
    expect(res.status).toBe(400)
  })

  it('creates subscriber with normalized email + sends confirmation, returns pending', async () => {
    const res = await POST(req({ email: '  User@Example.COM ' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ success: true, pending: true })
    expect(mocks.sanityCreate).toHaveBeenCalledWith(
      expect.objectContaining({ _type: 'subscriber', email: 'user@example.com', status: 'pending' })
    )
    expect(mocks.sendEmail).toHaveBeenCalledWith('user@example.com', 'token:user@example.com')
    // token never returned to the client when email was actually sent
    expect(body.token).toBeUndefined()
  })

  it('does not duplicate an existing confirmed subscriber', async () => {
    mocks.sanityFetch.mockResolvedValue([{ _id: 'sub1', status: 'confirmed' }])
    const res = await POST(req({ email: 'a@b.com' }))
    expect((await res.json())).toMatchObject({ success: true, confirmed: true })
    expect(mocks.sanityCreate).not.toHaveBeenCalled()
    expect(mocks.sendEmail).not.toHaveBeenCalled()
  })

  it('re-sends confirmation for an existing pending subscriber without creating a duplicate', async () => {
    mocks.sanityFetch.mockResolvedValue([{ _id: 'sub1', status: 'pending' }])
    const res = await POST(req({ email: 'a@b.com' }))
    expect(res.status).toBe(200)
    expect(mocks.sanityCreate).not.toHaveBeenCalled()
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1)
  })

  it('dev fallback: no RESEND_API_KEY → returns token, does not send email', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    vi.stubEnv('NODE_ENV', 'development')
    const res = await POST(req({ email: 'a@b.com' }))
    const body = await res.json()
    expect(body.pending).toBe(true)
    expect(body.token).toBeDefined()
    expect(mocks.sendEmail).not.toHaveBeenCalled()
  })

  it('production without RESEND_API_KEY → 500', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    vi.stubEnv('NODE_ENV', 'production')
    const res = await POST(req({ email: 'a@b.com' }))
    expect(res.status).toBe(500)
  })

  it('502 when the email provider call fails', async () => {
    mocks.sendEmail.mockRejectedValue(new Error('Resend error 403'))
    const res = await POST(req({ email: 'a@b.com' }))
    expect(res.status).toBe(502)
  })
})
