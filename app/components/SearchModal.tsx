"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, X, Loader2 } from "lucide-react"
import strings from "@/lib/i18n/strings"
import { fetchSearch } from "@/lib/search-client"
import { highlightParts, searchHref, SEARCH_TYPE_LABEL, type SearchHit } from "@/lib/search-core"
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

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchHit[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [searched, setSearched] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const tokenRef = useRef(0)

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
    setQuery("")
    setResults([])
    setTotal(0)
    setError(false)
    setSearched(false)
    setActiveIndex(-1)
  }, [open])

  useEffect(() => {
    const term = query.trim()
    if (!open || term.length < 2) {
      setResults([])
      setTotal(0)
      setSearched(false)
      setError(false)
      setActiveIndex(-1)
      return
    }

    const token = ++tokenRef.current
    const controller = new AbortController()
    setLoading(true)
    setError(false)
    const timer = setTimeout(async () => {
      try {
        const data = await fetchSearch({ query: term, type: "all", limit: 8, signal: controller.signal })
        if (token !== tokenRef.current) return
        setResults(data.results)
        setTotal(data.total)
        setSearched(true)
        trackDatabaseEvent("database_search_submitted", {
          page_type: "modal",
          query_length: term.length,
          result_count: data.total,
        })
        if (data.total === 0) {
          trackDatabaseEvent("database_search_no_results", {
            page_type: "modal",
            query_length: term.length,
          })
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return
        if (token !== tokenRef.current) return
        setResults([])
        setTotal(0)
        setError(true)
        setSearched(true)
      } finally {
        if (token === tokenRef.current) setLoading(false)
      }
    }, 250)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [query, open])

  const goTo = useCallback(
    (index: number) => {
      const item = results[index]
      if (!item) return
      trackDatabaseEvent("database_search_result_opened", {
        page_type: "modal",
        database_type: item.type,
        result_position: index + 1,
        query_length: query.trim().length,
      })
      onClose()
      router.push(searchHref(item))
    },
    [results, onClose, router, query]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (results.length === 0 ? -1 : (i + 1) % results.length))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (results.length === 0 ? -1 : (i - 1 + results.length) % results.length))
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        e.preventDefault()
        goTo(activeIndex)
      } else if (results.length > 0) {
        e.preventDefault()
        goTo(0)
      }
    } else if (e.key === "Escape") {
      if (activeIndex >= 0) {
        e.preventDefault()
        setActiveIndex(-1)
      } else {
        onClose()
      }
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-label="Close search" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search articles"
        className="relative w-full max-w-xl mx-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 border-b border-gray-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-gray-500 shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label={strings.search.placeholder}
            aria-autocomplete="list"
            aria-controls="search-results"
            aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
            placeholder={strings.search.placeholder}
            className="flex-1 py-4 bg-transparent text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none text-sm"
          />
          {loading && <Loader2 className="w-4 h-4 text-aqua-500 animate-spin" />}
          <button onClick={onClose} aria-label="Close search" className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        {error && (
          <div className="p-6 text-center text-sm text-red-500" role="alert">
            <p>Search unavailable right now. Please try again.</p>
            <Link href="/database" onClick={onClose} className="mt-2 inline-block underline">
              Browse the database instead
            </Link>
          </div>
        )}
        {!error && results.length > 0 && (
          <>
            <ul id="search-results" role="listbox" aria-label="Search results" className="max-h-80 overflow-y-auto p-2">
              {results.map((item, index) => (
                <li key={`${item.type}-${item.id}`} role="option" aria-selected={index === activeIndex} id={`search-result-${index}`}>
                  <Link
                    href={searchHref(item)}
                    onClick={(e) => {
                      e.preventDefault()
                      goTo(index)
                    }}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-colors group ${
                      index === activeIndex ? "bg-aqua-50 dark:bg-aqua-950/50" : "hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-aqua-50 dark:bg-aqua-950/50 text-[10px] font-semibold uppercase text-aqua-700 dark:text-aqua-300">
                      {SEARCH_TYPE_LABEL[item.type]?.slice(0, 2) || "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                          <Highlighted text={item.title} query={query} />
                        </p>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-aqua-100 dark:bg-aqua-900/50 text-aqua-700 dark:text-aqua-300 shrink-0">
                          {SEARCH_TYPE_LABEL[item.type] || item.type}
                        </span>
                      </div>
                      {item.excerpt && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">
                          <Highlighted text={item.excerpt} query={query} />
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 dark:border-slate-700 dark:text-slate-400">
              Showing {results.length} of {total}.{" "}
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={onClose}
                className="font-medium text-aqua-600 hover:underline dark:text-aqua-400"
              >
                Open full search
              </Link>
            </div>
          </>
        )}
        {!error && searched && results.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-slate-400">
            <p>{strings.search.noResults}</p>
            <p className="mt-1">Try a scientific name or a stored trade name.</p>
            <Link
              href={`/search?q=${encodeURIComponent(query.trim())}`}
              onClick={onClose}
              className="mt-3 inline-block font-medium text-aqua-600 hover:underline dark:text-aqua-400"
            >
              Open full search
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
