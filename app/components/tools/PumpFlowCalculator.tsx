"use client"

import { useState } from "react"
import {
  calculatePumpFlow,
  validatePumpFlowInput,
  type PumpFlowInput,
} from "@/lib/calculators/pumpFlow"
import { ActionButtons, NumberField, ResultPanel, ResultRow, SegmentedControl } from "./ToolForm"

const initialInput: PumpFlowInput = {
  volumeL: null,
  turnoverPerHour: 4,
  headLossPercent: 20,
}

export default function PumpFlowCalculator() {
  const [input, setInput] = useState<PumpFlowInput>(initialInput)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof calculatePumpFlow> | null>(null)

  const setNum = (field: "volumeL" | "turnoverPerHour" | "headLossPercent", value: string) => {
    const parsed = value === "" ? null : Number(value)
    setInput((prev) => ({ ...prev, [field]: parsed }))
    setResult(null)
  }

  const handleCalculate = () => {
    const errs = validatePumpFlowInput(input)
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      setResult(calculatePumpFlow(input))
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
            id="pump-volume"
            label="Tank volume (L)"
            placeholder="100"
            value={input.volumeL ?? ""}
            onChange={(v) => setNum("volumeL", v)}
            error={errors.volumeL}
          />
          <NumberField
            id="pump-turnover"
            label="Turnover rate (× per hour)"
            placeholder="4"
            hint="Freshwater 3–5×, planted 3–10×, reef 8–10×"
            value={input.turnoverPerHour ?? ""}
            onChange={(v) => setNum("turnoverPerHour", v)}
            error={errors.turnoverPerHour}
          />
        </div>
        <div className="mt-4">
          <SegmentedControl
            name="headloss"
            label="Filter head / friction loss"
            options={[
              { value: "10", label: "10%" },
              { value: "20", label: "20%" },
              { value: "30", label: "30%" },
              { value: "40", label: "40%" },
            ]}
            value={String(input.headLossPercent ?? 20) as "10" | "20" | "30" | "40"}
            onChange={(v) => {
              setInput((prev) => ({ ...prev, headLossPercent: Number(v) }))
              setResult(null)
            }}
          />
        </div>
        <ActionButtons onCalculate={handleCalculate} onReset={reset} />
      </div>

      <ResultPanel emptyText="Enter your tank volume and target turnover, then press Calculate.">
        {result && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text">{result.requiredFlowLh.toLocaleString()} L/h</div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                {result.requiredFlowGph} US gph — ideal flow for your tank
              </div>
            </div>
            <div className="border-t border-aqua-200 dark:border-aqua-800/50 pt-3 text-xs text-gray-600 dark:text-slate-300 space-y-1">
              <ResultRow label="With head loss compensation" value={`${result.adjustedFlowLh.toLocaleString()} L/h`} />
              <ResultRow label="Adjusted (US gph)" value={`${result.adjustedFlowGph} gph`} />
              <ResultRow label="Turnover rate" value={`${input.turnoverPerHour}× per hour`} />
            </div>
          </div>
        )}
      </ResultPanel>
    </div>
  )
}
