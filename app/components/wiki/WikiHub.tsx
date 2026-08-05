"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Search, Thermometer, Droplets, Ruler, HelpCircle, SlidersHorizontal, X, Check } from "lucide-react"
import { urlFor } from "@/lib/sanity"

interface WikiItem {
  _id: string
  _type: "species" | "plant" | "coral" | "equipment"
  name: string
  scientificName?: string
  slug: { current: string }
  excerpt?: string
  mainImage?: any
  difficulty?: string
  origin?: string
  light?: string
  sizeCm?: number
  tempMinC?: number
  tempMaxC?: number
  phMin?: number
  phMax?: number
  brand?: string
  href: string
}

const TYPE_LABELS: Record<WikiItem["_type"], string> = {
  species: "Fish",
  plant: "Plants",
  coral: "Corals",
  equipment: "Equipment",
}

const TYPE_ORDER: WikiItem["_type"][] = ["species", "plant", "coral", "equipment"]

export default function WikiHub({ items }: { items: WikiItem[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [type, setType] = useState<"all" | WikiItem["_type"]>(
    (TYPE_ORDER.includes(searchParams.get("type") as WikiItem["_type"])
      ? (searchParams.get("type") as WikiItem["_type"])
      : "all")
  )
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [difficulty, setDifficulty] = useState(searchParams.get("diff") || "all")
  const [origin, setOrigin] = useState(searchParams.get("origin") || "all")
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    if (!sheetOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [sheetOpen])

  const syncUrl = (t: string, q: string, d: string, o: string) => {
    const params = new URLSearchParams()
    if (t !== "all") params.set("type", t)
    if (q) params.set("q", q)
    if (d !== "all") params.set("diff", d)
    if (o !== "all") params.set("origin", o)
    const qs = params.toString()
    router.replace(`/wiki${qs ? `?${qs}` : ""}`, { scroll: false })
  }

  const setFilter = (next: { type?: string; q?: string; diff?: string; origin?: string }) => {
    const t = next.type ?? type
    const q = next.q ?? query
    const d = next.diff ?? difficulty
    const o = next.origin ?? origin
    if (next.type !== undefined) setType(next.type as typeof type)
    if (next.q !== undefined) setQuery(next.q)
    if (next.diff !== undefined) setDifficulty(next.diff)
    if (next.origin !== undefined) setOrigin(next.origin)
    syncUrl(t, q, d, o)
  }

  const facetOptions = useMemo(() => {
    const difficulties = Array.from(new Set(items.map((i) => i.difficulty).filter(Boolean))) as string[]
    const origins = Array.from(new Set(items.filter((i) => i._type === "species").map((i) => i.origin).filter(Boolean))) as string[]
    return { difficulties: difficulties.sort(), origins: origins.sort() }
  }, [items])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length }
    for (const t of TYPE_ORDER) c[t] = items.filter((i) => i._type === t).length
    return c
  }, [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((i) => {
      if (type !== "all" && i._type !== type) return false
      if (difficulty !== "all" && i.difficulty !== difficulty) return false
      if (origin !== "all" && i.origin !== origin) return false
      if (q) {
        const hay = `${i.name} ${i.scientificName || ""} ${i.excerpt || ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [items, type, query, difficulty, origin])

  const activeFilterCount = (difficulty !== "all" ? 1 : 0) + (origin !== "all" ? 1 : 0)

  const tempRange = (item: WikiItem) =>
    item.tempMinC && item.tempMaxC ? `${item.tempMinC}–${item.tempMaxC}°C` : null
  const phRange = (item: WikiItem) =>
    item.phMin && item.phMax ? `pH ${item.phMin}–${item.phMax}` : null

  const renderFields = (inSheet: boolean) => (
    <div className={`${inSheet ? "space-y-4" : "hidden sm:flex sm:gap-3"}`}>
      {facetOptions.difficulties.length > 0 && (
        <select
          value={difficulty}
          onChange={(e) => setFilter({ diff: e.target.value })}
          aria-label="Filter by difficulty"
          className="w-full sm:w-auto px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-aqua-500/50"
        >
          <option value="all">Difficulty: all</option>
          {facetOptions.difficulties.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      )}
      {facetOptions.origins.length > 0 && (
        <select
          value={origin}
          onChange={(e) => setFilter({ origin: e.target.value })}
          aria-label="Filter by origin"
          className="w-full sm:w-auto px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-aqua-500/50"
        >
          <option value="all">Origin: all</option>
          {facetOptions.origins.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      )}
    </div>
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setFilter({ q: e.target.value })}
            placeholder="Search wiki…"
            aria-label="Search wiki"
            className="w-full pl-10 pr-4 py-2.5 min-h-11 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500/50 [&::-webkit-search-cancel-button]:hidden"
          />
        </div>

        <div className="flex gap-3 sm:hidden">
          <button
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            className="inline-flex items-center gap-2 px-4 min-h-11 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full gradient-bg text-white text-[11px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {renderFields(false)}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-6 pb-1" aria-label="Filter by type">
        <button
          aria-pressed={type === "all"}
          onClick={() => setFilter({ type: "all" })}
          className={`min-h-11 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            type === "all"
              ? "bg-aqua-500 text-white shadow-sm"
              : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-aqua-400"
          }`}
        >
          All ({counts.all})
        </button>
        {TYPE_ORDER.map((t) => (
          <button
            key={t}
            aria-pressed={type === t}
            onClick={() => setFilter({ type: t })}
            className={`min-h-11 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              type === t
                ? "bg-aqua-500 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-aqua-400"
            }`}
          >
            {TYPE_LABELS[t]} ({counts[t]})
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500 dark:text-slate-400 mb-4" role="status" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
      </p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((item) => (
            <Link
              key={item._id}
              href={item.href}
              className="group block rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 card-hover"
            >
              <div className="relative h-32 overflow-hidden bg-aqua-50 dark:bg-slate-900">
                {item.mainImage ? (
                  <Image
                    src={urlFor(item.mainImage).width(600).height(300).url() || ""}
                    alt={item.name}
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    loading="lazy"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    {item._type === "species" ? "🐠" : item._type === "plant" ? "🌿" : item._type === "coral" ? "🪸" : "⚙️"}
                  </div>
                )}
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur text-white text-[11px] font-medium rounded-md">
                  {TYPE_LABELS[item._type]}
                </span>
                {item.difficulty && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-aqua-500/90 text-white text-[11px] font-medium rounded-md">
                    {item.difficulty}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-0.5 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors line-clamp-1">
                  {item.name}
                </h2>
                {item.scientificName && (
                  <p className="text-xs italic text-gray-500 dark:text-slate-400 line-clamp-1 mb-2">{item.scientificName}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-slate-400">
                  {item.sizeCm ? (
                    <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{item.sizeCm} cm</span>
                  ) : item.brand ? (
                    <span className="flex items-center gap-1">{item.brand}</span>
                  ) : null}
                  {tempRange(item) ? (
                    <span className="flex items-center gap-1"><Thermometer className="w-3 h-3" />{tempRange(item)}</span>
                  ) : item.light ? (
                    <span className="flex items-center gap-1"><HelpCircle className="w-3 h-3" />{item.light}</span>
                  ) : null}
                  {phRange(item) && <span className="flex items-center gap-1"><Droplets className="w-3 h-3" />{phRange(item)}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Search className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
          <p className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-1">No entries match</p>
          <p className="text-gray-500 dark:text-slate-400 text-sm">Try different filters or search terms.</p>
        </div>
      )}

      {sheetOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:hidden" role="dialog" aria-modal="true" aria-label="Wiki filters">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSheetOpen(false)} aria-hidden="true" />
          <div
            onKeyDown={(e) => e.key === "Escape" && setSheetOpen(false)}
            className="relative w-full bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl p-5 pb-8 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">Filters</h2>
              <button onClick={() => setSheetOpen(false)} aria-label="Close filters" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {renderFields(true)}
            <button
              onClick={() => setSheetOpen(false)}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 min-h-11 gradient-bg text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
            >
              <Check className="w-4 h-4" />
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}