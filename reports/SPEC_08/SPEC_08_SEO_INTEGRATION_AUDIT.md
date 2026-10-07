# SPEC 08 — SEO Integration & Indexability Audit

**Date:** 2026-10-05
**Scope:** Verify the 117 SPEC 07G species SEO records (`seo.metaTitle` / `seo.metaDescription`, written 2026-10-05, 234/234 APPLIED, byte-identical to frozen plan) are consumed by the Next.js website and exposed to search engines: Sanity → GROQ → `generateMetadata` → `<title>` / description / canonical / robots / sitemap / OG / Twitter.
**Sanity:** read-only throughout. No create/update/delete. No slug/title/description changes. No dependency upgrades. No broad refactors.

## Verdict

**PASS WITH FIXES — SEO INTEGRATION VERIFIED AFTER CODE FIXES**

The integration chain was broken in two places (defect below). Both were fixed with minimal code changes (3 files: 2 modified, 1 new test), verified against a local production build rendering, and are covered by regression tests. Live production does not yet serve the fix because the change has not been deployed (see remaining issues).

## Phase A — Repository discovery

- Next.js 15.5.22 App Router (`app/`, no `src/`), React 19, TypeScript 5.9, vitest.
- `package.json` scripts: `lint` (eslint), `build` (next build), `test` (vitest run).
- Sanity access layer: `lib/sanity.ts` (public CDN client, `useCdn: true`, apiVersion `2023-05-03`, no token), `lib/sanity-server.ts` (token client, `useCdn: false`).
- SEO surface: `app/layout.tsx` (root metadata: `metadataBase`, title template `"%s | AquaMind Blog"`, `robots: { index: true, follow: true }`), `app/sitemap.ts`, `app/robots.ts`, `lib/seo/jsonld.tsx`, per-page `generateMetadata`.
- Schema: `sanity/schemaTypes/species.ts` lines 186–187 define `seo.metaTitle` (38–65 chars) and `seo.metaDescription` (142–160 chars). Also present on `post` schema (out of scope — see remaining issues).
- `.env.local`: `NEXT_PUBLIC_SITE_URL="https://aquamind.life"`.

## Phase B — Data flow audit (Sanity → GROQ → page) — DEFECT FOUND

The chain was broken at two points:

1. **`lib/database.ts` — `getDatabaseItem` GROQ projection did not include `seo` at all.** The query returned name/excerpt/care fields only, so `seo` could never reach the page component even if requested.
2. **`app/species/[slug]/page.tsx` — `generateMetadata` never read `seo.*`.** It rendered `` `${item.name} — Fish Profile` `` as title and `item.excerpt` as description.

Repo-wide grep confirmed **no page consumed `seo.*`** anywhere: only the Sanity schema definition and `lib/seo/jsonld` imports existed. The SPEC 07G values were stored correctly in Sanity but invisible to the website.

**Input-side (read-only) verification:** GROQ fetch of the production dataset confirmed 218 species, 117 with `seo` objects, **all 117 byte-identical to `report/SPEC_07F/DRY_RUN_OPERATION_PLAN.csv` frozen values**, metaTitle lengths 39–65, metaDescription lengths 142–160. The defect is purely on the website consumption side.

## Phase C — Metadata audit

| Element | State before fix | State after fix |
|---|---|---|
| `<title>` (species w/ seo) | `Name — Fish Profile \| AquaMind Blog` (fallback) | exact frozen `seo.metaTitle` (rendered as absolute title, no template suffix) |
| `meta description` (species w/ seo) | `item.excerpt` | exact frozen `seo.metaDescription` |
| `og:title` / `og:description` | fallback values | frozen `seo` values |
| `twitter:title` / `twitter:description` | fallback values | frozen `seo` values |
| canonical | `https://aquamind.life/species/<slug>` (unchanged) | unchanged |
| robots meta | `index, follow` from root layout (unchanged) | unchanged |
| title template (fallback pages) | `%s \| AquaMind Blog` | unchanged for species without `seo` and all other pages |
| sitemap / robots.txt | structurally valid (Phase F/G) | unchanged |
| noindex pages | only `/search` (`index: false`) and `/category/[slug]` when 0 posts (correct) | unchanged |

