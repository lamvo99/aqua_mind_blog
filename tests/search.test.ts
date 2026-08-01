import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/sanity', () => ({
  client: { fetch: vi.fn() },
}))

import { searchContent, typeLabels, searchTypes } from '@/lib/search'
import { client } from '@/lib/sanity'

const mockedFetch = vi.mocked(client.fetch)

describe('searchContent', () => {
  beforeEach(() => {
    mockedFetch.mockReset()
  })

  it('returns [] for empty/whitespace query without calling Sanity', async () => {
    expect(await searchContent('', 'all')).toEqual([])
    expect(await searchContent('   ', 'article')).toEqual([])
    expect(mockedFetch).not.toHaveBeenCalled()
  })

  it('passes trimmed query as bound $q parameter (GROQ injection-safe)', async () => {
    mockedFetch.mockResolvedValue([{ _id: '1', title: 'Guppy', _type: 'post', slug: { current: 'guppy' } }])
    const q = 'guppy"; *[_type == "post"] { _id } //'
    const res = await searchContent(`  ${q}  `, 'article')
    expect(res).toHaveLength(1)
    expect(mockedFetch).toHaveBeenCalledWith(expect.stringContaining('title match $q + "*"'), { q })
  })

  it('query escapes handled by GROQ match semantics — special chars do not throw', async () => {
    mockedFetch.mockResolvedValue([])
    for (const q of ["'", '"', '\\', '*', '$', ';--', '<script>alert(1)</script>']) {
      await expect(searchContent(q, 'all')).resolves.toEqual([])
    }
  })

  it('network/API failure → [] (graceful degradation)', async () => {
    mockedFetch.mockRejectedValue(new Error('network down'))
    expect(await searchContent('guppy', 'all')).toEqual([])
  })

  it('null response → []', async () => {
    mockedFetch.mockResolvedValue(null)
    expect(await searchContent('guppy', 'plant')).toEqual([])
  })

  it('builds queries for each type', async () => {
    mockedFetch.mockResolvedValue([])
    for (const t of searchTypes) {
      await searchContent('x', t.value)
      expect(mockedFetch).toHaveBeenCalled()
      mockedFetch.mockClear()
    }
  })

  it('exposes type labels for UI', () => {
    expect(typeLabels.post).toBe('Article')
    expect(typeLabels.equipment).toBe('Equipment')
  })
})
