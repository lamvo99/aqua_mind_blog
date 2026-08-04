"use client"

import { useMemo, useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import PostCard from "../components/PostCard"
import Breadcrumb from "../components/Breadcrumb"
import { Search, SlidersHorizontal, X, ChevronDown, Check } from "lucide-react"
import strings from "@/lib/i18n/strings"
import { CATEGORY_GROUPS, groupForCategory, postMatchesGroup, postMatchesCategory } from "@/lib/categories"

const PER_PAGE = 9

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
  const initialGroup = categorySlug ? groupForCategory(categorySlug)?.id || "" : ""
  const [activeGroup, setActiveGroup] = useState(initialGroup)
  const [chosenCategory, setChosenCategory] = useState(initialGroup ? categorySlug || "" : "")
  const [currentPage, setCurrentPage] = useState(1)
  const [allCatsOpen, setAllCatsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const restoredRef = useRef(false)
  const pageRef = useRef(currentPage)
  pageRef.current = currentPage

  const filtered = useMemo(() => {
    let result = posts
    if (chosenCategory) {
      result = result.filter((p) => postMatchesCategory(p, chosenCategory))
    } else if (activeGroup) {
      result = result.filter((p) => postMatchesGroup(p, activeGroup))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q)
      )
    }
    return result
  }, [posts, search, activeGroup, chosenCategory])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paged = filtered.slice(0, currentPage * PER_PAGE)
  const hasMore = currentPage * PER_PAGE < filtered.length

  const syncUrl = useCallback((group: string, category: string, page: number) => {
    const params = new URLSearchParams()
    if (group) params.set("group", group)
    if (category) params.set("category", category)
    if (page > 1) params.set("page", String(page))
    const qs = params.toString()
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname)
  }, [])

  const selectGroup = (id: string) => {
    setChosenCategory("")
    setActiveGroup(id)
    setCurrentPage(1)
    syncUrl(id, "", 1)
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
  }

  const selectCategory = (slug: string) => {
    setChosenCategory(slug)
    setActiveGroup("")
    setCurrentPage(1)
    syncUrl("", slug, 1)
    setAllCatsOpen(false)
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
  }

  const loadMore = () => {
    const next = currentPage + 1
    setCurrentPage(next)
    syncUrl(activeGroup, chosenCategory, next)
  }

  // Save scroll position + page so Back from a post restores the exact spot
  useEffect(() => {
    let raf = 0
    const save = () => {
      raf = 0
      if (typeof window === "undefined") return
      const data = { y: window.scrollY, page: pageRef.current }
      try {
        sessionStorage.setItem("aquamind_posts_scroll", JSON.stringify(data))
      } catch {}
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(save)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // Restore position once per mount (back navigation / reload)
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    let saved: { y?: number; page?: number } | null = null
    try {
      const raw = sessionStorage.getItem("aquamind_posts_scroll")
      if (raw) saved = JSON.parse(raw)
    } catch {}
    if (saved) {
      if (saved.page && saved.page > 1) setCurrentPage(Math.min(saved.page, totalPages))
      const y = saved.y || 0
      if (y > 0) {
        requestAnimationFrame(() =>
          setTimeout(() => {
            window.scrollTo(0, y)
            const onLoad = () => window.scrollTo(0, y)
            window.addEventListener("load", onLoad, { once: true })
            setTimeout(onLoad, 800)
          }, 80)
        )
      }
    }
    try {
      sessionStorage.removeItem("aquamind_posts_scroll")
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close "All categories" popover on outside click / Escape
  useEffect(() => {
    if (!allCatsOpen) return
    const onClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setAllCatsOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAllCatsOpen(false)
    }
    document.addEventListener("click", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("click", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [allCatsOpen])

  const activeLabel = chosenCategory
    ? categories.find((c) => c.slug.current === chosenCategory)?.title
    : CATEGORY_GROUPS.find((g) => g.id === activeGroup)?.label || strings.posts.title

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <Breadcrumb items={[{ label: "Articles" }]} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100">
            {activeLabel}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-2">
            {chosenCategory || activeGroup
              ? categories.find((c) => c.slug.current === chosenCategory)?.description
                || CATEGORY_GROUPS.find((g) => g.id === activeGroup)?.description
                || strings.posts.desc
              : strings.posts.desc}
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
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
            <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2" aria-label="Clear search">
              <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
            </button>
          )}
        </div>

        {/* Category pills: horizontal scroll on all breakpoints */}
        <div className="flex items-center gap-3 mb-8">
          <div
            ref={listRef}
            className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 -mx-1 px-1 py-1"
            role="tablist"
            aria-label="Categories"
          >
            <button
              role="tab"
              aria-selected={!activeGroup && !chosenCategory}
              onClick={() => selectGroup("")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                !activeGroup && !chosenCategory
                  ? "bg-aqua-500 text-white shadow-sm"
                  : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-aqua-400 hover:text-aqua-600 dark:hover:text-aqua-400"
              }`}
            >
              {strings.posts.title}
            </button>
            {CATEGORY_GROUPS.map((group) => (
              <button
                key={group.id}
                role="tab"
                aria-selected={activeGroup === group.id}
                onClick={() => selectGroup(group.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeGroup === group.id
                    ? "bg-aqua-500 text-white shadow-sm"
                    : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-aqua-400 hover:text-aqua-600 dark:hover:text-aqua-400"
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>

          {/* All categories popover */}
          <div className="relative shrink-0" ref={popoverRef}>
            <button
              onClick={() => setAllCatsOpen((o) => !o)}
              aria-expanded={allCatsOpen}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-aqua-400 hover:text-aqua-600 dark:hover:text-aqua-400 transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
              All categories
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${allCatsOpen ? "rotate-180" : ""}`} />
            </button>
            {allCatsOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 max-h-96 overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xl z-50 p-2">
                <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Categories</p>
                {categories.map((cat: any) => (
                  <Link
                    key={cat._id}
                    href={`/category/${cat.slug.current}`}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm text-gray-700 dark:text-slate-300 hover:bg-aqua-50 dark:hover:bg-aqua-950/50 hover:text-aqua-600 dark:hover:text-aqua-400 transition-colors"
                  >
                    <span className="truncate">{cat.title}</span>
                    {chosenCategory === cat.slug.current && <Check className="w-4 h-4 text-aqua-500 shrink-0" />}
                  </Link>
                ))}
                {categories.length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-500">No categories yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Posts Grid */}
        {paged.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paged.map((post: any) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-10 text-center">
                <button
                  onClick={loadMore}
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
            <p className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-1">
              {strings.posts.noPosts}
            </p>
            <p className="text-gray-500 dark:text-slate-400 text-sm">
              {search ? strings.search.noResults : strings.posts.noPosts}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
