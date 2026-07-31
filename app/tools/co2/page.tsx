import type { Metadata } from "next"
import CalculatorLayout from "@/app/components/tools/CalculatorLayout"
import Co2Calculator from "@/app/components/tools/Co2Calculator"

export const metadata: Metadata = {
  title: "CO₂ Estimator — AquaMind",
  description: "Estimate dissolved CO₂ in your planted aquarium from KH and pH readings. Understand CO₂ levels for healthy plant growth.",
  alternates: { canonical: "https://aquamind.life/tools/co2" },
}

export default function Co2Page() {
  return (
    <CalculatorLayout
      title="CO₂ Estimator"
      description="Estimate dissolved CO₂ concentration from your KH and pH readings using the KH/pH correlation table."
      disclaimer="This is an estimate based on the KH/pH relationship. Actual dissolved CO₂ can differ due to organic acids, buffers and measurement precision. Bubble counters are calibration tools, not absolute measurements — always confirm with a drop checker."
      related={[
        { href: "/tools/water-change", label: "Water Change Calculator" },
        { href: "/tools/aquarium-volume", label: "Aquarium Volume Calculator" },
      ]}
    >
      <Co2Calculator />
    </CalculatorLayout>
  )
}
