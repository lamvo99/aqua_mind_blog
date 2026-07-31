"use client"

import { useState, useEffect } from 'react'
import { getStoredConsent, storeConsent, type ConsentPreferences } from '@/lib/cookie-consent'
import { X, Cookie } from 'lucide-react'
import strings from '@/lib/i18n/strings'

export default function CookieSettings() {
  const [open, setOpen] = useState(false)
  const [prefs, setPrefs] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    advertising: false,
  })

  useEffect(() => {
    const stored = getStoredConsent()
    if (stored) setPrefs(stored)
    const handler = () => setOpen(!document.getElementById('cookie-settings-modal')?.classList.contains('hidden'))
    window.addEventListener('cookie-settings-open', handler)
    return () => window.removeEventListener('cookie-settings-open', handler)
  }, [])

  useEffect(() => {
    const el = document.getElementById('cookie-settings-modal')
    if (el) {
      if (open) el.classList.remove('hidden')
      else el.classList.add('hidden')
    }
  }, [open])

  const save = () => {
    storeConsent(prefs)
    setOpen(false)
  }

  return (
    <div id="cookie-settings-modal" className="hidden fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-aqua-600 dark:text-aqua-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{strings.cookie.customizeTitle}</h3>
          </div>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="space-y-3 mb-6">
          {[
            { key: 'necessary' as const, title: strings.cookie.categories.necessary, desc: strings.cookie.categories.necessaryDesc, disabled: true },
            { key: 'analytics' as const, title: strings.cookie.categories.analytics, desc: strings.cookie.categories.analyticsDesc },
            { key: 'advertising' as const, title: strings.cookie.categories.advertising, desc: strings.cookie.categories.advertisingDesc },
          ].map((cat) => (
            <label key={cat.key} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-900/50 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs[cat.key]}
                disabled={cat.disabled}
                onChange={() => setPrefs({ ...prefs, [cat.key]: !prefs[cat.key] })}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-aqua-600 focus:ring-aqua-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{cat.title}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400">{cat.desc}</div>
              </div>
            </label>
          ))}
        </div>
        <button
          onClick={save}
          className="w-full px-5 py-2.5 gradient-bg text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all"
        >
          {strings.cookie.save}
        </button>
      </div>
    </div>
  )
}
