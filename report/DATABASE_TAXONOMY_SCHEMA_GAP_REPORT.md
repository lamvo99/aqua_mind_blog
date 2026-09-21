# DATABASE TAXONOMY SCHEMA GAP REPORT — PHASE 10

**Date:** 2026-09-20

## Current Schema Capabilities

All 5 entity schemas (species, plant, coral, equipment, invertebrate) support:
- `name`: Primary display name
- `slug`: URL-friendly identifier
- `scientificName`: Scientific taxonomic name (species only)
- `excerpt`: Searchable description
- `waterType`: Controlled vocabulary (freshwater/saltwater/brackish)
- `difficulty`: Controlled vocabulary (Beginner/Intermediate/Advanced/Expert)
- `aquariumStyle`: Multi-select array
- `region`: Free-text geographic region

## Gap Analysis

| Need | Current Support | Classification | Action |
|---|---|---|---|
| Common names | `name` field serves as common name | Sufficient | No change needed |
| Scientific names | `scientificName` field (species only) | Sufficient | No change needed |
| Trade names | Not supported — no field | Search-only | Add to `name` or `excerpt` for search; do not create separate entities |
| Regional names (Vietnamese) | `region` field exists but is geographic, not linguistic | Schema change required for proper support | Recommend: add optional `localNames` field for Vietnamese/Chinese/Indonesian trade names |
| Common name aliases | Not supported | Schema change required | Recommend: add optional `aliases` array field for alternative spellings, abbreviations |
| Morph/variant relationships | Not supported | Schema change required | Recommend: add optional `parentSpecies` reference for morphs (e.g., Fancy Goldfish → Common Goldfish) |
| Genus/family grouping | Not supported | Derivable | Extractable from `scientificName`; no schema change needed |
| Taxonomic hierarchy | Not supported | Unnecessary | Not needed for user-facing discovery |
| Search synonyms | Not supported | Search-only | Handle in search indexing, not schema |
| Group/taxonomy parent | `group` field exists but is null for most species | Existing field sufficient | Populate `group` field for all species |
| Size range | `sizeCm` single value | Existing field sufficient | Consider adding `sizeRangeMin`/`sizeRangeMax` for accuracy |
| Diet details | `diet` single value | Existing field sufficient | OK for current scope |
| Temperament | `temperament` single value | Existing field sufficient | OK for current scope |
| Reef compatibility | `reefCompatibility` boolean | Existing field sufficient | OK for marine species |
| Predator flag | `isPredator` boolean | Existing field sufficient | OK for discovery filtering |

## Recommendations

### Low Impact (no schema change)
- Populate `group` field for all species
- Use `region` for geographic origin
- Use `aquariumStyle` for habitat/style tags

### Medium Impact (future schema enhancement)
- Add `aliases` array field to species schema for common name variants
- Add `localNames` field for Vietnamese/Chinese/Indonesian trade names
- Add `parentSpecies` reference for morph/variant relationships

### High Impact (not recommended now)
- Full taxonomic hierarchy — overkill for aquarium hobbyist discovery
- Price tier field — subjective and changes frequently
- Availability field — changes by region and season
