import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Layers } from "lucide-react"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld"
import { STYLES } from "@/lib/styles"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Aquascaping Styles",
  description:
    "Explore the aquascaping styles covered by AquaMind: Iwagumi, Dutch, Nature Aquarium, jungle, biotope, Walstad, reef and paludarium.",
  alternates: { canonical: "https://www.aquamind.life/styles" },
  openGraph: {
    title: "Aquascaping Styles",
    description:
      "Explore the aquascaping styles covered by AquaMind: Iwagumi, Dutch, Nature Aquarium, jungle, biotope, Walstad, reef and paludarium.",
    type: "website",
    locale: "en_US",
    url: "https://www.aquamind.life/styles",
  },
}

export default function StylesIndexPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Aquascaping styles" },
        ])}
      />
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Aquascaping styles" }]} />
      </div>

      <div className="mb-10 max-w-3xl">
        <div className="flex items-center gap-2 text-aqua-700 dark:text-aqua-400 text-sm font-medium mb-2">
          <Layers className="w-4 h-4" />
          Style guides
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">
          Aquascaping styles
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed">
          Explore the aquascaping styles covered by AquaMind. Each guide explains the design principles,
          planting approach and maintenance demands of a style.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {STYLES.map((style) => (
          <Link
            key={style.slug}
            href={`/styles/${style.slug}`}
            className="group rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-aqua-300 dark:hover:border-aqua-800 transition-all"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 group-hover:text-aqua-700 dark:group-hover:text-aqua-400 transition-colors">
              {style.name}
            </h2>
            <p className="mt-1 text-sm font-medium text-gray-600 dark:text-slate-300">{style.tagline}</p>
            <p className="mt-3 text-sm text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-3">
              {style.summary}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-aqua-700 dark:text-aqua-400">
              Read style guide
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
