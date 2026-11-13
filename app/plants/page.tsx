import type { Metadata } from "next"
import Link from "next/link"
import { getDatabaseList, getDatabaseCompareItems } from "@/lib/database"
import DatabaseGrid from "@/app/components/database/DatabaseGrid"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema, collectionPageSchema } from "@/lib/seo/jsonld"
import { Database } from "lucide-react"

export const metadata: Metadata = {
  title: "Aquatic Plant Database",
  description: "Browse aquatic plants with care parameters: light, CO₂, growth rate, difficulty and placement.",
  alternates: { canonical: "https://www.aquamind.life/plants" },
  openGraph: {
    title: "Aquatic Plant Database",
    description: "Browse aquatic plants with care parameters: light, CO₂, growth rate, difficulty and placement.",
    type: "website",
    locale: "en_US",
  },
}

export const revalidate = 300

export default async function PlantsPage() {
  const [items, compareItems] = await Promise.all([getDatabaseList("plant"), getDatabaseCompareItems("plant")])
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd data={breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Database", href: "/database" },
        { label: "Plants" },
      ])} />
      <JsonLd data={collectionPageSchema({
        name: "Aquatic Plant Database",
        description: "Browse aquatic plants with care parameters.",
        url: "https://www.aquamind.life/plants",
        items: items.map((i) => ({ title: i.name, url: `https://www.aquamind.life/plants/${i.slug?.current}` })),
      })} />
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Database", href: "/database" }, { label: "Plants" }]} />
      </div>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-aqua-600 dark:text-aqua-400 text-sm font-medium mb-2">
          <Database className="w-4 h-4" />
          Database
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Aquatic Plants</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed">
          Light, CO₂ and growth requirements for freshwater aquarium plants.
        </p>
      </div>
      <div className="mb-6 rounded-2xl border border-aqua-100 bg-aqua-50 p-4 dark:border-aqua-900 dark:bg-aqua-950/30 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600 dark:text-slate-300">
          New to planted tanks? Start with light, CO₂, nutrients and algae.
        </p>
        <Link href="/hubs/planted-tank" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-aqua-700 dark:text-aqua-300 hover:underline">
          Open the Planted Tank hub
        </Link>
      </div>
      <DatabaseGrid
        items={items}
        hrefPrefix="/plants"
        finderHref="/finder"
        filterGroups={[
          { key: "placement", label: "Placement" },
          { key: "difficulty", label: "Difficulty" },
          { key: "light", label: "Light" },
          { key: "co2", label: "CO₂" },
          { key: "growth", label: "Growth Rate" },
          { key: "aquariumStyle", label: "Aquarium Style" },
          { key: "region", label: "Region" },
          { key: "growthForm", label: "Growth Form" },
        ]}
        compareItems={compareItems}
        compareType="plant"
      />
    </div>
  )
}
