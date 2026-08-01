"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { RotateCcw, Copy, Check, Plus, X, Minus, Search, TriangleAlert, CircleAlert, Info, CheckCircle2, Fish } from "lucide-react"
import {
  checkCompatibility,
  buildShareUrl,
  type CompatSpecies,
  type Selection,
  type Severity,
} from "@/lib/calculators/compatibility"
import { NumberField, ActionButtons, ResultPanel, ResultRow } from "./ToolForm"

const SEVERITY_STYLES: Record<Severity, { icon: React.ReactNode; row: string }> = {
  error: { icon: <CircleAlert className="w-4 h-4 text-red-500 shrink-0" />, row: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900" },
  warning: { icon: <TriangleAlert className="w-4 h-4 text-amber-500 shrink-0" />, row: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900" },
  info: { icon: <Info className="w-4 h-4 text-sky-500 shrink-0" />, row: "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900" },
  ok: { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />, row: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900" },
}

function parseFishParam(raw: string | null): Selection[] {
  if (!raw) return []
  return raw
    .split(",")
    .map((part) => {
      const [slug, count] = part.split(":")
      if (!slug) return null
      const n = parseInt(count || "1", 10)
      return { slug, count: Number.isFinite(n) && n > 0 ? Math.min(n, 50) : 1 }
    })
    .filter((s): s is Selection => Boolean(s))
}

export default function CompatibilityChecker({ species }: { species: CompatSpecies[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bySlug = useMemo(() => Object.fromEntries(species.map((s) => [s.slug, s])), [species])

  const [tankL, setTankL] = useState("")
  const [selections, setSelections] = useState<Selection[]>([])
  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)
  const [calculated, setCalculated] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const tank = searchParams.get("tank")
    if (tank && Number.isFinite(parseFloat(tank))) setTankL(tank)
    const fish = parseFishParam(searchParams.get("fish"))
    setSelections(fish.filter((s) => bySlug[s.slug]))
  }, [bySlug, searchParams])

  const syncUrl = (t: number, sel: Selection[]) => {
    const url = buildShareUrl(Number.isFinite(t) && t > 0 ? t : 0, sel)
    router.replace(url, { scroll: false })
  }

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return species
      .filter((s) => s.name.toLowerCase().includes(q) || (s.scientificName || "").toLowerCase().includes(q))
      .slice(0, 8)
  }, [query, species])

  const addSpecies = (slug: string) => {
    const s = bySlug[slug]
    if (!s || selections.some((x) => x.slug === slug)) return
    const next = [...selections, { slug, count: s.schooling ? 6 : 1 }]
    setSelections(next)
    setQuery("")
    syncUrl(parseFloat(tankL), next)
  }

  const updateCount = (slug: string, delta: number) => {
    const next = selections
      .map((s) => (s.slug === slug ? { ...s, count: Math.max(1, Math.min(50, s.count + delta)) } : s))
    setSelections(next)
    syncUrl(parseFloat(tankL), next)
  }

  const removeSpecies = (slug: string) => {
    const next = selections.filter((s) => s.slug !== slug)
    setSelections(next)
    setCalculated(false)
    syncUrl(parseFloat(tankL), next)
  }

  const reset = () => {
    setSelections([])
    setCalculated(false)
    setQuery("")
    router.replace("/tools/compatibility-checker", { scroll: false })
  }

  const onCalculate = () => {
    setCalculated(true)
    const parsed = parseFloat(tankL)
    syncUrl(Number.isFinite(parsed) && parsed > 0 ? parsed : 0, selections)
  }

  const result = useMemo(() => {
    if (!calculated) return null
    const parsed = parseFloat(tankL)
    if (!Number.isFinite(parsed) || parsed <= 0 || selections.length === 0) return null
    return checkCompatibility(bySlug, selections, parsed)
  }, [calculated, tankL, selections, bySlug])

  const copyLink = async () => {
    const url = buildShareUrl(parseFloat(tankL) || 0, selections)
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  const countErrors = result ? result.pairIssues.reduce((n, p) => n + p.issues.filter((i) => i.severity === "error").length, 0) : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
      <div>
        <NumberField
          id="tank-volume"
          label="Tank volume (liters)"
          value={tankL}
          onChange={(v) => setTankL(v)}
          placeholder="e.g. 100"
          hint="Needed for the 1″/gallon capacity check."
        />

        <div className="mt-5">
          <label htmlFor="species-search" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
            Add fish species
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="species-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              placeholder="Search by name — e.g. neon tetra"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-aqua-500/50"
            />
            {focused && matches.length > 0 && (
              <div className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg">
                {matches.map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    onMouseDown={() => addSpecies(s.slug)}
                    className="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-aqua-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Fish className="w-4 h-4 text-aqua-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-900 dark:text-slate-100">{s.name}</span>
                    {s.schooling && <span className="ml-auto text-xs text-gray-400 shrink-0">schooling</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selections.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {selections.map((sel) => {
              const s = bySlug[sel.slug]
              return (
                <div
                  key={sel.slug}
                  className="flex items-center gap-1.5 rounded-full bg-aqua-50 dark:bg-aqua-950/40 border border-aqua-200 dark:border-aqua-900 pl-3 pr-1.5 py-1.5"
                >
                  <span className="text-sm font-medium text-gray-800 dark:text-slate-200">{s?.name}</span>
                  <span className="flex items-center gap-1">
                    <button type="button" aria-label="Fewer" onClick={() => updateCount(sel.slug, -1)} className="p-0.5 rounded hover:bg-aqua-100 dark:hover:bg-slate-700">
                      <Minus className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                    <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 min-w-4 text-center">{sel.count}</span>
                    <button type="button" aria-label="More" onClick={() => updateCount(sel.slug, 1)} className="p-0.5 rounded hover:bg-aqua-100 dark:hover:bg-slate-700">
                      <Plus className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  </span>
                  <button type="button" aria-label={`Remove ${s?.name}`} onClick={() => removeSpecies(sel.slug)} className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-950">
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <ActionButtons onCalculate={onCalculate} onReset={reset} />
      </div>

      <div>
        <ResultPanel emptyText="Add species and click Calculate to check compatibility, tank requirements and stocking levels.">
          {result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    result.status === "overstocked"
                      ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                      : result.status === "at-capacity"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                  }`}
                >
                  {result.status === "overstocked" ? "Overstocked" : result.status === "at-capacity" ? "At capacity" : "Comfortably stocked"}
                </span>
                {countErrors > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                    {countErrors} conflict{countErrors > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                <ResultRow label="Capacity (1″/gal)" value={`${result.capacityCm} cm`} />
                <ResultRow label="Total adult length" value={`${result.totalCm} cm`} />
                <ResultRow label="Utilization" value={`${result.utilizationPercent}%`} strong />
              </div>

              {result.tankIssues.length > 0 && (
                <div className="space-y-2">
                  {result.tankIssues.map((issue, i) => {
                    const style = SEVERITY_STYLES[issue.severity]
                    return (
                      <div key={`t-${i}`} className={`flex gap-2 items-start rounded-lg border px-3 py-2 text-xs leading-relaxed text-gray-700 dark:text-slate-300 ${style.row}`}>
                        {style.icon}
                        <span>{issue.message}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {result.pairIssues.map((pair) => (
                <div key={`${pair.a}-${pair.b}`} className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-slate-300 capitalize">
                    {bySlug[pair.a]?.name} × {bySlug[pair.b]?.name}
                  </h3>
                  {pair.issues.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">No obvious conflicts on temperature, pH or temperament.</p>
                  ) : (
                    <div className="space-y-2">
                      {pair.issues.map((issue, i) => {
                        const style = SEVERITY_STYLES[issue.severity]
                        return (
                          <div key={`p-${i}`} className={`flex gap-2 items-start rounded-lg border px-3 py-2 text-xs leading-relaxed text-gray-700 dark:text-slate-300 ${style.row}`}>
                            {style.icon}
                            <span>{issue.message}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}

              {result.pairIssues.length === 0 && result.tankIssues.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">All checks passed for this stocking plan.</p>
              )}

              <button
                type="button"
                onClick={copyLink}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-aqua-300 dark:border-aqua-800 text-sm font-medium text-aqua-700 dark:text-aqua-300 hover:bg-aqua-50 dark:hover:bg-aqua-950/40 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Link copied" : "Copy shareable link"}
              </button>
            </div>
          )}
        </ResultPanel>
      </div>
    </div>
  )
}
