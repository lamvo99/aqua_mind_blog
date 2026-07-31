"use client"

import { useState } from "react"
import {
  calculateLighting,
  validateLightingInput,
  type LightingInput,
  type LightLevel,
} from "@/lib/calculators/lighting"
import { ActionButtons, NumberField, ResultPanel, ResultRow, SegmentedControl } from "./ToolForm"

const initialInput: LightingInput = {
  volumeL: null,
  level: "medium",
  ledWattage: null,
}

const levelOptions: { value: LightLevel; label: string }[] = [
  { value: "low", label: "Low (20 lm/L)" },
  { value: "medium", label: "Medium (35 lm/L)" },
  { value: "high", label: "High (50 lm/L)" },
]

export default function LightingCalculator() {
  const [input, setInput] = useState<LightingInput>(initialInput)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof calculateLighting> | null>(null)

  const setNum = (field: "volumeL" | "ledWattage", value: string) => {
    const parsed = value === "" ? null : Number(value)
    setInput((prev) => ({ ...prev, [field]: parsed }))
    setResult(null)
  }

  const handleCalculate = () => {
    const errs = validateLightingInput(input)
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      setResult(calculateLighting(input))
    } else {
      setResult(null)
    }
  }

  const reset = () => {
    setInput(initialInput)
    setErrors({})
    setResult(null)
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField
            id="light-volume"
            label="Tank volume (L)"
            placeholder="100"
            value={input.volumeL ?? ""}
            onChange={(v) => setNum("volumeL", v)}
            error={errors.volumeL}
          />
          <NumberField
            id="light-wattage"
            label="Your light's LED wattage (optional)"
            placeholder="30"
            hint="Total rated LED watts of your fixture"
            value={input.ledWattage ?? ""}
            onChange={(v) => setNum("ledWattage", v)}
            error={errors.ledWattage}
          />
        </div>
        <div className="mt-4">
          <SegmentedControl
            name="level"
            label="Target light level"
            options={levelOptions}
            value={input.level}
            onChange={(v) => {
              setInput((prev) => ({ ...prev, level: v }))
              setResult(null)
            }}
          />
        </div>
        <ActionButtons onCalculate={handleCalculate} onReset={reset} />
      </div>

      <ResultPanel emptyText="Enter your tank volume and target light level, then press Calculate.">
        {result && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text">~{result.targetLedWatts} W</div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                LED watts needed for {input.level} light
              </div>
            </div>
            <div className="border-t border-aqua-200 dark:border-aqua-800/50 pt-3 text-xs text-gray-600 dark:text-slate-300 space-y-1">
              <ResultRow label="Target lumens" value={`${result.targetLumens.toLocaleString()} lm`} />
              {result.achievedLumens !== null && (
                <>
                  <ResultRow label="Your light delivers" value={`~${result.achievedLumens.toLocaleString()} lm`} />
                  <ResultRow
                    label="Achieved level"
                    value={result.achievedLevel ?? "—"}
                    strong
                  />
                </>
              )}
            </div>
          </div>
        )}
      </ResultPanel>
    </div>
  )
}
