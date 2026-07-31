import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { urlFor } from "@/lib/sanity"
import { getDatabaseItem, getDatabaseList } from "@/lib/database"
import Breadcrumb from "@/app/components/Breadcrumb"
import { ArrowLeft, Droplets, Zap, Waves, Check, X } from "lucide-react"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const items = await getDatabaseList("equipment")
  return items.map((item) => ({ slug: item.slug?.current }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const item = await getDatabaseItem("equipment", slug)
  if (!item) return { title: "Not found" }
  return {
    title: `${item.brand ? item.brand + " " : ""}${item.name} — Equipment`,
    description: item.excerpt || `Equipment guide for ${item.name}`,
    alternates: { canonical: `https://aquamind.life/equipment/${slug}` },
  }
}

export default async function EquipmentDetailPage({ params }: Props) {
  const { slug } = await params
  const item = await getDatabaseItem("equipment", slug)
  if (!item) notFound()

  const specs: { label: string; value?: string | number }[] = [
    { label: "Category", value: item.category },
    { label: "Brand", value: item.brand },
    { label: "Model", value: item.model },
    { label: "Flow rate", value: item.flowRateLh ? `${item.flowRateLh} L/h` : undefined },
    { label: "Power", value: item.powerW ? `${item.powerW} W` : undefined },
    {
      label: "Suitable tank",
      value:
        item.tankSizeMinL !== undefined && item.tankSizeMaxL !== undefined && item.tankSizeMinL !== null && item.tankSizeMaxL !== null
          ? `${item.tankSizeMinL}–${item.tankSizeMaxL} L`
          : undefined,
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: "Database", href: "/database" }, { label: "Equipment", href: "/equipment" }, { label: item.name }]} />
      <Link href="/equipment" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-aqua-600 dark:hover:text-aqua-400 mt-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Equipment
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
            <div className="w-full h-full flex items-center justify-center text-6xl">⚙️</div>
          )}
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-1">
            {item.brand ? `${item.brand} ` : ""}{item.name}
          </h1>
          {item.excerpt && <p className="text-gray-600 dark:text-slate-300 leading-relaxed mt-2 mb-6">{item.excerpt}</p>}

          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">Specifications</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {specs.map((s) =>
              s.value !== undefined ? (
                <div key={s.label} className="rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 mb-1">
                    {s.label === "Flow rate" ? <Waves className="w-3.5 h-3.5" /> : s.label === "Power" ? <Zap className="w-3.5 h-3.5" /> : s.label === "Suitable tank" ? <Droplets className="w-3.5 h-3.5" /> : null}
                    {s.label}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{s.value}</div>
                </div>
              ) : null
            )}
          </div>

          {(item.pros?.length > 0 || item.cons?.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              {item.pros?.length > 0 && (
                <div className="p-4 rounded-2xl bg-green-50/60 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> Pros
                  </h3>
                  <ul className="space-y-1">
                    {item.pros.map((p: string, i: number) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-slate-300 flex gap-1.5">
                        <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {item.cons?.length > 0 && (
                <div className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                    <X className="w-4 h-4 text-red-500" /> Cons
                  </h3>
                  <ul className="space-y-1">
                    {item.cons.map((c: string, i: number) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-slate-300 flex gap-1.5">
                        <X className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" /> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
