import type { Metadata } from "next"
import { Suspense } from "react"
import CalculatorLayout from "@/app/components/tools/CalculatorLayout"
import CompatibilityChecker from "@/app/components/tools/CompatibilityChecker"
import { client } from "@/lib/sanity"
import type { CompatSpecies } from "@/lib/calculators/compatibility"
import { TOOL_LEARN_LINKS } from "@/lib/related"

export const metadata: Metadata = {
  title: "Compatibility Checker — AquaMind",
  description: "Check whether fish species can live together: temperature, pH, hardness, temperament and tank size checks combined with a stocking calculator.",
  alternates: { canonical: "https://aquamind.life/tools/compatibility-checker" },
}

export const revalidate = 86400

async function getSpecies(): Promise<CompatSpecies[]> {
  return await client.fetch(
    `*[_type == "species" && defined(slug) && defined(name)] | order(name asc) {
      _id, name, scientificName, slug,
      sizeCm, tankSizeMinL, tempMinC, tempMaxC, phMin, phMax, ghMin, ghMax,
      diet, temperament, waterZone, schooling, difficulty,
      "compatibleWith": compatibleSpecies[]->slug.current
    }`
  )
}

export default async function CompatibilityCheckerPage() {
  const species = await getSpecies()

  return (
    <CalculatorLayout
      title="Compatibility Checker"
      description="Plan a community tank with confidence. Pick your fish species, set your tank volume, and the checker compares temperature, pH, hardness, temperament and minimum tank size for every pair — plus a stocking check."
      disclaimer="The checker flags conflicts based on care parameters in our species database. Real-world behavior varies with tank size, hiding places and individual fish. Always quarantine new fish and observe them closely in the first weeks."
      related={[
        { href: "/tools/stocking", label: "Fish Stocking Calculator" },
        { href: "/species", label: "Fish Species Database" },
        { href: "/problems", label: "Common Fish Problems" },
      ]}
      learn={TOOL_LEARN_LINKS["/tools/compatibility-checker"]}
      howTo={{
        url: "/tools/compatibility-checker",
        steps: [
          { name: "Enter tank volume", text: "Enter your tank's water volume in liters." },
          { name: "Add species", text: "Search and select the fish species you plan to keep, adjusting the count for each." },
          { name: "Calculate", text: "The checker compares temperature, pH, hardness, temperament and tank size for every pair." },
          { name: "Review warnings", text: "Read the natural-language warnings for each pair and fix conflicts before buying fish." },
        ],
      }}
    >
      <Suspense fallback={<p className="text-sm text-gray-500 dark:text-slate-400">Loading checker…</p>}>
        <CompatibilityChecker species={species} />
      </Suspense>
    </CalculatorLayout>
  )
}
