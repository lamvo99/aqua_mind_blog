# AQUAMIND - GSC INDEXING REMEDIATION (2026-11-22)

**Status:** **PARTIAL - GSC URL-level confirmation blocked**
**Worktree:** `tmp/core-impl-worktree`
**HEAD:** `90770231aa548f62ceb458add6a019930aa6c595` (= `origin/main`)
**Production:** `https://www.aquamind.life` (not deployed from this worktree)

Repository-level indexing defects were identified and fixed locally. The final status is PARTIAL because the six GSC workbooks supplied aggregate counts only: the 374 Discovered, 21 Crawled-not-indexed, 143 Redirect, 2 Soft 404, 5 Noindex, 4 Duplicate, and 2 Alternate URL lists were not available. No URL is presented as GSC-confirmed unless it is a live crawl fact.

---

## 1. Preflight and safety

| Item | Before | After |
|---|---|---|
| Worktree | `F:\AquaMind\aqua_mind_blog\tmp\core-impl-worktree` | same |
| HEAD | `9077023` | `9077023` (no commit) |
| Branch | detached HEAD | detached HEAD |
| Dirty state | 68 entries (Phase 3 + Problem Editorial Triage, uncommitted) | 96 entries (all previous work preserved + GSC changes and reports) |
| Root checkout | `48148ac`, pre-existing dirty state | not modified |
| Sanity | read-only | read-only |
| Deploy/commit/push | none | none |

All Phase 3 and Problem Editorial Triage files were preserved. No file was reset, stashed, cleaned, or reformatted.

---

## 2. Live production baseline

Fetched on 2026-11-22 from `https://www.aquamind.life`:

- `robots.txt`: HTTP 200, allows `/`, disallows `/studio`, sitemap directive correct.
- `sitemap.xml`: HTTP 200, **588 URLs**, no duplicates, no query URLs.
- All **588 sitemap URLs**: HTTP 200, self-canonical, no noindex/X-Robots-Tag noindex.
- Sitemap redirects: **0**.
- Sitemap non-self-canonical: **0**.
- Sitemap noindex: **0**.
- Internal crawl: **609** targets (sitemap + route probes + internal links), **607 HTTP 200 / 2 expected 404**; the home URL was deduplicated after trailing-slash normalization.
- Indexable public page missing from sitemap: **`https://www.aquamind.life/styles`**.
- Soft-404 pattern candidates on production: **13** - 12 unknown dynamic slugs plus `/posts/Slug%20neocaridina-shrimp-reproduction-cycle`.
- Filtered listing probes: correct `noindex, follow` and canonical to the clean base.
- `/search?q=...`: `noindex`, canonical to `/search`.
- Internal links to redirecting URLs: **0**.

Production inventory:
- `report/gsc-2026-11-22/baseline-production/url-inventory.csv`
- `report/gsc-2026-11-22/baseline-production/url-inventory.json`
- `report/gsc-2026-11-22/baseline-production/crawl-summary.json`
- `report/gsc-2026-11-22/baseline-production/internal-link-issues.csv`
- `report/gsc-2026-11-22/baseline-production/sitemap.xml`
- `report/gsc-2026-11-22/baseline-production/robots.txt`

---

## 3. Root causes and fixes

### 3.1 Soft 404: unknown dynamic routes returned HTTP 200

**Evidence:** `/species/__missing__`, `/posts/__missing__`, `/category/__missing__`, `/collections/__missing__`, `/learn/__missing__`, `/styles/__missing__`, `/inspiration/__missing__`, `/problems/__missing__`, `/equipment/__missing__`, `/plants/__missing__`, `/corals/__missing__`, `/invertebrates/__missing__` all returned **HTTP 200** with a "Not found" document. Only `/hubs/[slug]` returned 404 because it already had `dynamicParams = false`.

**Fix:** added `export const dynamicParams = false` to the 12 dynamic route families that use `generateStaticParams`:

