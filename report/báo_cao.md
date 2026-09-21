# AQUA BLOG TECHNICAL BASELINE

## 1. Executive Summary

Aqua Blog ("AquaMind") is a full-featured aquascaping/aquarium content platform built on Next.js 15 (App Router) + Sanity v3 + Tailwind CSS 3. The project is a single-package repository (not a monorepo) using npm as the package manager. It integrates Sanity Studio embedded at `/studio`, uses Sanity as the headless CMS for 14 schema types, and deploys to Vercel. The project includes 46 page routes across blog posts, species/plant/coral databases, interactive calculator tools, and content collections.

---

## 2. Runtime Environment

| Item | Value |
|---|---|
| Node.js | v22.17.0 |
| npm | 10.9.2 |
| pnpm | Not installed |
| yarn | Not installed |
| Bun | Not installed |
| Package Manager | npm |
| Lockfile | package-lock.json (lockfileVersion 3) |
| Git Branch | `main` |
| Git Status | Clean (no uncommitted changes) |
| Monorepo | No |
| Workspace Config | None (no turbo.json, nx.json) |
| .nvmrc | Not present |
| .node-version | Not present |
| Volta | Not configured |
| engines field | Not present in package.json |
| packageManager field | Not present in package.json |
| OS | Windows (win32) |

---

## 3. Next.js

### Declared vs Resolved Versions

| Package | Declared (package.json) | Resolved (lockfile/npm ls) |
|---|---|---|
| next | ^15.5.22 | 15.5.22 |
| react | ^19.2.7 | 19.2.8 |
| react-dom | ^19.2.7 | 19.2.8 |
| eslint-config-next | 14.2.6 | 14.2.6 |
| eslint | ^8.0.0 | 8.57.1 |

### Router & Architecture

| Aspect | Status |
|---|---|
| App Router | **Yes** (primary and only router) |
| Pages Router | **No** — `pages/` directory does not exist |
| src/ directory | **No** — app/ is at project root |
| Turbopack | **No** — not referenced anywhere |
| Server Actions | **No** — `"use server"` not found in any file |
| Server Components | **Yes** — default for all page/layout components |
| Client Components | **Yes** — 37 files with `"use client"` directive |

### Scripts

| Script | Command |
|---|---|
| dev | `next dev` |
| build | `next build` |
| start | `next start` |
| lint | `eslint` |
| test | `vitest run` |

