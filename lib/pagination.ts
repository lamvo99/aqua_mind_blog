export const POSTS_PER_PAGE = 9

export type ParsedPage = {
  /** Normalized page number used for rendering (never out of range). */
  page: number
  /** True only when the requested page is a valid integer beyond the last page. */
  outOfRange: boolean
}

/**
 * Parse the raw `?page=` value into a positive integer.
 *
 * Returns `null` for anything that is not a single positive integer
 * (missing, repeated/array, decimal, negative, zero, non-numeric).
 */
export function parseRequestedPage(raw: string | string[] | undefined): number | null {
  if (typeof raw !== "string") return null
  if (!/^\d+$/.test(raw)) return null
  const parsed = Number(raw)
  if (!Number.isSafeInteger(parsed) || parsed < 1) return null
  return parsed
}

/**
 * Deterministic parsing of the `?page=` query value for rendering.
 *
 * - missing / repeated / non-numeric / decimal / negative / zero → page 1
 * - integer within 1..totalPages → that page
 * - integer greater than totalPages → outOfRange (caller renders not-found)
 */
export function parsePageParam(
  raw: string | string[] | undefined,
  totalPages: number
): ParsedPage {
  const requested = parseRequestedPage(raw)
  if (requested === null) return { page: 1, outOfRange: false }
  if (requested > Math.max(1, totalPages)) return { page: 1, outOfRange: true }
  return { page: requested, outOfRange: false }
}
