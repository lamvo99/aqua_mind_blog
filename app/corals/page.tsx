import type { Metadata } from "next"
import { getDatabaseList, getDatabaseCompareItems } from "@/lib/database"
import DatabaseGrid from "@/app/components/database/DatabaseGrid"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema, collectionPageSchema } from "@/lib/seo/jsonld"
import { Database } from "lucide-react"

export const metadata: Metadata = {
  title: "Coral Database — AquaMind",
  description: "Browse reef corals with care parameters: light, flow, difficulty, placement and aggression.",
  alternates: { canonical: "https://aquamind.life/corals" },
  openGraph: {
    title: "Coral Database — AquaMind",
    description: "Browse reef corals with care parameters: light, flow, difficulty, placement and aggression.",
    type: "website",
    locale: "en_US",
  },
}

export const revalidate = 300

export default async function CoralsPage() {
  const [items, compareItems] = await Promise.all([getDatabaseList("coral"), getDatabaseCompareItems("coral")])
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd data={breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Database", href: "/database" },
        { label: "Corals" },
      ])} />
      <JsonLd data={collectionPageSchema({
        name: "Coral Database",
        description: "Browse reef corals with care parameters.",
        url: "https://aquamind.life/corals",
        items: items.map((i) => ({ title: i.name, url: `https://aquamind.life/corals/${i.slug?.current}` })),
      })} />
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Database", href: "/database" }, { label: "Corals" }]} />
      </div>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-aqua-600 dark:text-aqua-400 text-sm font-medium mb-2">
          <Database className="w-4 h-4" />
          Database
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Corals</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed">
          Light, flow and placement requirements for reef corals.
        </p>
      </div>
      <DatabaseGrid
        items={items}
        hrefPrefix="/corals"
        finderHref="/finder"
        filterGroups={[
          { key: "coralType", label: "Type" },
          { key: "difficulty", label: "Difficulty" },
          { key: "light", label: "Light" },
          { key: "flow", label: "Flow" },
          { key: "placement", label: "Placement" },
          { key: "aquariumStyle", label: "Aquarium Style" },
        ]}
        compareItems={compareItems}
        compareType="coral"
      />
    </div>
  )
}
