"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, RotateCcw, ExternalLink } from "lucide-react"

export interface LearnStep {
  key: string
  title: string
  estimatedTime?: string
  post?: { _id: string; title: string; slug: { current: string }; excerpt?: string } | null
  tool?: { _id: string; name: string; slug: { current: string }; toolUrl?: string; description?: string } | null
}

const LEVEL_COLORS: Record<string, string> = {
  Beginner: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  Intermediate: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  Advanced: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
}

export default function LearningPathChecklist({
  slug,
  steps,
  level,
}: {
  slug: string
  steps: LearnStep[]
  level?: string
}) {
  const storageKey = `aquamind_learn_${slug}`
  const [done, setDone] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setDone(JSON.parse(raw))
    } catch {
      /* storage unavailable */
    }
  }, [storageKey])

  const toggle = (key: string) => {
    const next = done.includes(key) ? done.filter((k) => k !== key) : [...done, key]
    setDone(next)
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      /* storage unavailable */
    }
  }

  const reset = () => {
    setDone([])
    try {
      localStorage.removeItem(storageKey)
    } catch {
      /* storage unavailable */
    }
  }

  const progress = steps.length > 0 ? Math.round((done.length / steps.length) * 100) : 0

  return (
    <div>
      <div className="mb-8 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${LEVEL_COLORS[level || ""] || "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300"}`}>
              {level || "All levels"}
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-slate-300">
              {done.length} of {steps.length} steps complete
            </span>
          </div>
          {done.length > 0 && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
        <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
          <div className="h-full gradient-bg rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
          {progress === 100 ? "Path complete — well done!" : "Progress is saved on this device only."}
        </p>
      </div>

      <ol className="space-y-4">
        {steps.map((step, i) => {
          const isDone = done.includes(step.key)
          const href = step.post
            ? `/posts/${step.post.slug.current}`
            : step.tool
              ? (step.tool.toolUrl || `/tools/${step.tool.slug.current}`)
              : null
          return (
            <li
              key={step.key}
              className={`rounded-2xl border p-5 transition-all ${
                isDone
                  ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20"
                  : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  aria-pressed={isDone}
                  aria-label={`Mark "${step.title}" complete`}
                  onClick={() => toggle(step.key)}
                  className={`mt-0.5 shrink-0 transition-colors ${isDone ? "text-emerald-500" : "text-gray-300 dark:text-slate-600 hover:text-aqua-500"}`}
                >
                  {isDone ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold text-gray-400 dark:text-slate-500">Step {String(i + 1).padStart(2, "0")}</span>
                    {step.estimatedTime && (
                      <span className="text-[11px] font-medium text-gray-400 dark:text-slate-500">≈ {step.estimatedTime}</span>
                    )}
                  </div>
                  <h3 className={`font-bold mb-1 ${isDone ? "text-emerald-800 dark:text-emerald-300 line-through decoration-emerald-400/50" : "text-gray-900 dark:text-slate-100"}`}>
                    {step.title}
                  </h3>
                  {href ? (
                    <Link
                      href={href}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-aqua-600 dark:text-aqua-400 hover:underline"
                    >
                      {step.post ? "Read the guide" : "Open the tool"}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  ) : null}
                  {step.post?.excerpt && !isDone && (
                    <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mt-1.5 line-clamp-2">{step.post.excerpt}</p>
                  )}
                  {step.tool?.description && !isDone && (
                    <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mt-1.5 line-clamp-2">{step.tool.description}</p>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
