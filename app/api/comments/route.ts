import { NextRequest, NextResponse } from 'next/server'
import { sanityClient } from '@/lib/sanity-server'

export async function GET(request: NextRequest) {
  const postSlug = request.nextUrl.searchParams.get('post')
  if (!postSlug) {
    return NextResponse.json({ error: 'Missing post slug' }, { status: 400 })
  }
  const comments = await sanityClient.fetch(
    `*[_type == "comment" && approved == true && post->slug.current == $slug] | order(_createdAt asc) {
      _id, name, content, "_createdAt": _createdAt
    }`,
    { slug: postSlug }
  )
  return NextResponse.json({ comments: comments || [] })
}

export async function POST(request: NextRequest) {
  let body: any = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { postSlug, name, email, content, hp_comment } = body || {}

  if (hp_comment) {
    return NextResponse.json({ success: true, pending: true })
  }

  if (!postSlug || typeof postSlug !== 'string') {
    return NextResponse.json({ error: 'Missing post slug' }, { status: 400 })
  }
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
  }
  if (typeof content !== 'string' || content.trim().length < 2 || content.trim().length > 2000) {
    return NextResponse.json({ error: 'Invalid comment content' }, { status: 400 })
  }
  if (email && typeof email !== 'string') {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const [post] = await sanityClient.fetch(`*[_type == "post" && slug.current == $slug] { _id }`, { slug: postSlug })
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  await sanityClient.create({
    _type: 'comment',
    name: name.trim(),
    email: email ? email.trim().slice(0, 120) : undefined,
    content: content.trim(),
    post: { _ref: post._id, _type: 'reference' },
    approved: false,
  })

  return NextResponse.json({ success: true, pending: true })
}
