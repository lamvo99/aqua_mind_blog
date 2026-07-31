import type { Metadata } from "next"
import Link from "next/link"
import {
  Compass,
  Droplets,
  FlaskConical,
  Fish,
  CalendarCheck,
  ArrowRight,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Start Here: The Beginner's Journey — AquaMind",
  description: "New to fishkeeping? Follow this proven path: understand the nitrogen cycle, set up your first tank, choose fish and keep it stable — all free, all verified.",
  alternates: { canonical: "https://aquamind.life/start-here" },
}

const steps = [
  {
    icon: FlaskConical,
    title: "Understand the nitrogen cycle",
    description:
      "Every aquarium is a tiny ecosystem. Before buying fish, learn how beneficial bacteria turn toxic ammonia into safe nitrate. This one concept prevents 90% of beginner disasters.",
    links: [
      { href: "/posts/the-nitrogen-cycle-the-foundation-of-every-aquarium", label: "The Nitrogen Cycle: The Foundation of Every Aquarium" },
      { href: "/posts/the-nitrogen-cycle-explained-simply", label: "The Nitrogen Cycle Explained Simply" },
      { href: "/problems/high-ammonia", label: "High ammonia: symptoms & fix" },
    ],
  },
  {
    icon: Droplets,
    title: "Set up and cycle your tank",
    description:
      "Choose a size you can maintain, install the filter and heater, and run a full fishless cycle for 4–8 weeks. Bigger tanks are actually easier for beginners because water conditions change slower.",
    links: [
      { href: "/setup-planner", label: "Use the Setup Planner" },
      { href: "/posts/setting-up-a-40cm-aquarium-for-beginners-step-by-step", label: "Setting up a 40cm aquarium step by step" },
      { href: "/posts/budgeting-for-your-first-aquarium-how-much-is-enough", label: "Budgeting for your first aquarium" },
      { href: "/equipment", label: "Equipment database: filters, heaters, lights" },
      { href: "/tools/aquarium-volume", label: "Volume calculator" },
    ],
  },
  {
    icon: Fish,
    title: "Add fish the right way",
    description:
      "Start with hardy species, add them slowly (3–4 at a time), and always check the adult size — most 'small' fish grow much bigger than expected. Never stock based on current size.",
    links: [
      { href: "/posts/the-easiest-aquarium-fish-for-beginners", label: "The easiest aquarium fish for beginners" },
      { href: "/posts/keeping-aquarium-fish-where-to-start-a-complete-beginner-s-guide", label: "Where to start: a complete beginner's guide" },
      { href: "/species", label: "Species database with care parameters" },
      { href: "/tools/stocking", label: "Stocking calculator" },
    ],
  },
  {
    icon: CalendarCheck,
    title: "Build a maintenance routine",
    description:
      "Consistency beats intensity. A small weekly routine — water change, glass cleaning, filter check — keeps the tank stable and fish healthy for years.",
    links: [
      { href: "/posts/how-often-should-you-change-aquarium-water", label: "How often should you change aquarium water?" },
      { href: "/posts/how-to-change-aquarium-water-without-stressing-fish", label: "Water changes without stressing fish" },
      { href: "/tools/water-change", label: "Water change calculator" },
      { href: "/problems", label: "Common problems & solutions" },
    ],
  },
  {
    icon: Compass,
    title: "Keep exploring",
    description:
      "Once your tank is stable, the hobby opens up: planted aquascapes, reef tanks, breeding, paludariums. Everything on AquaMind is free and backed by verified data.",
    links: [
      { href: "/posts/your-first-30-days-with-an-aquarium-a-beginner-s-journal", label: "Your first 30 days: a beginner's journal" },
      { href: "/posts/20-30l-nano-aquarium-the-perfect-choice-for-beginners", label: "Is a nano tank right for you?" },
      { href: "/inspiration", label: "Inspiration gallery" },
      { href: "/tools", label: "All calculators" },
    ],
  },
]

export default function StartHerePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 text-aqua-600 dark:text-aqua-400 text-sm font-medium mb-3">
          <Compass className="w-4 h-4" />
          Start Here
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-4">
          The Beginner&apos;s Journey
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto">
          A proven path from &quot;I want fish&quot; to a thriving, stable aquarium — in five steps, each with
          the guides, tools and data you need.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="relative rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex w-12 h-12 rounded-xl gradient-bg items-center justify-center text-white shrink-0">
                <step.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-bold gradient-text">0{i + 1}</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{step.title}</h2>
                </div>
                <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">{step.description}</p>
                <div className="flex flex-col gap-1.5">
                  {step.links.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="group inline-flex items-center gap-1.5 text-sm text-aqua-600 dark:text-aqua-400 hover:underline w-fit"
                    >
                      {l.label}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 p-5 rounded-2xl bg-aqua-50 dark:bg-aqua-950/30 border border-aqua-100 dark:border-aqua-900/50 text-center">
        <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-2">Short on time?</h2>
        <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
          Follow the Setup Planner to get a personalized plan in under a minute.
        </p>
        <Link
          href="/setup-planner"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 gradient-bg text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
        >
          Open the Setup Planner
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
