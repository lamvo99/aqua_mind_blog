import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { urlFor } from "@/lib/sanity"
import { getDatabaseItem, getDatabaseList } from "@/lib/database"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld"
import { ArrowLeft, Thermometer, Droplets, Ruler, Fish, Waves } from "lucide-react"
import WikiPromo from "@/app/components/database/WikiPromo"
import EntityResources from "@/app/components/EntityResources"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600

export async function generateStaticParams() {
  const items = await getDatabaseList("invertebrate")
  return items.map((item) => ({ slug: item.slug?.current }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const item = await getDatabaseItem("invertebrate", slug)
  if (!item) return { title: "Not found" }
  return {
    title: `${item.name} — Invertebrate Profile`,
    description: item.excerpt || `Care guide for ${item.name}`,
    alternates: { canonical: `https://aquamind.life/invertebrates/${slug}` },
    openGraph: {
      title: `${item.name} — Invertebrate Profile`,
      description: item.excerpt || `Care guide for ${item.name}`,
      type: "website",
      url: `https://aquamind.life/invertebrates/${slug}`,
      images: item.mainImage
        ? [{ url: urlFor(item.mainImage).width(1200).height(630).url(), width: 1200, height: 630, alt: `${item.name} — invertebrate profile` }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${item.name} — Invertebrate Profile`,
      description: item.excerpt || `Care guide for ${item.name}`,
    },
  }
}

function Parameter({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode
  label: string
  value?: string | number
}) {
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

const WATER_LABELS: Record<string, string> = {
  freshwater: "Freshwater",
  saltwater: "Saltwater",
  brackish: "Brackish",
}

export default async function InvertebrateDetailPage({ params }: Props) {
  const { slug } = await params
  const item = await getDatabaseItem("invertebrate", slug)
  if (!item) notFound()

  const range = (min?: number, max?: number, suffix = "") =>
    min !== undefined && max !== undefined && (min !== null) && (max !== null) ? `${min}–${max}${suffix}` : undefined

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Database", href: "/database" },
        { label: "Invertebrates", href: "/invertebrates" },
        { label: item.name, href: `/invertebrates/${slug}` },
      ])} />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Database", href: "/database" }, { label: "Invertebrates", href: "/invertebrates" }, { label: item.name }]} />

      <Link href="/invertebrates" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-aqua-600 dark:hover:text-aqua-400 mt-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Invertebrates
      </Link>

      <div className="grid lg:grid-cols-[380px_1fr] gap-8 mt-4">
        <div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-aqua-50 dark:bg-slate-900">
            {item.mainImage ? (
              <Image
                src={urlFor(item.mainImage).width(760).height(570).url() || ""}
                alt={`${item.name} — invertebrate${item.scientificName ? ` (${item.scientificName})` : ""}`}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🦐</div>
            )}
          </div>
          <WikiPromo />
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-1">{item.name}</h1>
          {item.scientificName && <p className="text-lg italic text-gray-500 dark:text-slate-400 mb-4">{item.scientificName}</p>}
          {item.excerpt && <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-6">{item.excerpt}</p>}

          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">Care Parameters</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Parameter icon={<Waves className="w-3.5 h-3.5" />} label="Water type" value={item.waterType ? (WATER_LABELS[item.waterType] || item.waterType) : undefined} />
            <Parameter icon={<Ruler className="w-3.5 h-3.5" />} label="Adult size" value={item.sizeCm ? `${item.sizeCm} cm` : undefined} />
            <Parameter icon={<Thermometer className="w-3.5 h-3.5" />} label="Temperature" value={range(item.tempMinC, item.tempMaxC, "°C")} />
            <Parameter icon={<Droplets className="w-3.5 h-3.5" />} label="pH" value={range(item.phMin, item.phMax)} />
            <Parameter icon={<Fish className="w-3.5 h-3.5" />} label="Diet" value={item.diet} />
            <Parameter label="Group" value={item.group} />
            <Parameter label="Temperament" value={item.temperament} />
            <Parameter label="Difficulty" value={item.difficulty} />
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
          <EntityResources type="invertebrate" />
        </div>
      </div>
    </div>
  )
}
