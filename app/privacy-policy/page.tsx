import Breadcrumb from "@/app/components/Breadcrumb"
import { Shield } from "lucide-react"
import strings from "@/lib/i18n/strings"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How AquaMind collects, uses and protects your personal data when you visit the website or subscribe to the newsletter.",
  alternates: { canonical: "https://aquamind.life/privacy-policy" },
}

export default function PrivacyPolicyPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-aqua-50 to-ocean-50 dark:from-slate-900 dark:to-slate-800 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6 flex justify-center">
            <Breadcrumb items={[{ label: strings.legal.privacyTitle }]} />
          </div>
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-4">
            Chính sách Bảo mật
          </h1>
          <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
            Cam kết bảo vệ dữ liệu cá nhân của bạn. Cập nhật lần cuối: 27/07/2026.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none dark:prose-invert text-gray-600 dark:text-slate-300 leading-relaxed space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">1. Giới thiệu</h2>
            <p>
              AquaMind Blog (sau đây gọi là "chúng tôi") cam kết bảo vệ quyền riêng tư của bạn.
              Chính sách Bảo mật này giải thích cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ
              thông tin cá nhân của bạn khi bạn truy cập và sử dụng trang web aquamind.life.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">2. Thông tin chúng tôi thu thập</h2>
            <p>Chúng tôi có thể thu thập các loại thông tin sau:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Thông tin bạn cung cấp:</strong> Họ tên, địa chỉ email khi bạn đăng ký nhận tin, để lại bình luận hoặc liên hệ với chúng tôi qua form.</li>
              <li><strong>Thông tin tự động:</strong> Địa chỉ IP, loại trình duyệt, hệ điều hành, trang web giới thiệu, thời gian truy cập và hành vi duyệt web thông qua cookie và công nghệ tương tự.</li>
              <li><strong>Cookie:</strong> Xem chi tiết tại <a href="/cookie-policy" className="text-aqua-600 dark:text-aqua-400 hover:underline">Chính sách Cookie</a>.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">3. Mục đích sử dụng thông tin</h2>
            <p>Chúng tôi sử dụng thông tin của bạn để:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Vận hành và cải thiện trang web.</li>
              <li>Gửi bản tin, cập nhật bài viết mới (khi bạn đã đăng ký).</li>
              <li>Phản hồi các câu hỏi và yêu cầu hỗ trợ.</li>
              <li>Phân tích xu hướng sử dụng để cải thiện nội dung và trải nghiệm người dùng.</li>
              <li>Hiển thị quảng cáo phù hợp (khi có trong tương lai).</li>
              <li>Tuân thủ nghĩa vụ pháp lý theo quy định của pháp luật Việt Nam.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">4. Cơ sở pháp lý</h2>
            <p>
              Việc thu thập và xử lý dữ liệu cá nhân của chúng tôi tuân thủ Nghị định 13/2023/NĐ-CP
              của Chính phủ Việt Nam về Bảo vệ dữ liệu cá nhân. Đối với người dùng quốc tế, chúng tôi
              cũng tôn trọng các quyền riêng tư theo quy định của pháp luật hiện hành tại quốc gia của bạn.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">5. Chia sẻ thông tin</h2>
            <p>
              Chúng tôi không bán thông tin cá nhân của bạn cho bên thứ ba. Chúng tôi có thể chia sẻ
              thông tin với:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Các nhà cung cấp dịch vụ (Vercel, Sanity.io) để vận hành trang web.</li>
              <li>Công cụ phân tích (Google Analytics) — chỉ khi bạn đồng ý.</li>
              <li>Mạng quảng cáo trong tương lai — chỉ khi bạn đồng ý.</li>
              <li>Cơ quan nhà nước có thẩm quyền khi được yêu cầu theo pháp luật.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">6. Quyền của bạn</h2>
            <p>Theo Nghị định 13/2023/NĐ-CP và các quy định quốc tế, bạn có quyền:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Được biết về việc xử lý dữ liệu cá nhân.</li>
              <li>Đồng ý hoặc không đồng ý cho phép xử lý dữ liệu.</li>
              <li>Truy cập để xem dữ liệu cá nhân của mình.</li>
              <li>Yêu cầu chỉnh sửa hoặc xoá dữ liệu.</li>
              <li>Rút lại sự đồng ý bất kỳ lúc nào.</li>
              <li>Khiếu nại với cơ quan có thẩm quyền.</li>
            </ul>
            <p>Để thực hiện các quyền trên, vui lòng liên hệ chúng tôi qua email: hello@aquamind.vn.</p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">7. Lưu trữ và bảo mật</h2>
            <p>
              Chúng tôi lưu trữ dữ liệu của bạn trên các máy chủ an toàn của Sanity.io và Vercel.
              Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức phù hợp để bảo vệ dữ liệu
              khỏi truy cập trái phép, thay đổi, tiết lộ hoặc phá huỷ.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">8. Thay đổi chính sách</h2>
            <p>
              Chúng tôi có thể cập nhật chính sách này theo thời gian. Mọi thay đổi sẽ được đăng tải
              trên trang này kèm ngày cập nhật. Bạn nên kiểm tra định kỳ để nắm được các cập nhật.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">9. Liên hệ</h2>
            <p>
              Nếu bạn có bất kỳ câu hỏi nào về Chính sách Bảo mật này, vui lòng liên hệ:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email: hello@aquamind.vn</li>
              <li>Trang web: <a href="/contact" className="text-aqua-600 dark:text-aqua-400 hover:underline">aquamind.life/contact</a></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
