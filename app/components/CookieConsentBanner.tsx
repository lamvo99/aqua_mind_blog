"use client"

import { useState, useEffect } from 'react'
import { useCookieConsent, type ConsentPreferences } from '@/lib/cookie-consent'
import { X, Cookie, ChevronDown, ChevronUp } from 'lucide-react'
import strings from '@/lib/i18n/strings'

export default function CookieConsentBanner() {
  const { consent, showBanner, acceptAll, rejectAll, saveCustom } = useCookieConsent()
  const [showCustomize, setShowCustomize] = useState(false)
  const [prefs, setPrefs] = useState<ConsentPreferences>({ necessary: true, analytics: false, advertising: false })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !showBanner) return null

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[70] p-4">
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-6">
          {!showCustomize ? (
            <>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-aqua-50 dark:bg-aqua-950/50 flex items-center justify-center shrink-0">
                  <Cookie className="w-5 h-5 text-aqua-600 dark:text-aqua-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-1">{strings.cookie.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
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
                  className="px-5 py-2.5 gradient-bg text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all"
                >
                  {strings.cookie.acceptAll}
                </button>
                <button
                  onClick={rejectAll}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
                >
                  {strings.cookie.reject}
                </button>
                <button
                  onClick={() => { setPrefs({ necessary: true, analytics: !!consent?.analytics, advertising: !!consent?.advertising }); setShowCustomize(true) }}
                  className="px-5 py-2.5 text-aqua-600 dark:text-aqua-400 text-sm font-medium hover:bg-aqua-50 dark:hover:bg-aqua-950/50 rounded-xl transition-all"
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
    </>
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
              <div className="text-xs text-gray-500 dark:text-slate-400">{cat.desc}</div>
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
          className="px-5 py-2.5 text-gray-600 dark:text-slate-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all"
        >
          {strings.cookie.back}
        </button>
      </div>
    </div>
  )
}
