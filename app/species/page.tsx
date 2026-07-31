import type { Metadata } from "next"
import { getDatabaseList } from "@/lib/database"
import DatabaseGrid from "@/app/components/database/DatabaseGrid"
import { Database } from "lucide-react"

export const metadata: Metadata = {
  title: "Fish Species Database — AquaMind",
  description: "Browse fish species profiles with care parameters: size, tank size, temperature, pH, diet, temperament and compatibility.",
  alternates: { canonical: "https://aquamind.life/species" },
}

export const dynamic = "force-dynamic"

export default async function SpeciesPage() {
  const items = await getDatabaseList("species")

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
      <DatabaseGrid items={items} hrefPrefix="/species" filterKeys={["temperament", "diet"]} />
    </div>
  )
}
