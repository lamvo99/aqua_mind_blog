import type { Metadata } from "next"
import CalculatorLayout from "@/app/components/tools/CalculatorLayout"
import PumpFlowCalculator from "@/app/components/tools/PumpFlowCalculator"
import { TOOL_LEARN_LINKS } from "@/lib/related"

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
      learn={TOOL_LEARN_LINKS["/tools/pump-flow"]}
      howTo={{
        url: "/tools/pump-flow",
        steps: [
          { name: "Enter your tank volume", text: "Enter the water volume of your aquarium in liters." },
          { name: "Choose the turnover rate", text: "Pick a target: 3–5× per hour for community tanks, 3–10× for planted, 8–10× for reef." },
          { name: "Calculate the flow", text: "The calculator returns the required flow rate in L/h and gph." },
          { name: "Size up for real conditions", text: "Add 20–40% to the result to account for filter media and pipe resistance, then pick a pump." },
        ],
      }}
    >
      <PumpFlowCalculator />
    </CalculatorLayout>
  )
}
