"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { urlFor } from "@/lib/sanity"

interface InspirationItem {
  _id: string
  title: string
  slug?: { current: string }
  excerpt?: string
  mainImage?: any
  style?: string
  difficulty?: string
  tankSizeL?: number
}

export default function InspirationGrid({ items }: { items: InspirationItem[] }) {
  const [style, setStyle] = useState<string>("all")
  const [difficulty, setDifficulty] = useState<string>("all")

  const styles = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.style).filter(Boolean) as string[])).sort()
  }, [items])

  const difficulties = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.difficulty).filter(Boolean) as string[])).sort()
  }, [items])

  const visible = useMemo(() => {
    return items.filter(
      (i) => (style === "all" || i.style === style) && (difficulty === "all" || i.difficulty === difficulty)
    )
  }, [items, style, difficulty])

  const chipClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
      active
        ? "gradient-bg text-white"
        : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
    }`

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {["all", ...styles].map((s) => (
          <button key={s} onClick={() => setStyle(s)} className={chipClass(style === s)}>
            {s === "all" ? "All styles" : s}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", ...difficulties].map((d) => (
          <button key={d} onClick={() => setDifficulty(d)} className={chipClass(difficulty === d)}>
            {d === "all" ? "All levels" : d}
          </button>
        ))}
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((item) => (
            <Link
              key={item._id}
              href={`/inspiration/${item.slug?.current}`}
              className="group rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-aqua-300 dark:hover:border-aqua-800 transition-all card-hover"
            >
              <div className="relative aspect-[4/3] bg-aqua-50 dark:bg-slate-900">
                {item.mainImage ? (
                  <Image
                    src={urlFor(item.mainImage).width(600).height(450).url() || ""}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🌿</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  {item.style && (
                    <span className="px-2 py-0.5 rounded-md bg-aqua-50 dark:bg-aqua-950/50 text-aqua-700 dark:text-aqua-300 text-[10px] font-semibold uppercase tracking-wide">
                      {item.style}
                    </span>
                  )}
                  {item.difficulty && (
                    <span className="text-[10px] text-gray-500 dark:text-slate-500">{item.difficulty}</span>
                  )}
                  {item.tankSizeL && (
                    <span className="text-xs text-gray-500 dark:text-slate-500">{item.tankSizeL} L</span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
                  {item.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <p className="text-gray-900 dark:text-slate-100 font-medium mb-1">No setups match these filters</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">Try a different style or difficulty level.</p>
        </div>
      )}
    </div>
  )
}
