"use client"

import { useMemo, useState } from "react"
import { ExternalLink } from "lucide-react"
import {
  calculateCorrection,
  calculateCustomCorrection,
  calculateCustomLabelDose,
  calculateSystemDose,
  getReefProduct,
  REEF_PRODUCTS,
  REEF_RECOMMENDED_RANGES,
  TRACE_GUIDANCE,
  validateReefDosingInput,
  type CorrectionResult,
  type CustomDoseMode,
  type DoseUnit,
  type LabelDoseResult,
  type ReefParameter,
  type SystemDoseResult,
} from "@/lib/calculators/reefDosing"
import { ActionButtons, NumberField, ResultPanel, ResultRow, SegmentedControl } from "./ToolForm"

type TankType = "sps-dominant" | "mixed-reef" | "lps-soft" | "new-tank"
type FeedingLevel = "low" | "medium" | "high"
type Result =
  | { kind: "system"; value: SystemDoseResult }
  | { kind: "correction"; value: CorrectionResult }
  | { kind: "label"; value: LabelDoseResult }
  | null

const tankOptions: { value: TankType; label: string }[] = [
  { value: "sps-dominant", label: "SPS-dominant" },
  { value: "mixed-reef", label: "Mixed SPS + LPS" },
  { value: "lps-soft", label: "LPS / soft" },
  { value: "new-tank", label: "New / empty" },
]

