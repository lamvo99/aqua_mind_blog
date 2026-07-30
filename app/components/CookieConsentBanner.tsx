"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useCookieConsent, type ConsentPreferences } from '@/lib/cookie-consent'
import { X, Cookie, ChevronDown, ChevronUp } from 'lucide-react'
import strings from '@/lib/i18n/strings'

export default function CookieConsentBanner() {
  const { consent, showBanner, acceptAll, rejectAll, saveCustom } = useCookieConsent()
  const [showCustomize, setShowCustomize] = useState(false)
  const [prefs, setPrefs] = useState<ConsentPreferences>({ necessary: true, analytics: false, advertising: false })
  const [mounted, setMounted] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const lastActiveRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }, [])

  useEffect(() => {
    if (!mounted || !showBanner) return
    lastActiveRef.current = document.activeElement as HTMLElement
    document.addEventListener('keydown', trapFocus)
    setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>('button')?.focus()
    }, 100)
    return () => {
      document.removeEventListener('keydown', trapFocus)
      lastActiveRef.current?.focus()
    }
  }, [mounted, showBanner, trapFocus])

  if (!mounted || !showBanner) return null

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        {!showCustomize ? (
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-aqua-50 dark:bg-aqua-950/50 flex items-center justify-center shrink-0">
                <Cookie className="w-5 h-5 text-aqua-600 dark:text-aqua-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="cookie-consent-title" className="font-bold text-gray-900 dark:text-slate-100 mb-1">{strings.cookie.title}</h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                  {strings.cookie.desc}{' '}
                  <a href="/cookie-policy" className="text-aqua-600 dark:text-aqua-400 hover:underline">
                    {strings.cookie.policy}
                  </a>
                  .
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={acceptAll}
                className="flex-1 sm:flex-none px-5 py-2.5 gradient-bg text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all"
              >
                {strings.cookie.acceptAll}
              </button>
              <button
                onClick={rejectAll}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
              >
                {strings.cookie.reject}
              </button>
              <button
                onClick={() => { setPrefs({ necessary: true, analytics: !!consent?.analytics, advertising: !!consent?.advertising }); setShowCustomize(true) }}
                className="flex-1 sm:flex-none px-5 py-2.5 text-aqua-600 dark:text-aqua-400 text-sm font-medium hover:bg-aqua-50 dark:hover:bg-aqua-950/50 rounded-xl transition-all"
              >
                {strings.cookie.customize}
              </button>
            </div>
          </>
        ) : (
          <CustomizePanel
            prefs={prefs}
            onChange={setPrefs}
            onSave={() => saveCustom(prefs)}
            onBack={() => setShowCustomize(false)}
          />
        )}
      </div>
    </div>
  )
}

function CustomizePanel({
  prefs,
  onChange,
  onSave,
  onBack,
}: {
  prefs: ConsentPreferences
  onChange: (p: ConsentPreferences) => void
  onSave: () => void
  onBack: () => void
}) {
  const categories = [
    {
      key: 'necessary' as const,
      title: strings.cookie.categories.necessary,
      desc: strings.cookie.categories.necessaryDesc,
      alwaysOn: true,
    },
    {
      key: 'analytics' as const,
      title: strings.cookie.categories.analytics,
      desc: strings.cookie.categories.analyticsDesc,
    },
    {
      key: 'advertising' as const,
      title: strings.cookie.categories.advertising,
      desc: strings.cookie.categories.advertisingDesc,
    },
  ]

  return (
    <div>
      <h4 className="font-bold text-gray-900 dark:text-slate-100 mb-3">{strings.cookie.customizeTitle}</h4>
      <div className="space-y-3 mb-4">
        {categories.map((cat) => (
          <label
            key={cat.key}
            className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-900/50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={prefs[cat.key]}
              disabled={cat.alwaysOn}
              onChange={() => onChange({ ...prefs, [cat.key]: !prefs[cat.key] })}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-aqua-600 focus:ring-aqua-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{cat.title}</div>
              <div className="text-xs text-gray-600 dark:text-slate-300">{cat.desc}</div>
            </div>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          className="px-5 py-2.5 gradient-bg text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all"
        >
          {strings.cookie.save}
        </button>
        <button
          onClick={onBack}
          className="px-5 py-2.5 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all"
        >
          {strings.cookie.back}
        </button>
      </div>
    </div>
  )
}
