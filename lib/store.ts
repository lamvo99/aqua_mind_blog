"use client"

import { useState, useEffect, useCallback } from "react"

// Newsletter
export function useNewsletter() {
  const [status, setStatus] = useState<"idle" | "pending" | "subscribed" | "error">("idle")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const s = localStorage.getItem("aquamind_newsletter")
    if (s === "confirmed" || s === "true") setStatus("subscribed")
    else if (s === "pending") setStatus("pending")
    if (window.location.search.includes("newsletter=confirmed")) {
      localStorage.setItem("aquamind_newsletter", "confirmed")
      setStatus("subscribed")
      const url = new URL(window.location.href)
      url.searchParams.delete("newsletter")
      window.history.replaceState({}, "", url.toString())
    }
  }, [])

  const subscribe = useCallback(async (email: string) => {
    setLoading(true)
    setStatus("idle")
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      if (data.confirmed) {
        localStorage.setItem("aquamind_newsletter", "confirmed")
        setStatus("subscribed")
      } else {
        localStorage.setItem("aquamind_newsletter", "pending")
        setStatus("pending")
      }
    } catch {
      setStatus("error")
    }
    setLoading(false)
  }, [])

  return { status, loading, subscribe }
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
  pending?: boolean
}

export function useComments(postSlug: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "pending" | "error">("idle")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const readLocal = (): Comment[] => {
      try {
        return JSON.parse(localStorage.getItem("aquamind_comments") || "{}")[postSlug] || []
      } catch {
        return []
      }
    }
    const load = async () => {
      const local = readLocal()
      try {
        const res = await fetch(`/api/comments?post=${encodeURIComponent(postSlug)}`, { cache: "no-store" })
        const data = res.ok ? await res.json() : { comments: [] }
        const approved: Comment[] = (data.comments || []).map((c: any) => ({
          id: c._id,
          postSlug,
          name: c.name,
          email: "",
          content: c.content,
          date: c._createdAt,
          avatar: "",
        }))
        // Re-read localStorage at resolve time so comments submitted while
        // this request was in flight are not overwritten
        if (!cancelled) setComments([...readLocal(), ...approved])
      } catch {
        if (!cancelled) setComments(readLocal())
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [postSlug])

  const addComment = useCallback(
    async (name: string, email: string, content: string, hp: string) => {
      setSubmitState("submitting")
      try {
        const res = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postSlug, name, email, content, hp_comment: hp }),
        })
        if (!res.ok) throw new Error("Failed")
        setSubmitState("pending")
      } catch {
        setSubmitState("error")
      }
      const all = JSON.parse(localStorage.getItem("aquamind_comments") || "{}")
      const newComment: Comment = {
        id: Date.now().toString(),
        postSlug,
        name,
        email,
        content,
        date: new Date().toISOString(),
        avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(name)}`,
        pending: true,
      }
      all[postSlug] = [newComment, ...(all[postSlug] || [])]
      localStorage.setItem("aquamind_comments", JSON.stringify(all))
      setComments((prev) => [newComment, ...prev])
    },
    [postSlug]
  )

  return { comments, loading, submitState, addComment }
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
