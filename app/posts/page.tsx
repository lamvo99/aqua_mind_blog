import { getAllPosts, getAllCategories, getPostsByCategory } from "@/lib/posts"
import PostsPageClient from "./PostsPageClient"

export const dynamic = "force-dynamic"

export default async function PostsPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const categorySlug = searchParams?.category

  let posts
  if (categorySlug) {
    posts = await getPostsByCategory(categorySlug)
  } else {
    posts = await getAllPosts()
  }

  const categories = await getAllCategories()

  return <PostsPageClient posts={posts} categories={categories} categorySlug={categorySlug} />
}
