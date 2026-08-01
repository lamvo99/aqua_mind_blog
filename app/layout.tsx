import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import Navbar from "./components/navbar"
import Footer from "./components/footer"
import BackToTop from "./components/BackToTop"
import RegisterSW from "./components/RegisterSW"
import CookieConsentBanner from "./components/CookieConsentBanner"
import CookieSettings from "./components/CookieSettings"
import { JsonLd, websiteSchema, organizationSchema } from "@/lib/seo/jsonld"
import strings from "@/lib/i18n/strings"
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
    default: `${strings.site.name} - ${strings.site.tagline}`,
    template: "%s | AquaMind Blog",
  },
  description: strings.site.description,
  keywords: ["aquascaping", "aquarium", "fishkeeping", "aquatic plants", "aquarium guide", "planted tank"],
  openGraph: {
    title: strings.site.name,
    description: strings.site.description,
    siteName: "AquaMind Blog",
    type: "website",
    locale: "en_US",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image", title: strings.site.name, description: strings.site.description },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen flex flex-col bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 transition-colors">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <BackToTop />
        <CookieConsentBanner />
        <CookieSettings />
        <JsonLd data={websiteSchema()} />
        <JsonLd data={organizationSchema()} />
        <RegisterSW />
      </body>
    </html>
  )
}
