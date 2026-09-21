# DATABASE PHASE 14 — Taxonomy Normalization Summary

**Date:** 2026-09-21
**Phase:** 14 — Controlled Coverage Expansion + Taxonomy Normalization

---

## Duplicate Scientific-Name Groups Resolved

Phase 14 created variant/breed entities with correct `parentSpecies` links rather than creating fake species. The following duplicate scientific-name groups are **intentional taxonomy modeling** (variants of the same species):

### Species (4 groups)

| Scientific Name | Entities | Resolution |
|----------------|----------|------------|
| *Carassius auratus* | Fantail, Common, Oranda, Ranchu, Black Moor, Fancy, Ryukin, Telescope | Intentional: all goldfish are *C. auratus* variants. Black Moor, Ryukin, Telescope created with `parentSpecies` = Common Goldfish. |
| *Gasteropelecus sternicla* | Hatchetfish, Silver Hatchetfish | Alias relationship (Silver Hatchetfish is trade name for same species) |
| *Pterophyllum scalare* | Marble Angelfish, Angelfish (canon) | Marble Angelfish is a color morph of P. scalare |
| *Poecilia sphenops* | Molly, Short-finned Molly | Short-finned Molly is the canonical form; Molly is the common trade reference |

### Plant (2 groups)

| Scientific Name | Entities | Resolution |
|----------------|----------|------------|
| *Rotala rotundifolia* | Red Rotala, Rotala rotundifolia | Red Rotala is a color variant of R. rotundifolia |
| *Taxiphyllum sp.* | Peacock Moss, Flame Moss | Both are Taxiphyllum cultivars; different trade names |

### Coral (4 groups)

| Scientific Name | Entities | Resolution |
|----------------|----------|------------|
| *Pocillopora damicornis* | Cauliflower Coral, Pocillopora | Same species, common vs scientific name |
| *Favia favus* | Honeycomb Brain Coral, Favia Brain Coral | Same species, different common names |
| *Caulastrea furcata* | Trumpet Coral, Candy Cane Coral | Same species, trade name variants |
| *Stylophora pistillata* | Stylophora Coral, Cat's Paw Coral | Same species, trade name variants |

### Invertebrate (4 groups)

| Scientific Name | Entities | Resolution |
|----------------|----------|------------|
| *Neocaridina davidi* | Cherry Shrimp, Blue Diamond, Golden Back Yellow, Red Cherry | All N. davidi color morphs; Red Cherry is canonical |
| *Caridina cantonensis* | Taiwan Bee, Blue Bolt, King Kong, Crystal Red | All C. cantonensis variants |
| *Caridina sp.* | Blue Tiger, Snowball | Both are Caridina sp. variants |
| *Caridina dennerli* | Sulawesi Cardinal, Sulawesi Red Cherry | Same species, trade name variants |

---

## parentSpecies Count

| Before Phase 14 | After Phase 14 | Delta |
|-----------------|----------------|-------|
| 0 | 3 | +3 |

New parentSpecies links created:
1. Black Moor Goldfish -> Common Goldfish (`sebdKYryWZgYP2rm3oqsPG`)
2. Ryukin Goldfish -> Common Goldfish (`sebdKYryWZgYP2rm3oqsPG`)
3. Telescope Goldfish -> Common Goldfish (`sebdKYryWZgYP2rm3oqsPG`)

---

## Variants Normalized

All goldfish variants (Black Moor, Ryukin, Telescope) correctly modeled as `parentSpecies` children of Common Goldfish. No fake species created for color morphs.

---

## Aliases / LocalNames Added

| Entity | Alias Added | Type |
|--------|-------------|------|
| Banggai Cardinalfish | Banggai Clownfish | alias |
| Boesemani Rainbowfish | Boeseman's Rainbowfish | alias |
| Red-bellied Piranha | San Francisco Piranha | alias |

---

## Unresolved Identities

- **Stonefish** (*Synanceia verrucosa*): DEFERRED. Verified species but extreme toxicity makes aquarium hobby content questionable. Held for editorial review.

---

## Schema Notes

- `parentSpecies` field: Available on species, coral, invertebrate types
- `aliases` field: Available on species, plant, coral, invertebrate types
- `localNames` field: Available on species, plant, coral, invertebrate types
- No schema changes required during Phase 14
