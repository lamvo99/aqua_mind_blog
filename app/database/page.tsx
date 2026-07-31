import type { Metadata } from "next"
import Link from "next/link"
import { databaseNav } from "@/lib/navigation"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Aquarium Database — Fish, Plants, Corals & Equipment",
  description: "Searchable database of aquarium fish species, aquatic plants, corals and equipment with care parameters.",
  alternates: { canonical: "https://aquamind.life/database" },
}

export default function DatabasePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Database</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed max-w-2xl">
          Structured knowledge about fish, plants, corals and equipment — with the care parameters you need to plan your aquarium.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {databaseNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-aqua-300 dark:hover:border-aqua-800 transition-all card-hover"
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
              {item.label}
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
            <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-aqua-600 dark:text-aqua-400">
              Browse
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
