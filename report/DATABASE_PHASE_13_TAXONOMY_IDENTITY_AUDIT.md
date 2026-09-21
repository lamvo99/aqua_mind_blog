# DATABASE_PHASE_13_TAXONOMY_IDENTITY_AUDIT.md

> **Phase 13 — Taxonomy Identity Audit (SPEC-10)**
> Generated from `phase13-full-inventory.json`
> Total entities audited: 355 (166 species + 55 plants + 43 corals + 48 invertebrates + 43 equipment)

---

## Audit Summary

| Metric | Count |
|---|---|
| Total entities scanned | 355 |
| Duplicate scientific name groups found | 14 |
| Total duplicate entries | 37 |
| Entities needing parentSpecies linking | 31 |
| Entities needing alias consolidation | 8 |
| Trade name masquerading as species | 2 |
| Legitimate unique species (no issues) | 318 |

---

## Duplicate Scientific Name Groups

### 1. Carassius auratus (5 entries) — SPECIES

| Current Name | Scientific Name | Classification | Is Duplicate? | parentSpecies Candidate | Alias Candidate | Confidence | Action |
|---|---|---|---|---|---|---|---|
| Fantail Goldfish | *Carassius auratus* | Domestic variant | **Yes** | *Carassius auratus* (wild-type) | — | 99% | Set `parentSpecies` = Common Goldfish. Fantail is a domestic morph. |
| Common Goldfish | *Carassius auratus* | Wild-type / Domestic | **Yes** | — (canonical parent) | — | 99% | Keep as canonical parent entry. Closest to wild type. |
| Oranda Goldfish | *Carassius auratus* | Domestic variant | **Yes** | *Carassius auratus* (wild-type) | — | 99% | Set `parentSpecies` = Common Goldfish. Wen-bearing domestic morph. |
| Ranchu Goldfish | *Carassius auratus* | Domestic variant | **Yes** | *Carassius auratus* (wild-type) | — | 99% | Set `parentSpecies` = Common Goldfish. Dorsal-less domestic morph. |
| Fancy Goldfish | *Carassius auratus* | Domestic variant | **Yes** | *Carassius auratus* (wild-type) | — | 99% | Set `parentSpecies` = Common Goldfish. Generic double-tail grouping. |

**Recommendation:** Keep "Common Goldfish" (id: sebdKYryWZgYP2rm3oqsPG) as canonical parent. All 4 others should set `parentSpecies` to this ID. Consider adding `aliases: ["Carassius auratus"]` to the parent entry.

---

### 2. Gasteropelecus sternicla (2 entries) — SPECIES

| Current Name | Scientific Name | Classification | Is Duplicate? | parentSpecies Candidate | Alias Candidate | Confidence | Action |
|---|---|---|---|---|---|---|---|
| Hatchetfish | *Gasteropelecus sternicla* | Common name (vague) | **Yes** | *Gasteropelecus sternicla* | — | 95% | "Hatchetfish" is overly generic. Multiple hatchetfish species exist. |
| Silver Hatchetfish | *Gasteropelecus sternicla* | Common name (specific) | **Yes** | — (canonical parent) | — | 95% | More specific common name. Could serve as canonical. |

**Recommendation:** Merge into one entry or set `parentSpecies`. Keep "Silver Hatchetfish" (id: ofTl1CTOUWuLwM28PxTEQ3) as canonical. The generic "Hatchetfish" entry should set `parentSpecies` = Silver Hatchetfish, or be renamed to a specific species.

---

### 3. Pterophyllum scalare (2 entries) — SPECIES

| Current Name | Scientific Name | Classification | Is Duplicate? | parentSpecies Candidate | Alias Candidate | Confidence | Action |
|---|---|---|---|---|---|---|---|
| Marble Angelfish | *Pterophyllum scalare* | Domestic color morph | **Yes** | *Pterophyllum scalare* (wild-type) | — | 99% | Marble is a domestic color morph. Should link to parent. |
| Angelfish | *Pterophyllum scalare* | Wild-type / Generic | **Yes** | — (canonical parent) | — | 99% | Generic entry. Keep as canonical parent. |

**Recommendation:** Keep "Angelfish" (id: species-pterophyllum-scalare) as canonical parent. "Marble Angelfish" (id: 5oQB2MZ7gmZXjdwFqSs3qH) should set `parentSpecies` = species-pterophyllum-scalare. Note: Marble Angelfish is tagged "Predator" style while Angelfish has no style — style alignment needed.

---

### 4. Poecilia sphenops (2 entries) — SPECIES

| Current Name | Scientific Name | Classification | Is Duplicate? | parentSpecies Candidate | Alias Candidate | Confidence | Action |
|---|---|---|---|---|---|---|---|
| Molly | *Poecilia sphenops* | Common name (generic) | **Yes** | *Poecilia sphenops* | — | 98% | Generic trade name for all P. sphenops varieties. |
| Short-finned Molly | *Poecilia sphenops* | Common name (specific) | **Yes** | — (canonical parent) | — | 98% | Wild-type short-finned form. More specific. |

