"use client"

import { useState } from "react"
import {
  calculateSalt,
  validateSaltMixInput,
  type SaltMixInput,
} from "@/lib/calculators/saltMixing"
import { ActionButtons, NumberField, ResultPanel, ResultRow, SegmentedControl } from "./ToolForm"

const initialInput: SaltMixInput = {
  volumeL: null,
  sg: 1.025,
  headroomPercent: 10,
}

export default function SaltMixingCalculator() {
  const [input, setInput] = useState<SaltMixInput>(initialInput)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof calculateSalt> | null>(null)

  const setNum = (field: "volumeL" | "sg", value: string) => {
    const parsed = value === "" ? null : Number(value)
    setInput((prev) => ({ ...prev, [field]: parsed }))
    setResult(null)
  }

  const handleCalculate = () => {
    const errs = validateSaltMixInput(input)
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      setResult(calculateSalt(input))
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
            id="salt-volume"
            label="Water volume (L)"
            placeholder="100"
            hint="RO/DI water you are mixing"
            value={input.volumeL ?? ""}
            onChange={(v) => setNum("volumeL", v)}
            error={errors.volumeL}
          />
          <NumberField
            id="salt-sg"
            label="Target specific gravity"
            placeholder="1.025"
            hint="Most reef tanks run 1.024–1.026"
            value={input.sg ?? ""}
            onChange={(v) => setNum("sg", v)}
            error={errors.sg}
          />
        </div>
        <div className="mt-4">
          <SegmentedControl
            name="headroom"
            label="Extra mix to compensate for evaporation & waste"
            options={[
              { value: "0", label: "None" },
              { value: "10", label: "+10%" },
              { value: "20", label: "+20%" },
            ]}
            value={String(input.headroomPercent ?? 10) as "0" | "10" | "20"}
            onChange={(v) => {
              setInput((prev) => ({ ...prev, headroomPercent: Number(v) }))
              setResult(null)
            }}
          />
        </div>
        <ActionButtons onCalculate={handleCalculate} onReset={reset} />
      </div>

      <ResultPanel emptyText="Enter the water volume and target salinity, then press Calculate.">
        {result && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text">{result.grams.toLocaleString()} g</div>
              <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                salt mix for {input.volumeL} L at SG {input.sg}
              </div>
            </div>
            <div className="border-t border-aqua-200 dark:border-aqua-800/50 pt-3 text-xs text-gray-600 dark:text-slate-300 space-y-1">
              <ResultRow label="With headroom" value={`${result.gramsWithHeadroom.toLocaleString()} g`} />
              <ResultRow label="≈ kg" value={`${result.kg} kg`} />
              <ResultRow label="Salt per liter" value={`${result.saltPerLiter} g/L`} />
            </div>
          </div>
        )}
      </ResultPanel>
    </div>
  )
}
