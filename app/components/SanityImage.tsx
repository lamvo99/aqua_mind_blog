"use client"

/* eslint-disable @next/next/no-img-element -- Sanity CDN needs an exact srcSet (descriptor = real returned width); next/image always regenerates srcSet from its global deviceSizes. */

import { preload } from "react-dom"
import {
  buildSanitySrcSet,
  getSanityWidths,
  isSanityImageUrl,
  sanityImageLoader,
} from "@/lib/image-loader"

export interface SanityImageProps {
  src: string
  alt: string
  fill?: boolean
  sizes?: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  loading?: "lazy" | "eager"
  fetchPriority?: "high" | "low" | "auto"
  quality?: number
}

const FILL_STYLE = {
  position: "absolute" as const,
  height: "100%",
  width: "100%",
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  color: "transparent",
}

/**
 * Sanity-backed image with a hand-built, honest `srcSet`.
 *
 * `next/image` always derives its `srcSet` from the global `deviceSizes`, so a
 * custom loader that caps at the source width would advertise e.g. `3840w`
 * while returning a 1536px file. Here every descriptor is generated from
 * `getSanityWidths`, which never exceeds the asset/crop width, so `Nw` always
 * describes the real image width.
 *
 * `alt` is a required prop (not spread from `next/image`) so every image has
 * an explicit alternative text.
 */
export default function SanityImage({
  src,
  alt,
  fill,
  sizes,
  width,
  height,
  className,
  priority,
  loading,
  fetchPriority,
  quality,
}: SanityImageProps) {
  const isFluid = Boolean(fill || sizes)
  const isSanity = isSanityImageUrl(src)
  const widths = isSanity ? getSanityWidths(src, { width, sizes, fill }) : []
  const srcSet = isSanity ? buildSanitySrcSet(src, widths, quality) : undefined
  const resolvedSizes = sizes ?? (fill ? "100vw" : width ? `${width}px` : undefined)
  const fallbackWidth =
    !isFluid && width && widths.includes(Math.round(width))
      ? width
      : widths[widths.length - 1] ?? width ?? 1920
  const resolvedSrc = isSanity ? sanityImageLoader({ src, width: fallbackWidth, quality }) : src

  if (priority && isSanity) {
    preload(resolvedSrc, {
      as: "image",
      imageSrcSet: srcSet,
      imageSizes: resolvedSizes,
      fetchPriority: "high",
    })
  }

  return (
    <img
      src={resolvedSrc}
      srcSet={srcSet}
      sizes={resolvedSizes}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? "eager" : loading ?? "lazy"}
      fetchPriority={priority ? "high" : fetchPriority}
      decoding="async"
      className={className}
      style={fill ? FILL_STYLE : undefined}
    />
  )
}
