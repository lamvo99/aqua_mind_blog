import { MetadataRoute } from "next"
import { getAllPosts } from "@/lib/posts"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aquamind.vn"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts()

  const postEntries: MetadataRoute.Sitemap = posts.map((post: any) => ({
    url: `${siteUrl}/posts/${post.slug.current}`,
    lastModified: post.updatedAt || post.publishedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...postEntries,
  ]
}
