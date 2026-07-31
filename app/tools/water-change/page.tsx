import type { Metadata } from "next"
import CalculatorLayout from "@/app/components/tools/CalculatorLayout"
import WaterChangeCalculator from "@/app/components/tools/WaterChangeCalculator"

export const metadata: Metadata = {
  title: "Water Change Calculator — AquaMind",
  description: "Plan aquarium water changes: calculate the volume to replace and estimate the impact on water parameters like nitrate.",
  alternates: { canonical: "https://aquamind.life/tools/water-change" },
}

export default function WaterChangePage() {
  return (
    <CalculatorLayout
      title="Water Change Calculator"
      description="Work out exactly how much water to replace and see the estimated effect on your water parameters."
      disclaimer="Parameter estimates are calculated from a simple dilution model. They do not replace real test kits — always verify your water with a reliable test kit after a water change."
      related={[
        { href: "/tools/aquarium-volume", label: "Aquarium Volume Calculator" },
        { href: "/tools/co2", label: "CO₂ Estimator" },
      ]}
    >
      <WaterChangeCalculator />
    </CalculatorLayout>
  )
}
