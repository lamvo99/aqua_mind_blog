"use client"

import Link from "next/link"
import Image from "next/image"
import { Scale } from "lucide-react"
import { urlFor } from "@/lib/sanity"
import type { DatabaseItem } from "@/lib/database"

interface DatabaseCardProps {
  item: DatabaseItem
  href: string
  comparing?: boolean
  compareDisabled?: boolean
  onToggleCompare?: (item: DatabaseItem) => void
}

export default function DatabaseCard({ item, href, comparing = false, compareDisabled = false, onToggleCompare }: DatabaseCardProps) {
  return (
    <div className="group relative rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-aqua-300 dark:hover:border-aqua-800 transition-all card-hover">
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] bg-aqua-50 dark:bg-slate-900">
          {item.mainImage ? (
            <Image
              src={urlFor(item.mainImage).width(600).height(450).url() || ""}
              alt={item.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🐠</div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1">
            {item.category && (
              <span className="px-2 py-0.5 rounded-md bg-aqua-50 dark:bg-aqua-950/50 text-aqua-700 dark:text-aqua-300 text-[10px] font-semibold uppercase tracking-wide">
                {item.category}
              </span>
            )}
            {item.brand && (
              <span className="text-xs text-gray-500 dark:text-slate-500">{item.brand}</span>
            )}
          </div>
          <h3 className="font-bold text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
            {item.name}
          </h3>
          {item.scientificName && (
            <p className="text-xs italic text-gray-500 dark:text-slate-400">{item.scientificName}</p>
          )}
          {item.excerpt && (
            <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mt-1">{item.excerpt}</p>
          )}
        </div>
      </Link>
      {onToggleCompare && (
        <button
          type="button"
          aria-pressed={comparing}
          disabled={compareDisabled && !comparing}
          onClick={(e) => {
            e.stopPropagation()
            onToggleCompare(item)
          }}
          className={`absolute top-2 right-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold shadow-md transition-all ${
            comparing
              ? "gradient-bg text-white"
              : "bg-white/95 dark:bg-slate-900/90 text-gray-600 dark:text-slate-300 hover:text-aqua-600 dark:hover:text-aqua-400 disabled:opacity-40 disabled:cursor-not-allowed"
          }`}
        >
          <Scale className="w-3 h-3" />
          {comparing ? "Selected" : "Compare"}
        </button>
      )}
    </div>
  )
}
