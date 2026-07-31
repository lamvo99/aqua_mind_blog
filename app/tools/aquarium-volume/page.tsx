import type { Metadata } from "next"
import CalculatorLayout from "@/app/components/tools/CalculatorLayout"
import AquariumVolumeCalculator from "@/app/components/tools/AquariumVolumeCalculator"

export const metadata: Metadata = {
  title: "Aquarium Volume Calculator — AquaMind",
  description: "Calculate the water volume of your rectangular, cube or cylinder aquarium in liters and US gallons, with substrate displacement.",
  alternates: { canonical: "https://aquamind.life/tools/aquarium-volume" },
}

export default function AquariumVolumePage() {
  return (
    <CalculatorLayout
      title="Aquarium Volume Calculator"
      description="Enter your tank dimensions to get the gross volume and estimated actual water volume, accounting for substrate and hardscape displacement."
      disclaimer="Volume is an estimate. Actual water volume depends on substrate depth, hardscape, equipment and water level. Always fill the tank gradually and verify with a bucket or water meter."
      related={[
        { href: "/tools/water-change", label: "Water Change Calculator" },
        { href: "/tools/co2", label: "CO₂ Estimator" },
      ]}
    >
      <AquariumVolumeCalculator />
    </CalculatorLayout>
  )
}
