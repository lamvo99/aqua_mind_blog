import Breadcrumb from "@/app/components/Breadcrumb"
import { FileText } from "lucide-react"
import strings from "@/lib/i18n/strings"

export default function TermsOfServicePage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-aqua-50 to-ocean-50 dark:from-slate-900 dark:to-slate-800 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6 flex justify-center">
            <Breadcrumb items={[{ label: strings.legal.termsTitle }]} />
          </div>
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-4">
            Điều khoản Sử dụng
          </h1>
          <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
            Quy định và điều kiện khi sử dụng trang web AquaMind Blog. Cập nhật lần cuối: 27/07/2026.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none dark:prose-invert text-gray-600 dark:text-slate-300 leading-relaxed space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">1. Chấp nhận điều khoản</h2>
            <p>
              Bằng việc truy cập và sử dụng AquaMind Blog (aquamind.life), bạn đồng ý tuân thủ
              các Điều khoản Sử dụng này. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng
              không sử dụng trang web của chúng tôi.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">2. Nội dung và bản quyền</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Tất cả nội dung trên AquaMind Blog (bài viết, hình ảnh, đồ hoạ) thuộc sở hữu của chúng tôi hoặc được sử dụng với sự cho phép.</li>
              <li>Bạn có thể chia sẻ nội dung qua các nút chia sẻ xã hội với điều kiện ghi rõ nguồn gốc.</li>
              <li>Không được sao chép, phân phối, sửa đổi nội dung mà không có sự đồng ý trước bằng văn bản.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">3. Hành vi người dùng</h2>
            <p>Khi sử dụng trang web, bạn đồng ý không:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Đăng tải nội dung bất hợp pháp, xúc phạm, đe doạ hoặc vi phạm quyền của người khác.</li>
              <li>Gửi spam, quảng cáo trái phép hoặc nội dung không liên quan qua form bình luận hoặc liên hệ.</li>
              <li>Can thiệp vào hoạt động của trang web, bao gồm tấn công DDoS, khai thác lỗ hổng bảo mật.</li>
              <li>Sử dụng bot, crawler hoặc công cụ tự động để truy cập nội dung mà không có sự cho phép.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">4. Bình luận và tương tác</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Bạn chịu trách nhiệm về nội dung bình luận của mình.</li>
              <li>Chúng tôi có quyền xoá bất kỳ bình luận nào vi phạm điều khoản mà không cần thông báo trước.</li>
              <li>Chúng tôi không chịu trách nhiệm về nội dung do người dùng tạo ra.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">5. Tài khoản và bảo mật</h2>
            <p>
              Một số tính năng có thể yêu cầu bạn cung cấp thông tin cá nhân (email, tên). Bạn có
              trách nhiệm giữ bảo mật thông tin của mình. Chúng tôi không chịu trách nhiệm cho
              các thiệt hại phát sinh từ việc sử dụng trái phép tài khoản của bạn.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">6. Liên kết đến bên thứ ba</h2>
            <p>
              Trang web của chúng tôi có thể chứa liên kết đến các trang web bên thứ ba. Chúng tôi
              không kiểm soát và không chịu trách nhiệm về nội dung, chính sách bảo mật hoặc thực
              tiễn của các trang web đó.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">7. Từ chối bảo đảm</h2>
            <p>
              Nội dung trên AquaMind Blog được cung cấp "như hiện trạng" chỉ cho mục đích thông tin
              và giáo dục. Chúng tôi không đảm bảo tính chính xác, đầy đủ hoặc cập nhật của nội dung.
              Việc áp dụng kiến thức từ trang web là hoàn toàn tự nguyện và chịu trách nhiệm cá nhân.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">8. Giới hạn trách nhiệm</h2>
            <p>
              Trong phạm vi tối đa được pháp luật cho phép, AquaMind Blog không chịu trách nhiệm
              cho bất kỳ thiệt hại trực tiếp, gián tiếp, ngẫu nhiên hoặc do hậu quả nào phát sinh
              từ việc sử dụng hoặc không thể sử dụng trang web.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">9. Thay đổi điều khoản</h2>
            <p>
              Chúng tôi có thể sửa đổi các điều khoản này bất kỳ lúc nào. Tiếp tục sử dụng trang web
              sau khi thay đổi đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">10. Liên hệ</h2>
            <p>
              Nếu bạn có thắc mắc về Điều khoản Sử dụng, vui lòng liên hệ qua email: hello@aquamind.vn
              hoặc qua trang <a href="/contact" className="text-aqua-600 dark:text-aqua-400 hover:underline">Liên hệ</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
