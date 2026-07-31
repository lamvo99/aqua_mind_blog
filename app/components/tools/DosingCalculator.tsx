"use client"

import { useState } from "react"
import {
  calculateDose,
  validateDosingInput,
  type DosingInput,
} from "@/lib/calculators/dosing"
import { ActionButtons, NumberField, ResultPanel, ResultRow, SegmentedControl } from "./ToolForm"

type HeadroomOption = "none" | "ten" | "twenty"

const initialInput: DosingInput = {
  volumeL: null,
  dosePerL: null,
  headroomPercent: 0,
}

const headroomOptions: { value: HeadroomOption; label: string }[] = [
  { value: "none", label: "None" },
  { value: "ten", label: "+10%" },
  { value: "twenty", label: "+20%" },
]

export default function DosingCalculator() {
  const [input, setInput] = useState<DosingInput>(initialInput)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof calculateDose> | null>(null)

  const setNum = (field: "volumeL" | "dosePerL", value: string) => {
    const parsed = value === "" ? null : Number(value)
    setInput((prev) => ({ ...prev, [field]: parsed }))
    setResult(null)
  }

  const setHeadroom = (v: HeadroomOption) => {
    const pct = v === "none" ? 0 : v === "ten" ? 10 : 20
    setInput((prev) => ({ ...prev, headroomPercent: pct }))
    setResult(null)
  }

  const handleCalculate = () => {
    const errs = validateDosingInput(input)
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      setResult(calculateDose(input))
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
            id="dose-volume"
            label="Tank volume (L)"
            placeholder="100"
            value={input.volumeL ?? ""}
            onChange={(v) => setNum("volumeL", v)}
            error={errors.volumeL}
          />
          <NumberField
            id="dose-rate"
            label="Dose rate (mL per L)"
            placeholder="0.5"
            hint="Check the label: e.g. 5 mL per 10 L = 0.5 mL/L"
            value={input.dosePerL ?? ""}
            onChange={(v) => setNum("dosePerL", v)}
            error={errors.dosePerL}
          />
        </div>
        <div className="mt-4">
          <SegmentedControl
            name="headroom"
            label="Extra headroom for mixing loss"
            options={headroomOptions}
            value={input.headroomPercent === 20 ? "twenty" : input.headroomPercent === 10 ? "ten" : "none"}
            onChange={setHeadroom}
          />
        </div>
        <ActionButtons onCalculate={handleCalculate} onReset={reset} />
      </div>

      <ResultPanel emptyText="Enter your tank volume and the label dose rate, then press Calculate.">
        {result && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text">{result.totalMl} mL</div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">total dose for {input.volumeL} L</div>
            </div>
            <div className="border-t border-aqua-200 dark:border-aqua-800/50 pt-3 text-xs text-gray-600 dark:text-slate-300 space-y-1">
              <ResultRow label="With headroom" value={`${result.totalMlWithHeadroom} mL`} />
              <ResultRow label="≈ teaspoons" value={`${result.teaspoons} tsp`} />
              <ResultRow label="≈ tablespoons" value={`${result.tablespoons} tbsp`} />
            </div>
          </div>
        )}
      </ResultPanel>
    </div>
  )
}
