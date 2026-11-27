import type { ImageLoader } from "next/image"

const SANITY_CDN_HOSTNAME = "cdn.sanity.io"

/**
 * True when the URL is served by the Sanity image CDN.
 *
 * Only https URLs on the exact `cdn.sanity.io` host are treated as Sanity
 * images; lookalike hosts and other domains fall back to the default Next.js
 * image loader.
 */
export function isSanityImageUrl(src: string): boolean {
  if (!src) return false
  try {
    const url = new URL(src)
    return url.protocol === "https:" && url.hostname === SANITY_CDN_HOSTNAME
  } catch {
    return false
  }
}

/**
 * Next.js image loader that sends Sanity images straight to the Sanity CDN.
 *
 * Vercel Image Optimization has a monthly transformation quota; routing
 * Sanity assets through it both consumes that quota and adds a proxy hop.
 * Sanity already resizes (`w`) and negotiates modern formats (`auto=format`),
 * so the loader rewrites the URL instead of proxying it.
 *
 * Rules:
 * - Keep `rect`/`crop`/`fp`/`fm` and any other Sanity parameters intact.
 * - Replace `w` with the width Next.js asks for, capped at the source/crop
 *   width so Sanity never upscales a small asset to a huge variant.
 * - Drop `h` and `fit` so Sanity preserves the source crop's aspect ratio
 *   while only changing the width (layout aspect is controlled by CSS).
 * - Set `q` (default 75) and `auto=format`.
 * - Return non-Sanity sources untouched, so this loader can never silently
 *   disable optimization for unrelated images.
 */
export const sanityImageLoader: ImageLoader = ({ src, width, quality }) => {
  if (!isSanityImageUrl(src)) return src

  const url = new URL(src)
  const sourceWidth = getSanitySourceWidth(url)
  const requestedWidth = Math.max(1, Math.round(width))
  const targetWidth = sourceWidth ? Math.min(requestedWidth, sourceWidth) : requestedWidth

  url.searchParams.delete("h")
  url.searchParams.delete("fit")
  url.searchParams.set("w", String(targetWidth))
  url.searchParams.set("q", String(quality ?? 75))
  url.searchParams.set("auto", "format")
  return url.toString()
}

/**
 * Widest useful rendering for a Sanity asset: the `rect` crop width when a
 * crop is present, otherwise the intrinsic width encoded in the asset
 * filename (e.g. `...-1536x1024.png`). Returning `undefined` lets the caller
 * use the requested width unmodified.
 */
function getSanitySourceWidth(url: URL): number | undefined {
  const rect = url.searchParams.get("rect")
  if (rect) {
    const [, , rectWidth] = rect.split(",").map(Number)
    if (Number.isFinite(rectWidth) && rectWidth > 0) return Math.round(rectWidth)
  }

  const match = url.pathname.match(/-(\d+)x(\d+)\.(?:jpe?g|png|webp|gif|avif|tiff?|heic)$/i)
  if (match) {
    const sourceWidth = Number(match[1])
    if (Number.isFinite(sourceWidth) && sourceWidth > 0) return sourceWidth
  }

  return undefined
}
