import { getRelatedPosts } from "@/lib/posts"
import PostCard from "./PostCard"
import strings from "@/lib/i18n/strings"

export default async function RelatedPosts({
  currentSlug,
  categories,
}: {
  currentSlug: string
  categories?: string[]
}) {
  const related = await getRelatedPosts(currentSlug, categories || [])

  if (related.length === 0) return null

  return (
    <section className="bg-gray-50/50 dark:bg-slate-800/30 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-8">
          {strings.posts.relatedPosts}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {related.map((post: any) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      </div>
    </section>
  )
}
