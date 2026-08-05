# 🚀 ACTIONABLE IMPLEMENTATION PLAN: AQUAMIND UPGRADE
> **Tài liệu hướng dẫn thi công cho OpenCode / AI Coding Agent**
> **Mục tiêu:** Sửa triệt để lỗi UX, tối ưu SEO/Core Web Vitals, và xây dựng các traffic-engine features cho AquaMind.
>
> **Ngày lập:** 2026-08-04
> **Repository:** `lamvo99/aqua_mind_blog`
> **Production:** `https://aquamind.life`
>
> **Nguồn sự thật kỹ thuật:** `CurrentState.md` là nguồn chuẩn của codebase hiện tại. File này xác nhận Next.js 15.5.22 App Router + React 19.2.7 + TypeScript strict + Tailwind 3.4 + Sanity v3 + Vercel, React Context/localStorage thay cho Zustand/Redux, 170 tests/17 files, và các route/component hiện có. `CurrentState.md` cũng ghi nhận commit `0f2650a` đang local nhưng chưa deploy, trong đó đã có category pills, scroll restore, category hubs và Cmd/Ctrl+K. Vì vậy OpenCode **không được tạo lại các phần đã tồn tại**; phải audit diff/current implementation trước khi sửa. fileciteturn0file0L15-L23
>
> **Giới hạn audit live:** Web tool đã được dùng để truy cập `https://aquamind.life/`, nhưng origin hiện không trả nội dung qua môi trường web (cache miss). Vì vậy không được giả vờ rằng đã quan sát trực tiếp từng pixel Desktop/Mobile. Các yêu cầu UX trong plan dưới đây lấy từ brief của Product Owner + trạng thái codebase trong `CurrentState.md`; trước khi code, OpenCode phải chạy browser/local production build và ghi nhận screenshot/measurements thực tế.

---

## 0. NON-NEGOTIABLE ENGINEERING RULES

### 0.1. Không phá architecture hiện tại
- Không thêm Zustand, Redux, React Query, Prisma, SQL hoặc backend server mới.
- Giữ App Router/RSC; chỉ dùng Client Component tại nơi cần interaction/browser APIs.
- Sanity tiếp tục là source of truth cho content.
- Logic thuần đưa vào `lib/`; UI vào `app/components/` hoặc component-local.
- Không đọc secret env trong Client Component.
- Không thay đổi taxonomy CMS slug hàng loạt nếu chưa có migration/backfill.
- Ưu tiên dùng các utility/schema hiện có thay vì duplicate:
  - `lib/posts.ts`
  - `lib/categories.ts`
  - `lib/database.ts`
  - `lib/diagnosis.ts`
  - `lib/calculators/*`
  - `lib/seo/jsonld.tsx`
  - `app/components/SearchModal`
  - `app/components/Breadcrumb`
  - `app/components/PostCard`

### 0.2. Canonical route hiện tại phải được tôn trọng
`CurrentState.md` xác nhận content route chính là `/posts` và `/posts/[slug]`, không phải `/articles`. Do đó mọi spec bên dưới dùng `/posts` làm canonical route.

Nếu Product Owner muốn `/articles` về sau:
- Không đổi canonical ngay trong phase này.
- Chỉ tạo redirect `/articles -> /posts` sau khi xác nhận không có external links/SEO dependency cần giữ.
- Không tạo hai phiên bản index nội dung.

### 0.3. Không duplicate feature đã tồn tại
Codebase đã có:
- 7 category parent pills.
- SearchModal Cmd/Ctrl+K.
- `/category/[slug]`.
- scroll restoration.
- 10 calculator modules.
- `/tools/compatibility-checker`.
- `/problems/diagnose`.
- database species/plants/corals/equipment/problems/inspiration.

Các task tương ứng là **audit + harden + mở rộng**, không phải viết lại từ đầu. `CurrentState.md` xác nhận các phần này đã tồn tại. fileciteturn0file0L47-L65

---

# PHASE 0: PRE-FLIGHT AUDIT & BASELINE
**Priority: BLOCKER — thực hiện trước mọi thay đổi code**

## Task 0.1: Reproduce production UX trên Desktop + Mobile

### Mục tiêu
Tạo baseline có thể so sánh trước/sau, đặc biệt cho:
- `/`
- `/posts`
- `/posts/[slug]`
- `/category/[slug]`
- `/database`
- `/species`
- `/tools`
- `/search`
- `/problems/diagnose`
- `/finder`

### Thao tác bắt buộc
1. Chạy local production build:
   ```bash
   npm run build
   npm run start
   ```
2. Nếu build fail, sửa blocker build trước khi tiếp tục.
3. Test viewport:
   - Desktop: 1440×900
   - Tablet: 768×1024
   - Mobile: 390×844
   - Mobile nhỏ: 360×800
