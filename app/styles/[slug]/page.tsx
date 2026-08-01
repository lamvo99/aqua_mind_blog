import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import Breadcrumb from "@/app/components/Breadcrumb"
import { client, urlFor } from "@/lib/sanity"
import { STYLES } from "@/lib/styles"
import { Layers, Palette, ArrowRight } from "lucide-react"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 86400

export function generateStaticParams() {
  return STYLES.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const style = STYLES.find((s) => s.slug === slug)
  if (!style) return { title: "Not found" }
  return {
    title: `${style.name} Aquascaping Style Guide — AquaMind`,
    description: style.summary,
    alternates: { canonical: `https://aquamind.life/styles/${slug}` },
  }
}

async function getInspiration(styleName: string) {
  return await client.fetch(
    `*[_type == "inspiration" && style == $styleName && defined(title)] | order(publishedAt desc) {
      _id, title, slug, excerpt, mainImage, style, difficulty, tankSizeL
    }`,
    { styleName }
  )
}

export default async function StylePage({ params }: Props) {
  const { slug } = await params
  const style = STYLES.find((s) => s.slug === slug)
  if (!style) notFound()

  const inspiration = await getInspiration(style.name)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Inspiration", href: "/inspiration" }, { label: style.name }]} />
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-2 text-aqua-600 dark:text-aqua-400 text-sm font-medium mb-2">
          <Layers className="w-4 h-4" />
          Style guide
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-2">{style.name}</h1>
        <p className="text-lg text-gray-500 dark:text-slate-400 mb-5">{style.tagline}</p>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed max-w-3xl">{style.summary}</p>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-aqua-500" />
          Key principles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {style.principles.map((p) => (
            <div key={p.title} className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5">
              <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-1.5">{p.title}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-10 p-6 rounded-2xl bg-aqua-50 dark:bg-aqua-950/30 border border-aqua-100 dark:border-aqua-900/50">
        <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-2">Who is it for?</h2>
        <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{style.bestFor}</p>
      </div>

      <div className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">Getting started</h2>
        <ol className="space-y-3">
          {style.steps.map((step, i) => (
            <li key={i} className="flex gap-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4">
              <span className="w-7 h-7 shrink-0 rounded-lg gradient-bg text-white text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed pt-1">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      {inspiration.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">
            {style.name} setups in our gallery
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {inspiration.map((item: any) => (
              <Link
                key={item._id}
                href={`/inspiration/${item.slug?.current}`}
                className="group rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-aqua-300 dark:hover:border-aqua-800 transition-all card-hover"
              >
                <div className="relative aspect-[4/3] bg-aqua-50 dark:bg-slate-900">
                  {item.mainImage ? (
                    <Image
                      src={urlFor(item.mainImage).width(600).height(450).url()}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🌿</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
                    {item.title}
                  </h3>
                  {item.tankSizeL && <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{item.tankSizeL} L</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 text-center">
        <Link
          href="/inspiration"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-all"
        >
          Browse all inspiration
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
