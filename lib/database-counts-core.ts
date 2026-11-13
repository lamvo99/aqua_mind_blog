export type DatabaseCountKey = 'species' | 'plant' | 'coral' | 'invertebrate' | 'equipment' | 'problem'

export type DatabaseCounts = Record<DatabaseCountKey, number | null>

export const DATABASE_COUNT_KEYS: DatabaseCountKey[] = [
  'species',
  'plant',
  'coral',
  'invertebrate',
  'equipment',
  'problem',
]

export function totalDatabaseCount(counts: DatabaseCounts | null | undefined): number | null {
  if (!counts) return null
  const values = DATABASE_COUNT_KEYS.map((key) => counts[key])
  if (values.some((value) => value === null || value === undefined)) return null
  return values.reduce<number>((sum, value) => sum + (value as number), 0)
}

/** Pure helper used by tests: turns raw query results into the public shape. */
export function buildCounts(entries: Array<[DatabaseCountKey, unknown]>): DatabaseCounts {
  const counts = {} as DatabaseCounts
  for (const key of DATABASE_COUNT_KEYS) {
    const entry = entries.find(([k]) => k === key)
    const value = entry?.[1]
    counts[key] = typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
  }
  return counts
}
