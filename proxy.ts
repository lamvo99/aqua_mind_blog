import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/studio')) {
    return NextResponse.next()
  }

  const basicAuth = request.headers.get('authorization')

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, password] = atob(authValue).split(':')

    if (
      user === process.env.STUDIO_USERNAME &&
      password === process.env.STUDIO_PASSWORD
    ) {
      return NextResponse.next()
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Sanity Studio"',
    },
  })
}

export const config = {
  matcher: '/studio/:path*',
}