### next.config.js

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
    ],
  },
};
module.exports = nextConfig;
```

- No experimental flags
- No middleware.ts (proxy auth is in `proxy.ts` but not wired as middleware)
- No redirects, rewrites, or headers configured
- No `output` config (defaults to standalone/serverless on Vercel)

### Route Architecture (46 pages)

Key routes include:
- `/` — Home page
- `/posts`, `/posts/[slug]` — Blog articles
- `/species/[slug]`, `/plants/[slug]`, `/corals/[slug]`, `/equipment/[slug]` — Database entries
- `/invertebrates/[slug]` — Invertebrates
- `/problems/[slug]`, `/problems/diagnose` — Problem diagnosis
- `/inspiration/[slug]` — Inspiration gallery
- `/tools/*` — 10 interactive calculators (aquarium-volume, water-change, co2, dosing, pump-flow, salt-mixing, lighting, stocking, compatibility-checker, aquarium-calculator, diagnostic)
- `/finder` — Species finder quiz
- `/setup-planner` — Tank setup planner
- `/wiki` — Wiki hub
- `/learn`, `/learn/[slug]` — Learning paths
- `/styles/[slug]` — Aquascaping styles
- `/database` — Unified database page
- `/search` — Search page
- `/studio/[[...tool]]` — Embedded Sanity Studio
- `/sitemap.xml`, `/feed.xml`, `/robots.txt`, `/llms.txt` — SEO endpoints
- `/api/revalidate`, `/api/comments`, `/api/newsletter`, `/api/newsletter/confirm` — API routes

### SEO Infrastructure

- **Metadata API**: Yes, via Next.js `Metadata` export
- **metadataBase**: `https://aquamind.life`
- **Title template**: `"%s | AquaMind Blog"`
- **Open Graph**: configured (locale en_US)
- **Twitter/X**: summary_large_image card
- **Robots**: generated via `app/robots.ts` (disallow `/studio`)
- **Sitemap**: dynamic via `app/sitemap.ts` (fetches all doc types from Sanity)
- **RSS Feed**: `app/feed.xml/route.ts` (RSS 2.0 with Atom namespace)
- **llms.txt**: `app/llms.txt/route.ts` (LLM-readable site map)
- **JSON-LD**: Organization, WebSite, BlogPosting, BreadcrumbList, HowTo, CollectionPage schemas via `lib/seo/jsonld.tsx`
- **Manifest**: PWA manifest via `app/manifest.ts`
- **Favicon/Icons**: `favicon.ico`, `apple-icon.png`, `icon.png` at root; PWA icons at `/icons/`
- **canonical URLs**: Yes, `alternates.canonical` set
- **PWA**: Service worker registration via `RegisterSW` component, `app/sw.js/route.ts`

---

## 4. React

| Item | Value |
|---|---|
| React | 19.2.8 (resolved) |
| React DOM | 19.2.8 (resolved) |
| @types/react | 19.2.17 |
| @types/react-dom | 19.2.3 |
| React Server Components | Yes (default in App Router) |
| `"use client"` components | 37 files |
| `"use server"` | Not used |

---

## 5. TypeScript

| Item | Value |
|---|---|
| TypeScript | 5.9.3 |
| tsconfig target | ES2017 |
| module | esnext |
| moduleResolution | **bundler** |
| strict | **true** |
| noEmit | true |
| jsx | preserve |
| incremental | true |
| isolatedModules | true |
| esModuleInterop | true |
| baseUrl | Not set |
| paths | `@/*` → `./*` |
| Plugins | `next` |
| exclude | `node_modules`, `sanity` |
| allowJs | true |
| JS files | Not used in source (only `.mjs` scripts in `/scripts/`) |

---

## 6. Sanity

### All Sanity-Related Packages

| Package | Declared (package.json) | Resolved (npm ls) | Purpose |
|---|---|---|---|
| sanity | ^3.80.0 | 3.99.0 | Sanity Studio & core |
| next-sanity | ^9.12.3 | 9.12.3 | Next.js ↔ Sanity integration |
| @sanity/client | ^7.22.1 | 7.25.0 | Sanity API client |
| @sanity/image-url | ^2.1.1 | 2.1.1 | Image URL builder |
| @sanity/vision | ^3.80.0 | 3.99.0 | GROQ query tool in Studio |
| @sanity/code-input | ^6.0.4 | 6.0.4 | Code block input in Studio |

### Sanity Configuration

| Setting | Value |
|---|---|
| Project ID | Via `NEXT_PUBLIC_SANITY_PROJECT_ID` env var |
| Dataset | Via `NEXT_PUBLIC_SANITY_DATASET` env var (default: "production") |
| API Version | `2026-05-25` (env var, fallback in env.ts) |
| Client API Version (browser) | `2023-05-03` (hardcoded in `lib/sanity.ts`) |
| Server Client API Version | `2024-01-01` (hardcoded in `lib/sanity-server.ts`) |
| useCdn (browser client) | true |
| useCdn (server client) | false |
| Token (server client) | Via `SANITY_API_TOKEN` env var |

---

## 7. Sanity Studio

| Aspect | Detail |
|---|---|
| Integration | **Embedded in Next.js** via `next-sanity/studio` |
| Studio route | `/studio` (catch-all: `[[...tool]]`) |
| Config file | `sanity.config.ts` |
| basePath | `/studio` |
| Schema location | `sanity/schemaTypes/` |
| Structure | Default (`S.documentTypeListItems()`) via `sanity/structure.ts` |
| Plugins | structureTool, visionTool, codeInput |
| Schema path excluded from TS | `sanity/` excluded in tsconfig.json |
| Basic Auth protection | `proxy.ts` exists with username/password from env, but **not wired as Next.js middleware** (no `middleware.ts` exists) |
| Env vars | `STUDIO_USERNAME`, `STUDIO_PASSWORD` |

**Important note**: `proxy.ts` exports a `proxy` function and a `config.matcher`, but there is no `middleware.ts` file at the project root. The Studio at `/studio` is currently **unprotected** — anyone can access it.

---

## 8. Sanity Schemas

### Schema Inventory (14 schemas)

| Schema | Type | Purpose | Key Fields |
|---|---|---|---|
| **post** | document | Blog articles | title, slug, excerpt, publishedAt, updatedAt, status, author→, categories[]→, mainImage, body (block+image+code), tags[], isFeatured, relatedPosts[]→, seo (metaTitle, metaDescription, ogImage) |
| **author** | document | Content authors | name, slug, image, role, bio (block[]), socialLinks (website, facebook, instagram, youtube, twitter) |
| **category** | document | Post categories | title, slug, description, icon, color, parentCategory→ (self-reference) |
| **comment** | document | User comments | name, email, content, post→, approved (boolean, default false) |
| **species** | document | Fish species database | name, scientificName, slug, family, origin, excerpt, sizeCm, tankSizeMinL, temp/pH/GH ranges, diet, temperament, waterZone, schooling, difficulty, waterType, compatibleSpecies[]→, mainImage, seo, relatedPosts[]→ |
| **invertebrate** | document | Shrimp/snails/crabs | name, scientificName, slug, waterType, group, sizeCm, temp/pH ranges, difficulty, diet, temperament, mainImage, relatedPosts[]→ |
| **plant** | document | Aquatic plants | name, scientificName, slug, light, co2, growth, difficulty, placement, temp/pH ranges, propagation, mainImage, relatedPosts[]→ |
| **coral** | document | Corals | name, scientificName, slug, light, flow, difficulty, coralType (soft/lps/sps/nps), placement, aggression, reefCompatibility, temp ranges, mainImage, relatedPosts[]→ |
| **equipment** | document | Aquarium equipment | name, brand, model, slug, category, excerpt, flowRateLh, powerW, tankSize ranges, pros[], cons[], mainImage, relatedPosts[]→ |
| **problem** | document | Aquarium problems | title, slug, excerpt, category, symptoms (block[]), causes (block[]), whatToCheck (block[]), whatNotToDo (block[]), relatedPosts[]→, relatedTools[]→ |
| **tool** | document | Calculator tools | name, slug, description, toolUrl, category, relatedPosts[]→ |
| **inspiration** | document | Aquascape gallery | title, slug, excerpt, style, tankSizeL, difficulty, plants[]→, hardscape, equipment[]→, mainImage, relatedPosts[]→ |
| **collection** | document | Learning paths | title, slug, description, level, topic, steps[] (title, estimatedTime, post→, tool→), mainImage |
| **subscriber** | document | Newsletter subscribers | email, status (pending/confirmed), subscribedAt, confirmedAt |

### Schema Relationships

```
Post
 ├── Author (reference)
 ├── Category[] (reference array)
 ├── Related Posts[] (self-reference)
 ├── Body: block[], image, code
 └── SEO: metaTitle, metaDescription, ogImage

Species ──→ Related Posts[], Compatible Species[] (self-ref)
Invertebrate ──→ Related Posts[]
Plant ──→ Related Posts[]
Coral ──→ Related Posts[]
Equipment ──→ Related Posts[]
Problem ──→ Related Posts[], Related Tools[]
Tool ──→ Related Posts[]
Inspiration ──→ Plants[], Equipment[], Related Posts[]
Collection ──→ Steps[] → Post/Tool references

Comment ──→ Post (reference)
Subscriber (standalone)

Category ──→ Parent Category (self-reference)
```

---

## 9. GROQ / Data Fetching

### Query Locations

| File | Queries | Schemas Queried |
|---|---|---|
| `lib/posts.ts` | getAllPosts, getPostBySlug, getFeaturedPosts, getPostsByCategory, getRelatedPosts, getAllCategories | post, category |
| `lib/database.ts` | getDatabaseList, getDatabaseCompareItems, getDatabaseItem, getInspirationList, getProblemsList, getDatabaseItemsReferencingPost | species, invertebrate, plant, coral, equipment, problem, inspiration |
| `lib/search.ts` | searchContent | post, species, invertebrate, plant, coral, equipment, tool |
| `app/sitemap.ts` | Dynamic sitemap generation | All document types |
| `app/api/comments/route.ts` | Comment CRUD | comment, post |
| `app/api/newsletter/route.ts` | Subscriber CRUD | subscriber |
| `app/feed.xml/route.ts` | RSS generation | post (via getAllPosts) |
| `app/llms.txt/route.ts` | LLM sitemap | post (via getAllPosts) |

### Architecture

- **Client**: `@sanity/client` createClient (`lib/sanity.ts`)
- **Server Client**: Separate `lib/sanity-server.ts` with API token (server-only)
- **CDN**: Browser client uses `useCdn: true`; server client uses `useCdn: false`
- **No defineQuery** — all GROQ queries are inline template strings
- **No query fragments/helpers** — queries are self-contained per function
- **No shared GROQ query library**
- **Revalidation**: `export const revalidate = 300` (home page), `3600` (sitemap, feed, llms.txt)
- **On-demand revalidation**: Via `/api/revalidate` route, triggered by Sanity webhooks with `SANITY_REVALIDATE_SECRET`
- **Cache tags**: Not used
- **fetch cache**: Not explicitly configured (uses Next.js defaults)

---

## 10. Next.js ↔ Sanity Integration

| Feature | Status |
|---|---|
| next-sanity | Yes (v9.12.3) |
| Sanity Live | Not used |
| Visual Editing | Not used |
| Draft Mode | Not used |
| Presentation Tool | Not used |
| Stega | Not used |
| ISR | Yes — `revalidate` exports on pages |
| On-demand revalidation | Yes — `/api/revalidate` webhook endpoint |
| Webhook support | Yes — Sanity → Next.js revalidation |
| Cache invalidation | Per-type path revalidation in API route |

### Revalidation Mapping (app/api/revalidate/route.ts)

| Sanity Type | Revalidated Paths |
|---|---|
| post | `/`, `/posts`, `/posts/[slug]` |
| species | `/species`, `/species/[slug]` |
| plant | `/plants`, `/plants/[slug]` |
| coral | `/corals`, `/corals/[slug]` |
| equipment | `/equipment`, `/equipment/[slug]` |
| problem | `/problems`, `/problems/[slug]` |
| inspiration | `/inspiration`, `/inspiration/[slug]` |
| category | `/`, `/posts` |
| author | `/posts` |

All revalidation events also revalidate `/sitemap.xml` and `/feed.xml`.

---

## 11. Content Rendering

| Component | Detail |
|---|---|
| Portable Text | Custom implementation (`app/components/PortableText.tsx`) — **not** using `@portabletext/react` |
| Block rendering | Headings (h1–h4), paragraphs, blockquotes, lists (ol/ul) |
| Inline marks | strong, em, code, strike-through, underline |
| Image rendering | `next/image` with Sanity image URL builder, captions, alt text |
| Code blocks | Custom rendering via `@sanity/code-input`, syntax display with filename header |
| No @portabletext/react | Not in dependencies |
| No @portabletext/toolkit | Not in dependencies |

---

## 12. Image System

| Feature | Detail |
|---|---|
| Sanity Image Pipeline | Yes — all schemas use `type: 'image'` with `hotspot: true` |
| @sanity/image-url | v2.1.1 — `createImageUrlBuilder` in `lib/sanity.ts` |
| next/image | Yes — used in PortableText and elsewhere |
| CDN | `cdn.sanity.io` whitelisted in `remotePatterns` |
| Image loader | Default next/image (no custom loader) |
| remotePatterns | `https://cdn.sanity.io` |
| responsive | `sizes` attribute used in PortableText |
| blur placeholders | Not configured |
| Image metadata | Not explicitly configured |

---

## 13. CSS / UI

| Technology | Version | Notes |
|---|---|---|
| Tailwind CSS | ^3.4.0 (3.4.19 resolved) | v3, not v4 |
| PostCSS | via @tailwindcss/postcss ^4.3.0 (4.3.3 resolved) | Note: postcss plugin is v4 but tailwind core is v3 |
| Autoprefixer | ^10.5.0 (10.5.4 resolved) | |
| CSS approach | Tailwind utility classes + custom CSS in globals.css | |
| CSS Modules | Not used | |
| styled-components | Not used | |
| Emotion | Not used | |
| Sass | Not used | |
| shadcn/ui | Not used | |
| Radix UI | Not used | |
| Headless UI | Not used | |
| Icons | lucide-react ^1.16.0 (1.27.0 resolved) | |
| Dark mode | `"class"` strategy in tailwind.config.ts | |

### Custom CSS (globals.css)
- Gradient utilities (.gradient-text, .gradient-bg)
- Card hover animations
- Line clamp utilities
- Scrollbar styling (light/dark)
- Float/shimmer keyframe animations
- Reduced motion media query support

### Tailwind Theme Extensions
- Custom color palettes: `aqua` (11 shades), `ocean` (11 shades)
- Custom fonts: `display` (Playfair Display), `sans` (Inter)
- Custom animations: float, shimmer

---

## 14. Fonts

| Font | Type | Usage |
|---|---|---|
| Inter | Google Font via `next/font/google` | Body text (`--font-inter`) |
| Playfair Display | Google Font via `next/font/google` | Display/headings (`--font-playfair`) |

Both configured in `app/layout.tsx` with CSS variable injection.

---

## 15. Internationalization

**Not detected** as a runtime i18n framework. The project has:

- `lib/i18n/strings.ts` — a single hardcoded English string table (not a translation system)
- No `next-intl`, `next-i18next`, or similar packages
- No middleware-based locale routing
- No Sanity localization fields
- No separate documents per language
- All content is in English

This is a static string lookup, not a true i18n system.

---

## 16. Analytics / Tracking

**Not detected.** No analytics packages found:

- No Google Analytics / GTM
- No Vercel Analytics or Speed Insights
- No Plausible, Umami, PostHog, or Microsoft Clarity
- No `@vercel/analytics` or `@vercel/speed-insights` in package.json
- No analytics scripts in layout or pages

---

## 17. Search

**Custom GROQ-based search** (`lib/search.ts`):

- Searches across: post, species, invertebrate, plant, coral, equipment, tool schemas
- Uses GROQ `match` operator with wildcard
- UI: `app/components/SearchModal.tsx` (client component)
- Page: `/search` route
- No external search service (no Algolia, Meilisearch, Typesense, Fuse.js, Elasticsearch)

---

## 18. Comments / Newsletter / External Services

### Comments
- Custom implementation in Sanity (`comment` schema)
- API route: `/api/comments` (GET + POST)
- Client component: `app/components/Comments.tsx`
- Moderation: `approved` field (manual approval required)
- Honeypot spam protection: `hp_comment` field
- Local storage fallback for optimistic UI

### Newsletter
- Custom double opt-in implementation
- API routes: `/api/newsletter` (POST), `/api/newsletter/confirm` (GET)
- **Email provider: Resend** (via `RESEND_API_KEY` env var)
- Token-based confirmation: HMAC-signed email tokens (`lib/newsletter.ts`)
- Subscriber storage in Sanity (`subscriber` schema)
- Client: `NewsletterSection.tsx`, `useNewsletter` hook in `lib/store.ts`

### Contact Form
- Client-side only — stores messages in localStorage (`lib/store.ts` `useContact`)
- No server-side handling or email sending

### External Services
| Service | Status |
|---|---|
| Resend (email) | Yes — newsletter confirmation emails |
| DiceBear (avatars) | Used for comment avatar generation |
| No Sentry | Not detected |
| No CMS external services | Sanity is the CMS |

---

## 19. Authentication / Security

| Feature | Status |
|---|---|
| NextAuth/Auth.js | Not used |
| Clerk | Not used |
| Custom auth | Not used |
| Sanity auth | Not used for user auth |
| Middleware protection | **No middleware.ts** exists |

### Studio Protection
- `proxy.ts` exists with Basic Auth logic (username/password from env)
- **Not wired as Next.js middleware** — Studio is publicly accessible at `/studio`
- `.env.local` contains `STUDIO_USERNAME` and `STUDIO_PASSWORD`

### Environment Variables
- `.env.local` is gitignored (correct)
- Server-only env var: `SANITY_API_TOKEN`, `SANITY_REVALIDATE_SECRET`, `STUDIO_USERNAME`, `STUDIO_PASSWORD`, `RESEND_API_KEY`, `NEWSLETTER_SECRET`
- Public env vars: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, `NEXT_PUBLIC_SITE_URL`

### Security Concerns (Read-Only)
1. **Studio is unprotected** — `proxy.ts` is not connected as middleware
2. `.env.local` contains actual secrets (not exposed in this report)
3. No rate limiting on `/api/comments` or `/api/newsletter`
4. Comments API has honeypot protection but no CSRF protection
5. Contact form has no server-side implementation

---

## 20. Vercel / Deployment

| Item | Detail |
|---|---|
| vercel.json | **Not present** |
| Deployment target | Vercel (implied by `.vercel` in .gitignore, Next.js defaults) |
| Edge runtime | Not used |
| Cron jobs | Not configured |
| Webhooks | Sanity → `/api/revalidate` |
| Vercel-specific packages | None |
| Build optimization | Standard Next.js (no custom build config) |
| `output` config | Not set (defaults to serverless on Vercel) |

---

## 21. Complete Package Inventory

### Production Dependencies

| Package | Declared | Resolved | Purpose |
|---|---|---|---|
| @sanity/client | ^7.22.1 | 7.25.0 | Sanity API client |
| @sanity/code-input | ^6.0.4 | 6.0.4 | Code block editor in Studio |
| @sanity/image-url | ^2.1.1 | 2.1.1 | Image URL builder |
| @sanity/vision | ^3.80.0 | 3.99.0 | GROQ query tool in Studio |
| lucide-react | ^1.16.0 | 1.27.0 | Icon library |
| next | ^15.5.22 | 15.5.22 | Next.js framework |
| next-sanity | ^9.12.3 | 9.12.3 | Sanity ↔ Next.js integration |
| react | ^19.2.7 | 19.2.8 | React |
| react-dom | ^19.2.7 | 19.2.8 | React DOM |
| sanity | ^3.80.0 | 3.99.0 | Sanity Studio & core |

### Development Dependencies

| Package | Declared | Resolved | Purpose |
|---|---|---|---|
| @tailwindcss/postcss | ^4.3.0 | 4.3.3 | Tailwind PostCSS plugin |
| @testing-library/jest-dom | ^7.0.0 | 7.0.0 | Jest DOM matchers |
| @testing-library/react | ^16.3.2 | 16.3.2 | React testing utilities |
| @types/node | 20.19.43 | 20.19.43 | Node.js type definitions |
| @types/react | 19.2.17 | 19.2.17 | React type definitions |
| @types/react-dom | ^19 | 19.2.3 | React DOM type definitions |
| autoprefixer | ^10.5.0 | 10.5.4 | CSS autoprefixer |
| eslint | ^8.0.0 | 8.57.1 | Linter |
| eslint-config-next | 14.2.6 | 14.2.6 | Next.js ESLint config |
| jsdom | ^29.1.1 | 29.1.1 | DOM simulation for tests |
| tailwindcss | ^3.4.0 | 3.4.19 | Tailwind CSS |
| typescript | 5.9.3 | 5.9.3 | TypeScript compiler |
| vitest | ^4.1.10 | 4.1.10 | Test framework |

### Extraneous Packages (detected by npm ls)

| Package | Version | Note |
|---|---|---|
| @emnapi/core | 1.10.0 | Unrelated to project dependencies |
| @emnapi/runtime | 1.11.3 | Unrelated |
| @emnapi/wasi-threads | 1.2.1 | Unrelated |
| @napi-rs/wasm-runtime | 1.1.6 | Unrelated |
| @tybys/wasm-util | 0.10.3 | Unrelated |

These appear to be native/WASM packages potentially pulled in by a transitive dependency.

---

## 22. Lockfile

| Item | Detail |
|---|---|
| Lockfile type | package-lock.json (npm) |
| Lockfile exists | Yes |
| lockfileVersion | 3 |
| Lines | ~21,526 |
| package.json ↔ lockfile | Consistent (declared semver ranges match resolved versions) |
| Multiple lockfiles | No (only package-lock.json) |
| pnpm-lock.yaml | Not present |
| yarn.lock | Not present |
| bun.lockb | Not present |

---

## 23. Testing / Quality

| Tool | Version | Status |
|---|---|---|
| Vitest | 4.1.10 | Configured and has 22 test files |
| @testing-library/react | 16.3.2 | Available |
| @testing-library/jest-dom | 7.0.0 | Available |
| jsdom | 29.1.1 | Available |
| ESLint | 8.57.1 | Configured |
| eslint-config-next | 14.2.6 | Uses `next/core-web-vitals` |
| Prettier | Not installed | |
| Husky | Not installed | |
| lint-staged | Not installed | |

### Test Files (22 test files in `tests/`)

```
tests/setup.ts                        — Global test setup
tests/api-comments.test.ts            — Comments API
tests/api-newsletter.test.ts          — Newsletter API
tests/api-newsletter-confirm.test.ts  — Newsletter confirm API
tests/api-revalidate.test.ts          — Revalidation API
tests/aquarium.test.ts                — Aquarium domain logic
tests/calculators.test.ts             — Calculator tools
tests/categories.test.ts              — Categories logic
tests/comments-component.test.tsx     — Comments component
tests/compare.test.ts                 — Compare feature
tests/compatibility.test.ts           — Compatibility checker
tests/diagnosis.test.ts               — Diagnosis wizard
tests/finder.test.ts                  — Finder quiz
tests/i18n.test.ts                    — i18n strings
tests/related.test.ts                 — Related posts
tests/scrollRestoration.test.ts       — Scroll restoration
tests/search.test.ts                  — Search functionality
tests/security-audit.test.ts          — Security checks
tests/sitemap.test.ts                 — Sitemap generation
tests/store-hooks.test.tsx            — React hooks/store
tests/types-validation.test.ts        — Type validation
tests/units.test.ts                   — Unit conversions
tests/utils.test.ts                   — Utility functions
```

### Vitest Config

```ts
test: {
  environment: 'node',
  globals: false,
  include: ['tests/**/*.test.{ts,tsx}'],
  setupFiles: ['tests/setup.ts'],
}
```

---

## 24. Build Status

A build was **not run** during this audit. The project has a `.next/` directory present, indicating a previous build succeeded. No build errors can be confirmed without running the build command.

---

## 25. Architecture Diagram

```
Visitor
  │
  ▼
