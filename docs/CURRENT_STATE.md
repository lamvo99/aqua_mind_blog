# CURRENT_STATE.md — AquaMind Blog

Read-only audit of the codebase as of 2026-07-31. All data verified against the live Sanity dataset (`production`, project `zeohjejw`).

---

## 1. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15.5.22 (App Router), React 19.2.7, TypeScript 5.9.3 | Metadata API, next/font, next/image used heavily |
| CMS | Sanity 3.80.0 | Studio at `/studio` (structure + vision + code-input plugins); embedded in the Next app |
| Sanity clients | `@sanity/client` 7.22.1 (all data fetches, `useCdn: true`, apiVersion `2023-05-03`) | `next-sanity` 9.12.3 + `sanity/lib/client.ts` + `sanity/lib/live.ts` exist but are **unused by any page** (dead wrapper) |
| Styling | Tailwind CSS 3.4.0 + `@tailwindcss/postcss` 4.3.0 | **Version mismatch**: v3 config-based with the v4 PostCSS plugin; custom `aqua`/`ocean`/`coral` palettes, `darkMode: 'class'`, `float` + `shimmer` animations |
| Fonts | `next/font/google`: Inter (sans) + Playfair_Display (display), self-hosted | |
| Icons | lucide-react | |
| Unused deps | `styled-components`, `pdfkit` | Present in package.json, **not imported anywhere** (legacy) |
| Config | `next.config.js`: `images.remotePatterns = [cdn.sanity.io]`, `typescript.ignoreBuildErrors: true` | No redirects/rewrites/headers; **no vercel.json** (deploy = git push main → Vercel) |
| Env vars | `NEXT_PUBLIC_SANITY_PROJECT_ID/DATASET/API_VERSION`, `SANITY_API_TOKEN`, `NEXT_PUBLIC_SITE_URL` (default `https://aquamind.life`), `NEXT_PUBLIC_LEAD_MAGNET_URL`, `STUDIO_USERNAME/PASSWORD` | No `.env.example` in repo |
| Tooling | `npm run build` PASSES (Next compiled ~41s); `npm run lint` **fails in this environment** (eslint module-resolution error — environment issue, not code) | |

## 2. Route Map

Legend: **SSR** = `export const dynamic = "force-dynamic"` (rendered per request, no caching); **Static** = no data fetch / build-time.

### Public pages
| Route | Mode | Data source |
|---|---|---|
| `/` | SSR | Sanity (featured posts, all posts, categories) |
| `/start-here` | Static | hardcoded learning path |
| `/posts` (+ `?category=`) | SSR | Sanity (`getAllPosts` / `getPostsByCategory`) |
| `/posts/[slug]` | SSR | Sanity (`getPostBySlug`); **has `generateStaticParams` but it is inert** |
| `/species`, `/plants`, `/corals`, `/equipment` | SSR | Sanity (`getDatabaseList`) |
| `/species/[slug]`, `/plants/[slug]`, `/corals/[slug]`, `/equipment/[slug]` | SSR | Sanity (`getDatabaseItem`); inert `generateStaticParams` |
| `/problems` | SSR | Sanity (`getProblemsList`) |
| `/problems/[slug]` | SSR | Sanity (direct `client.fetch`); **no** `generateStaticParams` |
| `/inspiration` | SSR | Sanity (`getInspirationList`) |
| `/inspiration/[slug]` | SSR | Sanity (direct `client.fetch`); **no** `generateStaticParams` |
| `/database` | Static | nav hub |
| `/tools` | Static | nav hub (9 tool cards) |
| `/setup-planner` | Static | `SetupPlanner` component |
| `/tools/aquarium-volume`, `/tools/water-change`, `/tools/co2`, `/tools/dosing`, `/tools/pump-flow`, `/tools/salt-mixing`, `/tools/lighting`, `/tools/stocking` | Static | hardcoded pages (`CalculatorLayout` + calculator component) |
| `/search` | Static shell | client-side `SearchClient` (Groq prefix match) |
| `/about`, `/contact` | Static | — |
| `/privacy-policy`, `/terms-of-service`, `/cookie-policy` | Static | — |
| `/not-found`, `/loading` | Static | special files |

