import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { client } from "@/lib/sanity"
import Breadcrumb from "@/app/components/Breadcrumb"
import PortableText from "@/app/components/PortableText"
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld"
import { ArrowLeft, AlertTriangle, Search, XCircle, ListChecks } from "lucide-react"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const item = await client.fetch(
    `*[_type == "problem" && slug.current == $slug][0] { title, excerpt }`,
    { slug }
  )
  if (!item) return { title: "Not found" }
  return {
    title: `${item.title} — Aquarium Problem`,
    description: item.excerpt,
    alternates: { canonical: `https://aquamind.life/problems/${slug}` },
    openGraph: {
      title: `${item.title} — Aquarium Problem`,
      description: item.excerpt,
      type: "article",
      url: `https://aquamind.life/problems/${slug}`,
    },
  }
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 mb-4">
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">
        {icon}
        {title}
      </h2>
      <div className="text-gray-600 dark:text-slate-300 leading-relaxed">{children}</div>
    </div>
  )
}

export default async function ProblemDetailPage({ params }: Props) {
  const { slug } = await params
  const item = await client.fetch(
    `*[_type == "problem" && slug.current == $slug][0] {
      _id, title, excerpt, category, symptoms, causes, whatToCheck, whatNotToDo,
      relatedPosts[]->{ _id, title, slug },
      relatedTools[]->{ _id, name, slug }
    }`,
    { slug }
  )
  if (!item) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd data={breadcrumbSchema([
        { label: "Problems", href: "/problems" },
        { label: item.title, href: `/problems/${slug}` },
      ])} />
      <Breadcrumb items={[{ label: "Problems", href: "/problems" }, { label: item.title }]} />
      <Link href="/problems" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-aqua-600 dark:hover:text-aqua-400 mt-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        All problems
      </Link>

      <div className="mt-4 mb-8">
        <span className="px-3 py-1 rounded-lg bg-aqua-50 dark:bg-aqua-950/50 text-aqua-700 dark:text-aqua-300 text-xs font-semibold uppercase tracking-wide capitalize">
          {item.category}
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mt-3">{item.title}</h1>
        {item.excerpt && <p className="text-lg text-gray-600 dark:text-slate-300 mt-2 leading-relaxed">{item.excerpt}</p>}
      </div>

      {item.symptoms && item.symptoms.length > 0 && (
        <Section icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} title="Symptoms">
          <PortableText value={item.symptoms} />
        </Section>
      )}
      {item.causes && item.causes.length > 0 && (
        <Section icon={<Search className="w-5 h-5 text-aqua-500" />} title="Common Causes">
          <PortableText value={item.causes} />
        </Section>
      )}
      {item.whatToCheck && item.whatToCheck.length > 0 && (
        <Section icon={<ListChecks className="w-5 h-5 text-green-600 dark:text-green-400" />} title="What to Check">
          <PortableText value={item.whatToCheck} />
        </Section>
      )}
      {item.whatNotToDo && item.whatNotToDo.length > 0 && (
        <Section icon={<XCircle className="w-5 h-5 text-red-500" />} title="What Not to Do">
          <PortableText value={item.whatNotToDo} />
        </Section>
      )}

      {(item.relatedPosts?.length > 0 || item.relatedTools?.length > 0) && (
        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">Recommended</h2>
          <div className="flex flex-wrap gap-2">
            {item.relatedPosts?.map((p: any) => (
              <Link key={p._id} href={`/posts/${p.slug?.current}`} className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-aqua-100 dark:border-aqua-900/50 text-sm text-aqua-700 dark:text-aqua-300 hover:bg-aqua-50 dark:hover:bg-aqua-950/50 transition-colors">
                {p.title}
              </Link>
            ))}
            {item.relatedTools?.map((t: any) => (
              <Link key={t._id} href={`/tools/${t.slug?.current}`} className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-aqua-100 dark:border-aqua-900/50 text-sm text-aqua-700 dark:text-aqua-300 hover:bg-aqua-50 dark:hover:bg-aqua-950/50 transition-colors">
                Tool: {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="mt-8 text-xs text-gray-500 dark:text-slate-500 leading-relaxed">
        This guide is informational and does not replace professional veterinary advice. If fish are severely ill, consult a veterinarian.
      </p>
    </div>
  )
}