4. Kiểm tra:
   - Navbar/header height.
   - Horizontal overflow.
   - Category/filter density.
   - Search.
   - Image loading.
   - CLS.
   - Load More.
   - Back navigation.
   - Browser refresh.
   - Deep link.
   - Dark mode.
   - Keyboard navigation.
   - Focus visibility.
5. Record:
   - Screenshot trước sửa.
   - URL + query state.
   - `scrollY` trước/sau navigation.
   - số item đã render.
   - layout shift nếu có.
   - console errors/warnings.
6. Dùng Chrome DevTools Lighthouse/Performance để baseline:
   - LCP
   - CLS
   - INP
   - accessibility
   - SEO

### Acceptance Criteria
- [ ] Có baseline cho Desktop/Mobile.
- [ ] Có reproducible steps cho lỗi Load More → Post → Back.
- [ ] Có xác nhận component nào thực sự gây lỗi trước khi sửa.
- [ ] Không dùng giả định "site hiện tại đang lỗi X" nếu chưa reproduce; nếu không reproduce thì ghi `NOT REPRODUCED`.

---

# PHASE 1: UI/UX & CORE NAVIGATION
**Priority: P0**

## Task 1.1: Harden Category Filter System

### Mục tiêu
Giữ UI 7 nhóm cha hiện có, nhưng làm interaction ổn định trên Desktop/Mobile và đưa sub-category vào All Filters.

`CurrentState.md` xác nhận Sanity hiện vẫn có khoảng 40 categories/40+ tags, chỉ khoảng 5 category có bài; UI đã gom thành 7 nhóm bằng mapping trong `lib/categories.ts`. Đây là technical debt và mapping có nguy cơ lệch slug. fileciteturn0file0L142-L147

### Files
- `lib/categories.ts`
- `app/posts/PostsPageClient.tsx`
- component category filter hiện hữu nếu đã tách riêng
- Tạo nếu cần:
  - `app/components/posts/CategoryFilter.tsx`
  - `app/components/posts/AllFiltersSheet.tsx`
- Tests:
  - `tests/categories.test.ts`
  - `tests/posts-page.test.tsx` hoặc file tương đương hiện có

### Data contract

```ts
export interface MainCategory {
  id: string
  slug: string
  label: string
  description?: string
  childSlugs: string[]
}
```

`MAIN_CATEGORIES` phải có 5–7 parent groups. Không hard-code 40 tags trong JSX.

Khuyến nghị nhóm:
1. Freshwater Fish
2. Marine & Reef
3. Aquascaping & Plants
4. Care & Problems
5. Equipment & Setup
6. Guides & Learning
7. DIY / Inspiration

Nếu taxonomy hiện tại đã có label/slug chính thức khác, giữ taxonomy thực tế và chỉ đổi presentation layer.

### UI
- Desktop:
  - 1 hàng pills.
  - Horizontal overflow chỉ khi cần.
  - `overflow-x-auto whitespace-nowrap`.
  - Có visible scrollbar hoặc fade affordance nếu accessibility test cho thấy cần.
- Mobile:
  - Không wrap thành nhiều hàng.
  - `All Filters` button nằm cuối.
  - Touch target >= 44×44 px.
- Active state phải có:
  - visual contrast.
  - `aria-pressed="true"`.
- Filter drawer:
  - Mobile: bottom sheet.
  - Desktop: centered modal/popover.
  - Escape đóng.
  - backdrop click đóng.
  - focus trap.
  - body scroll lock.
  - Apply / Clear All.
- Không reset category khi chỉ thay đổi child filter nếu state contract không yêu cầu.

### URL state
Dùng query params để deep-link được:

```text
/posts?category=freshwater&page=2
/posts?category=freshwater&tag=betta&page=2
```

- `category` = parent.
- `tag` = optional child.
- `page` = pagination state.
- Không lưu filter chính chỉ trong React state.

### Acceptance Criteria
- [ ] Desktop không xuất hiện 40+ chips.
- [ ] Mobile chỉ có một hàng filter pills.
- [ ] All Filters mở đúng modal/bottom sheet.
- [ ] Refresh giữ filter.
- [ ] Copy URL sang tab khác giữ filter.
- [ ] Back/Forward browser khôi phục filter.
- [ ] Screen reader nhận biết active filter.
- [ ] Không có horizontal page overflow do filter.
- [ ] Unit test cho category mapping và query serialization.

---

## Task 1.2: Fix Load More → Post → Back State

### Mục tiêu
Khi user đã Load More tới page N, mở post rồi Back, danh sách phải:
1. giữ đúng filter;
2. giữ đúng số lượng item;
3. giữ đúng scroll position;
4. không refetch/reset về page 1 ngoài ý muốn.

