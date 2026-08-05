"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Share2, Check, Copy } from "lucide-react"
import {
  NumberField,
  SegmentedControl,
  ResultRow,
} from "./ToolForm"
import {
  calculateAquarium,
  validateAquariumInput,
  type AquariumInput,
  type LightingMode,
} from "@/lib/calculators/aquarium"
import { calculateStocking, validateStockingInput, type StockingLevel } from "@/lib/calculators/stocking"
import { calculateWaterChange, validateWaterChangeInput } from "@/lib/calculators/waterChange"
import { calculateCo2, validateCo2Input } from "@/lib/calculators/co2"
import { calculateLighting, validateLightingInput, type LightLevel } from "@/lib/calculators/lighting"
import { calculatePumpFlow, validatePumpFlowInput } from "@/lib/calculators/pumpFlow"

const EMPTY_AQUARIUM: AquariumInput = {
  lengthCm: null,
  widthCm: null,
  heightCm: null,
  substrateDepthCm: null,
  bagSizeLiters: null,
  lightingMode: "medium",
  usableVolumeRatio: 0.9,
}

function toNum(v: string): number | null {
  if (v.trim() === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export default function AquariumPlanner() {
  const searchParams = useSearchParams()

  const [dims, setDims] = useState({
    length: searchParams.get("l") || "60",
    width: searchParams.get("w") || "30",
    height: searchParams.get("h") || "35",
  })
  const [displacement, setDisplacement] = useState("10")
  const [substrate, setSubstrate] = useState({ depth: searchParams.get("s") || "", bagSize: "10" })
  const [lightMode, setLightMode] = useState<LightingMode>("medium")
  const [stock, setStock] = useState({ fishCount: "", adultCm: "" })
  const [stockLevel, setStockLevel] = useState<StockingLevel>("standard")
  const [water, setWater] = useState({ changePercent: "25", currentNitrate: "", sourceNitrate: "" })
  const [co2, setCo2] = useState({ kh: "", ph: "" })
  const [light, setLight] = useState({ level: "medium" as LightLevel, ledWattage: "" })
  const [shareCopied, setShareCopied] = useState(false)

  const aquariumInput: AquariumInput = {
    ...EMPTY_AQUARIUM,
    lengthCm: toNum(dims.length),
    widthCm: toNum(dims.width),
    heightCm: toNum(dims.height),
    substrateDepthCm: toNum(substrate.depth),
    bagSizeLiters: toNum(substrate.bagSize),
    lightingMode: lightMode,
    usableVolumeRatio: 1 - (toNum(displacement) ?? 0) / 100,
  }
  const aquariumErrors = validateAquariumInput(aquariumInput)
  const aquarium = useMemo(() => calculateAquarium(aquariumInput), [aquariumInput])
  const aquariumValid =
    Object.keys(aquariumErrors).length === 0 &&
    aquariumInput.lengthCm !== null &&
    aquariumInput.widthCm !== null &&
    aquariumInput.heightCm !== null &&
    aquariumInput.usableVolumeRatio > 0 &&
    aquariumInput.usableVolumeRatio <= 1

  const volumeL = aquariumValid ? aquarium.usableLiters : null

  const stockingInput = {
    volumeL,
    level: stockLevel,
    fishCount: toNum(stock.fishCount),
    adultCm: toNum(stock.adultCm),
  }
  const stockingErrors = aquariumValid ? validateStockingInput(stockingInput) : {}
  const stocking = useMemo(() => calculateStocking(stockingInput), [stockingInput])

  const waterInput = {
    tankVolumeLiters: volumeL,
    changePercent: toNum(water.changePercent),
    currentParameter: toNum(water.currentNitrate),
    sourceParameter: toNum(water.sourceNitrate),
  }
  const waterErrors = aquariumValid ? validateWaterChangeInput(waterInput) : {}
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
  const lightingErrors = aquariumValid ? validateLightingInput(lightingInput) : {}
  const lighting = useMemo(() => calculateLighting(lightingInput), [lightingInput])

  const pumpInput = { volumeL, turnoverPerHour: 4, headLossPercent: 25 }
  const pumpErrors = aquariumValid ? validatePumpFlowInput(pumpInput) : {}
  const pump = useMemo(() => calculatePumpFlow(pumpInput), [pumpInput])

  const share = async () => {
    const params = new URLSearchParams()
    if (dims.length) params.set("l", dims.length)
    if (dims.width) params.set("w", dims.width)
    if (dims.height) params.set("h", dims.height)
    if (substrate.depth) params.set("s", substrate.depth)
    const url = `${window.location.origin}/tools/aquarium-calculator${params.toString() ? `?${params}` : ""}`
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "AquaMind Aquarium Calculator", text: "My tank plan", url })
        return
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  const section = "rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5 sm:p-6"
  const sectionTitle = "text-sm font-bold text-gray-900 dark:text-slate-100 mb-4 uppercase tracking-wide"

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
      <div className="space-y-6">
        <section className={section} aria-label="Tank dimensions">
          <h2 className={sectionTitle}>1 · Tank dimensions</h2>
          <div className="grid grid-cols-3 gap-3">
            <NumberField id="pl-len" label="Length (cm)" value={dims.length} placeholder="60" error={aquariumErrors.lengthCol}
              onChange={(v) => setDims((d) => ({ ...d, length: v }))} />
            <NumberField id="pl-wid" label="Width (cm)" value={dims.width} placeholder="30" error={aquariumErrors.widthCol}
              onChange={(v) => setDims((d) => ({ ...d, width: v }))} />
            <NumberField id="pl-hei" label="Height (cm)" value={dims.height} placeholder="35" error={aquariumErrors.heightCol}
              onChange={(v) => setDims((d) => ({ ...d, height: v }))} />
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <NumberField id="pl-sub" label="Substrate depth (cm)" value={substrate.depth} placeholder="5"
              error={aquariumErrors.substrateDepthCol} hint="Gravel or soil"
              onChange={(v) => setSubstrate((s) => ({ ...s, depth: v }))} />
            <NumberField id="pl-bag" label="Substrate bag size (L)" value={substrate.bagSize} placeholder="10"
              error={aquariumErrors.bagSizeCol} hint="Optional"
              onChange={(v) => setSubstrate((s) => ({ ...s, bagSize: v }))} />
            <NumberField id="pl-disp" label="Displacement (%)" value={displacement} placeholder="10"
              error={aquariumErrors.usableVolumeRatioCol} hint="Decor & waterline gap"
              onChange={setDisplacement} />
          </div>
          <div className="mt-4 max-w-[320px]">
            <SegmentedControl
              label="Lighting mode (for estimate)"
              name="light-mode"
              value={lightMode}
              onChange={setLightMode}
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
              ]}
            />
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
          <h2 className={sectionTitle}>4 · Your lighting (optional)</h2>
          <div className="max-w-[220px]">
            <NumberField id="pl-led" label="Your LED wattage" value={light.ledWattage} placeholder="30"
              error={lightingErrors.ledWattage}
              onChange={(v) => setLight((l) => ({ ...l, ledWattage: v }))} />
          </div>
        </section>
      </div>

      <div className="space-y-5 lg:sticky lg:top-24">
        {!aquariumValid && (
          <div className="rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 p-5">
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
              Enter valid tank dimensions (1–500 cm, decimals allowed) and displacement to start the plan.
            </p>
          </div>
        )}

        {aquariumValid && (
          <>
            <div className="rounded-2xl bg-gradient-to-br from-aqua-50 to-ocean-50 dark:from-aqua-950/30 dark:to-ocean-950/30 border border-aqua-100 dark:border-aqua-900/50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-1">Tank volume</h2>
                  <p className="text-3xl font-bold gradient-text mb-1">{aquarium.grossLiters} L</p>
                  <p className="text-sm text-gray-600 dark:text-slate-300">usable ≈ {aquarium.usableLiters} L</p>
                </div>
                <button
                  onClick={share}
                  className="inline-flex items-center gap-1.5 px-3 py-2 min-h-11 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-gray-600 dark:text-slate-300 hover:border-aqua-400 transition-all shrink-0"
                >
                  {shareCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                  {shareCopied ? "Copied" : "Share"}
                </button>
              </div>
              {aquarium.substrateLiters > 0 && (
                <div className="mt-4 pt-4 border-t border-aqua-100 dark:border-aqua-900/50 space-y-1.5">
                  <ResultRow label="Substrate" value={`${aquarium.substrateLiters} L`} />
                  {aquarium.bags > 0 && (
                    <ResultRow label="Substrate bags" value={`${aquarium.bags} × ${substrate.bagSize || "?"} L bags`} strong />
                  )}
                </div>
              )}
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
                  {toNum(water.currentNitrate) ?? 0} to ≈ {waterResult.resultingParameter} mg/L.
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
                <ResultRow label="Est. fixture watts" value={`${aquarium.lightingWatts} W`} />
                <ResultRow label="Filter flow" value={`${pump.requiredFlowLh.toLocaleString()} L/h (4×/h +25%)`} strong />
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{aquarium.lightingLabel}</p>
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