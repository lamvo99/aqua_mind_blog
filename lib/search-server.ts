import { unstable_cache } from 'next/cache'
import { client } from './sanity'
import type { SearchDoc } from './search-core'
import { SETUP_COLLECTION_META } from './collections'

interface RawSearchRow {
  _id: string
  _type: string
  title?: string | null
  name?: string | null
  scientificName?: string | null
  aliases?: string[] | null
  localNames?: string[] | null
  excerpt?: string | null
  origin?: string | null
  region?: string | null
  publishedAt?: string | null
  slug?: string | null
}

/** Map raw rows to search docs, keeping drafts and unpublished posts out. */
export function mapSearchRows(rows: RawSearchRow[]): SearchDoc[] {
  return rows
    .filter((row) => !row._id.startsWith('drafts.'))
    .filter((row) => row._type !== 'post' || Boolean(row.publishedAt))
    .map((row) => ({
      id: row._id,
      type: row._type,
      title: (row.name || row.title || '').trim(),
      scientificName: row.scientificName ?? null,
      aliases: row.aliases ?? null,
      localNames: row.localNames ?? null,
      origin: row.origin ?? null,
      region: row.region ?? null,
      excerpt: row.excerpt ?? null,
      slug: row.slug ?? null,
      href: row._type === 'collection' ? `/learn/${row.slug}` : null,
    }))
    .filter((doc) => doc.title.length > 0)
}

async function fetchSearchCorpus(): Promise<SearchDoc[]> {
  const rows = await client.fetch<RawSearchRow[]>(
    `*[_type in ["species", "invertebrate", "plant", "coral", "equipment", "problem", "inspiration", "collection", "post", "tool"]
        && defined(slug.current) && (defined(name) || defined(title))
        && !(_id in path("drafts.**"))
        && (_type != "post" || defined(publishedAt))] {
      _id, _type, name, title, scientificName, aliases, localNames, origin, region, excerpt, publishedAt,
      "slug": slug.current
    }`
  )

  const docs = mapSearchRows(rows)

  return docs.concat(
      SETUP_COLLECTION_META.map((collection): SearchDoc => ({
        id: `setup-collection-${collection.slug}`,
        type: 'collection',
        title: collection.title,
        excerpt: collection.intent,
        slug: collection.slug,
        href: `/collections/${collection.slug}`,
      }))
    )
}

/**
 * Cached search corpus. This is the only place the server reads the data for
 * search; the browser never receives a Sanity token or queries Sanity directly.
 */
export const getSearchCorpus = unstable_cache(fetchSearchCorpus, ['spec22-search-corpus-v2'], {
  revalidate: 300,
})
