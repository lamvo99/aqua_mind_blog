# PHASE 3 REPORT — Tính năng tương tác mới

**Trạng thái:** HOÀN THÀNH — Definition of Done đạt toàn bộ
**Ngày:** 2026-08-01
**Branch:** main — 10/10 hạng mục Phase 3 + toàn bộ yêu cầu bổ sung của người dùng

## Tóm tắt

Phase 3 xây **7 tính năng tương tác mới** và **3 hạng mục content/SEO** theo thứ tự Impact/Effort trong `UPGRADE_PLAN.md`. Tất cả dùng đúng ràng buộc kiến trúc (chỉ Next.js + Sanity, không backend riêng). Mỗi hạng mục 1 commit riêng, build pass trước khi commit, commit thẳng `main`. `npm run lint` và `tsc --noEmit` sạch, `next build` pass (204 trang).

## Quyết định của người dùng (ảnh hưởng scope)

Người dùng yêu cầu: làm **toàn bộ Phase 3** + 5 mục tự chọn:
- 3.5 topic cluster (relatedPosts/relatedTools) ✅
- 3.6 `/learn` ✅
- `/start-here` từ collections ✅ (trang có sẵn đã tốt — giữ nguyên, thêm link chéo 2 chiều với `/learn`)
- relatedSpecies/Plants/Problems trên bài viết ✅
- SEO fixes (SearchAction/sitemap/feed — đã xong từ Phase 1, không làm lại)

## Kết quả từng hạng mục

### 3.1 Compatibility & Stocking Advisor ✅ (commits `1578523`, `a67aa76`)
- Route mới `/tools/compatibility-checker` (SSG, revalidate 1d), liên kết từ `/tools` (card mới) và Stocking calculator.
- Autocomplete species từ Sanity (43 loài, field đầy đủ), chọn nhiều loài + số lượng.
- Check từng cặp bằng ngôn ngữ tự nhiên: overlap `temp`/`ph`/`gh`, `temperament` + `waterZone` (cùng tầng nước khi cả 2 hung dữ), predation theo `diet`+`sizeCm`, `tankSizeMinL`, cảnh báo `schooling` khi < 6 con.
- Ưu tiên `compatibleSpecies[]` nếu có reference tường minh giữa 2 loài.
- Share bằng URL query (`?tank=100&fish=slug:6,...`) + nút copy link, không cần DB.
- Tái sử dụng logic 1″/gal từ Stocking calculator; logic thuần trong `lib/calculators/compatibility.ts`.

### 3.2 Species/Plant/Coral Finder Quiz ✅ (commit `6ea675a`)
- Route mới `/finder` + CTA gradient nổi bật trên home.
- Flow 4 câu hỏi: loại hồ (freshwater/planted/reef) → kích thước → kinh nghiệm → ánh sáng.
- Lọc + xếp hạng 90 item (43 species + 30 plant + 17 coral) theo `difficulty`, `tankSizeMinL`, `light`, kèm lý do xếp hạng. Loại trừ item khó hơn ≥2 bậc.
- Lưu ý: species không có field salt/freshwater → dùng heuristic theo `origin` (regex ocean/reef/Indo-Pacific…) khi filter nước mặn; item không khớp bị loại. Không thay đổi schema.

### 3.3 Compare Tool ✅ (commit `3cbf918`)
- Nút "+ Compare" trên `DatabaseCard` (tối đa 3 item cùng loại), thanh so sánh sticky dưới màn hình, modal bảng side-by-side.
- Hàng so sánh theo đúng field schema từng loại (species 10 hàng, plant 8, coral 7, equipment 6) — config trong `lib/compare.ts`, projection riêng `getDatabaseCompareItems()` tránh fetch thừa.
- Áp dụng cho cả 4 trang listing: `/species`, `/plants`, `/corals`, `/equipment`.

### 3.4 Problem Symptom-Based Diagnosis Wizard ✅ v1 (commit `ec5060f`)
- Route mới `/problems/diagnose` + nút "Diagnose my problem" trên `/problems`.
- 16 triệu chứng soạn thủ công từ nội dung `symptoms` của 19 problem, match keyword/text vào `pt::text(symptoms)`, xếp hạng theo số triệu chứng khớp + thanh % kèm lý do.
- Chọn đúng hướng v1 của plan; **v2 (field `symptomTags` + migrate 19 docs) chưa làm** — là thay đổi schema, để sau nếu v1 hiệu quả (đúng quyết định trong plan).

### 3.5 Tự động hoá liên kết nội bộ (topic cluster) ✅ (commits `6a5dcaf`, `3ff73ce` — thực hiện đầu Phase 3)
- `RelatedPosts.tsx` bỏ fetch toàn bộ posts → 1 GROQ query theo category (`getRelatedPosts`).
- Block "Related Database" mới trên trang bài viết (`RelatedDatabase.tsx`) + `getDatabaseItemsReferencingPost()`.
- Seed `scripts/seed-related-links.mjs`: 114 liên kết (species 33, plant 22, equipment 14, problem 19, problemTools 17, inspiration 9); **0 broken refs**. Coral 0 — không có dữ liệu mapping, log lại.

