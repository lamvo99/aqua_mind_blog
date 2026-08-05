import { getAllPosts, getAllCategories } from "@/lib/posts"
import PostsPageClient from "./PostsPageClient"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "All Articles",
  description: "Aquascaping and aquarium care articles: cycling, fish selection, planted tanks, water quality, filters and maintenance.",
  alternates: { canonical: "https://aquamind.life/posts" },
}

export default async function PostsPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ category?: string; group?: string; page?: string }>
}) {
  const searchParams = await searchParamsPromise
  const categorySlug = searchParams?.category
  const group = searchParams?.group
  const initialPage = Math.max(1, Number(searchParams?.page) || 1)

  const [posts, categories] = await Promise.all([getAllPosts(), getAllCategories()])

  return (
    <PostsPageClient
      posts={posts}
      categories={categories}
      categorySlug={categorySlug}
      group={group}
      initialPage={initialPage}
    />
  )
}
