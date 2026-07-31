"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import { NumberField, SegmentedControl } from "./ToolForm"

type TankTypeId = "community" | "planted" | "nano" | "reef" | "cichlid"
type Commitment = "low" | "medium" | "high"

interface TankType {
  id: TankTypeId
  label: string
  description: string
  tankRangeL: string
  equipment: { label: string; href?: string }[]
  plants: { label: string; href?: string }[]
  fish: { label: string; href?: string }[]
  corals?: { label: string; href?: string }[]
  steps: string[]
  notes: Record<Commitment, string>
}

const tankTypes: TankType[] = [
  {
    id: "community",
    label: "Community Freshwater",
    description: "Peaceful mix of tetras, rasboras, livebearers and bottom dwellers. The classic first aquarium.",
    tankRangeL: "60–200 L",
    equipment: [
      { label: "Hang-on-back or canister filter", href: "/equipment/hang-on-back-filter" },
      { label: "Submersible heater (1 W per L)", href: "/equipment/submersible-heater" },
      { label: "LED aquarium light", href: "/equipment/led-aquarium-light" },
      { label: "Master test kit", href: "/equipment/master-test-kit" },
      { label: "Gravel or sand substrate, net and bucket" },
    ],
    plants: [
      { label: "Java fern", href: "/plants/java-fern" },
      { label: "Anubias", href: "/plants/anubias-barteri" },
      { label: "Amazon sword", href: "/plants/amazon-sword" },
    ],
    fish: [
      { label: "Neon tetras", href: "/species/paracheirodon-innesi" },
      { label: "Guppies", href: "/species/poecilia-reticulata" },
      { label: "Peppered corydoras", href: "/species/corydoras-paleatus" },
      { label: "Harlequin rasboras", href: "/species/trigonostigma-heteromorpha" },
    ],
    steps: [
      "Rinse substrate and hardscape, build your layout.",
      "Fill with dechlorinated water and install equipment.",
      "Cycle the tank for 4–6 weeks (fishless cycle with ammonia).",
      "Add fish slowly — 3–4 at a time, spaced a week apart.",
      "Change 25–30% of the water weekly and test once a week.",
    ],
    notes: {
      low: "Stick to hardy fish only (guppies, zebra danios) and skip live plants beyond java fern. Monthly 30% water changes are the minimum.",
      medium: "A balanced mix of plants and hardy community fish, with regular weekly maintenance.",
      high: "You can keep a planted community with CO₂, angelfish, and discus. Expect daily feeding and pruning routines.",
    },
  },
  {
    id: "planted",
    label: "Planted Aquascape",
    description: "A heavily planted layout — iwagumi, nature or Dutch style — with carpeting plants and CO₂.",
    tankRangeL: "40–150 L",
    equipment: [
      { label: "Canister filter", href: "/equipment/canister-filter" },
      { label: "High-output full-spectrum LED", href: "/equipment/led-aquarium-light" },
      { label: "CO₂ regulator kit", href: "/equipment/co2-regulator-kit" },
      { label: "Aquarium soil substrate", href: "/equipment/master-test-kit" },
      { label: "Master test kit", href: "/equipment/master-test-kit" },
    ],
    plants: [
      { label: "Monte Carlo", href: "/plants/monte-carlo" },
      { label: "Dwarf hairgrass", href: "/plants/dwarf-hairgrass" },
      { label: "Rotala rotundifolia", href: "/plants/rotala-rotundifolia" },
      { label: "Alternanthera reineckii", href: "/plants/alternanthera-reineckii" },
      { label: "Bucephalandra", href: "/plants/bucephalandra" },
    ],
    fish: [
      { label: "Celestial pearl danios", href: "/species/danio-margaritatus" },
      { label: "Otocinclus catfish", href: "/species/otocinclus-affinis" },
      { label: "Cherry barbs", href: "/species/puntius-titteya" },
      { label: "Cardinal tetras", href: "/species/paracheirodon-axelrodi" },
    ],
    steps: [
      "Plan the scape: slope the soil, place hardscape, wet the substrate.",
      "Plant heavily from day one to outcompete algae.",
      "Start CO₂ and light on a 6–8 hour photoperiod.",
      "Dose fertilizer weekly after the cycle completes.",
      "Trim stems weekly and remove dead leaves promptly.",
    ],
    notes: {
      low: "Skip CO₂ and choose low-tech plants (anubias, java fern, crypts, vallisneria). Keep light at ~8 hours or less to avoid algae.",
      medium: "A lightly pressurized CO₂ setup with medium light gives reliable, lush growth with weekly maintenance.",
      high: "High light, high CO₂ and daily fertilization — the full carpeted aquascape. Expect daily trimming.",
    },
  },
  {
    id: "nano",
    label: "Nano, Betta & Shrimp",
    description: "A small 10–30 L tank — perfect for a single betta or a neocaridina shrimp colony.",
    tankRangeL: "10–30 L",
    equipment: [
      { label: "Sponge filter", href: "/equipment/sponge-filter" },
      { label: "Small adjustable heater", href: "/equipment/submersible-heater" },
      { label: "Tiny LED light", href: "/equipment/led-aquarium-light" },
      { label: "Fine sand or small gravel" },
    ],
    plants: [
      { label: "Java moss", href: "/plants/java-moss" },
      { label: "Anubias", href: "/plants/anubias-barteri" },
      { label: "Cryptocoryne wendtii", href: "/plants/cryptocoryne-wendtii" },
    ],
    fish: [
      { label: "Betta (single, no tankmates)", href: "/species/betta-splendens" },
      { label: "Neocaridina shrimp instead of fish" },
      { label: "Dwarf shrimp-safe: no copper medications" },
    ],
    steps: [
      "Choose a 20 L+ tank for a betta, 10 L+ for shrimp.",
      "Cycle fully before adding the betta or shrimp.",
      "Keep flow gentle — bettas and shrimp hate strong currents.",
      "Do small weekly water changes (20%) — never clean the filter in tap water.",
    ],
    notes: {
      low: "One betta, java moss and a sponge filter is the easiest low-maintenance aquarium that exists.",
      medium: "Add shrimp and a few easy plants for a lively, balanced ecosystem.",
      high: "A dense planted nano with crystal shrimp, CO₂ and daily care — beautiful but unforgiving if neglected.",
    },
  },
  {
    id: "reef",
    label: "Reef & Saltwater",
    description: "A saltwater tank with live rock, corals and reef fish. Higher cost and more equipment, but stunning.",
    tankRangeL: "60–200 L",
    equipment: [
      { label: "Circulation pumps", href: "/equipment/circulation-pump-powerhead" },
      { label: "Protein skimmer" },
      { label: "RO/DI unit" },
      { label: "Salt mix", href: "/tools/salt-mixing" },
      { label: "Refractometer or hydrometer" },
    ],
    plants: [
      { label: "Live rock and macroalgae for filtration" },
    ],
    fish: [
      { label: "Ocellaris clownfish", href: "/species/amphiprion-ocellaris" },
      { label: "Green chromis", href: "/species/chromis-viridis" },
    ],
    corals: [
      { label: "Zoanthids", href: "/corals/zoanthids" },
      { label: "Candy cane coral", href: "/corals/candy-cane-coral" },
      { label: "Ricordea mushroom", href: "/corals/ricordea-mushroom" },
      { label: "Duncan coral", href: "/corals/duncan-coral" },
    ],
    steps: [
      "Mix saltwater and let it aerate overnight — verify salinity before use.",
      "Cycle with live rock for 6–8 weeks.",
      "Add corals slowly, starting with soft and beginner LPS.",
      "Add fish one at a time, weeks apart.",
      "Change 10–20% of the water weekly and top up evaporation with RO/DI.",
    ],
    notes: {
      low: "FOWLR (fish-only with live rock) keeps it simple — skip corals and the skimmer can wait.",
      medium: "Soft corals and beginner LPS with a skimmer and regular weekly water changes.",
      high: "SPS and anemones with dosing pumps and strict parameter control. Research every coral before buying.",
    },
  },
  {
    id: "cichlid",
    label: "African Cichlid",
    description: "Hard-water, rock-heavy tanks with colorful mbuna from Lake Malawi. Active and full of personality.",
    tankRangeL: "150–400 L",
    equipment: [
      { label: "Large canister filter (2× turnover)", href: "/equipment/canister-filter" },
      { label: "Submersible heater", href: "/equipment/submersible-heater" },
      { label: "Aragonite sand substrate" },
      { label: "Rock structures with caves" },
    ],
    plants: [
      { label: "Anubias on rocks (mbuna will uproot most plants)", href: "/plants/anubias-barteri" },
      { label: "Java fern", href: "/plants/java-fern" },
    ],
    fish: [
      { label: "Zebra mbuna", href: "/species/pseudotropheus-zebra" },
      { label: "Keep only mbuna — they are territorial", },
    ],
    steps: [
      "Use hard water: pH 7.5–8.5, GH 12–20 dGH.",
      "Overfilter — mbuna produce a lot of waste.",
      "Provide caves and rocks; they need territories.",
      "Stock young fish and grow them together to reduce aggression.",
      "Do weekly 30% water changes without fail.",
    ],
    notes: {
      low: "A single species group of 8–10 young mbuna in a big tank, minimal plants.",
      medium: "A mixed mbuna colony with sand and caves, regular large water changes.",
      high: "Breeding set-ups with harem groups and multiple spawning caves.",
    },
  },
]