### Files
- `app/posts/page.tsx`
- `app/posts/PostsPageClient.tsx`
- `lib/posts.ts`
- Tạo:
  - `app/hooks/useScrollRestoration.ts` hoặc `hooks/useScrollRestoration.ts` theo convention hiện tại.
- Tests:
  - `tests/scroll-restoration.test.ts`
  - `tests/posts-pagination.test.ts`

### Important architecture decision
Không dùng `sessionStorage` như source of truth duy nhất.

Source of truth:
```text
URL:
  ?page=N&category=x&tag=y

sessionStorage:
  scrollY
  renderedPage
  optional serialized list cache
```

### History behavior
Khi Load More:
```ts
const nextPage = currentPage + 1

window.history.pushState(
  { page: nextPage },
  '',
  buildPostsUrl({ page: nextPage, category, tag })
)
```

Không dùng `replaceState` cho Load More vì browser Back phải quay được state trước đó.

Khi click post:
```ts
sessionStorage.setItem(
  `posts:scroll:${location.key-or-url}`,
  String(window.scrollY)
)
```

Do `location.key` không tồn tại native trong Next App Router, dùng deterministic key:
```text
posts-scroll:<pathname>?<sorted-query>
```

Lưu thêm:
```ts
{
  scrollY: number
  timestamp: number
}
```

### Restoration sequence
1. Mount page.
2. Parse URL page/filter.
3. Fetch/render pages `1..N`.
4. Wait cho list layout/images ổn định.
5. `requestAnimationFrame` 2 lần.
6. Restore `scrollY`.
7. Chỉ restore một lần cho cùng history entry.
8. Nếu browser hỗ trợ native restoration, set:
   ```ts
   history.scrollRestoration = 'manual'
   ```
   trong lifecycle và restore về `auto` khi unmount nếu phù hợp.

### Avoid race conditions
Không:
```ts
useEffect(() => window.scrollTo(...), [])
```
ngay khi first render.

Phải đợi:
- page data loaded;
- list item DOM tồn tại;
- image layout có dimensions;
- hydration hoàn tất.

### Acceptance Criteria
- [ ] Load More page 3 → open post → Back: vẫn page 3.
- [ ] Scroll position sai lệch tối đa ±32 px.
- [ ] Filter vẫn giữ nguyên.
- [ ] Forward sau Back hoạt động.
- [ ] Refresh URL `?page=3` vẫn render page 3.
- [ ] Direct URL page 3 không yêu cầu user click Load More 2 lần.
- [ ] Không tạo duplicate browser history entry khi restore.
- [ ] Test browser navigation thủ công trên Chrome Desktop + mobile emulation.

---

## Task 1.3: Mobile Layout + Micro-interactions

### Files
- `app/globals.css`
- `app/components/Navbar*`
- `app/components/PostCard*`
- `app/posts/PostsPageClient.tsx`
- filter component
- `app/layout.tsx` nếu viewport/meta cần chỉnh

### Requirements
- Touch targets >= 44px.
- Không để fixed/sticky UI che content.
- Mobile navbar:
  - logo visible;
  - search;
  - menu;
  - no horizontal overflow.
- Filter sheet animation:
  - 150–250ms.
  - `prefers-reduced-motion` respected.
- Buttons:
  - hover only enhancement;
  - active/focus states usable on touch/keyboard.
- Skeleton/loading state cho Load More.
- Disable Load More while request đang pending.
- Prevent double-click duplicate page fetch.

### Acceptance Criteria
- [ ] 360px width không horizontal overflow.
- [ ] Không có text bị cắt khó đọc.
- [ ] No accidental double-submit.
- [ ] Reduced-motion mode không chạy animation gây khó chịu.
- [ ] Keyboard Tab/Enter/Escape hoạt động.

---

# PHASE 2: CORE WEB VITALS + IMAGE SYSTEM
**Priority: P0/P1**

## Task 2.1: Eliminate Image-Induced CLS

### Files
- `app/components/PostCard*`
- `app/posts/[slug]/page.tsx`
- database cards
- species/plants/corals/equipment cards
- inspiration cards
- `app/components/PortableText*`
- shared image utility nếu có

### Rule
Mọi image phải có intrinsic dimensions/aspect ratio.

Preferred:
```tsx
<div className="relative aspect-[16/9] overflow-hidden">
  <Image
    fill
    sizes="..."
    className="object-cover"
    ...
  />
</div>
```

Hoặc width/height thực từ Sanity image metadata.

### Sanity
Nếu GROQ hiện chưa trả metadata:
- extend query để lấy `asset->metadata.dimensions`.
- Không query metadata client-side.

