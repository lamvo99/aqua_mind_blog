import type { Metadata } from "next"
import Link from "next/link"
import { getProblemsList } from "@/lib/database"
import { problemCategories } from "@/lib/navigation"
import Breadcrumb from "@/app/components/Breadcrumb"
import { Wrench } from "lucide-react"

export const metadata: Metadata = {
  title: "Aquarium Problem Solver — AquaMind",
  description: "Solve aquarium problems: cloudy water, algae outbreaks, sick fish, plant issues and equipment failures.",
  alternates: { canonical: "https://aquamind.life/problems" },
}

export const revalidate = 300

const categoryIcons: Record<string, string> = {
  water: "💧",
  algae: "🟢",
  plants: "🌿",
  fish: "🐠",
  equipment: "⚙️",
}

export default async function ProblemsPage() {
  const problems = await getProblemsList()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Problems" }]} />
      </div>
      <div className="mb-10">
        <div className="flex items-center gap-2 text-aqua-600 dark:text-aqua-400 text-sm font-medium mb-2">
          <Wrench className="w-4 h-4" />
          Problem Solver
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Aquarium Problems</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed max-w-2xl">
          Symptoms, common causes and what to check — for the most common aquarium issues.
        </p>
      </div>

      {problemCategories.map((cat) => {
        const catProblems = problems.filter((p: any) => p.category === cat)
        if (catProblems.length === 0) return null
        return (
          <div key={cat} className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4 capitalize flex items-center gap-2">
              {categoryIcons[cat]}
              {cat}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {catProblems.map((p: any) => (
                <Link
                  key={p._id}
                  href={`/problems/${p.slug?.current}`}
                  className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5 hover:shadow-lg hover:border-aqua-300 dark:hover:border-aqua-800 transition-all card-hover"
                >
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-1 group-hover:text-aqua-600">{p.title}</h3>
                  {p.excerpt && <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2">{p.excerpt}</p>}
                </Link>
              ))}
            </div>
          </div>
        )
      })}

      {problems.length === 0 && (
        <div className="text-center py-16 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <p className="text-gray-900 dark:text-slate-100 font-medium mb-1">Problem guides coming soon</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">We are building structured guides for common aquarium issues.</p>
        </div>
      )}
    </div>
  )
}
