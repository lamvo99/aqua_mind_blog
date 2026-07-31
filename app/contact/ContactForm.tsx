"use client"

import { useState } from "react"
import { useContact } from "@/lib/store"
import { Mail, MessageSquare, Send, CheckCircle, MapPin, Clock } from "lucide-react"
import strings from "@/lib/i18n/strings"

export default function ContactForm() {
  const { sent, loading, send } = useContact()
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await send(form)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-slate-900">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            {strings.contact.success}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mb-6">
            {strings.contact.thanks}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 gradient-bg text-white font-medium rounded-xl hover:opacity-90 transition-all"
          >
            {strings.contact.send}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-2">
              {strings.contact.title}
            </h1>
            <p className="text-gray-500 dark:text-slate-400">
              {strings.contact.desc}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="contact-name" className="sr-only">{strings.contact.name}</label>
                  <input
                    id="contact-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={strings.contact.name}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500/50"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="sr-only">{strings.contact.email}</label>
                  <input
                    id="contact-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder={strings.contact.email}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500/50"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="contact-subject" className="sr-only">{strings.contact.subject}</label>
                <input
                  id="contact-subject"
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder={strings.contact.subject}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500/50"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="contact-message" className="sr-only">{strings.contact.message}</label>
                <textarea
                  id="contact-message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder={strings.contact.message}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-aqua-500/50 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 gradient-bg text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {strings.contact.send}
              </button>
            </form>

            <div className="space-y-4">
              <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                <Mail className="w-5 h-5 text-aqua-500 mb-2" />
                <h4 className="font-semibold text-sm text-gray-900 dark:text-slate-100 mb-1">Email</h4>
                <p className="text-sm text-gray-500 dark:text-slate-400">hello@aquamind.vn</p>
              </div>
              <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                <MapPin className="w-5 h-5 text-aqua-500 mb-2" />
                <h4 className="font-semibold text-sm text-gray-900 dark:text-slate-100 mb-1">{strings.contact.info}</h4>
                <p className="text-sm text-gray-500 dark:text-slate-400">{strings.contact.address}</p>
              </div>
              <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                <Clock className="w-5 h-5 text-aqua-500 mb-2" />
                <h4 className="font-semibold text-sm text-gray-900 dark:text-slate-100 mb-1">{strings.contact.info}</h4>
                <p className="text-sm text-gray-500 dark:text-slate-400">{strings.contact.responseTime}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
