"use client"

import Image, { type ImageProps } from "next/image"
import { sanityImageLoader } from "@/lib/image-loader"

/**
 * `next/image` is a Client Component, so a loader function cannot be passed to
 * it from a Server Component. This thin client wrapper owns the function and
 * keeps server pages free of non-serializable props.
 *
 * Only use this for Sanity CDN sources. Local `/public` assets should keep the
 * default Next.js loader so they continue to be optimized by Next/Vercel.
 */
export default function SanityImage(props: Omit<ImageProps, "loader">) {
  return <Image {...props} loader={sanityImageLoader} />
}
