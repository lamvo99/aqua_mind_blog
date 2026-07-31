import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Missing confirmation token' }, { status: 400 })
  }

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString())
    const { email } = decoded

    if (!email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // TODO: Store the email in a real database/subscriber list
    // Currently just returns success
    console.log(`[Newsletter] Confirmed: ${email}`)

    // Redirect to the home page with a success notice
    return NextResponse.redirect(
      new URL('/?newsletter=confirmed', request.url),
      302
    )
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }
}
