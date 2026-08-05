"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Stethoscope, ArrowRight, RotateCcw, CheckCircle2 } from "lucide-react"
import { SYMPTOM_OPTIONS, diagnoseProblems, type ProblemForDiagnosis } from "@/lib/diagnosis"

const CATEGORY_LABELS: Record<string, string> = {
  water: "Water quality",
  algae: "Algae",
  plants: "Plants",
  fish: "Fish health",
  equipment: "Equipment",
}

export default function DiagnosisWizard({ problems }: { problems: ProblemForDiagnosis[] }) {
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const results = useMemo(() => diagnoseProblems(problems, selected), [problems, selected])

  const labelFor = (id: string) => SYMPTOM_OPTIONS.find((s) => s.id === id)?.label

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Select every symptom you can observe — the more you pick, the more accurate the ranking.
          </p>
          <p className="shrink-0 text-xs font-semibold text-aqua-700 dark:text-aqua-300" aria-hidden="true">
            {selected.length}/{SYMPTOM_OPTIONS.length}
          </p>
        </div>
        <div
          className="mb-5 h-1.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={SYMPTOM_OPTIONS.length}
          aria-valuenow={selected.length}
          aria-label="Symptoms selected"
        >
          <div
            className="h-full gradient-bg rounded-full transition-all duration-300"
            style={{ width: `${(selected.length / SYMPTOM_OPTIONS.length) * 100}%` }}
          />
        </div>
        <div className="space-y-2.5">
          {SYMPTOM_OPTIONS.map((symptom) => {
            const active = selected.includes(symptom.id)
            return (
              <button
                key={symptom.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(symptom.id)}
                className={`w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                  active
                    ? "border-aqua-400 bg-aqua-50 dark:border-aqua-700 dark:bg-aqua-950/40"
                    : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-aqua-300 dark:hover:border-aqua-800"
                }`}
              >
                <span
                  className={`mt-0.5 w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                    active ? "bg-aqua-500 border-aqua-500 text-white" : "border-gray-300 dark:border-slate-500"
                  }`}
                >
                  {active && <CheckCircle2 className="w-3 h-3" />}
                </span>
                <span className={`font-medium ${active ? "text-aqua-900 dark:text-aqua-200" : "text-gray-700 dark:text-slate-300"}`}>
                  {symptom.label}
                </span>
              </button>
            )
          })}
        </div>
        {selected.length > 0 && (
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={() => setSelected([])}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-aqua-50 to-ocean-50 dark:from-aqua-950/30 dark:to-ocean-950/30 border border-aqua-100 dark:border-aqua-900/50 p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-aqua-500" />
          Likely causes
        </h2>
        {selected.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
            Select at least one symptom to see matching problems ranked by how many of your symptoms they explain.
          </p>
        ) : results.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
            No known problem matches these symptoms. Check our{" "}
            <Link href="/problems" className="text-aqua-600 dark:text-aqua-400 underline">
              full problems list
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3">
            {results.slice(0, 6).map((r) => (
              <Link
                key={r.problem._id}
                href={`/problems/${r.problem.slug.current}`}
                className="block rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-4 hover:border-aqua-300 dark:hover:border-aqua-800 transition-all"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{r.problem.title}</h3>
                  <span className="text-xs font-bold text-aqua-700 dark:text-aqua-300 shrink-0">{r.score}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 mb-2.5 overflow-hidden">
                  <div className="h-full gradient-bg rounded-full" style={{ width: `${r.score}%` }} />
                </div>
                {r.problem.category && (
                  <span className="inline-block text-[11px] font-medium text-gray-500 dark:text-slate-400 mb-1.5">
                    {CATEGORY_LABELS[r.problem.category] || r.problem.category}
                  </span>
                )}
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  Matches: {r.matched.map((m) => labelFor(m)).filter(Boolean).join(" · ")}
                </p>
                <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-aqua-600 dark:text-aqua-400">
                  Read guide
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
