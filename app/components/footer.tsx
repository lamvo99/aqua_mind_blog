"use client"

import Link from "next/link"
import { Droplets, Mail, Send } from "lucide-react"
import { useNewsletter } from "@/lib/store"
import { useState } from "react"

export default function Footer() {
  const { subscribed, loading, subscribe } = useNewsletter()
  const [email, setEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email) await subscribe(email)
  }

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                <Droplets className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">AquaMind</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Blog chia sẻ kiến thức về thuỷ sinh, aquascaping và cách chăm sóc hồ cá cảnh. Nơi kết nối những người yêu thuỷ sinh.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Khám phá</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/", label: "Trang chủ" },
                { href: "/posts", label: "Bài viết" },
                { href: "/about", label: "Giới thiệu" },
                { href: "/contact", label: "Liên hệ" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-aqua-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Chuyên mục</h4>
            <ul className="space-y-2.5">
              {["Aquascaping", "Cá cảnh", "Cây thuỷ sinh", "Hoá chất nước", "Thiết bị"].map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/posts?category=${cat.toLowerCase()}`}
                    className="text-sm text-slate-400 hover:text-aqua-400 transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Theo dõi</h4>
            <p className="text-sm text-slate-400 mb-4">
              Nhận bài viết mới nhất qua email
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-aqua-400 text-sm">
                <Mail className="w-4 h-4" />
                <span>Đã đăng ký thành công!</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex">
                <label htmlFor="footer-email" className="sr-only">Email của bạn</label>
                <input
                  id="footer-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email của bạn"
                  required
                  className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-l-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-aqua-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-2.5 gradient-bg hover:opacity-90 text-white rounded-r-lg transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} AquaMind Blog. Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-aqua-400 transition-colors">Chính sách bảo mật</Link>
            <Link href="/terms-of-service" className="hover:text-aqua-400 transition-colors">Điều khoản sử dụng</Link>
            <Link href="/cookie-policy" className="hover:text-aqua-400 transition-colors">Chính sách Cookie</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