### Acceptance Criteria
- [ ] Listing cards không shift khi image load.
- [ ] Hero không shift.
- [ ] PortableText images không shift.
- [ ] Lighthouse CLS mục tiêu <= 0.1.
- [ ] Không dùng width/height giả nếu làm distortion.

---

## Task 2.2: Loading Strategy

- Above-the-fold hero image: ưu tiên load.
- Below-the-fold cards: lazy.
- `sizes` phải phản ánh breakpoint thực.
- Không preload hàng loạt card images.
- Kiểm tra image payload trên mobile.

### Acceptance Criteria
- [ ] Không có hàng chục ảnh eagerly loaded ngoài viewport.
- [ ] Hero không bị lazy.
- [ ] Mobile image sizes không tải desktop-resolution vô ích.

---

# PHASE 3: SEO & TOPIC CLUSTER
**Priority: P1**

## Task 3.1: Category Hub SEO

### Existing route
`app/category/[slug]/page.tsx` đã tồn tại và `CurrentState.md` xác nhận đã có CollectionPage schema/noindex cho category không có bài. fileciteturn0file0L51-L52

### Files
- `app/category/[slug]/page.tsx`
- `lib/posts.ts`
- `lib/categories.ts`
- `lib/seo/jsonld.tsx`
- `app/components/Breadcrumb.tsx`
- `app/sitemap.ts`

### Requirements
Mỗi valid category hub phải có:
```html
<h1>...</h1>
<meta name="description" content="...">
<link rel="canonical" ...>
```

UI:
1. Breadcrumb.
2. H1.
3. Short editorial intro.
4. Featured/top posts.
5. Paginated/list content.
6. Related categories.
7. Related database entities/tools.

### SEO rules
- Empty category: `noindex,follow`.
- Valid category: indexable.
- Canonical self URL.
- No duplicate category URLs.
- Stable slug.
- No query params in canonical.

### Acceptance Criteria
- [ ] Google-readable H1.
- [ ] Unique title/description per parent category.
- [ ] Breadcrumb visible and structured.
- [ ] CollectionPage JSON-LD valid.
- [ ] Noindex only when category truly has zero indexable content.

---

## Task 3.2: JSON-LD Consolidation

### Existing utility
`lib/seo/jsonld.tsx` đã chứa Organization, WebSite, BlogPosting, BreadcrumbList, HowTo, CollectionPage, ItemList. fileciteturn0file0L89-L91

### Rule
Không tạo một hệ JSON-LD thứ hai.

Extend utility để hỗ trợ:
```ts
Article
BlogPosting
BreadcrumbList
CollectionPage
ItemList
WebSite
Organization
HowTo
```

### Article detail
File:
- `app/posts/[slug]/page.tsx`

Fields:
- `@type`: `Article` hoặc `BlogPosting`
- `headline`
- `description`
- `image`
- `datePublished`
- `dateModified`
- `author`
- `publisher`
- `mainEntityOfPage`
- `articleSection`
- `inLanguage`

### Breadcrumb
Example:
```text
Home > Posts > Category > Post
```

### Acceptance Criteria
- [ ] Exactly one primary Article/BlogPosting schema per post.
- [ ] Exactly one breadcrumb schema per page.
- [ ] No invalid JSON-LD.
- [ ] `<` escaping remains XSS-safe.
- [ ] Existing security test remains green.

---

## Task 3.3: Cmd/Ctrl+K Search Hardening

### Existing implementation
`SearchModal` đã tồn tại và Navbar hỗ trợ Ctrl/Cmd+K. fileciteturn0file0L119-L122

### Files
- `app/components/SearchModal*`
- `lib/search.ts`
- `app/search/*`
- tests search hiện có

### Requirements
- `Meta/Command + K` opens modal.
- `Ctrl + K` opens modal.
- Do not trigger while user is typing in:
  - input
  - textarea
  - contenteditable.
- Escape closes.
- Focus goes input.
- Search input debounced 200–300ms.
- Show loading state.
- Empty state.
- Error state.
- Keyboard:
  - ArrowUp
  - ArrowDown
  - Enter
  - Escape.
- Search result links use real canonical post URL.

### Acceptance Criteria
- [ ] Shortcut works Desktop.
- [ ] Does not hijack typing.
- [ ] Modal accessible.
- [ ] Search result navigation does not lose filter/history unexpectedly.
- [ ] Existing tests remain green.

---

# PHASE 4: SPECIES / PLANTS / AQUARIUM WIKI
**Priority: P1 — Traffic Engine**

## Task 4.1: Create `/wiki` Hub Without Duplicating Database

### Architecture decision
Codebase đã có `/database`, `/species`, `/plants`, `/corals`, `/equipment`, `/problems`. Do **not** create a second independent database.

