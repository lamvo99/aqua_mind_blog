import type { Metadata } from "next"
import ContactForm from "./ContactForm"

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the AquaMind team — questions, suggestions or feedback about our aquascaping guides and tools.",
  alternates: { canonical: "https://aquamind.life/contact" },
  openGraph: {
    title: "Contact",
    description: "Get in touch with the AquaMind team — questions, suggestions or feedback about our aquascaping guides and tools.",
    type: "website",
    locale: "en_US",
  },
}

export default function ContactPage() {
  return <ContactForm />
}
