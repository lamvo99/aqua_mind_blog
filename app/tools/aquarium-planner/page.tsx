import type { Metadata } from "next"
import CalculatorLayout from "@/app/components/tools/CalculatorLayout"
import AquariumPlanner from "@/app/components/tools/AquariumPlanner"

export const metadata: Metadata = {
  title: "Aquarium Planner — All-in-One Calculator — AquaMind",
  description: "Plan an entire aquarium on one screen: volume from dimensions, stocking capacity, water changes, CO₂, lighting and filter flow.",
  alternates: { canonical: "https://aquamind.life/tools/aquarium-planner" },
}

export default function AquariumPlannerPage() {
  return (
    <CalculatorLayout
      title="Aquarium Planner"
      description="One screen that computes everything for your tank: volume from dimensions, stocking capacity, water change impact, dissolved CO₂, lighting needs and filter flow."
      related={[
        { href: "/tools/aquarium-volume", label: "Volume" },
        { href: "/tools/stocking", label: "Stocking" },
        { href: "/tools/water-change", label: "Water change" },
        { href: "/tools/co2", label: "CO₂" },
        { href: "/tools/lighting", label: "Lighting" },
        { href: "/tools/pump-flow", label: "Filter flow" },
      ]}
    >
      <AquariumPlanner />
    </CalculatorLayout>
  )
}
