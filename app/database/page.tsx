import type { Metadata } from "next"
import Link from "next/link"
import { databaseCategories } from "@/lib/navigation"
import { getDatabaseCounts, totalDatabaseCount, type DatabaseCountKey } from "@/lib/database-counts"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld"
import { ArrowRight, Search, Sparkles, Wrench, Compass, AlertCircle, BookOpen } from "lucide-react"

const COUNT_KEY_BY_HREF: Record<string, DatabaseCountKey> = {
  "/species": "species",
  "/invertebrates": "invertebrate",
  "/plants": "plant",
  "/corals": "coral",
  "/equipment": "equipment",
  "/problems": "problem",
}

// Keep the public headline and category badges aligned with Production.
export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const counts = await getDatabaseCounts()
  const total = totalDatabaseCount(counts)
  const description = total
    ? `Searchable database of ${total} aquarium species, plants, corals, equipment, invertebrates and problem guides with care parameters, compatibility and relationships.`
    : "Searchable database of aquarium fish, plants, corals, equipment and invertebrates with care parameters, compatibility and relationships."

  return {
    title: "Aquarium Database — Fish, Plants, Corals & Equipment",
    description,
    alternates: { canonical: "https://www.aquamind.life/database" },
    openGraph: {
      title: "Aquarium Database — Fish, Plants, Corals & Equipment",
      description,
      type: "website",
      locale: "en_US",
    },
  }
}

export default async function DatabasePage() {
  const counts = await getDatabaseCounts()
  const total = totalDatabaseCount(counts)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd data={breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Database" },
      ])} />
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Database" }]} />
      </div>

      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Database</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed max-w-2xl">
          {total
            ? `${total} published entries across fish, invertebrates, plants, corals, equipment and problems — with care parameters, compatibility data and relationship links.`
            : "Published entries across fish, invertebrates, plants, corals, equipment and problems — with care parameters, compatibility data and relationship links."}
        </p>
        <p className="mt-3 max-w-2xl text-sm text-gray-500 dark:text-slate-400">
          Coverage and detail vary by record. Fields that have not been researched are shown as missing or unverified, not as suitability claims.
        </p>
        {!counts && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            <AlertCircle className="h-4 w-4" />
            Live counts are unavailable right now. Browse the categories below; numbers will return when the data source responds.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 mb-8 sm:grid-cols-2 lg:grid-cols-4">
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
          href="/collections"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-aqua-300 dark:hover:border-aqua-700 hover:shadow-md transition-all"
        >
          <Compass className="w-4 h-4 text-aqua-500" />
          Goal collections
        </Link>
        <Link
          href="/wiki"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-aqua-300 dark:hover:border-aqua-700 hover:shadow-md transition-all"
        >
          <Wrench className="w-4 h-4 text-aqua-500" />
          Wiki search
        </Link>
        <Link
          href="/hubs"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-aqua-300 dark:hover:border-aqua-700 hover:shadow-md transition-all"
        >
          <BookOpen className="w-4 h-4 text-aqua-500" />
          Knowledge hubs
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {databaseCategories.map((cat) => {
          const key = COUNT_KEY_BY_HREF[cat.href]
          const count = counts && key ? counts[key] : null
          return (
            <Link
              key={cat.href}
              href={cat.href}
              className="group rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-aqua-300 dark:hover:border-aqua-800 transition-all card-hover"
            >
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
                  {cat.label}
                </h2>
                {count !== null && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-aqua-50 dark:bg-aqua-950/50 text-aqua-600 dark:text-aqua-400">
                    {count}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{cat.description}</p>
              <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-aqua-600 dark:text-aqua-400">
                Browse
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          )
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-aqua-50 dark:bg-aqua-950/30 border border-aqua-100 dark:border-aqua-900/50 p-5">
          <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-1">Start from a goal</h2>
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
            Collections group records by a real setup goal and list the inclusion criteria used.
          </p>
          <Link
            href="/collections"
            className="inline-flex items-center gap-1 text-sm font-medium text-aqua-600 dark:text-aqua-400 hover:text-aqua-700 dark:hover:text-aqua-300 transition-colors"
          >
            Browse collections
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 p-5">
          <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-1">Inspiration</h2>
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
            Aquascaping styles, difficulty levels and curated setups.
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
    </div>
  )
}
