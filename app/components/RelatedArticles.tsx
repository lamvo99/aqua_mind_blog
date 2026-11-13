import Link from "next/link"
import { formatDateShort } from "@/lib/utils"
import { BookOpen } from "lucide-react"
import { prepareArticleLinks } from "@/lib/article-links"

export default function RelatedArticles({
  items,
  currentSlug,
  title = "Related articles",
  headingId = "related-articles-heading",
}: {
  items: any[] | null | undefined
  currentSlug?: string
  title?: string
  headingId?: string
}) {
  const articles = prepareArticleLinks(items, currentSlug, 3)
  if (articles.length === 0) return null

  return (
    <section className="mt-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5" aria-labelledby={headingId}>
      <h2 id={headingId} className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-aqua-500" />
        {title}
      </h2>
      <div className="space-y-2">
        {articles.map((article) => (
          <Link
            key={article.slug.current}
            href={`/posts/${article.slug.current}`}
            className="group flex items-start justify-between gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium text-aqua-700 dark:text-aqua-300 group-hover:underline">
                {article.title}
              </span>
              {article.excerpt && (
                <span className="mt-0.5 block text-xs text-gray-500 dark:text-slate-400 line-clamp-2">
                  {article.excerpt}
                </span>
              )}
            </span>
            {article.publishedAt && (
              <span className="shrink-0 text-xs text-gray-400 dark:text-slate-500">
                {formatDateShort(article.publishedAt)}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
