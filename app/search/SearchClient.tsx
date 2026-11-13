"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X, Loader2, AlertCircle } from "lucide-react"
import {
  SEARCH_TYPES,
  SEARCH_TYPE_LABEL,
  highlightParts,
  searchHref,
  type SearchResponse,
  type SearchType,
} from "@/lib/search-core"
import { fetchSearch } from "@/lib/search-client"
import { trackDatabaseEvent } from "@/lib/analytics"

function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightParts(text, query).map((part, index) =>
        part.match ? (
          <mark key={index} className="rounded bg-aqua-100 px-0.5 text-inherit dark:bg-aqua-900/60">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  )
}

function SearchPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const initialType = (searchParams.get("type") as SearchType) || "all"

  const [query, setQuery] = useState(initialQuery)
  const [activeType, setActiveType] = useState<SearchType>(
    SEARCH_TYPES.some((entry) => entry.value === initialType) ? initialType : "all"
  )
  const [response, setResponse] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    if (activeType !== "all") params.set("type", activeType)
    const qs = params.toString()
    router.replace(qs ? `/search?${qs}` : "/search", { scroll: false })
  }, [query, activeType, router])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setResponse(null)
      setSearched(false)
      setLoading(false)
      setError(false)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(false)
      try {
        const data = await fetchSearch({ query: term, type: activeType, limit: 24, signal: controller.signal })
        setResponse(data)
        setSearched(true)
        trackDatabaseEvent("database_search_submitted", {
          page_type: "search",
          database_type: activeType === "all" ? undefined : activeType,
          query_length: term.length,
          result_count: data.total,
        })
        if (data.total === 0) {
          trackDatabaseEvent("database_search_no_results", {
            page_type: "search",
            query_length: term.length,
          })
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        setError(true)
        setResponse(null)
        setSearched(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 300)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [query, activeType])

  const openResult = useCallback(
    (index: number, type: string) => {
      trackDatabaseEvent("database_search_result_opened", {
        page_type: "search",
        database_type: type,
        result_position: index + 1,
        query_length: query.trim().length,
      })
    },
    [query]
  )

  const typeBadgeClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${active
      ? "bg-aqua-600 text-white"
      : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
    }`

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-2">Search</h1>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
        Search across articles, fish, invertebrates, plants, corals, equipment and tools.
      </p>

      <div className="flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-4 mb-4 focus-within:ring-2 focus-within:ring-aqua-500/50">
        <Search className="w-5 h-5 text-gray-500 shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try “neon tetra”, “Regal Tang” or “xenia”"
          aria-label="Search AquaMind"
          autoFocus
          className="flex-1 py-3.5 bg-transparent text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none text-sm"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6" aria-label="Filter results by type">
        {SEARCH_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            aria-pressed={activeType === t.value}
            onClick={() => setActiveType(t.value)}
            className={typeBadgeClass(activeType === t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="status" aria-live="polite" className="text-sm text-gray-500 dark:text-slate-400 mb-4">
        {loading && (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Searching…
          </span>
        )}
        {!loading && response && response.total > 0 && (
          <span>
            Showing {response.results.length} of {response.total} result{response.total === 1 ? "" : "s"}
            {response.hasMore ? " — refine the query to narrow the list." : "."}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <p className="font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Search is unavailable right now
          </p>
          <p className="mt-1">You can still browse the database categories or use the Finder.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/database" className="underline">Browse the database</Link>
            <Link href="/finder" className="underline">Use the Finder</Link>
          </div>
        </div>
      )}

      {!loading && !error && response && response.results.length > 0 && (
        <div className="space-y-3">
          {response.results.map((item, index) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={searchHref(item)}
              onClick={() => openResult(index, item.type)}
              className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-aqua-300 dark:hover:border-aqua-800 hover:shadow-md transition-all"
            >
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-aqua-50 dark:bg-aqua-950/50 text-xs font-semibold uppercase text-aqua-700 dark:text-aqua-300">
                {SEARCH_TYPE_LABEL[item.type]?.slice(0, 2) || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                    {SEARCH_TYPE_LABEL[item.type] || item.type}
                  </span>
                  {item.score >= 6 && (
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">possible spelling match</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                  <Highlighted text={item.title} query={query} />
                </p>
                {item.scientificName && (
                  <p className="text-xs italic text-gray-500 dark:text-slate-400">
                    <Highlighted text={item.scientificName} query={query} />
                  </p>
                )}
                {item.excerpt && (
                  <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-slate-400">
                    <Highlighted text={item.excerpt} query={query} />
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && !error && searched && response && response.total === 0 && (
        <div className="text-center py-12 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <Search className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-900 dark:text-slate-100 font-medium mb-1">No results for “{query.trim()}”</p>
          <div className="mx-auto mt-3 max-w-md text-left text-sm text-gray-500 dark:text-slate-400">
            <p className="font-medium text-gray-700 dark:text-slate-300 mb-1">Try:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>checking the spelling, or trying one word instead of several;</li>
              <li>using the scientific name (for example “Paracheirodon innesi”);</li>
              <li>a stored trade name or alias (for example “Regal Tang”);</li>
              <li>browsing a category below.</li>
            </ul>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[
              { href: "/species", label: "Fish" },
              { href: "/invertebrates", label: "Invertebrates" },
              { href: "/plants", label: "Plants" },
              { href: "/corals", label: "Corals" },
              { href: "/equipment", label: "Equipment" },
              { href: "/collections", label: "Collections" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl border border-aqua-200 px-3 py-1.5 text-sm text-aqua-700 hover:bg-aqua-50 dark:border-aqua-800 dark:text-aqua-300 dark:hover:bg-aqua-950/30"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {!loading && !searched && !error && (
        <p className="text-center text-sm text-gray-500 dark:text-slate-500 py-16">
          Type at least two characters to search across articles, fish, plants, corals, equipment and tools.
        </p>
      )}
    </div>
  )
}

export default function SearchClient() {
  return (
    <Suspense>
      <SearchPageClient />
    </Suspense>
  )
}
