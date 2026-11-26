import manifest from './wave1-redirects.json'

export type Wave1RedirectStatus =
  | 'BLOCKED_BY_SPECIALIST'
  | 'BLOCKED_BY_EDITORIAL_DECISION'
  | 'READY_AFTER_CONTENT_MIGRATION'
  | 'READY_FOR_ACTIVATION'

export interface Wave1RedirectGroup {
  group: string
  primary: string
  secondary: string
  status: Wave1RedirectStatus
  blocker: string
  contentMigrated: boolean
  factualApproved: boolean
  editorialApproved: boolean
}

export interface Wave1Redirect {
  source: string
  destination: string
  statusCode: 301
}

export const WAVE1_REDIRECT_GROUPS: Wave1RedirectGroup[] =
  manifest.groups as Wave1RedirectGroup[]

function normalizePath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return '/'
  const withoutQuery = trimmed.split('?')[0].split('#')[0]
  return withoutQuery.replace(/\/+$/, '') || '/'
}

export function isWave1GroupActivatable(group: Wave1RedirectGroup): boolean {
  return (
    group.status === 'READY_FOR_ACTIVATION' &&
    group.contentMigrated === true &&
    group.factualApproved === true &&
    group.editorialApproved === true
  )
}

export function getEnabledWave1Redirects(
  groups: Wave1RedirectGroup[] = WAVE1_REDIRECT_GROUPS
): Wave1Redirect[] {
  return groups.filter(isWave1GroupActivatable).map((group) => ({
    source: group.secondary,
    destination: group.primary,
    statusCode: 301 as const,
  }))
}

export function isWave1RedirectSourcePath(
  path: string,
  groups: Wave1RedirectGroup[] = WAVE1_REDIRECT_GROUPS
): boolean {
  const normalized = normalizePath(path)
  return getEnabledWave1Redirects(groups).some(
    (redirect) => normalizePath(redirect.source) === normalized
  )
}

/**
 * Removes sitemap entries whose pathname is an enabled Wave 1 redirect source.
 * When no group is activated, this is a no-op; redirect sources remain eligible
 * for the sitemap until the redirect is actually live.
 */
export function filterWave1RedirectSources<T extends { url: string }>(
  entries: T[],
  groups: Wave1RedirectGroup[] = WAVE1_REDIRECT_GROUPS
): T[] {
  if (getEnabledWave1Redirects(groups).length === 0) return entries

  return entries.filter((entry) => {
    try {
      return !isWave1RedirectSourcePath(new URL(entry.url).pathname, groups)
    } catch {
      return true
    }
  })
}

const DATABASE_PATH_SEGMENTS: Record<string, string> = {
  species: 'species',
  invertebrate: 'invertebrates',
  plant: 'plants',
  coral: 'corals',
  equipment: 'equipment',
}

export function isWave1RedirectSourceForDatabaseItem(
  type: string,
  slug: string,
  groups: Wave1RedirectGroup[] = WAVE1_REDIRECT_GROUPS
): boolean {
  const segment = DATABASE_PATH_SEGMENTS[type]
  if (!segment) return false
  return isWave1RedirectSourcePath(`/${segment}/${slug}`, groups)
}

/**
 * Replaces an active Wave 1 redirect source with its canonical record in
 * generated lists, collection corpora and comparison pickers. The canonical
 * item inherits the secondary item's position so capped lists still expose it;
 * the duplicate canonical entry later in the list is removed. The secondary
 * document remains in Sanity for redirect/rollback.
 */
export function filterWave1RedirectDatabaseItems<T extends { slug?: { current?: string } | null }>(
  type: string,
  items: T[],
  groups: Wave1RedirectGroup[] = WAVE1_REDIRECT_GROUPS
): T[] {
  const segment = DATABASE_PATH_SEGMENTS[type]
  if (!segment) return items
  const redirects = getEnabledWave1Redirects(groups).filter((redirect) =>
    normalizePath(redirect.source).startsWith(`/${segment}/`)
  )
  if (redirects.length === 0) return items

  const result = [...items]
  for (const redirect of redirects) {
    const sourceSlug = normalizePath(redirect.source).split('/').filter(Boolean).pop()
    const destinationSlug = normalizePath(redirect.destination).split('/').filter(Boolean).pop()
    if (!sourceSlug || !destinationSlug) continue

    const sourceIndex = result.findIndex((item) => item.slug?.current === sourceSlug)
    if (sourceIndex === -1) continue

    const destinationIndex = result.findIndex((item) => item.slug?.current === destinationSlug)
    if (destinationIndex === -1) {
      result.splice(sourceIndex, 1)
      continue
    }

    const [destinationItem] = result.splice(destinationIndex, 1)
    const newSourceIndex = result.findIndex((item) => item.slug?.current === sourceSlug)
    if (newSourceIndex >= 0) result[newSourceIndex] = destinationItem
  }

  return result
}
