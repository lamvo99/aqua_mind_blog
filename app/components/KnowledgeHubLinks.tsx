import Link from "next/link"
import { Compass, ArrowRight } from "lucide-react"
import type { HubLink } from "@/lib/hubs"

export default function KnowledgeHubLinks({
  links,
  title = "Continue learning",
}: {
  links: HubLink[]
  title?: string
}) {
  if (links.length === 0) return null

  return (
    <section className="mt-6 rounded-2xl bg-aqua-50 dark:bg-aqua-950/30 border border-aqua-100 dark:border-aqua-900/50 p-5" aria-labelledby="knowledge-hub-links-heading">
      <h2 id="knowledge-hub-links-heading" className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
        <Compass className="w-4 h-4 text-aqua-500" />
        {title}
      </h2>
      <div className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-start justify-between gap-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-4 py-3 hover:border-aqua-300 dark:hover:border-aqua-700 transition-colors"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
                {link.label}
              </span>
              <span className="mt-0.5 block text-xs text-gray-500 dark:text-slate-400">{link.description}</span>
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-aqua-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
          </Link>
        ))}
      </div>
    </section>
  )
}
