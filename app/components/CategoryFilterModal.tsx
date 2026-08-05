"use client"

import { useEffect, useRef, useState } from "react"
import { X, Check } from "lucide-react"

interface CategoryFilterOption {
  _id: string
  title: string
  slug: string
  postCount: number
}

interface CategoryFilterModalProps {
  open: boolean
  options: CategoryFilterOption[]
  selectedCategory: string
  onSelect: (slug: string) => void
  onClose: () => void
}

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export default function CategoryFilterModal({
  open,
  options,
  selectedCategory,
  onSelect,
  onClose,
}: CategoryFilterModalProps) {
  const [pending, setPending] = useState(selectedCategory)
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) {
      setPending(selectedCategory)
      const original = document.body.style.overflow
      document.body.style.overflow = "hidden"
      const t = setTimeout(() => triggerRef.current?.focus(), 30)
      return () => {
        clearTimeout(t)
        document.body.style.overflow = original
      }
    }
  }, [open, selectedCategory])

  if (!open) return null

  const pendingCount = pending ? options.find((o) => o.slug === pending)?.postCount ?? 0 : null

  return (
    <div className="fixed inset-0 z-[70] flex items-end lg:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="category-filter-title">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div
        ref={dialogRef}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation()
            onClose()
            return
          }
          if (e.key !== "Tab") return
          const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
          if (!focusable || focusable.length === 0) return
          const first = focusable[0]
          const last = focusable[focusable.length - 1]
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }}
        className="relative w-full lg:max-w-lg bg-white dark:bg-slate-800 rounded-t-3xl lg:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col"
        style={{ overscrollBehavior: "contain" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700 shrink-0">
          <h2 id="category-filter-title" className="text-lg font-bold text-gray-900 dark:text-slate-100">
            All categories
          </h2>
          <button
            ref={triggerRef}
            onClick={onClose}
            aria-label="Close categories"
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => setPending("")}
            aria-pressed={pending === ""}
            className={`flex items-center justify-between gap-2 px-4 py-3 min-h-11 rounded-xl text-sm font-medium border transition-all ${
              pending === ""
                ? "bg-aqua-500 text-white border-aqua-500 shadow-sm"
                : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-aqua-400"
            }`}
          >
            <span>All articles</span>
            <span className={`text-xs ${pending === "" ? "text-white/90" : "text-gray-400"}`}>
              {options.reduce((n, o) => n + o.postCount, 0)}
            </span>
          </button>
          {options.map((option) => {
            const isPending = pending === option.slug
            return (
              <button
                key={option._id}
                onClick={() => setPending(option.slug)}
                aria-pressed={isPending}
                className={`flex items-center justify-between gap-2 px-4 py-3 min-h-11 rounded-xl text-sm font-medium border transition-all ${
                  isPending
                    ? "bg-aqua-500 text-white border-aqua-500 shadow-sm"
                    : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-aqua-400"
                }`}
              >
                <span className="truncate">{option.title}</span>
                <span className={`text-xs shrink-0 ${isPending ? "text-white/90" : "text-gray-400"}`}>
                  {option.postCount}
                </span>
              </button>
            )
          })}
          {options.length === 0 && (
            <p className="col-span-full text-center text-sm text-gray-500 py-6">No categories yet.</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setPending("")}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-11 rounded-xl text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
          <button
            onClick={() => {
              onSelect(pending)
              onClose()
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 min-h-11 gradient-bg text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
          >
            <Check className="w-4 h-4" />
            Apply{pendingCount !== null && pendingCount !== undefined ? ` (${pendingCount})` : ""}
          </button>
        </div>
      </div>
    </div>
  )
}