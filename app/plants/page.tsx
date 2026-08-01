import type { Metadata } from "next"
import { getDatabaseList, getDatabaseCompareItems } from "@/lib/database"
import DatabaseGrid from "@/app/components/database/DatabaseGrid"
import Breadcrumb from "@/app/components/Breadcrumb"
import { Database } from "lucide-react"

export const metadata: Metadata = {
  title: "Aquatic Plant Database — AquaMind",
  description: "Browse aquatic plants with care parameters: light, CO₂, growth rate, difficulty and placement.",
  alternates: { canonical: "https://aquamind.life/plants" },
}

export const revalidate = 300

export default async function PlantsPage() {
  const [items, compareItems] = await Promise.all([getDatabaseList("plant"), getDatabaseCompareItems("plant")])
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Database", href: "/database" }, { label: "Plants" }]} />
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
      <DatabaseGrid items={items} hrefPrefix="/plants" filterKeys={["difficulty", "light"]} compareItems={compareItems} compareType="plant" />
    </div>
  )
}
