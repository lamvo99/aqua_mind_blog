# UPGRADE_PLAN.md — AquaMind (Next.js + Sanity)

> **Vai trò của tài liệu này:** Đây là bản kế hoạch của Lead Developer kiêm BA/PO, dựa trên `CURRENT_STATE.md` (audit 2026-07-31) + nghiên cứu thị trường aquascaping/aquarium hiện tại. Tài liệu được viết để **giao thẳng cho một AI Agent khác đọc và thực thi**.
> **Cách dùng:** Giao từng `## PHASE` theo đúng thứ tự. Không giao cả file một lúc cho model free/flash — mỗi phase nên chạy 1 phiên riêng, review kết quả trước khi giao phase kế tiếp.
> **Kế thừa quy ước đã thống nhất:** site chưa có user thật → Agent làm việc và **commit thẳng lên `main`**, nhưng bắt buộc **mỗi hạng mục = 1 commit riêng, build pass mới được commit tiếp** (để revert từng phần nếu cần). Không tạo branch phụ, không cần chờ merge thủ công.

---

## 0. Ràng buộc kiến trúc (đọc trước khi làm bất cứ gì)

**Site hiện KHÔNG có backend riêng** (không Express/NestJS, không database ngoài Sanity). Nguyên tắc cho toàn bộ kế hoạch:

| Được phép làm (không tính là "thêm backend") | KHÔNG được tự ý thêm (phải hỏi con người trước) |
|---|---|
| Next.js API routes (`app/api/*`) chạy trên serverless của Vercel | Một server độc lập (Express/Fastify/NestJS chạy 24/7 riêng) |
| Dùng chính Sanity dataset làm nơi lưu dữ liệu do người dùng tạo (comment, v.v.) qua API route có token phía server | Một database mới (Postgres/Supabase/MongoDB...) |
| Gọi API của dịch vụ quản lý (managed SaaS) qua env var key: ESP gửi email (Resend/Buttondown/Mailchimp), rate-limit KV (Upstash Redis/Vercel KV) | Tự dựng hệ thống auth/tài khoản người dùng |
| Mã hoá state vào URL query param để "chia sẻ" kết quả tool (không cần lưu DB) | Bất kỳ tính năng cần lưu dữ liệu xuyên thiết bị gắn với 1 người dùng cụ thể (tài khoản, "tank của tôi") |

Danh sách chi tiết việc **được làm ngay** ở Phase 1-4, việc **phải dừng lại hỏi trước** ở Phase 5.

---

## 1. Tóm tắt research (căn cứ để ưu tiên tính năng)

Đã khảo sát các sản phẩm/website đầu ngành để rút insight áp dụng cho AquaMind — không sao chép giao diện hay nội dung của họ, chỉ tham chiếu **loại tính năng** đã được thị trường kiểm chứng:

