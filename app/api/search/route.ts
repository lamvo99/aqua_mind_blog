import { NextResponse } from 'next/server'
import { SEARCH_TYPES, searchCorpus, type SearchType } from '@/lib/search-core'
import { getSearchCorpus } from '@/lib/search-server'

export const dynamic = 'force-dynamic'

const MAX_QUERY_LENGTH = 80
const DEFAULT_LIMIT = 24

function emptyResponse(query: string, type: SearchType, error: string, status: number) {
  return NextResponse.json(
    { query, type, total: 0, results: [], hasMore: false, error },
    { status, headers: { 'Cache-Control': 'no-store' } }
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = (searchParams.get('q') || '').trim()
  const typeParam = searchParams.get('type') || 'all'
  const limitParam = Number(searchParams.get('limit') || DEFAULT_LIMIT)

  if (query.length < 2) return emptyResponse(query, 'all', 'query_too_short', 400)
  if (query.length > MAX_QUERY_LENGTH) return emptyResponse(query, 'all', 'query_too_long', 400)

  const type = (SEARCH_TYPES.some((entry) => entry.value === typeParam) ? typeParam : 'all') as SearchType
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(50, Math.floor(limitParam))) : DEFAULT_LIMIT

  try {
    const corpus = await getSearchCorpus()
    const response = searchCorpus(corpus, query, type, limit)
    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch {
    return NextResponse.json(
      { query, type, total: 0, results: [], hasMore: false, error: 'search_unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
