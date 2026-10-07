# SPEC 08 — Test Results

**Date:** 2026-10-05

## Verdict

**PASS WITH FIXES — SEO INTEGRATION VERIFIED AFTER CODE FIXES**

## Required fields

```yaml
files_changed:
  - lib/database.ts                 # +1 line: seo { metaTitle, metaDescription } in getDatabaseItem projection
  - app/species/[slug]/page.tsx     # generateMetadata prefers seo.* (absolute title) + explicit fallback
  - tests/species-seo-metadata.test.ts   # new regression test file
tests_added: 5 (tests/species-seo-metadata.test.ts)
tests_passed: "258/259 suite-wide (new file 5/5; single failure = known baseline tests/compare.test.ts)"
build_status: "PASS — next build exit 0, 575 static pages, 218 species SSG"
production_status: "PRE-FIX — fix not deployed (no commit/push); live raw-HTML evidence recorded in SPEC_08_PRODUCTION_SPOTCHECK.md; local production build verified byte-identical for 6/6 selected species"
remaining_issues:
  - "Deploy pending: live production still serves fallback title/description; re-check the 6 URLs in SPEC_08_PRODUCTION_SPOTCHECK.md §3 after deploy"
  - "Canonical host mismatch (pre-existing, site-wide): code emits https://aquamind.life (apex, 57 occurrences/41 files) but hosting 308-redirects apex -> https://www.aquamind.life; signals internally consistent; site-wide alignment decision deferred"
  - "post schema seo fields unused by /posts/[slug] — out of SPEC 08 scope (rewriting article metadata not allowed)"
  - "Build-time sitemap flake observed once (541 vs 553 URLs, non-species docs, revalidated to correct set); re-check sitemap count after deploy"
  - "Known baseline failure tests/compare.test.ts (unrelated to SEO, pre-existing)"
```

## Commands and results

| # | Command | Result |
|---|---|---|
| 1 | `npm run lint` | **PASS** — exit 0, no errors |
| 2 | `npx tsc --noEmit` | **PASS** — exit 0, no type errors |
| 3 | `npx vitest run tests/species-seo-metadata.test.ts tests/sitemap.test.ts` | **PASS** — 2 files, 10/10 tests |
| 4 | `npm test` (full suite) | **258 passed / 1 failed / 26 files** — the 1 failure is the known baseline `tests/compare.test.ts` (expects 4 database types, config has 5 incl. `invertebrate`); unrelated to SPEC 08, pre-existing |
| 5 | `npm run build` | **PASS** — exit 0; compiled in 50s, 575/575 static pages generated (218 `/species/[slug]` SSG routes); 6 pre-existing `react-hooks/exhaustive-deps` warnings in `app/components/tools/AquariumPlanner.tsx` (unrelated) |
| 6 | `next start` (local production server) + raw-HTML fetch of 6 selected species | **PASS** — 6/6: `<title>`, description, og, twitter byte-identical to frozen SPEC 07G values; canonical + robots correct (see `SPEC_08_PRODUCTION_SPOTCHECK.md` §2) |
| 7 | Local fallback + regression checks (2 non-SEO species, problem, article, home, `/search`) | **PASS** — fallback title behavior preserved; `/search` still noindex |
| 8 | Local sitemap/robots after on-demand revalidation | **PASS** — 553 URLs / 218 species / 0 dupes / 0 localhost / 0 query / single host; robots.txt correct |

## New tests (tests/species-seo-metadata.test.ts) — 5/5 PASS

Mocks `@/lib/sanity` (client + urlFor) and `@/lib/database` (getDatabaseItem), calls the page's exported `generateMetadata` directly (vitest `environment: node`, same convention as `tests/sitemap.test.ts`).

| Case | Assertion |
|---|---|
| 1 | seo present → `metadata.title = { absolute: seo.metaTitle }`, `description = seo.metaDescription`, og + twitter title/description match seo, canonical = apex species URL, `robots` undefined (inherits index, follow) |
| 1b | rendered title length within frozen 38–65 bound, equals metaTitle exactly |
| 2 | seo absent → title = `${name} — Fish Profile`, description = excerpt (documented fallback), og falls back too |
| 2b | seo present but empty/whitespace → falls back safely (guards work) |
| 3 | unknown slug → `{ title: "Not found" }` |

## Sanity safety

- SPEC 08 performed **read-only** Sanity operations only (public CDN client, no token): verification queries of species `seo` fields, sitemap query, category counts.
- No create/update/delete. No content mutations. `SANITY_API_TOKEN` never printed (checked against `/SANITY_API_TOKEN="([^"]+)"/`).
- Git: only 2 tracked files modified (`git status --porcelain` = `M app/species/[slug]/page.tsx`, `M lib/database.ts`) + untracked new test file. No commit/push performed.