Vercel (Serverless)
  │
  ▼
Next.js 15.5.22 (App Router)
  │
  ├── Server Components ──→ @sanity/client 7.25.0 ──→ Sanity Content Lake
  │                                                     │
  ├── Client Components (37 files)                      │
  │   ├── SearchModal (GROQ search)                     │
  │   ├── Comments (API → Sanity)                       │
  │   ├── Newsletter (API → Resend → Sanity)            │
  │   ├── Calculators (client-side logic)               │
  │   └── Finder Quiz (client-side logic)               │
  │                                                     │
  ├── Sanity Studio (/studio)                           │
  │   └── next-sanity/studio (embedded)                 │
  │                                                     │
  ├── API Routes                                        │
  │   ├── /api/revalidate ← Sanity Webhooks             │
  │   ├── /api/comments → Sanity (server client)        │
  │   └── /api/newsletter → Sanity + Resend             │
  │                                                     │
  ├── SEO                                               │
  │   ├── Sitemap (dynamic, Sanity-sourced)             │
  │   ├── RSS Feed                                      │
  │   ├── robots.txt                                    │
  │   ├── llms.txt                                      │
  │   ├── JSON-LD schemas                               │
  │   └── PWA manifest + service worker                 │
  │                                                     │
  ├── Content Rendering                                 │
  │   ├── Custom Portable Text (no @portabletext/react) │
  │   ├── next/image (cdn.sanity.io)                    │
  │   └── @sanity/image-url                             │
  │                                                     │
  └── UI                                                │
      ├── Tailwind CSS 3.4.19                           │
      ├── lucide-react 1.27.0                           │
      └── Custom CSS utilities                          │

