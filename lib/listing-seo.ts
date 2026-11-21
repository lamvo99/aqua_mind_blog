import type { Metadata } from 'next'
import { hasListingQuery, type ListingSearchParams } from './listing-filters'

export const SITE_URL = 'https://www.aquamind.life'

export function listingRobots(filtered: boolean): Metadata['robots'] {
  return filtered ? { index: false, follow: true } : { index: true, follow: true }
}

export function withListingSeo(
  base: Metadata,
  path: string,
  searchParams?: ListingSearchParams
): Metadata {
  const filtered = hasListingQuery(searchParams || {})
  return {
    ...base,
    alternates: { canonical: `${SITE_URL}${path}` },
    robots: listingRobots(filtered),
  }
}
