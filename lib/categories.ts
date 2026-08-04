export interface CategoryGroup {
  id: string
  label: string
  description: string
  slugs: string[]
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "freshwater",
    label: "Freshwater & Plants",
    description: "Freshwater fish, aquatic plants, shrimp and planted-tank guides.",
    slugs: ["freshwater", "freshwater-fish", "aquatic-plants", "shrimp", "native-vietnamese-fish"],
  },
  {
    id: "saltwater",
    label: "Saltwater & Reef",
    description: "Marine fish, corals, invertebrates and reef-keeping guides.",
    slugs: ["saltwater-and-reef", "corals-and-reef", "marine-fish-and-invertebrates"],
  },
  {
    id: "aquascaping",
    label: "Aquascaping & DIY",
    description: "Layouts, styles, DIY builds, terrariums and paludariums.",
    slugs: ["aquascaping", "aquascape-styles", "world-aquascaping", "diy-and-projects", "diy-aquarium", "terrarium-and-paludarium", "nature-ecosystems"],
  },
  {
    id: "care",
    label: "Care & Health",
    description: "Maintenance, water chemistry, diseases, pests and troubleshooting.",
    slugs: ["aquarium-care", "aquarium-chemicals", "diseases-and-treatment", "maintenance", "pest-and-problems", "science-and-research"],
  },
  {
    id: "equipment",
    label: "Equipment & Reviews",
    description: "Filters, lighting, CO2 systems and honest product reviews.",
    slugs: ["aquarium-equipment", "equipment", "equipment-reviews", "reviews"],
  },
  {
    id: "guides",
    label: "Beginner & Guides",
    description: "Step-by-step guides, species profiles and learning resources.",
    slugs: ["beginner-guides", "species-guides", "learning-center", "tips-and-tricks", "advanced-aquarium"],
  },
  {
    id: "lifestyle",
    label: "Community & Lifestyle",
    description: "Aquarium stories, community, photography and culture.",
    slugs: ["community", "aquarium-lifestyle", "marketplace-and-community", "history-and-culture", "photography-and-video", "outdoor-ponds-and-fishing", "semi-aquatic-reptiles", "unique-creatures"],
  },
]

export function groupForCategory(slug: string): CategoryGroup | undefined {
  return CATEGORY_GROUPS.find((g) => g.slugs.includes(slug))
}

export function groupById(id: string): CategoryGroup | undefined {
  return CATEGORY_GROUPS.find((g) => g.id === id)
}

export function postMatchesGroup(post: any, groupId: string): boolean {
  const group = groupById(groupId)
  if (!group) return false
  return (post.categories || []).some((c: any) => group.slugs.includes(c.slug?.current))
}

export function postMatchesCategory(post: any, slug: string): boolean {
  return (post.categories || []).some((c: any) => c.slug?.current === slug)
}
