export const SCROLL_STORAGE_KEY = "aquamind_posts_scroll"

export function readScrollMark(key = SCROLL_STORAGE_KEY): { y: number; page: number } | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { y?: unknown; page?: unknown }
    if (typeof parsed.y !== "number" || typeof parsed.page !== "number") return null
    if (!Number.isFinite(parsed.y) || parsed.y < 0 || !Number.isInteger(parsed.page) || parsed.page < 1) return null
    return { y: parsed.y, page: parsed.page }
  } catch {
    return null
  }
}

export function writeScrollMark(y: number, page: number, key = SCROLL_STORAGE_KEY): void {
  if (typeof window === "undefined" || !Number.isFinite(y) || y < 0 || !Number.isInteger(page) || page < 1) return
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ y, page }))
  } catch {}
}

export function setManualScrollRestoration(): void {
  if (typeof window === "undefined") return
  try {
    if (window.history.scrollRestoration !== "manual") {
      window.history.scrollRestoration = "manual"
    }
  } catch {}
}
