import { describe, it, expect, vi, beforeEach } from "vitest"

// Data layer is mocked; the route modules themselves (metadata + control flow)
// are exercised for real.
vi.mock("@/lib/posts", () => ({
  getPostBySlug: vi.fn(),
  getAllPosts: vi.fn(),
  getAllCategories: vi.fn(),
}))
vi.mock("@/lib/hubs", () => ({
  getHubLinksForPost: vi.fn().mockResolvedValue([]),
}))
vi.mock("@/lib/sanity", () => ({
  client: { fetch: vi.fn().mockResolvedValue([]) },
  urlFor: vi.fn(() => ({ width: () => ({ url: () => "https://cdn.sanity.io/image.jpg" }) })),
}))
vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("next/navigation")
  return {
    ...actual,
    notFound: vi.fn(() => {
      const error = new Error("NEXT_HTTP_ERROR_FALLBACK;404")
      ;(error as any).digest = "NEXT_HTTP_ERROR_FALLBACK;404"
      throw error
    }),
  }
})

import { generateMetadata as postMetadata, default as PostPage } from "@/app/posts/[slug]/page"
import { generateMetadata as postsMetadata, default as PostsPage } from "@/app/posts/page"
import { getPostBySlug, getAllPosts, getAllCategories } from "@/lib/posts"
import { notFound } from "next/navigation"

const validPost = {
  _id: "post-1",
  title: "Fallback title",
  slug: { current: "valid-post" },
  excerpt: "Fallback excerpt",
  publishedAt: "2026-01-01T00:00:00Z",
  seo: { metaTitle: "Authored title", metaDescription: "Authored description" },
  mainImage: null,
  body: [{ _type: "block", style: "normal", children: [{ _type: "span", text: "Body" }] }],
  author: { name: "Author" },
  categories: [],
}

const manyPosts = Array.from({ length: 36 }, (_, i) => ({
  _id: `p${i}`,
  title: `Post ${i}`,
  slug: { current: `post-${i}` },
  publishedAt: "2026-01-01T00:00:00Z",
}))

function params(slug: string) {
  return Promise.resolve({ slug })
}
function query(q: Record<string, string | string[] | undefined>) {
  return Promise.resolve(q)
}

beforeEach(() => {
  vi.mocked(notFound).mockClear()
  vi.mocked(getPostBySlug).mockReset()
  vi.mocked(getAllPosts).mockResolvedValue(manyPosts as any)
  vi.mocked(getAllCategories).mockResolvedValue([] as any)
})

describe("post detail route metadata", () => {
  it("valid published post: self-canonical, indexable, authored SEO", async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(validPost as any)
    const meta: any = await postMetadata({ params: params("valid-post") } as any)
    expect(meta.robots).toBeUndefined() // inherits index, follow from the layout
    expect(meta.alternates.canonical).toBe("https://www.aquamind.life/posts/valid-post")
    expect(meta.title).toBe("Authored title")
    expect(meta.description).toBe("Authored description")
    expect(meta.openGraph.title).toBe("Authored title")
    expect(meta.twitter.title).toBe("Authored title")
  })

  it("unknown post: noindex, canonical /posts, no self-canonical", async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(null as any)
    const meta: any = await postMetadata({ params: params("zz-missing") } as any)
    expect(meta.robots).toEqual({ index: false, follow: true })
    expect(meta.alternates.canonical).toBe("https://www.aquamind.life/posts")
    expect(meta.title).toBe("Article not found")
  })

  it("draft-only post behaves like a missing post (published perspective)", async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(null as any)
    const meta: any = await postMetadata({ params: params("nano-iwagumi-aquascape") } as any)
    expect(meta.robots).toEqual({ index: false, follow: true })
    expect(meta.alternates.canonical).toBe("https://www.aquamind.life/posts")
  })

  it("unknown post page triggers the framework not-found flow", async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(null as any)
    await expect(PostPage({ params: params("zz-missing") } as any)).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/)
    expect(notFound).toHaveBeenCalled()
  })

  it("valid post page renders without invoking not-found", async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(validPost as any)
    const element = await PostPage({ params: params("valid-post") } as any)
    expect(element).toBeTruthy()
    expect(notFound).not.toHaveBeenCalled()
  })
})

describe("posts listing route metadata", () => {
  it("page 1 stays indexable with canonical /posts", async () => {
    const meta: any = await postsMetadata({ searchParams: query({}) } as any)
    expect(meta.robots).toBeUndefined()
    expect(meta.alternates.canonical).toBe("https://www.aquamind.life/posts")
    expect(meta.title).toBe("All Articles")
  })

  it("page 2 is noindex with canonical /posts", async () => {
    const meta: any = await postsMetadata({ searchParams: query({ page: "2" }) } as any)
    expect(meta.robots).toEqual({ index: false, follow: true })
    expect(meta.alternates.canonical).toBe("https://www.aquamind.life/posts")
    expect(meta.title).toContain("Page 2")
  })

  it("page 99 has no misleading page title and is noindex", async () => {
    const meta: any = await postsMetadata({ searchParams: query({ page: "99" }) } as any)
    expect(meta.title).toBe("All Articles")
    expect(meta.title).not.toContain("99")
    expect(meta.robots).toEqual({ index: false, follow: true })
    expect(meta.alternates.canonical).toBe("https://www.aquamind.life/posts")
  })

  it("page 99 triggers the framework not-found flow", async () => {
    await expect(PostsPage({ searchParams: query({ page: "99" }) } as any)).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/)
    expect(notFound).toHaveBeenCalled()
  })

  it("valid page 2 renders without invoking not-found", async () => {
    const element = await PostsPage({ searchParams: query({ page: "2" }) } as any)
    expect(element).toBeTruthy()
    expect(notFound).not.toHaveBeenCalled()
  })

  it("invalid page values fall back to page 1 without not-found", async () => {
    for (const value of ["0", "-1", "1.5", "abc"]) {
      vi.mocked(notFound).mockClear()
      await PostsPage({ searchParams: query({ page: value }) } as any)
      expect(notFound).not.toHaveBeenCalled()
    }
  })
})