const commitmentOptions: { value: Commitment; label: string }[] = [
  { value: "low", label: "Low effort" },
  { value: "medium", label: "Moderate" },
  { value: "high", label: "High effort" },
]

export default function SetupPlanner() {
  const [step, setStep] = useState(0)
  const [tankType, setTankType] = useState<TankTypeId | null>(null)
  const [volumeL, setVolumeL] = useState<string>("")
  const [commitment, setCommitment] = useState<Commitment>("medium")
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  const type = tankTypes.find((t) => t.id === tankType)

  const next = () => {
    if (step === 0 && tankType) setStep(1)
    if (step === 1 && volumeL.trim() !== "" && Number(volumeL) > 0) setStep(2)
  }

  const reset = () => {
    setStep(0)
    setTankType(null)
    setVolumeL("")
    setCommitment("medium")
    setChecked({})
  }

  const toggle = (i: number) => setChecked((prev) => ({ ...prev, [i]: !prev[i] }))

  if (step === 0) {
    return (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {tankTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTankType(t.id)}
              className={`text-left rounded-2xl border p-5 transition-all ${
                tankType === t.id
                  ? "border-aqua-400 dark:border-aqua-500 bg-aqua-50 dark:bg-aqua-950/40 ring-2 ring-aqua-400/30"
                  : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-aqua-300 dark:hover:border-aqua-800"
              }`}
            >
              <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-1">{t.label}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{t.description}</p>
              <span className="inline-block mt-3 text-xs font-medium text-aqua-600 dark:text-aqua-400">
                {t.tankRangeL} recommended
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={next}
            disabled={!tankType}
            className="inline-flex items-center gap-2 px-6 py-3 gradient-bg text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:opacity-90 transition-all"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="max-w-2xl">
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5 sm:p-6">
          <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-1">{type?.label}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
            Recommended range: {type?.tankRangeL}
          </p>
          <NumberField
            id="planner-volume"
            label="Planned tank volume (L)"
            placeholder="100"
            value={volumeL}
            onChange={setVolumeL}
            error={volumeL.trim() !== "" && (Number(volumeL) <= 0 || Number.isNaN(Number(volumeL))) ? "Enter a volume greater than zero" : undefined}
            hint="You can estimate this with the volume calculator later."
          />
          <div className="mt-4">
            <SegmentedControl
              name="commitment"
              label="How much time can you spend per week?"
              options={commitmentOptions}
              value={commitment}
              onChange={setCommitment}
            />
          </div>
          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              onClick={next}
              disabled={volumeL.trim() === "" || Number(volumeL) <= 0}
              className="inline-flex items-center gap-2 px-6 py-3 gradient-bg text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:opacity-90 transition-all"
            >
              Build my plan
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!type) return null

  return (
    <div>
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5 sm:p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-slate-100">Your plan: {type.label}</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {volumeL} L tank · {commitmentOptions.find((c) => c.value === commitment)?.label} · Recommended size {type.tankRangeL}
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Start over
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Checklist</h4>
            <ul className="space-y-2">
              {type.steps.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    className={`w-full flex items-start gap-3 text-left p-3 rounded-xl border text-sm transition-all ${
                      checked[i]
                        ? "border-aqua-300 dark:border-aqua-700 bg-aqua-50 dark:bg-aqua-950/40 text-gray-500 dark:text-slate-400 line-through"
                        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:border-aqua-300 dark:hover:border-aqua-700"
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        checked[i] ? "bg-aqua-500 border-aqua-500" : "border-gray-300 dark:border-slate-600"
                      }`}
                    >
                      {checked[i] && <Check className="w-3 h-3 text-white" />}
                    </span>
                    {s}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
              {type.notes[commitment]}
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Equipment</h4>
              <div className="flex flex-wrap gap-2">
                {type.equipment.map((e) =>
                  e.href ? (
                    <Link
                      key={e.label}
                      href={e.href}
                      className="px-3 py-1.5 rounded-lg bg-aqua-50 dark:bg-aqua-950/50 text-aqua-700 dark:text-aqua-300 text-sm hover:bg-aqua-100 dark:hover:bg-aqua-950 transition-colors"
                    >
                      {e.label}
                    </Link>
                  ) : (
                    <span key={e.label} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-sm">
                      {e.label}
                    </span>
                  )
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Plants</h4>
              <div className="flex flex-wrap gap-2">
                {type.plants.map((p) =>
                  p.href ? (
                    <Link
                      key={p.label}
                      href={p.href}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-sm hover:bg-emerald-100 dark:hover:bg-emerald-950 transition-colors"
                    >
                      {p.label}
                    </Link>
                  ) : (
                    <span key={p.label} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-sm">
                      {p.label}
                    </span>
                  )
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">
                {type.corals ? "Corals" : "Fish"}
              </h4>
              <div className="flex flex-wrap gap-2">
                {(type.corals ?? type.fish).map((f) =>
                  f.href ? (
                    <Link
                      key={f.label}
                      href={f.href}
                      className="px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 text-sm hover:bg-sky-100 dark:hover:bg-sky-950 transition-colors"
                    >
                      {f.label}
                    </Link>
                  ) : (
                    <span key={f.label} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-sm">
                      {f.label}
                    </span>
                  )
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/tools/aquarium-volume"
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm hover:border-aqua-300 dark:hover:border-aqua-700 transition-colors"
              >
                Volume calculator
              </Link>
              <Link
                href="/tools/water-change"
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm hover:border-aqua-300 dark:hover:border-aqua-700 transition-colors"
              >
                Water change planner
              </Link>
              <Link
                href="/tools/stocking"
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm hover:border-aqua-300 dark:hover:border-aqua-700 transition-colors"
              >
                Stocking calculator
              </Link>
              {type.id === "reef" && (
                <Link
                  href="/tools/salt-mixing"
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm hover:border-aqua-300 dark:hover:border-aqua-700 transition-colors"
                >
                  Salt mixing calculator
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
