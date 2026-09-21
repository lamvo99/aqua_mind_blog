# DATABASE REAL-WORLD EXPANSION MANIFEST — PHASE 10

**Created:** 2026-09-20
**Phase:** DATABASE_REAL_WORLD_COVERAGE_AUDIT_PHASE_10
**Status:** APPROVED — ready for Phase 11 execution

## P0 — Critical Discovery Gaps

| Domain | Candidate | Reason | Representation | Priority | Verification | Action |
|---|---|---|---|---|---|---|
| Species | Arowana (various) | Extremely high search demand in Asian markets; Huyết Long, Kim Long, Ngân Long, Thanh Long are all Arowana variants | Species/variant | P0 | Scientific: Osteoglossum, Scleropages | Create 2-3 species entities (Asian, Silver, Jardini) |
| Species | Piranha (Serrasalmus) | Very high search demand; iconic predator fish | Species | P0 | Scientific: Serrasalmus nattereri, S. rhombeus | Create 2 species entities |
| Species | Arapaima | High-profile giant freshwater fish; Hải Tượng Long | Species | P0 | Scientific: Arapaima gigas | Create 1 species entity |

## P1 — High-Value Hobby Gaps

| Domain | Candidate | Reason | Representation | Priority | Verification | Action |
|---|---|---|---|---|---|---|
| Species | Bichir (multiple) | Only 1 of 14+ species represented; Ornate, Delhezi, Endlicheri commonly kept | Species | P1 | Scientific: Polypterus spp. | Create 3 species entities |
| Species | Snakehead (Channa) | Only 2 of 50+ species; Marulioides, Pulchra commonly searched | Species | P1 | Scientific: Channa spp. | Create 2-3 species entities |
| Species | Figure 8 Puffer | Very popular freshwater puffer | Species | P1 | Scientific: Carinotetraodon travancoricus (already Pea Puffer); Toni form | Create 1 entity if distinct |
| Species | Large Angelfish (Pomacanthus) | Missing marine angelfish group | Species | P1 | Scientific: Pomacanthus spp. | Create 1-2 species entities |
| Species | Marine Pufferfish | Popular group completely missing | Species | P1 | Scientific: Arothron spp. | Create 1-2 species entities |
| Species | Red-tailed Catfish | Very common large predatory catfish | Species | P1 | Scientific: Baryonyx walkeri or Red-tailed catfish | Create 1 entity |
| Species | Fish Fungus | Common disease missing from problems | Problem | P1 | Verified condition | Create 1 problem entity |
| Species | Sailfin Tang | Popular tang species missing | Species | P1 | Scientific: Zebrasoma veliferum | Create 1 entity |

## P2 — Specialist Gaps

| Domain | Candidate | Reason | Representation | Priority | Verification | Action |
|---|---|---|---|---|---|---|
| Species | Freshwater Eel | Missing group | Species | P2 | Scientific: various | HOLD — taxonomy varies widely |
| Species | Frogfish | Sought by marine specialists | Species | P2 | Scientific: Antennarius spp. | Create 1 entity |
| Species | Groupers | Large marine fish | Species | P2 | Scientific: various | HOLD — many species, need selection |
| Coral | Fungia (Plate Coral) | Popular LPS missing | Coral | P2 | Scientific: Fungia spp. | Create 1 entity |
| Coral | Alveopora | Popular SPS-like LPS | Coral | P2 | Scientific: Alveopora spp. | Create 1 entity |
| Species | Gar | Oddball predator | Species | P2 | Scientific: Lepisosteus spp. | Create 1 entity |
| Species | African Rift (more) | Only 2 of many | Species | P2 | Scientific: Julidochromis, Neolamprologus | Create 2 entities |

## P3 — Long-Tail Gaps

