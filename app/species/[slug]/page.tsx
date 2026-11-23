import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { urlFor } from "@/lib/sanity"
import { buildDetailMetadata } from "@/lib/seo/detail-metadata"
import { getDatabaseItem, getDatabaseList } from "@/lib/database"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld"
import { ArrowLeft, Thermometer, Droplets, Ruler, Fish } from "lucide-react"
import WikiPromo from "@/app/components/database/WikiPromo"
import EntityResources from "@/app/components/EntityResources"
import RelationshipSection from "@/app/components/database/RelationshipSection"
import ParentLink from "@/app/components/database/ParentLink"
import CompatibilityList from "@/app/components/database/CompatibilityList"
import PredatorPreySection from "@/app/components/database/PredatorPreySection"
import DifficultyContext from "@/app/components/database/DifficultyContext"
import RelatedArticles from "@/app/components/RelatedArticles"
import KnowledgeHubLinks from "@/app/components/KnowledgeHubLinks"
import { getHubLinksForEntity } from "@/lib/hubs"
import PortableText from "@/app/components/PortableText"
import { buildHusbandryFacts, knowledgeBodySections, compatibilityEntries, linkedProblemsHeading } from "@/lib/species-facts"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600
export const dynamicParams = false

export async function generateStaticParams() {
  const items = await getDatabaseList("species")
  return items.filter((item) => !!item.slug?.current).map((item) => ({ slug: item.slug!.current }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const item = await getDatabaseItem("species", slug)
  if (!item) return { title: "Not found" }

  return buildDetailMetadata(item, {
    pathPrefix: "species",
    slug,
    profileLabel: "Fish Profile",
    imageAltSuffix: "fish species profile",
    fallbackDescription: (name) => `Care guide for ${name}`,
  })
}

function Parameter({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode
  label: string
  value?: string | number
}) {
  if (value === undefined || value === null || value === "") return null
  return (
    <div className="rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-3">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 capitalize">{value}</div>
    </div>
  )
}

export default async function SpeciesDetailPage({ params }: Props) {
  const { slug } = await params
  const item = await getDatabaseItem("species", slug)
  if (!item) notFound()

  const hubLinks = await getHubLinksForEntity("species")

  const range = (min?: number, max?: number, suffix = "") =>
    min !== undefined && max !== undefined && (min !== null) && (max !== null) ? `${min}–${max}${suffix}` : undefined

  const compatible = compatibilityEntries<any>(item.compatibleSpecies)
  const husbandryGroups = buildHusbandryFacts(item)
  const bodySections = knowledgeBodySections(item.knowledgeBody)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Database", href: "/database" },
        { label: "Fish", href: "/species" },
        { label: item.name, href: `/species/${slug}` },
      ])} />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Database", href: "/database" }, { label: "Fish", href: "/species" }, { label: item.name }]} />

      <Link href="/species" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-aqua-600 dark:hover:text-aqua-400 mt-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Fish
      </Link>

      <div className="grid lg:grid-cols-[380px_1fr] gap-8 mt-4">
        <div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-aqua-50 dark:bg-slate-900">
            {item.mainImage ? (
              <Image
                src={urlFor(item.mainImage).width(760).height(570).url() || ""}
                alt={`${item.name} — fish species${item.scientificName ? ` (${item.scientificName})` : ""}`}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🐠</div>
            )}
          </div>
          <CompatibilityList title="Compatible Species" items={compatible} />
          <WikiPromo />
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-1">{item.name}</h1>          {item.scientificName && <p className="text-lg italic text-gray-500 dark:text-slate-400 mb-4">{item.scientificName}</p>}
          <ParentLink parent={item.parentSpecies} />
          {item.excerpt && <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-6">{item.excerpt}</p>}

          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">Care Parameters</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Parameter icon={<Ruler className="w-3.5 h-3.5" />} label="Adult size" value={item.sizeCm ? `${item.sizeCm} cm` : undefined} />
            <Parameter icon={<Droplets className="w-3.5 h-3.5" />} label="Min tank" value={item.tankSizeMinL ? `${item.tankSizeMinL} L` : undefined} />
            <Parameter icon={<Thermometer className="w-3.5 h-3.5" />} label="Temperature" value={range(item.tempMinC, item.tempMaxC, "°C")} />
            <Parameter icon={<Droplets className="w-3.5 h-3.5" />} label="pH" value={range(item.phMin, item.phMax)} />
            <Parameter icon={<Droplets className="w-3.5 h-3.5" />} label="GH" value={range(item.ghMin, item.ghMax, " dGH")} />
            <Parameter icon={<Fish className="w-3.5 h-3.5" />} label="Diet" value={item.diet} />
            <Parameter label="Temperament" value={item.temperament} />
            <Parameter label="Water zone" value={item.waterZone} />
            <Parameter label="Difficulty" value={item.difficulty} />
          </div>

          <DifficultyContext
            difficulty={item.difficulty}
            context={item.difficultyContext}
            confidence={item.difficultyConfidence}
            notRecommendedFor={item.notRecommendedFor}
          />

          {item.schooling && (
            <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-1">Schooling</h3>
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{item.schooling}</p>
            </div>
          )}

          {husbandryGroups.map((group) => (
            <section key={group.title} className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">{group.title}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {group.facts.map((fact) => (
                  <Parameter key={fact.label} label={fact.label} value={fact.value} />
                ))}
              </div>
            </section>
          ))}

          {bodySections.map((section) => (
            <section key={section.title} className="mt-8">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">{section.title}</h2>
              <PortableText value={section.blocks} />
            </section>
          ))}

          <PredatorPreySection
            items={item.predatorPrey || []}
            description="Organisms this species is documented as preying on. Size notes describe when predation is most likely."
            showEvidence
          />
          <RelationshipSection title="Suitable Plants" items={item.compatiblePlants || []} hrefPrefix="/plants" />
          <RelationshipSection title="Compatible Invertebrates" items={item.compatibleInvertebrates || []} hrefPrefix="/invertebrates" />
          <RelationshipSection title="Suitable Equipment" items={item.suitableEquipment || []} hrefPrefix="/equipment" />
          <RelationshipSection title={linkedProblemsHeading(bodySections)} items={item.relatedProblems || []} hrefPrefix="/problems" />

          <RelatedArticles items={item.relatedPosts} currentSlug={slug} />
          <KnowledgeHubLinks links={hubLinks} />
          <EntityResources type="species" />
        </div>
      </div>
    </div>
  )
}
