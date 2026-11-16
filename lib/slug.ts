/**
 * Shared slug rules for authoring (Sanity) and URL generation.
 * Kept dependency-free so it can be imported by both the app and the Studio schema.
 */

/** Lowercase alphanumeric words separated by single hyphens. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isValidSlugValue(value: string | null | undefined): boolean {
  if (typeof value !== "string" || value.length === 0) return false
  if (value !== value.trim()) return false
  return SLUG_PATTERN.test(value)
}

/** Best-effort suggestion used in validation messages (does not mutate documents). */
export function suggestSlug(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
