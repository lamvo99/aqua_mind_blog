import { client } from './client'

export const sanityFetch = async ({ query, params = {} }: { query: string; params?: Record<string, unknown> }) => {
  return await client.fetch(query, params)
}
