export type ListingSearchParams = Record<string, string | string[] | undefined>

export interface ListingQueryState {
  search: string
  filters: Record<string, string>
  ranges: Record<string, { min: string; max: string }>
}

/** Campaign params are not filters and must not narrow or deindex a listing. */
const TRACKING_PARAM = /^(utm_|gclid$|fbclid$|msclkid$|mc_cid$|mc_eid$)/

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || ''
}

function toParams(input: URLSearchParams | ListingSearchParams): URLSearchParams {
  if (input instanceof URLSearchParams) return input
  const next = new URLSearchParams()
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) next.set(key, value[0] || '')
    else if (value !== undefined) next.set(key, value)
  }
  return next
}

export function parseListingQuery(input: URLSearchParams | ListingSearchParams): ListingQueryState {
  const params = toParams(input)
  const filters: Record<string, string> = {}
  const ranges: Record<string, { min: string; max: string }> = {}
  for (const [key, value] of params.entries()) {
    if (key === 'q' || TRACKING_PARAM.test(key)) continue
    if (key.endsWith('_min') || key.endsWith('_max')) {
      const base = key.replace(/_min$|_max$/, '')
      if (!ranges[base]) ranges[base] = { min: '', max: '' }
      if (key.endsWith('_min')) ranges[base].min = value
      else ranges[base].max = value
    } else {
      filters[key] = value
    }
  }

  return { search: params.get('q') || '', filters, ranges }
}

export function hasListingQuery(input: URLSearchParams | ListingSearchParams): boolean {
  const params = toParams(input)
  return [...params.entries()].some(
    ([key, value]) => value.trim().length > 0 && !TRACKING_PARAM.test(key)
  )
}

/** Small helper for pages that need a first-value read from Next searchParams. */
export function listingParam(input: ListingSearchParams, key: string): string {
  return firstValue(input[key])
}
