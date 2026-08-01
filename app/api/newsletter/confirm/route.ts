import { NextRequest, NextResponse } from 'next/server'
import { sanityClient } from '@/lib/sanity-server'
import { verifyToken } from '@/lib/newsletter'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Missing confirmation token' }, { status: 400 })
  }

  const email = verifyToken(token)
  if (!email) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  const [subscriber] = (await sanityClient.fetch(
    `*[_type == "subscriber" && email == $email] { _id, status }`,
    { email }
  )) || []

  if (subscriber) {
    await sanityClient
      .patch(subscriber._id)
      .set({ status: 'confirmed', confirmedAt: new Date().toISOString() })
      .commit()
  }

  return NextResponse.redirect(new URL('/?newsletter=confirmed', request.url), 302)
}
