"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Menu, X, Sun, Moon, Droplets } from "lucide-react"
import { useState } from "react"
import { useTheme } from "@/lib/store"
import SearchModal from "./SearchModal"

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/posts", label: "Bài viết" },
  { href: "/about", label: "Giới thiệu" },
  { href: "/contact", label: "Liên hệ" },
]

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { dark, toggle } = useTheme()

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">AquaMind</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
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
                aria-label="Tìm kiếm"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={toggle}
                className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Đổi chủ đề"
              >
                {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => {
                const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
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
            </div>
          </div>
        )}
      </nav>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
