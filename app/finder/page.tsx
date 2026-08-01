import type { Metadata } from "next"
import Breadcrumb from "@/app/components/Breadcrumb"
import FinderQuiz from "@/app/components/finder/FinderQuiz"
import { client } from "@/lib/sanity"
import type { FinderItem } from "@/lib/finder"

export const metadata: Metadata = {
  title: "Find Your Perfect Fish, Plant or Coral — AquaMind",
  description: "Answer four quick questions and get a ranked shortlist of fish, plants and corals matched to your tank size, experience and lighting.",
  alternates: { canonical: "https://aquamind.life/finder" },
}

export const revalidate = 86400

async function getItems(): Promise<FinderItem[]> {
  return await client.fetch(
    `*[_type in ["species", "plant", "coral"] && defined(slug) && defined(name)] {
      _id, _type, name, slug, difficulty, tankSizeMinL, light,
      tempMinC, tempMaxC, phMin, phMax, origin, sizeCm, mainImage
    }`
  )
}

export default async function FinderPage() {
  const items = await getItems()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Finder" }]} />
      </div>
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">
          Find Your Perfect Match
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed">
          Four quick questions about your tank, experience and lighting — we rank fish, plants and
          corals from our verified database that are most likely to thrive with you.
        </p>
      </div>

      <FinderQuiz items={items} />
    </div>
  )
}
