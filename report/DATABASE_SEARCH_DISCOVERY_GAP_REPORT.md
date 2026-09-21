# DATABASE SEARCH DISCOVERY GAP REPORT — PHASE 10

**Date:** 2026-09-20

## Search Architecture

- **Global search:** GROQ `match` on `name`, `scientificName`, `excerpt` fields
- **Database filter:** Client-side filtering on waterType, difficulty, diet, group, aquariumStyle
- **Finder:** 4-step quiz (waterType → tankSize → difficulty → light)
- **No fuzzy matching, no typo tolerance, no alias expansion**

## Gap Analysis by Cause

### Missing Data (gaps that require new entities)

| Query | Expected | Actual | Cause | Fix |
|---|---|---|---|---|
| arowana | Arowana species | No results | Missing data | Create entities |
| piranha | Piranha species | No results | Missing data | Create entities |
| arapaima | Arapaima gigas | No results | Missing data | Create entity |
| bichir | Bichir species | 1 result (Senegal) | Partial data | Add more species |
| snakehead | Snakehead species | 2 results (partial) | Partial data | Add more species |
| large tang | Sailfin/Purple/Naso tang | No results | Missing data | Create entities |
| marine puffer | Arothron, Diodon | No results | Missing data | Create entities |
| large angelfish | Pomacanthus species | No results | Missing data | Create entities |

### Missing Aliases (gaps that require alias/name expansion)

| Query | Expected Entity | Actual | Cause | Fix |
|---|---|---|---|---|
| huyết long | Asian Arowana | No results | Vietnamese trade name not in any field | Add localNames field or add to excerpt |
| kim long | Golden Arowana | No results | Vietnamese trade name | Add localNames field or add to excerpt |
| ngân long | Silver Arowana | No results | Vietnamese trade name | Add localNames field or add to excerpt |
| thanh long | Green Arowana | No results | Vietnamese trade name | Add localNames field or add to excerpt |
| cửu sừng | Polypterus/Bichir | No results | Vietnamese trade name | Add localNames field or add to excerpt |
| hải tượng long | Arapaima | No results | Vietnamese trade name | Add localNames field or add to excerpt |
| nẻ nhật | Yellow Tang (Zebrasoma flavescens) | No results | Vietnamese trade name | Add localNames field or add to excerpt |
| nẻ điện | Kole Tang (Ctenochaetus strigosus) | No results | Vietnamese trade name | Add localNames field or add to excerpt |
| nẻ bút | Palette Surgeonfish | No results | Vietnamese trade name | Add localNames field or add to excerpt |
| nẻ sọc | Lined Surgeonfish | No results | Vietnamese trade name | Add localNames field or add to excerpt |
|蛋白白 | Protein Skimmer | No results (Chinese: 蛋白质分离器) | Language mismatch | Use English terms in search |
| reef light | Reef LED Light | Partial | Name mismatch | Ensure "Reef Light" is in excerpt |
| CO2 regulator | CO₂ Regulator Kit | Partial | Name mismatch | Ensure "CO2 regulator" is in excerpt |
| ATO | ATO System | Partial | Abbreviation not searchable | Add "ATO" to excerpt or name |

### Search Ranking Gaps

| Issue | Impact | Fix |
|---|---|---|
| No fuzzy matching | Typos return no results | Future: implement typo-tolerant search |
| No alias expansion | Trade/regional names invisible | Future: add alias field, search across name + aliases |
| No synonym handling | "BBA" vs "Black Beard Algae" inconsistent | Future: add search synonyms |
| Name-only search | Excerpt not reliably populated | Ensure excerpt fields are populated for all entities |

### Filter Gaps

| Filter | Current | Gap | Fix |
|---|---|---|---|
| waterType | ✓ works | None | — |
| difficulty | ✓ works | None | — |
| diet | ✓ works | None | — |
| group | Exists but mostly null | No usable grouping | Populate group field |
| aquariumStyle | ✓ works | None | — |
| coralType | Exists in data | Not exposed as filter | Add to filter UI |
| light (plants) | Exists in data | Not exposed as filter | Add to filter UI |
| CO2 (plants) | Exists in data | Not exposed as filter | Add to filter UI |
| placement | Exists in data | Not exposed as filter | Add to filter UI |

## Priority Fixes

### Immediate (no schema change)
1. Populate `group` field for all species (enables group-based discovery)
2. Populate `excerpt` fields with searchable descriptions
3. Add "ATO", "CO2 regulator", "reef light" to relevant equipment excerpts

### Short-term (schema change)
1. Add `localNames` field for Vietnamese/Chinese/Indonesian trade names
2. Add `aliases` field for alternative common names

### Long-term (search architecture)
1. Implement fuzzy matching / typo tolerance
2. Add search synonyms layer
3. Expose coralType, light, CO2, placement as filter options
