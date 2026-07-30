"use client"

import { useState, useEffect, useCallback } from 'react'

export interface ConsentPreferences {
  necessary: boolean
  analytics: boolean
  advertising: boolean
}

const STORAGE_KEY = 'aquamind_cookie_consent'

const defaults: ConsentPreferences = {
  necessary: true,
  analytics: false,
  advertising: false,
}

export function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function storeConsent(prefs: ConsentPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentPreferences | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const stored = getStoredConsent()
    if (stored) {
      setConsent(stored)
      setShowBanner(false)
    } else {
      setShowBanner(true)
    }
  }, [])

  const acceptAll = useCallback(() => {
    const prefs: ConsentPreferences = { necessary: true, analytics: true, advertising: true }
    storeConsent(prefs)
    setConsent(prefs)
    setShowBanner(false)
  }, [])

  const rejectAll = useCallback(() => {
    const prefs: ConsentPreferences = { necessary: true, analytics: false, advertising: false }
    storeConsent(prefs)
    setConsent(prefs)
    setShowBanner(false)
  }, [])

  const saveCustom = useCallback((prefs: ConsentPreferences) => {
    storeConsent(prefs)
    setConsent(prefs)
    setShowBanner(false)
  }, [])

  const openSettings = useCallback(() => {
    setShowBanner(false)
    const el = document.getElementById('cookie-settings-modal')
    if (el) el.classList.remove('hidden')
  }, [])

  return { consent, showBanner, acceptAll, rejectAll, saveCustom, openSettings }
}
