export type SearchType =
  | 'all'
  | 'post'
  | 'species'
  | 'invertebrate'
  | 'plant'
  | 'coral'
  | 'equipment'
  | 'tool'

export const SEARCH_TYPES: { value: SearchType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'post', label: 'Articles' },
  { value: 'species', label: 'Fish' },
  { value: 'invertebrate', label: 'Invertebrates' },
  { value: 'plant', label: 'Plants' },
  { value: 'coral', label: 'Corals' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'tool', label: 'Tools' },
]

export const SEARCH_TYPE_LABEL: Record<string, string> = {
  post: 'Article',
  species: 'Fish',
  invertebrate: 'Invertebrate',
  plant: 'Plant',
  coral: 'Coral',
  equipment: 'Equipment',
  tool: 'Tool',
}

export const SEARCH_TYPE_ORDER: string[] = [
  'species',
  'invertebrate',
  'plant',
  'coral',
  'equipment',
  'tool',
  'post',
]

export interface SearchDoc {
  id: string
  type: string
  title: string
  scientificName?: string | null
  aliases?: string[] | null
  localNames?: string[] | null
  excerpt?: string | null
  slug?: string | null
}

export interface SearchHit {
  id: string
  type: string
  title: string
  scientificName?: string | null
  excerpt?: string | null
  slug?: string | null
  score: number
  matchedField: 'name' | 'scientific' | 'alias' | 'local' | 'excerpt'
}

export interface SearchResponse {
  query: string
  type: SearchType
  total: number
  results: SearchHit[]
  hasMore: boolean
}

export function normalizeSearchText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function tokenizeSearchText(value: unknown): string[] {
  const normalized = normalizeSearchText(value)
  return normalized ? normalized.split(' ').filter(Boolean) : []
}

/** Bounded Damerau–Levenshtein distance (optimal string alignment). */
export function editDistance(a: string, b: string, max = 1): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1
  const rows = a.length + 1
  const cols = b.length + 1
  let prevPrev = new Array<number>(cols).fill(0)
  let prev = new Array<number>(cols).fill(0)
  let curr = new Array<number>(cols).fill(0)
  for (let j = 0; j < cols; j++) prev[j] = j
  for (let i = 1; i < rows; i++) {
    curr[0] = i
    let rowMin = curr[0]
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let value = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, prevPrev[j - 2] + 1)
      }
      curr[j] = value
      if (value < rowMin) rowMin = value
    }
    if (rowMin > max) return max + 1
    const swap = prevPrev
    prevPrev = prev
    prev = curr
    curr = swap
  }
  return prev[b.length]
}

function exactFrom(list: Array<string | null | undefined>, query: string): boolean {
  return list.some((value) => normalizeSearchText(value) === query)
}

function prefixFrom(list: Array<string | null | undefined>, query: string): boolean {
  return list.some((value) => {
    const normalized = normalizeSearchText(value)
    return normalized.length > 0 && normalized.startsWith(query)
  })
}

function includesFrom(list: Array<string | null | undefined>, query: string): boolean {
  return list.some((value) => normalizeSearchText(value).includes(query))
}

function tokenMatch(titleTokens: string[], queryTokens: string[]): boolean {
  if (queryTokens.length === 0) return false
  return queryTokens.every((token) => titleTokens.includes(token))
}

function fuzzyFrom(list: Array<string | null | undefined>, query: string, queryTokens: string[]): boolean {
  for (const value of list) {
    const normalized = normalizeSearchText(value)
    if (!normalized) continue
    if (query.length >= 5 && editDistance(normalized, query) === 1) return true
    const tokens = normalized.split(' ')
    for (const qToken of queryTokens) {
      if (qToken.length < 4) continue
      for (const token of tokens) {
        if (token.length < 4) continue
        if (Math.abs(token.length - qToken.length) > 1) continue
        if (editDistance(token, qToken) === 1) return true
      }
    }
  }
  return false
}

/**
 * Deterministic ranking:
 * 0 exact name · 1 exact scientific · 2 exact alias/local · 3 prefix ·
 * 4 token match · 5 substring · 6 fuzzy/typo · 7 excerpt.
 */
