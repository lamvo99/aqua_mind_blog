"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X, Loader2 } from "lucide-react"
import { searchContent, searchTypes, typeLabels, type SearchItem, type SearchType } from "@/lib/search"
import { urlFor } from "@/lib/sanity"
import Image from "next/image"

function SearchPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get("q") || ""
  const type = (searchParams.get("type") as SearchType) || "all"

  const [query, setQuery] = useState(q)
  const [activeType, setActiveType] = useState<SearchType>(type)
  const [results, setResults] = useState<SearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const runSearch = useCallback(
    async (term: string, searchType: SearchType) => {
      if (!term.trim()) {
        setResults([])
        setSearched(false)
        return
      }
      setLoading(true)
      const data = await searchContent(term, searchType)
      setResults(data)
      setLoading(false)
      setSearched(true)
    },
    []
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (q && q === query) {
        runSearch(q, type)
      }
    }, 200)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      runSearch(query, activeType)
      const params = new URLSearchParams()
      if (query.trim()) params.set("q", query.trim())
      if (activeType !== "all") params.set("type", activeType)
      const qs = params.toString()
      router.replace(qs ? `/search?${qs}` : "/search", { scroll: false })
    }, 300)
    return () => clearTimeout(timer)
  }, [query, activeType, router, runSearch])

  const typeBadgeClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
      active
        ? "gradient-bg text-white"
        : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
    }`

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-6">Search</h1>

      <div className="flex items-center gap-2 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-4 mb-4 focus-within:ring-2 focus-within:ring-aqua-500/50">
        <Search className="w-5 h-5 text-gray-500 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles, fish, plants, equipment..."
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

      <div className="flex flex-wrap gap-2 mb-6">
        {searchTypes.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setActiveType(t.value)}
            className={typeBadgeClass(activeType === t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500 dark:text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Searching...
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{results.length} result(s)</p>
          <div className="space-y-3">
            {results.map((item) => (
              <Link
                key={`${item._type}-${item._id}`}
                href={`/${item._type === "post" ? "posts" : item._type + "s"}/${item.slug?.current}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-aqua-300 dark:hover:border-aqua-800 hover:shadow-md transition-all"
              >
                {item.mainImage ? (
                  <Image
                    src={urlFor(item.mainImage).width(64).height(64).url() || ""}
                    alt={item.title || "Search result"}
                    width={64}
                    height={64}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-aqua-100 dark:bg-aqua-900 flex items-center justify-center shrink-0">
                    <Search className="w-5 h-5 text-aqua-500" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-2 py-0.5 rounded-md bg-aqua-50 dark:bg-aqua-950/50 text-aqua-700 dark:text-aqua-300 text-[10px] font-semibold uppercase tracking-wide">
                      {typeLabels[item._type] || item._type}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{item.title}</p>
                  {item.excerpt && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">{item.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-900 dark:text-slate-100 font-medium mb-1">No results found</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Try a different keyword or remove the filter.
          </p>
        </div>
      )}

      {!loading && !searched && (
        <p className="text-center text-sm text-gray-500 dark:text-slate-500 py-16">
          Type to search across articles, fish, plants, corals and equipment.
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
