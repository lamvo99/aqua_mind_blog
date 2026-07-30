"use client"

import { useState, useEffect } from 'react'
import { List, ChevronUp } from 'lucide-react'

interface TocItem {
  id: string
  text: string
  level: number
}

export default function TableOfContents({ blocks }: { blocks: any[] }) {
  const [activeId, setActiveId] = useState<string>("")
  const [collapsed, setCollapsed] = useState(false)

  const items: TocItem[] = (blocks || [])
    .filter((b: any) => b._type === "block" && ["h2", "h3"].includes(b.style))
    .map((b: any) => ({
      id: b.children?.map((c: any) => c.text).join(" ").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || b._key,
      text: b.children?.map((c: any) => c.text).join(" ") || "",
      level: b.style === "h2" ? 2 : 3,
    }))

  useEffect(() => {
    if (items.length < 3) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: "-80px 0px -80% 0px" }
    )
    for (const item of items) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [items])

  if (items.length < 3) return null

  return (
    <nav aria-label="Table of Contents" className="mb-8 lg:mb-0">
      <div className="lg:sticky lg:top-24">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 w-full text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 lg:cursor-default"
        >
          <List className="w-4 h-4 text-aqua-500" />
          Table of Contents
          <ChevronUp className={`w-3.5 h-3.5 ml-auto lg:hidden transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
        <div className={`space-y-1 ${collapsed ? "hidden" : "block"} lg:block`}>
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault()
                const el = document.getElementById(item.id)
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" })
                  history.pushState(null, "", `#${item.id}`)
                }
              }}
              className={`block text-sm py-1 border-l-2 pl-3 transition-all ${
                item.level === 3 ? "ml-3" : ""
              } ${
                activeId === item.id
                  ? "border-aqua-500 text-aqua-700 dark:text-aqua-300 font-medium"
                  : "border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
              }`}
            >
              {item.text}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}
