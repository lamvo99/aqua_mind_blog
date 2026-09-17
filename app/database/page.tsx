import type { Metadata } from "next"
import Link from "next/link"
import { databaseCategories } from "@/lib/navigation"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld"
import { ArrowRight, Search, Sparkles, Wrench } from "lucide-react"

export const metadata: Metadata = {
  title: "Aquarium Database — Fish, Plants, Corals & Equipment",
  description: "Searchable database of 404 aquarium species, plants, corals, equipment & invertebrates with care parameters, compatibility & relationships.",
  alternates: { canonical: "https://aquamind.life/database" },
  openGraph: {
    title: "Aquarium Database — Fish, Plants, Corals & Equipment",
    description: "Searchable database of 404 aquarium species, plants, corals, equipment & invertebrates with care parameters, compatibility & relationships.",
    type: "website",
    locale: "en_US",
  },
}

const totalEntities = databaseCategories.reduce((sum, c) => sum + c.count, 0) + 50

export default function DatabasePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd data={breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Database" },
      ])} />
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Database" }]} />
      </div>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Database</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed max-w-2xl">
          {totalEntities} curated entries across fish, invertebrates, plants, corals, equipment and problems — with care parameters, compatibility data and relationship links.
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-aqua-300 dark:hover:border-aqua-700 hover:shadow-md transition-all"
        >
          <Search className="w-4 h-4 text-aqua-500" />
          Search all entries
        </Link>
        <Link
          href="/finder"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-aqua-300 dark:hover:border-aqua-700 hover:shadow-md transition-all"
        >
          <Sparkles className="w-4 h-4 text-aqua-500" />
          Finder
        </Link>
        <Link
          href="/wiki"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-aqua-300 dark:hover:border-aqua-700 hover:shadow-md transition-all"
        >
          <Wrench className="w-4 h-4 text-aqua-500" />
          Wiki
        </Link>
      </div>

      {/* Entity categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {databaseCategories.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className="group rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-aqua-300 dark:hover:border-aqua-800 transition-all card-hover"
          >
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
                {cat.label}
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-aqua-50 dark:bg-aqua-950/50 text-aqua-600 dark:text-aqua-400">
                {cat.count}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{cat.description}</p>
            <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-aqua-600 dark:text-aqua-400">
              Browse
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>

      {/* Inspiration (separate surface) */}
      <div className="mt-6 p-5 rounded-2xl bg-aqua-50 dark:bg-aqua-950/30 border border-aqua-100 dark:border-aqua-900/50">
        <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-1">Inspiration</h2>
        <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
          Explore aquascaping styles, difficulty levels and curated setups.
        </p>
        <Link
          href="/inspiration"
          className="inline-flex items-center gap-1 text-sm font-medium text-aqua-600 dark:text-aqua-400 hover:text-aqua-700 dark:hover:text-aqua-300 transition-colors"
        >
          View inspiration
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
