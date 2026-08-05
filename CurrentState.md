# 🗺️ CURRENT STATE OF THE PROJECT: AquaMind Blog
> **Tài liệu đồng bộ ngữ cảnh cho AI & Developer**
> **Cập nhật lần cuối:** 04/08/2026 bởi OpenCode Automated Audit

---

## 1. 🚀 TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)
- **Tên dự án:** AquaMind — Aquarium & Aquascaping Blog (`aqua_mind_blog`)
- **Mục đích:** Nền tảng kiến thức & công cụ thủy sinh: blog bài viết (Sanity CMS), 9 công cụ tính toán aquarium, database species/plants/corals/equipment/problems/inspiration, finder quiz, diagnosis wizard, setup planner, học liệu learning paths, newsletter double opt-in (Resend), comments có moderation.
- **Kiến trúc chính:** Jamstack — Next.js App Router (SSG/ISR/SSR hybrid) + Sanity Headless CMS (GROQ) + Vercel hosting. Không có server riêng, không auth, không SQL; toàn bộ dữ liệu nội dung đổ từ Sanity CDN.
- **Trạng thái production:** `aquamind.life` (Vercel, GitHub `lamvo99/aqua_mind_blog`). **Lưu ý:** local đang **hơn remote 1 commit** (`0f2650a` — UI/UX & SEO overhaul) chưa push/deploy.

---

## 2. 🛠️ THÔNG SỐ KỸ THUẬT & TECH STACK (TECHNICAL SPECIFICATIONS)
- **Framework chính:** Next.js **15.5.22 — App Router** (React 19.2.7), TypeScript **5.9.3** (`strict: true`), Node 22.
- **Ngôn ngữ:** TypeScript (~100% codebase), JSX/TSX; file `tsconfig.json` alias `@/*` → repo root, `moduleResolution: bundler`.
- **Styling & UI Systems:** Tailwind CSS **3.4** (`tailwind.config.ts`: palette custom `aqua` (cyan/teal) + `ocean`, darkMode `class`, font Inter + Playfair_Display qua `next/font`); CSS tùy biến `app/globals.css` (gradient, no-scrollbar, scrollbar, keyframes); **Lucide React** icons; không dùng shadcn/MUI.
- **Quản lý State:** Không thư viện (không Zustand/Redux/React Query). Dùng **React Context + localStorage** (`lib/store.ts`: `useTheme`, `useNewsletter`, `useComments`, `useBookmarks`), state nội bộ component cho form/calculator.
- **Database / Backend / CMS:** **Sanity Headless CMS v3.80** (projectId `zeohjejw`, dataset `production`, API v2023-05-03, GROQ query; Sanity Studio nhúng tại `/studio` với auth username/password). **Resend API** gửi email newsletter. Không có SQL/Supabase/Prisma.
- **Data fetching:** Sanity client `lib/sanity.ts` (public, CDN) + `lib/sanity-server.ts` (server-only token, dùng cho webhook/route API); ISR `revalidate = 3600` + webhook `POST /api/revalidate` (xác thực `SANITY_REVALIDATE_SECRET`); page `/posts` là `force-dynamic`.
- **Deployment & Hosting:** Vercel (auto-deploy từ GitHub main), domain `aquamind.life`. `next.config.js`: chỉ cấu hình `images.remotePatterns` cho `cdn.sanity.io`.
- **Testing:** Vitest 4.1.10 + jsdom + @testing-library/react + jest-dom — **170 tests / 17 files**, script `npm run test` (`vitest run`), config `vitest.config.ts` (alias `@`, setup `tests/setup.ts` mock env). Lint: ESLint 8 `next/core-web-vitals` (script `npm run lint`).
- **Khác:** PWA (`app/manifest.ts` + service worker `app/sw.js/route.ts` + `public/icons/*`), RSS `app/feed.xml/route.ts`, `llms.txt`, sitemap XML, favicon/logo (`app/icon.png`, `app/apple-icon.png`, `public/logo.png`).

