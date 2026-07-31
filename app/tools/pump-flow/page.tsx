import type { Metadata } from "next"
import CalculatorLayout from "@/app/components/tools/CalculatorLayout"
import PumpFlowCalculator from "@/app/components/tools/PumpFlowCalculator"

export const metadata: Metadata = {
  title: "Pump & Filter Flow Calculator — AquaMind",
  description: "Find the right flow rate (L/h or gph) for your aquarium filter or circulation pump based on tank volume and turnover rate.",
  alternates: { canonical: "https://aquamind.life/tools/pump-flow" },
}

export default function PumpFlowPage() {
  return (
    <CalculatorLayout
      title="Pump & Filter Flow Calculator"
      description="Choose a filter or pump flow rate by deciding how many times per hour the full tank volume should turn over. Rule of thumb: 3–5×/h for community freshwater tanks, 3–10×/h for planted tanks, and 8–10×/h for reef tanks."
      disclaimer="Rated flow on the box is measured without media and with no pipe run. Reduce it by 20–40% for real-world conditions. Bettas and other slow-water fish prefer gentle flow — use a spray bar or diffuser."
      related={[
        { href: "/tools/aquarium-volume", label: "Aquarium Volume Calculator" },
        { href: "/tools/co2", label: "CO₂ Estimator" },
      ]}
    >
      <PumpFlowCalculator />
    </CalculatorLayout>
  )
}
