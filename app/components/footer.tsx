"use client"

import Link from "next/link"
import { Droplets, Mail, Send } from "lucide-react"
import { useNewsletter } from "@/lib/store"
import { useState, useEffect } from "react"
import strings from "@/lib/i18n/strings"

export default function Footer() {
  const { subscribed, loading, subscribe } = useNewsletter()
  const [email, setEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email) await subscribe(email)
  }

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                <Droplets className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">{strings.site.name}</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              {strings.footer.description}
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{strings.footer.explore}</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/", label: strings.nav.home },
                { href: "/posts", label: strings.nav.posts },
                { href: "/about", label: strings.nav.about },
                { href: "/contact", label: strings.nav.contact },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-aqua-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{strings.footer.categories}</h4>
            <FooterCategories />
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{strings.footer.follow}</h4>
            <p className="text-sm text-slate-400 mb-4">
              {strings.footer.getLatest}
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-aqua-400 text-sm">
                <Mail className="w-4 h-4" />
                <span>{strings.footer.subscribed}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex">
                <label htmlFor="footer-email" className="sr-only">{strings.footer.yourEmail}</label>
                <input
                  id="footer-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={strings.footer.yourEmail}
                  required
                  className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-l-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-aqua-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-2.5 gradient-bg hover:opacity-90 text-white rounded-r-lg transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} {strings.site.name}. {strings.footer.copyright}</p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-aqua-400 transition-colors">{strings.footer.privacy}</Link>
            <Link href="/terms-of-service" className="hover:text-aqua-400 transition-colors">{strings.footer.terms}</Link>
            <Link href="/cookie-policy" className="hover:text-aqua-400 transition-colors">{strings.footer.cookie}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCategories() {
  const [categories, setCategories] = useState<{ title: string; slug: string }[]>([])

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data.slice(0, 6))
      })
      .catch(() => {})
  }, [])

  if (categories.length === 0) {
    return (
      <ul className="space-y-2.5">
        <li className="text-sm text-slate-500">{strings.nav.posts}...</li>
      </ul>
    )
  }

  return (
    <ul className="space-y-2.5">
      {categories.map((cat) => (
        <li key={cat.slug}>
          <Link
            href={`/posts?category=${cat.slug}`}
            className="text-sm text-slate-400 hover:text-aqua-400 transition-colors"
          >
            {cat.title}
          </Link>
        </li>
      ))}
      <li>
        <Link href="/posts" className="text-sm text-aqua-400 hover:text-aqua-300 transition-colors">
          {strings.footer.viewAll}
        </Link>
      </li>
    </ul>
  )
}