### Core Dependencies (package.json)
| Package | Version | Công dụng |
|---|---|---|
| `next` | ^15.5.22 | Framework App Router |
| `react` / `react-dom` | ^19.2.7 | UI |
| `sanity` + `@sanity/client` + `@sanity/image-url` + `next-sanity` + `@sanity/vision` + `@sanity/code-input` | ^3.80 / ^7.22 / ^2.1 / ^9.12 | CMS + URL image builder + studio |
| `lucide-react` | ^1.16 | Icons |
| `tailwindcss` + `@tailwindcss/postcss` + `autoprefixer` | ^3.4 / ^4.3 / ^10.5 | Styling |
| `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` | ^4.1 / ^29 / ^16.3 / ^7 | DevDeps — test suite |

### Env Vars (.env.local — gitignored; đồng bộ trên Vercel)
`NEXT_PUBLIC_SANITY_PROJECT_ID=zeohjejw`, `NEXT_PUBLIC_SANITY_DATASET=production`, `NEXT_PUBLIC_SANITY_API_VERSION=2026-…`, `SANITY_API_TOKEN`, `NEXT_PUBLIC_SITE_URL=https://aquamind.life`, `SANITY_REVALIDATE_SECRET`, `RESEND_API_KEY`, `STUDIO_USERNAME/PASSWORD`, `NEWSLETTER_SECRET` (nếu thiếu → fallback `SANITY_API_TOKEN`). **⚠️ `NEWSLETTER_FROM` cần set trên Vercel = `AquaMind <hello@aquamind.life>`** (domain đã verify Resend; chưa set thì code fallback `AquaMind <onboarding@resend.dev>`).

---

