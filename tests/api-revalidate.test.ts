import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { POST } from '@/app/api/revalidate/route'

function req(body: unknown, secret?: string): NextRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (secret !== undefined) headers['x-verification-key'] = secret
  return new NextRequest('http://localhost/api/revalidate', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('POST /api/revalidate', () => {
  it('401 without or with wrong secret', async () => {
    vi.stubEnv('SANITY_REVALIDATE_SECRET', 'sekret')
    expect((await POST(req({ _type: 'post' }))).status).toBe(401)
    expect((await POST(req({ _type: 'post' }, 'wrong'))).status).toBe(401)
    vi.unstubAllEnvs()
  })

  it('401 when no secret is configured on the server', async () => {
    vi.stubEnv('SANITY_REVALIDATE_SECRET', '')
    expect((await POST(req({ _type: 'post' }, 'anything'))).status).toBe(401)
    vi.unstubAllEnvs()
  })

  it('400 on invalid JSON body', async () => {
    vi.stubEnv('SANITY_REVALIDATE_SECRET', 'sekret')
    const res = await POST(req('{broken', 'sekret'))
    expect(res.status).toBe(400)
    vi.unstubAllEnvs()
  })

  it('unknown type still revalidates global paths without crashing', async () => {
    vi.stubEnv('SANITY_REVALIDATE_SECRET', 'sekret')
    const res = await POST(req({ _type: 'comment', _id: 'c1' }, 'sekret'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.revalidated).toBe(true)
    vi.unstubAllEnvs()
  })

  it('known type revalidates detail + listing paths', async () => {
    vi.stubEnv('SANITY_REVALIDATE_SECRET', 'sekret')
    const res = await POST(req({ _type: 'post', slug: { current: 'guppy-guide' } }, 'sekret'))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ revalidated: true, type: 'post' })
    vi.unstubAllEnvs()
  })
})
