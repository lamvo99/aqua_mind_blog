export interface NavItem {
  href: string
  label: string
  description?: string
}

export const mainNav: NavItem[] = [
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
  { href: "/tools/aquarium-volume", label: "Aquarium Volume", description: "Calculate tank water volume" },
  { href: "/tools/water-change", label: "Water Change", description: "Plan water changes & parameter impact" },
  { href: "/tools/co2", label: "CO₂ Estimator", description: "Estimate dissolved CO₂ from KH/pH" },
]

export const problemCategories: string[] = [
  "water",
  "algae",
  "plants",
  "fish",
  "equipment",
]
