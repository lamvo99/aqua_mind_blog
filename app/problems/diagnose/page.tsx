import type { Metadata } from "next"
import Breadcrumb from "@/app/components/Breadcrumb"
import DiagnosisWizard from "@/app/components/problems/DiagnosisWizard"
import { client } from "@/lib/sanity"
import type { ProblemForDiagnosis } from "@/lib/diagnosis"

export const metadata: Metadata = {
  title: "Diagnose Your Aquarium Problem — AquaMind",
  description: "Pick the symptoms you see and get ranked likely causes, from algae outbreaks to sick fish — matched against our full problem database.",
  alternates: { canonical: "https://aquamind.life/problems/diagnose" },
}

export const revalidate = 86400

async function getProblems(): Promise<ProblemForDiagnosis[]> {
  return await client.fetch(
    `*[_type == "problem" && defined(title) && defined(slug)] | order(publishedAt desc) {
      _id, _type, title, slug, category, excerpt,
      "symptomsText": pt::text(symptoms)
    }`
  )
}

export default async function DiagnosePage() {
  const problems = await getProblems()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Problems", href: "/problems" }, { label: "Diagnose" }]} />
      </div>
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Diagnose Your Aquarium Problem</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed max-w-2xl">
          Describe what you see and we will rank the most likely causes from our problem database.
        </p>
      </div>

      <DiagnosisWizard problems={problems} />
    </div>
  )
}
