# WEB-04 Gap Report

## Status

PASS WITH BACKLOG

## Entity Route Inventory

| Route | Entity Type | Data Source | ISR | Indexable | Status |
|---|---|---|---|---|---|
| `/database` | Hub | Static nav | No | Yes | OK |
| `/species` | List | Sanity | 300s | Yes | OK |
| `/species/[slug]` | Detail | Sanity | 3600s | Yes | FIX |
| `/plants` | List | Sanity | 300s | Yes | OK |
| `/plants/[slug]` | Detail | Sanity | 3600s | Yes | FIX |
| `/corals` | List | Sanity | 300s | Yes | OK |
| `/corals/[slug]` | Detail | Sanity | 3600s | Yes | FIX |
| `/equipment` | List | Sanity | 300s | Yes | OK |
| `/equipment/[slug]` | Detail | Sanity | 3600s | Yes | FIX |
| `/invertebrates` | List | Sanity | 300s | Yes | FIX |
| `/invertebrates/[slug]` | Detail | Sanity | 3600s | Yes | FIX |
| `/wiki` | Cross-DB search | Sanity (5 types) | No | Yes | OK |

## Sanity Schema Findings

### Species
- Has `seo` object (metaTitle, metaDescription) — defined but **never fetched or used**
- Has `compatibleSpecies[]` — working
- Has `relatedPosts[]` — working
- Missing: no `relatedProblems`, `relatedEquipment` references
- **Missing from detail query**: `waterType` (required field, never fetched)

### Plant
- Has `relatedPosts[]` — working
- Missing: `seo` object, cross-entity references
- No `difficulty` in detail query (exists in compare projection) — minor

### Coral
- Has `relatedPosts[]` — working
- Missing: `seo` object, `compatibleSpecies`/`compatibleCorals`
- **Missing from detail query**: `coralType` (required field, never fetched), `difficulty` (exists in compare but not detail)

### Equipment
- Has `relatedPosts[]` — working
- Missing: `seo` object, `difficulty`
- **Missing from detail query**: `tankSizeMinL` (exists in schema, never fetched)

### Invertebrate
- Has `relatedPosts[]` — working
- Missing: `seo` object, compatibility references
- **Missing from `getDatabaseItemsReferencingPost`**: `invertebrate` type excluded — invertebrates never appear as related entities on post pages

## Entity Page Quality

| Entity | Unique Content | Risk Level | Assessment |
|---|---|---|---|
| Species | Compatible species, schooling, care params | Medium | Good foundation; needs waterType display |
| Plant | Propagation, care params | Medium | Adequate if fields populated |
| Coral | Flow, aggression, reef safety | Medium | Missing coralType in display |
| Equipment | Pros/cons, brand, specs | Low-Medium | Richest editorial content |
| Invertebrate | Water type labels, group | Medium | Adequate |

## Thin-Page / Index-Bloat Assessment

All entity pages have ISR revalidation. Pages with empty optional fields could be thin (name + image + sparse grid). Current CMS data appears to have sufficient fields populated. No mass-indexing of empty records detected.

**Classification**: INDEXABLE / NEEDS IMPROVEMENT (all entity families)

## Indexability / Canonical Findings

| Issue | Status | Action |
|---|---|---|
| robots metadata | OK | Inherited `index: true, follow: true` from layout |
| canonical URLs | OK | All entity detail pages self-canonicalize correctly |
| sitemap inclusion | OK | All entity families included (detail at 0.7, lists at 0.6) |
| `/search` noindex | OK | Preserved from WEB-01 |
| Filter URLs | OK | Client-side only, no indexable filter URLs |

## Metadata Findings

| Issue | Pages Affected | Priority |
|---|---|---|
| `openGraph.type: "article"` on entity pages | All 5 detail pages | P1 |
| Missing `openGraph` on invertebrates list | `/invertebrates` | P1 |
| No twitter card on listing pages | All 6 list pages | P2 |
| OG image alt is just entity name | All 5 detail pages | P2 |

## Structured Data Findings

| Issue | Pages Affected | Priority |
|---|---|---|
| No `CollectionPage` JSON-LD on entity lists | 5 listing pages | P1 |
| No `BreadcrumbList` JSON-LD on database hub | `/database` | P1 |
| BreadcrumbList missing "Home" position | All 12 entity pages | P1 |
| No entity-specific JSON-LD | All 5 detail pages | P2 (documented, not implemented — would require CMS schema) |

## Image / Media Findings

| Issue | Pages Affected | Priority |
|---|---|---|
| Alt text is always just `item.name` | All 5 detail pages | P2 |
| OG image alt is just `item.name` | All 5 detail pages | P2 |
| Single image per entity (no gallery) | All entities | Deferred (CMS schema) |

## Cross-Entity Relationship Findings

| Relationship | Available in CMS | Implemented | Status |
|---|---|---|---|
| Species → Compatible Species | Yes | Yes | OK |
| Entity → Related Posts | Yes (all types) | Yes | OK |
| Entity → Problems | No (no CMS field) | No | Deferred |
| Entity → Equipment | No (no CMS field) | No | Deferred |
| Coral → Compatible Corals | No (no CMS field) | No | Deferred |
| Plant → Compatible Species | No (no CMS field) | No | Deferred |
| Invertebrate → Post (reverse) | Yes (but excluded) | **No (bug)** | FIX |

## Data Layer Findings

| Issue | Location | Priority |
|---|---|---|
| `coral.coralType` not fetched in detail query | `lib/database.ts:88-98` | P1 |
| `coral.difficulty` not fetched in detail query | `lib/database.ts:88-98` | P1 |
| `species.waterType` not fetched in detail query | `lib/database.ts:88-98` | P1 |
| `equipment.tankSizeMinL` not fetched in detail query | `lib/database.ts:88-98` | P1 |
| `invertebrate` excluded from `getDatabaseItemsReferencingPost` | `lib/database.ts:134` | P1 |
| DatabaseGrid filter only uses `filterKeys[0]` | `DatabaseGrid.tsx:41` | P1 |

## WEB-03 Dependencies

- WEB-03 `EntityResources` component already renders problem/tool links per entity type — verified working
- WEB-03 `RelatedResources` on articles already links to tools/learn pages — verified working

## Deferred CMS / Schema Work

| Item | Reason |
|---|---|
| Entity-to-problem references | No `relatedProblems` field in any entity schema |
| Entity-to-equipment references | No `relatedEquipment` field in any entity schema |
| Coral compatibility network | No `compatibleCorals` or `compatibleSpecies` on coral schema |
| Plant compatibility | No cross-entity references on plant schema |
| `seo` object on plant/coral/equipment/invertebrate | Schema migration required |
| Collection/learning path frontend | Schema exists but no pages query it |
| Entity rich text body fields | Schema migration required |
| Gallery / additional images | Schema migration required |
| `difficulty` field on equipment | Schema migration required |

## Implementation Scope

### Code-only fixes (this phase):
1. Fix `getDatabaseItem` to fetch missing fields (coralType, difficulty, waterType, tankSizeMinL)
2. Fix `getDatabaseItemsReferencingPost` to include invertebrate type
3. Add `CollectionPage` JSON-LD to 5 entity listing pages
4. Add `BreadcrumbList` JSON-LD to database hub
5. Add "Home" to all entity `BreadcrumbList` schemas
6. Fix missing `openGraph` on invertebrates listing page
7. Change `openGraph.type` from `"article"` to `"website"` on entity detail pages
8. Improve image alt text (add entity-type context)
9. Fix DatabaseGrid multi-filter bug
