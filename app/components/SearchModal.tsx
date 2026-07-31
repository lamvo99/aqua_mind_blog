"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, X, Loader2 } from "lucide-react"
import strings from "@/lib/i18n/strings"
import { client } from "@/lib/sanity"
import { urlFor } from "@/lib/sanity"

interface SearchResult {
  _id: string
  title: string
  slug: { current: string }
  excerpt: string
  mainImage: any
  publishedAt: string
}

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery("")
      setResults([])
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await client.fetch(
          `*[_type == "post" && title match $q + "*"] | order(publishedAt desc) [0...6] {
            _id, title, slug, excerpt, mainImage, publishedAt
          }`,
          { q: query }
        )
        setResults(data || [])
      } catch {
        setResults([])
      }
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-label="Close search" />
      <div className="relative w-full max-w-xl mx-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-gray-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-gray-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={strings.search.placeholder}
            className="flex-1 py-4 bg-transparent text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none text-sm"
          />
          {loading && <Loader2 className="w-4 h-4 text-aqua-500 animate-spin" />}
          <button onClick={onClose} aria-label="Close search" className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto p-2">
            {results.map((post) => (
              <Link
                key={post._id}
                href={`/posts/${post.slug.current}`}
                onClick={onClose}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group"
              >
                {post.mainImage ? (
                  <Image
                    src={urlFor(post.mainImage).width(64).height(64).url() || ""}
                    alt={post.title}
                    width={64}
                    height={64}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-aqua-100 dark:bg-aqua-900 flex items-center justify-center shrink-0">
                    <Search className="w-5 h-5 text-aqua-500" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">{post.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
        {query && !loading && results.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-500">{strings.search.noResults}</div>
        )}
      </div>
    </div>
  )
}
