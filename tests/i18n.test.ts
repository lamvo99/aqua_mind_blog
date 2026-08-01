import { describe, it, expect } from 'vitest'
import strings from '@/lib/i18n/strings'

describe('i18n strings completeness', () => {
  it('comments section has all keys used by Comments.tsx', () => {
    const c = strings.comments
    expect(c.title).toBeTruthy()
    expect(c.name).toBeTruthy()
    expect(c.email).toBeTruthy()
    expect(c.write).toBeTruthy()
    expect(c.submit).toBeTruthy()
    expect(c.empty).toBeTruthy()
    expect(c.pendingBadge).toBeTruthy()
    expect(c.pending).toBeTruthy()
    expect(c.submitError).toBeTruthy()
  })

  it('newsletter section has pending/error keys used by the UI', () => {
    const n = strings.newsletter
    expect(n.pendingTitle).toBeTruthy()
    expect(n.pending).toBeTruthy()
    expect(n.error).toBeTruthy()
  })

  it('footer has confirmEmail key used by footer.tsx', () => {
    expect(strings.footer.confirmEmail).toBeTruthy()
  })

  it('all UI strings are non-empty', () => {
    const walk = (obj: Record<string, unknown>, path = ''): void => {
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'string') {
          expect(v.trim().length, `${path}${k} must not be empty`).toBeGreaterThan(0)
        } else if (typeof v === 'object' && v !== null) {
          walk(v as Record<string, unknown>, `${path}${k}.`)
        }
      }
    }
    walk(strings as unknown as Record<string, unknown>)
  })
})
