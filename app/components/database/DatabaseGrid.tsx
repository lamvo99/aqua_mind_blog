"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { X, Scale, Trash2 } from "lucide-react"
import type { DatabaseItem } from "@/lib/database"
import { urlFor } from "@/lib/sanity"
import { COMPARE_FIELDS, MAX_COMPARE } from "@/lib/compare"
import DatabaseCard from "./DatabaseCard"

interface DatabaseGridProps {
  items: DatabaseItem[]
  hrefPrefix: string
  filterKeys?: string[]
  compareItems?: DatabaseItem[]
  compareType?: "species" | "plant" | "coral" | "equipment"
}

export default function DatabaseGrid({ items, hrefPrefix, filterKeys = [], compareItems = [], compareType }: DatabaseGridProps) {
  const [filter, setFilter] = useState<string>("all")
  const [selected, setSelected] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)

  const comparePool = compareItems.length > 0 ? compareItems : items
  const byId = useMemo(() => Object.fromEntries(comparePool.map((i) => [i._id, i])), [comparePool])

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
          <p className="text-gray-900 dark:text-slate-100 font-medium mb-1">No entries yet</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            This database is being curated. Check back soon.
          </p>
        </div>
      )}

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
                    aria-label={`Remove ${item.name}`}
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
                aria-label="Clear compare"
                className="p-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

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
