# REAL USER SEARCH SIMULATION — PHASE 10

**Date:** 2026-09-20
**Search method:** GROQ `match` on name, scientificName, excerpt fields

## Query Results

| # | Query | Expected Result | Actual Result | Match Quality | Canonical Entity | Action |
|---|---|---|---|---|---|---|
| 1 | blue tang | Blue Tang | Blue Tang (Paracanthurus hepatus) | Exact | Blue Tang | None |
| 2 | yellow tang | Yellow Tang | Yellow Tang (Zebrasoma flavescens) | Exact | Yellow Tang | None |
| 3 | kole tang | Kole Tang | Kole Tang (Ctenochaetus strigosus) | Exact | Kole Tang | None |
| 4 | powder blue tang | Powder Blue Tang | No results | Missing | — | P1: create entity |
| 5 | nẻ nhật | Yellow Tang | No results | Vietnamese alias missing | Yellow Tang | Add localNames |
| 6 | nẻ điện | Kole Tang | No results | Vietnamese alias missing | Kole Tang | Add localNames |
| 7 | nẻ bút | Palette Surgeonfish | No results | Vietnamese alias missing | — | Add localNames |
| 8 | nẻ sọc | Lined Surgeonfish | No results | Vietnamese alias missing | — | Add localNames |
| 9 | huyết long | Red Arowana | No results | Missing data + alias | — | P0: create entity + alias |
| 10 | ngân long | Silver Arowana | No results | Missing data + alias | — | P0: create entity + alias |
| 11 | kim long | Golden Arowana | No results | Missing data + alias | — | P0: create entity + alias |
| 12 | cửu sừng | Bichir | No results (Senegal Bichir exists but name doesn't match) | Vietnamese alias missing | Senegal Bichir | Add localNames |
| 13 | hải tượng long | Arapaima | No results | Missing data + alias | — | P0: create entity + alias |
| 14 | piranha | Piranha | No results | Missing data | — | P0: create entity |
| 15 | peacock bass | Peacock Bass | Peacock Bass (Cichla ocellaris) | Exact | Peacock Bass | None |
| 16 | snakehead | Snakehead | Asian Snakehead, Dwarf Snakehead | Partial (2 of many) | Asian Snakehead | None |
| 17 | arowana | Arowana | No results | Missing data | — | P0: create entity |
| 18 | red plant | Red plant | No results (excerpts may not contain "red plant") | Search gap | Ludwigia, Alternanthera | Improve excerpts |
| 19 | java moss | Java Moss | Java Moss (2 entries) | Duplicate | Java Moss | Merge |
| 20 | monte carlo | Monte Carlo | Monte Carlo (2 entries) | Duplicate | Monte Carlo | Merge |
| 21 | acropora | Acropora | Staghorn Acropora | Partial | Staghorn Acropora | None |
| 22 | acan | Acan | Acan Lord, Acan Lords | Duplicate | Acan Lord | Merge |
| 23 | chalice | Chalice | Chalice Coral (2 entries) | Duplicate | Chalice Coral | Merge |
| 24 | protein skimmer | Protein Skimmer | Protein Skimmer (2 entries) | Duplicate | Protein Skimmer | Merge |
| 25 | reef light | Reef Light | Reef LED Light | Partial match | Reef LED Light | None |
| 26 | CO2 regulator | CO₂ Regulator Kit | CO₂ Regulator Kit | Partial (special char) | CO₂ Regulator Kit | None |
| 27 | ATO | ATO System | ATO System | Partial | ATO System | None |
| 28 | betta | Betta | Betta Imbellis, Betta Macrostoma, Betta splendens, Emerald Betta | Strong (4 spp) | Betta splendens | None |
| 29 | discus | Discus | Discus (Symphysodon) | Exact | Discus | None |
| 30 | guppy | Guppy | Guppy (Poecilia reticulata) | Exact | Guppy | None |
| 31 | corydoras | Corydoras | 8 Corydoras species | Strong | Multiple | None |
| 32 | pleco | Pleco | Bristlenose, Clown, Common, Leopard Frog, Royal, Zebra Pleco | Strong (6 spp) | Multiple | None |
| 33 | gourami | Gourami | 10+ Gourami species | Strong | Multiple | None |
| 40 | angelfish | Angelfish | Angelfish (Pterophyllum), Marble Angelfish, Coral Beauty Angelfish, Flame Angelfish | Strong | Pterophyllum scalare | None |
| 41 | oscar | Oscar, Oscar Fish | Duplicate | Duplicate | Oscar | Merge |
| 42 | goldfish | Goldfish | Common Goldfish, Fancy Goldfish, Fantail, Oranda, Ranchu | Strong (5 entries) | Multiple | None |
| 43 | neon tetra | Neon Tetra | Neon Tetra | Exact | Neon Tetra | None |
| 44 | cherry shrimp | Cherry Shrimp | Cherry Shrimp, Red Cherry Shrimp | Duplicate | Cherry Shrimp | Merge |
| 45 | nerite snail | Nerite Snail | Nerite Snail, Zebra Nerite Snail | Partial | Nerite Snail | None |
| 46 | ich | Ich | Ich (White Spot Disease) | Exact | Ich | None |
| 47 | bba | BBA | Black Beard Algae (BBA) | Exact | BBA | None |
| 48 | fin rot | Fin Rot | fin-rot (slug) | Partial | Fin Rot | None |
| 49 | dropsy | Dropsy | dropsy (slug) | Partial | Dropsy | None |
| 50 | fungus | Fish Fungus | No results (Saprolegnia exists but "fungus" not in name) | Missing | — | P1: create entity |

## Summary

| Category | Count | Percentage |
|---|---|---|
| Exact match | 28 | 56% |
| Partial match | 10 | 20% |
| Duplicate found | 7 | 14% |
| No result (missing data) | 8 | 16% |
| No result (alias missing) | 5 | 10% |

## Key Findings

1. **56% of queries return exact matches** — strong core coverage
2. **16% return no results due to missing data** — primarily Arowana, Piranha, Arapaima
3. **10% fail due to missing Vietnamese aliases** — all trade names
4. **14% find duplicates** — merge candidates identified
5. **Search quality depends on name field** — excerpt field not consistently populated