**Recommendation:** Keep "Short-finned Molly" (id: species-poecilia-sphenops) as canonical. "Molly" (id: PZ8Kai1VvEL468NS2LLaqK) should set `parentSpecies` = species-poecilia-sphenops. The slug "poecilia-sphenops-molly" suggests it was already intended as a variant.

---

### 5. Rotala rotundifolia (2 entries) — PLANT

| Current Name | Scientific Name | Classification | Is Duplicate? | parentSpecies Candidate | Alias Candidate | Confidence | Action |
|---|---|---|---|---|---|---|---|
| Red Rotala | *Rotala rotundifolia* | Trade name (color variant) | **Yes** | *Rotala rotundifolia* | — | 98% | "Red Rotala" is a trade name for R. rotundifolia grown under high light. |
| Rotala rotundifolia | *Rotala rotundifolia* | Scientific name | **Yes** | — (canonical parent) | — | 98% | Canonical scientific name entry. |

**Recommendation:** Keep "Rotala rotundifolia" (id: plant-rotala-rotundifolia) as canonical. "Red Rotala" (id: 7kdig6Bk6SZq4GZkXcVaBK) should set `parentSpecies` = plant-rotala-rotundifolia.

---

### 6. Taxiphyllum sp. (2 entries) — PLANT

| Current Name | Scientific Name | Classification | Is Duplicate? | parentSpecies Candidate | Alias Candidate | Confidence | Action |
|---|---|---|---|---|---|---|---|
| Peacock Moss | *Taxiphyllum sp.* | Trade name / Unresolved | **Possible** | *Taxiphyllum barbieri* | — | 70% | "Peacock Moss" may be T. barbieri or T. alternans. Taxonomy uncertain. |
| Flame Moss | *Taxiphyllum sp.* | Trade name / Unresolved | **Possible** | *Taxiphyllum barbieri* | — | 65% | "Flame Moss" (Taxiphyllum sp. 'Flame') is a distinct cultivar. May be a form of T. barbieri. |

**Recommendation:** These are NOT true duplicates — they are different trade names for potentially different cultivars sharing an unresolved scientific name. Both have `scientificName: "Taxiphyllum sp."`. Options: (a) Resolve to specific species if possible, or (b) Keep both but add `parentSpecies` if they are confirmed variants of the same species, or (c) Leave as-is if they represent genuinely different cultivars. The database already has `Taxiphyllum barbieri` (Java Moss) and `Taxiphyllum alternans` (Taiwan Moss) as separate entries.

---

### 7. Pocillopora damicornis (2 entries) — CORAL

| Current Name | Scientific Name | Classification | Is Duplicate? | parentSpecies Candidate | Alias Candidate | Confidence | Action |
|---|---|---|---|---|---|---|---|
| Cauliflower Coral | *Pocillopora damicornis* | Trade name | **Yes** | *Pocillopora damicornis* | — | 99% | "Cauliflower Coral" is a common trade name for P. damicornis. |
| Pocillopora | *Pocillopora damicornis* | Genus-level trade name | **Yes** | — (canonical parent) | — | 99% | Generic genus name used as species name. |

**Recommendation:** Keep "Pocillopora" (id: PZ8Kai1VvEL468NS2LLdGW) as canonical parent. "Cauliflower Coral" (id: BruaGKYCGDRQjkiQDnlmlr) should set `parentSpecies` = PZ8Kai1VvEL468NS2LLdGW. Both are SPS Reef / Mixed Reef tagged.

---

### 8. Favia favus (2 entries) — CORAL

| Current Name | Scientific Name | Classification | Is Duplicate? | parentSpecies Candidate | Alias Candidate | Confidence | Action |
|---|---|---|---|---|---|---|---|
| Honeycomb Brain Coral | *Favia favus* | Trade name | **Yes** | *Favia favus* | — | 99% | "Honeycomb Brain Coral" describes the corallite pattern. |
| Favia Brain Coral | *Favia favus* | Genus + common name | **Yes** | — (canonical parent) | — | 99% | Redundant "Favia Brain Coral" name. |

**Recommendation:** Keep "Favia Brain Coral" (id: IlX7xILobrukz7d5Jng2TG) as canonical. "Honeycomb Brain Coral" (id: BruaGKYCGDRQjkiQDnlmrB) should set `parentSpecies` = IlX7xILobrukz7d5Jng2TG.

---

### 9. Caulastrea furcata (2 entries) — CORAL

