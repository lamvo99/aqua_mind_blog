# PHASE 4 REPORT — Comments thật + Newsletter thật (qua Sanity & Resend)

**Trạng thái:** HOÀN THÀNH — Definition of Done đạt toàn bộ
**Ngày:** 2026-08-01
**Branch:** main — 4.1 + 4.2 hoàn thành, 4.3/4.4 theo quyết định của người dùng (không làm), kèm thêm task thay ảnh main image 11 bài viết

## Tóm tắt

Phase 4 đưa 2 tính năng từ "giả lập" lên "thật": **comment lưu vào Sanity với quy trình duyệt** (4.1) và **newsletter double opt-in gửi email thật qua Resend** (4.2). Giữ nguyên ràng buộc kiến trúc: chỉ Next.js API routes + Sanity, không backend riêng, không token nào lộ ra client bundle. Kèm theo quyết định của người dùng: **thay ảnh main image của 11 bài viết đã viết** bằng ảnh Unsplash (chất lượng tốt hơn ảnh hiện tại).

## Quyết định của người dùng (ảnh hưởng scope)

- Cung cấp `RESEND_API_KEY` (đã có trên Vercel env + thêm vào `.env.local` — gitignored, không commit).
- Nguồn ảnh thay thế: **Unsplash trước, Pexels dự phòng** (không dùng iStock — watermark, không free).
- 4.3 Likes/Bookmark: **giữ nguyên localStorage** (quyết định có chủ đích, đúng plan — vanity metric, chi phí chống spam cao).
- 4.4 Rate limiting: **chưa làm** — chỉ thêm Upstash Redis nếu comment bị spam thật; honeypot hiện có là lớp phòng vệ đầu tiên.

## Kết quả từng hạng mục

### 4.1 Comments thật qua Sanity ✅ (commit `8aece7f`)
- Schema mới `comment` (đăng ký trong `sanity/schemaTypes/index.ts`): `name` (≤80), `email` (private), `content` (2–2000 ký tự), `post` reference, `approved:boolean` mặc định `false`, preview hiện nội dung + "by <tên>".
- `POST /api/comments`: chỉ chạy phía server bằng `SANITY_API_TOKEN`; kiểm tra honeypot `hp_comment` (trả 200 giả để đánh lừa bot); validate slug/tên/nội dung; create comment với `approved: false` → **xuất hiện trong Sanity Studio ở trạng thái chờ duyệt** (đúng DoD).
- `GET /api/comments?post=<slug>`: chỉ trả comment có `approved == true`, sắp xếp theo `_createdAt`.
- UI: giữ `Comments.tsx` + localStorage làm optimistic/fallback (đúng plan). Comment tự submit qua API rồi lưu local với badge "Pending approval"; hiện notice "Your comment is awaiting moderation..."; trạng thái submitting/error + i18n strings mới.

### 4.2 Newsletter thật qua Resend (double opt-in) ✅ (commit `ce57a90`)
- Schema mới `subscriber`: `email`, `status: pending|confirmed`, `subscribedAt`, `confirmedAt`.
- `POST /api/newsletter`: validate email → nếu đã confirmed trả `confirmed:true`; tạo subscriber `pending` nếu mới (re-send nếu cũ); gửi email xác nhận qua Resend API (`fetch https://api.resend.com/emails`, HTML + text, nút "Confirm subscription").
- Token xác nhận **stateless HMAC-SHA256** (không phải base64url JSON trần như mock cũ): `base64url(email.mac)`, secret = `NEWSLETTER_SECRET` (fallback `SANITY_API_TOKEN`). Xoá hẳn logic token tự chế có thể bị forge.
- `GET /api/newsletter/confirm`: verify token (timing-safe) → patch subscriber `confirmed` + `confirmedAt` → redirect `/?newsletter=confirmed`.
- Dev fallback: nếu không có `RESEND_API_KEY` và không phải production → vẫn trả token trong response để test flow cục bộ.
- UI: `useNewsletter` trả `status: idle|pending|subscribed|error`; footer + NewsletterSection hiển thị "check your email" khi pending, box thành công khi confirmed; home đọc `?newsletter=confirmed` → tự set confirmed + xoá param khỏi URL.
- Refactor: `lib/sanity-server.ts` (client server-only dùng chung), `lib/newsletter.ts` (token + send email); `/api/comments` chuyển sang dùng client dùng chung.