### Non-page routes
| Route | Purpose |
|---|---|
| `/studio/[[...tool]]` | Sanity Studio (SSR) |
| `/api/newsletter` (POST) | Mock double opt-in: validates email, returns a token (dev only); **stores nothing server-side** |
| `/api/newsletter/confirm` (GET) | Decodes token → redirects to `/?newsletter=confirmed`; **stores nothing server-side** |
| `/api/categories` (GET) | Categories with post counts; `Cache-Control: public, max-age=3600` |
| `/feed.xml` | RSS 2.0 of posts |
| `/sitemap.xml` | **Only**: home, `/posts`, `/about`, `/contact` + post pages — DB/tools/inspiration/problems URLs missing |
| `/robots.txt` | Allow all, disallow `/studio`, sitemap ref |

## 3. Component Inventory (31 files)

### `app/components/` — shared (17)
| Component | Type | Role |
|---|---|---|
| `navbar.tsx` | client | Sticky nav: logo, DB dropdown, Ctrl+K search modal, theme toggle, mobile menu |
| `footer.tsx` | client | 4-col footer, newsletter form, categories fetched from `/api/categories` |
| `SearchModal.tsx` | client | Modal search — **posts only** (limit 6), 300ms debounce |
| `PostCard.tsx` | server | Post card with image/categories/reading time/author |
| `PortableText.tsx` | server | Custom PT renderer: h2/h3 with auto-ids (TOC anchors), lists, images, code blocks, blockquote |
| `Breadcrumb.tsx` | server | Visual breadcrumb (paired with JSON-LD BreadcrumbList) |
| `Comments.tsx` | client | **localStorage-only** comments + honeypot field |
| `LikeBookmark.tsx` | client | Likes/bookmarks in **localStorage** |
| `SocialShare.tsx` | client | FB / X / Pinterest (vertical 600×900 image) / copy link |
| `NewsletterSection.tsx` | client | Lead-magnet CTA + form; success state shows PDF link |
| `TableOfContents.tsx` | client | Scroll-spy TOC from h2/h3 (renders if ≥3 headings) |
| `ReadingProgress.tsx` | client | Top progress bar on posts |
| `BackToTop.tsx` | client | Floating scroll-top button |
| `CookieConsentBanner.tsx` | client | Modal with accept/reject/customize, focus trap, ESC handling |
| `CookieSettings.tsx` | client | Re-openable preferences modal (opened from cookie-policy) |
| `RelatedPosts.tsx` | server | Re-fetches **all** posts to filter by category (3 items) |
| `AdSlot.tsx` | server | Ad placeholder — **never used in any page** (dead) |

### `app/components/database/` (3)
| Component | Type | Role |
|---|---|---|
| `DatabaseCard.tsx` | server | Card for species/plant/coral/equipment |
| `DatabaseGrid.tsx` | client | Grid + single-key client-side filter chips |
| `InspirationGrid.tsx` | client | Grid + style/difficulty filter chips |

### `app/components/tools/` (11)
| Component | Type | Role |
|---|---|---|
| `CalculatorLayout.tsx` | server | Tool page shell: title, description, disclaimer, related links |
| `ToolForm.tsx` | client | Shared numeric-input form + validation + result panel |
| `SetupPlanner.tsx` | client | 3-question wizard → personalized checklist |
| 8 calculator components (`AquariumVolume`, `WaterChange`, `Co2`, `Dosing`, `PumpFlow`, `SaltMixing`, `Lighting`, `Stocking`) | client | One per tool page |

## 4. Sanity Schema Inventory (12 types)

Verified document counts (2026-07-31): **190 docs total**.

