import Link from "next/link"
import { Wrench, BookOpen, ArrowRight } from "lucide-react"
import { resourcesForCategory, type RelatedResource } from "@/lib/related"

const SECTION_ICONS = {
  tool: Wrench,
  learn: BookOpen,
  database: BookOpen,
} as const

const SECTION_LABELS = {
  tool: "Tools",
  learn: "Learn",
  database: "Explore",
} as const

export default function RelatedResources({ slug, title }: { slug: string; title: string }) {
  const resources = resourcesForCategory(slug, title)
  if (resources.length === 0) return null

  return (
    <div className="rounded-2xl bg-aqua-50 dark:bg-aqua-950/30 border border-aqua-100 dark:border-aqua-900/50 p-5">
      <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-3">
        Related resources
      </h2>
      <div className="flex flex-col gap-2">
        {resources.map((r: RelatedResource) => {
          const Icon = SECTION_ICONS[r.section]
          return (
            <Link
              key={r.href}
              href={r.href}
              className="group flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-4 py-3 hover:border-aqua-300 dark:hover:border-aqua-700 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-aqua-100 dark:bg-aqua-900/50 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-aqua-600 dark:text-aqua-400" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-aqua-600 dark:text-aqua-400 uppercase tracking-wide">
                  {SECTION_LABELS[r.section]}
                </span>
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors truncate">
                  {r.label}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-aqua-500 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