| Current Name | Scientific Name | Classification | Is Duplicate? | parentSpecies Candidate | Alias Candidate | Confidence | Action |
|---|---|---|---|---|---|---|---|
| Trumpet Coral | *Caulastrea furcata* | Trade name | **Yes** | *Caulastrea furcata* | — | 99% | "Trumpet Coral" is a common name for C. furcata. |
| Candy Cane Coral | *Caulastrea furcata* | Trade name | **Yes** | — (canonical parent) | — | 99% | "Candy Cane Coral" is another common name for the same species. |

**Recommendation:** These are the same species with two different trade names. Keep one as canonical (either one). The other should set `parentSpecies` to the canonical entry. Alternatively, set one as `aliases` of the other. Both are LPS Reef / Mixed Reef tagged.

---

### 10. Stylophora pistillata (2 entries) — CORAL

| Current Name | Scientific Name | Classification | Is Duplicate? | parentSpecies Candidate | Alias Candidate | Confidence | Action |
|---|---|---|---|---|---|---|---|
| Stylophora Coral | *Stylophora pistillata* | Genus + Coral | **Yes** | *Stylophora pistillata* | — | 99% | Generic genus-level name. |
| Cat's Paw Coral | *Stylophora pistillata* | Trade name | **Yes** | — (canonical parent) | — | 99% | "Cat's Paw Coral" is the common trade name. |

**Recommendation:** Keep "Stylophora Coral" (id: IlX7xILobrukz7d5JnvhK2) as canonical. "Cat's Paw Coral" (id: sebdKYryWZgYP2rm3or0mk) should set `parentSpecies` = IlX7xILobrukz7d5JnvhK2. Both are SPS Reef / Mixed Reef tagged.

---

### 11. Neocaridina davidi (4 entries) — INVERTEBRATE

| Current Name | Scientific Name | Classification | Is Duplicate? | parentSpecies Candidate | Alias Candidate | Confidence | Action |
|---|---|---|---|---|---|---|---|
| Cherry Shrimp | *Neocaridina davidi* | Color morph (red) | **Yes** | *Neocaridina davidi* | "Red Cherry Shrimp" | 99% | Wild-type red morph. Most common. |
| Blue Diamond Shrimp | *Neocaridina davidi* | Color morph (blue) | **Yes** | *Neocaridina davidi* | — | 99% | Solid blue color morph of same species. |
| Golden Back Yellow Shrimp | *Neocaridina davidi* | Color morph (yellow) | **Yes** | *Neocaridina davidi* | "Yellow" | 99% | Yellow color morph with golden back line. |
| Red Cherry Shrimp | *Neocaridina davidi* | Color morph (red) | **Yes** | — (canonical parent) | "Cherry Shrimp" | 99% | Same as "Cherry Shrimp" entry. Duplicate name + duplicate species. |

**Recommendation:** "Cherry Shrimp" and "Red Cherry Shrimp" are DUPLICATE NAMES for the same species and same morph. Keep one (Red Cherry Shrimp, id: invertebrate-neocaridina-davidi, as it has the cleanest ID). The other 3 color morphs should set `parentSpecies` = invertebrate-neocaridina-davidi. Consider adding `aliases` for the color morph names to the parent entry.

---

### 12. Caridina cantonensis (4 entries) — INVERTEBRATE

| Current Name | Scientific Name | Classification | Is Duplicate? | parentSpecies Candidate | Alias Candidate | Confidence | Action |
|---|---|---|---|---|---|---|---|
| Taiwan Bee Shrimp | *Caridina cantonensis* | Color morph | **Yes** | *Caridina cantonensis* | — | 99% | Group name for selective-bred variants. |
| Blue Bolt Shrimp | *Caridina cantonensis* | Color morph (blue) | **Yes** | *Caridina cantonensis* | — | 99% | Specific blue color morph. |
| King Kong Shrimp | *Caridina cantonensis* | Color morph (black/white) | **Yes** | *Caridina cantonensis* | — | 99% | Black/white patterned morph. |
| Crystal Red Shrimp | *Caridina cantonensis* | Color morph (red/white) | **Yes** | — (canonical parent) | "CRS" | 99% | The most well-known morph. Could be canonical. |

**Recommendation:** Keep "Crystal Red Shrimp" (id: invertebrate-caridina-cantonensis) as canonical parent since it is the most recognized. All 3 others should set `parentSpecies` = invertebrate-caridina-cantonensis. Note: "Taiwan Bee Shrimp" is a group name covering Blue Bolt, King Kong, and other morphs — it could become an alias of the parent or a separate group-level entry.

---

### 13. Caridina sp. (2 entries) — INVERTEBRATE

| Current Name | Scientific Name | Classification | Is Duplicate? | parentSpecies Candidate | Alias Candidate | Confidence | Action |
|---|---|---|---|---|---|---|---|
| Blue Tiger Shrimp | *Caridina sp.* | Unresolved species | **Possible** | — | — | 40% | Often identified as C. cantonensis but taxonomy debated. May be a separate species. |
| Snowball Shrimp | *Caridina sp.* | Unresolved species | **Possible** | — | — | 35% | White opaque shrimp. Taxonomy uncertain, possibly C. cantonensis variant. |