- `app/species/[slug]/page.tsx`
- `app/plants/[slug]/page.tsx`
- `app/corals/[slug]/page.tsx`
- `app/invertebrates/[slug]/page.tsx`
- `app/equipment/[slug]/page.tsx`
- `app/problems/[slug]/page.tsx`
- `app/posts/[slug]/page.tsx`
- `app/category/[slug]/page.tsx`
- `app/inspiration/[slug]/page.tsx`
- `app/collections/[slug]/page.tsx`
- `app/learn/[slug]/page.tsx`
- `app/styles/[slug]/page.tsx`

**Verified locally:** all **15** unknown/missing probes now return **404**; valid detail URLs still return 200.

Trade-off: newly published CMS detail slugs require a rebuild/redeploy before they resolve. This is the deliberate price of preventing soft-404 index bloat. Existing sitemap and publish workflow already revalidate/redeploy.

### 3.2 Invalid legacy post slug created an internal soft-404 link

**Evidence:** production `/posts` and the internal crawl linked to `/posts/Slug%20neocaridina-shrimp-reproduction-cycle`; the URL returned 200 with "Article not found". The sitemap already excluded it, but public listings did not.

**Fix:**
- `lib/posts.ts` now filters post lists, featured posts, category posts, related posts, and post-detail related references through `isValidSlugValue`.
- `getPostBySlug` returns `null` for an invalid slug before querying, so the route returns 404.
- `app/posts/[slug]/page.tsx` now has `dynamicParams = false`.

**Verified locally:** the invalid slug returns **404**, and `/posts` no longer contains the invalid link.

### 3.3 `/styles` index missing from sitemap

**Evidence:** `/styles` is HTTP 200, `index, follow`, self-canonical, has a unique H1 and eight child style guides, and is linked from `/inspiration`. It was not in the sitemap.

**Fix:** added `/styles` to `LIST_PATHS` in `app/sitemap.ts`.

**Verified locally:** sitemap **588 -> 589**, with `/styles` present.

### 3.4 Unpublished posts could enter sitemap

**Evidence:** the sitemap query included every post with a slug, relying only on the published perspective. Detail pages require `publishedAt`.

**Fix:** sitemap query now filters `(_type != "post" || defined(publishedAt))`, plus a JS guard for the test/mocked path.

### 3.5 Tool and Wiki pages bailed out to client-only rendering

**Evidence:** production and local `/tools/aquarium-calculator` and `/wiki` returned server HTML containing `BAILOUT_TO_CLIENT_SIDE_RENDERING` and **no H1**. The cause is `useSearchParams` in `AquariumPlanner` and `WikiHub` without a Suspense boundary.

**Fix:** wrapped each interactive component in `Suspense`:
- `app/tools/aquarium-calculator/page.tsx`
- `app/wiki/page.tsx`

**Verified locally:** both routes now render the server H1 (`Aquarium Calculator`, `Aquarium Wiki`) plus page copy and related links. The interactive subtree still streams after hydration, which is expected.

---

## 4. GSC category disposition