| Tham chiếu | Tính năng đáng chú ý | Áp dụng cho AquaMind |
|---|---|---|
| AqAdvisor / App-aquatic / Aquatic-Art | Stocking calculator + **compatibility checker theo cặp loài**, giải thích lý do xung đột (nhiệt độ, pH, tính cách, kích thước), share bằng 1 link, không cần đăng nhập | AquaMind đã có Stocking calculator + đủ field species (temp/ph/gh/temperament/waterZone/compatibleSpecies) nhưng CHƯA nối 2 thứ này lại → cơ hội lớn nhất, xem Phase 3.1 |
| Tropica plant database | Bộ lọc đa tiêu chí (ánh sáng, tốc độ lớn, pH, nhiệt độ, xuất xứ) trên trang danh sách cây | AquaMind đã có filter chip đơn giản trên `DatabaseGrid` — có thể nâng cấp thành quiz dẫn dắt cho người mới (Phase 3.2) thay vì chỉ filter thô |
| IAPLC / ADA Nature Aquarium / AGA | Gallery cuộc thi theo năm, phân loại theo style (Iwagumi, Dutch, Jungle...), tính năng "so sánh"/"bookmark" | `inspiration.style` đã có sẵn nhưng chưa khai thác thành pillar content; tính năng "so sánh" chưa tồn tại ở AquaMind (Phase 3.3, 3.7) |
| Xu hướng SEO/content 2026 (nhiều nguồn ngành marketing) | Nội dung tương tác (quiz/calculator) có engagement/thời gian ở lại trang cao hơn đáng kể so với nội dung tĩnh; "topic cluster" (liên kết nội bộ theo chủ đề) đang thay thế chiến lược từ khoá đơn lẻ | Ưu tiên xây thêm tool tương tác (Phase 3) + tự động hoá related-content liên chủ đề (Phase 3.5) |
| Hướng dẫn chính thức của Google về AI Search (công bố 15/5/2026) | Google nói rõ: **không bắt buộc** structured data/llms.txt cho AI Overviews/AI Mode; rich-result FAQ đã bị Google **khai tử từ 7/5/2026**; một nghiên cứu khác cho thấy thêm schema không tăng đo được lượt trích dẫn AI. Ngược lại, một số agency GEO/AEO vẫn khuyến nghị structured data + llms.txt cho các engine khác (ChatGPT, Perplexity) | Đây là vùng còn tranh cãi giữa tuyên bố chính thức của Google và lợi ích thương mại của các bên tư vấn GEO. Khuyến nghị: **giữ** structured data đã có (vẫn có giá trị SEO truyền thống/rich result ngoài Google), bổ sung thêm ở mức chi phí thấp (Phase 3.9), nhưng **không đầu tư lớn** hay hứa hẹn "sẽ được AI trích dẫn" — đây không phải khoản đầu tư chắc thắng theo dữ liệu hiện tại |

**Kết luận ưu tiên:** Giá trị lớn nhất, chi phí kỹ thuật thấp nhất, và có tiền lệ được thị trường kiểm chứng nằm ở việc **kết hợp dữ liệu Sanity đã có (137 documents) thành các công cụ tương tác** — không phải thêm tính năng xã hội/tài khoản (vốn cần backend thật).

---

## 2. Quyết định cần con người xác nhận TRƯỚC khi Agent bắt đầu Phase 3 trở đi

Agent có thể tự chạy Phase 0-2 mà không cần hỏi. Nhưng các lựa chọn dưới đây ảnh hưởng đến hướng sản phẩm — nên quyết định trước, hoặc để Agent dùng phương án mặc định (in đậm) và bạn điều chỉnh sau nếu cần:

1. **Ngôn ngữ site:** English-only (đồng bộ toàn site, domain/audience hiện tại là tiếng Anh) **[mặc định]**, hay đầu tư song ngữ VI/EN để khai thác cộng đồng aquascaping Việt Nam đang phát triển? → Phase 1.5 mặc định dọn sạch về tiếng Anh; song ngữ là quyết định chiến lược riêng, không làm trong plan này.
2. **Chiến lược tác giả (author):** gán 1 author hiện có cho toàn bộ 11 bài còn thiếu **[mặc định]**, hay đầu tư thêm 2-3 author persona theo chuyên môn (freshwater/reef/equipment) để tăng tín hiệu E-E-A-T cho SEO? Việc thứ hai cần bạn cung cấp thông tin/ảnh người thật hoặc bút danh.
3. **Newsletter:** cho phép Agent đăng ký tài khoản ở một ESP miễn phí (Buttondown/Resend/Mailchimp) và gắn API key vào env, hay bạn tự tạo tài khoản rồi đưa key cho Agent? Agent không nên tự ý tạo tài khoản gắn với email/thanh toán của bạn.
4. **Phase 5 (danh sách chặn):** duyệt trước hạng mục nào (nếu có) được phép làm ngay, hạng mục nào để sau — xem bảng ở Phase 5.

Nếu không có phản hồi, Agent dùng phương án mặc định (in đậm) và ghi rõ trong báo cáo cuối để con người điều chỉnh sau.

---

## 3. Quy tắc thực thi chung (áp dụng mọi Phase)

