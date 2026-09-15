# WEB-01 Technical SEO & Indexation — Gap Report

**Date:** 2026-09-11
**Auditor:** opencode
**Status:** AUDIT COMPLETE — IMPLEMENTATION PENDING

---

## Executive Summary

The project has a solid SEO foundation: all 46 routes have unique titles, descriptions, and canonical URLs. Root layout provides global metadata, JSON-LD (WebSite + Organization), and robots directives. However, several gaps exist in sitemap coverage, language metadata, social sharing metadata, and indexation control.

---

## P0 — Critical

### 1. `inLanguage: "vi"` in article JSON-LD

| Field | Value |
|---|---|
| Requirement | Structured data must accurately describe visible content |
| Current state | `inLanguage: "vi"` hardcoded in `articleSchema` |
| Source location | `lib/seo/jsonld.tsx:35` |
| Status | **BROKEN** |
| Impact | Every article tells Google it is Vietnamese. This can severely tank English search rankings. |
| Recommendation | Change `"vi"` to `"en"` |

---

## P1 — High Impact

### 2. `/styles/[slug]` not in sitemap

| Field | Value |
|---|---|
| Requirement | Sitemap must cover intended indexable URLs |
| Current state | 8 style guide pages (`/styles/iwagumi`, `/styles/dutch`, etc.) not in sitemap |
| Source location | `app/sitemap.ts` |
| Status | **MISSING** |
| Impact | Google cannot discover these pages through normal crawling. 6+ high-value content pages invisible. |
| Recommendation | Add `styles` type to `TYPE_SEGMENTS` in sitemap.ts or add static entries |

### 3. `/finder` not in sitemap

| Field | Value |
|---|---|
| Requirement | Sitemap must cover intended indexable URLs |
| Current state | `/finder` is a key conversion page, not in sitemap |
| Source location | `app/sitemap.ts` |
| Status | **MISSING** |
| Impact | Important tool page invisible to sitemap-based discovery. |
| Recommendation | Add `/finder` to `LIST_PATHS` |

### 4. `/search` not noindexed

| Field | Value |
|---|---|
| Requirement | Internal UI states should not be indexed |
| Current state | `/search` has no robots directive, inherits `index: true` from layout |
| Source location | `app/search/page.tsx` |
| Status | **MISSING** |
| Impact | Thin/dynamic utility page could dilute crawl budget. |
| Recommendation | Add `robots: { index: false }` metadata export |

---

## P2 — Medium Impact

### 5. No Twitter card metadata on 29 of 31 pages

| Field | Value |
|---|---|
| Requirement | Twitter/X metadata where appropriate |
| Current state | Only `app/posts/[slug]/page.tsx` has `twitter` cards. All other pages inherit generic layout defaults. |
| Source location | Multiple page files |
| Status | **PARTIAL** |
| Impact | Social shares on database/tool/style pages show generic cards instead of page-specific content. |
| Recommendation | Add `twitter` metadata to pages that already have `openGraph` (database details, inspiration, problems, category) |

### 6. No OG metadata on 25+ listing/static pages

| Field | Value |
|---|---|
| Requirement | Open Graph metadata where appropriate |
| Current state | Listing pages (`/species`, `/plants`, etc.) and static pages (`/about`, `/contact`, etc.) have no page-specific OG |
| Source location | Multiple page files |
| Status | **PARTIAL** |
| Impact | Social shares show generic layout defaults instead of page-specific content. |
| Recommendation | Add OG metadata to high-value listing pages |

### 7. `force-dynamic` on `/posts`

| Field | Value |
|---|---|
| Requirement | Crawlable, cacheable content |
| Current state | `export const dynamic = "force-dynamic"` on posts listing |
| Source location | `app/posts/page.tsx` |
| Status | **PARTIAL** |
| Impact | Every request bypasses ISR cache. Bad for TTFB and crawl performance on a high-traffic listing page. |
| Recommendation | Remove `force-dynamic`, rely on ISR with revalidate |

### 8. Invertebrates title too long (86 chars)

| Field | Value |
|---|---|
| Requirement | Titles should be ≤60 chars for SERP display |
| Current state | `Invertebrates Database — Shrimp, Snails, Crabs & Reef Inverts — AquaMind` (86 chars) |
| Source location | `app/invertebrates/page.tsx` |
| Status | **PARTIAL** |
| Impact | Title will be truncated in Google SERPs. |
| Recommendation | Shorten to ~55-60 chars |

---

## P3 — Polish / Backlog

### 9. JSON-LD coverage thin on database detail pages

| Field | Value |
|---|---|
| Requirement | Structured data must accurately describe visible page content |
| Current state | Database detail pages only have `BreadcrumbList` — no `Product`/`Thing` schema |
| Source location | `app/species/[slug]/page.tsx`, etc. |
| Status | **PARTIAL** |
| Impact | Missing opportunity for rich results on entity pages. |
| Recommendation | Add `ProfilePage` or similar schema. (Deferred — WEB-04 scope.) |

### 10. `/problems/[slug]` OG missing image

| Field | Value |
|---|---|
| Requirement | OG metadata should include image |
| Current state | Problem detail OG has title + description but no image |
| Source location | `app/problems/[slug]/page.tsx` |
| Status | **PARTIAL** |
| Impact | Social shares show generic card without image. |
| Recommendation | Add OG image from Sanity if available |

### 11. `/start-here` missing HowTo/ItemList schema

| Field | Value |
|---|---|
| Requirement | Structured data must accurately describe visible content |
| Current state | 5-step beginner guide has no structured data |
| Source location | `app/start-here/page.tsx` |
| Status | **MISSING** |
| Impact | Missing rich result opportunity for step-by-step guide. |
| Recommendation | Add `ItemList` or `HowTo` schema |

---

## Acceptance Criteria Checklist

- [x] Canonical policy verified — all 46 routes have correct canonicals
- [x] Robots verified — no public pages accidentally blocked
- [x] Sitemap verified — comprehensive with gaps (styles, finder)
- [ ] Metadata verified for major page types — partial (Twitter/OG gaps)
- [x] Index/noindex policy documented
- [x] Duplicate URL behavior verified — no duplicates found
- [x] 404/redirect behavior verified — custom not-found page exists
- [ ] Structured data audited — `inLanguage` bug, thin coverage
- [x] Crawlable navigation verified — all links are HTML `<a>` tags
- [x] Query-state/indexation risks checked — no dangerous query-state URLs
- [ ] Production URLs verified — pending implementation
- [ ] Build/tests pass — pending implementation
- [ ] CURRENT_STATE updated — pending implementation
