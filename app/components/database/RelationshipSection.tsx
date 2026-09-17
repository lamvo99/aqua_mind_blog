"use client"

import Link from "next/link"
import Image from "next/image"
import { urlFor } from "@/lib/sanity"
import { ArrowRight } from "lucide-react"

interface RelationshipItem {
  _id: string
  name?: string
  title?: string
  slug?: { current: string }
  excerpt?: string
  mainImage?: any
  category?: string
  brand?: string
}

interface RelationshipSectionProps {
  title: string
  items: RelationshipItem[]
  hrefPrefix: string
  emptyMessage?: string
  maxVisible?: number
}

export default function RelationshipSection({
  title,
  items,
  hrefPrefix,
  emptyMessage,
  maxVisible = 6,
}: RelationshipSectionProps) {
  if (!items || items.length === 0) {
    if (emptyMessage) {
      return (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">{emptyMessage}</p>
        </div>
      )
    }
    return null
  }

  const visible = items.slice(0, maxVisible)
  const hasMore = items.length > maxVisible

  return (
    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{title}</h2>
        <span className="text-xs font-medium text-gray-400 dark:text-slate-500">{items.length}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visible.map((item) => (
          <Link
            key={item._id}
            href={`${hrefPrefix}/${item.slug?.current}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 hover:border-aqua-300 dark:hover:border-aqua-800 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua-500"
          >
            {item.mainImage ? (
              <Image
                src={urlFor(item.mainImage).width(48).height(48).url() || ""}
                alt={item.name || item.title || ""}
                width={48}
                height={48}
                loading="lazy"
                className="w-10 h-10 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-aqua-100 dark:bg-aqua-900/50 flex items-center justify-center shrink-0 text-aqua-600 dark:text-aqua-400 text-xs font-bold">
                {(item.name || item.title || "?")[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                {item.name || item.title}
              </p>
              {item.excerpt && (
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{item.excerpt}</p>
              )}
              {item.category && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-aqua-100 dark:bg-aqua-900/50 text-aqua-700 dark:text-aqua-300 mt-0.5 inline-block">
                  {item.category}
                </span>
              )}
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600 shrink-0 group-hover:text-aqua-500" />
          </Link>
        ))}
      </div>
      {hasMore && (
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
          Showing {maxVisible} of {items.length}
        </p>
      )}
    </div>
  )
}
