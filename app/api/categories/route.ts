import { client } from '@/lib/sanity'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const categories = await client.fetch(`
      *[_type == "category" && count(*[_type == "post" && references(^._id)]) > 0] | order(title asc) {
        _id,
        title,
        "slug": slug.current,
        "postCount": count(*[_type == "post" && references(^._id)])
      }
    `)
    return NextResponse.json(categories, {
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
    })
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
