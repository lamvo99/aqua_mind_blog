"use client"

import { useEffect, useState } from "react"

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="fixed top-16 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-slate-700">
      <div
        className="h-full gradient-bg transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
