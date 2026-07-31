import Breadcrumb from "@/app/components/Breadcrumb"
import { Cookie } from "lucide-react"
import strings from "@/lib/i18n/strings"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How AquaMind uses cookies and local storage, and how you can control your privacy preferences.",
  alternates: { canonical: "https://aquamind.life/cookie-policy" },
}

export default function CookiePolicyPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-aqua-50 to-ocean-50 dark:from-slate-900 dark:to-slate-800 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6 flex justify-center">
            <Breadcrumb items={[{ label: strings.legal.cookieTitle }]} />
          </div>
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6">
            <Cookie className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-4">
            Chính sách Cookie
          </h1>
          <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
            Tìm hiểu về cách chúng tôi sử dụng cookie và công nghệ tương tự. Cập nhật lần cuối: 27/07/2026.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none dark:prose-invert text-gray-600 dark:text-slate-300 leading-relaxed space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">1. Cookie là gì?</h2>
            <p>
              Cookie là các tệp văn bản nhỏ được lưu trữ trên thiết bị của bạn khi bạn truy cập
              một trang web. Cookie giúp trang web hoạt động hiệu quả hơn và cung cấp thông tin
              cho chủ sở hữu trang web.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">2. Các loại cookie chúng tôi sử dụng</h2>

            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-6">Cookie cần thiết</h3>
            <p>
              Các cookie này là cần thiết để trang web hoạt động và không thể tắt trong hệ thống
              của chúng tôi. Chúng bao gồm cookie cho phép bạn đăng nhập, ghi nhớ lựa chọn cookie,
              và duy trì phiên làm việc. Bạn có thể cấu hình trình duyệt để chặn các cookie này,
              nhưng một số phần của trang web có thể không hoạt động.
            </p>

            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-6">Cookie phân tích</h3>
            <p>
              Các cookie này cho phép chúng tôi đếm số lượt truy cập và nguồn lưu lượng để đánh giá
              và cải thiện hiệu suất trang web. Chúng giúp chúng tôi biết trang nào được ưa chuộng
              nhất, cách người dùng di chuyển trên trang, và phát hiện các vấn đề kỹ thuật.
              Chúng tôi sử dụng Google Analytics cho mục đích này.
            </p>
            <p>Các cookie phân tích chúng tôi có thể sử dụng bao gồm:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>_ga, _gid, _gat</strong> — Google Analytics: phân tích hành vi người dùng.</li>
              <li>Các cookie này chỉ được kích hoạt sau khi bạn đồng ý.</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-6">Cookie quảng cáo</h3>
            <p>
              Các cookie này được đặt bởi các đối tác quảng cáo (khi được triển khai) để hiển thị
              quảng cáo phù hợp với sở thích của bạn. Chúng cũng giới hạn số lần bạn thấy một
              quảng cáo và đo lường hiệu quả chiến dịch. Các cookie này chỉ được đặt sau khi bạn
              đồng ý.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">3. Cách quản lý cookie</h2>
            <p>
              Khi lần đầu truy cập AquaMind Blog, bạn sẽ thấy một banner cookie cho phép bạn:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Chấp nhận tất cả:</strong> Đồng ý với tất cả các loại cookie.</li>
              <li><strong>Từ chối:</strong> Chỉ chấp nhận cookie cần thiết.</li>
              <li><strong>Tuỳ chỉnh:</strong> Chọn loại cookie bạn muốn cho phép.</li>
            </ul>
            <p>
              Bạn có thể thay đổi lựa chọn cookie bất kỳ lúc nào bằng cách nhấp vào link
              "Cài đặt Cookie" trong trang này.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">4. Cookie của bên thứ ba</h2>
            <p>
              Một số cookie được đặt bởi các dịch vụ bên thứ ba xuất hiện trên trang web của chúng tôi:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google Analytics:</strong> Công cụ phân tích trang web.</li>
              <li><strong>Vercel:</strong> Nền tảng lưu trữ và phân phối nội dung.</li>
              <li>Các mạng quảng cáo (sẽ được cập nhật khi triển khai).</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">5. Thời gian lưu trữ</h2>
            <p>
              Cookie có thể là cookie phiên (bị xoá khi bạn đóng trình duyệt) hoặc cookie liên tục
              (vẫn còn trên thiết bị của bạn trong một khoảng thời gian nhất định). Thời gian lưu
              trữ phụ thuộc vào từng loại cookie cụ thể, tối đa không quá 12 tháng.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">6. Liên hệ</h2>
            <p>
              Nếu bạn có câu hỏi về Chính sách Cookie của chúng tôi, vui lòng liên hệ:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email: xingzhuang5201314@gmail.com</li>
              <li>Trang web: <a href="/contact" className="text-aqua-600 dark:text-aqua-400 hover:underline">aquamind.life/contact</a></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
