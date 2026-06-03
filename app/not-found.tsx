import Link from "next/link"
import { Droplets, Search, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50/50 dark:bg-slate-900">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6">
          <Droplets className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-6xl font-bold gradient-text mb-2">404</h1>
        <p className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
          Trang không tìm thấy
        </p>
        <p className="text-gray-500 dark:text-slate-400 mb-8">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 gradient-bg text-white font-medium rounded-xl hover:opacity-90 transition-all"
          >
            <Home className="w-4 h-4" />
            Về trang chủ
          </Link>
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-medium rounded-xl border border-gray-200 dark:border-slate-700 hover:border-aqua-300 transition-all"
          >
            <Search className="w-4 h-4" />
            Tìm bài viết
          </Link>
        </div>
      </div>
    </div>
  )
}
