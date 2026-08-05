import type { Metadata } from "next"
import CalculatorLayout from "@/app/components/tools/CalculatorLayout"
import AquariumPlanner from "@/app/components/tools/AquariumPlanner"
import { TOOL_LEARN_LINKS } from "@/lib/related"

export const metadata: Metadata = {
  title: "Aquarium Calculator — All-in-One Tank Planner — AquaMind",
  description: "Calculate your aquarium in one screen: tank volume from dimensions, substrate liters and bags, stocking capacity, water changes, CO₂, lighting and filter flow.",
  alternates: { canonical: "https://aquamind.life/tools/aquarium-calculator" },
}

export default function AquariumCalculatorPage() {
  return (
    <CalculatorLayout
      title="Aquarium Calculator"
      description="One screen that computes everything for your tank: volume from dimensions, substrate liters and bags, stocking capacity, water change impact, dissolved CO₂, lighting needs and filter flow."
      related={[
        { href: "/tools/aquarium-volume", label: "Volume" },
        { href: "/tools/stocking", label: "Stocking" },
        { href: "/tools/water-change", label: "Water change" },
        { href: "/tools/co2", label: "CO₂" },
        { href: "/tools/lighting", label: "Lighting" },
        { href: "/tools/pump-flow", label: "Filter flow" },
        { href: "/tools/compatibility-checker", label: "Compatibility" },
        { href: "/tools/diagnostic", label: "Problem Diagnostic" },
      ]}
      learn={TOOL_LEARN_LINKS["/tools/aquarium-calculator"]}
    >
      <AquariumPlanner />
    </CalculatorLayout>
  )
}
