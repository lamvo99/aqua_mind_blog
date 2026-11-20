import Link from "next/link"
import { BookOpen } from "lucide-react"
import { formatDateShort } from "@/lib/utils"
import type { ArticleTarget, LearningPathTarget } from "@/lib/relationship-model"

interface RelatedReadingProps {
  articles: ArticleTarget[]
  paths: LearningPathTarget[]
}

export default function RelatedReading({ articles, paths }: RelatedReadingProps) {
  if (articles.length === 0 && paths.length === 0) return null

  return (
    <section className="mt-12" aria-labelledby="related-reading-heading">
      <h2
        id="related-reading-heading"
        className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2"
      >
        <BookOpen className="w-5 h-5 text-aqua-500" />
        Related reading
      </h2>

      {articles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {articles.map((article) => (
            <Link
              key={article.href}
              href={article.href}
              className="group rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 hover:border-aqua-300 dark:hover:border-aqua-700 transition-colors"
            >
              <span className="block font-semibold text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
                {article.title}
              </span>
              {article.excerpt && (
                <span className="mt-1 block text-sm text-gray-500 dark:text-slate-400 line-clamp-2">
                  {article.excerpt}
                </span>
              )}
              {article.publishedAt && (
                <span className="mt-2 block text-xs text-gray-500 dark:text-slate-400">
                  {formatDateShort(article.publishedAt)}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      {paths.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">
            Part of this learning path
          </h3>
          <div className="flex flex-wrap gap-2">
            {paths.map((path) => (
              <Link
                key={path.href}
                href={path.href}
                className="inline-flex items-center rounded-lg bg-aqua-50 dark:bg-aqua-950/40 px-3 py-1.5 text-sm font-medium text-aqua-700 dark:text-aqua-300 hover:bg-aqua-100 dark:hover:bg-aqua-950/70 transition-colors"
              >
                {path.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
