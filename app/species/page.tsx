import type { Metadata } from "next"
import { getDatabaseList, getDatabaseCompareItems } from "@/lib/database"
import DatabaseGrid from "@/app/components/database/DatabaseGrid"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema, collectionPageSchema } from "@/lib/seo/jsonld"
import { Database } from "lucide-react"

export const metadata: Metadata = {
  title: "Fish Species Database — AquaMind",
  description: "Browse fish species profiles with care parameters: size, tank size, temperature, pH, diet, temperament and compatibility.",
  alternates: { canonical: "https://aquamind.life/species" },
  openGraph: {
    title: "Fish Species Database — AquaMind",
    description: "Browse fish species profiles with care parameters: size, tank size, temperature, pH, diet, temperament and compatibility.",
    type: "website",
    locale: "en_US",
  },
}

export const revalidate = 300

export default async function SpeciesPage() {
  const [items, compareItems] = await Promise.all([getDatabaseList("species"), getDatabaseCompareItems("species")])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd data={breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Database", href: "/database" },
        { label: "Fish" },
      ])} />
      <JsonLd data={collectionPageSchema({
        name: "Fish Species Database",
        description: "Browse fish species profiles with care parameters.",
        url: "https://aquamind.life/species",
        items: items.map((i) => ({ title: i.name, url: `https://aquamind.life/species/${i.slug?.current}` })),
      })} />
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Database", href: "/database" }, { label: "Fish" }]} />
      </div>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-aqua-600 dark:text-aqua-400 text-sm font-medium mb-2">
          <Database className="w-4 h-4" />
          Database
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Fish Species</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed">
          Care parameters and compatibility for freshwater and marine fish.
        </p>
      </div>
      <DatabaseGrid
        items={items}
        hrefPrefix="/species"
        finderHref="/finder"
        filterGroups={[
          { key: "waterType", label: "Water Type" },
          { key: "difficulty", label: "Difficulty" },
          { key: "temperament", label: "Temperament" },
          { key: "diet", label: "Diet" },
          { key: "aquariumStyle", label: "Aquarium Style" },
          { key: "region", label: "Region" },
        ]}
        rangeFilters={[
          { key: "tankSizeMinL", label: "Min Tank", min: 10, max: 1000, unit: "L" },
          { key: "sizeCm", label: "Size", min: 1, max: 100, unit: "cm" },
          { key: "tempMinC", label: "Temp Min", min: 15, max: 35, unit: "°C" },
          { key: "phMin", label: "pH Min", min: 4, max: 9 },
        ]}
        compareItems={compareItems}
        compareType="species"
      />
    </div>
  )
}
