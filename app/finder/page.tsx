import type { Metadata } from "next"
import { Suspense } from "react"
import Breadcrumb from "@/app/components/Breadcrumb"
import FinderQuiz from "@/app/components/finder/FinderQuiz"
import { client } from "@/lib/sanity"
import type { FinderItem } from "@/lib/finder"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld"

export const metadata: Metadata = {
  title: "Find Your Perfect Match — AquaMind",
  description: "Answer a few questions and get a ranked shortlist of fish, plants, corals, invertebrates and equipment matched to your aquarium.",
  alternates: { canonical: "https://aquamind.life/finder" },
  openGraph: {
    title: "Find Your Perfect Match — AquaMind",
    description: "Answer a few questions and get a ranked shortlist of fish, plants, corals, invertebrates and equipment matched to your aquarium.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Your Perfect Match — AquaMind",
    description: "Answer a few questions and get a ranked shortlist of fish, plants, corals, invertebrates and equipment matched to your aquarium.",
  },
}

export const revalidate = 86400

async function getItems(): Promise<FinderItem[]> {
  return await client.fetch(
    `*[_type in ["species", "plant", "coral", "invertebrate", "equipment"] && defined(slug) && defined(name)] {
      _id, _type, name, slug, difficulty, tankSizeMinL, tankSizeMaxL, light, co2,
      waterType, sizeCm, tempMinC, tempMaxC, phMin, phMax, origin, region,
      aquariumStyle, isPredator, reefCompatibility, category, group, mainImage
    }`
  )
}

export default async function FinderPage() {
  const items = await getItems()

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { label: "Home", href: "/" },
          { label: "Finder" },
        ])}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Finder" }]} />
        </div>
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">
          Find Your Perfect Match
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed">
          Answer a few questions about your tank, experience and preferences — we rank fish, plants,
          corals, invertebrates and equipment from our verified database.
        </p>
      </div>

      <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading finder...</div>}>
        <FinderQuiz items={items} />
      </Suspense>
      </div>
    </>
  )
}
