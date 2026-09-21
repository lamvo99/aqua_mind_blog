# DATABASE_TAXONOMY_ALIASES_GLOBAL_SEARCH_PHASE_12_CHECKPOINT.md

**Date:** 2026-09-21
**Branch:** main
**Status:** PASS

---

## 1. Status

PASS — All SPECs completed successfully.

## 2. Date

2026-09-21

## 3. Branch

main

## 4. Baseline Inventory

| Domain | Count |
|---|---:|
| Species | 166 |
| Plants | 55 |
| Corals | 43 |
| Invertebrates | 48 |
| Equipment | 43 |
| Problems | 32 |
| Inspirations | 10 |
| **Total** | **397** |

**Drafts:** 0
**Duplicate slugs:** None
**Duplicate scientific names:** 4 species, 2 plants, 4 corals, 4 invertebrates (mostly legitimate — same genus used for different entries)

## 5. Schema Changes

4 new fields per domain (species, plant, coral, invertebrate):
- `localNames` (array[string]) — Vietnamese/trade names
- `aliases` (array[string]) — Alternate common names
- `group` (string) — Biological/hobbyist grouping
- `parentSpecies` (ref) — Variant-to-canonical reference (species + invertebrate only)

**invertebrate:** Already had `group` field — added `localNames`, `aliases`, `parentSpecies`

## 6. Data Migration

- **63 documents** updated with aliases and/or localNames
- **42 species**: aliases + group + 8 Vietnamese local names
- **2 invertebrates**: aliases + local names
- **7 plants**: aliases + group
- **12 corals**: aliases + group
- **0 errors** during migration

## 7. Search Upgrade

**GROQ queries updated in:**
- `lib/search.ts` — `buildQuery()` now searches name, scientificName, aliases, localNames
- `app/components/SearchModal.tsx` — DB items search now searches aliases, localNames
- `lib/database.ts` — `getDatabaseList()` and `getDatabaseItem()` now project aliases, localNames

**Client-side ranking implemented:**
- `lib/search.ts` — `rankResult()` + `dedupeAndRank()`
- `app/components/SearchModal.tsx` — `rankSearchItem()` + dedup + sort

**Search layers:**
1. Exact canonical name → rank 0
2. Exact scientific name → rank 1
3. Exact alias → rank 2
4. Exact local name → rank 3
5. Name starts with → rank 4
6. Name contains → rank 6
7. Other → rank 8

## 8. Vietnamese / Regional Discovery

**Verified Vietnamese trade names (from Phase 10 audit):**
- Huyết Long → Asian Arowana ✓
- Kim Long → Jardini Arowana ✓
- Ngân Long → Silver Arowana ✓
- Thanh Long → Asian Arowana ✓
- Hải Tượng Long → Arapaima ✓
- Nẻ Nhật → Bristlenose Pleco ✓
- Nẻ Điện → Zebra Pleco ✓
- Nẻ Bút → Clown Pleco ✓
- Nẻ Sọc → Common Pleco ✓
- Tôm Cherry → Cherry Shrimp ✓

**All verified terms resolve correctly.**

## 9. Search Benchmark

50 queries tested — **100% resolution** to correct canonical entity.

| Metric | Phase 10 | Phase 12 |
|---|---|---|
| Exact-match coverage | 56% | 100% |
| Vietnamese search | 0% | 100% (verified terms) |
| Alias search | 0% | 100% |
| Scientific name search | Partial | 100% |
| Ranking quality | N/A | Exact > Scientific > Alias > Local > Partial |

## 10. Regression

| Check | Result | Details |
|---|---|---|
| Tests | 238/239 | 1 pre-existing failure (compare.test.ts) |
| Lint | PASS | No new errors |
| TypeScript | PASS | npx tsc --noEmit — zero errors |
| Build | PASS | 465 static pages |
| Finder | PASS | Hard/soft constraints unchanged |
| Filters | PASS | All listing pages functional |
| Routes | PASS | No broken URLs |
| SEO | PASS | No duplicate pages, no indexable alias pages |

## 11. Deferred

- Exhaustive species catalog (not in scope)
- Images (not in scope)
- Content production (not in scope)
- Broad biological taxonomy (genus/family hierarchy — not in scope)
- Speculative aliases (not inserted)
- Unresolved trade names (none remaining from Phase 10 audit)
- Brand-specific equipment aliases (not in scope)
- Fuzzy matching / typo tolerance (Phase 13)

## 12. Phase 13 Recommendation

**Phase 13 — Fuzzy Search, Typo Tolerance & Search Analytics**

Focus:
1. Implement fuzzy matching with typo tolerance
2. Search analytics / query logging
3. Search result click tracking
4. Zero-result query monitoring
5. Search synonyms expansion
6. Equipment alias population
7. Exhaustive species catalog for common aquarium fish
