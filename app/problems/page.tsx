import Link from "next/link"
import type { Metadata } from "next"
import { getProblemsList } from "@/lib/database"
import Breadcrumb from "@/app/components/Breadcrumb"
import { Wrench } from "lucide-react"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld"
import ProblemsGrid from "@/app/components/database/ProblemsGrid"

export const metadata: Metadata = {
  title: "Aquarium Problem Solver",
  description: "Solve aquarium problems: cloudy water, algae outbreaks, sick fish, plant issues and equipment failures.",
  alternates: { canonical: "https://www.aquamind.life/problems" },
  openGraph: {
    title: "Aquarium Problem Solver",
    description: "Solve aquarium problems: cloudy water, algae outbreaks, sick fish, plant issues and equipment failures.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aquarium Problem Solver",
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
      <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-aqua-100 bg-aqua-50 p-5 dark:border-aqua-900 dark:bg-aqua-950/30 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-slate-100">Not sure what the problem is?</h2>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Pick the symptoms you can see and get ranked likely causes, then open the full guide.
          </p>
        </div>
        <Link
          href="/problems/diagnose"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-aqua-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-aqua-700"
        >
          Start symptom diagnosis
        </Link>
      </div>
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600 dark:text-slate-300">
          Want to understand the pattern before changing the tank?
        </p>
        <Link href="/hubs/aquarium-problems" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-aqua-600 dark:text-aqua-400 hover:underline">
          Open the Aquarium Problems hub
        </Link>
      </div>
      <ProblemsGrid problems={problems} />
    </div>
  )
}
