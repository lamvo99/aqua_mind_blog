# WEB-03 Internal Linking Architecture — Gap Report

**Date:** 2026-09-11
**Auditor:** opencode
**Status:** AUDIT COMPLETE — IMPLEMENTATION PENDING

---

## Current Link Graph

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

### Implemented Relationships (verified from source)

| From → To | Status | Mechanism | Evidence |
|---|---|---|---|
| Article → Article | ✅ IMPLEMENTED | `RelatedPosts` component | `app/components/RelatedPosts.tsx` |
| Article → Entity | ✅ IMPLEMENTED | `RelatedDatabase` reverse lookup | `app/components/RelatedDatabase.tsx` |
| Article → Problem | ✅ IMPLEMENTED | `RelatedDatabase` reverse lookup | `app/components/RelatedDatabase.tsx` |
| Article → Tool | ❌ MISSING | `resourcesForCategory` exists but NOT used on article pages | `lib/related.ts:77-85` |
| Article → Learning Path | ❌ MISSING | No mechanism exists | — |
| Entity → Article | ✅ IMPLEMENTED | `relatedPosts[]` in Sanity | All 5 entity detail pages |
| Entity → Problem | ❌ MISSING | No field, no query | — |
| Entity → Tool | ❌ MISSING | No field, no query | — |
| Entity → Entity | ⚠️ PARTIAL | Only `compatibleSpecies[]` on species | `app/species/[slug]/page.tsx` |
| Problem → Article | ✅ IMPLEMENTED | `relatedPosts[]` in Sanity | `app/problems/[slug]/page.tsx` |
| Problem → Tool | ✅ IMPLEMENTED | `relatedTools[]` in Sanity | `app/problems/[slug]/page.tsx` |
| Problem → Entity | ❌ MISSING | No field, no query | — |
| Tool → Article | ⚠️ PARTIAL | `TOOL_LEARN_LINKS` links to `/posts` (generic) | `lib/related.ts:87-117` |
| Tool → Entity | ⚠️ PARTIAL | `TOOL_LEARN_LINKS` links to `/species` (generic) | `lib/related.ts:87-117` |
| Tool → Problem | ⚠️ PARTIAL | Only on compatibility-checker | `lib/related.ts:109-112` |
| Learning Path → Article | ✅ IMPLEMENTED | `steps[].post` in Sanity | `app/learn/[slug]/page.tsx` |
| Learning Path → Tool | ✅ IMPLEMENTED | `steps[].tool` in Sanity | `app/learn/[slug]/page.tsx` |
| Learning Path → Entity | ❌ MISSING | No field in collection schema | — |
| Learning Path → Problem | ❌ MISSING | No field in collection schema | — |
| Inspiration → Style | ✅ IMPLEMENTED | `item.style` field | `app/inspiration/[slug]/page.tsx` |
| Inspiration → Plant | ✅ IMPLEMENTED | `plants[]` references | `app/inspiration/[slug]/page.tsx` |
| Inspiration → Equipment | ✅ IMPLEMENTED | `equipment[]` references | `app/inspiration/[slug]/page.tsx` |
| Inspiration → Article | ✅ IMPLEMENTED | `relatedPosts[]` references | `app/inspiration/[slug]/page.tsx` |

---

## P1 — High Impact

### 1. Article pages don't link to tools or learning paths

| Field | Value |
|---|---|
| Requirement | Articles should link to relevant tools and learning paths |
| Current state | `resourcesForCategory()` in `lib/related.ts` generates tool/learn links based on slug+title keywords, but is only used on `/category/[slug]` pages, NOT on individual article pages |
| Source | `app/posts/[slug]/page.tsx` — no tool/learn section rendered |
| Status | **MISSING** |
| Impact | Articles about water changes don't link to the water change calculator. Articles about fish don't link to the stocking calculator. Major missed opportunity for user journeys. |
| Recommendation | Add a "Related Resources" section to article pages using `resourcesForCategory()` |
| Implementation scope | Create `RelatedResources` component, add to `app/posts/[slug]/page.tsx` |

### 2. Entity pages don't link to problems or tools

