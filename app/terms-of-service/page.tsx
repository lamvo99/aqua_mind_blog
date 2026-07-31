import Breadcrumb from "@/app/components/Breadcrumb"
import { FileText } from "lucide-react"
import strings from "@/lib/i18n/strings"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions for using AquaMind — content use, disclaimers and liability for aquarium advice.",
  alternates: { canonical: "https://aquamind.life/terms-of-service" },
}

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
            Terms of Service
          </h1>
          <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
            The rules and conditions for using the AquaMind Blog website. Last updated: 27/07/2026.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none dark:prose-invert text-gray-600 dark:text-slate-300 leading-relaxed space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">1. Acceptance of terms</h2>
            <p>
              By accessing and using AquaMind Blog (aquamind.life), you agree to comply with these
              Terms of Service. If you do not agree with any part of these terms, please do not use
              our website.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">2. Content and copyright</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All content on AquaMind Blog (articles, images, graphics) is owned by us or used with permission.</li>
              <li>You may share content through social sharing buttons provided you credit the source.</li>
              <li>You may not copy, distribute or modify content without prior written consent.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">3. User conduct</h2>
            <p>When using the website, you agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Post unlawful, offensive, threatening content or content that violates the rights of others.</li>
              <li>Send spam, unauthorized advertising or irrelevant content through comment or contact forms.</li>
              <li>Interfere with the operation of the website, including DDoS attacks or exploiting security vulnerabilities.</li>
              <li>Use bots, crawlers or automated tools to access content without permission.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">4. Comments and interactions</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are responsible for the content of your comments.</li>
              <li>We reserve the right to remove any comment that violates these terms without prior notice.</li>
              <li>We are not responsible for user-generated content.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">5. Accounts and security</h2>
            <p>
              Some features may require you to provide personal information (email, name). You are
              responsible for keeping your information secure. We are not liable for damages arising
              from unauthorized use of your account.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">6. Third-party links</h2>
            <p>
              Our website may contain links to third-party websites. We do not control and are not
              responsible for the content, privacy policies or practices of those websites.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">7. Disclaimer of warranties</h2>
            <p>
              Content on AquaMind Blog is provided "as is" for informational and educational purposes
              only. We do not guarantee the accuracy, completeness or timeliness of the content.
              Applying knowledge from this website is entirely voluntary and at your own responsibility.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">8. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, AquaMind Blog shall not be liable for any
              direct, indirect, incidental or consequential damages arising from the use or inability
              to use the website.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">9. Changes to these terms</h2>
            <p>
              We may modify these terms at any time. Continued use of the website after changes are
              made constitutes acceptance of the new terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">10. Contact</h2>
            <p>
              If you have questions about these Terms of Service, please contact us by email: xingzhuang5201314@gmail.com
              or through the <a href="/contact" className="text-aqua-600 dark:text-aqua-400 hover:underline">Contact page</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
