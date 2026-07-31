"use client"

import { useState } from "react"
import {
  calculateVolume,
  validateVolumeInput,
  type VolumeInput,
  type TankShape,
} from "@/lib/calculators/volume"
import type { LengthUnit } from "@/lib/calculators/units"
import { RotateCcw } from "lucide-react"

const initialInput: VolumeInput = {
  shape: "rectangular",
  length: null,
  width: null,
  height: null,
  diameter: null,
  unit: "cm",
  displacementPercent: 0,
}

export default function AquariumVolumeCalculator() {
  const [input, setInput] = useState<VolumeInput>(initialInput)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ReturnType<typeof calculateVolume> | null>(null)

  const update = (patch: Partial<VolumeInput>) => {
    setInput((prev) => ({ ...prev, ...patch }))
    setResult(null)
  }

  const setNum = (field: "length" | "width" | "height" | "diameter", value: string) => {
    const parsed = value === "" ? null : Number(value)
    update({ [field]: parsed })
  }

  const handleCalculate = () => {
    const errs = validateVolumeInput(input)
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      setResult(calculateVolume(input))
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
      hasError
        ? "border-red-400 dark:border-red-500"
        : "border-gray-200 dark:border-slate-700"
    }`

  const showRect = input.shape === "rectangular"
  const showCube = input.shape === "cube"
  const showCylinder = input.shape === "cylinder"

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5 sm:p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Tank shape</label>
          <div className="flex flex-wrap gap-2">
            {(["rectangular", "cube", "cylinder"] as TankShape[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => update({ shape: s })}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                  input.shape === s
                    ? "gradient-bg text-white"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Unit</label>
          <div className="flex gap-2">
            {(["cm", "in"] as LengthUnit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => update({ unit: u })}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  input.unit === u
                    ? "gradient-bg text-white"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                }`}
              >
                {u === "cm" ? "Centimeters (cm)" : "Inches (in)"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {showRect && (
            <>
              <div>
                <label htmlFor="vol-length" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Length</label>
                <input
                  id="vol-length"
                  type="number"
                  inputMode="decimal"
                  placeholder="60"
                  value={input.length ?? ""}
                  onChange={(e) => setNum("length", e.target.value)}
                  className={inputClass(!!errors.length)}
                />
                {errors.length && <p className="text-xs text-red-500 mt-1">{errors.length}</p>}
              </div>
              <div>
                <label htmlFor="vol-width" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Width</label>
                <input
                  id="vol-width"
                  type="number"
                  inputMode="decimal"
                  placeholder="30"
                  value={input.width ?? ""}
                  onChange={(e) => setNum("width", e.target.value)}
                  className={inputClass(!!errors.width)}
                />
                {errors.width && <p className="text-xs text-red-500 mt-1">{errors.width}</p>}
              </div>
              <div>
                <label htmlFor="vol-height" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Height</label>
                <input
                  id="vol-height"
                  type="number"
                  inputMode="decimal"
                  placeholder="35"
                  value={input.height ?? ""}
                  onChange={(e) => setNum("height", e.target.value)}
                  className={inputClass(!!errors.height)}
                />
                {errors.height && <p className="text-xs text-red-500 mt-1">{errors.height}</p>}
              </div>
            </>
          )}
          {showCube && (
            <div>
              <label htmlFor="vol-side" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Side length</label>
              <input
                id="vol-side"
                type="number"
                inputMode="decimal"
                placeholder="30"
                value={input.length ?? ""}
                onChange={(e) => setNum("length", e.target.value)}
                className={inputClass(!!errors.length)}
              />
              {errors.length && <p className="text-xs text-red-500 mt-1">{errors.length}</p>}
            </div>
          )}
          {showCylinder && (
            <>
              <div>
                <label htmlFor="vol-diameter" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Diameter</label>
                <input
                  id="vol-diameter"
                  type="number"
                  inputMode="decimal"
                  placeholder="40"
                  value={input.diameter ?? ""}
                  onChange={(e) => setNum("diameter", e.target.value)}
                  className={inputClass(!!errors.diameter)}
                />
                {errors.diameter && <p className="text-xs text-red-500 mt-1">{errors.diameter}</p>}
              </div>
              <div>
                <label htmlFor="vol-cyl-height" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Height</label>
                <input
                  id="vol-cyl-height"
                  type="number"
                  inputMode="decimal"
                  placeholder="50"
                  value={input.height ?? ""}
                  onChange={(e) => setNum("height", e.target.value)}
                  className={inputClass(!!errors.height)}
                />
                {errors.height && <p className="text-xs text-red-500 mt-1">{errors.height}</p>}
              </div>
            </>
          )}
        </div>

        <div className="mt-4">
          <label htmlFor="vol-displacement" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
            Displacement by substrate & hardscape (%)
          </label>
          <input
            id="vol-displacement"
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            placeholder="10"
            value={input.displacementPercent ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? null : Number(e.target.value)
              update({ displacementPercent: v })
            }}
            className={inputClass(!!errors.displacement)}
          />
          {errors.displacement && <p className="text-xs text-red-500 mt-1">{errors.displacement}</p>}
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
                <div className="text-4xl font-bold gradient-text">{result.liters} L</div>
                <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  {result.usGallons} US gallons
                </div>
              </div>
              <div className="border-t border-aqua-200 dark:border-aqua-800/50 pt-3 text-xs text-gray-600 dark:text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span>Gross volume</span>
                  <span className="font-medium">{result.cubicCm.toLocaleString()} cm³</span>
                </div>
                <div className="flex justify-between">
                  <span>Actual water volume</span>
                  <span className="font-medium">{result.liters} L</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
              Enter your tank dimensions and press Calculate to see the water volume.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
