# WEB-03 Internal Linking Architecture — Checkpoint

## Status
PASS WITH BACKLOG

## Specification
WEB-03 Internal Linking Architecture Audit & Implementation

## Requirements
12/17 verified (5 deferred to CMS schema changes)

## Current Graph

```
                          HOME
                           │
         ┌─────────────────┼──────────────────┐
         ↓                 ↓                  ↓
       LEARN            EXPLORE              SOLVE
         │                 │                  │
         ↓                 ↓                  ↓
     ARTICLES           DATABASE          PROBLEMS
         │                 │                  │
         └────────────┬────┴───────┬─────────┘
                      ↓            ↓
                    TOOLS       INSPIRATION
```

### Implemented Relationships (after WEB-03)

| From → To | Status | Mechanism |
|---|---|---|
| Article → Article | ✅ | RelatedPosts component |
| Article → Entity | ✅ | RelatedDatabase reverse lookup |
| Article → Problem | ✅ | RelatedDatabase reverse lookup |
| Article → Tool | ✅ NEW | RelatedResources component (keyword-based) |
| Article → Learning Path | ❌ DEFERRED | No reliable data relationship |
| Entity → Article | ✅ | relatedPosts[] in Sanity |
| Entity → Problem | ✅ NEW | EntityResources component (keyword-based) |
| Entity → Tool | ✅ NEW | EntityResources component (keyword-based) |
| Entity → Entity | ⚠️ PARTIAL | Only compatibleSpecies on species |
| Problem → Article | ✅ | relatedPosts[] in Sanity |
| Problem → Tool | ✅ | relatedTools[] in Sanity |
| Problem → Entity | ❌ DEFERRED | Requires CMS schema change |
| Tool → Article | ✅ NEW | TOOL_LEARN_LINKS with specific articles |
| Tool → Entity | ✅ | TOOL_LEARN_LINKS |
| Tool → Problem | ✅ | TOOL_LEARN_LINKS |
| Learning Path → Article | ✅ | steps[].post in Sanity |
| Learning Path → Tool | ✅ | steps[].tool in Sanity |
| Learning Path → Entity | ❌ DEFERRED | Requires CMS schema change |
| Learning Path → Problem | ❌ DEFERRED | Requires CMS schema change |
| Inspiration → Style | ✅ | item.style field |
| Inspiration → Plant | ✅ | plants[] references |
| Inspiration → Equipment | ✅ | equipment[] references |
| Inspiration → Article | ✅ | relatedPosts[] references |

## Implemented Changes

### 1. RelatedResources Component (NEW)
- Reusable component rendering tool/learn links using `resourcesForCategory()`
- Used on article pages to surface contextual tools and learning resources
- **File**: `app/components/RelatedResources.tsx`

### 2. Article → Tool/Learn Links
- Added `RelatedResources` to `app/posts/[slug]/page.tsx`
- Articles now show relevant tools (e.g., water change article → water change calculator)
- **File**: `app/posts/[slug]/page.tsx`

### 3. EntityResources Component (NEW)
- Reusable component rendering problem and tool links for entity pages
- Maps entity type to relevant tools (e.g., species → stocking calculator, plant → lighting calculator)
- Maps entity type to relevant problem hub
- **File**: `app/components/EntityResources.tsx`

### 4. Entity → Problem/Tool Links
- Added `EntityResources` to all 5 entity detail pages
- Species pages now link to stocking calculator and compatibility checker
- Plant pages now link to lighting, CO₂, and dosing calculators
- Coral pages now link to compatibility checker and salt mixing calculator
- Equipment pages now link to pump flow and lighting calculators
- Invertebrate pages now link to stocking calculator and compatibility checker
- **Files**: `app/species/[slug]/page.tsx`, `app/plants/[slug]/page.tsx`, `app/corals/[slug]/page.tsx`, `app/equipment/[slug]/page.tsx`, `app/invertebrates/[slug]/page.tsx`

### 5. Specific TOOL_LEARN_LINKS
- Updated `lib/related.ts` — all tool "learn more" links now point to specific articles instead of generic listing pages
- Stocking calculator → "Easiest fish for beginners" article
- Water change calculator → "How often to change water" article
- CO₂ calculator → "Planted tank essentials" learning path
- Salt mixing → "Marine & reef fundamentals" learning path
- Diagnostic → "Diagnose my problem" page
- **File**: `lib/related.ts`

### 6. Test Update
- Added `/setup-planner` to approved educational routes in `tests/related.test.ts`
- **File**: `tests/related.test.ts`

## Deferred (CMS Schema Changes Required)

| Item | Reason | Target |
|---|---|---|
| Learning Path → Entity links | Collection schema has no entity references | Sanity schema migration |
| Learning Path → Problem links | Collection schema has no problem references | Sanity schema migration |
| Problem → Entity links | Problem schema has no entity references | Sanity schema migration |
| Article → Learning Path links | No reliable data relationship exists | Content editorial process |
| Bidirectional entity links | Only species has compatibleSpecies field | Sanity schema migration |

## WEB-02 Deferred Items

| Item | Status | Resolution |
|---|---|---|
| Problems → Database | ❌ DEFERRED | Requires CMS schema change |
| Learn → Database | ❌ DEFERRED | Requires CMS schema change |
| Styles → Direct links | ⚠️ PARTIAL | Chain exists: Style → Inspiration → Plants/Equipment |
| Category overlap | ✅ DOCUMENTED | Content governance concern |

## Dependencies (Documented, Not Implemented)

- **CMS Schema**: Adding `relatedEntities[]` to problems and collections would enable richer cross-linking
- **WEB-04**: Database entity SEO could benefit from explicit entity→problem and entity→tool references
- **WEB-05**: Problem→Tool diagnostic loop would benefit from entity references in problem schema

## Tests
```
210/211 passing (compare.test.ts pre-existing failure)
related.test.ts: 7/7 PASS (updated with /setup-planner route)
```

## Lint
```
PASS (no errors)
```

## Build
```
PASS (271 static pages, WEB-01/02 verified)
```

## Production Verification

| Route | Status | Notes |
|---|---|---|
| `/posts/[slug]` | OK | RelatedResources section added with tools/learn links |
| `/species/[slug]` | OK | EntityResources added (stocking, compatibility) |
| `/plants/[slug]` | OK | EntityResources added (lighting, CO₂, dosing) |
| `/corals/[slug]` | OK | EntityResources added (compatibility, salt mixing) |
| `/equipment/[slug]` | OK | EntityResources added (pump flow, lighting) |
| `/invertebrates/[slug]` | OK | EntityResources added (stocking, compatibility) |
| `/tools/stocking` | OK | Learn links now point to specific articles |
| `/tools/water-change` | OK | Learn links now point to specific articles |
| `/tools/diagnostic` | OK | Learn links now point to specific pages |
| All other routes | OK | No regressions |

## Current State
Updated: YES

## Known Issues
- `compare.test.ts` pre-existing failure (4 vs 5 types)
- Learning paths can't link to entities or problems (CMS schema limitation)
- Article → Learning Path links not implemented (no data relationship)
- Entity → Entity links only exist for species (compatibleSpecies)

## Next Phase
WEB-04
