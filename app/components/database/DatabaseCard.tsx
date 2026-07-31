import Link from "next/link"
import Image from "next/image"
import { urlFor } from "@/lib/sanity"
import type { DatabaseItem } from "@/lib/database"

interface DatabaseCardProps {
  item: DatabaseItem
  href: string
}

export default function DatabaseCard({ item, href }: DatabaseCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-aqua-300 dark:hover:border-aqua-800 transition-all card-hover"
    >
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
  )
}
