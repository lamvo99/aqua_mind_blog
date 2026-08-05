import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getAllCategories, getPostsByCategory } from "@/lib/posts"
import { client } from "@/lib/sanity"
import { groupForCategory } from "@/lib/categories"
import PostCard from "@/app/components/PostCard"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema, collectionPageSchema } from "@/lib/seo/jsonld"
import strings from "@/lib/i18n/strings"

export const revalidate = 3600

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aquamind.life"

export async function generateStaticParams() {
  const categories = await getAllCategories()
  const slugs = await Promise.all(
    categories.map(async (cat: any) => {
      const count = await client.fetch(
        `count(*[_type == "post" && defined(publishedAt) && $slug in categories[]->slug.current])`,
        { slug: cat.slug.current }
      )
      return count > 0 ? { slug: cat.slug.current } : null
    })
  )
  return slugs.filter(Boolean)
}

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await paramsPromise
  const categories = await getAllCategories()
  const category = categories.find((c: any) => c.slug.current === slug)
  if (!category) return { title: strings.post.notFound }
  const [posts] = await Promise.all([getPostsByCategory(slug)])
  const title = `${category.title} — AquaMind`
  return {
    title,
    description: category.description || `All articles in ${category.title} on AquaMind.`,
    alternates: { canonical: `${siteUrl}/category/${slug}` },
    robots: posts.length === 0 ? { index: false } : undefined,
    openGraph: {
      title,
      description: category.description || `All articles in ${category.title} on AquaMind.`,
      type: "website",
      url: `${siteUrl}/category/${slug}`,
    },
  }
}

export default async function CategoryPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await paramsPromise
  const [categories, posts] = await Promise.all([getAllCategories(), getPostsByCategory(slug)])
  const category = categories.find((c: any) => c.slug.current === slug)
  if (!category) notFound()

  const group = groupForCategory(slug)

  const siblings = group
    ? await Promise.all(
        categories
          .filter((c: any) => c.slug.current !== slug && groupForCategory(c.slug.current)?.id === group.id)
          .map(async (c: any) => {
            const count = await client.fetch(
              `count(*[_type == "post" && defined(publishedAt) && $slug in categories[]->slug.current])`,
              { slug: c.slug.current }
            )
            return count > 0 ? { slug: c.slug.current, title: c.title, count } : null
          })
      )
    : []
  const related = siblings.filter(Boolean).sort((a: any, b: any) => b.count - a.count).slice(0, 5)

  const breadcrumbItems = [
    { label: strings.nav.posts, href: "/posts" },
    ...(group ? [{ label: group.label, href: "/posts" }] : []),
    { label: category.title },
  ]

  return (
    <>
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
      <JsonLd
        data={collectionPageSchema({
          name: category.title,
          description: category.description || undefined,
          url: `${siteUrl}/category/${slug}`,
          items: posts.map((p: any) => ({
            title: p.title,
            url: `${siteUrl}/posts/${p.slug.current}`,
          })),
        })}
      />
      <div className="min-h-screen bg-gray-50/50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="mb-4">
            <Breadcrumb items={breadcrumbItems} />
          </div>
          <div className="max-w-3xl mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100">
              {category.title}
            </h1>
            {category.description && (
              <p className="text-gray-500 dark:text-slate-400 mt-3 leading-relaxed">
                {category.description}
              </p>
            )}
            {!category.description && group?.description && (
              <p className="text-gray-500 dark:text-slate-400 mt-3 leading-relaxed">
                {group.description}
              </p>
            )}
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-3">
              {posts.length} {posts.length === 1 ? "article" : "articles"}
            </p>
            {group && (
              <Link
                href="/posts"
                className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-aqua-600 dark:text-aqua-400 hover:text-aqua-700 dark:hover:text-aqua-300 transition-colors"
              >
                <span className="text-xs">{group.label}</span>
                <span className="text-aqua-500">→</span>
              </Link>
            )}
          </div>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post: any, index: number) => (
                <PostCard key={post._id} post={post} priority={index < 3} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-1">
                {strings.posts.noPosts}
              </p>
              <Link
                href="/posts"
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 gradient-bg text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all"
              >
                {strings.posts.back}
              </Link>
            </div>
          )}

          {related.length > 0 && (
            <nav aria-label="Related categories" className="mt-14">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">
                {group?.label ? `More in ${group.label}` : "Related categories"}
              </h2>
              <div className="flex flex-wrap gap-2">
                {related.map((rel: any) => (
                  <Link
                    key={rel.slug}
                    href={`/category/${rel.slug}`}
                    className="inline-flex items-center gap-2 px-4 min-h-11 rounded-full text-sm font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-aqua-400 hover:text-aqua-600 dark:hover:text-aqua-400 transition-all"
                  >
                    {rel.title}
                    <span className="text-xs text-gray-400">{rel.count}</span>
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </div>
      </div>
    </>
  )
}