### 3.6 Trang `/learn` cho Learning Path ✅ (commit `173726c`)
- `/learn` danh sách 4 collection (level/topic/step count) + `/learn/[slug]` chi tiết dạng checklist từng bước (SSG từ `generateStaticParams`).
- Trạng thái hoàn thành từng bước lưu localStorage (`aquamind_learn_<slug>`), progress bar, reset; mỗi step link tới post hoặc tool tương ứng.
- Thêm "Learn Paths" vào mainNav; `/start-here` thêm link "Browse learning paths" (2 chiều).

### 3.7 Style Guide pillar content ✅ (commit `1ee92f0`)
- 8 trang `/styles/[slug]`: Iwagumi, Dutch, Nature Aquarium, Jungle, Biotope, Walstad, Reef, Paludarium — content viết theo thuật ngữ ngành (golden ratio, plant streets, fuku-ishii, 35 g/L…).
- Mỗi trang: overview, key principles, best-for, getting started steps, gallery inspiration cùng style (fetch động).
- Liên kết 2 chiều: inspiration detail có chip "Iwagumi guide" trỏ về pillar.

### 3.8 Nâng cấp InspirationGrid ✅ (commit `0c67798`)
- Chip style hiện đếm số item ("Iwagumi (2)", "All styles (10)").
- Hàng "Style guides:" dưới filter chip liên kết tới 8 pillar page.

### 3.9 Structured data chi phí thấp ✅ (commit `2250e2c`)
- `HowTo` JSON-LD cho **9/9 trang tool** (steps soạn từ công thức thực tế mỗi calculator), render qua `CalculatorLayout` + helper `howToSchema()`.
- `llms.txt` mới (`/llms.txt`): tools, learning paths, style guides, databases, full article index.
- Không thêm `Product` schema cho equipment (đúng quyết định plan — thiếu field giá/availability).

### 3.10 PWA manifest + offline calculators ✅ (commit `1a15ca6`)
- `/manifest.webmanifest` (MetadataRoute): icons 192/512 + maskable, theme/background color, 3 shortcuts (Compatibility Checker, Setup Planner, Finder).
- `/sw.js`: service worker cache-first cho navigation + `/tools/*`, `/setup-planner`, `/finder`; network-first với cache fallback; precache app shell; đăng ký qua `RegisterSW` (chỉ production).
- Icons resize từ `app/logo.png` bằng sharp (`tmp/gen-icons.mjs` — script, không chạy lại cần thiết).

## Definition of Done — Kết quả

| Kiểm tra | Kết quả |
|---|---|
| Mỗi mục có route/component hoạt động | ✅ 10/10 |
| `next build` pass | ✅ 204 trang SSG/ISR, 0 lỗi |
| `tsc --noEmit` sạch | ✅ |
| `npm run lint` sạch | ✅ |
| Không phá tính năng cũ | ✅ (build log đầy đủ các route cũ) |
| Schema thay đổi | Không có (3.4 v1 không đụng schema) |

## Commits (Phase 3)

```
1578523 feat: compatibility checker tool (3.1)
a67aa76 fix: water zone competition check (3.1)
6ea675a feat: species/plant/coral finder quiz (3.2)
3cbf918 feat: compare tool on database grids (3.3)
ec5060f feat: problem symptom diagnosis wizard v1 (3.4)
6a5dcaf perf: fetch related posts via GROQ + related database block (3.5)
3ff73ce chore: seed relatedPosts/relatedTools links (3.5)
173726c feat: /learn learning paths with checklist progress (3.6)
1ee92f0 feat: aquascaping style guide pillar pages (3.7)
0c67798 feat: inspiration grid style counts + pillar links (3.8)
2250e2c feat: HowTo structured data for tools + llms.txt (3.9)
1a15ca6 feat: PWA manifest + offline service worker for tools (3.10)
```

## Files & Scripts mới

- `lib/calculators/compatibility.ts`, `lib/compare.ts`, `lib/finder.ts`, `lib/diagnosis.ts`, `lib/styles.ts`, `lib/database.ts` (+`getDatabaseCompareItems`)
- `app/tools/compatibility-checker/page.tsx`, `app/finder/page.tsx`, `app/problems/diagnose/page.tsx`, `app/learn/page.tsx`, `app/learn/[slug]/page.tsx`, `app/styles/[slug]/page.tsx`, `app/manifest.ts`, `app/sw.js/route.ts`, `app/llms.txt/route.ts`
- Components: `tools/CompatibilityChecker.tsx`, `finder/FinderQuiz.tsx`, `problems/DiagnosisWizard.tsx`, `learn/LearningPathChecklist.tsx`, `RegisterSW.tsx`; sửa `DatabaseCard`, `DatabaseGrid`, `InspirationGrid`, `CalculatorLayout`
- `public/icons/*` (sharp resize), `tmp/gen-icons.mjs` (script tạo icon)

## Ghi chú cho Phase 4

- **3.4 v2** (symptomTags + migrate) là ứng viên tự nhiên nếu v1 được dùng nhiều — cần xác nhận schema change.
- **Coral relatedPosts = 0** — chưa có mapping inspiration/species→coral; seed thêm khi biên tập nội dung reef.
- **Finder heuristic salt/freshwater theo `origin`** — nếu muốn chính xác tuyệt đối, thêm field `waterType` vào schema species (optional) + migrate.
- Phase 4.1 (comments qua Sanity) cần `SANITY_API_TOKEN` — token đã có trong `.env.local` (server-only).