`/wiki` is a SEO/editorial discovery layer over existing Sanity schemas.

### Files
Create:
- `app/wiki/page.tsx`
- `app/wiki/[slug]/page.tsx` only if a unified cross-type detail route is required.
- `app/components/wiki/WikiSearch.tsx`
- `app/components/wiki/QuickFactSheet.tsx`
- `app/components/wiki/FacetFilters.tsx`
- `lib/wiki.ts`
- `lib/wiki/types.ts`
- tests.

### Data model

```ts
export type WikiEntityType =
  | 'species'
  | 'plant'
  | 'coral'
  | 'equipment'
  | 'problem'

export interface SpeciesWikiEntry {
  id: string
  slug: string
  type: 'species'
  name: string
  scientificName?: string
  commonNames?: string[]
  image?: SanityImageSource

  phMin?: number
  phMax?: number
  tempMinC?: number
  tempMaxC?: number

  minTankLiters?: number
  adultSizeCm?: number

  difficulty?: 'easy' | 'beginner' | 'intermediate' | 'advanced'
  temperament?: string
  careLevel?: string

  waterType?: 'freshwater' | 'marine' | 'brackish'
  diet?: string[]
  tags?: string[]
}
```

Do not force fields into Sanity if they don't exist yet. If source data lacks a field:
- show `Not specified`;
- do not invent values.

### Quick Fact Sheet
Above the fold:
- pH
- Temperature
- Minimum tank size
- Adult size
- Difficulty
- Water type
- Compatibility/tank mates where data exists

Use semantic HTML:
- `<dl>`
- `<dt>`
- `<dd>`

### Facet filters
Filters:
- type
- water type
- difficulty
- pH range
- temperature range
- minimum tank size
- adult size

Use query params:
```text
/wiki?type=species&water=freshwater&difficulty=beginner
```

### Acceptance Criteria
- [ ] `/wiki` has unique H1 and SEO description.
- [ ] Existing database content is reused, not duplicated manually.
- [ ] Missing data never becomes fabricated data.
- [ ] Filters are deep-linkable.
- [ ] Mobile filter is bottom sheet.
- [ ] Detail entries link to relevant articles/tools.
- [ ] Breadcrumb + CollectionPage/Article schema where appropriate.

---

# PHASE 5: AQUARIUM INTERACTIVE TOOLS
**Priority: P1**

## Task 5.1: Composite Aquarium Calculator

### Existing architecture
Calculator logic already lives under `lib/calculators/` with volume, lighting, etc. Do not put formulas directly into page components. fileciteturn0file0L81-L85

### Route
Create:
- `app/tools/aquarium-calculator/page.tsx`

Keep existing:
- `/tools/aquarium-volume`
- `/tools/lighting`
- other calculator routes

If Product wants a single canonical entry:
- `/tools/aquarium-calculator` becomes the SEO landing page.
- Existing specialized routes remain accessible and link to the composite tool.

### Files
Create/modify:
- `app/tools/aquarium-calculator/page.tsx`
- `app/components/tools/AquariumCalculator.tsx`
- `lib/calculators/aquarium.ts`
- `lib/calculators/types.ts`
- tests.

### Input model

```ts
interface AquariumCalculatorInput {
  lengthCm: number
  widthCm: number
  heightCm: number
  substrateDepthCm?: number
  lightingMode?: 'low' | 'medium' | 'high'
  usableVolumeRatio?: number
}
```

### Formulas

Gross volume:
```text
liters = (lengthCm * widthCm * heightCm) / 1000
```

Substrate volume:
```text
substrateLiters =
  (lengthCm * widthCm * substrateDepthCm) / 1000
```

If using bag size:
```text
bags = ceil(substrateLiters / bagSizeLiters)
```

Lighting:
Do not claim a universal "correct wattage" because modern aquarium lighting is better represented by PAR/fixture output than raw watts.

If the existing product logic uses watt heuristic, label it clearly:
```text
Estimated fixture wattage — rough planning estimate only
```

Prefer a lumen/PAR guidance layer if reliable data is available.

### UX
- Input fields + unit labels.
- Realtime calculation.
- Validation:
  - numeric;
  - > 0;
  - reasonable upper bounds;
  - decimal support.
- Result card:
  - gross liters;
  - estimated usable liters;
  - substrate liters;
  - substrate bags;
  - lighting estimate.
- Share:
  - `navigator.share` when supported.
  - fallback copy URL.

### Acceptance Criteria
- [ ] Calculator is deterministic/pure and unit-tested.
- [ ] No NaN/Infinity displayed.
- [ ] Negative values rejected.
- [ ] Decimal dimensions work.
- [ ] Mobile form usable one-handed.
- [ ] Result updates without reload.
- [ ] Share works or gracefully falls back.
- [ ] HowTo JSON-LD only if page content genuinely qualifies.

