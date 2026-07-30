import Link from "next/link"
import Image from "next/image"
import { getPostBySlug, getAllPosts } from "@/lib/posts"
import { urlFor } from "@/lib/sanity"
import { notFound } from "next/navigation"
import { formatDate, estimateReadingTime } from "@/lib/utils"
import PortableText from "@/app/components/PortableText"
import Comments from "@/app/components/Comments"
import NewsletterSection from "@/app/components/NewsletterSection"
import ReadingProgress from "@/app/components/ReadingProgress"
import RelatedPosts from "@/app/components/RelatedPosts"
import Breadcrumb from "@/app/components/Breadcrumb"
import LikeBookmark from "@/app/components/LikeBookmark"
import { JsonLd, articleSchema, breadcrumbSchema } from "@/lib/seo/jsonld"
import { Calendar, User, Clock, ArrowLeft } from "lucide-react"
import SocialShare from "@/app/components/SocialShare"
import TableOfContents from "@/app/components/TableOfContents"
import strings from "@/lib/i18n/strings"

export const dynamic = "force-dynamic"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aquamind.vn"

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post: any) => ({ slug: post.slug.current }))
}

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const { slug } = await paramsPromise
  const post = await getPostBySlug(slug)
  if (!post) return { title: strings.post.notFound }
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.mainImage ? [{ url: urlFor(post.mainImage).width(1200).url() }] : [],
      type: "article",
      publishedTime: post.publishedAt,
      authors: post.author ? [post.author.name] : [],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt },
    alternates: { canonical: `${siteUrl}/posts/${slug}` },
  }
}

export default async function PostDetailPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const { slug } = await paramsPromise
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const readingTime = estimateReadingTime(post.body)
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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12">
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

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              {post.categories?.map((cat: any) => (
                <Link
                  key={cat.slug.current}
                  href={`/posts?category=${cat.slug.current}`}
                  className="px-3 py-1 bg-aqua-50 dark:bg-aqua-950/50 text-aqua-700 dark:text-aqua-300 text-xs font-medium rounded-full hover:bg-aqua-100 dark:hover:bg-aqua-950 transition-colors"
                >
                  {cat.title}
                </Link>
              ))}
              {post.tags?.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-xs rounded-full">
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

          <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
            <div className="lg:order-2">
              <TableOfContents blocks={post.body} />
            </div>
            <div className="prose prose-lg max-w-none dark:prose-invert min-w-0 lg:order-1">
              <PortableText value={post.body} />
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
                  <h4 className="font-bold text-gray-900 dark:text-slate-100">{post.author.name}</h4>
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
        </div>

        <RelatedPosts currentSlug={slug} categories={post.categories?.map((c: any) => c.slug.current)} />
      </article>
    </>
  )
}
