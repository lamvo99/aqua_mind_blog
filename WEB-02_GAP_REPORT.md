# WEB-02 Information Architecture — Gap Report

**Date:** 2026-09-11
**Auditor:** opencode
**Status:** AUDIT COMPLETE — IMPLEMENTATION PENDING

---

## Executive Summary

AquaMind has a strong multi-surface architecture with 46 routes across articles, 5 databases, tools, problems, inspiration, and learning paths. The main IA gaps are: (1) footer is article-centric and doesn't expose the site's full breadth, (2) homepage doesn't surface database/tools/problems/inspiration/learn, (3) several surfaces lack breadcrumbs, and (4) cross-surface linking is inconsistent.

---

## P0 — Critical

_No critical gaps found. No routes are orphaned. All major surfaces are reachable from the navbar._

---

## P1 — High Impact

### 1. Footer is article-centric — missing all non-article surfaces

| Field | Value |
|---|---|
| Requirement | Footer should expose major site surfaces for discoverability |
| Current state | Footer only links to: Home, Articles, About, Contact, and 6 post categories |
| Source | `app/components/footer.tsx` |
| Status | **PARTIAL** |
| Impact | Users who scroll to footer see no evidence of Database, Tools, Problems, Inspiration, Learn, Wiki, Start Here, or Finder. This is the single biggest IA gap. |
| Recommendation | Add a "Surfaces" column to footer with links to Database, Tools, Problems, Inspiration, Learn, Start Here |
| Implementation scope | Edit `app/components/footer.tsx` — add navigation column |

### 2. Homepage doesn't expose Database/Tools/Problems/Inspiration/Learn

| Field | Value |
|---|---|
| Requirement | Homepage should expose major knowledge pathways |
| Current state | Homepage only links to: Articles (featured + latest), Categories, Finder CTA |
| Source | `app/page.tsx` |
| Status | **PARTIAL** |
| Impact | New users landing on homepage have no visual path to database, tools, problems, inspiration, or learning paths unless they use the navbar. |
| Recommendation | Add a "Discover" section between Categories and Finder CTA exposing major surfaces |
| Implementation scope | Edit `app/page.tsx` — add Discover section |

### 3. `/start-here` lacks breadcrumb

| Field | Value |
|---|---|
| Requirement | All public surfaces should have consistent breadcrumbs |
| Current state | `/start-here` does not use the Breadcrumb component |
| Source | `app/start-here/page.tsx` |
| Status | **MISSING** |
| Impact | Inconsistent navigation UX. Users cannot orient themselves. |
| Recommendation | Add `Breadcrumb` with items: Home > Start Here |
| Implementation scope | Edit `app/start-here/page.tsx` — add Breadcrumb import and render |

### 4. Database hub doesn't link to Wiki

| Field | Value |
|---|---|
| Requirement | Database and Wiki should be cross-linked as complementary surfaces |
| Current state | `/database` links to 6 sub-databases but not to `/wiki` |
| Source | `app/database/page.tsx` |
| Status | **MISSING** |
| Impact | Users don't know Wiki exists as a unified search layer across all databases. |
| Recommendation | Add a Wiki promo card or link on the Database hub page |
| Implementation scope | Edit `app/database/page.tsx` — add Wiki link |

### 5. Wiki doesn't link back to Database hub

| Field | Value |
|---|---|
| Requirement | Wiki and Database should be cross-linked |
| Current state | `/wiki` has no link to `/database` |
| Source | `app/wiki/page.tsx` |
| Status | **MISSING** |
| Impact | Users on Wiki don't know they can browse individual databases. |
| Recommendation | Add a "Browse by category" section linking to individual databases |
| Implementation scope | Edit `app/wiki/page.tsx` or `WikiHub.tsx` — add database links |

---

## P2 — Medium Impact

### 6. Mobile nav has Contact with wrong icon

