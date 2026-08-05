import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { urlFor } from "@/lib/sanity"
import { getDatabaseItem, getDatabaseList } from "@/lib/database"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld"
import { ArrowLeft, Thermometer, Droplets, Ruler, Fish } from "lucide-react"
import WikiPromo from "@/app/components/database/WikiPromo"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600

export async function generateStaticParams() {
  const items = await getDatabaseList("species")
  return items.map((item) => ({ slug: item.slug?.current }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const item = await getDatabaseItem("species", slug)
  if (!item) return { title: "Not found" }
  return {
    title: `${item.name} — Fish Profile`,
    description: item.excerpt || `Care guide for ${item.name}`,
    alternates: { canonical: `https://aquamind.life/species/${slug}` },
    openGraph: {
      title: `${item.name} — Fish Profile`,
      description: item.excerpt || `Care guide for ${item.name}`,
      type: "article",
      url: `https://aquamind.life/species/${slug}`,
      images: item.mainImage
        ? [{ url: urlFor(item.mainImage).width(1200).height(630).url(), width: 1200, height: 630, alt: item.name }]
        : undefined,
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

export default async function SpeciesDetailPage({ params }: Props) {
  const { slug } = await params
  const item = await getDatabaseItem("species", slug)
  if (!item) notFound()

  const range = (min?: number, max?: number, suffix = "") =>
    min !== undefined && max !== undefined && (min !== null) && (max !== null) ? `${min}–${max}${suffix}` : undefined

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { label: "Database", href: "/database" },
        { label: "Fish", href: "/species" },
        { label: item.name, href: `/species/${slug}` },
      ])} />
      <Breadcrumb items={[{ label: "Database", href: "/database" }, { label: "Fish", href: "/species" }, { label: item.name }]} />

      <Link href="/species" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-aqua-600 dark:hover:text-aqua-400 mt-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Fish
      </Link>

      <div className="grid lg:grid-cols-[380px_1fr] gap-8 mt-4">
        <div>
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
              <div className="w-full h-full flex items-center justify-center text-6xl">🐠</div>
            )}
          </div>
          {item.compatibleSpecies && item.compatibleSpecies.length > 0 && (
            <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Compatible Species</h2>
              <div className="flex flex-wrap gap-2">
                {item.compatibleSpecies.map((c: any) => (
                  <Link
                    key={c._id}
                    href={`/species/${c.slug?.current}`}
                    className="px-3 py-1.5 rounded-lg bg-aqua-50 dark:bg-aqua-950/50 text-aqua-700 dark:text-aqua-300 text-sm hover:bg-aqua-100 dark:hover:bg-aqua-950 transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <WikiPromo />
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-1">{item.name}</h1>          {item.scientificName && <p className="text-lg italic text-gray-500 dark:text-slate-400 mb-4">{item.scientificName}</p>}
          {item.excerpt && <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-6">{item.excerpt}</p>}

          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">Care Parameters</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Parameter icon={<Ruler className="w-3.5 h-3.5" />} label="Adult size" value={item.sizeCm ? `${item.sizeCm} cm` : undefined} />
            <Parameter icon={<Droplets className="w-3.5 h-3.5" />} label="Min tank" value={item.tankSizeMinL ? `${item.tankSizeMinL} L` : undefined} />
            <Parameter icon={<Thermometer className="w-3.5 h-3.5" />} label="Temperature" value={range(item.tempMinC, item.tempMaxC, "°C")} />
            <Parameter icon={<Droplets className="w-3.5 h-3.5" />} label="pH" value={range(item.phMin, item.phMax)} />
            <Parameter icon={<Droplets className="w-3.5 h-3.5" />} label="GH" value={range(item.ghMin, item.ghMax, " dGH")} />
            <Parameter icon={<Fish className="w-3.5 h-3.5" />} label="Diet" value={item.diet} />
            <Parameter label="Temperament" value={item.temperament} />
            <Parameter label="Water zone" value={item.waterZone} />
            <Parameter label="Difficulty" value={item.difficulty} />
          </div>

          {item.schooling && (
            <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-1">Schooling</h3>
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{item.schooling}</p>
            </div>
          )}

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