- Đọc đúng field/schema/file path đã liệt kê trong `CURRENT_STATE.md` và trong plan này — **không tự bịa tên field mới** nếu chưa xác nhận qua đọc schema thật.
- Mỗi hạng mục: sửa code → `npm run build` → pass mới commit (message rõ ràng, tiền tố `feat:`/`fix:`/`chore:`/`perf:`) → sang hạng mục tiếp theo.
- Ảnh mới (nếu cần): thứ tự nguồn Wikimedia Commons > Unsplash API > Pexels API, không lấy từ Google Images. Không tìm được ảnh đúng loài/sản phẩm → bỏ qua, ghi log, không gán ảnh gần đúng.
- Không cài thêm package trừ khi thật sự cần; nếu cần, giải thích trong commit message.
- Nếu 1 hạng mục lỗi build 2 lần liên tiếp: revert riêng phần đó, ghi chú vào báo cáo cuối, chuyển hạng mục khác — không block cả Phase.
- Cuối mỗi Phase: xuất báo cáo ngắn (hạng mục hoàn thành / bỏ qua / lý do) trước khi nhận Phase kế tiếp.

---

## PHASE 0 — Re-Recon (bắt buộc, ~15 phút)

`CURRENT_STATE.md` được audit ngày 2026-07-31 — có thể đã có thay đổi từ các phiên làm việc sau đó. Trước khi làm bất cứ gì:

1. Đọc lại `CURRENT_STATE.md` (đính kèm cùng plan này).
2. Chạy lại truy vấn đếm số document theo từng schema type trong Sanity, so với bảng ở mục 4 của `CURRENT_STATE.md` — báo cáo chênh lệch nếu có.
3. Xác nhận `npm run build` vẫn PASS (baseline sạch).
4. Xác nhận đang ở `main`, working tree sạch.
5. Nếu có chênh lệch lớn (vd số liệu khác nhiều, file/route đã đổi cấu trúc), DỪNG và báo cáo trước khi tiếp tục — kế hoạch dưới đây giả định cấu trúc đúng như `CURRENT_STATE.md` mô tả.

---

## PHASE 1 — Nền tảng kỹ thuật (Performance + Correctness)

*Mục tiêu: sửa các vấn đề kỹ thuật đã xác nhận, không thêm tính năng mới ở phase này.*

### 1.1 Bật ISR / on-demand revalidation *(Impact: Cao — đòn bẩy TTVB/chi phí Sanity lớn nhất đã xác định; Effort: Trung bình)*
Tất cả trang nội dung hiện là `force-dynamic` (fetch Sanity mỗi request). Chuyển sang ISR:
- Với từng route segment (`/`, `/posts`, `/posts/[slug]`, `/species`, `/species/[slug]`, `/plants*`, `/corals*`, `/equipment*`, `/problems*`, `/inspiration*`): thay `export const dynamic = "force-dynamic"` bằng `export const revalidate = <N giây>`. Đề xuất khởi điểm: trang danh sách (list) 180-300s, trang chi tiết (detail) 3600s — vì nội dung ít đổi trong ngày.
- Tạo route `app/api/revalidate/route.ts`: nhận POST kèm secret (so khớp env var, vd `SANITY_REVALIDATE_SECRET`), đọc `_type` và `slug` từ payload Sanity webhook, gọi `revalidatePath()` (hoặc `revalidateTag()` nếu áp dụng tag-based fetch) cho đúng route liên quan.
- Trong Sanity project settings, hướng dẫn (ghi vào báo cáo, không tự làm được vì cần quyền dashboard) cách tạo GROQ-powered Webhook trỏ về `/api/revalidate` kèm secret — đây là bước con người cần làm thủ công trên sanity.io/manage.
- Vì `generateStaticParams` trên các trang chi tiết hiện đang "inert" dưới `force-dynamic`, sau khi đổi sang `revalidate`, xác nhận nó hoạt động đúng (không lỗi build, không tạo quá nhiều static params nếu số lượng lớn).

### 1.2 Sửa SearchAction JSON-LD *(Effort: Thấp)*
`websiteSchema` đang trỏ `/posts?search=` — sửa thành URL thật `/search?q={search_term_string}`.

