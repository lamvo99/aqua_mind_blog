import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld"
import { getCollection, getCollections } from "@/lib/collections"
import EventOnMount from "@/app/components/analytics/EventOnMount"
import TrackedLink from "@/app/components/analytics/TrackedLink"
import { ArrowRight, CheckCircle2, Info } from "lucide-react"

export const revalidate = 3600
export const dynamicParams = false

const MAX_PER_GROUP = 18

const TYPE_PATH: Record<string, string> = {
  species: "/species",
  plant: "/plants",
  coral: "/corals",
  invertebrate: "/invertebrates",
  equipment: "/equipment",
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const collections = await getCollections()
  return collections.map((collection) => ({ slug: collection.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const collection = await getCollection(slug)
  if (!collection) return { title: "Collection not found" }
  const canonical = `https://www.aquamind.life/collections/${slug}`
  return {
    title: `${collection.title}`,
    description: collection.intent,
    alternates: { canonical },
    openGraph: {
      title: `${collection.title}`,
      description: collection.intent,
      type: "website",
      url: canonical,
    },
  }
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params
  const collection = await getCollection(slug)
  if (!collection) notFound()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Database", href: "/database" },
          { label: "Collections", href: "/collections" },
          { label: collection.title },
        ])}
      />
      <EventOnMount event="database_collection_opened" props={{ page_type: "collection", collection_slug: collection.slug }} />

      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Database", href: "/database" },
            { label: "Collections", href: "/collections" },
            { label: collection.title },
          ]}
        />
      </div>

      <div className="max-w-2xl mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">{collection.title}</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed">{collection.intent}</p>
        <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">{collection.description}</p>
        <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
          {collection.total} published record{collection.total === 1 ? "" : "s"} currently match these criteria.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Included when</h2>
          <ul className="space-y-1.5 text-sm text-gray-600 dark:text-slate-300">
            {collection.criteria.map((criterion) => (
              <li key={criterion} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-aqua-500" />
                <span>{criterion}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <Info className="h-4 w-4" /> Limits of this collection
          </h2>
          <ul className="space-y-1.5 text-sm">
            {(collection.limitations || ["Records are filtered by stored fields only; check each record before deciding."]).map((limitation) => (
              <li key={limitation} className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-current" />
                <span>{limitation}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {collection.groups.map((group) => {
        const visible = group.items.slice(0, MAX_PER_GROUP)
        const remaining = group.items.length - visible.length
        return (
          <section key={group.type} className="mb-10">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                {group.label} <span className="text-sm font-medium text-gray-500 dark:text-slate-400">({group.items.length})</span>
              </h2>
              <Link href={TYPE_PATH[group.type] || "/database"} className="text-sm font-medium text-aqua-700 hover:underline dark:text-aqua-400">
                Open {group.label.toLowerCase()} database
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {visible.map((entry) => (
                <TrackedLink
                  key={entry.id}
                  href={entry.href}
                  event="database_result_opened"
                  props={{ page_type: "collection", collection_slug: collection.slug, database_type: entry.type }}
                  className="rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-aqua-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-aqua-700"
                >
                  <p className="font-semibold text-gray-900 dark:text-slate-100">{entry.name}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {entry.why.map((reason) => (
                      <span
                        key={reason}
                        className="rounded-md bg-aqua-50 px-2 py-0.5 text-[11px] font-medium text-aqua-700 dark:bg-aqua-950/50 dark:text-aqua-300"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </TrackedLink>
              ))}
            </div>
            {remaining > 0 && (
              <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
                Showing {visible.length} of {group.items.length}.{" "}
                <Link href={TYPE_PATH[group.type] || "/database"} className="font-medium text-aqua-700 hover:underline dark:text-aqua-400">
                  Open the {group.label.toLowerCase()} database for the full list
                </Link>
              </p>
            )}
          </section>
        )
      })}

      {collection.furtherReading && collection.furtherReading.length > 0 && (
        <section className="mt-10 border-t border-gray-200 pt-6 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">Further reading</h2>
          <div className="flex flex-wrap gap-2">
            {collection.furtherReading.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-aqua-700 hover:border-aqua-300 dark:border-slate-700 dark:text-aqua-300"
              >
                {link.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/collections" className="text-sm font-medium text-aqua-700 hover:underline dark:text-aqua-400">
          All collections
        </Link>
        <Link href="/database" className="text-sm font-medium text-aqua-700 hover:underline dark:text-aqua-400">
          Database home
        </Link>
        <Link href="/finder" className="text-sm font-medium text-aqua-700 hover:underline dark:text-aqua-400">
          Use the Finder
        </Link>
      </div>
    </div>
  )
}
