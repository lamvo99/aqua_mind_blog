# Phase 1 Report — Nền tảng kỹ thuật (Performance + Correctness)

**Ngày:** 2026-07-31 — **Branch:** main — **Trạng thái:** HOÀN THÀNH (8/9 hạng mục; 1/9 hoàn thành một phần, đã log)

## Phase 0 (Re-Recon) — PASS
- Baseline `npm run build`: PASS (45s). Đang ở `main`, working tree sạch.
- Số lượng document khớp tuyệt đối với `CURRENT_STATE.md`: species 43, plant 30, coral 17, equipment 18, problem 19, inspiration 10, post 12, category 40, author 1 (tool 0, collection 0).
- Phát hiện: các trang detail (`●`) trước đây SSG build-time với `generateStaticParams` "inert" dưới `force-dynamic`; các trang list (`ƒ`) dynamic.

## Hạng mục đã hoàn thành

| # | Hạng mục | Kết quả | Commit |
|---|----------|---------|--------|
| 1.1 | ISR + on-demand revalidation | List: `revalidate 300s`; Detail: `revalidate 3600s` + `generateStaticParams` hoạt động (● SSG 1h). Tạo `app/api/revalidate/route.ts` (POST, xác thực `SANITY_REVALIDATE_SECRET`, map `_type`→paths, revalidate detail + list + sitemap + feed). | `79a7ef0` |
| 1.2 | SearchAction JSON-LD | `/posts?search=` → `/search?q={search_term_string}` trong `websiteSchema`. | `6a5bc09` |
| 1.3 | Sitemap hoàn chỉnh | 27 → **174 URLs** (6 loại database list+detail, /database, /tools + 8 con, /setup-planner, /start-here, legal pages); ISR 1h. | `25d688e` |
| 1.4 | feed.xml metadata | `<language>vi` → `en` + mô tả tiếng Anh; thêm revalidate 1h. | `79cc7a1` |
| 1.5 | Dịch nội dung tiếng Việt còn sót | /about (values/mission/CTA), /api/newsletter* (error + comments), **3 trang legal** (privacy/terms/cookie — phát hiện toàn tiếng Việt ngoài phạm vi mục 1.5, đã dịch theo quyết định English-only mặc định). | `8772529` |
| 1.6 | Xoá dead code | AdSlot.tsx, `useSearch`, `sanity/lib/{client,live,image}.ts` (+ thư mục `sanity/lib/`); gỡ deps `pdfkit`, `styled-components`. **Giữ** `next-sanity` vì studio import `NextStudio`; `styled-components` còn là transitive dep của gói @sanity. | `121dae3` |
| 1.8 | Bật type-checking | Xoá `typescript.ignoreBuildErrors`. `tsc --noEmit`: 12 lỗi → **0 lỗi** (9 lỗi `NumberField.value`, 1 lỗi kiểu `getInspirationList`). | `6eb0b6c` |
| 1.9 | Điều tra ESLint | **Lỗi cấu hình repo, không phải môi trường**: `eslint.config.mjs` dùng API flat-config của ESLint 9 (`eslint/config`, export flat của eslint-config-next) nhưng `package.json` pin `eslint ^8.0.0` (8.57.1) và `eslint-config-next@14.2.6` chỉ có bản legacy → config chưa bao giờ chạy. Fix tối thiểu: chuyển sang `.eslintrc.json` (extends `next/core-web-vitals`), xoá `eslint.config.mjs`, sửa 10 lỗi `react/no-unescaped-entities` phát sinh từ bản dịch 1.5. `npm run lint` + lint toàn bộ app/lib: **sạch 0 lỗi**. | `06d3107` |

## Hạng mục một phần (đã log)

**1.7 — Bổ sung 3 ảnh thiếu (2/3):**
- ✅ **Dwarf Baby Tears** — ảnh "Cuba (Hemianthus Callitrichoides)" — DGuarch (Flickr) — CC BY-NC-SA 2.0 — đã upload Sanity + gắn `mainImage` (`image-f165ed85...-600x449-jpg`).
- ✅ **CO₂ Regulator Kit** — ảnh "CO2 Regulator w/ solenoid" — Franklin Dattein (Flickr) — CC BY-NC 2.0 — đã upload + gắn (`image-70b56245...-600x400-jpg`).
- ⛔ **Hang-On-Back Filter** — **không tìm thấy ảnh đúng sản phẩm** tại bất kỳ nguồn cho phép (Wikimedia Commons không có; Openverse/Flickr không có HOB filter; Flickr CDN bị chặn từ mạng này — phải lấy qua proxy Openverse). Theo quy tắc plan: **bỏ qua, không gán ảnh gần đúng**. Attribution đầy đủ tại `scripts/.missing-images-report.json`.
- ⚠️ Cả 2 ảnh gắn được đều giấy phép **CC BY-NC** (nguồn mở duy nhất khớp đúng loài/sản phẩm sau khi Commons trống) — lưu ý nếu site thương mại hoá cần thay ảnh.
- Ghi chú: hạng mục này là thao tác dữ liệu Sanity (không có thay đổi code nên không có commit riêng; script + report nằm trong `scripts/`, untracked theo convention).

## Definition of Done Phase 1 — ĐẠT
- ✅ Build PASS (lần cuối 32.5s), `tsc --noEmit` 0 lỗi, `eslint` 0 lỗi.
- ✅ Sitemap đủ URL (174), feed.xml tiếng Anh, 0 dead import.
- ✅ Ảnh: 2/3 bổ sung, 1 ghi log không tìm được.
- ✅ Báo cáo TS/lint số lỗi còn lại: 0.

## Việc con người cần làm thủ công (không thể tự làm)
1. **Sanity Webhook** (sanity.io/manage → API → Webhooks): tạo webhook GROQ (filter `_type in [...]` + `_updatedAt`) trỏ `https://aquamind.life/api/revalidate` kèm header `x-verification-key` = `SANITY_REVALIDATE_SECRET`.
2. **Vercel env**: set `SANITY_REVALIDATE_SECRET` (giá trị hiện có trong `.env.local`; file này không commit).
3. (Tuỳ chọn) Cân nhắc thay 2 ảnh CC BY-NC khi có nguồn cho phép thương mại.

## Số liệu trước/sau (nhanh)
- Trang detail `force-dynamic` → SSG + ISR 1h; trang list ISR 5m → giảm fetch Sanity mỗi request về gần 0, TTVB giảm, chi phí Sanity giảm.
- Sitemap 27 → 174 URL; sitemap/feed ISR 1h.
- Build-time type-check + lint bật: ngăn lỗi tái phát.

## Sẵn sàng Phase 2
Phase 1 xong theo quy tắc plan. Phase 2 (data ops: featured posts, author, ảnh body, seed tools/collections) làm trong phiên riêng theo quyết định mặc định đã chốt: English-only, gán 1 author hiện có, 2-3 ảnh/bài.
