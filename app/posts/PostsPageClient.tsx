"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import PostCard from "../components/PostCard"
import Breadcrumb from "../components/Breadcrumb"
import { Search, SlidersHorizontal, X } from "lucide-react"
import strings from "@/lib/i18n/strings"

export default function PostsPageClient({
  posts,
  categories,
  categorySlug,
}: {
  posts: any[]
  categories: any[]
  categorySlug?: string
}) {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(categorySlug || "")
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 9

  const filtered = useMemo(() => {
    let result = posts
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q)
      )
    }
    return result
  }, [posts, search])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice(0, currentPage * perPage)

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(slug === selectedCategory ? "" : slug)
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="mb-4">
            <Breadcrumb items={[{ label: "Articles" }]} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100">
            {selectedCategory
              ? categories.find((c) => c.slug.current === selectedCategory)?.title
              : strings.posts.title}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-2">
            {selectedCategory
              ? `${strings.posts.filterBy}: ${categories.find((c) => c.slug.current === selectedCategory)?.title}`
              : strings.posts.desc}
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder={strings.search.placeholder}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500/50"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => { setSelectedCategory(""); setCurrentPage(1) }}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              !selectedCategory
                ? "bg-aqua-500 text-white"
                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-aqua-50 dark:hover:bg-aqua-950/50 hover:text-aqua-600"
            }`}
          >
            {strings.posts.title}
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat._id}
              onClick={() => handleCategoryClick(cat.slug.current)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat.slug.current
                  ? "bg-aqua-500 text-white"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-aqua-50 dark:hover:bg-aqua-950/50 hover:text-aqua-600"
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* Posts Grid */}
        {paged.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paged.map((post: any) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
            {totalPages > 1 && currentPage * perPage < filtered.length && (
              <div className="mt-10 text-center">
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="inline-flex items-center gap-2 px-6 py-3 gradient-bg text-white font-medium rounded-xl hover:opacity-90 transition-all"
                >
                  {strings.posts.loadMore}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <Search className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-1">
              {strings.posts.noPosts}
            </h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm">
              {search ? strings.search.noResults : strings.posts.noPosts}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
