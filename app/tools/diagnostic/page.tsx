import type { Metadata } from "next"
import Breadcrumb from "@/app/components/Breadcrumb"
import DiagnosisWizard from "@/app/components/problems/DiagnosisWizard"
import { client } from "@/lib/sanity"
import type { ProblemForDiagnosis } from "@/lib/diagnosis"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld"

export const metadata: Metadata = {
  title: "Aquarium Problem Diagnostic — AquaMind",
  description: "Describe what you see in your tank and get ranked likely causes instantly — from algae outbreaks to sick fish.",
  alternates: { canonical: "https://aquamind.life/tools/diagnostic" },
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

export default async function DiagnosticToolPage() {
  const problems = await getProblems()

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Tools", href: "/tools" },
          { label: "Diagnostic" },
        ])}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Breadcrumb items={[{ label: "Tools", href: "/tools" }, { label: "Diagnostic" }]} />
        </div>
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">
            Aquarium Problem Diagnostic
          </h1>
          <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            Pick the symptoms you see and get ranked likely causes — matched against our full
            problem database, from algae outbreaks to sick fish.
          </p>
        </div>

        <DiagnosisWizard problems={problems} />
      </div>
    </>
  )
}
