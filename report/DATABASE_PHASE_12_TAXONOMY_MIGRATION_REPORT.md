# DATABASE_PHASE_12_TAXONOMY_MIGRATION_REPORT.md

**Date:** 2026-09-21
**Phase:** 12 — Taxonomy, Aliases & Global Search Foundation

## Schema Changes

### New Fields Added

| Schema | Field | Type | Description |
|--------|-------|------|-------------|
| species | localNames | array[string] | Vietnamese/trade names for discovery |
| species | aliases | array[string] | Alternate common names, search synonyms |
| species | group | string | Biological grouping (Cichlid, Catfish, etc.) |
| species | parentSpecies | ref -> species | Variant/morph parent reference |
| plant | localNames | array[string] | Vietnamese/trade names |
| plant | aliases | array[string] | Alternate common names |
| plant | group | string | Plant group (Stem, Rosette, etc.) |
| coral | localNames | array[string] | Vietnamese/trade names |
| coral | aliases | array[string] | Alternate common names |
| coral | group | string | Coral group (LPS, SPS, Soft, etc.) |
| invertebrate | localNames | array[string] | Vietnamese/trade names |
| invertebrate | aliases | array[string] | Alternate common names |
| invertebrate | parentSpecies | ref -> invertebrate | Variant parent reference |

## Data Migration

### Species (42 documents)

**Vietnamese Local Names (verified):**
- Asian Arowana: Huyết Long, Thanh Long
- Silver Arowana: Ngân Long
- Jardini Arowana: Kim Long
- Arapaima: Hải Tượng Long
- Bristlenose Pleco: Nẻ Nhật
- Zebra Pleco: Nẻ Điện
- Clown Pleco: Nẻ Bút
- Common Pleco: Nẻ Sọc

**Aliases (42 species):** All P0/P1/P2 species from Phase 11 + key common species (Plecos, Corydoras, Gobies, Puffers, Tangs, Angelfish)

**Groups assigned:** Arowana, Characin, Catfish, Pleco, Goby, Puffer, Tang, Angelfish, Cichlid, Other

### Invertebrates (2 documents)
- Red Cherry Shrimp: localNames ["Tôm Cherry"], aliases ["RCS", "Cherry Red Shrimp"]
- Cherry Shrimp: aliases ["Red Cherry Shrimp", "RCS"]

### Plants (7 documents)
- Amazon Sword, Java Fern, Java Moss, Dwarf Sagittaria, Bucephalandra, Hornwort, Water Sprite
- Groups: Rosette, Fern, Moss, Stolon, Rhizome, Floating

### Corals (12 documents)
- Zoanthids, Palythoa, Hammer, Torch, Frogspawn, Bubble, Open Brain, Duncan, Fungia, Toadstool Leather, Goniopora, Alveopora
- Groups: Polyp, LPS, Soft, Single Polyp

## Search Upgrade

**GROQ queries updated to match:** name, scientificName, aliases, localNames

**Client-side ranking implemented:**
1. Exact canonical name (rank 0)
2. Exact scientific name (rank 1)
3. Exact alias match (rank 2)
4. Exact local name match (rank 3)
5. Name starts with query (rank 4)
6. Name contains query (rank 6)
7. Other (rank 8)

**Deduplication:** Client-side dedup by document _id before ranking

## Unresolved Terms
- None — all Vietnamese terms from Phase 10 audit were verified and resolved

## Deferred Items
- Exhaustive species catalog
- Fuzzy matching / typo tolerance (Phase 13)
- Brand-specific equipment aliases
- Content production changes
- Broad biological taxonomy (genus, family hierarchy)
