"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, RotateCcw, Fish, Sprout, Waves, Bug, Wrench } from "lucide-react"
import {
  findMatches,
  paramsToIntent,
  intentToParams,
  type FinderIntent,
  type FinderItem,
  type FinderResult,
  type MatchStatus,
} from "@/lib/finder"

const QUESTIONS = [
  {
    id: "waterType",
    title: "What kind of aquarium are you setting up?",
    options: [
      { value: "freshwater", label: "Freshwater", desc: "Community or planted tank" },
      { value: "saltwater", label: "Saltwater", desc: "Reef or marine fish-only" },
    ],
  },
  {
    id: "tankRange",
    title: "How big is your tank?",
    options: [
      { value: "nano", label: "Nano — under 30 L", desc: "Desktop or Betta setups" },
      { value: "small", label: "Small — 30–80 L", desc: "Good starter sizes" },
      { value: "medium", label: "Medium — 80–200 L", desc: "The most popular range" },
      { value: "large", label: "Large — over 200 L", desc: "Room for almost anything" },
    ],
  },
  {
    id: "difficulty",
    title: "What's your experience level?",
    options: [
      { value: "beginner", label: "Beginner", desc: "Just starting out" },
      { value: "intermediate", label: "Intermediate", desc: "A few tanks behind me" },
      { value: "advanced", label: "Advanced", desc: "Ready for challenging species" },
    ],
  },
  {
    id: "light",
    title: "What lighting do you have or plan?",
    options: [
      { value: "low", label: "Low", desc: "Basic stock LEDs" },
      { value: "medium", label: "Medium", desc: "Decent growth for most plants" },
      { value: "high", label: "High", desc: "Strong LED or metal halide" },
    ],
  },
] as const

const TYPE_META: Record<string, { label: string; icon: JSX.Element; path: string }> = {
  species: { label: "Fish", icon: <Fish className="w-4 h-4" />, path: "/species" },
  plant: { label: "Plant", icon: <Sprout className="w-4 h-4" />, path: "/plants" },
  coral: { label: "Coral", icon: <Waves className="w-4 h-4" />, path: "/corals" },
  invertebrate: { label: "Invertebrate", icon: <Bug className="w-4 h-4" />, path: "/invertebrates" },
  equipment: { label: "Equipment", icon: <Wrench className="w-4 h-4" />, path: "/equipment" },
}

const DIFF_COLORS: Record<string, string> = {
  Beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  Intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  Advanced: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  Expert: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
}

const STATUS_ICONS: Record<MatchStatus, string> = {
  match: "\u2705",
  no_match: "\u274C",
  unknown: "\u2753",
}

export default function FinderQuiz({ items }: { items: FinderItem[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlIntent = paramsToIntent(searchParams.toString())

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<FinderIntent>>(urlIntent)
  const [results, setResults] = useState<FinderResult[] | null>(null)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  // Sync to URL on results
  useEffect(() => {
    if (results) {
      const params = intentToParams(answers as FinderIntent)
      router.replace(`/finder?${params}`, { scroll: false })
    }
  }, [results, answers, router])

  const current = QUESTIONS[step]
  const picked = answers[current.id as keyof FinderIntent] as string | undefined

  const pick = (value: string) => {
    const next = { ...answers, [current.id]: value }
    setAnswers(next)
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1)
    } else {
      setResults(findMatches(items, next as FinderIntent))
    }
  }

  const restart = () => {
    setAnswers({})
    setStep(0)
    setResults(null)
    setExpandedCard(null)
    router.replace("/finder", { scroll: false })
  }

  const toggleExpand = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id)
  }

  if (results) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
            Your matches ({results.length})
          </h2>
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
        </div>
        {results.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <p className="text-gray-900 dark:text-slate-100 font-medium mb-1">No matches found</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              Try loosening your constraints — e.g. a bigger tank or different lighting.
            </p>
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold hover:opacity-90 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Start over
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((r) => {
              const meta = TYPE_META[r.item._type]
              const expanded = expandedCard === r.item._id
              return (
                <div
                  key={r.item._id}
                  className="group rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5 hover:shadow-lg hover:border-aqua-300 dark:hover:border-aqua-800 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-aqua-600 dark:text-aqua-400">{meta.icon}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                      {meta.label}
                    </span>
                    {r.item.difficulty && (
                      <span className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full ${DIFF_COLORS[r.item.difficulty] || ""}`}>
                        {r.item.difficulty}
                      </span>
                    )}
                  </div>
                  <Link href={`${meta.path}/${r.item.slug.current}`}>
                    <h3 className="font-bold text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
                      {r.item.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-3">
                    {r.item.tankSizeMinL ? `Min tank ${r.item.tankSizeMinL}L · ` : ""}
                    {r.item.tempMinC != null && r.item.tempMaxC != null ? `${r.item.tempMinC}\u2013${r.item.tempMaxC}\u00b0C · ` : ""}
                    {r.item.phMin != null && r.item.phMax != null ? `pH ${r.item.phMin}\u2013${r.item.phMax}` : ""}
                    {r.item.light ? `Light: ${r.item.light}` : ""}
                  </p>

                  {/* Explanation */}
                  <ul className="space-y-1 mb-3">
                    {r.explanation.slice(0, 3).map((ex, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-slate-300">
                        <span className="text-aqua-500 mt-0.5 shrink-0">{"\u2022"}</span>
                        {ex}
                      </li>
                    ))}
                  </ul>

                  {/* Constraint details toggle */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(r.item._id)}
                    className="text-[11px] font-medium text-aqua-600 dark:text-aqua-400 hover:underline mb-2"
                  >
                    {expanded ? "Hide details" : "Show details"}
                  </button>

                  {expanded && (
                    <div className="mt-2 space-y-1 border-t border-gray-100 dark:border-slate-700 pt-2">
                      {r.constraints.map((c) => (
                        <div key={c.field} className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-slate-400">
                          <span>{STATUS_ICONS[c.status]}</span>
                          <span className="font-medium">{c.label}</span>
                          {c.detail && <span>{c.detail}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full gradient-bg rounded-full transition-all duration-300"
            style={{ width: `${((step + (picked ? 1 : 0)) / QUESTIONS.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
          {step + 1} / {QUESTIONS.length}
        </span>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">{current.title}</h2>
      <div className="space-y-3">
        {current.options.map((opt) => {
          const active = answers[current.id as keyof FinderIntent] === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => pick(opt.value)}
              className={`w-full text-left rounded-2xl border px-5 py-4 transition-all ${
                active
                  ? "border-aqua-400 bg-aqua-50 dark:border-aqua-700 dark:bg-aqua-950/40"
                  : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-aqua-300 dark:hover:border-aqua-800"
              }`}
            >
              <span className={`block font-semibold ${active ? "text-aqua-900 dark:text-aqua-200" : "text-gray-900 dark:text-slate-100"}`}>
                {opt.label}
              </span>
              <span className="block text-sm text-gray-500 dark:text-slate-400 mt-0.5">{opt.desc}</span>
            </button>
          )
        })}
      </div>

      {step > 0 && (
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
      )}

      {step === QUESTIONS.length - 1 && (
        <button
          type="button"
          onClick={() => setResults(findMatches(items, answers as FinderIntent))}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 gradient-bg text-white font-semibold rounded-xl hover:opacity-90 transition-all"
        >
          Show my matches
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
