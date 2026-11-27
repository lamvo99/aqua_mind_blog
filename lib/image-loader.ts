import type { ImageLoader } from "next/image"

const SANITY_CDN_HOSTNAME = "cdn.sanity.io"

/**
 * Widths offered in a Sanity `srcSet` when the image is fluid (`fill` or
 * `sizes` is set). Every candidate above the asset/crop width is dropped, and
 * the asset's real width is added as the largest descriptor, so each `Nw`
 * descriptor reports the width Sanity actually returns.
 */
const FLUID_WIDTHS = [320, 480, 640, 750, 828, 1080, 1200, 1600, 1920, 2048, 2560, 3840]

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
 * Widest useful rendering for a Sanity asset: the `rect` crop width when a
 * crop is present, otherwise the intrinsic width encoded in the asset
 * filename (e.g. `...-1536x1024.png`). Returns `undefined` when the URL does
 * not expose a width.
 */
export function getSanitySourceWidth(src: string): number | undefined {
  if (!isSanityImageUrl(src)) return undefined
  return getSourceWidthFromUrl(new URL(src))
}

/**
 * Candidate widths for a Sanity image, never exceeding the asset/crop width.
 *
 * - Fluid images (`fill` or `sizes`) get a small ladder of common widths plus
 *   the real source width, so the largest descriptor is the sharpest variant
 *   Sanity can actually produce.
 * - Fixed images get 1x/2x/3x widths, capped at the source width.
 */
export function getSanityWidths(
  src: string,
  options: { width?: number; sizes?: string; fill?: boolean } = {}
): number[] {
  const sourceWidth = getSanitySourceWidth(src)
  const maxWidth = sourceWidth ?? Number.POSITIVE_INFINITY

  const normalise = (values: number[]): number[] =>
    Array.from(
      new Set(
        values
          .filter((value) => Number.isFinite(value) && value > 0 && value <= maxWidth)
          .map((value) => Math.round(value))
      )
    ).sort((a, b) => a - b)

  if (options.fill || options.sizes) {
    const widths = FLUID_WIDTHS.filter((width) => width <= maxWidth)
    if (options.width && options.width <= maxWidth) widths.push(options.width)
    if (sourceWidth) widths.push(sourceWidth)
    const result = normalise(widths)
    if (result.length > 0) return result
  }

  if (options.width) {
    const result = normalise([1, 2, 3].map((multiplier) => options.width! * multiplier))
    if (result.length > 0) return result
    return normalise([sourceWidth ?? options.width])
  }

  return normalise([sourceWidth ?? 1920])
}

/**
 * Build a `srcSet` where every `Nw` descriptor matches the width Sanity will
 * return. This replaces `next/image`'s generated srcSet for Sanity assets:
 * Next generates descriptors from its global `deviceSizes`, which would keep
 * advertising e.g. `3840w` even when the loader capped the image at 1536px.
 */
export function buildSanitySrcSet(src: string, widths: number[], quality?: number): string {
  return widths
    .map((width) => `${sanityImageLoader({ src, width, quality })} ${width}w`)
    .join(", ")
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
 * - Replace `w` with the requested width, capped at the source/crop width so
 *   Sanity never upscales a small asset to a huge variant.
 * - Drop `h` and `fit` so Sanity preserves the source crop's aspect ratio
 *   while only changing the width (layout aspect is controlled by CSS).
 * - Set `q` (default 75) and `auto=format`.
 * - Return non-Sanity sources untouched, so this loader can never silently
 *   disable optimization for unrelated images.
 */
export const sanityImageLoader: ImageLoader = ({ src, width, quality }) => {
  if (!isSanityImageUrl(src)) return src

  const url = new URL(src)
  const sourceWidth = getSourceWidthFromUrl(url)
  const requestedWidth = Math.max(1, Math.round(width))
  const targetWidth = sourceWidth ? Math.min(requestedWidth, sourceWidth) : requestedWidth

  url.searchParams.delete("h")
  url.searchParams.delete("fit")
  url.searchParams.set("w", String(targetWidth))
  url.searchParams.set("q", String(quality ?? 75))
  url.searchParams.set("auto", "format")
  return url.toString()
}

function getSourceWidthFromUrl(url: URL): number | undefined {
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