---

## Task 5.2: Compatibility Checker — Harden Existing Feature

### Existing
`/tools/compatibility-checker` and `lib/calculators/compatibility` already exist.

### Files
- existing compatibility page/component
- `lib/calculators/compatibility*`
- tests

### UX target
User selects:
```text
Fish A
Fish B
Fish C
```

Output:
- Compatible
- Caution
- Not recommended
- Unknown / insufficient data

### Data model

```ts
type CompatibilityLevel =
  | 'compatible'
  | 'caution'
  | 'incompatible'
  | 'unknown'

interface CompatibilityResult {
  level: CompatibilityLevel
  reasons: string[]
  missingData?: string[]
}
```

Never infer compatibility from a single metric.

Consider:
- temperament;
- adult size;
- predation;
- water parameters;
- temperature;
- tank size;
- social/group requirements.

### Acceptance Criteria
- [ ] Pairwise comparisons are deterministic.
- [ ] Reasons shown, not only color.
- [ ] Unknown data is explicitly labeled.
- [ ] Accessible status is conveyed without color alone.
- [ ] Deep link can represent selected species.

---

## Task 5.3: Diagnostic Wizard

### Existing
`/problems/diagnose` + `DiagnosisWizard` + `lib/diagnosis.ts` already exist. fileciteturn0file0L58-L59

### Product requirement
Expose a traffic-oriented canonical entry:
- `/tools/diagnostic`

Possible implementation:
- Make `/tools/diagnostic` the public SEO landing page.
- Reuse the existing `DiagnosisWizard`.
- Keep `/problems/diagnose` as compatibility route or redirect after checking external links.

### Decision-tree model

```ts
interface DiagnosticQuestion {
  id: string
  text: string
  options: DiagnosticOption[]
}

interface DiagnosticOption {
  id: string
  label: string
  nextQuestionId?: string
  resultIds?: string[]
}

interface DiagnosticResult {
  id: string
  title: string
  confidence: 'high' | 'medium' | 'low'
  likelyCauses: string[]
  checks: DiagnosticCheck[]
  actions: DiagnosticAction[]
  relatedTools?: string[]
  relatedPosts?: string[]
}

interface DiagnosticCheck {
  parameter: string
  operator: 'lt' | 'lte' | 'eq' | 'gte' | 'gt'
  value?: number
}
```

### Wizard UX
Step:
1. Choose symptom.
2. Identify tank type.
3. Answer observable questions.
4. Optional parameter input.
5. Result.

Must show:
- progress indicator;
- Back;
- Restart;
- no destructive state reset;
- result explanation;
- related content.

### Safety/content rule
Diagnostic output is hobby/aquarium guidance, not medical/veterinary diagnosis. Avoid pretending certainty where source data does not support it.

### Acceptance Criteria
- [ ] Every answer path terminates.
- [ ] No dead-end node.
- [ ] Back works.
- [ ] Restart works.
- [ ] Direct deep link can restore selected state if implemented.
- [ ] Results explain reasoning.
- [ ] Unknown/insufficient data state exists.

---

# PHASE 6: INTERNAL LINKING & TRAFFIC ENGINE
**Priority: P1**

## Task 6.1: Build Topic Cluster Linking

### Objective
Every pillar should connect to:
- cluster articles;
- database entries;
- tools;
- related pillar.

Example:
```text
Category Hub
 ├── Article A
 ├── Article B
 ├── Species X
 ├── Tool: Aquarium Calculator
 └── Diagnostic: Algae
```

### Files
- `app/category/[slug]/page.tsx`
- `app/posts/[slug]/page.tsx`
- `app/components/RelatedPosts*`
- `app/components/RelatedDatabase*`
- `lib/posts.ts`
- `lib/database.ts`

### Rule
Do not manufacture unrelated internal links.

Use:
- category relationship;
- tags;
- entity type;
- explicit Sanity references where available.

### Acceptance Criteria
- [ ] Every indexable article has at least 3 useful internal links when content permits.
- [ ] Category hub links to representative articles.
- [ ] Tool pages link back to educational content.
- [ ] Wiki entries link to care/setup articles.
- [ ] No orphaned new route.

---

# PHASE 7: SEO INDEXING, SITEMAP & DISCOVERABILITY
**Priority: P1**

## Task 7.1: Sitemap

### Files
- `app/sitemap.ts`

Include:
- category hubs;
- wiki hub;
- valid wiki entity pages;
- tools;
- diagnostic;
- calculator;
- existing posts/database pages.

Exclude:
- empty categories;
- duplicate aliases;
- query parameter URLs;
- internal Studio;
- API routes.

