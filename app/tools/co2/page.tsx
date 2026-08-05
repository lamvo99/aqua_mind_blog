import type { Metadata } from "next"
import CalculatorLayout from "@/app/components/tools/CalculatorLayout"
import Co2Calculator from "@/app/components/tools/Co2Calculator"
import { TOOL_LEARN_LINKS } from "@/lib/related"

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
      learn={TOOL_LEARN_LINKS["/tools/co2"]}
      howTo={{
        url: "/tools/co2",
        steps: [
          { name: "Measure KH", text: "Use a KH test kit to measure carbonate hardness of your tank water in degrees (dKH)." },
          { name: "Measure pH", text: "Measure pH with a reliable test kit, ideally at the same time of day as the KH reading." },
          { name: "Enter both values", text: "Input the KH and pH readings into the calculator." },
          { name: "Read dissolved CO₂", text: "Compare the estimate to the 15–30 ppm target for healthy planted tanks and adjust injection." },
        ],
      }}
    >
      <Co2Calculator />
    </CalculatorLayout>
  )
}
