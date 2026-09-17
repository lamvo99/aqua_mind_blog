import type { Metadata } from "next"
import { getProblemsList } from "@/lib/database"
import Breadcrumb from "@/app/components/Breadcrumb"
import { Wrench } from "lucide-react"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld"
import ProblemsGrid from "@/app/components/database/ProblemsGrid"

export const metadata: Metadata = {
  title: "Aquarium Problem Solver — AquaMind",
  description: "Solve aquarium problems: cloudy water, algae outbreaks, sick fish, plant issues and equipment failures.",
  alternates: { canonical: "https://aquamind.life/problems" },
  openGraph: {
    title: "Aquarium Problem Solver — AquaMind",
    description: "Solve aquarium problems: cloudy water, algae outbreaks, sick fish, plant issues and equipment failures.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aquarium Problem Solver — AquaMind",
    description: "Solve aquarium problems: cloudy water, algae outbreaks, sick fish, plant issues and equipment failures.",
  },
}

export const revalidate = 300

export default async function ProblemsPage() {
  const problems = await getProblemsList()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Problems" },
        ])}
      />
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Problems" }]} />
      </div>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-aqua-600 dark:text-aqua-400 text-sm font-medium mb-2">
          <Wrench className="w-4 h-4" />
          Problem Solver
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Aquarium Problems</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed max-w-2xl">
          Symptoms, common causes and what to check — for the most common aquarium issues.
        </p>
      </div>
      <ProblemsGrid problems={problems} />
    </div>
  )
}
