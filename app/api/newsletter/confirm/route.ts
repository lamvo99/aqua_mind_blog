import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Thiếu token xác nhận' }, { status: 400 })
  }

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString())
    const { email } = decoded

    if (!email) {
      return NextResponse.json({ error: 'Token không hợp lệ' }, { status: 400 })
    }

    // TODO: Lưu email vào database/subscriber list thật
    // Hiện tại chỉ trả về thành công
    console.log(`[Newsletter] Confirmed: ${email}`)

    // Redirect về trang chủ với thông báo thành công
    return NextResponse.redirect(
      new URL('/?newsletter=confirmed', request.url),
      302
    )
  } catch {
    return NextResponse.json({ error: 'Token không hợp lệ hoặc đã hết hạn' }, { status: 400 })
  }
}
