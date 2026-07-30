import Link from "next/link"
import { Droplets, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50/50 dark:bg-slate-900">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6">
          <Droplets className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 dark:text-slate-100 mb-2">404</h1>
        <p className="text-lg text-gray-500 dark:text-slate-400 mb-2">Trang bạn tìm kiếm không tồn tại</p>
        <p className="text-sm text-gray-400 dark:text-slate-500 mb-8">
          Có thể trang đã bị xoá hoặc đường dẫn không chính xác.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 gradient-bg text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-aqua-500/25"
        >
          <Home className="w-4 h-4" />
          Quay về trang chủ
        </Link>
      </div>
    </div>
  )
}