### 1.3 Hoàn thiện sitemap.xml *(Impact: Trung bình — SEO discoverability; Effort: Thấp-Trung bình)*
Hiện chỉ có home/`/posts`/`/about`/`/contact`+ bài viết. Bổ sung động (query Sanity lúc build/request): toàn bộ URL của species/plants/corals/equipment/problems/inspiration (list + detail), `/database`, `/tools` + 8 route con, `/setup-planner`, `/start-here`.

### 1.4 Sửa metadata feed.xml *(Effort: Thấp)*
`<language>` đang để `vi` kèm mô tả tiếng Việt trong khi site tiếng Anh — đổi thành `en` + mô tả tiếng Anh (đồng bộ quyết định ở mục 2.1 của plan).

### 1.5 Dọn nội dung tiếng Việt còn sót *(Effort: Thấp-Trung bình)*
Sweep `/about` (mission/values/CTA) và chuỗi lỗi tiếng Việt trong `/api/newsletter*` — dịch sang tiếng Anh để đồng nhất toàn site (theo phương án mặc định ở mục 2.1).

### 1.6 Xoá dead code *(Effort: Thấp, giảm nợ kỹ thuật)*
- `app/components/AdSlot.tsx` (không được dùng ở đâu).
- `useSearch` không dùng trong store.
- `sanity/lib/client.ts` + `sanity/lib/live.ts` (`next-sanity` wrapper) — **quyết định**: nếu Phase 1.1 (ISR) sẽ tận dụng `next-sanity` cho tag-based revalidation thì GIỮ và nối vào thay vì xoá; nếu không, xoá cùng package `next-sanity` khỏi `package.json`.
- Dependency `styled-components`, `pdfkit` — xoá khỏi `package.json` nếu xác nhận không import ở đâu.

### 1.7 Bổ sung 3 ảnh còn thiếu *(Effort: Thấp)*
Dwarf Baby Tears (*Hemianthus callitrichoides*), CO₂ Regulator Kit, Hang-On-Back Filter — áp dụng đúng quy tắc nguồn ảnh ở mục 3 (Quy tắc thực thi chung).

### 1.8 Bật lại type-checking *(Effort: Trung bình-Cao, tuỳ số lỗi thực tế)*
Xoá `typescript.ignoreBuildErrors: true` trong `next.config.js`, chạy `tsc --noEmit`, sửa lỗi theo từng batch nhỏ (nhóm theo thư mục), mỗi batch 1 commit. Nếu số lỗi quá lớn (>50), báo cáo tổng số và dừng lại xin ưu tiên thay vì cố sửa hết trong 1 phiên.

### 1.9 Điều tra lỗi ESLint môi trường *(Effort: Thấp — chỉ điều tra, không bắt buộc sửa)*
`npm run lint` hiện lỗi module-resolution. Kiểm tra `node_modules`/config ESLint, thử `rm -rf node_modules && npm install` trong sandbox để xác nhận có phải lỗi môi trường CI hay lỗi cấu hình thật. Ghi kết quả vào báo cáo, không bắt buộc fix nếu là vấn đề môi trường ngoài tầm kiểm soát.

**Definition of Done Phase 1:** build pass, sitemap đầy đủ URL, feed.xml tiếng Anh, 0 dead import, 3/3 ảnh còn thiếu đã bổ sung (hoặc ghi log không tìm được), báo cáo số lỗi TypeScript còn lại (nếu chưa sửa hết).

---

## PHASE 2 — Kích hoạt dữ liệu đang "ngủ" (chủ yếu content ops, ít code)

*Mục tiêu: các tính năng ĐÃ code sẵn nhưng chưa hoạt động vì thiếu data — chi phí thấp, hiệu quả tức thì.*

### 2.1 Kích hoạt Featured Posts *(Effort: Thấp)*
Set `isFeatured: true` cho 3-5 bài chất lượng/đại diện nhất trong 12 bài hiện có → khu vực "Featured" trên home (đã build sẵn) sẽ hiển thị.

### 2.2 Gán author cho các bài còn thiếu *(Effort: Thấp, theo phương án mặc định ở mục 2 câu hỏi 2)*
11/12 bài chưa có author. Gán author hiện có (mặc định) cho toàn bộ, hoặc chờ quyết định về multi-author persona.