| Type | Docs | Notes |
|---|---|---|
| `post` | 12 | All published; **0 featured**; **1/12 has an author**; **0/12 have body images** |
| `category` | 40 | `title, slug, description, icon (emoji), color, parentCategory` — icon/color **unused in UI** |
| `author` | 1 | `name, slug, image, role, bio (PT), socialLinks` |
| `species` | 43 | name, scientificName, slug, family, origin, excerpt, publishedAt, sizeCm, tankSizeMinL, temp/ph/gh ranges, diet, temperament, waterZone, schooling, difficulty, `compatibleSpecies[]` (ref), `relatedPosts[]` (ref), mainImage |
| `plant` | 30 | name, scientificName, slug, excerpt, publishedAt, light, co2, growth, difficulty, placement, temp/ph ranges, propagation, mainImage |
| `coral` | 17 | name, scientificName, slug, excerpt, publishedAt, light, flow, difficulty, placement, aggression, reefCompatibility, temp ranges, mainImage |
| `equipment` | 18 | name, brand, model, slug, category (Filter/Light/Pump/Heater/CO₂ System/Substrate/Test Kit/Other), excerpt, publishedAt, flowRateLh, powerW, tankSizeMin/MaxL, pros/cons, mainImage, relatedPosts |
| `problem` | 19 | title, slug, excerpt, publishedAt, category (water/algae/plants/fish/equipment), symptoms/causes/whatToCheck/whatNotToDo (PT), relatedPosts, relatedTools — **no image field** |
| `inspiration` | 10 | title, slug, excerpt, publishedAt, style, tankSizeL, difficulty, plants[]/equipment[] (refs), hardscape, mainImage (required), relatedPosts |
| `tool` | **0** | name, slug, description, toolUrl, category, relatedPosts — **no docs** |
| `collection` | **0** | title, slug, description, level, topic, steps[] (post/tool refs), mainImage — **no docs, no UI** |
| `index.ts` | — | registers all 12 types |

Image status: 115/118 docs with images valid (3 missing: Dwarf Baby Tears, CO₂ Regulator Kit, Hang-On-Back Filter). Problems have no image field at all. All listing/detail pages handle missing images with emoji fallback.

## 5. Features Implemented

- **Navigation**: logo (`app/logo.png`, 1024×1024, served via next/image), sticky blur navbar, Database mega-dropdown, mobile drawer, Ctrl+K search modal, breadcrumbs on all listing/detail pages
- **Dark mode**: class strategy, `localStorage: aquamind_theme`, respects `prefers-color-scheme`, no flash handler (JS-applied on mount)
- **Search**: `/search` page with type filters (all/article/fish/plant/coral/equipment/tool) using Groq prefix match `title match $q + "*"` (limit 10, all→8+4); navbar modal searches posts only
- **Database**: 6 content types with client-side filter chips, detail pages with parameter cards, compatible-species chips, related-articles links
- **Tools**: 8 calculators with documented formulas (CO₂ = 3×KH×10^(7−pH), 1″/gal stocking rule, 35 g/L salt, 20/35/50 lm/L lighting, etc.) + Setup Planner wizard
- **Engagement**: comments / likes / bookmarks (all localStorage, per-device), social share, newsletter forms with mock double opt-in + localStorage fallback, lead magnet PDF (`/aquarium-beginners-guide.pdf`)
- **Compliance**: cookie consent (3 categories) + re-openable settings modal, privacy/terms/cookie pages, honeypot on comment form, `ads.txt`
- **SEO**: metadata + canonical on every page, OG images (1200×630, Pinterest 600×900), JSON-LD (Organization, WebSite+SearchAction, BlogPosting, BreadcrumbList), sitemap, robots, RSS
- **UX**: reading progress, scroll-spy TOC, back-to-top, 404 page, loading skeleton, focus-visible outlines, aria labels, skip-image fallbacks
- **Performance hygiene**: next/image everywhere with context-sized URLs, `priority` on LCP images, self-hosted fonts, no analytics scripts

## 6. Underused / Inactive Data

- `tool` type: **0 docs** while 9 hardcoded tool pages exist; `problems[].relatedTools` links to `/tools/{slug}` which only works if slugs match hardcoded routes (currently cannot — no docs)
- `collection` type: **0 docs**, no pages — the "Learning Path" feature is unbuilt despite full schema
- `isFeatured`: **0 featured posts** → the home page "Featured Posts" section never renders
- `author`: only 1 author doc, linked from 1 of 12 posts → author boxes on 11 posts show nothing
- Post body images: **0 of 12** posts contain images despite 118+ images in the asset library (backfilled DB images only)
- `AdSlot.tsx`, `lib/store.ts` `useSearch`, `next-sanity` wrapper (`sanity/lib/client.ts`, `sanity/lib/live.ts`), `styled-components`, `pdfkit` — dead code/deps
- `websiteSchema` SearchAction targets `/posts?search=` — the real search URL is `/search?q=`
- `feed.xml` declares `<language>vi</language>` + Vietnamese description while the site is English
- `/about` page still contains Vietnamese copy (mission/values/CTA); API newsletter routes return Vietnamese error strings
- `sitemap.xml` omits database, tools, inspiration, problems and all detail URLs
- `category.icon` / `category.color` fields unused (home renders a hardcoded Droplets icon)

