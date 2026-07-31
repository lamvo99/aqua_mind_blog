import { MetadataRoute } from "next"
import { client } from "@/lib/sanity"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aquamind.life"

export const revalidate = 3600

const LIST_PATHS = [
  { path: "/posts", priority: 0.9, frequency: "daily" },
  { path: "/database", priority: 0.8, frequency: "weekly" },
  { path: "/start-here", priority: 0.8, frequency: "monthly" },
  { path: "/species", priority: 0.6, frequency: "weekly" },
  { path: "/plants", priority: 0.6, frequency: "weekly" },
  { path: "/corals", priority: 0.6, frequency: "weekly" },
  { path: "/equipment", priority: 0.6, frequency: "weekly" },
  { path: "/problems", priority: 0.6, frequency: "weekly" },
  { path: "/inspiration", priority: 0.6, frequency: "weekly" },
  { path: "/tools", priority: 0.7, frequency: "monthly" },
  { path: "/tools/aquarium-volume", priority: 0.6, frequency: "monthly" },
  { path: "/tools/water-change", priority: 0.6, frequency: "monthly" },
  { path: "/tools/co2", priority: 0.6, frequency: "monthly" },
  { path: "/tools/dosing", priority: 0.6, frequency: "monthly" },
  { path: "/tools/pump-flow", priority: 0.6, frequency: "monthly" },
  { path: "/tools/salt-mixing", priority: 0.6, frequency: "monthly" },
  { path: "/tools/lighting", priority: 0.6, frequency: "monthly" },
  { path: "/tools/stocking", priority: 0.6, frequency: "monthly" },
  { path: "/setup-planner", priority: 0.7, frequency: "monthly" },
  { path: "/about", priority: 0.5, frequency: "monthly" },
  { path: "/contact", priority: 0.5, frequency: "monthly" },
  { path: "/privacy-policy", priority: 0.2, frequency: "yearly" },
  { path: "/terms-of-service", priority: 0.2, frequency: "yearly" },
  { path: "/cookie-policy", priority: 0.2, frequency: "yearly" },
] as const

const TYPE_SEGMENTS: Record<string, string> = {
  post: "posts",
  species: "species",
  plant: "plants",
  coral: "corals",
  equipment: "equipment",
  problem: "problems",
  inspiration: "inspiration",
}

const TYPE_PRIORITY: Record<string, number> = {
  post: 0.8,
  species: 0.7,
  plant: 0.7,
  coral: 0.7,
  equipment: 0.7,
  problem: 0.6,
  inspiration: 0.6,
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...LIST_PATHS.map((p) => ({
      url: `${siteUrl}${p.path}`,
      lastModified: new Date(),
      changeFrequency: p.frequency,
      priority: p.priority,
    })),
  ]

  const docs: any[] = await client.fetch(
    `*[_type in $types && defined(slug)] {
      _type, "slug": slug.current, publishedAt, updatedAt
    }`,
    { types: Object.keys(TYPE_SEGMENTS) }
  )

  for (const doc of docs) {
    const segment = TYPE_SEGMENTS[doc._type]
    if (!segment || !doc.slug) continue
    entries.push({
      url: `${siteUrl}/${segment}/${doc.slug}`,
      lastModified: doc.updatedAt || doc.publishedAt || new Date(),
      changeFrequency: doc._type === "post" ? ("weekly" as const) : ("monthly" as const),
      priority: TYPE_PRIORITY[doc._type],
    })
  }

  return entries
}
