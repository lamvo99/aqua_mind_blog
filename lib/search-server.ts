import { unstable_cache } from 'next/cache'
import { client } from './sanity'
import type { SearchDoc } from './search-core'

interface RawSearchRow {
  _id: string
  _type: string
  title?: string | null
  name?: string | null
  scientificName?: string | null
  aliases?: string[] | null
  localNames?: string[] | null
  excerpt?: string | null
  slug?: string | null
}

async function fetchSearchCorpus(): Promise<SearchDoc[]> {
  const rows = await client.fetch<RawSearchRow[]>(
    `*[_type in ["species", "invertebrate", "plant", "coral", "equipment", "post", "tool"]
        && defined(slug.current) && (defined(name) || defined(title))] {
      _id, _type, name, title, scientificName, aliases, localNames, excerpt,
      "slug": slug.current
    }`
  )

  return rows
    .map((row) => ({
      id: row._id,
      type: row._type,
      title: (row.name || row.title || '').trim(),
      scientificName: row.scientificName ?? null,
      aliases: row.aliases ?? null,
      localNames: row.localNames ?? null,
      excerpt: row.excerpt ?? null,
      slug: row.slug ?? null,
    }))
    .filter((doc) => doc.title.length > 0)
}

/**
 * Cached search corpus. This is the only place the server reads the data for
 * search; the browser never receives a Sanity token or queries Sanity directly.
 */
export const getSearchCorpus = unstable_cache(fetchSearchCorpus, ['spec22-search-corpus'], {
  revalidate: 300,
})