| GSC reason | GSC pages | What was possible | Result |
|---|---:|---|---|
| Discovered - currently not indexed | 374 | Sitemap/route/internal-link crawl; all 588 sitemap URLs 200/self-canonical; all non-home sitemap pages had at least one inbound link; `/styles` missing was added; no sitemap query URLs | **Blocked on exact URL export.** No orphan route family found. Remaining causes may be crawl budget/content value, not a confirmed technical defect. |
| Crawled - currently not indexed | 21 | Checked title/H1/HTML size; found Wiki and Calculator server-shell defects and fixed them; no empty-title or sub-20KB sitemap page | **Blocked on exact URL export.** Two route families fixed; no URL-level confirmation. |
| Page with redirect | 143 | No redirecting URL in sitemap; 0 internal redirect links; expected 308s for HTTP->HTTPS, apex->www, trailing slash->non-slash; one intentional `/tools/setup-planner` -> `/setup-planner` | **Blocked on exact URL export.** Preserved intentional redirects; no sitemap/internal-link repair needed from available evidence. |
| Soft 404 | 2 | Found 13 reproducible soft-404 patterns and fixed them; invalid slug internal link removed; unknown probes now 404 | **Addressed at route-family level; exact GSC URLs blocked.** |
| Excluded by noindex | 5 | All sitemap URLs are indexable; `/search` and filtered listings are intentional noindex; no sitemap noindex URL | **No change to intentional policy; exact GSC URLs blocked.** |
| Duplicate / Google-selected canonical | 4 | All sitemap URLs are self-canonical; no duplicate sitemap URL; no non-self-canonical sitemap row | **Blocked on exact URL export.** No sitemap canonical defect found. |
| Alternate page with proper canonical | 2 | Treated as informational; no alternate URL list | **No action; correct by intent unless GSC URL proves otherwise.** |

---

## 5. Sitemap and canonical/robots verification

### Before (production)

| Check | Result |
|---|---|
| Sitemap URLs | 588 |
| HTTP 200 | 588/588 |
| Self-canonical | 588/588 |
| Noindex in sitemap | 0 |
| Query URLs | 0 |
| Duplicate URLs | 0 |
| Redirects in sitemap | 0 |
| Missing indexable page | `/styles` |
| Soft-404 candidate patterns | 13 |

### After (local production build)

| Check | Result |
|---|---|
| Sitemap URLs | **589** |
| HTTP 200 | **589/589** |
| Self-canonical | **589/589** |
| Noindex in sitemap | **0** |
| Query URLs | **0** |
| Duplicate URLs | **0** |
| Redirects in sitemap | **0** |
| `/styles` in sitemap | **yes** |
| Unknown dynamic probes returning 404 | **15/15** |
| Filtered listing policy | `noindex, follow` + canonical base |
| Search policy | `noindex`, canonical `/search` |
| `/wiki` and `/tools/aquarium-calculator` H1 | present |

Post-fix verification:
- `report/gsc-2026-11-22/postfix-local/verification.json`
- `report/gsc-2026-11-22/postfix-local/sitemap.xml`
- `report/gsc-2026-11-22/postfix-local/robots.txt`

Local verification base: `http://localhost:3106`; canonical values remain `https://www.aquamind.life`.

---

## 6. Redirects and internal links

- Sitemap redirects: **0** before and after.
- Internal links to trailing-slash URLs: **0**.
- Internal links to `/tools/setup-planner`: **0**.
- Redirects observed and intentionally preserved:
  - `http://aquamind.life/*` -> `https://www.aquamind.life/*` (308)
  - `https://aquamind.life/*` -> `https://www.aquamind.life/*` (308)
  - `http://www.aquamind.life/*` -> `https://www.aquamind.life/*` (308)
  - trailing slash -> non-slash canonical (308)
  - `/tools/setup-planner` -> `/setup-planner` (configured permanent redirect)

These account for plausible "Page with redirect" entries but cannot be matched to the 143 GSC URLs without the URL export. Do not remove valid canonical redirects merely to change a GSC count.

---

## 7. Files changed

