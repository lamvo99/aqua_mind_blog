"use client"

import { useEffect, useState } from "react"
import { Heart, Bookmark } from "lucide-react"
import strings from "@/lib/i18n/strings"

export default function LikeBookmark({ postSlug }: { postSlug: string }) {
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("aquamind_interactions") || "{}")
    setLiked(!!data[postSlug]?.liked)
    setBookmarked(!!data[postSlug]?.bookmarked)
    const counts = JSON.parse(localStorage.getItem("aquamind_like_counts") || "{}")
    setLikeCount(counts[postSlug] || 0)
  }, [postSlug])

  const toggle = (type: "liked" | "bookmarked") => {
    const data = JSON.parse(localStorage.getItem("aquamind_interactions") || "{}")
    if (!data[postSlug]) data[postSlug] = {}
    data[postSlug][type] = !data[postSlug][type]
    localStorage.setItem("aquamind_interactions", JSON.stringify(data))

    if (type === "liked") {
      const counts = JSON.parse(localStorage.getItem("aquamind_like_counts") || "{}")
      counts[postSlug] = (counts[postSlug] || 0) + (data[postSlug][type] ? 1 : -1)
      localStorage.setItem("aquamind_like_counts", JSON.stringify(counts))
      setLikeCount(counts[postSlug])
      setLiked(data[postSlug][type])
    } else {
      setBookmarked(data[postSlug][type])
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => toggle("liked")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          liked
            ? "bg-coral-50 dark:bg-coral-950/30 text-coral-600 dark:text-coral-400"
            : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700"
        }`}
      >
        <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
        {likeCount > 0 && <span>{likeCount}</span>}
      </button>
      <button
        onClick={() => toggle("bookmarked")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          bookmarked
            ? "bg-aqua-50 dark:bg-aqua-950/30 text-aqua-600 dark:text-aqua-400"
            : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700"
        }`}
      >
        <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? "fill-current" : ""}`} />
        {bookmarked ? strings.post.saved : strings.post.save}
      </button>
    </div>
  )
}
