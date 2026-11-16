import { getAllPosts, getAllCategories } from "@/lib/posts"
import { POSTS_PER_PAGE, parsePageParam, parseRequestedPage } from "@/lib/pagination"
import PostsPageClient from "./PostsPageClient"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

export const revalidate = 300

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.aquamind.life"

const postsDescription =
  "Aquascaping and aquarium care articles: cycling, fish selection, planted tanks, water quality, filters and maintenance."

export async function generateMetadata({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ category?: string; group?: string; page?: string | string[] }>
}): Promise<Metadata> {
  const searchParams = await searchParamsPromise
  const requested = parseRequestedPage(searchParams?.page)

  // Valid pages beyond page 1 are cumulative duplicates of the listing
  // (page N renders page 1..N), so they stay crawlable but are not indexed.
  // Out-of-range pages render the framework 404 UI, so they must not carry a
  // "Page N" title.
  const posts = await getAllPosts()
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE))
  const outOfRange = requested !== null && requested > totalPages
  const page = requested ?? 1
  const isPaginated = page > 1 && !outOfRange

  if (outOfRange) {
    return {
      title: "All Articles",
      description: postsDescription,
      alternates: { canonical: `${siteUrl}/posts` },
      robots: { index: false, follow: true },
    }
  }

  return {
    title: isPaginated ? `All Articles — Page ${page}` : "All Articles",
    description: postsDescription,
    alternates: { canonical: `${siteUrl}/posts` },
    ...(isPaginated ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function PostsPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ category?: string; group?: string; page?: string | string[] }>
}) {
  const searchParams = await searchParamsPromise
  const categorySlug = searchParams?.category
  const group = searchParams?.group

  const [posts, categories] = await Promise.all([getAllPosts(), getAllCategories()])

  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE))
  const { page: initialPage, outOfRange } = parsePageParam(searchParams?.page, totalPages)
  if (outOfRange) notFound()

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