export function scoreDocument(doc: SearchDoc, rawQuery: string): { score: number; matchedField: SearchHit['matchedField'] } | null {
  const query = normalizeSearchText(rawQuery)
  if (!query) return null
  const queryTokens = tokenizeSearchText(rawQuery)
  const name = normalizeSearchText(doc.title)
  const scientific = normalizeSearchText(doc.scientificName)
  const aliases = (doc.aliases || []).map((value) => normalizeSearchText(value)).filter(Boolean)
  const localNames = (doc.localNames || []).map((value) => normalizeSearchText(value)).filter(Boolean)
  const excerpt = normalizeSearchText(doc.excerpt)
  const nameTokens = name ? name.split(' ') : []

  if (name === query) return { score: 0, matchedField: 'name' }
  if (scientific && scientific === query) return { score: 1, matchedField: 'scientific' }
  if (exactFrom([...aliases, ...localNames], query)) {
    return { score: 2, matchedField: aliases.includes(query) ? 'alias' : 'local' }
  }
  if (name.startsWith(query)) return { score: 3, matchedField: 'name' }
  if (prefixFrom([scientific, ...aliases, ...localNames], query)) return { score: 3, matchedField: 'name' }
  if (tokenMatch(nameTokens, queryTokens)) return { score: 4, matchedField: 'name' }
  if (includesFrom([name, scientific, ...aliases, ...localNames], query)) return { score: 5, matchedField: 'name' }
  if (fuzzyFrom([name, scientific, ...aliases, ...localNames], query, queryTokens)) {
    return { score: 6, matchedField: 'name' }
  }
  if (excerpt.includes(query)) return { score: 7, matchedField: 'excerpt' }
  return null
}

function typeRank(type: string): number {
  const index = SEARCH_TYPE_ORDER.indexOf(type)
  return index === -1 ? SEARCH_TYPE_ORDER.length : index
}

export function searchCorpus(
  docs: SearchDoc[],
  rawQuery: string,
  type: SearchType = 'all',
  limit = 24
): SearchResponse {
  const query = rawQuery.trim()
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)))
  if (!query) return { query, type, total: 0, results: [], hasMore: false }

  const hits: SearchHit[] = []
  for (const doc of docs) {
    if (type !== 'all' && doc.type !== type) continue
    const scored = scoreDocument(doc, query)
    if (!scored) continue
    hits.push({
      id: doc.id,
      type: doc.type,
      title: doc.title,
      scientificName: doc.scientificName ?? null,
      excerpt: doc.excerpt ?? null,
      slug: doc.slug ?? null,
      score: scored.score,
      matchedField: scored.matchedField,
    })
  }

  hits.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score
    if (a.title.length !== b.title.length) return a.title.length - b.title.length
    const typeDiff = typeRank(a.type) - typeRank(b.type)
    if (typeDiff !== 0) return typeDiff
    return a.title.localeCompare(b.title)
  })

  return {
    query,
    type,
    total: hits.length,
    results: hits.slice(0, safeLimit),
    hasMore: hits.length > safeLimit,
  }
}

export function searchHref(hit: Pick<SearchHit, 'type' | 'slug'>): string {
  const segment: Record<string, string> = {
    post: 'posts',
    species: 'species',
    invertebrate: 'invertebrates',
    plant: 'plants',
    coral: 'corals',
    equipment: 'equipment',
    tool: 'tools',
  }
  const base = segment[hit.type]
  if (!base || !hit.slug) return '/search'
  return `/${base}/${hit.slug}`
}

export interface HighlightPart {
  text: string
  match: boolean
}

/**
 * Splits text into plain/marked parts for accessible `<mark>` rendering.
 * Only literal query tokens are highlighted; fuzzy matches stay unmarked.
 */
export function highlightParts(text: string, rawQuery: string): HighlightPart[] {
  if (!text) return []
  const tokens = tokenizeSearchText(rawQuery).filter((token) => token.length >= 2)
  if (tokens.length === 0) return [{ text, match: false }]
  const escaped = tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = text.split(regex)
  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, match: tokens.includes(normalizeSearchText(part)) }))
}
