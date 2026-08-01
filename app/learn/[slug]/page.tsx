import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { urlFor, client } from "@/lib/sanity"
import Breadcrumb from "@/app/components/Breadcrumb"
import LearningPathChecklist, { type LearnStep } from "@/app/components/learn/LearningPathChecklist"
import { GraduationCap } from "lucide-react"

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600

const LEVEL_COLORS: Record<string, string> = {
  Beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  Intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  Advanced: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
}

async function getCollection(slug: string) {
  return await client.fetch(
    `*[_type == "collection" && slug.current == $slug][0] {
      _id, title, slug, description, level, topic, mainImage,
      steps[] {
        "key": _key,
        title, estimatedTime,
        "post": post->{ _id, title, slug, excerpt },
        "tool": tool->{ _id, name, slug, toolUrl, description }
      }
    }`,
    { slug }
  )
}

export async function generateStaticParams() {
  const slugs: { slug: string }[] = await client.fetch(
    `*[_type == "collection" && defined(slug)] { "slug": slug.current }`
  )
  return slugs
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const collection = await getCollection(slug)
  if (!collection) return { title: "Not found" }
  return {
    title: `${collection.title} — Learning Path`,
    description: collection.description || `A step-by-step learning path on AquaMind`,
    alternates: { canonical: `https://aquamind.life/learn/${slug}` },
  }
}

export default async function LearnPathPage({ params }: Props) {
  const { slug } = await params
  const collection = await getCollection(slug)
  if (!collection) notFound()

  const steps: LearnStep[] = (collection.steps || []).map((s: any) => ({
    key: s.key || `${s.title}-${s.post?._id || s.tool?._id || ""}`,
    title: s.title,
    estimatedTime: s.estimatedTime,
    post: s.post,
    tool: s.tool,
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Learn", href: "/learn" }, { label: collection.title }]} />
      </div>

      <div className="mb-8">
        {collection.mainImage && (
          <Image
            src={urlFor(collection.mainImage).width(1200).height(480).auto("format").url()}
            alt={collection.title}
            width={1200}
            height={480}
            className="rounded-2xl object-cover w-full mb-6"
          />
        )}
        <div className="flex items-center gap-2 text-aqua-600 dark:text-aqua-400 text-sm font-medium mb-2">
          <GraduationCap className="w-4 h-4" />
          {collection.topic || "Learning path"}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">{collection.title}</h1>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${LEVEL_COLORS[collection.level || ""] || ""}`}>
            {collection.level || "All levels"}
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
            {steps.length} steps
          </span>
        </div>
        {collection.description && (
          <p className="text-gray-600 dark:text-slate-300 leading-relaxed">{collection.description}</p>
        )}
      </div>

      <LearningPathChecklist slug={slug} steps={steps} level={collection.level} />

      <div className="mt-10 text-center">
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
        >
          Browse all learning paths
        </Link>
      </div>
    </div>
  )
}
