import type { Metadata } from "next"
import CalculatorLayout from "@/app/components/tools/CalculatorLayout"
import ReefDosingCalculator from "@/app/components/tools/ReefDosingCalculator"
import { TOOL_LEARN_LINKS } from "@/lib/related"

export const metadata: Metadata = {
  title: "Reef Dosing Calculator",
  description:
    "Calculate reef supplement doses for calcium, alkalinity, magnesium, all-in-one and balanced systems with verified manufacturer data, custom-product support and safety limits.",
  alternates: { canonical: "https://www.aquamind.life/tools/reef-dosing" },
  openGraph: {
    title: "Reef Dosing Calculator",
    description:
      "Calculate reef supplement doses for calcium, alkalinity, magnesium, all-in-one and balanced systems with verified manufacturer data, custom-product support and safety limits.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reef Dosing Calculator",
    description:
      "Calculate reef supplement doses for calcium, alkalinity, magnesium, all-in-one and balanced systems with verified manufacturer data, custom-product support and safety limits.",
  },
}

export default function ReefDosingPage() {
  return (
    <CalculatorLayout
      title="Reef Dosing Calculator"
      description="Work out how much reef supplement to add from your actual water volume and measured Ca/KH/Mg. Choose a brand product with verified manufacturer data, or enter your own label values for a generic product."
      disclaimer="This tool uses manufacturer starting doses and label correction rates, not a model of your tank's consumption. Always confirm the product label, use a calibrated test kit, raise parameters slowly and never mix calcium and alkalinity supplements directly. Large corrections should be split over several days; when in doubt, dose less and re-test."
      related={[
        { href: "/tools/dosing", label: "Generic Dosing Calculator" },
        { href: "/tools/salt-mixing", label: "Salt Mixing Calculator" },
        { href: "/tools/aquarium-volume", label: "Aquarium Volume Calculator" },
        { href: "/tools/water-change", label: "Water Change Calculator" },
      ]}
      learn={TOOL_LEARN_LINKS["/tools/reef-dosing"]}
      howTo={{
        url: "/tools/reef-dosing",
        steps: [
          {
            name: "Choose your product",
            text: "Select a brand product with verified manufacturer data, or choose Custom / generic to enter the values printed on your own product label.",
          },
          {
            name: "Enter actual water volume",
            text: "Use net water volume after rock, sand and equipment displacement. Tank type and feeding are context only; they do not change the manufacturer dose.",
          },
          {
            name: "Add measured values",
            text: "For correction products, enter current and target calcium, alkalinity or magnesium from a calibrated test kit. Optionally enter days since the last test to estimate maintenance consumption.",
          },
          {
            name: "Follow the split dose",
            text: "The calculator splits large corrections across days to respect conservative daily-change caps and the product label maximum. Re-test before increasing the dose.",
          },
        ],
      }}
    >
      <ReefDosingCalculator />
    </CalculatorLayout>
  )
}
