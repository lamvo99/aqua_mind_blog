import Link from "next/link"
import { toCategoryLink } from "@/lib/category-links"

const LINK_CLASS =
  "px-3 py-1 bg-aqua-50 dark:bg-aqua-950/50 text-aqua-700 dark:text-aqua-300 text-xs font-medium rounded-full hover:bg-aqua-100 dark:hover:bg-aqua-950 transition-colors"

const LABEL_CLASS =
  "px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-xs font-medium rounded-full"

/**
 * Article category chips. Valid categories link to the canonical
 * `/category/<slug>` route; unresolved/invalid categories render as labels.
 */
export default function CategoryChips({ categories }: { categories: unknown[] }) {
  if (!Array.isArray(categories) || categories.length === 0) return null

  return (
    <>
      {categories.map((category, index) => {
        const link = toCategoryLink(category as any)
        if (link) {
          return (
            <Link key={link.key} href={link.href} className={LINK_CLASS}>
              {link.title}
            </Link>
          )
        }

        const title =
          category && typeof category === "object" && typeof (category as any).title === "string"
            ? (category as any).title.trim()
            : ""
        if (!title) return null

        return (
          <span key={`category-label-${index}`} className={LABEL_CLASS}>
            {title}
          </span>
        )
      })}
    </>
  )
}
