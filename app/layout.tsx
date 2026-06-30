import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import Navbar from "./components/navbar"
import Footer from "./components/footer"
import BackToTop from "./components/BackToTop"
import { JsonLd, websiteSchema } from "@/lib/seo/jsonld"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aquamind.life"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AquaMind Blog - Khám phá thế giới thuỷ sinh",
    template: "%s | AquaMind Blog",
  },
  description: "Blog hàng đầu về thuỷ sinh, aquascaping, cây thuỷ sinh và cá cảnh. Kiến thức chuyên sâu cho người yêu thuỷ sinh.",
  keywords: ["thuỷ sinh", "aquascaping", "cá cảnh", "cây thuỷ sinh", "hồ cá", "aquarium"],
  openGraph: {
    title: "AquaMind Blog",
    description: "Khám phá thế giới thuỷ sinh đầy mê hoặc",
    siteName: "AquaMind Blog",
    type: "website",
    locale: "vi_VN",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image", title: "AquaMind Blog", description: "Khám phá thế giới thuỷ sinh đầy mê hoặc" },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen flex flex-col bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 transition-colors">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <BackToTop />
        <JsonLd data={websiteSchema()} />
      </body>
    </html>
  )
}
