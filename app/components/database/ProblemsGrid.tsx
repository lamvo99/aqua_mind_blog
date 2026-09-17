"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Search, RotateCcw } from "lucide-react"

interface Problem {
  _id: string
  title?: string
  name?: string
  slug?: { current: string }
  excerpt?: string
  category?: string
}

const categoryIcons: Record<string, string> = {
  water: "💧",
  algae: "🟢",
  plants: "🌿",
  fish: "🐠",
  equipment: "⚙️",
}

interface ProblemsGridProps {
  problems: Problem[]
}

export default function ProblemsGrid({ problems }: ProblemsGridProps) {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const cat = params.get("category")
    const q = params.get("q")
    if (cat) setActiveCategory(cat)
    if (q) setSearch(q)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (activeCategory && activeCategory !== "all") params.set("category", activeCategory)
    if (search) params.set("q", search)
    const qs = params.toString()
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    window.history.replaceState(null, "", url)
  }, [activeCategory, search])

  const categories = useMemo(() => {
    const cats = new Set<string>()
    for (const p of problems) {
      if (p.category) cats.add(p.category)
    }
    return Array.from(cats).sort()
  }, [problems])

  const visible = useMemo(() => {
    let result = problems
    if (activeCategory && activeCategory !== "all") {
      result = result.filter((p) => p.category === activeCategory)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((p) => {
        const title = (p.title || p.name || "").toLowerCase()
        const excerpt = (p.excerpt || "").toLowerCase()
        return title.includes(q) || excerpt.includes(q)
      })
    }
    return result
  }, [problems, activeCategory, search])

  const resetAll = () => {
    setActiveCategory("all")
    setSearch("")
  }

  const hasActiveFilters = activeCategory !== "all" || search.trim().length > 0

  return (
    <div>
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-aqua-500/50 focus:border-aqua-500 transition-colors"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeCategory === "all"
                  ? "gradient-bg text-white"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  activeCategory === cat
                    ? "gradient-bg text-white"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                }`}
              >
                {categoryIcons[cat]} {cat}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {visible.length} {visible.length === 1 ? "result" : "results"}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAll}
              className="flex items-center gap-1.5 text-xs font-medium text-aqua-600 dark:text-aqua-400 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              Reset all
            </button>
          )}
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visible.map((p) => (
            <Link
              key={p._id}
              href={`/problems/${p.slug?.current}`}
              className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5 hover:shadow-lg hover:border-aqua-300 dark:hover:border-aqua-800 transition-all card-hover"
            >
              <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-1 group-hover:text-aqua-600">
                {p.title || p.name}
              </h3>
              {p.category && (
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-aqua-100 dark:bg-aqua-900/50 text-aqua-700 dark:text-aqua-300 mb-2">
                  {categoryIcons[p.category]} {p.category}
                </span>
              )}
              {p.excerpt && <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2">{p.excerpt}</p>}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <p className="text-gray-900 dark:text-slate-100 font-medium mb-1">
            {hasActiveFilters ? "No matching problems" : "Problem guides coming soon"}
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {hasActiveFilters ? "Try adjusting your search or filters." : "We are building structured guides for common aquarium issues."}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAll}
              className="mt-3 text-sm font-medium text-aqua-600 dark:text-aqua-400 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
