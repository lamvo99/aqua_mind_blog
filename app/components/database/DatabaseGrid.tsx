"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { X, Scale, Trash2, Search, RotateCcw, SlidersHorizontal, ChevronDown } from "lucide-react"
import type { DatabaseItem } from "@/lib/database"
import { urlFor } from "@/lib/sanity"
import { COMPARE_FIELDS, MAX_COMPARE } from "@/lib/compare"
import DatabaseCard from "./DatabaseCard"

export interface FilterGroup {
  key: string
  label: string
}

export interface RangeFilter {
  key: string
  label: string
  min?: number
  max?: number
  step?: number
  unit?: string
}

interface DatabaseGridProps {
  items: DatabaseItem[]
  hrefPrefix: string
  filterGroups?: FilterGroup[]
  rangeFilters?: RangeFilter[]
  compareItems?: DatabaseItem[]
  compareType?: "species" | "invertebrate" | "plant" | "coral" | "equipment"
  finderHref?: string
}

function readFilters(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const params = new URLSearchParams(window.location.search)
  const filters: Record<string, string> = {}
  for (const [key, value] of params.entries()) {
    if (key !== "q" && !key.endsWith("_min") && !key.endsWith("_max")) filters[key] = value
  }
  return filters
}

function readRangeFilters(): Record<string, { min: string; max: string }> {
  if (typeof window === "undefined") return {}
  const params = new URLSearchParams(window.location.search)
  const ranges: Record<string, { min: string; max: string }> = {}
  for (const [key, value] of params.entries()) {
    if (key.endsWith("_min") || key.endsWith("_max")) {
      const base = key.replace(/_min$|_max$/, "")
      if (!ranges[base]) ranges[base] = { min: "", max: "" }
      if (key.endsWith("_min")) ranges[base].min = value
      else ranges[base].max = value
    }
  }
  return ranges
}

function readSearch(): string {
  if (typeof window === "undefined") return ""
  return new URLSearchParams(window.location.search).get("q") || ""
}

function writeFilters(filters: Record<string, string>, search: string, rangeFilters: Record<string, { min: string; max: string }>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value && value !== "all") params.set(key, value)
  }
  for (const [key, range] of Object.entries(rangeFilters)) {
    if (range.min) params.set(`${key}_min`, range.min)
    if (range.max) params.set(`${key}_max`, range.max)
  }
  if (search) params.set("q", search)
  const qs = params.toString()
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
  window.history.replaceState(null, "", url)
}

