"use client"

import { useState } from "react"
import { useNewsletter } from "@/lib/store"
import { Mail, Send, CheckCircle, Download } from "lucide-react"
import strings from "@/lib/i18n/strings"

export default function NewsletterSection() {
  const { subscribed, loading, subscribe } = useNewsletter()
  const [email, setEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email) await subscribe(email)
  }

  const leadMagnetUrl = process.env.NEXT_PUBLIC_LEAD_MAGNET_URL || ""

  if (subscribed) {
    return (
      <div className="gradient-bg rounded-2xl p-8 text-center text-white">
        <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-80" />
        <h3 className="text-lg font-bold mb-1">{strings.newsletter.success}</h3>
        <p className="text-sm opacity-80 mb-4">{strings.newsletter.thanks}</p>
        {leadMagnetUrl && (
          <a
            href={leadMagnetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-all backdrop-blur-sm"
          >
            <Download className="w-4 h-4" />
            {strings.newsletter.leadMagnetCta}
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-aqua-50 to-ocean-50 dark:from-aqua-950/30 dark:to-ocean-950/30 rounded-2xl p-8 border border-aqua-100 dark:border-aqua-900/50">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{strings.newsletter.title}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">{strings.newsletter.desc}</p>
        </div>
      </div>
      {leadMagnetUrl && (
        <div className="mt-4 p-3 bg-white/50 dark:bg-slate-800/50 border border-dashed border-aqua-200 dark:border-aqua-800/50 rounded-xl flex items-center gap-3">
          <Download className="w-5 h-5 text-aqua-600 dark:text-aqua-400 shrink-0" />
          <div className="text-xs">
            <p className="font-medium text-gray-700 dark:text-slate-300">{strings.newsletter.leadMagnetTitle}</p>
            <p className="text-gray-500 dark:text-slate-400">{strings.newsletter.leadMagnetDesc}</p>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <label htmlFor="newsletter-email" className="sr-only">{strings.newsletter.email}</label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={strings.newsletter.email}
          required
          className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-aqua-500/50"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 gradient-bg hover:opacity-90 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {strings.newsletter.submit}
        </button>
      </form>
    </div>
  )
}