### Bonus: Thay ảnh main image 11 bài viết ✅ (content-only, không commit — ảnh nằm trong Sanity)
- 11 post đã viết được gán ảnh Unsplash mới (planted tank, guppy, nano tank, goldfish, aquarium có equipment, cá đang ăn, dãy hồ nhiều bể cho bài budget…) qua script `tmp/replace-images.mjs`: download `images.unsplash.com` (w=1920, fm=jpg, fit=crop) → upload asset Sanity → patch `mainImage {asset, alt, credit: "Photo via Unsplash"}`. **11/11 thành công**.
- Học được: search page Unsplash/Pexels bị chặn (401/403) → tìm ảnh bằng websearch `images.unsplash.com <chủ đề>` để lấy URL CDN trực tiếp. Pexels dự phòng chưa cần dùng.

## Definition of Done — Kết quả

| Kiểm tra | Kết quả |
|---|---|
| Comment mới xuất hiện trong Sanity Studio chờ duyệt | ✅ (schema + API, `approved:false` mặc định) |
| Newsletter thật gửi được email xác nhận | ✅ Resend API được gọi; cần domain verified để gửi cho email bất kỳ (xem Ghi chú) |
| Không token/API key nào lộ ra client bundle | ✅ grep `.next/static` không thấy `RESEND_API_KEY`/`SANITY_API_TOKEN`/giá trị key; server bundle cũng không chứa literal (env đọc runtime) |
| `next build` pass | ✅ 205 trang SSG/ISR, 0 lỗi (thêm route `/api/comments`) |
| Test luồng confirm thật (local dev) | ✅ POST → subscriber `pending`; confirm token hợp lệ → 302 `/ ?newsletter=confirmed` + subscriber `confirmed` + `confirmedAt`; token giả (base64 JSON không ký kiểu cũ) → **400 bị từ chối** |
| Test data dọn sạch | ✅ subscriber test bị xoá |

## Commits (Phase 4)

```
8aece7f feat(comments): store comments in Sanity with moderation workflow (4.1)
ce57a90 feat(newsletter): real double opt-in via Resend with Sanity subscribers (4.2)
```

## Files & Scripts mới

- `sanity/schemaTypes/comment.ts`, `sanity/schemaTypes/subscriber.ts` (+ đăng ký index)
- `app/api/comments/route.ts`, `app/api/newsletter/route.ts` (viết lại), `app/api/newsletter/confirm/route.ts` (viết lại)
- `lib/sanity-server.ts` (Sanity client server-only dùng chung), `lib/newsletter.ts` (HMAC token + Resend send)
- Sửa: `app/components/Comments.tsx`, `app/components/NewsletterSection.tsx`, `app/components/footer.tsx`, `lib/store.ts`, `lib/i18n/strings.ts`, `app/api/comments/route.ts`
- Scripts (trong `tmp/`, gitignored): `replace-images.mjs`, `list-subscribers.mjs`, `make-token.mjs`, `cleanup-test.mjs`

## Ghi chú triển khai (cần con người)

- **Resend domain verified**: mặc định `NEWSLETTER_FROM` = `AquaMind <onboarding@resend.dev>` — Resend **chỉ cho gửi tới email chủ tài khoản** trong chế độ này. Để gửi cho subscriber bất kỳ ở production: thêm domain vào Resend, set env `NEWSLETTER_FROM` = `AquaMind <noreply@domain-của-bạn>`.
- **`NEWSLETTER_SECRET`** (tuỳ chọn): đặt một secret riêng trên Vercel (nếu không set, code fallback sang `SANITY_API_TOKEN`). Nếu đặt, set trên Vercel env của production.
- **`NEXT_PUBLIC_SITE_URL`**: dùng để build link confirm trong email — nếu chưa set trên Vercel, link sẽ trỏ về `localhost:3000` (sai). Nên set.
- Dữ liệu subscriber cũ dạng localStorage (`aquamind_subscribers`) không migrate sang Sanity — list đó là subscriber giả từ mock.
- Ảnh cũ (11 assets Sanity cũ) vẫn nằm trong dataset, không còn document nào tham chiếu — có thể dọn thủ công sau; xoá assets không ảnh hưởng site.

## Ghi chú cho các phase sau

- Nếu comment bị spam thật: thêm Upstash Redis rate-limit theo IP cho `POST /api/comments` (đúng plan 4.4).
- Newsletter broadcast (gửi bài mới cho subscriber đã confirm) chưa có — Sanity `subscriber` list là nền tảng sẵn sàng.
- Ảnh bài `keeping-aquarium-fish-where-to-start...` (bài cũ nhất, không thuộc 11 bài đã viết) chưa thay — cũ kỹ, có thể thay khi viết lại bài.
