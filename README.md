# 🌊 AquaMind Blog

> Blog chuyên sâu về thế giới thuỷ sinh — từ hồ cá cảnh, cây thuỷ sinh đến hệ sinh thái tự nhiên. Xây dựng với Next.js 14, TypeScript, Tailwind CSS và Sanity CMS.

---

## 📋 Mục Lục

- [Tổng Quan](#tổng-quan)
- [Tính Năng](#tính-năng)
- [Tech Stack](#tech-stack)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Content Modeling](#content-modeling)
- [Cài Đặt & Khởi Chạy](#cài-đặt--khởi-chạy)
- [Biến Môi Trường](#biến-môi-trường)
- [SEO & Performance](#seo--performance)
- [Đa Ngôn Ngữ (i18n)](#đa-ngôn-ngữ-i18n)
- [Hướng Dẫn Phát Triển Tính Năng](#hướng-dẫn-phát-triển-tính-năng)
- [Deployment](#deployment)
- [License](#license)

---

## Tổng Quan

AquaMind Blog là nền tảng nội dung chuyên biệt cho cộng đồng thuỷ sinh Việt Nam và quốc tế. Mục tiêu xây dựng một hub kiến thức đầy đủ — từ người mới bắt đầu tới chuyên gia — bao gồm bài viết, hướng dẫn kỹ thuật, database loài cây/cá, diễn đàn trao đổi và công cụ hỗ trợ thiết kế hồ thuỷ sinh.

---

## Tính Năng

### ✅ Cơ Bản (đã có / nên triển khai ngay)

#### Blog & Nội Dung
- Bài viết với rich text (Portable Text của Sanity), hỗ trợ heading, blockquote, code block, table
- Phân loại bài viết theo **category** (Cây thuỷ sinh, Cá cảnh, Thiết bị, Kỹ thuật, Kinh nghiệm) và **tag** tự do
- Đánh dấu bài viết **Featured** để hiển thị nổi bật trên trang chủ
- Hỗ trợ nhiều **tác giả** với bio, avatar, link mạng xã hội
- Trường **excerpt** và **meta description** cho từng bài viết
- **Estimated reading time** tự động tính dựa trên số từ
- Breadcrumb navigation trên tất cả trang nội dung
- Pagination (phân trang) hoặc infinite scroll cho danh sách bài viết
- **Related Posts** — gợi ý bài liên quan dựa theo category/tag

#### Giao Diện & UX
- Responsive design — tối ưu trên mobile, tablet, desktop
- Navbar có mega-menu phân loại theo chủ đề thuỷ sinh
- Footer với sitemap links, newsletter signup, social links
- Dark mode / Light mode toggle (lưu preference vào localStorage)
- Skeleton loading state cho các component bất đồng bộ
- Back-to-top button
- Progress bar đọc bài (scroll reading progress)
- Lazy loading ảnh với blur placeholder

#### Tìm Kiếm
- Search bar toàn trang (tích hợp Sanity GROQ hoặc Algolia)
- Lọc kết quả theo category, tag, tác giả, khoảng thời gian
- Highlight từ khoá trong kết quả tìm kiếm

---

### 🚀 Trung Cấp (tăng engagement và SEO)

#### Database Loài Thuỷ Sinh _(killer feature)_
- **Plant Database**: tra cứu cây thuỷ sinh theo tên khoa học / tên thường, độ khó, yêu cầu ánh sáng, CO₂, phân bón, nhiệt độ, pH
- **Fish & Shrimp Database**: cá cảnh, tôm, ốc — thông tin môi trường sống, tính cách, khả năng mix với loài khác
- Bộ lọc nâng cao (faceted search): ánh sáng thấp/trung/cao, foreground/midground/background, slow/fast growing
- Liên kết từ database ra bài viết liên quan và ngược lại

#### Công Cụ Hỗ Trợ Người Dùng _(tool pages)_
- **CO₂ Calculator**: tính lượng CO₂ cần bơm dựa trên thể tích hồ, KH, pH
- **Lighting Calculator**: tính PAR / Watt phù hợp cho diện tích hồ
- **Fertilizer Dosing Guide**: hướng dẫn pha phân theo thể tích hồ
- **Aquascape Planner** (đơn giản): chọn bố cục, nhóm cây foreground/midground/background, xuất danh sách mua hàng
- **Water Parameter Tracker**: nhập thông số nước định kỳ, hiển thị biểu đồ xu hướng

#### Social & Community
- Hệ thống **Like / Bookmark** bài viết (không cần đăng nhập — dùng localStorage; có tài khoản thì sync server)
- **Chia sẻ bài viết**: Facebook, Twitter/X, Zalo, copy link
- **Comments** tích hợp (Giscus — dùng GitHub Discussions, miễn phí và không quảng cáo; hoặc Disqus)
- **Newsletter subscription** (tích hợp Mailchimp / ConvertKit / Brevo) — gửi digest hàng tuần theo topic người dùng quan tâm
- Trang **Gallery / Showcase**: người dùng submit ảnh hồ của mình (moderated qua Sanity)

#### Trang Chuyên Biệt
- Trang **Hướng Dẫn Mới Bắt Đầu** — roadmap từng bước cho người mới chơi thuỷ sinh
- Trang **Glossary** — từ điển thuật ngữ thuỷ sinh (aquascape, hardscape, Dutch style, Nature Aquarium, Iwagumi...)
- Trang **So Sánh Thiết Bị** — bảng so sánh máy lọc, đèn, bộ CO₂ theo tiêu chí
- Trang **Seasonal Tips** — gợi ý chăm sóc hồ theo mùa (thời tiết Việt Nam)

---

### 🏆 Nâng Cao (tối ưu SEO, retention và monetisation)

#### SEO Kỹ Thuật
- **Metadata API** (Next.js 14) — `generateMetadata()` động cho mỗi bài viết, trang category, trang tác giả
- **Open Graph & Twitter Card** với ảnh OG tự động generate (dùng `@vercel/og` hoặc `satori`)
- **JSON-LD Schema Markup**: `Article`, `BlogPosting`, `BreadcrumbList`, `FAQPage`, `HowTo`, `Person`, `Organization`, `WebSite` — chuẩn Google Rich Results
- **XML Sitemap** tự động cập nhật khi có bài mới (`/sitemap.xml`) — tách sitemap theo loại nội dung (posts, plants, fish)
- **robots.txt** cấu hình đúng, cho phép crawl sitemap
- **Canonical URL** trên mọi trang, xử lý duplicate content
- **Hreflang tags** cho đa ngôn ngữ (vi, en, ja...)
- **Core Web Vitals** tối ưu: LCP < 2.5s, CLS < 0.1, INP < 200ms
  - Font tải qua `next/font` (no layout shift)
  - Ảnh dùng `next/image` với `priority` cho above-the-fold
  - Tránh render-blocking scripts
- **Incremental Static Regeneration (ISR)** cho bài viết — revalidate mỗi 60 giây
- **Internal Linking Strategy**: mỗi bài viết tự động đề xuất anchor link tới bài liên quan và database entry

#### Performance
- **Edge Runtime** cho các route không cần Node.js API
- **Image CDN** qua Sanity Asset Pipeline — tự động resize, WebP/AVIF conversion
- **Redis cache** (Upstash) cho kết quả GROQ query hay dùng
- Bundle splitting tự động của Next.js; kiểm tra với `@next/bundle-analyzer`
- Prefetch nội dung khi hover link

#### Analytics & Monitoring
- **Privacy-first analytics**: Plausible hoặc Umami (self-hosted, không cookie banner)
- Track: pageview, scroll depth, thời gian đọc, click CTA
- **Search analytics**: ghi lại từ khoá người dùng tìm để định hướng nội dung
- Error monitoring: Sentry (Next.js integration)
- **Content performance dashboard** trong Sanity Studio — xem bài nào hot nhất

#### Tài Khoản Người Dùng _(optional, high-value)_
- Đăng ký / đăng nhập qua **NextAuth.js** (Google, Facebook, GitHub, email magic link)
- Profile cá nhân: avatar, bio ngắn, danh sách hồ của mình
- Lưu bookmark, lịch sử đọc, theo dõi tác giả
- **Tank Journal**: nhật ký hồ — thêm ảnh, ghi chú chăm sóc, log thông số nước theo ngày
- **Notification**: nhận thông báo khi có bài mới từ tác giả / category đăng ký theo dõi

#### Monetisation (tuỳ chọn)
- Trang **Affiliate Links** / Review sản phẩm với bảng ưu/nhược điểm rõ ràng (schema `Review`)
- **Sponsored Content** label rõ ràng (minh bạch với người đọc, tốt cho SEO)
- **Digital Products**: bán preset phân bón, template aquascape, ebook (tích hợp Stripe + Sanity)
- **Membership / Patreon** tier để unlock nội dung premium

---

## Tech Stack

| Hạng Mục | Công Nghệ | Ghi Chú |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server Components, ISR, Edge Runtime |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS + shadcn/ui | Design system nhất quán |
| CMS | Sanity.io v3 | GROQ queries, real-time preview |
| Auth | NextAuth.js v5 | Google, Facebook, Email |
| Database (user data) | PostgreSQL (Supabase) hoặc PlanetScale | Cho user profile, bookmarks, journal |
| Cache | Upstash Redis | Rate limiting, query cache |
| Search | Algolia hoặc Sanity native search | Algolia cho UX tốt hơn |
| Email | Resend + React Email | Transactional + newsletter |
| Analytics | Plausible hoặc Umami | Privacy-first |
| Monitoring | Sentry | Error tracking |
| Icons | Lucide React | |
| OG Image | @vercel/og / satori | Auto-generate OG image |
| Deployment | Vercel | Edge Network, CI/CD tự động |

---

## Cấu Trúc Dự Án

```
/
├── app/                          # Next.js 14 App Router
│   ├── (blog)/                   # Route group cho blog
│   │   ├── page.tsx              # Trang chủ
│   │   ├── posts/
│   │   │   ├── page.tsx          # Danh sách bài viết
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Chi tiết bài viết
│   │   ├── category/[slug]/
│   │   │   └── page.tsx          # Trang category
│   │   ├── author/[slug]/
│   │   │   └── page.tsx          # Trang tác giả
│   │   └── tag/[tag]/
│   │       └── page.tsx          # Trang tag
│   │
│   ├── (database)/               # Route group cho database
│   │   ├── plants/
│   │   │   ├── page.tsx          # Danh sách cây thuỷ sinh
│   │   │   └── [slug]/page.tsx   # Chi tiết loài cây
│   │   ├── fish/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   └── shrimp/
│   │       ├── page.tsx
│   │       └── [slug]/page.tsx
│   │
│   ├── (tools)/                  # Route group cho công cụ
│   │   ├── co2-calculator/
│   │   ├── lighting-calculator/
│   │   ├── fertilizer-guide/
│   │   └── aquascape-planner/
│   │
│   ├── (community)/              # Route group cộng đồng
│   │   ├── gallery/
│   │   └── newsletter/
│   │
│   ├── (auth)/                   # Route group xác thực
│   │   ├── login/
│   │   ├── register/
│   │   └── profile/
│   │
│   ├── api/                      # API Routes
│   │   ├── auth/[...nextauth]/
│   │   ├── newsletter/subscribe/
│   │   ├── posts/views/
│   │   ├── bookmarks/
│   │   └── revalidate/           # Webhook từ Sanity
│   │
│   ├── components/               # Shared components
│   │   ├── ui/                   # shadcn/ui base components
│   │   ├── layout/               # Navbar, Footer, Sidebar
│   │   ├── blog/                 # PostCard, PostList, RelatedPosts
│   │   ├── database/             # PlantCard, FishCard, FilterPanel
│   │   ├── tools/                # Calculator components
│   │   ├── seo/                  # JsonLd, MetaTags, OgImage
│   │   └── common/               # Breadcrumb, Pagination, SearchBar
│   │
│   ├── globals.css
│   └── layout.tsx                # Root layout với i18n provider
│
├── lib/                          # Utilities & helpers
│   ├── sanity/
│   │   ├── client.ts             # Sanity client config
│   │   ├── queries.ts            # GROQ queries
│   │   ├── image.ts              # urlFor helper
│   │   └── types.ts              # TypeScript types từ Sanity
│   ├── db/                       # Database queries (Supabase/Prisma)
│   ├── auth/                     # NextAuth config
│   ├── cache/                    # Redis helpers
│   ├── seo/
│   │   ├── metadata.ts           # generateMetadata helpers
│   │   ├── jsonld.ts             # JSON-LD schema builders
│   │   └── og.ts                 # OG image generation
│   ├── i18n/
│   │   ├── config.ts             # i18n configuration
│   │   ├── dictionaries/         # Translation files
│   │   │   ├── vi.json
│   │   │   ├── en.json
│   │   │   └── ja.json
│   │   └── getDictionary.ts
│   └── utils.ts                  # cn(), formatDate(), readingTime()...
│
├── sanity/                       # Sanity Studio
│   ├── schemaTypes/
│   │   ├── documents/            # post, author, category, plant, fish...
│   │   ├── objects/              # portableText, seo, socialLinks...
│   │   └── index.ts
│   ├── plugins/                  # Custom Sanity plugins
│   ├── structure.ts              # Desk structure
│   └── sanity.config.ts
│
├── messages/                     # next-intl translation files (alt)
│   ├── vi.json
│   ├── en.json
│   └── ja.json
│
├── public/
│   ├── fonts/
│   ├── icons/
│   └── og/                       # Static OG image fallback
│
├── scripts/
│   ├── seed-sanity.ts            # Seed sample data
│   └── generate-sitemap.ts
│
├── middleware.ts                 # i18n routing + auth protection
├── next.config.js
├── tailwind.config.ts
└── sanity.cli.ts
```

---

## Content Modeling

Các Sanity schema nằm trong `/sanity/schemaTypes/`:

### Documents

**`post.ts`** — Bài viết blog
```
title, slug, excerpt, body (Portable Text), mainImage,
publishedAt, updatedAt, author (ref), categories (ref[]),
tags (string[]), featured (bool), status (draft/published),
seo { metaTitle, metaDescription, ogImage },
relatedPosts (ref[])
```

**`author.ts`** — Tác giả
```
name, slug, avatar, bio, role,
socialLinks { website, facebook, instagram, youtube, twitter }
```

**`category.ts`** — Danh mục
```
title, slug, description, icon (emoji hoặc ảnh), color, parentCategory (ref)
```

**`plant.ts`** — Cây thuỷ sinh (database)
```
commonName, scientificName, slug, images[],
difficulty (easy/medium/hard/expert),
lighting (low/medium/high),
co2Required (bool), co2Level (low/medium/high),
growth (slow/medium/fast),
placement (foreground/midground/background/floating),
temperature { min, max }, pH { min, max }, hardness { min, max },
maxHeight (cm), origin (country/region),
description, careGuide (Portable Text),
relatedPosts (ref[]), similarPlants (ref[])
```

**`fish.ts`** — Cá cảnh
```
commonName, scientificName, slug, images[],
family, origin, temperament (peaceful/semi-aggressive/aggressive),
tankSize (litres min), schoolingMin (số lượng tối thiểu),
compatibility { goodWith[], badWith[] },
temperature, pH, hardness,
diet, lifespan, maxSize (cm),
description, careGuide (Portable Text),
relatedPosts (ref[])
```

**`shrimp.ts`** — Tôm (tương tự fish, có thêm `gradeSystem`)

**`gallery.ts`** — Ảnh showcase
```
title, image, author (ref hoặc text), tankSize, style,
plants (plant ref[]), fish (fish ref[]),
equipment { light, filter, co2 },
submittedAt, approved (bool)
```

**`tool.ts`** — Trang công cụ (static config cho các calculator)

---

## Cài Đặt & Khởi Chạy

### Yêu Cầu

- Node.js 18.x trở lên
- npm, yarn hoặc pnpm
- Tài khoản Sanity.io
- (Tuỳ chọn) Tài khoản Supabase, Upstash, Algolia

### 1. Clone và cài dependencies

```bash
git clone https://github.com/your-org/aquamind-blog.git
cd aquamind-blog
npm install
```

### 2. Khởi tạo Sanity

```bash
npx sanity@latest init
# Chọn project hiện có hoặc tạo mới
# Dataset: production
```

### 3. Tạo file `.env.local`

```bash
cp .env.example .env.local
# Điền đủ các biến môi trường (xem phần dưới)
```

### 4. Seed dữ liệu mẫu (tuỳ chọn)

```bash
npm run seed
```

### 5. Chạy development server

```bash
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000) để xem blog.
Sanity Studio: [http://localhost:3000/studio](http://localhost:3000/studio)

### 6. Build production

```bash
npm run build
npm start
```

---

## Biến Môi Trường

Tạo file `.env.local` với các biến sau:

```env
# ===== SANITY =====
NEXT_PUBLIC_SANITY_PROJECT_ID="your-project-id"
NEXT_PUBLIC_SANITY_DATASET="production"
SANITY_API_TOKEN="your-api-token"           # Dùng cho ISR revalidation webhook
SANITY_WEBHOOK_SECRET="your-webhook-secret"

# ===== NEXTAUTH =====
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"      # openssl rand -base64 32

# OAuth providers (tuỳ chọn)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
FACEBOOK_CLIENT_ID="..."
FACEBOOK_CLIENT_SECRET="..."

# ===== DATABASE (Supabase) =====
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# ===== CACHE (Upstash Redis) =====
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# ===== SEARCH (Algolia) =====
NEXT_PUBLIC_ALGOLIA_APP_ID="..."
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY="..."
ALGOLIA_ADMIN_KEY="..."                     # Chỉ dùng server-side

# ===== EMAIL (Resend) =====
RESEND_API_KEY="..."
EMAIL_FROM="newsletter@aquamind.vn"

# ===== ANALYTICS =====
NEXT_PUBLIC_PLAUSIBLE_DOMAIN="aquamind.vn"

# ===== MONITORING =====
NEXT_PUBLIC_SENTRY_DSN="..."
SENTRY_AUTH_TOKEN="..."

# ===== SITE =====
NEXT_PUBLIC_SITE_URL="https://aquamind.vn"
NEXT_PUBLIC_DEFAULT_LOCALE="vi"
```

---

## SEO & Performance

### Metadata Động

Mỗi bài viết, trang category, trang tác giả đều có metadata riêng qua `generateMetadata()`:

```typescript
// app/(blog)/posts/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  return {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: `/api/og?slug=${params.slug}`, width: 1200, height: 630 }],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
    twitter: { card: 'summary_large_image' },
    alternates: {
      canonical: `/posts/${params.slug}`,
      languages: { 'vi': `/vi/posts/${params.slug}`, 'en': `/en/posts/${params.slug}` },
    },
  };
}
```

### JSON-LD Schema

Tự động inject vào mỗi bài viết:

```typescript
// lib/seo/jsonld.ts
export function articleSchema(post: Post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: urlFor(post.mainImage).url(),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: post.author.name },
    publisher: { '@type': 'Organization', name: 'AquaMind', logo: '...' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}/posts/${post.slug}` },
  };
}
```

Các schema khác cần implement: `FAQPage` (cho bài dạng Q&A), `HowTo` (hướng dẫn từng bước), `BreadcrumbList`, `WebSite` (sitelinks searchbox).

### ISR & Revalidation

```typescript
// Revalidate bài viết sau 60 giây hoặc khi Sanity publish
export const revalidate = 60;

// Webhook endpoint để Sanity trigger revalidation ngay khi publish
// app/api/revalidate/route.ts
```

### Sitemap Tự Động

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const plants = await getAllPlants();
  const fish = await getAllFish();
  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    ...posts.map(p => ({ url: `${siteUrl}/posts/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
    ...plants.map(p => ({ url: `${siteUrl}/plants/${p.slug}`, priority: 0.7 })),
    ...fish.map(f => ({ url: `${siteUrl}/fish/${f.slug}`, priority: 0.7 })),
  ];
}
```

---

## Đa Ngôn Ngữ (i18n)

Sử dụng **`next-intl`** — thư viện i18n chuẩn cho Next.js App Router.

### Ngôn Ngữ Hỗ Trợ

| Code | Ngôn ngữ | Ghi chú |
|------|----------|---------|
| `vi` | Tiếng Việt | Mặc định |
| `en` | English | |
| `ja` | 日本語 | Cộng đồng thuỷ sinh Nhật rất lớn |

> Có thể mở rộng thêm: `zh` (Trung), `de` (Đức), `pt` (Bồ Đào Nha)

### Cấu Hình

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['vi', 'en', 'ja'],
  defaultLocale: 'vi',
  localePrefix: 'as-needed', // /vi/... ẩn đi, /en/..., /ja/...
});

export const config = {
  matcher: ['/((?!api|studio|_next|.*\\..*).*)'],
};
```

### Cấu Trúc URL

```
aquamind.vn/               → Tiếng Việt (mặc định)
aquamind.vn/en/            → English
aquamind.vn/ja/            → 日本語

aquamind.vn/posts/[slug]          → bài viết TV
aquamind.vn/en/posts/[slug]       → bài viết EN
aquamind.vn/ja/posts/[slug]       → bài viết JA
```

### File Translation

```json
// messages/vi.json
{
  "nav": {
    "blog": "Blog",
    "plants": "Cây Thuỷ Sinh",
    "fish": "Cá Cảnh",
    "tools": "Công Cụ",
    "gallery": "Showcase"
  },
  "post": {
    "readingTime": "{minutes} phút đọc",
    "publishedAt": "Đăng ngày {date}",
    "relatedPosts": "Bài viết liên quan",
    "shareOn": "Chia sẻ lên {platform}"
  },
  "search": {
    "placeholder": "Tìm kiếm cây, cá, kỹ thuật...",
    "noResults": "Không tìm thấy kết quả cho \"{query}\""
  },
  "newsletter": {
    "title": "Nhận bài viết mới nhất",
    "subtitle": "Đăng ký để không bỏ lỡ hướng dẫn và mẹo thuỷ sinh hàng tuần",
    "placeholder": "Email của bạn",
    "cta": "Đăng ký miễn phí"
  }
}
```

### Sanity & i18n

Nội dung bài viết đa ngôn ngữ dùng plugin **`@sanity/document-internationalization`**:

```typescript
// sanity/schemaTypes/documents/post.ts
// Mỗi ngôn ngữ tạo một document riêng với trường __i18n_lang
// Liên kết qua __i18n_refs
```

Hoặc dùng **field-level translation** (đơn giản hơn cho team nhỏ):

```typescript
// Cách đơn giản: lưu title/excerpt/body theo locale trong cùng document
title: {
  vi: 'Tên bài viết tiếng Việt',
  en: 'English post title',
}
```

### Sử Dụng Trong Component

```typescript
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({ children, params: { locale } }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

// Trong component
import { useTranslations } from 'next-intl';

export function NewsletterForm() {
  const t = useTranslations('newsletter');
  return <h2>{t('title')}</h2>;
}
```

---

## Hướng Dẫn Phát Triển Tính Năng

### Thứ Tự Ưu Tiên Đề Xuất

**Giai đoạn 1 — MVP (1-2 tháng)**
1. Blog cơ bản hoạt động đầy đủ (bài viết, category, tác giả, search)
2. SEO kỹ thuật cơ bản (metadata, sitemap, JSON-LD Article)
3. i18n Tiếng Việt + Tiếng Anh
4. Newsletter signup
5. Dark mode

**Giai đoạn 2 — Growth (tháng 3-4)**
1. Plant Database (100+ loài phổ biến)
2. Fish Database (50+ loài)
3. CO₂ Calculator và Lighting Calculator
4. Comments (Giscus)
5. Gallery / Showcase

**Giai đoạn 3 — Community (tháng 5-6)**
1. Tài khoản người dùng (NextAuth)
2. Bookmark và lịch sử đọc
3. Tank Journal
4. Algolia Search nâng cao
5. Thêm ngôn ngữ Nhật

### Thêm Một Trang Calculator Mới

```typescript
// 1. Tạo route
// app/(tools)/co2-calculator/page.tsx

// 2. Viết logic tính toán thuần TypeScript
// lib/calculators/co2.ts
export function calculateCo2(tankVolume: number, kh: number, ph: number) {
  // CO₂ (mg/L) = 3 × KH × 10^(7-pH)
  return 3 * kh * Math.pow(10, 7 - ph);
}

// 3. Tạo Client Component cho form và kết quả
// app/(tools)/co2-calculator/Co2Calculator.tsx
'use client';
// input fields + real-time calculation

// 4. Thêm JSON-LD schema HowTo nếu có hướng dẫn từng bước
// 5. Thêm vào sitemap và nav
```

### Thêm Ngôn Ngữ Mới

```bash
# 1. Tạo file translation
cp messages/en.json messages/ja.json
# Dịch toàn bộ nội dung

# 2. Cập nhật middleware.ts
locales: ['vi', 'en', 'ja'],  # Thêm 'ja'

# 3. Cập nhật hreflang trong metadata helper

# 4. Cập nhật language switcher component

# 5. Trong Sanity: thêm 'ja' vào danh sách locale
```

---

## Deployment

### Vercel (Khuyến Nghị)

```bash
# 1. Push code lên GitHub
git push origin main

# 2. Import project trên vercel.com
# 3. Thêm tất cả Environment Variables
# 4. Deploy tự động mỗi khi push lên main
```

Cấu hình `vercel.json` cho headers SEO:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/(.*)\\.(jpg|png|webp|avif|svg|ico|woff2)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

### Sanity Studio Deployment

```bash
npx sanity deploy
# Studio sẽ live tại: your-project.sanity.studio
# Hoặc host trên Vercel tại: aquamind.vn/studio
```

### Webhook Sanity → Vercel (ISR)

Trong Sanity dashboard → API → Webhooks → Tạo webhook:
- URL: `https://aquamind.vn/api/revalidate`
- Trigger: `publish`, `unpublish`
- Secret: giống `SANITY_WEBHOOK_SECRET` trong `.env`

---

## Checklist SEO Trước Khi Launch

- [ ] `<title>` và `<meta description>` unique trên mọi trang
- [ ] Open Graph image 1200×630px cho mọi bài viết
- [ ] JSON-LD Article schema trên bài viết
- [ ] JSON-LD BreadcrumbList trên các trang con
- [ ] Canonical URL đúng trên tất cả trang
- [ ] Hreflang tags cho các ngôn ngữ
- [ ] `/sitemap.xml` accessible và submit lên Google Search Console
- [ ] `/robots.txt` không block Googlebot
- [ ] Core Web Vitals đạt ngưỡng "Good" (kiểm tra tại PageSpeed Insights)
- [ ] Ảnh có `alt` text mô tả (quan trọng cho SEO ảnh + accessibility)
- [ ] Internal linking giữa bài viết liên quan
- [ ] URL slug dạng `ten-bai-viet-tieng-viet` (lowercase, dấu gạch ngang, không dấu tiếng Việt)
- [ ] 404 page có link về trang chủ và trang tìm kiếm
- [ ] Google Search Console và Bing Webmaster Tools đã verify

---

## Customization

### Thay Đổi Theme Màu Sắc

```css
/* app/globals.css */
:root {
  --color-primary: 158 84% 35%;   /* Xanh lá thuỷ sinh */
  --color-secondary: 200 80% 40%; /* Xanh nước */
  --color-accent: 45 90% 55%;     /* Vàng ánh đèn */
}
```

### Cấu Hình Sanity Studio Desk

```typescript
// sanity/structure.ts — Sắp xếp nội dung theo workflow
// Blog → Bài Viết → Đã Xuất Bản / Bản Nháp
// Database → Cây Thuỷ Sinh / Cá Cảnh / Tôm
// Cộng Đồng → Gallery (chờ duyệt / đã duyệt)
// Cài Đặt → Thông Tin Site / SEO Mặc Định
```

---

## Contributing

1. Fork repository
2. Tạo branch: `git checkout -b feature/ten-tinh-nang`
3. Commit: `git commit -m 'feat: thêm CO2 calculator'`
4. Push: `git push origin feature/ten-tinh-nang`
5. Mở Pull Request

Quy ước commit: [Conventional Commits](https://www.conventionalcommits.org/)

---

## License

MIT License — Xem file [LICENSE](LICENSE) để biết chi tiết.

---

## Acknowledgments

- [Next.js](https://nextjs.org) — Framework
- [Sanity.io](https://www.sanity.io) — CMS
- [Tailwind CSS](https://tailwindcss.com) — Styling
- [next-intl](https://next-intl-docs.vercel.app) — i18n
- [Lucide](https://lucide.dev) — Icons
- [shadcn/ui](https://ui.shadcn.com) — UI Components
- Cộng đồng thuỷ sinh Việt Nam 🌿
