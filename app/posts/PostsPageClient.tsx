"use client"

import { useMemo, useState, useEffect, useRef, useCallback } from "react"
import PostCard from "../components/PostCard"
import CategoryFilterModal from "../components/CategoryFilterModal"
import Breadcrumb from "../components/Breadcrumb"
import { Search, SlidersHorizontal, X } from "lucide-react"
import strings from "@/lib/i18n/strings"
import { CATEGORY_GROUPS, groupForCategory, postMatchesGroup, postMatchesCategory } from "@/lib/categories"

const PER_PAGE = 9

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "instant" as ScrollBehavior })
}

export default function PostsPageClient({
  posts,
  categories,
  categorySlug,
  group,
  initialPage = 1,
}: {
  posts: any[]
  categories: any[]
  categorySlug?: string
  group?: string
  initialPage?: number
}) {
  const [search, setSearch] = useState("")
  const [activeGroup, setActiveGroup] = useState(group || (categorySlug ? groupForCategory(categorySlug)?.id || "" : ""))
  const [chosenCategory, setChosenCategory] = useState(categorySlug || "")
  const [currentPage, setCurrentPage] = useState(Math.max(1, initialPage))
  const [allCatsOpen, setAllCatsOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const restoredRef = useRef(false)
  const scrollMarksRef = useRef<Record<number, number>>({})
  const pageRef = useRef(currentPage)
  pageRef.current = currentPage
  const categoryRef = useRef(chosenCategory)
  categoryRef.current = chosenCategory
  const groupRef = useRef(activeGroup)
  groupRef.current = activeGroup

  const categoryOptions = useMemo(
    () =>
      categories
        .map((cat: any) => ({
          _id: cat._id,
          title: cat.title,
          slug: cat.slug.current,
          postCount: posts.filter((p) => postMatchesCategory(p, cat.slug.current)).length,
        }))
        .filter((c) => c.postCount > 0)
        .sort((a, b) => b.postCount - a.postCount),
    [posts, categories]
  )

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

  const buildQs = useCallback((groupValue: string, categoryValue: string, page: number) => {
    const params = new URLSearchParams()
    if (groupValue) params.set("group", groupValue)
    if (categoryValue) params.set("category", categoryValue)
    if (page > 1) params.set("page", String(page))
    const qs = params.toString()
    return qs ? `?${qs}` : window.location.pathname
  }, [])

  const syncUrl = useCallback(
    (groupValue: string, categoryValue: string, page: number, mode: "replace" | "push" = "replace") => {
      const url = buildQs(groupValue, categoryValue, page)
      if (mode === "push") {
        window.history.pushState({ page }, "", url)
      } else {
        window.history.replaceState(null, "", url)
      }
    },
    [buildQs]
  )

  const applyFilter = (groupValue: string, categoryValue: string) => {
    setChosenCategory(categoryValue)
    setActiveGroup(groupValue)
    setCurrentPage(1)
    syncUrl(groupValue, categoryValue, 1, "replace")
    scrollToTop()
  }

  const selectGroup = (id: string) => {
    applyFilter(id, "")
    setAllCatsOpen(false)
  }

  const selectCategory = (slug: string) => {
    applyFilter("", slug)
    setAllCatsOpen(false)
  }

  const loadMore = () => {
    const next = currentPage + 1
    setCurrentPage(next)
    syncUrl(groupRef.current, categoryRef.current, next, "push")
    const button = listRef.current?.nextElementSibling
    if (button instanceof HTMLElement && !reducedMotion()) {
      const top = button.getBoundingClientRect().top + window.scrollY - 72
      window.scrollTo({ top, behavior: "smooth" })
    }
  }

  // Save scroll position + page so Back from a post restores the exact spot
  useEffect(() => {
    let raf = 0
    const save = () => {
      raf = 0
      if (typeof window === "undefined") return
      const data = { y: window.scrollY, page: pageRef.current }
      scrollMarksRef.current[pageRef.current] = window.scrollY
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

  // Sync state when the user navigates Back/Forward through pushed history entries
  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search)
      const page = Math.max(1, Number(params.get("page")) || 1)
      const category = params.get("category") || ""
      const groupValue = params.get("group") || ""
      setChosenCategory(category)
      setActiveGroup(groupValue)
      setCurrentPage(Math.min(page, totalPages))
      const markY = scrollMarksRef.current[page]
      if (markY !== undefined) {
        requestAnimationFrame(() => {
          window.scrollTo(0, markY)
          setTimeout(() => window.scrollTo(0, markY), 300)
        })
      }
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages])

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
      if (saved.page && saved.page > 1 && saved.page <= totalPages) setCurrentPage(saved.page)
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

  const activeLabel = chosenCategory
    ? categories.find((c) => c.slug.current === chosenCategory)?.title
    : CATEGORY_GROUPS.find((g) => g.id === activeGroup)?.label || strings.posts.title

  const activeDescription = chosenCategory
    ? categories.find((c) => c.slug.current === chosenCategory)?.description
    : CATEGORY_GROUPS.find((g) => g.id === activeGroup)?.description || strings.posts.desc

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
            {chosenCategory || activeGroup ? activeDescription || strings.posts.desc : strings.posts.desc}
          </p>
          <p className="sr-only" role="status" aria-live="polite">
            {paged.length} of {filtered.length} articles
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            placeholder={strings.search.placeholder}
            aria-label={strings.search.placeholder}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500/50 [&::-webkit-search-cancel-button]:hidden"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1" aria-label="Clear search">
              <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
            </button>
          )}
        </div>

        {/* Category pills: horizontal scroll on all breakpoints */}
        <div className="flex items-center gap-3 mb-8">
          <div
            ref={listRef}
            className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 -mx-1 px-1 py-1"
            aria-label="Filter articles by category group"
          >
            <button
              aria-pressed={!activeGroup && !chosenCategory}
              onClick={() => selectGroup("")}
              className={`min-h-11 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                !activeGroup && !chosenCategory
                  ? "bg-aqua-500 text-white shadow-sm"
                  : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-aqua-400 hover:text-aqua-600 dark:hover:text-aqua-400"
              }`}
            >
              {strings.posts.title}
            </button>
            {CATEGORY_GROUPS.map((groupItem) => (
              <button
                key={groupItem.id}
                aria-pressed={activeGroup === groupItem.id}
                onClick={() => selectGroup(groupItem.id)}
                className={`min-h-11 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeGroup === groupItem.id
                    ? "bg-aqua-500 text-white shadow-sm"
                    : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-aqua-400 hover:text-aqua-600 dark:hover:text-aqua-400"
                }`}
              >
                {groupItem.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setAllCatsOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={allCatsOpen}
            className="inline-flex items-center gap-1.5 px-4 min-h-11 rounded-full text-sm font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-aqua-400 hover:text-aqua-600 dark:hover:text-aqua-400 transition-all shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
            All categories
          </button>
        </div>

        {/* Posts Grid */}
        {paged.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paged.map((post: any, index: number) => (
                <PostCard key={post._id} post={post} priority={index < 3} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-10 text-center">
                <button
                  onClick={loadMore}
                  className="inline-flex items-center gap-2 px-6 py-3 min-h-11 gradient-bg text-white font-medium rounded-xl hover:opacity-90 transition-all"
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

      <CategoryFilterModal
        open={allCatsOpen}
        options={categoryOptions}
        selectedCategory={chosenCategory}
        onSelect={selectCategory}
        onClose={() => setAllCatsOpen(false)}
      />
    </div>
  )
}