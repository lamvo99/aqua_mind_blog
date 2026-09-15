"use client"

import Link from "next/link"
import { Droplets, Home, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50/50 dark:bg-slate-900">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6">
          <Droplets className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 dark:text-slate-100 mb-2">Oops</h1>
        <p className="text-lg text-gray-500 dark:text-slate-400 mb-2">Something went wrong</p>
        <p className="text-sm text-gray-500 dark:text-slate-500 mb-8">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-6 py-3 gradient-bg text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-aqua-500/25"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-medium rounded-xl border border-gray-200 dark:border-slate-700 hover:border-aqua-300 dark:hover:border-aqua-700 transition-all"
          >
            <Home className="w-4 h-4" />
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
