import Link from "next/link"
import Breadcrumb from "@/app/components/Breadcrumb"
import { Droplets, Leaf, Fish, FlaskConical, ArrowRight } from "lucide-react"
import strings from "@/lib/i18n/strings"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About AquaMind",
  description: "AquaMind's story and mission: free, verified aquascaping and aquarium knowledge for fishkeepers of every level.",
  alternates: { canonical: "https://aquamind.life/about" },
}

const values = [
  {
    icon: Leaf,
    title: "Aquascaping",
    desc: "The art of planted aquarium design — from Nature Aquarium to Iwagumi, Dutch, and Jungle styles.",
  },
  {
    icon: Fish,
    title: "Fishkeeping",
    desc: "Detailed fish care guides, from neon tetras and guppies to discus and arowana.",
  },
  {
    icon: FlaskConical,
    title: "Water chemistry",
    desc: "Water parameters, fertilizers, CO₂ and filtration systems for planted aquariums.",
  },
  {
    icon: Droplets,
    title: "Equipment",
    desc: "Guides for choosing lights, filters, CO₂, substrates and other aquascaping gear.",
  },
]

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-aqua-50 to-ocean-50 dark:from-slate-900 dark:to-slate-800 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6 flex justify-center">
            <Breadcrumb items={[{ label: strings.nav.about }]} />
          </div>
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-4">
            {strings.about.title}
          </h1>
          <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
            {strings.about.desc}
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Our mission</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              AquaMind Blog was created to become a leading resource for aquascaping and fishkeeping.
              We believe anyone can create a beautiful aquarium — and the right knowledge is the key
              to making that happen.
            </p>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              Whether you are just starting out or have years of experience, AquaMind always brings
              you carefully researched, high-quality articles that help you understand the
              fascinating world of aquascaping.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-20 bg-gray-50/50 dark:bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
              What we cover
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mt-2">In-depth knowledge of every aspect of the hobby</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((item) => (
              <div key={item.title} className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 card-hover">
                <div className="w-12 h-12 rounded-xl bg-aqua-50 dark:bg-aqua-950/50 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-aqua-600 dark:text-aqua-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">
            Start your aquascaping journey
          </h2>
          <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-lg mx-auto">
            Explore our library of aquascaping knowledge and start building the aquarium you&apos;ve dreamed of.
          </p>
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 px-6 py-3 gradient-bg text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-aqua-500/25"
          >
            Explore articles
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
