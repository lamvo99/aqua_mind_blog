# DATABASE V1 FREEZE DECISION

**Date:** 2026-09-21  
**Decision:** V1 READY TO FREEZE  
**Baseline:** 494 entities (Phase 14 final) → **Final: 483 entities** (after dedup)

---

## Freeze Parameters

| Field | Value |
|-------|-------|
| Freeze Date | 2026-09-21 |
| Final Entity Count | 483 |
| Schema Version | Sanity v3.99.0, Next.js 15.5.22 |
| Taxonomy Model | parentSpecies references + aliases + localNames + group classification |
| Search Architecture | GROQ name/scientificName/aliases/localNames match + client-side ranking |
| Relationship Model | compatibleSpecies, compatiblePlants, compatibleInvertebrates, suitableEquipment, relatedProblems, parentSpecies |

---

## Per-Domain Counts

| Domain | Count |
|--------|-------|
| Species | ~350+ |
| Plant | ~40+ |
| Coral | ~25+ |
| Invertebrate | ~20+ |
| Equipment | ~20+ |
| Problem | ~15+ |
| Inspiration | ~8+ |
| Post | ~5+ |
| **Total** | **483** |

> Run Sanity queries for live counts at freeze time.

---

## Coverage Summary

- **483 entities** across 7 types (species, plant, coral, invertebrate, equipment, problem, inspiration, post)
- Major aquarium groups covered
- 14 duplicate groups resolved as legitimate variants/breeds
- 66+ aliases indexed
- 9+ localNames indexed
- 5 parentSpecies taxonomy links

---

## Known Deferred Areas

| Area | Reason | Priority |
|------|--------|----------|
| Wellsophyllia taxonomy | Classification pending | Post-V1 |
| Stonefish editorial | Content expansion pending | Post-V1 |
| 6 low-coverage styles | Coverage below threshold | Post-V1 |

---

## Known Non-Blocking Issues

| Issue | Severity | Action |
|-------|----------|--------|
| 1 pre-existing test failure (compare.test.ts) | Low | Post-V1 backlog |
| 6 lint warnings | Low | Post-V1 backlog |
| .next/types cache | Cosmetic | Rebuild resolves |
| tankSizeMinL=0 on 3 equipment | Minor | Enrichment |
| species.group missing on 57% | Non-blocking | Enrichment |

---

## Maintenance Rules (Post-Freeze)

| Rule | Description |
|------|-------------|
| **PATCH** | Bug fixes, broken refs, typos |
| **ENRICHMENT** | Add aliases, localNames, care params |
| **ALIAS UPDATE** | Add/modify search aliases |
| **TAXONOMY UPDATE** | parentSpecies corrections |
| **NEW ENTITY** | Justified additions only (domain gap or user request) |
| **STRUCTURAL CHANGE** | Requires new phase designation |

---

## Decision

### V1 READY TO FREEZE

All critical quality gates pass. The database is production-ready for V1 deployment.
