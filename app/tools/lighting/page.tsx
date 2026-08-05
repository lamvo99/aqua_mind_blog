import type { Metadata } from "next"
import CalculatorLayout from "@/app/components/tools/CalculatorLayout"
import LightingCalculator from "@/app/components/tools/LightingCalculator"
import { TOOL_LEARN_LINKS } from "@/lib/related"

export const metadata: Metadata = {
  title: "Aquarium Lighting Calculator — AquaMind",
  description: "Estimate the LED wattage and lumens your planted aquarium needs for low, medium or high light setups.",
  alternates: { canonical: "https://aquamind.life/tools/lighting" },
}

export default function LightingPage() {
  return (
    <CalculatorLayout
      title="Aquarium Lighting Calculator"
      description="Estimate how much light your tank needs. Common planted-tank benchmarks are roughly 20 lumens per liter for low light, 35 lm/L for medium light, and 50 lm/L for high light. Modern LED fixtures deliver about 90 lumens per watt."
      disclaimer="Lumens and wattage are rough proxies — PAR (photosynthetically active radiation) is what plants actually use, and it varies with fixture type, spread and depth. Use this as a starting point and adjust based on plant growth and algae."
      related={[
        { href: "/tools/co2", label: "CO₂ Estimator" },
        { href: "/tools/aquarium-volume", label: "Aquarium Volume Calculator" },
      ]}
      learn={TOOL_LEARN_LINKS["/tools/lighting"]}
      howTo={{
        url: "/tools/lighting",
        steps: [
          { name: "Measure your tank", text: "Measure the tank's length and width, or enter the total volume in liters." },
          { name: "Pick a light level", text: "Choose low, medium or high light depending on your plants: about 20, 35 or 50 lumens per liter." },
          { name: "Calculate", text: "The calculator converts the target lumens into an estimated LED wattage." },
          { name: "Verify with growth", text: "Start slightly lower and adjust based on plant growth and algae — PAR matters more than wattage." },
        ],
      }}
    >
      <LightingCalculator />
    </CalculatorLayout>
  )
}
