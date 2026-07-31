"use client"

import { useState } from "react"
import { calculateCo2, validateCo2Input, type Co2Input } from "@/lib/calculators/co2"
import { RotateCcw } from "lucide-react"

const initialInput: Co2Input = { kh: null, ph: null }

export default function Co2Calculator() {
  const [input, setInput] = useState<Co2Input>(initialInput)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof calculateCo2> | null>(null)

  const setNum = (field: keyof Co2Input, value: string) => {
    const parsed = value === "" ? null : Number(value)
    setInput((prev) => ({ ...prev, [field]: parsed }))
    setResult(null)
  }

  const handleCalculate = () => {
    const errs = validateCo2Input(input)
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      setResult(calculateCo2(input))
    } else {
      setResult(null)
    }
  }

  const reset = () => {
    setInput(initialInput)
    setErrors({})
    setResult(null)
  }

  const inputClass = (hasError: boolean) =>
    `w-full px-3 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-aqua-500/50 ${
      hasError ? "border-red-400 dark:border-red-500" : "border-gray-200 dark:border-slate-700"
    }`

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="co2-kh" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Carbonate hardness (KH)
            </label>
            <input
              id="co2-kh"
              type="number"
              inputMode="decimal"
              placeholder="4"
              value={input.kh ?? ""}
              onChange={(e) => setNum("kh", e.target.value)}
              className={inputClass(!!errors.kh)}
            />
            {errors.kh && <p className="text-xs text-red-500 mt-1">{errors.kh}</p>}
          </div>
          <div>
            <label htmlFor="co2-ph" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              pH
            </label>
            <input
              id="co2-ph"
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="6.8"
              value={input.ph ?? ""}
              onChange={(e) => setNum("ph", e.target.value)}
              className={inputClass(!!errors.ph)}
            />
            {errors.ph && <p className="text-xs text-red-500 mt-1">{errors.ph}</p>}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={handleCalculate}
            className="flex-1 px-5 py-3 gradient-bg text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
          >
            Estimate CO₂
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="Reset"
            className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <div className="rounded-2xl bg-gradient-to-br from-aqua-50 to-ocean-50 dark:from-aqua-950/30 dark:to-ocean-950/30 border border-aqua-100 dark:border-aqua-900/50 p-5 sm:p-6 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Estimated CO₂</h2>
          {result ? (
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text">{result.co2Ppm} ppm</div>
                <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">dissolved CO₂</div>
              </div>
              <div className="border-t border-aqua-200 dark:border-aqua-800/50 pt-3">
                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">{result.label}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
              Enter KH and pH to estimate dissolved CO₂ concentration.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
