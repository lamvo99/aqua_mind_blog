import Link from "next/link"
import { Droplets } from "lucide-react"
import type { CategoryLink } from "@/lib/category-links"

export default function CategoryGrid({ links }: { links: CategoryLink[] }) {
  if (links.length === 0) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {links.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className="group p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 card-hover text-center"
        >
          <div className="w-12 h-12 rounded-xl bg-aqua-50 dark:bg-aqua-950/50 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <Droplets className="w-5 h-5 text-aqua-600 dark:text-aqua-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
            {link.title}
          </h3>
          {link.description && (
            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1 line-clamp-2">
              {link.description}
            </p>
          )}
        </Link>
      ))}
    </div>
  )
}
