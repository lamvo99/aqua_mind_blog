import { urlFor } from "@/lib/sanity"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aquamind.life"

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AquaMind Blog",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: "Leading aquarium & aquascaping blog",
  }
}

export function articleImage(post: any) {
  if (!post.mainImage) return undefined
  try {
    return urlFor(post.mainImage).width(1200).url()
  } catch {
    return undefined
  }
}

export function articleSchema(post: any) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: articleImage(post),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: post.author
      ? { "@type": "Person", name: post.author.name }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "AquaMind Blog",
      logo: `${siteUrl}/logo.png`,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/posts/${post.slug?.current}`,
    },
  }
}

export function breadcrumbSchema(items: { label: string; href?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: item.href ? `${siteUrl}${item.href}` : undefined,
    })),
  }
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AquaMind Blog",
    url: siteUrl,
    description: "Leading aquarium & aquascaping blog — guides, tips, and inspiration for fishkeepers worldwide.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/posts?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

export function JsonLd({ data }: { data: any }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
