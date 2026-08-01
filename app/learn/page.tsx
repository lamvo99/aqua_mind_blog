import type { Metadata } from "next"
import Link from "next/link"
import Breadcrumb from "@/app/components/Breadcrumb"
import { client } from "@/lib/sanity"
import { GraduationCap, ArrowRight, Compass } from "lucide-react"

export const metadata: Metadata = {
  title: "Learning Paths — AquaMind",
  description: "Structured step-by-step learning paths for freshwater, planted and marine aquariums — from the nitrogen cycle to a thriving reef.",
  alternates: { canonical: "https://aquamind.life/learn" },
}

export const revalidate = 86400

const LEVEL_COLORS: Record<string, string> = {
  Beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  Intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  Advanced: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
}

async function getCollections() {
  return await client.fetch(
    `*[_type == "collection" && defined(slug) && defined(title)] | order(level asc, title asc) {
      _id, title, slug, description, level, topic, mainImage,
      "stepCount": count(steps)
    }`
  )
}

export default async function LearnPage() {
  const collections = await getCollections()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Learn" }]} />
      </div>
      <div className="mb-10">
        <div className="flex items-center gap-2 text-aqua-600 dark:text-aqua-400 text-sm font-medium mb-2">
          <GraduationCap className="w-4 h-4" />
          Learning Paths
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Learn step by step</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed max-w-2xl">
          Each path takes you from zero to a stable, thriving tank in ordered steps — mark steps as
          done and track your progress. New to everything?{" "}
          <Link href="/start-here" className="text-aqua-600 dark:text-aqua-400 underline">
            start here
          </Link>
          .
        </p>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <p className="text-gray-900 dark:text-slate-100 font-medium mb-1">Learning paths coming soon</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">Follow the beginner journey in the meantime.</p>
          <Link href="/start-here" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold">
            <Compass className="w-4 h-4" />
            Start Here
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {collections.map((c: any) => (
            <Link
              key={c._id}
              href={`/learn/${c.slug.current}`}
              className="group rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-aqua-300 dark:hover:border-aqua-800 transition-all card-hover flex flex-col"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${LEVEL_COLORS[c.level] || ""}`}>
                  {c.level || "All levels"}
                </span>
                {c.topic && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-aqua-50 dark:bg-aqua-950/40 text-aqua-700 dark:text-aqua-300">
                    {c.topic}
                  </span>
                )}
                <span className="ml-auto text-xs font-medium text-gray-400 dark:text-slate-500">
                  {c.stepCount} steps
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
                {c.title}
              </h2>
              {c.description && (
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-3">{c.description}</p>
              )}
              <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-aqua-600 dark:text-aqua-400">
                Open path
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
