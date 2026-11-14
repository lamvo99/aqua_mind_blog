import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { urlFor } from "@/lib/sanity"
import { buildDetailMetadata } from "@/lib/seo/detail-metadata"
import { interpretReefCompatibility } from "@/lib/coral-reef-compatibility"
import { getDatabaseItem, getDatabaseList } from "@/lib/database"
import Breadcrumb from "@/app/components/Breadcrumb"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld"
import { ArrowLeft, Sun, Wind, Droplets } from "lucide-react"
import WikiPromo from "@/app/components/database/WikiPromo"
import EntityResources from "@/app/components/EntityResources"
import RelationshipSection from "@/app/components/database/RelationshipSection"
import CareClaims from "@/app/components/care/CareClaims"
import DifficultyContext from "@/app/components/database/DifficultyContext"
import RelatedArticles from "@/app/components/RelatedArticles"
import PortableText from "@/app/components/PortableText"
import { coralKnowledgeBodySections, linkedProblemsHeading } from "@/lib/species-facts"
import KnowledgeHubLinks from "@/app/components/KnowledgeHubLinks"
import { getHubLinksForEntity } from "@/lib/hubs"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600

export async function generateStaticParams() {
  const items = await getDatabaseList("coral")
  return items.filter((item) => !!item.slug?.current).map((item) => ({ slug: item.slug!.current }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const item = await getDatabaseItem("coral", slug)
  if (!item) return { title: "Not found" }
  return buildDetailMetadata(item, {
    pathPrefix: "corals",
    slug,
    profileLabel: "Coral Profile",
    imageAltSuffix: "coral profile",
    fallbackDescription: (name) => `Coral care guide for ${name}`,
  })
}

function Parameter({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: string | number }) {
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

export default async function CoralDetailPage({ params }: Props) {
  const { slug } = await params
  const item = await getDatabaseItem("coral", slug)
  if (!item) notFound()

  const hubLinks = await getHubLinksForEntity("coral")
  const bodySections = coralKnowledgeBodySections(item.knowledgeBody)
  const reefCompatibility = interpretReefCompatibility(item)

  const difficultySources = (item.evidenceSources || []).filter((source: any) =>
    Array.isArray(source.supportedClaimKeys) && source.supportedClaimKeys.includes('difficulty')
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Database", href: "/database" },
        { label: "Corals", href: "/corals" },
        { label: item.name, href: `/corals/${slug}` },
      ])} />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Database", href: "/database" }, { label: "Corals", href: "/corals" }, { label: item.name }]} />
      <Link href="/corals" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-aqua-600 dark:hover:text-aqua-400 mt-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Corals
      </Link>

      <div className="grid lg:grid-cols-[380px_1fr] gap-8 mt-4">
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-aqua-50 dark:bg-slate-900">
          {item.mainImage ? (
            <Image
              src={urlFor(item.mainImage).width(760).height(570).url() || ""}
              alt={`${item.name} — coral${item.scientificName ? ` (${item.scientificName})` : ""}`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🪸</div>
          )}
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-1">{item.name}</h1>
          {item.scientificName && <p className="text-lg italic text-gray-500 dark:text-slate-400 mb-4">{item.scientificName}</p>}
          {item.excerpt && <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-6">{item.excerpt}</p>}

          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">Care Parameters</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Parameter icon={<Sun className="w-3.5 h-3.5" />} label="Light" value={item.light} />
            <Parameter icon={<Wind className="w-3.5 h-3.5" />} label="Flow" value={item.flow} />
            <Parameter label="Difficulty" value={item.difficulty} />
            <Parameter label="Placement" value={item.placement} />
            <Parameter label="Type" value={item.coralType ? item.coralType.toUpperCase() : undefined} />
            <Parameter label="Aggression" value={item.aggression} />
            <Parameter
              icon={<Droplets className="w-3.5 h-3.5" />}
              label="Reef compatibility"
              value={reefCompatibility?.label}
            />
            <Parameter label="Temperature" value={item.tempMinC !== undefined && item.tempMaxC !== undefined && item.tempMinC !== null && item.tempMaxC !== null ? `${item.tempMinC}–${item.tempMaxC}°C` : undefined} />
          </div>

          {reefCompatibility && (
            <p className="mt-3 text-xs leading-relaxed text-gray-600 dark:text-slate-300">
              {reefCompatibility.detail}
            </p>
          )}

          <DifficultyContext
            difficulty={item.difficulty}
            context={item.difficultyContext}
            confidence={item.difficultyConfidence}
            sources={difficultySources}
            notRecommendedFor={item.notRecommendedFor}
            suitabilityConditions={item.suitabilityConditions}
          />

          <CareClaims
            careBasis={item.careBasis}
            careConfidence={item.careConfidence}
            sources={item.evidenceSources}
            reviewStatus={item.reviewStatus}
            lastReviewedAt={item.lastReviewedAt}
            growthRisk={item.growthRisk}
            growthRiskNote={item.growthRiskNote}
            reefCompatibility={item.reefCompatibility}
            reefSafetyMeaning={item.reefSafetyMeaning ?? undefined}
          />

          {item.temperatureTolerance && (
            <p className="mt-3 text-xs leading-relaxed text-gray-600 dark:text-slate-300">
              <span className="font-semibold">Temperature tolerance note:</span> {item.temperatureTolerance}
            </p>
          )}

          {bodySections.map((section) => (
            <section key={section.title} className="mt-8">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">{section.title}</h2>
              <PortableText value={section.blocks} />
            </section>
          ))}

          <RelationshipSection title="Suitable Equipment" items={item.suitableEquipment || []} hrefPrefix="/equipment" />
          <RelationshipSection title={linkedProblemsHeading(bodySections)} items={item.relatedProblems || []} hrefPrefix="/problems" />

          <RelatedArticles items={item.relatedPosts} currentSlug={slug} />
          <KnowledgeHubLinks links={hubLinks} />
          <EntityResources type="coral" />
          <WikiPromo />
        </div>
      </div>
    </div>
  )
}
