import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getProblemDetail, getProblemsList } from "@/lib/database"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld"
import { ArrowLeft } from "lucide-react"
import ProblemTriage from "@/app/components/problems/ProblemTriage"
import KnowledgeHubLinks from "@/app/components/KnowledgeHubLinks"
import { problemCategoryIcon, problemCategoryLabel } from "@/lib/problem-taxonomy"
import { prepareArticleLinks } from "@/lib/article-links"
import { getHubLinksForEntity } from "@/lib/hubs"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600

export async function generateStaticParams() {
  const items = await getProblemsList()
  return items.filter((item) => !!item.slug?.current).map((item) => ({ slug: item.slug!.current }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const item = await getProblemDetail(slug)
  if (!item) return { title: "Not found" }
  return {
    title: `${item.title} — Aquarium Problem`,
    description: item.excerpt,
    alternates: { canonical: `https://www.aquamind.life/problems/${slug}` },
    openGraph: {
      title: `${item.title} — Aquarium Problem`,
      description: item.excerpt,
      type: "website",
      url: `https://www.aquamind.life/problems/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${item.title} — Aquarium Problem`,
      description: item.excerpt,
    },
  }
}

export default async function ProblemDetailPage({ params }: Props) {
  const { slug } = await params
  const item = await getProblemDetail(slug)
  if (!item) notFound()

  const relatedArticles = prepareArticleLinks(item.relatedPosts, undefined, 3)
  const hubLinks = await getHubLinksForEntity("problem")

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Problems", href: "/problems" },
        { label: item.title, href: `/problems/${slug}` },
      ])} />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Problems", href: "/problems" }, { label: item.title }]} />
      <Link href="/problems" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-aqua-600 dark:hover:text-aqua-400 mt-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        All problems
      </Link>

      <div className="mt-4 mb-6">
        <span className="px-3 py-1 rounded-lg bg-aqua-50 dark:bg-aqua-950/50 text-aqua-700 dark:text-aqua-300 text-xs font-semibold uppercase tracking-wide">
          {problemCategoryIcon(item.category)} {problemCategoryLabel(item.category)}
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mt-3">{item.title}</h1>
        {item.excerpt && <p className="text-lg text-gray-600 dark:text-slate-300 mt-2 leading-relaxed">{item.excerpt}</p>}
        {Array.isArray(item.tags) && item.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.map((tag: string) => (
              <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <ProblemTriage record={item} sources={item.evidenceSources || []} />

      {(relatedArticles.length > 0 || item.relatedTools?.some((t: any) => t?.slug?.current)) && (
        <div className="mt-6 p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">Recommended</h2>
          <div className="flex flex-wrap gap-2">
            {relatedArticles.map((p) => (
              <Link key={p.slug.current} href={`/posts/${p.slug.current}`} className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-aqua-100 dark:border-aqua-900/50 text-sm text-aqua-700 dark:text-aqua-300 hover:bg-aqua-50 dark:hover:bg-aqua-950/50 transition-colors">
                {p.title}
              </Link>
            ))}
            {item.relatedTools?.filter((t: any) => t?.slug?.current).map((t: any) => (
              <Link key={t._id} href={`/tools/${t.slug.current}`} className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-aqua-100 dark:border-aqua-900/50 text-sm text-aqua-700 dark:text-aqua-300 hover:bg-aqua-50 dark:hover:bg-aqua-950/50 transition-colors">
                Tool: {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <KnowledgeHubLinks links={hubLinks} />

      <p className="mt-8 text-xs text-gray-500 dark:text-slate-500 leading-relaxed">
        Informational guidance only. It does not replace a definitive diagnosis or professional veterinary advice.
      </p>
    </div>
  )
}