export default function DatabaseGrid({ items, hrefPrefix, filterGroups = [], rangeFilters = [], compareItems = [], compareType, finderHref }: DatabaseGridProps) {
  const [search, setSearch] = useState(readSearch)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(readFilters)
  const [activeRanges, setActiveRanges] = useState<Record<string, { min: string; max: string }>>(readRangeFilters)
  const [selected, setSelected] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    writeFilters(activeFilters, search, activeRanges)
  }, [activeFilters, search, activeRanges])

  const comparePool = compareItems.length > 0 ? compareItems : items
  const byId = useMemo(() => Object.fromEntries(comparePool.map((i) => [i._id, i])), [comparePool])

  const filterOptions = useMemo(() => {
    const options: Record<string, Set<string>> = {}
    for (const group of filterGroups) {
      options[group.key] = new Set<string>()
    }
    for (const item of items) {
      for (const group of filterGroups) {
        const val = (item as any)[group.key]
        if (Array.isArray(val)) {
          val.forEach((v: string) => options[group.key]?.add(v))
        } else if (val) {
          options[group.key].add(val)
        }
      }
    }
    const result: Record<string, string[]> = {}
    for (const [key, set] of Object.entries(options)) {
      result[key] = Array.from(set).sort()
    }
    return result
  }, [items, filterGroups])

  const visible = useMemo(() => {
    let result = items

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((item) => {
        const name = (item.name || "").toLowerCase()
        const sci = (item as any).scientificName || ""
        const excerpt = (item.excerpt || "").toLowerCase()
        return name.includes(q) || sci.toLowerCase().includes(q) || excerpt.includes(q)
      })
    }

    for (const [key, value] of Object.entries(activeFilters)) {
      if (value && value !== "all") {
        result = result.filter((item) => {
          const itemVal = (item as any)[key]
          if (Array.isArray(itemVal)) return itemVal.includes(value)
          return itemVal === value
        })
      }
    }

    for (const [key, range] of Object.entries(activeRanges)) {
      const minVal = range.min ? parseFloat(range.min) : undefined
      const maxVal = range.max ? parseFloat(range.max) : undefined
      if (minVal !== undefined || maxVal !== undefined) {
        result = result.filter((item) => {
          const itemVal = (item as any)[key]
          if (itemVal == null || itemVal === "") return false
          const num = Number(itemVal)
          if (isNaN(num)) return false
          if (minVal !== undefined && num < minVal) return false
          if (maxVal !== undefined && num > maxVal) return false
          return true
        })
      }
    }

    return result
  }, [items, search, activeFilters, activeRanges])

  const setFilter = useCallback((key: string, value: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev }
      if (value === "all" || !value) {
        delete next[key]
      } else {
        next[key] = value
      }
      return next
    })
  }, [])

  const setRangeFilter = useCallback((key: string, field: "min" | "max", value: string) => {
    setActiveRanges((prev) => {
      const next = { ...prev }
      if (!next[key]) next[key] = { min: "", max: "" }
      next[key] = { ...next[key], [field]: value }
      if (!next[key].min && !next[key].max) delete next[key]
      return next
    })
  }, [])

  const resetAll = useCallback(() => {
    setActiveFilters({})
    setActiveRanges({})
    setSearch("")
  }, [])

  const hasActiveFilters = Object.keys(activeFilters).length > 0 || Object.keys(activeRanges).length > 0 || search.trim().length > 0
  const activeFilterCount = Object.keys(activeFilters).filter(k => activeFilters[k] && activeFilters[k] !== "all").length +
    Object.keys(activeRanges).length +
    (search.trim().length > 0 ? 1 : 0)

  const toggleCompare = (item: DatabaseItem) => {
    setSelected((prev) => {
      if (prev.includes(item._id)) return prev.filter((id) => id !== item._id)
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, item._id]
    })
  }

  const clearCompare = () => {
    setSelected([])
    setShowModal(false)
  }

  const compareSel = selected.map((id) => byId[id]).filter(Boolean)
  const fields = compareType ? COMPARE_FIELDS[compareType] || [] : []

  return (
    <div>
      {/* Search + Filter bar */}
      <div className="mb-6 space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or scientific name..."
            aria-label="Search entries"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-aqua-500/50 focus:border-aqua-500 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); searchRef.current?.focus() }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Mobile filter toggle */}
        {(filterGroups.length > 0 || rangeFilters.length > 0) && (
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="sm:hidden flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-gray-700 dark:text-slate-300"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-auto px-2 py-0.5 rounded-full bg-aqua-100 dark:bg-aqua-900/50 text-aqua-600 dark:text-aqua-400 text-xs font-semibold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </button>
        )}

        {/* Filter groups — desktop always visible, mobile collapsible */}
        <div className={`${filtersOpen ? "block" : "hidden"} sm:block space-y-4`}>
          {filterGroups.map((group) => {
            const options = filterOptions[group.key]
            if (!options || options.length === 0) return null
            const active = activeFilters[group.key] || "all"
            return (
              <div key={group.key}>
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wide">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter(group.key, "all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      active === "all"
                        ? "gradient-bg text-white"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    All
                  </button>
                  {options.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(group.key, f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                        active === f
                          ? "gradient-bg text-white"
                          : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Range filters */}
          {rangeFilters.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {rangeFilters.map((rf) => {
                const range = activeRanges[rf.key] || { min: "", max: "" }
                return (
                  <div key={rf.key} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">{rf.label}</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        placeholder={rf.min?.toString() || "Min"}
                        value={range.min}
                        onChange={(e) => setRangeFilter(rf.key, "min", e.target.value)}
                        aria-label={`${rf.label} minimum`}
                        className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-xs placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-aqua-500/50"
                      />
                      <span className="text-gray-400 dark:text-slate-500 text-xs">–</span>
                      <input
                        type="number"
                        placeholder={rf.max?.toString() || "Max"}
                        value={range.max}
                        onChange={(e) => setRangeFilter(rf.key, "max", e.target.value)}
                        aria-label={`${rf.label} maximum`}
                        className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-xs placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-aqua-500/50"
                      />
                      {rf.unit && <span className="text-[10px] text-gray-400 dark:text-slate-500">{rf.unit}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Active filter chips + Result count + reset */}
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            <span className="font-semibold text-gray-700 dark:text-slate-200">{visible.length}</span>{" "}
            {visible.length === 1 ? "result" : "results"}
            {hasActiveFilters && ` of ${items.length}`}
          </p>
          {hasActiveFilters && (
            <>
              <span className="text-gray-300 dark:text-slate-600">|</span>
              <button
                type="button"
                onClick={resetAll}
                className="flex items-center gap-1.5 text-xs font-medium text-aqua-600 dark:text-aqua-400 hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                Reset all
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grid */}
      {visible.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((item) => (
            <DatabaseCard
              key={item._id}
              item={item}
              href={`${hrefPrefix}/${item.slug?.current}`}
              comparing={selected.includes(item._id)}
              compareDisabled={selected.length >= MAX_COMPARE}
              onToggleCompare={compareType ? toggleCompare : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
            <Search className="w-6 h-6 text-gray-400 dark:text-slate-500" />
          </div>
          <p className="text-gray-900 dark:text-slate-100 font-medium mb-1">
            {hasActiveFilters ? "No matching results" : "No entries yet"}
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
            {hasActiveFilters
              ? "Try adjusting your search or filters to find what you're looking for."
              : "This database is being curated. Check back soon."}
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAll}
                className="px-4 py-2 rounded-xl text-sm font-medium text-aqua-600 dark:text-aqua-400 bg-aqua-50 dark:bg-aqua-950/30 hover:bg-aqua-100 dark:hover:bg-aqua-950/50 transition-colors"
              >
                Clear all filters
              </button>
            )}
            {finderHref && (
              <Link
                href={finderHref}
                className="px-4 py-2 rounded-xl text-sm font-medium gradient-bg text-white hover:opacity-90 transition-all"
              >
                Try the Finder
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Compare bar */}
      {compareType && selected.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl">
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-2xl p-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <Scale className="w-4 h-4 text-aqua-500 shrink-0" />
              {compareSel.map((item) => (
                <div key={item._id} className="flex items-center gap-1.5 shrink-0">
                  {item.mainImage ? (
                    <Image src={urlFor(item.mainImage).width(48).height(48).url()} alt="" width={24} height={24} className="w-6 h-6 rounded object-cover" />
                  ) : null}
                  <span className="text-xs font-medium text-gray-700 dark:text-slate-300">{item.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${item.name} from comparison`}
                    onClick={() => toggleCompare(item)}
                    className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-950"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowModal(true)}
                disabled={selected.length < 2}
                className="ml-auto shrink-0 px-4 py-2 rounded-xl gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Compare ({selected.length})
              </button>
              <button
                type="button"
                onClick={clearCompare}
                aria-label="Clear comparison"
                className="p-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare modal */}
      {showModal && compareSel.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Comparison table"
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Compare</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close comparison"
                className="p-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left align-bottom pb-3 pr-4 w-36 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                    {compareSel.length} selected
                  </th>
                  {compareSel.map((item) => (
                    <th key={item._id} className="text-left align-bottom pb-3 px-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-bold text-gray-900 dark:text-slate-100 leading-snug">{item.name}</span>
                        {item.mainImage && (
                          <Image
                            src={urlFor(item.mainImage).width(160).height(120).url()}
                            alt={item.name}
                            width={160}
                            height={120}
                            className="rounded-lg object-cover w-full aspect-[4/3]"
                          />
                        )}
                        <Link
                          href={`${hrefPrefix}/${item.slug?.current}`}
                          className="text-xs font-medium text-aqua-600 dark:text-aqua-400 hover:underline"
                        >
                          View profile →
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => (
                  <tr key={field.key} className="border-t border-gray-100 dark:border-slate-700">
                    <td className="py-2.5 pr-4 text-xs font-semibold text-gray-500 dark:text-slate-400">{field.label}</td>
                    {compareSel.map((item) => {
                      const value = field.extract(item)
                      return (
                        <td key={item._id} className="py-2.5 px-3 text-gray-800 dark:text-slate-200 capitalize">
                          {value || <span className="text-gray-300 dark:text-slate-600">—</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
