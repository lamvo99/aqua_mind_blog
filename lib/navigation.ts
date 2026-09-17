export interface NavItem {
  href: string
  label: string
  description?: string
}

export const mainNav: NavItem[] = [
  { href: "/start-here", label: "Start Here", description: "The beginner's path to a thriving aquarium" },
  { href: "/posts", label: "Articles" },
  { href: "/learn", label: "Learn Paths" },
  { href: "/tools", label: "Tools" },
  { href: "/database", label: "Database" },
  { href: "/problems", label: "Problems" },
  { href: "/inspiration", label: "Inspiration" },
  { href: "/finder", label: "Finder", description: "Find the right fish, plants & corals for your tank" },
  { href: "/about", label: "About" },
]

export const databaseNav: NavItem[] = [
  { href: "/wiki", label: "Wiki", description: "Search fish, invertebrates, plants, corals & equipment at once" },
  { href: "/species", label: "Fish", description: "151 species profiles with care parameters" },
  { href: "/invertebrates", label: "Invertebrates", description: "50 shrimp, snails, crabs & reef inverts" },
  { href: "/plants", label: "Plants", description: "64 aquatic plants by growth form & light" },
  { href: "/corals", label: "Corals", description: "49 reef corals — soft, LPS, SPS & NPS" },
  { href: "/equipment", label: "Equipment", description: "47 filters, lights, pumps & more" },
  { href: "/problems", label: "Problems", description: "33 common issues with diagnosis & solutions" },
  { href: "/inspiration", label: "Inspiration", description: "10 aquascaping styles & difficulty levels" },
  { href: "/finder", label: "Finder", description: "Find the right fish, plants & corals for your tank" },
]

export const databaseCategories = [
  { href: "/species", label: "Fish", count: 151, icon: "fish", description: "Freshwater & marine species with care parameters" },
  { href: "/invertebrates", label: "Invertebrates", count: 50, icon: "invertebrate", description: "Shrimp, snails, crabs & reef invertebrates" },
  { href: "/plants", label: "Plants", count: 64, icon: "plant", description: "Aquatic plants by growth form & light requirements" },
  { href: "/corals", label: "Corals", count: 49, icon: "coral", description: "Soft, LPS, SPS & non-photosynthetic corals" },
  { href: "/equipment", label: "Equipment", count: 47, icon: "equipment", description: "Filters, heaters, lights, pumps & accessories" },
  { href: "/problems", label: "Problems", count: 33, icon: "problem", description: "Common aquarium issues with diagnosis & solutions" },
]

export const toolsNav: NavItem[] = [
  { href: "/setup-planner", label: "Setup Planner", description: "Personalized first-tank plan in minutes" },
  { href: "/tools/aquarium-calculator", label: "Aquarium Calculator", description: "Volume, substrate, stocking, water, CO₂ & light on one screen" },
  { href: "/tools/aquarium-volume", label: "Aquarium Volume", description: "Calculate tank water volume" },
  { href: "/tools/water-change", label: "Water Change", description: "Plan water changes & parameter impact" },
  { href: "/tools/co2", label: "CO₂ Estimator", description: "Estimate dissolved CO₂ from KH/pH" },
  { href: "/tools/dosing", label: "Dosing", description: "Measure liquid fertilizers & medications" },
  { href: "/tools/pump-flow", label: "Pump & Filter Flow", description: "Pick the right flow rate for your tank" },
  { href: "/tools/salt-mixing", label: "Salt Mixing", description: "Batch marine salt for reef water changes" },
  { href: "/tools/lighting", label: "Lighting", description: "Estimate LED watts for planted tanks" },
  { href: "/tools/stocking", label: "Fish Stocking", description: "Check capacity with the 1″/gallon rule" },
  { href: "/tools/compatibility-checker", label: "Compatibility Checker", description: "Check species compatibility & stocking together" },
  { href: "/tools/diagnostic", label: "Problem Diagnostic", description: "Pick symptoms and get ranked likely causes" },
]

export const problemCategories: string[] = [
  "water",
  "algae",
  "plants",
  "fish",
  "equipment",
]