| File | Change |
|---|---|
| `app/sitemap.ts` | Added `/styles`; excluded unpublished posts |
| `app/wiki/page.tsx` | Suspense around `WikiHub`; server H1 shell restored |
| `app/tools/aquarium-calculator/page.tsx` | Suspense around `AquariumPlanner`; server H1 shell restored |
| `app/species/[slug]/page.tsx` | `dynamicParams = false` |
| `app/plants/[slug]/page.tsx` | `dynamicParams = false` |
| `app/corals/[slug]/page.tsx` | `dynamicParams = false` |
| `app/invertebrates/[slug]/page.tsx` | `dynamicParams = false` |
| `app/equipment/[slug]/page.tsx` | `dynamicParams = false` |
| `app/problems/[slug]/page.tsx` | `dynamicParams = false` |
| `app/posts/[slug]/page.tsx` | `dynamicParams = false` |
| `app/category/[slug]/page.tsx` | `dynamicParams = false` |
| `app/inspiration/[slug]/page.tsx` | `dynamicParams = false` |
| `app/collections/[slug]/page.tsx` | `dynamicParams = false` |
| `app/learn/[slug]/page.tsx` | `dynamicParams = false` |
| `app/styles/[slug]/page.tsx` | `dynamicParams = false` |
| `lib/posts.ts` | Valid-slug filters for all public post lists and related posts |
| `tests/sitemap.test.ts` | `/styles`, unpublished post exclusion |
| `tests/gsc-indexing.test.ts` | New source-level policy guards |
| `tests/post-slug-integrity.test.ts` | New invalid-slug regression tests |
| `scripts/gsc/audit-indexing.mjs` | New deterministic read-only crawl/inventory tool |
| `report/GSC_INDEXING_REMEDIATION_2026-11-22.md` | This report |
| `report/AQUA_BLOG_CURRENT_STATE.md` | Phase 45 summary |

No Sanity schema/content, article copy, images, or public route names were changed.

---

## 8. Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit --incremental false` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0 |
| `npm test -- --maxWorkers=2` | **613 tests / 608 pass**, 55 files |
| Phase 3 baseline | 603 / 598, 53 files |
| Delta | **+10 tests, +10 pass** |
| New focused tests | `sitemap`, `gsc-indexing`, `post-slug-integrity`, `listing-seo`, `canonical-host` pass |
| Sitemap crawl | 589/589 HTTP 200, self-canonical, no noindex, no query, no duplicate |
| Unknown probes | 15/15 HTTP 404 |
| Production inventory | 588 sitemap URLs all correct |
| Internal-link issues | 0 |
| Accessibility of changed UI | No visual redesign; Suspense shells preserve existing markup. No new axe run was required for the server-shell change. |

Baseline-known failures remain unchanged:
- `tests/compare.test.ts`
- `tests/compatibility.test.ts`
- `tests/phase9-ux.test.ts` (2 assertions)
- `tests/spec10n-integration.test.ts`
- `tests/search.test.ts` suite-level error

No new failure was introduced.

---

## 9. Remaining GSC blocker and required exports

To complete URL-level remediation, export the affected URL tables from Search Console -> Indexing -> Pages for each reason:

1. Discovered - currently not indexed
2. Crawled - currently not indexed
3. Page with redirect
4. Soft 404
5. Excluded by noindex
6. Duplicate, Google chose different canonical
7. Alternate page with proper canonical

Required fields: URL, last crawl date, coverage state, canonical Google selected (if shown), referring sitemap, and any example outbound links.

Until those lists are available:
- The 374/21/143/2/5/4/2 groups remain **GSC-confirmed counts only**, not confirmed URL sets.
- No URL is claimed to belong to a GSC group without a live crawl or a supplied URL.
- The fixes above are verified locally and are not live until deployment.

---

## 10. Performance observation (secondary)

The Performance export reported 38 clicks / 9,709 impressions / 0.39% CTR for 2026-08-20 to 2026-11-19. The filter-types page had 5,070 impressions, 0.02% CTR, average position 7.57. This is a snippet/title-content opportunity, not an indexing fix. No content was rewritten.

---

## 11. Safety confirmation

- No Sanity writes, schema changes, imports, migrations, or content edits.
- No article copy or image changes.
- No commit, push, merge, PR, or deployment.
- No Vercel deployment; production still runs the previous build.
- Root checkout not edited.
- Phase 3 and Problem Editorial Triage uncommitted work preserved.

**Overall status: PARTIAL - repository-level defects fixed and tested; GSC URL-level confirmation remains blocked on the missing exports.**
