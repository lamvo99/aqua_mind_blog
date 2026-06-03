"use client"

import { useState, useEffect, useCallback } from "react"

// Newsletter
export function useNewsletter() {
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSubscribed(localStorage.getItem("aquamind_newsletter") === "true")
  }, [])

  const subscribe = useCallback(async (email: string) => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    const subs = JSON.parse(localStorage.getItem("aquamind_subscribers") || "[]")
    subs.push({ email, date: new Date().toISOString() })
    localStorage.setItem("aquamind_subscribers", JSON.stringify(subs))
    localStorage.setItem("aquamind_newsletter", "true")
    setSubscribed(true)
    setLoading(false)
  }, [])

  return { subscribed, loading, subscribe }
}

// Comments
export interface Comment {
  id: string
  postSlug: string
  name: string
  email: string
  content: string
  date: string
  avatar: string
}

export function useComments(postSlug: string) {
  const [comments, setComments] = useState<Comment[]>([])

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem("aquamind_comments") || "{}")
    setComments(all[postSlug] || [])
  }, [postSlug])

  const addComment = useCallback(
    (name: string, email: string, content: string) => {
      const all = JSON.parse(localStorage.getItem("aquamind_comments") || "{}")
      const newComment: Comment = {
        id: Date.now().toString(),
        postSlug,
        name,
        email,
        content,
        date: new Date().toISOString(),
        avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(name)}`,
      }
      all[postSlug] = [newComment, ...(all[postSlug] || [])]
      localStorage.setItem("aquamind_comments", JSON.stringify(all))
      setComments(all[postSlug])
    },
    [postSlug]
  )

  return { comments, addComment }
}

// Contact
export function useContact() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const send = useCallback(async (data: { name: string; email: string; subject: string; message: string }) => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    const msgs = JSON.parse(localStorage.getItem("aquamind_messages") || "[]")
    msgs.push({ ...data, date: new Date().toISOString() })
    localStorage.setItem("aquamind_messages", JSON.stringify(msgs))
    setSent(true)
    setLoading(false)
  }, [])

  return { sent, loading, send }
}

// Search
export function useSearch() {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  return { query, setQuery, open, setOpen }
}

// Theme
export function useTheme() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("aquamind_theme")
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev
      document.documentElement.classList.toggle("dark", next)
      localStorage.setItem("aquamind_theme", next ? "dark" : "light")
      return next
    })
  }, [])

  return { dark, toggle }
}
