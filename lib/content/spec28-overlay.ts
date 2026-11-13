export type Spec28OverlayType = 'species' | 'plant' | 'coral' | 'invertebrate' | 'equipment' | 'problem'

export interface Spec28OverlayEntry {
  type: Spec28OverlayType
  slug: string
  recordId: string
  disposition: 'REMEDIATED'
  rationale: string
  sourceIds: string[]
  fields: Record<string, unknown>
  heldFields?: string[]
  provenance?: string
}

export interface Spec28Overlay {
  spec: string
  status: string
  productionWrites: boolean
  note: string
  entries: Spec28OverlayEntry[]
}

/**
 * Runtime RC production source intentionally ships no local content overlays.
 * The app reads Sanity Production data directly.
 */
export const SPEC28_OVERLAY: Spec28Overlay = {
  spec: 'runtime-rc',
  status: 'LOCAL_OVERLAYS_DISABLED',
  productionWrites: false,
  note: 'No local overlays are bundled in the production runtime release.',
  entries: [],
}

export const CORE_COMPLETION_OVERLAY: Spec28Overlay = {
  spec: 'runtime-rc',
  status: 'LOCAL_OVERLAYS_DISABLED',
  productionWrites: false,
  note: 'No local overlays are bundled in the production runtime release.',
  entries: [],
}

export function getSpec28OverlayEntry(
  _type: Spec28OverlayType,
  _slug?: string | null,
): Spec28OverlayEntry | undefined {
  return undefined
}

export function getCoreCompletionOverlayEntry(
  _type: Spec28OverlayType,
  _slug?: string | null,
): Spec28OverlayEntry | undefined {
  return undefined
}

export function applySpec28Overlay<T extends Record<string, any>>(
  _type: Spec28OverlayType,
  record: T | null | undefined,
): T | null {
  return record ?? null
}

export function applySpec28OverlayList<T extends Record<string, any>>(
  _type: Spec28OverlayType,
  records: T[] | null | undefined,
): T[] {
  return Array.isArray(records) ? records : []
}
