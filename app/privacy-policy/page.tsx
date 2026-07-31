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
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
            Our commitment to protecting your personal data. Last updated: 27/07/2026.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none dark:prose-invert text-gray-600 dark:text-slate-300 leading-relaxed space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">1. Introduction</h2>
            <p>
              AquaMind Blog ("we", "us", "our") is committed to protecting your privacy. This Privacy
              Policy explains how we collect, use, store and protect your personal information when
              you visit and use the website aquamind.life.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">2. Information we collect</h2>
            <p>We may collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Information you provide:</strong> Your name and email address when you subscribe to the newsletter, leave a comment or contact us through a form.</li>
              <li><strong>Information collected automatically:</strong> IP address, browser type, operating system, referring website, time of visit and browsing behavior through cookies and similar technologies.</li>
              <li><strong>Cookies:</strong> See our <a href="/cookie-policy" className="text-aqua-600 dark:text-aqua-400 hover:underline">Cookie Policy</a> for details.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">3. How we use your information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Operate and improve the website.</li>
              <li>Send newsletters and new article updates (when you have subscribed).</li>
              <li>Respond to your questions and support requests.</li>
              <li>Analyze usage trends to improve content and user experience.</li>
              <li>Display relevant advertising (if introduced in the future).</li>
              <li>Comply with legal obligations.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">4. Legal basis</h2>
            <p>
              Our collection and processing of personal data complies with Decree 13/2023/NĐ-CP of
              the Government of Vietnam on personal data protection. For international users, we
              also respect privacy rights under the laws applicable in your country.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">5. Sharing of information</h2>
            <p>
              We do not sell your personal information to third parties. We may share information with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Service providers (Vercel, Sanity.io) needed to operate the website.</li>
              <li>Analytics tools (Google Analytics) — only with your consent.</li>
              <li>Advertising networks in the future — only with your consent.</li>
              <li>Competent authorities when required by law.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">6. Your rights</h2>
            <p>Under Decree 13/2023/NĐ-CP and applicable international regulations, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Be informed about how your personal data is processed.</li>
              <li>Consent or refuse consent to data processing.</li>
              <li>Access your personal data.</li>
              <li>Request correction or deletion of your data.</li>
              <li>Withdraw your consent at any time.</li>
              <li>Lodge a complaint with the competent authority.</li>
            </ul>
            <p>To exercise these rights, please contact us by email: xingzhuang5201314@gmail.com.</p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">7. Storage and security</h2>
            <p>
              We store your data on secure servers managed by Sanity.io and Vercel. We apply
              appropriate technical and organizational measures to protect data from unauthorized
              access, alteration, disclosure or destruction.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">8. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. Any changes will be posted on this page
              with an updated date. Please check this page periodically to stay informed.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">9. Contact</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email: xingzhuang5201314@gmail.com</li>
              <li>Website: <a href="/contact" className="text-aqua-600 dark:text-aqua-400 hover:underline">aquamind.life/contact</a></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
