import type { Metadata } from "next"
import Link from "next/link"
import { Ruler, Droplets, Wind, Syringe, Waves, FlaskConical, Lightbulb, Fish, ListChecks, HeartCrack, LayoutDashboard, Stethoscope, ArrowRight } from "lucide-react"
import { toolsNav } from "@/lib/navigation"
import Breadcrumb from "@/app/components/Breadcrumb"

export const metadata: Metadata = {
  title: "Aquarium Tools & Calculators — AquaMind",
  description: "Free aquarium tools: setup planner, tank volume, water changes, CO₂, dosing, pump flow, salt mixing, lighting and stocking calculators.",
  alternates: { canonical: "https://aquamind.life/tools" },
}

const icons: Record<string, React.ReactNode> = {
  "/setup-planner": <ListChecks className="w-6 h-6" />,
  "/tools/aquarium-volume": <Ruler className="w-6 h-6" />,
  "/tools/water-change": <Droplets className="w-6 h-6" />,
  "/tools/co2": <Wind className="w-6 h-6" />,
  "/tools/dosing": <Syringe className="w-6 h-6" />,
  "/tools/pump-flow": <Waves className="w-6 h-6" />,
  "/tools/salt-mixing": <FlaskConical className="w-6 h-6" />,
  "/tools/lighting": <Lightbulb className="w-6 h-6" />,
  "/tools/stocking": <Fish className="w-6 h-6" />,
  "/tools/compatibility-checker": <HeartCrack className="w-6 h-6" />,
  "/tools/aquarium-calculator": <LayoutDashboard className="w-6 h-6" />,
  "/tools/diagnostic": <Stethoscope className="w-6 h-6" />,
}

export default function ToolsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Tools" }]} />
      </div>
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Aquarium Tools</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed max-w-2xl">
          Practical calculators to help you plan your aquarium — from tank volume to water changes and CO₂.
          Every tool explains its assumptions so you know exactly what the numbers mean.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {toolsNav.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-aqua-300 dark:hover:border-aqua-800 transition-all card-hover"
          >
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
              {icons[tool.href]}
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
              {tool.label}
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{tool.description}</p>
            <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-aqua-600 dark:text-aqua-400">
              Open tool
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
