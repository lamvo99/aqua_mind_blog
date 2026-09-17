# DATABASE_UX_PHASE_9_BASELINE

## Date: 2026-09-17
## Branch: main

---

## Route Inventory

| Route | Page Path | Exists | Notes |
|-------|-----------|--------|-------|
| `/database` | `app/database/page.tsx` | ✅ | Hub — 6 nav cards |
| `/species` | `app/species/page.tsx` | ✅ | Listing — DatabaseGrid |
| `/plants` | `app/plants/page.tsx` | ✅ | Listing — DatabaseGrid |
| `/corals` | `app/corals/page.tsx` | ✅ | Listing — DatabaseGrid |
| `/equipment` | `app/equipment/page.tsx` | ✅ | Listing — DatabaseGrid |
| `/invertebrates` | `app/invertebrates/page.tsx` | ✅ | Listing — DatabaseGrid |
| `/problems` | `app/problems/page.tsx` | ✅ | Listing — ProblemsGrid |
| `/problems/diagnose` | `app/problems/diagnose/page.tsx` | ✅ | Diagnosis wizard |
| `/inspiration` | `app/inspiration/page.tsx` | ✅ | Gallery — InspirationGrid |
| `/finder` | `app/finder/page.tsx` | ✅ | Quiz — FinderQuiz |
| `/search` | `app/search/page.tsx` | ✅ | Full search — SearchClient |
| `/species/[slug]` | `app/species/[slug]/page.tsx` | ✅ | Detail |
| `/plants/[slug]` | `app/plants/[slug]/page.tsx` | ✅ | Detail |
| `/corals/[slug]` | `app/corals/[slug]/page.tsx` | ✅ | Detail |
| `/equipment/[slug]` | `app/equipment/[slug]/page.tsx` | ✅ | Detail |
| `/invertebrates/[slug]` | `app/invertebrates/[slug]/page.tsx` | ✅ | Detail |

---

## Component Inventory

### Database Components (`app/components/database/`)

| File | Purpose |
|------|---------|
| `DatabaseGrid.tsx` | Core listing — search, filter, compare, grid (466 lines) |
| `DatabaseCard.tsx` | Individual card — image, name, category, excerpt, compare |
| `RelationshipSection.tsx` | Cross-entity relationship cards on detail pages |
| `ProblemsGrid.tsx` | Problem listing — search + category filter |
| `InspirationGrid.tsx` | Inspiration gallery — style + difficulty filter |
| `WikiPromo.tsx` | CTA banner linking to /wiki |

### Finder Components (`app/components/finder/`)

| File | Purpose |
|------|---------|
| `FinderQuiz.tsx` | Multi-step quiz wizard |

### Problem Components (`app/components/problems/`)

| File | Purpose |
|------|---------|
| `DiagnosisWizard.tsx` | Symptom selector → ranked causes |

### Other Relevant

| File | Purpose |
|------|---------|
| `SearchModal.tsx` | Cmd+K global search modal |
| `EntityResources.tsx` | Related resources links on detail pages |
| `Breadcrumb.tsx` | Breadcrumb navigation |

---

## Current UX Strengths

1. **Consistent listing pattern**: All 5 entity listings use `DatabaseGrid` with domain-specific filter config
2. **Full compare feature**: Up to 3 items compared side-by-side across all domains
3. **URL state**: Filters/search persist in URL query params
4. **Client-side filtering**: Instant filter feedback after initial load
5. **Dark mode**: Full dark mode support via Tailwind `dark:` prefix
6. **SEO**: JsonLd breadcrumbs, OpenGraph metadata on all pages
7. **ISR**: Listings revalidate 5min, details 1hr

## Current UX Inconsistencies

1. **No shared layout**: Each listing page independently renders Breadcrumb + header — no consistent shell
2. **Database hub missing categories**: Problems, Inspiration, Finder not in database nav
3. **Three independent search systems**: Modal (Cmd+K), `/search` page, in-grid search — not integrated
4. **No "no results" guidance**: Empty states don't suggest Finder or clearing filters
5. **Inconsistent empty states**: Different messages across grids
6. **No result count prominence**: Count buried in filter bar
7. **Mobile filter UX**: Filters consume vertical space, no collapse/drawer pattern
8. **No loading skeletons**: Instant flash on client-side navigation
9. **Relationship sections vary**: Some detail pages show relationships, others don't — no consistent pattern

---

## Existing Test Coverage

| Test File | Domain |
|-----------|--------|
| `search.test.ts` | Search functionality |
| `finder.test.ts` | Finder quiz matching |
| `diagnosis.test.ts` | Diagnosis wizard |
| `compare.test.ts` | Compare (pre-existing failure) |
| `related.test.ts` | Related items |
| `compatibility.test.ts` | Species compatibility |
| `categories.test.ts` | Category filtering |
| `phase6-audit.test.ts` | Phase audit |

---

## Known Limitations

1. No pagination — all items rendered at once (404 entities, acceptable)
2. Pre-existing `compare.test.ts` failure (expects 4 types, project has 5)
3. TypeScript/build timeout — known project issue
4. No shared database layout — each page is independent

---

## Files Likely to Change

| File | Reason |
|------|--------|
| `app/database/page.tsx` | Hub redesign (SPEC 2) |
| `lib/navigation.ts` | Add missing nav items |
| `app/species/page.tsx` | Unified shell (SPEC 3) |
| `app/plants/page.tsx` | Unified shell (SPEC 3) |
| `app/corals/page.tsx` | Unified shell (SPEC 3) |
| `app/equipment/page.tsx` | Unified shell (SPEC 3) |
| `app/invertebrates/page.tsx` | Unified shell (SPEC 3) |
| `app/components/database/DatabaseGrid.tsx` | UX improvements (SPEC 4-7) |
| `app/components/database/DatabaseCard.tsx` | Card standardization (SPEC 6) |
| `app/components/database/RelationshipSection.tsx` | Relationship UX (SPEC 10) |
| `app/components/finder/FinderQuiz.tsx` | Finder integration (SPEC 11) |
| `app/species/[slug]/page.tsx` | Detail UX consistency (SPEC 9) |
| `app/plants/[slug]/page.tsx` | Detail UX consistency (SPEC 9) |
| `app/corals/[slug]/page.tsx` | Detail UX consistency (SPEC 9) |
| `app/equipment/[slug]/page.tsx` | Detail UX consistency (SPEC 9) |
| `app/invertebrates/[slug]/page.tsx` | Detail UX consistency (SPEC 9) |
| `tests/phase9-ux.test.ts` | New test file (SPEC 17) |
