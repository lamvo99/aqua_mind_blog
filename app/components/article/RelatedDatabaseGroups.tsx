import Link from "next/link"
import { BookOpen, Wrench } from "lucide-react"
import type { EntityTarget } from "@/lib/relationship-model"

const TYPE_LABELS: Record<string, string> = {
  species: "Fish",
  invertebrate: "Invertebrate",
  plant: "Plant",
  coral: "Coral",
  equipment: "Equipment",
  problem: "Problem",
}

interface RelatedDatabaseGroupsProps {
  entities: EntityTarget[]
  problems: EntityTarget[]
}

export default function RelatedDatabaseGroups({ entities, problems }: RelatedDatabaseGroupsProps) {
  if (entities.length === 0 && problems.length === 0) return null

  return (
    <section className="mt-12" aria-labelledby="explore-database-heading">
      <h2
        id="explore-database-heading"
        className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-1 flex items-center gap-2"
      >
        <BookOpen className="w-5 h-5 text-aqua-500" />
        Explore the database
      </h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">
        Entries this article explicitly references.
      </p>

      {entities.length > 0 && (
        <div aria-labelledby="related-entities-heading">
          <h3
            id="related-entities-heading"
            className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2"
          >
            Related entities
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {entities.map((entity) => (
              <Link
                key={entity.href}
                href={entity.href}
                className="group rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 hover:border-aqua-300 dark:hover:border-aqua-700 transition-colors"
              >
                <span className="text-xs font-medium text-aqua-700 dark:text-aqua-400 uppercase tracking-wide">
                  {TYPE_LABELS[entity.type] || entity.type}
                </span>
                <span className="mt-1 block font-semibold text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
                  {entity.label}
                </span>
                {entity.excerpt && (
                  <span className="mt-1 block text-sm text-gray-500 dark:text-slate-400 line-clamp-2">
                    {entity.excerpt}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {problems.length > 0 && (
        <div className={entities.length > 0 ? "mt-6" : ""} aria-labelledby="troubleshoot-heading">
          <h3
            id="troubleshoot-heading"
            className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2 flex items-center gap-2"
          >
            <Wrench className="w-4 h-4 text-aqua-500" />
            Troubleshoot
          </h3>
          <div className="flex flex-wrap gap-2">
            {problems.map((problem) => (
              <Link
                key={problem.href}
                href={problem.href}
                className="inline-flex items-center rounded-lg bg-white dark:bg-slate-800 border border-aqua-100 dark:border-aqua-900/50 px-3 py-1.5 text-sm font-medium text-aqua-700 dark:text-aqua-300 hover:bg-aqua-50 dark:hover:bg-aqua-950/50 transition-colors"
              >
                {problem.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
