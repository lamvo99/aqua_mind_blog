import { NextRequest, NextResponse } from 'next/server'
import { sanityClient } from '@/lib/sanity-server'
import { createToken, sendConfirmationEmail } from '@/lib/newsletter'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  let body: any = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email } = body || {}
  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const normalized = email.trim().toLowerCase()
  if (!EMAIL_RE.test(normalized)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const [existing] = (await sanityClient.fetch(
    `*[_type == "subscriber" && email == $email] { _id, status }`,
    { email: normalized }
  )) || []

  if (existing?.status === 'confirmed') {
    return NextResponse.json({ success: true, confirmed: true })
  }

  if (!existing) {
    await sanityClient.create({
      _type: 'subscriber',
      email: normalized,
      status: 'pending',
      subscribedAt: new Date().toISOString(),
    })
  }

  const token = createToken(normalized)

  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      // Dev fallback: no email is sent, return the link so the flow can be tested
      return NextResponse.json({
        success: true,
        pending: true,
        message: 'Please check your email to confirm your subscription.',
        ...(process.env.NODE_ENV === 'development' ? { token } : {}),
      })
    }
    return NextResponse.json({ error: 'Newsletter service is not configured' }, { status: 500 })
  }

  try {
    await sendConfirmationEmail(normalized, token)
  } catch {
    return NextResponse.json({ error: 'Failed to send confirmation email' }, { status: 502 })
  }

  return NextResponse.json({
    success: true,
    pending: true,
    message: 'Please check your email to confirm your subscription.',
  })
}