## 3. 📂 CẤU TRÚC SỐNG CỦA CODEBASE (DIRECTORY STRUCTURE MAP)
```text
aqua_mind_blog/
├── app/                          # Next.js App Router — toàn bộ UI
│   ├── layout.tsx                # Root layout: Navbar, Footer, JSON-LD site/org, cookie, PWA
│   ├── page.tsx                  # Home: hero, featured posts, latest, categories, CTA
│   ├── posts/
│   │   ├── page.tsx              # /posts — ISR data, render PostsPageClient
│   │   ├── PostsPageClient.tsx   # Client: 7 nhóm category pills + search + Load More + scroll restore
│   │   └── [slug]/page.tsx       # Chi tiết bài: hero, TOC, PortableText, author, comments, related
│   ├── category/[slug]/page.tsx  # /category/x — hub SEO (SSG), CollectionPage schema, noindex nếu 0 bài
│   ├── tools/                    # 10 tool pages (co2, volume, stocking, dosing, lighting, pump-flow,
│   │   │                         # salt-mixing, water-change, compatibility-checker, tools hub)
│   ├── database/page.tsx         # /database — species/plants/corals/equipment/problems/inspiration grids + so sánh
│   ├── species|plants|corals|equipment/
│   │   ├── page.tsx              # Listing từng type
│   │   └── [slug]/page.tsx       # Detail + metadata + JSON-LD
│   ├── problems/                 # /problems, /problems/[slug], /problems/diagnose (DiagnosisWizard)
│   ├── finder/page.tsx           # Finder quiz (FinderQuiz)
│   ├── learn/ + learn/[slug]/    # Learning paths + checklist (LearningPathChecklist)
│   ├── styles/[slug]/            # Aquascaping style pillar pages
│   ├── inspiration/ + [slug]/    # Inspiration gallery + detail
│   ├── search/                   # /search + SearchClient (client-side filter)
│   ├── setup-planner/            # SetupPlanner wizard
│   ├── start-here/               # Hướng dẫn nhập môn (liên kết learning paths)
│   ├── about|contact|cookie-policy|privacy-policy|terms-of-service|not-found|loading
│   ├── studio/[[...tool]]/       # Nhúng Sanity Studio
│   ├── api/                      # Server routes (không auth, secret qua header)
│   │   ├── comments/route.ts     # GET (approved list) + POST (tạo comment, honeypot, validate)
│   │   ├── newsletter/route.ts   # POST subscribe → Resend send email xác nhận (HMAC token)
│   │   ├── newsletter/confirm/route.ts # GET verify HMAC → patch subscriber confirmed → 302
│   │   ├── revalidate/route.ts   # POST webhook Sanity → revalidate ISR theo type/secret
│   │   └── categories/route.ts   # GET category có bài (cache 1h) — dùng cho footer
│   ├── components/               # Navbar, Footer, PostCard, PortableText (render block, XSS-safe),
│   │   │                         # Comments, SearchModal (Cmd+K), TableOfContents, SocialShare,
│   │   │                         # LikeBookmark, ReadingProgress, NewsletterSection, Breadcrumb,
│   │   │                         # CookieConsentBanner/Settings, BackToTop, RegisterSW,
│   │   │                         # sub: tools/*, database/*, finder/, problems/, learn/
│   ├── feed.xml/route.ts, llms.txt/route.ts, sw.js/route.ts, sitemap.ts, robots.ts, manifest.ts
│   └── globals.css + icon.png/apple-icon.png/favicon.ico/logo.png
├── lib/                          # Logic thuần, không UI
│   ├── posts.ts                  # GROQ: getAllPosts, getPostBySlug, featured, byCategory, related, categories
│   ├── database.ts, styles.ts, search.ts, compare.ts, diagnosis.ts, finder.ts, categories.ts (7 nhóm cha)
│   ├── calculators/              # 10 file logic thuần (co2, volume, stocking, dosing, lighting,
│   │   │                         # pumpFlow, saltMixing, waterChange, compatibility, units, types)
│   ├── store.ts                  # Hooks + localStorage (theme, newsletter, comments, bookmarks)
│   ├── newsletter.ts             # HMAC token + Resend send (server-only)
│   ├── sanity.ts / sanity-server.ts, utils.ts, cookie-consent.ts, navigation.ts
│   ├── i18n/strings.ts           # Toàn bộ chuỗi tiếng Anh (không dùng lib i18n)
│   └── seo/jsonld.tsx            # Schemas: Organization, WebSite, BlogPosting, BreadcrumbList,
│                                 # HowTo, CollectionPage, ItemList — JsonLd escape < → \u003c (XSS-safe)
├── sanity/                       # Cấu hình CMS
│   ├── schemaTypes/              # 14 schemas: post, author, category, comment, subscriber,
│   │   │                         # species, plant, coral, equipment, problem, inspiration, tool, collection, index
│   ├── structure.ts, env.ts
├── tests/                        # Vitest: 170 tests/17 files (units, calculators, types-validation,
│   │                             # finder, diagnosis, compare, utils, search, api-*, store-hooks,
│   │                             # comments-component, i18n, security-audit) + setup.ts (mock env)
├── scripts/                      # 34 file .mjs một-lần (seed dữ liệu Sanity, backfill ảnh, audit, publish)
│   │                             # + report JSON (.backfill-report.json, .image-audit.json…)
├── tmp/                          # Script tạm dùng một lần (gen-icons, replace-images, list-*)
├── public/                       # Static: logo.png, icons/icon-192/512, maskable-512, PDF lead magnet,
│   │                             # ads.txt + 6 svg mặc định (next/vercel/globe…) KHÔNG dùng — có thể xóa
├── docs/                         # CURRENT_STATE.md (bản cũ, lệch), PHASE1-4_REPORT.md
└── configs: package.json, tsconfig.json, tailwind.config.ts, next.config.js, postcss.config.mjs,
             .eslintrc.json, vitest.config.ts, sanity.config.ts
```

---

