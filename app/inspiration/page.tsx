import type { Metadata } from "next"
import { getInspirationList } from "@/lib/database"
import InspirationGrid from "@/app/components/database/InspirationGrid"

export const metadata: Metadata = {
  title: "Aquascape Inspiration — AquaMind",
  description: "Aquascape ideas and gallery: nature aquariums, iwagumi, dutch and jungle styles with tank details.",
  alternates: { canonical: "https://aquamind.life/inspiration" },
}

export const dynamic = "force-dynamic"

export default async function InspirationPage() {
  const items = await getInspirationList()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Inspiration</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed max-w-2xl">
          Real aquascapes with tank details — plants, hardscape and equipment used.
        </p>
      </div>

      {items.length > 0 ? (
        <InspirationGrid items={items} />
      ) : (
        <div className="text-center py-16 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <p className="text-gray-900 dark:text-slate-100 font-medium mb-1">Gallery coming soon</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">We are curating real aquascapes to inspire your next setup.</p>
        </div>
      )}
    </div>
  )
}
