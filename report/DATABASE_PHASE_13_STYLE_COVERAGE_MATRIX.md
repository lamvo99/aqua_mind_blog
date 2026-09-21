# DATABASE_PHASE_13_STYLE_COVERAGE_MATRIX.md

> **Phase 13 — Aquarium Style Coverage Matrix (SPEC-02)**
> Generated from `phase13-full-inventory.json`
> Entities: 166 species | 55 plants | 43 corals | 48 invertebrates | 43 equipment

---

## Coverage Status Legend

| Status | Meaning |
|---|---|
| **Strong** | 3+ entity types represented; active style |
| **Partial** | 1-2 entity types represented |
| **Weak** | Only 1 entity type with low count (<5) |
| **Empty** | 0 entities tagged with this style |
| **N/A** | Style not used in current schema |

---

## FRESHWATER STYLES

| Style | Species | Plants | Corals | Inverts | Equipment | Total | Coverage Status | Missing Groups | Priority |
|---|---|---|---|---|---|---|---|---|---|
| Community | 108 | 0 | 0 | 28 | 30 | 166 | **Strong** | Plants, Corals | Low |
| Planted | 12 | 1 | 0 | 26 | 9 | 48 | **Strong** | Corals | Low |
| Low-Tech | 0 | 35 | 0 | 0 | 0 | 35 | **Partial** | Species, Inverts, Equipment | Medium |
| High-Tech / CO2 | 0 | 19 | 0 | 0 | 3 | 22 | **Partial** | Species, Inverts | Medium |
| Aquascaping | 0 | 19 | 0 | 0 | 4 | 23 | **Partial** | Species, Inverts | Medium |
| Blackwater | 0 | 0 | 0 | 0 | 0 | 0 | **Empty** | All | **High** |
| Biotope | 0 | 0 | 0 | 0 | 0 | 0 | **Empty** | All | **High** |
| Amazon/South American | 0 | 0 | 0 | 0 | 0 | 0 | **Empty** | All | **High** |
| Southeast Asian | 0 | 0 | 0 | 0 | 0 | 0 | **Empty** | All | **High** |
| African Cichlid | 0 | 0 | 0 | 0 | 0 | 0 | **Empty** | All | **High** |
| Shrimp | 37 | 0 | 0 | 18 | 0 | 55 | **Partial** | Plants, Equipment | Medium |
| Betta / Nano | 68 | 0 | 0 | 0 | 0 | 68 | **Partial** | Plants, Inverts, Equipment | Medium |
| Predator | 28 | 0 | 0 | 0 | 0 | 28 | **Weak** | Plants, Inverts, Equipment | Medium |
| Large Fish | 16 | 0 | 0 | 0 | 0 | 16 | **Weak** | Plants, Inverts, Equipment | Medium |
| Native/Regional | 0 | 0 | 0 | 0 | 0 | 0 | **Empty** | All | **High** |

---

## MARINE STYLES

| Style | Species | Plants | Corals | Inverts | Equipment | Total | Coverage Status | Missing Groups | Priority |
|---|---|---|---|---|---|---|---|---|---|
| Fish Only | 5 | 0 | 0 | 0 | 0 | 5 | **Weak** | Plants, Inverts, Equipment | Medium |
| FOWLR | 5 | 0 | 0 | 0 | 0 | 5 | **Weak** | Plants, Inverts, Equipment | Medium |
| Nano Reef | 2 | 0 | 0 | 0 | 0 | 2 | **Weak** | Plants, Inverts, Equipment | **High** |
| Mixed Reef | 20 | 0 | 38 | 19 | 9 | 86 | **Strong** | Plants | Low |
| Soft Coral Reef | 0 | 0 | 10 | 0 | 0 | 10 | **Partial** | Species, Inverts, Equipment | Medium |
| LPS Reef | 0 | 0 | 21 | 0 | 1 | 22 | **Partial** | Species, Inverts | Medium |
| SPS Reef | 0 | 0 | 9 | 0 | 2 | 11 | **Partial** | Species, Inverts | Medium |
| NPS | 0 | 0 | 3 | 0 | 0 | 3 | **Weak** | Species, Inverts, Equipment | **High** |
| Anemone/Clownfish | 0 | 0 | 0 | 0 | 0 | 0 | **Empty** | All | **High** |
| Marine Predator | 4 | 0 | 0 | 0 | 0 | 4 | **Weak** | Plants, Inverts, Equipment | **High** |
| Invertebrate-focused | 0 | 0 | 0 | 19 | 0 | 19 | **Partial** | Species, Plants, Equipment | Medium |

