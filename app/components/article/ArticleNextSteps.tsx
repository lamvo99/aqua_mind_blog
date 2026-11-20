import Link from "next/link"
import { Compass, Wrench, ArrowRight } from "lucide-react"
import type { ToolTarget } from "@/lib/relationship-model"
import type { HubLinkTarget } from "@/lib/article-relationships"

interface ArticleNextStepsProps {
  tools: ToolTarget[]
  hubs: HubLinkTarget[]
}

export default function ArticleNextSteps({ tools, hubs }: ArticleNextStepsProps) {
  if (tools.length === 0 && hubs.length === 0) return null

  return (
    <section className="mt-12" aria-labelledby="article-next-steps-heading">
      <h2
        id="article-next-steps-heading"
        className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4"
      >
        Next steps
      </h2>

      {tools.length > 0 && (
        <div aria-labelledby="related-tools-heading">
          <h3
            id="related-tools-heading"
            className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2 flex items-center gap-2"
          >
            <Wrench className="w-4 h-4 text-aqua-500" />
            Tools
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-4 py-3 hover:border-aqua-300 dark:hover:border-aqua-700 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
                  {tool.label}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-aqua-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {hubs.length > 0 && (
        <div className={tools.length > 0 ? "mt-6" : ""} aria-labelledby="knowledge-hubs-heading">
          <h3
            id="knowledge-hubs-heading"
            className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2 flex items-center gap-2"
          >
            <Compass className="w-4 h-4 text-aqua-500" />
            Knowledge hubs
          </h3>
          <div className="space-y-2">
            {hubs.map((hub) => (
              <Link
                key={hub.href}
                href={hub.href}
                className="group flex items-start justify-between gap-3 rounded-xl bg-aqua-50 dark:bg-aqua-950/30 border border-aqua-100 dark:border-aqua-900/50 px-4 py-3 hover:border-aqua-300 dark:hover:border-aqua-700 transition-colors"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
                    {hub.label}
                  </span>
                  {hub.description && (
                    <span className="mt-0.5 block text-xs text-gray-500 dark:text-slate-400">
                      {hub.description}
                    </span>
                  )}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-aqua-500 mt-0.5 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