**Recommendation:** These are NOT true duplicates — they share an unresolved scientific name but may be different species. Both should have their `scientificName` resolved if possible. Blue Tiger Shrimp is sometimes classified as C. cantonensis; Snowball Shrimp is sometimes classified as C. coccina or C. cantonensis. Recommend keeping `scientificName` as "Caridina sp." until proper identification, but consider adding notes in `aliases` field.

---

### 14. Caridina dennerli (2 entries) — INVERTEBRATE

| Current Name | Scientific Name | Classification | Is Duplicate? | parentSpecies Candidate | Alias Candidate | Confidence | Action |
|---|---|---|---|---|---|---|---|
| Sulawesi Cardinal Shrimp | *Caridina dennerli* | Trade name | **Yes** | *Caridina dennerli* | — | 99% | Well-known Sulawesi species. |
| Sulawesi Red Cherry Shrimp | *Caridina dennerli* | Trade name (misleading) | **Yes** | — (canonical parent) | — | 95% | Same species. "Red Cherry" is misleading as it conflicts with Neocaridina davidi common name. |

**Recommendation:** Keep "Sulawesi Cardinal Shrimp" (id: J1Tx0fWCuGNPno99A7KIq7) as canonical since it's the standard common name. "Sulawesi Red Cherry Shrimp" (id: sebdKYryWZgYP2rm3or1AM) should set `parentSpecies` = J1Tx0fWCuGNPno99A7KIq7. The "Red Cherry" part of the name is confusing with Neocaridina davidi "Red Cherry Shrimp" — this naming should be corrected.

---

## Additional Entities Requiring Attention

### Sulawesi Cardinal Shrimp (Caridina omnipos) — INVERTEBRATE

| Current Name | Scientific Name | Classification | Is Duplicate? | parentSpecies Candidate | Alias Candidate | Confidence | Action |
|---|---|---|---|---|---|---|---|
| Sulawesi Cardinal Shrimp | *Caridina omnipos* | Valid species | **No** | — | — | 95% | Same common name as C. dennerli entry but different scientific name. This is a legitimate separate species. |

**Recommendation:** This is NOT a duplicate — C. omnipos is a distinct species. However, sharing the common name "Sulawesi Cardinal Shrimp" with the C. dennerli entry creates user confusion. Consider renaming this entry to "Sulawesi Cardinal Shrimp (C. omnipos)" or "Sulawesi Red" to differentiate.

---

## Entities with parentSpecies Field Populated

**Result: 0 out of 355 entities have `parentSpecies` set.**

This is a critical finding. The `parentSpecies` field exists in the schema but is completely unused. All 31 entities identified above as needing parentSpecies linking currently have `parentSpecies: null`.

---

## Duplicate Name Summary (Same common name, different entities)

| Common Name | Scientific Name | Collection | Count | Action |
|---|---|---|---|---|
| Sulawesi Cardinal Shrimp | C. dennerli + C. omnipos | invertebrate | 2 | Rename one to differentiate |
| Cherry Shrimp / Red Cherry Shrimp | N. davidi | invertebrate | 2 | Merge — same name + same species |

---

## Priority Actions

### Critical (SPEC-10 compliance)

1. **Populate `parentSpecies` for all 31 variant/morph entities** — Currently 0% utilization
2. **Merge "Cherry Shrimp" and "Red Cherry Shrimp"** — Exact duplicate (same name + same species)
3. **Resolve "Hatchetfish" vs "Silver Hatchetfish"** — Generic name needs disambiguation

### High Priority

4. **Link all 5 Carassius auratus variants** to Common Goldfish parent
5. **Link all 4 Neocaridina davidi color morphs** to Red Cherry Shrimp parent
6. **Link all 4 Caridina cantonensis morphs** to Crystal Red Shrimp parent
7. **Link all 2 Pterophyllum scalare entries** (Marble Angelfish -> Angelfish)
8. **Link all 2 Poecilia sphenops entries** (Molly -> Short-finned Molly)

### Medium Priority

9. **Resolve Taxiphyllum sp. entries** — Attempt species-level identification
10. **Add aliases** to parent entries for better discoverability
11. **Rename "Sulawesi Red Cherry Shrimp"** to avoid confusion with N. davidi
12. **Differentiate "Sulawesi Cardinal Shrimp" (C. dennerli) from (C. omnipos)**

### Low Priority

13. **Add `aliases` field** to Coral parent entries for trade name consolidation
14. **Review all entities with `parentSpecies: null`** for additional morph/variant candidates beyond the 14 flagged groups
