# DATABASE PHASE 14 — Data Quality Report (SPEC-13-14)

**Date:** 2026-09-21
**Phase:** 14 — Controlled Coverage Expansion + Taxonomy Normalization
**Status:** ISSUES FOUND — see details below

---

## Summary

| Check | Issues |
|-------|--------|
| Broken parentSpecies references | 0 |
| Self-references (parentSpecies -> self) | 0 |
| Circular parent chains | 0 |
| Duplicate slugs (cross-type) | 0 |
| Duplicate scientific names (per-domain) | 14 |
| Entities with null name | 39 |
| Entities with null waterType | 27 |
| Entities with null category/group | 13 |
| Invalid parentSpecies ref format | 0 |
| **TOTAL** | **93** |

---

## 1. Broken parentSpecies References

No broken references found. All parentSpecies references resolve to existing documents.

---

## 2. Self-References

No self-references found. No entity points to itself via parentSpecies.

---

## 3. Circular Parent Chains

No circular parent chains found. All parentSpecies chains are acyclic.

---

## 4. Duplicate Slugs (Cross-Type)

No duplicate slugs found across all entity types.

---

## 5. Duplicate Scientific Names (Per-Domain)

These are expected for variant/breed/morph entities within the same scientific species (e.g., goldfish variants all share *Carassius auratus*). This is intentional taxonomy modeling, not data errors.

- **species**: *Carassius auratus* — Fantail Goldfish, Common Goldfish, Oranda Goldfish, Ranchu Goldfish, Black Moor Goldfish, Fancy Goldfish, Ryukin Goldfish, Telescope Goldfish
- **species**: *Gasteropelecus sternicla* — Hatchetfish, Silver Hatchetfish
- **species**: *Pterophyllum scalare* — Marble Angelfish, Angelfish
- **species**: *Poecilia sphenops* — Molly, Short-finned Molly
- **plant**: *Rotala rotundifolia* — Red Rotala, Rotala rotundifolia
- **plant**: *Taxiphyllum sp.* — Peacock Moss, Flame Moss
- **coral**: *Pocillopora damicornis* — Cauliflower Coral, Pocillopora
- **coral**: *Favia favus* — Honeycomb Brain Coral, Favia Brain Coral
- **coral**: *Caulastrea furcata* — Trumpet Coral, Candy Cane Coral
- **coral**: *Stylophora pistillata* — Stylophora Coral, Cat's Paw Coral
- **invertebrate**: *Neocaridina davidi* — Cherry Shrimp, Blue Diamond Shrimp, Golden Back Yellow Shrimp, Red Cherry Shrimp
- **invertebrate**: *Caridina cantonensis* — Taiwan Bee Shrimp, Blue Bolt Shrimp, King Kong Shrimp, Crystal Red Shrimp
- **invertebrate**: *Caridina sp.* — Blue Tiger Shrimp, Snowball Shrimp
- **invertebrate**: *Caridina dennerli* — Sulawesi Cardinal Shrimp, Sulawesi Red Cherry Shrimp

---

## 6. Entities with Null Name

- [problem] BruaGKYCGDRQjkiQDnlsx5
- [problem] BruaGKYCGDRQjkiQDnlszk
- [problem] BruaGKYCGDRQjkiQDnlt2P
- [problem] BruaGKYCGDRQjkiQDnlt54
- [problem] BruaGKYCGDRQjkiQDnlt7j
- [problem] BruaGKYCGDRQjkiQDnltAO
- [problem] BruaGKYCGDRQjkiQDnltD3
- [problem] BruaGKYCGDRQjkiQDnltFi
- [problem] problem-aiptasia-infestation
- [problem] problem-brown-diatom-algae
- [problem] problem-brown-jelly-disease
- [problem] problem-cloudy-water
- [problem] problem-coral-bleaching
- [problem] problem-cyanobacteria
- [problem] problem-fish-gasping-surface
- [problem] problem-fish-hiding
- [problem] problem-green-water
- [problem] problem-heater-stuck-off
- [problem] problem-heater-stuck-on
- [problem] problem-high-ammonia
- [problem] problem-high-nitrate
- [problem] problem-high-nitrite
- [problem] problem-low-filter-flow
- [problem] problem-ph-crash
- [problem] problem-ph-drift
- [problem] problem-plant-leaves-melting
- [problem] problem-rapid-tissue-necrosis-rtn
- [problem] problem-slow-tissue-necrosis-stn
- [problem] problem-white-spot-disease
- [inspiration] BruaGKYCGDRQjkiQDnm04r
- [inspiration] BruaGKYCGDRQjkiQDnm07W
- [inspiration] BruaGKYCGDRQjkiQDnm0AB
- [inspiration] BruaGKYCGDRQjkiQDnm0Cq
- [inspiration] BruaGKYCGDRQjkiQDnm0FV
- [inspiration] inspiration-classic-iwagumi
- [inspiration] inspiration-dutch-planted-tank
- [inspiration] inspiration-jungle-biotope
- [inspiration] inspiration-low-tech-nature-aquarium
- [inspiration] inspiration-nano-paludarium

