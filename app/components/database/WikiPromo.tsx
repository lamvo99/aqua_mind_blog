import Link from "next/link"
import { BookOpen, ArrowRight } from "lucide-react"

export default function WikiPromo() {
  return (
    <Link
      href="/wiki"
      className="mt-6 flex items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-br from-aqua-50 to-ocean-50 dark:from-aqua-950/30 dark:to-ocean-950/30 border border-aqua-100 dark:border-aqua-900/50 hover:border-aqua-300 dark:hover:border-aqua-700 transition-all group"
    >
      <div className="flex items-center gap-3">
        <BookOpen className="w-5 h-5 text-aqua-600 dark:text-aqua-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Explore the Aquarium Wiki</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Search fish, plants, corals & equipment side by side</p>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-aqua-500 shrink-0 transition-transform group-hover:translate-x-1" />
    </Link>
  )
}
