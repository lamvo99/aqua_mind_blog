# PHASE 2 REPORT — Kích hoạt dữ liệu "ngủ"

**Trạng thái:** HOÀN THÀNH — Definition of Done đạt toàn bộ
**Ngày:** 2026-07-31
**Cập nhật bổ sung:** 2026-08-01 (sau khi 11 bài được viết content — xem mục "Bổ sung sau Phase 2" bên dưới)

## Tóm tắt

Phase 2 kích hoạt các tính năng đã code sẵn nhưng chưa hoạt động vì thiếu dữ liệu: Featured Posts, author, ảnh trong body bài viết, `tool` documents và `collection` (learning path) documents.

## Quyết định của người dùng (ảnh hưởng scope)

Recon phát hiện **11/12 bài viết có `body` rỗng** (chưa có nội dung) — chỉ 1 bài (`keeping-aquarium-fish-where-to-start-a-complete-beginner-s-guide`) có nội dung đầy đủ (130 blocks). Theo quyết định của người dùng: **bỏ qua 11 bài rỗng, ghi log** — không viết nội dung mới (ngoài scope Phase 2).

## Kết quả từng hạng mục

### 2.1 Featured Posts ✅
- Set `isFeatured: true` cho 1 bài duy nhất có nội dung: `keeping-aquarium-fish-where-to-start-a-complete-beginner-s-guide`
- Khu vực "Featured" trên home (đã build sẵn, filter `isFeatured == true && defined(publishedAt)`) giờ hiển thị.
- *Ghi chú:* plan đề xuất 3-5 bài, nhưng 11 bài còn lại chưa có nội dung nên không đủ điều kiện featured (theo quyết định người dùng).

### 2.2 Gán author ✅
- Gán author duy nhất hiện có **Xing Zhuang** (`423346a3-a608-4433-8cbf-85d2a8fabb9d`) cho 11 bài còn thiếu.
- 12/12 bài có author.

### 2.3 Ảnh trong body ✅ (phạm vi điều chỉnh)
- Chèn **3 ảnh** vào body bài có nội dung, tái sử dụng asset có sẵn trong thư viện (không tìm ảnh mới):
  - `Decide What Kind of Fish You Want to Keep` → Neon Tetra (`species-paracheirodon-innesi.jpg`)
  - `The Nitrogen Cycle: The Most Important Beginner Concept` → Master Test Kit (`equipment-master-test-kit.jpg`)
  - `Feeding Aquarium Fish` → Flake Fish Food (`equipment-flake-fish-food.jpg`)
- 11 bài body rỗng: **skip + log** (theo quyết định người dùng) — không có chỗ để chèn ảnh. Cần viết nội dung cho 11 bài này trong đợt content tiếp theo.

### 2.4 Seed `tool` documents ✅
- Seed **9 documents** (8 theo plan + `setup-planner` vì xuất hiện trong hardcoded route list trên `/tools`):

| slug | category | toolUrl |
|---|---|---|
| `aquarium-volume` | Volume | /tools/aquarium-volume |
| `water-change` | Water Change | /tools/water-change |
| `co2` | CO₂ | /tools/co2 |
| `dosing` | Dosing | /tools/dosing |
| `pump-flow` | Pump Flow | /tools/pump-flow |
| `salt-mixing` | Salt Mixing | /tools/salt-mixing |
| `lighting` | Lighting | /tools/lighting |
| `stocking` | Stocking | /tools/stocking |
| `setup-planner` | Planner | /setup-planner |

- Mỗi tool có `relatedPosts` trỏ tới bài viết liên quan.
- `problem.relatedTools`: 0/19 problem hiện có ref → không có link gãy; dữ liệu tool sẵn sàng cho Phase 3.5 (link theo topic) và cho việc gắn sau.

### 2.5 Seed `collection` (Learning Path) ✅
- Seed **4 collections**, mỗi collection 3-4 steps, tất cả ref hợp lệ (không broken ref), có mainImage tái sử dụng từ thư viện:

