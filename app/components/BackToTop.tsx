"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"
import strings from "@/lib/i18n/strings"

export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-50 p-3 rounded-xl gradient-bg text-white shadow-lg shadow-aqua-500/25 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      aria-label={strings.backToTop}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  )
}
