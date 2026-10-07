# SPEC 08.1 — Test Results

**Date:** 2026-10-06

## Verdict

**PASS WITH FIXES — CANONICAL HOST ALIGNED AFTER CODE FIXES**

## §16 — Tests summary

```text
lint:               PASS (npm run lint → exit 0, no errors)
typescript:         PASS (npx tsc --noEmit → exit 0)
focused SEO tests:  PASS (tests/canonical-host.test.ts + tests/sitemap.test.ts + tests/species-seo-metadata.test.ts → 16/16)
full tests:         264/265 PASS — 1 failure = known baseline tests/compare.test.ts (reported below, untouched)
build:              PASS (npm run build → exit 0, 575 static pages, 218 species SSG)
local production:   PASS (§12 verification — ALL PASS = true, see below)
```

## §9 — Required test suite (tests/canonical-host.test.ts — 6/6 PASS)

| Test | Requirement | Assertion result |
|---|---|---|
| Test 1 — Site URL | `site URL = https://www.aquamind.life` | env/default contract = www; sitemap home entry = `https://www.aquamind.life`; `Organization.url` / `WebSite.url` = www ✓ |
| Test 2 — Species canonical | `https://www.aquamind.life/species/<slug>` | www canonical with seo present AND with seo absent; no apex substring ✓ |
| Test 3 — OG URL | `https://www.aquamind.life/species/<slug>` | `openGraph.url` = www; no apex ✓ |
| Test 4 — Sitemap | all generated URLs use www | every URL = www (with/without docs mocked), contains dynamic species/post/category/learn www URLs, 0 apex, 0 localhost, 0 query, no duplicates ✓ |
| Test 5 — Robots | `Sitemap: https://www.aquamind.life/sitemap.xml` | exact directive; rules unchanged ✓ |
| Test 6 — JSON-LD | canonical site URLs use www | `Organization`, `WebSite` + SearchAction, `BreadcrumbList` items, `BlogPosting.mainEntityOfPage/@id` + publisher logo, `HowTo.url`, `CollectionPage`/`ItemList` — all www ✓ |

Existing updated tests: `tests/sitemap.test.ts` (8 expectations → www), `tests/species-seo-metadata.test.ts` (canonical/og:url → www, all 5 SPEC 08 cases still pass).

## §10 — Regression requirements (all verified on local production build)

| Requirement | Expected | Result |
|---|---|---|
| Species WITH seo: title | exact frozen `seo.metaTitle`, no ` \| AquaMind Blog` suffix | **6/6 byte-identical** (42, 47, 64, 62, 63, 65 chars) ✓ |
| Species WITH seo: description | exact frozen `seo.metaDescription` | **6/6 byte-identical** (153, 142, 148, 142, 160, 155 chars) ✓ |
| Species WITHOUT seo | `<Name> — Fish Profile \| AquaMind Blog` + excerpt | 2/2 fallback pages unchanged ✓ |
| Species robots | `index, follow` | 6/6 ✓ |
| Search | `/search` = `noindex` | ✓ |
| Sitemap species count | 218 | 218 ✓ |
| Sitemap duplicates / localhost | 0 / 0 | 0 / 0 ✓ |
| Sitemap apex URLs | 0 | 0 ✓ |
| Non-species pages | behavior unchanged, host = www | problem/article/wiki/feed/llms 0 apex, titles unchanged ✓ |

## §11 — Validation commands

| # | Command | Result |
|---|---|---|
| 1 | `npm run lint` | PASS (exit 0) |
| 2 | `npx tsc --noEmit` | PASS (exit 0) |
| 3 | `npx vitest run tests/canonical-host.test.ts tests/sitemap.test.ts tests/species-seo-metadata.test.ts` | PASS — 16/16 |
| 4 | `npm test` | 265 tests: **264 passed, 1 failed** |
| 5 | `npm run build` | PASS (exit 0; 6 pre-existing react-hooks warnings in `AquariumPlanner.tsx`, unrelated) |

### Known unrelated baseline failure (reported separately, NOT modified)

```text
tests/compare.test.ts > compare config > covers all four database types
AssertionError: expects exactly 4 database types; config includes 5 (adds 'invertebrate')
```

Pre-existing before SPEC 08/08.1, unrelated to SEO. Per §11 it was not modified.

## §12 — Local production verification (build → `next start` → raw HTML)

Artifact: `spec081_local_verify.json` — **ALL PASS = true**.

| Check | Result |
|---|---|
| `/` | 200, canonical = `https://www.aquamind.life`, og:url = www, robots = `index, follow`, **0 apex URLs in HTML** (incl. JSON-LD) ✓ |
| `/robots.txt` | `Sitemap: https://www.aquamind.life/sitemap.xml`, 0 apex ✓ |
| `/sitemap.xml` | 553 URLs, 553 www, 218 species, 0 apex, 0 localhost, 0 query, 0 duplicates, host = `www.aquamind.life` ✓ |
| 6 SPEC 07G species | all: status 200, canonical/og:url = www, robots index/follow, title+description+og+twitter byte-identical to frozen values ✓ |
| 2 fallback species | `Alligator Gar — Fish Profile \| AquaMind Blog`, `Angelfish — Fish Profile \| AquaMind Blog`, www canonical ✓ |
| `/search` | `noindex` ✓ |
| `/problems/fin-rot`, article page | titles unchanged (template behavior), www canonical, 0 apex ✓ |
| `/feed.xml` | 200, 42 www links, 0 apex ✓ |
| `/llms.txt` | 200, 0 apex ✓ |
| `/wiki` | canonical = `https://www.aquamind.life/wiki`, 0 apex ✓ |

## Scope safety

```text
Sanity writes: 0
content mutations: 0
SEO data mutations (SPEC 07G values): 0
slug changes: 0
dependency upgrades: 0
unrelated refactors: 0
git commit / push: 0  (stopped per §18 — READY FOR PM DEPLOY APPROVAL)
```
