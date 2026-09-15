import type { Metadata } from "next"
import { getDatabaseCompareItems } from "@/lib/database"
import WikiHub from "@/app/components/wiki/WikiHub"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema, collectionPageSchema } from "@/lib/seo/jsonld"

export const metadata: Metadata = {
  title: "Aquarium Wiki — Fish, Invertebrates, Plants, Corals & Equipment — AquaMind",
  description: "Search the AquaMind wiki across 140+ fish species, aquatic invertebrates, plants, corals and equipment with care parameters: temperature, pH, tank size, difficulty and more.",
  alternates: { canonical: "https://aquamind.life/wiki" },
  openGraph: {
    title: "Aquarium Wiki — Fish, Invertebrates, Plants, Corals & Equipment — AquaMind",
    description: "Search the AquaMind wiki across 140+ fish species, aquatic invertebrates, plants, corals and equipment with care parameters: temperature, pH, tank size, difficulty and more.",
    type: "website",
    locale: "en_US",
  },
}

export const revalidate = 300

export default async function WikiPage() {
  const [species, invertebrates, plants, corals, equipment] = await Promise.all([
    getDatabaseCompareItems("species"),
    getDatabaseCompareItems("invertebrate"),
    getDatabaseCompareItems("plant"),
    getDatabaseCompareItems("coral"),
    getDatabaseCompareItems("equipment"),
  ])

  const items = [
    ...species.map((s: any) => ({ ...s, _type: "species", href: `/species/${s.slug.current}` })),
    ...invertebrates.map((i: any) => ({ ...i, _type: "invertebrate", href: `/invertebrates/${i.slug.current}` })),
    ...plants.map((p: any) => ({ ...p, _type: "plant", href: `/plants/${p.slug.current}` })),
    ...corals.map((c: any) => ({ ...c, _type: "coral", href: `/corals/${c.slug.current}` })),
    ...equipment.map((e: any) => ({ ...e, _type: "equipment", href: `/equipment/${e.slug.current}` })),
  ]

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ label: "Wiki" }])} />
          <JsonLd
        data={collectionPageSchema({
          name: "Aquarium Wiki",
          description:
            "Search fish species, aquatic invertebrates, corals and aquarium equipment with care parameters.",
          url: "https://aquamind.life/wiki",
          items: items.slice(0, 100).map((i) => ({
            title: i.name,
            url: `https://aquamind.life${i.href}`,
          })),
        })}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Breadcrumb items={[{ label: "Wiki" }]} />
        </div>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">
            Aquarium Wiki
          </h1>
          <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            One search across fish, invertebrates, plants, corals and equipment — filter by type,
            difficulty, origin or group, then open any entry for full care parameters.
          </p>
        </div>
        <WikiHub items={items} />
      </div>
    </>
  )
}
