"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Search, Menu, X, Sun, Moon, ChevronDown, Database, Calculator } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useTheme } from "@/lib/store"
import SearchModal from "./SearchModal"
import strings from "@/lib/i18n/strings"
import { mainNav, databaseNav } from "@/lib/navigation"

function isActive(pathname: string, href: string) {
  if (href === "/posts") return pathname.startsWith("/posts")
  if (href === "/database") return databaseNav.some((d) => pathname.startsWith(d.href))
  if (href === "/tools") return pathname.startsWith("/tools")
  if (href === "/problems") return pathname.startsWith("/problems")
  if (href === "/inspiration") return pathname.startsWith("/inspiration")
  if (href === "/about") return pathname.startsWith("/about")
  return pathname === href
}

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [dbOpen, setDbOpen] = useState(false)
  const dbRef = useRef<HTMLDivElement>(null)
  const { dark, toggle } = useTheme()

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (dbRef.current && !dbRef.current.contains(e.target as Node)) setDbOpen(false)
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        const target = e.target as HTMLElement | null
        const tag = target?.tagName?.toLowerCase()
        if (tag === "input" || tag === "textarea" || target?.isContentEditable) return
        e.preventDefault()
        setSearchOpen(true)
        return
      }
      if (e.key === "Escape") {
        setDbOpen(false)
        setMobileOpen(false)
        setSearchOpen(false)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/logo.png"
                alt={strings.site.name}
                width={1024}
                height={1024}
                className="w-9 h-9 rounded-xl group-hover:scale-110 transition-transform"
              />
              <span className="text-xl font-bold gradient-text">{strings.site.name}</span>
            </Link>

            <div className="hidden lg:flex items-center gap-0.5">
              {mainNav.map((link) => {
                if (link.href === "/database") {
                  const active = isActive(pathname, "/database")
                  return (
                    <div key={link.href} ref={dbRef} className="relative">
                      <button
                        onClick={() => setDbOpen(!dbOpen)}
                        aria-expanded={dbOpen}
                        aria-haspopup="true"
                        className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          active
                            ? "bg-aqua-50 dark:bg-aqua-950/50 text-aqua-700 dark:text-aqua-300"
                            : "text-gray-600 dark:text-slate-300 hover:text-aqua-600 dark:hover:text-aqua-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        {link.label}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dbOpen ? "rotate-180" : ""}`} />
                      </button>
                      {dbOpen && (
                        <div
                          role="menu"
                          className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-2"
                        >
                          {databaseNav.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              role="menuitem"
                              onClick={() => setDbOpen(false)}
                              className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                              <Database className="w-4 h-4 text-aqua-500 mt-0.5 shrink-0" />
                              <span>
                                <span className="block text-sm font-medium text-gray-900 dark:text-slate-100">{item.label}</span>
                                <span className="block text-xs text-gray-500 dark:text-slate-400">{item.description}</span>
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }
                const active = isActive(pathname, link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-aqua-50 dark:bg-aqua-950/50 text-aqua-700 dark:text-aqua-300"
                        : "text-gray-600 dark:text-slate-300 hover:text-aqua-600 dark:hover:text-aqua-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                aria-label={strings.nav.search}
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={toggle}
                className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                aria-label={strings.nav.theme}
              >
                {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                aria-label={strings.nav.menu}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-3 space-y-1">
              {mainNav.map((link) => {
                if (link.href === "/database") {
                  const active = isActive(pathname, "/database")
                  return (
                    <div key={link.href}>
                      <Link
                        href="/database"
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          active
                            ? "bg-aqua-50 dark:bg-aqua-950/50 text-aqua-700 dark:text-aqua-300"
                            : "text-gray-600 dark:text-slate-300"
                        }`}
                      >
                        <Database className="w-4 h-4" />
                        {link.label}
                      </Link>
                      <div className="ml-4 pl-4 border-l border-gray-200 dark:border-slate-700 space-y-1 mt-1">
                        {databaseNav.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className="block px-4 py-2 rounded-lg text-sm text-gray-500 dark:text-slate-400 hover:text-aqua-600 dark:hover:text-aqua-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                }
                const active = isActive(pathname, link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-aqua-50 dark:bg-aqua-950/50 text-aqua-700 dark:text-aqua-300"
                        : "text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                <Calculator className="w-4 h-4" />
                Contact
              </Link>
            </div>
          </div>
        )}
      </nav>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
