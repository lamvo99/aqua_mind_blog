import Link from "next/link"
import { Calculator, ArrowRight, AlertTriangle } from "lucide-react"
import { JsonLd, howToSchema } from "@/lib/seo/jsonld"

interface CalculatorLayoutProps {
  title: string
  description: string
  children: React.ReactNode
  disclaimer?: string
  related?: { href: string; label: string }[]
  learn?: { href: string; label: string }[]
  howTo?: { url: string; steps: { name: string; text: string }[] }
}

export default function CalculatorLayout({
  title,
  description,
  children,
  disclaimer,
  related = [],
  learn = [],
  howTo,
}: CalculatorLayoutProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {howTo && howTo.steps.length > 0 && (
        <JsonLd data={howToSchema(title, description, howTo.steps, howTo.url)} />
      )}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-aqua-600 dark:text-aqua-400 text-sm font-medium mb-2">
          <Calculator className="w-4 h-4" />
          <Link href="/tools" className="hover:underline">
            Tools
          </Link>
          <span className="text-gray-400">/</span>
          <span>{title}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">{title}</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed">{description}</p>
      </div>

      {children}

      {disclaimer && (
        <div className="mt-8 flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{disclaimer}</p>
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-8 p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Related tools</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-sm text-aqua-700 dark:text-aqua-300 border border-aqua-100 dark:border-aqua-900/50 hover:bg-aqua-50 dark:hover:bg-aqua-950/50 transition-colors"
              >
                {item.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {learn.length > 0 && (
        <div className="mt-4 p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Learn more</h2>
          <div className="flex flex-wrap gap-2">
            {learn.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-sm text-aqua-700 dark:text-aqua-300 border border-aqua-100 dark:border-aqua-900/50 hover:bg-aqua-50 dark:hover:bg-aqua-950/50 transition-colors"
              >
                {item.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
