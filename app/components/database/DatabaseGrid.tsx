"use client"

import { useState, useMemo } from "react"
import type { DatabaseItem } from "@/lib/database"
import DatabaseCard from "./DatabaseCard"

interface DatabaseGridProps {
  items: DatabaseItem[]
  hrefPrefix: string
  filterKeys?: string[]
}

export default function DatabaseGrid({ items, hrefPrefix, filterKeys = [] }: DatabaseGridProps) {
  const [filter, setFilter] = useState<string>("all")

  const filters = useMemo(() => {
    const keys = new Set<string>()
    for (const item of items) {
      for (const key of filterKeys) {
        const val = (item as any)[key]
        if (val) keys.add(val)
      }
    }
    return Array.from(keys).sort()
  }, [items, filterKeys])

  const visible = useMemo(() => {
    if (filter === "all") return items
    return items.filter((item) => (item as any)[filterKeys[0]] === filter)
  }, [items, filter, filterKeys])

  return (
    <div>
      {filters.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === "all"
                ? "gradient-bg text-white"
                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
            }`}
          >
            All
          </button>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === f
                  ? "gradient-bg text-white"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((item) => (
            <DatabaseCard key={item._id} item={item} href={`${hrefPrefix}/${item.slug?.current}`} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <p className="text-gray-900 dark:text-slate-100 font-medium mb-1">No entries yet</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            This database is being curated. Check back soon.
          </p>
        </div>
      )}
    </div>
  )
}
