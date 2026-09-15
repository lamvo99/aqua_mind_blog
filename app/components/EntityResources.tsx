import Link from "next/link"
import { Bug, Wrench, ArrowRight } from "lucide-react"

interface ResourceLink {
  href: string
  label: string
}

const ENTITY_TOOLS: Record<string, ResourceLink[]> = {
  species: [
    { href: "/tools/stocking", label: "Stocking calculator" },
    { href: "/tools/compatibility-checker", label: "Compatibility checker" },
  ],
  invertebrate: [
    { href: "/tools/stocking", label: "Stocking calculator" },
    { href: "/tools/compatibility-checker", label: "Compatibility checker" },
  ],
  plant: [
    { href: "/tools/lighting", label: "Lighting calculator" },
    { href: "/tools/co2", label: "CO₂ estimator" },
    { href: "/tools/dosing", label: "Dosing calculator" },
  ],
  coral: [
    { href: "/tools/compatibility-checker", label: "Compatibility checker" },
    { href: "/tools/salt-mixing", label: "Salt mixing calculator" },
  ],
  equipment: [
    { href: "/tools/pump-flow", label: "Pump flow calculator" },
    { href: "/tools/lighting", label: "Lighting calculator" },
  ],
}

const ENTITY_PROBLEMS: Record<string, ResourceLink> = {
  species: { href: "/problems", label: "Common fish problems" },
  invertebrate: { href: "/problems", label: "Common invertebrate problems" },
  plant: { href: "/problems", label: "Common plant problems" },
  coral: { href: "/problems", label: "Common coral problems" },
  equipment: { href: "/problems", label: "Common equipment problems" },
}

export default function EntityResources({ type }: { type: string }) {
  const tools = ENTITY_TOOLS[type] || []
  const problems = ENTITY_PROBLEMS[type]

  if (tools.length === 0 && !problems) return null

  return (
    <div className="rounded-2xl bg-aqua-50 dark:bg-aqua-950/30 border border-aqua-100 dark:border-aqua-900/50 p-5">
      <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-3">
        Related resources
      </h2>
      <div className="flex flex-col gap-2">
        {problems && (
          <Link
            href={problems.href}
            className="group flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-4 py-3 hover:border-aqua-300 dark:hover:border-aqua-700 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
              <Bug className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                Solve
              </span>
              <p className="text-sm font-medium text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors truncate">
                {problems.label}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-aqua-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        )}
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-4 py-3 hover:border-aqua-300 dark:hover:border-aqua-700 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-aqua-100 dark:bg-aqua-900/50 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4 text-aqua-600 dark:text-aqua-400" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-aqua-600 dark:text-aqua-400 uppercase tracking-wide">
                Tool
              </span>
              <p className="text-sm font-medium text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors truncate">
                {tool.label}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-aqua-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