## 7. Performance & UX

- **All content pages are `force-dynamic` (SSR)** — no SSG/ISR, no `revalidate`, no cache headers on HTML; every visit hits Sanity. `generateStaticParams` on 6 detail types is dead code under `force-dynamic`. Sanity CDN (`useCdn: true`) reduces API latency, but TTFB/cost is the site's biggest lever.
- Images: Sanity CDN + next/image; `images.remotePatterns` whitelisted; sizes tuned per context (64 → 1600 px); LCP images `priority`. No `deviceSizes`/`imageSizes` tuning, no `unoptimized` for test domains.
- Fonts self-hosted via next/font; no render-blocking external requests.
- Client JS: listings/details are lightweight; calculators + studio are the heavier bundles. No analytics/tag managers → zero third-party JS (good for LCP).
- Accessibility: aria labels, focus trap in cookie dialog, `:focus-visible` outline, contrast pass in last UX pass; `TableOfContents`/`ReadingProgress` are inert on short posts (guarded).
- Risks: `typescript.ignoreBuildErrors: true` masks type errors in CI; ESLint unusable in this environment; all interactivity (comments/likes/newsletter) is per-device localStorage — no real backend, data lost across devices.
- Deploy: Vercel via git push to `main` (10 commits this cycle: seed → calculators → planner/start-here/inspiration filters → metadata/OG/breadcrumbs/JSON-LD/contrast → logo+email).

## 8. Suggestions (14)

1. **Enable ISR/on-demand revalidation**: drop `force-dynamic` on listing/detail pages, add `revalidate: 60–300` or a Sanity webhook → tag-based revalidation. Biggest TTFB + Sanity-bill win available.
2. **Use or delete `next-sanity`**: wire `sanity/lib/client.ts` (with `useCdn: false` + tags) into the data layer, or remove the package.
3. **Real newsletter provider**: replace the mock `/api/newsletter` with Resend/SendGrid/Mailchimp (double opt-in email, subscriber store). Current flow stores nothing server-side.
4. **Activate featured posts**: set `isFeatured` on 3–5 posts to turn on the home "Featured" section (already built).
5. **Attach author + body images to posts**: 1/12 posts has an author, 0/12 have body images — reuse the 118+ existing assets; adds rich results eligibility (author schema) and much better engagement.
6. **Ship the Collection/Learning Path feature**: schema is ready; build `/learn` pages (level/topic filters, step lists) to monetize the underused type.
7. **Fix tool↔Sanity mapping**: seed `tool` docs matching the hardcoded routes so `relatedTools` links resolve, or drop the type.
8. **Add the 3 missing images** (Dwarf Baby Tears, CO₂ Regulator Kit, Hang-On-Back Filter) to reach 100% image coverage.
9. **Complete sitemap + fix SEO mismatches**: include database/tools/inspiration/problems URLs; point SearchAction to `/search?q=`; set feed.xml language/description to English.
10. **Translate `/about` (and sweep remaining Vietnamese copy)** to English for consistency with the rest of the site.
11. **Remove dead code**: `AdSlot`, `useSearch` in store, `next-sanity` wrapper, `styled-components`/`pdfkit` deps.
12. **Turn on type checking**: remove `typescript.ignoreBuildErrors` and run `tsc --noEmit` in CI (or at least locally — currently masked).
13. **Wire analytics behind consent**: cookie consent already has an analytics category; add Plausible/GA4 only when `analytics === true`, closing the gap between banner and behavior.
14. **Server-side engagement**: move comments/likes/bookmarks to API routes (Sanity or Supabase) with rate limiting so they persist across devices; keep localStorage as offline fallback.
