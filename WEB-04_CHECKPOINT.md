# WEB-04 CHECKPOINT

## Status

PASS WITH BACKLOG

## Specification

WEB-04 Database / Entity SEO

## Requirements

All 5 entity families inventoried, entity quality assessed, indexability verified, metadata verified, structured data extended, cross-entity relationships documented. CMS-dependent items deferred.

## Entity Families Audited

- Species (74 detail pages)
- Plants (30 detail pages)
- Corals (17 detail pages)
- Equipment (18 detail pages)
- Invertebrates (20 detail pages)

## Entity Route Inventory

| Route | Type | Data Source | ISR | Indexable |
|---|---|---|---|---|
| `/database` | Hub | Static nav | No | Yes |
| `/species` | List | Sanity | 300s | Yes |
| `/species/[slug]` | Detail | Sanity | 3600s | Yes |
| `/plants` | List | Sanity | 300s | Yes |
| `/plants/[slug]` | Detail | Sanity | 3600s | Yes |
| `/corals` | List | Sanity | 300s | Yes |
| `/corals/[slug]` | Detail | Sanity | 3600s | Yes |
| `/equipment` | List | Sanity | 300s | Yes |
| `/equipment/[slug]` | Detail | Sanity | 3600s | Yes |
| `/invertebrates` | List | Sanity | 300s | Yes |
| `/invertebrates/[slug]` | Detail | Sanity | 3600s | Yes |
| `/wiki` | Cross-DB search | Sanity (5 types) | No | Yes |

## Sanity / CMS Schema

- Species: has `seo` object (unused), `compatibleSpecies[]`, `relatedPosts[]`. Missing `waterType` from detail query (fixed).
- Plant: has `relatedPosts[]`. No cross-entity refs, no `seo` object.
- Coral: has `relatedPosts[]`. Missing `coralType` and `difficulty` from detail query (fixed).
- Equipment: has `relatedPosts[]`. Missing `tankSizeMinL` from detail query (fixed). No `seo` object.
- Invertebrate: has `relatedPosts[]`. Was excluded from `getDatabaseItemsReferencingPost` (fixed).

## Entity Page Quality

All 5 entity families have: name, image, excerpt, care parameters grid, related articles, EntityResources (problems + tools), WikiPromo, breadcrumb. Species additionally has compatible species list. Equipment has pros/cons. Plant has propagation info.

Thin-page risk: LOW if CMS fields populated; MEDIUM if excerpt/scientificName absent.

## Thin-Page / Index-Bloat Assessment

All entity pages have ISR revalidation. No mass-indexing of empty records. Classification: INDEXABLE / NEEDS IMPROVEMENT (all families). Filter states are client-side only, no indexable filter URLs.

## Indexability

- robots: inherited `index: true, follow: true` from layout (correct)
- canonical: all entity detail pages self-canonicalize correctly
- sitemap: all families included (detail 0.7, lists 0.6)
- `/search`: noindexed (preserved from WEB-01)
- Filter URLs: client-side only, no indexable filter URLs

## Structured Data

| Page Type | Before | After |
|---|---|---|
| Entity detail pages | BreadcrumbList only | BreadcrumbList with Home |
| Entity listing pages | None | CollectionPage + BreadcrumbList with Home |
| Database hub | None | BreadcrumbList with Home |
| `/wiki` | CollectionPage + BreadcrumbList | No change (already correct) |

Entity-specific JSON-LD (Product, Thing, etc.) NOT implemented — would require CMS schema changes and fabricated properties.

## Implemented

### Data Layer (`lib/database.ts`)
- Added `waterType` to `getDatabaseItem` species projection
- Added `coralType` to `getDatabaseItem` coral projection
- Added `difficulty` to `getDatabaseItem` coral projection (was missing)
- Added `tankSizeMinL` to `getDatabaseItem` equipment projection
- Added `invertebrate` to `getDatabaseItemsReferencingPost` type filter (bug fix)

### Entity Detail Pages (5 files)
- Changed `openGraph.type` from `"article"` to `"website"` on all 5 detail pages
- Added "Home" to `BreadcrumbList` JSON-LD on all 5 detail pages
- Added "Home" to visual `Breadcrumb` on all 5 detail pages
- Improved image `alt` text with entity-type context on all 5 detail pages
- Improved OG image `alt` text on all 5 detail pages

### Entity Listing Pages (5 files)
- Added `CollectionPage` + `BreadcrumbList` JSON-LD to all 5 listing pages
- Added "Home" to visual `Breadcrumb` on all 5 listing pages
- Fixed missing `openGraph` metadata on invertebrates listing page

### Database Hub (`app/database/page.tsx`)
- Added `BreadcrumbList` JSON-LD with "Home"
- Added "Home" to visual `Breadcrumb`

### Filter Bug Fix (`app/components/database/DatabaseGrid.tsx`)
- Fixed multi-filter bug: filter now checks all `filterKeys` instead of only `filterKeys[0]`

## Deferred

| Item | Reason |
|---|---|
| Entity-to-problem CMS references | No `relatedProblems` field in any entity schema |
| Entity-to-equipment CMS references | No `relatedEquipment` field in any entity schema |
| Coral compatibility network | No `compatibleCorals` or `compatibleSpecies` on coral schema |
| Plant compatibility | No cross-entity references on plant schema |
| `seo` object on plant/coral/equipment/invertebrate | Schema migration required |
| Collection/learning path frontend pages | Schema exists but no pages query it |
| Entity rich text body fields | Schema migration required |
| Gallery / additional images | Schema migration required |
| `difficulty` field on equipment | Schema migration required |
| Entity-specific JSON-LD (Product, Thing) | Would require CMS properties not currently available |

## Dependencies

- WEB-05 (Tools SEO) — no dependency
- WEB-06 (Problems/Diagnosis) — no dependency
- CMS schema changes needed for deferred items

## Tests

```
Tests:   193/194 passing (1 pre-existing failure: compare.test.ts)
Lint:    PASS (no errors)
Build:   PASS (271 static pages)
```

## Lint

PASS — no new errors introduced.

## Build

PASS — 271 static pages generated, all entity routes present.

## Production Verification

| Route | HTTP | Title | OG | Twitter | Breadcrumb | JSON-LD | Status |
|---|---|---|---|---|---|---|---|
| `/database` | 200 | OK | OK | OK | OK | BreadcrumbList | OK |
| `/species` | 200 | OK | OK | OK | OK | CollectionPage + BreadcrumbList | OK |
| `/plants` | 200 | OK | OK | OK | OK | CollectionPage + BreadcrumbList | OK |
| `/corals` | 200 | OK | OK | OK | OK | CollectionPage + BreadcrumbList | OK |
| `/equipment` | 200 | OK | OK | OK | OK | CollectionPage + BreadcrumbList | OK |
| `/invertebrates` | 200 | OK | OK | OK | OK | CollectionPage + BreadcrumbList | OK |
| `/wiki` | 200 | OK | OK | OK | OK | CollectionPage + BreadcrumbList | OK |

## Current State

Updated: YES

## Known Issues

- `compare.test.ts` pre-existing failure (expects 4 types, project has 5)
- 2 unhandled Vitest worker timeout errors (infrastructure, not related to changes)

## Next Phase

WEB-05
