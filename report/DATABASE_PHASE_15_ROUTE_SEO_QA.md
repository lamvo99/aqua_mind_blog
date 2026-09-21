# DATABASE PHASE 15 — Route/SEO Regression (SPEC-13)

**Date:** 2026-09-21
**Phase:** 15 — V1 Final QA & Freeze

## Methodology

Code review of app/ directory routes, metadata generation, JSON-LD schemas, and canonical URL structure.

---

## 1. Entity Slug Routes

### Listing Pages (Static)

| Route | Page File | Description |
|-------|-----------|-------------|
| /species | app/species/page.tsx | Fish species database |
| /plants | app/plants/page.tsx | Plant database |
| /corals | app/corals/page.tsx | Coral database |
| /invertebrates | app/invertebrates/page.tsx | Invertebrate database |
| /equipment | app/equipment/page.tsx | Equipment database |
| /problems | app/problems/page.tsx | Problem database |
| /inspiration | app/inspiration/page.tsx | Inspiration gallery |

### Detail Pages (Dynamic)

| Route Pattern | Page File | generateStaticParams |
|---------------|-----------|---------------------|
| /species/[slug] | app/species/[slug]/page.tsx | Yes — fetches all species slugs |
| /plants/[slug] | app/plants/[slug]/page.tsx | Yes — fetches all plant slugs |
| /corals/[slug] | app/corals/[slug]/page.tsx | Yes — fetches all coral slugs |
| /invertebrates/[slug] | app/invertebrates/[slug]/page.tsx | Yes — fetches all invertebrate slugs |
| /equipment/[slug] | app/equipment/[slug]/page.tsx | Yes — fetches all equipment slugs |
| /problems/[slug] | app/problems/[slug]/page.tsx | Yes — fetches all problem slugs |
| /inspiration/[slug] | app/inspiration/[slug]/page.tsx | Yes — fetches all inspiration slugs |

### Other Routes

| Route | Page File |
|-------|-----------|
| / | app/page.tsx |
| /database | app/database/page.tsx |
| /search | app/search/page.tsx |
| /finder | app/finder/page.tsx |
| /wiki | app/wiki/page.tsx |
| /posts | app/posts/page.tsx |
| /posts/[slug] | app/posts/[slug]/page.tsx |
| /category/[slug] | app/category/[slug]/page.tsx |
| /learn | app/learn/page.tsx |
| /learn/[slug] | app/learn/[slug]/page.tsx |
| /tools | app/tools/page.tsx |
| /tools/* | Multiple tool pages |
| /about | app/about/page.tsx |
| /contact | app/contact/page.tsx |
| /start-here | app/start-here/page.tsx |
| /studio/[[...tool]] | app/studio/[[...tool]]/page.tsx |

**Status: PASS** — All entity types have listing and detail routes with `generateStaticParams`.

---

## 2. Listing Pages for All Database Types

| Type | Listing Page | Count | Status |
|------|-------------|-------|--------|
| species | /species | 218 | PASS |
| invertebrate | /invertebrates | 56 | PASS |
| plant | /plants | 62 | PASS |
| coral | /corals | 48 | PASS |
| equipment | /equipment | 46 | PASS |
| problem | /problems | 43 | PASS |
| inspiration | /inspiration | 10 | PASS |

**Status: PASS** — All 7 entity types have dedicated listing pages.

---

## 3. JSON-LD Metadata Structure

### Schema Types Used

| Schema | Usage | Location |
|--------|-------|----------|
| Organization | Site-wide | lib/seo/jsonld.tsx:5-14 |
| WebSite | Site-wide with SearchAction | lib/seo/jsonld.tsx:64-80 |
| BlogPosting | Article posts | lib/seo/jsonld.tsx:25-49 |
| BreadcrumbList | All pages | lib/seo/jsonld.tsx:51-62 |
| CollectionPage | Listing pages | lib/seo/jsonld.tsx:103-130 |
| HowTo | Tool guides | lib/seo/jsonld.tsx:82-101 |

### JSON-LD Application Points

| Page | Schema Applied |
|------|---------------|
| /species | BreadcrumbList + CollectionPage |
| /species/[slug] | BreadcrumbList |
| /plants | BreadcrumbList + CollectionPage |
| /corals | BreadcrumbList + CollectionPage |
| /invertebrates | BreadcrumbList + CollectionPage |
| /equipment | BreadcrumbList + CollectionPage |
| /database | BreadcrumbList |
| /finder | BreadcrumbList |
| /search | (none — robots: noindex) |
| /category/[slug] | BreadcrumbList + CollectionPage |
| /posts/[slug] | BreadcrumbList + BlogPosting (via articleSchema) |

### JSON-LD Structure Verified

```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "...",
  "description": "...",
  "url": "https://aquamind.life/species",
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [...]
  }
}
```

**Status: PASS** — JSON-LD schemas are correctly structured and applied.

---

## 4. Canonical URLs

### Canonical URL Pattern

All pages use `alternates.canonical` in metadata:

| Page Pattern | Canonical Format |
|-------------|-----------------|
| /species | https://aquamind.life/species |
| /species/[slug] | https://aquamind.life/species/{slug} |
| /plants | https://aquamind.life/plants |
| /plants/[slug] | https://aquamind.life/plants/{slug} |
| /corals | https://aquamind.life/corals |
| /corals/[slug] | https://aquamind.life/corals/{slug} |
| /invertebrates | https://aquamind.life/invertebrates |
| /invertebrates/[slug] | https://aquamind.life/invertebrates/{slug} |
| /equipment | https://aquamind.life/equipment |
| /equipment/[slug] | https://aquamind.life/equipment/{slug} |
| /problems | https://aquamind.life/problems |
| /problems/[slug] | https://aquamind.life/problems/{slug} |
| /finder | https://aquamind.life/finder |
| /search | https://aquamind.life/search (noindex) |
| /database | https://aquamind.life/database |

### Canonical URL Verification

- **No trailing slashes** — All canonicals use clean paths
- **Consistent domain** — All use `https://aquamind.life`
- **No broken patterns** — Dynamic routes use `${slug}` interpolation
- **Search marked noindex** — `/search` has `robots: { index: false }`

**Status: PASS** — All canonical URLs are valid and consistent.

---

## 5. OpenGraph / Twitter Cards

| Page Type | og:type | og:url | twitter:card |
|-----------|---------|--------|-------------|
| Listing | website | canonical URL | summary_large_image |
| Detail | website | canonical URL | summary_large_image |
| Article | article | /posts/{slug} | summary_large_image |

**Status: PASS** — OpenGraph and Twitter card metadata properly set.

---

## Summary

| Check | Status | Notes |
|-------|--------|-------|
| Entity slugs generate valid routes | PASS | All 7 types have [slug] pages with generateStaticParams |
| Listing pages exist for all DB types | PASS | species, invertebrate, plant, coral, equipment, problem, inspiration |
| JSON-LD metadata structure | PASS | BreadcrumbList, CollectionPage, BlogPosting, Organization, WebSite |
| No broken canonical URLs | PASS | All use https://aquamind.life/{path} pattern |
| OpenGraph/Twitter cards | PASS | Properly configured |
| **Overall** | **PASS** | |

## Minor Notes

1. **Problems listing** — `/problems` page exists but problems are not in the Finder (by design)
2. **Search noindex** — `/search` is correctly marked as noindex since it shows filtered content
3. **Studio route** — `/studio/[[...tool]]` is the Sanity Studio, correctly using catch-all route
