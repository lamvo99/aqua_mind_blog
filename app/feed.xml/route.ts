import { getAllPosts } from '@/lib/posts'
import { urlFor } from '@/lib/sanity'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aquamind.life'

export async function GET() {
  const posts = await getAllPosts()

  const items = posts.map((post: any) => {
    const imageUrl = post.mainImage ? urlFor(post.mainImage).width(1200).url() : ''
    return `
    <item>
      <title><![CDATA[${post.title || ''}]]></title>
      <link>${siteUrl}/posts/${post.slug?.current || ''}</link>
      <guid>${siteUrl}/posts/${post.slug?.current || ''}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${post.excerpt || ''}]]></description>
      ${imageUrl ? `<enclosure url="${imageUrl}" type="image/jpeg" />` : ''}
      ${post.categories?.map((c: any) => `<category>${c.title}</category>`).join('') || ''}
    </item>`
  }).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AquaMind Blog</title>
    <link>${siteUrl}</link>
    <description>Blog hàng đầu về thuỷ sinh, aquascaping, cây thuỷ sinh và cá cảnh</description>
    <language>vi</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
