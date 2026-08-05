export interface RelatedResource {
  href: string
  label: string
  section: "database" | "tool" | "learn"
}

const CATEGORY_RULES: { keywords: string[]; resources: RelatedResource[] }[] = [
  {
    keywords: ["fish", "stock", "community", "guppy", "tetra", "betta", "shrimp", "snail"],
    resources: [
      { href: "/species", label: "Species database", section: "database" },
      { href: "/tools/stocking", label: "Stocking calculator", section: "tool" },
    ],
  },
  {
    keywords: ["plant", "aquascap", "moss", "fertiliz", "dosing"],
    resources: [
      { href: "/plants", label: "Plant database", section: "database" },
      { href: "/tools/lighting", label: "Lighting calculator", section: "tool" },
      { href: "/tools/co2", label: "CO₂ calculator", section: "tool" },
    ],
  },
  {
    keywords: ["coral", "reef", "saltwater", "marine"],
    resources: [
      { href: "/corals", label: "Coral database", section: "database" },
      { href: "/tools/compatibility-checker", label: "Compatibility checker", section: "tool" },
      { href: "/tools/salt-mixing", label: "Salt mixing calculator", section: "tool" },
    ],
  },
  {
    keywords: ["water", "cycl", "ammonia", "nitrate", "nitrite", "chemistry", "param"],
    resources: [
      { href: "/tools/aquarium-volume", label: "Volume calculator", section: "tool" },
      { href: "/tools/water-change", label: "Water change calculator", section: "tool" },
      { href: "/learn", label: "Learn", section: "learn" },
    ],
  },
  {
    keywords: ["alga", "green", "diatom", "brown", "hair"],
    resources: [
      { href: "/problems/diagnose", label: "Problem diagnostic", section: "tool" },
      { href: "/problems", label: "Problem guides", section: "learn" },
    ],
  },
  {
    keywords: ["beginner", "setup", "first", "starter", "cycling", "new tank"],
    resources: [
      { href: "/setup-planner", label: "Setup planner", section: "tool" },
      { href: "/tools/aquarium-calculator", label: "Aquarium calculator", section: "tool" },
      { href: "/learn", label: "Learn", section: "learn" },
    ],
  },
  {
    keywords: ["equipment", "filter", "pump", "heater", "lighting", "led"],
    resources: [
      { href: "/equipment", label: "Equipment database", section: "database" },
      { href: "/tools/pump-flow", label: "Filter flow calculator", section: "tool" },
      { href: "/tools/lighting", label: "Lighting calculator", section: "tool" },
    ],
  },
  {
    keywords: ["disease", "health", "sick", "disease", "quarantine"],
    resources: [
      { href: "/problems/diagnose", label: "Problem diagnostic", section: "tool" },
      { href: "/problems", label: "Problem guides", section: "learn" },
    ],
  },
]

const DEFAULT_RESOURCES: RelatedResource[] = [
  { href: "/posts", label: "All articles", section: "learn" },
  { href: "/learn", label: "Learn", section: "learn" },
  { href: "/tools", label: "All tools", section: "tool" },
]

export function resourcesForCategory(slug: string, title: string): RelatedResource[] {
  const haystack = `${slug} ${title}`.toLowerCase()
  const matched = CATEGORY_RULES.find((rule) => rule.keywords.some((k) => haystack.includes(k)))
  if (!matched) return DEFAULT_RESOURCES
  const seen = new Set<string>()
  return [...matched.resources, ...DEFAULT_RESOURCES]
    .filter((r) => (seen.has(r.href) ? false : (seen.add(r.href), true)))
    .slice(0, 4)
}

export const TOOL_LEARN_LINKS: Record<string, { href: string; label: string }[]> = {
  "/tools/aquarium-calculator": [
    { href: "/learn", label: "Getting started guide" },
    { href: "/posts", label: "Setup articles" },
  ],
  "/tools/aquarium-volume": [{ href: "/learn", label: "Tank setup basics" }],
  "/tools/stocking": [
    { href: "/species", label: "Species database" },
    { href: "/posts", label: "Stocking articles" },
  ],
  "/tools/water-change": [{ href: "/learn", label: "Water quality guide" }],
  "/tools/co2": [
    { href: "/plants", label: "Plant database" },
    { href: "/learn", label: "Plant care guide" },
  ],
  "/tools/lighting": [
    { href: "/plants", label: "Plant database" },
    { href: "/learn", label: "Plant care guide" },
  ],
  "/tools/pump-flow": [{ href: "/equipment", label: "Equipment database" }],
  "/tools/salt-mixing": [{ href: "/corals", label: "Coral database" }],
  "/tools/dosing": [{ href: "/plants", label: "Plant database" }],
  "/tools/compatibility-checker": [
    { href: "/species", label: "Species database" },
    { href: "/corals", label: "Coral database" },
  ],
  "/tools/diagnostic": [
    { href: "/problems", label: "Problem guides" },
    { href: "/learn", label: "Learn" },
  ],
}
