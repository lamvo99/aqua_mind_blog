import Link from "next/link"
import { getDatabaseItemsReferencingPost } from "@/lib/database"
import { BookOpen } from "lucide-react"

const TYPE_LABEL: Record<string, string> = {
  species: "Fish",
  plant: "Plant",
  coral: "Coral",
  equipment: "Equipment",
  problem: "Guide",
}

const TYPE_PATH: Record<string, string> = {
  species: "/species",
  plant: "/plants",
  coral: "/corals",
  equipment: "/equipment",
  problem: "/problems",
}

export default async function RelatedDatabase({ postId }: { postId: string }) {
  const items = await getDatabaseItemsReferencingPost(postId)

  if (items.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-aqua-500" />
        Keep Learning: Related Database Entries
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item: any) => (
          <Link
            key={`${item._type}-${item.slug?.current}`}
            href={`${TYPE_PATH[item._type] || ""}/${item.slug?.current}`}
            className="group rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 hover:border-aqua-300 dark:hover:border-aqua-700 transition-colors"
          >
            <span className="text-xs font-medium text-aqua-600 dark:text-aqua-400 uppercase tracking-wide">
              {TYPE_LABEL[item._type] || item._type}
            </span>
            <p className="mt-1 font-semibold text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
              {item.name}
            </p>
            {item.excerpt && (
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400 line-clamp-2">{item.excerpt}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
