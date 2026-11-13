import type { SearchResponse, SearchType } from './search-core'

export interface FetchSearchOptions {
  query: string
  type?: SearchType
  limit?: number
  signal?: AbortSignal
}

/**
 * Shared client entry point for both `/search` and the navbar modal. It calls
 * the same-origin API, so browser search does not depend on Sanity CORS or on
 * a client-side dataset token.
 */
export async function fetchSearch({
  query,
  type = 'all',
  limit = 24,
  signal,
}: FetchSearchOptions): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query.trim(), type })
  params.set('limit', String(limit))

  const response = await fetch(`/api/search?${params.toString()}`, {
    signal,
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Search request failed (${response.status})`)
  }
  return (await response.json()) as SearchResponse
}