### 2.3 Thêm ảnh trong nội dung bài viết *(Effort: Trung bình)*
0/12 bài có ảnh trong `body`. Với mỗi bài, chèn 2-3 ảnh phù hợp ngữ cảnh — ưu tiên tái sử dụng asset đã có trong thư viện (118+ ảnh từ species/plant/coral/equipment liên quan đến chủ đề bài viết) trước khi tìm ảnh mới; chỉ tìm ảnh mới (theo quy tắc nguồn ở mục 3) nếu không có ảnh tái sử dụng phù hợp.

### 2.4 Seed `tool` documents khớp route hardcode *(Impact: Trung bình — sửa link gãy; Effort: Thấp)*
Tạo đúng 8-9 document `tool` với `slug` khớp chính xác các route đã hardcode: `aquarium-volume`, `water-change`, `co2`, `dosing`, `pump-flow`, `salt-mixing`, `lighting`, `stocking` (+ `setup-planner` nếu muốn nó xuất hiện trong `relatedTools`). Việc này khiến `problem.relatedTools` (hiện link gãy) hoạt động đúng.

### 2.5 Seed `collection` (Learning Path) documents *(Effort: Trung bình — cần tư duy biên tập)*
Đề xuất 3-4 learning path dựa trên nội dung đã có, ví dụ (Agent tự điều chỉnh theo nội dung 12 bài + 6 loại database thực tế): "Beginner Freshwater Planted Tank", "Diagnosing Algae Problems", "Reef Tank Basics". Mỗi collection: `steps[]` tham chiếu đúng slug bài viết/tool đã tồn tại (không tạo reference tới slug không có thật). Đây là data cho UI sẽ build ở Phase 3.6 — Phase này chỉ seed data, chưa cần route hiển thị.

**Definition of Done Phase 2:** Featured section hiển thị trên home, tất cả bài có author, ≥2 ảnh/bài trong body, 8-9 tool docs khớp slug hardcode, 3-4 collection docs với steps hợp lệ.

---

## PHASE 3 — Tính năng tương tác mới (trọng tâm giá trị, chỉ Sanity + Next.js)

*Thứ tự khuyến nghị theo Impact/Effort: 3.5 → 3.1 → 3.4(v1) → 3.2 → 3.6 → 3.3 → 3.8 → 3.9 → 3.7 → 3.10*

### 3.1 Compatibility & Stocking Advisor *(Impact: Cao — tính năng cờ hiệu; Effort: Trung bình)*
Tính năng giá trị nhất theo research (mục 1). Xây trang mới (vd `/tools/compatibility-checker`, liên kết từ `/tools` và từ Stocking calculator hiện có):
- Người dùng nhập tank size (lít) + chọn nhiều species (autocomplete/search từ danh sách 43 species qua Sanity).
- Với mỗi cặp species đã chọn, tính compatibility dựa trên field có sẵn: overlap khoảng `temp`/`ph`/`gh`, so `temperament`, `waterZone` (tránh cạnh tranh cùng tầng nước quá mức nếu cùng temperament hung dữ), `schooling` (cảnh báo nếu số lượng loài schooling quá ít), tổng `sizeCm` so với tank size và `tankSizeMinL` của từng loài.
- Hiển thị lý do bằng ngôn ngữ tự nhiên cho mỗi cảnh báo (không chỉ "không tương thích" mà "chênh lệch pH X, loài A cần Y-Z trong khi loài B cần...") — nếu `species.compatibleSpecies[]` đã có reference sẵn giữa 2 loài, ưu tiên dùng trực tiếp field này thay vì suy luận lại từ đầu.
- Cho phép "share" bằng cách encode danh sách species + tank size vào URL query param (không cần lưu DB) — copy link là đủ để người khác xem lại đúng combo đó.
- Tái sử dụng logic/format hiện có của `Stocking` calculator (`app/components/tools/`) làm nền, không viết lại từ đầu nếu tận dụng được.

