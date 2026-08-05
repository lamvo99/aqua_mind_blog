"use client"

import { useMemo, useState } from "react"
import {
  NumberField,
  SegmentedControl,
  ResultRow,
} from "./ToolForm"
import { calculateVolume, validateVolumeInput, type VolumeInput } from "@/lib/calculators/volume"
import { calculateStocking, validateStockingInput, type StockingLevel } from "@/lib/calculators/stocking"
import { calculateWaterChange, validateWaterChangeInput } from "@/lib/calculators/waterChange"
import { calculateCo2, validateCo2Input } from "@/lib/calculators/co2"
import { calculateLighting, validateLightingInput, type LightLevel } from "@/lib/calculators/lighting"
import { calculatePumpFlow, validatePumpFlowInput } from "@/lib/calculators/pumpFlow"

const EMPTY_VOLUME: VolumeInput = {
  shape: "rectangular",
  length: null,
  width: null,
  height: null,
  diameter: null,
  unit: "cm",
  displacementPercent: 10,
}

function toNum(v: string): number | null {
  if (v.trim() === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export default function AquariumPlanner() {
  const [dims, setDims] = useState({ length: "60", width: "30", height: "35" })
  const [displacement, setDisplacement] = useState("10")
  const [stock, setStock] = useState({ fishCount: "", adultCm: "" })
  const [stockLevel, setStockLevel] = useState<StockingLevel>("standard")
  const [water, setWater] = useState({ changePercent: "25", currentNitrate: "", sourceNitrate: "" })
  const [co2, setCo2] = useState({ kh: "", ph: "" })
  const [light, setLight] = useState({ level: "medium" as LightLevel, ledWattage: "" })

  const volumeInput: VolumeInput = {
    ...EMPTY_VOLUME,
    length: toNum(dims.length),
    width: toNum(dims.width),
    height: toNum(dims.height),
    displacementPercent: toNum(displacement),
  }
  const volumeErrors = validateVolumeInput(volumeInput)

  const volume = useMemo(() => calculateVolume(volumeInput), [volumeInput])
  const volumeValid = Object.keys(volumeErrors).length === 0 && volumeInput.displacementPercent !== null

  const volumeL = volumeValid ? volume.liters : null

  const stockingInput = {
    volumeL,
    level: stockLevel,
    fishCount: toNum(stock.fishCount),
    adultCm: toNum(stock.adultCm),
  }
  const stockingErrors = volumeValid ? validateStockingInput(stockingInput) : {}
  const stocking = useMemo(() => calculateStocking(stockingInput), [stockingInput])

  const waterInput = {
    tankVolumeLiters: volumeL,
    changePercent: toNum(water.changePercent),
    currentParameter: toNum(water.currentNitrate),
    sourceParameter: toNum(water.sourceNitrate),
  }
  const waterErrors = volumeValid ? validateWaterChangeInput(waterInput) : {}
  const waterResult = useMemo(() => calculateWaterChange(waterInput), [waterInput])

  const co2Input = { kh: toNum(co2.kh), ph: toNum(co2.ph) }
  const co2Errors = validateCo2Input(co2Input)
  const co2Valid = co2Input.kh !== null && co2Input.ph !== null && Object.keys(co2Errors).length === 0
  const co2Result = useMemo(() => calculateCo2(co2Input), [co2Input])

  const lightingInput = {
    volumeL,
    level: light.level,
    ledWattage: toNum(light.ledWattage),
  }
  const lightingErrors = volumeValid ? validateLightingInput(lightingInput) : {}
  const lighting = useMemo(() => calculateLighting(lightingInput), [lightingInput])

  const pumpInput = { volumeL, turnoverPerHour: 4, headLossPercent: 25 }
  const pumpErrors = volumeValid ? validatePumpFlowInput(pumpInput) : {}
  const pump = useMemo(() => calculatePumpFlow(pumpInput), [pumpInput])

  const section = "rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5 sm:p-6"
  const sectionTitle = "text-sm font-bold text-gray-900 dark:text-slate-100 mb-4 uppercase tracking-wide"

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
      <div className="space-y-6">
        <section className={section} aria-label="Tank dimensions">
          <h2 className={sectionTitle}>1 · Tank dimensions</h2>
          <div className="grid grid-cols-3 gap-3">
            <NumberField id="pl-len" label="Length (cm)" value={dims.length} placeholder="60" error={volumeErrors.length}
              onChange={(v) => setDims((d) => ({ ...d, length: v }))} />
            <NumberField id="pl-wid" label="Width (cm)" value={dims.width} placeholder="30" error={volumeErrors.width}
              onChange={(v) => setDims((d) => ({ ...d, width: v }))} />
            <NumberField id="pl-hei" label="Height (cm)" value={dims.height} placeholder="35" error={volumeErrors.height}
              onChange={(v) => setDims((d) => ({ ...d, height: v }))} />
          </div>
          <div className="mt-3 max-w-[160px]">
            <NumberField id="pl-disp" label="Displacement (%)" value={displacement} placeholder="10"
              error={volumeErrors.displacement} hint="Gravel, hardscape & decor"
              onChange={setDisplacement} />
          </div>
        </section>

        <section className={section} aria-label="Livestock">
          <h2 className={sectionTitle}>2 · Livestock</h2>
          <SegmentedControl
            label="Stocking density"
            name="stock-level"
            value={stockLevel}
            onChange={setStockLevel}
            options={[
              { value: "light", label: "Light" },
              { value: "standard", label: "Standard" },
              { value: "heavy", label: "Heavy" },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField id="pl-fish" label="Fish count" value={stock.fishCount} placeholder="12"
              error={stockingErrors.fishCount}
              onChange={(v) => setStock((s) => ({ ...s, fishCount: v }))} />
            <NumberField id="pl-size" label="Adult size (cm)" value={stock.adultCm} placeholder="4"
              error={stockingErrors.adultCm}
              onChange={(v) => setStock((s) => ({ ...s, adultCm: v }))} />
          </div>
        </section>

        <section className={section} aria-label="Water chemistry">
          <h2 className={sectionTitle}>3 · Water & chemistry</h2>
          <div className="grid grid-cols-2 gap-3">
            <NumberField id="pl-kh" label="KH" value={co2.kh} placeholder="4" error={co2Errors.kh}
              hint="Carbonate hardness"
              onChange={(v) => setCo2((c) => ({ ...c, kh: v }))} />
            <NumberField id="pl-ph" label="pH" value={co2.ph} placeholder="6.8" error={co2Errors.ph}
              onChange={(v) => setCo2((c) => ({ ...c, ph: v }))} />
            <NumberField id="pl-wc" label="Water change (%)" value={water.changePercent} placeholder="25"
              error={waterErrors.changePercent}
              onChange={(v) => setWater((w) => ({ ...w, changePercent: v }))} />
            <NumberField id="pl-nn" label="Nitrate now (mg/L)" value={water.currentNitrate} placeholder="40"
              error={waterErrors.currentParameter}
              onChange={(v) => setWater((w) => ({ ...w, currentNitrate: v }))} />
            <NumberField id="pl-ns" label="Nitrate in source (mg/L)" value={water.sourceNitrate} placeholder="10"
              error={waterErrors.sourceParameter}
              onChange={(v) => setWater((w) => ({ ...w, sourceNitrate: v }))} />
          </div>
        </section>

        <section className={section} aria-label="Lighting">
          <h2 className={sectionTitle}>4 · Lighting</h2>
          <SegmentedControl
            label="Target light level"
            name="light-level"
            value={light.level}
            onChange={(v) => setLight((l) => ({ ...l, level: v }))}
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ]}
          />
          <div className="mt-3 max-w-[220px]">
            <NumberField id="pl-led" label="Your LED wattage (optional)" value={light.ledWattage} placeholder="30"
              error={lightingErrors.ledWattage}
              onChange={(v) => setLight((l) => ({ ...l, ledWattage: v }))} />
          </div>
        </section>
      </div>

      <div className="space-y-5 lg:sticky lg:top-24">
        {!volumeValid && (
          <div className="rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 p-5">
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
              Enter valid tank dimensions (1–500 cm) and displacement to start the plan.
            </p>
          </div>
        )}

        {volumeValid && (
          <>
            <div className="rounded-2xl bg-gradient-to-br from-aqua-50 to-ocean-50 dark:from-aqua-950/30 dark:to-ocean-950/30 border border-aqua-100 dark:border-aqua-900/50 p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Tank volume</h2>
              <p className="text-3xl font-bold gradient-text mb-1">{volume.liters} L</p>
              <p className="text-sm text-gray-600 dark:text-slate-300">{volume.usGallons} US gal</p>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Stocking capacity</h2>
              <div className="space-y-2">
                <ResultRow label="Capacity" value={`${stocking.capacityCm} cm (${stocking.capacityInches}″)`} />
                {stocking.totalCm !== null && (
                  <ResultRow label="Your fish (adult)" value={`${stocking.totalCm} cm`} strong />
                )}
                {stocking.utilizationPercent !== null && (
                  <ResultRow label="Utilization" value={`${stocking.utilizationPercent}%`} strong />
                )}
              </div>
              {stocking.status && (
                <p className={`mt-3 text-sm font-medium ${
                  stocking.status === "overstocked"
                    ? "text-red-600 dark:text-red-400"
                    : stocking.status === "at-capacity"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  {stocking.status === "overstocked"
                    ? "Overstocked — reduce fish or upgrade the tank."
                    : stocking.status === "at-capacity"
                    ? "Near capacity — add fish with care."
                    : "Lightly stocked — room to add fish."}
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Water changes</h2>
              <div className="space-y-2">
                <ResultRow label="Change volume" value={`${waterResult.changeVolumeLiters} L (${waterResult.changeVolumeGallons} gal)`} />
                {waterResult.resultingParameter !== null && (
                  <ResultRow label="Resulting nitrate" value={`≈ ${waterResult.resultingParameter} mg/L`} strong />
                )}
              </div>
              {waterResult.resultingParameter !== null && (
                <p className="mt-3 text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                  After a {toNum(water.changePercent) ?? 0}% change, nitrate drops from{" "}
                  {toNum(water.currentNitrate) ?? 0} to ≈ {waterResult.resultingParameter} mg/L
                  {waterResult.deltaParameter !== null && waterResult.deltaParameter < 0
                    ? ` (${waterResult.deltaParameter})`.replace("-", "−")
                    : ""}.
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">CO₂ estimate</h2>
              {co2Valid ? (
                <>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-1">{co2Result.co2Ppm} ppm</p>
                  <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{co2Result.label}</p>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-slate-400">Enter KH and pH to estimate dissolved CO₂.</p>
              )}
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Lighting & flow</h2>
              <div className="space-y-2">
                <ResultRow label="LED target" value={`${lighting.targetLedWatts} W (${lighting.targetLumens.toLocaleString()} lm)`} />
                {lighting.achievedLevel && (
                  <ResultRow label="Your light" value={`${lighting.achievedLevel} level`} />
                )}
                <ResultRow label="Filter flow" value={`${pump.requiredFlowLh.toLocaleString()} L/h (4×/h +25%)`} strong />
              </div>
            </div>

            <p className="text-xs text-gray-400 dark:text-slate-500 leading-relaxed px-1">
              Estimates only — adapt to your stock, plants and equipment. Verify values with test kits.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