| Domain | Candidate | Reason | Representation | Priority | Verification | Action |
|---|---|---|---|---|---|---|
| Species | Fish TB | Rare but searched | Problem | P3 | Mycobacterium | Create 1 entity |
| Species | Green Spotted Puffer | Freshwater puffer variant | Species | P3 | Scientific: Dichotomyctere nigroviridis | Create 1 entity |
| Coral | Trachyphyllia | Popular open brain | Coral | P3 | Scientific: Trachyphyllia geoffroyi | Create 1 entity |
| Coral | Caulastrea | Candy Cane is already covered | Coral | P3 | Already covered as Candy Cane | No action needed |

## HOLD — Do Not Add

| Domain | Candidate | Reason | Verification Status |
|---|---|---|---|
| Species | Individual Goldfish varieties (Ranchu, Oranda, etc.) | Already have 5 goldfish entries; further varieties are morphs, not species | morph/variant — use aliases |
| Species | Individual Betta varieties (Crowntail, Halfmoon, etc.) | Already have 4 Betta entries; further varieties are morphs | morph/variant — use aliases |
| Species | Individual Guppy strains | Strains, not species | morph/variant — use aliases |
| Equipment | Individual brand-specific items | Equipment is generic, brands are attributes | No new entities needed |
| Species | "Nẻ nhật", "nẻ điện", "nẻ bút", "nẻ sọc" | Vietnamese trade names for Acanthurus tangs; map to existing tang entities as aliases | aliases — do not create species |

## Summary

| Priority | Count | Action |
|---|---|---|
| P0 | 3 groups (6-8 entities) | Create new species |
| P1 | 7 groups (10-14 entities) | Create new species/problems |
| P2 | 7 groups (7-9 entities) | Create with verification |
| P3 | 4 groups (3-4 entities) | Create if time permits |
| HOLD | 4+ groups | Do not create — use aliases |
| **Total approved** | **~26-35 new entities** | |

## Duplicate Resolution (required before expansion)

| Duplicate Pair | Resolution |
|---|---|
| Oscar / Oscar Fish | Remove "Oscar Fish", keep "Oscar" |
| Golden Pencilfish / Golden Pencilfish | Merge into one entry |
| Paradise Fish / Paradise Fish | Merge into one entry |
| Acan Lord / Acan Lords | Merge into "Acan Lord" |
| Chalice Coral / Chalice Coral | Merge into one entry |
| Goniopora / Goniopora Coral | Merge into "Goniopora" |
| Open Brain Coral / Open Brain Coral | Merge into one entry |
| Palythoa / Palythoa Coral | Merge into "Palythoa" |
| Ricordea Mushroom / Ricordea Mushroom | Merge into one entry |
| Sinularia / Sinularia Leather Coral | Merge into "Sinularia Leather Coral" |
| Protein Skimmer / Protein Skimmer | Merge into one entry |
| Gravel Vacuum / Gravel Vacuum | Merge into one entry |
| Aquarium Chiller / Aquarium Chiller | Merge into one entry |
| Auto Top-Off System / ATO System | Merge into "ATO System" |
| Red Cherry Shrimp / Cherry Shrimp | Merge into "Cherry Shrimp" |
| Sulawesi Cardinal Shrimp / Sulawesi Cardinal Shrimp | Merge into one entry |
| Blue Tiger Shrimp / Blue Tiger Shrimp | Merge into one entry |
| Rabbit Snail / Rabbit Snail | Merge into one entry |
| Christmas Moss / Christmas Moss | Merge into one entry |
| Dwarf Sagittaria / Dwarf Sagittaria | Merge into one entry |
| Glossostigma / Glossostigma | Merge into one entry |
| Java Moss / Java Moss | Merge into one entry |
| Monte Carlo / Monte Carlo | Merge into one entry |
| Rotala Macrandra / Rotala Macrandra | Merge into one entry |
| Water Sprite / Water Sprite | Merge into one entry |
| Weeping Moss / Weeping Moss | Merge into one entry |
| Bucephalandra / Bucephalandra | Merge into one entry |
| Black Beard Algae (BBA) / black-beard-algae | Merge into one problem entity |
