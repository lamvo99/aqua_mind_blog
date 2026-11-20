import type { Metadata } from "next"
import Link from "next/link"
import Breadcrumb from "@/app/components/Breadcrumb"
import DiagnosisWizard from "@/app/components/problems/DiagnosisWizard"
import ToolRelationships from "@/app/components/tools/ToolRelationships"
import { TOOL_LEARN_LINKS } from "@/lib/related"
import { client } from "@/lib/sanity"
import type { ProblemForDiagnosis } from "@/lib/diagnosis"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld"

export const metadata: Metadata = {
  title: "Aquarium Problem Diagnostic",
  description: "Describe what you see in your tank and get ranked likely causes instantly — from algae outbreaks to sick fish.",
  alternates: { canonical: "https://www.aquamind.life/tools/diagnostic" },
  openGraph: {
    title: "Aquarium Problem Diagnostic",
    description: "Describe what you see in your tank and get ranked likely causes instantly — from algae outbreaks to sick fish.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aquarium Problem Diagnostic",
    description: "Describe what you see in your tank and get ranked likely causes instantly — from algae outbreaks to sick fish.",
  },
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
          { label: "Home", href: "/" },
          { label: "Tools", href: "/tools" },
          { label: "Diagnostic" },
        ])}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Tools", href: "/tools" }, { label: "Diagnostic" }]} />
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
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
          <span>Same diagnostic, problem-first layout:</span>
          <Link href="/problems/diagnose" className="font-medium text-aqua-700 hover:underline dark:text-aqua-400">
            open it in Problems
          </Link>
        </div>

        <DiagnosisWizard problems={problems} />

        <ToolRelationships fallbackGuides={TOOL_LEARN_LINKS["/tools/diagnostic"]} />
      </div>
    </>
  )
}
