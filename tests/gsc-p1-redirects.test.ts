import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const nextConfig = require('../next.config.js')

async function redirects() {
  return await nextConfig.redirects()
}

describe('GSC P1 redirects', () => {
  it('redirects the legacy Java Moss slug to the verified current record', async () => {
    const list = await redirects()
    const redirect = list.find((item: any) => item.source === '/plants/java-moss')
    expect(redirect?.destination).toBe('/plants/taxiphyllum-barbieri')
    expect(redirect?.permanent).toBe(true)
  })

  it('redirects the plural Acan Lord alias to the verified current record', async () => {
    const list = await redirects()
    const redirect = list.find((item: any) => item.source === '/corals/acan-lords')
    expect(redirect?.destination).toBe('/corals/acan-lord')
    expect(redirect?.permanent).toBe(true)
  })

  it('does not create redirect loops or self-redirects', async () => {
    const list = await redirects()
    for (const item of list) {
      expect(item.destination).not.toBe(item.source)
      const target = list.find((candidate: any) => candidate.source === item.destination)
      expect(target, `${item.source} should not redirect again via ${item.destination}`).toBeUndefined()
    }
  })

  it('preserves the existing setup-planner redirect', async () => {
    const list = await redirects()
    expect(list).toContainEqual({ source: '/tools/setup-planner', destination: '/setup-planner', permanent: true })
  })
})
