import type { Metadata } from "next"
import CalculatorLayout from "@/app/components/tools/CalculatorLayout"
import DosingCalculator from "@/app/components/tools/DosingCalculator"

export const metadata: Metadata = {
  title: "Dosing Calculator — AquaMind",
  description: "Calculate the exact volume of liquid fertilizer, medication or additive for your aquarium from the label dose rate.",
  alternates: { canonical: "https://aquamind.life/tools/dosing" },
}

export default function DosingPage() {
  return (
    <CalculatorLayout
      title="Dosing Calculator"
      description="Work out how much liquid additive to dose for your tank size. Multiply the label rate by your water volume — useful for fertilizers, medications, water conditioners and pH adjusters."
      disclaimer="Always double-check the product label and dose based on the actual water volume (after substrate and hardscape displacement). When treating illness, follow the medication instructions exactly — dosing errors can harm fish. When in doubt, dose slightly less."
      related={[
        { href: "/tools/aquarium-volume", label: "Aquarium Volume Calculator" },
        { href: "/tools/water-change", label: "Water Change Calculator" },
      ]}
    >
      <DosingCalculator />
    </CalculatorLayout>
  )
}
