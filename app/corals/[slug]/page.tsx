import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { urlFor } from "@/lib/sanity"
import { getDatabaseItem, getDatabaseList } from "@/lib/database"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld"
import { ArrowLeft, Sun, Wind, Droplets } from "lucide-react"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600

export async function generateStaticParams() {
  const items = await getDatabaseList("coral")
  return items.map((item) => ({ slug: item.slug?.current }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const item = await getDatabaseItem("coral", slug)
  if (!item) return { title: "Not found" }
  return {
    title: `${item.name} — Coral Profile`,
    description: item.excerpt || `Coral care guide for ${item.name}`,
    alternates: { canonical: `https://aquamind.life/corals/${slug}` },
    openGraph: {
      title: `${item.name} — Coral Profile`,
      description: item.excerpt || `Coral care guide for ${item.name}`,
      type: "article",
      url: `https://aquamind.life/corals/${slug}`,
      images: item.mainImage
        ? [{ url: urlFor(item.mainImage).width(1200).height(630).url(), width: 1200, height: 630, alt: item.name }]
        : undefined,
    },
  }
}

function Parameter({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: string | number }) {
  if (value === undefined || value === null || value === "") return null
  return (
    <div className="rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-3">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 capitalize">{value}</div>
    </div>
  )
}

export default async function CoralDetailPage({ params }: Props) {
  const { slug } = await params
  const item = await getDatabaseItem("coral", slug)
  if (!item) notFound()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { label: "Database", href: "/database" },
        { label: "Corals", href: "/corals" },
        { label: item.name, href: `/corals/${slug}` },
      ])} />
      <Breadcrumb items={[{ label: "Database", href: "/database" }, { label: "Corals", href: "/corals" }, { label: item.name }]} />
      <Link href="/corals" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-aqua-600 dark:hover:text-aqua-400 mt-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Corals
      </Link>

      <div className="grid lg:grid-cols-[380px_1fr] gap-8 mt-4">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-aqua-50 dark:bg-slate-900">
          {item.mainImage ? (
            <Image
              src={urlFor(item.mainImage).width(760).height(570).url() || ""}
              alt={item.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🪸</div>
          )}
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-1">{item.name}</h1>
          {item.scientificName && <p className="text-lg italic text-gray-500 dark:text-slate-400 mb-4">{item.scientificName}</p>}
          {item.excerpt && <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-6">{item.excerpt}</p>}

          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">Care Parameters</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Parameter icon={<Sun className="w-3.5 h-3.5" />} label="Light" value={item.light} />
            <Parameter icon={<Wind className="w-3.5 h-3.5" />} label="Flow" value={item.flow} />
            <Parameter label="Difficulty" value={item.difficulty} />
            <Parameter label="Placement" value={item.placement} />
            <Parameter label="Aggression" value={item.aggression} />
            <Parameter icon={<Droplets className="w-3.5 h-3.5" />} label="Reef safe" value={item.reefCompatibility !== undefined ? (item.reefCompatibility ? "Yes" : "No") : undefined} />
            <Parameter label="Temperature" value={item.tempMinC !== undefined && item.tempMaxC !== undefined && item.tempMinC !== null && item.tempMaxC !== null ? `${item.tempMinC}–${item.tempMaxC}°C` : undefined} />
          </div>

          {item.relatedPosts && item.relatedPosts.length > 0 && (
            <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Related Articles</h3>
              <div className="space-y-2">
                {item.relatedPosts.map((p: any) => (
                  <Link key={p._id} href={`/posts/${p.slug?.current}`} className="block text-sm text-aqua-600 dark:text-aqua-400 hover:underline">
                    {p.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
