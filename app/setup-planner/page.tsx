import type { Metadata } from "next"
import SetupPlanner from "@/app/components/tools/SetupPlanner"
import { ListChecks } from "lucide-react"

export const metadata: Metadata = {
  title: "Aquarium Setup Planner — AquaMind",
  description: "Plan your new aquarium step by step: choose a tank type, estimate the volume and get a personalized checklist with equipment, plants and fish.",
  alternates: { canonical: "https://aquamind.life/setup-planner" },
}

export default function SetupPlannerPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-aqua-600 dark:text-aqua-400 text-sm font-medium mb-2">
          <ListChecks className="w-4 h-4" />
          Setup Planner
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Aquarium Setup Planner</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed max-w-2xl">
          Answer three questions and get a step-by-step plan for your first tank — equipment, plants, fish and
          the maintenance routine that fits your schedule.
        </p>
      </div>

      <SetupPlanner />

      <div className="mt-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
        Every plan assumes a fully cycled tank before adding fish. Cycling takes 4–8 weeks — resist the urge to
        speed it up. Test ammonia, nitrite and nitrate weekly with a liquid test kit.
      </div>
    </div>
  )
}
