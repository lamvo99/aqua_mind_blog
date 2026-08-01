"use client"

import { useState } from "react"
import { useComments } from "@/lib/store"
import { MessageSquare, Send, User } from "lucide-react"
import strings from "@/lib/i18n/strings"

export default function Comments({ postSlug }: { postSlug: string }) {
  const { comments, loading, submitState, addComment } = useComments(postSlug)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [content, setContent] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim() || !content.trim() || submitState === "submitting") return
    const form = e.currentTarget
    const hp = new FormData(form).get("hp_comment")?.toString() || ""
    await addComment(name.trim(), email.trim(), content.trim(), hp)
    setName("")
    setEmail("")
    setContent("")
  }

  return (
    <section className="mt-12">
      <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-slate-100 mb-6">
        <MessageSquare className="w-5 h-5 text-aqua-500" />
        {strings.comments.title} ({comments.length})
      </h3>

      <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
        <div className="absolute opacity-0 top-0 left-0 h-0 overflow-hidden" aria-hidden="true">
          <input type="text" name="hp_comment" tabIndex={-1} autoComplete="off" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="comment-name" className="sr-only">{strings.comments.name}</label>
            <input
              id="comment-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={strings.comments.name}
              required
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-aqua-500/50"
            />
          </div>
          <div>
            <label htmlFor="comment-email" className="sr-only">{strings.comments.email}</label>
            <input
              id="comment-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={strings.comments.email}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-aqua-500/50"
            />
          </div>
        </div>
        <div>
          <label htmlFor="comment-content" className="sr-only">{strings.comments.contentLabel}</label>
          <textarea
            id="comment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={strings.comments.write}
            required
            rows={3}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-aqua-500/50 resize-none mb-3"
          />
        </div>
        {submitState === "pending" && (
          <p className="mb-4 text-sm text-aqua-700 dark:text-aqua-300 bg-aqua-50 dark:bg-aqua-900/30 border border-aqua-100 dark:border-aqua-800 rounded-xl px-4 py-3">
            {strings.comments.pending}
          </p>
        )}
        {submitState === "error" && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-xl px-4 py-3">
            {strings.comments.submitError}
          </p>
        )}
        <button
          type="submit"
          disabled={submitState === "submitting"}
          className="inline-flex items-center gap-2 px-5 py-2.5 gradient-bg text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {strings.comments.submit}
        </button>
      </form>

      <div className="space-y-4">
        {!loading && comments.length === 0 && (
          <p className="text-center text-sm text-gray-500 dark:text-slate-400 py-8">
            {strings.comments.empty}
          </p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
            <div className="w-9 h-9 rounded-full bg-aqua-100 dark:bg-aqua-900 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-aqua-600 dark:text-aqua-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{comment.name}</span>
                {comment.pending && (
                  <span className="text-[10px] uppercase tracking-wide font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-full px-2 py-0.5">
                    {strings.comments.pendingBadge}
                  </span>
                )}
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  {new Date(comment.date).toLocaleDateString("en-US", {
                    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-300">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
