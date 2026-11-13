import { unstable_cache } from 'next/cache'
import { client } from './sanity'
import {
  DATABASE_COUNT_KEYS,
  buildCounts,
  type DatabaseCountKey,
  type DatabaseCounts,
} from './database-counts-core'

export {
  DATABASE_COUNT_KEYS,
  buildCounts,
  totalDatabaseCount,
  type DatabaseCountKey,
  type DatabaseCounts,
} from './database-counts-core'

/**
 * Count semantics: published documents of the requested type that have the
 * display name/title and a non-empty slug — the same predicate the public
 * list queries use (see `getDatabaseList` / `getProblemsList`).
 */
const COUNT_QUERIES: Record<DatabaseCountKey, string> = {
  species: `count(*[_type == "species" && defined(name) && defined(slug.current)])`,
  plant: `count(*[_type == "plant" && defined(name) && defined(slug.current)])`,
  coral: `count(*[_type == "coral" && defined(name) && defined(slug.current)])`,
  invertebrate: `count(*[_type == "invertebrate" && defined(name) && defined(slug.current)])`,
  equipment: `count(*[_type == "equipment" && defined(name) && defined(slug.current)])`,
  problem: `count(*[_type == "problem" && defined(title) && defined(slug.current)])`,
}

async function fetchDatabaseCounts(): Promise<DatabaseCounts | null> {
  try {
    const results = await Promise.all(
      DATABASE_COUNT_KEYS.map(async (key) => [key, await client.fetch<number>(COUNT_QUERIES[key])] as const)
    )
    return buildCounts(results as Array<[DatabaseCountKey, unknown]>)
  } catch {
    // Do not present a stale snapshot as live truth.
    return null
  }
}

/**
 * Cached read-through count source. Returns `null` when the data source is
 * unavailable so callers can hide numbers instead of showing stale values.
 */
export const getDatabaseCounts = unstable_cache(
  fetchDatabaseCounts,
  ['spec22-database-counts'],
  { revalidate: 300 }
)