---

## 7. Entities with Null WaterType (species, coral, invertebrate)

- **[coral] Cauliflower Coral** (BruaGKYCGDRQjkiQDnlmlr)
- **[coral] Discosoma Mushroom** (IlX7xILobrukz7d5JnTgZ4)
- **[coral] Trumpet Coral** (IlX7xILobrukz7d5Jng29O)
- **[coral] Favia Brain Coral** (IlX7xILobrukz7d5Jng2TG)
- **[coral] Chalice Coral** (IlX7xILobrukz7d5Jnvipy)
- **[coral] Pavona Coral** (IlX7xILobrukz7d5Jo2Xh0)
- **[coral] Rhodactis Mushroom** (IlX7xILobrukz7d5Jo2rGw)
- **[coral] Frogspawn Coral** (J1Tx0fWCuGNPno99A6TtLj)
- **[coral] Xenia Coral** (J1Tx0fWCuGNPno99A6TtVz)
- **[coral] Kenya Tree Coral** (J1Tx0fWCuGNPno99A6UVbu)
- **[coral] Sun Coral** (PZ8Kai1VvEL468NS2KnjUP)
- **[coral] Tubing Coral** (PZ8Kai1VvEL468NS2KnkWY)
- **[coral] Blastomussa** (coral-blastomussa)
- **[coral] Candy Cane Coral** (coral-candy-cane-coral)
- **[coral] Duncan Coral** (coral-duncan-coral)
- **[coral] Goniopora** (coral-goniopora)
- **[coral] Gorgonian** (coral-gorgonian)
- **[coral] Hammer Coral** (coral-hammer-coral)
- **[coral] Lobophytum Leather** (coral-lobophytum-leather)
- **[coral] Montipora Capricornis** (coral-montipora-capricornis)
- **[coral] Porites** (coral-porites)
- **[coral] Ricordea Mushroom** (coral-ricordea-mushroom)
- **[coral] Staghorn Acropora** (coral-staghorn-acropora)
- **[coral] Table Acropora** (coral-table-acropora)
- **[coral] Toadstool Leather** (coral-toadstool-leather)
- **[coral] Turbinaria** (coral-turbinaria)
- **[coral] Zoanthids** (coral-zoanthids)

---

## 8. Entities with Null Category/Group (equipment, problem)

- **[problem] Columnaris (Cotton Mouth)** (I9bI8W8ZWcEwyIzM9DFYjI)
- **[problem] Planaria Infestation** (I9bI8W8ZWcEwyIzM9DFYtM)
- **[problem] Velvet Disease (Oodinium)** (IlX7xILobrukz7d5JnvacY)
- **[problem] Fish Lice (Argulus)** (IlX7xILobrukz7d5Jo2qVy)
- **[problem] Dinoflagellates** (IlX7xILobrukz7d5Jo2qgo)
- **[problem] Hole in the Head Disease** (IlX7xILobrukz7d5Jo2wxC)
- **[problem] Saprolegnia (Water Mold)** (IlX7xILobrukz7d5Jo2xIs)
- **[problem] Hydra Infestation** (J1Tx0fWCuGNPno99A79Tvf)
- **[problem] Ich (White Spot Disease)** (J1Tx0fWCuGNPno99A7AE36)
- **[problem] Swim Bladder Disease** (J1Tx0fWCuGNPno99A7AEDM)
- **[problem] Flukes (Gill and Skin Parasites)** (J1Tx0fWCuGNPno99A7KJcq)
- **[problem] Anchor Worm (Lernaea)** (J1Tx0fWCuGNPno99A7KJpf)
- **[problem] Pop Eye (Exophthalmia)** (J1Tx0fWCuGNPno99A7KutT)

---

## 9. Invalid parentSpecies Ref Format

All parentSpecies references use valid Sanity document reference format (object with _type: "reference" and _ref).

---

## Entity Inventory

| Type | Count |
|------|------:|
| species | 218 |
| plant | 62 |
| coral | 48 |
| invertebrate | 56 |
| equipment | 46 |
| problem | 43 |
| inspiration | 10 |
| **Total** | **483** |

---

*Generated by scripts/phase14-integrity-check.js*