### 3.2 Species/Plant/Coral Finder Quiz *(Impact: Cao cho người mới; Effort: Trung bình)*
Khác với filter chip thô hiện có trên `DatabaseGrid`, đây là flow dẫn dắt từng bước (3-5 câu hỏi: kích thước tank, kinh nghiệm, loại nước, mức ánh sáng có sẵn) rồi lọc + xếp hạng kết quả từ `species`/`plant`/`coral` dựa trên `difficulty`, `tankSizeMinL`, `light`, khoảng `temp/ph`. Đặt ở `/start-here` hoặc route riêng, liên kết nổi bật từ home — đây là điểm vào thân thiện cho người mới, bổ sung cho (không thay thế) filter chip nâng cao hiện có.

### 3.3 Compare Tool *(Impact: Trung bình; Effort: Thấp-Trung bình)*
Thêm toggle "+ So sánh" trên `DatabaseCard.tsx`, cho phép chọn 2-3 item cùng loại (species/plant/coral/equipment), hiển thị bảng so sánh side-by-side dùng đúng field schema tương ứng làm hàng.

### 3.4 Problem Symptom-Based Diagnosis Wizard
`problem.symptoms` hiện là Portable Text (rich text tự do), không phải field có cấu trúc — matching chính xác khó ngay lập tức. Chia 2 bước:
- **v1 (Effort: Trung bình):** flow chọn checkbox triệu chứng phổ biến (soạn thủ công danh sách triệu chứng dựa trên đọc nội dung 19 problem hiện có), match bằng keyword/text search vào nội dung PT hiện có, xếp hạng theo số từ khoá khớp. Chấp nhận độ chính xác tương đối.
- **v2 (Effort: Cao hơn, làm sau nếu v1 hiệu quả):** thêm field `symptomTags: array of string` (hoặc reference tới 1 danh sách triệu chứng chuẩn hoá) vào schema `problem`, migrate 19 document hiện có để gắn tag, sau đó matching chính xác tuyệt đối thay vì keyword. **Đây là thay đổi schema — chỉ làm sau khi xác nhận field mới không phá vỡ dữ liệu cũ (field optional, không bắt buộc).**

### 3.5 Tự động hoá liên kết nội bộ theo chủ đề (topic cluster) *(Impact: Cao — SEO cộng dồn; Effort: Trung bình)*
- Sửa `RelatedPosts.tsx`: hiện đang fetch TOÀN BỘ posts rồi filter theo category ở client/server — thay bằng 1 GROQ query fetch trực tiếp posts cùng category (giới hạn 3), giảm tải Sanity.
- Thêm block "Related Species/Plants/Problems" trên trang bài viết và ngược lại "Related Articles" trên trang species/plant/coral/equipment/problem detail — dựa trên field reference đã có (`relatedPosts[]`, `compatibleSpecies[]`, `relatedTools[]`) và field phân loại chung (`family`, `category`) khi không có reference tường minh.

### 3.6 Trang `/learn` cho Learning Path *(Effort: Thấp — data đã seed ở Phase 2.5)*
Render các `collection` document thành trang danh sách + trang chi tiết dạng checklist từng bước (`steps[]`). Trạng thái "đã hoàn thành bước nào" lưu localStorage (chấp nhận được — chỉ là tiện ích UX cá nhân, không phải dữ liệu quan trọng cần đồng bộ đa thiết bị).

### 3.7 Style Guide pillar content *(Effort: Thấp — nặng về nội dung hơn code)*
Viết nội dung giải thích các style aquascaping phổ biến (Iwagumi, Dutch, Jungle, Biotope, Walstad — theo thuật ngữ ngành đã xác nhận qua research) dưới dạng bài viết hoặc trang tĩnh, liên kết 2 chiều với các `inspiration` document có `style` tương ứng.

### 3.8 Nâng cấp hiển thị filter trên `InspirationGrid` *(Effort: Thấp)*
Hiện đã có filter theo style/difficulty — bổ sung đếm số lượng item mỗi style, và liên kết mỗi style tới pillar content ở mục 3.7 khi có.

