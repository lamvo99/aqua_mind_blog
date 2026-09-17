import type { Metadata } from "next"
import { getDatabaseList, getDatabaseCompareItems } from "@/lib/database"
import DatabaseGrid from "@/app/components/database/DatabaseGrid"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema, collectionPageSchema } from "@/lib/seo/jsonld"
import { Database } from "lucide-react"

export const metadata: Metadata = {
  title: "Aquarium Equipment Database — AquaMind",
  description: "Browse aquarium equipment: filters, lights, pumps, heaters and CO₂ systems with specs and suitability.",
  alternates: { canonical: "https://aquamind.life/equipment" },
  openGraph: {
    title: "Aquarium Equipment Database — AquaMind",
    description: "Browse aquarium equipment: filters, lights, pumps, heaters and CO₂ systems with specs and suitability.",
    type: "website",
    locale: "en_US",
  },
}

export const revalidate = 300

export default async function EquipmentPage() {
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
        url: "https://aquamind.life/equipment",
        items: items.map((i) => ({ title: i.name, url: `https://aquamind.life/equipment/${i.slug?.current}` })),
      })} />
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Database", href: "/database" }, { label: "Equipment" }]} />
      </div>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-aqua-600 dark:text-aqua-400 text-sm font-medium mb-2">
          <Database className="w-4 h-4" />
          Database
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Equipment</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed">
          Filters, lights, pumps, heaters and CO₂ systems with specs and suitable tank ranges.
        </p>
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
        compareItems={compareItems}
        compareType="equipment"
      />
    </div>
  )
}