**Design decision — absolute title:** frozen metaTitles are complete, length-constrained (38–65 char) SERP titles. Rendering them with the layout template would append ` | AquaMind Blog` (+17 chars → up to 82 chars) and cause search engines to truncate the crafted tail. Therefore `metadata.title` is returned as `{ absolute: seo.metaTitle }` when `seo.metaTitle` is present, preserving the value byte-for-byte; the template continues to apply to the fallback title.

**Explicit, safe fallback:** if `seo` is absent or `metaTitle`/`metaDescription` are empty/whitespace-only, the previous behavior is used (`${name} — Fish Profile` + `excerpt || "Care guide for ${name}"`). Verified by tests Case 2 / Case 2b.

## Phases D & L — Production spot check

Pre-fix live state (raw HTML from `https://www.aquamind.life`, re-confirmed 2026-10-05 after the local fix): all 6 selected species serve fallback metadata (`seo-title-match=false`, `html-has-seo-title=false` on every page), canonical = apex, robots = `index, follow`, `X-Robots-Tag` = absent, sitemap = 553 URLs / 218 species / 0 dupes / 0 localhost / 0 query / single host. Full evidence: `SPEC_08_PRODUCTION_SPOTCHECK.md`. Production has **not been deployed with the fix** (no commit/push per session rules).

## Phase H — Indexability sweep

- No `middleware.ts`; `next.config.js` sets no custom headers (no `X-Robots-Tag`) — not required: meta robots is present and correct.
- Root layout: `robots: { index: true, follow: true }`.
- noindex correctly limited to `/search` (excluded from sitemap ✓) and empty categories.
- `app/robots.ts`: `Allow: /`, `Disallow: /studio`, `Sitemap: https://aquamind.life/sitemap.xml`.
- Species pages carry no `robots` override → inherit index, follow ✓.

## Phase I — SPEC 07G value compatibility

- Rendered `<title>` = frozen metaTitle **exactly** on all 6 sampled pages: lengths 42, 47, 64, 62, 63, 65 (within 38–65, no truncation, no template suffix, no duplicate).
- Rendered description = frozen metaDescription **exactly**: lengths 153, 142, 148, 142, 160, 155 (within 142–160, no escaping issues — `–`, `°C`, `&` preserved).
- No character stripping, no replacement with unrelated fields, no duplicate metadata.

## Files changed

| File | Change |
|---|---|
| `lib/database.ts` | +1 line: added `seo { metaTitle, metaDescription }` to `getDatabaseItem` GROQ projection |
| `app/species/[slug]/page.tsx` | `generateMetadata`: prefers `seo.metaTitle`/`seo.metaDescription` (absolute title), OG + Twitter aligned, explicit non-empty guards, documented fallback unchanged |
| `tests/species-seo-metadata.test.ts` | new: 5 regression tests (Case 1/1b/2/2b + not-found) |

No other files modified. Git status: exactly 2 tracked files modified + 1 new test file.

## Remaining issues

1. **Fix not deployed** — live production still serves fallback metadata until the code is committed/deployed; post-deploy live re-check required (6 URLs listed in `SPEC_08_PRODUCTION_SPOTCHECK.md`).
2. **Canonical host mismatch (site-wide, pre-existing)** — all code emits `https://aquamind.life` (apex): `metadataBase`, canonicals, sitemap, robots, og:url, JSON-LD (57 occurrences across 41 files), but hosting permanently redirects apex → `https://www.aquamind.life` (HTTP 308 on `/`, `/robots.txt`, `/sitemap.xml`, `/species/*`). Signals are internally consistent (all apex, absolute, no localhost/query) but the declared canonical host is not the actually-served host. Site-wide decision (align code to www vs flip hosting redirect) deferred — beyond SPEC 08 minimal-fix remit.
3. **Post `seo` fields unused** — `post` schema has `seo`, but `/posts/[slug]` metadata is out of SPEC 08 scope (rewriting existing article metadata explicitly not allowed).
4. **Build-time sitemap flake observed once** — first local build prerendered `sitemap.xml` with 12 missing URLs (stale/partial CDN response during build; species were complete). On-demand revalidation produced the correct 553 URLs identical to production. Re-check sitemap URL count after deploy.
5. **Known baseline test failure** — `tests/compare.test.ts` ("covers all four database types") fails before and after this SPEC; unrelated to SEO.
