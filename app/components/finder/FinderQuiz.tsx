"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, RotateCcw, Fish, Sprout, Waves } from "lucide-react"
import { findMatches, type FinderAnswers, type FinderItem, type FinderResult } from "@/lib/finder"

const QUESTIONS = [
  {
    id: "water",
    title: "What kind of aquarium are you setting up?",
    options: [
      { value: "freshwater", label: "Freshwater community", desc: "Fish-only freshwater tank" },
      { value: "planted", label: "Planted tank", desc: "Live plants are the focus" },
      { value: "reef", label: "Saltwater reef", desc: "Corals and marine fish" },
    ],
  },
  {
    id: "tank",
    title: "How big is your tank?",
    options: [
      { value: "small", label: "Small — under 40 L", desc: "Nano tanks, desktop setups" },
      { value: "medium", label: "Medium — 40 to 150 L", desc: "The most common size" },
      { value: "large", label: "Large — over 150 L", desc: "Room for almost anything" },
    ],
  },
  {
    id: "experience",
    title: "How experienced are you?",
    options: [
      { value: "beginner", label: "Just starting out", desc: "First aquarium" },
      { value: "intermediate", label: "A few tanks behind me", desc: "Comfortable with basics" },
      { value: "advanced", label: "Experienced hobbyist", desc: "Ready for challenging species" },
    ],
  },
  {
    id: "light",
    title: "What lighting do you have or plan?",
    options: [
      { value: "low", label: "Low light", desc: "Basic stock LEDs" },
      { value: "medium", label: "Medium light", desc: "Decent growth for most plants" },
      { value: "high", label: "High light", desc: "Strong LED or metal halide" },
    ],
  },
] as const

const TYPE_META = {
  species: { label: "Fish", icon: <Fish className="w-4 h-4" />, path: "/species" },
  plant: { label: "Plant", icon: <Sprout className="w-4 h-4" />, path: "/plants" },
  coral: { label: "Coral", icon: <Waves className="w-4 h-4" />, path: "/corals" },
}

const DIFF_COLORS: Record<string, string> = {
  Beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  Intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  Advanced: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  Expert: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
}

export default function FinderQuiz({ items }: { items: FinderItem[] }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<FinderAnswers>>({})
  const [results, setResults] = useState<FinderResult[] | null>(null)

  const current = QUESTIONS[step]
  const picked = answers[current.id as keyof FinderAnswers] as string | undefined

  const pick = (value: string) => {
    const next = { ...answers, [current.id]: value }
    setAnswers(next)
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1)
    } else {
      setResults(findMatches(items, next as FinderAnswers))
    }
  }

  const restart = () => {
    setAnswers({})
    setStep(0)
    setResults(null)
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
            <p className="text-gray-900 dark:text-slate-100 font-medium mb-1">No perfect matches found</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              Try loosening your answers — e.g. a smaller tank or lower lighting.
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
            {results.slice(0, 12).map((r) => {
              const meta = TYPE_META[r.item._type]
              return (
                <Link
                  key={r.item._id}
                  href={`${meta.path}/${r.item.slug.current}`}
                  className="group rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5 hover:shadow-lg hover:border-aqua-300 dark:hover:border-aqua-800 transition-all card-hover"
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
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
                    {r.item.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-3">
                    {r.item.tankSizeMinL ? `Min tank ${r.item.tankSizeMinL} L · ` : ""}
                    {r.item.tempMinC != null && r.item.tempMaxC != null ? `${r.item.tempMinC}–${r.item.tempMaxC}°C · ` : ""}
                    {r.item.phMin != null && r.item.phMax != null ? `pH ${r.item.phMin}–${r.item.phMax}` : ""}
                    {r.item.light ? `Light: ${r.item.light}` : ""}
                  </p>
                  <ul className="space-y-1">
                    {r.reasons.slice(0, 3).map((reason, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-slate-300">
                        <span className="text-aqua-500 mt-0.5 shrink-0">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </Link>
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
          const active = answers[current.id as keyof FinderAnswers] === opt.value
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
          onClick={() => setResults(findMatches(items, answers as FinderAnswers))}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 gradient-bg text-white font-semibold rounded-xl hover:opacity-90 transition-all"
        >
          Show my matches
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
