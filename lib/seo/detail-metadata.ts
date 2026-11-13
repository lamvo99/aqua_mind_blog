import type { Metadata } from "next"
import { urlFor } from "@/lib/sanity"

export interface DetailSeoMetadata {
  metaTitle?: string | null
  metaDescription?: string | null
}

export interface DetailSeoItem {
  name: string
  excerpt?: string | null
  mainImage?: unknown
  seo?: DetailSeoMetadata | null
}

export interface DetailMetadataOptions {
  pathPrefix: string
  slug: string
  profileLabel: string
  imageAltSuffix: string
  fallbackDescription?: (name: string) => string
}

export function nonEmptySeoString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

/**
 * Shared metadata builder for Species, Plants and Corals.
 * Sanity SEO values win only when they are non-empty; otherwise existing
 * name/excerpt fallbacks are preserved. Canonical URLs, Open Graph, Twitter
 * and image metadata retain the detail-page behaviour.
 */
export function buildDetailMetadata(item: DetailSeoItem, options: DetailMetadataOptions): Metadata {
  const canonical = `https://www.aquamind.life/${options.pathPrefix}/${options.slug}`
  return buildMetadataWithCanonical(item, options, canonical)
}

export function buildMetadataWithCanonical(
  item: DetailSeoItem,
  options: DetailMetadataOptions,
  canonical: string,
): Metadata {
  const fallbackTitle = `${item.name} \u2014 ${options.profileLabel}`
  const fallbackDescription =
    item.excerpt?.trim() ||
    options.fallbackDescription?.(item.name) ||
    `Care guide for ${item.name}`

  const seoTitle = nonEmptySeoString(item.seo?.metaTitle) ? item.seo.metaTitle : null
  const seoDescription = nonEmptySeoString(item.seo?.metaDescription)
    ? item.seo.metaDescription
    : null
  const title = seoTitle || fallbackTitle
  const description = seoDescription || fallbackDescription

  return {
    title: seoTitle ? { absolute: seoTitle } : fallbackTitle,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      images: item.mainImage
        ? [{
            url: urlFor(item.mainImage as Parameters<typeof urlFor>[0]).width(1200).height(630).url(),
            width: 1200,
            height: 630,
            alt: `${item.name} \u2014 ${options.imageAltSuffix}`,
          }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}
