"use client"

import { useState } from "react"
import {
  calculateStocking,
  validateStockingInput,
  type StockingInput,
  type StockingLevel,
} from "@/lib/calculators/stocking"
import { ActionButtons, NumberField, ResultPanel, ResultRow, SegmentedControl } from "./ToolForm"

const initialInput: StockingInput = {
  volumeL: null,
  level: "standard",
  fishCount: null,
  adultCm: null,
}

const levelOptions: { value: StockingLevel; label: string }[] = [
  { value: "light", label: "Light (0.5″/gal)" },
  { value: "standard", label: "Standard (1″/gal)" },
  { value: "heavy", label: "Heavy (1.5″/gal)" },
]

export default function StockingCalculator() {
  const [input, setInput] = useState<StockingInput>(initialInput)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof calculateStocking> | null>(null)

  const setNum = (field: "volumeL" | "fishCount" | "adultCm", value: string) => {
    const parsed = value === "" ? null : Number(value)
    setInput((prev) => ({ ...prev, [field]: parsed }))
    setResult(null)
  }

  const handleCalculate = () => {
    const errs = validateStockingInput(input)
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      setResult(calculateStocking(input))
    } else {
      setResult(null)
    }
  }

  const reset = () => {
    setInput(initialInput)
    setErrors({})
    setResult(null)
  }

  const statusBadge =
    result?.status === "overstocked"
      ? { text: "Overstocked", classes: "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300" }
      : result?.status === "at-capacity"
        ? { text: "At capacity", classes: "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300" }
        : result?.status === "lightly-stocked"
          ? { text: "Lightly stocked", classes: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300" }
          : null

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5 sm:p-6">
        <NumberField
          id="stock-volume"
          label="Tank volume (L)"
          placeholder="100"
          value={input.volumeL ?? ""}
          onChange={(v) => setNum("volumeL", v)}
          error={errors.volumeL}
        />
        <div className="mt-4">
          <SegmentedControl
            name="level"
            label="Stocking rule"
            options={levelOptions}
            value={input.level}
            onChange={(v) => {
              setInput((prev) => ({ ...prev, level: v }))
              setResult(null)
            }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField
            id="stock-count"
            label="Number of fish (optional)"
            placeholder="8"
            value={input.fishCount ?? ""}
            onChange={(v) => setNum("fishCount", v)}
            error={errors.fishCount}
          />
          <NumberField
            id="stock-size"
            label="Average adult size (cm)"
            placeholder="4"
            value={input.adultCm ?? ""}
            onChange={(v) => setNum("adultCm", v)}
            error={errors.adultCm}
          />
        </div>
        <ActionButtons onCalculate={handleCalculate} onReset={reset} />
      </div>

      <ResultPanel emptyText="Enter your tank volume and stocking rule, then press Calculate.">
        {result && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text">{result.capacityCm} cm</div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                total adult fish length for {input.volumeL} L
              </div>
              {result.utilizationPercent !== null && statusBadge && (
                <span className={`inline-block mt-3 px-3 py-1 rounded-lg text-xs font-semibold ${statusBadge.classes}`}>
                  {statusBadge.text} — {result.utilizationPercent}% of capacity
                </span>
              )}
            </div>
            <div className="border-t border-aqua-200 dark:border-aqua-800/50 pt-3 text-xs text-gray-600 dark:text-slate-300 space-y-1">
              <ResultRow label="Capacity (inches)" value={`${result.capacityInches} in`} />
              {result.totalCm !== null && (
                <>
                  <ResultRow label="Your fish total" value={`${result.totalCm} cm`} />
                  <ResultRow label="Utilization" value={`${result.utilizationPercent}%`} />
                </>
              )}
            </div>
          </div>
        )}
      </ResultPanel>
    </div>
  )
}
