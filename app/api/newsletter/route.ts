import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 })
    }

    // TODO: Thay thế bằng service email thật (Mailchimp, SendGrid, Resend...)
    // Hiện tại: mô phỏng double opt-in — lưu trạng thái "pending"
    // và trả về link xác nhận (thực tế sẽ gửi email chứa link này)
    const token = Buffer.from(JSON.stringify({ email, date: Date.now() })).toString('base64url')

    // Trong production, gửi email chứa link: /api/newsletter/confirm?token=...
    // await sendConfirmationEmail(email, token)

    return NextResponse.json({
      success: true,
      message: 'Vui lòng kiểm tra email để xác nhận đăng ký.',
      // Chỉ trả về token ở dev mode — production phải gửi email thật
      ...(process.env.NODE_ENV === 'development' ? { token } : {}),
    })
  } catch {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
