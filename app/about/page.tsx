import Link from "next/link"
import Breadcrumb from "@/app/components/Breadcrumb"
import { Droplets, Leaf, Fish, FlaskConical, ArrowRight } from "lucide-react"
import strings from "@/lib/i18n/strings"

const values = [
  {
    icon: Leaf,
    title: "Aquascaping",
    desc: "Nghệ thuật tạo cảnh thuỷ sinh - từ phong cách Nature Aquarium đến Iwagumi, Dutch, và Jungle.",
  },
  {
    icon: Fish,
    title: "Cá cảnh",
    desc: "Hướng dẫn chăm sóc cá cảnh chi tiết, từ cá neon, cá bảy màu đến cá dĩa và cá rồng.",
  },
  {
    icon: FlaskConical,
    title: "Hoá chất nước",
    desc: "Kiến thức về thông số nước, phân bón, CO2 và hệ thống lọc cho hồ thuỷ sinh.",
  },
  {
    icon: Droplets,
    title: "Thiết bị",
    desc: "Đánh giá và hướng dẫn chọn đèn, lọc, CO2, phân nền và các thiết bị thuỷ sinh khác.",
  },
]

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-aqua-50 to-ocean-50 dark:from-slate-900 dark:to-slate-800 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6 flex justify-center">
            <Breadcrumb items={[{ label: strings.nav.about }]} />
          </div>
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-4">
            {strings.about.title}
          </h1>
          <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
            {strings.about.desc}
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Sứ mệnh của chúng tôi</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              AquaMind Blog ra đời với sứ mệnh trở thành nguồn tài nguyên hàng đầu về thuỷ sinh cho cộng đồng
              người yêu aquascaping tại Việt Nam. Chúng tôi tin rằng ai cũng có thể tạo ra một hồ thuỷ sinh đẹp,
              và kiến thức đúng đắn là chìa khoá để biến điều đó thành hiện thực.
            </p>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
              Dù bạn là người mới bắt đầu hay đã có kinh nghiệm, AquaMind Blog luôn mang đến những bài viết
              chất lượng, được nghiên cứu kỹ lưỡng, giúp bạn hiểu sâu hơn về thế giới thuỷ sinh đầy mê hoặc.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-20 bg-gray-50/50 dark:bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
              Lĩnh vực của chúng tôi
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mt-2">Kiến thức chuyên sâu về mọi khía cạnh của thuỷ sinh</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((item) => (
              <div key={item.title} className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 card-hover">
                <div className="w-12 h-12 rounded-xl bg-aqua-50 dark:bg-aqua-950/50 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-aqua-600 dark:text-aqua-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">
            Bắt đầu hành trình thuỷ sinh của bạn
          </h2>
          <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-lg mx-auto">
            Khám phá kho tàng kiến thức thuỷ sinh và bắt đầu tạo nên hồ cá trong mơ của bạn.
          </p>
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 px-6 py-3 gradient-bg text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-aqua-500/25"
          >
            Khám phá bài viết
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