## 4. 🧩 TÍNH NĂNG & LUỒNG DỮ LIỆU (FEATURE & ARCHITECTURE AUDIT)

### Routes chính (~60 pages)
- **Nội dung:** `/` (home), `/posts` + `/posts/[slug]`, `/category/[slug]` (mới), `/learn`, `/learn/[slug]`, `/start-here`, `/inspiration`, `/inspiration/[slug]`, `/about`, `/contact`
- **Database:** `/database`, `/species` + `[slug]`, `/plants` + `[slug]`, `/corals` + `[slug]`, `/equipment` + `[slug]`, `/problems` + `[slug]`, `/problems/diagnose`
- **Tools:** `/tools` hub + `/tools/{co2,aquarium-volume,stocking,dosing,lighting,pump-flow,salt-mixing,water-change,compatibility-checker}`, `/setup-planner`, `/finder`
- **Khác:** `/search`, `/styles/[slug]`, legal pages, `/studio` (CMS), `/api/*` (5 routes), `/feed.xml`, `/llms.txt`, `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/sw.js`

### Components chính
- **Layout:** Navbar (sticky, database mega-dropdown, mobile drawer, Ctrl/Cmd+K mở SearchModal), Footer (newsletter form, categories), BackToTop, ReadingProgress
- **Content:** PortableText (tự render blocks: heading có anchor id cho TOC, lists, images caption, code blocks — escape text an toàn), TableOfContents (sticky 240px), PostCard (lazy image + sizes + read time), RelatedPosts/RelatedDatabase, Breadcrumb
- **Interactive:** SearchModal (GROQ title-match, debounce 300ms, thumbnail), Comments (honeypot + pending badge + localStorage merge), NewsletterSection (double opt-in states), LikeBookmark (localStorage), CookieConsentBanner/Settings (3 nhóm: necessary/analytics/advertising), DiagnosisWizard, FinderQuiz, LearningPathChecklist, 10 tool calculators (client-side validation từ `lib/calculators/types.ts`), SetupPlanner

### State & Data Flow
- **Nội dung:** Sanity → GROQ → Server Component (RSC) → render; ISR revalidate 1h; Sanity webhook → `/api/revalidate` → revalidate theo `type`/`slug`.
- **Client state:** localStorage qua `lib/store.ts` (theme, bookmarks/likes, newsletter status, comments pending); không fetch client-side ngoài SearchModal + API routes.
- **API:** Comments (GET approved / POST create, honeypot `hp_comment`, validate độ dài → 400/404), Newsletter (POST subscribe: validate email + trim → create subscriber 'pending' → Resend send email chứa token HMAC `NEWSLETTER_SECRET`; GET confirm: verify token → patch 'confirmed' → redirect `/?newsletter=confirmed`; token sai/giả → 400).

### SEO hiện tại
- Metadata đầy đủ mọi route (title/description/canonical/OG/Twitter), `sitemap.ts` (posts + database types + tools + legal), `robots.ts`, RSS, `llms.txt`, JSON-LD (Organization, WebSite+SearchAction, BlogPosting, BreadcrumbList, HowTo cho tools, CollectionPage/ItemList cho category), category hub `/category/[slug]` (noindex nếu 0 bài), cấu trúc topic cluster 7 nhóm cha (pills UI, không đổi taxonomy CMS).

---

