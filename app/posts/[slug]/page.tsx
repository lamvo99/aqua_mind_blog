import Link from "next/link"
import Image from "next/image"
import { getPostBySlug, getAllPosts, getRelatedPosts } from "@/lib/posts"
import { urlFor } from "@/lib/sanity"
import { notFound } from "next/navigation"
import { formatDate, estimateReadingTime } from "@/lib/utils"
import PortableText from "@/app/components/PortableText"
import Comments from "@/app/components/Comments"
import NewsletterSection from "@/app/components/NewsletterSection"
import ReadingProgress from "@/app/components/ReadingProgress"
import RelatedReading from "@/app/components/article/RelatedReading"
import RelatedDatabaseGroups from "@/app/components/article/RelatedDatabaseGroups"
import ArticleNextSteps from "@/app/components/article/ArticleNextSteps"
import CategoryChips from "@/app/components/category/CategoryChips"
import Breadcrumb from "@/app/components/Breadcrumb"
import LikeBookmark from "@/app/components/LikeBookmark"
import { JsonLd, articleSchema, breadcrumbSchema } from "@/lib/seo/jsonld"
import { resolvePostSeo } from "@/lib/seo/post-metadata"
import { Calendar, User, Clock, ArrowLeft } from "lucide-react"
import SocialShare from "@/app/components/SocialShare"
import TableOfContents from "@/app/components/TableOfContents"
import { getHubLinksForPost } from "@/lib/hubs"
import { getDatabaseItemsReferencingPost } from "@/lib/database"
import { getLearningPathsForPost, getToolsReferencingPost } from "@/lib/relationship-data"
import { buildArticleRelationships } from "@/lib/article-relationships"
import { resourcesForCategory } from "@/lib/related"
import strings from "@/lib/i18n/strings"

export const revalidate = 3600
export const dynamicParams = false

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.aquamind.life"

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post: any) => ({ slug: post.slug.current }))
}

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const { slug } = await paramsPromise
  const post = await getPostBySlug(slug)
  // Unknown / unpublished slugs must not be indexable and must render the
  // framework 404 UI. (Metadata must resolve so robots/canonical survive.)
  if (!post) {
    return {
      title: strings.post.notFound,
      description: "The requested article could not be found.",
      robots: { index: false, follow: true },
      alternates: { canonical: `${siteUrl}/posts` },
    }
  }

  const { title: metaTitle, description: metaDescription, image: metaImage } = resolvePostSeo(post)

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      images: metaImage ? [{ url: urlFor(metaImage).width(1200).url() }] : [],
      type: "article",
      publishedTime: post.publishedAt,
      authors: post.author ? [post.author.name] : [],
    },
    twitter: { card: "summary_large_image", title: metaTitle, description: metaDescription },
    alternates: { canonical: `${siteUrl}/posts/${slug}` },
  }
}

export default async function PostDetailPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const { slug } = await paramsPromise
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const readingTime = estimateReadingTime(post.body)
  const categorySlugs: string[] = (post.categories || [])
    .map((category: any) => category?.slug?.current)
    .filter((value: unknown): value is string => typeof value === "string" && value.length > 0)

  const [hubLinks, fallbackPosts, databaseItems, reverseTools, learningPaths] = await Promise.all([
    getHubLinksForPost(post),
    getRelatedPosts(slug, categorySlugs),
    getDatabaseItemsReferencingPost(post._id, 16),
    getToolsReferencingPost(post._id, 6),
    getLearningPathsForPost(post._id),
  ])

  const relationships = buildArticleRelationships({
    postSlug: slug,
    explicitPosts: post.relatedPosts,
    fallbackPosts,
    databaseItems,
    reverseTools,
    fallbackToolLinks: resourcesForCategory(slug, post.title)
      .filter((resource) => resource.section === "tool")
      .map((resource) => ({ href: resource.href, label: resource.label })),
    learningPaths,
    hubLinks,
  })
  const imageUrl = post.mainImage ? urlFor(post.mainImage).width(1200).height(600).url() : null
  const pinterestImage = post.mainImage ? urlFor(post.mainImage).width(600).height(900).url() : null
  const breadcrumbItems = [
    { label: strings.nav.posts, href: "/posts" },
    { label: post.title },
  ]

  return (
    <>
      <ReadingProgress />
      <JsonLd data={articleSchema(post)} />
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
      <article>
        <header className="relative">
          {imageUrl ? (
            <div className="relative h-64 md:h-[450px]">
              <Image src={imageUrl} alt={post.title} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            </div>
          ) : (
            <div className="h-48 md:h-64 bg-gradient-to-br from-aqua-500 to-ocean-600" />
          )}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12">
              <Link
                href="/posts"
                className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {strings.posts.back}
              </Link>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70 mb-4">
                {post.author && (
                  <span className="flex items-center gap-2">
                    {post.author.image ? (
                      <Image
                        src={urlFor(post.author.image).width(28).height(28).url() || ""}
                        alt={post.author.name}
                        width={28}
                        height={28}
                        className="rounded-full ring-2 ring-white/20"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="font-medium text-white/90">{post.author.name}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(post.publishedAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {readingTime} {strings.posts.readingTime}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                {post.title}
              </h1>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryChips categories={post.categories || []} />
              {post.tags?.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-xs rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <LikeBookmark postSlug={slug} />
              <SocialShare
                url={`${siteUrl}/posts/${slug}`}
                title={post.title}
                description={post.excerpt}
                image={imageUrl || undefined}
                pinterestImage={pinterestImage || undefined}
              />
            </div>
          </div>

          {post.excerpt && (
            <p className="text-lg text-gray-600 dark:text-slate-400 italic mb-8 leading-relaxed border-l-4 border-aqua-400 pl-4">
              {post.excerpt}
            </p>
          )}

          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-8 lg:items-start">
            <div className="prose prose-lg max-w-none dark:prose-invert min-w-0">
              <PortableText value={post.body} />
            </div>
            <div className="min-w-0">
              <TableOfContents blocks={post.body} />
            </div>
          </div>

          {post.author && (
            <div className="mt-12 p-6 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700">
              <div className="flex items-start gap-4">
                {post.author.image ? (
                  <Image
                    src={urlFor(post.author.image).width(64).height(64).url() || ""}
                    alt={post.author.name}
                    width={64}
                    height={64}
                    className="rounded-xl shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-aqua-100 dark:bg-aqua-900 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-aqua-600 dark:text-aqua-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-slate-100">{post.author.name}</h3>
                  {post.author.bio && (
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {post.author.bio.map((b: any) => b.children?.map((c: any) => c.text).join(" ")).join(" ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <Comments postSlug={slug} />

        <div className="mt-12">
          <NewsletterSection />
        </div>

        <RelatedReading
          articles={relationships.reading.articles}
          paths={relationships.reading.paths}
        />

        <RelatedDatabaseGroups
          entities={relationships.database.entities}
          problems={relationships.database.problems}
        />

        <ArticleNextSteps
          tools={relationships.nextSteps.tools}
          hubs={relationships.nextSteps.hubs}
        />
      </div>
    </article>
    </>
  )
}
