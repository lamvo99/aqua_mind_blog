import Link from "next/link"
import { AlertCircle, BookOpen, ArrowRight } from "lucide-react"
import type { EntityTarget, ToolGuideTarget } from "@/lib/relationship-model"

interface ToolRelationshipGroupsProps {
  problems: EntityTarget[]
  guides: ToolGuideTarget[]
}

export default function ToolRelationshipGroups({ problems, guides }: ToolRelationshipGroupsProps) {
  if (problems.length === 0 && guides.length === 0) return null

  const guidesHeading = guides.some((guide) => guide.kind === "article") ? "Related guides" : "Related resources"

  return (
    <section className="mt-8" aria-label="Tool relationships">
      {problems.length > 0 && (
        <div
          className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700"
          aria-labelledby="tool-problems-heading"
        >
          <h2
            id="tool-problems-heading"
            className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-aqua-500" />
            Troubleshoot related problems
          </h2>
          <div className="flex flex-wrap gap-2">
            {problems.map((problem) => (
              <Link
                key={problem.href}
                href={problem.href}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-sm text-aqua-700 dark:text-aqua-300 border border-aqua-100 dark:border-aqua-900/50 hover:bg-aqua-50 dark:hover:bg-aqua-950/50 transition-colors"
              >
                {problem.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {guides.length > 0 && (
        <div
          className={`p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 ${problems.length > 0 ? "mt-4" : ""}`}
          aria-labelledby="tool-guides-heading"
        >
          <h2
            id="tool-guides-heading"
            className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-aqua-500" />
            {guidesHeading}
          </h2>
          <div className="flex flex-wrap gap-2">
            {guides.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-sm text-aqua-700 dark:text-aqua-300 border border-aqua-100 dark:border-aqua-900/50 hover:bg-aqua-50 dark:hover:bg-aqua-950/50 transition-colors"
              >
                {guide.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