### 3.9 Mở rộng structured data ở mức chi phí thấp *(Effort: Thấp, xem lưu ý research mục 1)*
- Thêm `HowTo` schema cho các trang `/tools/*` (mỗi calculator vốn đã có công thức rõ ràng — map trực tiếp sang HowTo step).
- **Không** thêm `Product` schema cho equipment ngay — schema equipment hiện không có field giá/availability nên Product schema sẽ thiếu field bắt buộc để hợp lệ. Chỉ làm khi có quyết định về pricing/affiliate link.
- Có thể thêm nội dung dạng Q&A trên trang species/problem để tăng giá trị nội dung cho người đọc — không cần gắn `FAQPage` schema với kỳ vọng rich-result trên Google (đã bị khai tử), gắn nếu muốn hỗ trợ các engine AI khác nhưng nêu rõ đây là "cheap to add, not proven ROI".
- `llms.txt`: có thể thêm (chi phí gần như bằng 0), nhưng xếp độ ưu tiên THẤP — không phải khoản đầu tư có bằng chứng chắc thắng theo hướng dẫn chính thức mới nhất của Google.

### 3.10 PWA manifest cơ bản + calculator hoạt động offline *(Effort: Thấp-Trung bình)*
Thêm `manifest.json` + service worker đơn giản cho phép các trang `/tools/*` (vốn tính toán thuần client-side, không cần data Sanity) hoạt động offline/installable — tận dụng đúng đặc tính "không cần backend" của các calculator.

**Definition of Done Phase 3:** mỗi mục có route/component hoạt động được, build pass, không mục nào phá vỡ tính năng cũ; các mục dùng field mới trong schema (3.4 v2) phải là optional field, migrate không mất dữ liệu.

---

## PHASE 4 — Persistence "backend-lite" (vẫn không cần server riêng, nhưng cần quyết định dịch vụ)

### 4.1 Comment server-side qua Sanity *(Impact: Trung bình-Cao — UGC thật có giá trị SEO/community; Effort: Trung bình)*
Tạo Sanity document type mới `comment` (field tối thiểu: post reference, tên, nội dung, `approved: boolean` mặc định `false`, timestamp). Tạo `app/api/comments/route.ts` dùng `SANITY_API_TOKEN` phía server để `client.create()` — token KHÔNG BAO GIỜ lộ ra client. Comment mới mặc định `approved: false`, chỉ hiển thị public sau khi duyệt trong Sanity Studio. Giữ `Comments.tsx` hiện tại (localStorage) làm optimistic UI/fallback ẩn danh, không xoá.

### 4.2 Newsletter thật *(Impact: Cao cho growth; Effort: Thấp-Trung bình, phụ thuộc quyết định ở mục 2 câu hỏi 3)*
Thay `/api/newsletter` mock bằng gọi API thật của 1 ESP (Buttondown/Resend/Mailchimp — ưu tiên loại có sẵn double opt-in built-in để xoá hẳn logic token tự chế hiện tại). Cần bạn cung cấp API key qua env var — Agent không tự tạo tài khoản.

### 4.3 Likes/Bookmark — QUYẾT ĐỊNH GIỮ NGUYÊN localStorage *(quyết định có chủ đích, không phải thiếu sót)*
Không đầu tư đưa likes/bookmark lên server ở giai đoạn này: đây là vanity metric, giá trị SEO/business thấp so với chi phí kỹ thuật (cần chống spam counter, chống inflate). Ưu tiên nguồn lực cho 4.1 (comment — có giá trị nội dung thật) hơn.

### 4.4 (Tuỳ chọn, chỉ làm nếu comment bị spam thật) Rate limiting nhẹ *(Effort: Thấp, làm khi cần)*
Nếu sau khi launch 4.1 phát sinh spam, thêm Upstash Redis (free tier) rate-limit theo IP cho `/api/comments`. Không cần làm trước — honeypot hiện có đã là lớp phòng vệ đầu tiên.

**Definition of Done Phase 4:** comment mới xuất hiện trong Sanity Studio ở trạng thái chờ duyệt; newsletter thật gửi được email xác nhận; không có token/API key nào lộ ra bundle client (kiểm tra bằng cách grep bundle output).

---

## PHASE 5 — DỪNG LẠI, KHÔNG TỰ LÀM (cần con người quyết định trước)

