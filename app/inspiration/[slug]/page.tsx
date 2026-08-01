import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { urlFor } from "@/lib/sanity"
import { client } from "@/lib/sanity"
import { getInspirationList } from "@/lib/database"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld"
import { ArrowLeft, BookOpen } from "lucide-react"
import { getStylePillar } from "@/lib/styles"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600

export async function generateStaticParams() {
  const items = await getInspirationList()
  return items.map((item) => ({ slug: item.slug?.current }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const item = await client.fetch(
    `*[_type == "inspiration" && slug.current == $slug][0] { title, excerpt, mainImage }`,
    { slug }
  )
  if (!item) return { title: "Not found" }
  return {
    title: `${item.title} — Aquascape Inspiration`,
    description: item.excerpt,
    alternates: { canonical: `https://aquamind.life/inspiration/${slug}` },
    openGraph: {
      title: `${item.title} — Aquascape Inspiration`,
      description: item.excerpt,
      type: "article",
      url: `https://aquamind.life/inspiration/${slug}`,
      images: item.mainImage
        ? [{ url: urlFor(item.mainImage).width(1200).height(630).url(), width: 1200, height: 630, alt: item.title }]
        : undefined,
    },
  }
}

export default async function InspirationDetailPage({ params }: Props) {
  const { slug } = await params
  const item = await client.fetch(
    `*[_type == "inspiration" && slug.current == $slug][0] {
      _id, title, excerpt, style, tankSizeL, difficulty, hardscape, publishedAt,
      mainImage,
      plants[]->{ _id, name, slug },
      equipment[]->{ _id, name, brand, slug },
      relatedPosts[]->{ _id, title, slug }
    }`,
    { slug }
  )
  if (!item) notFound()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { label: "Inspiration", href: "/inspiration" },
        { label: item.title, href: `/inspiration/${slug}` },
      ])} />
      <Breadcrumb items={[{ label: "Inspiration", href: "/inspiration" }, { label: item.title }]} />
      <Link href="/inspiration" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-aqua-600 dark:hover:text-aqua-400 mt-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        All inspiration
      </Link>

      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {item.style && (
            <Link
              href={`/styles/${getStylePillar(item.style)?.slug || item.style.toLowerCase().replace(/\s+/g, "-")}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-aqua-50 dark:bg-aqua-950/50 text-aqua-700 dark:text-aqua-300 text-xs font-semibold uppercase tracking-wide hover:bg-aqua-100 dark:hover:bg-aqua-950/80 transition-colors"
            >
              <BookOpen className="w-3 h-3" />
              {item.style} guide
            </Link>
          )}
          {item.tankSizeL && <span className="text-sm text-gray-500 dark:text-slate-400">{item.tankSizeL} L</span>}
          {item.difficulty && <span className="text-sm text-gray-500 dark:text-slate-400 capitalize">Difficulty: {item.difficulty}</span>}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-6">{item.title}</h1>
      </div>

      {item.mainImage && (
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-aqua-50 dark:bg-slate-900 mb-6">
          <Image
            src={urlFor(item.mainImage).width(1600).url() || ""}
            alt={item.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {item.excerpt && <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed mb-6">{item.excerpt}</p>}

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {item.plants?.length > 0 && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Plants</h2>
            <div className="flex flex-wrap gap-1.5">
              {item.plants.map((p: any) => (
                <Link key={p._id} href={`/plants/${p.slug?.current}`} className="px-2 py-1 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 text-xs hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors">
                  {p.name}
                </Link>
              ))}
            </div>
          </div>
        )}
        {item.equipment?.length > 0 && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Equipment</h2>
            <div className="flex flex-wrap gap-1.5">
              {item.equipment.map((e: any) => (
                <Link key={e._id} href={`/equipment/${e.slug?.current}`} className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors">
                  {e.brand ? `${e.brand} ` : ""}{e.name}
                </Link>
              ))}
            </div>
          </div>
        )}
        {item.hardscape && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Hardscape</h2>
            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{item.hardscape}</p>
          </div>
        )}
      </div>

      {item.relatedPosts?.length > 0 && (
        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">Related Articles</h2>
          <div className="flex flex-wrap gap-2">
            {item.relatedPosts.map((p: any) => (
              <Link key={p._id} href={`/posts/${p.slug?.current}`} className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-aqua-100 dark:border-aqua-900/50 text-sm text-aqua-700 dark:text-aqua-300 hover:bg-aqua-50 dark:hover:bg-aqua-950/50 transition-colors">
                {p.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