Sanity Content Lake
  ├── 14 Schemas (post, author, category, comment,
  │   species, invertebrate, plant, coral, equipment,
  │   problem, tool, inspiration, collection, subscriber)
  ├── GROQ queries (inline in lib/*.ts)
  └── Image CDN (cdn.sanity.io)
```

---

## 26. Important Files

| File | Purpose | Importance |
|---|---|---|
| `package.json` | Dependencies, scripts | Critical |
| `package-lock.json` | Resolved dependency tree | Critical |
| `next.config.js` | Next.js configuration (images) | High |
| `tsconfig.json` | TypeScript configuration | High |
| `.eslintrc.json` | ESLint config (next/core-web-vitals) | Medium |
| `sanity.config.ts` | Sanity Studio configuration | Critical |
| `sanity/env.ts` | Sanity env var exports | Critical |
| `sanity/structure.ts` | Sanity desk structure | Medium |
| `sanity/schemaTypes/index.ts` | Schema registry | Critical |
| `sanity/schemaTypes/post.ts` | Blog post schema | Critical |
| `app/layout.tsx` | Root layout (fonts, metadata, SEO) | Critical |
| `app/page.tsx` | Home page | High |
| `lib/sanity.ts` | Browser Sanity client | Critical |
| `lib/sanity-server.ts` | Server Sanity client (with token) | Critical |
| `lib/posts.ts` | Blog post queries | High |
| `lib/database.ts` | Database queries | High |
| `lib/search.ts` | Search functionality | Medium |
| `lib/newsletter.ts` | Newsletter token + email logic | High |
| `lib/store.ts` | Client state hooks | Medium |
| `lib/seo/jsonld.tsx` | JSON-LD schema generators | Medium |
| `lib/i18n/strings.ts` | UI string constants | Medium |
| `app/components/PortableText.tsx` | Custom Portable Text renderer | High |
| `app/api/revalidate/route.ts` | Webhook revalidation | Critical |
| `app/api/comments/route.ts` | Comments API | Medium |
| `app/api/newsletter/route.ts` | Newsletter API | Medium |
| `app/sitemap.ts` | Dynamic sitemap | High |
| `app/robots.ts` | Robots.txt | Medium |
| `app/feed.xml/route.ts` | RSS feed | Medium |
| `app/manifest.ts` | PWA manifest | Low |
| `tailwind.config.ts` | Tailwind configuration | High |
| `postcss.config.mjs` | PostCSS config | Medium |
| `vitest.config.ts` | Test configuration | Medium |
| `proxy.ts` | Studio auth (not wired) | Medium |
| `.env.local` | Environment variables (secrets) | Critical |
| `.gitignore` | Git exclusions | Medium |
| `app/studio/[[...tool]]/page.tsx` | Studio route handler | High |

---

## 27. COMPATIBILITY BASELINE FOR NEW BLOG

| Technology | Current Version | Source | Notes |
|---|---|---|---|
| Node.js | v22.17.0 | Runtime | |
| Package Manager | npm 10.9.2 | Runtime | |
| Next.js | 15.5.22 | package-lock.json | ^15.5.22 declared |
| React | 19.2.8 | package-lock.json | ^19.2.7 declared |
| React DOM | 19.2.8 | package-lock.json | ^19.2.7 declared |
| TypeScript | 5.9.3 | package-lock.json | Exact version pinned |
| Tailwind CSS | 3.4.19 | package-lock.json | ^3.4.0 declared |
| PostCSS (tailwind plugin) | 4.3.3 | package-lock.json | @tailwindcss/postcss |
| Autoprefixer | 10.5.4 | package-lock.json | |
| ESLint | 8.57.1 | package-lock.json | ^8.0.0 declared |
| eslint-config-next | 14.2.6 | package-lock.json | Pinned version |
| Sanity | 3.99.0 | package-lock.json | ^3.80.0 declared |
| Sanity Studio | 3.99.0 (same pkg) | package-lock.json | Part of `sanity` package |
| next-sanity | 9.12.3 | package-lock.json | ^9.12.3 declared |
| @sanity/client | 7.25.0 | package-lock.json | ^7.22.1 declared |
| @sanity/image-url | 2.1.1 | package-lock.json | ^2.1.1 declared |
| @sanity/vision | 3.99.0 | package-lock.json | ^3.80.0 declared |
| @sanity/code-input | 6.0.4 | package-lock.json | ^6.0.4 declared |
| Portable Text | Custom (no @portabletext/react) | package.json | Custom renderer |
| GROQ | Inline queries | Source code | No separate groq package |
| lucide-react | 1.27.0 | package-lock.json | ^1.16.0 declared |
| Vitest | 4.1.10 | package-lock.json | ^4.1.10 declared |
| @testing-library/react | 16.3.2 | package-lock.json | |
| @testing-library/jest-dom | 7.0.0 | package-lock.json | |
| jsdom | 29.1.1 | package-lock.json | |

---

## 28. Potential Compatibility Risks

| Risk | Evidence | Severity | Affected Area |
|---|---|---|---|
| **PostCSS plugin v4 with Tailwind v3** | `@tailwindcss/postcss@4.3.3` is the Tailwind v4 PostCSS plugin, but `tailwindcss@3.4.19` is Tailwind v3. These may conflict or the v4 plugin may be unnecessary for v3. | Medium | Build/CSS |
| **eslint-config-next pinned to 14.x** | `eslint-config-next@14.2.6` while Next.js is 15.5.22. This is a major version mismatch between the ESLint config and the framework. | Low | Linting |
| **Three different Sanity API versions** | env.ts default `2026-05-25`, lib/sanity.ts `2023-05-03`, lib/sanity-server.ts `2024-01-01`. Inconsistent API version usage across clients. | Low | Data fetching |
| **Studio not protected** | `proxy.ts` exists but no `middleware.ts` file — Studio is publicly accessible. | Medium | Security |
| **No @portabletext/react** | Custom Portable Text implementation may miss edge cases handled by the official library. | Low | Content rendering |
| **sanity ^3.80.0 resolving to 3.99.0** | Large minor version jump (19 minor versions). May include breaking changes. | Low | Sanity |
| **Extraneous packages** | @emnapi/*, @napi-rs/wasm-runtime, @tybys/wasm-util detected in node_modules. | Low | Cleanup |
| **No engines/packageManager field** | No Node.js version constraint declared — CI/CD could run incompatible Node versions. | Medium | Deployment |
| **tsconfig excludes sanity/** | The `sanity/` directory is excluded from TypeScript compilation, so schema files are not type-checked by the main tsconfig. | Low | Type safety |
| **@types/node pinned to 20.x** | `@types/node@20.19.43` while running Node 22.17.0. Minor mismatch. | Low | Types |

---

## 29. Unknown / Unable to Determine

| Item | Status |
|---|---|
| Sanity project ID | Configured via env var (value exists in .env.local but not exposed) |
| Sanity dataset name | "production" (from .env.local) |
| Vercel deployment URL | Not determinable from codebase alone |
| CI/CD pipeline | No `.github/workflows/` or other CI config found |
| Actual production build status | .next/ exists but build not re-run during audit |
| Content volume (document count) | Cannot determine without API access |
| Performance characteristics | Not measured |
| Accessibility compliance level | Not audited |
| Whether Vercel Analytics is enabled in dashboard | Not determinable from code |

---

## 30. KEY STACK

```
Node:              v22.17.0
Next.js:           15.5.22
React:             19.2.8
TypeScript:        5.9.3
Tailwind:          3.4.19
Sanity:            3.99.0
Sanity Studio:     3.99.0 (embedded)
next-sanity:       9.12.3
@sanity/client:    7.25.0
Package Manager:   npm 10.9.2
Deployment:        Vercel (implied)
```

### MOST IMPORTANT FILES

1. `package.json` — Dependencies & scripts
2. `package-lock.json` — Resolved versions
3. `next.config.js` — Next.js configuration
4. `tsconfig.json` — TypeScript configuration
5. `sanity.config.ts` — Sanity Studio configuration
6. `sanity/schemaTypes/index.ts` — Schema registry
7. `sanity/schemaTypes/post.ts` — Core blog post schema
8. `sanity/env.ts` — Sanity environment variables
9. `lib/sanity.ts` — Browser Sanity client
10. `lib/sanity-server.ts` — Server Sanity client
11. `lib/posts.ts` — Blog post GROQ queries
12. `lib/database.ts` — Database GROQ queries
13. `app/layout.tsx` — Root layout & metadata
14. `app/components/PortableText.tsx` — Content renderer
15. `app/api/revalidate/route.ts` — Webhook revalidation
16. `tailwind.config.ts` — Tailwind theme
17. `app/sitemap.ts` — Dynamic sitemap
18. `.env.local` — Environment variables (secrets)
19. `vitest.config.ts` — Test configuration
20. `proxy.ts` — Studio auth (unwired)

### DO NOT CHANGE

**No files were modified during this audit.** This is a read-only assessment. The project remains exactly as found on the `main` branch with a clean working tree.