| Field | Value |
|---|---|
| Requirement | Entity pages should surface relevant problems and tools |
| Current state | Entity pages only link to articles via `relatedPosts[]`. No problems, no tools. |
| Source | `app/species/[slug]/page.tsx`, `app/plants/[slug]/page.tsx`, etc. |
| Status | **MISSING** |
| Impact | A user viewing a Neon Tetra page can't discover common neon tetra problems or the stocking calculator. |
| Recommendation | Add contextual "Related Problems" and "Useful Tools" sections using keyword-based matching from entity name/type |
| Implementation scope | Create `EntityResources` component, add to all 5 entity detail pages |

### 3. TOOL_LEARN_LINKS are generic — link to listing pages

| Field | Value |
|---|---|
| Requirement | Tool "learn more" links should point to specific, relevant resources |
| Current state | All TOOL_LEARN_LINKS point to generic listing pages (`/posts`, `/learn`, `/species`) |
| Source | `lib/related.ts:87-117` |
| Status | **PARTIAL** |
| Impact | User clicking "Stocking articles" from the stocking calculator lands on a generic articles page, not a specific article about stocking. |
| Recommendation | Update TOOL_LEARN_LINKS to point to specific articles where known slugs exist |
| Implementation scope | Update `lib/related.ts` with specific article slugs |

---

## P2 — Medium Impact

### 4. Learning paths don't link to entities

| Field | Value |
|---|---|
| Requirement | Learning paths should link to relevant species, plants, or equipment |
| Current state | Collection schema only has `steps[].post` and `steps[].tool` — no entity references |
| Source | `sanity/schemaTypes/collection.ts` |
| Status | **MISSING** |
| Impact | A "Choosing Your First Fish" learning path can't link directly to species profiles. Would require CMS schema change. |
| Recommendation | Document as CMS schema dependency. Can be partially addressed by adding contextual links to the learning path detail page. |
| Implementation scope | Deferred — requires Sanity schema migration |

### 5. Learning paths don't link to problems

| Field | Value |
|---|---|
| Requirement | Learning paths should surface relevant troubleshooting |
| Current state | No problem references in collection schema |
| Source | `sanity/schemaTypes/collection.ts` |
| Status | **MISSING** |
| Impact | A "Cycling" learning path can't link to the "High Ammonia" problem page. Would require CMS schema change. |
| Recommendation | Document as CMS schema dependency. |
| Implementation scope | Deferred — requires Sanity schema migration |

---

## WEB-02 Deferred Items — Status

| Item | Status | Resolution |
|---|---|---|
| Problems → Database cross-links | ❌ NOT RESOLVED | Problem schema has no entity references. Requires CMS schema change. Documented as dependency. |
| Learn → Database cross-links | ❌ NOT RESOLVED | Collection schema has no entity references. Requires CMS schema change. Documented as dependency. |
| Styles → Direct plant/equipment links | ⚠️ PARTIALLY RESOLVED | Styles → Inspiration → Plants/Equipment chain exists. Direct links would require static data enrichment. |
| Category overlap documentation | ✅ DOCUMENTED | Categories are stable; overlap is a content governance concern. |

---

## Implementation Scope

### Will Implement (P1)

1. **RelatedResources component** — Reusable component that renders tool/learn links using `resourcesForCategory()`
2. **Article → Tool/Learn links** — Add RelatedResources to article pages
3. **Entity → Problem/Tool links** — Add contextual resource sections to entity pages using keyword matching
4. **Specific TOOL_LEARN_LINKS** — Update generic links to point to specific articles

### Will NOT Implement (deferred)

5. **Learning Path → Entity links** — Requires Sanity schema migration
6. **Learning Path → Problem links** — Requires Sanity schema migration
7. **Article → Learning Path links** — No reliable data relationship exists
8. **Problem → Entity links** — Requires Sanity schema migration

---

## Acceptance Criteria Checklist

- [x] Current internal-link architecture inventoried from source
- [x] Target link graph documented
- [x] Hub relationships defined
- [x] Article relationships defined
- [x] Entity relationships defined
- [x] Problem/tool diagnostic relationships defined
- [x] Learning Path relationships defined
- [x] Inspiration relationships defined
- [x] Related Posts rules documented
- [x] Orphan-page detection documented
- [x] Search/filter utility URLs not promoted as SEO destinations
- [x] Internal links use crawlable, accessible URLs
- [x] No mass keyword-based auto-linking introduced
- [x] Existing Sanity schemas reused where practical
- [x] No unnecessary URL migration
- [ ] Tests/build pass (pending implementation)
- [ ] Current-state documentation updated (pending)