| slug | level | topic | steps |
|---|---|---|---|
| `beginner-s-first-freshwater-aquarium` | Beginner | Freshwater | 4 |
| `understanding-and-managing-the-nitrogen-cycle` | Beginner | Freshwater | 3 |
| `planted-tank-essentials` | Intermediate | Planted | 4 |
| `marine-and-reef-fundamentals` | Beginner | Marine | 4 |

- Steps tham chiếu đúng slug tồn tại (bài `keeping-aquarium-fish-...` + 9 tool docs) — không tạo reference tới slug không có thật.

## Definition of Done — Kết quả

| DoD | Kết quả |
|---|---|
| Featured section hiển thị trên home | ✅ PASS (1 bài) |
| Tất cả bài có author | ✅ PASS (12/12) |
| ≥1 ảnh/bài trong body | ✅ PASS (1/1 bài có nội dung; 11 bài rỗng skip theo quyết định) |
| 8-9 tool docs khớp slug hardcode | ✅ PASS (9/9 routes) |
| 3-4 collection docs với steps hợp lệ | ✅ PASS (4/4, 0 broken ref) |
| Build pass | ✅ PASS (`npm run build`) |

## Files & Scripts

- `scripts/seed-featured-author.mjs` — 2.1 + 2.2
- `scripts/add-body-images.mjs` — 2.3 (idempotent)
- `scripts/seed-tools.mjs` — 2.4 (idempotent)
- `scripts/seed-collections.mjs` — 2.5 (idempotent)
- `scripts/verify-phase2.mjs` — kiểm tra DoD
- `scripts/recon-phase2.mjs`, `scripts/recon2.mjs`, `scripts/check-bodies.mjs`, `scripts/outline-posts.mjs` — recon

## Bổ sung sau Phase 2 (2026-08-01)

Sau khi 11 bài viết trống được viết content đầy đủ và publish (xem `docs/` — task "AquaMind Content" 7 bước), các hạng mục bị skip trước đây đã được hoàn thành:

- **2.1 Featured — bổ sung:** `isFeatured: true` cho 3 bài (home hiển thị tối đa 3):
  - `keeping-aquarium-fish-where-to-start-a-complete-beginner-s-guide` (đã có từ Phase 2)
  - `your-first-30-days-with-an-aquarium-a-beginner-s-journal`
  - `the-nitrogen-cycle-the-foundation-of-every-aquarium`
- **2.3 Ảnh body — bổ sung:** chèn **22 ảnh** (2 ảnh/bài × 11 bài) tái sử dụng asset có sẵn trong thư viện, mỗi ảnh có `alt` + `caption`, đặt sau heading phù hợp theo từng section. Giờ **12/12 bài có ≥1 ảnh body** (bài keeping cũ có 3, các bài mới có 2).
- **Collections — cập nhật steps** trỏ vào bài viết mới:
  - `beginner-s-first-freshwater-aquarium`: bước 2, 3 → bài `setting-up-a-40cm...` và `the-easiest-aquarium-fish-for-beginners`
  - `understanding-and-managing-the-nitrogen-cycle`: 3 bước đều là bài mới (foundation, explained-simply, water-change-frequency)
  - `planted-tank-essentials`: bước 1 → bài `setting-up-a-40cm...`
  - `marine-and-reef-fundamentals`: giữ nguyên (chưa có bài marine mới)
- **Verify lại DoD:** tất cả PASS — featured 3, author 12/12, ≥1 ảnh body 12/12, tools 9/9, collections 4/4 (0 broken ref), build pass.
- Script: `scripts/finish-phase2.mjs` (idempotent — bỏ qua nếu ảnh/ref đã tồn tại).

## Ghi chú cho Phase 3

1. **11 bài viết chưa có nội dung** — cần viết content (body + excerpt) trước hoặc song song với Phase 3. Khi có nội dung, nên cân nhắc thêm featured (2.1) và ảnh body (2.3).
2. Collections hiện trỏ tới 1 bài + tools; khi 11 bài có nội dung nên cập nhật steps cho phù hợp.
3. Data tools/collections sẵn sàng cho UI Phase 3.6 (`/learn`) và 3.5 (related links).