Đây là câu trả lời trực tiếp cho "chức năng cần chú ý" — các hạng mục sau **có giá trị thật** (một số được kiểm chứng mạnh qua research, đặc biệt UGC gallery kiểu IAPLC) nhưng đều kéo theo quyết định về infra/chi phí/rủi ro vượt phạm vi "Sanity + Next.js, không backend riêng":

| Tính năng | Vì sao hấp dẫn | Vì sao phải dừng lại hỏi trước |
|---|---|---|
| Tài khoản người dùng (auth) | Nền tảng cho mọi tính năng cá nhân hoá bên dưới | Cần chọn auth provider (Auth.js/Clerk) + có thể cần database thật ngoài Sanity |
| "My Tank" — nhật ký thông số/tăng trưởng theo thời gian | Tăng retention mạnh, đúng nhu cầu hobbyist thật | Cần auth + lưu trữ dữ liệu định kỳ theo user — không hợp lý làm trên Sanity thuần |
| UGC Gallery (người dùng nộp ảnh tank của mình, kiểu IAPLC/AGA) | **Match rất mạnh với xu hướng cộng đồng lớn nhất ngành** (IAPLC/AGA/EAPLC đều xoay quanh model này) — tiềm năng viral/traffic cao | Cần moderation workflow, upload/storage xử lý ảnh người dùng, rủi ro nội dung/spam — nên làm sau khi có auth cơ bản |
| AI Aquascape Advisor (chatbot tư vấn dùng chính data species/plant/equipment) | Kỹ thuật khả thi chỉ với 1 Next.js API route + API key LLM, không cần "backend riêng" đúng nghĩa | Có chi phí API thật theo lượt gọi, cần rate-limit chống lạm dụng, cần kiểm soát nội dung đầu vào/đầu ra — cần bạn duyệt ngân sách trước khi Agent bật tính năng này |
| E-commerce/affiliate links cho equipment | Mở khoá Product schema (3.9), monetize trực tiếp | Cần chọn nền tảng/affiliate program, ảnh hưởng định vị nội dung (editorial vs bán hàng) |
| Search full-text/fuzzy đa loại nội dung (hiện tại: prefix-match GROQ, modal chỉ search bài viết) | Trải nghiệm search tốt hơn nhiều, đặc biệt trên mobile | Nếu cải thiện trong phạm vi Sanity (weighted GROQ, search nhiều type hơn) → làm được ở Phase 3, không cần hỏi. Nếu cần fuzzy/typo-tolerant thật sự → cần dịch vụ search riêng (Algolia/Typesense), nên thử nâng cấp GROQ trước, chỉ nâng cấp dịch vụ khi có dữ liệu sử dụng chứng minh cần thiết |

**Quy tắc:** Agent không được tự ý bắt đầu bất kỳ mục nào ở Phase 5, kể cả khi kỹ thuật khả thi trong 1 phiên làm việc. Nếu muốn đề xuất, ghi vào báo cáo cuối để con người quyết định.

---

## PHASE 6 — Báo cáo cuối (sau mỗi Phase, và tổng hợp sau khi xong Phase 1-4)

Theo đúng format đã dùng ở lần trước:
1. Danh sách commit trên `main` trong phiên này.
2. Kết quả build cuối (bắt buộc PASS).
3. Bảng hạng mục: Hoàn thành / Bỏ qua (kèm lý do) — theo từng Phase.
4. Số liệu trước/sau nếu có thay đổi data (giống bảng đã dùng cho seed data trước đây).
5. Danh sách quyết định còn treo (từ mục 2) chưa có phản hồi từ con người.
6. Danh sách Phase 5 — nếu Agent có ý tưởng bổ sung nào khác phát sinh trong lúc làm, ghi thêm vào đây, KHÔNG tự triển khai.

---

## Phụ lục — Success Metrics nên theo dõi sau khi launch Phase 1-3

Không phải việc của Agent code, nhưng để con người theo dõi hiệu quả plan này sau triển khai: organic sessions, pages/session, thời gian trung bình/phiên, tỷ lệ hoàn thành tool (bắt đầu vs. ra kết quả) ở Compatibility Advisor/Quiz, tỷ lệ quay lại (returning visitor), tỷ lệ đăng ký newsletter, số comment được submit/được duyệt mỗi tuần.
