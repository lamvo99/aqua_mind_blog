export interface NavItem {
  href: string
  label: string
  description?: string
}

export const mainNav: NavItem[] = [
  { href: "/start-here", label: "Start Here", description: "The beginner's path to a thriving aquarium" },
  { href: "/posts", label: "Articles" },
  { href: "/tools", label: "Tools" },
  { href: "/database", label: "Database" },
  { href: "/problems", label: "Problems" },
  { href: "/inspiration", label: "Inspiration" },
  { href: "/about", label: "About" },
]

export const databaseNav: NavItem[] = [
  { href: "/species", label: "Fish", description: "Species profiles with care parameters" },
  { href: "/plants", label: "Plants", description: "Aquatic plant database" },
  { href: "/corals", label: "Corals", description: "Reef coral database" },
  { href: "/equipment", label: "Equipment", description: "Filters, lights, pumps & more" },
]

export const toolsNav: NavItem[] = [
  { href: "/setup-planner", label: "Setup Planner", description: "Personalized first-tank plan in minutes" },
  { href: "/tools/aquarium-volume", label: "Aquarium Volume", description: "Calculate tank water volume" },
  { href: "/tools/water-change", label: "Water Change", description: "Plan water changes & parameter impact" },
  { href: "/tools/co2", label: "CO₂ Estimator", description: "Estimate dissolved CO₂ from KH/pH" },
  { href: "/tools/dosing", label: "Dosing", description: "Measure liquid fertilizers & medications" },
  { href: "/tools/pump-flow", label: "Pump & Filter Flow", description: "Pick the right flow rate for your tank" },
  { href: "/tools/salt-mixing", label: "Salt Mixing", description: "Batch marine salt for reef water changes" },
  { href: "/tools/lighting", label: "Lighting", description: "Estimate LED watts for planted tanks" },
  { href: "/tools/stocking", label: "Fish Stocking", description: "Check capacity with the 1″/gallon rule" },
  { href: "/tools/compatibility-checker", label: "Compatibility Checker", description: "Check species compatibility & stocking together" },
]

export const problemCategories: string[] = [
  "water",
  "algae",
  "plants",
  "fish",
  "equipment",
]
