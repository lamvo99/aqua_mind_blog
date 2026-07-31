import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // TODO: Replace with a real email service (Mailchimp, SendGrid, Resend...)
    // Currently: simulated double opt-in — marks the subscription as "pending"
    // and returns a confirmation link (in production an email would be sent instead)
    const token = Buffer.from(JSON.stringify({ email, date: Date.now() })).toString('base64url')

    // In production, send an email containing the link: /api/newsletter/confirm?token=...
    // await sendConfirmationEmail(email, token)

    return NextResponse.json({
      success: true,
      message: 'Please check your email to confirm your subscription.',
      // Only return the token in dev mode — production must send a real email
      ...(process.env.NODE_ENV === 'development' ? { token } : {}),
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