| Field | Value |
|---|---|
| Requirement | Icons should match their labels |
| Current state | Contact link in mobile menu uses Calculator icon |
| Source | `app/components/navbar.tsx` |
| Status | **BROKEN** |
| Impact | Confusing UI — Calculator icon next to "Contact" label. |
| Recommendation | Change Calculator icon to Mail or Contact icon from lucide-react |
| Implementation scope | Edit `app/components/navbar.tsx` — change icon import |

### 7. No link to `/finder` from navbar or footer

| Field | Value |
|---|---|
| Requirement | Key conversion tools should be discoverable |
| Current state | Finder is only reachable from homepage CTA |
| Source | `app/components/navbar.tsx`, `app/components/footer.tsx` |
| Status | **MISSING** |
| Impact | Finder quiz is a key conversion tool but hidden behind homepage. |
| Recommendation | Add Finder to Database dropdown or as a standalone nav item |
| Implementation scope | Edit `app/components/navbar.tsx` — add to dropdown or nav |

### 8. Styles page has no direct plant/equipment links

| Field | Value |
|---|---|
| Requirement | Styles should connect to actionable knowledge |
| Current state | Styles page links to Inspiration items, which indirectly link to plants/equipment |
| Source | `app/styles/[slug]/page.tsx` |
| Status | **PARTIAL** |
| Impact | Users reading about Iwagumi style cannot directly browse recommended plants. |
| Recommendation | Add a "Related Plants" or "Browse Plants" CTA on style pages |
| Implementation scope | Edit `app/styles/[slug]/page.tsx` — add plants/equipment links |

---

## P3 — Low Impact

### 9. Problems don't link to species/plants/equipment database

| Field | Value |
|---|---|
| Requirement | Problems should link to relevant database entities |
| Current state | Problem detail pages link to articles and tools, but not to species/plants/equipment |
| Source | `app/problems/[slug]/page.tsx` |
| Status | **PARTIAL** |
| Impact | Users troubleshooting a fish disease can't directly navigate to the affected species. |
| Recommendation | Would require Sanity schema changes to add entity references to problems. Document as WEB-03 dependency. |
| Implementation scope | Deferred — requires CMS schema work |

### 10. Learn paths don't link to database entities

| Field | Value |
|---|---|
| Requirement | Learning paths should aggregate existing resources including database entities |
| Current state | Learning path steps link to articles and tools, but not to species/plants/corals |
| Source | `app/learn/[slug]/page.tsx`, `app/components/learn/LearningPathChecklist.tsx` |
| Status | **PARTIAL** |
| Impact | A "Choosing Your First Fish" learning path can't link directly to species profiles. |
| Recommendation | Would require Sanity collection schema to support entity references. Document as WEB-03 dependency. |
| Implementation scope | Deferred — requires CMS schema work |

### 11. Category groups have overlap

| Field | Value |
|---|---|
| Requirement | Categories should have clear conceptual dimensions |
| Current state | 7 category groups with overlapping concepts (e.g., "Aquarium Care" vs "Aquarium Equipment" vs "Equipment Reviews") |
| Source | `lib/categories.ts` |
| Status | **PARTIAL** |
| Impact | Minor confusion in category filtering. Not critical since groups are used for blog filtering only. |
| Recommendation | Document overlap. Do not mass-rename categories per WEB-02 spec. |
| Implementation scope | Documentation only |

---

## Acceptance Criteria Checklist

- [x] Every major route has a documented IA role
- [x] Every navigation item maps to a clear user intent
- [x] Database vs Wiki responsibilities documented
- [x] Problems vs Tools responsibilities documented
- [x] Learning Paths aggregate existing resources correctly
- [x] Inspiration links to actionable knowledge
- [ ] Category overlap documented without destructive renaming
- [ ] Hub concepts defined
- [ ] Internal-link rules documented
- [ ] Breadcrumb rules documented
- [x] Search/filter URLs remain utility surfaces
- [x] No major URL migration introduced
- [ ] Existing tests/build continue to pass (pending implementation)
- [ ] `AQUA_BLOG_CURRENT_STATE.md` updated (pending)
