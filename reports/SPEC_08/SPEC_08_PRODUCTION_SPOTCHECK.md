# SPEC 08 — Production Spot Check

**Date:** 2026-10-05 (live checks re-confirmed after the local fix)
**Method:** raw HTML fetch (no DOM assumptions), `redirect: 'manual'` for redirect evidence.
**Selected pages (6):** chosen for coverage — most common species, less common, alphabetical first/last, longest description (160), longest title (65). All 6 are present in the sitemap.

## 1. Live production — BEFORE fix (still current, not deployed)

Host behavior: apex `https://aquamind.life` → **HTTP 308** → `https://www.aquamind.life` (verified for `/`, `/robots.txt`, `/sitemap.xml`, `/species/*`). All checks below fetched from the www host (the served host).

### 1.1 The 6 selected species (all pre-fix = fallback metadata)

| Page | `<title>` (len) | description (len) | seo-title-match | seo-desc-match | canonical | robots meta |
|---|---|---|---|---|---|---|
| `/species/paracheirodon-simulans` | `Green Neon Tetra — Fish Profile \| AquaMind Blog` (47) | excerpt (151) | **false** | **false** | `https://aquamind.life/species/paracheirodon-simulans` | index, follow |
| `/species/celestichthys-erythromicron` | `Emerald Dwarf Rasbora — Fish Profile \| AquaMind Blog` (52) | excerpt (142) | **false** | **false** | apex canonical | index, follow |
| `/species/apistogramma-agassizii` | `Agassiz Dwarf Cichlid — Fish Profile \| AquaMind Blog` (52) | excerpt (177) | **false** | **false** | apex canonical | index, follow |
| `/species/danio-rerio` | `Zebrafish — Fish Profile \| AquaMind Blog` (40) | excerpt (104) | **false** | **false** | apex canonical | index, follow |
| `/species/aphyosemion-australe` | `Lyretail Killifish — Fish Profile \| AquaMind Blog` (49) | excerpt (87) | **false** | **false** | apex canonical | index, follow |
| `/species/corydoras-paleatus` | `Peppered Corydoras — Fish Profile \| AquaMind Blog` (49) | excerpt (104) | **false** | **false** | apex canonical | index, follow |

`html-has-seo-title=false` and `html-has-seo-desc=false` on **all 6** — the SPEC 07G values are absent from production HTML. og:url = apex, og:image present (Sanity CDN), `X-Robots-Tag` = absent, noindex = false.

**Conclusion: live production demonstrates the defect. The fix exists locally but has not been deployed.**

### 1.2 Non-species control pages (regression baseline, unchanged by SPEC 08)

| Page | `<title>` | description |
|---|---|---|
| `/` | `Aquascaping Blog & Beginner Aquarium Guides — AquaMind` (54) | site desc (148) |
| `/problems/fin-rot` | `Fin Rot — Aquarium Problem \| AquaMind Blog` (42) | problem desc (74) |
| `/posts/your-first-30-days-with-an-aquarium-a-beginner-s-journal` | `Your First 30 Days With an Aquarium: A Beginner's Journal \| AquaMind Blog` (73) | article desc (157) |

### 1.3 Indexability

- `robots.txt` (www): `User-Agent: * / Allow: / / Disallow: /studio` + `Sitemap: https://aquamind.life/sitemap.xml`.
- `sitemap.xml`: **553 URLs, 218 species, 0 duplicates, 0 localhost/127.0.0.1, 0 query strings, single host `aquamind.life`**; all 6 selected species present.
- All sampled pages: `robots meta = index, follow`, `noindex = false`, `X-Robots-Tag = null`.
- No `middleware.ts`; no custom response headers in `next.config.js`.

## 2. Local production build — AFTER fix (`npm run build` → `next start`, port 3000)

Verification artifact: `C:\Users\lam72\AppData\Local\Temp\opencode\spec08_local_verify.json` (checkedAt `2026-10-05T15:48:14.005Z`).

| Page | status | `<title>` == frozen metaTitle | description == frozen metaDescription | og title+desc match | twitter title+desc match | canonical | robots |
|---|---|---|---|---|---|---|---|
| `/species/paracheirodon-simulans` | 200 | **true** (42) | **true** (153) | **true** | **true** | apex ✓ | index, follow |
| `/species/celestichthys-erythromicron` | 200 | **true** (47) | **true** (142) | **true** | **true** | apex ✓ | index, follow |
| `/species/apistogramma-agassizii` | 200 | **true** (64) | **true** (148) | **true** | **true** | apex ✓ | index, follow |
| `/species/danio-rerio` | 200 | **true** (62) | **true** (142) | **true** | **true** | apex ✓ | index, follow |
| `/species/aphyosemion-australe` | 200 | **true** (63) | **true** (160) | **true** | **true** | apex ✓ | index, follow |
| `/species/corydoras-paleatus` | 200 | **true** (65) | **true** (155) | **true** | **true** | apex ✓ | index, follow |

Summary: `allStatus200=allTitleMatch=allDescMatch=allOgMatch=allTwitterMatch=allCanonicalMatch=allIndexable = true`.
Byte-identical to SPEC 07G frozen values (`report/SPEC_07F/DRY_RUN_OPERATION_PLAN.csv` via `spec08_selection.json`), no template suffix, lengths within 38–65 / 142–160.

### 2.1 Fallback pages (species WITHOUT `seo`) — behavior preserved

| Page | `<title>` | description |
|---|---|---|
| `/species/atractosteus-spatula` | `Alligator Gar — Fish Profile \| AquaMind Blog` (44) | excerpt ✓ |
| `/species/pterophyllum-scalare` | `Angelfish — Fish Profile \| AquaMind Blog` (40) | excerpt ✓ |

### 2.2 Regression (non-species routes, local build)

- `/problems/fin-rot` → `Fin Rot — Aquarium Problem | AquaMind Blog` ✓ (identical to live)
- `/posts/your-first-30-days...` → article title with template ✓
- `/` → site title ✓
- `/search` → `robots meta = noindex` ✓ (correctly still excluded from sitemap)

### 2.3 Sitemap / robots (local, post-revalidation)

- `sitemap.xml`: **553 URLs, 218 species, 0 dupes, 0 localhost, 0 query, host = `aquamind.life`** — identical URL set to production.
  - Note: the *first* build prerendered 541 URLs (12 non-species URLs missing due to a build-time CDN staleness flake); on-demand revalidation (`POST /api/revalidate`) produced the correct 553. Species count was 218 in both. Not caused by the SPEC 08 code change (sitemap query untouched).
- `robots.txt`: `User-Agent: * / Allow: / / Disallow: /studio` + sitemap line ✓.

## 3. Post-deploy re-check checklist (pending)

After the fix is deployed, re-run raw-HTML checks against these URLs and record title/description matching the frozen values:

1. `https://www.aquamind.life/species/paracheirodon-simulans`
2. `https://www.aquamind.life/species/celestichthys-erythromicron`
3. `https://www.aquamind.life/species/apistogramma-agassizii`
4. `https://www.aquamind.life/species/danio-rerio`
5. `https://www.aquamind.life/species/aphyosemion-australe`
6. `https://www.aquamind.life/species/corydoras-paleatus`

Expected: `<title>` = frozen metaTitle (no ` | AquaMind Blog` suffix), description = frozen metaDescription, og/twitter aligned, canonical = apex URL, robots = `index, follow`.
Also re-check: sitemap URL count = 553 (or current total) and one non-SEO species keeps the fallback title.
