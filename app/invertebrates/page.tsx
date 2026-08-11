import type { Metadata } from "next"
import { getDatabaseList, getDatabaseCompareItems } from "@/lib/database"
import DatabaseGrid from "@/app/components/database/DatabaseGrid"
import Breadcrumb from "@/app/components/Breadcrumb"
import { Database } from "lucide-react"

export const metadata: Metadata = {
  title: "Invertebrates Database — Shrimp, Snails, Crabs & Reef Inverts — AquaMind",
  description: "Browse aquarium invertebrate profiles with care parameters: size, temperature, pH, diet, temperament and difficulty for shrimp, snails, crabs, urchins, starfish and anemones.",
  alternates: { canonical: "https://aquamind.life/invertebrates" },
}

export const revalidate = 300

export default async function InvertebratesPage() {
  const [items, compareItems] = await Promise.all([getDatabaseList("invertebrate"), getDatabaseCompareItems("invertebrate")])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Database", href: "/database" }, { label: "Invertebrates" }]} />
      </div>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-aqua-600 dark:text-aqua-400 text-sm font-medium mb-2">
          <Database className="w-4 h-4" />
          Database
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Invertebrates</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed">
          Shrimp, snails, crabs, urchins, starfish and anemones — freshwater, brackish and marine.
        </p>
      </div>
      <DatabaseGrid items={items} hrefPrefix="/invertebrates" filterKeys={["group"]} compareItems={compareItems} compareType="invertebrate" />
    </div>
  )
}