const feedingOptions: { value: FeedingLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

const parameterLabels: Record<ReefParameter, { label: string; unit: string }> = {
  calcium: { label: "Calcium", unit: "ppm" },
  alkalinity: { label: "Alkalinity", unit: "dKH" },
  magnesium: { label: "Magnesium", unit: "ppm" },
}

function groupProducts() {
  const groups: { label: string; ids: string[] }[] = [
    { label: "All-in-one", ids: REEF_PRODUCTS.filter((p) => p.kind === "all-in-one").map((p) => p.id) },
    { label: "Balanced systems", ids: REEF_PRODUCTS.filter((p) => p.kind === "balanced").map((p) => p.id) },
    { label: "Calcium", ids: REEF_PRODUCTS.filter((p) => p.kind === "correction" && p.parameter === "calcium").map((p) => p.id) },
    { label: "Alkalinity", ids: REEF_PRODUCTS.filter((p) => p.kind === "correction" && p.parameter === "alkalinity").map((p) => p.id) },
    { label: "Magnesium", ids: REEF_PRODUCTS.filter((p) => p.kind === "correction" && p.parameter === "magnesium").map((p) => p.id) },
    { label: "Custom / generic", ids: REEF_PRODUCTS.filter((p) => p.kind === "custom").map((p) => p.id) },
  ]
  return groups.filter((group) => group.ids.length > 0)
}

function demandNote(tankType: TankType, feeding: FeedingLevel): string {
  if (tankType === "new-tank") {
    return "New or empty tank: establish stable Ca/KH/Mg and add corals before starting a maintenance dose. Do not dose to a target without living consumers."
  }
  if (tankType === "sps-dominant" && feeding === "high") {
    return "SPS-dominant with high feeding can consume Ca/KH quickly. Start at the official dose, test every 2–3 days during ramp-up, and increase only from measured consumption."
  }
  if (tankType === "lps-soft" && feeding === "low") {
    return "LPS/soft with low feeding usually has lower Ca/KH demand. Start at the low end of the official dose and measure weekly; do not assume SPS-level consumption."
  }
  return "Tank type and feeding are context, not a formula. Start at the official dose for the product and adjust from measured Ca/KH/Mg."
}

export default function ReefDosingCalculator() {
  const [productId, setProductId] = useState("tm-all-for-reef")
  const [volumeL, setVolumeL] = useState<number | null>(null)
  const [tankType, setTankType] = useState<TankType>("mixed-reef")
  const [feeding, setFeeding] = useState<FeedingLevel>("medium")
  const [current, setCurrent] = useState<number | null>(null)
  const [target, setTarget] = useState<number | null>(null)
  const [daysSinceLastTest, setDaysSinceLastTest] = useState<number | null>(null)
  const [customParameter, setCustomParameter] = useState<ReefParameter>("calcium")
  const [customAmount, setCustomAmount] = useState<number | null>(null)
  const [customPerVolumeL, setCustomPerVolumeL] = useState<number | null>(100)
  const [customRaises, setCustomRaises] = useState<number | null>(null)
  const [customUnit, setCustomUnit] = useState<DoseUnit>("ml")
  const [customMode, setCustomMode] = useState<CustomDoseMode>("correction")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<Result>(null)

  const product = getReefProduct(productId)
  const groups = useMemo(() => groupProducts(), [])
  const isCorrection = product?.kind === "correction" || product?.kind === "custom"
  const labelOnly = product?.kind === "custom" && customMode === "label"
  const wantsCorrection = isCorrection && !labelOnly
  const parameter = product?.kind === "custom" ? customParameter : product?.parameter
  const parameterInfo = parameter ? parameterLabels[parameter] : null
  const range = parameter ? REEF_RECOMMENDED_RANGES[parameter] : null

  const reset = () => {
    setProductId("tm-all-for-reef")
    setVolumeL(null)
    setTankType("mixed-reef")
    setFeeding("medium")
    setCurrent(null)
    setTarget(null)
    setDaysSinceLastTest(null)
    setCustomParameter("calcium")
    setCustomAmount(null)
    setCustomPerVolumeL(100)
    setCustomRaises(null)
    setCustomUnit("ml")
    setCustomMode("correction")
    setErrors({})
    setResult(null)
  }

  const handleCalculate = () => {
    const input = {
      productId,
      volumeL,
      current,
      target,
      daysSinceLastTest,
      customAmount,
      customPerVolumeL,
      customRaises,
      customUnit,
      customParameter,
      customMode,
    }
    const validation = validateReefDosingInput(input)
    setErrors(validation)
    if (Object.keys(validation).length > 0) {
      setResult(null)
      return
    }

    if (product?.kind === "all-in-one" || product?.kind === "balanced") {
      setResult({ kind: "system", value: calculateSystemDose(productId, volumeL) })
      return
    }
    if (product?.kind === "custom") {
      if (!customAmount || !customPerVolumeL) return
      if (labelOnly) {
        setResult({
          kind: "label",
          value: calculateCustomLabelDose({
            volumeL,
            amount: customAmount,
            perVolumeL: customPerVolumeL,
            unit: customUnit,
            parameter: customParameter,
          }),
        })
        return
      }
      if (!customParameter || !customRaises) return
      setResult({
        kind: "correction",
        value: calculateCustomCorrection({
          volumeL,
          current,
          target,
          parameter: customParameter,
          amount: customAmount,
          perVolumeL: customPerVolumeL,
          raises: customRaises,
          unit: customUnit,
          daysSinceLastTest,
        }),
      })
      return
    }
    setResult({ kind: "correction", value: calculateCorrection({ productId, volumeL, current, target, daysSinceLastTest }) })
  }

  const unit =
    result?.kind === "correction"
      ? result.value.product.doseUnit ?? "ml"
      : result?.kind === "label"
        ? result.value.unit
        : product?.doseUnit ?? "ml"

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5 sm:p-6">
          <div className="mb-4">
            <label htmlFor="reef-product" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Product
            </label>
            <select
              id="reef-product"
              value={productId}
              onChange={(event) => {
                setProductId(event.target.value)
                setResult(null)
                setErrors({})
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-aqua-500/50"
            >
              {groups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.ids.map((id) => {
                    const item = getReefProduct(id)
                    return (
                      <option key={id} value={id}>
                        {item?.brand} — {item?.name}
                      </option>
                    )
                  })}
                </optgroup>
              ))}
            </select>
            {product?.notes ? (
              <p className="mt-2 text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{product.notes}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberField
              id="reef-volume"
              label="Actual water volume (L)"
              placeholder="200"
              value={volumeL ?? ""}
              onChange={(value) => {
                setVolumeL(value === "" ? null : Number(value))
                setResult(null)
              }}
              error={errors.volumeL}
              hint="Use net water volume after rock, sand and equipment displacement."
            />
          </div>

          <div className="mt-4">
            <SegmentedControl
              name="tank-type"
              label="Tank type"
              options={tankOptions}
              value={tankType}
              onChange={setTankType}
            />
            <SegmentedControl
              name="feeding"
              label="Feeding / bioload"
              options={feedingOptions}
              value={feeding}
              onChange={setFeeding}
            />
          </div>

          {wantsCorrection && parameterInfo ? (
            <div className="mt-4 rounded-2xl border border-aqua-100 dark:border-aqua-900/50 bg-aqua-50/50 dark:bg-aqua-950/20 p-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-1">
                {parameterInfo.label} correction
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                Common reef reference: {range?.min}–{range?.max} {parameterInfo.unit}. Use your own calibrated test kit.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <NumberField
                  id="reef-current"
                  label={`Current ${parameterInfo.label.toLowerCase()} (${parameterInfo.unit})`}
                  placeholder={range ? String(range.min) : ""}
                  value={current ?? ""}
                  onChange={(value) => {
                    setCurrent(value === "" ? null : Number(value))
                    setResult(null)
                  }}
                  error={errors.current}
                />
                <NumberField
                  id="reef-target"
                  label={`Target ${parameterInfo.label.toLowerCase()} (${parameterInfo.unit})`}
                  placeholder={range ? String(range.max) : ""}
                  value={target ?? ""}
                  onChange={(value) => {
                    setTarget(value === "" ? null : Number(value))
                    setResult(null)
                  }}
                  error={errors.target}
                />
                <NumberField
                  id="reef-days"
                  label="Days since last test (optional)"
                  placeholder="7"
                  value={daysSinceLastTest ?? ""}
                  onChange={(value) => {
                    setDaysSinceLastTest(value === "" ? null : Number(value))
                    setResult(null)
                  }}
                  error={errors.daysSinceLastTest}
                  hint="Only if the tank was at your target at the last test and no supplement was dosed."
                />
              </div>
            </div>
          ) : null}

          {product?.kind === "custom" ? (
            <div className="mt-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Custom product label</h2>
              <SegmentedControl
                name="custom-mode"
                label="Calculation mode"
                options={[
                  { value: "correction", label: "Correction (has target)" },
                  { value: "label", label: "Label-only dose" },
                ]}
                value={customMode}
                onChange={(value) => {
                  setCustomMode(value)
                  setResult(null)
                  setErrors({})
                }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customMode === "correction" ? (
                  <div>
                    <label htmlFor="reef-custom-parameter" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                      Parameter
                    </label>
                    <select
                      id="reef-custom-parameter"
                      value={customParameter}
                      onChange={(event) => {
                        setCustomParameter(event.target.value as ReefParameter)
                        setResult(null)
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                    >
                      <option value="calcium">Calcium (ppm)</option>
                      <option value="alkalinity">Alkalinity (dKH)</option>
                      <option value="magnesium">Magnesium (ppm)</option>
                    </select>
                  </div>
                ) : null}
                <div>
                  <label htmlFor="reef-custom-unit" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    Dose unit
                  </label>
                  <select
                    id="reef-custom-unit"
                    value={customUnit}
                    onChange={(event) => {
                      setCustomUnit(event.target.value as DoseUnit)
                      setResult(null)
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                  >
                    <option value="ml">mL</option>
                    <option value="g">grams</option>
                  </select>
                </div>
                <NumberField
                  id="reef-custom-amount"
                  label="Label dose amount"
                  placeholder="5"
                  value={customAmount ?? ""}
                  onChange={(value) => {
                    setCustomAmount(value === "" ? null : Number(value))
                    setResult(null)
                  }}
                  error={errors.customAmount}
                />
                <NumberField
                  id="reef-custom-volume"
                  label="Label dose per volume (L)"
                  placeholder="100"
                  value={customPerVolumeL ?? ""}
                  onChange={(value) => {
                    setCustomPerVolumeL(value === "" ? null : Number(value))
                    setResult(null)
                  }}
                  error={errors.customPerVolumeL}
                />
                {customMode === "correction" ? (
                  <NumberField
                    id="reef-custom-raises"
                    label={`Expected rise (${parameterInfo?.unit ?? "ppm"})`}
                    placeholder="2"
                    value={customRaises ?? ""}
                    onChange={(value) => {
                      setCustomRaises(value === "" ? null : Number(value))
                      setResult(null)
                    }}
                    error={errors.customRaises}
                    hint="If the label gives no rise, switch to label-only mode."
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-4 rounded-xl bg-gray-50 dark:bg-slate-700/30 border border-gray-100 dark:border-slate-700 p-3">
            <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">{demandNote(tankType, feeding)}</p>
          </div>

          <ActionButtons onCalculate={handleCalculate} onReset={reset} />
        </div>

        <div>
          <ResultPanel emptyText="Choose a product, enter your water volume and calculate. Correction products also need current and target values.">
            {result ? <>
            {result.kind === "system" ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-4xl font-bold gradient-text">
                    {result.value.dailyAmount} {result.value.product.doseUnit ?? "ml"}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">daily starting dose</div>
                </div>
                <div className="border-t border-aqua-200 dark:border-aqua-800/50 pt-3 space-y-1">
                  <ResultRow label="Weekly" value={`${result.value.weeklyAmount} ${result.value.product.doseUnit ?? "ml"}`} />
                  {result.value.totalDailyAcrossComponents !== null ? (
                    <ResultRow
                      label="Total across components"
                      value={`${result.value.totalDailyAcrossComponents} ${result.value.product.doseUnit ?? "ml"}/day`}
                    />
                  ) : null}
                  {result.value.maxDailyAmount !== null ? (
                    <ResultRow label="Label maximum" value={`${result.value.maxDailyAmount} ${result.value.product.doseUnit ?? "ml"}/day`} />
                  ) : null}
                  {result.value.rampPerWeekAmount !== null ? (
                    <ResultRow label="Ramp" value={`+${result.value.rampPerWeekAmount} ${result.value.product.doseUnit ?? "ml"} per week`} />
                  ) : null}
                </div>
                <div className="space-y-1.5 border-t border-aqua-200 dark:border-aqua-800/50 pt-3">
                  {result.value.warnings.map((warning) => (
                    <p key={warning} className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {result.kind === "label" ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-4xl font-bold gradient-text">
                    {result.value.totalAmount} {result.value.unit}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">per label application</div>
                </div>
                <div className="border-t border-aqua-200 dark:border-aqua-800/50 pt-3 space-y-1">
                  <ResultRow
                    label="Label rate"
                    value={`${result.value.labelAmount} ${result.value.unit} per ${result.value.labelPerVolumeL} L`}
                  />
                  <ResultRow label="Your water volume" value={`${volumeL ?? 0} L`} />
                </div>
                <div className="space-y-1.5 border-t border-aqua-200 dark:border-aqua-800/50 pt-3">
                  {result.value.warnings.map((warning) => (
                    <p key={warning} className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {result.kind === "correction" ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-4xl font-bold gradient-text">
                    {result.value.totalAmount} {unit}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">total to reach target</div>
                </div>
                <div className="border-t border-aqua-200 dark:border-aqua-800/50 pt-3 space-y-1">
                  <ResultRow label="Total change" value={`+${result.value.totalChange} ${result.value.unit}`} />
                  <ResultRow label="Daily amount" value={`${result.value.dailyAmount} ${unit}`} strong />
                  <ResultRow label="Split over" value={`${result.value.days} day${result.value.days === 1 ? "" : "s"}`} />
                  <ResultRow label="Daily change" value={`+${result.value.dailyChange} ${result.value.unit}`} />
                  {result.value.maxDailyAmount !== null ? (
                    <ResultRow label="Product max/day" value={`${result.value.maxDailyAmount} ${unit}`} />
                  ) : null}
                  {result.value.measuredDailyChange !== null ? (
                    <ResultRow
                      label="Measured consumption"
                      value={`${result.value.measuredDailyChange} ${result.value.unit}/day`}
                    />
                  ) : null}
                  {result.value.maintenanceDailyAmount !== null ? (
                    <ResultRow
                      label="Maintenance dose"
                      value={`${result.value.maintenanceDailyAmount} ${unit}/day`}
                      strong
                    />
                  ) : null}
                </div>
                <div className="space-y-1.5 border-t border-aqua-200 dark:border-aqua-800/50 pt-3">
                  {result.value.warnings.map((warning) => (
                    <p key={warning} className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
            </> : null}
          </ResultPanel>

          {product?.sourceUrl ? (
            <div className="mt-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
              <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                Source:{" "}
                <a
                  href={product.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline inline-flex items-center gap-1"
                >
                  {product.sourceLabel}
                  <ExternalLink className="w-3 h-3" />
                </a>
                {product.verifiedAt ? ` · verified ${product.verifiedAt}` : ""}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Trace elements: do not guess</h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-3">
          Trace-element products are not a simple ml-per-liter correction. Dose only against a measured requirement,
          and do not stack multiple trace supplements without testing.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {TRACE_GUIDANCE.map((item) => (
            <div key={item.name} className="rounded-xl border border-gray-100 dark:border-slate-700 p-3">
              <div className="text-xs font-semibold text-gray-900 dark:text-slate-100">
                {item.brand} — {item.name}
              </div>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">{item.note}</p>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-aqua-700 dark:text-aqua-300 underline"
              >
                {item.sourceLabel}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