## 5. 🧪 TESTING & QA
- **170 tests / 17 files, 100% pass** (vòng cuối). `npm run test` để chạy.
- Phạm vi: 10 calculators (33 case, boundary/NaN/null), finder/diagnosis/compare/search, 5 API routes (mock `@/lib/sanity-server` qua `vi.hoisted`, HMAC thật cho confirm token, forged/tampered/sai-secret token → 400), store hooks + Comments UI (jsdom, RTL, XSS render), i18n, security-audit (cấm `dangerouslySetInnerHTML` ngoài JsonLd ld+json, cấm import `sanity-server` từ client, cấm secret env trong app trừ app/api).
- **Lỗi bắt được đã fix (commit `66dfac6`):** XSS JSON-LD (`<` → `\u003c`), email whitespace bị từ chối, crash khi Sanity null/undefined, race useComments (load đè comment vừa submit), `undefined` lọt validation, `formatRelativeTime` crash, reading-time đếm token rỗng.
- **⚠️ `npx tsc --noEmit` báo 4 lỗi trong `tests/`** (api-comments.test.ts:98, search.test.ts:24/32/44/49 — type mock không khớp `RawQuerylessQueryResponse`). KHÔNG chặn `next build` (Next chỉ type-check app), nhưng cần xử lý khi nâng cấp type.

---

## 6. ⚠️ TECHNICAL DEBT, TODOs & RỦI RO
- **TODO/FIXME/console.log trong app+lib: 0** (đã scan toàn bộ — sạch).
- **1 commit local chưa push:** `0f2650a` (UI/UX & SEO: category pills, scroll restore, /category pages, Ctrl+K) — production chưa có; đồng thời production đang chạy build cũ hơn cả favicon/QA fixes (`6a8b918` đã push nhưng cần xác nhận deploy xong).
- **npm audit: 30 vulnerabilities** (13 moderate, 16 high, 1 critical) từ lúc cài devDeps test — chưa xử lý.
- **Taxonomy CMS chưa tái cấu trúc:** 40 categories/40+ tags trong Sanity, chỉ ~5 category có bài; UI đã gom 7 nhóm (mapping slug trong `lib/categories.ts`) — mapping này sẽ lệch nếu đổi slug category trong studio.
- **`docs/CURRENT_STATE.md` đã cũ** (ghi logo `app/logo.png` sai vị trí serve; PWA states khác) — bản này ở root là nguồn chuẩn mới.
- **File chết:** `public/next.svg, vercel.svg, globe.svg, file.svg, window.svg` (mặc định create-next-app) không dùng; `scripts/` (34 file seed một lần, giữ để tái seed khi cần).
- **tsc tests/ errors** (xem mục 5), `tsconfig.tsbuildinfo` nên vào .gitignore.
- **NEWSLETTER_FROM chưa set trên Vercel** (code fallback onboarding@resend.dev — email production sẽ gửi từ địa chỉ này đến khi set `AquaMind <hello@aquamind.life>`).
- **Điều kiện production env:** đã set `NEXT_PUBLIC_SITE_URL=https://aquamind.life`; Resend domain đã verify; comments/newsletter API dùng token server — OK.
- **Đã cân nhắc bỏ qua:** SQL injection không áp dụng (GROQ tham số hóa), auth không tồn tại (studio auth riêng), comments không có rate-limit (chấp nhận với honeypot + moderation).

---

## 7. 🗓️ LỊCH SỬ & LỘ TRÌNH (ROADMAP)
- **Đã hoàn thành:** Phase 1-3 (base + UI EN + SEO/accessibility + database + tools + learn/finder/diagnose + styles + HowTo/llms + PWA), Phase 4 (comments Sanity + newsletter Resend double opt-in), QA automation (170 tests), UI/UX & SEO overhaul (7 nhóm category, scroll restore, /category hub, Ctrl+K).
- **Phase 5 (chờ user chọn, chưa làm):** ① Auth (Clerk/NextAuth), ② "My Tank" (lưu bể cá của user), ③ UGC gallery (user upload ảnh), ④ AI Advisor (chat tư vấn), ⑤ Affiliate program, ⑥ Full-text search nâng cao (GROQ weighted search — làm được ngay, rẻ nhất).
- **Phase 6:** Chỉ còn viết `docs/FINAL_REPORT.md` tổng kết toàn dự án (chưa làm).
- **Deploy flow:** `git push origin main` → Vercel auto-deploy. Hiện local hơn remote 1 commit.
