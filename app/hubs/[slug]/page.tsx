import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getAllHubs, getHub } from "@/lib/hubs"
import Breadcrumb from "@/app/components/Breadcrumb"
import PostCard from "@/app/components/PostCard"
import { JsonLd, breadcrumbSchema, collectionPageSchema } from "@/lib/seo/jsonld"
import { ArrowRight, BookOpen, Compass, Database } from "lucide-react"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600
export const dynamicParams = false

export async function generateStaticParams() {
  const hubs = await getAllHubs()
  return hubs.map((hub) => ({ slug: hub.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const hub = await getHub(slug)
  if (!hub) return { title: "Not found" }
  const canonical = `https://www.aquamind.life/hubs/${hub.slug}`
  return {
    title: `${hub.title}`,
    description: hub.description,
    alternates: { canonical },
    openGraph: {
      title: `${hub.title}`,
      description: hub.description,
      type: "website",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: `${hub.title}`,
      description: hub.description,
    },
  }
}

export default async function KnowledgeHubPage({ params }: Props) {
  const { slug } = await params
  const hub = await getHub(slug)
  if (!hub) notFound()

  const canonical = `https://www.aquamind.life/hubs/${hub.slug}`

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Knowledge hubs", href: "/hubs" },
          { label: hub.title, href: `/hubs/${hub.slug}` },
        ])}
      />
      <JsonLd
        data={collectionPageSchema({
          name: hub.title,
          description: hub.description,
          url: canonical,
          items: hub.articles.map((article) => ({
            title: article.title,
            url: `https://www.aquamind.life/posts/${article.slug.current}`,
          })),
        })}
      />

      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Knowledge hubs", href: "/hubs" },
            { label: hub.title },
          ]}
        />
      </div>

      <header className="max-w-3xl mb-10">
        <div className="flex items-center gap-2 text-aqua-600 dark:text-aqua-400 text-sm font-medium mb-2">
          <Compass className="w-4 h-4" />
          Knowledge hub
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">{hub.title}</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed">{hub.intro}</p>
        <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
          <span className="font-medium text-gray-700 dark:text-slate-300">Who it is for:</span> {hub.reader}
        </p>
      </header>

      {hub.articles.length > 0 && (
        <section aria-labelledby="hub-articles-heading" className="mb-12">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <h2 id="hub-articles-heading" className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                Start with these articles
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Published guides selected for this reader intent.
              </p>
            </div>
            <Link href="/posts" className="shrink-0 text-sm font-medium text-aqua-600 dark:text-aqua-400 hover:underline">
              All articles
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hub.articles.map((article, index) => (
              <PostCard key={article._id} post={article} priority={index === 0} />
            ))}
          </div>
        </section>
      )}

      {hub.databaseLinks.length > 0 && (
        <section aria-labelledby="hub-database-heading" className="mb-12">
          <h2 id="hub-database-heading" className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1 flex items-center gap-2">
            <Database className="w-5 h-5 text-aqua-500" />
            Explore the database
          </h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">
            Check the stored record or tool before acting on a general guide.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hub.databaseLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 hover:border-aqua-300 dark:hover:border-aqua-700 transition-colors"
              >
                <span className="block text-sm font-semibold text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
                  {link.label}
                </span>
                <span className="mt-1 block text-xs text-gray-500 dark:text-slate-400">{link.description}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {hub.collections.length > 0 && (
        <section aria-labelledby="hub-collections-heading" className="mb-12">
          <h2 id="hub-collections-heading" className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-aqua-500" />
            Go deeper
          </h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">
            Goal-based collections built from published database records.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hub.collections.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 hover:border-aqua-300 dark:hover:border-aqua-700 transition-colors"
              >
                <span className="block text-sm font-semibold text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
                  {link.label}
                </span>
                <span className="mt-1 block text-xs text-gray-500 dark:text-slate-400">{link.description}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-aqua-50 dark:bg-aqua-950/30 border border-aqua-100 dark:border-aqua-900/50 p-6" aria-labelledby="hub-next-heading">
        <h2 id="hub-next-heading" className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">
          {hub.nextStep.label}
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mb-4">{hub.nextStep.description}</p>
        <Link
          href={hub.nextStep.href}
          className="inline-flex items-center gap-2 rounded-xl bg-aqua-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-aqua-700 transition-colors"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  )
}
