import { client } from "./sanity"

export type SearchType = "all" | "article" | "fish" | "plant" | "coral" | "equipment" | "tool"

export const searchTypes: { value: SearchType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "article", label: "Articles" },
  { value: "fish", label: "Fish" },
  { value: "plant", label: "Plants" },
  { value: "coral", label: "Corals" },
  { value: "equipment", label: "Equipment" },
  { value: "tool", label: "Tools" },
]

export interface SearchItem {
  _id: string
  _type: string
  title: string
  slug: { current: string }
  excerpt?: string
  mainImage?: any
}

const TYPE_TO_SCHEMA: Record<Exclude<SearchType, "all">, string> = {
  article: "post",
  fish: "species",
  plant: "plant",
  coral: "coral",
  equipment: "equipment",
  tool: "tool",
}

function buildQuery(type: SearchType, q: string): string {
  const base = (schemaType: string, extraProjection = "") => `
    *[_type == "${schemaType}" && (title match $q + "*" || excerpt match $q + "*")] | order(publishedAt desc) [0...10] {
      _id, _type, title, slug, excerpt, mainImage ${extraProjection}
    }`

  switch (type) {
    case "article":
      return base("post")
    case "all": {
      return `[
        ...*[_type == "post" && (title match $q + "*" || excerpt match $q + "*")] | order(publishedAt desc) [0...8] {
          _id, _type, title, slug, excerpt, mainImage
        },
        ...*[_type in ["species", "plant", "coral", "equipment", "tool"] && title match $q + "*"] [0...4] {
          _id, _type, title, slug, excerpt, mainImage
        }
      ]`
    }
    default:
      return base(TYPE_TO_SCHEMA[type])
  }
}

export async function searchContent(q: string, type: SearchType): Promise<SearchItem[]> {
  if (!q.trim()) return []
  try {
    const data = await client.fetch(buildQuery(type, q), { q: q.trim() })
    return data || []
  } catch {
    return []
  }
}

export const typeLabels: Record<string, string> = {
  post: "Article",
  species: "Fish",
  plant: "Plant",
  coral: "Coral",
  equipment: "Equipment",
  tool: "Tool",
}