---

## OTHER STYLES

| Style | Species | Plants | Corals | Inverts | Equipment | Total | Coverage Status | Missing Groups | Priority |
|---|---|---|---|---|---|---|---|---|---|
| Pond / Outdoor | 3 | 0 | 0 | 0 | 0 | 3 | **Weak** | Plants, Inverts, Equipment | **High** |
| Brackish | 0 | 0 | 0 | 0 | 0 | 0 | **Empty** | All | **High** |

---

## Summary Statistics

### Styles by Coverage Status

| Status | Count | Styles |
|---|---|---|
| **Strong** (3+) | 3 | Community (166), Mixed Reef (86), Planted (48) |
| **Partial** (1-2 types) | 10 | Shrimp (55), Betta/Nano (68), Low-Tech (35), Aquascaping (23), High-Tech/CO2 (22), LPS Reef (22), Invertebrate-focused (19), SPS Reef (11), Soft Coral Reef (10), Predator (28) |
| **Weak** (1 type, <5) | 5 | Large Fish (16), Fish Only (5), FOWLR (5), Marine Predator (4), Pond/Outdoor (3), NPS (3), Nano Reef (2) |
| **Empty** (0 entities) | 9 | Blackwater, Biotope, Amazon/South American, Southeast Asian, African Cichlid, Native/Regional, Anemone/Clownfish, Brackish |

### Key Gaps Identified

1. **9 completely empty styles** need immediate attention for SPEC-02 compliance
2. **Blackwater, Biotope, Amazon/South American** — despite having many species that fit these descriptions (e.g., blackwater tetras, biotope-specific species), none are tagged
3. **African Cichlid** — Despite 7+ African cichlid species in the database (Frontosa, Electric Yellow, Zebra Mbuna, Tropheus, Synodontis, Congo Dwarf Cichlid), none have this style tag
4. **Anemone/Clownfish** — Despite having 2 clownfish species (Ocellaris, Percula) and Bubble-Tip Anemone invertebrate, none use this tag
5. **Brackish** — Bumblebee Goby (Brachygobius doriae) exists with waterType="brackish" but no Brackish style tag
6. **Nano Reef** — Only 2 species (Banggai Cardinalfish, Foxface Rabbitfish) despite being a popular style
7. **NPS** — Only 3 corals, no complementary species or equipment
8. **Marine Predator** — 4 species only (Marine Betta, Dwarf Lionfish, Clown Triggerfish, Zebra Moray Eel), no equipment

### Style Distribution by Collection

| Collection | Styles Used | Most Common Style |
|---|---|---|
| Species (166) | 12 | Community (108, 65%) |
| Plants (55) | 5 | Low-Tech (35, 64%) |
| Corals (43) | 6 | Mixed Reef (38, 88%) |
| Invertebrates (48) | 5 | Community (28, 58%) |
| Equipment (43) | 5 | Community (30, 70%) |

---

## Recommendations

1. **Immediate**: Add `African Cichlid` style to Frontosa, Electric Yellow, Zebra Mbuna, Tropheus, Nanochromis, Jack Dempsey
2. **Immediate**: Add `Brackish` style to Bumblebee Goby
3. **Immediate**: Add `Anemone/Clownfish` style to Ocellaris Clownfish, Percula Clownfish, and Bubble-Tip Anemone
4. **Short-term**: Create `Blackwater` style tag and assign to appropriate species (e.g., Chocolate Gourami, Hatchetfish, Cardinal Tetra from blackwater habitats)
5. **Short-term**: Create `Biotope` style tag and assign biotope-specific species
6. **Short-term**: Create `Amazon/South American` and `Southeast Asian` regional style tags
7. **Medium-term**: Add species to `Native/Regional` style for region-specific content
8. **Medium-term**: Expand `Nano Reef` and `NPS` styles with more species and equipment
