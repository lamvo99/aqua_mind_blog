import type { Metadata } from "next"
import Link from "next/link"
import { getDatabaseList, getDatabaseCompareItems } from "@/lib/database"
import DatabaseGrid from "@/app/components/database/DatabaseGrid"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema, collectionPageSchema } from "@/lib/seo/jsonld"
import { Database } from "lucide-react"
import { parseListingQuery } from "@/lib/listing-filters"
import { withListingSeo } from "@/lib/listing-seo"

const baseMetadata: Metadata = {
  title: "Aquarium Equipment Database",
  description: "Browse aquarium equipment: filters, lights, pumps, heaters and CO₂ systems with specs and suitability.",
  alternates: { canonical: "https://www.aquamind.life/equipment" },
  openGraph: {
    title: "Aquarium Equipment Database",
    description: "Browse aquarium equipment: filters, lights, pumps, heaters and CO₂ systems with specs and suitability.",
    type: "website",
    locale: "en_US",
  },
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  return withListingSeo(baseMetadata, "/equipment", searchParams ? await searchParams : {})
}

export const revalidate = 300

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const initialQuery = parseListingQuery(searchParams ? await searchParams : {})
  const [items, compareItems] = await Promise.all([getDatabaseList("equipment"), getDatabaseCompareItems("equipment")])
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd data={breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Database", href: "/database" },
        { label: "Equipment" },
      ])} />
      <JsonLd data={collectionPageSchema({
        name: "Aquarium Equipment Database",
        description: "Browse aquarium equipment with specs and suitability.",
        url: "https://www.aquamind.life/equipment",
        items: items.map((i) => ({ title: i.name, url: `https://www.aquamind.life/equipment/${i.slug?.current}` })),
      })} />
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Database", href: "/database" }, { label: "Equipment" }]} />
      </div>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-aqua-700 dark:text-aqua-400 text-sm font-medium mb-2">
          <Database className="w-4 h-4" />
          Database
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Equipment</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed">
          Filters, lights, pumps, heaters and CO₂ systems with specs and suitable tank ranges.
        </p>
      </div>
      <div className="mb-6 rounded-2xl border border-aqua-100 bg-aqua-50 p-4 dark:border-aqua-900 dark:bg-aqua-950/30 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600 dark:text-slate-300">
          Buying your first filter, heater or light? Start with the equipment basics.
        </p>
        <Link href="/hubs/aquarium-equipment" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-aqua-700 dark:text-aqua-300 hover:underline">
          Open the Aquarium Equipment hub
        </Link>
      </div>
      <DatabaseGrid
        items={items}
        hrefPrefix="/equipment"
        finderHref="/finder"
        filterGroups={[
          { key: "category", label: "Category" },
          { key: "aquariumStyle", label: "Aquarium Style" },
        ]}
        rangeFilters={[
          { key: "tankSizeMaxL", label: "Tank Size", min: 10, max: 2000, unit: "L" },
          { key: "powerW", label: "Power", min: 1, max: 200, unit: "W" },
        ]}
        initialQuery={initialQuery}
        compareItems={compareItems}
        compareType="equipment"
      />
    </div>
  )
}
