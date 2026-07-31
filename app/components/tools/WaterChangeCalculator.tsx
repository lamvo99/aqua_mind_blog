"use client"

import { useState } from "react"
import {
  calculateWaterChange,
  validateWaterChangeInput,
  type WaterChangeInput,
} from "@/lib/calculators/waterChange"
import { RotateCcw } from "lucide-react"

const initialInput: WaterChangeInput = {
  tankVolumeLiters: null,
  changePercent: null,
  currentParameter: null,
  sourceParameter: null,
}

export default function WaterChangeCalculator() {
  const [input, setInput] = useState<WaterChangeInput>(initialInput)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof calculateWaterChange> | null>(null)

  const setNum = (field: keyof WaterChangeInput, value: string) => {
    const parsed = value === "" ? null : Number(value)
    setInput((prev) => ({ ...prev, [field]: parsed }))
    setResult(null)
  }

  const handleCalculate = () => {
    const errs = validateWaterChangeInput(input)
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      setResult(calculateWaterChange(input))
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

  const field = (
    id: string,
    label: string,
    placeholder: string,
    value: number | null,
    onChange: (v: string) => void,
    err?: string,
    hint?: string
  ) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass(!!err)}
      />
      {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
      {hint && !err && <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{hint}</p>}
    </div>
  )

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("wc-volume", "Tank volume (L)", "100", input.tankVolumeLiters, (v) => setNum("tankVolumeLiters", v), errors.tankVolumeLiters)}
          {field("wc-percent", "Change percentage (%)", "30", input.changePercent, (v) => setNum("changePercent", v), errors.changePercent, "Between 0 and 100")}
          {field("wc-current", "Current parameter (optional)", "40", input.currentParameter, (v) => setNum("currentParameter", v), errors.currentParameter, "e.g. current nitrate in mg/L")}
          {field("wc-source", "Source water parameter (optional)", "0", input.sourceParameter, (v) => setNum("sourceParameter", v), errors.sourceParameter, "e.g. nitrate in your tap water")}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={handleCalculate}
            className="flex-1 px-5 py-3 gradient-bg text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
          >
            Calculate
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
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Result</h2>
          {result ? (
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text">{result.changeVolumeLiters} L</div>
                <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  to replace ({result.changeVolumeGallons} US gallons)
                </div>
              </div>
              {result.resultingParameter !== null && result.deltaParameter !== null ? (
                <div className="border-t border-aqua-200 dark:border-aqua-800/50 pt-3 text-xs text-gray-600 dark:text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Estimated resulting parameter</span>
                    <span className="font-medium">{result.resultingParameter}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Change</span>
                    <span className="font-medium">{result.deltaParameter > 0 ? "+" : ""}{result.deltaParameter}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Add current & source parameters to estimate the resulting value.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
              Enter your tank volume and change percentage to see how much water to replace.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
