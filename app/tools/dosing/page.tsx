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
      howTo={{
        url: "/tools/dosing",
        steps: [
          { name: "Find the label rate", text: "Check the product label for the dose rate, e.g. 5 ml per 100 liters." },
          { name: "Enter your water volume", text: "Enter your actual water volume in liters (after substrate and hardscape displacement)." },
          { name: "Calculate", text: "The calculator multiplies the label rate by your volume and returns the exact dose." },
          { name: "Dose and observe", text: "Add the dose slowly, and for medications follow the treatment schedule on the label." },
        ],
      }}
    >
      <DosingCalculator />
    </CalculatorLayout>
  )
}
