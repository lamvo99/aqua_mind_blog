import type { Metadata } from "next"
import CalculatorLayout from "@/app/components/tools/CalculatorLayout"
import SaltMixingCalculator from "@/app/components/tools/SaltMixingCalculator"

export const metadata: Metadata = {
  title: "Salt Mixing Calculator — AquaMind",
  description: "Estimate how much marine salt mix (grams or kg) you need for your reef or saltwater aquarium water changes.",
  alternates: { canonical: "https://aquamind.life/tools/salt-mixing" },
}

export default function SaltMixingPage() {
  return (
    <CalculatorLayout
      title="Salt Mixing Calculator"
      description="Plan your water change batches. Based on the widely used figure of about 35 g of salt mix per liter to reach a specific gravity of 1.023 (at 25°C), scaled linearly for your target salinity."
      disclaimer="Salt mixes differ between brands and batches. Always dissolve the salt fully in RO/DI or fresh water, aerate overnight, and verify salinity with a calibrated refractometer or hydrometer before adding to the tank. Never add dry salt directly to an aquarium."
      related={[
        { href: "/tools/aquarium-volume", label: "Aquarium Volume Calculator" },
        { href: "/tools/pump-flow", label: "Pump & Filter Flow Calculator" },
      ]}
    >
      <SaltMixingCalculator />
    </CalculatorLayout>
  )
}