### Acceptance Criteria
- [ ] Sitemap has only canonical URLs.
- [ ] No 404 URLs.
- [ ] No duplicate URL variants.
- [ ] Last modified dates use actual content dates where available.

---

## Task 7.2: Robots / Canonicals

### Files
- `app/robots.ts`
- relevant metadata functions.

Ensure:
- `/studio`
- `/api`
- query-state URLs are not accidentally treated as separate canonical content.
- Canonical always points to clean route.

---

# PHASE 8: TESTING & REGRESSION
**Priority: P0 before merge**

## Task 8.1: Preserve Existing 170-Test Baseline

`CurrentState.md` states 170 tests / 17 files currently pass. fileciteturn0file0L134-L137

Run:
```bash
npm run test
npm run lint
npm run build
```

No task is complete if existing tests regress.

---

## Task 8.2: Add Tests for New Behavior

### Required test groups

#### Category
- parent category mapping.
- child filtering.
- URL serialization.
- URL parsing.
- empty state.

#### Pagination
- page 1.
- page N.
- Load More.
- duplicate request protection.
- browser history state.

#### Scroll
- save.
- restore.
- stale session state.
- filter-specific keys.
- direct URL page N.

#### Search
- Cmd+K.
- Ctrl+K.
- input exclusion.
- Escape.
- keyboard result navigation.

#### Calculator
- zero.
- negative.
- decimal.
- huge values.
- NaN.
- substrate.
- bag rounding.

#### Compatibility
- compatible.
- caution.
- incompatible.
- unknown.

#### Diagnosis
- all branches terminate.
- back.
- restart.
- missing data.

#### SEO
- metadata generated.
- canonical.
- JSON-LD required fields.
- no invalid JSON serialization.

---

# PHASE 9: TECHNICAL DEBT / PRODUCTION HARDENING
**Priority: P1**

## Task 9.1: Fix TypeScript Test Errors

`CurrentState.md` reports 4 `tsc --noEmit` errors in tests around:
- `api-comments.test.ts`
- `search.test.ts`

Do not silence using `any`, `@ts-ignore`, or disabling strict mode.

### Acceptance Criteria
- [ ] `npx tsc --noEmit` passes.
- [ ] Existing test behavior unchanged.

---

## Task 9.2: Review npm audit

CurrentState reports:
- 30 vulnerabilities
- 13 moderate
- 16 high
- 1 critical

Do:
```bash
npm audit
npm audit fix
```

Do NOT blindly apply:
```bash
npm audit fix --force
```

For breaking upgrades:
1. identify package;
2. inspect dependency tree;
3. test;
4. upgrade intentionally.

### Acceptance Criteria
- [ ] Critical vulnerability resolved or documented with concrete reason/mitigation.
- [ ] No production dependency broken.
- [ ] Build/tests pass.

---

## Task 9.3: Production Commit/Deploy Verification

CurrentState reports local commit `0f2650a` ahead of remote and not deployed. fileciteturn0file0L142-L150

Before implementation:
```bash
git status
git log --oneline --decorate -10
git diff origin/main...HEAD
```

Do not overwrite unrelated local work.

After implementation:
```bash
npm run test
npm run lint
npm run build
git diff
```

Deployment only after explicit approval if OpenCode environment does not have deployment authority.

---

# PHASE 10: OBSERVABILITY & ANALYTICS EVENTS
**Priority: P2**

## Task 10.1: Instrument high-value interactions

If analytics infrastructure is already available, add events for:
- `category_filter_used`
- `all_filters_opened`
- `post_load_more`
- `post_opened_from_listing`
- `search_opened`
- `search_submitted`
- `wiki_filter_used`
- `calculator_completed`
- `calculator_shared`
- `compatibility_completed`
- `diagnostic_completed`
- `diagnostic_result_clicked`

Do not add a new analytics vendor just for this phase without approval.

### Event payload rule
No PII.

Example:
```ts
{
  feature: 'aquarium_calculator',
  tankType: 'freshwater',
  resultRange: 'medium'
}
```

No email, name, free-text comment, etc.

---

# ROUTE MAP AFTER IMPLEMENTATION

```text
/
├── posts/
│   ├── ?category=...&tag=...&page=N
│   └── [slug]/
├── category/
│   └── [slug]/
├── wiki/
│   └── [slug]/               # only if unified detail is approved
├── database/
├── species/
├── plants/
├── corals/
├── equipment/
├── problems/
├── tools/
│   ├── aquarium-calculator/  # new composite calculator
│   ├── compatibility-checker # existing, hardened
│   └── diagnostic/           # new public entry reusing DiagnosisWizard
├── finder/
├── learn/
├── setup-planner/
└── search/
```

---

# UX ACCEPTANCE MATRIX

