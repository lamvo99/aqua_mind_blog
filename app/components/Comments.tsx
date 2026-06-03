"use client"

import { useState } from "react"
import { useComments } from "@/lib/store"
import { MessageSquare, Send, User } from "lucide-react"

export default function Comments({ postSlug }: { postSlug: string }) {
  const { comments, addComment } = useComments(postSlug)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [content, setContent] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !content.trim()) return
    addComment(name.trim(), email.trim(), content.trim())
    setName("")
    setEmail("")
    setContent("")
  }

  return (
    <section className="mt-12">
      <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-slate-100 mb-6">
        <MessageSquare className="w-5 h-5 text-aqua-500" />
        Bình luận ({comments.length})
      </h3>

      <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên của bạn *"
            required
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-aqua-500/50"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (không bắt buộc)"
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-aqua-500/50"
          />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Viết bình luận..."
          required
          rows={3}
          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-aqua-500/50 resize-none mb-3"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2.5 gradient-bg text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all"
        >
          <Send className="w-4 h-4" />
          Gửi bình luận
        </button>
      </form>

      <div className="space-y-4">
        {comments.length === 0 && (
          <p className="text-center text-sm text-gray-400 dark:text-slate-500 py-8">
            Chưa có bình luận nào. Hãy là người đầu tiên!
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
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  {new Date(comment.date).toLocaleDateString("vi-VN", {
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
