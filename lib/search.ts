import { client } from "./sanity"

export type SearchType = "all" | "article" | "fish" | "plant" | "coral" | "equipment" | "invertebrate" | "tool"

export const searchTypes: { value: SearchType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "article", label: "Articles" },
  { value: "fish", label: "Fish" },
  { value: "invertebrate", label: "Invertebrates" },
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
  invertebrate: "invertebrate",
  plant: "plant",
  coral: "coral",
  equipment: "equipment",
  tool: "tool",
}

const DB_SCHEMA_TYPES = ["species", "invertebrate", "plant", "coral", "equipment", "tool"]

function buildQuery(type: SearchType): string {
  const dbProjection = `{
    _id, _type, "title": name, slug, excerpt, mainImage,
    name, scientificName, aliases, localNames
  }`

  switch (type) {
    case "article":
      return `
        *[_type == "post" && (title match $q + "*" || excerpt match $q + "*")]
        | order(publishedAt desc) [0...10] {
          _id, _type, title, slug, excerpt, mainImage
        }`
    case "all":
      return `[
        ...*[_type == "post" && (title match $q + "*" || excerpt match $q + "*")]
        | order(publishedAt desc) [0...8] {
          _id, _type, title, slug, excerpt, mainImage
        },
        ...*[_type in ${JSON.stringify(DB_SCHEMA_TYPES)} && (
          name match $q + "*" ||
          scientificName match $q + "*" ||
          $q in aliases ||
          $q in localNames
        )] [0...12] ${dbProjection}
      ]`
    default:
      return `
        *[_type == "${TYPE_TO_SCHEMA[type]}" && (
          name match $q + "*" ||
          scientificName match $q + "*" ||
          $q in aliases ||
          $q in localNames
        )] | order(name asc) [0...10] ${dbProjection}`
  }
}

function rankResult(item: any, query: string): number {
  const q = query.toLowerCase().trim()
  const name = (item.name || item.title || "").toLowerCase()
  const sci = (item.scientificName || "").toLowerCase()
  const aliases = (item.aliases || []).map((a: string) => a.toLowerCase())
  const localNames = (item.localNames || []).map((n: string) => n.toLowerCase())

  if (name === q) return 0
  if (sci === q) return 1
  if (aliases.includes(q)) return 2
  if (localNames.includes(q)) return 3
  if (name.startsWith(q)) return 4
  if (name.includes(q)) return 6
  return 8
}

function dedupeAndRank(items: any[], query: string): SearchItem[] {
  const seen = new Set<string>()
  const deduped: any[] = []
  for (const item of items) {
    if (!seen.has(item._id)) {
      seen.add(item._id)
      deduped.push(item)
    }
  }
  deduped.sort((a: any, b: any) => rankResult(a, query) - rankResult(b, query))
  return deduped.map((item: any) => ({
    _id: item._id,
    _type: item._type,
    title: item.title || item.name || "",
    slug: item.slug,
    excerpt: item.excerpt,
    mainImage: item.mainImage,
  }))
}

export async function searchContent(q: string, type: SearchType): Promise<SearchItem[]> {
  if (!q.trim()) return []
  try {
    const data = await client.fetch(buildQuery(type), { q: q.trim() })
    const items = Array.isArray(data) ? data : data?.result || data || []
    return dedupeAndRank(items, q.trim())
  } catch {
    return []
  }
}

export const typeLabels: Record<string, string> = {
  post: "Article",
  species: "Fish",
  invertebrate: "Invertebrate",
  plant: "Plant",
  coral: "Coral",
  equipment: "Equipment",
  tool: "Tool",
}
