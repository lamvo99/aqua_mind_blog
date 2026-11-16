import type { Metadata } from "next"
import Link from "next/link"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld"
import { getCollections } from "@/lib/collections"
import { ArrowRight, Compass, Info } from "lucide-react"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Aquarium Setup Collections",
  description:
    "Goal-based aquarium collections built from published database records: beginner freshwater, nano, low-tech planted, shrimp, beginner reef, soft coral and more.",
  alternates: { canonical: "https://www.aquamind.life/collections" },
  openGraph: {
    title: "Aquarium Setup Collections",
    description:
      "Goal-based aquarium collections built from published database records, with explicit inclusion criteria.",
    type: "website",
    locale: "en_US",
  },
}

export default async function CollectionsPage() {
  const collections = await getCollections()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Database", href: "/database" },
          { label: "Collections" },
        ])}
      />
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Database", href: "/database" },
            { label: "Collections" },
          ]}
        />
      </div>

      <div className="mb-10 max-w-2xl">
        <div className="flex items-center gap-2 text-aqua-600 dark:text-aqua-400 text-sm font-medium mb-2">
          <Compass className="w-4 h-4" />
          Database
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Setup collections</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed">
          Start from a real aquarium goal. Every collection lists the stored fields it uses, so you can see why a record
          is included.
        </p>
      </div>

      {collections.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-semibold">Collections are temporarily unavailable</p>
          <p className="mt-1 text-sm">
            The database could not be read. You can still browse the categories directly.
          </p>
          <Link href="/database" className="mt-3 inline-block text-sm font-medium underline">
            Browse the database
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections.map((collection) => (
            <Link
              key={collection.slug}
              href={`/collections/${collection.slug}`}
              className="group rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-aqua-300 dark:hover:border-aqua-800 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
                  {collection.title}
                </h2>
                <span className="shrink-0 rounded-full bg-aqua-50 px-2 py-0.5 text-xs font-semibold text-aqua-700 dark:bg-aqua-950/50 dark:text-aqua-300">
                  {collection.total}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{collection.intent}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-aqua-600 dark:text-aqua-400">
                View collection
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-start gap-2 rounded-2xl bg-gray-50 p-5 text-sm text-gray-600 dark:bg-slate-800/50 dark:text-slate-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-aqua-500" />
        <p>
          Collections are generated from stored fields, not editorial guesses. Inclusion does not mean every item is
          compatible with every other item or suitable for every tank. Check each record and the assumptions listed on
          the collection page.
        </p>
      </div>
    </div>
  )
}
