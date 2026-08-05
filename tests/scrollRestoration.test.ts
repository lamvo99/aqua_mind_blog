import { describe, it, expect, vi, afterEach } from 'vitest'
import { readScrollMark, writeScrollMark, setManualScrollRestoration } from '@/lib/scrollRestoration'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubWindow(overrides: { sessionStorage?: Record<string, string>; scrollRestoration?: string } = {}) {
  const store = overrides.sessionStorage ?? {}
  const sessionStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v
    },
    removeItem: (k: string) => {
      delete store[k]
    },
  }
  const history = { scrollRestoration: overrides.scrollRestoration ?? 'auto' }
  vi.stubGlobal('window', { sessionStorage, history, scrollY: 0 })
  return { store, history }
}

describe('writeScrollMark', () => {
  it('stores { y, page } as JSON under the session key', () => {
    const { store } = stubWindow()
    writeScrollMark(420, 2)
    expect(store['aquamind_posts_scroll']).toBe('{"y":420,"page":2}')
  })

  it('refuses invalid values (negative y, non-integer page)', () => {
    const { store } = stubWindow()
    writeScrollMark(-5, 1)
    writeScrollMark(100, 0)
    writeScrollMark(100, 1.5)
    expect(store['aquamind_posts_scroll']).toBeUndefined()
  })

  it('does nothing when window is undefined (SSR safe)', () => {
    expect(() => writeScrollMark(10, 1)).not.toThrow()
  })
})

describe('readScrollMark', () => {
  it('parses a valid stored mark', () => {
    stubWindow({ sessionStorage: { aquamind_posts_scroll: '{"y":420,"page":2}' } })
    expect(readScrollMark()).toEqual({ y: 420, page: 2 })
  })

  it('returns null for missing or corrupt data', () => {
    stubWindow({ sessionStorage: { aquamind_posts_scroll: 'not-json' } })
    expect(readScrollMark()).toBeNull()
  })

  it('rejects marks with wrong shape, negative y or page < 1', () => {
    stubWindow({ sessionStorage: { aquamind_posts_scroll: '{"y":"x","page":2}' } })
    expect(readScrollMark()).toBeNull()
    stubWindow({ sessionStorage: { aquamind_posts_scroll: '{"y":-1,"page":2}' } })
    expect(readScrollMark()).toBeNull()
    stubWindow({ sessionStorage: { aquamind_posts_scroll: '{"y":0,"page":0}' } })
    expect(readScrollMark()).toBeNull()
  })

  it('returns null when window is undefined (SSR safe)', () => {
    expect(readScrollMark()).toBeNull()
  })
})

describe('setManualScrollRestoration', () => {
  it('sets history.scrollRestoration to manual', () => {
    const { history } = stubWindow()
    setManualScrollRestoration()
    expect(history.scrollRestoration).toBe('manual')
  })

  it('does nothing when window is undefined (SSR safe)', () => {
    expect(() => setManualScrollRestoration()).not.toThrow()
  })
})