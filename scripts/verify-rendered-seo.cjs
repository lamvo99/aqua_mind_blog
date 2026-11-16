#!/usr/bin/env node
/**
 * Rendered-SEO verification against a running production build.
 *
 * Prerequisites:
 *   npm run build
 *   npx next start -p 3106      (or set SEO_BASE_URL)
 *
 * Usage:
 *   node scripts/verify-rendered-seo.cjs
 *   SEO_BASE_URL=https://preview.example.com node scripts/verify-rendered-seo.cjs
 */
const BASE = process.env.SEO_BASE_URL || "http://localhost:3106"

const failures = []
function check(name, condition, detail) {
  if (!condition) failures.push({ name, detail })
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${condition ? "" : `  -> ${detail}`}`)
}

function titleOf(html) {
  return html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? ""
}
function metaName(html, name) {
  return html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)`, "i"))?.[1] ?? null
}
function canonicalOf(html) {
  return html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)/i)?.[1] ?? null
}
function decode(s) {
  return s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"')
}

async function get(path) {
  const res = await fetch(BASE + path, { redirect: "manual", signal: AbortSignal.timeout(60000) })
  return { status: res.status, html: await res.text() }
}

async function main() {
  // 1. Rendered titles: brand exactly once.
  const titleRoutes = ["/", "/wiki", "/tools", "/finder", "/learn", "/category/beginner-guides", "/setup-planner"]
  for (const path of titleRoutes) {
    const { status, html } = await get(path)
    const title = decode(titleOf(html))
    const brandCount = (title.match(/AquaMind/g) || []).length
    check(`title ${path} status 200`, status === 200, `status ${status}`)
    check(`title ${path} brand exactly once`, brandCount === 1, `"${title}" (count ${brandCount})`)
    check(`title ${path} has brand suffix`, /\| AquaMind( Blog)?$/.test(title), `"${title}"`)
  }

  // 2. Route metadata for the SEO remediation cases.
  const cases = [
    {
      path: "/posts/different-types-of-aquarium-filters-pros-and-cons",
      name: "valid post",
      robots: "index, follow",
      canonical: "https://www.aquamind.life/posts/different-types-of-aquarium-filters-pros-and-cons",
      expectArticles: true,
    },
    { path: "/posts/zz-missing-seo-check", name: "unknown post", robots: "noindex, follow", canonical: "https://www.aquamind.life/posts", expectArticles: false },
    { path: "/posts/nano-iwagumi-aquascape", name: "draft post", robots: "noindex, follow", canonical: "https://www.aquamind.life/posts", expectArticles: false },
    { path: "/posts?page=2", name: "page 2", robots: "noindex, follow", canonical: "https://www.aquamind.life/posts", expectArticles: true },
    { path: "/posts?page=99", name: "page 99", robots: "noindex", canonical: "https://www.aquamind.life/posts", expectArticles: false },
  ]

  for (const c of cases) {
    const { status, html } = await get(c.path)
    const robots = metaName(html, "robots")
    const canonical = canonicalOf(html)
    check(`${c.name} status 200`, status === 200, `status ${status}`)
    check(`${c.name} robots`, robots === c.robots, `got "${robots}"`)
    check(`${c.name} canonical`, canonical === c.canonical, `got "${canonical}"`)
    if (!c.expectArticles) {
      const articleLinks = [...html.matchAll(/href="\/posts\/[a-z0-9-]{3,}"/g)].length
      check(`${c.name} renders no article cards`, articleLinks === 0, `${articleLinks} article links`)
    }
  }

  // 3. Out-of-range pagination must not render a misleading page title.
  const page99 = titleOf((await get("/posts?page=99")).html)
  check("page 99 title has no page number", !/Page\s*99/.test(page99), `"${page99}"`)

  // 4. Sitemap URL validity.
  const sm = await fetch(BASE + "/sitemap.xml", { signal: AbortSignal.timeout(60000) }).then((r) => r.text())
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  const invalid = locs.filter((u) => !/^https:\/\/www\.aquamind\.life(\/[^\s]*)?$/.test(u))
  check("sitemap has URLs", locs.length > 0, "0 URLs")
  check("sitemap all locs are absolute https without spaces", invalid.length === 0, invalid.join(", "))
  check("sitemap has 5 learn URLs", locs.filter((u) => u.includes("/learn")).length === 5, String(locs.filter((u) => u.includes("/learn")).length))

  console.log(`\n${failures.length === 0 ? "ALL CHECKS PASSED" : `${failures.length} CHECK(S) FAILED`}`)
  if (failures.length) {
    for (const f of failures) console.log(` - ${f.name}: ${f.detail}`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error("verification error:", error)
  process.exit(1)
})
