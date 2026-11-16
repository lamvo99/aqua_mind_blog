import type { Metadata } from "next"
import Link from "next/link"
import { getAllHubs } from "@/lib/hubs"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld"
import { ArrowRight, Compass } from "lucide-react"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Knowledge Hubs",
  description:
    "Article-led hubs for water parameters, planted tanks, aquarium problems and equipment, connected to the AquaMind database and tools.",
  alternates: { canonical: "https://www.aquamind.life/hubs" },
  openGraph: {
    title: "Knowledge Hubs",
    description:
      "Article-led hubs for water parameters, planted tanks, aquarium problems and equipment, connected to the AquaMind database and tools.",
    type: "website",
    locale: "en_US",
  },
}

export default async function HubsPage() {
  const hubs = await getAllHubs()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd data={breadcrumbSchema([{ label: "Home", href: "/" }, { label: "Knowledge hubs" }])} />
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Knowledge hubs" }]} />
      </div>

      <div className="mb-10 max-w-3xl">
        <div className="flex items-center gap-2 text-aqua-600 dark:text-aqua-400 text-sm font-medium mb-2">
          <Compass className="w-4 h-4" />
          Learn by topic
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Knowledge hubs</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed">
          Start from a reader goal, not a content type. Each hub collects published articles, the database entries
          that support them, and a clear next step.
        </p>
      </div>

      {hubs.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-semibold">Knowledge hubs are temporarily unavailable</p>
          <p className="mt-1 text-sm">
            The article index could not be read. Browse the database or all articles in the meantime.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm font-medium underline">
            <Link href="/posts">All articles</Link>
            <Link href="/database">Database</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {hubs.map((hub) => (
            <Link
              key={hub.slug}
              href={`/hubs/${hub.slug}`}
              className="group rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-aqua-300 dark:hover:border-aqua-800 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
                  {hub.title}
                </h2>
                <span className="shrink-0 rounded-full bg-aqua-50 px-2 py-0.5 text-xs font-semibold text-aqua-700 dark:bg-aqua-950/50 dark:text-aqua-300">
                  {hub.articles.length} articles
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{hub.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-aqua-600 dark:text-aqua-400">
                Open hub
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
