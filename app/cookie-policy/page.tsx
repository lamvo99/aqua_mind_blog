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
            Cookie Policy
          </h1>
          <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
            Learn about how we use cookies and similar technologies. Last updated: 27/07/2026.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none dark:prose-invert text-gray-600 dark:text-slate-300 leading-relaxed space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">1. What are cookies?</h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. Cookies
              help the website work more efficiently and provide information to the website owner.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">2. Types of cookies we use</h2>

            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-6">Necessary cookies</h3>
            <p>
              These cookies are essential for the website to function and cannot be turned off in
              our systems. They include cookies that let you log in, remember your cookie choices,
              and maintain your session. You can configure your browser to block these cookies,
              but some parts of the website may not work.
            </p>

            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-6">Analytics cookies</h3>
            <p>
              These cookies allow us to count visits and traffic sources so we can measure and
              improve the performance of our website. They help us know which pages are the most
              popular, how users move around the site, and detect technical issues.
              We use Google Analytics for this purpose.
            </p>
            <p>The analytics cookies we may use include:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>_ga, _gid, _gat</strong> — Google Analytics: user behavior analysis.</li>
              <li>These cookies are only activated after you give consent.</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-6">Advertising cookies</h3>
            <p>
              These cookies are set by advertising partners (when implemented) to show ads that are
              relevant to your interests. They also limit how often you see an ad and measure the
              effectiveness of campaigns. These cookies are only set after you give consent.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">3. How to manage cookies</h2>
            <p>
              On your first visit to AquaMind Blog, you will see a cookie banner that lets you:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Accept all:</strong> Consent to all types of cookies.</li>
              <li><strong>Reject:</strong> Only accept necessary cookies.</li>
              <li><strong>Customize:</strong> Choose which types of cookies you want to allow.</li>
            </ul>
            <p>
              You can change your cookie choices at any time by clicking the
              &ldquo;Cookie Settings&rdquo; link on this page.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">4. Third-party cookies</h2>
            <p>
              Some cookies are set by third-party services that appear on our website:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google Analytics:</strong> Website analytics tool.</li>
              <li><strong>Vercel:</strong> Hosting and content delivery platform.</li>
              <li>Advertising networks (to be updated when implemented).</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">5. Retention period</h2>
            <p>
              Cookies can be session cookies (deleted when you close your browser) or persistent
              cookies (remain on your device for a certain period). The retention period depends on
              the specific cookie, with a maximum of 12 months.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">6. Contact</h2>
            <p>
              If you have questions about our Cookie Policy, please contact us:
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
