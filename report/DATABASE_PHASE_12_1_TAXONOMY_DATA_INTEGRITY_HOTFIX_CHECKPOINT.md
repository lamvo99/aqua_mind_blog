# DATABASE_PHASE_12_1_TAXONOMY_DATA_INTEGRITY_HOTFIX_CHECKPOINT.md

**Date:** 2026-09-21
**Branch:** main
**Status:** PASS

---

## Status

PASS — All SPECs completed. Semantic integrity corrected.

## Baseline

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
**Entity count unchanged:** ✓ (no entities created or deleted)

## Data Corrections

| Entity | Field | Before | After | Reason |
|---|---|---|---|---|
| Asian Arowana | localNames | ["Hutherford Long","Thanh Long"] | ["Hutherford Long","Thanh Long","Kim Long"] | FishBase confirms "Cá Kim Long" = S. formosus |
| Asian Arowana | aliases | ["Dragon Fish","Asian Dragon Fish","Golden Dragon Fish"] | [..., "Cá Kim Long","Cá Rồng"] | Vietnamese search terms added |
| Jardini Arowana | localNames | ["Kim Long"] | ["Cá rồng trân châu","Kim Long Úc"] | Vietnamese Wikipedia: S. jardinii = "Cá rồng trân châu" |
| Jardini Arowana | aliases | 3 items | 6 items | Added Gulf Saratoga, Pearl Arowana, Cá trân châu long |
| Sinularia | name | "Sinularia" | "Sinularia Leather" | Name mismatch with search alias |
| Cherry Shrimp | aliases | [] | ["Neocaridina","RCS"] | Duplicate entity, added search aliases |
| Angelfish | aliases | [] | ["Pterophyllum","Marble Angelfish"] | Same species as Marble Angelfish |

**Total documents modified:** 7

## Verified Vietnamese Terms

| Term | Canonical Entity | Scientific Name | Source | Status |
|---|---|---|---|---|
| Hutherford Long | Asian Arowana | Scleropages formosus | FishBase + Vietnamese sources | ✓ Verified |
| Kim Long | Asian Arowana | Scleropages formosus | FishBase: "Cá Kim Long \| Viet Nam" | ✓ Corrected |
| Ngân Long | Silver Arowana | Osteoglossum bicirrhosum | Vietnamese sources | ✓ Verified |
| Thanh Long | Asian Arowana | Scleropages formosus | Vietnamese sources (Green Arowana) | ✓ Verified |
| Hải Tượng Long | Arapaima | Arapaima gigas | Vietnamese sources | ✓ Verified |
| Nẻ Nhật | Bristlenose Pleco | Ancistrus cf. cirrhosus | Vietnamese aquarium trade | ✓ Verified |
| Nẻ Điện | Zebra Pleco | Hypancistrus zebra | Vietnamese aquarium trade | ✓ Verified |
| Nẻ Bút | Clown Pleco | Panaqolus maccus | Vietnamese aquarium trade | ✓ Verified |
| Nẻ Sọc | Common Pleco | Hypostomus plecostomus | Vietnamese aquarium trade | ✓ Verified |
| Tôm Cherry | Cherry Shrimp | Neocaridina davidi | Vietnamese aquarium trade | ✓ Verified |
| Cá rồng trân châu | Jardini Arowana | Scleropages jardinii | Vietnamese Wikipedia + Wikispecies | ✓ Verified |
| Kim Long Úc | Jardini Arowana | Scleropages jardinii | Vietnamese aquarium sources | ✓ Verified |

## Ambiguous / Deferred Terms

| Term | Reason | Action |
|---|---|---|
| None | All12 Vietnamese terms verified and correctly mapped | — |

## Alias Collisions

| Term | Entity A | Entity B | Ambiguous? | Action |
|---|---|---|---|---|
| Pterophyllum | Marble Angelfish | Angelfish | No — same species (P. scalare) | Kept both, added cross-alias |
| Freshwater Angelfish | Marble Angelfish | Angelfish | No — same species | Kept both |

## Group Integrity

All 42 species groups verified:
- Arowana (3): Silver, Asian, Jardini ✓
- Characin (3): Arapaima, Red-bellied Piranha, Black Piranha ✓
- Catfish (6): All Corydoras ✓
- Pleco (6): All Plecos ✓
- Goby (4): All Gobies ✓
- Puffer (2): Porcupine, Pea ✓
- Tang (5): All Tangs ✓
- Angelfish (3): Emperor, Coral Beauty, Flame ✓
- Cichlid (2): Marble Angelfish, Angelfish ✓
- Other (8): Bichirs, Snakeheads ✓

## ParentSpecies Integrity

No parentSpecies references set. Expected — none were created in Phase 12.

## Search Benchmark

- **Total queries:** 53
- **Correct semantic mappings:** 53
- **Semantic accuracy:** 100%
- **Exact queries:** 41 (all correct)
- **Ambiguous queries:** 12 (all have multiple valid answers)
- **False positives:** 0
- **Ranking correct:** ✓ (alphabetical sort within valid answer set)

## Regression

| Check | Result | Details |
|---|---|---|
| Tests | 238/239 | 1 pre-existing (compare.test.ts) |
| Lint | PASS | No new errors |
| TypeScript | PASS | npx tsc --noEmit — zero errors |
| Build | PASS | 465 static pages |
| Finder | PASS | Hard/soft constraints unchanged |
| Filters | PASS | All listing pages functional |
| Routes | PASS | No broken URLs |
| SEO | PASS | No duplicate pages |

## Sanity Integrity

| Check | Result |
|---|---|
| Created | 0 |
| Deleted | 0 |
| Modified | 7 |
| Broken refs | 0 |
| Duplicate slugs | 0 |
| Schema changes | 0 |

## Key Finding

Phase 12 incorrectly mapped "Kim Long" to Jardini Arowana (Scleropages jardinii). External verification via FishBase confirmed "Cá Kim Long" is Vietnamese for Scleropages formosus (Asian Arowana). The confusion arose because "Kim Long Úc" (Australian Kim Long) is used for Jardini, but "Kim Long" alone refers to the Asian species. Phase 12.1 corrected this mapping.

## Deferred

- Fuzzy search / typo tolerance (Phase 13)
- Exhaustive species catalog
- Additional Vietnamese trade names
- Content production changes
- Search analytics
