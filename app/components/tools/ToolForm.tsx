"use client"

import { RotateCcw } from "lucide-react"

export interface SegmentOption<T extends string> {
  value: T
  label: string
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  name,
}: {
  label: string
  options: SegmentOption<T>[]
  value: T
  onChange: (v: T) => void
  name: string
}) {
  return (
    <div className="mb-4">
      <span className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              value === o.value
                ? "gradient-bg text-white"
                : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  hint,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder?: string
  hint?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-aqua-500/50 ${
          error ? "border-red-400 dark:border-red-500" : "border-gray-200 dark:border-slate-700"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {!error && hint && <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{hint}</p>}
    </div>
  )
}

export function ActionButtons({ onCalculate, onReset }: { onCalculate: () => void; onReset: () => void }) {
  return (
    <div className="flex gap-2 mt-6">
      <button
        type="button"
        onClick={onCalculate}
        className="flex-1 px-5 py-3 gradient-bg text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
      >
        Calculate
      </button>
      <button
        type="button"
        onClick={onReset}
        aria-label="Reset"
        className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ResultPanel({ children, emptyText }: { children: React.ReactNode; emptyText: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-aqua-50 to-ocean-50 dark:from-aqua-950/30 dark:to-ocean-950/30 border border-aqua-100 dark:border-aqua-900/50 p-5 sm:p-6 lg:sticky lg:top-24">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Result</h2>
      {children ?? <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{emptyText}</p>}
    </div>
  )
}

export function ResultRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-xs text-gray-600 dark:text-slate-300">
      <span>{label}</span>
      <span className={`${strong ? "text-sm font-semibold text-gray-900 dark:text-slate-100" : "font-medium"}`}>{value}</span>
    </div>
  )
}
