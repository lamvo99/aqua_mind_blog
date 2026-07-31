import Link from "next/link"
import { getAllPosts, getFeaturedPosts, getAllCategories } from "@/lib/posts"
import PostCard from "./components/PostCard"
import NewsletterSection from "./components/NewsletterSection"
import { Droplets, Sparkles, ArrowRight } from "lucide-react"
import strings from "@/lib/i18n/strings"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Aquascaping Blog & Beginner Aquarium Guides — AquaMind",
  description: "Free aquascaping guides, aquarium care articles, tools and a verified database of fish, plants and corals. Start here if you are new to fishkeeping.",
  alternates: { canonical: "https://aquamind.life" },
}

export default async function Home() {
  const [featuredPosts, allPosts, categories] = await Promise.all([
    getFeaturedPosts(),
    getAllPosts(),
    getAllCategories(),
  ])

  const latestPosts = allPosts.slice(0, 6)

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-aqua-50 via-white to-ocean-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-aqua-200/30 dark:bg-aqua-500/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-ocean-200/30 dark:bg-ocean-500/5 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-aqua-100 dark:bg-aqua-950/50 text-aqua-700 dark:text-aqua-300 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              {strings.site.tagline}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-slate-100 mb-6 leading-tight">
              {strings.home.heroTitle}
              <span className="gradient-text block mt-1">{strings.home.heroTagline}</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
              {strings.home.heroDesc}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/posts"
                className="inline-flex items-center gap-2 px-6 py-3 gradient-bg text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-aqua-500/25"
              >
                {strings.home.explorePosts}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-medium rounded-xl border border-gray-200 dark:border-slate-700 hover:border-aqua-300 dark:hover:border-aqua-700 transition-all"
              >
                {strings.home.aboutUs}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-16 lg:py-20 bg-gray-50/50 dark:bg-slate-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
                  {strings.home.featured}
                </h2>
                <p className="text-gray-500 dark:text-slate-400 mt-1">{strings.home.latestDesc}</p>
              </div>
              <Link
                href="/posts"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-aqua-600 dark:text-aqua-400 hover:text-aqua-700 dark:hover:text-aqua-300 transition-colors"
              >
                {strings.home.viewAll} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {featuredPosts.slice(0, 3).map((post: any, i: number) => (
                <PostCard key={post._id} post={post} featured={i === 0} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
                {strings.footer.categories}
              </h2>
              <p className="text-gray-500 dark:text-slate-400 mt-1">{strings.posts.desc}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((cat: any) => (
                <Link
                  key={cat._id}
                  href={`/posts?category=${cat.slug.current}`}
                  className="group p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 card-hover text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-aqua-50 dark:bg-aqua-950/50 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Droplets className="w-5 h-5 text-aqua-600 dark:text-aqua-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100 group-hover:text-aqua-600 dark:group-hover:text-aqua-400 transition-colors">
                    {cat.title}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1 line-clamp-2">{cat.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Posts */}
      <section className="py-16 lg:py-20 bg-gray-50/50 dark:bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
                  {strings.home.latestPosts}
                </h2>
                <p className="text-gray-500 dark:text-slate-400 mt-1">{strings.home.latestDesc}</p>
              </div>
              <Link
                href="/posts"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-aqua-600 dark:text-aqua-400 hover:text-aqua-700 dark:hover:text-aqua-300 transition-colors"
              >
                {strings.home.viewAll} <ArrowRight className="w-3 h-3" />
              </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestPosts.map((post: any) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/posts"
              className="inline-flex items-center gap-2 px-6 py-3 gradient-bg text-white font-medium rounded-xl hover:opacity-90 transition-all shadow-lg shadow-aqua-500/25"
            >
              {strings.home.viewAll}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto">
            <NewsletterSection />
          </div>
        </div>
      </section>
    </div>
  )
}