| Area | Desktop | Mobile | SEO | Accessibility |
|---|---|---|---|---|
| Category pills | 1 row | horizontal 1 row | query URL | keyboard + aria |
| All Filters | modal | bottom sheet | query state | focus trap |
| Posts pagination | Load More | Load More | page URL | button state |
| Scroll restore | exact | exact | stable URL | n/a |
| Search | Cmd/Ctrl+K | search button | indexable search landing if desired | dialog semantics |
| Wiki | faceted grid | filter sheet | CollectionPage | form labels |
| Calculator | multi-column | stacked | HowTo if valid | labels/errors |
| Compatibility | side-by-side | stacked | FAQ/HowTo only if valid | status not color-only |
| Diagnostic | wizard | wizard | unique landing page | progress + keyboard |

---

# OPEN CODE EXECUTION ORDER

## Sprint 0 — Baseline
- [ ] Task 0.1: browser audit + screenshots + CWV baseline.
- [ ] Inspect current `0f2650a` implementation before changing any files.

## Sprint 1 — P0 UX
- [ ] Task 1.1: category filter hardening.
- [ ] Task 1.2: pagination/history/scroll restoration.
- [ ] Task 1.3: mobile + micro-interactions.
- [ ] Task 2.1: image CLS.
- [ ] Task 2.2: loading strategy.

## Sprint 2 — SEO
- [ ] Task 3.1: category hubs.
- [ ] Task 3.2: JSON-LD.
- [ ] Task 3.3: SearchModal hardening.
- [ ] Task 7.1: sitemap.
- [ ] Task 7.2: canonical/robots.

## Sprint 3 — Traffic Engine
- [ ] Task 4.1: `/wiki`.
- [ ] Task 5.1: composite aquarium calculator.
- [ ] Task 5.2: compatibility checker.
- [ ] Task 5.3: diagnostic public route.
- [ ] Task 6.1: internal linking.

## Sprint 4 — Quality
- [ ] Task 8.1: existing tests.
- [ ] Task 8.2: new tests.
- [ ] Task 9.1: TypeScript errors.
- [ ] Task 9.2: npm audit.
- [ ] Task 9.3: deploy verification.
- [ ] Task 10.1: analytics if approved.

---

# DEFINITION OF DONE

A phase is complete only when all conditions are true:

1. **Implementation**
   - Required files changed/created.
   - No duplicate architecture introduced.
   - TypeScript strict remains enabled.

2. **UX**
   - Desktop and mobile tested.
   - 360px viewport has no horizontal page overflow.
   - Keyboard/focus states work.
   - Loading/error/empty states exist.

3. **Navigation**
   - Back/Forward works.
   - Query state is shareable.
   - Scroll restoration works after pagination.

4. **SEO**
   - Canonical URL correct.
   - Metadata present.
   - JSON-LD valid.
   - Sitemap includes canonical pages only.

5. **Performance**
   - Images reserve layout space.
   - No obvious CLS from media.
   - No unnecessary client-side fetching.
   - Lighthouse/CWV regression documented.

6. **Testing**
   - Existing tests pass.
   - New behavior has automated tests.
   - `npm run lint` passes.
   - `npm run build` passes.
   - `npx tsc --noEmit` passes after test type fixes.

7. **Data integrity**
   - No fabricated species parameters.
   - Missing Sanity fields are represented as unknown/not specified.
   - Existing CMS slugs are not silently renamed.

8. **Production safety**
   - No secrets in client bundle.
   - No unrelated local changes overwritten.
   - Deployment only after explicit approval.

---

# FINAL PRIORITY SUMMARY

| Priority | Deliverable | Business Impact |
|---|---|---|
| P0 | Category filter + pagination/Back state | Retention / UX |
| P0 | Mobile + CLS | Mobile UX / Core Web Vitals |
| P0 | Regression tests/build | Reliability |
| P1 | Category SEO hubs + Schema | Organic traffic |
| P1 | Search hardening | Content discovery |
| P1 | `/wiki` | Long-tail SEO |
| P1 | Aquarium Calculator | Long-tail SEO + utility traffic |
| P1 | Compatibility Checker | Utility traffic |
| P1 | Diagnostic Wizard | High-intent traffic |
| P1 | Internal topic-cluster links | Crawl + topical authority |
| P2 | Analytics events | Product learning |
| P2 | Advanced search | Future content discovery |

> **OpenCode instruction:** Khi gặp mâu thuẫn giữa brief và codebase, ưu tiên `CurrentState.md` + code thực tế hiện tại. Không tạo file/component/route mới nếu chức năng tương đương đã tồn tại; hãy refactor/reuse. Nếu không thể verify một hành vi trên production do môi trường, ghi rõ `NOT VERIFIED` và verify bằng local production build trước khi kết luận.
