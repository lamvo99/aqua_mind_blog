import type { Metadata } from "next"
import CalculatorLayout from "@/app/components/tools/CalculatorLayout"
import StockingCalculator from "@/app/components/tools/StockingCalculator"

export const metadata: Metadata = {
  title: "Fish Stocking Calculator — AquaMind",
  description: "Estimate how many fish your aquarium can hold using the classic inches-per-gallon rule and check your current stocking level.",
  alternates: { canonical: "https://aquamind.life/tools/stocking" },
}

export default function StockingPage() {
  return (
    <CalculatorLayout
      title="Fish Stocking Calculator"
      description="The classic rule of thumb allows about 1 inch (2.5 cm) of adult fish per US gallon of water. Use this tool to get a rough capacity for your tank and compare it against the fish you plan to keep."
      disclaimer="The inches-per-gallon rule ignores swimming space, surface area, bioload and filtration. Long-bodied and territorial fish need far more room. Always research each species' minimum tank size — check our species database for verified care parameters."
      related={[
        { href: "/tools/compatibility-checker", label: "Compatibility Checker" },
        { href: "/tools/aquarium-volume", label: "Aquarium Volume Calculator" },
        { href: "/tools/pump-flow", label: "Pump & Filter Flow Calculator" },
        { href: "/species", label: "Fish Species Database" },
      ]}
      howTo={{
        url: "/tools/stocking",
        steps: [
          { name: "Enter tank volume", text: "Enter your tank's water volume in liters." },
          { name: "Choose a stocking level", text: "Pick light (0.5″/gal), standard (1″/gal) or heavy (1.5″/gal) stocking." },
          { name: "Enter your fish", text: "Add the fish count and adult size in cm for each species you plan to keep." },
          { name: "Check the result", text: "Compare total adult length against capacity and note the utilization percentage." },
        ],
      }}
    >
      <StockingCalculator />
    </CalculatorLayout>
  )
}
