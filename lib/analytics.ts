/**
 * Provider-neutral analytics interface for database discovery events.
 *
 * No analytics provider is installed or approved in this repository. Until an
 * approved provider attaches `window.__AQUAMIND_ANALYTICS__`, every call is a
 * safe no-op. Never pass raw query text, user identifiers, or free-form data.
 */

export type DatabaseEventName =
  | 'database_search_submitted'
  | 'database_search_result_opened'
  | 'database_search_no_results'
  | 'database_filter_changed'
  | 'database_finder_submitted'
  | 'database_collection_opened'
  | 'database_result_opened'

export interface DatabaseEventProps {
  page_type?: 'search' | 'modal' | 'category' | 'collection' | 'finder' | 'detail' | 'database'
  database_type?: string
  query_length?: number
  result_count?: number
  filter_count?: number
  collection_slug?: string
  result_position?: number
}

export interface AnalyticsProvider {
  track: (event: DatabaseEventName, props: DatabaseEventProps) => void
}

declare global {
  interface Window {
    __AQUAMIND_ANALYTICS__?: AnalyticsProvider
  }
}

const EVENT_NAMES = new Set<DatabaseEventName>([
  'database_search_submitted',
  'database_search_result_opened',
  'database_search_no_results',
  'database_filter_changed',
  'database_finder_submitted',
  'database_collection_opened',
  'database_result_opened',
])

const PROP_KEYS = new Set<keyof DatabaseEventProps>([
  'page_type',
  'database_type',
  'query_length',
  'result_count',
  'filter_count',
  'collection_slug',
  'result_position',
])

export function sanitizeEventProps(props: DatabaseEventProps): DatabaseEventProps {
  const clean: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(props)) {
    if (!PROP_KEYS.has(key as keyof DatabaseEventProps)) continue
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) continue
      clean[key] = Math.max(0, Math.round(value))
    } else if (typeof value === 'string') {
      // Slugs/types are bounded and non-personal; cap length defensively.
      clean[key] = value.slice(0, 64)
    }
  }
  return clean as DatabaseEventProps
}

/**
 * Emits a discovery event through the approved provider if one is attached.
 * Returns true only when a provider received the event.
 */
export function trackDatabaseEvent(event: DatabaseEventName, props: DatabaseEventProps = {}): boolean {
  if (typeof window === 'undefined') return false
  if (!EVENT_NAMES.has(event)) return false
  const provider = window.__AQUAMIND_ANALYTICS__
  if (!provider || typeof provider.track !== 'function') return false
  try {
    provider.track(event, sanitizeEventProps(props))
    return true
  } catch {
    return false
  }
}
