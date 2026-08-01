import { createHmac, timingSafeEqual } from 'crypto'

// Server-only helpers for the newsletter double opt-in flow.
// The token is a stateless HMAC-signed email — no session storage needed.

const SECRET = process.env.NEWSLETTER_SECRET || process.env.SANITY_API_TOKEN || ''

export function createToken(email: string): string {
  const mac = createHmac('sha256', SECRET).update(email).digest('base64url')
  return Buffer.from(`${email}.${mac}`).toString('base64url')
}

export function verifyToken(token: string): string | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString()
    const dot = raw.lastIndexOf('.')
    if (dot <= 0) return null
    const email = raw.slice(0, dot)
    const mac = raw.slice(dot + 1)
    const expected = createHmac('sha256', SECRET).update(email).digest('base64url')
    const a = Buffer.from(mac)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    return email
  } catch {
    return null
  }
}

export async function sendConfirmationEmail(email: string, token: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.NEWSLETTER_FROM || 'AquaMind <onboarding@resend.dev>'
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const link = `${site}/api/newsletter/confirm?token=${encodeURIComponent(token)}`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Confirm your AquaMind subscription',
      text: `Thanks for subscribing to AquaMind!\n\nPlease confirm your email address by clicking the link below:\n${link}\n\nIf you did not sign up, you can safely ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
        <h2 style="margin:0 0 12px">Thanks for subscribing to AquaMind!</h2>
        <p style="font-size:15px;line-height:1.6;margin:0 0 20px">Please confirm your email address by clicking the button below. It only takes a second.</p>
        <a href="${link}" style="display:inline-block;background:#0ea5e9;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 24px;border-radius:10px">Confirm subscription</a>
        <p style="font-size:13px;color:#64748b;margin:24px 0 0">If you did not sign up for AquaMind, you can safely ignore this email.</p>
      </div>`,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend error ${res.status}: ${body}`)
  }
}
